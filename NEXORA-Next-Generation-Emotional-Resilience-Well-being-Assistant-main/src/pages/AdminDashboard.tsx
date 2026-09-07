import React, { useState, useEffect } from 'react';
import { useStore } from '../hooks/useStore';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip, PieChart, Pie, Cell, BarChart, Bar, Legend,
} from 'recharts';

/* ─── Chart theme ─────────────────────────────────────────── */
const TT = {
  borderRadius: '12px',
  border: '1px solid rgba(34,211,238,0.12)',
  background: 'rgba(1,3,8,0.92)',
  fontSize: 10, fontFamily: 'monospace',
  color: '#e2e8f0',
};
const TICK = { fill: 'rgba(255,255,255,0.2)', fontSize: 9, fontFamily: 'monospace', letterSpacing: '0.08em' };

/* ─── Counting number ─────────────────────────────────────── */
const CountUp: React.FC<{ target: number; color?: string; suffix?: string; duration?: number }> = ({
  target, color = '#22d3ee', suffix = '', duration = 1200
}) => {
  const [val, setVal] = useState(0);
  useEffect(() => {
    let v = 0;
    const steps = 40;
    const dt = duration / steps;
    const step = target / steps;
    const id = setInterval(() => {
      v = Math.min(v + step, target);
      setVal(Math.round(v));
      if (v >= target) clearInterval(id);
    }, dt);
    return () => clearInterval(id);
  }, [target, duration]);
  return <span style={{ color, animation: 'countPulse 0.6s ease both' }}>{val}{suffix}</span>;
};

