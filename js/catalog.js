// Catalogue : rayons, produits, prix indicatifs, analyse du texte saisi.
// Les prix sont des fourchettes indicatives (prix moyen France, base "hypermarché" = indice 1.00).
// Ils servent à estimer un budget, pas à donner un prix exact.

export const CATEGORIES = [
  { id: 'fl', label: 'Fruits & légumes', color: '#5E7A3A' },
  { id: 'bo', label: 'Boulangerie', color: '#A86A2E' },
  { id: 'vp', label: 'Boucherie & poissonnerie', color: '#A84F45' },
  { id: 'cr', label: 'Crèmerie & fromages', color: '#B08A1E' },
  { id: 'tr', label: 'Charcuterie & traiteur', color: '#B5636E' },
  { id: 'es', label: 'Épicerie salée', color: '#8A6E4B' },
  { id: 'su', label: 'Épicerie sucrée & petit-déj', color: '#9A5D84' },
  { id: 'bs', label: 'Boissons', color: '#3E7A9A' },
  { id: 'sg', label: 'Surgelés', color: '#4C7FB8' },
  { id: 'hy', label: 'Hygiène & beauté', color: '#6F6AA8' },
  { id: 'en', label: 'Entretien & maison', color: '#5A8C8C' },
  { id: 'bb', label: 'Bébé', color: '#C27C5A' },
  { id: 'an', label: 'Animaux', color: '#7C7A52' },
  { id: 'au', label: 'Autres', color: '#7A7F7C' },
];
export const CAT = Object.fromEntries(CATEGORIES.map((c) => [c.id, c]));

// Fourchette par défaut quand le produit est inconnu (par article).
const CAT_DEFAULT = {
  fl: [1, 3], bo: [1, 3], vp: [4, 9], cr: [1.5, 4], tr: [2, 5], es: [1, 3], su: [1.5, 4],
  bs: [1, 4], sg: [2.5, 5], hy: [2, 5], en: [2, 6], bb: [3, 10], an: [2, 8], au: [1, 5],
};

// Indice de prix moyen par enseigne (1.00 = hypermarché classique). Approximation publique.
export const STORES = [
  { id: 'lidl', label: 'Lidl', idx: 0.84 },
  { id: 'aldi', label: 'Aldi', idx: 0.83 },
  { id: 'leclerc', label: 'E.Leclerc', idx: 0.9 },
  { id: 'intermarche', label: 'Intermarché', idx: 0.95 },
  { id: 'auchan', label: 'Auchan', idx: 0.94 },
  { id: 'superu', label: 'Super U', idx: 0.97 },
  { id: 'carrefour', label: 'Carrefour', idx: 1.0 },
  { id: 'carrefourmarket', label: 'Carrefour Market', idx: 1.06 },
  { id: 'casino', label: 'Casino / Géant', idx: 1.08 },
  { id: 'monoprix', label: 'Monoprix', idx: 1.25 },
  { id: 'franprix', label: 'Franprix', idx: 1.28 },
  { id: 'marche', label: 'Marché / primeur', idx: 1.1 },
];
export const STORE = Object.fromEntries(STORES.map((s) => [s.id, s]));

