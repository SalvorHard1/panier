import { icon } from './icons.js';
import {
  CATEGORIES, CAT, STORES, STORE, parseInput, categorize, overrideKey, budget, priceRange, formatQty, canon, findProduct,
} from './catalog.js';
import { RECIPES } from './recipes-data.js';
import * as store from './store.js';
import { suggestRecipes, estimatePrices, friendlyError } from './ai.js';

const $ = (sel, root = document) => root.querySelector(sel);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const euro = (n) => n.toLocaleString('fr-FR', { maximumFractionDigits: n < 10 ? 2 : 0 }) + ' €';

const TABS = {
  courses: { title: 'Courses', icon: 'cart' },
  frigo: { title: 'Mon frigo', icon: 'fridge' },
  recettes: { title: 'Recettes', icon: 'chef' },
  reglages: { title: 'Réglages', icon: 'settings' },
};

let tab = location.hash.slice(1) in TABS ? location.hash.slice(1) : 'courses';
let ui = { recipeMode: 'carnet', aiRecipes: [], aiBusy: false, priceBusy: false, aiPrice: null, wish: '', maxTime: '' };

/* ---------------- Utilitaires ---------------- */

let toastTimer;
function toast(msg, action) {
  const el = $('#toast');
  el.innerHTML = `<span>${esc(msg)}</span>${action ? `<button type="button">${esc(action.label)}</button>` : ''}`;
  if (action) el.querySelector('button').onclick = () => { action.run(); el.classList.remove('show'); };
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), action ? 5000 : 2600);
}

function openSheet(html, onMount) {
  const sheet = $('#sheet');
  sheet.innerHTML = `<div class="grab"></div>${html}`;
  sheet.hidden = false;
  $('#sheet-backdrop').hidden = false;
  document.body.style.overflow = 'hidden';
  sheet.scrollTop = 0;
  sheet.querySelectorAll('[data-close]').forEach((b) => (b.onclick = closeSheet));
  onMount?.(sheet);
}
function closeSheet() {
  $('#sheet').hidden = true;
  $('#sheet-backdrop').hidden = true;
  document.body.style.overflow = '';
}
$('#sheet-backdrop').onclick = closeSheet;
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeSheet(); });

function member() { return store.getSettings().member || ''; }

// Chaque membre du foyer a sa pastille de couleur, toujours la même.
const MEMBER_COLORS = ['#C4552D', '#5E7A3A', '#3E6F9A', '#9A5D84', '#B0801F', '#4F8A8B'];
function memberColor(name) {
  let h = 0;
  for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return MEMBER_COLORS[h % MEMBER_COLORS.length];
}

/* ---------------- Dictée vocale ---------------- */

const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
function attachMic(btn, input, onResult) {
  if (!SpeechRec) { btn.hidden = true; return; }
  let rec = null;
  btn.onclick = () => {
    if (rec) { rec.stop(); return; }
    rec = new SpeechRec();
    rec.lang = 'fr-FR';
    rec.interimResults = true;
    btn.classList.add('listening');
    rec.onresult = (e) => {
      const text = Array.from(e.results).map((r) => r[0].transcript).join(' ');
      input.value = text;
      if (e.results[e.results.length - 1].isFinal) onResult(text);
    };
    rec.onend = () => { btn.classList.remove('listening'); rec = null; };
    rec.onerror = () => toast('Micro indisponible');
    rec.start();
  };
}

/* ---------------- Liste de courses ---------------- */

function itemsArray() {
  return Object.entries(store.getData().items).map(([id, it]) => ({ id, ...it }));
}

export function addItems(text, source) {
  const parsed = parseInput(text);
  if (!parsed.length) return 0;
  const data = store.getData();
  const existing = itemsArray();
  const writes = [];
  for (const p of parsed) {
    const key = canon(p.name);
    const dup = existing.find((i) => canon(i.name) === key && !i.done);
    if (dup) {
      // Déjà dans la liste : on cumule la quantité si elle est précisée.
      if (p.qty && (!dup.unit || dup.unit === p.unit)) {
        writes.push([['items', dup.id], { ...withoutId(dup), qty: (dup.qty || 1) + p.qty, unit: p.unit || dup.unit }]);
      }
      continue;
    }
    const cat = categorize(p.name, data.overrides);
    const id = store.uid();
    writes.push([['items', id], { name: p.name, qty: p.qty, unit: p.unit, cat, done: false, at: Date.now(), by: member(), src: source || null }]);
    const h = data.history[overrideKey(p.name)];
    writes.push([['history', overrideKey(p.name)], { name: p.name, n: (h?.n || 0) + 1, last: Date.now() }]);
  }
  if (writes.length) store.writeMany(writes);
  return parsed.length;
}

function withoutId(it) {
  const { id, ...rest } = it;
  return rest;
}

