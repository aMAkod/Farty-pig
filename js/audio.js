/**
 * ============================================================================
 * FARTY PIG - PROCEDURAL WEB AUDIO SYNTHESIZER (audio.js)
 * ============================================================================
 * No MP3s. No WAV files. 100% pure mathematical sound synthesis!
 * Built using the HTML5 Web Audio API:
 * - Randomized Fart Engine: Sawtooth oscillators + noise buffer + resonant filters
 * - Poop Collect: Resonant bubbly plop with rising harmonic chirp
 * - Hay Gap Ding: Pure crystalline bell chime
 * - Crash: Heavy punch thud combined with a comedic pig squeal
 * - Game Over: Descending cartoon slapstick jingle
 * - Cheerful Farm BGM: Real-time procedural musical arpeggiator
 */

class SoundManager {
  constructor() {
    this.ctx = null;
    this.isMuted = false;
    this.bgmEnabled = true;

    // Volume Buses
    this.masterGain = null;
    this.sfxGain = null;
    this.bgmGain = null;

    // BGM Scheduler state
    this.bgmInterval = null;
    this.bgmStep = 0;
    this.noiseBuffer = null;

    // Load saved settings from localStorage
    try {
      const savedMute = localStorage.getItem(CONFIG.STORAGE_KEYS.MUTED);
      if (savedMute !== null) this.isMuted = (savedMute === 'true');

      const savedBgm = localStorage.getItem(CONFIG.STORAGE_KEYS.BGM_ENABLED);
      if (savedBgm !== null) this.bgmEnabled = (savedBgm === 'true');
    } catch (e) {
      console.warn('LocalStorage unavailable for audio settings:', e);
    }
  }

  /**
   * Initializes or resumes the AudioContext on first user interaction.
   * Modern browsers block audio until the user clicks, taps, or hits a key.
   */
  resumeContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;

      this.ctx = new AudioCtx();

      // Master Gain Node
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : CONFIG.AUDIO.MASTER_VOLUME, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      // SFX Bus
      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.setValueAtTime(CONFIG.AUDIO.SFX_VOLUME, this.ctx.currentTime);
      this.sfxGain.connect(this.masterGain);

      // BGM Bus
      this.bgmGain = this.ctx.createGain();
      this.bgmGain.gain.setValueAtTime(this.bgmEnabled ? CONFIG.AUDIO.BGM_VOLUME : 0, this.ctx.currentTime);
      this.bgmGain.connect(this.masterGain);

      // Pre-generate 1 second of white noise for realistic gas puffs and impacts
      this.createNoiseBuffer();

