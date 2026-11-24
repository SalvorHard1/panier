// État de l'application : stocké sur l'appareil (localStorage) et, si configuré,
// synchronisé en temps réel avec le foyer via Firebase Realtime Database (API REST, sans SDK).

const LS_DATA = 'courses.data.v1';
const LS_SETTINGS = 'courses.settings.v1';
const LS_QUEUE = 'courses.queue.v1';

const EMPTY = () => ({ items: {}, fridge: {}, saved: {}, overrides: {}, history: {} });

const DEFAULT_SETTINGS = {
  store: 'lidl',
  persons: 2,
  syncUrl: '',
  household: '',
  member: '',
  apiKey: '',
  model: 'claude-opus-5-5',
};

function load(key, fallback) {
  try {
    const v = JSON.parse(localStorage.getItem(key));
    return v ?? fallback;
  } catch {
    return fallback;
  }
}

let data = { ...EMPTY(), ...load(LS_DATA, {}) };
let settings = { ...DEFAULT_SETTINGS, ...load(LS_SETTINGS, {}) };
let queue = load(LS_QUEUE, []);
const listeners = new Set();
let source = null;
let syncStatus = 'off'; // off | connecting | online | error

export const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

export function getData() { return data; }
export function getSettings() { return settings; }
export function getSyncStatus() { return syncStatus; }
export function subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); }

function emit() { for (const fn of listeners) fn(); }
function persist() { localStorage.setItem(LS_DATA, JSON.stringify(data)); }

function setIn(obj, path, value) {
  let o = obj;
  for (let i = 0; i < path.length - 1; i++) {
    if (typeof o[path[i]] !== 'object' || o[path[i]] === null) o[path[i]] = {};
    o = o[path[i]];
  }
  const last = path[path.length - 1];
  if (value === null || value === undefined) delete o[last];
  else o[last] = value;
}

// Écrit une valeur (null = suppression) localement puis vers le foyer.
export function write(path, value) {
  setIn(data, path, value === null ? null : structuredClone(value));
  persist();
  emit();
  pushRemote(path, value);
}

// Plusieurs écritures d'un coup.
export function writeMany(entries) {
  for (const [path, value] of entries) setIn(data, path, value === null ? null : structuredClone(value));
  persist();
  emit();
  for (const [path, value] of entries) pushRemote(path, value);
}

export function saveSettings(patch) {
  const before = { syncUrl: settings.syncUrl, household: settings.household };
  settings = { ...settings, ...patch };
  localStorage.setItem(LS_SETTINGS, JSON.stringify(settings));
  if (before.syncUrl !== settings.syncUrl || before.household !== settings.household) connect();
  emit();
}

export function replaceAll(newData) {
  data = { ...EMPTY(), ...newData };
  persist();
  emit();
  if (syncEnabled()) remoteRequest([], 'PUT', data);
}

/* ---------- Synchronisation foyer ---------- */

function syncEnabled() {
  return !!(settings.syncUrl && settings.household);
}

function baseUrl() {
  const u = settings.syncUrl.trim().replace(/\/+$/, '');
  const h = encodeURIComponent(settings.household.trim().toLowerCase().replace(/[.#$\[\]\/]/g, '-'));
  return `${u}/foyers/${h}`;
}

function remoteRequest(path, method, body) {
  const url = `${baseUrl()}${path.length ? '/' + path.map(encodeURIComponent).join('/') : ''}.json`;
  return fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: method === 'DELETE' ? undefined : JSON.stringify(body),
  }).then((r) => {
    if (!r.ok) throw new Error('HTTP ' + r.status);
    return r;
  });
}

function pushRemote(path, value) {
  if (!syncEnabled()) return;
  const op = { path, value: value ?? null };
  remoteRequest(path, value == null ? 'DELETE' : 'PUT', value).catch(() => {
    queue.push(op);
    localStorage.setItem(LS_QUEUE, JSON.stringify(queue));
  });
}

async function flushQueue() {
  if (!syncEnabled() || !queue.length) return;
  const pending = queue;
  queue = [];
  localStorage.setItem(LS_QUEUE, '[]');
  for (const op of pending) {
    try {
      await remoteRequest(op.path, op.value == null ? 'DELETE' : 'PUT', op.value);
    } catch {
      queue.push(op);
    }
  }
  localStorage.setItem(LS_QUEUE, JSON.stringify(queue));
}

function applyRemote(pathStr, value) {
  const path = pathStr.split('/').filter(Boolean);
  if (!path.length) {
    data = { ...EMPTY(), ...(value || {}) };
  } else {
    setIn(data, path, value);
  }
}

function setStatus(s) {
  syncStatus = s;
  emit();
}

export function connect() {
  if (source) { source.close(); source = null; }
  if (!syncEnabled()) { setStatus('off'); return; }
  setStatus('connecting');
  let first = true;
  try {
    source = new EventSource(`${baseUrl()}.json`);
  } catch {
    setStatus('error');
    return;
  }
  const handle = (kind) => (ev) => {
    const msg = JSON.parse(ev.data);
    if (first && kind === 'put' && msg.path === '/') {
      first = false;
      const remoteEmpty = !msg.data;
      const localHasData = Object.keys(data.items).length || Object.keys(data.fridge).length || Object.keys(data.saved).length;
      if (remoteEmpty && localHasData) {
        // Premier appareil du foyer : on envoie la liste locale.
        remoteRequest([], 'PUT', data).catch(() => {});
      } else {
        applyRemote('/', msg.data);
      }
      flushQueue();
    } else if (kind === 'put') {
      applyRemote(msg.path, msg.data);
    } else {
      const base = msg.path.split('/').filter(Boolean);
      for (const [k, v] of Object.entries(msg.data || {})) applyRemote([...base, k].join('/'), v);
    }
    persist();
    setStatus('online');
  };
  source.addEventListener('put', handle('put'));
  source.addEventListener('patch', handle('patch'));
  source.addEventListener('cancel', () => setStatus('error'));
  source.addEventListener('auth_revoked', () => setStatus('error'));
  source.onerror = () => { if (syncStatus !== 'online') setStatus('error'); };
}

window.addEventListener('online', flushQueue);