function mountCourses(view) {
  const s = store.getSettings();
  view.innerHTML = `
    <div class="card budget-card" id="budget-card"></div>
    <div id="recent"></div>
    <div id="list"></div>
    <div class="dock">
      <form class="adder" id="add-form" autocomplete="off">
        <input type="text" id="add-input" placeholder="Courgettes, pâte à pizza…" aria-label="Ajouter des articles" enterkeyhint="done" />
        <button type="button" class="icon-btn" id="mic" title="Dicter" aria-label="Dicter">${icon('mic')}</button>
        <button type="submit" class="btn primary" aria-label="Ajouter">${icon('plus', 22)}</button>
      </form>
    </div>
  `;
  const input = $('#add-input');
  $('#add-form').onsubmit = (e) => {
    e.preventDefault();
    const n = addItems(input.value);
    if (n) { input.value = ''; toast(n > 1 ? `${n} articles ajoutés` : 'Article ajouté'); }
  };
  attachMic($('#mic'), input, (text) => {
    const n = addItems(text);
    if (n) { input.value = ''; toast(`${n} article${n > 1 ? 's' : ''} ajouté${n > 1 ? 's' : ''}`); }
  });
  updateCourses();
}

function updateCourses() {
  const s = store.getSettings();
  const data = store.getData();
  const items = itemsArray();
  const todo = items.filter((i) => !i.done);
  const done = items.filter((i) => i.done);

  // Budget
  const b = budget(todo, s.store);
  const total = Object.values(b.byCat).reduce((a, v) => a + v, 0) || 1;
  const progress = items.length ? Math.round((done.length / items.length) * 100) : 0;
  const fmt = (n) => String(n).replace('.', ',');
  const card = $('#budget-card');
  card.classList.toggle('celebrate', !!(items.length && !todo.length));
  card.innerHTML = `
    <div class="row" style="align-items:flex-start">
      <div class="grow">
        <div class="label">${todo.length ? `${todo.length} article${todo.length > 1 ? 's' : ''} à prendre, environ` : items.length ? 'Tout est dans le chariot' : 'Budget de la prochaine course'}</div>
        <div class="amount">${todo.length ? `${fmt(b.min)} – ${fmt(b.max)} €` : items.length ? 'Bien joué !' : '0 €'}</div>
      </div>
      <select id="store-select" aria-label="Magasin">
        ${STORES.map((st) => `<option value="${st.id}" ${st.id === s.store ? 'selected' : ''}>${esc(st.label)}</option>`).join('')}
      </select>
    </div>
    ${todo.length ? `<div class="bars" aria-hidden="true">${CATEGORIES.filter((c) => b.byCat[c.id]).map((c) => `<span title="${esc(c.label)}" style="flex:${b.byCat[c.id] / total};background:${c.color}"></span>`).join('')}</div>` : ''}
    ${items.length ? `<div class="cart-progress"><div class="track"><span style="width:${progress}%"></span></div><span>${done.length}/${items.length} dans le chariot</span></div>` : ''}
    <div class="row wrap" style="margin-top:12px">
      <span class="note grow">Selon les prix moyens de l'enseigne${b.unknown ? ` · ${b.unknown} estimé${b.unknown > 1 ? 's' : ''} au rayon` : ''}.</span>
      <button class="btn sm" id="ai-price" ${todo.length ? '' : 'disabled'}>${icon(ui.priceBusy ? 'refresh' : 'spark', 18, ui.priceBusy ? 'spin' : '')}${ui.priceBusy ? 'Recherche…' : 'Prix réels (web)'}</button>
    </div>
    ${ui.aiPrice ? `<div class="ai-result"><strong>Estimation web ${esc(ui.aiPrice.store)} : ${Math.round(ui.aiPrice.total_min)} – ${Math.round(ui.aiPrice.total_max)} €</strong><div class="note">${esc(ui.aiPrice.note || '')}</div></div>` : ''}
  `;
  $('#store-select').onchange = (e) => { ui.aiPrice = null; store.saveSettings({ store: e.target.value }); };
  $('#ai-price').onclick = runPriceEstimate;

  // Articles fréquents
  const inList = new Set(todo.map((i) => canon(i.name)));
  const recent = Object.values(data.history)
    .filter((h) => !inList.has(canon(h.name)))
    .sort((a, b) => b.n - a.n || b.last - a.last)
    .slice(0, 10);
  $('#recent').innerHTML = recent.length
    ? `<div class="aisle-head" style="color:var(--ink-2);margin-top:4px">Vos habitués</div><div class="chips">${recent.map((h) => `<button type="button" class="chip add" data-name="${esc(h.name)}">${icon('plus', 16)}${esc(h.name)}</button>`).join('')}</div>`
    : '';
  $('#recent').querySelectorAll('[data-name]').forEach((btn) => (btn.onclick = () => addItems(btn.dataset.name)));

  // Liste par rayon
  const list = $('#list');
  if (!items.length) {
    list.innerHTML = `<div class="empty"><div class="icon-box">${icon('basket', 30)}</div><p class="title">Le panier est vide</p><p class="small">Écris ou dicte en bas, en vrac : « courgettes, pâte à pizza, glaces ». L'appli range tout par rayon.</p></div>`;
    return;
  }
  const groups = CATEGORIES.map((c) => ({ c, items: todo.filter((i) => (i.cat || 'au') === c.id).sort((a, b) => a.at - b.at) })).filter((g) => g.items.length);
  const storeIdx = (STORE[s.store] || STORE.carrefour).idx;
  const itemHtml = (it) => {
    const r = priceRange(it);
    const price = `${euro(r.min * storeIdx)}–${euro(r.max * storeIdx)}`;
    const meta = [formatQty(it), price].filter(Boolean).join(' · ');
    const who = it.by ? `<span class="who" style="--who:${memberColor(it.by)}" title="Ajouté par ${esc(it.by)}">${esc(it.by.charAt(0).toUpperCase())}</span>` : '';
    return `
      <div class="item ${it.done ? 'done' : ''} ${ui.justChecked === it.id ? 'pop' : ''}" data-id="${it.id}" style="--aisle:${(CAT[it.cat] || CAT.au).color}">
        <button class="check" data-act="toggle" aria-label="${it.done ? 'Remettre' : 'Cocher'} ${esc(it.name)}"><span class="box">${icon('check', 16)}</span></button>
        <div class="grow"><div class="name">${esc(it.name)}</div><div class="meta">${esc(meta)}</div></div>
        ${who}
        <button class="icon-btn" data-act="cat" title="Changer de rayon" aria-label="Changer de rayon">${icon('tag', 18)}</button>
        <button class="icon-btn" data-act="del" title="Supprimer" aria-label="Supprimer">${icon('x', 18)}</button>
      </div>`;
  };
  list.innerHTML = groups.map((g) => `
      <div class="aisle-head" style="color:${g.c.color}">${esc(g.c.label)}<span class="count">${g.items.length}</span></div>
      <div class="card aisle">${g.items.map(itemHtml).join('')}</div>`).join('')
    + (done.length ? `
      <div class="aisle-head" style="color:var(--ok)">${icon('checkCircle', 16)}Dans le chariot<span class="count">${done.length}</span><span class="spacer"></span><button class="btn sm ghost" id="clear-done">${icon('trash', 16)}Retirer</button></div>
      <div class="card aisle">${done.sort((a, b) => (b.doneAt || 0) - (a.doneAt || 0)).map(itemHtml).join('')}</div>` : '');
  ui.justChecked = null;

  list.querySelectorAll('.item').forEach((row) => {
    const id = row.dataset.id;
    row.querySelectorAll('[data-act]').forEach((btn) => {
      btn.onclick = () => {
        const it = store.getData().items[id];
        if (!it) return;
        if (btn.dataset.act === 'toggle') {
          if (!it.done) ui.justChecked = id;
          const remaining = itemsArray().filter((i) => !i.done && i.id !== id).length;
          store.write(['items', id], { ...it, done: !it.done, doneAt: Date.now() });
          if (!it.done && remaining === 0) toast('Liste bouclée, direction la caisse');
        }
        if (btn.dataset.act === 'del') {
          store.write(['items', id], null);
          toast(`« ${it.name} » supprimé`, { label: 'Annuler', run: () => store.write(['items', id], it) });
        }
        if (btn.dataset.act === 'cat') pickCategory(id, it);
      };
    });
  });
  const clear = $('#clear-done');
  if (clear) clear.onclick = () => {
    const removed = done.map((i) => [['items', i.id], withoutId(i)]);
    store.writeMany(done.map((i) => [['items', i.id], null]));
    toast(`${done.length} article${done.length > 1 ? 's' : ''} retiré${done.length > 1 ? 's' : ''}`, { label: 'Annuler', run: () => store.writeMany(removed) });
  };
}

