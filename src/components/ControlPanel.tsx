import React from 'react';
import { Sliders, Shield, Zap, Info } from 'lucide-react';
import type { GuardSettings } from '../types';

interface ControlPanelProps {
  settings: GuardSettings;
  onUpdateSettings: (newSettings: Partial<GuardSettings>) => void;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
  settings,
  onUpdateSettings,
}) => {
  return (
    <div className="rounded-xl border border-cyan-900/40 bg-[#080b12] p-5 shadow-2xl flex flex-col gap-4">
      {/* Title */}
      <div className="flex items-center justify-between pb-3 border-b border-cyan-950/60 font-mono">
        <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
          <Sliders className="w-4 h-4 text-cyan-400" />
          SENTINEL CONFIGURATION & SENSITIVITY
        </span>
        <span className="text-[10px] text-cyan-400 bg-cyan-950/60 border border-cyan-800/40 px-2 py-0.5 rounded">
          LIVE CALIBRATION
        </span>
      </div>

      {/* Grid of Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Confidence Threshold */}
        <div className="bg-[#0b0e17] border border-slate-800/80 rounded-lg p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-mono font-bold text-slate-300 flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-cyan-400" />
              CONFIDENCE THRESHOLD
            </label>
            <span className="text-xs font-mono font-bold text-cyan-400 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800/50">
              {(settings.confidenceThreshold * 100).toFixed(0)}%
            </span>
          </div>
          <p className="text-[11px] font-mono text-slate-400 mb-3 leading-relaxed">
            Minimum detection confidence required for cell phone trigger. Higher reduces false positives.
          </p>
          <input
            type="range"
            min="0.20"
            max="0.75"
            step="0.05"
            value={settings.confidenceThreshold}
            onChange={(e) => onUpdateSettings({ confidenceThreshold: parseFloat(e.target.value) })}
            className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-400"
          />
          <div className="flex justify-between text-[10px] font-mono text-slate-500 mt-1">
            <span>20% (Sensitive)</span>
            <span>35% (Default)</span>
            <span>75% (Strict)</span>
          </div>
        </div>

        {/* Time Limit */}
        <div className="bg-[#0b0e17] border border-slate-800/80 rounded-lg p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-mono font-bold text-slate-300 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              DOOMSCROLL TIME LIMIT
            </label>
            <span className="text-xs font-mono font-bold text-amber-400 bg-amber-950 px-2 py-0.5 rounded border border-amber-800/50">
              {settings.timeLimit} SECONDS
            </span>
          </div>
          <p className="text-[11px] font-mono text-slate-400 mb-3 leading-relaxed">
            Continuous phone screen exposure duration before tactical siren engages.
          </p>
          <div className="grid grid-cols-3 gap-2">
            {[2, 5, 10].map((seconds) => (
              <button
                key={seconds}
                onClick={() => onUpdateSettings({ timeLimit: seconds })}
                className={`py-1.5 text-xs font-mono font-bold rounded border transition-all ${
                  settings.timeLimit === seconds
                    ? 'bg-amber-500/20 border-amber-400 text-amber-300 glow-amber'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {seconds}s {seconds === 2 ? '★' : ''}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tactical Algorithm Note */}
      <div className="bg-[#090c14] border border-cyan-950/40 rounded-lg p-3 text-[11px] font-mono text-slate-400 flex items-start gap-2.5">
        <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <span className="text-slate-200 font-bold">Anti-Flicker Grace Buffer Algorithm: </span>
          When phone detection is lost momentarily due to hand occlusion or fast movement, the timer decays at 1.5x speed instead of resetting to 0.0s instantly. This guarantees you cannot circumvent the sentinel by rapidly tilting or flashing your phone.
        </div>
      </div>
    </div>
  );
};
