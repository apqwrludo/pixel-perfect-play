type Ctx = AudioContext | null;
let ctx: Ctx = null;

function getCtx(): Ctx {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

let enabled = true;
export function setSoundEnabled(v: boolean) {
  enabled = v;
}

function tone(freq: number, dur: number, type: OscillatorType, gain = 0.06, delay = 0) {
  const c = getCtx();
  if (!c || !enabled) return;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, c.currentTime + delay);
  g.gain.setValueAtTime(0.0001, c.currentTime + delay);
  g.gain.exponentialRampToValueAtTime(gain, c.currentTime + delay + 0.015);
  g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + delay + dur);
  osc.connect(g).connect(c.destination);
  osc.start(c.currentTime + delay);
  osc.stop(c.currentTime + delay + dur + 0.05);
}

export const sfx = {
  dice() {
    for (let i = 0; i < 5; i++) {
      tone(160 + Math.random() * 220, 0.05, "square", 0.035, i * 0.06);
    }
  },
  step() {
    tone(620, 0.07, "triangle", 0.05);
  },
  capture() {
    tone(220, 0.14, "sawtooth", 0.07);
    tone(140, 0.22, "sawtooth", 0.06, 0.08);
  },
  home() {
    [660, 880, 1180].forEach((f, i) => tone(f, 0.14, "triangle", 0.06, i * 0.09));
  },
  win() {
    [523, 659, 784, 1046, 1318].forEach((f, i) => tone(f, 0.22, "triangle", 0.07, i * 0.12));
  },
  tap() {
    tone(880, 0.05, "sine", 0.04);
  },
  coin() {
    tone(1046, 0.08, "triangle", 0.05);
    tone(1568, 0.12, "triangle", 0.045, 0.06);
  },
};

export function buzz(ms: number | number[]) {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    try {
      navigator.vibrate(ms);
    } catch {
      /* noop */
    }
  }
}
