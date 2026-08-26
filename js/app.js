/**
 * app.js — Main application logic.
 *
 * Everything is driven by the active training program (see programs.js):
 * the plan, the session runner, the history and the settings.
 */
(() => {
  // ===================== DOM REFS =====================
  const $ = id => document.getElementById(id);
  const tabs = document.querySelectorAll('.tab');
  const views = document.querySelectorAll('.view');

  const activeProgramName = $('active-program-name');

  // Programs — browser
  const programsBrowser = $('programs-browser');
  const programsList = $('programs-list');
  const btnNewProgram = $('btn-new-program');
  const btnImportProgram = $('btn-import-program');
  const btnExportAllPrograms = $('btn-export-all-programs');
  const btnResetPrograms = $('btn-reset-programs');
  const importProgramFile = $('import-program-file');

  // Programs — editor
  const programEditor = $('program-editor');
  const btnBackPrograms = $('btn-back-programs');
  const programEditorTitle = $('program-editor-title');
  const peName = $('pe-name');
  const peDescription = $('pe-description');
  const peRules = $('pe-rules');
  const peRating = $('pe-rating');
  const peManualAdvance = $('pe-manual-advance');
  const peExercisesList = $('pe-exercises-list');
  const peDaysList = $('pe-days-list');
  const peError = $('pe-error');
  const btnPeNewExercise = $('btn-pe-new-exercise');
  const btnPeAddDay = $('btn-pe-add-day');
  const btnPeSave = $('btn-pe-save');
  const btnPeSaveLoad = $('btn-pe-save-load');
  const btnPeExport = $('btn-pe-export');
  const btnPeDelete = $('btn-pe-delete');

  // Dashboard
  const programSummary = $('program-summary');
  const dayGrid = $('day-grid');
  const rulesCard = $('rules-card');
  const rulesList = $('rules-list');
  const dayNoteCard = $('day-note-card');
  const dayNoteTitle = $('day-note-title');
  const dayNoteText = $('day-note-text');

  // Session — picker
  const exercisePicker = $('exercise-picker');
  const exerciseList = $('exercise-list');

  // Session — runner
  const exerciseRunner = $('exercise-runner');
  const btnBackPicker = $('btn-back-picker');
  const runnerTitle = $('runner-title');
  const runnerSubtitle = $('runner-subtitle');
  const runnerInstructions = $('runner-instructions');
  const progressLabel = $('progress-label');
  const progressFill = $('progress-fill');
  const timerContainer = $('timer-container');
  const timerRing = $('timer-ring');
  const timerDisplay = $('timer-display');
  const timerLabel = $('timer-label');
  const countdownOverlay = $('countdown-overlay');
  const countdownNumber = $('countdown-number');

  const btnStart = $('btn-start');
  const btnPause = $('btn-pause');
  const btnResume = $('btn-resume');
  const btnNext = $('btn-next');
  const btnDone = $('btn-done');

  const ratingPanel = $('rating-panel');
  const ratingTitle = $('rating-title');
  const ratingScale = $('rating-scale');
  const ratingDescription = $('rating-description');
  const btnSaveRating = $('btn-save-rating');

  // History
  const historyList = $('history-list');
  const historyEmpty = $('history-empty');
  const btnReset = $('btn-reset');

  // Settings
  const settingsProgramSelect = $('settings-program-select');
  const btnEditProgram = $('btn-edit-program');
  const settingsDaysList = $('settings-days-list');
  const settingsStartDate = $('settings-start-date');
  const btnSaveDate = $('btn-save-date');
  const settingsSound = $('settings-sound');
  const settingsNotify = $('settings-notify');
  const notifyLevelBlock = $('notify-level-block');
  const notifyLevelPicker = $('notify-level-picker');
  const notifyStatus = $('notify-status');
  const btnNotifyTest = $('btn-notify-test');

  // Exercise editor modal
  const editorOverlay = $('exercise-editor-overlay');
  const editorTitle = $('editor-title');
  const edName = $('ed-name');
  const edSubtitle = $('ed-subtitle');
  const edDescription = $('ed-description');
  const edTag = $('ed-tag');
  const edTagLabel = $('ed-taglabel');
  const edTimerType = $('ed-timertype');
  const edSets = $('ed-sets');
  const edReps = $('ed-reps');
  const edHold = $('ed-hold');
  const edDescent = $('ed-descent');
  const edRest = $('ed-rest');
  const edFieldHold = $('ed-field-hold');
  const edFieldDescent = $('ed-field-descent');
  const edLoad = $('ed-load');
  const edFrequency = $('ed-frequency');
  const edVariants = $('ed-variants');
  const editorError = $('editor-error');
  const btnEditorSave = $('btn-editor-save');
  const btnEditorCancel = $('btn-editor-cancel');
  const btnEditorDelete = $('btn-editor-delete');

  // ===================== STATE =====================
  let currentExercise = null;
  let currentVariant = null;
  let currentSet = 0;
  let currentRep = 0;
  let phase = 'idle'; // idle | countdown | hold | descent | rest | repWait | done
  let selectedRating = null;
  let selectedDay = null; // null = use currentDay
  let currentSessionId = null;

  let pendingNext = null; // step waiting for a manual "Suivant" (manual-advance programs)

  let draft = null;      // program being edited (working copy)
  let editingExId = null; // exercise being edited inside the draft

  // ===================== HELPERS =====================
  function escapeHtml(text) {
    return String(text).replace(/[&<>"']/g, c => (
      { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
    ));
  }

  function activeProgram() {
    return Programs.getActive();
  }

  function plannedDay() {
    return selectedDay || Storage.getCurrentDay();
  }

  // ===================== NAVIGATION =====================
  function switchTab(target) {
    tabs.forEach(t => t.classList.toggle('active', t.dataset.view === target));
    views.forEach(v => v.classList.toggle('active', v.id === `view-${target}`));
    renderView(target);
  }

  function renderView(target) {
    if (target === 'programs') renderPrograms();
    if (target === 'dashboard') renderDashboard();
    if (target === 'session') renderExercisePicker();
    if (target === 'history') renderHistory();
    if (target === 'settings') renderSettings();
  }

  tabs.forEach(tab => {
    tab.addEventListener('click', () => switchTab(tab.dataset.view));
  });

  function switchToSession(dayNum) {
    selectedDay = dayNum;
    switchTab('session');
  }

  /** Called whenever the active program or its content changed. */
  function refreshAll() {
    selectedDay = null;
    currentSessionId = null;
    renderHeader();
    renderDashboard();
  }

  function renderHeader() {
    const program = activeProgram();
    activeProgramName.textContent = program ? program.name : '';
  }

  // ===================== PROGRAMS — BROWSER =====================
  function renderPrograms() {
    programsBrowser.style.display = 'block';
    programEditor.style.display = 'none';
    programsList.innerHTML = '';

    const activeId = Programs.getActiveId();

    Programs.getAll().forEach(program => {
      const isActive = program.id === activeId;
      const dayCount = program.days.length;
      const exCount = program.exercises.length;

      const card = document.createElement('div');
      card.className = 'program-card' + (isActive ? ' active' : '');
      card.innerHTML = `
        <div class="program-card-head">
          <h3>${escapeHtml(program.name)}</h3>
          ${isActive ? '<span class="program-badge">Chargé</span>' : ''}
        </div>
        <p class="program-desc">${escapeHtml(program.description || 'Sans description')}</p>
        <div class="program-meta">
          <span>${dayCount} jour${dayCount > 1 ? 's' : ''}</span>
          <span>${exCount} exercice${exCount > 1 ? 's' : ''}</span>
          ${program.builtIn ? '<span>Fourni</span>' : ''}
        </div>
        <div class="program-actions">
          ${isActive ? '' : '<button class="btn btn-primary btn-small" data-act="load">Charger</button>'}
          <button class="btn btn-secondary btn-small" data-act="edit">Modifier</button>
          <button class="btn btn-secondary btn-small" data-act="duplicate">Dupliquer</button>
          <button class="btn btn-secondary btn-small" data-act="export">Exporter</button>
          <button class="btn btn-danger btn-small" data-act="delete">Supprimer</button>
        </div>
      `;

      card.querySelectorAll('[data-act]').forEach(btn => {
        btn.addEventListener('click', () => handleProgramAction(btn.dataset.act, program.id));
      });
      programsList.appendChild(card);
    });
  }

  function handleProgramAction(action, id) {
    const program = Programs.getById(id);
    if (!program) return;

    if (action === 'load') {
      Programs.setActive(id);
      refreshAll();
      switchTab('dashboard');
      return;
    }
    if (action === 'edit') {
      openProgramEditor(id);
      return;
    }
    if (action === 'duplicate') {
      const copy = Programs.duplicate(id);
      renderPrograms();
      if (copy) openProgramEditor(copy.id);
      return;
    }
    if (action === 'export') {
      downloadJSON(Programs.exportProgram(id), `programme-${id}.json`);
      return;
    }
    if (action === 'delete') {
      if (!confirm(`Supprimer le programme « ${program.name} » et son historique ?`)) return;
      if (!Programs.removeProgram(id)) {
        alert('Impossible de supprimer le dernier programme.');
        return;
      }
      Storage.dropProgram(id);
      refreshAll();
      renderPrograms();
    }
  }

  function downloadJSON(text, filename) {
    if (!text) return;
    const blob = new Blob([text], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(a.href);
  }

  btnNewProgram.addEventListener('click', () => openProgramEditor(null));

  btnExportAllPrograms.addEventListener('click', () => {
    downloadJSON(Programs.exportAll(), `mow-programmes-${new Date().toISOString().slice(0, 10)}.json`);
  });

  btnImportProgram.addEventListener('click', () => importProgramFile.click());

  importProgramFile.addEventListener('change', () => {
    const file = importProgramFile.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const result = Programs.importJSON(reader.result);
        renderPrograms();
        if (result.imported === 1 && confirm('Programme importé. Le charger maintenant ?')) {
          Programs.setActive(result.lastId);
          refreshAll();
          switchTab('dashboard');
        } else {
          alert(`${result.imported} programme(s) importé(s).`);
        }
      } catch (e) {
        alert('Import impossible : ' + e.message);
      }
      importProgramFile.value = '';
    };
    reader.readAsText(file);
  });

  btnResetPrograms.addEventListener('click', () => {
    if (!confirm('Restaurer les programmes fournis ? Les programmes personnalisés seront supprimés.')) return;
    Programs.resetDefaults();
    refreshAll();
    renderPrograms();
  });

  // ===================== PROGRAMS — EDITOR =====================
  function openProgramEditor(id) {
    const program = id ? Programs.getById(id) : null;
    draft = program ? JSON.parse(JSON.stringify(program)) : Programs.blankProgram();
    // A new program gets its id from the name it is saved under, not the placeholder.
    if (!program) draft.id = '';

    switchTab('programs');
    programsBrowser.style.display = 'none';
    programEditor.style.display = 'block';
    programEditorTitle.textContent = program ? 'Modifier le programme' : 'Nouveau programme';

    peName.value = draft.name;
    peDescription.value = draft.description;
    peRules.value = draft.rules.join('\n');
    peRating.value = draft.ratingType;
    peManualAdvance.checked = draft.manualAdvance === true;
    peError.style.display = 'none';
    btnPeDelete.style.display = program ? '' : 'none';
    btnPeExport.style.display = program ? '' : 'none';

    renderDraftExercises();
    renderDraftDays();
    window.scrollTo(0, 0);
  }

  function closeProgramEditor() {
    draft = null;
    renderPrograms();
  }

  btnBackPrograms.addEventListener('click', closeProgramEditor);

  function renderDraftExercises() {
    peExercisesList.innerHTML = '';
    if (!draft.exercises.length) {
      peExercisesList.innerHTML = '<p class="settings-hint">Aucun exercice pour le moment.</p>';
      return;
    }
    draft.exercises.forEach(ex => {
      const row = document.createElement('div');
      row.className = 'settings-ex-row';
      row.innerHTML = `
        <div class="settings-ex-info">
          <span class="ex-tag ${ex.tag}">${escapeHtml(ex.tagLabel)}</span>
          <div>
            <div class="settings-ex-name">${escapeHtml(ex.name)}</div>
            <div class="settings-ex-detail">${escapeHtml(ex.dosageText)} — ${ExerciseModel.TIMER_TYPE_LABELS[ex.timerType]}</div>
          </div>
        </div>
        <button class="btn btn-small btn-secondary">Modifier</button>
      `;
      row.querySelector('button').addEventListener('click', () => openExerciseEditor(ex.id));
      peExercisesList.appendChild(row);
    });
  }

  function renderDraftDays() {
    peDaysList.innerHTML = '';

    draft.days.forEach((day, index) => {
      const row = document.createElement('div');
      row.className = 'pe-day';

      const checkboxes = draft.exercises.map(ex => `
        <label class="pe-day-ex">
          <input type="checkbox" data-ex="${escapeHtml(ex.id)}"${day.exercises.includes(ex.id) ? ' checked' : ''}>
          <span>${escapeHtml(ex.name)}</span>
        </label>
      `).join('') || '<p class="settings-hint">Ajoute d\'abord des exercices.</p>';

      row.innerHTML = `
        <div class="pe-day-head">
          <span class="pe-day-num">${index + 1}</span>
          <input type="text" class="ed-input pe-day-label" value="${escapeHtml(day.label)}" placeholder="Nom du jour">
          <div class="pe-day-move">
            <button class="btn btn-secondary btn-tiny" data-move="up" ${index === 0 ? 'disabled' : ''}>↑</button>
            <button class="btn btn-secondary btn-tiny" data-move="down" ${index === draft.days.length - 1 ? 'disabled' : ''}>↓</button>
            <button class="btn btn-danger btn-tiny" data-remove="1">✕</button>
          </div>
        </div>
        <input type="text" class="ed-input pe-day-desc" value="${escapeHtml(day.description)}" placeholder="Consigne du jour">
        <div class="pe-day-row">
          <label class="pe-day-sessions">
            Séances / jour
            <input type="number" class="ed-input pe-day-max" min="1" max="10" value="${day.maxSessions}">
          </label>
        </div>
        <div class="pe-day-exercises">${checkboxes}</div>
        <details class="pe-day-note">
          <summary>Note affichée sur le plan (optionnel)</summary>
          <input type="text" class="ed-input pe-day-note-title" value="${escapeHtml(day.noteTitle)}" placeholder="Titre de la note">
          <textarea class="ed-input pe-day-note-text" rows="2" placeholder="Texte de la note">${escapeHtml(day.note)}</textarea>
        </details>
      `;

      row.querySelector('.pe-day-label').addEventListener('input', e => { day.label = e.target.value; });
      row.querySelector('.pe-day-desc').addEventListener('input', e => { day.description = e.target.value; });
      row.querySelector('.pe-day-max').addEventListener('change', e => {
        day.maxSessions = ExerciseModel.clampInt(e.target.value, 1, 10, 1);
        e.target.value = day.maxSessions;
      });
      row.querySelector('.pe-day-note-title').addEventListener('input', e => { day.noteTitle = e.target.value; });
      row.querySelector('.pe-day-note-text').addEventListener('input', e => { day.note = e.target.value; });

      row.querySelectorAll('[data-ex]').forEach(cb => {
        cb.addEventListener('change', () => {
          const exId = cb.dataset.ex;
          if (cb.checked) {
            if (!day.exercises.includes(exId)) day.exercises.push(exId);
          } else {
            day.exercises = day.exercises.filter(id => id !== exId);
          }
        });
      });

      row.querySelectorAll('[data-move]').forEach(btn => {
        btn.addEventListener('click', () => {
          const to = btn.dataset.move === 'up' ? index - 1 : index + 1;
          if (to < 0 || to >= draft.days.length) return;
          const [moved] = draft.days.splice(index, 1);
          draft.days.splice(to, 0, moved);
          renderDraftDays();
        });
      });

      row.querySelector('[data-remove]').addEventListener('click', () => {
        if (draft.days.length <= 1) {
          showProgramError('Un programme doit contenir au moins un jour.');
          return;
        }
        draft.days.splice(index, 1);
        renderDraftDays();
      });

      peDaysList.appendChild(row);
    });
  }

  function showProgramError(msg) {
    peError.textContent = msg;
    peError.style.display = 'block';
  }

  btnPeAddDay.addEventListener('click', () => {
    draft.days.push({
      day: draft.days.length + 1,
      label: `Jour ${draft.days.length + 1}`,
      description: '',
      note: '',
      noteTitle: 'Note',
      exercises: [],
      maxSessions: 1
    });
    renderDraftDays();
  });

  btnPeNewExercise.addEventListener('click', () => openExerciseEditor(null));

  /** Collects the free-text fields into the draft before saving. */
  function syncDraftFields() {
    draft.name = peName.value.trim();
    draft.description = peDescription.value.trim();
    draft.rules = peRules.value.split('\n').map(r => r.trim()).filter(Boolean);
    draft.ratingType = peRating.value;
    draft.manualAdvance = peManualAdvance.checked;
  }

  function saveDraft() {
    syncDraftFields();
    if (!draft.name) {
      showProgramError('Le nom du programme est obligatoire.');
      return null;
    }
    if (!draft.exercises.length) {
      showProgramError('Ajoute au moins un exercice.');
      return null;
    }
    if (draft.days.every(d => !d.exercises.length)) {
      showProgramError('Au moins un jour doit contenir un exercice.');
      return null;
    }
    if (!draft.id) draft.id = Programs.createProgramId(draft.name);
    const saved = Programs.saveProgram(draft);
    if (!saved) {
      showProgramError("Impossible d'enregistrer ce programme.");
      return null;
    }
    peError.style.display = 'none';
    return saved;
  }

  btnPeSave.addEventListener('click', () => {
    const saved = saveDraft();
    if (!saved) return;
    draft = null;
    renderHeader();
    renderDashboard();
    renderPrograms();
  });

  btnPeSaveLoad.addEventListener('click', () => {
    const saved = saveDraft();
    if (!saved) return;
    Programs.setActive(saved.id);
    draft = null;
    refreshAll();
    switchTab('dashboard');
  });

  btnPeExport.addEventListener('click', () => {
    const saved = saveDraft();
    if (!saved) return;
    downloadJSON(Programs.exportProgram(saved.id), `programme-${saved.id}.json`);
  });

  btnPeDelete.addEventListener('click', () => {
    if (!draft) return;
    if (!confirm(`Supprimer le programme « ${draft.name} » et son historique ?`)) return;
    if (!Programs.removeProgram(draft.id)) {
      showProgramError('Impossible de supprimer le dernier programme.');
      return;
    }
    Storage.dropProgram(draft.id);
    draft = null;
    refreshAll();
    renderPrograms();
  });

  // ===================== EXERCISE EDITOR (inside a program) =====================
  function updateEditorTimerFields() {
    const t = edTimerType.value;
    edFieldHold.style.display = t === 'hold' ? '' : 'none';
    edFieldDescent.style.display = t === 'descent' ? '' : 'none';
  }
  edTimerType.addEventListener('change', updateEditorTimerFields);

  function openExerciseEditor(id) {
    if (!draft) return;
    editingExId = id || null;
    const ex = id ? draft.exercises.find(e => e.id === id) : null;

    editorTitle.textContent = ex ? `Modifier — ${ex.name}` : 'Nouvel exercice';
    edName.value = ex ? ex.name : '';
    edSubtitle.value = ex ? ex.subtitle : '';
    edDescription.value = ex ? ex.description : '';
    edTag.value = ex ? ex.tag : 'blue';
    edTagLabel.value = ex ? ex.tagLabel : '';
    edTimerType.value = ex ? ex.timerType : 'hold';
    edSets.value = ex ? ex.sets : 1;
    edReps.value = ex ? ex.reps : 10;
    edHold.value = (ex && ex.holdSeconds) ? ex.holdSeconds : 30;
    edDescent.value = (ex && ex.descentSeconds) ? ex.descentSeconds : 5;
    edRest.value = ex ? ex.restSeconds : 30;
    edLoad.value = ex ? (ex.loadText || '') : '';
    edFrequency.value = ex ? ex.frequencyText : '1x / jour';
    edVariants.value = (ex && ex.variants) ? ex.variants.map(v => v.label).join(', ') : '';

    editorError.style.display = 'none';
    btnEditorDelete.style.display = id ? '' : 'none';
    updateEditorTimerFields();
    editorOverlay.style.display = 'flex';
  }

  function closeExerciseEditor() {
    editorOverlay.style.display = 'none';
    editingExId = null;
  }

  function showEditorError(msg) {
    editorError.textContent = msg;
    editorError.style.display = 'block';
  }

  btnEditorCancel.addEventListener('click', closeExerciseEditor);
  editorOverlay.addEventListener('click', (e) => {
    if (e.target === editorOverlay) closeExerciseEditor();
  });

  btnEditorSave.addEventListener('click', () => {
    if (!draft) return;
    const name = edName.value.trim();
    if (!name) {
      showEditorError('Le nom est obligatoire.');
      return;
    }

    const existing = editingExId ? draft.exercises.find(e => e.id === editingExId) : null;

    // Build variants; keep existing ids when labels match so history stays readable
    let variants = null;
    const labels = edVariants.value.split(',').map(s => s.trim()).filter(Boolean);
    if (labels.length) {
      variants = labels.map(label => {
        const prev = (existing && existing.variants)
          ? existing.variants.find(v => v.label.toLowerCase() === label.toLowerCase())
          : null;
        return { id: prev ? prev.id : ExerciseModel.slugify(label, 'variante'), label };
      });
    }

    const ex = ExerciseModel.normalize({
      id: editingExId || ExerciseModel.createId(name, draft.exercises),
      name,
      subtitle: edSubtitle.value.trim(),
      description: edDescription.value.trim(),
      tag: edTag.value,
      tagLabel: edTagLabel.value.trim() || 'Exercice',
      timerType: edTimerType.value,
      sets: edSets.value,
      reps: edReps.value,
      holdSeconds: edHold.value,
      descentSeconds: edDescent.value,
      restSeconds: edRest.value,
      loadText: edLoad.value.trim(),
      frequencyText: edFrequency.value.trim() || '1x / jour',
      variants
    });

    if (!ex) {
      showEditorError("Impossible d'enregistrer cet exercice. Vérifie les champs.");
      return;
    }

    const idx = draft.exercises.findIndex(e => e.id === ex.id);
    if (idx >= 0) draft.exercises[idx] = ex;
    else draft.exercises.push(ex);

    closeExerciseEditor();
    renderDraftExercises();
    renderDraftDays();
  });

  btnEditorDelete.addEventListener('click', () => {
    if (!editingExId || !draft) return;
    if (!confirm('Supprimer cet exercice du programme ?')) return;
    draft.exercises = draft.exercises.filter(e => e.id !== editingExId);
    draft.days.forEach(d => { d.exercises = d.exercises.filter(id => id !== editingExId); });
    closeExerciseEditor();
    renderDraftExercises();
    renderDraftDays();
  });

  // ===================== DASHBOARD =====================
  function isDayCompleted(day) {
    if (Storage.isDayManuallyDone(day.day)) return true;
    const dateStr = Storage.getDateForDay(day.day);
    return Storage.getSessionCountForDate(dateStr) >= day.maxSessions;
  }

  function renderDashboard() {
    const program = activeProgram();
    renderHeader();
    if (!program) return;

    const currentDay = Storage.getCurrentDay();

    programSummary.innerHTML = `
      <h3>${escapeHtml(program.name)}</h3>
      ${program.description ? `<p class="subtitle">${escapeHtml(program.description)}</p>` : ''}
      <p class="program-progress">Jour ${currentDay} / ${program.days.length}</p>
    `;

    dayGrid.innerHTML = '';
    program.days.forEach(day => {
      const dateStr = Storage.getDateForDay(day.day);
      const sessionsToday = Storage.getSessionCountForDate(dateStr);
      const isToday = day.day === currentDay;
      const isCompleted = isDayCompleted(day);

      const card = document.createElement('div');
      card.className = 'day-card clickable' + (isToday ? ' today' : '') + (isCompleted ? ' completed' : '');

      let dotsHtml = '';
      for (let i = 0; i < day.maxSessions; i++) {
        dotsHtml += `<div class="session-dot${i < sessionsToday ? ' done' : ''}"></div>`;
      }

      const exerciseNames = day.exercises.map(id => {
        const ex = Programs.getExercise(program, id);
        return ex ? ex.name : id;
      }).join(', ') || 'Repos';

      card.innerHTML = `
        <div class="day-number">${isCompleted ? '✓' : day.day}</div>
        <div class="day-info">
          <h3>${escapeHtml(day.label)}</h3>
          <p>${escapeHtml(day.description)}</p>
          <p style="margin-top:4px;font-size:0.75rem;color:var(--text-dim)">${escapeHtml(exerciseNames)}</p>
        </div>
        <div class="day-sessions">${dotsHtml}</div>
      `;

      card.addEventListener('click', () => switchToSession(day.day));
      dayGrid.appendChild(card);
    });

    // Program rules
    if (program.rules.length) {
      rulesList.innerHTML = program.rules.map(r => `<li>${escapeHtml(r)}</li>`).join('');
      rulesCard.style.display = 'block';
    } else {
      rulesCard.style.display = 'none';
    }

    // Note attached to the current day
    const today = Programs.getDay(program, currentDay);
    if (today && today.note) {
      dayNoteTitle.textContent = today.noteTitle || 'Note';
      dayNoteText.textContent = today.note;
      dayNoteCard.style.display = 'block';
    } else {
      dayNoteCard.style.display = 'none';
    }
  }

  // ===================== EXERCISE PICKER =====================
  function renderExercisePicker() {
    exercisePicker.style.display = 'block';
    exerciseRunner.style.display = 'none';
    Timer.stop();
    WakeLock.disable();
    phase = 'idle';
    pendingNext = null;
    exerciseList.innerHTML = '';

    const program = activeProgram();
    const day = plannedDay();
    const plan = Programs.getDay(program, day);
    const dateStr = Storage.getDateForDay(day);

    // Get or start in-progress session for this day
    const session = Storage.startOrGetSession(dateStr, day);
    currentSessionId = session.sessionId;

    // Which exercises have been done in this session?
    const doneExIds = new Set(
      Storage.getSessions()
        .filter(s => s.sessionId === currentSessionId)
        .map(s => s.exerciseId)
    );

    exercisePicker.querySelector('h2').textContent = `Séance — ${plan ? plan.label : `Jour ${day}`}`;

    function buildExerciseCard(ex, isDone) {
      const card = document.createElement('div');
      card.className = 'exercise-card' + (isDone ? ' ex-done' : '');
      card.innerHTML = `
        <div class="ex-card-header">
          <span class="ex-tag ${ex.tag}">${escapeHtml(ex.tagLabel)}</span>
          ${isDone ? '<span class="ex-check">✓</span>' : ''}
        </div>
        <h3>${escapeHtml(ex.name)}</h3>
        <p>${escapeHtml(ex.subtitle)}</p>
        <div class="ex-dosage">
          <span>${escapeHtml(ex.dosageText)}${ex.loadText ? ` · ${escapeHtml(ex.loadText)}` : ''}</span>
          <span>${escapeHtml(ex.frequencyText)}</span>
        </div>
      `;
      card.addEventListener('click', () => startExercise(ex));
      return card;
    }

    const planIds = plan ? plan.exercises : [];
    planIds.forEach(exId => {
      const ex = Programs.getExercise(program, exId);
      if (ex) exerciseList.appendChild(buildExerciseCard(ex, doneExIds.has(exId)));
    });

    if (!planIds.length) {
      const empty = document.createElement('p');
      empty.className = 'settings-hint';
      empty.textContent = 'Aucun exercice prévu ce jour-là.';
      exerciseList.appendChild(empty);
    }

    // Exercises of the program that are not scheduled today
    const extras = program.exercises.filter(ex => !planIds.includes(ex.id));
    if (extras.length) {
      const heading = document.createElement('div');
      heading.className = 'picker-section-title';
      heading.textContent = 'Autres exercices';
      exerciseList.appendChild(heading);
      extras.forEach(ex => exerciseList.appendChild(buildExerciseCard(ex, doneExIds.has(ex.id))));
    }

    // Remove old validate button if present
    const existingValidate = exercisePicker.querySelector('.btn-validate-session');
    if (existingValidate) existingValidate.remove();

    // Show validate button only when all scheduled exercises are done
    const allDone = planIds.length > 0 && planIds.every(id => doneExIds.has(id));
    if (allDone) {
      const validateBtn = document.createElement('button');
      validateBtn.className = 'btn btn-success btn-large btn-validate-session';
      validateBtn.textContent = 'Valider la séance ✓';
      validateBtn.addEventListener('click', () => {
        Storage.completeSession(currentSessionId);
        Notify.exercise('Séance terminée', `${plan ? plan.label : `Jour ${day}`} — bien joué !`);
        currentSessionId = null;
        renderDashboard();
        switchTab('dashboard');
      });
      exerciseList.after(validateBtn);
    }
  }

  // ===================== EXERCISE RUNNER =====================
  function startExercise(exercise) {
    currentExercise = exercise;
    currentSet = 1;
    currentRep = 0;
    currentVariant = null;
    selectedRating = null;
    phase = 'idle';
    pendingNext = null;

    WakeLock.enable(); // keep the screen on during the exercise

    exercisePicker.style.display = 'none';
    exerciseRunner.style.display = 'block';

    runnerTitle.textContent = exercise.name;
    runnerSubtitle.textContent = [exercise.subtitle, exercise.loadText].filter(Boolean).join(' · ');
    runnerInstructions.innerHTML = exercise.description;

    const existing = document.querySelector('.variant-picker');
    if (existing) existing.remove();

    if (exercise.variants) {
      const picker = document.createElement('div');
      picker.className = 'variant-picker';
      picker.innerHTML = `
        <label>Variante :</label>
        <div class="variant-btns">
          ${exercise.variants.map((v, i) =>
            `<button class="variant-btn${i === 0 ? ' active' : ''}" data-variant="${escapeHtml(v.id)}">${escapeHtml(v.label)}</button>`
          ).join('')}
        </div>
      `;
      runnerInstructions.after(picker);
      currentVariant = exercise.variants[0].id;

      picker.querySelectorAll('.variant-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          picker.querySelectorAll('.variant-btn').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          currentVariant = btn.dataset.variant;
        });
      });
    }

    updateProgress();
    showButtons('start');
    timerContainer.style.display = 'none';
    ratingPanel.style.display = 'none';
  }

  btnBackPicker.addEventListener('click', () => {
    Timer.stop();
    const vp = document.querySelector('.variant-picker');
    if (vp) vp.remove();
    renderExercisePicker();
  });

  // ===================== BUTTON HANDLERS =====================
  btnStart.addEventListener('click', () => {
    if (phase === 'idle') {
      Sound.unlock(); // audio needs a user gesture on mobile
      Notify.exercise(currentExercise.name, `Démarré — ${currentExercise.dosageText}`);
      currentRep = 0;
      nextRep();
    }
  });

  btnPause.addEventListener('click', () => {
    Timer.pause();
    showButtons('resume');
  });

  btnResume.addEventListener('click', () => {
    Timer.resume();
    showButtons('pause');
  });

  btnNext.addEventListener('click', () => {
    // Resume a manual pause, or skip to the next step
    Timer.stop();
    if (pendingNext) {
      const next = pendingNext;
      pendingNext = null;
      next();
      return;
    }
    advanceStep();
  });

  btnDone.addEventListener('click', showRating);

  // ===================== NOTIFICATION CUES =====================
  /** Short "série x/y — rep a/b" context line used by movement notifications. */
  function stepContext() {
    const ex = currentExercise;
    const parts = [];
    if (ex.sets > 1) parts.push(`Série ${currentSet}/${ex.sets}`);
    parts.push(`Rep ${Math.min(currentRep, ex.reps)}/${ex.reps}`);
    return parts.join(' · ');
  }

  function notifyMovement(action) {
    Notify.movement(currentExercise.name, `${action} — ${stepContext()}`);
  }

  // ===================== MANUAL ADVANCE =====================
  /** Some programs (e.g. training during a meeting) never chain steps on their own. */
  function manualAdvanceEnabled() {
    const program = activeProgram();
    return !!(program && program.manualAdvance);
  }

  /** Holds the flow until the user taps "Suivant". */
  function waitForUser(label, next) {
    pendingNext = next;
    phase = 'repWait';
    timerContainer.style.display = 'flex';
    timerRing.classList.add('rest');
    timerRing.style.strokeDashoffset = 0;
    timerDisplay.textContent = '▶';
    timerLabel.textContent = label;
    Notify.movement(currentExercise.name, `${label} — appuie sur Suivant`);
    showButtons('next');
  }

  /** Rest timer, or a manual pause when the program asks for it. */
  function pauseThen(seconds, label, next) {
    if (manualAdvanceEnabled()) {
      waitForUser(label, next);
      return;
    }
    startRestTimer(seconds, next);
  }

  // ===================== EXERCISE FLOW =====================
  function finishExercise() {
    phase = 'done';
    Sound.complete();
    Notify.exercise(`${currentExercise.name} terminé`, `${currentExercise.dosageText} — évalue ta séance.`);
    updateProgress();
    timerContainer.style.display = 'none';
    showButtons('done');
  }

  function nextRep() {
    currentRep++;
    const ex = currentExercise;
    const totalReps = ex.reps;

    if (currentRep > totalReps) {
      // Set complete
      if (currentSet < ex.sets) {
        phase = 'rest';
        updateProgress();
        Notify.movement(ex.name, `Série ${currentSet}/${ex.sets} terminée — repos ${ex.restSeconds}s`);
        pauseThen(ex.restSeconds, 'Série suivante', () => {
          currentSet++;
          currentRep = 0;
          nextRep();
        });
        return;
      }
      finishExercise();
      return;
    }

    updateProgress();

    if (ex.timerType === 'hold') {
      showCountdown(() => {
        phase = 'hold';
        notifyMovement(`Maintiens ${ex.holdSeconds}s`);
        startHoldTimer(ex.holdSeconds, () => {
          // Rep done → short rest or next rep
          if (currentRep < totalReps) {
            phase = 'rest';
            notifyMovement(`Repos ${ex.restSeconds}s`);
            pauseThen(ex.restSeconds, 'Répétition suivante', () => nextRep());
          } else {
            nextRep(); // will trigger set end
          }
        });
      });
    } else if (ex.timerType === 'descent') {
      showCountdown(() => {
        phase = 'descent';
        notifyMovement(`Descends en ${ex.descentSeconds}s`);
        startDescentTimer(ex.descentSeconds, () => {
          // Small pause between reps
          if (currentRep < totalReps) {
            phase = 'repWait';
            pauseThen(3, 'Répétition suivante', () => nextRep());
          } else {
            nextRep(); // will trigger set end
          }
        });
      });
    } else if (ex.timerType === 'manual') {
      // Manual counting — show rep count and wait for user
      phase = 'repWait';
      timerContainer.style.display = 'flex';
      timerRing.style.strokeDashoffset = 0;
      timerRing.classList.remove('rest');
      timerDisplay.textContent = currentRep;
      timerLabel.textContent = `/ ${totalReps} reps`;
      notifyMovement('Répétition suivante');
      showButtons('next');
    }
  }

  function advanceStep() {
    const ex = currentExercise;
    if (ex.timerType !== 'manual') return;

    if (currentRep >= ex.reps) {
      if (currentSet < ex.sets) {
        phase = 'rest';
        currentSet++;
        currentRep = 0;
        Notify.movement(ex.name, `Série terminée — repos ${ex.restSeconds}s`);
        pauseThen(ex.restSeconds, 'Série suivante', () => nextRep());
      } else {
        finishExercise();
      }
    } else {
      nextRep();
    }
  }

  // ===================== TIMERS =====================
  function showCountdown(callback) {
    countdownOverlay.style.display = 'flex';
    let count = 3;
    countdownNumber.textContent = count;
    Sound.countdownTick();
    showButtons('none');

    const cdInterval = setInterval(() => {
      count--;
      if (count <= 0) {
        clearInterval(cdInterval);
        countdownOverlay.style.display = 'none';
        Sound.start();
        callback();
      } else {
        countdownNumber.textContent = count;
        Sound.countdownTick();
        // Re-trigger animation
        countdownNumber.style.animation = 'none';
        void countdownNumber.offsetWidth;
        countdownNumber.style.animation = 'countPulse 0.6s ease-out';
      }
    }, 800);
  }

  function runPhaseTimer(seconds, label, isRest, onComplete) {
    timerContainer.style.display = 'flex';
    timerRing.classList.toggle('rest', isRest);
    timerLabel.textContent = label;
    showButtons('pause');

    Timer.start(seconds, (remaining, progress) => {
      timerDisplay.textContent = remaining;
      timerRing.style.strokeDashoffset = Timer.getCircumference() * progress;
      if (remaining > 0 && remaining <= 3) Sound.tick();
    }, () => { Sound.phaseEnd(); onComplete(); });
  }

  function startHoldTimer(seconds, onComplete) {
    runPhaseTimer(seconds, 'Maintiens', false, onComplete);
  }

  function startDescentTimer(seconds, onComplete) {
    runPhaseTimer(seconds, 'Descends…', false, onComplete);
  }

  function startRestTimer(seconds, onComplete) {
    runPhaseTimer(seconds, 'Repos', true, onComplete);
  }

  // ===================== PROGRESS =====================
  function updateProgress() {
    const ex = currentExercise;
    if (!ex) return;

    const totalReps = ex.reps * ex.sets;
    const doneReps = (currentSet - 1) * ex.reps + Math.min(currentRep, ex.reps);
    const pct = Math.round((doneReps / totalReps) * 100);

    progressLabel.textContent = `Série ${currentSet}/${ex.sets} — Rep ${Math.min(currentRep, ex.reps)}/${ex.reps}`;
    progressFill.style.width = pct + '%';
  }

  // ===================== BUTTONS =====================
  function showButtons(mode) {
    btnStart.style.display = mode === 'start' ? '' : 'none';
    btnPause.style.display = mode === 'pause' ? '' : 'none';
    btnResume.style.display = mode === 'resume' ? '' : 'none';
    btnNext.style.display = mode === 'next' ? '' : 'none';
    btnDone.style.display = mode === 'done' ? '' : 'none';
  }

  // ===================== RATING =====================
  function ratingColorClass(value, max) {
    const ratio = value / max;
    if (ratio <= 0.2) return 'green';
    if (ratio <= 0.4) return 'yellow';
    if (ratio <= 0.6) return 'orange';
    return 'red';
  }

  function showRating() {
    const rating = Programs.getRating(activeProgram());

    if (rating.type === 'none') {
      recordExercise(null);
      return;
    }

    showButtons('none');
    timerContainer.style.display = 'none';
    ratingPanel.style.display = 'block';
    selectedRating = null;
    ratingTitle.textContent = rating.label;
    ratingDescription.textContent = '';

    ratingScale.innerHTML = '';
    for (let i = 0; i <= rating.max; i++) {
      const btn = document.createElement('button');
      btn.className = `pain-btn ${ratingColorClass(i, rating.max)}`;
      btn.textContent = i;
      btn.addEventListener('click', () => {
        ratingScale.querySelectorAll('.pain-btn').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        selectedRating = i;
        ratingDescription.textContent = rating.descriptions[i] || '';
        if (rating.warnAbove !== null && i > rating.warnAbove) {
          ratingDescription.textContent += ` — ${rating.warnText}`;
          ratingDescription.style.color = 'var(--danger)';
        } else {
          ratingDescription.style.color = 'var(--text-dim)';
        }
      });
      ratingScale.appendChild(btn);
    }
  }

  /** Saves the finished exercise and returns to the picker. */
  function recordExercise(value) {
    Storage.addSession({
      exerciseId: currentExercise.id,
      variant: currentVariant,
      rating: value,
      ratingType: Programs.getRating(activeProgram()).type,
      date: new Date().toISOString().slice(0, 10),
      sessionId: currentSessionId
    });

    const vp = document.querySelector('.variant-picker');
    if (vp) vp.remove();
    ratingPanel.style.display = 'none';

    renderExercisePicker();
  }

  btnSaveRating.addEventListener('click', () => {
    if (selectedRating === null) {
      ratingDescription.textContent = 'Sélectionne une valeur';
      ratingDescription.style.color = 'var(--warning)';
      return;
    }
    recordExercise(selectedRating);
  });

  // ===================== HISTORY =====================
  function sessionRating(s) {
    // Older records used painLevel; newer ones use rating.
    return (s.rating !== undefined && s.rating !== null) ? s.rating : s.painLevel;
  }

  function renderHistory() {
    const program = activeProgram();
    const sessions = Storage.getSessions();
    historyList.innerHTML = '';

    if (sessions.length === 0) {
      historyEmpty.style.display = 'block';
      return;
    }
    historyEmpty.style.display = 'none';

    const groups = {};
    sessions.forEach(s => {
      const date = s.completedAt.slice(0, 10);
      if (!groups[date]) groups[date] = [];
      groups[date].push(s);
    });

    Object.keys(groups).sort().reverse().forEach(date => {
      const dayDiv = document.createElement('div');
      dayDiv.className = 'history-day';

      const label = new Date(date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
      dayDiv.innerHTML = `<h3>${label}</h3>`;

      groups[date].forEach(s => {
        const ex = Programs.getExercise(program, s.exerciseId) || Programs.findExerciseAnywhere(s.exerciseId);
        const entry = document.createElement('div');
        entry.className = 'history-entry';

        const value = sessionRating(s);
        let badge = '<div class="he-pain pain-low">✓</div>';
        if (value !== undefined && value !== null) {
          let painClass = 'pain-low';
          if (value > 5) painClass = 'pain-high';
          else if (value > 3) painClass = 'pain-med';
          badge = `<div class="he-pain ${painClass}">${value}/10</div>`;
        }

        let variant = '';
        if (s.variant) {
          const v = ex && ex.variants ? ex.variants.find(vv => vv.id === s.variant) : null;
          variant = ` (${escapeHtml(v ? v.label : s.variant)})`;
        }
        const time = new Date(s.completedAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

        entry.innerHTML = `
          <div>
            <div class="he-name">${escapeHtml(ex ? ex.name : s.exerciseId)}${variant}</div>
            <div class="he-detail">${time}</div>
          </div>
          ${badge}
        `;
        dayDiv.appendChild(entry);
      });

      historyList.appendChild(dayDiv);
    });
  }

  // ===================== SETTINGS =====================
  function renderSettings() {
    const program = activeProgram();

    // Active program picker
    settingsProgramSelect.innerHTML = Programs.getAll()
      .map(p => `<option value="${escapeHtml(p.id)}"${p.id === program.id ? ' selected' : ''}>${escapeHtml(p.name)}</option>`)
      .join('');

    settingsStartDate.value = Storage.getStartDate();
    settingsSound.checked = Sound.isEnabled();
    renderNotifySettings();

    // Days list
    settingsDaysList.innerHTML = '';
    program.days.forEach(day => {
      const manualDone = Storage.isDayManuallyDone(day.day);
      const dateStr = Storage.getDateForDay(day.day);
      const completedSessions = Storage.getCompletedSessionsForDate(dateStr);
      const isDone = manualDone || completedSessions.length >= day.maxSessions;

      const exerciseNames = day.exercises.map(id => {
        const ex = Programs.getExercise(program, id);
        return ex ? ex.name : id;
      }).join(', ') || 'Repos';

      const row = document.createElement('div');
      row.className = 'settings-day-row' + (isDone ? ' done' : '');

      let sessionsHtml = '';
      completedSessions.forEach((cs, idx) => {
        const firstEx = cs.exercises[0];
        const time = firstEx
          ? new Date(firstEx.completedAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
          : '';
        sessionsHtml += `
          <div class="settings-session-row">
            <span>Séance ${idx + 1}${time ? ` — ${time}` : ''}</span>
            <button class="btn btn-small btn-session-delete" data-session-id="${escapeHtml(cs.sessionId)}">Supprimer</button>
          </div>
        `;
      });

      row.innerHTML = `
        <div class="settings-day-header">
          <div class="settings-day-info">
            <span class="settings-day-num">${isDone ? '✓' : day.day}</span>
            <div>
              <div class="settings-day-label">${escapeHtml(day.label)}</div>
              <div class="settings-day-exercises">${escapeHtml(exerciseNames)}</div>
            </div>
          </div>
          <button class="btn btn-small ${manualDone ? 'btn-done-active' : 'btn-done-inactive'}" data-day="${day.day}" data-manual="${manualDone}">
            ${manualDone ? 'Manuel ✓' : 'Marquer fait'}
          </button>
        </div>
        ${sessionsHtml ? `<div class="settings-sessions">${sessionsHtml}</div>` : ''}
      `;

      row.querySelectorAll('[data-session-id]').forEach(btn => {
        btn.addEventListener('click', () => {
          if (confirm('Supprimer cette séance ?')) {
            Storage.deleteCompletedSession(btn.dataset.sessionId);
            renderSettings();
            renderDashboard();
          }
        });
      });

      row.querySelector('[data-day]').addEventListener('click', (e) => {
        const btn = e.currentTarget;
        Storage.setDayDone(parseInt(btn.dataset.day, 10), btn.dataset.manual !== 'true');
        renderSettings();
        renderDashboard();
      });

      settingsDaysList.appendChild(row);
    });
  }

  settingsProgramSelect.addEventListener('change', () => {
    Programs.setActive(settingsProgramSelect.value);
    refreshAll();
    renderSettings();
  });

  btnEditProgram.addEventListener('click', () => openProgramEditor(Programs.getActiveId()));

  btnSaveDate.addEventListener('click', () => {
    const val = settingsStartDate.value;
    if (!val) return;
    Storage.setStartDate(val);
    renderSettings();
    renderDashboard();
  });

  settingsSound.addEventListener('change', () => {
    Sound.setEnabled(settingsSound.checked);
  });

  // ===================== NOTIFICATIONS =====================
  function renderNotifySettings() {
    const enabled = Notify.isEnabled();
    settingsNotify.checked = enabled;
    notifyLevelBlock.style.display = enabled ? 'block' : 'none';

    const level = Notify.getLevel();
    notifyLevelPicker.querySelectorAll('.level-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.level === level);
    });

    const permission = Notify.permission();
    if (permission === 'unsupported') {
      notifyStatus.textContent = 'Ce navigateur ne gère pas les notifications.';
      settingsNotify.disabled = true;
    } else if (permission === 'denied') {
      notifyStatus.textContent = 'Notifications bloquées par le navigateur — autorise-les dans ses réglages de site.';
    } else if (!enabled) {
      notifyStatus.textContent = 'Désactivées par défaut.';
    } else {
      notifyStatus.textContent = level === 'movement'
        ? 'Niveau mouvement : une notification à chaque étape du mouvement.'
        : 'Niveau exercice : une notification au début et à la fin de chaque exercice.';
    }
  }

  settingsNotify.addEventListener('change', async () => {
    const granted = await Notify.setEnabled(settingsNotify.checked);
    if (settingsNotify.checked && !granted) {
      alert("Les notifications n'ont pas été autorisées par le navigateur.");
    }
    renderNotifySettings();
  });

  notifyLevelPicker.querySelectorAll('.level-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      Notify.setLevel(btn.dataset.level);
      renderNotifySettings();
    });
  });

  btnNotifyTest.addEventListener('click', () => {
    if (!Notify.test()) alert('Impossible d\'afficher une notification pour le moment.');
  });

  // ===================== RESET =====================
  btnReset.addEventListener('click', () => {
    if (confirm('Supprimer l\'historique de ce programme ? Cette action est irréversible.')) {
      Storage.reset();
      selectedDay = null;
      currentSessionId = null;
      renderHistory();
      renderDashboard();
    }
  });

  // ===================== INIT =====================
  renderHeader();
  renderDashboard();
})();
