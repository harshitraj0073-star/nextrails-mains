import React from 'react';
import { StressAnalysisResult } from '../services/stressAnalysisService';
import { 
  AlertTriangle, 
  CheckCircle2, 
  Activity, 
  PhoneCall, 
  Users, 
  X, 
  HeartHandshake, 
  Sparkles,
  ArrowRight,
  ShieldAlert
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../hooks/useStore';

interface StressReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: StressAnalysisResult | null;
  onStartNewChat?: () => void;
}

export const StressReportModal: React.FC<StressReportModalProps> = ({
  isOpen,
  onClose,
  result,
  onStartNewChat
}) => {
  const navigate = useNavigate();
  const { setRole } = useStore();

  if (!isOpen || !result) return null;

  const getScoreColor = (level: StressAnalysisResult['level']) => {
    switch (level) {
      case 'Critical':
        return {
          bg: 'bg-red-500',
          text: 'text-red-600',
          border: 'border-red-200',
          lightBg: 'bg-red-50',
          ring: 'stroke-red-500',
          badge: 'bg-red-100 text-red-700 border-red-300'
        };
      case 'High':
        return {
          bg: 'bg-orange-500',
          text: 'text-orange-600',
          border: 'border-orange-200',
          lightBg: 'bg-orange-50',
          ring: 'stroke-orange-500',
          badge: 'bg-orange-100 text-orange-700 border-orange-300'
        };
      case 'Moderate':
        return {
          bg: 'bg-amber-500',
          text: 'text-amber-600',
          border: 'border-amber-200',
          lightBg: 'bg-amber-50',
          ring: 'stroke-amber-500',
          badge: 'bg-amber-100 text-amber-700 border-amber-300'
        };
      default:
        return {
          bg: 'bg-emerald-500',
          text: 'text-emerald-600',
          border: 'border-emerald-200',
          lightBg: 'bg-emerald-50',
          ring: 'stroke-emerald-500',
          badge: 'bg-emerald-100 text-emerald-700 border-emerald-300'
        };
    }
  };

  const colors = getScoreColor(result.level);

  // SVG circle calculation
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (result.score / 100) * circumference;

  const handleConnectCounsellor = () => {
    setRole('victim');
    onClose();
    navigate('/victim');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-white dark:bg-slate-900 w-full max-w-xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-primary/10 rounded-lg text-primary">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800 dark:text-white flex items-center gap-2">
                NEXORA AI Stress Monitor
                <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300">
                  Assessment
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Calculated from {result.analyzedMessagesCount} message{result.analyzedMessagesCount === 1 ? '' : 's'} in this session
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-200/50 dark:hover:bg-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto p-6 space-y-6">
          
          {/* Main Score Hero */}
          <div className={`p-5 rounded-2xl border ${colors.border} ${colors.lightBg} dark:bg-slate-800/60 flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left`}>
            
            {/* Radial Gauge */}
            <div className="relative w-32 h-32 flex items-center justify-center shrink-0">
              <svg className="w-32 h-32 transform -rotate-90">
                <circle
                  cx="64"
                  cy="64"
                  r={radius}
                  className="stroke-slate-200 dark:stroke-slate-700"
                  strokeWidth="10"
                  fill="transparent"
                />
                <circle
                  cx="64"
                  cy="64"
                  r={radius}
                  className={`${colors.ring} transition-all duration-1000 ease-out`}
                  strokeWidth="10"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  fill="transparent"
                />
              </svg>
              <div className="absolute flex flex-col items-center justify-center">
                <span className={`text-3xl font-extrabold ${colors.text} tracking-tight`}>
                  {result.score}%
                </span>
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  Out of 100
                </span>
              </div>
            </div>

            {/* Score Headline & Summary */}
            <div className="space-y-1.5 flex-1">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold border uppercase tracking-wider ${colors.badge}`}>
                  {result.level} Stress Level
                </span>
              </div>
              <h4 className="text-base font-bold text-slate-800 dark:text-slate-100">
                {result.headline}
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                {result.summary}
              </p>
            </div>
          </div>

          {/* Emotional Tone Telemetry */}
          <div className="space-y-2.5">
            <h5 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              Emotional Tone Breakdown
            </h5>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              <div className="bg-slate-50 dark:bg-slate-800 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 text-center">
                <span className="text-[11px] text-slate-500 dark:text-slate-400 block font-medium">Anxiety</span>
                <span className="text-sm font-bold text-amber-600 dark:text-amber-400">{result.emotionalTone.anxiety}%</span>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 text-center">
                <span className="text-[11px] text-slate-500 dark:text-slate-400 block font-medium">Sadness</span>
                <span className="text-sm font-bold text-blue-600 dark:text-blue-400">{result.emotionalTone.sadness}%</span>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 text-center">
                <span className="text-[11px] text-slate-500 dark:text-slate-400 block font-medium">Frustration</span>
                <span className="text-sm font-bold text-rose-600 dark:text-rose-400">{result.emotionalTone.frustration}%</span>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 text-center">
                <span className="text-[11px] text-slate-500 dark:text-slate-400 block font-medium">Hope</span>
                <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">{result.emotionalTone.hope}%</span>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 text-center col-span-2 sm:col-span-1">
                <span className="text-[11px] text-slate-500 dark:text-slate-400 block font-medium">Calmness</span>
                <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{result.emotionalTone.calm}%</span>
              </div>
            </div>
          </div>

          {/* Key Triggers Detected */}
          <div className="space-y-2">
            <h5 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400">
              Key Stress Drivers Detected
            </h5>
            <div className="flex flex-wrap gap-1.5">
              {result.keyTriggers.map((trigger, i) => (
                <span 
                  key={i}
                  className="text-xs px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium flex items-center gap-1.5"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                  {trigger}
                </span>
              ))}
            </div>
          </div>

          {/* Recommendations Checklist */}
          <div className="space-y-2">
            <h5 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400 flex items-center gap-1.5">
              <HeartHandshake className="w-3.5 h-3.5 text-emerald-500" />
              NEXORA AI Recommendations
            </h5>
            <div className="space-y-2">
              {result.recommendations.map((rec, i) => (
                <div 
                  key={i}
                  className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>{rec}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Emergency Alert Hotline Banner if High or Critical */}
          {(result.level === 'High' || result.level === 'Critical') && (
            <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-xl p-3.5 flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-xs font-bold text-red-800 dark:text-red-300">
                  Immediate 24/7 National Mental Health Hotlines
                </p>
                <p className="text-[11px] text-red-700 dark:text-red-400 leading-normal">
                  Tele-MANAS Toll-Free: <strong>14416</strong> or <strong>1800 891 4416</strong> • Women Helpline: <strong>1091</strong>
                </p>
              </div>
            </div>
          )}

        </div>

        {/* Action Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            {onStartNewChat && (
              <button
                onClick={() => {
                  onClose();
                  onStartNewChat();
                }}
                className="w-full sm:w-auto px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              >
                Start New Chat
              </button>
            )}
            <button
              onClick={onClose}
              className="w-full sm:w-auto px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-700 dark:text-slate-400 transition-colors"
            >
              Close
            </button>
          </div>

          {result.counsellorRecommended && (
            <button
              onClick={handleConnectCounsellor}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-xl shadow-md transition-all transform hover:-translate-y-0.5"
            >
              <Users className="w-4 h-4" />
              Connect with Counsellor
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
