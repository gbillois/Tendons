/**
 * sound.js — Audio cues via Web Audio API. Disabled by default.
 */
const Sound = (() => {
  const KEY = 'tendons_settings';
  let ctx = null;

  function getSettings() {
    try {
      return JSON.parse(localStorage.getItem(KEY)) || {};
    } catch {
      return {};
    }
  }

  function isEnabled() {
    return getSettings().soundEnabled === true;
  }

  function setEnabled(on) {
    const settings = getSettings();
    settings.soundEnabled = on;
    localStorage.setItem(KEY, JSON.stringify(settings));
    if (on) ensureContext(); // user gesture: good moment to create/resume the context
  }

  function ensureContext() {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    if (!ctx) ctx = new AC();
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  /** Mobile browsers require a user gesture before audio can play. */
  function unlock() {
    if (isEnabled()) ensureContext();
  }

  function tone(freq, duration = 0.15, volume = 0.35, delay = 0) {
    if (!isEnabled()) return;
    const c = ensureContext();
    if (!c) return;
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    const t = c.currentTime + delay;
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(volume, t + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);
    osc.connect(gain);
    gain.connect(c.destination);
    osc.start(t);
    osc.stop(t + duration + 0.05);
  }

  // ===== Cues =====
  /** 3-2-1 countdown tick. */
  function countdownTick() { tone(740, 0.12); }
  /** Phase start (after countdown). */
  function start() { tone(880, 0.25); }
  /** Last seconds of a timer. */
  function tick() { tone(587, 0.08, 0.22); }
  /** End of a hold / descent / rest. */
  function phaseEnd() { tone(880, 0.12); tone(1175, 0.2, 0.35, 0.13); }
  /** Exercise fully done. */
  function complete() { tone(659, 0.15); tone(784, 0.15, 0.35, 0.16); tone(1047, 0.3, 0.35, 0.32); }

  return { isEnabled, setEnabled, unlock, countdownTick, start, tick, phaseEnd, complete };
})();
