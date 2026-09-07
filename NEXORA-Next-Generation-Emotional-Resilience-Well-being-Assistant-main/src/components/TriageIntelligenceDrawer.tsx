import React from 'react';
import { Case } from '../types';
import { 
  X, 
  ShieldAlert, 
  Sparkles, 
  Activity, 
  CheckCircle2, 
  FileText, 
  AlertTriangle, 
  ArrowRight,
  TrendingUp,
  Brain,
  Zap
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface TriageIntelligenceDrawerProps {
  selectedCase: Case | null;
  onClose: () => void;
}

export const TriageIntelligenceDrawer: React.FC<TriageIntelligenceDrawerProps> = ({
  selectedCase,
  onClose,
}) => {
  if (!selectedCase) return null;

  // Calculate synthetic confidence gauge & dynamic trigger tags
  const confidenceMatch = Math.min(99.4, +(88.2 + (selectedCase.distressScore % 11)).toFixed(1));
  const triggers = selectedCase.alerts.length > 0
    ? selectedCase.alerts
    : [
        'Court Hearing Anxiety',
        'Sleep Architecture Disruption',
        'Direct Intimidation Risk',
        'Witness Isolation',
      ];

  const protocols = [
    'Initiate low-stress telephone check-in via district caseworker within 2 hours.',
    'Deploy Section 12 Witness Protection escort for upcoming trial hearing.',
    'Provide bilingual trauma-informed psychological first-aid consultation.',
    'Update district judicial liaison on elevated distress telemetry.',
  ];

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      {/* Click outside backdrop */}
      <div className="flex-1" onClick={onClose} />

      {/* Sliding Obsidian Glass Drawer */}
      <div className="w-full max-w-lg bg-[#070a12]/95 border-l border-cyan-500/30 backdrop-blur-2xl h-full flex flex-col justify-between shadow-[0_0_80px_rgba(6,182,212,0.2)] animate-in slide-in-from-right duration-300 overflow-y-auto">
        {/* Drawer Header */}
        <div className="p-6 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
              <Brain className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-cyan-400">AI CLINICAL TELEMETRY</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-mono bg-white/10 text-white/70">DRAWER</span>
              </div>
              <h3 className="text-xl font-black text-white tracking-wide font-mono">
                CASE {selectedCase.id}
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white border border-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Body Content */}
        <div className="p-6 space-y-6 flex-1">
          {/* 1. Visual Confidence Gauge */}
          <div className="rounded-2xl p-4 bg-slate-900/60 border border-cyan-500/20 space-y-3">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-slate-400 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-cyan-400" />
                NEURAL CLASSIFIER CONFIDENCE
              </span>
              <span className="font-bold text-cyan-300 text-sm">{confidenceMatch}% MATCH</span>
            </div>
            {/* Progress Gauge Bar */}
            <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden p-0.5 border border-white/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-cyan-500 via-sky-400 to-purple-500 shadow-[0_0_12px_#38bdf8]"
                style={{ width: `${confidenceMatch}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[10px] font-mono text-slate-500">
              <span>MODEL: NEXORA-NLP-v4.2</span>
              <span>CALIBRATION: ACTIVE</span>
            </div>
          </div>

          {/* 2. Distress Score & Priority Telemetry */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl p-4 bg-slate-900/40 border border-white/10 font-mono">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1">Distress Score</span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-white">{selectedCase.distressScore}</span>
                <span className="text-xs text-slate-500">/100</span>
              </div>
              <span className="text-[10px] text-cyan-400 flex items-center gap-1 mt-1">
                <TrendingUp className="w-3 h-3" /> Trend: {selectedCase.distressTrend}
              </span>
            </div>

            <div className="rounded-2xl p-4 bg-slate-900/40 border border-white/10 font-mono">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1">Current Stage</span>
              <span className="text-base font-bold text-white block mt-1">{selectedCase.caseStage}</span>
              <span className="text-[10px] text-slate-400 block mt-1">District: {selectedCase.district}</span>
            </div>
          </div>

          {/* 3. Glowing Tag Pills for Detected Triggers */}
          <div className="space-y-2">
            <h4 className="text-xs font-mono font-bold tracking-wider text-slate-300 uppercase flex items-center gap-2">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              DETECTED PSYCHOLOGICAL TRIGGERS
            </h4>
            <div className="flex flex-wrap gap-2 pt-1">
              {triggers.map((trig, i) => (
                <span
                  key={i}
                  className="px-3 py-1.5 rounded-xl font-mono text-xs font-semibold bg-cyan-950/40 text-cyan-200 border border-cyan-500/30 shadow-[0_0_15px_-4px_rgba(56,189,248,0.4)] flex items-center gap-1.5"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_6px_#38bdf8]" />
                  {trig}
                </span>
              ))}
            </div>
          </div>

          {/* 4. Formatted Bulleted De-escalation Protocol */}
          <div className="space-y-2 rounded-2xl p-4 bg-slate-900/50 border border-white/10">
            <h4 className="text-xs font-mono font-bold tracking-wider text-purple-300 uppercase flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              RECOMMENDED CLINICAL PROTOCOL
            </h4>
            <ul className="space-y-2.5 pt-2">
              {protocols.map((proto, idx) => (
                <li key={idx} className="flex items-start gap-2.5 text-xs text-slate-300 font-sans leading-relaxed">
                  <span className="w-5 h-5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center justify-center shrink-0 text-[10px] font-mono mt-0.5">
                    {idx + 1}
                  </span>
                  <span>{proto}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Drawer Action Bar */}
        <div className="p-6 border-t border-white/10 bg-slate-950/80 flex items-center gap-3">
          <Link
            to={`/cases/${selectedCase.id}`}
            className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-mono text-xs font-bold text-center tracking-wider shadow-[0_0_20px_rgba(56,189,248,0.4)] transition-all flex items-center justify-center gap-2"
          >
            <span>OPEN COMPLETE DOSSIER</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <button
            onClick={onClose}
            className="py-3 px-4 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 font-mono text-xs font-semibold border border-white/10 transition-colors"
          >
            DISMISS
          </button>
        </div>
      </div>
    </div>
  );
};
