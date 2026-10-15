/**
 * Cutlas Procedural Web Audio Synth Engine
 * Creates all sound effects and dynamic Spaghetti-Western synth soundtrack procedurally
 * without any external audio asset dependencies.
 */

class SynthEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private isMuted: boolean = false;
  private sfxVolume: number = 0.8;
  private musicVolume: number = 0.5;
  
  // Music state
  private isMusicPlaying: boolean = false;
  private musicTimer: number | null = null;
  private musicStep: number = 0;
  private tempo: number = 110; // BPM

  constructor() {
    // AudioContext will be initialized on first user interaction
  }

  private initCtx() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
      
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 1, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.setValueAtTime(this.sfxVolume, this.ctx.currentTime);
      this.sfxGain.connect(this.masterGain);

      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.setValueAtTime(this.musicVolume, this.ctx.currentTime);
      this.musicGain.connect(this.masterGain);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setMute(muted: boolean) {
    this.isMuted = muted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(muted ? 0 : 1, this.ctx.currentTime, 0.05);
    }
  }

  public getMute() {
    return this.isMuted;
  }

  public setMusicVolume(val: number) {
    this.musicVolume = Math.max(0, Math.min(1, val));
    if (this.musicGain && this.ctx) {
      this.musicGain.gain.setTargetAtTime(this.musicVolume, this.ctx.currentTime, 0.05);
    }
  }

  public setSfxVolume(val: number) {
    this.sfxVolume = Math.max(0, Math.min(1, val));
    if (this.sfxGain && this.ctx) {
      this.sfxGain.gain.setTargetAtTime(this.sfxVolume, this.ctx.currentTime, 0.05);
    }
  }

  public getMusicVolume() {
    return this.musicVolume;
  }

  public getSfxVolume() {
    return this.sfxVolume;
  }

  // --- Sound Effects ---

  /** Swift line slash / sword swoosh */
  public playSlash(pitchMod: number = 1.0) {
    this.initCtx();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;

    // Filtered noise for air cut
    const bufferSize = this.ctx.sampleRate * 0.18;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.28));
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.Q.value = 4.0;
    filter.frequency.setValueAtTime(800 * pitchMod, now);
    filter.frequency.exponentialRampToValueAtTime(3200 * pitchMod, now + 0.06);
    filter.frequency.exponentialRampToValueAtTime(600 * pitchMod, now + 0.18);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.8, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

    // Blade steel metallic ring (resonant sine)
    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(1400 * pitchMod, now);
    osc.frequency.exponentialRampToValueAtTime(880 * pitchMod, now + 0.14);
    oscGain.gain.setValueAtTime(0.2, now);
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    osc.connect(oscGain);
    oscGain.connect(this.sfxGain);

    noise.start(now);
    noise.stop(now + 0.19);
    osc.start(now);
    osc.stop(now + 0.15);
  }

  /** Heavy revolver / gun shot */
  public playGunshot() {
    this.initCtx();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;

    // Sub kick punch
    const kick = this.ctx.createOscillator();
    const kickGain = this.ctx.createGain();
    kick.type = 'sine';
    kick.frequency.setValueAtTime(180, now);
    kick.frequency.exponentialRampToValueAtTime(32, now + 0.15);
    kickGain.gain.setValueAtTime(1.0, now);
    kickGain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);

    // Blast noise
    const bufferSize = this.ctx.sampleRate * 0.25;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 3);
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(2800, now);
    filter.frequency.exponentialRampToValueAtTime(250, now + 0.22);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(1.0, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);

    kick.connect(kickGain);
    kickGain.connect(this.sfxGain);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.sfxGain);

    kick.start(now);
    kick.stop(now + 0.21);
    noise.start(now);
    noise.stop(now + 0.26);
  }

  /** Bullet ricochet / metal ping */
  public playRicochet() {
    this.initCtx();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';

    const startFreq = 1600 + Math.random() * 800;
    osc.frequency.setValueAtTime(startFreq, now);
    osc.frequency.exponentialRampToValueAtTime(startFreq * 2.5, now + 0.05);
    osc.frequency.exponentialRampToValueAtTime(startFreq * 0.4, now + 0.28);

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.29);
  }

  /** Horse hoof clip-clop */
  public playGallop(isRight: boolean = false) {
    this.initCtx();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    const baseFreq = isRight ? 135 : 115;
    osc.frequency.setValueAtTime(baseFreq * 2.2, now);
    osc.frequency.exponentialRampToValueAtTime(baseFreq, now + 0.06);

    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.07);

    // Pan hoof left/right slightly for stereo feel
    const panner = this.ctx.createStereoPanner ? this.ctx.createStereoPanner() : null;
    if (panner) {
      panner.pan.setValueAtTime(isRight ? 0.3 : -0.3, now);
      osc.connect(gain);
      gain.connect(panner);
      panner.connect(this.sfxGain);
    } else {
      osc.connect(gain);
      gain.connect(this.sfxGain);
    }

    osc.start(now);
    osc.stop(now + 0.08);
  }

  /** Rearing horse whinny / neigh (procedural FM synthesis) */
  public playHorseWhinny() {
    this.initCtx();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;

    const carrier = this.ctx.createOscillator();
    const modulator = this.ctx.createOscillator();
    const modGain = this.ctx.createGain();
    const carrierGain = this.ctx.createGain();

    carrier.type = 'sawtooth';
    modulator.type = 'sine';

    // Whinny pitch contour: rise, high vibrato shake, then drop
    carrier.frequency.setValueAtTime(550, now);
    carrier.frequency.exponentialRampToValueAtTime(1100, now + 0.2);
    carrier.frequency.exponentialRampToValueAtTime(950, now + 0.5);
    carrier.frequency.exponentialRampToValueAtTime(450, now + 0.85);

    // Modulator vibrato rate & depth
    modulator.frequency.setValueAtTime(14, now);
    modGain.gain.setValueAtTime(120, now);
    modGain.gain.linearRampToValueAtTime(320, now + 0.25);
    modGain.gain.linearRampToValueAtTime(60, now + 0.85);

    modulator.connect(carrier.frequency);

    carrierGain.gain.setValueAtTime(0.01, now);
    carrierGain.gain.linearRampToValueAtTime(0.4, now + 0.15);
    carrierGain.gain.linearRampToValueAtTime(0.35, now + 0.6);
    carrierGain.gain.exponentialRampToValueAtTime(0.001, now + 0.85);

    carrier.connect(carrierGain);
    carrierGain.connect(this.sfxGain);

    modulator.start(now);
    carrier.start(now);
    modulator.stop(now + 0.86);
    carrier.stop(now + 0.86);
  }

  /** Enemy line fracture / hit snap */
  public playHit(heavy: boolean = false) {
    this.initCtx();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(heavy ? 220 : 380, now);
    osc.frequency.exponentialRampToValueAtTime(60, now + (heavy ? 0.12 : 0.08));

    gain.gain.setValueAtTime(heavy ? 0.6 : 0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + (heavy ? 0.14 : 0.09));

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.15);
  }

  /** Player dash whoosh */
  public playDash() {
    this.initCtx();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.exponentialRampToValueAtTime(90, now + 0.16);

    gain.gain.setValueAtTime(0.5, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.16);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.17);
  }

  /** Bounty coin collection chime */
  public playBountyPickup(tier: number = 0) {
    this.initCtx();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;

    const notes = [587.33, 659.25, 783.99, 880.00, 1046.50]; // D5, E5, G5, A5, C6 (Western Pentatonic)
    const baseFreq = notes[tier % notes.length];

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(baseFreq, now);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.5, now + 0.08);

    gain.gain.setValueAtTime(0.28, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.19);
  }

  /** Dynamite blast */
  public playExplosion() {
    this.initCtx();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;

    // Heavy bass rumble
    const rumble = this.ctx.createOscillator();
    const rumbleGain = this.ctx.createGain();
    rumble.type = 'triangle';
    rumble.frequency.setValueAtTime(90, now);
    rumble.frequency.exponentialRampToValueAtTime(25, now + 0.45);
    rumbleGain.gain.setValueAtTime(1.0, now);
    rumbleGain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);

    // Distorted noise blast
    const bufferSize = this.ctx.sampleRate * 0.5;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 2);
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1500, now);
    filter.frequency.exponentialRampToValueAtTime(80, now + 0.45);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.8, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.45);

    rumble.connect(rumbleGain);
    rumbleGain.connect(this.sfxGain);
    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.sfxGain);

    rumble.start(now);
    rumble.stop(now + 0.51);
    noise.start(now);
    noise.stop(now + 0.51);
  }

  /** Upgrade acquired fanfare (Western brassy triumph) */
  public playUpgradeFanfare() {
    this.initCtx();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;

    const chord = [293.66, 369.99, 440.00, 587.33]; // D, F#, A, D
    chord.forEach((freq, idx) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, now + idx * 0.08);

      gain.gain.setValueAtTime(0, now + idx * 0.08);
      gain.gain.linearRampToValueAtTime(0.18, now + idx * 0.08 + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 1600;

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.sfxGain!);

      osc.start(now + idx * 0.08);
      osc.stop(now + 0.62);
    });
  }

  // --- Dynamic Procedural Spaghetti-Western Synth Music Engine ---

  public startMusic() {
    if (this.isMusicPlaying) return;
    this.initCtx();
    this.isMusicPlaying = true;
    this.musicStep = 0;
    this.scheduleNextBeat();
  }

  public stopMusic() {
    this.isMusicPlaying = false;
    if (this.musicTimer !== null) {
      clearTimeout(this.musicTimer);
      this.musicTimer = null;
    }
  }

  public toggleMusic() {
    if (this.isMusicPlaying) {
      this.stopMusic();
      return false;
    } else {
      this.startMusic();
      return true;
    }
  }

  public isMusicActive() {
    return this.isMusicPlaying;
  }

  private scheduleNextBeat() {
    if (!this.isMusicPlaying) return;
    const stepDurationMs = (60 / this.tempo / 4) * 1000; // 16th note in ms

    this.playMusicStep(this.musicStep);
    this.musicStep = (this.musicStep + 1) % 64; // 4-bar loop

    this.musicTimer = window.setTimeout(() => {
      this.scheduleNextBeat();
    }, stepDurationMs);
  }

  private playMusicStep(step: number) {
    if (!this.ctx || !this.musicGain || this.isMuted) return;
    const now = this.ctx.currentTime;

    // 1. Driving Western Bass (D minor: D2, A2, F2, C2)
    // Plays on eighth note beats: 0, 2, 4, 6, 8...
    if (step % 2 === 0) {
      const bar = Math.floor(step / 16);
      const bassRoots = [73.42, 73.42, 65.41, 55.00]; // D2, D2, C2, A1
      const root = bassRoots[bar];
      const freq = (step % 4 === 0) ? root : root * 1.5; // root-fifth pulse

      const bass = this.ctx.createOscillator();
      const bGain = this.ctx.createGain();
      bass.type = 'triangle';
      bass.frequency.setValueAtTime(freq, now);

      bGain.gain.setValueAtTime(0.32, now);
      bGain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);

      bass.connect(bGain);
      bGain.connect(this.musicGain);

      bass.start(now);
      bass.stop(now + 0.13);
    }

    // 2. Acoustic-style click/percussion (rhythmic shaker / spur tick)
    if (step % 2 === 1 || step % 4 === 2) {
      const bufSize = Math.floor(this.ctx.sampleRate * 0.03);
      const buffer = this.ctx.createBuffer(1, bufSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufSize; i++) {
        data[i] = (Math.random() * 2 - 1) * (1 - i / bufSize);
      }
      const tick = this.ctx.createBufferSource();
      tick.buffer = buffer;
      const tGain = this.ctx.createGain();
      tGain.gain.setValueAtTime((step % 4 === 2) ? 0.12 : 0.05, now);
      tGain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);

      const f = this.ctx.createBiquadFilter();
      f.type = 'highpass';
      f.frequency.value = 4500;

      tick.connect(f);
      f.connect(tGain);
      tGain.connect(this.musicGain);

      tick.start(now);
      tick.stop(now + 0.035);
    }

    // 3. Signature Western Whistle Lead (Morricone style)
    // Sparse, melancholic, expressive whistle with vibrato
    const melody: { [key: number]: { note: number; dur: number } } = {
      0: { note: 587.33, dur: 0.28 },  // D5
      4: { note: 783.99, dur: 0.38 },  // G5
      8: { note: 880.00, dur: 0.50 },  // A5
      16: { note: 987.77, dur: 0.35 }, // B5
      20: { note: 880.00, dur: 0.40 }, // A5
      24: { note: 698.46, dur: 0.55 }, // F5
      32: { note: 587.33, dur: 0.30 }, // D5
      36: { note: 659.25, dur: 0.30 }, // E5
      40: { note: 698.46, dur: 0.45 }, // F5
      44: { note: 880.00, dur: 0.35 }, // A5
      48: { note: 587.33, dur: 0.85 }, // D5 (held resolution)
    };

    if (melody[step]) {
      const item = melody[step];
      const whistle = this.ctx.createOscillator();
      const wGain = this.ctx.createGain();
      whistle.type = 'sine';

      // Gentle vibrato LFO
      const lfo = this.ctx.createOscillator();
      const lfoGain = this.ctx.createGain();
      lfo.frequency.setValueAtTime(5.5, now);
      lfoGain.gain.setValueAtTime(8, now); // 8Hz modulation depth
      lfo.connect(whistle.frequency);

      // Portamento slide
      whistle.frequency.setValueAtTime(item.note * 0.98, now);
      whistle.frequency.exponentialRampToValueAtTime(item.note, now + 0.05);

      wGain.gain.setValueAtTime(0.001, now);
      wGain.gain.linearRampToValueAtTime(0.24, now + 0.04);
      wGain.gain.setValueAtTime(0.22, now + item.dur * 0.7);
      wGain.gain.exponentialRampToValueAtTime(0.001, now + item.dur);

      whistle.connect(wGain);
      wGain.connect(this.musicGain);

      lfo.start(now);
      whistle.start(now);
      lfo.stop(now + item.dur + 0.05);
      whistle.stop(now + item.dur + 0.05);
    }
  }
}

export const sound = new SynthEngine();
