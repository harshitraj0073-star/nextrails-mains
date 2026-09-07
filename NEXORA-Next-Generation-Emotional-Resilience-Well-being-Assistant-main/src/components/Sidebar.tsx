import React from 'react';
import { NavLink } from 'react-router-dom';
import { useStore } from '../hooks/useStore';
import {
  LayoutDashboard, Users, BellRing, Activity, FileText, Settings, Bot
} from 'lucide-react';
import { cn } from '../utils/cn';

const NAV_ITEMS = [
  { icon: LayoutDashboard, label: 'Dashboard',   path: '/dashboard'  },
  { icon: Bot,             label: 'NEXORA AI',   path: '/nexora-ai'  },
  { icon: Users,           label: 'Cases',       path: '/cases'      },
  { icon: BellRing,        label: 'Alerts',      path: '/alerts', badge: 3 },
  { icon: Activity,        label: 'Analytics',   path: '/analytics'  },
  { icon: FileText,        label: 'Reports',     path: '/reports'    },
];

export const Sidebar: React.FC = () => {
  const { state } = useStore();
  const isAdmin = state.role === 'admin';
  const items = isAdmin ? [...NAV_ITEMS, { icon: Settings, label: 'Settings', path: '/settings', badge: 0 }] : NAV_ITEMS;

  const roleColor = isAdmin ? '#fbbf24' : '#a855f7';
  const roleRgb   = isAdmin ? '251,191,36' : '168,85,247';

  return (
    <aside className="w-56 hidden md:flex flex-col min-h-screen shrink-0"
      style={{
        background: 'rgba(255,255,255,0.015)',
        backdropFilter: 'blur(20px)',
        borderRight: '1px solid rgba(255,255,255,0.04)',
      }}>
      {/* Top accent line */}
      <div className="h-px w-full" style={{ background: `linear-gradient(to right, transparent, rgba(${roleRgb},0.4), transparent)` }} />

      {/* Role badge */}
      <div className="px-5 pt-6 pb-4">
        <p className="tele text-[8px]" style={{ color: `rgba(${roleRgb},0.5)`, letterSpacing: '0.25em' }}>
          {isAdmin ? 'ADMIN NEXUS' : 'CLINICIAN NODE'}
        </p>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 space-y-0.5">
        {items.map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => cn(
              'neural-row flex items-center justify-between px-3 py-2.5 rounded-lg transition-all group font-mono text-[10px] tracking-widest uppercase',
              isActive
                ? 'text-white'
                : 'text-white/30 hover:text-white/70'
            )}
            style={({ isActive }) => ({
              background: isActive ? `rgba(${roleRgb},0.06)` : undefined,
              borderLeft: isActive ? `1px solid rgba(${roleRgb},0.4)` : '1px solid transparent',
            })}
          >
            <div className="flex items-center gap-3">
              <item.icon className="w-3.5 h-3.5 shrink-0" />
              <span>{item.label}</span>
            </div>
            {item.badge ? (
              <span className="text-[8px] font-black px-1.5 py-0.5 rounded-full"
                style={{ background: 'rgba(244,63,94,0.2)', color: '#f43f5e', border: '1px solid rgba(244,63,94,0.3)' }}>
                {item.badge}
              </span>
            ) : null}
          </NavLink>
        ))}
      </nav>

      {/* Bottom system status */}
      <div className="p-5 space-y-2">
        <div className="h-px w-full mb-3" style={{ background: 'rgba(255,255,255,0.04)' }} />
        {[
          { label: 'NEURAL NET', val: 'ONLINE', color: '#10b981' },
          { label: 'ENCRYPTION', val: 'AES-256', color: '#22d3ee' },
        ].map(({ label, val, color }) => (
          <div key={label} className="flex items-center justify-between">
            <span className="tele text-[8px]" style={{ color: 'rgba(255,255,255,0.15)' }}>{label}</span>
            <span className="font-mono text-[8px]" style={{ color }}>{val}</span>
          </div>
        ))}
      </div>

      {/* Bottom accent line */}
      <div className="h-px w-full" style={{ background: `linear-gradient(to right, transparent, rgba(${roleRgb},0.2), transparent)` }} />
    </aside>
  );
};
