// Ringtones generated with the Web Audio API (no audio files to ship).
let ctx = null;
let timer = null;

function beep(freq, start, duration, volume) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0, start);
  gain.gain.linearRampToValueAtTime(volume, start + 0.02);
  gain.gain.linearRampToValueAtTime(0, start + duration);
  osc.connect(gain).connect(ctx.destination);
  osc.start(start);
  osc.stop(start + duration + 0.05);
}

/** kind: 'ring' (incoming call) | 'ringback' (what the caller hears while waiting) */
export function startTone(kind) {
  stopTone();
  try {
    ctx = ctx || new (window.AudioContext || window.webkitAudioContext)();
    ctx.resume?.();
    const play = () => {
      const t0 = ctx.currentTime;
      if (kind === 'ring') { beep(880, t0, 0.22, 0.18); beep(660, t0 + 0.28, 0.22, 0.18); beep(880, t0 + 0.56, 0.22, 0.18); }
      else beep(425, t0, 1.0, 0.1);
    };
    play();
    timer = setInterval(play, kind === 'ring' ? 2500 : 3000);
  } catch { /* audio blocked: the call still works, just silently */ }
}

export function stopTone() {
  clearInterval(timer);
  timer = null;
}
