/**
 * notify.js — Desktop notifications (Notification API), for training in front of
 * a computer where the tab is often in the background.
 *
 * Two verbosity levels:
 *   - 'exercise' : start/end of an exercise, end of a session.
 *   - 'movement' : every movement step too (rep, série, maintien, descente, repos).
 * Disabled by default; requires the user to grant permission.
 */
const Notify = (() => {
  const KEY = 'tendons_settings';
  const LEVELS = ['exercise', 'movement'];
  const ICON = 'icon.svg';

  // Movement cues replace each other; exercise cues stack.
  const TAG_MOVEMENT = 'mow-movement';
  const TAG_EXERCISE = 'mow-exercise';

  const AUTO_CLOSE_MS = { [TAG_MOVEMENT]: 4000, [TAG_EXERCISE]: 8000 };

  function getSettings() {
    try {
      return JSON.parse(localStorage.getItem(KEY)) || {};
    } catch {
      return {};
    }
  }

  function saveSettings(patch) {
    const settings = { ...getSettings(), ...patch };
    localStorage.setItem(KEY, JSON.stringify(settings));
    return settings;
  }

  function isSupported() {
    return typeof window !== 'undefined' && 'Notification' in window;
  }

  /** 'unsupported' | 'default' | 'granted' | 'denied' */
  function permission() {
    if (!isSupported()) return 'unsupported';
    return Notification.permission;
  }

  function isEnabled() {
    return getSettings().notifyEnabled === true && permission() === 'granted';
  }

  function getLevel() {
    const level = getSettings().notifyLevel;
    return LEVELS.includes(level) ? level : 'exercise';
  }

  function setLevel(level) {
    if (!LEVELS.includes(level)) return;
    saveSettings({ notifyLevel: level });
  }

  /**
   * Turns notifications on/off. Enabling asks for permission if needed.
   * Returns a promise resolving to the resulting enabled state.
   */
  async function setEnabled(on) {
    if (!on) {
      saveSettings({ notifyEnabled: false });
      return false;
    }
    if (!isSupported()) {
      saveSettings({ notifyEnabled: false });
      return false;
    }
    let perm = Notification.permission;
    if (perm === 'default') {
      try {
        perm = await Notification.requestPermission();
      } catch {
        perm = Notification.permission;
      }
    }
    const granted = perm === 'granted';
    saveSettings({ notifyEnabled: granted });
    return granted;
  }

  function show(title, body, tag) {
    if (!isEnabled()) return null;
    try {
      const notification = new Notification(title, {
        body,
        tag,
        icon: ICON,
        badge: ICON,
        renotify: tag === TAG_MOVEMENT,
        silent: true // audio cues are handled by sound.js
      });
      notification.addEventListener('click', () => {
        window.focus();
        notification.close();
      });
      const delay = AUTO_CLOSE_MS[tag] || 5000;
      setTimeout(() => notification.close(), delay);
      return notification;
    } catch {
      return null; // some browsers refuse constructed notifications (e.g. mobile)
    }
  }

  /** Coarse cue — shown at both levels. */
  function exercise(title, body) {
    return show(title, body, TAG_EXERCISE);
  }

  /** Fine-grained cue — shown only at the 'movement' level. */
  function movement(title, body) {
    if (getLevel() !== 'movement') return null;
    return show(title, body, TAG_MOVEMENT);
  }

  /** Sends a sample notification so the user can check it works. */
  function test() {
    return show('My Own Workout', 'Les notifications sont actives.', TAG_EXERCISE);
  }

  return {
    LEVELS, isSupported, permission, isEnabled, setEnabled,
    getLevel, setLevel, exercise, movement, test
  };
})();
