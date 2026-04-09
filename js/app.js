/**
 * app.js — Main application logic.
 */
(() => {
  // ===================== DOM REFS =====================
  const $ = id => document.getElementById(id);
  const tabs = document.querySelectorAll('.tab');
  const views = document.querySelectorAll('.view');

  // Dashboard
  const dayGrid = $('day-grid');
  const runningCard = $('running-card');

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

  const painRating = $('pain-rating');
  const painScale = $('pain-scale');
  const painDescription = $('pain-description');
  const btnSavePain = $('btn-save-pain');

  // History
  const historyList = $('history-list');
  const historyEmpty = $('history-empty');
  const btnReset = $('btn-reset');

  // Settings
  const settingsDaysList = $('settings-days-list');
  const settingsStartDate = $('settings-start-date');
  const btnSaveDate = $('btn-save-date');

  // ===================== STATE =====================
  let currentExercise = null;
  let currentVariant = null;
  let currentSet = 0;
  let currentRep = 0;
  let phase = 'idle'; // idle | countdown | hold | descent | rest | repWait | done
  let selectedPain = null;
  let selectedDay = null; // null = use currentDay
  let currentSessionId = null;

  // ===================== NAVIGATION =====================
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const target = tab.dataset.view;
      tabs.forEach(t => t.classList.toggle('active', t === tab));
      views.forEach(v => v.classList.toggle('active', v.id === `view-${target}`));
      if (target === 'dashboard') renderDashboard();
      if (target === 'session') renderExercisePicker();
      if (target === 'history') renderHistory();
      if (target === 'settings') renderSettings();
    });
  });

  function switchToSession(dayNum) {
    selectedDay = dayNum;
    tabs.forEach(t => t.classList.toggle('active', t.dataset.view === 'session'));
    views.forEach(v => v.classList.toggle('active', v.id === 'view-session'));
    renderExercisePicker();
  }

  // ===================== DASHBOARD =====================
  function isDayCompleted(dp) {
    if (Storage.isDayManuallyDone(dp.day)) return true;
    const dateStr = Storage.getDateForDay(dp.day);
    return Storage.getSessionCountForDate(dateStr) >= dp.maxSessions;
  }

  function renderDashboard() {
    const currentDay = Storage.getCurrentDay();
    dayGrid.innerHTML = '';

    Exercises.dayPlan.forEach(dp => {
      const dateStr = Storage.getDateForDay(dp.day);
      const sessionsToday = Storage.getSessionCountForDate(dateStr);
      const isToday = dp.day === currentDay;
      const isCompleted = isDayCompleted(dp);

      const card = document.createElement('div');
      card.className = 'day-card clickable' + (isToday ? ' today' : '') + (isCompleted ? ' completed' : '');

      let dotsHtml = '';
      for (let i = 0; i < dp.maxSessions; i++) {
        dotsHtml += `<div class="session-dot${i < sessionsToday ? ' done' : ''}"></div>`;
      }

      const exerciseNames = dp.exercises.map(id => Exercises.getById(id).name).join(', ');
      const dayNumContent = isCompleted ? '✓' : dp.day;

      card.innerHTML = `
        <div class="day-number">${dayNumContent}</div>
        <div class="day-info">
          <h3>${dp.label}</h3>
          <p>${dp.description}</p>
          <p style="margin-top:4px;font-size:0.75rem;color:var(--text-dim)">${exerciseNames}</p>
        </div>
        <div class="day-sessions">${dotsHtml}</div>
      `;

      card.addEventListener('click', () => switchToSession(dp.day));
      dayGrid.appendChild(card);
    });

    // Show running card on day 5
    runningCard.style.display = currentDay >= 5 ? 'block' : 'none';
  }

  // ===================== EXERCISE PICKER =====================
  function renderExercisePicker() {
    exercisePicker.style.display = 'block';
    exerciseRunner.style.display = 'none';
    Timer.stop();
    phase = 'idle';
    exerciseList.innerHTML = '';

    const currentDay = Storage.getCurrentDay();
    const day = selectedDay || currentDay;
    const plan = Exercises.getDayPlan(day);
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

    const pickerTitle = exercisePicker.querySelector('h2');
    pickerTitle.textContent = `Séance — Jour ${day}`;

    plan.exercises.forEach(exId => {
      const ex = Exercises.getById(exId);
      const isDone = doneExIds.has(exId);
      const card = document.createElement('div');
      card.className = 'exercise-card' + (isDone ? ' ex-done' : '');
      card.innerHTML = `
        <div class="ex-card-header">
          <span class="ex-tag ${ex.tag}">${ex.tagLabel}</span>
          ${isDone ? '<span class="ex-check">✓</span>' : ''}
        </div>
        <h3>${ex.name}</h3>
        <p>${ex.subtitle}</p>
        <div class="ex-dosage">
          <span>${ex.dosageText}</span>
          <span>${ex.frequencyText}</span>
        </div>
      `;
      card.addEventListener('click', () => startExercise(ex));
      exerciseList.appendChild(card);
    });

    // Remove old validate button if present
    const existingValidate = exercisePicker.querySelector('.btn-validate-session');
    if (existingValidate) existingValidate.remove();

    // Show validate button only when all exercises done
    const allDone = plan.exercises.every(id => doneExIds.has(id));
    if (allDone) {
      const validateBtn = document.createElement('button');
      validateBtn.className = 'btn btn-success btn-large btn-validate-session';
      validateBtn.textContent = 'Valider la séance ✓';
      validateBtn.addEventListener('click', () => {
        Storage.completeSession(currentSessionId);
        currentSessionId = null;
        renderDashboard();
        tabs.forEach(t => t.classList.toggle('active', t.dataset.view === 'dashboard'));
        views.forEach(v => v.classList.toggle('active', v.id === 'view-dashboard'));
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
    selectedPain = null;
    phase = 'idle';

    exercisePicker.style.display = 'none';
    exerciseRunner.style.display = 'block';

    runnerTitle.textContent = exercise.name;
    runnerSubtitle.textContent = exercise.subtitle;
    runnerInstructions.innerHTML = exercise.description;

    // Variant picker for eccentric
    if (exercise.variants) {
      const existing = document.querySelector('.variant-picker');
      if (existing) existing.remove();

      const picker = document.createElement('div');
      picker.className = 'variant-picker';
      picker.innerHTML = `
        <label>Variante :</label>
        <div class="variant-btns">
          ${exercise.variants.map((v, i) =>
            `<button class="variant-btn${i === 0 ? ' active' : ''}" data-variant="${v.id}">${v.label}</button>`
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
    painRating.style.display = 'none';
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
    // Skip to next step
    Timer.stop();
    advanceStep();
  });

  btnDone.addEventListener('click', () => {
    showPainRating();
  });

  // ===================== EXERCISE FLOW =====================
  function nextRep() {
    currentRep++;
    const ex = currentExercise;
    const totalReps = ex.reps;

    if (currentRep > totalReps) {
      // Set complete
      if (currentSet < ex.sets) {
        // Rest between sets
        phase = 'rest';
        updateProgress();
        startRestTimer(ex.restSeconds, () => {
          currentSet++;
          currentRep = 0;
          nextRep();
        });
        return;
      } else {
        // Exercise complete
        phase = 'done';
        updateProgress();
        timerContainer.style.display = 'none';
        showButtons('done');
        return;
      }
    }

    updateProgress();

    if (ex.timerType === 'hold') {
      showCountdown(() => {
        phase = 'hold';
        startHoldTimer(ex.holdSeconds, () => {
          // Rep done → short rest or next rep
          if (currentRep < totalReps) {
            phase = 'rest';
            startRestTimer(ex.restSeconds, () => nextRep());
          } else {
            nextRep(); // will trigger set end
          }
        });
      });
    } else if (ex.timerType === 'descent') {
      showCountdown(() => {
        phase = 'descent';
        startDescentTimer(ex.descentSeconds, () => {
          // Small pause between reps (2s)
          if (currentRep < totalReps) {
            phase = 'repWait';
            startRestTimer(3, () => nextRep());
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
      showButtons('next');
    }
  }

  function advanceStep() {
    const ex = currentExercise;

    if (ex.timerType === 'manual') {
      if (currentRep >= ex.reps) {
        if (currentSet < ex.sets) {
          phase = 'rest';
          currentSet++;
          currentRep = 0;
          startRestTimer(ex.restSeconds, () => nextRep());
        } else {
          phase = 'done';
          updateProgress();
          timerContainer.style.display = 'none';
          showButtons('done');
        }
      } else {
        nextRep();
      }
    }
  }

  // ===================== TIMERS =====================
  function showCountdown(callback) {
    countdownOverlay.style.display = 'flex';
    let count = 3;
    countdownNumber.textContent = count;
    showButtons('none');

    const cdInterval = setInterval(() => {
      count--;
      if (count <= 0) {
        clearInterval(cdInterval);
        countdownOverlay.style.display = 'none';
        callback();
      } else {
        countdownNumber.textContent = count;
        // Re-trigger animation
        countdownNumber.style.animation = 'none';
        void countdownNumber.offsetWidth;
        countdownNumber.style.animation = 'countPulse 0.6s ease-out';
      }
    }, 800);
  }

  function startHoldTimer(seconds, onComplete) {
    timerContainer.style.display = 'flex';
    timerRing.classList.remove('rest');
    timerLabel.textContent = 'Maintiens';
    showButtons('pause');

    Timer.start(seconds, (remaining, progress) => {
      timerDisplay.textContent = remaining;
      const offset = Timer.getCircumference() * progress;
      timerRing.style.strokeDashoffset = offset;
    }, onComplete);
  }

  function startDescentTimer(seconds, onComplete) {
    timerContainer.style.display = 'flex';
    timerRing.classList.remove('rest');
    timerLabel.textContent = 'Descends…';
    showButtons('pause');

    Timer.start(seconds, (remaining, progress) => {
      timerDisplay.textContent = remaining;
      const offset = Timer.getCircumference() * progress;
      timerRing.style.strokeDashoffset = offset;
    }, onComplete);
  }

  function startRestTimer(seconds, onComplete) {
    timerContainer.style.display = 'flex';
    timerRing.classList.add('rest');
    timerLabel.textContent = 'Repos';
    showButtons('pause');

    Timer.start(seconds, (remaining, progress) => {
      timerDisplay.textContent = remaining;
      const offset = Timer.getCircumference() * progress;
      timerRing.style.strokeDashoffset = offset;
    }, onComplete);
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

  // ===================== PAIN RATING =====================
  function showPainRating() {
    showButtons('none');
    timerContainer.style.display = 'none';
    painRating.style.display = 'block';
    selectedPain = null;
    painDescription.textContent = '';

    painScale.innerHTML = '';
    const descriptions = [
      'Aucune douleur',
      'Très légère',
      'Légère',
      'Modérée — limite acceptable',
      'Notable',
      'Significative',
      'Forte',
      'Très forte',
      'Intense',
      'Insupportable',
      'Maximale'
    ];
    for (let i = 0; i <= 10; i++) {
      const btn = document.createElement('button');
      btn.className = 'pain-btn';
      if (i <= 2) btn.classList.add('green');
      else if (i <= 4) btn.classList.add('yellow');
      else if (i <= 6) btn.classList.add('orange');
      else btn.classList.add('red');
      btn.textContent = i;
      btn.addEventListener('click', () => {
        painScale.querySelectorAll('.pain-btn').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        selectedPain = i;
        painDescription.textContent = descriptions[i];
        if (i > 3) {
          painDescription.textContent += ' — Réduire le volume !';
          painDescription.style.color = 'var(--danger)';
        } else {
          painDescription.style.color = 'var(--text-dim)';
        }
      });
      painScale.appendChild(btn);
    }
  }

  btnSavePain.addEventListener('click', () => {
    if (selectedPain === null) {
      painDescription.textContent = 'Sélectionne un niveau de douleur';
      painDescription.style.color = 'var(--warning)';
      return;
    }

    Storage.addSession({
      exerciseId: currentExercise.id,
      variant: currentVariant,
      painLevel: selectedPain,
      date: new Date().toISOString().slice(0, 10),
      sessionId: currentSessionId
    });

    // Cleanup variant picker
    const vp = document.querySelector('.variant-picker');
    if (vp) vp.remove();

    // Go back to picker to do remaining exercises
    renderExercisePicker();
  });

  // ===================== HISTORY =====================
  function renderHistory() {
    const sessions = Storage.getSessions();
    historyList.innerHTML = '';

    if (sessions.length === 0) {
      historyEmpty.style.display = 'block';
      return;
    }
    historyEmpty.style.display = 'none';

    // Group by date
    const groups = {};
    sessions.forEach(s => {
      const date = s.completedAt.slice(0, 10);
      if (!groups[date]) groups[date] = [];
      groups[date].push(s);
    });

    // Sort dates descending
    const dates = Object.keys(groups).sort().reverse();

    dates.forEach(date => {
      const dayDiv = document.createElement('div');
      dayDiv.className = 'history-day';

      const d = new Date(date);
      const label = d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
      dayDiv.innerHTML = `<h3>${label}</h3>`;

      groups[date].forEach(s => {
        const ex = Exercises.getById(s.exerciseId);
        const entry = document.createElement('div');
        entry.className = 'history-entry';

        let painClass = 'pain-low';
        if (s.painLevel > 5) painClass = 'pain-high';
        else if (s.painLevel > 3) painClass = 'pain-med';

        const variant = s.variant ? ` (${s.variant === 'straight' ? 'Jambe tendue' : 'Genou fléchi'})` : '';
        const time = new Date(s.completedAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

        entry.innerHTML = `
          <div>
            <div class="he-name">${ex ? ex.name : s.exerciseId}${variant}</div>
            <div class="he-detail">${time}</div>
          </div>
          <div class="he-pain ${painClass}">${s.painLevel}/10</div>
        `;
        dayDiv.appendChild(entry);
      });

      historyList.appendChild(dayDiv);
    });
  }

  // ===================== SETTINGS =====================
  function renderSettings() {
    // Start date
    settingsStartDate.value = Storage.getStartDate();

    // Days list
    settingsDaysList.innerHTML = '';
    Exercises.dayPlan.forEach(dp => {
      const manualDone = Storage.isDayManuallyDone(dp.day);
      const dateStr = Storage.getDateForDay(dp.day);
      const completedSessions = Storage.getCompletedSessionsForDate(dateStr);
      const autoDone = completedSessions.length >= dp.maxSessions;
      const isDone = manualDone || autoDone;

      const exerciseNames = dp.exercises.map(id => Exercises.getById(id).name).join(', ');

      const row = document.createElement('div');
      row.className = 'settings-day-row' + (isDone ? ' done' : '');

      // Build sessions list
      let sessionsHtml = '';
      completedSessions.forEach((cs, idx) => {
        const firstEx = cs.exercises[0];
        const time = firstEx
          ? new Date(firstEx.completedAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
          : '';
        sessionsHtml += `
          <div class="settings-session-row">
            <span>Séance ${idx + 1}${time ? ` — ${time}` : ''}</span>
            <button class="btn btn-small btn-session-delete" data-session-id="${cs.sessionId}">Supprimer</button>
          </div>
        `;
      });

      row.innerHTML = `
        <div class="settings-day-header">
          <div class="settings-day-info">
            <span class="settings-day-num">${isDone ? '✓' : dp.day}</span>
            <div>
              <div class="settings-day-label">${dp.label}</div>
              <div class="settings-day-exercises">${exerciseNames}</div>
            </div>
          </div>
          <button class="btn btn-small ${manualDone ? 'btn-done-active' : 'btn-done-inactive'}" data-day="${dp.day}" data-manual="${manualDone}">
            ${manualDone ? 'Manuel ✓' : 'Marquer fait'}
          </button>
        </div>
        ${sessionsHtml ? `<div class="settings-sessions">${sessionsHtml}</div>` : ''}
      `;

      // Session delete buttons
      row.querySelectorAll('[data-session-id]').forEach(btn => {
        btn.addEventListener('click', () => {
          if (confirm('Supprimer cette séance ?')) {
            Storage.deleteCompletedSession(btn.dataset.sessionId);
            renderSettings();
            renderDashboard();
          }
        });
      });

      // Manual done toggle
      row.querySelector('[data-day]').addEventListener('click', (e) => {
        const btn = e.currentTarget;
        const dayNum = parseInt(btn.dataset.day);
        const isManual = btn.dataset.manual === 'true';
        Storage.setDayDone(dayNum, !isManual);
        renderSettings();
        renderDashboard();
      });

      settingsDaysList.appendChild(row);
    });
  }

  btnSaveDate.addEventListener('click', () => {
    const val = settingsStartDate.value;
    if (!val) return;
    Storage.setStartDate(val);
    renderSettings();
    renderDashboard();
  });

  // ===================== RESET =====================
  btnReset.addEventListener('click', () => {
    if (confirm('Supprimer toutes les données ? Cette action est irréversible.')) {
      Storage.reset();
      selectedDay = null;
      renderHistory();
      renderDashboard();
    }
  });

  // ===================== INIT =====================
  renderDashboard();
})();
