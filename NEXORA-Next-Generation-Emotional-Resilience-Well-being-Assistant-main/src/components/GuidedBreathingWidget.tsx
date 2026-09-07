import React, { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, Heart, Sparkles, Wind } from 'lucide-react';

export const GuidedBreathingWidget: React.FC<{ className?: string }> = ({ className = '' }) => {
  const [isActive, setIsActive] = useState(false);
  const [phase, setPhase] = useState<'Inhale' | 'Hold' | 'Release'>('Inhale');
  const [countdown, setCountdown] = useState(4);
  const [cyclesCompleted, setCyclesCompleted] = useState(0);

  useEffect(() => {
    if (!isActive) return;

    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev > 1) {
          return prev - 1;
        }

        // Phase Transition: 4s Inhale -> 7s Hold -> 8s Release
        if (phase === 'Inhale') {
          setPhase('Hold');
          return 7;
        } else if (phase === 'Hold') {
          setPhase('Release');
          return 8;
        } else {
          setPhase('Inhale');
          setCyclesCompleted(c => c + 1);
          return 4;
        }
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isActive, phase]);

  const handleToggle = () => {
    setIsActive(!isActive);
  };

  const handleReset = () => {
    setIsActive(false);
    setPhase('Inhale');
    setCountdown(4);
    setCyclesCompleted(0);
  };

  // Dynamic Scale & Color Styling per Phase
  const phaseConfig = {
    Inhale: {
      label: 'INHALE (4s)',
      subtext: 'Breathe in gently through the nose',
      color: 'text-cyan-300',
      ringColor: 'stroke-cyan-400',
      glow: 'shadow-[0_0_35px_rgba(56,189,248,0.6)]',
      scale: 'scale-125',
      duration: 'duration-4000',
      strokeDashoffset: 0,
    },
    Hold: {
      label: 'HOLD (7s)',
      subtext: 'Keep stillness & soft awareness',
      color: 'text-purple-300',
      ringColor: 'stroke-purple-400',
      glow: 'shadow-[0_0_45px_rgba(168,85,247,0.7)] animate-pulse',
      scale: 'scale-125',
      duration: 'duration-7000',
      strokeDashoffset: 100,
    },
    Release: {
      label: 'RELEASE (8s)',
      subtext: 'Exhale slowly through the mouth',
      color: 'text-emerald-300',
      ringColor: 'stroke-emerald-400',
      glow: 'shadow-[0_0_25px_rgba(16,185,129,0.4)]',
      scale: 'scale-90',
      duration: 'duration-8000',
      strokeDashoffset: 250,
    },
  }[phase];

  return (
    <div className={`rounded-3xl bg-slate-950/70 border border-cyan-500/20 backdrop-blur-xl p-6 shadow-[0_0_40px_-10px_rgba(6,182,212,0.15)] flex flex-col items-center justify-between relative overflow-hidden select-none ${className}`}>
      {/* Ambient background aura */}
      <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/5 via-purple-500/5 to-transparent pointer-events-none" />

      {/* Header */}
      <div className="w-full flex items-center justify-between pb-3 border-b border-white/10 font-mono text-xs">
        <div className="flex items-center gap-2 text-cyan-300 font-bold">
          <Wind className="w-4 h-4 text-cyan-400" />
          <span>4-7-8 GROUNDING PROTOCOL</span>
        </div>
        <span className="text-[10px] text-slate-400 font-mono">
          CYCLES: <strong className="text-white">{cyclesCompleted}</strong>
        </span>
      </div>

      {/* Visual Breathing Sphere & Orbit */}
      <div className="relative my-6 flex items-center justify-center w-52 h-52">
        {/* Outer Pulsing Aura Ring */}
        <div
          className={`absolute w-40 h-40 rounded-full border border-cyan-500/30 transition-all ease-in-out ${isActive ? phaseConfig.duration : 'duration-500'} ${isActive ? phaseConfig.scale : 'scale-100'} ${phaseConfig.glow}`}
          style={{ transformOrigin: 'center' }}
        />

        {/* SVG Progress Ring */}
        <svg className="absolute w-48 h-48 -rotate-90 pointer-events-none" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r="44"
            fill="none"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth="3"
          />
          <circle
            cx="50"
            cy="50"
            r="44"
            fill="none"
            className={`${phaseConfig.ringColor} transition-all duration-1000 ease-linear`}
            strokeWidth="3.5"
            strokeDasharray="276"
            strokeDashoffset={isActive ? (countdown / (phase === 'Inhale' ? 4 : phase === 'Hold' ? 7 : 8)) * 276 : 0}
            strokeLinecap="round"
          />
        </svg>

        {/* Center Nucleus Content */}
        <div className="relative z-10 flex flex-col items-center justify-center text-center">
          <span className="text-4xl sm:text-5xl font-extrabold font-mono text-white tracking-tight leading-none mb-1">
            {countdown}
          </span>
          <span className={`text-xs font-mono font-bold tracking-wider uppercase ${phaseConfig.color}`}>
            {isActive ? phaseConfig.label : 'READY'}
          </span>
          <p className="text-[10px] font-sans text-slate-400 mt-1 max-w-[120px] leading-tight">
            {isActive ? phaseConfig.subtext : 'Tap start to begin resonance'}
          </p>
        </div>
      </div>

      {/* Control Buttons */}
      <div className="w-full flex items-center justify-center gap-3 pt-2">
        <button
          onClick={handleToggle}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-2xl font-mono text-xs font-bold tracking-wider transition-all transform hover:-translate-y-0.5 cursor-pointer ${
            isActive
              ? 'bg-amber-500/20 text-amber-200 border border-amber-400/40 hover:bg-amber-500/30'
              : 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-[0_0_20px_rgba(56,189,248,0.4)]'
          }`}
        >
          {isActive ? (
            <>
              <Pause className="w-3.5 h-3.5 fill-current" />
              PAUSE
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 fill-current" />
              START 4-7-8
            </>
          )}
        </button>

        <button
          onClick={handleReset}
          className="p-2.5 rounded-2xl bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          title="Reset"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
