import React from 'react';
import { Activity, Bot, FileText, LayoutDashboard, LogOut, Radio, Users, X } from 'lucide-react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useStore } from '../hooks/useStore';
import { cn } from '../utils/cn';

const ITEMS = [
  { label: 'Home', path: '/dashboard', icon: LayoutDashboard },
  { label: 'Signals', path: '/cases', icon: Radio },
  { label: 'Nexora AI', path: '/nexora-ai', icon: Bot },
  { label: 'Insights', path: '/analytics', icon: Activity },
  { label: 'Reports', path: '/reports', icon: FileText },
];

export const SpatialNav: React.FC<{ open: boolean; onClose: () => void }> = ({ open, onClose }) => {
  const { state, setRole } = useStore();
  const navigate = useNavigate();
  const role = state.role === 'admin' ? 'SYSTEM OBSERVATORY' : 'NEURAL COMMAND';
  const homePath = state.role === 'victim' ? '/victim' : '/dashboard';
  const logout = () => { setRole(null); navigate('/'); };

  return (
    <>
      {open && <button className="spatial-backdrop" onClick={onClose} aria-label="Close navigation" />}
      <aside className={cn('spatial-nav', open && 'spatial-nav-open')} aria-label="Spatial navigation">
        <div className="spatial-nav-header">
          <div className="brand-mark" aria-hidden="true"><span /></div>
          <div>
            <strong>NEXORA</strong>
            <small>{role}</small>
          </div>
          <button className="icon-button spatial-close" onClick={onClose} aria-label="Close navigation"><X size={16} /></button>
        </div>

        <div className="nav-orbit" aria-hidden="true"><span /><span /><span /></div>
        <p className="nav-section-label">NAVIGATE THE FIELD</p>

        <nav className="spatial-links">
          {ITEMS.map(({ label, path, icon: Icon }) => {
            const destination = label === 'Home' ? homePath : path;
            return (
              <NavLink
                key={path}
                to={destination}
                onClick={onClose}
                className={({ isActive }) => cn('spatial-link', isActive && 'spatial-link-active')}
              >
                <Icon size={16} />
                <span>{label}</span>
                <i />
              </NavLink>
            );
          })}
          {state.role === 'admin' && (
            <NavLink to="/settings" onClick={onClose} className="spatial-link">
              <Users size={16} />
              <span>Settings</span>
              <i />
            </NavLink>
          )}
        </nav>

        <div className="nav-footer">
          <div className="system-readout"><span className="status-dot" /> UPLINK STABLE <b>99.8%</b></div>
          <button className="spatial-exit" onClick={logout}><LogOut size={14} /> Disconnect</button>
        </div>
      </aside>
    </>
  );
};