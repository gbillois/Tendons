/**
 * exercises.js — Exercise library: built-in defaults + user-defined exercises.
 * The library is persisted in localStorage and can be exported/imported as JSON.
 */
const Exercises = (() => {
  const KEY = 'tendons_exercises';

  const defaults = [
    {
      id: 'isometric',
      name: 'Isométrique',
      tag: 'iso',
      tagLabel: 'Antalgique',
      subtitle: 'Maintien sur pointe des pieds',
      description: 'Monte sur la pointe des pieds et <strong>tiens la position sans bouger</strong>. Tension modérée, pas de douleur vive.',
      reps: 5,
      holdSeconds: 45,
      restSeconds: 30,
      sets: 1,
      hasTimer: true,
      timerType: 'hold',  // hold = maintien statique
      variants: null,
      dosageText: '5 × 45s',
      frequencyText: '1-2x / jour'
    },
    {
      id: 'eccentric',
      name: 'Excentrique',
      tag: 'exc',
      tagLabel: 'Traitement',
      subtitle: 'Montée/descente sur les deux pieds',
      description: 'Monte et <strong>descends lentement</strong> sur la pointe des pieds, sur les <strong>deux pieds</strong>. Mouvement contrôlé.',
      reps: 15,
      descentSeconds: 5,
      restSeconds: 30,
      sets: 3,
      hasTimer: true,
      timerType: 'descent',
      variants: [
        { id: 'straight', label: 'Jambe tendue' },
        { id: 'bent', label: 'Genou fléchi' }
      ],
      dosageText: '3 × 15 reps',
      frequencyText: '1-2x / jour'
    },
    {
      id: 'mobility',
      name: 'Mobilité cheville',
      tag: 'mob',
      tagLabel: 'Complément',
      subtitle: 'Fente — genou au-dessus du pied',
      description: 'En fente, avance le <strong>genou au-dessus du pied</strong>. Le talon reste au sol. Mouvement lent et contrôlé.',
      reps: 10,
      sets: 2,
      restSeconds: 30,
      hasTimer: false,
      timerType: 'manual',  // user counts reps manually
      variants: null,
      dosageText: '2 × 10 reps',
      frequencyText: '1x / jour'
    }
  ];

  const dayPlan = [
    {
      day: 1,
      label: 'Jour 1',
      description: 'Isométrique + excentrique léger. Amplitude modérée.',
      exercises: ['isometric', 'eccentric'],
      maxSessions: 1
    },
    {
      day: 2,
      label: 'Jour 2',
      description: 'Idem jour 1. 1 séance, amplitude modérée.',
      exercises: ['isometric', 'eccentric'],
      maxSessions: 1
    },
    {
      day: 3,
      label: 'Jour 3',
      description: 'Passer à 2 séances/jour si OK. Amplitude augmentée.',
      exercises: ['isometric', 'eccentric', 'mobility'],
      maxSessions: 2
    },
    {
      day: 4,
      label: 'Jour 4',
      description: '2 séances/jour. Amplitude augmentée.',
      exercises: ['isometric', 'eccentric', 'mobility'],
      maxSessions: 2
    },
    {
      day: 5,
      label: 'Jour 5',
      description: 'Contrôle + amplitude max. Test marche si OK.',
      exercises: ['isometric', 'eccentric', 'mobility'],
      maxSessions: 2
    }
  ];

  // ===================== HELPERS =====================
  function clampInt(value, min, max, fallback) {
    const n = parseInt(value, 10);
    if (isNaN(n)) return fallback;
    return Math.min(Math.max(n, min), max);
  }

  function buildDosageText(ex) {
    if (ex.timerType === 'hold') {
      const base = `${ex.reps} × ${ex.holdSeconds}s`;
      return ex.sets > 1 ? `${ex.sets} × (${base})` : base;
    }
    return `${ex.sets} × ${ex.reps} reps`;
  }

  /** Validates/sanitizes a raw exercise object. Returns null if unusable. */
  function normalize(raw) {
    if (!raw || typeof raw !== 'object') return null;
    const id = String(raw.id || '').trim();
    const name = String(raw.name || '').trim();
    if (!id || !name) return null;

    const timerType = ['hold', 'descent', 'manual'].includes(raw.timerType) ? raw.timerType : 'manual';

    let variants = null;
    if (Array.isArray(raw.variants)) {
      variants = raw.variants
        .map(v => (v && v.id && v.label) ? { id: String(v.id), label: String(v.label) } : null)
        .filter(Boolean);
      if (!variants.length) variants = null;
    }

    const ex = {
      id,
      name,
      tag: ['iso', 'exc', 'mob'].includes(raw.tag) ? raw.tag : 'mob',
      tagLabel: String(raw.tagLabel || '').trim() || 'Exercice',
      subtitle: String(raw.subtitle || ''),
      description: String(raw.description || ''),
      reps: clampInt(raw.reps, 1, 500, 10),
      sets: clampInt(raw.sets, 1, 50, 1),
      restSeconds: clampInt(raw.restSeconds, 0, 3600, 30),
      holdSeconds: clampInt(raw.holdSeconds, 1, 3600, 30),
      descentSeconds: clampInt(raw.descentSeconds, 1, 3600, 5),
      timerType,
      hasTimer: timerType !== 'manual',
      variants,
      frequencyText: String(raw.frequencyText || '1x / jour')
    };
    ex.dosageText = buildDosageText(ex);
    return ex;
  }

  /** The day plan references these ids — they must always exist in the library. */
  function ensurePlanExercises(arr) {
    const ids = new Set(arr.map(e => e.id));
    dayPlan.forEach(dp => dp.exercises.forEach(id => {
      if (!ids.has(id)) {
        const def = defaults.find(e => e.id === id);
        if (def) {
          arr.push({ ...def });
          ids.add(id);
        }
      }
    }));
    return arr;
  }

  // ===================== PERSISTENCE =====================
  function loadList() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        const arr = Array.isArray(parsed) ? parsed : parsed.exercises;
        if (Array.isArray(arr) && arr.length) {
          return ensurePlanExercises(arr.map(normalize).filter(Boolean));
        }
      }
    } catch {
      // corrupted storage → fall back to defaults
    }
    return defaults.map(e => ({ ...e }));
  }

  let list = loadList();

  function persist() {
    localStorage.setItem(KEY, JSON.stringify(list));
  }

  // ===================== API =====================
  function getAll() {
    return list;
  }

  function getById(id) {
    return list.find(e => e.id === id);
  }

  function getDayPlan(dayNum) {
    return dayPlan.find(d => d.day === dayNum) || dayPlan[dayPlan.length - 1];
  }

  function isInDayPlan(id) {
    return dayPlan.some(d => d.exercises.includes(id));
  }

  /** Creates or updates an exercise. Returns the saved exercise, or null if invalid. */
  function save(raw) {
    const ex = normalize(raw);
    if (!ex) return null;
    const idx = list.findIndex(e => e.id === ex.id);
    if (idx >= 0) list[idx] = ex;
    else list.push(ex);
    persist();
    return ex;
  }

  /** Deletes an exercise. Refuses if it's referenced by the day plan. */
  function remove(id) {
    if (isInDayPlan(id)) return false;
    list = list.filter(e => e.id !== id);
    persist();
    return true;
  }

  function resetToDefaults() {
    list = defaults.map(e => ({ ...e }));
    persist();
  }

  /** Generates a unique id (slug) from an exercise name. */
  function createId(name) {
    const base = name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'exercice';
    let id = base;
    let n = 2;
    while (getById(id)) id = `${base}-${n++}`;
    return id;
  }

  function exportJSON() {
    return JSON.stringify({
      app: 'tendons',
      type: 'exercises',
      exportedAt: new Date().toISOString(),
      exercises: list
    }, null, 2);
  }

  /** Replaces the library with the file content. Returns the number of imported exercises. */
  function importJSON(text) {
    const parsed = JSON.parse(text);
    const arr = Array.isArray(parsed) ? parsed : parsed && parsed.exercises;
    if (!Array.isArray(arr)) throw new Error('format invalide, liste « exercises » attendue');
    const imported = arr.map(normalize).filter(Boolean);
    if (!imported.length) throw new Error('aucun exercice valide dans ce fichier');
    list = ensurePlanExercises(imported);
    persist();
    return imported.length;
  }

  return {
    dayPlan, getAll, getById, getDayPlan, isInDayPlan,
    save, remove, resetToDefaults, createId, exportJSON, importJSON
  };
})();