function pickCategory(id, it) {
  openSheet(`
    <div class="sheet-head"><h2>Rayon pour « ${esc(it.name)} »</h2><button class="icon-btn" data-close aria-label="Fermer">${icon('x')}</button></div>
    <p class="muted small" style="margin-top:0">Ce choix est retenu pour les prochaines fois.</p>
    ${CATEGORIES.map((c) => `<button class="cat-option ${c.id === it.cat ? 'current' : ''}" data-cat="${c.id}"><span class="swatch" style="background:${c.color}"></span>${esc(c.label)}${c.id === it.cat ? `<span class="spacer"></span>${icon('check', 18)}` : ''}</button>`).join('')}
  `, (sheet) => {
    sheet.querySelectorAll('[data-cat]').forEach((b) => (b.onclick = () => {
      store.writeMany([
        [['items', id], { ...it, cat: b.dataset.cat }],
        [['overrides', overrideKey(it.name)], b.dataset.cat],
      ]);
      closeSheet();
    }));
  });
}

async function runPriceEstimate() {
  const s = store.getSettings();
  if (!s.apiKey) {
    toast('Ajoute une clé API Claude dans les réglages', { label: 'Réglages', run: () => go('reglages') });
    return;
  }
  const todo = itemsArray().filter((i) => !i.done);
  ui.priceBusy = true;
  updateCourses();
  try {
    const res = await estimatePrices(s, {
      items: todo.map((i) => ({ name: i.name, qtyLabel: formatQty(i).replace('× ', '') })),
      storeLabel: STORE[s.store]?.label || 'un supermarché',
    });
    ui.aiPrice = { ...res, store: STORE[s.store]?.label };
  } catch (err) {
    toast(friendlyError(err));
  } finally {
    ui.priceBusy = false;
    if (tab === 'courses') updateCourses();
  }
}

