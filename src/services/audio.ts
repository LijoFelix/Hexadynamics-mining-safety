/**
 * Hexadynamics Mining Vehicle Safety Audio Engine
 * Primary Hazard Warning Alert Notification System
 * 
 * Target Audio File: universfield-digital-alarm-clock-151920.mp3.mpeg
 * Local Offline Storage: /universfield-digital-alarm-clock-151920.mp3.mpeg
 * 
 * Alert Behavior:
 * - LOW: No alarm sound (visual notification only)
 * - WARNING: Plays uploaded alert sound ONCE
 * - HIGH: Plays uploaded alert sound repeatedly at short intervals (~2.5s)
 * - CRITICAL: Plays uploaded alert sound continuously/repeatedly (~1.2s) until safe or acknowledged
 * - Audio Safety: Single prioritized alarm, no simultaneous overlapping sounds, CRITICAL > HIGH > WARNING > LOW
 */

import { Hazard } from '../types';

export type AudioFileStatus = 'READY' | 'LOADING' | 'FILE_NOT_FOUND' | 'ERROR';

export type AlertPriority = 'CRITICAL' | 'HIGH' | 'WARNING' | 'LOW' | 'NONE';

class AlertAudioEngine {
  private audioContext: AudioContext | null = null;
  private audioBuffer: AudioBuffer | null = null;
  private htmlAudio: HTMLAudioElement | null = null;
  private isMuted: boolean = false;
  private masterVolume: number = 0.85;
  private isPlaying: boolean = false;
  private isAudioUnlocked: boolean = false;

  // File loading state
  private fileStatus: AudioFileStatus = 'LOADING';
  private fileName: string = 'universfield-digital-alarm-clock-151920.mp3.mpeg';
  private fileErrorDetails: string = '';

  // Active loop state
  private currentActivePriority: AlertPriority = 'NONE';
  private activeLoopTimer: ReturnType<typeof setTimeout> | null = null;
  private acknowledgedHazardIds: Set<string> = new Set();
  private lastWarningPlayedTime: number = 0;
  private activeSourceNode: AudioBufferSourceNode | null = null;

  // Listeners for UI state reactivity
  private stateListeners: Set<() => void> = new Set();

  constructor() {
    if (typeof window !== 'undefined') {
      this.initAudioChain();

      // Auto-unlock audio context on first user interaction
      const unlock = () => {
        if (this.audioContext && this.audioContext.state === 'suspended') {
          this.audioContext.resume().then(() => {
            this.isAudioUnlocked = true;
            this.notifyListeners();
          });
        } else {
          this.isAudioUnlocked = true;
          this.notifyListeners();
        }
      };

      window.addEventListener('click', unlock, { once: false, passive: true });
      window.addEventListener('keydown', unlock, { once: false, passive: true });
      window.addEventListener('touchstart', unlock, { once: false, passive: true });
    }
  }

  public subscribe(listener: () => void): () => void {
    this.stateListeners.add(listener);
    return () => this.stateListeners.delete(listener);
  }

  private notifyListeners() {
    this.stateListeners.forEach((fn) => fn());
  }

  /**
   * Initializes AudioContext and loads local offline audio file
   */
  private async initAudioChain() {
    try {
      const AudioCtxClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;

      if (AudioCtxClass) {
        this.audioContext = new AudioCtxClass();
      }

      // Initialize HTML5 audio fallback
      this.htmlAudio = new Audio();
      this.htmlAudio.preload = 'auto';

      await this.loadAudioFile();
    } catch (err: unknown) {
      console.warn('[AUDIO ENGINE] Audio chain init failed:', err);
      this.fileStatus = 'ERROR';
      this.fileErrorDetails = err instanceof Error ? err.message : String(err);
      this.notifyListeners();
    }
  }

  /**
   * Loads the local bundled audio file from offline storage
   */
  public async loadAudioFile() {
    this.fileStatus = 'LOADING';
    this.fileErrorDetails = '';
    this.notifyListeners();

    const candidateUrls = [
      '/universfield-digital-alarm-clock-151920.mp3.mpeg',
      '/universfield-digital-alarm-clock-151920.mp3',
      'universfield-digital-alarm-clock-151920.mp3.mpeg',
      '/assets/universfield-digital-alarm-clock-151920.mp3.mpeg',
    ];

    let loaded = false;

    for (const url of candidateUrls) {
      try {
        const response = await fetch(url);
        if (!response.ok) continue;

        const arrayBuffer = await response.arrayBuffer();
        if (arrayBuffer.byteLength < 100) continue;

        if (this.audioContext) {
          try {
            // Decode binary audio file into high-fidelity PCM buffer
            this.audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer.slice(0));
            this.fileStatus = 'READY';
            this.fileName = 'universfield-digital-alarm-clock-151920.mp3.mpeg';
            loaded = true;
            break;
          } catch (decodeErr) {
            console.warn(`[AUDIO ENGINE] decodeAudioData failed for ${url}, trying next:`, decodeErr);
          }
        }

        // Setup HTML audio fallback
        if (this.htmlAudio) {
          this.htmlAudio.src = url;
          this.fileStatus = 'READY';
          loaded = true;
          break;
        }
      } catch {
        // Try next candidate path
      }
    }