// cat;nom/alias/alias;min;max;unité
const RAW = `
fl;courgette;0.5;1;pc
fl;tomate;0.35;0.8;pc
fl;tomate cerise;1.8;3.2;barquette
fl;carotte;1.1;2;kg
fl;pomme de terre/patate;1.2;2.5;kg
fl;oignon;0.25;0.5;pc
fl;oignon rouge;0.35;0.7;pc
fl;echalote;0.25;0.5;pc
fl;ail;0.4;0.9;tete
fl;poireau;0.7;1.4;pc
fl;poivron;0.8;1.6;pc
fl;aubergine;0.9;1.8;pc
fl;concombre;0.7;1.3;pc
fl;salade/laitue/batavia/frisee;0.9;1.6;pc
fl;mache/roquette/pousse d'epinard/jeunes pousses;1.4;2.6;sachet
fl;epinard;2;3.5;sachet
fl;brocoli;1.2;2.2;pc
fl;chou-fleur/chou fleur;1.5;2.8;pc
fl;chou;1.2;2.5;pc
fl;haricot vert;2.5;5;kg
fl;petit pois;2;4;kg
fl;champignon/champignons de paris;1.5;2.8;barquette
fl;avocat;0.7;1.5;pc
fl;citron;0.3;0.6;pc
fl;citron vert;0.3;0.6;pc
fl;pomme;1.8;3.2;kg
fl;poire;2;3.5;kg
fl;banane;1.4;2.4;kg
fl;orange;1.5;3;kg
fl;clementine/mandarine;2;3.8;kg
fl;kiwi;0.25;0.5;pc
fl;fraise;2.5;5;barquette
fl;framboise/myrtille;2.5;4.5;barquette
fl;raisin;2.5;4.5;kg
fl;melon;1.5;3.5;pc
fl;pasteque;3;6;pc
fl;peche/nectarine/abricot;2.5;4.5;kg
fl;ananas;1.5;3;pc
fl;mangue;1.2;2.5;pc
fl;potiron/potimarron/courge/butternut;1.5;3.5;pc
fl;navet;1.5;3;kg
fl;betterave;1.2;2.5;paquet
fl;radis;1;1.8;botte
fl;celeri;1.2;2.5;pc
fl;fenouil;1;2;pc
fl;asperge;3;7;botte
fl;artichaut;1;2.2;pc
fl;patate douce;2.5;4;kg
fl;gingembre;0.6;1.5;pc
fl;persil/coriandre/basilic/ciboulette/menthe/aneth;0.9;1.6;botte
fl;herbes;0.9;1.6;botte
fl;legume;1;3;pc
fl;fruit;1.5;3.5;pc
bo;pain/baguette;0.9;1.3;pc
bo;pain de mie;1.2;2.5;paquet
bo;croissant;0.5;1.1;pc
bo;pain au chocolat;0.5;1.2;pc
bo;brioche;1.5;3.2;pc
bo;pain burger/pain hamburger/bun;1.5;2.8;paquet
bo;wrap/tortilla;1.5;2.8;paquet
bo;pain pita;1.2;2.2;paquet
vp;poulet/blanc de poulet/escalope de poulet/filet de poulet;9;16;kg
vp;poulet entier;5;9;kg
vp;cuisse de poulet/pilon;5;9;kg
vp;dinde/escalope de dinde;9;15;kg
vp;boeuf;13;25;kg
vp;steak/steak hache;9;15;kg
vp;viande hachee/hache;9;14;kg
vp;porc/cote de porc/filet mignon;8;15;kg
vp;saucisse/chipolata/merguez;7;12;kg
vp;agneau;16;28;kg
vp;veau;18;30;kg
vp;saumon;18;30;kg
vp;cabillaud/colin/merlu/lieu;14;25;kg
vp;thon frais;20;35;kg
vp;crevette;12;25;kg
vp;moule;4;7;kg
vp;poisson;12;25;kg
vp;viande;10;20;kg
cr;lait;0.85;1.3;l
cr;beurre;2;3.5;plaquette
cr;oeuf;0.25;0.45;pc
cr;creme fraiche/creme;1.3;2.6;pot
cr;creme liquide;1.2;2.4;brique
cr;yaourt/yogourt;0.25;0.6;pc
cr;fromage blanc;1.5;3;pot
cr;skyr;0.5;0.9;pc
cr;emmental/gruyere/rape/fromage rape;2;4;sachet
cr;mozzarella;0.9;1.8;pc
cr;parmesan;3;6;pc
cr;feta;1.8;3.2;pc
cr;chevre;2;3.8;pc
cr;camembert/brie;1.5;3.5;pc
cr;comte;3.5;7;pc
cr;raclette;5;9;paquet
cr;ricotta/mascarpone;1.8;3.5;pot
cr;fromage;2;5;pc
cr;dessert/creme dessert/mousse au chocolat;1.5;3;paquet
cr;pate a pizza/pate brisee/pate feuilletee/pate sablee;0.9;2;rouleau
cr;lardon;1.5;2.8;paquet
tr;jambon;2.2;4;paquet
tr;jambon cru/serrano/prosciutto;2.5;5;paquet
tr;saucisson;2.5;5;pc
tr;chorizo;2;4;pc
tr;rillette/terrine;1.8;3.5;pot
tr;knacki/saucisse de strasbourg;2;3.5;paquet
tr;pizza;3;6;pc
tr;quiche;3;5.5;pc
tr;taboule/salade composee;2;4;barquette
tr;houmous;1.5;3;pot
tr;surimi;1.5;3;paquet
tr;saumon fume;3.5;7;paquet
tr;gnocchi;1.2;2.5;paquet
tr;pates fraiches/ravioli/tortellini;1.8;3.5;paquet
tr;tofu;1.8;3.2;pc
es;pate/pates/spaghetti/penne/tagliatelle/coquillette/fusilli/macaroni;0.9;2;paquet
es;riz/riz basmati;1.5;3;kg
es;semoule;1.2;2.2;paquet
es;quinoa/boulgour;2;4;paquet
es;lentille/pois chiche/haricot rouge/haricot blanc;1;2.5;boite
es;farine;0.8;1.5;kg
es;huile/huile d'olive;3;9;bouteille
es;huile de tournesol;1.8;3.5;bouteille
es;vinaigre;1;2.5;bouteille
es;sel;0.5;1.2;pc
es;poivre;1.5;3.5;pc
es;epice/curry/paprika/cumin/herbes de provence;1.2;2.8;pot
es;bouillon/cube;1.2;2.4;boite
es;sauce tomate/coulis de tomate/passata;1;2.2;pot
es;tomate pelee/concassee;0.8;1.6;boite
es;concentre de tomate;0.6;1.3;tube
es;ketchup/mayonnaise/moutarde;1.2;2.8;pc
es;sauce soja/sauce;1.5;3;bouteille
es;pesto;1.8;3.2;pot
es;thon/thon en boite;1.8;3.5;boite
es;sardine/maquereau;1.2;2.5;boite
es;mais;0.9;1.8;boite
es;olive;1.5;3;pot
es;cornichon;1.3;2.6;pot
es;chips;1.2;2.8;paquet
es;biscuit aperitif/cacahuete/apero;1.5;3;paquet
es;conserve;1;2.5;boite
es;soupe;1.8;3.5;brique
es;nouille/ramen;0.8;2;paquet
es;lait de coco;1;2.2;boite
su;cafe;3;7;paquet
su;capsule/dosette;3;6;boite
su;the/tisane;1.8;4;boite
su;chocolat en poudre/cacao;2.5;5;boite
su;cereale/muesli/flocons d'avoine;2;4;paquet
su;sucre;1;1.6;kg
su;confiture;1.8;3.5;pot
su;miel;3.5;7;pot
su;pate a tartiner/nutella;2.5;5;pot
su;biscuit/gateau/cookie;1.3;3;paquet
su;chocolat;1.2;3;tablette
su;compote;1.8;3.2;paquet
su;bonbon;1.5;3;paquet
su;levure;0.8;1.6;paquet
su;sucre vanille;0.8;1.6;paquet
su;madeleine;1.5;3;paquet
bs;eau/eau minerale/eau gazeuse;1.8;4;pack
bs;jus/jus d'orange;1.5;3.5;bouteille
bs;soda/coca/limonade/ice tea;1.3;2.8;bouteille
bs;biere;4;9;pack
bs;vin;3.5;10;bouteille
bs;champagne;15;30;bouteille
bs;sirop;1.8;3.5;bouteille
bs;lait vegetal/lait d'amande/lait d'avoine;1.5;2.8;brique
sg;surgele;2.5;5;paquet
sg;glace/creme glacee/esquimau;2.5;5;boite
sg;frite;2;4;sachet
sg;legume surgele/poelee/haricot vert surgele/epinard surgele;1.8;3.5;sachet
sg;pizza surgelee;2.5;5;pc
sg;poisson pane/pane;2.5;4.5;boite
sg;nugget/cordon bleu;3;5.5;boite
sg;steak hache surgele;4;7;boite
sg;fruit surgele/fruits rouges surgeles;2.5;4.5;sachet
sg;plat cuisine surgele/lasagne surgelee;3;6;pc
hy;papier toilette/pq;3;7;paquet
hy;mouchoir;1;3;boite
hy;dentifrice;1.5;3.5;tube
hy;brosse a dents;1.5;4;pc
hy;gel douche/savon;1.5;3.5;flacon
hy;shampoing/apres-shampoing;2;5;flacon
hy;deodorant;2;4.5;pc
hy;coton/coton-tige;1;2.5;paquet
hy;rasoir;3;8;paquet
hy;protection hygienique/serviette hygienique/tampon;2.5;5;paquet
hy;creme hydratante;3;8;pc
en;liquide vaisselle;1.2;2.8;flacon
en;pastille lave-vaisselle/tablette lave-vaisselle;4;9;boite
en;lessive;5;12;bidon
en;adoucissant;2.5;5;bidon
en;eponge;1;2.5;paquet
en;sac poubelle;2;4;rouleau
en;essuie-tout/sopalin;2;4;paquet
en;nettoyant/javel/produit menager;1.5;4;flacon
en;papier aluminium/film alimentaire/papier cuisson;1.5;3;rouleau
en;ampoule;3;8;pc
en;pile;3;8;paquet
bb;couche;8;16;paquet
bb;lingette;1.5;3.5;paquet
bb;lait infantile;10;20;boite
bb;petit pot;0.8;1.8;pc
an;croquette;5;15;sac
an;patee;0.6;1.5;pc
an;litiere;3;9;sac
`;