/* ---------------- Frigo ---------------- */

function fridgeList() {
  return Object.entries(store.getData().fridge).map(([id, f]) => ({ id, ...f })).sort((a, b) => a.at - b.at);
}

function mountFrigo(view) {
  view.innerHTML = `
    <div class="card">
      <h2>Qu'est-ce qu'il reste ?</h2>
      <form class="adder" id="fridge-form" autocomplete="off">
        <input type="text" id="fridge-input" placeholder="Ex. courgettes, 4 œufs, crème, riz" aria-label="Ajouter au frigo" enterkeyhint="done" />
        <button type="button" class="icon-btn" id="fridge-mic" aria-label="Dicter">${icon('mic')}</button>
        <button type="submit" class="btn primary" aria-label="Ajouter">${icon('plus')}</button>
      </form>
      <p class="hint">Inutile de noter sel, poivre, huile, épices : ils sont considérés comme toujours présents.</p>
    </div>
    <div id="fridge-list"></div>
  `;
  const input = $('#fridge-input');
  const add = (text) => {
    const parsed = parseInput(text);
    const have = new Set(fridgeList().map((f) => canon(f.name)));
    const writes = parsed.filter((p) => !have.has(canon(p.name))).map((p) => [['fridge', store.uid()], { name: p.name, at: Date.now() }]);
    if (writes.length) store.writeMany(writes);
    input.value = '';
  };
  $('#fridge-form').onsubmit = (e) => { e.preventDefault(); add(input.value); };
  attachMic($('#fridge-mic'), input, add);
  updateFrigo();
}

function updateFrigo() {
  const items = fridgeList();
  const el = $('#fridge-list');
  if (!items.length) {
    el.innerHTML = `<div class="empty"><div class="icon-box">${icon('fridge', 30)}</div><p class="title">Qu'est-ce qui traîne au frais ?</p><p class="small">Note les restes, même trois courgettes et un fond de crème : l'appli trouve quoi cuisiner pour ${store.getSettings().persons}.</p></div>`;
    return;
  }
  const matches = rankRecipes().filter((r) => r.have > 0).length;
  el.innerHTML = `
    <div class="card">
      <div class="row" style="margin-bottom:12px"><h2 class="grow" style="margin:0">Dans le frigo (${items.length})</h2><button class="btn sm ghost danger" id="fridge-clear">${icon('trash', 16)}Tout vider</button></div>
      <div class="chips">${items.map((f) => `<span class="chip">${esc(f.name)}<button type="button" data-del="${f.id}" aria-label="Retirer ${esc(f.name)}">${icon('x', 14)}</button></span>`).join('')}</div>
    </div>
    <button class="btn primary block" id="to-recipes">${icon('chef')}Voir les idées de plats${matches ? ` (${matches})` : ''}</button>
  `;
  el.querySelectorAll('[data-del]').forEach((b) => (b.onclick = () => store.write(['fridge', b.dataset.del], null)));
  $('#fridge-clear').onclick = () => {
    const backup = structuredClone(store.getData().fridge);
    store.write(['fridge'], null);
    toast('Frigo vidé', { label: 'Annuler', run: () => store.write(['fridge'], backup) });
  };
  $('#to-recipes').onclick = () => go('recettes');
}

/* ---------------- Recettes ---------------- */

function fridgeHas(matchSpec, fridgeCanon) {
  const keys = matchSpec.split('/').map(canon).filter(Boolean);
  for (const f of fridgeCanon) {
    const fp = findProduct(f.text);
    for (const k of keys) {
      if (f.c === k) return true;
      if ((' ' + f.c + ' ').includes(' ' + k + ' ')) {
        // "cuisses de poulet" contient "poulet" : OK si c'est le même type de produit.
        const kp = findProduct(k);
        if (!fp || !kp || fp.cat === kp.cat) return true;
      }
      if (k.includes(' ') && (' ' + k + ' ').includes(' ' + f.c + ' ') && f.c.length > 3) {
        const kp = findProduct(k);
        if (fp && kp && fp.name === kp.name) return true;
      }
    }
  }
  return false;
}

