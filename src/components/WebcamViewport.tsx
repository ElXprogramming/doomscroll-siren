import React, { useRef, useEffect } from 'react';
import { Camera, ShieldAlert, Cpu, AlertTriangle, Eye, EyeOff, Radio, FlipHorizontal } from 'lucide-react';
import type { Detection, GuardState } from '../types';

interface WebcamViewportProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  overlayCanvasRef: React.RefObject<HTMLCanvasElement | null>;
  isArmed: boolean;
  onArmGuard: () => void;
  onDisarmGuard: () => void;
  guardState: GuardState;
  fps: number;
  inferenceTimeMs: number;
  detections: Detection[];
  simulatedPhone: boolean;
  onToggleSimulatedPhone: () => void;
  modelLoadingMessage: string | null;
  cameraError: string | null;
  isMirrored: boolean;
  onToggleMirror: () => void;
}

export const WebcamViewport: React.FC<WebcamViewportProps> = ({
  videoRef,
  overlayCanvasRef,
  isArmed,
  onArmGuard,
  onDisarmGuard,
  guardState,
  fps,
  inferenceTimeMs,
  detections,
  simulatedPhone,
  onToggleSimulatedPhone,
  modelLoadingMessage,
  cameraError,
  isMirrored,
  onToggleMirror,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Resize overlay canvas to match container / video aspect ratio
  useEffect(() => {
    const handleResize = () => {
      const container = containerRef.current;
      const canvas = overlayCanvasRef.current;
      if (container && canvas) {
        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [overlayCanvasRef]);

  const hasPhone = simulatedPhone || detections.some((d) => d.classId === 67);
  const hasPerson = detections.some((d) => d.classId === 0);

  return (
    <div className="relative flex flex-col rounded-xl border border-cyan-900/50 bg-[#080b12] shadow-2xl overflow-hidden">
      {/* Viewport Header */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-[#0b0f19] border-b border-cyan-950/70 text-xs font-mono">
        <div className="flex items-center gap-2">
          <Radio className={`w-3.5 h-3.5 ${isArmed ? 'text-cyan-400 animate-pulse' : 'text-slate-600'}`} />
          <span className="text-slate-300 font-bold uppercase tracking-wider">OPTICAL SENSOR FEED // CAM-01</span>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={onToggleMirror}
            className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold flex items-center gap-1 transition-colors ${
              isMirrored
                ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-600/60'
                : 'bg-slate-900 text-slate-400 border border-slate-700'
            }`}
            title="Toggle Mirror Camera Feed"
          >
            <FlipHorizontal className="w-3 h-3" />
            <span className="hidden xs:inline">MIRROR:</span> {isMirrored ? 'ON' : 'OFF'}
          </button>
          <span className="hidden sm:inline text-slate-500">RES: 640x480</span>
          <span
            className={`px-2 py-0.5 rounded text-[11px] font-bold ${
              isArmed
                ? guardState === 'siren'
                  ? 'bg-red-950/90 text-red-400 border border-red-500 animate-pulse'
                  : guardState === 'warning'
                  ? 'bg-amber-950/90 text-amber-300 border border-amber-500'
                  : 'bg-cyan-950/80 text-cyan-400 border border-cyan-700/50'
                : 'bg-slate-800 text-slate-500'
            }`}
          >
            {isArmed
              ? guardState === 'siren'
                ? 'BREACH ACTIVE'
                : guardState === 'warning'
                ? 'WARNING ACTIVE'
                : 'LIVE SURVEILLANCE'
              : 'STANDBY'}
          </span>
        </div>
      </div>

      {/* Main Video & Canvas Container */}
      <div
        ref={containerRef}
        className="relative aspect-[4/3] sm:aspect-video w-full bg-black overflow-hidden flex items-center justify-center tactical-grid select-none"
      >
        {/* Real Video Element */}
        <video
          ref={videoRef}
          playsInline
          muted
          autoPlay
          className={`w-full h-full object-cover transition-opacity duration-300 ${
            isMirrored ? '-scale-x-100' : ''
          } ${isArmed ? 'opacity-100' : 'opacity-20'}`}
        />

        {/* Overlay Canvas for HUD Bounding Boxes */}
        <canvas
          ref={overlayCanvasRef}
          className="absolute inset-0 w-full h-full pointer-events-none z-10"
        />

        {/* Tactical HUD Corner Brackets */}
        <div className="absolute top-3 left-3 w-6 h-6 border-t-2 border-l-2 border-cyan-400/60 pointer-events-none" />
        <div className="absolute top-3 right-3 w-6 h-6 border-t-2 border-r-2 border-cyan-400/60 pointer-events-none" />
        <div className="absolute bottom-3 left-3 w-6 h-6 border-b-2 border-l-2 border-cyan-400/60 pointer-events-none" />
        <div className="absolute bottom-3 right-3 w-6 h-6 border-b-2 border-r-2 border-cyan-400/60 pointer-events-none" />

        {/* Center Reticle (subtle) */}
        {isArmed && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
            <div className="w-16 h-16 rounded-full border border-dashed border-cyan-400 flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-cyan-400" />
            </div>
          </div>
        )}

        {/* Top-Left Telemetry Overlay */}
        {isArmed && (
          <div className="absolute top-4 left-4 z-20 flex flex-col gap-1 pointer-events-none">
            <div className="flex items-center gap-2 bg-[#07090e]/85 backdrop-blur-sm border border-cyan-900/60 px-2.5 py-1 rounded text-[11px] font-mono text-cyan-400">
              <Cpu className="w-3.5 h-3.5 text-cyan-400" />
              <span>FPS: {fps}</span>
              <span className="text-slate-600">|</span>
              <span>LATENCY: {inferenceTimeMs}ms</span>
            </div>
          </div>
        )}

        {/* Top-Right Target Lock Indicator */}
        {isArmed && (
          <div className="absolute top-4 right-4 z-20 pointer-events-none">
            {hasPhone ? (
              <div className="flex items-center gap-1.5 bg-red-950/90 border border-red-500 px-3 py-1 rounded text-xs font-mono font-bold text-red-200 animate-pulse glow-red">
                <AlertTriangle className="w-3.5 h-3.5 text-red-400 animate-bounce" />
                <span>[TARGET LOCK // CELL PHONE]</span>
              </div>
            ) : hasPerson ? (
              <div className="flex items-center gap-1.5 bg-cyan-950/80 border border-cyan-500/70 px-2.5 py-1 rounded text-xs font-mono text-cyan-300">
                <Eye className="w-3.5 h-3.5 text-cyan-400" />
                <span>OPERATOR IN FRAME</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 bg-slate-900/80 border border-slate-700 px-2.5 py-1 rounded text-xs font-mono text-slate-400">
                <EyeOff className="w-3.5 h-3.5 text-slate-500" />
                <span>SEARCHING FIELD...</span>
              </div>
            )}
          </div>
        )}

        {/* Model Loading Screen */}
        {modelLoadingMessage && (
          <div className="absolute inset-0 bg-[#07090e]/95 backdrop-blur-md z-30 flex flex-col items-center justify-center p-6 text-center">
            <div className="w-14 h-14 rounded-full border-2 border-cyan-500/30 border-t-cyan-400 animate-spin mb-4" />
            <h3 className="text-lg font-mono font-bold text-cyan-300 mb-2">INITIALIZING NEURAL SENTINEL</h3>
            <p className="text-sm font-mono text-slate-400 max-w-md">{modelLoadingMessage}</p>
            <div className="mt-4 w-48 h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 animate-pulse w-3/4 rounded-full" />
            </div>
          </div>
        )}

        {/* Camera Permission / Error Banner */}
        {cameraError && (
          <div className="absolute inset-0 bg-red-950/90 backdrop-blur-md z-30 flex flex-col items-center justify-center p-6 text-center">
            <AlertTriangle className="w-12 h-12 text-red-400 mb-3 animate-bounce" />
            <h3 className="text-lg font-mono font-bold text-white mb-2">OPTICAL SENSOR OFFLINE</h3>
            <p className="text-sm font-mono text-red-200 max-w-md mb-4">{cameraError}</p>
            <button
              onClick={onArmGuard}
              className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-mono text-xs font-bold uppercase rounded border border-red-400 transition-all glow-red"
            >
              Retry Camera Access
            </button>
          </div>
        )}

        {/* Disarmed Standby Overlay */}
        {!isArmed && !modelLoadingMessage && !cameraError && (
          <div className="absolute inset-0 bg-[#07090e]/85 backdrop-blur-sm z-20 flex flex-col items-center justify-center p-6 text-center">
            <div className="w-16 h-16 rounded-full bg-cyan-950/60 border border-cyan-500/40 flex items-center justify-center mb-4 glow-cyan">
              <Camera className="w-8 h-8 text-cyan-400" />
            </div>
            <h3 className="text-xl font-mono font-bold text-white tracking-wide mb-1">
              DOOMSCROLL SENTINEL DISARMED
            </h3>
            <p className="text-xs font-mono text-slate-400 max-w-md mb-6 leading-relaxed">
              Arm the system to initiate real-time local computer vision surveillance.
              If a phone is caught in your hand for more than 0.5 seconds, the tactical emergency siren will deploy.
            </p>
            <button
              onClick={onArmGuard}
              className="px-6 py-3.5 bg-cyan-500 hover:bg-cyan-400 text-black font-mono font-black text-sm uppercase tracking-wider rounded-lg shadow-lg hover:shadow-cyan-500/50 transition-all transform hover:scale-[1.02] active:scale-95 flex items-center gap-2 glow-cyan"
            >
              <ShieldAlert className="w-5 h-5 text-black" />
              ARM DOOMSCROLL GUARD
            </button>
          </div>
        )}
      </div>

      {/* Viewport Control Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-[#0b0f19] border-t border-cyan-950/70">
        <div className="flex items-center gap-2">
          {isArmed ? (
            <button
              onClick={onDisarmGuard}
              className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white font-mono text-xs font-bold uppercase rounded border border-slate-700 transition-colors"
            >
              Disarm Guard
            </button>
          ) : (
            <button
              onClick={onArmGuard}
              className="px-3 py-1.5 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 font-mono text-xs font-bold uppercase rounded border border-cyan-500/50 transition-colors"
            >
              Arm Guard
            </button>
          )}
        </div>

        {/* Simulation Button */}
        <div className="flex items-center gap-2">
          <button
            onClick={onToggleSimulatedPhone}
            className={`px-3 py-1.5 font-mono text-xs font-bold uppercase rounded border transition-all flex items-center gap-2 ${
              simulatedPhone
                ? 'bg-red-600/90 text-white border-red-400 glow-red animate-pulse'
                : 'bg-slate-900/90 hover:bg-slate-800 text-slate-300 border-slate-700'
            }`}
            title="Simulate holding a phone without using physical hardware"
          >
            <span className={`w-2 h-2 rounded-full ${simulatedPhone ? 'bg-white animate-ping' : 'bg-red-500'}`} />
            {simulatedPhone ? 'SIMULATION ACTIVE: PHONE IN HAND' : 'SIMULATE PHONE DETECTION'}
          </button>
        </div>
      </div>
    </div>
  );
};
