/** مؤثرات صوتية مُصنّعة بالكامل عبر Web Audio — بدون ملفات */
class AudioManager {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private muted = false;

  init() {
    if (this.ctx) return;
    this.ctx = new AudioContext();
    this.master = this.ctx.createGain();
    this.master.gain.value = this.muted ? 0 : 0.5;
    this.master.connect(this.ctx.destination);
    if (this.ctx.state === "suspended") void this.ctx.resume();
  }

  toggleMute() {
    this.muted = !this.muted;
    if (this.master && this.ctx) {
      this.master.gain.setTargetAtTime(this.muted ? 0 : 0.5, this.ctx.currentTime, 0.05);
    }
    return this.muted;
  }

  private noise(dur: number, filterFreq: number, vol: number, type: BiquadFilterType = "lowpass") {
    if (!this.ctx || !this.master) return;
    const ctx = this.ctx;
    const t = ctx.currentTime;
    const len = Math.max(1, Math.floor(ctx.sampleRate * dur));
    const buffer = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = type;
    filter.frequency.value = filterFreq;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(vol, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.master);
    src.start(t);
    src.stop(t + dur);
  }

  private tone(freqFrom: number, freqTo: number, dur: number, vol: number, type: OscillatorType = "sine") {
    if (!this.ctx || !this.master) return;
    const ctx = this.ctx;
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    osc.type = type;
    osc.frequency.setValueAtTime(freqFrom, t);
    osc.frequency.exponentialRampToValueAtTime(Math.max(1, freqTo), t + dur);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(vol, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
    osc.connect(gain);
    gain.connect(this.master);
    osc.start(t);
    osc.stop(t + dur + 0.05);
  }

  /** طلقة بندقية */
  shot() {
    this.noise(0.12, 2200, 0.35, "bandpass");
    this.tone(160, 40, 0.14, 0.5, "square");
  }

  /** طلقة بعيدة (خصم) */
  shotFar() {
    this.noise(0.14, 900, 0.12, "lowpass");
  }

  /** إصابة خصم (هيت ماركر) */
  hitmark() {
    this.tone(1400, 900, 0.06, 0.22, "triangle");
  }

  /** إصابتي أنا */
  hurt() {
    this.tone(220, 80, 0.25, 0.4, "sawtooth");
    this.noise(0.2, 500, 0.2);
  }

  /** قتل */
  kill() {
    const ctx = this.ctx;
    if (!ctx || !this.master) return;
    [440, 660, 880].forEach((f, i) => {
      setTimeout(() => this.tone(f, f, 0.12, 0.2, "square"), i * 70);
    });
  }

  reload() {
    this.noise(0.06, 3000, 0.18, "highpass");
    setTimeout(() => this.noise(0.06, 2400, 0.18, "highpass"), 300);
    setTimeout(() => this.noise(0.08, 1800, 0.22, "highpass"), 1200);
  }

  empty() {
    this.tone(900, 700, 0.05, 0.12, "square");
  }

  step() {
    this.noise(0.05, 400, 0.07);
  }

  die() {
    this.tone(300, 40, 0.7, 0.4, "sawtooth");
  }

  win() {
    const seq = [523, 659, 784, 1046];
    seq.forEach((f, i) => setTimeout(() => this.tone(f, f, 0.2, 0.22, "square"), i * 140));
  }

  lose() {
    const seq = [392, 330, 262, 196];
    seq.forEach((f, i) => setTimeout(() => this.tone(f, f, 0.25, 0.22, "square"), i * 160));
  }
}

export const audio = new AudioManager();
