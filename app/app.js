import { DATA } from './data.js';
import { FORMULA_DETAILS } from './formula-details.js';

const STORAGE_KEY = 'comptamaster-ifip-state-v1';
const defaultState = {
  theme: 'light',
  completedLessons: [],
  knownDefinitions: [],
  weakDefinitions: [],
  answered: 0,
  correct: 0,
  courseTopic: 'A1a',
  courseLesson: 'A1',
  glossaryScope: 'all',
  glossarySearch: '',
  glossaryCardId: 'D001',
  formulaScope: 'all',
  formulaTab: 'formulas',
  trainingMode: 'qcm-term',
  trainingScope: 'all',
  trainingHoles: 2,
  trainingClozeAssistance: 'pills',
  voiceURI: '',
  voiceRate: 1,
};

const loadState = () => {
  try { return { ...defaultState, ...JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') }; }
  catch { return { ...defaultState }; }
};

const state = loadState();
let currentView = 'dashboard';
let trainingSession = null;
let deferredInstallPrompt = null;
let speechQueue = [];
let speechIndex = 0;
let speechStatus = 'idle';
let activeRecognition = null;

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const saveState = () => localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
const escapeHTML = (value = '') => String(value)
  .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;').replaceAll("'", '&#039;');
const normalize = (value = '') => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
const shuffle = (array) => {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
};
const unique = (array) => [...new Set(array)];
const clamp = (number, min, max) => Math.max(min, Math.min(max, number));

const getPart = (id) => DATA.plan.find((part) => part.id === id);
const getSection = (id) => DATA.plan.flatMap((part) => part.sections).find((section) => section.id === id);
const getTopic = (id) => DATA.plan.flatMap((part) => part.sections.flatMap((section) => section.topics)).find((topic) => topic.id === id);
const getLesson = (id) => DATA.lessons.find((lesson) => lesson.id === id);
const getDefinition = (id) => DATA.definitions.find((definition) => definition.id === id);
const pathFor = (item) => ({ part: getPart(item.partId), section: getSection(item.sectionId), topic: getTopic(item.topicId) });
const isCompleted = (id) => state.completedLessons.includes(id);

const toast = (message) => {
  const region = $('#toast-region');
  const node = document.createElement('div');
  node.className = 'toast';
  node.textContent = message;
  region.append(node);
  setTimeout(() => node.remove(), 2800);
};

const updateProgressUI = () => {
  const percent = Math.round((state.completedLessons.length / DATA.lessons.length) * 100);
  $('#side-progress-label').textContent = `${percent} %`;
  $('#side-progress-bar').style.width = `${percent}%`;
  $('#side-progress-detail').textContent = `${state.completedLessons.length} leçon${state.completedLessons.length > 1 ? 's' : ''} terminée${state.completedLessons.length > 1 ? 's' : ''} sur ${DATA.lessons.length}.`;
};

const setTheme = (theme) => {
  state.theme = theme;
  document.documentElement.dataset.theme = theme;
  const button = $('#theme-button');
  button.textContent = theme === 'dark' ? '☀' : '☾';
  button.setAttribute('aria-label', theme === 'dark' ? 'Activer le thème clair' : 'Activer le thème sombre');
  document.querySelector('meta[name="theme-color"]').content = theme === 'dark' ? '#10192c' : '#17233d';
  saveState();
};

const renderDashboard = () => {
  const completed = new Set(state.completedLessons);
  const nextLesson = DATA.lessons.find((lesson) => !completed.has(lesson.id)) || DATA.lessons[0];
  const nextPath = pathFor(nextLesson);
  const accuracy = state.answered ? Math.round((state.correct / state.answered) * 100) : 0;
  const percent = Math.round((completed.size / DATA.lessons.length) * 100);

  const partRows = DATA.plan.map((part) => {
    const lessonIds = unique(part.sections.flatMap((section) => section.topics.flatMap((topic) => topic.lessons)));
    const count = lessonIds.filter((id) => completed.has(id)).length;
    const value = Math.round((count / lessonIds.length) * 100) || 0;
    return `<div class="plan-progress-row">
      <strong>${escapeHTML(part.id)}. ${escapeHTML(part.title)}</strong>
      <div class="light-track"><span style="width:${value}%"></span></div>
      <small>${value} %</small>
    </div>`;
  }).join('');

  $('#view-dashboard').innerHTML = `
    <div class="hero">
      <div class="hero-content">
        <span class="eyebrow">Programme officiel DGFiP</span>
        <h1>La comptabilité, sans zone grise.</h1>
        <p>Un parcours fidèle au plan du concours : cours complet, 300 définitions, formules essentielles et entraînement actif.</p>
        <div class="hero-actions">
          <button class="primary-button" id="resume-course" type="button">Reprendre le cours</button>
          <button class="ghost-button" data-go="training" type="button">Lancer un exercice</button>
        </div>
      </div>
      <div class="hero-visual" aria-hidden="true">
        <div class="hero-mini-card"><div class="hero-mini-icon">▤</div><div><strong>${DATA.meta.counts.lessons}</strong><span>leçons structurées</span></div></div>
        <div class="hero-mini-card"><div class="hero-mini-icon">Aa</div><div><strong>${DATA.meta.counts.definitions}</strong><span>définitions essentielles</span></div></div>
        <div class="hero-mini-card"><div class="hero-mini-icon">ƒ</div><div><strong>${DATA.meta.counts.formulas}</strong><span>formules à connaître</span></div></div>
      </div>
    </div>
    <div class="stats-grid">
      <article class="stat-card"><span class="stat-label">Cours maîtrisé</span><strong class="stat-value">${percent} %</strong><small>${completed.size} / ${DATA.lessons.length} leçons</small></article>
      <article class="stat-card" style="--card-tint:var(--mint-soft)"><span class="stat-label">Lexique connu</span><strong class="stat-value">${state.knownDefinitions.length}</strong><small>sur ${DATA.definitions.length} notions</small></article>
      <article class="stat-card" style="--card-tint:var(--accent-soft)"><span class="stat-label">Précision</span><strong class="stat-value">${accuracy} %</strong><small>${state.answered} réponse${state.answered > 1 ? 's' : ''} donnée${state.answered > 1 ? 's' : ''}</small></article>
      <article class="stat-card" style="--card-tint:var(--danger-soft)"><span class="stat-label">À revoir</span><strong class="stat-value">${state.weakDefinitions.length}</strong><small>carte${state.weakDefinitions.length > 1 ? 's' : ''} signalée${state.weakDefinitions.length > 1 ? 's' : ''}</small></article>
    </div>
    <div class="dashboard-grid">
      <section class="panel">
        <div class="panel-head"><div><h2>Avancement par partie</h2><p>Selon l’architecture exacte du programme.</p></div><span class="tag">DGFiP</span></div>
        <div class="plan-progress-list">${partRows}</div>
      </section>
      <section class="panel">
        <div class="panel-head"><div><h2>Prochaine étape</h2><p>Continue là où le parcours t’attend.</p></div></div>
        <div class="continue-card">
          <span class="tag is-essential">${escapeHTML(nextLesson.id)} · indispensable</span>
          <h3>${escapeHTML(nextLesson.title)}</h3>
          <p>${escapeHTML(nextPath.section?.title || '')}</p>
          <button class="primary-button" id="open-next-lesson" type="button">Ouvrir la leçon</button>
        </div>
      </section>
    </div>`;

  const openNext = () => {
    state.courseTopic = nextLesson.topicId;
    state.courseLesson = nextLesson.id;
    saveState();
    setView('course');
  };
  $('#resume-course').addEventListener('click', openNext);
  $('#open-next-lesson').addEventListener('click', openNext);
  $$('[data-go]', $('#view-dashboard')).forEach((button) => button.addEventListener('click', () => setView(button.dataset.go)));
};

const renderCatalog = (search = '') => {
  const query = normalize(search.trim());
  return DATA.plan.map((part) => {
    const sections = part.sections.map((section) => {
      const topics = section.topics.filter((topic) => {
        if (!query) return true;
        const lessonText = topic.lessons.map((id) => {
          const lesson = getLesson(id);
          return `${lesson?.title || ''} ${lesson?.content || ''}`;
        }).join(' ');
        return normalize(`${topic.title} ${section.title} ${lessonText}`).includes(query);
      });
      if (!topics.length) return '';
      return `<div class="catalog-section">
        <div class="catalog-section-title">${escapeHTML(section.title)}</div>
        ${topics.map((topic) => `<button class="catalog-topic ${topic.id === state.courseTopic ? 'is-active' : ''}" data-topic="${topic.id}" type="button">${escapeHTML(topic.title)}</button>`).join('')}
      </div>`;
    }).join('');
    if (!sections) return '';
    return `<div class="catalog-part"><button class="catalog-part-title" type="button">${part.id}. ${escapeHTML(part.title)}</button>${sections}</div>`;
  }).join('');
};

const audioMarkup = () => `
  <div class="audio-player" aria-label="Lecture vocale du cours">
    <div class="audio-buttons">
      <button id="audio-play" type="button" aria-label="Lire le cours">▶</button>
      <button id="audio-pause" type="button" aria-label="Mettre en pause">Ⅱ</button>
      <button id="audio-stop" type="button" aria-label="Arrêter la lecture">■</button>
    </div>
    <div class="audio-options">
      <select id="voice-select" aria-label="Voix française"><option>Recherche des voix françaises…</option></select>
      <select id="rate-select" aria-label="Vitesse de lecture">
        ${[0.8, 0.9, 1, 1.1, 1.2].map((rate) => `<option value="${rate}" ${Number(state.voiceRate) === rate ? 'selected' : ''}>${rate === 1 ? 'Vitesse normale' : `Vitesse × ${rate}`}</option>`).join('')}
      </select>
    </div>
    <span class="audio-status" id="audio-status">Voix française naturelle automatique</span>
  </div>`;

const renderCourse = () => {
  const selectedTopic = getTopic(state.courseTopic) || getTopic('A1a');
  const availableLessons = selectedTopic.lessons.map(getLesson).filter(Boolean);
  let lesson = getLesson(state.courseLesson);
  if (!lesson || !selectedTopic.lessons.includes(lesson.id)) {
    lesson = availableLessons[0];
    state.courseLesson = lesson.id;
    saveState();
  }
  const path = pathFor({ ...lesson, topicId: selectedTopic.id });
  const globalIndex = DATA.lessons.findIndex((item) => item.id === lesson.id);
  const completed = isCompleted(lesson.id);

  $('#view-course').innerHTML = `
    <div class="page-heading">
      <div><span class="eyebrow">59 leçons · plan officiel</span><h1>Révision du cours</h1><p>Choisis une rubrique du programme, puis avance leçon par leçon.</p></div>
      <div class="control-row"><div class="search-field"><input id="course-search" type="search" placeholder="Rechercher dans le cours…" aria-label="Rechercher dans le cours" /></div></div>
    </div>
    <div class="course-layout">
      <aside class="panel course-catalog">
        <div class="catalog-summary"><strong>Plan DGFiP</strong><span>${state.completedLessons.length}/${DATA.lessons.length} terminées</span></div>
        <div id="catalog-content">${renderCatalog()}</div>
      </aside>
      <div class="course-reader">
        <section class="panel reader-header">
          <div class="reader-breadcrumb">${escapeHTML(path.part.id)}. ${escapeHTML(path.part.title)} · ${escapeHTML(path.section.title)}</div>
          <h2>${escapeHTML(selectedTopic.title)}</h2>
          <p>${availableLessons.length} leçon${availableLessons.length > 1 ? 's' : ''} dans cette rubrique officielle.</p>
          ${audioMarkup()}
        </section>
        <article class="panel lesson-card">
          <div class="lesson-card-head">
            <div><span class="tag is-essential">${escapeHTML(lesson.id)} · indispensable concours</span><h3>${escapeHTML(lesson.title)}</h3></div>
            <button class="${completed ? 'ghost-button' : 'primary-button'} complete-button" id="complete-lesson" type="button">${completed ? '✓ Leçon terminée' : 'Marquer comme terminée'}</button>
          </div>
          <div class="lesson-content">${escapeHTML(lesson.content)}</div>
        </article>
        <div class="lesson-navigation">
          <button class="secondary-button" id="previous-lesson" type="button" ${globalIndex <= 0 ? 'disabled' : ''}>← Précédente</button>
          <button class="primary-button" id="next-lesson" type="button" ${globalIndex >= DATA.lessons.length - 1 ? 'disabled' : ''}>Suivante →</button>
        </div>
      </div>
    </div>`;

  $('#course-search').addEventListener('input', (event) => {
    $('#catalog-content').innerHTML = renderCatalog(event.target.value);
    bindCatalog();
  });
  const bindCatalog = () => {
    $$('[data-topic]', $('#catalog-content')).forEach((button) => button.addEventListener('click', () => {
      stopSpeech();
      state.courseTopic = button.dataset.topic;
      state.courseLesson = getTopic(state.courseTopic).lessons[0];
      saveState();
      renderCourse();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }));
  };
  bindCatalog();

  $('#complete-lesson').addEventListener('click', () => {
    if (isCompleted(lesson.id)) state.completedLessons = state.completedLessons.filter((id) => id !== lesson.id);
    else state.completedLessons = unique([...state.completedLessons, lesson.id]);
    saveState();
    updateProgressUI();
    renderCourse();
    toast(isCompleted(lesson.id) ? 'Leçon ajoutée à ta progression.' : 'Leçon retirée de la progression.');
  });
  const goToLesson = (index) => {
    const target = DATA.lessons[index];
    if (!target) return;
    stopSpeech();
    state.courseLesson = target.id;
    state.courseTopic = target.topicId;
    saveState();
    renderCourse();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  $('#previous-lesson').addEventListener('click', () => goToLesson(globalIndex - 1));
  $('#next-lesson').addEventListener('click', () => goToLesson(globalIndex + 1));
  bindAudio(lesson);
};

const formulaFilterOptions = () => `<option value="all">Tout le programme</option>${DATA.plan.map((part) => `<option value="${part.id}">${part.id}. ${escapeHTML(part.title)}</option>`).join('')}`;

const renderFormulas = () => {
  const scope = state.formulaScope;
  const formulas = DATA.formulas.filter((formula) => scope === 'all' || formula.partId === scope);
  const groups = DATA.plan.flatMap((part) => part.sections.map((section) => ({ part, section }))).map(({ part, section }) => {
    const items = formulas.filter((formula) => formula.sectionId === section.id);
    if (!items.length) return '';
    return `<section>
      <div class="formula-group-head"><span>${items.length}</span><h2>${part.id}. ${escapeHTML(section.title)}</h2></div>
      <div class="formula-grid">${items.map((formula) => {
        const path = pathFor(formula);
        const detail = FORMULA_DETAILS[formula.id];
        const body = state.formulaTab === 'explanations'
          ? `<div class="formula-detail">
              <span class="formula-detail-label">En toutes lettres</span>
              <div class="formula-expression is-expanded">${escapeHTML(detail.expandedExpression)}</div>
              ${detail.terms.length ? `<div class="formula-terms">${detail.terms.map((term) => `<span>${escapeHTML(term)}</span>`).join('')}</div>` : ''}
              <p>${escapeHTML(detail.explanation)}</p>
            </div>`
          : `<div class="formula-expression">${escapeHTML(formula.expression)}</div>`;
        return `<article class="formula-card">
          <div class="formula-card-top"><h3>${escapeHTML(formula.name)}</h3>${formula.fundamental ? '<span class="tag is-essential">Fondamentale</span>' : '<span class="tag">Calcul</span>'}</div>
          ${body}
          <div class="formula-path">${escapeHTML(path.topic.title)}</div>
        </article>`;
      }).join('')}</div>
    </section>`;
  }).join('');

  $('#view-formulas').innerHTML = `
    <div class="page-heading">
      <div><span class="eyebrow">Formulaire essentiel</span><h1>Les formules</h1><p>Classées dans l’ordre du programme pour les mémoriser avec leur contexte.</p></div>
      <div class="control-row"><select class="select-field" id="formula-scope" aria-label="Filtrer les formules">${formulaFilterOptions()}</select><button class="primary-button" id="practice-formulas" type="button">S’entraîner</button></div>
    </div>
    <div class="formula-count-banner"><strong>${DATA.meta.counts.formulas}</strong><p><b>formules à connaître au total</b><br />${DATA.meta.counts.calculationFormulas} formules de calcul du formulaire + 3 égalités comptables fondamentales.</p></div>
    <div class="formula-tabs" role="tablist" aria-label="Présentation des formules">
      <button class="formula-tab ${state.formulaTab === 'formulas' ? 'is-active' : ''}" id="formula-tab-formulas" data-formula-tab="formulas" role="tab" aria-selected="${state.formulaTab === 'formulas'}" type="button">Formules</button>
      <button class="formula-tab ${state.formulaTab === 'explanations' ? 'is-active' : ''}" id="formula-tab-explanations" data-formula-tab="explanations" role="tab" aria-selected="${state.formulaTab === 'explanations'}" type="button">Sans abréviation + explications</button>
    </div>
    <div class="formula-groups">${groups}</div>`;
  $('#formula-scope').value = state.formulaScope;
  $('#formula-scope').addEventListener('change', (event) => { state.formulaScope = event.target.value; saveState(); renderFormulas(); });
  $$('[data-formula-tab]', $('#view-formulas')).forEach((button) => button.addEventListener('click', () => {
    state.formulaTab = button.dataset.formulaTab;
    saveState();
    renderFormulas();
  }));
  $('#practice-formulas').addEventListener('click', () => {
    trainingSession = null;
    state.trainingMode = 'formula-cloze';
    saveState();
    setView('training');
  });
};

const filteredDefinitions = () => {
  const query = normalize(state.glossarySearch.trim());
  return DATA.definitions.filter((definition) => {
    const inScope = state.glossaryScope === 'all' || definition.partId === state.glossaryScope || definition.sectionId === state.glossaryScope;
    const matches = !query || normalize(`${definition.term} ${definition.definition}`).includes(query);
    return inScope && matches;
  });
};

const glossaryScopeOptions = () => `<option value="all">Les 300 définitions</option>${DATA.plan.map((part) => `
  <optgroup label="${part.id}. ${escapeHTML(part.title)} (${part.count})">
    <option value="${part.id}">Toute la partie (${part.count})</option>
    ${part.sections.map((section) => {
      const count = DATA.definitions.filter((definition) => definition.sectionId === section.id).length;
      return `<option value="${section.id}">${escapeHTML(section.title)} (${count})</option>`;
    }).join('')}
  </optgroup>`).join('')}`;

const renderGlossary = () => {
  const definitions = filteredDefinitions();
  let current = definitions.find((item) => item.id === state.glossaryCardId) || definitions[0];
  if (current) state.glossaryCardId = current.id;
  const index = current ? definitions.findIndex((item) => item.id === current.id) : -1;
  const known = current && state.knownDefinitions.includes(current.id);
  const weak = current && state.weakDefinitions.includes(current.id);
  const path = current ? pathFor(current) : null;

  $('#view-glossary').innerHTML = `
    <div class="page-heading">
      <div><span class="eyebrow">300 définitions essentielles</span><h1>Lexique & flashcards</h1><p>Retourne la carte, évalue ta maîtrise et retrouve chaque notion dans le plan DGFiP.</p></div>
    </div>
    <div class="control-row glossary-toolbar">
      <div class="search-field"><input id="glossary-search" type="search" value="${escapeHTML(state.glossarySearch)}" placeholder="Rechercher une notion…" aria-label="Rechercher dans le lexique" /></div>
      <select class="select-field" id="glossary-scope" aria-label="Filtrer le lexique">${glossaryScopeOptions()}</select>
      <button class="secondary-button" id="shuffle-card" type="button">Mélanger</button>
    </div>
    <div class="glossary-layout">
      <section class="flashcard-panel">
        ${current ? `<div class="flashcard-meta"><span>${index + 1} / ${definitions.length}</span><span>${escapeHTML(path.part.id)} · ${escapeHTML(path.section.title)}</span></div>
        <button class="flashcard" id="flashcard" type="button" aria-label="Retourner la carte">
          <span class="flashcard-inner">
            <span class="flashcard-face is-front"><small>Notion</small><h2>${escapeHTML(current.term)}</h2><span class="tag">Cliquer pour révéler</span></span>
            <span class="flashcard-face is-back"><small>Définition</small><p>${escapeHTML(current.definition)}</p><span class="tag is-essential">${escapeHTML(path.topic.title)}</span></span>
          </span>
        </button>
        <div class="flashcard-controls">
          <button class="secondary-button" id="previous-card" type="button" ${index <= 0 ? 'disabled' : ''}>← Précédente</button>
          <button class="${weak ? 'primary-button' : 'ghost-button'}" id="weak-card" type="button">${weak ? 'À revoir ✓' : 'À revoir'}</button>
          <button class="${known ? 'primary-button' : 'ghost-button'}" id="known-card" type="button">${known ? 'Je sais ✓' : 'Je sais'}</button>
          <button class="secondary-button" id="next-card" type="button" ${index >= definitions.length - 1 ? 'disabled' : ''}>Suivante →</button>
        </div>` : '<div class="panel empty-state"><strong>Aucun résultat</strong>Essaie un autre mot ou une autre partie.</div>'}
      </section>
      <section class="panel glossary-results">
        <div class="panel-head"><div><h2>Liste des notions</h2><p>${definitions.length} résultat${definitions.length > 1 ? 's' : ''}</p></div><button class="ghost-button" id="start-lexicon-quiz" type="button">Exercices du lexique</button></div>
        <div class="definition-list">${definitions.map((definition) => `<article class="definition-row ${definition.id === current?.id ? 'is-active' : ''}" data-definition="${definition.id}" tabindex="0"><strong>${escapeHTML(definition.term)}</strong><p>${escapeHTML(definition.definition)}</p></article>`).join('')}</div>
      </section>
    </div>`;

  $('#glossary-scope').value = state.glossaryScope;
  $('#glossary-search').addEventListener('input', (event) => { state.glossarySearch = event.target.value; saveState(); renderGlossary(); });
  $('#glossary-scope').addEventListener('change', (event) => { state.glossaryScope = event.target.value; saveState(); renderGlossary(); });
  $('#shuffle-card').addEventListener('click', () => {
    if (!definitions.length) return;
    state.glossaryCardId = definitions[Math.floor(Math.random() * definitions.length)].id;
    saveState(); renderGlossary();
  });
  $('#start-lexicon-quiz').addEventListener('click', () => {
    trainingSession = null;
    state.trainingMode = 'qcm-term';
    saveState();
    setView('training');
  });
  if (!current) return;
  $('#flashcard').addEventListener('click', (event) => event.currentTarget.classList.toggle('is-flipped'));
  const chooseCard = (targetIndex) => { const target = definitions[targetIndex]; if (target) { state.glossaryCardId = target.id; saveState(); renderGlossary(); } };
  $('#previous-card').addEventListener('click', () => chooseCard(index - 1));
  $('#next-card').addEventListener('click', () => chooseCard(index + 1));
  $('#known-card').addEventListener('click', () => {
    state.knownDefinitions = known ? state.knownDefinitions.filter((id) => id !== current.id) : unique([...state.knownDefinitions, current.id]);
    if (!known) state.weakDefinitions = state.weakDefinitions.filter((id) => id !== current.id);
    saveState(); renderGlossary();
  });
  $('#weak-card').addEventListener('click', () => {
    state.weakDefinitions = weak ? state.weakDefinitions.filter((id) => id !== current.id) : unique([...state.weakDefinitions, current.id]);
    if (!weak) state.knownDefinitions = state.knownDefinitions.filter((id) => id !== current.id);
    saveState(); renderGlossary();
  });
  $$('[data-definition]').forEach((row) => {
    const activate = () => { state.glossaryCardId = row.dataset.definition; saveState(); renderGlossary(); };
    row.addEventListener('click', activate);
    row.addEventListener('keydown', (event) => { if (event.key === 'Enter' || event.key === ' ') activate(); });
  });
};

const trainingModes = [
  { id: 'flashcards', icon: 'Aa', title: 'Flashcards', description: 'Révèle la définition et évalue ta maîtrise.' },
  { id: 'qcm-term', icon: 'Q', title: 'QCM · notion → définition', description: 'Choisis la bonne définition parmi quatre.' },
  { id: 'qcm-definition', icon: '↔', title: 'QCM · définition → notion', description: 'Retrouve le terme comptable correspondant.' },
  { id: 'cloze', icon: '…', title: 'Texte à trous', description: 'Replace les mots manquants dans les définitions.' },
  { id: 'written-definition', icon: '✎', title: 'Définition à écrire', description: 'Rédige entièrement la définition à partir de la notion.' },
  { id: 'oral-definition', icon: '●', title: 'Définition à l’oral', description: 'Récite la définition au micro puis vérifie la transcription.' },
  { id: 'free-term', icon: 'A?', title: 'Réponse libre · définition → notion', description: 'Écris toi-même la notion, sans proposition.' },
  { id: 'formula-cloze', icon: 'ƒ', title: 'Formules à trous', description: 'Reconstitue les formules essentielles.' },
  { id: 'weak', icon: '!', title: 'Cartes faibles', description: 'Révise uniquement les notions signalées.' },
];

const renderTraining = () => {
  if (trainingSession) { renderTrainingQuestion(); return; }
  const holesVisible = ['cloze', 'formula-cloze'].includes(state.trainingMode);
  $('#view-training').innerHTML = `
    <div class="page-heading"><div><span class="eyebrow">Rappel actif</span><h1>Entraînement</h1><p>Choisis un mode, une partie du programme et le niveau de difficulté.</p></div></div>
    <div class="training-setup">${trainingModes.map((mode) => `<button class="mode-card ${mode.id === state.trainingMode ? 'is-selected' : ''}" data-mode="${mode.id}" type="button"><span class="mode-icon">${mode.icon}</span><h3>${mode.title}</h3><p>${mode.description}</p></button>`).join('')}</div>
    <div class="training-options">
      <div class="field-group"><label for="training-scope">Partie à réviser</label><select id="training-scope"><option value="all">Tout le programme</option>${DATA.plan.map((part) => `<option value="${part.id}">${part.id}. ${escapeHTML(part.title)}</option>`).join('')}</select></div>
      <div class="field-group"><label for="training-length">Nombre de questions</label><select id="training-length"><option value="5">5 questions</option><option value="10" selected>10 questions</option><option value="20">20 questions</option></select></div>
      <div class="field-group" id="holes-group" ${holesVisible ? '' : 'hidden'}><label for="training-holes">Difficulté du texte à trous</label><select id="training-holes">
        ${[1,2,3,4,5].map((number) => `<option value="${number}" ${String(state.trainingHoles) === String(number) ? 'selected' : ''}>${number} trou${number > 1 ? 's' : ''}${number === 1 ? ' · facile' : number === 3 ? ' · moyen' : number === 5 ? ' · difficile' : ''}</option>`).join('')}
        <option value="max" ${String(state.trainingHoles) === 'max' ? 'selected' : ''}>Maximum · tous les mots utiles</option>
      </select></div>
      <div class="field-group" id="cloze-assistance-group" ${holesVisible ? '' : 'hidden'}><label for="training-cloze-assistance">Mode de réponse</label><select id="training-cloze-assistance"><option value="pills" ${state.trainingClozeAssistance === 'pills' ? 'selected' : ''}>Avec pastilles · mots proposés</option><option value="typing" ${state.trainingClozeAssistance === 'typing' ? 'selected' : ''}>Sans pastilles · réponse libre</option></select></div>
      <button class="primary-button" id="start-training" type="button">Commencer la session</button>
    </div>`;
  $('#training-scope').value = state.trainingScope;
  $$('[data-mode]', $('#view-training')).forEach((button) => button.addEventListener('click', () => {
    state.trainingMode = button.dataset.mode;
    saveState(); renderTraining();
  }));
  $('#training-scope').addEventListener('change', (event) => { state.trainingScope = event.target.value; saveState(); });
  $('#training-holes')?.addEventListener('change', (event) => { state.trainingHoles = event.target.value; saveState(); });
  $('#training-cloze-assistance')?.addEventListener('change', (event) => { state.trainingClozeAssistance = event.target.value; saveState(); });
  $('#start-training').addEventListener('click', () => startTraining(Number($('#training-length').value)));
};

const startTraining = (length) => {
  const mode = state.trainingMode;
  const formulaMode = mode === 'formula-cloze';
  let pool = formulaMode ? DATA.formulas : DATA.definitions;
  if (state.trainingScope !== 'all') pool = pool.filter((item) => item.partId === state.trainingScope);
  if (mode === 'weak') {
    pool = DATA.definitions.filter((item) => state.weakDefinitions.includes(item.id) && (state.trainingScope === 'all' || item.partId === state.trainingScope));
    if (!pool.length) {
      toast('Aucune carte faible dans cette sélection. Marque d’abord des cartes « À revoir ».');
      return;
    }
  }
  trainingSession = {
    mode: mode === 'weak' ? 'flashcards' : mode,
    items: shuffle(pool).slice(0, Math.min(length, pool.length)),
    index: 0,
    score: 0,
    answered: false,
    currentCloze: null,
    clozeAssistance: state.trainingClozeAssistance,
  };
  renderTrainingQuestion();
};

const sessionProgress = () => {
  const session = trainingSession;
  const percent = Math.round((session.index / session.items.length) * 100);
  return `<div class="quiz-top"><strong>Question ${session.index + 1} / ${session.items.length}</strong><div class="light-track"><span style="width:${percent}%"></span></div><span>Score : ${session.score}</span></div>`;
};

const recordAnswer = (correct, definitionId = null) => {
  state.answered += 1;
  if (correct) state.correct += 1;
  if (definitionId) {
    if (correct) {
      state.knownDefinitions = unique([...state.knownDefinitions, definitionId]);
      state.weakDefinitions = state.weakDefinitions.filter((id) => id !== definitionId);
    } else {
      state.weakDefinitions = unique([...state.weakDefinitions, definitionId]);
      state.knownDefinitions = state.knownDefinitions.filter((id) => id !== definitionId);
    }
  }
  saveState();
};

const nextTrainingQuestion = () => {
  stopRecognition();
  const session = trainingSession;
  session.index += 1;
  session.answered = false;
  session.currentCloze = null;
  if (session.index >= session.items.length) renderTrainingResults();
  else renderTrainingQuestion();
};

const renderTrainingQuestion = () => {
  const session = trainingSession;
  if (!session) { renderTraining(); return; }
  if (session.mode === 'flashcards') renderTrainingFlashcard();
  else if (session.mode === 'qcm-term' || session.mode === 'qcm-definition') renderQCM();
  else if (session.mode === 'cloze' || session.mode === 'formula-cloze') renderCloze();
  else renderDefinitionRecall();
};

const stopRecognition = () => {
  if (!activeRecognition) return;
  try { activeRecognition.stop(); } catch { /* La reconnaissance était déjà arrêtée. */ }
  activeRecognition = null;
};

const questionShell = (content) => {
  $('#view-training').innerHTML = `<div class="quiz-shell">${sessionProgress()}${content}<div class="quiz-actions"><button class="secondary-button" id="quit-training" type="button">Quitter</button></div></div>`;
  $('#quit-training').addEventListener('click', () => { stopRecognition(); trainingSession = null; renderTraining(); });
};

const renderTrainingFlashcard = () => {
  const session = trainingSession;
  const item = session.items[session.index];
  const path = pathFor(item);
  questionShell(`<section>
    <div class="flashcard-meta"><span>Flashcard</span><span>${escapeHTML(path.part.id)} · ${escapeHTML(path.section.title)}</span></div>
    <button class="flashcard" id="training-card" type="button"><span class="flashcard-inner"><span class="flashcard-face is-front"><small>Notion</small><h2>${escapeHTML(item.term)}</h2><span class="tag">Cliquer pour révéler</span></span><span class="flashcard-face is-back"><small>Définition</small><p>${escapeHTML(item.definition)}</p><span class="tag is-essential">${escapeHTML(path.topic.title)}</span></span></span></button>
    <div class="flashcard-controls"><span></span><button class="ghost-button" id="card-again" type="button">À revoir</button><button class="primary-button" id="card-known" type="button">Je sais</button><span></span></div>
  </section>`);
  $('#training-card').addEventListener('click', (event) => event.currentTarget.classList.toggle('is-flipped'));
  $('#card-again').addEventListener('click', () => { recordAnswer(false, item.id); nextTrainingQuestion(); });
  $('#card-known').addEventListener('click', () => { session.score += 1; recordAnswer(true, item.id); nextTrainingQuestion(); });
};

const renderQCM = () => {
  const session = trainingSession;
  const item = session.items[session.index];
  const askDefinition = session.mode === 'qcm-term';
  const distractors = shuffle(DATA.definitions.filter((definition) => definition.id !== item.id && (state.trainingScope === 'all' || definition.partId === state.trainingScope))).slice(0, 3);
  const choices = shuffle([item, ...distractors]);
  const prompt = askDefinition ? item.term : item.definition;
  questionShell(`<section class="panel quiz-card">
    <span class="quiz-label">${askDefinition ? 'Quelle est la bonne définition ?' : 'Quelle notion correspond à cette définition ?'}</span>
    <div class="quiz-question ${askDefinition ? '' : 'is-definition'}">${escapeHTML(prompt)}</div>
    <div class="answer-grid">${choices.map((choice) => `<button class="answer-option" data-answer="${choice.id}" type="button">${escapeHTML(askDefinition ? choice.definition : choice.term)}</button>`).join('')}</div>
    <div class="feedback-box" id="quiz-feedback"></div>
    <div class="quiz-actions"><button class="primary-button" id="next-question" type="button" hidden>Question suivante</button></div>
  </section>`);
  $$('[data-answer]').forEach((button) => button.addEventListener('click', () => {
    if (session.answered) return;
    session.answered = true;
    const correct = button.dataset.answer === item.id;
    if (correct) session.score += 1;
    recordAnswer(correct, item.id);
    $$('[data-answer]').forEach((option) => {
      option.disabled = true;
      if (option.dataset.answer === item.id) option.classList.add('is-correct');
    });
    if (!correct) button.classList.add('is-wrong');
    const feedback = $('#quiz-feedback');
    feedback.className = `feedback-box is-visible ${correct ? 'is-correct' : 'is-wrong'}`;
    feedback.innerHTML = `<strong>${correct ? 'Bonne réponse.' : 'Pas tout à fait.'}</strong><p>${escapeHTML(item.term)} — ${escapeHTML(item.definition)}</p>`;
    $('#next-question').hidden = false;
  }));
  $('#next-question').addEventListener('click', nextTrainingQuestion);
};

const stopWords = new Set('a à afin ainsi alors après au aucun aussi aux avant avec car ce ces cet cette comme d dans de des donc du elle elles en entre est et eux il ils je l la le les leur leurs lui mais me même mes moi moins mon ne ni nos notre nous on ont ou où par parce pas peut plus pour puis qu que quel quelle quels quelles qui sa sans se selon ses si son sont sous sur ta te tes toi ton tous tout toute toutes très tu un une vos votre vous y'.split(' '));
const wordTokens = (text) => text.match(/[A-Za-zÀ-ÖØ-öø-ÿŒœ0-9]+/g) || [];
const candidateWords = (text) => unique(wordTokens(text).filter((word) => !stopWords.has(normalize(word))));
const normalizedRecall = (value) => normalize(value)
  .replace(/[^a-z0-9œ\s]/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();

const definitionCoverage = (expected, answer) => {
  const expectedWords = wordTokens(normalizedRecall(expected)).filter((word) => !stopWords.has(word));
  const answerCounts = wordTokens(normalizedRecall(answer)).reduce((counts, word) => {
    counts.set(word, (counts.get(word) || 0) + 1);
    return counts;
  }, new Map());
  let matched = 0;
  expectedWords.forEach((word) => {
    const remaining = answerCounts.get(word) || 0;
    if (remaining > 0) {
      matched += 1;
      answerCounts.set(word, remaining - 1);
    }
  });
  return expectedWords.length ? Math.round((matched / expectedWords.length) * 100) : 0;
};

const bindDictation = () => {
  const button = $('#start-dictation');
  const status = $('#dictation-status');
  const answer = $('#recall-answer');
  if (!button || !status || !answer) return;
  const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!Recognition) {
    button.disabled = true;
    status.textContent = 'La dictée vocale n’est pas disponible dans ce navigateur. Tu peux utiliser le micro du clavier ou écrire la réponse.';
    return;
  }
  button.addEventListener('click', () => {
    if (activeRecognition) {
      stopRecognition();
      button.textContent = '● Reprendre la dictée';
      status.textContent = 'Dictée mise en pause.';
      return;
    }
    const recognition = new Recognition();
    let finalTranscript = answer.value.trim();
    recognition.lang = 'fr-FR';
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.onresult = (event) => {
      let interimTranscript = '';
      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const transcript = event.results[index][0].transcript.trim();
        if (event.results[index].isFinal) finalTranscript = `${finalTranscript} ${transcript}`.trim();
        else interimTranscript = transcript;
      }
      answer.value = `${finalTranscript} ${interimTranscript}`.trim();
      answer.dispatchEvent(new Event('input'));
    };
    recognition.onerror = (event) => {
      status.textContent = event.error === 'not-allowed'
        ? 'Autorise le micro dans les réglages du navigateur pour utiliser la récitation orale.'
        : 'La dictée a été interrompue. Tu peux la reprendre ou corriger la transcription à la main.';
    };
    recognition.onend = () => {
      if (activeRecognition === recognition) activeRecognition = null;
      button.textContent = '● Reprendre la dictée';
      if (!status.textContent.includes('Autorise')) status.textContent = 'Dictée arrêtée. Relis la transcription avant de vérifier.';
    };
    activeRecognition = recognition;
    button.textContent = '■ Arrêter la dictée';
    status.textContent = 'Écoute en cours… récite la définition naturellement.';
    try { recognition.start(); }
    catch { status.textContent = 'Le micro est déjà actif. Réessaie dans un instant.'; }
  });
};

const renderDefinitionRecall = () => {
  const session = trainingSession;
  const item = session.items[session.index];
  const oral = session.mode === 'oral-definition';
  const reverse = session.mode === 'free-term';
  const expected = reverse ? item.term : item.definition;
  const prompt = reverse ? item.definition : item.term;
  const promptLabel = reverse ? 'Écris la notion qui correspond à cette définition' : oral ? 'Récite entièrement la définition de cette notion' : 'Écris entièrement la définition de cette notion';
  const answerField = reverse
    ? '<input class="recall-input" id="recall-answer" type="text" autocomplete="off" placeholder="Écris la notion comptable…" />'
    : '<textarea class="recall-textarea" id="recall-answer" rows="7" placeholder="Rédige ou dicte la définition complète…"></textarea>';
  questionShell(`<section class="panel quiz-card recall-card">
    <span class="quiz-label">${escapeHTML(promptLabel)}</span>
    <div class="quiz-question ${reverse ? 'is-definition' : ''}">${escapeHTML(prompt)}</div>
    ${oral ? '<div class="dictation-controls"><button class="secondary-button" id="start-dictation" type="button">● Commencer la dictée</button><span id="dictation-status">Le navigateur demandera l’autorisation d’utiliser le micro.</span></div>' : ''}
    ${answerField}
    <div class="feedback-box" id="recall-feedback"></div>
    <div class="quiz-actions"><button class="secondary-button" id="clear-recall" type="button">Effacer</button><button class="primary-button" id="check-recall" type="button" disabled>Vérifier</button><button class="primary-button" id="next-question" type="button" hidden>Question suivante</button></div>
  </section>`);
  const answer = $('#recall-answer');
  answer.addEventListener('input', () => { $('#check-recall').disabled = !answer.value.trim(); });
  $('#clear-recall').addEventListener('click', () => { answer.value = ''; answer.dispatchEvent(new Event('input')); answer.focus(); });
  if (oral) bindDictation();
  $('#check-recall').addEventListener('click', () => {
    if (session.answered) return;
    stopRecognition();
    session.answered = true;
    const coverage = reverse ? (normalizedRecall(answer.value) === normalizedRecall(expected) ? 100 : 0) : definitionCoverage(expected, answer.value);
    const correct = reverse ? coverage === 100 : coverage >= 90;
    if (correct) session.score += 1;
    recordAnswer(correct, item.id);
    answer.disabled = true;
    $('#check-recall').hidden = true;
    $('#clear-recall').hidden = true;
    $('#start-dictation')?.setAttribute('hidden', '');
    const feedback = $('#recall-feedback');
    feedback.className = `feedback-box is-visible ${correct ? 'is-correct' : 'is-wrong'}`;
    feedback.innerHTML = reverse
      ? `<strong>${correct ? 'Exact.' : 'Correction'}</strong><p>${escapeHTML(item.term)}</p>`
      : `<strong>${correct ? `Définition maîtrisée · ${coverage} % des mots essentiels retrouvés` : `À revoir · ${coverage} % des mots essentiels retrouvés`}</strong><p><b>Définition complète :</b> ${escapeHTML(item.definition)}</p>`;
    $('#next-question').hidden = false;
  });
  $('#next-question').addEventListener('click', nextTrainingQuestion);
};

const makeCloze = (item, formulaMode) => {
  const source = formulaMode ? item.expression : item.definition;
  const maximum = String(state.trainingHoles) === 'max';
  const holeCount = maximum ? Number.POSITIVE_INFINITY : Number(state.trainingHoles) || 2;
  let answers;
  let parts;
  if (formulaMode) {
    let candidates = item.tokens.filter((token) => normalize(token) !== normalize(item.name));
    candidates = unique(candidates).filter((token) => normalize(source).includes(normalize(token)));
    answers = maximum ? candidates : shuffle(candidates).slice(0, Math.min(holeCount, candidates.length));
    let marked = source;
    answers = [...answers].sort((a, b) => b.length - a.length);
    answers.forEach((answer, index) => {
      const escaped = answer.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      marked = marked.replace(new RegExp(escaped, 'i'), `@@${index}@@`);
    });
    parts = marked.split(/(@@\d+@@)/g).map((part) => {
      const match = part.match(/^@@(\d+)@@$/);
      return match ? { slot: Number(match[1]) } : { text: part };
    });
  } else {
    const sourceParts = source.match(/[A-Za-zÀ-ÖØ-öø-ÿŒœ0-9]+|[^A-Za-zÀ-ÖØ-öø-ÿŒœ0-9]+/g) || [source];
    const eligibleIndexes = sourceParts
      .map((part, index) => ({ part, index }))
      .filter(({ part }) => /^[A-Za-zÀ-ÖØ-öø-ÿŒœ0-9]+$/.test(part) && !stopWords.has(normalize(part)))
      .map(({ index }) => index);
    const chosenIndexes = maximum ? eligibleIndexes : shuffle(eligibleIndexes).slice(0, Math.min(holeCount, eligibleIndexes.length));
    const chosen = new Set(chosenIndexes);
    answers = [];
    parts = sourceParts.map((part, index) => {
      if (!chosen.has(index)) return { text: part };
      const slot = answers.length;
      answers.push(part);
      return { slot };
    });
  }
  const otherPool = formulaMode
    ? DATA.formulas.flatMap((formula) => formula.tokens)
    : DATA.definitions.flatMap((definition) => candidateWords(definition.definition).slice(0, 4));
  const distractorCount = maximum ? Math.min(8, Math.max(2, Math.ceil(answers.length / 4))) : Math.max(2, answers.length);
  const distractors = shuffle(otherPool.filter((word) => !answers.some((answer) => normalize(answer) === normalize(word)))).slice(0, distractorCount);
  return { source, answers, parts, bank: shuffle([...answers, ...distractors]), selected: Array(answers.length).fill(null), usedBankIndexes: [] };
};

const renderCloze = () => {
  const session = trainingSession;
  const item = session.items[session.index];
  const formulaMode = session.mode === 'formula-cloze';
  const withPills = session.clozeAssistance !== 'typing';
  if (!session.currentCloze) session.currentCloze = makeCloze(item, formulaMode);
  const cloze = session.currentCloze;
  const text = cloze.parts.map((part) => {
    if (part.text !== undefined) return escapeHTML(part.text);
    if (withPills) return `<span class="blank-slot" data-slot="${part.slot}">${cloze.selected[part.slot] ? escapeHTML(cloze.selected[part.slot]) : `trou ${part.slot + 1}`}</span>`;
    return `<input class="blank-input" data-slot="${part.slot}" type="text" value="${escapeHTML(cloze.selected[part.slot] || '')}" placeholder="réponse ${part.slot + 1}" aria-label="Réponse du trou ${part.slot + 1}" autocomplete="off" />`;
  }).join('');
  const answerHelp = withPills
    ? `<div class="word-bank">${cloze.bank.map((word, index) => `<button class="word-chip" data-word-index="${index}" type="button" ${cloze.usedBankIndexes.includes(index) ? 'disabled' : ''}>${escapeHTML(word)}</button>`).join('')}</div>`
    : '<p class="cloze-free-hint">Écris directement chaque mot ou groupe de mots manquant, sans proposition.</p>';
  questionShell(`<section class="panel quiz-card">
    <span class="quiz-label">${formulaMode ? `Complète la formule · ${escapeHTML(item.name)}` : `Complète la définition · ${escapeHTML(item.term)}`} · ${withPills ? 'avec pastilles' : 'sans pastilles'}</span>
    <div class="cloze-text">${text}</div>
    ${answerHelp}
    <div class="feedback-box" id="cloze-feedback"></div>
    <div class="quiz-actions"><button class="secondary-button" id="clear-cloze" type="button">Effacer</button><button class="primary-button" id="check-cloze" type="button" ${cloze.selected.some((word) => !word) ? 'disabled' : ''}>Vérifier</button><button class="primary-button" id="next-question" type="button" hidden>Question suivante</button></div>
  </section>`);
  $$('[data-word-index]').forEach((button) => button.addEventListener('click', () => {
    const empty = cloze.selected.findIndex((value) => !value);
    if (empty < 0) return;
    const bankIndex = Number(button.dataset.wordIndex);
    cloze.selected[empty] = cloze.bank[bankIndex];
    cloze.usedBankIndexes.push(bankIndex);
    renderCloze();
  }));
  $$('[data-slot].blank-input').forEach((input) => input.addEventListener('input', () => {
    cloze.selected[Number(input.dataset.slot)] = input.value;
    $('#check-cloze').disabled = cloze.selected.some((word) => !String(word || '').trim());
  }));
  $('#clear-cloze').addEventListener('click', () => {
    cloze.selected = Array(cloze.answers.length).fill(null);
    cloze.usedBankIndexes = [];
    renderCloze();
  });
  $('#check-cloze').addEventListener('click', () => {
    if (session.answered) return;
    session.answered = true;
    const correct = cloze.answers.every((answer, index) => normalize(answer).trim() === normalize(cloze.selected[index] || '').trim());
    if (correct) session.score += 1;
    recordAnswer(correct, formulaMode ? null : item.id);
    $$('[data-slot]').forEach((slot) => {
      const index = Number(slot.dataset.slot);
      slot.classList.add(normalize(cloze.answers[index]).trim() === normalize(cloze.selected[index] || '').trim() ? 'is-correct' : 'is-wrong');
      if (slot.matches('input')) slot.disabled = true;
    });
    $$('[data-word-index]').forEach((button) => { button.disabled = true; });
    $('#check-cloze').hidden = true;
    $('#clear-cloze').hidden = true;
    const feedback = $('#cloze-feedback');
    feedback.className = `feedback-box is-visible ${correct ? 'is-correct' : 'is-wrong'}`;
    feedback.innerHTML = `<strong>${correct ? 'Exact.' : 'Correction'}</strong><p>${escapeHTML(cloze.source)}</p>`;
    $('#next-question').hidden = false;
  });
  $('#next-question').addEventListener('click', nextTrainingQuestion);
};

const renderTrainingResults = () => {
  const session = trainingSession;
  const percent = Math.round((session.score / session.items.length) * 100);
  $('#view-training').innerHTML = `<section class="panel results-card"><div class="results-score">${percent}%</div><span class="eyebrow">Session terminée</span><h2>${session.score} bonne${session.score > 1 ? 's' : ''} réponse${session.score > 1 ? 's' : ''} sur ${session.items.length}</h2><p>${percent >= 80 ? 'Très solide. Tu peux avancer ou augmenter le nombre de trous.' : percent >= 60 ? 'La base est là. Une seconde session fixera les hésitations.' : 'Les erreurs sont maintenant identifiées : révise les cartes faibles puis recommence.'}</p><div class="control-row" style="justify-content:center"><button class="secondary-button" id="back-training" type="button">Changer de mode</button><button class="primary-button" id="restart-training" type="button">Recommencer</button></div></section>`;
  const previousLength = session.items.length;
  $('#back-training').addEventListener('click', () => { trainingSession = null; renderTraining(); });
  $('#restart-training').addEventListener('click', () => { trainingSession = null; startTraining(previousLength); });
};

const voiceScore = (voice) => {
  const name = normalize(voice.name);
  let score = voice.lang?.toLowerCase() === 'fr-fr' ? 30 : voice.lang?.toLowerCase().startsWith('fr') ? 20 : 0;
  if (/denise|audrey|amelie|amélie|google français|google francais|thomas|henri|marie|hortense/.test(name)) score += 25;
  if (/natural|neural|premium|enhanced/.test(name)) score += 40;
  if (voice.localService) score += 4;
  if (voice.default) score += 3;
  return score;
};

const frenchVoices = () => window.speechSynthesis ? speechSynthesis.getVoices().filter((voice) => voice.lang?.toLowerCase().startsWith('fr')).sort((a, b) => voiceScore(b) - voiceScore(a)) : [];

const populateVoices = () => {
  const select = $('#voice-select');
  if (!select) return;
  const voices = frenchVoices();
  if (!voices.length) { select.innerHTML = '<option>Aucune voix française détectée</option>'; return; }
  if (!state.voiceURI || !voices.some((voice) => voice.voiceURI === state.voiceURI)) state.voiceURI = voices[0].voiceURI;
  select.innerHTML = voices.map((voice, index) => `<option value="${escapeHTML(voice.voiceURI)}" ${voice.voiceURI === state.voiceURI ? 'selected' : ''}>${index === 0 ? '★ ' : ''}${escapeHTML(voice.name)} · ${escapeHTML(voice.lang)}</option>`).join('');
  saveState();
};

const speechChunks = (text, maxLength = 240) => {
  const sentences = text.replace(/\s+/g, ' ').match(/[^.!?;:]+[.!?;:]?|.+$/g) || [text];
  const chunks = [];
  let current = '';
  for (const sentence of sentences) {
    if (`${current} ${sentence}`.trim().length > maxLength && current) { chunks.push(current.trim()); current = sentence; }
    else current += ` ${sentence}`;
  }
  if (current.trim()) chunks.push(current.trim());
  return chunks;
};

const updateAudioStatus = (message) => { const node = $('#audio-status'); if (node) node.textContent = message; };

const speakNext = () => {
  if (!speechQueue.length || speechIndex >= speechQueue.length) {
    speechStatus = 'idle';
    updateAudioStatus('Lecture terminée');
    return;
  }
  const utterance = new SpeechSynthesisUtterance(speechQueue[speechIndex]);
  const voices = frenchVoices();
  utterance.voice = voices.find((voice) => voice.voiceURI === state.voiceURI) || voices[0] || null;
  utterance.lang = 'fr-FR';
  utterance.rate = Number(state.voiceRate) || 1;
  utterance.pitch = 1;
  utterance.onend = () => { if (speechStatus === 'playing') { speechIndex += 1; speakNext(); } };
  utterance.onerror = () => { speechStatus = 'idle'; updateAudioStatus('Lecture vocale interrompue'); };
  speechSynthesis.speak(utterance);
  updateAudioStatus(`Lecture ${speechIndex + 1} / ${speechQueue.length}`);
};

const stopSpeech = () => {
  if (!window.speechSynthesis) return;
  speechSynthesis.cancel();
  speechQueue = [];
  speechIndex = 0;
  speechStatus = 'idle';
  updateAudioStatus('Lecture arrêtée');
};

const bindAudio = (lesson) => {
  if (!window.speechSynthesis) {
    updateAudioStatus('Lecture vocale non prise en charge par ce navigateur');
    $$('.audio-buttons button').forEach((button) => { button.disabled = true; });
    return;
  }
  populateVoices();
  $('#voice-select').addEventListener('change', (event) => { state.voiceURI = event.target.value; saveState(); stopSpeech(); updateAudioStatus('Voix sélectionnée'); });
  $('#rate-select').addEventListener('change', (event) => { state.voiceRate = Number(event.target.value); saveState(); stopSpeech(); updateAudioStatus('Vitesse enregistrée'); });
  $('#audio-play').addEventListener('click', () => {
    if (speechStatus === 'paused') { speechSynthesis.resume(); speechStatus = 'playing'; updateAudioStatus('Lecture reprise'); return; }
    stopSpeech();
    speechQueue = speechChunks(`${lesson.title}. ${lesson.content}`);
    speechIndex = 0;
    speechStatus = 'playing';
    speakNext();
  });
  $('#audio-pause').addEventListener('click', () => {
    if (speechStatus !== 'playing') return;
    speechSynthesis.pause(); speechStatus = 'paused'; updateAudioStatus('Lecture en pause');
  });
  $('#audio-stop').addEventListener('click', stopSpeech);
};

const renderView = (view) => {
  if (view === 'dashboard') renderDashboard();
  if (view === 'course') renderCourse();
  if (view === 'formulas') renderFormulas();
  if (view === 'glossary') renderGlossary();
  if (view === 'training') renderTraining();
};

const setView = (view, updateHash = true) => {
  const allowed = ['dashboard', 'course', 'formulas', 'glossary', 'training'];
  if (!allowed.includes(view)) view = 'dashboard';
  if (currentView === 'course' && view !== 'course') stopSpeech();
  currentView = view;
  $$('.view').forEach((section) => section.classList.toggle('is-visible', section.id === `view-${view}`));
  $$('[data-view]').forEach((button) => button.classList.toggle('is-active', button.dataset.view === view));
  const title = $(`#view-${view}`).dataset.pageTitle;
  $('#view-title').textContent = title;
  document.title = `${title} · ComptaMaster IFIP`;
  $('.sidebar').classList.remove('is-open');
  $('#menu-button').setAttribute('aria-expanded', 'false');
  if (updateHash && location.hash !== `#${view}`) history.pushState(null, '', `#${view}`);
  renderView(view);
  window.scrollTo({ top: 0, behavior: 'instant' });
};

const bindShell = () => {
  $$('[data-view]').forEach((button) => button.addEventListener('click', () => setView(button.dataset.view)));
  $('#theme-button').addEventListener('click', () => setTheme(state.theme === 'dark' ? 'light' : 'dark'));
  $('#menu-button').addEventListener('click', () => {
    const sidebar = $('.sidebar');
    const open = sidebar.classList.toggle('is-open');
    $('#menu-button').setAttribute('aria-expanded', String(open));
  });
  window.addEventListener('hashchange', () => setView(location.hash.slice(1) || 'dashboard', false));
  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault(); deferredInstallPrompt = event; $('#install-button').hidden = false;
  });
  $('#install-button').addEventListener('click', async () => {
    if (!deferredInstallPrompt) return;
    deferredInstallPrompt.prompt(); await deferredInstallPrompt.userChoice;
    deferredInstallPrompt = null; $('#install-button').hidden = true;
  });
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js').catch(() => {});
  if (window.speechSynthesis) speechSynthesis.onvoiceschanged = populateVoices;
};

setTheme(state.theme);
bindShell();
updateProgressUI();
setView(location.hash.slice(1) || 'dashboard', false);
