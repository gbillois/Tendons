/**
 * storage.js — Local storage abstraction for the Tendons app.
 */
const Storage = (() => {
  const KEY = 'tendons_data';

  function getDefault() {
    return {
      startDate: new Date().toISOString().slice(0, 10),
      sessions: []  // { date, exerciseId, variant?, painLevel, completedAt }
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

  /** Returns session count for a given date string (YYYY-MM-DD). */
  function getSessionCountForDate(dateStr) {
    return load().sessions.filter(s => s.completedAt.slice(0, 10) === dateStr).length;
  }

  /** Returns the date string for a given day number. */
  function getDateForDay(dayNum) {
    const start = new Date(getStartDate());
    start.setDate(start.getDate() + dayNum - 1);
    return start.toISOString().slice(0, 10);
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

  return { load, save, addSession, getSessions, getStartDate, setStartDate, getCurrentDay, getSessionCountForDate, getDateForDay, setDayDone, isDayManuallyDone, reset };
})();