function rankRecipes() {
  const fridgeCanon = fridgeList().map((f) => ({ text: f.name, c: canon(f.name) }));
  return RECIPES.map((r) => {
    const main = r.ingredients.filter((i) => !i.pantry && !i.optional);
    const status = r.ingredients.map((i) => ({ ...i, have: i.pantry || fridgeHas(i.match, fridgeCanon) }));
    const have = main.filter((i) => fridgeHas(i.match, fridgeCanon)).length;
    const missing = status.filter((i) => !i.have && !i.optional && !i.pantry);
    return { ...r, status, have, total: main.length, missing, score: have / main.length };
  }).sort((a, b) => b.score - a.score || a.missing.length - b.missing.length || a.time - b.time);
}

function scaleQty(q, persons) {
  if (!q || persons === 2) return q;
  return q.replace(/^(\d+(?:[.,]\d+)?)/, (n) => {
    const v = (parseFloat(n.replace(',', '.')) * persons) / 2;
    return (Math.round(v * 10) / 10).toString().replace('.', ',');
  });
}

function mountRecettes(view) {
  const s = store.getSettings();
  view.innerHTML = `
    <div class="card">
      <div class="row" style="margin-bottom:12px">
        <div class="icon-box">${icon('users')}</div>
        <div class="grow"><strong>Pour combien ?</strong><div class="muted small" id="fridge-summary"></div></div>
        <div class="stepper"><button type="button" id="p-minus" aria-label="Moins">${icon('minus', 18)}</button><output id="p-val">${s.persons}</output><button type="button" id="p-plus" aria-label="Plus">${icon('plus', 18)}</button></div>
      </div>
      <div class="segmented" role="group" aria-label="Source des recettes">
        <button type="button" data-mode="carnet">Carnet</button>
        <button type="button" data-mode="ia">Idées IA</button>
        <button type="button" data-mode="saved">Mes recettes</button>
      </div>
    </div>
    <div id="recipes-body"></div>
  `;
  const setP = (d) => store.saveSettings({ persons: Math.min(12, Math.max(1, store.getSettings().persons + d)) });
  $('#p-minus').onclick = () => setP(-1);
  $('#p-plus').onclick = () => setP(1);
  view.querySelectorAll('[data-mode]').forEach((b) => (b.onclick = () => { ui.recipeMode = b.dataset.mode; updateRecettes(); }));
  updateRecettes();
}

