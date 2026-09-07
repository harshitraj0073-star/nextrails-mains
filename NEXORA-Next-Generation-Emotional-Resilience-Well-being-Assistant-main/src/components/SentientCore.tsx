import React from 'react';

export type SentientState =
  | 'dormant'
  | 'aware'
  | 'listening'
  | 'thinking'
  | 'calm'
  | 'concerned'
  | 'focused'
  | 'recovery'
  | 'alert';

interface SentientCoreProps {
  state?: SentientState;
  size?: number;
  className?: string;
  pulse?: number;
}

const stateColors: Record<SentientState, { accent: string; glow: string; inner: string }> = {
  dormant: { accent: '#7dd3fc', glow: 'rgba(125,211,252,0.26)', inner: '#dbeafe' },
  aware: { accent: '#67e8f9', glow: 'rgba(103,232,249,0.34)', inner: '#cffafe' },
  listening: { accent: '#a78bfa', glow: 'rgba(167,139,250,0.34)', inner: '#ede9fe' },
  thinking: { accent: '#5eead4', glow: 'rgba(94,234,212,0.32)', inner: '#d1fae5' },
  calm: { accent: '#8bd3ff', glow: 'rgba(139,211,255,0.3)', inner: '#e0f2fe' },
  concerned: { accent: '#fbbf24', glow: 'rgba(251,191,36,0.3)', inner: '#fef3c7' },
  focused: { accent: '#34d399', glow: 'rgba(52,211,153,0.34)', inner: '#d1fae5' },
  recovery: { accent: '#86efac', glow: 'rgba(134,239,172,0.34)', inner: '#dcfce7' },
  alert: { accent: '#fb7185', glow: 'rgba(251,113,133,0.34)', inner: '#ffe4e6' },
};

export const SentientCore: React.FC<SentientCoreProps> = ({
  state = 'aware',
  size = 260,
  className = '',
  pulse = 1,
}) => {
  const palette = stateColors[state];

  return (
    <div
      className={`sentient-core ${className}`.trim()}
      style={{
        width: size,
        height: size,
        ['--sentient-accent' as string]: palette.accent,
        ['--sentient-glow' as string]: palette.glow,
        ['--sentient-inner' as string]: palette.inner,
        ['--sentient-pulse' as string]: String(pulse),
      }}
      aria-label="NEXORA sentient core"
    >
      <svg viewBox="0 0 260 260" role="img" aria-hidden="true">
        <defs>
          <radialGradient id={`sentient-fill-${state}`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={palette.inner} stopOpacity="0.9" />
            <stop offset="28%" stopColor={palette.accent} stopOpacity="0.45" />
            <stop offset="100%" stopColor={palette.accent} stopOpacity="0" />
          </radialGradient>
        </defs>

        <circle cx="130" cy="130" r="106" fill={`url(#sentient-fill-${state})`} opacity="0.7" />

        <circle cx="130" cy="130" r="100" fill="none" stroke="rgba(148,163,184,0.25)" strokeWidth="1" />
        <circle cx="130" cy="130" r="83" fill="none" stroke={palette.accent} strokeOpacity="0.55" strokeWidth="1.2" strokeDasharray="8 10" />
        <circle cx="130" cy="130" r="65" fill="none" stroke={palette.accent} strokeOpacity="0.38" strokeWidth="1.2" strokeDasharray="3 12" />
        <circle cx="130" cy="130" r="48" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />

        {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => {
          const rad = (angle * Math.PI) / 180;
          const x = 130 + Math.cos(rad) * 92;
          const y = 130 + Math.sin(rad) * 92;
          return (
            <circle
              key={angle}
              cx={x}
              cy={y}
              r={angle % 90 === 0 ? 3.5 : 2.2}
              fill={palette.accent}
              opacity={0.7}
            />
          );
        })}

        <g opacity="0.8">
          <path d="M130 88C152 92 168 110 170 130C172 150 152 170 130 176C108 170 88 150 90 130C92 110 108 92 130 88Z" fill="none" stroke={palette.accent} strokeOpacity="0.6" strokeWidth="1.3" />
          <path d="M98 130H162M130 98V162" stroke={palette.inner} strokeOpacity="0.8" strokeWidth="1.1" />
          <circle cx="130" cy="130" r="24" fill={palette.inner} opacity="0.18" />
          <circle cx="130" cy="130" r="11" fill={palette.inner} opacity="0.9" />
        </g>
      </svg>
    </div>
  );
};
