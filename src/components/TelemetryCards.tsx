import React from 'react';
import { Siren, Zap, Clock, RotateCcw, Award } from 'lucide-react';
import type { TelemetryStats } from '../types';

interface TelemetryCardsProps {
  stats: TelemetryStats;
  currentStreak: number;
  onResetStats: () => void;
}

export const TelemetryCards: React.FC<TelemetryCardsProps> = ({
  stats,
  currentStreak,
  onResetStats,
}) => {
  const formatSeconds = (sec: number): string => {
    if (sec < 60) return `${Math.round(sec)}s`;
    const m = Math.floor(sec / 60);
    const s = Math.round(sec % 60);
    return `${m}m ${s}s`;
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between font-mono">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
          <Award className="w-3.5 h-3.5 text-cyan-400" />
          SESSION TELEMETRY & DISCIPLINE STATS
        </span>
        <button
          onClick={onResetStats}
          className="text-[11px] text-slate-500 hover:text-red-400 transition-colors flex items-center gap-1"
          title="Reset telemetry"
        >
          <RotateCcw className="w-3 h-3" />
          RESET
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Siren Triggers */}
        <div className="rounded-xl border border-red-950/50 bg-[#0c0d16] p-4 flex flex-col justify-between relative overflow-hidden group hover:border-red-500/40 transition-colors">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-2">
            <span>TIMES CAUGHT</span>
            <div className="w-7 h-7 rounded-lg bg-red-950/60 border border-red-500/30 flex items-center justify-center text-red-400 group-hover:scale-110 transition-transform">
              <Siren className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-mono font-black text-white group-hover:text-red-400 transition-colors">
              {stats.sirenTriggers}
            </div>
            <span className="text-[11px] font-mono text-slate-500">
              {stats.sirenTriggers === 0 ? 'Flawless session' : 'Siren deployments'}
            </span>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-red-500/40 to-transparent" />
        </div>

        {/* Longest Focus Streak */}
        <div className="rounded-xl border border-cyan-950/50 bg-[#0c0d16] p-4 flex flex-col justify-between relative overflow-hidden group hover:border-cyan-500/40 transition-colors">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-2">
            <span>LONGEST CLEAN STREAK</span>
            <div className="w-7 h-7 rounded-lg bg-cyan-950/60 border border-cyan-500/30 flex items-center justify-center text-cyan-400 group-hover:scale-110 transition-transform">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-mono font-black text-white group-hover:text-cyan-400 transition-colors">
              {formatSeconds(stats.longestFocusStreak)}
            </div>
            <span className="text-[11px] font-mono text-cyan-400/80">
              Current: {formatSeconds(currentStreak)}
            </span>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-cyan-500/40 to-transparent" />
        </div>

        {/* Doomscroll Time Blocked */}
        <div className="rounded-xl border border-amber-950/50 bg-[#0c0d16] p-4 flex flex-col justify-between relative overflow-hidden group hover:border-amber-500/40 transition-colors">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-2">
            <span>TIME BLOCKED</span>
            <div className="w-7 h-7 rounded-lg bg-amber-950/60 border border-amber-500/30 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-mono font-black text-white group-hover:text-amber-400 transition-colors">
              {stats.totalDoomscrollBlocked.toFixed(1)}s
            </div>
            <span className="text-[11px] font-mono text-slate-500">Phone distraction halted</span>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-amber-500/40 to-transparent" />
        </div>
      </div>
    </div>
  );
};
