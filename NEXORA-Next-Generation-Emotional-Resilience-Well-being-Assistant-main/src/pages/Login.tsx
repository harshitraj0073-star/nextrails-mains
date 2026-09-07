import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../hooks/useStore';
import { useTranslation } from '../utils/i18n';
import { AIChatbot } from '../components/AIChatbot';
import { SentientCore } from '../components/SentientCore';

const InitializeLink: React.FC<{ onClick: () => void }> = ({ onClick }) => {
  const [hovered, setHovered] = useState(false);

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="sentient-init-button"
      aria-label="Initialize NEXORA System Link"
    >
      <span className="sentient-init-border" style={{ opacity: hovered ? 1 : 0.7 }} />
      <span className="sentient-init-label">[ INITIATE ]</span>
    </button>
  );
};

interface PillarProps {
  role: 'victim' | 'counsellor' | 'admin';
  label: string;
  sublabel: string;
  description: string;
  accentColor: string;
  accentRgb: string;
  glowClass: string;
  isHovered: boolean;
  isAnyHovered: boolean;
  onHover: (r: string | null) => void;
  onClick: () => void;
  disabled: boolean;
}

const RolePillar: React.FC<PillarProps> = ({
  label, sublabel, description, accentColor, accentRgb, glowClass,
  isHovered, isAnyHovered, onHover, onClick, disabled,
}) => {
  const [typed, setTyped] = useState('');
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isHovered) {
      setTyped('');
      return;
    }
    setTyped('');
    let i = 0;
    const type = () => {
      if (i <= description.length) {
        setTyped(description.slice(0, i));
        i += 1;
        timerRef.current = window.setTimeout(type, 22);
      }
    };
    type();
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, [isHovered, description]);

  const opacity = isAnyHovered ? (isHovered ? 1 : 0.35) : 1;

  return (
    <div
      className="sentient-pillar"
      style={{
        opacity,
        borderColor: isHovered ? `rgba(${accentRgb}, 0.38)` : 'rgba(148, 163, 184, 0.15)',
        boxShadow: isHovered ? `0 0 60px rgba(${accentRgb},0.18)` : 'none',
      }}
      onMouseEnter={() => onHover(label)}
      onMouseLeave={() => onHover(null)}
      onClick={disabled ? undefined : onClick}
      role="button"
      tabIndex={0}
      aria-label={`Enter as ${label}`}
      onKeyDown={e => { if (e.key === 'Enter') onClick(); }}
    >
      <div className="sentient-pillar-orbit" style={{ borderColor: `rgba(${accentRgb}, 0.25)` }}>
        <span
          style={{
            background: `radial-gradient(circle, rgba(255,255,255,0.95), ${accentColor})`,
            boxShadow: `0 0 18px ${accentColor}`,
          }}
        />
      </div>
      <p className="sentient-pillar-kicker" style={{ color: `rgba(${accentRgb}, 0.9)` }}>{sublabel}</p>
      <h2 className={`sentient-pillar-name ${glowClass}`}>{label}</h2>
      <p className="sentient-pillar-copy" style={{ color: `rgba(${accentRgb}, 0.74)` }}>
        {typed}
        {isHovered && typed.length < description.length && <span className="cursor">_</span>}
      </p>
      <div className="sentient-pillar-tag">{isHovered ? '[ ENTER ]' : '— — —'}</div>
    </div>
  );
};

export const Login: React.FC = () => {
  const { setRole, state } = useStore();
  const t = useTranslation(state.language);
  const navigate = useNavigate();

  const [phase, setPhase] = useState<'awakening' | 'gateway'>('awakening');
  const [hoveredPillar, setHoveredPillar] = useState<string | null>(null);
  const [activeRole, setActiveRole] = useState<'victim' | 'counsellor' | 'admin' | null>(null);
  const [parallax, setParallax] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handle = (e: MouseEvent) => {
      const cx = window.innerWidth / 2;
      const cy = window.innerHeight / 2;
      setParallax({
        x: ((e.clientX - cx) / cx) * 14,
        y: ((e.clientY - cy) / cy) * 10,
      });
    };
    window.addEventListener('mousemove', handle);
    return () => window.removeEventListener('mousemove', handle);
  }, []);

  const handleLogin = (role: 'victim' | 'counsellor' | 'admin') => {
    if (activeRole) return;
    setActiveRole(role);
    setTimeout(() => {
      setRole(role);
      navigate(role === 'victim' ? '/victim' : '/dashboard');
    }, 450);
  };

  const pillars = [
    {
      role: 'victim' as const,
      label: 'Patient',
      sublabel: 'PATIENT NODE',
      description: 'EMOTIONAL SUPPORT // CONTEXTUAL CARE // AI-GUIDED RECOVERY // TRUSTED QUIET LISTENING',
      accentColor: '#67e8f9',
      accentRgb: '103,232,249',
      glowClass: 'glow-cyan',
    },
    {
      role: 'counsellor' as const,
      label: 'Counsellor',
      sublabel: 'COUNSELLOR NODE',
      description: 'CASE PATTERNING // SIGNAL INTELLIGENCE // ATTENTION MODEL // CLINICIAN SUPPORT',
      accentColor: '#a78bfa',
      accentRgb: '167,139,250',
      glowClass: 'glow-violet',
    },
    {
      role: 'admin' as const,
      label: 'Admin',
      sublabel: 'SYSTEM NODE',
      description: 'PORTFOLIO AWARENESS // NETWORK HEALTH // RESOURCE FLOW // PLATFORM OBSERVATION',
      accentColor: '#fbbf24',
      accentRgb: '251,191,36',
      glowClass: 'glow-amber',
    },
  ];

  if (phase === 'awakening') {
    return (
      <div className="sentient-awakening">
        <div className="sentient-awakening-header">NEXORA // SENTIENT AWARE // v2.0</div>
        <div className="sentient-awakening-core" style={{ transform: `translate(${parallax.x}px, ${parallax.y}px)` }}>
          <SentientCore state="aware" size={320} />
        </div>

        <div className="sentient-awakening-copy">
          <h1>
            NEXORA
            <span>I'm here.</span>
          </h1>
          <p>{t('login.privacyNotice') || 'Let’s understand what is happening.'}</p>
        </div>

        <InitializeLink onClick={() => setPhase('gateway')} />

        <div className="sentient-ripple-ring ring-one" />
        <div className="sentient-ripple-ring ring-two" />
        <div className="sentient-ripple-ring ring-three" />
        <AIChatbot />
      </div>
    );
  }

  return (
    <div className="sentient-gateway-shell">
      <div className="sentient-gateway-heading">
        <p className="sentient-gateway-kicker">NEXORA // SENSE ORIENTATION</p>
        <h2>Choose the mode of attention.</h2>
      </div>

      <div className="sentient-role-grid">
        {pillars.map((pillar) => (
          <RolePillar
            key={pillar.role}
            {...pillar}
            isHovered={hoveredPillar === pillar.label}
            isAnyHovered={hoveredPillar !== null}
            onHover={setHoveredPillar}
            onClick={() => handleLogin(pillar.role)}
            disabled={activeRole !== null}
          />
        ))}
      </div>

      <div className="sentient-footer-tags">
        {['E2E ENCRYPTED', 'GOVT. OF INDIA PORTAL', 'NHAA INTEGRATED'].map((tag) => (
          <span key={tag}>{tag}</span>
        ))}
      </div>

      <AIChatbot />
    </div>
  );
};
