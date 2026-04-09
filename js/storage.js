/**
 * storage.js — Local storage abstraction for the Tendons app.
 */
const Storage = (() => {
  const KEY = 'tendons_data';

  function getDefault() {
    return {
      startDate: new Date().toISOString().slice(0, 10),
      sessions: [],          // { exerciseId, variant, painLevel, date, sessionId, completedAt }
      completedSessionIds: [], // IDs of fully validated sessions (all exercises done)
      inProgressSession: null  // { sessionId, date, day }
    };
  }

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return getDefault();
      return JSON.parse(raw);
    } catch {
      return getDefault();
    }
  }

  function save(data) {
    localStorage.setItem(KEY, JSON.stringify(data));
  }

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

  function getStartDate() {
    const data = load();
    return data.startDate;
  }

  /** Returns 1-based day number (capped at 5). */
  function getCurrentDay() {
    const start = new Date(getStartDate());
    const now = new Date();
    start.setHours(0, 0, 0, 0);
    now.setHours(0, 0, 0, 0);
    const diff = Math.floor((now - start) / 86400000);
    return Math.min(Math.max(diff + 1, 1), 5);
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

  /** Returns the date string for a given day number. */
  function getDateForDay(dayNum) {
    const start = new Date(getStartDate());
    start.setDate(start.getDate() + dayNum - 1);
    return start.toISOString().slice(0, 10);
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

  function setStartDate(dateStr) {
    const data = load();
    data.startDate = dateStr;
    save(data);
  }

  function reset() {
    localStorage.removeItem(KEY);
  }

  return {
    load, save, addSession, getSessions, getStartDate, setStartDate,
    getCurrentDay, getSessionCountForDate, getDateForDay,
    setDayDone, isDayManuallyDone, reset,
    startOrGetSession, getInProgressSession, completeSession,
    deleteCompletedSession, getCompletedSessionsForDate
  };
})();