/* ─── Glowing Data Ring ───────────────────────────────────── */
const DataRing: React.FC<{
  value: number; total: number; label: string; sublabel: string;
  color: string; rgb: string;
}> = ({ value, total, label, sublabel, color, rgb }) => {
  const pct  = total > 0 ? value / total : 0;
  const R    = 48;
  const circ = 2 * Math.PI * R;
  const dash = circ * pct;

  return (
    <div className="flex flex-col items-center gap-3 p-5 rounded-2xl relative overflow-hidden"
      style={{ background: 'rgba(255,255,255,0.015)', border: '1px solid rgba(255,255,255,0.05)' }}>
      <div className="absolute inset-0 pointer-events-none opacity-[0.025]"
        style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 3px, #22d3ee 3px, #22d3ee 4px)' }} />

      <div className="relative w-28 h-28">
        {/* Background circle */}
        <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 112 112">
          <circle cx="56" cy="56" r={R} stroke="rgba(255,255,255,0.04)" strokeWidth="6" fill="none" />
          <circle cx="56" cy="56" r={R}
            stroke={color}
            strokeWidth="6"
            fill="none"
            strokeLinecap="round"
            strokeDasharray={`${dash} ${circ}`}
            style={{ filter: `drop-shadow(0 0 6px rgba(${rgb},0.7))`, transition: 'stroke-dasharray 1.2s ease' }}
          />
        </svg>
        {/* Center value */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-black" style={{ color }}>
            <CountUp target={value} color={color} />
          </span>
          <span className="tele text-[7px] mt-0.5" style={{ color: 'rgba(255,255,255,0.25)' }}>/ {total}</span>
        </div>
        {/* Outer glow ring */}
        <div className="absolute inset-0 rounded-full pointer-events-none"
          style={{ boxShadow: `0 0 20px -5px rgba(${rgb},0.25)`, borderRadius: '50%' }} />
      </div>

      <div className="text-center">
        <p className="font-bold text-white text-xs">{label}</p>
        <p className="tele text-[8px] mt-0.5" style={{ color: 'rgba(255,255,255,0.2)' }}>{sublabel}</p>
      </div>
    </div>
  );
};

/* ─── Terminal log feed ───────────────────────────────────── */
const LOGS = [
  { t: '09:42:18', msg: 'ROUTING COUNSELLOR TO NODE 44... SUCCESS',            lvl: 'ok'  },
  { t: '09:41:55', msg: 'DISTRESS ALERT: NODE 14569 // ESCALATING',             lvl: 'crit'},
  { t: '09:40:11', msg: 'AI CONFIDENCE: 97.4% // TRIAGE MATCH CONFIRMED',       lvl: 'ok'  },
  { t: '09:39:03', msg: 'CASE 14568 INTERVENTION RECORDED // OK',               lvl: 'ok'  },
  { t: '09:38:44', msg: 'CRITICAL ESCALATION: NODE 14571 FLAGGED',              lvl: 'crit'},
  { t: '09:37:20', msg: 'TELE-MANAS BRIDGE: 3 CONCURRENT SESSIONS ACTIVE',     lvl: 'ok'  },
  { t: '09:36:10', msg: 'ENCRYPTION LAYER VERIFIED // AES-256 HANDSHAKE OK',   lvl: 'ok'  },
  { t: '09:35:55', msg: 'NEW REGISTRATION: DISTRICT PUNE // PRIORITY: HIGH',   lvl: 'warn'},
  { t: '09:34:30', msg: 'SYSTEM HEARTBEAT: 99.8% UPTIME // ALL NODES OK',      lvl: 'ok'  },
  { t: '09:33:18', msg: 'INTER-DISTRICT TRANSFER: NAGPUR → MUMBAI COMPLETE',   lvl: 'ok'  },
];

const TerminalFeed: React.FC = () => (
  <div className="rounded-2xl overflow-hidden relative"
    style={{ background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(34,211,238,0.07)' }}>
    <div className="flex items-center gap-3 px-4 py-2.5" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"
        style={{ boxShadow: '0 0 6px #34d399', animation: 'coreBreathe 2s ease-in-out infinite' }} />
      <p className="tele text-[9px]" style={{ letterSpacing: '0.2em', color: 'rgba(34,211,238,0.5)' }}>
        SYSTEM COMMAND FEED // LIVE
      </p>
    </div>
    <div className="p-3 space-y-0.5 max-h-52 overflow-y-auto">
      {LOGS.map((l, i) => (
        <div key={i} className="flex items-start gap-3 py-1.5 rounded px-2 group hover:bg-white/[0.02] transition-colors">
          <span className="font-mono text-[8px] shrink-0" style={{ color: 'rgba(255,255,255,0.2)' }}>{l.t}</span>
          <span className="font-mono text-[9px] leading-relaxed"
            style={{
              color: l.lvl === 'crit' ? '#f43f5e'
                   : l.lvl === 'warn' ? '#f59e0b'
                   : 'rgba(34,211,238,0.55)',
              animation: l.lvl === 'crit' ? 'dataBlink 3s infinite' : 'none',
            }}>
            {l.msg}
          </span>
        </div>
      ))}
    </div>
  </div>
);

/* ─── Node cluster heatmap (constellation style) ──────────── */
const NodeHeatmap: React.FC<{ data: { label: string; value: number; x: number; y: number }[] }> = ({ data }) => {
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <div className="relative w-full h-48 overflow-hidden rounded-2xl"
      style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(34,211,238,0.06)' }}>
      {/* Grid mesh */}
      <div className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: 'linear-gradient(rgba(34,211,238,0.5) 1px, transparent 1px), linear-gradient(to right, rgba(34,211,238,0.5) 1px, transparent 1px)',
          backgroundSize: '32px 32px',
        }} />

      {/* Connection lines */}
      <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
        {data.map((a, i) =>
          data.slice(i + 1).map((b, j) => {
            const dist = Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
            if (dist > 28) return null;
            return (
              <line key={`${i}-${j}`}
                x1={`${a.x}%`} y1={`${a.y}%`}
                x2={`${b.x}%`} y2={`${b.y}%`}
                stroke="rgba(34,211,238,0.12)" strokeWidth="0.5" />
            );
          })
        )}
      </svg>

      {/* Nodes */}
      {data.map((d, i) => {
        const intensity = d.value / max;
        const r = 8 + intensity * 14;
        const color = intensity > 0.7 ? '244,63,94' : intensity > 0.4 ? '245,158,11' : '34,211,238';
        return (
          <div key={i}
            className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full flex items-center justify-center"
            style={{
              left: `${d.x}%`, top: `${d.y}%`,
              width: r * 2, height: r * 2,
              background: `radial-gradient(circle, rgba(${color},0.7) 0%, rgba(${color},0.1) 70%, transparent 100%)`,
              boxShadow: `0 0 ${r * 2}px rgba(${color},${0.3 + intensity * 0.4})`,
              animation: intensity > 0.6 ? `coreBreathe ${2 + intensity}s ease-in-out infinite` : 'none',
            }}
            title={d.label}>
            {intensity > 0.5 && (
              <span className="font-mono text-[7px] font-black text-white/80">{d.value}</span>
            )}
          </div>
        );
      })}
    </div>
  );
};