function updateRecettes() {
  const s = store.getSettings();
  const fridge = fridgeList();
  $('#p-val').textContent = s.persons;
  $('#fridge-summary').textContent = fridge.length ? `${fridge.length} ingrédient${fridge.length > 1 ? 's' : ''} dans le frigo` : 'Frigo vide : remplis-le pour des idées ciblées';
  document.querySelectorAll('[data-mode]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.mode === ui.recipeMode)));
  const body = $('#recipes-body');

  if (ui.recipeMode === 'carnet') {
    const ranked = rankRecipes();
    const list = fridge.length ? ranked.filter((r) => r.have > 0) : ranked;
    body.innerHTML = (fridge.length && !list.length ? `<div class="card notice">${icon('info')}<span>Aucune recette du carnet ne colle à ton frigo. Essaie les <strong>Idées IA</strong> : elles s'adaptent à n'importe quels ingrédients.</span></div>` : '')
      + list.map((r) => recipeCard(r, fridge.length > 0)).join('');
    body.querySelectorAll('[data-recipe]').forEach((c) => (c.onclick = () => openRecipe(ranked.find((r) => r.id === c.dataset.recipe))));
    return;
  }

  if (ui.recipeMode === 'saved') {
    const saved = Object.entries(store.getData().saved).map(([id, r]) => ({ id, ...r })).sort((a, b) => b.at - a.at);
    body.innerHTML = saved.length
      ? saved.map((r) => recipeCard(r, false)).join('')
      : `<div class="empty"><div class="icon-box">${icon('bookmark', 30)}</div><p class="title">Le carnet du foyer est vide</p><p class="small">Les recettes IA qui te plaisent peuvent être enregistrées ici, pour tout le foyer.</p></div>`;
    body.querySelectorAll('[data-recipe]').forEach((c) => (c.onclick = () => openRecipe(saved.find((r) => r.id === c.dataset.recipe), { savedId: c.dataset.recipe })));
    return;
  }

  // Idées IA (on ne redessine pas pendant que l'utilisateur tape son envie)
  if (document.activeElement && document.activeElement.id === 'wish') return;
  body.innerHTML = `
    <div class="card">
      <h2 class="row">${icon('spark', 18)}Inventer des recettes avec ce que j'ai</h2>
      <label class="field"><span>Envie particulière (facultatif)</span><input type="text" id="wish" placeholder="Ex. un truc réconfortant, végétarien, à l'asiatique…" value="${esc(ui.wish)}" /></label>
      <label class="field"><span>Temps maximum</span>
        <select id="max-time">
          ${[['', 'Peu importe'], ['20', '20 min'], ['30', '30 min'], ['45', '45 min'], ['60', '1 h']].map(([v, l]) => `<option value="${v}" ${ui.maxTime === v ? 'selected' : ''}>${l}</option>`).join('')}
        </select>
      </label>
      <button class="btn primary block" id="ai-go" ${ui.aiBusy ? 'disabled' : ''}>${icon(ui.aiBusy ? 'refresh' : 'spark', 20, ui.aiBusy ? 'spin' : '')}${ui.aiBusy ? 'Le chef réfléchit…' : `Proposer 3 recettes pour ${s.persons}`}</button>
      ${s.apiKey ? '' : `<p class="hint">${icon('info', 14)} Nécessite une clé API Claude, à saisir dans les réglages.</p>`}
    </div>
    ${ui.aiRecipes.map((r, i) => recipeCard({ ...r, id: 'ai-' + i }, false)).join('')}
  `;
  $('#wish').oninput = (e) => (ui.wish = e.target.value);
  $('#max-time').onchange = (e) => (ui.maxTime = e.target.value);
  $('#ai-go').onclick = runAiRecipes;
  body.querySelectorAll('[data-recipe]').forEach((c) => (c.onclick = () => openRecipe(ui.aiRecipes[+c.dataset.recipe.slice(3)], { ai: true })));
}

function recipeCard(r, showMatch) {
  const missingNames = (r.missing || []).map((i) => i.name);
  return `
    <button type="button" class="card recipe-card" data-recipe="${esc(r.id)}">
      <div class="icon-box">${icon(r.ai || String(r.id).startsWith('ai-') ? 'spark' : 'chef')}</div>
      <div class="grow">
        <h3>${esc(r.title)}</h3>
        ${r.summary ? `<div class="muted small" style="margin-bottom:6px">${esc(r.summary)}</div>` : ''}
        <div class="facts">
          <span>${icon('clock', 14)}${r.time} min</span>
          <span>${icon('flame', 14)}${esc(r.level)}</span>
          ${showMatch ? `<span>${icon('fridge', 14)}${r.have}/${r.total} ingrédients</span>` : ''}
        </div>
        ${showMatch ? `<div class="meter"><span style="width:${Math.round(r.score * 100)}%"></span></div>` : ''}
        ${showMatch && missingNames.length ? `<div class="missing">Manque : ${esc(missingNames.join(', '))}</div>` : ''}
      </div>
      ${icon('chevronRight', 20)}
    </button>`;
}

function openRecipe(r, opts = {}) {
  if (!r) return;
  const persons = store.getSettings().persons;
  const isBuiltin = !opts.ai && !opts.savedId;
  const fridgeCanon = fridgeList().map((f) => ({ text: f.name, c: canon(f.name) }));
  const ings = isBuiltin
    ? (r.status || r.ingredients).map((i) => ({ name: i.name, qty: scaleQty(i.qty, persons), state: i.pantry ? 'base' : i.have ? 'have' : i.optional ? 'opt' : 'need' }))
    : r.ingredients.map((i) => ({ name: i.name, qty: i.qty, state: i.have || fridgeHas(i.name, fridgeCanon) ? 'have' : 'need' }));
  const toBuy = ings.filter((i) => i.state === 'need');
  const stateIcon = { have: ['have', 'checkCircle'], need: ['need', 'cart'], base: ['base', 'leaf'], opt: ['base', 'plus'] };

  openSheet(`
    <div class="sheet-head">
      <button class="icon-btn" data-close aria-label="Retour">${icon('chevronLeft')}</button>
      <h2>${esc(r.title)}</h2>
    </div>
    <div class="row wrap" style="margin-bottom:16px">
      <span class="badge neutral">${icon('clock', 14)}${r.time} min</span>
      <span class="badge neutral">${icon('flame', 14)}${esc(r.level)}</span>
      <span class="badge neutral">${icon('users', 14)}${isBuiltin ? persons : r.persons || persons} pers.</span>
      ${toBuy.length ? `<span class="badge warn">${toBuy.length} à acheter</span>` : `<span class="badge">Tout est là</span>`}
    </div>
    <div class="card">
      <h2>Ingrédients</h2>
      <ul class="ingredients">
        ${ings.map((i) => `<li><span class="state ${stateIcon[i.state][0]}">${icon(stateIcon[i.state][1], 18)}</span><span>${esc(i.name)}${i.state === 'opt' ? ' <span class="muted small">(facultatif)</span>' : ''}${i.state === 'base' ? ' <span class="muted small">(placard)</span>' : ''}</span><span class="qty">${esc(i.qty || '')}</span></li>`).join('')}
      </ul>
      ${toBuy.length ? `<button class="btn block" id="add-missing" style="margin-top:12px">${icon('cart')}Ajouter les ${toBuy.length} manquant${toBuy.length > 1 ? 's' : ''} à la liste</button>` : ''}
    </div>
    <div class="card">
      <h2>Préparation</h2>
      <ol class="steps">${r.steps.map((st) => `<li>${esc(st)}</li>`).join('')}</ol>
      ${r.tip ? `<div class="tip">${icon('spark', 18)}<span><strong>Astuce.</strong> ${esc(r.tip)}</span></div>` : ''}
    </div>
    <div class="row">
      ${opts.ai ? `<button class="btn primary grow" id="save-recipe">${icon('bookmark')}Garder pour le foyer</button>` : ''}
      ${opts.savedId ? `<button class="btn danger grow" id="unsave-recipe">${icon('trash')}Retirer de mes recettes</button>` : ''}
      <button class="btn grow" data-close>Fermer</button>
    </div>
  `, (sheet) => {
    const addBtn = sheet.querySelector('#add-missing');
    if (addBtn) addBtn.onclick = () => {
      const n = addItems(toBuy.map((i) => i.name.replace(/[,;]/g, ' ')).join('\n'), r.title);
      toast(`${n} article${n > 1 ? 's' : ''} ajouté${n > 1 ? 's' : ''} à la liste`);
      addBtn.disabled = true;
    };
    const save = sheet.querySelector('#save-recipe');
    if (save) save.onclick = () => {
      store.write(['saved', store.uid()], { ...r, ai: true, persons, at: Date.now(), by: member() });
      save.disabled = true;
      toast('Recette enregistrée');
    };
    const unsave = sheet.querySelector('#unsave-recipe');
    if (unsave) unsave.onclick = () => { store.write(['saved', opts.savedId], null); closeSheet(); };
  });
}

async function runAiRecipes() {
  const s = store.getSettings();
  if (!s.apiKey) {
    toast('Ajoute une clé API Claude dans les réglages', { label: 'Réglages', run: () => go('reglages') });
    return;
  }
  ui.aiBusy = true;
  updateRecettes();
  try {
    ui.aiRecipes = await suggestRecipes(s, {
      fridge: fridgeList().map((f) => f.name),
      persons: s.persons,
      wish: ui.wish.trim(),
      maxTime: ui.maxTime,
    });
  } catch (err) {
    toast(friendlyError(err));
  } finally {
    ui.aiBusy = false;
    if (tab === 'recettes') updateRecettes();
  }
}

/* ---------------- Réglages ---------------- */

function mountReglages(view) {
  const s = store.getSettings();
  view.innerHTML = `
    <div class="card">
      <h2 class="row">${icon('store', 18)}Courses</h2>
      <label class="field"><span>Magasin habituel</span>
        <select id="set-store">${STORES.map((st) => `<option value="${st.id}" ${st.id === s.store ? 'selected' : ''}>${esc(st.label)}</option>`).join('')}</select>
      </label>
      <label class="field"><span>Nombre de personnes par défaut</span><input type="number" id="set-persons" min="1" max="12" value="${s.persons}" /></label>
    </div>

    <div class="card">
      <h2 class="row">${icon('users', 18)}Foyer partagé</h2>
      <p class="muted small" style="margin-top:0">Pour que tout le foyer voie la même liste en temps réel. Il faut une base Firebase gratuite (voir le README) : la même adresse et le même code foyer sur chaque téléphone.</p>
      <label class="field"><span>Ton prénom</span><input type="text" id="set-member" value="${esc(s.member)}" placeholder="Ex. Hugo" /></label>
      <label class="field"><span>Adresse de la base Firebase</span><input type="url" id="set-sync" value="${esc(s.syncUrl)}" placeholder="https://mon-projet-default-rtdb.europe-west1.firebasedatabase.app" /></label>
      <label class="field"><span>Code du foyer</span><input type="text" id="set-household" value="${esc(s.household)}" placeholder="Ex. maison-dupont-7k2p" />
        <p class="hint">Choisis un code difficile à deviner : c'est lui qui protège votre liste.</p></label>
      <div class="row wrap"><button class="btn primary" id="save-sync">${icon('cloud', 18)}Connecter</button><button class="btn ghost" id="stop-sync">Déconnecter</button><span class="spacer"></span><span class="muted small" id="sync-state"></span></div>
    </div>

    <div class="card">
      <h2 class="row">${icon('spark', 18)}Intelligence artificielle (facultatif)</h2>
      <p class="muted small" style="margin-top:0">Pour inventer des recettes avec n'importe quel ingrédient et chercher les prix réels sur internet. La clé reste sur cet appareil.</p>
      <label class="field"><span>Clé API Claude</span><input type="password" id="set-key" value="${esc(s.apiKey)}" placeholder="sk-ant-…" autocomplete="off" /></label>
      <label class="field"><span>Modèle</span>
        <select id="set-model">
          ${[['claude-opus-5-5', 'Claude Opus 5.5 (meilleures recettes)'], ['claude-sonnet-5-5', 'Claude Sonnet 5.5 (équilibré)'], ['claude-haiku-5-5', 'Claude Haiku 5.5 (le moins cher)']].map(([v, l]) => `<option value="${v}" ${s.model === v ? 'selected' : ''}>${l}</option>`).join('')}
        </select>
      </label>
      <button class="btn" id="save-ai">Enregistrer</button>
    </div>

    <div class="card">
      <h2 class="row">${icon('download', 18)}Sauvegarde</h2>
      <div class="row wrap">
        <button class="btn" id="export">${icon('download', 18)}Exporter</button>
        <label class="btn">${icon('upload', 18)}Importer<input type="file" id="import" accept="application/json" hidden /></label>
      </div>
    </div>
    <p class="muted small" style="text-align:center">Prix indicatifs calculés à partir d'un prix moyen par produit et d'un indice par enseigne.</p>
  `;
  $('#set-store').onchange = (e) => store.saveSettings({ store: e.target.value });
  $('#set-persons').onchange = (e) => store.saveSettings({ persons: Math.min(12, Math.max(1, +e.target.value || 2)) });
  $('#set-member').onchange = (e) => store.saveSettings({ member: e.target.value.trim() });
  $('#save-sync').onclick = () => {
    const url = $('#set-sync').value.trim();
    const code = $('#set-household').value.trim();
    if (!/^https:\/\/.+/.test(url) || code.length < 6) { toast('Adresse https et code de 6 caractères minimum'); return; }
    store.saveSettings({ syncUrl: url, household: code });
    toast('Connexion au foyer…');
  };
  $('#stop-sync').onclick = () => store.saveSettings({ syncUrl: '', household: '' });
  $('#save-ai').onclick = () => { store.saveSettings({ apiKey: $('#set-key').value.trim(), model: $('#set-model').value }); toast('Enregistré'); };
  $('#export').onclick = () => {
    const blob = new Blob([JSON.stringify(store.getData(), null, 2)], { type: 'application/json' });
    const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: `courses-${new Date().toISOString().slice(0, 10)}.json` });
    a.click();
  };
  $('#import').onchange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      store.replaceAll(JSON.parse(await file.text()));
      toast('Données importées');
    } catch { toast('Fichier invalide'); }
  };
  updateReglages();
}

