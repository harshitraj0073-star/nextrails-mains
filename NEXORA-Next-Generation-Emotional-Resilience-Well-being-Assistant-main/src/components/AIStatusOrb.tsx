import React, { useEffect, useState, useMemo } from 'react';
import { useStore } from '../hooks/useStore';
import { useChatbot } from '../hooks/useChatbot';

export type OrbState = 'calm' | 'active' | 'alert';

export interface AIStatusOrbProps {
  /** Optional manual state override */
  stateOverride?: OrbState;
  /** Size variant: 'sm' (header compact), 'md' (standard), 'lg' (hero showcase) */
  size?: 'sm' | 'md' | 'lg';
  /** Whether to show the latency & core badge */
  showBadge?: boolean;
  /** Custom class names */
  className?: string;
  /** Custom label */
  label?: string;
}

export const AIStatusOrb: React.FC<AIStatusOrbProps> = ({
  stateOverride,
  size = 'sm',
  showBadge = true,
  className = '',
  label,
}) => {
  const { state: storeState } = useStore();
  const { stressResult, liveStressEstimate, isTyping } = useChatbot();

  // Dynamic latency simulation (micro-variations between 18ms and 28ms)
  const [latency, setLatency] = useState(24);
  const [isInputActive, setIsInputActive] = useState(false);

  // Monitor user interaction across inputs / textareas / sliders globally to trigger 'active/listening'
  useEffect(() => {
    let timeoutId: number;

    const handleFocusIn = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.getAttribute('role') === 'slider' ||
          target.getAttribute('contenteditable') === 'true')
      ) {
        setIsInputActive(true);
      }
    };

    const handleFocusOut = () => {
      timeoutId = window.setTimeout(() => {
        setIsInputActive(false);
      }, 600);
    };

    const handleInteraction = (e: Event) => {
      const target = e.target as HTMLElement;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.getAttribute('type') === 'range')
      ) {
        setIsInputActive(true);
        window.clearTimeout(timeoutId);
        timeoutId = window.setTimeout(() => {
          setIsInputActive(false);
        }, 1200);
      }
    };

    window.addEventListener('focusin', handleFocusIn);
    window.addEventListener('focusout', handleFocusOut);
    window.addEventListener('input', handleInteraction);

    const latencyInterval = window.setInterval(() => {
      setLatency(Math.floor(19 + Math.random() * 9));
    }, 4500);

    return () => {
      window.removeEventListener('focusin', handleFocusIn);
      window.removeEventListener('focusout', handleFocusOut);
      window.removeEventListener('input', handleInteraction);
      window.clearInterval(latencyInterval);
      window.clearTimeout(timeoutId);
    };
  }, []);

  // Compute the Orb State
  const computedState: OrbState = useMemo(() => {
    if (stateOverride) return stateOverride;

    // Check distress / alert thresholds:
    // 1. If any case has High / Urgent priority or alerts in store
    const hasUrgentCases = storeState.cases?.some(
      c => c.priority === 'High' || c.priority === 'Urgent' || c.distressScore >= 70
    );

    // 2. If recent stress result or live estimate is elevated (>= 60%)
    const isElevatedDistress =
      (stressResult && (stressResult.level === 'High' || stressResult.level === 'Critical' || stressResult.score >= 60)) ||
      (liveStressEstimate !== null && liveStressEstimate >= 60);

    if (isElevatedDistress || (storeState.role !== 'victim' && hasUrgentCases)) {
      return 'alert';
    }

    if (isInputActive || isTyping) {
      return 'active';
    }

    return 'calm';
  }, [stateOverride, storeState, stressResult, liveStressEstimate, isInputActive, isTyping]);

  // Dimension mapping
  const dim = {
    sm: {
      box: 'w-7 h-7',
      svg: 28,
      radius: 10,
      glowSpread: 'shadow-[0_0_16px_rgba(56,189,248,0.4)]',
      badgeText: 'text-[10px]',
    },
    md: {
      box: 'w-10 h-10',
      svg: 40,
      radius: 14,
      glowSpread: 'shadow-[0_0_24px_rgba(56,189,248,0.5)]',
      badgeText: 'text-xs',
    },
    lg: {
      box: 'w-16 h-16',
      svg: 64,
      radius: 22,
      glowSpread: 'shadow-[0_0_36px_rgba(56,189,248,0.6)]',
      badgeText: 'text-xs',
    },
  }[size];

  // Colors and config based on state
  const stateConfig = {
    calm: {
      statusLabel: 'CALM // IDLE',
      coreLabel: 'CORE: ACTIVE',
      badgeBorder: 'border-cyan-500/30 bg-cyan-950/40 text-cyan-300',
      badgeDot: 'bg-cyan-400 shadow-[0_0_6px_#38bdf8]',
      primaryGlow: 'rgba(6, 182, 212, 0.65)',
      secondaryGlow: 'rgba(56, 189, 248, 0.45)',
      deepColor: '#0e7490',
      brightColor: '#38bdf8',
      particleColor: '#a5f3fc',
      pulseClass: 'nexora-orb-calm',
      rippleClass: 'nexora-ripple-calm',
    },
    active: {
      statusLabel: 'SYNAPSE: LISTENING',
      coreLabel: 'INPUT ENGAGED',
      badgeBorder: 'border-sky-400/50 bg-sky-950/60 text-sky-200',
      badgeDot: 'bg-sky-400 shadow-[0_0_8px_#38bdf8]',
      primaryGlow: 'rgba(56, 189, 248, 0.85)',
      secondaryGlow: 'rgba(129, 140, 248, 0.6)',
      deepColor: '#2563eb',
      brightColor: '#60a5fa',
      particleColor: '#e0f2fe',
      pulseClass: 'nexora-orb-active',
      rippleClass: 'nexora-ripple-active',
    },
    alert: {
      statusLabel: 'DISTRESS ELEVATED',
      coreLabel: 'ALERT: THRESHOLD',
      badgeBorder: 'border-amber-500/50 bg-amber-950/50 text-amber-200',
      badgeDot: 'bg-rose-400 shadow-[0_0_8px_#fb7185]',
      primaryGlow: 'rgba(244, 63, 94, 0.8)',
      secondaryGlow: 'rgba(245, 158, 11, 0.65)',
      deepColor: '#e11d48',
      brightColor: '#fb923c',
      particleColor: '#fed7aa',
      pulseClass: 'nexora-orb-alert',
      rippleClass: 'nexora-ripple-alert',
    },
  }[computedState];

  return (
    <div
      className={`inline-flex items-center gap-3 relative select-none z-20 ${className}`}
      role="status"
      aria-label={`Sentient AI Status: ${computedState}`}
    >
      {/* Orb Nucleus Container */}
      <div className={`relative flex items-center justify-center shrink-0 ${dim.box}`}>
        {/* Soft ripple wave rings (State-driven) */}
        <div
          className={`absolute inset-0 rounded-full pointer-events-none transition-all duration-700 ${stateConfig.rippleClass}`}
          style={{
            borderColor: stateConfig.primaryGlow,
          }}
        />
        <div
          className={`absolute -inset-1 rounded-full pointer-events-none opacity-40 transition-all duration-700 ${stateConfig.rippleClass}`}
          style={{
            borderColor: stateConfig.secondaryGlow,
            animationDelay: computedState === 'active' ? '-0.35s' : '-1.5s',
          }}
        />

        {/* Ambient atmospheric aura behind the sphere */}
        <div
          className="absolute inset-0 rounded-full blur-md opacity-75 transition-colors duration-700"
          style={{
            backgroundColor: stateConfig.secondaryGlow,
          }}
        />

        {/* SVG Sentient Sphere */}
        <svg
          width={dim.svg}
          height={dim.svg}
          viewBox={`0 0 ${dim.svg} ${dim.svg}`}
          className={`relative z-10 transition-transform duration-500 ${stateConfig.pulseClass}`}
        >
          <defs>
            {/* Primary Radial Sphere Gradient */}
            <radialGradient
              id={`orbGrad-${computedState}`}
              cx="35%"
              cy="35%"
              r="65%"
              fx="28%"
              fy="28%"
            >
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
              <stop offset="30%" stopColor={stateConfig.brightColor} stopOpacity="0.9" />
              <stop offset="75%" stopColor={stateConfig.deepColor} stopOpacity="0.85" />
              <stop offset="100%" stopColor="#030712" stopOpacity="0.95" />
            </radialGradient>

            {/* Inner Core Plasma Gradient */}
            <radialGradient id={`plasmaGrad-${computedState}`} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
              <stop offset="45%" stopColor={stateConfig.brightColor} stopOpacity="0.8" />
              <stop offset="100%" stopColor="transparent" stopOpacity="0" />
            </radialGradient>

            {/* Subtle Filter for Photonic Sheen */}
            <filter id="photonicSheen" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="1.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Outer Halo Rim */}
          <circle
            cx={dim.svg / 2}
            cy={dim.svg / 2}
            r={dim.radius + 1.5}
            fill="none"
            stroke={stateConfig.primaryGlow}
            strokeWidth="1.2"
            strokeDasharray={computedState === 'active' ? '4 2' : 'none'}
            className={computedState === 'active' ? 'animate-spin' : ''}
            style={{ animationDuration: '6s', transformOrigin: 'center' }}
          />

          {/* Base Orb Body */}
          <circle
            cx={dim.svg / 2}
            cy={dim.svg / 2}
            r={dim.radius}
            fill={`url(#orbGrad-${computedState})`}
            filter="url(#photonicSheen)"
          />

          {/* Glowing Inner Core Plasma Spark */}
          <circle
            cx={dim.svg / 2 - dim.radius * 0.22}
            cy={dim.svg / 2 - dim.radius * 0.22}
            r={dim.radius * 0.42}
            fill={`url(#plasmaGrad-${computedState})`}
            opacity={0.85}
          />

          {/* Specular Highlight Point */}
          <ellipse
            cx={dim.svg / 2 - dim.radius * 0.35}
            cy={dim.svg / 2 - dim.radius * 0.35}
            rx={dim.radius * 0.18}
            ry={dim.radius * 0.1}
            transform={`rotate(-28 ${dim.svg / 2 - dim.radius * 0.35} ${dim.svg / 2 - dim.radius * 0.35})`}
            fill="#ffffff"
            opacity="0.9"
          />
        </svg>
      </div>

      {/* Accompanying Monospace Status Badge */}
      {showBadge && (
        <div
          className={`flex items-center gap-2 px-2.5 py-1 rounded-full border backdrop-blur-md transition-all duration-300 font-mono tracking-wider ${stateConfig.badgeBorder} ${dim.badgeText}`}
        >
          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${stateConfig.badgeDot}`} />
          <span className="font-semibold">{label || stateConfig.coreLabel}</span>
          <span className="opacity-40">//</span>
          <span className="opacity-80">LATENCY: {latency}ms</span>
        </div>
      )}
    </div>
  );
};
