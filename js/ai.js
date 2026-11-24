// Fonctions IA (optionnelles) : recettes inventées et estimation des prix avec recherche web.
// Appel direct à l'API Claude depuis le navigateur avec la clé de l'utilisateur, stockée sur l'appareil uniquement.

let clientPromise = null;
let clientKey = null;

async function getClient(apiKey) {
  if (!clientPromise || clientKey !== apiKey) {
    clientKey = apiKey;
    clientPromise = import('https://esm.sh/@anthropic-ai/sdk').then(
      ({ default: Anthropic }) => new Anthropic({ apiKey, dangerouslyAllowBrowser: true }),
    );
  }
  return clientPromise;
}

function textOf(message) {
  return message.content.filter((b) => b.type === 'text').map((b) => b.text).join('\n');
}

function extractJson(text) {
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start < 0 || end < start) throw new Error('Réponse illisible');
  return JSON.parse(text.slice(start, end + 1));
}

function checkStop(message) {
  if (message.stop_reason === 'refusal') throw new Error('La demande a été refusée par le modèle.');
  if (message.stop_reason === 'max_tokens') throw new Error('Réponse trop longue, réessaie avec moins d\'éléments.');
}

async function create(settings, params) {
  const client = await getClient(settings.apiKey);
  const model = settings.model || 'claude-opus-5-5';
  const body = { model, max_tokens: 16000, ...params };
  // Repli automatique sur un autre modèle si une demande est refusée par erreur (Opus 5.5 / Sonnet 5.5).
  if (model === 'claude-opus-5-5' || model === 'claude-sonnet-5-5') {
    body.betas = ['server-side-fallback-2026-07-01'];
    body.fallbacks = 'default';
    return client.beta.messages.create(body);
  }
  return client.messages.create(body);
}

const RECIPE_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['recipes'],
  properties: {
    recipes: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['title', 'summary', 'time', 'level', 'ingredients', 'steps', 'tip'],
        properties: {
          title: { type: 'string' },
          summary: { type: 'string' },
          time: { type: 'integer' },
          level: { type: 'string', enum: ['Facile', 'Moyen', 'Difficile'] },
          ingredients: {
            type: 'array',
            items: {
              type: 'object',
              additionalProperties: false,
              required: ['name', 'qty', 'have'],
              properties: { name: { type: 'string' }, qty: { type: 'string' }, have: { type: 'boolean' } },
            },
          },
          steps: { type: 'array', items: { type: 'string' } },
          tip: { type: 'string' },
        },
      },
    },
  },
};

export async function suggestRecipes(settings, { fridge, persons, wish, maxTime }) {
  const prompt = [
    `Ingrédients disponibles dans mon frigo / placard : ${fridge.length ? fridge.join(', ') : '(rien de précis)'}.`,
    `Nombre de personnes : ${persons}.`,
    wish ? `Envie / contrainte : ${wish}.` : '',
    maxTime ? `Temps maximum : ${maxTime} minutes, préparation et cuisson comprises.` : '',
    '',
    'Propose 3 recettes différentes (styles variés), appétissantes et réalisables à la maison, qui utilisent au maximum ce que j\'ai.',
    'Considère comme toujours disponibles : sel, poivre, huile, sucre, farine, eau. Limite les ingrédients à acheter (2 au plus par recette).',
    'Pour chaque recette : quantités précises adaptées au nombre de personnes, champ "have" vrai si l\'ingrédient est dans ma liste ou de base,',
    'étapes détaillées avec températures, temps et repères visuels (6 à 10 étapes), et une astuce de chef.',
    'Réponds en français.',
  ].filter(Boolean).join('\n');

  const msg = await create(settings, {
    output_config: { effort: 'medium', format: { type: 'json_schema', schema: RECIPE_SCHEMA } },
    messages: [{ role: 'user', content: prompt }],
  });
  checkStop(msg);
  return extractJson(textOf(msg)).recipes;
}

export async function estimatePrices(settings, { items, storeLabel }) {
  const list = items.map((i) => `- ${i.name}${i.qtyLabel ? ' (' + i.qtyLabel + ')' : ''}`).join('\n');
  const prompt = [
    `Voici ma liste de courses. Estime le prix de chaque article chez ${storeLabel} en France, aujourd'hui.`,
    'Utilise la recherche web pour trouver des prix récents (site de l\'enseigne, prospectus, comparateurs). Si tu ne trouves pas un article, estime-le d\'après un produit équivalent.',
    'Pour un article sans quantité, prends le format le plus courant.',
    '',
    list,
    '',
    'Réponds uniquement avec un objet JSON, sans texte autour, de la forme :',
    '{"items":[{"name":"...","min":0.0,"max":0.0}],"total_min":0.0,"total_max":0.0,"note":"une phrase sur la fiabilité"}',
  ].join('\n');

  const messages = [{ role: 'user', content: prompt }];
  let msg;
  for (let turn = 0; turn < 4; turn++) {
    msg = await create(settings, {
      output_config: { effort: 'low' },
      tools: [{ type: 'web_search_20260209', name: 'web_search', max_uses: 6, user_location: { type: 'approximate', country: 'FR' } }],
      messages,
    });
    // Une recherche longue peut être mise en pause : on renvoie la réponse pour que le serveur continue.
    if (msg.stop_reason !== 'pause_turn') break;
    messages.push({ role: 'assistant', content: msg.content });
  }
  checkStop(msg);
  return extractJson(textOf(msg));
}

export function friendlyError(err) {
  const s = String(err?.status || '');
  if (s === '401') return 'Clé API invalide. Vérifie-la dans les réglages.';
  if (s === '429') return 'Trop de demandes ou crédit épuisé. Réessaie dans un moment.';
  if (s.startsWith('5')) return 'Le service IA est momentanément indisponible.';
  if (err?.message?.includes('Failed to fetch') || err?.message?.includes('NetworkError')) return 'Pas de connexion internet.';
  return err?.message || 'Erreur inconnue';
}
