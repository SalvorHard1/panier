// Carnet de recettes intégré (pour 2 personnes). Fonctionne sans connexion ni clé API.
// i : [nom affiché, quantité, statut]  statut : '' = ingrédient principal, 'p' = placard (supposé présent), 'o' = optionnel
// m : mots-clés de correspondance avec le frigo (si différent du nom)

const R = (id, title, time, level, tags, i, steps, tip) => ({
  id, title, time, level, tags, servings: 2,
  ingredients: i.map(([n, q, s = '', m]) => ({ name: n, qty: q, pantry: s === 'p', optional: s === 'o', match: m || n })),
  steps, tip,
});

export const RECIPES = [
  R('courgette-gratin', 'Gratin de courgettes au fromage', 45, 'Facile', ['four', 'végétarien'], [
    ['Courgettes', '3'], ['Œufs', '2', '', 'oeuf'], ['Crème fraîche', '15 cl', '', 'creme'], ['Fromage râpé', '60 g', '', 'fromage/emmental/gruyere/rape/comte/parmesan'],
    ['Ail', '1 gousse', 'p'], ['Sel, poivre, muscade', '', 'p'], ['Huile d\'olive', '1 c. à soupe', 'p'],
  ], [
    'Préchauffer le four à 200 °C (th. 6-7).',
    'Laver les courgettes, les couper en rondelles de 5 mm.',
    'Les faire revenir 8 min à la poêle dans l\'huile avec l\'ail écrasé, saler. Égoutter pour enlever l\'eau rendue.',
    'Battre les œufs avec la crème, la moitié du fromage, du poivre et une pincée de muscade.',
    'Disposer les courgettes dans un plat beurré, verser l\'appareil, parsemer du reste de fromage.',
    'Enfourner 25 min jusqu\'à ce que le dessus soit bien doré.',
  ], 'Bien égoutter les courgettes avant de les mettre au four : c\'est ce qui évite un gratin noyé.'),

  R('courgette-pates', 'Pâtes crémeuses courgettes & citron', 20, 'Facile', ['rapide', 'végétarien'], [
    ['Pâtes', '200 g', '', 'pate/spaghetti/penne/tagliatelle/fusilli'], ['Courgettes', '2'], ['Citron', '1', 'o'], ['Parmesan', '40 g', 'o', 'parmesan/fromage'],
    ['Ail', '1 gousse', 'p'], ['Huile d\'olive', '2 c. à soupe', 'p'], ['Sel, poivre', '', 'p'],
  ], [
    'Mettre à bouillir une grande casserole d\'eau salée.',
    'Râper les courgettes (gros trous) ou les tailler en petits dés.',
    'Faire suer l\'ail émincé dans l\'huile 1 min, ajouter les courgettes, cuire 6-7 min à feu vif en remuant.',
    'Cuire les pâtes al dente. Garder une louche d\'eau de cuisson.',
    'Mélanger pâtes, courgettes, zeste et jus d\'un demi-citron, parmesan et un peu d\'eau de cuisson pour rendre crémeux.',
    'Poivrer généreusement et servir aussitôt.',
  ], 'L\'eau de cuisson des pâtes (amidon) lie la sauce sans ajouter de crème.'),

  R('ratatouille', 'Ratatouille rapide', 50, 'Facile', ['végétarien', 'mijoté'], [
    ['Courgette', '1'], ['Aubergine', '1'], ['Poivron', '1'], ['Tomates', '3', '', 'tomate'], ['Oignon', '1'],
    ['Ail', '2 gousses', 'p'], ['Herbes de Provence', '1 c. à café', 'p'], ['Huile d\'olive', '3 c. à soupe', 'p'],
  ], [
    'Couper tous les légumes en dés de 1,5 cm, émincer l\'oignon et l\'ail.',
    'Dans une cocotte, faire revenir l\'oignon 3 min dans l\'huile.',
    'Ajouter aubergine et poivron, cuire 8 min en remuant.',
    'Ajouter courgette, tomates, ail et herbes. Saler, poivrer.',
    'Couvrir et laisser mijoter 25 min à feu doux, puis 5 min à découvert pour réduire.',
  ], 'Encore meilleure le lendemain. Servir avec du riz, de la semoule ou un œuf au plat.'),

  R('omelette', 'Omelette baveuse aux champignons', 15, 'Facile', ['rapide', 'végétarien'], [
    ['Œufs', '5', '', 'oeuf'], ['Champignons', '200 g', '', 'champignon'], ['Fromage râpé', '30 g', 'o', 'fromage/rape/emmental/comte'],
    ['Persil ou ciboulette', '', 'o', 'persil/ciboulette/herbes'], ['Beurre', '20 g', 'p'], ['Sel, poivre', '', 'p'],
  ], [
    'Émincer les champignons et les faire dorer 5 min au beurre à feu vif. Saler, réserver.',
    'Battre les œufs avec sel, poivre et herbes ciselées.',
    'Dans la même poêle, faire mousser un peu de beurre, verser les œufs.',
    'Ramener les bords vers le centre avec une spatule pendant 1 min, puis laisser prendre 1 min.',
    'Ajouter champignons et fromage sur une moitié, plier, servir tant que le cœur est encore baveux.',
  ], 'Feu moyen et poêle bien chaude : l\'omelette doit cuire en 2-3 min maximum.'),

  R('poulet-curry', 'Poulet au curry et lait de coco', 35, 'Facile', ['plat complet'], [
    ['Blancs de poulet', '2', '', 'poulet'], ['Lait de coco', '20 cl', '', 'lait coco/coco'], ['Oignon', '1'], ['Riz', '150 g', 'o', 'riz'],
    ['Curry en poudre', '1 c. à soupe', 'p'], ['Ail', '1 gousse', 'p'], ['Gingembre', '1 cm', 'o'], ['Huile', '1 c. à soupe', 'p'],
  ], [
    'Lancer la cuisson du riz selon le paquet.',
    'Couper le poulet en morceaux, émincer l\'oignon, l\'ail et le gingembre.',
    'Faire dorer le poulet 4 min dans l\'huile, réserver.',
    'Dans la même poêle, faire fondre l\'oignon 4 min, ajouter ail, gingembre et curry, remuer 1 min.',
    'Verser le lait de coco, remettre le poulet, saler, laisser mijoter 12 min à feu doux.',
    'Servir avec le riz, éventuellement avec un filet de citron vert ou de la coriandre.',
  ], 'Faire griller le curry 1 min avant de mouiller : il développe beaucoup plus d\'arômes.'),

  R('poulet-legumes-four', 'Poulet rôti et légumes au four', 55, 'Facile', ['four', 'plat complet'], [
    ['Cuisses de poulet', '2', '', 'poulet/cuisse poulet/pilon'], ['Pommes de terre', '400 g', '', 'pomme terre/patate'], ['Carottes', '2', '', 'carotte'],
    ['Oignon', '1', 'o'], ['Thym ou herbes de Provence', '', 'p'], ['Huile d\'olive', '3 c. à soupe', 'p'], ['Sel, poivre', '', 'p'],
  ], [
    'Préchauffer le four à 210 °C.',
    'Couper pommes de terre et carottes en morceaux, l\'oignon en quartiers.',
    'Mélanger les légumes avec 2 c. à soupe d\'huile, sel, poivre et herbes dans un grand plat.',
    'Poser les cuisses de poulet dessus, peau vers le haut, badigeonner d\'huile, saler.',
    'Enfourner 45 min en arrosant une fois à mi-cuisson. La peau doit être croustillante.',
  ], 'Le jus du poulet parfume les légumes en dessous : ne pas les couvrir de papier alu.'),

  R('pizza-maison', 'Pizza maison express', 25, 'Facile', ['four'], [
    ['Pâte à pizza', '1 rouleau', '', 'pate pizza'], ['Sauce tomate', '4 c. à soupe', '', 'sauce tomate/coulis/passata/concentre'], ['Mozzarella', '1 boule', '', 'mozzarella/fromage/rape'],
    ['Jambon', '2 tranches', 'o'], ['Champignons', '100 g', 'o', 'champignon'], ['Olives', '', 'o', 'olive'], ['Origan', '', 'p'], ['Huile d\'olive', '', 'p'],
  ], [
    'Préchauffer le four au maximum (250 °C), avec la plaque à l\'intérieur si possible.',
    'Dérouler la pâte sur son papier, étaler la sauce tomate en laissant 1 cm de bord.',
    'Répartir la mozzarella égouttée et déchirée, puis les garnitures.',
    'Parsemer d\'origan, filet d\'huile d\'olive.',
    'Glisser sur la plaque chaude, cuire 10 à 12 min jusqu\'à ce que les bords soient dorés.',
  ], 'Plaque préchauffée = dessous croustillant, comme au four à pizza.'),

  R('quiche', 'Quiche aux légumes du frigo', 50, 'Moyen', ['four', 'anti-gaspi'], [
    ['Pâte brisée', '1 rouleau', '', 'pate brisee/pate feuilletee'], ['Œufs', '3', '', 'oeuf'], ['Crème ou lait', '20 cl', '', 'creme/lait'],
    ['Légumes au choix (poireau, courgette, épinard…)', '300 g', '', 'poireau/courgette/epinard/brocoli/champignon/poivron'],
    ['Lardons', '100 g', 'o', 'lardon'], ['Fromage râpé', '50 g', 'o', 'fromage/rape/emmental/comte'], ['Muscade, sel, poivre', '', 'p'],
  ], [
    'Préchauffer le four à 190 °C. Foncer un moule avec la pâte, piquer le fond.',
    'Émincer les légumes, les faire revenir 8 à 10 min pour évaporer l\'eau (avec les lardons si utilisés).',
    'Battre œufs, crème, sel, poivre, muscade.',
    'Répartir les légumes sur la pâte, verser l\'appareil, parsemer de fromage.',
    'Cuire 30 à 35 min. La quiche est prête quand le centre ne tremble plus.',
  ], 'Parfaite pour vider le bac à légumes : presque tous les légumes fonctionnent.'),

  R('risotto-champignons', 'Risotto aux champignons', 35, 'Moyen', ['végétarien'], [
    ['Riz (arborio idéalement)', '160 g', '', 'riz'], ['Champignons', '250 g', '', 'champignon'], ['Oignon ou échalote', '1', '', 'oignon/echalote'],
    ['Parmesan', '40 g', '', 'parmesan/fromage'], ['Bouillon de légumes', '75 cl', 'p'], ['Vin blanc', '10 cl', 'o', 'vin'], ['Beurre', '30 g', 'p'],
  ], [
    'Faire chauffer le bouillon et le garder frémissant.',
    'Faire dorer les champignons émincés dans un peu de beurre, réserver.',
    'Faire suer l\'oignon ciselé dans le beurre 3 min, ajouter le riz et le nacrer 2 min (il devient translucide).',
    'Déglacer au vin blanc si utilisé, laisser absorber.',
    'Ajouter le bouillon louche par louche en remuant, en attendant qu\'il soit absorbé à chaque fois (environ 18 min).',
    'Hors du feu, incorporer champignons, parmesan et une noix de beurre. Couvrir 2 min avant de servir.',
  ], 'Le risotto doit rester "ondulant" à la fin : ajouter une demi-louche de bouillon si besoin.'),

  R('saumon-papillote', 'Saumon en papillote, légumes croquants', 30, 'Facile', ['four', 'léger'], [
    ['Pavés de saumon', '2', '', 'saumon/poisson/cabillaud'], ['Courgette ou poireau', '1', '', 'courgette/poireau/fenouil/carotte'], ['Citron', '1', '', 'citron'],
    ['Aneth ou persil', '', 'o', 'aneth/persil/herbes'], ['Huile d\'olive', '1 c. à soupe', 'p'], ['Sel, poivre', '', 'p'],
  ], [
    'Préchauffer le four à 200 °C.',
    'Tailler le légume en fines lanières (éplucheur) ou rondelles fines.',
    'Sur deux grandes feuilles de papier cuisson, poser les légumes, puis le saumon. Saler, poivrer.',
    'Ajouter rondelles de citron, herbes et un filet d\'huile. Fermer les papillotes hermétiquement.',
    'Cuire 15 à 18 min. Ouvrir à table.',
  ], 'Accompagner de riz ou de pommes de terre vapeur.'),

  R('pates-carbonara', 'Pâtes carbonara (la vraie, sans crème)', 20, 'Moyen', ['rapide'], [
    ['Spaghetti', '200 g', '', 'pate/spaghetti'], ['Lardons ou pancetta', '120 g', '', 'lardon'], ['Jaunes d\'œufs', '3', '', 'oeuf'],
    ['Parmesan ou pecorino', '50 g', '', 'parmesan/fromage'], ['Poivre noir', '', 'p'],
  ], [
    'Cuire les pâtes dans une grande eau salée.',
    'Faire dorer les lardons à sec dans une poêle, couper le feu.',
    'Mélanger jaunes d\'œufs, fromage râpé et beaucoup de poivre dans un bol.',
    'Égoutter les pâtes en gardant un verre d\'eau de cuisson, les verser dans la poêle hors du feu.',
    'Ajouter le mélange œufs-fromage et 3-4 c. à soupe d\'eau de cuisson, mélanger vivement : la sauce doit devenir crémeuse sans cuire les œufs.',
  ], 'Toujours hors du feu, sinon les œufs se transforment en omelette.'),

  R('bolognaise', 'Spaghetti bolognaise', 45, 'Facile', ['plat complet'], [
    ['Viande hachée', '250 g', '', 'viande hachee/hache/steak hache/boeuf'], ['Spaghetti', '200 g', '', 'pate/spaghetti'], ['Tomates concassées ou coulis', '400 g', '', 'tomate pelee/concassee/sauce tomate/coulis/passata/tomate'],
    ['Oignon', '1'], ['Carotte', '1', 'o'], ['Ail', '1 gousse', 'p'], ['Huile d\'olive', '', 'p'], ['Parmesan', '', 'o', 'parmesan/fromage'],
  ], [
    'Hacher finement oignon, carotte et ail.',
    'Les faire revenir 5 min dans l\'huile.',
    'Ajouter la viande, l\'émietter et la faire dorer 5 min.',
    'Verser les tomates, saler, poivrer, ajouter une pincée de sucre. Mijoter 25 min à couvert.',
    'Cuire les pâtes, mélanger avec la sauce, servir avec du parmesan.',
  ], 'Doubler les quantités et congeler la moitié de la sauce : un repas d\'avance.'),

  R('chili', 'Chili con carne', 50, 'Facile', ['plat complet', 'épicé'], [
    ['Viande hachée', '250 g', '', 'viande hachee/hache/boeuf/steak hache'], ['Haricots rouges', '1 boîte', '', 'haricot rouge'], ['Tomates concassées', '400 g', '', 'tomate pelee/concassee/tomate/coulis'],
    ['Oignon', '1'], ['Poivron', '1', 'o'], ['Maïs', '1 petite boîte', 'o', 'mais'], ['Cumin, paprika, piment', '', 'p'], ['Riz', '150 g', 'o', 'riz'],
  ], [
    'Émincer l\'oignon et le poivron, les faire revenir 5 min.',
    'Ajouter la viande et les épices (1 c. à café de cumin, 1 de paprika, piment selon goût), cuire 5 min.',
    'Ajouter les tomates, saler, mijoter 20 min.',
    'Ajouter haricots rouges rincés et maïs, cuire encore 10 min.',
    'Servir avec du riz, éventuellement de la crème fraîche et de la coriandre.',
  ], 'Version végétarienne : remplacer la viande par des lentilles corail.'),

  R('dahl', 'Dahl de lentilles corail', 30, 'Facile', ['végétarien', 'économique'], [
    ['Lentilles corail', '150 g', '', 'lentille'], ['Lait de coco', '20 cl', '', 'lait coco/coco'], ['Tomates concassées', '200 g', '', 'tomate'],
    ['Oignon', '1'], ['Curry, cumin, curcuma', '', 'p'], ['Ail, gingembre', '', 'p'], ['Épinards', '1 poignée', 'o', 'epinard/pousse epinard'],
  ], [
    'Rincer les lentilles.',
    'Faire revenir l\'oignon émincé 4 min, ajouter ail, gingembre et épices, 1 min.',
    'Ajouter lentilles, tomates, lait de coco et 30 cl d\'eau. Saler.',
    'Cuire 18-20 min à feu doux en remuant, jusqu\'à ce que les lentilles soient fondantes.',
    'Ajouter les épinards à la fin. Servir avec du riz ou du pain naan.',
  ], 'Un filet de citron au moment de servir réveille tout le plat.'),

  R('soupe-legumes', 'Velouté de légumes du frigo', 35, 'Facile', ['anti-gaspi', 'végétarien'], [
    ['Légumes au choix (carotte, courgette, poireau, potiron…)', '600 g', '', 'carotte/courgette/poireau/potiron/potimarron/butternut/brocoli/chou-fleur/navet/celeri'],
    ['Pomme de terre', '1', 'o', 'pomme terre/patate'], ['Oignon', '1', 'o'], ['Bouillon', '1 cube', 'p'], ['Crème ou fromage frais', '', 'o', 'creme/fromage'],
  ], [
    'Éplucher et couper les légumes en morceaux.',
    'Faire suer l\'oignon dans un peu d\'huile ou de beurre.',
    'Ajouter les légumes, couvrir d\'eau à hauteur, ajouter le cube de bouillon.',
    'Cuire 20 à 25 min jusqu\'à ce que tout soit tendre.',
    'Mixer, ajuster l\'assaisonnement, ajouter une cuillère de crème.',
  ], 'La pomme de terre rend le velouté plus onctueux sans crème.'),

  R('croque', 'Croque-monsieur au four et salade', 20, 'Facile', ['rapide'], [
    ['Pain de mie', '4 tranches', '', 'pain mie/pain'], ['Jambon', '2 tranches', '', 'jambon'], ['Fromage râpé', '60 g', '', 'fromage/emmental/gruyere/rape/comte'],
    ['Beurre', '', 'p'], ['Crème fraîche', '2 c. à soupe', 'o', 'creme'], ['Salade', '', 'o', 'salade/mache/roquette'],
  ], [
    'Préchauffer le four à 220 °C (ou grill).',
    'Beurrer les tranches de pain sur une face.',
    'Monter : pain (beurre à l\'extérieur), jambon, fromage, pain.',
    'Mélanger crème et un peu de fromage, tartiner le dessus.',
    'Cuire 10 min jusqu\'à ce que ce soit doré. Servir avec une salade.',
  ], 'Un œuf au plat sur le dessus et ça devient un croque-madame.'),

  R('shakshuka', 'Shakshuka (œufs pochés à la tomate)', 30, 'Facile', ['végétarien'], [
    ['Œufs', '4', '', 'oeuf'], ['Tomates ou tomates concassées', '400 g', '', 'tomate'], ['Poivron', '1', '', 'poivron'], ['Oignon', '1'],
    ['Cumin, paprika', '', 'p'], ['Feta', '50 g', 'o', 'feta/chevre'], ['Pain', '', 'o', 'pain/baguette'],
  ], [
    'Faire revenir oignon et poivron émincés 6 min.',
    'Ajouter ail, cumin, paprika, puis les tomates. Saler, mijoter 10 min.',
    'Creuser 4 puits dans la sauce, y casser les œufs.',
    'Couvrir et cuire 6 à 8 min : le blanc doit être pris, le jaune coulant.',
    'Émietter la feta, servir dans la poêle avec du pain.',
  ], 'Idéal pour un brunch ou un dîner rapide.'),

  R('salade-composee', 'Salade complète thon, œuf, pommes de terre', 25, 'Facile', ['froid', 'léger'], [
    ['Pommes de terre', '300 g', '', 'pomme terre/patate'], ['Œufs', '2', '', 'oeuf'], ['Thon', '1 boîte', '', 'thon'],
    ['Tomates', '2', 'o', 'tomate/tomate cerise'], ['Salade', '', 'o', 'salade/mache/roquette'], ['Olives', '', 'o', 'olive'], ['Vinaigrette (huile, vinaigre, moutarde)', '', 'p'],
  ], [
    'Cuire les pommes de terre 20 min à l\'eau salée, les œufs 9 min (durs).',
    'Refroidir, éplucher, couper en morceaux.',
    'Préparer la vinaigrette : 1 c. de moutarde, 1 c. de vinaigre, 3 c. d\'huile, sel, poivre.',
    'Assembler salade, pommes de terre, tomates, thon émietté, œufs et olives. Arroser de vinaigrette.',
  ], 'Assaisonner les pommes de terre encore tièdes : elles absorbent mieux la vinaigrette.'),

  R('wok', 'Wok de nouilles aux légumes', 20, 'Facile', ['rapide'], [
    ['Nouilles', '150 g', '', 'nouille/pate/ramen'], ['Légumes (carotte, poivron, brocoli, chou…)', '300 g', '', 'carotte/poivron/brocoli/chou/courgette/champignon'],
    ['Poulet ou crevettes', '200 g', 'o', 'poulet/crevette/tofu'], ['Sauce soja', '3 c. à soupe', 'p'], ['Ail, gingembre', '', 'p'], ['Œuf', '1', 'o', 'oeuf'],
  ], [
    'Cuire les nouilles selon le paquet, rincer à l\'eau froide.',
    'Tailler les légumes en fines lanières, la viande en lamelles.',
    'Saisir la viande à feu très vif dans un peu d\'huile 3 min, réserver.',
    'Saisir les légumes avec ail et gingembre 4 min : ils doivent rester croquants.',
    'Ajouter nouilles, viande, sauce soja, mélanger 2 min sur feu vif. Option : pousser sur le côté et brouiller un œuf.',
  ], 'Tout préparer avant d\'allumer le feu : la cuisson au wok va très vite.'),

  R('gratin-dauphinois', 'Gratin dauphinois', 75, 'Facile', ['four'], [
    ['Pommes de terre', '600 g', '', 'pomme terre/patate'], ['Lait', '30 cl', '', 'lait'], ['Crème', '20 cl', '', 'creme'],
    ['Ail', '1 gousse', 'p'], ['Muscade, sel, poivre', '', 'p'], ['Beurre', '', 'p'],
  ], [
    'Préchauffer le four à 160 °C. Frotter un plat avec l\'ail puis le beurrer.',
    'Éplucher et couper les pommes de terre en rondelles fines (3 mm), sans les laver.',
    'Porter lait et crème à frémissement avec sel, poivre, muscade, y cuire les rondelles 10 min en remuant.',
    'Verser dans le plat et enfourner 1 h, jusqu\'à ce que le dessus soit doré et le couteau entre sans résistance.',
  ], 'Ne pas rincer les pommes de terre : leur amidon fait la texture fondante.'),

  R('crepes', 'Crêpes salées ou sucrées', 40, 'Facile', ['dessert', 'économique'], [
    ['Farine', '125 g', '', 'farine'], ['Œufs', '2', '', 'oeuf'], ['Lait', '25 cl', '', 'lait'], ['Beurre', '20 g', 'p'],
    ['Garniture : jambon, fromage, sucre, confiture…', '', 'o', 'jambon/fromage/confiture/pate tartiner/chocolat'],
  ], [
    'Mettre la farine dans un saladier, creuser un puits, ajouter les œufs et une pincée de sel.',
    'Verser le lait petit à petit en fouettant pour éviter les grumeaux, ajouter le beurre fondu.',
    'Laisser reposer 30 min si possible.',
    'Cuire les crêpes dans une poêle chaude légèrement graissée, 1 min de chaque côté.',
    'Garnir selon les envies.',
  ], 'Remplacer 5 cl de lait par de la bière pour des crêpes plus légères.'),

  R('compote-crumble', 'Crumble aux fruits', 45, 'Facile', ['dessert', 'four', 'anti-gaspi'], [
    ['Fruits (pommes, poires, fruits rouges…)', '500 g', '', 'pomme/poire/fruit rouge/framboise/myrtille/peche/abricot/banane'], ['Farine', '75 g', '', 'farine'],
    ['Beurre', '60 g', '', 'beurre'], ['Sucre', '60 g', 'p'], ['Cannelle', '', 'o'],
  ], [
    'Préchauffer le four à 180 °C.',
    'Couper les fruits en morceaux, les mettre dans un plat avec un peu de sucre et de cannelle.',
    'Sabler du bout des doigts la farine, le sucre et le beurre froid en dés.',
    'Répartir la pâte sablée sur les fruits.',
    'Cuire 30 min jusqu\'à ce que le dessus soit doré.',
  ], 'Les fruits un peu trop mûrs sont parfaits pour le crumble.'),
];
