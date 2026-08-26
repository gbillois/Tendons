/**
 * storage.js — Progress tracking, scoped per training program.
 *
 * Each program keeps its own start date, session log and day state, so loading
 * another program never mixes histories.
 */
const Storage = (() => {
  const KEY = 'tendons_progress';
  const LEGACY_KEY = 'tendons_data';
  const LEGACY_PROGRAM_ID = 'tendinopathie';

  function todayStr() {
    return new Date().toISOString().slice(0, 10);
  }

  function emptyProgress() {
    return {
      startDate: todayStr(),
      sessions: [],            // { exerciseId, variant, rating, date, sessionId, completedAt }
      completedSessionIds: [], // IDs of fully validated sessions (all exercises done)
      inProgressSession: null, // { sessionId, date, day }
      manualDone: []           // day numbers ticked by hand
    };
  }

  /** First run: adopt the pre-programs data as the tendinopathy program's progress. */
  function migrateLegacy() {
    const store = { byProgram: {} };
    try {
      const raw = localStorage.getItem(LEGACY_KEY);
      if (raw) {
        const legacy = JSON.parse(raw);
        store.byProgram[LEGACY_PROGRAM_ID] = {
          ...emptyProgress(),
          ...legacy,
          sessions: Array.isArray(legacy.sessions) ? legacy.sessions : [],
          completedSessionIds: Array.isArray(legacy.completedSessionIds) ? legacy.completedSessionIds : [],
          manualDone: Array.isArray(legacy.manualDone) ? legacy.manualDone : []
        };
      }
    } catch {
      // unreadable legacy data → start clean
    }
    return store;
  }

  // Set when the legacy store had to be migrated, so it gets written back on startup.
  let needsPersist = false;

  function loadStore() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed.byProgram === 'object' && parsed.byProgram) return parsed;
      }
    } catch {
      // corrupted storage → start clean
    }
    needsPersist = true;
    return migrateLegacy();
  }

  let store = loadStore();

  function persistStore() {
    localStorage.setItem(KEY, JSON.stringify(store));
  }

  // Migrated data is saved right away, so the legacy record is only read once.
  if (needsPersist) persistStore();

  function currentProgramId() {
    return Programs.getActiveId();
  }

  /** Progress record for a program, created on first access. */
  function load(programId) {
    const id = programId || currentProgramId();
    if (!store.byProgram[id]) {
      store.byProgram[id] = emptyProgress();
      persistStore();
    }
    return store.byProgram[id];
  }

  function save(data, programId) {
    store.byProgram[programId || currentProgramId()] = data;
    persistStore();
  }

  /** Number of days in the active program — the schedule is no longer fixed at 5. */
  function dayCount() {
    const program = Programs.getActive();
    return program && program.days.length ? program.days.length : 1;
  }

  // ===================== SESSIONS =====================
  function addSession(session) {
    const data = load();
    data.sessions.push({
      ...session,
      completedAt: new Date().toISOString()
    });
    save(data);
    return data;
  }

  function getSessions() {
    return load().sessions;
  }

  // ===================== SCHEDULE =====================
  function getStartDate() {
    return load().startDate;
  }

  function setStartDate(dateStr) {
    const data = load();
    data.startDate = dateStr;
    save(data);
  }

  /** Returns the 1-based day number for today, capped at the program length. */
  function getCurrentDay() {
    const start = new Date(getStartDate());
    const now = new Date();
    start.setHours(0, 0, 0, 0);
    now.setHours(0, 0, 0, 0);
    const diff = Math.floor((now - start) / 86400000);
    return Math.min(Math.max(diff + 1, 1), dayCount());
  }

  /** Returns the date string for a given day number. */
  function getDateForDay(dayNum) {
    const start = new Date(getStartDate());
    start.setDate(start.getDate() + dayNum - 1);
    return start.toISOString().slice(0, 10);
  }

  /** Returns validated (complete) session count for a given date. */
  function getSessionCountForDate(dateStr) {
    const data = load();
    const completedIds = new Set(data.completedSessionIds || []);
    const sessionIdsOnDate = new Set(
      (data.sessions || [])
        .filter(s => s.completedAt && s.completedAt.slice(0, 10) === dateStr &&
                     s.sessionId && completedIds.has(s.sessionId))
        .map(s => s.sessionId)
    );
    return sessionIdsOnDate.size;
  }

  /** Returns or creates an in-progress session for the given date+day. */
  function startOrGetSession(dateStr, dayNum) {
    const data = load();
    if (data.inProgressSession &&
        data.inProgressSession.date === dateStr &&
        data.inProgressSession.day === dayNum) {
      return data.inProgressSession;
    }
    const sessionId = Date.now().toString(36) + Math.random().toString(36).slice(2);
    const session = { sessionId, date: dateStr, day: dayNum };
    data.inProgressSession = session;
    save(data);
    return session;
  }

  function getInProgressSession() {
    return load().inProgressSession || null;
  }

  /** Mark a session as fully validated (all exercises done). */
  function completeSession(sessionId) {
    const data = load();
    if (!data.completedSessionIds) data.completedSessionIds = [];
    if (!data.completedSessionIds.includes(sessionId)) {
      data.completedSessionIds.push(sessionId);
    }
    if (data.inProgressSession && data.inProgressSession.sessionId === sessionId) {
      data.inProgressSession = null;
    }
    save(data);
  }

  /** Delete a completed session and all its exercise records. */
  function deleteCompletedSession(sessionId) {
    const data = load();
    data.completedSessionIds = (data.completedSessionIds || []).filter(id => id !== sessionId);
    data.sessions = (data.sessions || []).filter(s => s.sessionId !== sessionId);
    save(data);
  }

  /** Returns validated sessions for a date as array of { sessionId, exercises }. */
  function getCompletedSessionsForDate(dateStr) {
    const data = load();
    const completedIds = new Set(data.completedSessionIds || []);
    const map = new Map();
    (data.sessions || []).forEach(s => {
      if (s.completedAt && s.completedAt.slice(0, 10) === dateStr &&
          s.sessionId && completedIds.has(s.sessionId)) {
        if (!map.has(s.sessionId)) map.set(s.sessionId, []);
        map.get(s.sessionId).push(s);
      }
    });
    return [...map.entries()].map(([id, exercises]) => ({ sessionId: id, exercises }));
  }

  // ===================== DAY STATE =====================
  function setDayDone(dayNum, done) {
    const data = load();
    if (!data.manualDone) data.manualDone = [];
    if (done) {
      if (!data.manualDone.includes(dayNum)) data.manualDone.push(dayNum);
    } else {
      data.manualDone = data.manualDone.filter(d => d !== dayNum);
    }
    save(data);
  }

  function isDayManuallyDone(dayNum) {
    return (load().manualDone || []).includes(dayNum);
  }

  // ===================== RESET =====================
  /** Clears the active program's progress; other programs keep theirs. */
  function reset(programId) {
    const id = programId || currentProgramId();
    store.byProgram[id] = emptyProgress();
    persistStore();
  }

  /** Drops the progress of a program that no longer exists. */
  function dropProgram(programId) {
    delete store.byProgram[programId];
    persistStore();
  }

  function resetAll() {
    store = { byProgram: {} };
    persistStore();
  }

  return {
    load, save, addSession, getSessions, getStartDate, setStartDate,
    getCurrentDay, getSessionCountForDate, getDateForDay, dayCount,
    setDayDone, isDayManuallyDone, reset, resetAll, dropProgram,
    startOrGetSession, getInProgressSession, completeSession,
    deleteCompletedSession, getCompletedSessionsForDate
  };
})();