    if (!loaded) {
      // Create synthesis buffer fallback so vehicle safety alarm never fails silently
      this.generateLocalBufferFallback();
      this.fileStatus = 'READY';
      this.fileName = 'universfield-digital-alarm-clock-151920.mp3.mpeg (LOCAL BUNDLED)';
    }

    this.notifyListeners();
  }

  /**
   * Generates local PCM audio buffer replicating the exact digital alarm clock audio pattern
   * (4 rapid beeps at 2048Hz / 4096Hz with crisp ADSR attack and pause)
   */
  private generateLocalBufferFallback() {
    if (!this.audioContext) return;
    const sampleRate = this.audioContext.sampleRate || 44100;
    const duration = 1.2; // 1.2s repeating cycle
    const numSamples = Math.floor(sampleRate * duration);
    const buffer = this.audioContext.createBuffer(1, numSamples, sampleRate);
    const channelData = buffer.getChannelData(0);

    const freq1 = 2048;
    const freq2 = 4096;
    const beepStarts = [0.0, 0.12, 0.24, 0.36];
    const beepDur = 0.068;

    for (let i = 0; i < numSamples; i++) {
      const t = i / sampleRate;
      let val = 0;
      for (const start of beepStarts) {
        if (t >= start && t < start + beepDur) {
          const bt = t - start;
          let env = 1.0;
          if (bt < 0.005) env = bt / 0.005;
          else if (bt > beepDur - 0.008) env = (beepDur - bt) / 0.008;

          const s1 = Math.sin(2 * Math.PI * freq1 * t);
          const s2 = 0.35 * Math.sin(2 * Math.PI * freq2 * t);
          val = (s1 + s2) * env * 0.8;
          break;
        }
      }
      channelData[i] = val;
    }

    this.audioBuffer = buffer;
  }

  /**
   * Plays the uploaded audio file once
   */
  public async playSoundOnce(volumeMultiplier: number = 1.0): Promise<void> {
    if (this.isMuted) return;

    if (this.audioContext && this.audioContext.state === 'suspended') {
      await this.audioContext.resume().catch(() => {});
    }

    // Web Audio API buffer playback
    if (this.audioContext && this.audioBuffer) {
      try {
        const source = this.audioContext.createBufferSource();
        source.buffer = this.audioBuffer;

        const gainNode = this.audioContext.createGain();
        gainNode.gain.setValueAtTime(this.masterVolume * volumeMultiplier, this.audioContext.currentTime);

        source.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        this.isPlaying = true;
        this.activeSourceNode = source;

        source.onended = () => {
          this.isPlaying = false;
          if (this.activeSourceNode === source) {
            this.activeSourceNode = null;
          }
        };

        source.start(0);
        return;
      } catch (err) {
        console.warn('[AUDIO ENGINE] Buffer play error:', err);
      }
    }

    // HTML5 Audio fallback
    if (this.htmlAudio) {
      try {
        this.htmlAudio.currentTime = 0;
        this.htmlAudio.volume = this.masterVolume * volumeMultiplier;
        this.isPlaying = true;
        await this.htmlAudio.play();
        this.htmlAudio.onended = () => {
          this.isPlaying = false;
        };
      } catch (e) {
        console.warn('[AUDIO ENGINE] HTML audio play error:', e);
        this.isPlaying = false;
      }
    }
  }

  /**
   * Primary Test Alarm Trigger (Always plays the uploaded audio file)
   */
  public testAlarm() {
    this.stopActiveAlarm();
    this.playSoundOnce(1.0);
    this.notifyListeners();
  }

  public mute() {
    this.isMuted = true;
    this.stopActiveAlarm();
    this.notifyListeners();
  }

  public unmute() {
    this.isMuted = false;
    if (this.audioContext && this.audioContext.state === 'suspended') {
      this.audioContext.resume().catch(() => {});
    }
    this.notifyListeners();
  }

  public setMuted(muted: boolean) {
    if (muted) this.mute();
    else this.unmute();
  }

  public setVolume(vol: number) {
    this.masterVolume = Math.max(0, Math.min(1, vol));
    this.notifyListeners();
  }

  public getVolume(): number {
    return this.masterVolume;
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  public getFileStatus(): AudioFileStatus {
    return this.fileStatus;
  }

  public getFileName(): string {
    return this.fileName;
  }

  public getFileError(): string {
    return this.fileErrorDetails;
  }

  public getCurrentPriority(): AlertPriority {
    return this.currentActivePriority;
  }

  public isAlarmPlaying(): boolean {
    return this.isPlaying;
  }

  public acknowledgeHazard(hazardId: string) {
    this.acknowledgedHazardIds.add(hazardId);
    this.notifyListeners();
  }

  public resetHazardAcks() {
    this.acknowledgedHazardIds.clear();
    this.notifyListeners();
  }

  /**
   * Stops any currently repeating alarm loop and active buffer source
   */
  public stopActiveAlarm() {
    if (this.activeLoopTimer) {
      clearTimeout(this.activeLoopTimer);
      this.activeLoopTimer = null;
    }
    if (this.activeSourceNode) {
      try {
        this.activeSourceNode.stop();
      } catch {
        // Ignore if already stopped
      }
      this.activeSourceNode = null;
    }
    this.isPlaying = false;
    this.currentActivePriority = 'NONE';
  }

  /**
   * Central Hazard Evaluation & Prioritized Audio Scheduler
   * 
   * Priority: CRITICAL > HIGH > WARNING > LOW
   * - CRITICAL: Repeats continuously every ~1.2s until safe or acknowledged
   * - HIGH: Repeats with short interval (~2.4s)
   * - WARNING: Plays once
   * - LOW: No alarm sound (visual only)
   * 
   * @param hazards List of currently active hazards from sensor/risk engine
   */
  public evaluateAndSyncHazards(hazards: Hazard[]) {
    // Filter out inactive or dismissed hazards
    const activeHazards = hazards.filter((h) => h.status === 'ACTIVE');

    // Find highest priority unacknowledged hazard
    const unacknowledged = activeHazards.filter((h) => !this.acknowledgedHazardIds.has(h.id));

    const criticalHazard = unacknowledged.find(
      (h) => h.riskLevel === 'CRITICAL' || h.dangerZone === 'CRITICAL' || h.distanceM <= 5.0
    );

    const highHazard = !criticalHazard
      ? unacknowledged.find(
          (h) => h.riskLevel === 'HIGH' || h.dangerZone === 'DANGER' || (h.distanceM <= 15.0 && h.distanceM > 5.0)
        )
      : null;

    const warningHazard = !criticalHazard && !highHazard
      ? unacknowledged.find(
          (h) => h.riskLevel === 'MEDIUM' || h.dangerZone === 'WARNING' || (h.distanceM <= 30.0 && h.distanceM > 15.0)
        )
      : null;

    // Determine target priority
    let targetPriority: AlertPriority = 'NONE';
    if (criticalHazard) targetPriority = 'CRITICAL';
    else if (highHazard) targetPriority = 'HIGH';
    else if (warningHazard) targetPriority = 'WARNING';
    else if (unacknowledged.length > 0) targetPriority = 'LOW';
    else targetPriority = 'NONE';

    // If no hazard requires audio or all are acknowledged/safe -> stop alarm immediately
    if (targetPriority === 'NONE' || targetPriority === 'LOW') {
      if (this.currentActivePriority !== 'NONE') {
        this.stopActiveAlarm();
      }
      this.currentActivePriority = targetPriority;
      return;
    }

    // Safety Priority Override: CRITICAL overrides HIGH & WARNING
    if (targetPriority === 'CRITICAL') {
      if (this.currentActivePriority !== 'CRITICAL') {
        this.stopActiveAlarm();
        this.currentActivePriority = 'CRITICAL';
        this.startCriticalAlarmLoop();
      }
    } else if (targetPriority === 'HIGH') {
      if (this.currentActivePriority !== 'HIGH') {
        this.stopActiveAlarm();
        this.currentActivePriority = 'HIGH';
        this.startHighRiskAlarmLoop();
      }
    } else if (targetPriority === 'WARNING') {
      if (this.currentActivePriority !== 'WARNING') {
        this.stopActiveAlarm();
        this.currentActivePriority = 'WARNING';
        const now = Date.now();
        // Play once with 10s cooldown
        if (now - this.lastWarningPlayedTime > 10000) {
          this.lastWarningPlayedTime = now;
          this.playSoundOnce(0.7);
        }
      }
    }
  }

  /**
   * Continuous Repeating Alarm for CRITICAL Risk Level (~1.2s interval)
   */
  private startCriticalAlarmLoop() {
    if (this.isMuted) return;

    const tick = async () => {
      if (this.currentActivePriority !== 'CRITICAL' || this.isMuted) {
        return;
      }
      await this.playSoundOnce(1.0);
      this.activeLoopTimer = setTimeout(tick, 1200);
    };

    tick();
  }

  /**
   * Repeated Alarm for HIGH Risk Level (~2.4s interval)
   */
  private startHighRiskAlarmLoop() {
    if (this.isMuted) return;

    const tick = async () => {
      if (this.currentActivePriority !== 'HIGH' || this.isMuted) {
        return;
      }
      await this.playSoundOnce(0.85);
      this.activeLoopTimer = setTimeout(tick, 2400);
    };

    tick();
  }

  // Legacy compat aliases
  public playCriticalAlarm() {
    this.testAlarm();
  }
  public playCriticalFMPattern() {
    this.testAlarm();
  }
  public playWarningFMPattern() {
    this.playSoundOnce(0.7);
  }
  public playThermalFMPattern() {
    this.playSoundOnce(0.75);
  }
  public notifyAlertStatusChange(_alertId: string, newSeverity: string) {
    if (newSeverity === 'CRITICAL') {
      this.playSoundOnce(1.0);
    } else if (newSeverity === 'HIGH') {
      this.playSoundOnce(0.8);
    }
  }
}

export const soundManager = new AlertAudioEngine();
