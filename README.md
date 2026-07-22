# ComptaMaster IFIP

Application de révision de la comptabilité et de l’analyse financière pour les concours d’inspecteur des Finances publiques et d’inspecteur des douanes.

## Contenu

- plan de navigation strictement aligné sur le programme officiel DGFiP ;
- 59 leçons issues du manuel 2026 ;
- 300 définitions réparties comme le lexique : 210 en comptabilité générale, 37 en comptabilité de gestion et 53 en analyse financière ;
- 43 formules : 40 formules de calcul et 3 égalités comptables fondamentales ;
- lecture vocale française avec sélection automatique de la meilleure voix disponible ;
- flashcards, QCM dans les deux sens, textes à trous réglables de 1 à 5 trous et formules à trous ;
- suivi local de la progression, cartes connues et cartes faibles ;
- thème clair/sombre, interface mobile et fonctionnement hors ligne (PWA).

## Lancer localement

L’application est entièrement statique et ne nécessite ni compte, ni base de données, ni clé d’API.

```bash
python3 -m http.server 4173 --directory app
```

Ouvrir ensuite `http://localhost:4173`.

## Déploiement

Le workflow `.github/workflows/pages.yml` publie automatiquement le dossier `app` sur GitHub Pages à chaque mise à jour de la branche `main`.

Pour Cloudflare Pages : sélectionner ce dépôt, ne renseigner aucune commande de build et utiliser `app` comme dossier de sortie.

## Sources de contenu

- programme officiel de l’épreuve écrite n° 2 d’admissibilité, option « Comptabilité et analyse financière » ;
- *Manuel complet de comptabilité et d’analyse financière - Concours 2026* ;
- *Lexique essentiel - Comptabilité et analyse financière - Référentiel français 2026*.

Les données sont embarquées dans l’application : elles restent disponibles hors connexion et ne sont envoyées à aucun serveur.
