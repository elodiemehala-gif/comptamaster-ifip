import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { DATA } from '../app/data.js';
import { FORMULA_DETAILS } from '../app/formula-details.js';

const root = path.resolve(import.meta.dirname, '..');
const uniqueCount = (items) => new Set(items).size;

assert.equal(DATA.lessons.length, 59, 'Le manuel doit fournir 59 leçons.');
assert.equal(DATA.definitions.length, 300, 'Le lexique doit fournir 300 définitions.');
assert.equal(DATA.formulas.length, 43, 'Le formulaire doit contenir 43 formules au total.');
assert.equal(DATA.formulas.filter((item) => !item.fundamental).length, 40, '40 formules doivent venir du formulaire de calcul.');
assert.equal(DATA.formulas.filter((item) => item.fundamental).length, 3, '3 égalités doivent être fondamentales.');
assert.equal(Object.keys(FORMULA_DETAILS).length, DATA.formulas.length, 'Chaque formule doit avoir une explication.');
assert(DATA.formulas.every((item) => FORMULA_DETAILS[item.id]?.expandedExpression && FORMULA_DETAILS[item.id]?.explanation.length > 40), 'Chaque formule doit être écrite en toutes lettres et expliquée.');

assert.equal(uniqueCount(DATA.lessons.map((item) => item.id)), DATA.lessons.length, 'Les identifiants de leçon doivent être uniques.');
assert.equal(uniqueCount(DATA.definitions.map((item) => item.id)), DATA.definitions.length, 'Les identifiants de définition doivent être uniques.');
assert.equal(uniqueCount(DATA.formulas.map((item) => item.id)), DATA.formulas.length, 'Les identifiants de formule doivent être uniques.');

const expectedParts = { A: 210, B: 37, C: 53 };
for (const [partId, expected] of Object.entries(expectedParts)) {
  assert.equal(DATA.definitions.filter((item) => item.partId === partId).length, expected, `Répartition incorrecte pour la partie ${partId}.`);
}

const expectedSections = { A1: 25, A2: 30, A3: 68, A4: 34, A5: 36, A6: 17, B1: 16, B2: 8, B3: 13, C1: 16, C2: 13, C3: 8, C4: 7, C5: 4, C6: 5 };
for (const [sectionId, expected] of Object.entries(expectedSections)) {
  assert.equal(DATA.definitions.filter((item) => item.sectionId === sectionId).length, expected, `Répartition incorrecte pour la sous-partie ${sectionId}.`);
}

const validParts = new Set(DATA.plan.map((part) => part.id));
const validSections = new Set(DATA.plan.flatMap((part) => part.sections.map((section) => section.id)));
const validTopics = new Set(DATA.plan.flatMap((part) => part.sections.flatMap((section) => section.topics.map((topic) => topic.id))));
for (const collection of [DATA.lessons, DATA.definitions, DATA.formulas]) {
  for (const item of collection) {
    assert(validParts.has(item.partId), `${item.id} pointe vers une partie inconnue.`);
    assert(validSections.has(item.sectionId), `${item.id} pointe vers une section inconnue.`);
    assert(validTopics.has(item.topicId), `${item.id} pointe vers une rubrique inconnue.`);
  }
}
assert(DATA.lessons.every((lesson) => lesson.title && lesson.content.length > 80), 'Chaque leçon doit avoir un titre et un contenu substantiel.');
assert(DATA.definitions.every((item) => item.term && item.definition.length > 20), 'Chaque définition doit être complète.');
assert(DATA.plan.every((part) => part.sections.every((section) => section.topics.every((topic) => topic.lessons.length))), 'Chaque rubrique de cours doit ouvrir au moins une leçon.');

for (const file of ['index.html', 'styles.css', 'app.js', 'data.js', 'sw.js', 'manifest.webmanifest', 'icons/icon-192.png', 'icons/icon-512.png']) {
  assert(fs.existsSync(path.join(root, 'app', file)), `Ressource PWA manquante : ${file}`);
}

const applicationSource = fs.readFileSync(path.join(root, 'app', 'app.js'), 'utf8');
assert(!applicationSource.includes('<option value="5">5 questions</option>'), 'Le choix fixe 5/10/20 ne doit plus être proposé.');
assert(applicationSource.includes('item.sectionId === scope'), 'Les sessions doivent pouvoir être filtrées par sous-partie.');
assert(applicationSource.includes('items: shuffle(pool)'), 'Une session doit contenir toutes les définitions de la sélection.');

console.log('Validation réussie : 59 leçons, 300 définitions, 43 formules et ressources PWA présentes.');
