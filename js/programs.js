/**
 * programs.js — Training program library.
 *
 * A program bundles everything needed to run a plan: its own exercise library,
 * an ordered list of days, safety notes and how effort is rated after each
 * exercise. Several programs can coexist; exactly one is active at a time.
 * Programs are persisted in localStorage and can be exported/imported as JSON.
 */
const Programs = (() => {
  const KEY = 'tendons_programs';
  const LEGACY_EXERCISES_KEY = 'tendons_exercises';

  const RATING_TYPES = ['pain', 'rpe', 'none'];

  const RATING_PRESETS = {
    pain: {
      label: 'Niveau de douleur ressenti',
      short: 'douleur',
      max: 10,
      warnAbove: 3,
      warnText: 'Réduire le volume !',
      descriptions: [
        'Aucune douleur', 'Très légère', 'Légère', 'Modérée — limite acceptable',
        'Notable', 'Significative', 'Forte', 'Très forte', 'Intense',
        'Insupportable', 'Maximale'
      ]
    },
    rpe: {
      label: 'Effort perçu (RPE)',
      short: 'effort',
      max: 10,
      warnAbove: null,
      warnText: '',
      descriptions: [
        'Aucun effort', 'Très très facile', 'Très facile', 'Facile', 'Modéré',
        'Assez difficile', 'Difficile', 'Très difficile', 'Très très difficile',
        'Quasi maximal', 'Maximal'
      ]
    }
  };

  // ===================== BUILT-IN PROGRAMS =====================
  function builtInPrograms() {
    return [
      {
        id: 'tendinopathie',
        name: "Tendons d'Achille 1",
        description: 'Plan de reprise progressive sur 5 jours : isométrique antalgique, excentrique et mobilité.',
        ratingType: 'pain',
        rules: [
          'Douleur pendant exercice ≤ 3/10',
          'Pas pire le lendemain matin',
          'Si aggravation → réduire volume ou amplitude'
        ],
        exercises: [
          {
            id: 'isometric',
            name: 'Isométrique',
            tag: 'blue',
            tagLabel: 'Antalgique',
            subtitle: 'Maintien sur pointe des pieds',
            description: 'Monte sur la pointe des pieds et <strong>tiens la position sans bouger</strong>. Tension modérée, pas de douleur vive.',
            reps: 5,
            holdSeconds: 45,
            restSeconds: 30,
            sets: 1,
            timerType: 'hold',
            variants: null,
            frequencyText: '1-2x / jour'
          },
          {
            id: 'eccentric',
            name: 'Excentrique',
            tag: 'red',
            tagLabel: 'Traitement',
            subtitle: 'Montée/descente sur les deux pieds',
            description: 'Monte et <strong>descends lentement</strong> sur la pointe des pieds, sur les <strong>deux pieds</strong>. Mouvement contrôlé.',
            reps: 15,
            descentSeconds: 5,
            restSeconds: 30,
            sets: 3,
            timerType: 'descent',
            variants: [
              { id: 'straight', label: 'Jambe tendue' },
              { id: 'bent', label: 'Genou fléchi' }
            ],
            frequencyText: '1-2x / jour'
          },
          {
            id: 'mobility',
            name: 'Mobilité cheville',
            tag: 'green',
            tagLabel: 'Complément',
            subtitle: 'Fente — genou au-dessus du pied',
            description: 'En fente, avance le <strong>genou au-dessus du pied</strong>. Le talon reste au sol. Mouvement lent et contrôlé.',
            reps: 10,
            sets: 2,
            restSeconds: 30,
            timerType: 'manual',
            variants: null,
            frequencyText: '1x / jour'
          }
        ],
        days: [
          {
            label: 'Jour 1',
            description: 'Isométrique + excentrique léger. Amplitude modérée.',
            exercises: ['isometric', 'eccentric'],
            maxSessions: 1
          },
          {
            label: 'Jour 2',
            description: 'Idem jour 1. 1 séance, amplitude modérée.',
            exercises: ['isometric', 'eccentric'],
            maxSessions: 1
          },
          {
            label: 'Jour 3',
            description: 'Passer à 2 séances/jour si OK. Amplitude augmentée.',
            exercises: ['isometric', 'eccentric', 'mobility'],
            maxSessions: 2
          },
          {
            label: 'Jour 4',
            description: '2 séances/jour. Amplitude augmentée.',
            exercises: ['isometric', 'eccentric', 'mobility'],
            maxSessions: 2
          },
          {
            label: 'Jour 5',
            description: 'Contrôle + amplitude max. Test marche si OK.',
            exercises: ['isometric', 'eccentric', 'mobility'],
            maxSessions: 2,
            noteTitle: 'Reprise course',
            note: 'Seulement si douleur faible et exercices bien tolérés. 10-15 min, allure lente, chaussures avec drop.'
          }
        ]
      },
      {
        id: 'meeting-training',
        name: 'Meeting training',
        description: 'Exercices discrets à faire assis pendant une réunion. Chaque étape se lance à la main.',
        ratingType: 'none',
        manualAdvance: true,
        rules: [
          'Respire normalement, jamais en apnée',
          'Aucun mouvement visible à la caméra',
          'Arrête immédiatement en cas de douleur'
        ],
        exercises: [
          {
            id: 'abdos',
            name: 'Contraction des abdos',
            tag: 'blue',
            tagLabel: 'Gainage',
            subtitle: '3 min au total',
            description: "Assieds-toi droit, les pieds au sol. Contracte les abdos comme si tu voulais légèrement rentrer le ventre et rendre ton ventre <strong>dur</strong>, sans bloquer ta respiration. Garde la contraction 20 à 30 secondes, puis relâche 15 secondes. Répète plusieurs fois.",
            reps: 5,
            holdSeconds: 25,
            restSeconds: 15,
            sets: 1,
            timerType: 'hold',
            variants: null,
            frequencyText: 'À volonté'
          },
          {
            id: 'omoplates',
            name: 'Rétraction des omoplates',
            tag: 'violet',
            tagLabel: 'Posture',
            subtitle: '3 min au total',
            description: "Garde les bras détendus et les épaules basses. Sans lever les épaules, ramène doucement les omoplates l'une vers l'autre, comme si tu voulais <strong>coincer quelque chose entre elles</strong>. Tiens 2 à 3 secondes, puis relâche. Fais 10 à 15 répétitions. Le mouvement est très petit et presque invisible à la caméra.",
            reps: 12,
            holdSeconds: 3,
            restSeconds: 3,
            sets: 2,
            timerType: 'hold',
            variants: null,
            frequencyText: 'À volonté'
          },
          {
            id: 'curl-biceps',
            name: 'Curl biceps',
            tag: 'red',
            tagLabel: 'Renforcement',
            subtitle: '5 min au total',
            description: "Garde les <strong>coudes collés contre les côtés du corps</strong>. Les avant-bras commencent vers le bas. Plie uniquement les coudes pour faire remonter les haltères vers les épaules, puis <strong>redescends lentement</strong> pendant le minuteur. Évite de bouger le dos ou les épaules. Si les mains sont sous le bureau, cela peut être quasiment invisible.",
            reps: 15,
            descentSeconds: 3,
            restSeconds: 60,
            sets: 2,
            timerType: 'descent',
            // Timed reps chain on their own: tapping once per curl is not workable.
            manualAdvance: false,
            variants: null,
            loadText: 'Haltères 1,5 kg',
            frequencyText: 'À volonté'
          },
          {
            id: 'releves-genoux',
            name: 'Relevés de genoux assis',
            tag: 'green',
            tagLabel: 'Activation',
            subtitle: '3 min au total',
            description: "Assieds-toi droit, sans t'appuyer fortement contre le dossier. Soulève légèrement un genou de quelques centimètres et <strong>tiens-le en l'air</strong> pendant le minuteur, puis repose le pied. Le mouvement peut être très petit. Une série <strong>par côté</strong>. Essaie de ne pas te balancer avec le haut du corps.",
            reps: 12,
            holdSeconds: 3,
            restSeconds: 3,
            sets: 2,
            timerType: 'hold',
            // Timed holds chain on their own.
            manualAdvance: false,
            variants: [
              { id: 'gauche', label: 'Genou gauche' },
              { id: 'droit', label: 'Genou droit' }
            ],
            frequencyText: 'À volonté'
          },
          {
            id: 'fessiers',
            name: 'Contraction des fessiers',
            tag: 'amber',
            tagLabel: 'Gainage',
            subtitle: '2 min au total',
            description: "Reste simplement assis et serre les deux fessiers comme si tu voulais te soulever légèrement de la chaise, <strong>mais sans réellement bouger</strong>. Tiens 15 à 20 secondes, relâche 10 secondes, puis recommence. C'est probablement l'exercice le plus invisible de tous.",
            reps: 4,
            holdSeconds: 18,
            restSeconds: 10,
            sets: 1,
            timerType: 'hold',
            variants: null,
            frequencyText: 'À volonté'
          }
        ],
        days: [
          {
            label: 'Séance réunion',
            description: 'Les 5 exercices, dans l\'ordre ou en piochant selon la réunion.',
            exercises: ['abdos', 'omoplates', 'curl-biceps', 'releves-genoux', 'fessiers'],
            maxSessions: 3,
            noteTitle: 'Enchaînement manuel',
            note: "Rien ne s'enchaîne tout seul : chaque répétition et chaque temps de repos attend que tu appuies sur « Suivant »."
          }
        ]
      }
    ];
  }

  // ===================== NORMALIZATION =====================
  function normalizeDay(raw, index, exerciseIds) {
    const day = index + 1;
    const src = (raw && typeof raw === 'object') ? raw : {};
    const wanted = Array.isArray(src.exercises) ? src.exercises.map(String) : [];
    return {
      day,
      label: String(src.label || '').trim() || `Jour ${day}`,
      description: String(src.description || ''),
      note: String(src.note || ''),
      noteTitle: String(src.noteTitle || '').trim() || 'Note',
      exercises: wanted.filter(id => exerciseIds.has(id)),
      maxSessions: ExerciseModel.clampInt(src.maxSessions, 1, 10, 1)
    };
  }

  /** Validates/sanitizes a raw program. Returns null if unusable. */
  function normalizeProgram(raw) {
    if (!raw || typeof raw !== 'object') return null;
    const name = String(raw.name || '').trim();
    if (!name) return null;

    const id = String(raw.id || '').trim() || ExerciseModel.slugify(name, 'programme');
    const exercises = (Array.isArray(raw.exercises) ? raw.exercises : [])
      .map(ExerciseModel.normalize)
      .filter(Boolean);
    const exerciseIds = new Set(exercises.map(e => e.id));

    const days = (Array.isArray(raw.days) ? raw.days : [])
      .map((d, i) => normalizeDay(d, i, exerciseIds));

    return {
      id,
      name,
      description: String(raw.description || ''),
      ratingType: RATING_TYPES.includes(raw.ratingType) ? raw.ratingType : 'pain',
      // When true the runner never chains steps on its own: the user launches
      // each rep, série and repos by hand (useful when training discreetly).
      manualAdvance: raw.manualAdvance === true,
      rules: (Array.isArray(raw.rules) ? raw.rules : [])
        .map(r => String(r).trim()).filter(Boolean),
      exercises,
      days: days.length ? days : [normalizeDay({ label: 'Jour 1' }, 0, exerciseIds)],
      builtIn: raw.builtIn === true,
      createdAt: raw.createdAt || new Date().toISOString(),
      updatedAt: raw.updatedAt || new Date().toISOString()
    };
  }

  // ===================== PERSISTENCE =====================
  /** First run: seed the built-in programs, adopting a legacy exercise library if present. */
  function seed() {
    const seeded = builtInPrograms().map(p => normalizeProgram({ ...p, builtIn: true }));
    try {
      const legacy = localStorage.getItem(LEGACY_EXERCISES_KEY);
      if (legacy) {
        const parsed = JSON.parse(legacy);
        const arr = Array.isArray(parsed) ? parsed : parsed && parsed.exercises;
        if (Array.isArray(arr) && arr.length) {
          const migrated = arr.map(ExerciseModel.normalize).filter(Boolean);
          if (migrated.length) {
            // The old library belonged to the tendinopathy plan; keep its edits.
            const target = seeded.find(p => p.id === 'tendinopathie');
            if (target) {
              const byId = new Map(migrated.map(e => [e.id, e]));
              target.exercises.forEach(e => { if (!byId.has(e.id)) byId.set(e.id, e); });
              target.exercises = [...byId.values()];
            }
          }
        }
      }
    } catch {
      // unreadable legacy library → keep the defaults
    }
    return { activeId: seeded[0].id, programs: seeded };
  }

  // Set when the store had to be (re)built, so it gets written back on startup.
  let needsPersist = false;

  function loadStore() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        const programs = (Array.isArray(parsed.programs) ? parsed.programs : [])
          .map(normalizeProgram).filter(Boolean);
        if (programs.length) {
          const activeId = programs.some(p => p.id === parsed.activeId)
            ? parsed.activeId
            : programs[0].id;
          return { activeId, programs };
        }
      }
    } catch {
      // corrupted storage → start over from the built-ins
    }
    needsPersist = true;
    return seed();
  }

  let store = loadStore();

  function persist() {
    localStorage.setItem(KEY, JSON.stringify(store));
  }

  // A freshly seeded library is saved right away, so a reload keeps the same ids.
  if (needsPersist) persist();

  // ===================== PROGRAM API =====================
  function getAll() {
    return store.programs;
  }

  function getById(id) {
    return store.programs.find(p => p.id === id) || null;
  }

  function getActiveId() {
    return store.activeId;
  }

  function getActive() {
    return getById(store.activeId) || store.programs[0];
  }

  function setActive(id) {
    if (!getById(id)) return false;
    store.activeId = id;
    persist();
    return true;
  }

  /** Generates a program id unique in the library. */
  function createProgramId(name) {
    const base = ExerciseModel.slugify(name, 'programme');
    let id = base;
    let n = 2;
    while (getById(id)) id = `${base}-${n++}`;
    return id;
  }

  /** Creates or updates a program. Returns the saved program, or null if invalid. */
  function saveProgram(raw) {
    const program = normalizeProgram(raw);
    if (!program) return null;
    const idx = store.programs.findIndex(p => p.id === program.id);
    program.updatedAt = new Date().toISOString();
    if (idx >= 0) {
      program.createdAt = store.programs[idx].createdAt;
      program.builtIn = store.programs[idx].builtIn;
      store.programs[idx] = program;
    } else {
      program.builtIn = false;
      store.programs.push(program);
    }
    persist();
    return program;
  }

  /** Creates an empty program ready to be edited. Not persisted. */
  function blankProgram(name) {
    return normalizeProgram({
      id: createProgramId(name || 'Nouveau programme'),
      name: name || 'Nouveau programme',
      description: '',
      ratingType: 'pain',
      rules: [],
      exercises: [],
      days: [{ label: 'Jour 1', description: '', exercises: [], maxSessions: 1 }]
    });
  }

  /** Copies a program under a new id, so built-ins can be tweaked safely. */
  function duplicate(id) {
    const source = getById(id);
    if (!source) return null;
    const name = `${source.name} (copie)`;
    const copy = JSON.parse(JSON.stringify(source));
    copy.id = createProgramId(name);
    copy.name = name;
    copy.builtIn = false;
    copy.createdAt = new Date().toISOString();
    const saved = saveProgram(copy);
    // saveProgram keeps builtIn from an existing entry only; a copy is always editable.
    return saved;
  }

  /** Deletes a program. Refuses to remove the last one. */
  function removeProgram(id) {
    if (store.programs.length <= 1) return false;
    if (!getById(id)) return false;
    store.programs = store.programs.filter(p => p.id !== id);
    if (store.activeId === id) store.activeId = store.programs[0].id;
    persist();
    return true;
  }

  function resetDefaults() {
    store = { activeId: null, programs: builtInPrograms().map(p => normalizeProgram({ ...p, builtIn: true })) };
    store.activeId = store.programs[0].id;
    persist();
  }

  // ===================== EXERCISES WITHIN A PROGRAM =====================
  function getExercise(program, exId) {
    if (!program) return null;
    return program.exercises.find(e => e.id === exId) || null;
  }

  /** Looks an exercise up in any program — history may reference an edited plan. */
  function findExerciseAnywhere(exId) {
    for (const p of store.programs) {
      const ex = getExercise(p, exId);
      if (ex) return ex;
    }
    return null;
  }

  function getDay(program, dayNum) {
    if (!program || !program.days.length) return null;
    return program.days.find(d => d.day === dayNum) || program.days[program.days.length - 1];
  }

  function isInDays(program, exId) {
    return !!program && program.days.some(d => d.exercises.includes(exId));
  }

  // ===================== RATING =====================
  function getRating(program) {
    const type = (program && program.ratingType) || 'pain';
    if (type === 'none') return { type: 'none' };
    return { type, ...RATING_PRESETS[type] };
  }

  // ===================== EXPORT / IMPORT =====================
  function exportProgram(id) {
    const program = getById(id);
    if (!program) return null;
    return JSON.stringify({
      app: 'tendons',
      type: 'program',
      version: 2,
      exportedAt: new Date().toISOString(),
      program
    }, null, 2);
  }

  function exportAll() {
    return JSON.stringify({
      app: 'tendons',
      type: 'programs',
      version: 2,
      exportedAt: new Date().toISOString(),
      programs: store.programs
    }, null, 2);
  }

  /**
   * Imports programs from a JSON export. Accepts a single program, a bundle of
   * programs, or a legacy v1 exercise-library file (wrapped in a new program).
   * Imported programs are added alongside the existing ones.
   * Returns { imported, lastId }.
   */
  function importJSON(text) {
    const parsed = JSON.parse(text);
    let raw = [];

    if (Array.isArray(parsed)) {
      raw = parsed;
    } else if (parsed && Array.isArray(parsed.programs)) {
      raw = parsed.programs;
    } else if (parsed && parsed.program) {
      raw = [parsed.program];
    } else if (parsed && Array.isArray(parsed.exercises)) {
      // Legacy export: an exercise library with no days.
      const exercises = parsed.exercises.map(ExerciseModel.normalize).filter(Boolean);
      if (!exercises.length) throw new Error('aucun exercice valide dans ce fichier');
      raw = [{
        name: 'Programme importé',
        description: 'Exercices importés depuis une sauvegarde.',
        exercises,
        days: [{
          label: 'Jour 1',
          description: 'Tous les exercices importés.',
          exercises: exercises.map(e => e.id),
          maxSessions: 1
        }]
      }];
    } else {
      throw new Error('format invalide, « program » ou « programs » attendu');
    }

    const imported = [];
    raw.forEach(item => {
      const candidate = normalizeProgram(item);
      if (!candidate) return;
      // Never overwrite an existing program: an import always lands next to it.
      candidate.id = createProgramId(candidate.name);
      candidate.builtIn = false;
      const saved = saveProgram(candidate);
      if (saved) imported.push(saved);
    });

    if (!imported.length) throw new Error('aucun programme valide dans ce fichier');
    return { imported: imported.length, lastId: imported[imported.length - 1].id };
  }

  return {
    RATING_TYPES, RATING_PRESETS,
    getAll, getById, getActive, getActiveId, setActive,
    saveProgram, removeProgram, duplicate, blankProgram, createProgramId, resetDefaults,
    getExercise, findExerciseAnywhere, getDay, isInDays, getRating,
    exportProgram, exportAll, importJSON
  };
})();