function updateReglages() {
  const el = $('#sync-state');
  if (el) el.textContent = { off: 'Non connecté', connecting: 'Connexion…', online: 'Synchronisé', error: 'Erreur de connexion' }[store.getSyncStatus()];
}

/* ---------------- Navigation ---------------- */

const VIEWS = {
  courses: [mountCourses, updateCourses],
  frigo: [mountFrigo, updateFrigo],
  recettes: [mountRecettes, updateRecettes],
  reglages: [mountReglages, updateReglages],
};

function go(t) {
  closeSheet();
  tab = t;
  history.replaceState(null, '', '#' + t);
  render(true);
  window.scrollTo(0, 0);
}

function renderChrome() {
  const items = itemsArray().filter((i) => !i.done).length;
  const fridge = Object.keys(store.getData().fridge).length;
  const s = store.getSettings();
  $('#title').textContent = TABS[tab].title;
  $('#brand-mark').innerHTML = icon(TABS[tab].icon, 22);
  $('#subtitle').textContent = {
    courses: `${items} à prendre · ${STORE[s.store]?.label || ''}`,
    frigo: `${fridge} ingrédient${fridge > 1 ? 's' : ''}`,
    recettes: `Pour ${s.persons} personne${s.persons > 1 ? 's' : ''}`,
    reglages: s.household ? `Foyer « ${s.household} »` : 'Sur cet appareil',
  }[tab];
  const st = store.getSyncStatus();
  const pill = $('#sync-pill');
  pill.className = `sync-pill ${st}`;
  pill.innerHTML = st === 'off' ? `${icon('cloudOff', 16)}Local` : `<span class="dot"></span>${{ connecting: 'Connexion', online: 'Foyer', error: 'Hors ligne' }[st]}`;
  pill.onclick = () => go('reglages');
  document.querySelectorAll('#tabbar [data-tab]').forEach((b) => {
    if (b.dataset.tab === tab) b.setAttribute('aria-current', 'page');
    else b.removeAttribute('aria-current');
  });
}

function render(full) {
  renderChrome();
  document.body.classList.toggle('has-dock', tab === 'courses');
  const [mount, update] = VIEWS[tab];
  if (full) mount($('#view'));
  else update();
}

document.querySelectorAll('#tabbar [data-tab]').forEach((b) => {
  b.querySelector('[data-ic]').innerHTML = icon(TABS[b.dataset.tab].icon, 22);
  b.onclick = () => go(b.dataset.tab);
});

window.addEventListener('hashchange', () => {
  const t = location.hash.slice(1);
  if (t in TABS && t !== tab) go(t);
});

store.subscribe(() => render(false));
render(true);
store.connect();

if ('serviceWorker' in navigator && location.protocol === 'https:') {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}
