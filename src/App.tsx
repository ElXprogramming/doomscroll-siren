import { useState, useEffect, useRef, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { Header } from './components/Header';
import { WebcamViewport } from './components/WebcamViewport';
import { DoomscrollMeter } from './components/DoomscrollMeter';
import { TelemetryCards } from './components/TelemetryCards';
import { ControlPanel } from './components/ControlPanel';
import { EmergencyAlertOverlay } from './components/EmergencyAlertOverlay';
import { visionEngine } from './utils/visionEngine';
import { sirenAudio } from './utils/sirenAudio';
import { renderHUDOverlay } from './utils/overlayRenderer';
import {
  loadTelemetry,
  recordSirenTrigger,
  updateFocusStreak,
  addDoomscrollBlocked,
  resetTelemetry,
} from './utils/telemetry';
import type { Detection, GuardSettings, GuardState, TelemetryStats } from './types';

export function App() {
  // State
  const [isArmed, setIsArmed] = useState(false);
  const [guardState, setGuardState] = useState<GuardState>('disarmed');
  const [modelLoadingMessage, setModelLoadingMessage] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Settings
  const [settings, setSettings] = useState<GuardSettings>({
    confidenceThreshold: 0.35,
    timeLimit: 0.5,
    volume: 0.8,
    simulatedPhone: false,
  });
  const [isMuted, setIsMuted] = useState(false);
  const [isTestingSiren, setIsTestingSiren] = useState(false);
  const [isMirrored, setIsMirrored] = useState(true);
  const isMirroredRef = useRef(true);
  isMirroredRef.current = isMirrored;

  // Telemetry & Stats
  const [telemetry, setTelemetry] = useState<TelemetryStats>(loadTelemetry);
  const [currentStreak, setCurrentStreak] = useState(0);

  // Realtime Detections & Viewport Metrics
  const [detections, setDetections] = useState<Detection[]>([]);
  const [fps, setFps] = useState(0);
  const [inferenceTimeMs, setInferenceTimeMs] = useState(0);
  const [phoneHoldDuration, setPhoneHoldDuration] = useState(0);
  const [isPhoneDetected, setIsPhoneDetected] = useState(false);
  const [isDecaying, setIsDecaying] = useState(false);

  // Refs
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Animation and detection loop refs
  const isLoopRunningRef = useRef(false);
  const lastInferenceTimeRef = useRef(0);
  const lastFrameTimeRef = useRef(performance.now());
  const phoneHoldDurationRef = useRef(0);
  const currentStreakRef = useRef(0);
  const isPhoneDetectedRef = useRef(false);
  const lastBeepSecondRef = useRef(0);
  const sirenTriggeredThisBreachRef = useRef(false);
  const fpsCountRef = useRef(0);
  const lastFpsCalcTimeRef = useRef(performance.now());
  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  // Sync state to refs for high-frequency RAF loop
  useEffect(() => {
    isPhoneDetectedRef.current = isPhoneDetected;
  }, [isPhoneDetected]);

  // Handle Arming the Sentinel
  const handleArmGuard = async () => {
    setCameraError(null);
    try {
      // 1. Unlock AudioContext on user interaction
      await sirenAudio.unlockAudio();
      sirenAudio.setVolume(isMuted ? 0 : settings.volume);

      // 2. Initialize ONNX Vision Model
      setModelLoadingMessage('Preparing neural network runtime...');
      await visionEngine.initSession((msg) => setModelLoadingMessage(msg));
      setModelLoadingMessage(null);

      // 3. Acquire Webcam MediaStream
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user',
        },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setIsArmed(true);
      setGuardState('clean');
      isLoopRunningRef.current = true;
      lastFrameTimeRef.current = performance.now();
      startSentinelLoop();
    } catch (err: unknown) {
      console.error('Guard initialization failed:', err);
      setModelLoadingMessage(null);
      const errMsg = err instanceof Error ? err.message : 'Failed to access camera or load neural model.';
      setCameraError(errMsg);
      setIsArmed(false);
      setGuardState('disarmed');
    }
  };

  // Handle Disarming
  const handleDisarmGuard = useCallback(() => {
    isLoopRunningRef.current = false;
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    sirenAudio.stopSiren();
    setIsArmed(false);
    setGuardState('disarmed');
    setPhoneHoldDuration(0);
    phoneHoldDurationRef.current = 0;
    setIsPhoneDetected(false);
    setIsDecaying(false);
    setDetections([]);
    lastBeepSecondRef.current = 0;
    sirenTriggeredThisBreachRef.current = false;

    // Clear overlay
    if (overlayCanvasRef.current) {
      const ctx = overlayCanvasRef.current.getContext('2d');
      if (ctx) ctx.clearRect(0, 0, overlayCanvasRef.current.width, overlayCanvasRef.current.height);
    }
  }, []);

  // Main Sentinel Loop (Vision inference ~9 FPS + Smooth 60 FPS Timer Accumulator)
  const startSentinelLoop = useCallback(() => {
    let animId: number;

    const loop = async () => {
      if (!isLoopRunningRef.current) return;

      const now = performance.now();
      const dt = Math.min((now - lastFrameTimeRef.current) / 1000, 0.25); // delta time in seconds (clamped)
      lastFrameTimeRef.current = now;

      // Calculate FPS
      fpsCountRef.current++;
      if (now - lastFpsCalcTimeRef.current >= 1000) {
        setFps(fpsCountRef.current);
        fpsCountRef.current = 0;
        lastFpsCalcTimeRef.current = now;
      }

      const currentSettings = settingsRef.current;
      const video = videoRef.current;

      // 1. Run Vision Detection loop every ~110ms (~9 FPS to prevent thermal throttling)
      if (video && video.readyState >= 2 && now - lastInferenceTimeRef.current >= 110) {
        lastInferenceTimeRef.current = now;
        try {
          const { detections: rawDets, inferenceTimeMs: infMs } = await visionEngine.detect(
            video,
            currentSettings.confidenceThreshold
          );

          let activeDets = rawDets;
          let phoneInFrame = rawDets.some((d) => d.classId === 67);

          // Support Simulation Mode
          if (currentSettings.simulatedPhone) {
            phoneInFrame = true;
            activeDets = [
              ...rawDets,
              {
                x1: 0.35,
                y1: 0.45,
                x2: 0.65,
                y2: 0.85,
                score: 0.99,
                classId: 67,
                label: 'cell phone',
              },
            ];
          }

          setDetections(activeDets);
          setInferenceTimeMs(Math.round(infMs));
          setIsPhoneDetected(phoneInFrame);
          isPhoneDetectedRef.current = phoneInFrame;

          // Render Tactical HUD Overlay
          if (overlayCanvasRef.current) {
            renderHUDOverlay(
              overlayCanvasRef.current,
              activeDets,
              phoneHoldDurationRef.current >= currentSettings.timeLimit,
              isMirroredRef.current
            );
          }
        } catch (inferErr) {
          console.warn('Inference frame dropped:', inferErr);
        }
      }

      // 2. Doomscroll Accumulator & Anti-Flicker Grace Buffer Logic
      const hasPhone = isPhoneDetectedRef.current;
      const timeLimit = currentSettings.timeLimit;

      if (hasPhone) {
        // Phone detected: Increment duration in real time
        phoneHoldDurationRef.current += dt;
        currentStreakRef.current = 0;
        setCurrentStreak(0);
        setIsDecaying(false);

        // Accumulate blocked doomscroll time
        const newStats = addDoomscrollBlocked(dt);
        setTelemetry(newStats);
      } else {
        // Phone NOT detected:
        if (phoneHoldDurationRef.current > 0) {
          // Decay at 1.5x speed rather than resetting to 0 immediately!
          const decaySpeed = 1.5;
          phoneHoldDurationRef.current = Math.max(0, phoneHoldDurationRef.current - dt * decaySpeed);
          setIsDecaying(true);

          // If the siren was blaring and phone is put down, stop siren instantly!
          if (sirenAudio.isPlaying()) {
            sirenAudio.stopSiren();
            // Celebrate putting the phone down!
            confetti({
              particleCount: 40,
              spread: 60,
              origin: { y: 0.6 },
              colors: ['#00f2fe', '#00ff88', '#ffffff'],
            });
          }
        } else {
          setIsDecaying(false);
          sirenTriggeredThisBreachRef.current = false;
          lastBeepSecondRef.current = 0;

          // Clean focus streak accumulating
          currentStreakRef.current += dt;
          setCurrentStreak(currentStreakRef.current);
          if (Math.round(currentStreakRef.current) % 5 === 0) {
            const updated = updateFocusStreak(currentStreakRef.current);
            setTelemetry(updated);
          }
        }
      }

      const duration = phoneHoldDurationRef.current;
      setPhoneHoldDuration(duration);

      // 3. Audio & Escalation States
      if (duration >= timeLimit) {
        // Limit breached -> SIREN ACTIVE
        setGuardState('siren');

        if (!sirenTriggeredThisBreachRef.current) {
          sirenTriggeredThisBreachRef.current = true;
          const updated = recordSirenTrigger();
          setTelemetry(updated);
        }

        if (hasPhone && !sirenAudio.isPlaying()) {
          sirenAudio.startSiren();
        }
      } else if (duration >= timeLimit * 0.4) {
        // Warning zone: e.g. at 0.2s for a 0.5s limit
        setGuardState('warning');
        if (sirenAudio.isPlaying()) {
          sirenAudio.stopSiren();
        }

        const step = timeLimit <= 1 ? 0.2 : timeLimit <= 3 ? 0.5 : 1.0;
        const currentStep = Math.floor(duration / step);
        if (currentStep > lastBeepSecondRef.current) {
          lastBeepSecondRef.current = currentStep;
          sirenAudio.playWarningBeep();
        }
      } else if (duration > 0.1) {
        setGuardState('warning');
        if (sirenAudio.isPlaying()) {
          sirenAudio.stopSiren();
        }
        lastBeepSecondRef.current = 0;
      } else {
        // Clean / Locked in
        setGuardState('clean');
        if (sirenAudio.isPlaying()) {
          sirenAudio.stopSiren();
        }
        lastBeepSecondRef.current = 0;
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      handleDisarmGuard();
    };
  }, [handleDisarmGuard]);

  // Audio Test Handler
  const handleTestSiren = async () => {
    if (isTestingSiren) {
      sirenAudio.stopSiren();
      setIsTestingSiren(false);
    } else {
      await sirenAudio.unlockAudio();
      sirenAudio.startSiren();
      setIsTestingSiren(true);
      // Auto stop test after 3 seconds
      setTimeout(() => {
        sirenAudio.stopSiren();
        setIsTestingSiren(false);
      }, 3000);
    }
  };

  const handleToggleMute = () => {
    if (isMuted) {
      setIsMuted(false);
      sirenAudio.setVolume(settings.volume);
    } else {
      setIsMuted(true);
      sirenAudio.setVolume(0);
    }
  };

  const handleVolumeChange = (vol: number) => {
    setSettings((prev) => ({ ...prev, volume: vol }));
    setIsMuted(false);
    sirenAudio.setVolume(vol);
  };

  const handleResetTelemetry = () => {
    if (window.confirm('Reset all saved focus streak and trigger telemetry?')) {
      const reset = resetTelemetry();
      setTelemetry(reset);
      setCurrentStreak(0);
      currentStreakRef.current = 0;
    }
  };

  return (
    <div className="min-h-screen bg-[#06080e] text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-black">
      {/* Header */}
      <Header
        guardState={guardState}
        isAudioMuted={isMuted}
        volume={settings.volume}
        onVolumeChange={handleVolumeChange}
        onToggleMute={handleToggleMute}
        onTestSiren={handleTestSiren}
        isTestingSiren={isTestingSiren}
      />

      {/* Main Tactical Dashboard Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 flex flex-col gap-6">
        {/* Top Grid: Viewport + Doomscroll Meter */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left: Viewport (7 cols) */}
          <div className="lg:col-span-7 flex flex-col gap-4">
            <WebcamViewport
              videoRef={videoRef}
              overlayCanvasRef={overlayCanvasRef}
              isArmed={isArmed}
              onArmGuard={handleArmGuard}
              onDisarmGuard={handleDisarmGuard}
              guardState={guardState}
              fps={fps}
              inferenceTimeMs={inferenceTimeMs}
              detections={detections}
              simulatedPhone={settings.simulatedPhone}
              onToggleSimulatedPhone={() =>
                setSettings((prev) => ({ ...prev, simulatedPhone: !prev.simulatedPhone }))
              }
              modelLoadingMessage={modelLoadingMessage}
              cameraError={cameraError}
              isMirrored={isMirrored}
              onToggleMirror={() => setIsMirrored((prev) => !prev)}
            />
          </div>

          {/* Right: Meter, Telemetry, Controls (5 cols) */}
          <div className="lg:col-span-5 flex flex-col gap-5">
            {/* Countdown / Exposure Meter */}
            <DoomscrollMeter
              phoneHoldDuration={phoneHoldDuration}
              timeLimit={settings.timeLimit}
              guardState={guardState}
              isPhoneDetected={isPhoneDetected || settings.simulatedPhone}
              isDecaying={isDecaying}
            />

            {/* Telemetry Stats */}
            <TelemetryCards
              stats={telemetry}
              currentStreak={currentStreak}
              onResetStats={handleResetTelemetry}
            />

            {/* Controls */}
            <ControlPanel
              settings={settings}
              onUpdateSettings={(newSettings) =>
                setSettings((prev) => ({ ...prev, ...newSettings }))
              }
            />
          </div>
        </div>
      </main>

      {/* Emergency Flashing Siren Overlay */}
      <EmergencyAlertOverlay
        isVisible={guardState === 'siren'}
        phoneHoldDuration={phoneHoldDuration}
        onSilenceOverride={() => {
          sirenAudio.stopSiren();
          setIsMuted(true);
        }}
      />
    </div>
  );
}

export default App;
