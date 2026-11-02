import React from 'react';
import { Siren, AlertOctagon, VolumeX } from 'lucide-react';

interface EmergencyAlertOverlayProps {
  isVisible: boolean;
  phoneHoldDuration: number;
  onSilenceOverride: () => void;
}

export const EmergencyAlertOverlay: React.FC<EmergencyAlertOverlayProps> = ({
  isVisible,
  phoneHoldDuration,
  onSilenceOverride,
}) => {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 pointer-events-auto flex flex-col justify-between p-4 sm:p-8 animate-siren-flash">
      {/* Top Hazard Warning Bar */}
      <div className="w-full bg-red-600 border-2 border-red-300 rounded-lg p-2.5 flex items-center justify-between text-white font-mono font-black text-sm tracking-widest uppercase shadow-2xl">
        <div className="flex items-center gap-2">
          <Siren className="w-6 h-6 animate-spin text-white" />
          <span>⚠️ EMERGENCY DOOMSCROLL INTERCEPTION IN PROGRESS</span>
        </div>
        <span className="hidden sm:inline bg-black/40 px-2 py-0.5 rounded text-xs">
          CODE RED // LEVEL 1
        </span>
      </div>

      {/* Center Tactical Modal */}
      <div className="max-w-2xl mx-auto w-full bg-[#0c0507]/95 border-2 border-red-500 rounded-2xl p-6 sm:p-10 text-center shadow-[0_0_80px_rgba(255,26,64,0.9)] flex flex-col items-center gap-5">
        <div className="w-20 h-20 rounded-full bg-red-600/30 border-2 border-red-500 flex items-center justify-center animate-bounce">
          <AlertOctagon className="w-12 h-12 text-red-500" />
        </div>

        <div>
          <h2 className="text-3xl sm:text-5xl font-black font-mono text-white tracking-tight uppercase mb-2 animate-pulse">
            PUT THE PHONE <span className="text-red-500 underline decoration-4">DOWN NOW</span>!
          </h2>
          <p className="text-base sm:text-lg font-mono text-red-200 max-w-lg mx-auto">
            Tactical focus limit exceeded. You have been caught scrolling for{' '}
            <span className="font-bold text-white bg-red-950 px-2 py-0.5 rounded border border-red-500">
              {phoneHoldDuration.toFixed(1)}s
            </span>
            .
          </p>
        </div>

        <div className="w-full max-w-md bg-black/60 border border-red-900/60 rounded-xl p-4 font-mono text-xs text-red-300/90 leading-relaxed text-left flex flex-col gap-2">
          <div className="flex items-center gap-2 text-white font-bold">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
            DEACTIVATION PROTOCOL:
          </div>
          <div>1. Place your smartphone screen-down or entirely out of camera frame.</div>
          <div>2. The acoustic siren will disengage immediately once phone leaves frame.</div>
          <div>3. Regain focus and rebuild your clean productivity streak.</div>
        </div>

        <button
          onClick={onSilenceOverride}
          className="mt-2 px-6 py-2.5 bg-black/80 hover:bg-black text-red-400 hover:text-white border border-red-600/80 rounded-lg text-xs font-mono font-bold uppercase transition-all flex items-center gap-2"
        >
          <VolumeX className="w-4 h-4" />
          Emergency Audio Mute (Force Silence)
        </button>
      </div>

      {/* Bottom Hazard Bar */}
      <div className="w-full bg-red-600 border-2 border-red-300 rounded-lg p-2.5 flex items-center justify-center text-white font-mono font-black text-xs sm:text-sm tracking-widest uppercase shadow-2xl">
        <span>HOLDING YOUR FOCUS ACCOUNTABLE // AI REAL-TIME SENTINEL</span>
      </div>
    </div>
  );
};
