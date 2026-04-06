/**
 * timer.js — Timer engine for exercise execution.
 */
const Timer = (() => {
  let interval = null;
  let remaining = 0;
  let total = 0;
  let onTick = null;
  let onComplete = null;
  let paused = false;

  const CIRCUMFERENCE = 2 * Math.PI * 54; // matches SVG r=54

  function start(seconds, tickCb, completeCb) {
    stop();
    total = seconds;
    remaining = seconds;
    onTick = tickCb;
    onComplete = completeCb;
    paused = false;
    tick();
    interval = setInterval(tick, 1000);
  }

  function tick() {
    if (paused) return;
    const display = remaining;
    const progress = total > 0 ? (total - remaining) / total : 0;
    if (onTick) onTick(display, progress);

    if (remaining <= 0) {
      stop();
      if (onComplete) onComplete();
      return;
    }
    remaining--;
  }

  function pause() {
    paused = true;
  }

  function resume() {
    paused = false;
  }

  function stop() {
    if (interval) clearInterval(interval);
    interval = null;
    paused = false;
  }

  function isPaused() {
    return paused;
  }

  function getCircumference() {
    return CIRCUMFERENCE;
  }

  return { start, pause, resume, stop, isPaused, getCircumference };
})();
