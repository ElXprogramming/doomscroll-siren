// Web Audio API Synthesizer Siren (Zero External Audio Assets)

class SirenAudioManager {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private isSirenActive = false;
  private sirenNodes: {
    osc1: OscillatorNode;
    osc2: OscillatorNode;
    lfo: OscillatorNode;
    lfoGain: GainNode;
    sirenGain: GainNode;
  } | null = null;
  private currentVolume = 0.8;

  public async unlockAudio(): Promise<boolean> {
    try {
      if (!this.ctx) {
        const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        this.ctx = new AudioContextClass();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(this.currentVolume, this.ctx.currentTime);
        this.masterGain.connect(this.ctx.destination);
      }

      if (this.ctx.state === 'suspended') {
        await this.ctx.resume();
      }

      // Play a tiny silent/subtle confirmation tick to fully warm up the audio hardware
      if (this.masterGain) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.001, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.00001, this.ctx.currentTime + 0.05);
        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.05);
      }

      return true;
    } catch (err) {
      console.error('Failed to unlock AudioContext:', err);
      return false;
    }
  }

  public setVolume(vol: number): void {
    const clamped = Math.max(0, Math.min(1, vol));
    this.currentVolume = clamped;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(clamped, this.ctx.currentTime, 0.02);
    }
  }

  public getVolume(): number {
    return this.currentVolume;
  }

  /**
   * Short 880Hz square-wave chirp when the timer crosses 5s, 6s, 7s, 8s, and 9s
   */
  public playWarningBeep(): void {
    if (!this.ctx || !this.masterGain) return;
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(880, now); // 880 Hz High-alert A5 chirp

      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.09);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now);
      osc.stop(now + 0.1);
    } catch (err) {
      console.warn('Warning beep failed:', err);
    }
  }

  /**
   * Loud dual-oscillator sweeping emergency siren (modulating 600Hz - 1300Hz)
   */
  public startSiren(): void {
    if (this.isSirenActive) return;
    if (!this.ctx || !this.masterGain) {
      this.unlockAudio().then(() => this.startSiren());
      return;
    }

    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }

    try {
      const now = this.ctx.currentTime;

      // Master siren gain for envelope control
      const sirenGain = this.ctx.createGain();
      sirenGain.gain.setValueAtTime(0.001, now);
      sirenGain.gain.exponentialRampToValueAtTime(0.7, now + 0.1);

      // Dual oscillators: Sawtooth + Square with slight detune
      const osc1 = this.ctx.createOscillator();
      osc1.type = 'sawtooth';
      osc1.frequency.setValueAtTime(950, now);

      const osc2 = this.ctx.createOscillator();
      osc2.type = 'square';
      osc2.frequency.setValueAtTime(955, now); // 5Hz detuned for fat tactical grit

      // LFO for emergency sweeping wail (modulates between 600Hz and 1300Hz -> Center 950Hz +/- 350Hz)
      const lfo = this.ctx.createOscillator();
      lfo.type = 'triangle';
      lfo.frequency.setValueAtTime(1.5, now); // 1.5 sweeps per second

      const lfoGain = this.ctx.createGain();
      lfoGain.gain.setValueAtTime(350, now); // Amplitude: +/- 350Hz

      // Connect LFO to oscillator frequencies
      lfo.connect(lfoGain);
      lfoGain.connect(osc1.frequency);
      lfoGain.connect(osc2.frequency);

      // Connect oscillators to siren gain
      osc1.connect(sirenGain);
      osc2.connect(sirenGain);

      // Connect siren gain to master gain
      sirenGain.connect(this.masterGain);

      // Start oscillators
      osc1.start(now);
      osc2.start(now);
      lfo.start(now);

      this.sirenNodes = { osc1, osc2, lfo, lfoGain, sirenGain };
      this.isSirenActive = true;
    } catch (err) {
      console.error('Failed to start siren:', err);
    }
  }

  public stopSiren(): void {
    if (!this.isSirenActive || !this.sirenNodes || !this.ctx) {
      this.isSirenActive = false;
      return;
    }

    try {
      const now = this.ctx.currentTime;
      const { osc1, osc2, lfo, sirenGain } = this.sirenNodes;

      // Quick fade out to prevent speaker clicks
      sirenGain.gain.cancelScheduledValues(now);
      sirenGain.gain.setValueAtTime(sirenGain.gain.value, now);
      sirenGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.08);

      setTimeout(() => {
        try {
          osc1.stop();
          osc2.stop();
          lfo.stop();
          osc1.disconnect();
          osc2.disconnect();
          lfo.disconnect();
          sirenGain.disconnect();
        } catch {
          // ignore cleanup errors
        }
      }, 90);
    } catch (err) {
      console.warn('Error stopping siren:', err);
    } finally {
      this.sirenNodes = null;
      this.isSirenActive = false;
    }
  }

  public isPlaying(): boolean {
    return this.isSirenActive;
  }
}

export const sirenAudio = new SirenAudioManager();
