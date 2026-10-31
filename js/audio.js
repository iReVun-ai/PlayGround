/* Tiny WebAudio synth — no audio files, everything is generated. */

class AudioEngine {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.ambient = null;
    this.noiseBuffer = null;
    this.muted = false;
    try {
      this.muted = localStorage.getItem('lp0-muted') === '1';
    } catch { /* storage may be unavailable */ }
  }

  unlock() {
    if (!this.ctx) {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return;
      this.ctx = new Ctx();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.muted ? 0 : 0.5;
      this.master.connect(this.ctx.destination);
      this.buildNoise();
      this.startAmbient();
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
  }

  buildNoise() {
    const length = this.ctx.sampleRate * 2;
    const buffer = this.ctx.createBuffer(1, length, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i += 1) data[i] = Math.random() * 2 - 1;
    this.noiseBuffer = buffer;
  }

  startAmbient() {
    const ctx = this.ctx;
    const bus = ctx.createGain();
    bus.gain.value = 0.055;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 420;
    filter.Q.value = 1.4;
    bus.connect(filter);
    filter.connect(this.master);

    const notes = [55, 82.41, 110, 164.81];
    const oscs = notes.map((freq, index) => {
      const osc = ctx.createOscillator();
      osc.type = index % 2 ? 'triangle' : 'sine';
      osc.frequency.value = freq;
      osc.detune.value = index % 2 ? 7 : -7;
      const gain = ctx.createGain();
      gain.gain.value = 0.3 / (index + 1);
      osc.connect(gain);
      gain.connect(bus);
      osc.start();
      return osc;
    });

    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.frequency.value = 0.07;
    lfoGain.gain.value = 160;
    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);
    lfo.start();

    this.ambient = { bus, oscs, lfo };
  }

  setMuted(muted) {
    this.muted = muted;
    try { localStorage.setItem('lp0-muted', muted ? '1' : '0'); } catch { /* ignore */ }
    if (this.master && this.ctx) {
      this.master.gain.cancelScheduledValues(this.ctx.currentTime);
      this.master.gain.linearRampToValueAtTime(muted ? 0 : 0.5, this.ctx.currentTime + 0.2);
    }
  }

  tone(freq, duration = 0.16, { type = 'sine', gain = 0.12, slide = null, delay = 0, filter = null } = {}) {
    if (!this.ctx || this.muted) return;
    const ctx = this.ctx;
    const t0 = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (slide) osc.frequency.exponentialRampToValueAtTime(Math.max(20, slide), t0 + duration);
    let node = osc;
    if (filter) {
      const f = ctx.createBiquadFilter();
      f.type = filter.type || 'lowpass';
      f.frequency.setValueAtTime(filter.freq || 1200, t0);
      if (filter.sweep) f.frequency.exponentialRampToValueAtTime(Math.max(40, filter.sweep), t0 + duration);
      f.Q.value = filter.q || 1;
      node.connect(f);
      node = f;
    }
    node.connect(g);
    g.connect(this.master);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(gain, t0 + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
    osc.start(t0);
    osc.stop(t0 + duration + 0.03);
  }

  noise(duration = 0.2, { gain = 0.14, delay = 0, type = 'bandpass', freq = 900, sweep = null, q = 0.8 } = {}) {
    if (!this.ctx || this.muted || !this.noiseBuffer) return;
    const ctx = this.ctx;
    const t0 = ctx.currentTime + delay;
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuffer;
    const filter = ctx.createBiquadFilter();
    filter.type = type;
    filter.frequency.setValueAtTime(freq, t0);
    if (sweep) filter.frequency.exponentialRampToValueAtTime(Math.max(60, sweep), t0 + duration);
    filter.Q.value = q;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(gain, t0 + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
    src.connect(filter);
    filter.connect(g);
    g.connect(this.master);
    src.start(t0);
    src.stop(t0 + duration + 0.02);
  }

  play(name) {
    if (!this.ctx) this.unlock();
    if (!this.ctx) return;
    switch (name) {
      case 'click':
        this.tone(540, 0.06, { type: 'triangle', gain: 0.045, slide: 760 });
        break;
      case 'select':
        this.tone(330, 0.1, { type: 'sine', gain: 0.05, slide: 520 });
        this.tone(660, 0.08, { type: 'sine', gain: 0.025, delay: 0.04 });
        break;
      case 'draw':
        this.noise(0.16, { gain: 0.05, freq: 2200, sweep: 700 });
        this.tone(420, 0.1, { type: 'triangle', gain: 0.035, slide: 660 });
        break;
      case 'summon':
        [220, 330, 440, 660].forEach((f, i) => this.tone(f, 0.32, {
          type: 'sawtooth', gain: 0.05, delay: i * 0.055, filter: { freq: 2200, sweep: 900, q: 2 },
        }));
        this.noise(0.3, { gain: 0.08, freq: 400, sweep: 2600 });
        break;
      case 'set':
        this.tone(140, 0.16, { type: 'sine', gain: 0.09, slide: 70 });
        this.noise(0.1, { gain: 0.05, freq: 500, sweep: 200 });
        break;
      case 'attack':
        this.noise(0.26, { gain: 0.12, type: 'bandpass', freq: 1800, sweep: 180, q: 0.6 });
        this.tone(180, 0.22, { type: 'sawtooth', gain: 0.05, slide: 60, filter: { freq: 900, sweep: 200 } });
        break;
      case 'hit':
        this.tone(110, 0.32, { type: 'sine', gain: 0.16, slide: 36 });
        this.tone(64, 0.4, { type: 'triangle', gain: 0.1, slide: 30 });
        this.noise(0.22, { gain: 0.11, type: 'lowpass', freq: 900, sweep: 120 });
        break;
      case 'heal':
        [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => this.tone(f, 0.5, {
          type: 'sine', gain: 0.05, delay: i * 0.07,
        }));
        break;
      case 'buff':
        [392, 523.25, 784].forEach((f, i) => this.tone(f, 0.3, {
          type: 'triangle', gain: 0.05, delay: i * 0.06, slide: f * 1.12,
        }));
        break;
      case 'burn':
        this.noise(0.34, { gain: 0.1, type: 'lowpass', freq: 1400, sweep: 240 });
        this.tone(90, 0.3, { type: 'sawtooth', gain: 0.05, slide: 40 });
        break;
      case 'trap':
        this.tone(880, 0.18, { type: 'square', gain: 0.05 });
        this.tone(660, 0.18, { type: 'square', gain: 0.05, delay: 0.16 });
        this.tone(880, 0.28, { type: 'square', gain: 0.05, delay: 0.32 });
        this.noise(0.4, { gain: 0.05, freq: 3000, sweep: 700 });
        break;
      case 'spell':
        this.noise(0.4, { gain: 0.06, freq: 600, sweep: 4200, type: 'bandpass' });
        [329.63, 493.88, 659.25, 987.77].forEach((f, i) => this.tone(f, 0.4, {
          type: 'sine', gain: 0.04, delay: i * 0.05,
        }));
        break;
      case 'turn':
        this.noise(0.5, { gain: 0.05, type: 'bandpass', freq: 200, sweep: 1600, q: 0.9 });
        this.tone(146.83, 0.7, { type: 'sine', gain: 0.04, slide: 220 });
        break;
      case 'win':
        [261.63, 329.63, 392, 523.25, 659.25, 783.99].forEach((f, i) => this.tone(f, 1.4, {
          type: 'triangle', gain: 0.06, delay: i * 0.1,
        }));
        this.noise(1.2, { gain: 0.04, freq: 400, sweep: 5000 });
        break;
      case 'lose':
        [220, 185, 146.83, 110].forEach((f, i) => this.tone(f, 1.1, {
          type: 'sine', gain: 0.07, delay: i * 0.16, slide: f * 0.72,
        }));
        break;
      default:
        break;
    }
  }
}

export const audio = new AudioEngine();
