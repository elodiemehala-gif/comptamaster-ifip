export const FORMULA_DETAILS = {
  F01: {
    expandedExpression: 'Actif = capitaux propres + dettes envers les tiers',
    explanation: 'Tout ce que l’entreprise possède ou contrôle est financé soit par ses propriétaires, soit par des tiers. Les deux côtés du bilan sont donc toujours égaux.',
    terms: [],
  },
  F02: {
    expandedExpression: 'Résultat = produits - charges',
    explanation: 'On compare les richesses créées pendant l’exercice aux ressources consommées. Un résultat positif est un bénéfice ; un résultat négatif est une perte.',
    terms: [],
  },
  F03: {
    expandedExpression: 'Patrimoine net simplifié = actif - dettes',
    explanation: 'Cette égalité mesure ce qu’il resterait théoriquement aux propriétaires après avoir utilisé les actifs pour rembourser toutes les dettes.',
    terms: [],
  },
  F04: {
    expandedExpression: 'Net commercial = montant brut × produit des (1 - taux de rabais, remises et ristournes)',
    explanation: 'Chaque réduction commerciale successive s’applique au montant déjà réduit. On multiplie donc les coefficients de réduction au lieu d’additionner directement les taux.',
    terms: ['RRR : rabais, remises et ristournes'],
  },
  F05: {
    expandedExpression: 'Taxe sur la valeur ajoutée = base hors taxes × taux de taxe sur la valeur ajoutée',
    explanation: 'La taxe facturée se calcule sur le prix hors taxes. Le taux doit être écrit sous forme décimale : par exemple, 20 % devient 0,20.',
    terms: ['TVA : taxe sur la valeur ajoutée', 'HT : hors taxes'],
  },
  F06: {
    expandedExpression: 'Montant toutes taxes comprises = montant hors taxes + taxe sur la valeur ajoutée',
    explanation: 'Le montant payé par le client réunit le prix du bien ou du service hors taxes et la taxe sur la valeur ajoutée facturée.',
    terms: ['TTC : toutes taxes comprises', 'HT : hors taxes', 'TVA : taxe sur la valeur ajoutée'],
  },
  F07: {
    expandedExpression: 'Intérêt = capital emprunté ou placé × taux d’intérêt × durée',
    explanation: 'L’intérêt simple est proportionnel au capital, au taux et au temps. La durée doit être exprimée dans la même unité que le taux : années avec un taux annuel, mois avec un taux mensuel.',
    terms: [],
  },
  F08: {
    expandedExpression: 'Annuité constante = capital emprunté × taux d’intérêt périodique / [1 - (1 + taux d’intérêt périodique) puissance (- nombre de périodes)]',
    explanation: 'Cette formule donne le paiement identique versé à chaque période pour rembourser à la fois une part du capital et les intérêts. Le taux et le nombre de périodes doivent avoir la même périodicité.',
    terms: ['A : annuité constante', 'C : capital emprunté', 'i : taux d’intérêt par période', 'n : nombre total de périodes'],
  },
  F09: {
    expandedExpression: 'Consommation de stock = stock initial + achats - stock final',
    explanation: 'Les biens disponibles pendant la période correspondent au stock de départ augmenté des achats. Ce qui reste en stock à la fin n’a pas été consommé et doit donc être retiré.',
    terms: [],
  },
  F10: {
    expandedExpression: 'Production stockée = stock final - stock initial',
    explanation: 'Une hausse du stock de produits signifie qu’une partie de la production n’a pas encore été vendue. Une baisse traduit au contraire un déstockage.',
    terms: [],
  },
  F11: {
    expandedExpression: 'Coût unitaire moyen pondéré = (valeur du stock avant l’entrée + valeur de la nouvelle entrée) / quantité totale disponible',
    explanation: 'On additionne la valeur de l’ancien stock et celle de la nouvelle entrée, puis on répartit ce total sur toutes les unités disponibles afin d’obtenir un coût moyen par unité.',
    terms: ['CUMP : coût unitaire moyen pondéré'],
  },
  F12: {
    expandedExpression: 'Coût d’entrée de l’immobilisation = prix net + coûts directement attribuables + taxes non récupérables',
    explanation: 'Le coût comprend le prix d’achat et les dépenses nécessaires pour mettre le bien en état de fonctionner. Les taxes récupérables et les frais sans lien direct sont exclus.',
    terms: [],
  },
  F13: {
    expandedExpression: 'Base amortissable = coût d’entrée - valeur résiduelle',
    explanation: 'Seule la valeur que l’entreprise prévoit de consommer est amortie. La valeur résiduelle estimée à la fin de l’utilisation est donc retirée du coût.',
    terms: [],
  },
  F14: {
    expandedExpression: 'Annuité d’amortissement linéaire = base amortissable / durée d’utilisation × fraction de l’année d’utilisation',
    explanation: 'En mode linéaire, la base amortissable est répartie également sur la durée d’utilisation. La première et la dernière annuité sont ajustées au temps réel d’utilisation.',
    terms: ['Prorata temporis : calcul proportionnel au temps écoulé'],
  },
  F15: {
    expandedExpression: 'Valeur nette comptable = valeur brute - amortissements cumulés - dépréciations cumulées',
    explanation: 'La valeur nette comptable est la valeur encore inscrite au bilan après déduction de la consommation du bien et de ses éventuelles pertes de valeur.',
    terms: ['VNC : valeur nette comptable'],
  },
  F16: {
    expandedExpression: 'Résultat de cession = prix de cession hors taxes - valeur nette comptable du bien cédé',
    explanation: 'Si le prix de vente dépasse la valeur nette comptable, la cession produit un gain. S’il est inférieur, elle produit une perte.',
    terms: ['HT : hors taxes', 'VNC : valeur nette comptable'],
  },
  F17: {
    expandedExpression: 'Coefficient de déduction de la taxe sur la valeur ajoutée = coefficient d’assujettissement × coefficient de taxation × coefficient d’admission',
    explanation: 'Les trois coefficients, compris entre 0 et 1, déterminent la fraction de taxe déductible selon l’usage du bien, l’ouverture du droit à déduction et les exclusions légales.',
    terms: ['TVA : taxe sur la valeur ajoutée'],
  },
  F18: {
    expandedExpression: 'Coût de revient = coût des biens ou services vendus + coût de distribution + autres coûts incorporables',
    explanation: 'Le coût de revient rassemble toutes les charges incorporables supportées pour produire puis vendre le bien ou le service. Il sert notamment à apprécier la marge.',
    terms: [],
  },
  F19: {
    expandedExpression: 'Marge sur coût variable = chiffre d’affaires - charges variables',
    explanation: 'Cette marge indique ce que les ventes laissent après couverture des charges qui varient avec l’activité. Elle doit ensuite absorber les charges fixes.',
    terms: ['MCV : marge sur coût variable'],
  },
  F20: {
    expandedExpression: 'Taux de marge sur coût variable = marge sur coût variable / chiffre d’affaires',
    explanation: 'Ce rapport mesure la part de chaque euro de chiffre d’affaires disponible pour couvrir les charges fixes puis dégager un résultat. On multiplie par 100 pour l’exprimer en pourcentage.',
    terms: ['TMCV : taux de marge sur coût variable', 'MCV : marge sur coût variable'],
  },
  F21: {
    expandedExpression: 'Résultat = marge sur coût variable - charges fixes',
    explanation: 'Après avoir calculé la marge laissée par l’activité, on retire les charges fixes. Le solde obtenu est le résultat selon la méthode du coût variable.',
    terms: ['MCV : marge sur coût variable'],
  },
  F22: {
    expandedExpression: 'Coefficient d’imputation rationnelle = activité réelle / activité normale',
    explanation: 'Ce coefficient compare le niveau d’activité réellement atteint au niveau considéré comme normal. Il sert à neutraliser l’effet de la sous-activité ou de la suractivité sur les coûts fixes.',
    terms: [],
  },
  F23: {
    expandedExpression: 'Charges fixes imputées = charges fixes réelles × coefficient d’imputation rationnelle',
    explanation: 'Seule la part des charges fixes correspondant au niveau d’activité est incorporée aux coûts. L’écart restant constitue un écart d’imputation rationnelle.',
    terms: [],
  },
  F24: {
    expandedExpression: 'Coût marginal = variation du coût total / variation de la quantité produite',
    explanation: 'Le coût marginal mesure le coût supplémentaire provoqué par la production d’une unité ou d’un lot supplémentaire.',
    terms: [],
  },
  F25: {
    expandedExpression: 'Résultat marginal = recette marginale - coût marginal',
    explanation: 'Une production supplémentaire est avantageuse tant que la recette qu’elle apporte dépasse le coût supplémentaire qu’elle entraîne.',
    terms: [],
  },
  F26: {
    expandedExpression: 'Seuil de rentabilité = charges fixes / taux de marge sur coût variable',
    explanation: 'Le seuil de rentabilité est le chiffre d’affaires pour lequel la marge sur coût variable couvre exactement les charges fixes : le résultat est alors nul. Le taux s’utilise sous forme décimale.',
    terms: ['SR : seuil de rentabilité', 'TMCV : taux de marge sur coût variable'],
  },
  F27: {
    expandedExpression: 'Point mort = seuil de rentabilité / chiffre d’affaires annuel × nombre de jours de la période',
    explanation: 'Le point mort traduit le seuil de rentabilité en date ou en nombre de jours. Il indique à quel moment de la période l’entreprise commence théoriquement à réaliser un bénéfice.',
    terms: ['SR : seuil de rentabilité'],
  },
  F28: {
    expandedExpression: 'Marge de sécurité = chiffre d’affaires - seuil de rentabilité',
    explanation: 'Elle mesure de combien le chiffre d’affaires peut diminuer avant que l’entreprise n’atteigne son seuil de rentabilité et ne commence à subir une perte.',
    terms: ['SR : seuil de rentabilité'],
  },
  F29: {
    expandedExpression: 'Indice de sécurité = marge de sécurité / chiffre d’affaires',
    explanation: 'Cet indice exprime la marge de sécurité relativement au chiffre d’affaires. Plus il est élevé, plus l’entreprise dispose d’un coussin avant de devenir déficitaire.',
    terms: [],
  },
  F30: {
    expandedExpression: 'Levier opérationnel = marge sur coût variable / résultat',
    explanation: 'Le levier opérationnel mesure la sensibilité du résultat à une variation du chiffre d’affaires. Il devient très élevé lorsque le résultat est proche de zéro.',
    terms: ['MCV : marge sur coût variable'],
  },
  F31: {
    expandedExpression: 'Marge commerciale = ventes de marchandises - coût d’achat des marchandises vendues',
    explanation: 'Cette marge mesure ce que l’activité de négoce conserve après déduction du coût d’achat des seules marchandises effectivement vendues.',
    terms: [],
  },
  F32: {
    expandedExpression: 'Excédent brut d’exploitation = valeur ajoutée + subventions d’exploitation - impôts et taxes - charges de personnel',
    explanation: 'Cet indicateur mesure la performance de l’activité courante avant amortissements, dépréciations, financement, éléments exceptionnels et impôt sur les bénéfices.',
    terms: ['EBE : excédent brut d’exploitation'],
  },
  F33: {
    expandedExpression: 'Capacité d’autofinancement = résultat net + dotations - reprises - quote-part de subvention transférée au résultat + valeur nette comptable des éléments cédés - prix de cession',
    explanation: 'À partir du résultat net, on neutralise les charges et produits calculés ainsi que les éléments liés aux cessions afin d’approcher la ressource interne générée par l’activité.',
    terms: ['CAF : capacité d’autofinancement', 'VNC : valeur nette comptable'],
  },
  F34: {
    expandedExpression: 'Fonds de roulement net global = ressources stables - emplois stables',
    explanation: 'Il mesure l’excédent de financements durables restant après financement des investissements durables. Cet excédent peut contribuer au financement du cycle d’exploitation.',
    terms: ['FRNG : fonds de roulement net global'],
  },
  F35: {
    expandedExpression: 'Besoin en fonds de roulement = besoin en fonds de roulement d’exploitation + besoin en fonds de roulement hors exploitation',
    explanation: 'Le besoin total réunit le décalage de trésorerie né du cycle d’exploitation et celui des opérations hors exploitation.',
    terms: ['BFR : besoin en fonds de roulement', 'BFRE : besoin en fonds de roulement d’exploitation', 'BFRHE : besoin en fonds de roulement hors exploitation'],
  },
  F36: {
    expandedExpression: 'Trésorerie nette = fonds de roulement net global - besoin en fonds de roulement',
    explanation: 'La trésorerie est positive lorsque les ressources stables disponibles couvrent le besoin du cycle. Elle est négative lorsque ce besoin exige des financements de trésorerie supplémentaires.',
    terms: ['FRNG : fonds de roulement net global', 'BFR : besoin en fonds de roulement'],
  },
  F37: {
    expandedExpression: 'Délai moyen de paiement des clients = créances clients toutes taxes comprises / chiffre d’affaires toutes taxes comprises × 360 jours',
    explanation: 'Ce ratio estime le nombre moyen de jours séparant la vente de son règlement par le client. Les deux montants sont pris toutes taxes comprises pour rester comparables.',
    terms: ['TTC : toutes taxes comprises'],
  },
  F38: {
    expandedExpression: 'Délai moyen de paiement des fournisseurs = dettes fournisseurs toutes taxes comprises / achats toutes taxes comprises × 360 jours',
    explanation: 'Ce ratio estime le nombre moyen de jours mis par l’entreprise pour régler ses fournisseurs. Les montants du numérateur et du dénominateur doivent être comparables.',
    terms: ['TTC : toutes taxes comprises'],
  },
  F39: {
    expandedExpression: 'Durée moyenne de stockage = stock moyen / coût des éléments consommés ou vendus × 360 jours',
    explanation: 'Cette durée estime le temps moyen pendant lequel les biens restent en stock. Le coût utilisé au dénominateur doit correspondre à la catégorie de stock étudiée.',
    terms: [],
  },
  F40: {
    expandedExpression: 'Ratio de liquidité générale = actif circulant / dettes à court terme',
    explanation: 'Ce ratio compare les actifs susceptibles de devenir liquides à court terme aux dettes exigibles à court terme. Il doit être interprété avec la qualité réelle des stocks et créances.',
    terms: [],
  },
  F41: {
    expandedExpression: 'Rentabilité des capitaux propres = résultat net / capitaux propres moyens',
    explanation: 'Ce ratio mesure le rendement comptable obtenu par les propriétaires sur les capitaux qu’ils ont investis. Les capitaux propres moyens sont généralement la moyenne entre le début et la fin de période.',
    terms: ['ROE : return on equity, soit rentabilité des capitaux propres'],
  },
  F42: {
    expandedExpression: 'Flux de trésorerie d’exploitation approché = capacité d’autofinancement - augmentation du besoin en fonds de roulement',
    explanation: 'La capacité d’autofinancement n’est pas entièrement disponible si le cycle d’exploitation consomme davantage de trésorerie. Une baisse du besoin en fonds de roulement augmente au contraire le flux.',
    terms: ['CAF : capacité d’autofinancement', 'BFR : besoin en fonds de roulement'],
  },
  F43: {
    expandedExpression: 'Variation de trésorerie = flux de trésorerie d’exploitation + flux de trésorerie d’investissement + flux de trésorerie de financement',
    explanation: 'La variation globale de trésorerie résulte des encaissements et décaissements liés à l’activité, aux investissements et aux décisions de financement.',
    terms: [],
  },
};
