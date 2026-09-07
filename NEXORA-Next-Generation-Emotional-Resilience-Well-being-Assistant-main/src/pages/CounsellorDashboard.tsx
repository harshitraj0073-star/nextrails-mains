import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../hooks/useStore';
import { Case } from '../types';
import { TriageIntelligenceDrawer } from '../components/TriageIntelligenceDrawer';
import { DistressChart } from '../components/DistressChart';
import { Search, X, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PriorityBadge, TrendBadge, StageBadge } from '../components/StatusBadge';
import {
  ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, Radar,
} from 'recharts';

/* ─── Counting number (increments from 0 on mount) ───────── */
const CountUp: React.FC<{ target: number; color?: string; suffix?: string }> = ({ target, color = '#22d3ee', suffix = '' }) => {
  const [val, setVal] = useState(0);
  useEffect(() => {
    let v = 0;
    const step = target / 35;
    const id = setInterval(() => {
      v = Math.min(v + step, target);
      setVal(Math.round(v));
      if (v >= target) clearInterval(id);
    }, 28);
    return () => clearInterval(id);
  }, [target]);
  return <span style={{ color }}>{val}{suffix}</span>;
};

/* ─── Terminal Ticker ─────────────────────────────────────── */
const TICKER_LOGS = [
  '> ROUTING COUNSELLOR TO NODE 44... SUCCESS',
  '> DISTRESS ALERT: NODE 14569 // ESCALATING',
  '> AI CONFIDENCE SCORE: 97.4% // MATCH CONFIRMED',
  '> CASE 14568 INTERVENTION RECORDED // OK',
  '> TELE-MANAS BRIDGE ACTIVE // 3 SESSIONS LIVE',
  '> NEURAL SYNC: ALL NODES NOMINAL',
  '> CRITICAL: NODE 14571 FLAGGED FOR REVIEW',
  '> SYSTEM HEARTBEAT: 99.8% UPTIME // OK',
  '> ENCRYPTION LAYER VERIFIED // AES-256',
  '> 4 CHECK-INS COMPLETED THIS HOUR',
];

const TerminalTicker: React.FC = () => {
  const ref = useRef<HTMLDivElement>(null);
  return (
    <div className="relative overflow-hidden h-7 rounded-xl flex items-center"
      style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(34,211,238,0.08)' }}>
      <div className="flex items-center gap-8 shrink-0 whitespace-nowrap"
        style={{ animation: `tickerScroll ${TICKER_LOGS.length * 4}s linear infinite` }}>
        {[...TICKER_LOGS, ...TICKER_LOGS].map((log, i) => (
          <span key={i} className="font-mono text-[9px] tracking-widest px-4"
            style={{ color: log.includes('CRITICAL') || log.includes('ALERT') ? '#f43f5e' : 'rgba(34,211,238,0.5)' }}>
            {log}
          </span>
        ))}
      </div>
      {/* Fade edges */}
      <div className="absolute left-0 top-0 bottom-0 w-12 pointer-events-none"
        style={{ background: 'linear-gradient(to right, rgba(1,3,8,0.9), transparent)' }} />
      <div className="absolute right-0 top-0 bottom-0 w-12 pointer-events-none"
        style={{ background: 'linear-gradient(to left, rgba(1,3,8,0.9), transparent)' }} />
    </div>
  );
};

/* ─── Neural Link Row ─────────────────────────────────────── */
interface NeuralRowProps {
  c: Case;
  onSelect: (c: Case) => void;
}

