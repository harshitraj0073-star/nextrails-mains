import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../hooks/useStore';
import { LogOut, Menu } from 'lucide-react';

const MiniNucleus: React.FC = () => (
  <div className="sentient-mini-core" aria-hidden="true">
    <span className="sentient-mini-ring ring-one" />
    <span className="sentient-mini-ring ring-two" />
    <span className="sentient-mini-core-dot" />
  </div>
);

export const Header: React.FC<{ onMenu?: () => void }> = ({ onMenu }) => {
  const { state, setRole } = useStore();
  const navigate = useNavigate();
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const handleLogout = () => {
    setRole(null as any);
    navigate('/');
  };

  const roleLabel = state.role === 'victim' ? 'SURVIVOR NODE'
    : state.role === 'counsellor' ? 'CLINICIAN NODE'
    : 'COMMAND NEXUS';

  const roleColor = state.role === 'victim' ? '#67e8f9'
    : state.role === 'counsellor' ? '#a78bfa'
    : '#fbbf24';

  return (
    <header className="sentient-header">
      <div className="sentient-header-brand">
        <MiniNucleus />
        <div>
          <span className="sentient-brand-mark">NEXORA</span>
          <p className="sentient-micro-label" style={{ color: roleColor }}>{roleLabel}</p>
        </div>
      </div>

      <div className="sentient-header-telemetry">
        {[
          { label: 'UPLINK', val: '99.8%', color: '#34d399' },
          { label: 'LATENCY', val: '12ms', color: '#67e8f9' },
          { label: 'AI ENGINE', val: 'ACTIVE', color: '#a78bfa' },
        ].map(({ label, val, color }) => (
          <div key={label} className="sentient-telemetry-item">
            <p className="sentient-micro-label">{label}</p>
            <p className="sentient-telemetry-value" style={{ color }}>{val}</p>
          </div>
        ))}
      </div>

      <div className="sentient-header-actions">
        <div className="sentient-clock hidden sm:block">
          <p className="sentient-clock-time">{time.toLocaleTimeString('en-IN', { hour12: false })}</p>
          <p className="sentient-micro-label">{time.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }).toUpperCase()}</p>
        </div>

        <button onClick={handleLogout} className="sentient-exit-button" title="Disconnect">
          <LogOut className="w-3 h-3" />
          <span className="hidden sm:inline">EXIT</span>
        </button>

        <button className="mobile-menu-button" onClick={onMenu} aria-label="Open spatial navigation">
          <Menu className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
};
