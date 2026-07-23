import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const source = path.join(root, 'app');
const assets = path.join(root, 'android', 'app', 'src', 'main', 'assets', 'public');
const drawable = path.join(root, 'android', 'app', 'src', 'main', 'res', 'drawable');

fs.rmSync(assets, { recursive: true, force: true });
fs.mkdirSync(assets, { recursive: true });
fs.cpSync(source, assets, { recursive: true });

fs.mkdirSync(drawable, { recursive: true });
fs.copyFileSync(
  path.join(source, 'icons', 'icon-512.png'),
  path.join(drawable, 'app_icon.png'),
);

console.log('Ressources Android préparées : application complète embarquée dans l’APK.');
