import React from 'react';
import { Shield, Bell, Volume2, VolumeX } from 'lucide-react';
import type { GuardState } from '../types';

interface HeaderProps {
  guardState: GuardState;
  isAudioMuted: boolean;
  volume: number;
  onVolumeChange: (vol: number) => void;
  onToggleMute: () => void;
  onTestSiren: () => void;
  isTestingSiren: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  guardState,
  isAudioMuted,
  volume,
  onVolumeChange,
  onToggleMute,
  onTestSiren,
  isTestingSiren,
}) => {
  return (
    <header className="w-full border-b border-cyan-950/60 bg-[#0a0d14]/90 backdrop-blur-md sticky top-0 z-40 px-4 py-3">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-950 to-slate-900 border border-cyan-500/40 glow-cyan">
            <Shield className="w-5 h-5 text-cyan-400" />
            <div className="absolute inset-0 rounded-lg border border-cyan-400/20 animate-ping opacity-25" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black tracking-wider text-white uppercase font-mono m-0 flex items-center gap-2">
                Doomscroll <span className="text-red-500 text-glow-red">Siren</span>
              </h1>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-cyan-950/80 border border-cyan-500/50 text-cyan-400 font-mono tracking-widest">
                v1.0-YOLO11
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono tracking-tight m-0">
              TACTICAL CELL-PHONE INTERCEPTOR & FOCUS SENTINEL
            </p>
          </div>
        </div>

        {/* Status Indicator */}
        <div className="flex items-center gap-2">
          {guardState === 'disarmed' && (
            <span className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-slate-900 border border-slate-700/80 text-slate-400 font-mono text-xs uppercase font-semibold">
              <span className="w-2 h-2 rounded-full bg-slate-500" />
              SYSTEM DISARMED
            </span>
          )}
          {guardState === 'clean' && (
            <span className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-emerald-950/60 border border-emerald-500/60 text-emerald-400 font-mono text-xs uppercase font-semibold glow-cyan">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              LOCKED IN // FOCUS ACTIVE
            </span>
          )}
          {guardState === 'warning' && (
            <span className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-amber-950/80 border border-amber-500 text-amber-300 font-mono text-xs uppercase font-bold animate-pulse-fast glow-amber">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
              WARNING // PUT PHONE DOWN
            </span>
          )}
          {guardState === 'siren' && (
            <span className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-red-950/90 border border-red-500 text-red-100 font-mono text-xs uppercase font-extrabold animate-pulse-fast glow-red-intense">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
              CRITICAL BREACH // SIREN ENGAGED
            </span>
          )}
        </div>

        {/* Audio Controls */}
        <div className="flex items-center gap-3">
          {/* Siren Test Button */}
          <button
            onClick={onTestSiren}
            className={`px-3 py-1.5 text-xs font-mono font-bold uppercase rounded border transition-all flex items-center gap-1.5 ${
              isTestingSiren
                ? 'bg-red-600 border-red-400 text-white animate-pulse glow-red'
                : 'bg-slate-900/80 hover:bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
            }`}
            title="Preview synthesizer siren"
          >
            <Bell className={`w-3.5 h-3.5 ${isTestingSiren ? 'animate-bounce' : ''}`} />
            {isTestingSiren ? 'HALT TEST' : 'TEST SIREN'}
          </button>

          {/* Volume Control */}
          <div className="flex items-center gap-2 bg-slate-900/70 border border-slate-800 px-3 py-1.5 rounded">
            <button
              onClick={onToggleMute}
              className="text-slate-400 hover:text-cyan-400 transition-colors"
              title={isAudioMuted ? 'Unmute' : 'Mute'}
            >
              {isAudioMuted || volume === 0 ? (
                <VolumeX className="w-4 h-4 text-red-400" />
              ) : (
                <Volume2 className="w-4 h-4" />
              )}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={isAudioMuted ? 0 : volume}
              onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
              className="w-16 h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-400"
              title={`Volume: ${Math.round((isAudioMuted ? 0 : volume) * 100)}%`}
            />
          </div>
        </div>
      </div>
    </header>
  );
};
