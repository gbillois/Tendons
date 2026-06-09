/**
 * wakelock.js — Keeps the screen awake during an exercise (Screen Wake Lock API).
 * Requires HTTPS; silently does nothing on unsupported browsers.
 */
const WakeLock = (() => {
  let sentinel = null;
  let wanted = false;

  async function acquire() {
    if (!('wakeLock' in navigator)) return;
    try {
      sentinel = await navigator.wakeLock.request('screen');
      sentinel.addEventListener('release', () => { sentinel = null; });
    } catch {
      sentinel = null;
    }
  }

  function enable() {
    wanted = true;
    acquire();
  }

  function disable() {
    wanted = false;
    if (sentinel) {
      sentinel.release().catch(() => {});
      sentinel = null;
    }
  }

  // The lock is released automatically when the tab is hidden;
  // re-acquire it when the user comes back mid-exercise.
  document.addEventListener('visibilitychange', () => {
    if (wanted && document.visibilityState === 'visible' && !sentinel) acquire();
  });

  return { enable, disable };
})();