      // Start BGM loop if enabled
      if (this.bgmEnabled) {
        this.startBGM();
      }
    }

    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  /**
   * Prepares a buffer of pure white noise for fart & crash synthesis.
   */
  createNoiseBuffer() {
    if (!this.ctx) return;
    const bufferSize = this.ctx.sampleRate * 1.5;
    this.noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = this.noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
  }

  /**
   * 1. Procedural Fart Synthesizer
   * Combines a low-frequency buzzing oscillator (Layer 1) with filtered wind noise (Layer 2).
   * Randomizes pitch, duration, and flutter so NO TWO FARTS SOUND THE SAME!
   */
  playFart() {
    if (!this.ctx || this.isMuted) return;
    this.resumeContext();

    const now = this.ctx.currentTime;
    
    // Randomize duration between 140ms and 260ms
    const duration = 0.14 + Math.random() * 0.12;

    // --- LAYER 1: Low-Frequency Buzz (Sawtooth / Triangle) ---
    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();
    
    // Choose tone wave
    osc.type = Math.random() > 0.4 ? 'sawtooth' : 'triangle';

    // Base pitch randomized between 55Hz (deep braap) and 115Hz (squeaky toot)
    const baseFreq = 55 + Math.random() * 60;
    osc.frequency.setValueAtTime(baseFreq, now);

    // Dynamic pitch wobble (comedic flutter)
    const wobbleSpeed = 25 + Math.random() * 20;
    const wobbleDepth = 15 + Math.random() * 20;
    osc.frequency.linearRampToValueAtTime(baseFreq + wobbleDepth, now + duration * 0.3);
    osc.frequency.exponentialRampToValueAtTime(Math.max(30, baseFreq - 20), now + duration);

    // Filter to warm the buzz
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(320 + Math.random() * 200, now);

    // Layer 1 Envelope
    oscGain.gain.setValueAtTime(0.001, now);
    oscGain.gain.linearRampToValueAtTime(0.7, now + 0.015);
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.connect(filter);
    filter.connect(oscGain);
    oscGain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + duration);

    // --- LAYER 2: Gas Wind Noise ---
    if (this.noiseBuffer) {
      const noise = this.ctx.createBufferSource();
      noise.buffer = this.noiseBuffer;

      const noiseFilter = this.ctx.createBiquadFilter();
      noiseFilter.type = 'bandpass';
      noiseFilter.frequency.setValueAtTime(260 + Math.random() * 180, now);
      noiseFilter.Q.setValueAtTime(2.5, now);

      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(0.001, now);
      noiseGain.gain.linearRampToValueAtTime(0.35, now + 0.02);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + duration * 0.9);

      noise.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(this.sfxGain);

      noise.start(now);
      noise.stop(now + duration);
    }
  }

  /**
   * 2. Poop Collection Sound: Cute "Plop" + Rising Happy Chirp!
   */
  playPoopCollect() {
    if (!this.ctx || this.isMuted) return;
    this.resumeContext();

    const now = this.ctx.currentTime;

    // Resonant Sine Chirp
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    // Rapid pitch sweep: 420Hz -> 840Hz -> 1100Hz
    osc.frequency.setValueAtTime(380, now);
    osc.frequency.exponentialRampToValueAtTime(920, now + 0.09);
    osc.frequency.exponentialRampToValueAtTime(1200, now + 0.18);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.5, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.22);
  }

  /**
   * 3. Hay Gap Passed: Crisp satisfying chime / ding!
   */
  playScoreDing() {
    if (!this.ctx || this.isMuted) return;
    this.resumeContext();

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(1174.66, now); // D6 note

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.35, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.28);
  }

  /**
   * 4. Crash Sound: Punchy bass thud + comedic descending pig squeal!
   */
  playCrash() {
    if (!this.ctx || this.isMuted) return;
    this.resumeContext();

    const now = this.ctx.currentTime;

    // Part A: Impact Thud
    const thud = this.ctx.createOscillator();
    const thudGain = this.ctx.createGain();
    thud.type = 'sine';
    thud.frequency.setValueAtTime(120, now);
    thud.frequency.exponentialRampToValueAtTime(35, now + 0.18);

    thudGain.gain.setValueAtTime(0.8, now);
    thudGain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

    thud.connect(thudGain);
    thudGain.connect(this.sfxGain);
    thud.start(now);
    thud.stop(now + 0.22);

    // Part B: Comedic Pig Squeal / Oink Slide
    const squeal = this.ctx.createOscillator();
    const squealGain = this.ctx.createGain();
    squeal.type = 'sawtooth';

    // Slide down from high squeal: 850Hz down to 240Hz
    squeal.frequency.setValueAtTime(780, now + 0.02);
    squeal.frequency.linearRampToValueAtTime(450, now + 0.18);
    squeal.frequency.exponentialRampToValueAtTime(180, now + 0.42);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(650, now);

    squealGain.gain.setValueAtTime(0.001, now);
    squealGain.gain.linearRampToValueAtTime(0.45, now + 0.04);
    squealGain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

    squeal.connect(filter);
    filter.connect(squealGain);
    squealGain.connect(this.sfxGain);

    squeal.start(now + 0.02);
    squeal.stop(now + 0.45);
  }

  /**
   * 5. Game Over Jingle: Comedic four-step descending stabs!
   */
  playGameOver() {
    if (!this.ctx || this.isMuted) return;
    this.resumeContext();

    const notes = [392.00, 369.99, 329.63, 261.63]; // G4 -> F#4 -> E4 -> C4
    const noteDuration = 0.16;

    notes.forEach((freq, idx) => {
      const startTime = this.ctx.currentTime + 0.2 + idx * noteDuration;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.001, startTime);
      gain.gain.linearRampToValueAtTime(0.3, startTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + noteDuration * 0.95);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(startTime);
      osc.stop(startTime + noteDuration);
    });
  }

  /**
   * 6. Button Click Sound
   */
  playClick() {
    if (!this.ctx || this.isMuted) return;
    this.resumeContext();

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, now);
    osc.frequency.exponentialRampToValueAtTime(250, now + 0.06);

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.06);
  }

  /**
   * 7. Cheerful Procedural Farm Country BGM Loop
   * Creates a lighthearted acoustic arpeggio sequence using pure sine & triangle waves!
   */
  startBGM() {
    if (this.bgmInterval) return;

    // A cheerful pentatonic melody pattern: C major / A minor country vibe
    const melody = [
      261.63, 329.63, 392.00, 523.25, // C4, E4, G4, C5
      293.66, 369.99, 440.00, 587.33, // D4, F#4, A4, D5
      261.63, 392.00, 329.63, 392.00, // C4, G4, E4, G4
      196.00, 246.94, 293.66, 392.00  // G3, B3, D4, G4
    ];

    const stepTimeMs = 210; // tempo ~ 142 BPM

    this.bgmInterval = setInterval(() => {
      if (!this.ctx || this.isMuted || !this.bgmEnabled) return;
      if (this.ctx.state !== 'running') return;

      const freq = melody[this.bgmStep % melody.length];
      this.bgmStep++;

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.12, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.19);

      osc.connect(gain);
      gain.connect(this.bgmGain);

      osc.start(now);
      osc.stop(now + 0.19);
    }, stepTimeMs);
  }

  stopBGM() {
    if (this.bgmInterval) {
      clearInterval(this.bgmInterval);
      this.bgmInterval = null;
    }
  }

  /**
   * Toggles Sound Mute (Master switch)
   */
  toggleMute() {
    this.resumeContext();
    this.isMuted = !this.isMuted;

    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(
        this.isMuted ? 0 : CONFIG.AUDIO.MASTER_VOLUME,
        this.ctx.currentTime
      );
    }

    try {
      localStorage.setItem(CONFIG.STORAGE_KEYS.MUTED, this.isMuted);
    } catch (e) {}

    return this.isMuted;
  }

  /**
   * Toggles Background Music on/off
   */
  toggleBGM() {
    this.resumeContext();
    this.bgmEnabled = !this.bgmEnabled;

    if (this.bgmGain && this.ctx) {
      this.bgmGain.gain.setValueAtTime(
        this.bgmEnabled ? CONFIG.AUDIO.BGM_VOLUME : 0,
        this.ctx.currentTime
      );
    }

    if (this.bgmEnabled) {
      this.startBGM();
    }

    try {
      localStorage.setItem(CONFIG.STORAGE_KEYS.BGM_ENABLED, this.bgmEnabled);
    } catch (e) {}

    return this.bgmEnabled;
  }
}

// Global instance
window.soundManager = new SoundManager();
