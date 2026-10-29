// Procedural Web Audio API sound generator for cute tactile feedback
class SoundFX {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.rollOsc = null;
    this.rollGain = null;
    this.initialized = false;
  }

  init() {
    if (this.initialized) return;
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioContext();
      this.initialized = true;

      // Continuous rolling sound generator
      this.rollOsc = this.ctx.createOscillator();
      this.rollGain = this.ctx.createGain();
      this.rollFilter = this.ctx.createBiquadFilter();

      this.rollOsc.type = 'triangle';
      this.rollOsc.frequency.setValueAtTime(40, this.ctx.currentTime);

      this.rollFilter.type = 'lowpass';
      this.rollFilter.frequency.setValueAtTime(220, this.ctx.currentTime);

      this.rollGain.gain.setValueAtTime(0, this.ctx.currentTime);

      this.rollOsc.connect(this.rollFilter);
      this.rollFilter.connect(this.rollGain);
      this.rollGain.connect(this.ctx.destination);
      this.rollOsc.start();
    } catch (e) {
      console.warn('Web Audio not supported or blocked:', e);
    }
  }

  ensureContext() {
    if (!this.initialized) this.init();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggleMute() {
    this.muted = !this.muted;
    if (this.muted && this.rollGain && this.ctx) {
      this.rollGain.gain.setValueAtTime(0, this.ctx.currentTime);
    }
    return this.muted;
  }

  updateRolling(speedRatio) {
    if (this.muted || !this.ctx || !this.rollGain) return;
    const now = this.ctx.currentTime;
    const absSpeed = Math.abs(speedRatio);
    if (absSpeed > 0.05) {
      const targetGain = Math.min(0.08, absSpeed * 0.08);
      const targetFreq = 45 + absSpeed * 120;
      this.rollGain.gain.linearRampToValueAtTime(targetGain, now + 0.05);
      this.rollOsc.frequency.linearRampToValueAtTime(targetFreq, now + 0.05);
      this.rollFilter.frequency.linearRampToValueAtTime(180 + absSpeed * 400, now + 0.05);
    } else {
      this.rollGain.gain.linearRampToValueAtTime(0, now + 0.08);
    }
  }

  // Cute pop / boing for jumping
  playJump() {
    if (this.muted) return;
    this.ensureContext();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.exponentialRampToValueAtTime(480, now + 0.16);

    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.24);
  }

  // Cute chime when collecting stars/flowers
  playCollect() {
    if (this.muted) return;
    this.ensureContext();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.04);

      gain.gain.setValueAtTime(0, now);
      gain.gain.setValueAtTime(0.12, now + idx * 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.04 + 0.25);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now + idx * 0.04);
      osc.stop(now + idx * 0.04 + 0.28);
    });
  }

  // Playful click for UI interactions
  playClick() {
    if (this.muted) return;
    this.ensureContext();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, now);
    osc.frequency.exponentialRampToValueAtTime(300, now + 0.05);

    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.07);
  }

  // Horn / squeak
  playHonk() {
    if (this.muted) return;
    this.ensureContext();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.linearRampToValueAtTime(380, now + 0.08);
    osc.frequency.linearRampToValueAtTime(310, now + 0.2);

    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, now);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.26);
  }
}

export const sound = new SoundFX();