export function norm(s) {
  return String(s || '')
    .toLowerCase()
    .replace(/œ/g, 'oe')
    .replace(/æ/g, 'ae')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[’`]/g, "'")
    .replace(/[^a-z0-9' -]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function singular(word) {
  if (word.length > 3 && /[sx]$/.test(word) && !/(ss|ous|us)$/.test(word)) return word.slice(0, -1);
  return word;
}

// Forme canonique pour comparer : sans accents, au singulier, sans articles.
export function canon(s) {
  return norm(s)
    .split(' ')
    .filter((w) => w && !['de', 'du', 'des', 'la', 'le', 'les', 'l', 'd', 'a', 'au', 'aux', 'en'].includes(w))
    .map((w) => singular(w.replace(/^[ld]'/, '')))
    .join(' ');
}

export const PRODUCTS = [];
for (const line of RAW.trim().split('\n')) {
  const [cat, names, min, max, unit] = line.split(';');
  const aliases = names.split('/');
  const entry = { cat, name: aliases[0], min: +min, max: +max, unit };
  for (const a of aliases) PRODUCTS.push({ ...entry, key: canon(a) });
}
// Clés les plus longues d'abord : "pate a pizza" passe avant "pizza".
PRODUCTS.sort((a, b) => b.key.length - a.key.length);

export function findProduct(name) {
  const c = ' ' + canon(name) + ' ';
  for (const p of PRODUCTS) {
    if (c.includes(' ' + p.key + ' ')) return p;
  }
  return null;
}

const UNITS = {
  kg: 'kg', kilo: 'kg', kilos: 'kg', g: 'g', gr: 'g', grammes: 'g', gramme: 'g',
  l: 'l', litre: 'l', litres: 'l', cl: 'cl', ml: 'ml',
  paquet: 'paquet', paquets: 'paquet', boite: 'boite', boites: 'boite', boîte: 'boite', boîtes: 'boite',
  bouteille: 'bouteille', bouteilles: 'bouteille', pot: 'pot', pots: 'pot', sachet: 'sachet', sachets: 'sachet',
  tranche: 'tranche', tranches: 'tranche', pack: 'pack', packs: 'pack', barquette: 'barquette', barquettes: 'barquette',
  botte: 'botte', bottes: 'botte', x: '',
};

const FILLERS = [
  "j'ai envie de", "j'ai envie d'", "j ai envie de", "envie de", "envie d'", "il me faut", "il faut", "il nous faut",
  "acheter", "racheter", "prendre", "penser a", "penser à", "ajoute", "ajouter", "mets", "mettre", "rajoute",
  "encore", "aussi", "un peu de", "un peu d'", "quelques",
];
const ARTICLES = /^(?:(?:des|du|de la|de|les|le|la|un|une)\s+|(?:de l|l|d)['’]\s*)/i;

// "2 kg de courgettes" -> { name:'Courgettes', qty:2, unit:'kg' }
export function parseOne(text) {
  let t = String(text).trim().replace(/[.!?]+$/, '');
  let low = t.toLowerCase();
  let changed = true;
  while (changed) {
    changed = false;
    for (const f of FILLERS) {
      if (low.startsWith(f + ' ') || low === f) {
        t = t.slice(f.length).trim();
        low = t.toLowerCase();
        changed = true;
      }
    }
    const m = t.match(ARTICLES);
    if (m && m[0].length < t.length) {
      t = t.slice(m[0].length).trim();
      low = t.toLowerCase();
      changed = changed || m[0].length > 0;
    }
  }
  let qty = null;
  let unit = '';
  const q = t.match(/^(\d+(?:[.,]\d+)?)\s*([a-zA-Zéèêîô]+)?\s+(?:de\s+|d['’]\s*)?(.+)$/);
  if (q) {
    const u = (q[2] || '').toLowerCase();
    if (!q[2] || u in UNITS) {
      qty = parseFloat(q[1].replace(',', '.'));
      unit = q[2] ? UNITS[u] : '';
      t = q[3];
    } else {
      qty = parseFloat(q[1].replace(',', '.'));
      t = (q[2] + ' ' + q[3]).trim();
    }
  } else {
    const tail = t.match(/^(.+?)\s*(?:x\s*(\d+)|\((\d+)\))$/i);
    if (tail) {
      t = tail[1];
      qty = parseInt(tail[2] || tail[3], 10);
    }
  }
  t = t.replace(ARTICLES, '').trim();
  if (!t) return null;
  return { name: t.charAt(0).toUpperCase() + t.slice(1), qty, unit };
}

// Découpe une saisie libre en plusieurs articles.
export function parseInput(text) {
  return String(text)
    .split(/\n|,|;|\s+et\s+|\s+puis\s+|\s+\+\s+/i)
    .map((s) => s.trim())
    .filter(Boolean)
    .map(parseOne)
    .filter(Boolean);
}

export function categorize(name, overrides = {}) {
  const key = overrideKey(name);
  if (overrides[key]) return overrides[key];
  const p = findProduct(name);
  return p ? p.cat : 'au';
}

export function overrideKey(name) {
  return canon(name).replace(/[.#$/\[\]]/g, '_') || '_';
}

// Fourchette de prix d'une ligne (avant indice magasin).
export function priceRange(item) {
  const p = findProduct(item.name);
  let min, max, factor = 1;
  if (p) {
    min = p.min; max = p.max;
    const q = item.qty || 1;
    if (p.unit === 'kg') {
      if (item.unit === 'kg') factor = q;
      else if (item.unit === 'g') factor = q / 1000;
      else if (item.qty) factor = q * 0.25; // ex. "3 courgettes" si prix au kg : ~250 g pièce
      else factor = 0.6; // portion habituelle
    } else if (p.unit === 'l') {
      if (item.unit === 'l') factor = q;
      else if (item.unit === 'cl') factor = q / 100;
      else if (item.unit === 'ml') factor = q / 1000;
      else factor = q;
    } else {
      factor = item.unit === 'g' || item.unit === 'kg' ? 1 : q;
    }
  } else {
    [min, max] = CAT_DEFAULT[item.cat] || CAT_DEFAULT.au;
    factor = item.qty && !item.unit ? item.qty : 1;
  }
  factor = Math.max(factor, 0.1);
  return { min: min * factor, max: max * factor, known: !!p };
}

export function budget(items, storeId) {
  const idx = (STORE[storeId] || STORE.carrefour).idx;
  let min = 0, max = 0, unknown = 0;
  const byCat = {};
  for (const it of items) {
    const r = priceRange(it);
    if (!r.known) unknown++;
    min += r.min; max += r.max;
    byCat[it.cat] = (byCat[it.cat] || 0) + (r.min + r.max) / 2;
  }
  return {
    min: roundBudget(min * idx * 0.95, Math.floor),
    max: roundBudget(max * idx * 1.05, Math.ceil),
    unknown,
    byCat: Object.fromEntries(Object.entries(byCat).map(([k, v]) => [k, v * idx])),
  };
}

function roundBudget(v, f) {
  return v < 10 ? Math.round(v * 2) / 2 : f(v);
}

export function formatQty(it) {
  if (!it.qty) return '';
  const n = Number.isInteger(it.qty) ? it.qty : it.qty.toString().replace('.', ',');
  return it.unit ? `${n} ${it.unit}` : `× ${n}`;
}
