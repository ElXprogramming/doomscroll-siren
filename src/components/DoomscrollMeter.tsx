import React from 'react';
import { AlertCircle, Flame, ShieldCheck, Siren } from 'lucide-react';
import type { GuardState } from '../types';

interface DoomscrollMeterProps {
  phoneHoldDuration: number;
  timeLimit: number;
  guardState: GuardState;
  isPhoneDetected: boolean;
  isDecaying: boolean;
}

export const DoomscrollMeter: React.FC<DoomscrollMeterProps> = ({
  phoneHoldDuration,
  timeLimit,
  guardState,
  isPhoneDetected,
  isDecaying,
}) => {
  const percentage = Math.min(100, Math.max(0, (phoneHoldDuration / timeLimit) * 100));
  const remaining = Math.max(0, timeLimit - phoneHoldDuration);

  // Meter color theme
  let statusText = 'SAFE ZONE // ZERO THREAT';
  let statusDesc = 'Keep your eyes on your work. No phone detected in surveillance field.';

  if (guardState === 'siren' || phoneHoldDuration >= timeLimit) {
    statusText = '🚨 CRITICAL EXPOSURE BREACHED';
    statusDesc = 'PHONE DETECTED > 10.0s! Put device down immediately to silence emergency siren.';
  } else if (phoneHoldDuration >= 5.0) {
    statusText = '⚠️ IMMINENT SIREN WARNING';
    statusDesc = `Warning beeps active! Put your phone down now. ${remaining.toFixed(1)}s until siren triggers.`;
  } else if (phoneHoldDuration >= 2.0) {
    statusText = 'CAUTION // PHONE IN VIEW';
    statusDesc = 'Doomscroll accumulator active. Anti-flicker grace buffer engaged.';
  }

  const numSegments = 24;
  const activeSegments = Math.round((percentage / 100) * numSegments);

  return (
    <div
      className={`rounded-xl border border-cyan-900/40 bg-[#080b12] p-5 shadow-2xl transition-all ${
        guardState === 'siren' || phoneHoldDuration >= timeLimit
          ? 'border-red-500/80 bg-red-950/20 glow-red'
          : phoneHoldDuration >= 2.0
          ? 'border-amber-500/40 glow-amber'
          : 'glow-cyan'
      }`}
    >
      {/* Top Banner */}
      <div className="flex items-center justify-between mb-3 font-mono">
        <div className="flex items-center gap-2">
          {guardState === 'siren' || phoneHoldDuration >= timeLimit ? (
            <Siren className="w-5 h-5 text-red-500 animate-bounce" />
          ) : phoneHoldDuration >= 2.0 ? (
            <Flame className="w-5 h-5 text-amber-400 animate-pulse" />
          ) : (
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
          )}
          <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
            DOOMSCROLL EXPOSURE METER
          </span>
        </div>

        {/* Anti-flicker or Detection Badge */}
        {isDecaying && (
          <span className="px-2 py-0.5 rounded bg-yellow-950/80 border border-yellow-500/50 text-yellow-300 text-[10px] uppercase font-bold animate-pulse">
            DECAYING (1.5x Grace)
          </span>
        )}
        {isPhoneDetected && (
          <span className="px-2 py-0.5 rounded bg-red-950/90 border border-red-500 text-red-200 text-[10px] uppercase font-bold animate-pulse">
            TARGET IN HAND
          </span>
        )}
      </div>

      {/* Giant Digital Readout */}
      <div className="flex items-baseline justify-between mb-3 font-mono">
        <div className="flex items-baseline gap-2">
          <span
            className={`text-4xl sm:text-5xl font-black tracking-tight ${
              guardState === 'siren' || phoneHoldDuration >= timeLimit
                ? 'text-red-500 text-glow-red animate-pulse'
                : phoneHoldDuration >= 5.0
                ? 'text-amber-400 text-glow-amber'
                : phoneHoldDuration >= 2.0
                ? 'text-yellow-300'
                : 'text-emerald-400 text-glow-cyan'
            }`}
          >
            {phoneHoldDuration.toFixed(1)}s
          </span>
          <span className="text-lg text-slate-500 font-bold">/ {timeLimit.toFixed(1)}s</span>
        </div>

        <div className="text-right">
          <div className="text-xs text-slate-400 font-bold uppercase">THRESHOLD STATUS</div>
          <div
            className={`text-sm font-bold tracking-wide ${
              guardState === 'siren' || phoneHoldDuration >= timeLimit
                ? 'text-red-400'
                : phoneHoldDuration >= 2.0
                ? 'text-amber-400'
                : 'text-emerald-400'
            }`}
          >
            {percentage.toFixed(0)}% BREACH
          </div>
        </div>
      </div>

      {/* Segmented LED Progress Bar */}
      <div className="relative w-full h-7 bg-[#0b0e17] rounded-lg p-1 border border-slate-800 flex gap-1 items-stretch mb-3">
        {Array.from({ length: numSegments }).map((_, idx) => {
          const isFilled = idx < activeSegments;
          let segmentColor = 'bg-slate-800/60';
          if (isFilled) {
            if (idx >= Math.round(numSegments * 0.8)) {
              segmentColor = 'bg-red-500 shadow-[0_0_8px_rgba(255,26,64,0.8)]';
            } else if (idx >= Math.round(numSegments * 0.4)) {
              segmentColor = 'bg-amber-400 shadow-[0_0_8px_rgba(255,170,0,0.8)]';
            } else {
              segmentColor = 'bg-emerald-400 shadow-[0_0_8px_rgba(0,255,136,0.6)]';
            }
          }

          return (
            <div
              key={idx}
              className={`flex-1 rounded-[2px] transition-all duration-75 ${segmentColor}`}
            />
          );
        })}
      </div>

      {/* Status Explainer */}
      <div className="flex items-start gap-2 pt-2 border-t border-slate-800/80 text-xs font-mono">
        <AlertCircle
          className={`w-4 h-4 shrink-0 mt-0.5 ${
            guardState === 'siren' || phoneHoldDuration >= timeLimit ? 'text-red-400' : 'text-cyan-400'
          }`}
        />
        <div>
          <span className="font-bold text-slate-200">{statusText}</span>
          <p className="text-slate-400 mt-0.5 text-[11px] leading-relaxed">{statusDesc}</p>
        </div>
      </div>
    </div>
  );
};