const NeuralRow: React.FC<NeuralRowProps> = ({ c, onSelect }) => {
  const isUrgent = c.priority === 'Urgent' || c.priority === 'High';
  return (
    <div
      onClick={() => onSelect(c)}
      className="neural-row relative flex items-center gap-4 px-5 py-4 cursor-pointer group"
      role="button" tabIndex={0}
      onKeyDown={e => { if (e.key === 'Enter') onSelect(c); }}
    >
      {/* Crimson aura for critical rows */}
      {isUrgent && (
        <div className="absolute inset-0 pointer-events-none rounded-none anim-crimson-aura" />
      )}

      {/* Priority dot */}
      <div className="w-1.5 h-1.5 rounded-full shrink-0 mt-0.5"
        style={{
          background: c.priority === 'Urgent' ? '#f43f5e'
            : c.priority === 'High'   ? '#ef4444'
            : c.priority === 'Moderate' ? '#f59e0b' : '#10b981',
          boxShadow: isUrgent ? '0 0 8px rgba(244,63,94,0.8)' : 'none',
        }} />

      {/* Case ID */}
      <div className="w-28 shrink-0">
        <p className="font-mono text-xs font-bold text-white group-hover:text-cyan-300 transition-colors">{c.id}</p>
        {isUrgent && (
          <span className="font-mono text-[8px] tracking-[0.15em]"
            style={{ color: '#f43f5e', animation: 'dataBlink 1.5s infinite' }}>
            [ ACTION REQUIRED ]
          </span>
        )}
      </div>

      {/* District */}
      <div className="flex-1 min-w-0">
        <p className="tele text-[9px] truncate" style={{ color: 'rgba(255,255,255,0.35)' }}>{c.district}</p>
      </div>

      {/* Distress score bar */}
      <div className="w-24 hidden sm:block">
        <div className="h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
          <div className="h-full rounded-full transition-all"
            style={{
              width: `${c.distressScore}%`,
              background: c.distressScore > 60 ? '#f43f5e' : c.distressScore > 40 ? '#f59e0b' : '#10b981',
              boxShadow: c.distressScore > 60 ? '0 0 6px rgba(244,63,94,0.6)' : 'none',
            }} />
        </div>
        <span className="font-mono text-[8px]" style={{ color: 'rgba(255,255,255,0.25)' }}>{c.distressScore}%</span>
      </div>

      {/* Stage */}
      <div className="hidden md:block w-24">
        <StageBadge stage={c.caseStage} />
      </div>

      {/* Counsellor */}
      <div className="hidden lg:block w-24">
        <p className="tele text-[8px] truncate" style={{ color: 'rgba(255,255,255,0.25)' }}>{c.assignedCounsellor}</p>
      </div>

      {/* Trend + action */}
      <div className="flex items-center gap-2 shrink-0">
        <TrendBadge trend={c.distressTrend} />
        <button
          onClick={e => { e.stopPropagation(); onSelect(c); }}
          className="p-1.5 rounded-lg cursor-pointer transition-all opacity-0 group-hover:opacity-100"
          style={{ background: 'rgba(34,211,238,0.06)', border: '1px solid rgba(34,211,238,0.15)', color: '#22d3ee' }}
          title="AI Telemetry">
          <Zap className="w-3 h-3" />
        </button>
        <Link to={`/cases/${c.id}`} onClick={e => e.stopPropagation()}
          className="font-mono text-[8px] tracking-widest px-2 py-1 rounded-lg transition-all opacity-0 group-hover:opacity-100"
          style={{ border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.3)' }}>
          →
        </Link>
      </div>
    </div>
  );
};

/* ─── Radar Chart ─────────────────────────────────────────── */
const WellbeingRadar: React.FC<{ cases: Case[] }> = ({ cases }) => {
  const avg = (key: keyof Case) => Math.round(cases.reduce((a, c) => a + (Number(c[key]) || 0), 0) / (cases.length || 1));
  const data = [
    { subject: 'Sentiment',   A: 100 - avg('distressScore') },
    { subject: 'Stability',   A: cases.filter(c => c.priority === 'Low').length * 14 },
    { subject: 'Engagement',  A: cases.filter(c => c.timeline.length > 2).length * 18 },
    { subject: 'Recovery',    A: cases.filter(c => c.distressTrend === 'decreasing').length * 20 },
    { subject: 'Coping',      A: 62 },
    { subject: 'Social',      A: 57 },
  ];
  return (
    <ResponsiveContainer width="100%" height={200}>
      <RadarChart data={data}>
        <PolarGrid stroke="rgba(34,211,238,0.07)" />
        <PolarAngleAxis dataKey="subject" tick={{ fill: 'rgba(255,255,255,0.25)', fontSize: 9, fontFamily: 'monospace', letterSpacing: '0.1em' }} />
        <Radar name="Wellbeing" dataKey="A" stroke="rgba(34,211,238,0.7)" fill="rgba(34,211,238,0.08)" strokeWidth={1.5} />
      </RadarChart>
    </ResponsiveContainer>
  );
};

/* ─── Main ────────────────────────────────────────────────── */
export const CounsellorDashboard: React.FC = () => {
  const { state } = useStore();
  const [selectedCase, setSelectedCase] = useState<Case | null>(null);
  const [search, setSearch] = useState('');

  const counsellorName = 'Dr. A. Sharma';
  const myCases = state.role === 'admin' ? state.cases
    : state.cases.filter(c => c.assignedCounsellor === counsellorName || c.assignedCounsellor === 'Unassigned');

  const filtered = myCases.filter(c =>
    c.id.toLowerCase().includes(search.toLowerCase()) ||
    c.district.toLowerCase().includes(search.toLowerCase())
  );

  const highPriority  = myCases.filter(c => c.priority === 'High' || c.priority === 'Urgent').length;
  const avgDistress   = Math.round(myCases.reduce((a, c) => a + c.distressScore, 0) / (myCases.length || 1));
  const improving     = myCases.filter(c => c.distressTrend === 'decreasing').length;

  const trendData = [
    { date: new Date(Date.now() - 6 * 86400000).toISOString(), score: 42 },
    { date: new Date(Date.now() - 5 * 86400000).toISOString(), score: 38 },
    { date: new Date(Date.now() - 4 * 86400000).toISOString(), score: 45 },
    { date: new Date(Date.now() - 3 * 86400000).toISOString(), score: 52 },
    { date: new Date(Date.now() - 2 * 86400000).toISOString(), score: 58 },
    { date: new Date(Date.now() - 1 * 86400000).toISOString(), score: 55 },
    { date: new Date().toISOString(), score: avgDistress },
  ];

  return (
    <div className="space-y-5" style={{ animation: 'fadeUp 0.5s ease both' }}>

      {/* ── COMMAND STRIP ───────────────────────────────────────────────── */}
      <div className="relative rounded-2xl p-5 overflow-hidden"
        style={{ background: 'rgba(168,85,247,0.03)', border: '1px solid rgba(168,85,247,0.08)' }}>
        <div className="absolute inset-0 pointer-events-none opacity-[0.02]"
          style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 3px, #a855f7 3px, #a855f7 4px)' }} />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="tele" style={{ color: 'rgba(168,85,247,0.6)', letterSpacing: '0.25em' }}>
              TRIAGE INTELLIGENCE MATRIX // {counsellorName}
            </p>
            <h2 className="text-xl font-black text-white tracking-tight mt-1">Minority Report Feed</h2>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"
              style={{ boxShadow: '0 0 6px #34d399', animation: 'coreBreathe 2s ease-in-out infinite' }} />
            <span className="tele text-[9px]" style={{ color: 'rgba(16,185,129,0.7)' }}>LIVE MONITORING</span>
          </div>
        </div>
      </div>

      {/* ── KPI STRIP ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Active Cases',   value: myCases.length,   color: '#22d3ee' },
          { label: 'High Priority',  value: highPriority,     color: '#f43f5e' },
          { label: 'Avg Distress',   value: avgDistress,      color: '#f59e0b', suffix: '%' },
          { label: 'Improving',      value: improving,        color: '#10b981' },
        ].map(({ label, value, color, suffix }) => (
          <div key={label} className="rounded-2xl p-4 relative overflow-hidden"
            style={{ background: 'rgba(255,255,255,0.015)', border: '1px solid rgba(255,255,255,0.05)' }}>
            <div className="absolute inset-0 pointer-events-none opacity-[0.02]"
              style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 3px, #22d3ee 3px, #22d3ee 4px)' }} />
            <p className="relative z-10 text-2xl font-black" style={{ color, animation: 'countPulse 0.8s ease both' }}>
              <CountUp target={value} color={color} suffix={suffix ?? ''} />
            </p>
            <p className="relative z-10 tele text-[8px] mt-1" style={{ color: 'rgba(255,255,255,0.2)' }}>{label}</p>
          </div>
        ))}
      </div>

      {/* ── CHARTS ROW ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 rounded-2xl p-5 relative overflow-hidden"
          style={{ background: 'rgba(255,255,255,0.015)', border: '1px solid rgba(255,255,255,0.05)' }}>
          <div className="absolute inset-0 pointer-events-none opacity-[0.02]"
            style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 3px, #22d3ee 3px, #22d3ee 4px)' }} />
          <p className="relative z-10 tele mb-4" style={{ letterSpacing: '0.2em' }}>7-DAY DISTRESS TREND</p>
          <DistressChart data={trendData} />
        </div>
        <div className="rounded-2xl p-5 relative overflow-hidden"
          style={{ background: 'rgba(255,255,255,0.015)', border: '1px solid rgba(255,255,255,0.05)' }}>
          <div className="absolute inset-0 pointer-events-none opacity-[0.02]"
            style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 3px, #22d3ee 3px, #22d3ee 4px)' }} />
          <p className="relative z-10 tele mb-2" style={{ letterSpacing: '0.2em' }}>WELLBEING DIMENSIONS</p>
          <WellbeingRadar cases={myCases} />
        </div>
      </div>

      {/* ── NEURAL LINK FEED ─────────────────────────────────────────────── */}
      <div className="rounded-2xl overflow-hidden relative"
        style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.04)' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
          <div className="flex items-center gap-3">
            <p className="tele" style={{ letterSpacing: '0.2em' }}>
              NEURAL LINK INTELLIGENCE FEED
            </p>
            <span className="font-mono text-[8px] px-2 py-0.5 rounded-full"
              style={{ background: 'rgba(34,211,238,0.08)', border: '1px solid rgba(34,211,238,0.15)', color: '#22d3ee' }}>
              {filtered.length} ACTIVE
            </span>
          </div>
          <div className="relative">
            <Search className="w-3 h-3 text-white/25 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="SEARCH NODE OR DISTRICT..."
              className="pl-8 pr-3 py-1.5 font-mono text-[9px] tracking-widest rounded-xl bg-transparent text-white placeholder:text-white/15 outline-none"
              style={{ border: '1px solid rgba(255,255,255,0.06)', width: '220px' }}
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2">
                <X className="w-3 h-3 text-white/30" />
              </button>
            )}
          </div>
        </div>

        {/* Column heads */}
        <div className="flex items-center gap-4 px-5 py-2"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
          {['STATUS', 'CASE NODE', 'DISTRICT', 'DISTRESS', 'STAGE', 'CLINICIAN', 'TREND'].map(h => (
            <span key={h} className="tele text-[8px] shrink-0"
              style={{ color: 'rgba(255,255,255,0.15)', width: h === 'DISTRICT' ? 'auto' : h === 'STATUS' ? '8px' : undefined, flex: h === 'DISTRICT' ? '1' : undefined }}>
              {h}
            </span>
          ))}
        </div>

        {/* Rows */}
        <div>
          {filtered.map(c => (
            <NeuralRow key={c.id} c={c} onSelect={setSelectedCase} />
          ))}
          {filtered.length === 0 && (
            <div className="py-12 text-center tele" style={{ color: 'rgba(255,255,255,0.12)' }}>
              NO NODES MATCH TELEMETRY FILTER
            </div>
          )}
        </div>
      </div>

      {/* ── TERMINAL TICKER ──────────────────────────────────────────────── */}
      <TerminalTicker />

      {/* ── DRAWER ───────────────────────────────────────────────────────── */}
      <TriageIntelligenceDrawer
        selectedCase={selectedCase}
        onClose={() => setSelectedCase(null)}
      />
    </div>
  );
};


