import React from 'react';
import { AlertTriangle, Clock, Zap, ArrowRight, Activity } from 'lucide-react';

interface AlertCardProps {
  id: string;
  caseId: string;
  title: string;
  description: string;
  timeAgo: string;
  indicators: string[];
  priority: 'High' | 'Urgent';
  onInspect?: () => void;
}

export const AlertCard: React.FC<AlertCardProps> = ({
  caseId,
  description,
  timeAgo,
  indicators,
  priority,
  onInspect,
}) => {
  const isUrgent = priority === 'Urgent';

  return (
    <div
      onClick={onInspect}
      className={`group relative overflow-hidden rounded-2xl p-5 cursor-pointer transition-all duration-300 select-none
        bg-slate-950/70 backdrop-blur-xl border 
        ${isUrgent 
          ? 'border-rose-500/50 shadow-[0_0_30px_-5px_rgba(244,63,94,0.35)]' 
          : 'border-amber-500/40 shadow-[0_0_25px_-5px_rgba(245,158,11,0.25)]'
        }
        hover:scale-[1.015] hover:border-cyan-400/60
      `}
    >
      {/* Active Scan-line tracing card borders on hover */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-pulse" />
        <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-purple-400 to-transparent animate-pulse" />
      </div>

      {/* Pulsing red/amber beacon blur */}
      <div
        className={`absolute -right-10 -top-10 w-28 h-28 rounded-full blur-2xl pointer-events-none transition-opacity
          ${isUrgent ? 'bg-rose-600/30' : 'bg-amber-600/25'}
        `}
      />

      <div className="relative z-10 flex justify-between items-start mb-3">
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded-lg ${isUrgent ? 'bg-rose-500/20 text-rose-400' : 'bg-amber-500/20 text-amber-400'}`}>
            <AlertTriangle className="w-4 h-4" />
          </div>
          <span className={`text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 ${isUrgent ? 'text-rose-300' : 'text-amber-300'}`}>
            <span className={`w-2 h-2 rounded-full ${isUrgent ? 'bg-rose-500 animate-ping shadow-[0_0_8px_#f43f5e]' : 'bg-amber-400 shadow-[0_0_8px_#fbbf24]'}`} />
            {priority} PRIORITY FEED
          </span>
        </div>
        <div className="flex items-center gap-1 text-slate-400 text-xs font-mono">
          <Clock className="w-3.5 h-3.5" />
          {timeAgo}
        </div>
      </div>

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-1">
          <h3 className="font-mono font-bold text-white text-base tracking-wide">CASE {caseId}</h3>
          <span className="font-mono text-[10px] text-cyan-400/80 group-hover:text-cyan-300 flex items-center gap-1">
            OPEN TELEMETRY <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
          </span>
        </div>
        <p className="text-xs text-slate-300 mb-3 line-clamp-2 leading-relaxed">{description}</p>
      </div>

      {/* Indicators */}
      <div className="relative z-10 bg-black/40 rounded-xl p-2.5 mb-3 border border-white/5">
        <p className="text-[10px] font-mono font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
          Critical Indicators
        </p>
        <div className="flex flex-wrap gap-1.5">
          {indicators.map((ind, i) => (
            <span key={i} className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-slate-300 flex items-center gap-1">
              <span className={`w-1 h-1 rounded-full ${isUrgent ? 'bg-rose-400' : 'bg-amber-400'}`} />
              {ind}
            </span>
          ))}
        </div>
      </div>

      {/* Action Footer */}
      <div className="relative z-10 flex items-center gap-2 pt-1">
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (onInspect) onInspect();
          }}
          className="flex-1 py-2 px-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-mono font-bold rounded-xl shadow-[0_0_15px_rgba(56,189,248,0.3)] transition-all flex items-center justify-center gap-1.5"
        >
          <Zap className="w-3.5 h-3.5 fill-current" />
          Inspect AI Telemetry
        </button>
      </div>
    </div>
  );
};
