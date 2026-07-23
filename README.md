# ComptaMaster IFIP

Application de révision de la comptabilité et de l’analyse financière pour les concours d’inspecteur des Finances publiques et d’inspecteur des douanes.

## Contenu

- plan de navigation strictement aligné sur le programme officiel DGFiP ;
- 59 leçons issues du manuel 2026 ;
- 300 définitions réparties comme le lexique : 210 en comptabilité générale, 37 en comptabilité de gestion et 53 en analyse financière ;
- 43 formules : 40 formules de calcul et 3 égalités comptables fondamentales ;
- onglet d’explication des 43 formules, écrites sans abréviation avec le sens de chaque calcul ;
- lecture vocale française avec sélection automatique de la meilleure voix disponible ;
- flashcards, QCM dans les deux sens, réponses libres, définitions complètes à l’écrit ou au micro, textes et formules à trous avec ou sans pastilles ;
- entraînement au choix sur chaque grande partie ou sous-partie du plan DGFiP (dont les travaux d’inventaire), avec une question par définition de la sélection ;
- sélection possible jusqu’à chaque rubrique précise du plan (par exemple A.5.1 « Objet de l’inventaire »), avec ses totaux exacts ;
- difficulté maximale des textes à trous masquant tous les mots utiles et conservant seulement les mots de liaison ;
- suivi local détaillé de chaque leçon, définition et formule, avec niveau par rubrique, erreurs, répétitions et prochaine révision ;
- auto-évaluation facultative sur 5, corrigée par les résultats réels dans le niveau ajusté ;
- notes personnelles enregistrées pour chaque rubrique ;
- agenda journalier adaptatif, limité à six priorités et recalculé après chaque résultat ;
- thème clair/sombre et interface mobile ;
- PWA hors ligne pour le navigateur ;
- application Android autonome : contenus intégrés dans l’APK, aucun accès Internet demandé, voix et dictée locales.

## Lancer localement

L’application est entièrement statique et ne nécessite ni compte, ni base de données, ni clé d’API.

```bash
python3 -m http.server 4173 --directory app
```

Ouvrir ensuite `http://localhost:4173`.

## Déploiement

Le workflow `.github/workflows/pages.yml` publie automatiquement le dossier `app` sur GitHub Pages à chaque mise à jour de la branche `main`.

Pour Cloudflare Pages : sélectionner ce dépôt, utiliser `npm run build` comme commande de build et `dist` comme dossier de sortie.

## Sources de contenu

- programme officiel de l’épreuve écrite n° 2 d’admissibilité, option « Comptabilité et analyse financière » ;
- *Manuel complet de comptabilité et d’analyse financière - Concours 2026* ;
- *Lexique essentiel - Comptabilité et analyse financière - Référentiel français 2026*.

Les données sont embarquées dans l’application : elles restent disponibles hors connexion et ne sont envoyées à aucun serveur.

## Application Android autonome

Le dossier `android` transforme la même interface en application Android indépendante du site. L’APK :

- embarque les cours, le lexique, les formules et les exercices ;
- ne déclare volontairement aucune permission d’accès à Internet ;
- conserve la progression, les notes et l’agenda dans le stockage privé de l’application ;
- utilise la voix française Android installée sur le téléphone ;
- demande le micro uniquement lorsque la dictée est lancée et privilégie la reconnaissance hors connexion.

Le workflow « Construire l’application Android » vérifie l’ensemble puis produit le fichier `ComptaMaster-IFIP.apk`, installable directement sur un téléphone Android sans publication sur le Play Store.