/* ─── Main Dashboard ──────────────────────────────────────── */
export const AdminDashboard: React.FC = () => {
  const { state } = useStore();
  const all = state.cases;

  const total     = all.length;
  const highRisk  = all.filter(c => c.priority === 'High' || c.priority === 'Urgent').length;
  const monitored = all.filter(c => c.timeline.length > 0).length;
  const resolved  = all.filter(c => c.priority === 'Low').length;
  const avgDist   = Math.round(all.reduce((a, c) => a + c.distressScore, 0) / (all.length || 1));

  const districts = [...new Set(all.map(c => c.district))];

  const districtData = districts.map(d => ({
    name: d.length > 10 ? d.slice(0, 10) + '…' : d,
    cases: all.filter(c => c.district === d).length,
    high:  all.filter(c => c.district === d && (c.priority === 'High' || c.priority === 'Urgent')).length,
  }));

  const priorityDist = [
    { name: 'Low',      value: all.filter(c => c.priority === 'Low').length,      color: '#10b981', rgb: '16,185,129'  },
    { name: 'Moderate', value: all.filter(c => c.priority === 'Moderate').length,  color: '#f59e0b', rgb: '245,158,11' },
    { name: 'High',     value: all.filter(c => c.priority === 'High').length,      color: '#ef4444', rgb: '239,68,68'  },
    { name: 'Urgent',   value: all.filter(c => c.priority === 'Urgent').length,    color: '#f43f5e', rgb: '244,63,94'  },
  ];

  const monthlyTrend = [
    { m: 'APR', reg: 12, int: 4,  res: 8  },
    { m: 'MAY', reg: 15, int: 6,  res: 10 },
    { m: 'JUN', reg: 18, int: 8,  res: 12 },
    { m: 'JUL', reg: 16, int: 7,  res: 11 },
    { m: 'AUG', reg: 20, int: 9,  res: 14 },
    { m: 'SEP', reg: total, int: all.reduce((a, c) => a + c.interventions.length, 0), res: resolved },
  ];

  // Node cluster positions (deterministic pseudo-random)
  const nodeData = districtData.map((d, i) => ({
    label: d.name,
    value: d.high,
    x: 10 + ((i * 23 + 7) % 80),
    y: 15 + ((i * 31 + 11) % 70),
  }));

  return (
    <div className="space-y-5" style={{ animation: 'fadeUp 0.5s ease both' }}>

      {/* ── COMMAND HEADER ──────────────────────────────────────────────── */}
      <div className="relative rounded-2xl p-5 overflow-hidden"
        style={{ background: 'rgba(251,191,36,0.02)', border: '1px solid rgba(251,191,36,0.07)' }}>
        <div className="absolute inset-0 pointer-events-none opacity-[0.02]"
          style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 3px, #fbbf24 3px, #fbbf24 4px)' }} />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="tele" style={{ color: 'rgba(251,191,36,0.55)', letterSpacing: '0.25em' }}>
              NODE NETWORK // STATE ANALYTICS COMMAND
            </p>
            <h2 className="text-xl font-black text-white tracking-tight mt-1">
              Global Command Center
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <select className="font-mono text-[9px] tracking-widest px-3 py-2 rounded-xl outline-none cursor-pointer"
              style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.4)' }}>
              <option>ALL DISTRICTS</option>
              {districts.map(d => <option key={d}>{d.toUpperCase()}</option>)}
            </select>
            <select className="font-mono text-[9px] tracking-widest px-3 py-2 rounded-xl outline-none cursor-pointer"
              style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.4)' }}>
              <option>LAST 30 DAYS</option>
              <option>LAST QUARTER</option>
              <option>YEAR TO DATE</option>
            </select>
          </div>
        </div>
      </div>

      {/* ── GLOWING DATA RINGS ──────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <DataRing value={total}     total={50}    label="Total Cases"   sublabel="REGISTERED NODES"       color="#22d3ee" rgb="34,211,238"  />
        <DataRing value={monitored} total={total} label="Monitored"     sublabel="ACTIVE AI TELEMETRY"    color="#10b981" rgb="16,185,129"  />
        <DataRing value={highRisk}  total={total} label="High Risk"     sublabel="URGENT + HIGH PRIORITY" color="#f43f5e" rgb="244,63,94"   />
        <DataRing value={avgDist}   total={100}   label="Avg Distress"  sublabel="COMPOSITE SCORE"        color="#f59e0b" rgb="245,158,11"  />
      </div>

      {/* ── 6-MONTH TREND + PRIORITY DONUT ──────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Area trend */}
        <div className="lg:col-span-2 rounded-2xl p-5 relative overflow-hidden"
          style={{ background: 'rgba(255,255,255,0.015)', border: '1px solid rgba(255,255,255,0.05)' }}>
          <div className="absolute inset-0 pointer-events-none opacity-[0.02]"
            style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 3px, #22d3ee 3px, #22d3ee 4px)' }} />
          <p className="relative z-10 tele mb-4" style={{ letterSpacing: '0.2em' }}>6-MONTH CASE TREND</p>
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyTrend} margin={{ top: 8, right: 10, left: -12, bottom: 0 }}>
                <defs>
                  <linearGradient id="ag-reg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#22d3ee" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#22d3ee" stopOpacity={0}   />
                  </linearGradient>
                  <linearGradient id="ag-res" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#10b981" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}   />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="m" axisLine={false} tickLine={false} tick={TICK} />
                <YAxis axisLine={false} tickLine={false} tick={TICK} />
                <Tooltip contentStyle={TT} />
                <Legend wrapperStyle={{ fontSize: 9, fontFamily: 'monospace', paddingTop: 10, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.12em' }} />
                <Area type="monotone" dataKey="reg" name="REGISTERED" stroke="#22d3ee" strokeWidth={1.5} fill="url(#ag-reg)" dot={{ r: 2.5, fill: '#22d3ee' }} />
                <Area type="monotone" dataKey="res" name="RESOLVED"   stroke="#10b981" strokeWidth={1.5} fill="url(#ag-res)" dot={{ r: 2.5, fill: '#10b981' }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Priority donut */}
        <div className="rounded-2xl p-5 relative overflow-hidden"
          style={{ background: 'rgba(255,255,255,0.015)', border: '1px solid rgba(255,255,255,0.05)' }}>
          <div className="absolute inset-0 pointer-events-none opacity-[0.02]"
            style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 3px, #22d3ee 3px, #22d3ee 4px)' }} />
          <p className="relative z-10 tele mb-3" style={{ letterSpacing: '0.2em' }}>PRIORITY DISTRIBUTION</p>
          <div className="h-[150px] relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={priorityDist} cx="50%" cy="50%" innerRadius={45} outerRadius={65}
                  paddingAngle={4} dataKey="value">
                  {priorityDist.map((e, i) => (
                    <Cell key={i} fill={e.color} style={{ filter: `drop-shadow(0 0 5px rgba(${e.rgb},0.6))` }} />
                  ))}
                </Pie>
                <Tooltip contentStyle={TT} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-black text-white"><CountUp target={total} /></span>
              <span className="tele text-[7px]" style={{ color: 'rgba(255,255,255,0.2)' }}>TOTAL</span>
            </div>
          </div>
          <div className="relative z-10 grid grid-cols-2 gap-1.5 mt-3">
            {priorityDist.map(p => (
              <div key={p.name} className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: p.color, boxShadow: `0 0 4px ${p.color}` }} />
                <span className="tele text-[8px]" style={{ color: 'rgba(255,255,255,0.25)' }}>{p.name}</span>
                <span className="font-black text-xs ml-auto" style={{ color: p.color }}>{p.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── DISTRICT BAR + NODE HEATMAP ─────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* District bar */}
        <div className="rounded-2xl p-5 relative overflow-hidden"
          style={{ background: 'rgba(255,255,255,0.015)', border: '1px solid rgba(255,255,255,0.05)' }}>
          <div className="absolute inset-0 pointer-events-none opacity-[0.02]"
            style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 3px, #22d3ee 3px, #22d3ee 4px)' }} />
          <p className="relative z-10 tele mb-4" style={{ letterSpacing: '0.2em' }}>CASES BY DISTRICT NODE</p>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={districtData} layout="vertical" margin={{ top: 0, right: 10, left: 4, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(255,255,255,0.04)" />
                <XAxis type="number" axisLine={false} tickLine={false} tick={TICK} />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={TICK} width={70} />
                <Tooltip contentStyle={TT} />
                <Bar dataKey="cases" name="TOTAL"    fill="#22d3ee" radius={[0,4,4,0]} barSize={7}
                  style={{ filter: 'drop-shadow(0 0 3px rgba(34,211,238,0.4))' }} />
                <Bar dataKey="high"  name="HIGH/URGENT" fill="#f43f5e" radius={[0,4,4,0]} barSize={7}
                  style={{ filter: 'drop-shadow(0 0 3px rgba(244,63,94,0.4))' }} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Node constellation heatmap */}
        <div className="rounded-2xl p-5 relative overflow-hidden space-y-3"
          style={{ background: 'rgba(255,255,255,0.015)', border: '1px solid rgba(255,255,255,0.05)' }}>
          <div className="absolute inset-0 pointer-events-none opacity-[0.02]"
            style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 3px, #22d3ee 3px, #22d3ee 4px)' }} />
          <p className="relative z-10 tele" style={{ letterSpacing: '0.2em' }}>DISTRESS NODE NETWORK</p>
          <p className="relative z-10 tele text-[8px]" style={{ color: 'rgba(255,255,255,0.15)' }}>
            CLUSTER SIZE = HIGH-RISK CONCENTRATION
          </p>
          <NodeHeatmap data={nodeData} />
          <div className="relative z-10 flex items-center gap-4 pt-1">
            {[['#10b981','LOW'], ['#f59e0b','MODERATE'], ['#f43f5e','CRITICAL']].map(([c, l]) => (
              <div key={l} className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: c, boxShadow: `0 0 4px ${c}` }} />
                <span className="tele text-[7px]" style={{ color: 'rgba(255,255,255,0.2)' }}>{l}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── TERMINAL FEED ────────────────────────────────────────────────── */}
      <TerminalFeed />

    </div>
  );
};

