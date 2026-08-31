/**
 * exercises.js — Exercise model: validation, normalization and formatting.
 *
 * Pure logic, no persistence: an exercise always belongs to a training program
 * (see programs.js), which owns the storage.
 */
const ExerciseModel = (() => {
  /** Movement types the runner knows how to execute. */
  const TIMER_TYPES = ['hold', 'descent', 'manual'];

  const TIMER_TYPE_LABELS = {
    hold: 'maintien chronométré',
    descent: 'phase lente chronométrée',
    manual: 'comptage manuel'
  };

  /** Colour keys for the category badge. */
  const TAGS = ['blue', 'red', 'green', 'amber', 'violet', 'gray'];

  /** Older versions used physio-specific tag names. */
  const LEGACY_TAGS = { iso: 'blue', exc: 'red', mob: 'green' };

  // ===================== HELPERS =====================
  function clampInt(value, min, max, fallback) {
    const n = parseInt(value, 10);
    if (isNaN(n)) return fallback;
    return Math.min(Math.max(n, min), max);
  }

  function slugify(text, fallback) {
    return String(text).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || fallback;
  }

  function buildDosageText(ex) {
    if (ex.timerType === 'hold') {
      const base = `${ex.reps} × ${ex.holdSeconds}s`;
      return ex.sets > 1 ? `${ex.sets} × (${base})` : base;
    }
    return `${ex.sets} × ${ex.reps} reps`;
  }

  function normalizeTag(tag) {
    const t = String(tag || '');
    if (TAGS.includes(t)) return t;
    return LEGACY_TAGS[t] || 'blue';
  }

  /** Validates/sanitizes a raw exercise object. Returns null if unusable. */
  function normalize(raw) {
    if (!raw || typeof raw !== 'object') return null;
    const id = String(raw.id || '').trim();
    const name = String(raw.name || '').trim();
    if (!id || !name) return null;

    const timerType = TIMER_TYPES.includes(raw.timerType) ? raw.timerType : 'manual';

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
      tag: normalizeTag(raw.tag),
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
      // null = follow the program; true/false override it for this exercise only.
      manualAdvance: raw.manualAdvance === true ? true
                   : raw.manualAdvance === false ? false
                   : null,
      loadText: String(raw.loadText || '').trim(),
      frequencyText: String(raw.frequencyText || '1x / jour')
    };
    ex.dosageText = buildDosageText(ex);
    return ex;
  }

  /** Generates an id unique within `list` from an exercise name. */
  function createId(name, list) {
    const base = slugify(name, 'exercice');
    let id = base;
    let n = 2;
    while (list.some(e => e.id === id)) id = `${base}-${n++}`;
    return id;
  }

  return {
    TIMER_TYPES, TIMER_TYPE_LABELS, TAGS,
    clampInt, slugify, normalize, buildDosageText, createId
  };
})();
