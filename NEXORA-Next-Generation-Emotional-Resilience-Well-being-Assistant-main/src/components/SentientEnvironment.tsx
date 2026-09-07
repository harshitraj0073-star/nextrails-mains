import React from 'react';

interface SentientEnvironmentProps {
  mode?: 'patient' | 'counsellor' | 'admin';
  intensity?: number;
  children?: React.ReactNode;
}

const modeTheme = {
  patient: {
    glow: 'rgba(103,232,249,0.16)',
    accent: '#67e8f9',
    secondary: '#a78bfa',
  },
  counsellor: {
    glow: 'rgba(167,139,250,0.17)',
    accent: '#a78bfa',
    secondary: '#67e8f9',
  },
  admin: {
    glow: 'rgba(251,191,36,0.15)',
    accent: '#fbbf24',
    secondary: '#fda4af',
  },
};

export const SentientEnvironment: React.FC<SentientEnvironmentProps> = ({
  mode = 'patient',
  intensity = 1,
  children,
}) => {
  const theme = modeTheme[mode];

  return (
    <div
      className="sentient-environment"
      style={{
        ['--mode-glow' as string]: theme.glow,
        ['--mode-accent' as string]: theme.accent,
        ['--mode-secondary' as string]: theme.secondary,
        ['--mode-intensity' as string]: String(intensity),
      }}
    >
      <div className="sentient-noise" />
      <div className="sentient-radial" />
      <div className="sentient-grid" />
      {children}
    </div>
  );
};
