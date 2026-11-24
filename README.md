# Panier : courses et repas du foyer

Application web installable sur téléphone (PWA), hébergée gratuitement sur GitHub Pages.

- **Liste de courses rangée par rayon.** On tape (ou on dicte) en vrac, par exemple « j'ai envie de courgettes, pizza, 2 pâtes à pizza et du surgelé ». Chaque article part dans le bon rayon (fruits et légumes, crèmerie, surgelés, etc.). Si un article est mal rangé, on change son rayon et l'appli s'en souvient.
- **Budget estimé** sous forme de fourchette, selon le magasin choisi (Lidl, Aldi, Leclerc, Carrefour, Monoprix…). Avec une clé API Claude, le bouton « Prix réels (web) » cherche les prix actuels sur internet.
- **Frigo et recettes.** On note ce qui reste dans le frigo et l'appli propose des plats (2 personnes par défaut, réglable), avec les ingrédients, toutes les étapes et une astuce. Un bouton ajoute les ingrédients manquants à la liste.
  - *Carnet* : 22 recettes intégrées, sans connexion ni clé.
  - *Idées IA* : 3 recettes inventées à partir de n'importe quels ingrédients (clé API Claude nécessaire).
- **Partagée avec le foyer** : tout le monde voit la même liste en temps réel (avec Firebase, gratuit).
- Fonctionne hors connexion. Thème clair ou sombre selon le téléphone.

Aucune installation, aucun outil de build : ce sont des fichiers HTML, CSS et JS statiques.

---

## 1. Mettre l'appli en ligne sur GitHub Pages

1. Crée un dépôt sur GitHub (par exemple `panier`). Il peut être public ou privé, mais Pages sur un dépôt privé demande un compte payant.
2. Envoie les fichiers de ce dossier :
   ```powershell
   git init
   git add .
   git commit -m "Première version de Panier"
   git branch -M main
   git remote add origin https://github.com/TON-COMPTE/panier.git
   git push -u origin main
   ```
3. Sur GitHub : **Settings → Pages → Build and deployment → Source : Deploy from a branch**, branche `main`, dossier `/ (root)`, puis **Save**.
4. Une à deux minutes plus tard, l'appli est disponible à l'adresse `https://TON-COMPTE.github.io/panier/`.

### Installer l'appli sur le téléphone
- **Android (Chrome)** : ouvrir l'adresse, menu ⋮ puis **Ajouter à l'écran d'accueil** (ou **Installer l'application**).
- **iPhone (Safari)** : ouvrir l'adresse, bouton Partager puis **Sur l'écran d'accueil**.

## 2. Partager la liste avec le foyer (Firebase, gratuit)

Sans cette étape, chaque téléphone garde sa propre liste.

1. Va sur <https://console.firebase.google.com>, puis **Créer un projet** (Google Analytics n'est pas utile).
2. Menu **Créer → Realtime Database → Créer une base de données**, emplacement **europe-west1 (Belgique)**, démarrer en **mode verrouillé**.
3. Onglet **Règles** : colle ces règles puis **Publier**.
   ```json
   {
     "rules": {
       ".read": false,
       ".write": false,
       "foyers": {
         "$foyer": {
           ".read": "$foyer.length >= 6",
           ".write": "$foyer.length >= 6"
         }
       }
     }
   }
   ```
   La liste complète des foyers reste illisible : seul quelqu'un qui connaît le code exact de votre foyer peut lire votre liste ou y écrire.
4. Copie l'adresse de la base, affichée en haut de l'onglet **Données** (elle ressemble à `https://panier-xxxx-default-rtdb.europe-west1.firebasedatabase.app`).
5. Dans l'appli, ouvre **Réglages → Foyer partagé**, colle l'adresse, choisis un **code foyer** difficile à deviner (par exemple `maison-martin-8q3z`) puis appuie sur **Connecter**.
6. Fais la même chose sur chaque téléphone du foyer, **avec la même adresse et le même code**.

La pastille en haut à droite affiche **Foyer** quand la synchro fonctionne. Les modifications faites hors connexion sont envoyées au retour du réseau.

> Niveau de sécurité : le code foyer joue le rôle de mot de passe partagé. C'est suffisant pour une liste de courses. N'y mets pas de données sensibles.

## 3. Activer l'IA (facultatif)

1. Crée une clé sur <https://platform.claude.com> (**API Keys**) et ajoute un peu de crédit.
2. Dans **Réglages → Intelligence artificielle**, colle la clé puis enregistre.

La clé reste **uniquement sur ce téléphone**. Elle n'est jamais synchronisée avec le foyer ni envoyée sur GitHub. Chaque membre du foyer peut saisir la sienne, ou la même.

Coût indicatif : quelques centimes par série de recettes ou par estimation de prix. Le modèle **Haiku 5.5** coûte le moins cher ; **Opus 5.5**, choisi par défaut, donne les meilleures recettes.

## Comment le budget est calculé

- Chaque produit connu (environ 250 dans `js/catalog.js`) a une fourchette de prix moyen en France, au format d'achat habituel (à la pièce, au kilo, au paquet…). Les quantités saisies sont prises en compte (« 2 kg de pommes », « 6 œufs »).
- Un **indice par enseigne** est ensuite appliqué : par exemple Lidl ≈ 0,84 et Monoprix ≈ 1,25 par rapport à un hypermarché classique.
- Un article inconnu reçoit la fourchette moyenne de son rayon.

C'est une **estimation**, pas un ticket de caisse. Les enseignes ne publient pas d'API de prix, et une page web hébergée sur GitHub ne peut pas lire directement leurs sites. Pour des prix à jour, utilise le bouton **Prix réels (web)** : il passe par l'IA avec recherche internet.

Pour corriger un prix ou ajouter un produit, modifie la liste `RAW` dans `js/catalog.js` (une ligne par produit : `rayon;nom/synonyme;prix min;prix max;unité`).

## Structure

```
index.html            page unique
css/styles.css        styles (clair / sombre)
js/app.js             interface : courses, frigo, recettes, réglages
js/catalog.js         rayons, produits, prix, lecture du texte saisi
js/recipes-data.js    carnet de recettes intégré
js/store.js           stockage local et synchro Firebase (API REST, sans SDK)
js/ai.js              appels à Claude (recettes et prix)
js/icons.js           icônes SVG
sw.js                 fonctionnement hors ligne
manifest.webmanifest  installation sur téléphone
```

## Tester en local

Les modules JavaScript ne fonctionnent pas en ouvrant `index.html` par double-clic. Lance plutôt un petit serveur dans le dossier :

```powershell
npx --yes http-server -p 5173 -c-1
```

Ouvre ensuite <http://localhost:5173>.
