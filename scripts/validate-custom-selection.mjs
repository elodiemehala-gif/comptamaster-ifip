import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { DATA } from '../app/data.js';

// Test sans dépendance externe : on exécute les vrais gestionnaires de sélection
// et la véritable construction des sessions avec 35 définitions de plusieurs rubriques.
const source = fs.readFileSync(path.resolve(import.meta.dirname, '../app/app.js'), 'utf8');
const extract = (start, end) => {
  const beginning = source.indexOf(start);
  const ending = source.indexOf(end, beginning + start.length);
  assert(beginning !== -1 && ending !== -1, `Code non trouvé : ${start}`);
  return source.slice(beginning, ending);
};

const handlers = new Map();
const makeButton = () => ({
  disabled: false,
  textContent: '',
  addEventListener(name, handler) { handlers.set(this, { ...(handlers.get(this) || {}), [name]: handler }); },
  click() { handlers.get(this)?.click?.(); },
});
const nodes = new Map([
  ['#show-custom-selection', makeButton()],
  ['#clear-custom-selection', makeButton()],
  ['#revise-custom-selection', makeButton()],
  ['#custom-selection-count', { textContent: '' }],
  ['#start-lexicon-quiz', { textContent: '' }],
]);
const definitions = DATA.definitions.slice(0, 36);
assert.equal(definitions.length, 36);
assert(new Set(definitions.map((item) => item.sectionId)).size >= 2, 'La sélection de test doit couvrir plusieurs chapitres.');
const checkboxes = definitions.map((item) => {
  const checkbox = makeButton();
  checkbox.dataset = { selectDefinition: item.id };
  checkbox.checked = false;
  checkbox.closest = () => ({ classList: { toggle() {} } });
  return checkbox;
});
let saved = 0;
let navigated = null;
let displayedQuestions = 0;
const state = {
  customDefinitionIds: [],
  glossarySelectionOnly: false,
  glossaryScope: 'A1',
  glossarySearch: 'test',
  trainingUseCustomSelection: false,
  trainingMode: 'qcm-term',
  trainingScope: 'A1',
  trainingClozeAssistance: 'pills',
  weakDefinitions: [],
};
const sandbox = {
  DATA, state, trainingSession: null,
  $: (selector) => {
    assert(nodes.has(selector), `Elément non prévu : ${selector}`);
    return nodes.get(selector);
  },
  $$: (selector) => {
    assert.equal(selector, '[data-select-definition]');
    return checkboxes;
  },
  unique: (array) => [...new Set(array)],
  saveState: () => { saved += 1; },
  renderGlossary: () => {},
  setView: (view) => { navigated = view; },
  renderTrainingQuestion: () => { displayedQuestions += 1; },
  toast: (message) => { throw new Error(`Entraînement bloqué : ${message}`); },
  shuffle: (array) => [...array],
  isInScope: (item, scope) => scope === 'all' || [item.partId, item.sectionId, item.topicId].includes(scope),
};
vm.createContext(sandbox);
vm.runInContext(
  extract('function bindCustomSelectionControls()', 'function renderTrainingSelectionField()') +
  extract('const trainingSource =', 'const trainingScopeOptions =') +
  extract('const startTraining =', 'const sessionProgress =') +
  '\nthis.bindSelection = bindCustomSelectionControls; this.makePool = trainingPool; this.beginSession = startTraining;',
  sandbox,
);
sandbox.bindSelection();
for (const checkbox of checkboxes.slice(0, 35)) {
  checkbox.checked = true;
  handlers.get(checkbox)?.change?.();
}
assert.equal(state.customDefinitionIds.length, 35, 'Les 35 cases doivent réellement alimenter la sélection.');
assert.equal(new Set(state.customDefinitionIds).size, 35, 'Il ne doit pas y avoir de doublon.');
assert.equal(state.trainingUseCustomSelection, true, 'La sélection doit devenir la source active pour les exercices.');
assert.equal(nodes.get('#custom-selection-count').textContent, '35 définitions sélectionnées sur 300');
assert.equal(nodes.get('#revise-custom-selection').textContent, 'Réviser (35)');
assert.equal(nodes.get('#start-lexicon-quiz').textContent, 'Entraîner ma sélection (35)');
nodes.get('#revise-custom-selection').click();
assert.equal(navigated, 'training', 'Réviser doit ouvrir le choix des exercices.');

for (const mode of ['flashcards', 'qcm-term', 'qcm-definition', 'cloze', 'written-definition', 'oral-definition', 'free-term']) {
  state.trainingMode = mode;
  assert.equal(sandbox.makePool(mode, 'A1').length, 35, `La sélection complète doit être proposée en mode ${mode}.`);
  sandbox.beginSession();
  assert.equal(sandbox.trainingSession.items.length, 35, `La session ${mode} doit comporter 35 questions.`);
  assert.deepEqual(
    [...sandbox.trainingSession.items.map((item) => item.id)].sort(),
    [...state.customDefinitionIds].sort(),
    `La session ${mode} ne doit inclure aucune notion hors de la sélection.`,
  );
}
assert.equal(displayedQuestions, 7, 'Chaque mode doit déclencher une première question.');
assert.equal(sandbox.trainingSession.scope, 'all', 'Les distracteurs du QCM doivent pouvoir venir de tout le lexique.');

checkboxes[0].checked = false;
handlers.get(checkboxes[0])?.change?.();
assert.equal(state.customDefinitionIds.length, 34, 'Décocher doit retirer la notion.');
checkboxes[0].checked = true;
handlers.get(checkboxes[0])?.change?.();
assert.equal(state.customDefinitionIds.length, 35, 'Recocher doit restaurer la notion.');
checkboxes[35].checked = true;
handlers.get(checkboxes[35])?.change?.();
assert.equal(state.customDefinitionIds.length, 36, 'On doit pouvoir ajouter une notion ultérieurement.');
nodes.get('#clear-custom-selection').click();
assert.equal(state.customDefinitionIds.length, 0, 'Le bouton de remise à zéro doit vider la sélection.');
assert(saved >= 38, 'Chaque modification doit être enregistrée.');

console.log('Validation du Lexique réussie : 35 définitions sélectionnées, 7 modes, ajout et retrait opérationnels.');
