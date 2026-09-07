import React, { useEffect, useState, useMemo } from 'react';
import { useStore } from '../hooks/useStore';
import { useChatbot } from '../hooks/useChatbot';
import { Sparkles, Activity, ShieldAlert, Cpu } from 'lucide-react';

export interface SentientAetherCoreProps {
  className?: string;
}

export const SentientAetherCore: React.FC<SentientAetherCoreProps> = ({ className = '' }) => {
  const { state: storeState } = useStore();
  const { stressResult, liveStressEstimate, isTyping } = useChatbot();

  // Dynamic telemetry metrics
  const [latency, setLatency] = useState(18);
  const [synapseRate, setSynapseRate] = useState(98.4);
  const [isInputActive, setIsInputActive] = useState(false);

  useEffect(() => {
    let timeoutId: number;

    const handleInteraction = (e: Event) => {
      const target = e.target as HTMLElement;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.getAttribute('type') === 'range' ||
          target.getAttribute('role') === 'slider')
      ) {
        setIsInputActive(true);
        window.clearTimeout(timeoutId);
        timeoutId = window.setTimeout(() => {
          setIsInputActive(false);
        }, 1500);
      }
    };

    window.addEventListener('input', handleInteraction);
    window.addEventListener('focusin', handleInteraction);

    const telemetryInterval = window.setInterval(() => {
      setLatency(Math.floor(16 + Math.random() * 6));
      setSynapseRate(+(97.5 + Math.random() * 2.3).toFixed(1));
    }, 3800);

    return () => {
      window.removeEventListener('input', handleInteraction);
      window.removeEventListener('focusin', handleInteraction);
      window.clearInterval(telemetryInterval);
      window.clearTimeout(timeoutId);
    };
  }, []);

  // Compute Distress & Mode
  const isHighDistress = useMemo(() => {
    if (stressResult && (stressResult.level === 'High' || stressResult.level === 'Critical' || stressResult.score >= 60)) {
      return true;
    }
    if (liveStressEstimate !== null && liveStressEstimate >= 60) {
      return true;
    }
    return storeState.cases?.some(c => c.priority === 'Urgent' || c.distressScore >= 75);
  }, [stressResult, liveStressEstimate, storeState.cases]);

  const mode = isHighDistress ? 'alert' : isInputActive || isTyping ? 'active' : 'calm';

  // State styling parameters
  const config = {
    calm: {
      themeClass: 'text-cyan-300 border-cyan-500/30',
      badgeBg: 'bg-cyan-950/50 border-cyan-500/30 text-cyan-200',
      glowColor: 'rgba(6, 182, 212, 0.45)',
      secondaryGlow: 'rgba(168, 85, 247, 0.3)',
      ring1Stroke: '#38bdf8',
      ring2Stroke: '#c084fc',
      ring3Stroke: '#22d3ee',
      speed1: '20s',
      speed2: '14s',
      coreGradStart: '#ffffff',
      coreGradMid: '#38bdf8',
      coreGradEnd: '#0369a1',
      statusText: 'SYNCHRONIZED',
      beaconDot: 'bg-cyan-400 shadow-[0_0_8px_#38bdf8]',
    },
    active: {
      themeClass: 'text-sky-300 border-sky-400/40',
      badgeBg: 'bg-sky-950/60 border-sky-400/40 text-sky-100',
      glowColor: 'rgba(56, 189, 248, 0.65)',
      secondaryGlow: 'rgba(129, 140, 248, 0.45)',
      ring1Stroke: '#60a5fa',
      ring2Stroke: '#818cf8',
      ring3Stroke: '#38bdf8',
      speed1: '9s',
      speed2: '6s',
      coreGradStart: '#ffffff',
      coreGradMid: '#60a5fa',
      coreGradEnd: '#1d4ed8',
      statusText: 'PROCESSING SYNAPSE',
      beaconDot: 'bg-sky-300 shadow-[0_0_12px_#60a5fa]',
    },
    alert: {
      themeClass: 'text-amber-300 border-rose-500/40',
      badgeBg: 'bg-rose-950/60 border-rose-500/40 text-amber-200',
      glowColor: 'rgba(244, 63, 94, 0.65)',
      secondaryGlow: 'rgba(245, 158, 11, 0.45)',
      ring1Stroke: '#fb7185',
      ring2Stroke: '#fb923c',
      ring3Stroke: '#f43f5e',
      speed1: '6s',
      speed2: '4s',
      coreGradStart: '#ffffff',
      coreGradMid: '#fb923c',
      coreGradEnd: '#be123c',
      statusText: 'HIGH AROUSAL DETECTED',
      beaconDot: 'bg-rose-500 shadow-[0_0_12px_#f43f5e] animate-ping',
    },
  }[mode];

  return (
    <div className={`relative overflow-hidden rounded-3xl bg-slate-950/70 backdrop-blur-xl border border-cyan-500/20 shadow-[0_0_50px_-12px_rgba(6,182,212,0.15)] p-6 sm:p-8 transition-all duration-700 select-none ${className}`}>
      {/* Background ambient energetic burst */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full blur-3xl pointer-events-none transition-colors duration-700"
        style={{
          background: `radial-gradient(circle, ${config.glowColor} 0%, ${config.secondaryGlow} 50%, transparent 80%)`,
        }}
      />

      {/* Cybernetic telemetry watermark */}
      <div className="absolute top-3 right-4 font-mono text-[9px] tracking-widest text-white/20 uppercase pointer-events-none">
        AETHER-COCKPIT // PROTOCOL 0x7E
      </div>

      <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6 md:gap-8">
        {/* Left Telemetry Cluster */}
        <div className="flex flex-col items-center md:items-start space-y-2 text-center md:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-semibold tracking-wider bg-white/5 border border-white/10 text-cyan-300 backdrop-blur-md">
            <Cpu className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            SENTIENCE ENGINE: ACTIVE (v4.2)
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white font-mono flex items-center gap-2">
            AETHER NUCLEUS
            <span className={`w-2 h-2 rounded-full ${config.beaconDot}`} />
          </h2>
          <p className="text-xs text-slate-400 font-mono max-w-xs leading-relaxed">
            Continuous quantum empathic observer tracking physiological telemetry & distress markers.
          </p>
        </div>

        {/* Center: Interactive 3D Orbiting Aether Core */}
        <div className="relative w-44 h-44 sm:w-52 sm:h-52 flex items-center justify-center shrink-0">
          {/* Outermost Gyroscopic Orbit Ring */}
          <svg
            className="absolute inset-0 w-full h-full animate-spin pointer-events-none"
            viewBox="0 0 200 200"
            style={{ animationDuration: config.speed1, transformOrigin: 'center' }}
          >
            <ellipse
              cx="100"
              cy="100"
              rx="88"
              ry="38"
              fill="none"
              stroke={config.ring1Stroke}
              strokeWidth="1.2"
              strokeDasharray="12 6 4 6"
              strokeOpacity="0.75"
              transform="rotate(30 100 100)"
            />
          </svg>

          {/* Counter-Rotating Gyroscopic Ring */}
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none"
            viewBox="0 0 200 200"
            style={{
              animation: `spinCounter ${config.speed2} linear infinite`,
              transformOrigin: 'center',
            }}
          >
            <ellipse
              cx="100"
              cy="100"
              rx="80"
              ry="34"
              fill="none"
              stroke={config.ring2Stroke}
              strokeWidth="1.4"
              strokeDasharray="24 10 8 10"
              strokeOpacity="0.8"
              transform="rotate(-40 100 100)"
            />
          </svg>

          {/* Third Equatorial Ring */}
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none"
            viewBox="0 0 200 200"
            style={{
              animation: `spinClockwise ${config.speed1} linear infinite`,
              transformOrigin: 'center',
            }}
          >
            <circle
              cx="100"
              cy="100"
              r="62"
              fill="none"
              stroke={config.ring3Stroke}
              strokeWidth="1"
              strokeDasharray="6 8"
              strokeOpacity="0.6"
            />
          </svg>

          {/* Central Pulsating Plasma Sphere */}
          <div className="relative z-10 w-24 h-24 rounded-full flex items-center justify-center">
            {/* Plasma Radial Glow */}
            <div
              className={`absolute inset-0 rounded-full blur-md opacity-85 transition-transform duration-700 ${mode === 'alert' ? 'nexora-orb-alert' : mode === 'active' ? 'nexora-orb-active' : 'nexora-orb-calm'}`}
              style={{ background: config.glowColor }}
            />

            <svg width="96" height="96" viewBox="0 0 96 96" className={`relative z-10 ${mode === 'alert' ? 'nexora-orb-alert' : mode === 'active' ? 'nexora-orb-active' : 'nexora-orb-calm'}`}>
              <defs>
                <radialGradient id="aetherCoreGrad" cx="35%" cy="35%" r="65%" fx="25%" fy="25%">
                  <stop offset="0%" stopColor={config.coreGradStart} stopOpacity="1" />
                  <stop offset="35%" stopColor={config.coreGradMid} stopOpacity="0.9" />
                  <stop offset="85%" stopColor={config.coreGradEnd} stopOpacity="0.95" />
                  <stop offset="100%" stopColor="#020617" stopOpacity="1" />
                </radialGradient>
                <radialGradient id="aetherPlasmaGrad" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
                  <stop offset="40%" stopColor={config.coreGradMid} stopOpacity="0.8" />
                  <stop offset="100%" stopColor="transparent" stopOpacity="0" />
                </radialGradient>
              </defs>

              {/* Sphere Body */}
              <circle cx="48" cy="48" r="36" fill="url(#aetherCoreGrad)" />
              {/* Core Glow */}
              <circle cx="44" cy="44" r="16" fill="url(#aetherPlasmaGrad)" opacity="0.85" />
              {/* Specular Highlight */}
              <ellipse cx="38" cy="38" rx="7" ry="3.5" transform="rotate(-30 38 38)" fill="#ffffff" opacity="0.9" />
            </svg>
          </div>
        </div>

        {/* Right Telemetry Cluster: Live Diagnostic Badges */}
        <div className="flex flex-col gap-2.5 w-full md:w-auto items-center md:items-end">
          <div className={`px-3.5 py-1.5 rounded-full border backdrop-blur-md font-mono text-xs tracking-wider flex items-center gap-2 ${config.badgeBg} transition-all duration-300`}>
            <span className={`w-2 h-2 rounded-full ${config.beaconDot}`} />
            <span>NEURAL MESH: {config.statusText}</span>
          </div>

          <div className="px-3.5 py-1.5 rounded-full border border-white/10 bg-slate-900/60 text-slate-300 font-mono text-xs tracking-wider flex items-center gap-2">
            <Activity className="w-3.5 h-3.5 text-cyan-400" />
            <span>LATENCY: {latency}ms</span>
            <span className="text-white/30">//</span>
            <span className="text-emerald-400">{synapseRate}% SYNAPSE</span>
          </div>

          <div className="px-3.5 py-1.5 rounded-full border border-purple-500/30 bg-purple-950/40 text-purple-200 font-mono text-xs tracking-wider flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            <span>HEURISTIC: ZERO-DRIFT</span>
          </div>
        </div>
      </div>
    </div>
  );
};
