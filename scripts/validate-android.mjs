import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

const required = [
  'android/settings.gradle.kts',
  'android/build.gradle.kts',
  'android/app/build.gradle.kts',
  'android/app/src/main/AndroidManifest.xml',
  'android/app/src/main/java/fr/elodie/comptamasterifip/MainActivity.java',
  '.github/workflows/android-apk.yml',
  'scripts/prepare-android-assets.mjs',
];

required.forEach((file) => assert(fs.existsSync(path.join(root, file)), `Fichier Android manquant : ${file}`));

const manifest = read('android/app/src/main/AndroidManifest.xml');
assert(!manifest.includes('android.permission.INTERNET'), 'L’APK autonome ne doit demander aucun accès à Internet.');
assert(manifest.includes('android.permission.RECORD_AUDIO'), 'La dictée doit pouvoir demander le micro.');
assert(manifest.includes('android:usesCleartextTraffic="false"'), 'Le trafic HTTP non sécurisé doit rester bloqué.');

const activity = read('android/app/src/main/java/fr/elodie/comptamasterifip/MainActivity.java');
assert(activity.includes('APP_ORIGIN = "https://app.local"'), 'L’application doit utiliser une origine interne dédiée.');
assert(activity.includes('START_URL = APP_ORIGIN + "/index.html"'), 'L’application doit charger uniquement son écran interne.');
assert(activity.includes('addJavascriptInterface'), 'Le pont natif pour la voix et la dictée doit être présent.');
assert(activity.includes('EXTRA_PREFER_OFFLINE'), 'La reconnaissance vocale doit préférer strictement le mode hors connexion.');
assert(activity.includes('isNetworkConnectionRequired'), 'La lecture doit choisir une voix française installée localement.');
assert(activity.includes('return !isLocalUrl'), 'Les navigations extérieures doivent être bloquées.');

const application = read('app/app.js');
assert(application.includes('const nativeBridge = window.AndroidBridge || null'), 'L’interface web doit détecter l’application Android.');
assert(application.includes('window.ComptaNative = {'), 'Les retours natifs doivent être reliés à l’interface.');
assert(application.includes("if (!nativeBridge && 'serviceWorker' in navigator)"), 'Le cache PWA ne doit pas être requis dans l’APK.');

console.log('Validation Android réussie : contenu embarqué, réseau absent, voix et dictée locales reliées.');
