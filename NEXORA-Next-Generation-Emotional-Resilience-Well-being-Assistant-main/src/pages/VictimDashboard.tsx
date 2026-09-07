import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from '../utils/i18n';
import { useStore } from '../hooks/useStore';
import { useChatbot } from '../hooks/useChatbot';
import { CheckInChat } from '../components/CheckInChat';
import { StressReportModal } from '../components/StressReportModal';
import { ConsultDoctorModal, DOCTORS_LIST } from '../components/ConsultDoctorModal';
import { PhoneCall, Users, Bot, ArrowRight, Stethoscope, Star, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

/* ─── Typewriter hook ─────────────────────────────────────── */
function useTypewriter(text: string, speed = 22, active = true): string {
  const [out, setOut] = useState('');
  useEffect(() => {
    if (!active || !text) { setOut(''); return; }
    setOut('');
    let i = 0;
    const id = setInterval(() => {
      i++;
      setOut(text.slice(0, i));
      if (i >= text.length) clearInterval(id);
    }, speed);
    return () => clearInterval(id);
  }, [text, speed, active]);
  return out;
}

/* ─── Live Sine Waveform HUD ──────────────────────────────── */
const SineWaveformHUD: React.FC<{ intensity: number }> = ({ intensity }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef   = useRef<number>(0);
  const phaseRef  = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const draw = () => {
      const W = canvas.offsetWidth, H = canvas.offsetHeight;
      canvas.width  = W * (window.devicePixelRatio || 1);
      canvas.height = H * (window.devicePixelRatio || 1);
      ctx.scale(window.devicePixelRatio || 1, window.devicePixelRatio || 1);

      ctx.clearRect(0, 0, W, H);
      phaseRef.current += 0.05 + intensity * 0.004;

      const amp   = 6 + intensity * 0.22;
      const freq  = 0.018 + intensity * 0.0008;
      const color = intensity > 65 ? '244,63,94' : intensity > 40 ? '251,191,36' : '34,211,238';

      ctx.beginPath();
      for (let x = 0; x <= W; x += 2) {
        const y = H / 2 + amp * Math.sin(x * freq + phaseRef.current)
                         + (amp * 0.4) * Math.sin(x * freq * 2.3 + phaseRef.current * 1.7);
        x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      const grad = ctx.createLinearGradient(0, 0, W, 0);
      grad.addColorStop(0,    `rgba(${color},0)`);
      grad.addColorStop(0.2,  `rgba(${color},0.8)`);
      grad.addColorStop(0.8,  `rgba(${color},0.8)`);
      grad.addColorStop(1,    `rgba(${color},0)`);
      ctx.strokeStyle = grad;
      ctx.lineWidth   = 1.5;
      ctx.shadowColor = `rgba(${color},0.6)`;
      ctx.shadowBlur  = 6;
      ctx.stroke();

      // Mirror wave (faint)
      ctx.beginPath();
      for (let x = 0; x <= W; x += 2) {
        const y = H / 2 - (amp * 0.4) * Math.sin(x * freq * 1.6 + phaseRef.current * 0.8);
        x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.strokeStyle = `rgba(${color},0.2)`;
      ctx.lineWidth   = 1;
      ctx.shadowBlur  = 0;
      ctx.stroke();

      animRef.current = requestAnimationFrame(draw);
    };

    animRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animRef.current);
  }, [intensity]);

  return (
    <div className="relative w-full h-14 overflow-hidden">
      <canvas ref={canvasRef} className="w-full h-full" />
    </div>
  );
};

/* ─── Liquid Tension Slider ───────────────────────────────── */
const LiquidSlider: React.FC<{
  label: string; value: number; min?: number; max?: number;
  onChange: (v: number) => void; color?: string;
}> = ({ label, value, min = 0, max = 10, onChange, color = '#22d3ee' }) => {
  const pct = ((value - min) / (max - min)) * 100;
  const rgb = color === '#22d3ee' ? '34,211,238'
    : color === '#a855f7'        ? '168,85,247'
    : color === '#10b981'        ? '16,185,129'
    : color === '#f59e0b'        ? '245,158,11' : '34,211,238';

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="tele">{label}</label>
        <span className="font-mono text-sm font-black" style={{ color }}>
          {value}<span className="text-[10px] text-white/20">/{max}</span>
        </span>
      </div>
      <div className="relative h-6 flex items-center">
        {/* Glowing track fill */}
        <div className="absolute left-0 h-[3px] rounded-full pointer-events-none"
          style={{
            width: `${pct}%`,
            background: `linear-gradient(to right, rgba(${rgb},0.3), rgba(${rgb},0.9))`,
            boxShadow: `0 0 8px rgba(${rgb},0.6)`,
          }} />
        <input
          type="range" min={min} max={max} value={value}
          onChange={e => onChange(Number(e.target.value))}
          className="liquid-track relative z-10"
          style={{
            background: `linear-gradient(to right, rgba(${rgb},0.6) ${pct}%, rgba(255,255,255,0.05) ${pct}%)`,
          }}
        />
      </div>
    </div>
  );
};

/* ─── 4-7-8 Breathing Ring ────────────────────────────────── */
const BreathingRing: React.FC = () => {
  const [active, setActive] = useState(false);
  const [phase, setPhase] = useState<'idle' | 'inhale' | 'hold' | 'exhale'>('idle');
  const [label, setLabel] = useState('ACTIVATE');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const startCycle = useCallback(() => {
    setActive(true);
    // Inhale 4s
    setPhase('inhale'); setLabel('BREATHE IN...');
    timerRef.current = setTimeout(() => {
      // Hold 7s
      setPhase('hold'); setLabel('HOLD...');
      timerRef.current = setTimeout(() => {
        // Exhale 8s
        setPhase('exhale'); setLabel('BREATHE OUT...');
        timerRef.current = setTimeout(() => {
          setPhase('idle'); setLabel('ACTIVATE');
          setActive(false);
        }, 8000);
      }, 7000);
    }, 4000);
  }, []);

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  const ringColor = phase === 'inhale' ? '34,211,238'
    : phase === 'hold'   ? '168,85,247'
    : phase === 'exhale' ? '52,211,153' : '34,211,238';

  const ringScale = phase === 'inhale' ? 'scale(1.4)' : phase === 'exhale' ? 'scale(0.75)' : 'scale(1)';
  const ringDuration = phase === 'inhale' ? '4s' : phase === 'hold' ? '7s' : phase === 'exhale' ? '8s' : '0s';

  return (
    <div className="flex flex-col items-center gap-5 py-6">
      <p className="tele" style={{ letterSpacing: '0.25em' }}>4-7-8 GROUNDING ANCHOR</p>

      {/* Ring */}
      <button onClick={() => !active && startCycle()} className="relative w-32 h-32 cursor-pointer" aria-label="Start breathing exercise">
        {/* Outer ripple rings */}
        {active && [0, 1].map(i => (
          <div key={i} className="absolute inset-0 rounded-full border pointer-events-none"
            style={{
              borderColor: `rgba(${ringColor},0.2)`,
              animation: `orbRipple ${3 + i}s ease-out ${i * 1.2}s infinite`,
            }} />
        ))}

        {/* Main ring */}
        <div className="absolute inset-0 rounded-full"
          style={{
            border: `2px solid rgba(${ringColor},0.5)`,
            boxShadow: active ? `0 0 40px rgba(${ringColor},0.4), inset 0 0 30px rgba(${ringColor},0.1)` : 'none',
            transform: ringScale,
            transition: `transform ${ringDuration} ease-in-out, box-shadow 0.5s`,
          }} />

        {/* Center */}
        <div className="absolute inset-4 rounded-full flex items-center justify-center"
          style={{
            background: `radial-gradient(circle, rgba(${ringColor},0.15) 0%, transparent 100%)`,
            transform: ringScale,
            transition: `transform ${ringDuration} ease-in-out`,
          }}>
          <span className="font-mono text-[9px] tracking-widest uppercase text-center leading-tight"
            style={{ color: `rgba(${ringColor},0.8)`, animation: active ? 'dataBlink 2s infinite' : 'none' }}>
            {label}
          </span>
        </div>
      </button>

      <p className="tele text-[8px]" style={{ color: 'rgba(255,255,255,0.15)' }}>
        INHALE 4s · HOLD 7s · EXHALE 8s
      </p>
    </div>
  );
};

/* ─── AI Feedback Panel ───────────────────────────────────── */
const AIFeedback: React.FC<{ score: number; level: string | null }> = ({ score, level }) => {
  const msg = level === 'High' || level === 'Critical'
    ? 'Neural analysis shows elevated cortisol markers. I am routing priority support to your node. You are not alone — I am with you.'
    : level === 'Moderate' || level === 'Medium'
    ? 'Moderate tension detected in your responses. Let us breathe together. Your resilience pathways are strong.'
    : score > 0
    ? 'Your emotional telemetry looks balanced. Maintaining this equilibrium is a superpower. Well done.'
    : 'Begin a session to receive AI-powered emotional feedback from NEXORA.';

  const text = useTypewriter(msg, 20, true);

  return (
    <div className="relative p-5 rounded-2xl overflow-hidden"
      style={{ background: 'rgba(34,211,238,0.02)', border: '1px solid rgba(34,211,238,0.07)' }}>
      {/* Scan line deco */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 3px, #22d3ee 3px, #22d3ee 4px)' }} />

      <div className="relative z-10 space-y-3">
        <p className="tele">AI NEURAL FEEDBACK</p>
        <p className="text-sm text-white/70 leading-relaxed font-light"
          style={{ textShadow: '0 0 12px rgba(34,211,238,0.25)' }}>
          {text}
          <span className="inline-block w-[2px] h-[14px] bg-cyan-400 ml-0.5 align-middle"
            style={{ animation: 'cursorBlink 0.9s infinite' }} />
        </p>
      </div>
    </div>
  );
};

/* ─── Main Dashboard ──────────────────────────────────────── */
export const VictimDashboard: React.FC = () => {
  const { state } = useStore();
  const t = useTranslation(state.language);
  const navigate = useNavigate();

  const {
    stressResult, setIsStressModalOpen, isStressModalOpen,
  } = useChatbot();

  const [showCheckIn, setShowCheckIn] = useState(false);
  const [isDoctorModalOpen, setIsDoctorModalOpen] = useState(false);
  const [selectedDoctorId, setSelectedDoctorId] = useState('doc_1');

  // Liquid slider states
  const [mood, setMood]             = useState(5);
  const [anxiety, setAnxiety]       = useState(3);
  const [sleep, setSleep]           = useState(6);
  const [connection, setConnection] = useState(7);

  const distressScore   = stressResult?.score ?? Math.round((anxiety / 10) * 100 * 0.5 + (10 - mood) * 5);
  const stressLevel     = stressResult?.level ?? null;
  const compositeScore  = Math.round((mood + (10 - anxiety) + sleep + connection) / 4);

  const sliderIntensity = (anxiety * 10 + (10 - mood) * 6) / 1.6;
  const accentColor     = distressScore > 60 ? '#f43f5e' : distressScore > 35 ? '#f59e0b' : '#22d3ee';

  if (showCheckIn) {
    return (
      <div className="max-w-2xl mx-auto p-4 md:p-6" style={{ animation: 'fadeUp 0.5s ease both' }}>
        <button onClick={() => setShowCheckIn(false)}
          className="tele mb-6 cursor-pointer hover:text-white transition-colors flex items-center gap-2">
          ← BACK TO SANCTUARY
        </button>
        <CheckInChat onComplete={() => setShowCheckIn(false)} />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-6 space-y-6" style={{ animation: 'fadeUp 0.6s ease both' }}>

      {/* ── HERO ────────────────────────────────────────────────────────── */}
      <div className="relative rounded-3xl p-8 overflow-hidden"
        style={{ background: 'rgba(34,211,238,0.02)', border: '1px solid rgba(34,211,238,0.06)' }}>
        <div className="absolute -top-32 -right-32 w-80 h-80 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(34,211,238,0.06) 0%, transparent 70%)' }} />
        <div className="absolute inset-0 pointer-events-none opacity-[0.025]"
          style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 3px, #22d3ee 3px, #22d3ee 4px)' }} />

        <div className="relative z-10 max-w-xl space-y-4">
          <p className="tele" style={{ letterSpacing: '0.25em' }}>SURVIVOR SANCTUARY // NEURAL-GLASS v2</p>
          <h1 className="text-3xl font-black text-white tracking-tight">
            You are<br />
            <span className="glow-cyan" style={{ color: '#22d3ee' }}>Protected.</span>
          </h1>
          <p className="text-sm text-white/40 leading-relaxed font-light">
            Your emotional telemetry is being monitored with care.
            Speak to NEXORA AI — it listens without judgment.
          </p>

          {/* Waveform HUD */}
          <SineWaveformHUD intensity={sliderIntensity} />

          <div className="flex flex-wrap gap-3 pt-1">
            <button onClick={() => navigate('/nexora-ai')}
              className="flex items-center gap-2 font-mono text-[10px] tracking-[0.15em] uppercase px-6 py-3 rounded-full cursor-pointer transition-all"
              style={{
                background: 'rgba(34,211,238,0.08)',
                border: '1px solid rgba(34,211,238,0.2)',
                color: '#22d3ee',
                boxShadow: '0 0 20px rgba(34,211,238,0.1)',
              }}>
              <Bot className="w-3.5 h-3.5" />
              Launch NEXORA AI
              <ArrowRight className="w-3 h-3" />
            </button>
            <button onClick={() => setShowCheckIn(true)}
              className="flex items-center gap-2 font-mono text-[10px] tracking-[0.15em] uppercase px-5 py-3 rounded-full cursor-pointer transition-all"
              style={{ border: '1px solid rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.35)' }}>
              DAILY CHECK-IN
            </button>
          </div>
        </div>
      </div>

      {/* ── TWO COLUMN: Sliders + Breathing ──────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Liquid Tension Sliders */}
        <div className="rounded-3xl p-6 space-y-6 relative overflow-hidden"
          style={{ background: 'rgba(255,255,255,0.015)', border: '1px solid rgba(255,255,255,0.05)' }}>
          <div className="absolute inset-0 pointer-events-none opacity-[0.02]"
            style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 3px, #22d3ee 3px, #22d3ee 4px)' }} />
          <div className="relative z-10 space-y-6">
            <p className="tele" style={{ letterSpacing: '0.25em' }}>EMOTIONAL TELEMETRY INPUT</p>
            <LiquidSlider label="MOOD" value={mood} onChange={setMood} color="#22d3ee" />
            <LiquidSlider label="ANXIETY" value={anxiety} onChange={setAnxiety} color="#f43f5e" />
            <LiquidSlider label="SLEEP QUALITY" value={sleep} onChange={setSleep} color="#a855f7" />
            <LiquidSlider label="SOCIAL CONNECTION" value={connection} onChange={setConnection} color="#10b981" />
          </div>

          {/* Composite score */}
          <div className="relative z-10 pt-4 flex items-center justify-between"
            style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
            <span className="tele text-[8px]" style={{ color: 'rgba(255,255,255,0.2)' }}>COMPOSITE WELLNESS</span>
            <span className="font-black text-xl" style={{ color: accentColor }}>{compositeScore}/10</span>
          </div>
        </div>

        {/* Breathing Ring + AI Feedback */}
        <div className="space-y-4">
          <div className="rounded-3xl overflow-hidden"
            style={{ background: 'rgba(255,255,255,0.015)', border: '1px solid rgba(255,255,255,0.05)' }}>
            <BreathingRing />
          </div>
          <AIFeedback score={distressScore} level={stressLevel} />
        </div>
      </div>

      {/* ── STRESS RESULT ────────────────────────────────────────────────── */}
      {stressResult && (
        <div className="rounded-3xl p-6 space-y-5 relative overflow-hidden"
          style={{
            background: distressScore > 60 ? 'rgba(244,63,94,0.03)' : distressScore > 35 ? 'rgba(245,158,11,0.03)' : 'rgba(16,185,129,0.03)',
            border: `1px solid ${accentColor}20`,
          }}>
          <div className="absolute inset-0 pointer-events-none"
            style={{ background: `radial-gradient(ellipse at top left, rgba(${distressScore > 60 ? '244,63,94' : distressScore > 35 ? '245,158,11' : '34,211,238'},0.04) 0%, transparent 60%)` }} />
          <div className="relative z-10 flex items-center justify-between">
            <p className="tele" style={{ color: `${accentColor}99` }}>AI STRESS ASSESSMENT // SESSION RESULT</p>
            <div className="flex gap-2">
              <button onClick={() => setIsStressModalOpen(true)}
                className="font-mono text-[9px] tracking-widest px-3 py-1.5 rounded-full cursor-pointer transition-all"
                style={{ border: `1px solid ${accentColor}30`, color: accentColor }}>
                FULL ANALYSIS
              </button>
              <button onClick={() => navigate('/nexora-ai')}
                className="font-mono text-[9px] tracking-widest px-3 py-1.5 rounded-full cursor-pointer transition-all flex items-center gap-1"
                style={{ border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.3)' }}>
                <RefreshCw className="w-3 h-3" /> NEW
              </button>
            </div>
          </div>

          <div className="relative z-10 flex flex-col sm:flex-row items-center gap-6">
            <div className="w-20 h-20 rounded-3xl shrink-0 flex flex-col items-center justify-center font-black"
              style={{ background: `${accentColor}18`, border: `1px solid ${accentColor}30`, color: accentColor }}>
              <span className="text-2xl">{stressResult.score}%</span>
              <span className="text-[8px] opacity-60">/100</span>
            </div>
            <div className="space-y-2 text-center sm:text-left">
              <span className="font-mono text-[9px] tracking-widest px-3 py-1 rounded-full"
                style={{ background: `${accentColor}15`, color: accentColor, border: `1px solid ${accentColor}30` }}>
                {stressResult.level?.toUpperCase()} STRESS
              </span>
              <h3 className="font-bold text-white text-sm">{stressResult.headline}</h3>
              <p className="text-xs text-white/40 leading-relaxed">{stressResult.summary}</p>
            </div>
          </div>

          {/* Emotion telemetry grid */}
          <div className="relative z-10 grid grid-cols-5 gap-2">
            {[
              { k: 'anxiety',     l: 'ANXIETY',     v: stressResult.emotionalTone?.anxiety,     c: '#f59e0b' },
              { k: 'sadness',     l: 'SADNESS',      v: stressResult.emotionalTone?.sadness,     c: '#3b82f6' },
              { k: 'frustration', l: 'FRUSTRATION',  v: stressResult.emotionalTone?.frustration, c: '#f43f5e' },
              { k: 'hope',        l: 'HOPE',         v: stressResult.emotionalTone?.hope,        c: '#6366f1' },
              { k: 'calm',        l: 'CALM',         v: stressResult.emotionalTone?.calm,        c: '#10b981' },
            ].map(({ k, l, v, c }) => (
              <div key={k} className="text-center p-2 rounded-xl"
                style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
                <p className="tele text-[8px]" style={{ color: 'rgba(255,255,255,0.2)' }}>{l}</p>
                <p className="font-black text-sm mt-1" style={{ color: c }}>{v ?? '—'}%</p>
              </div>
            ))}
          </div>

          {/* CTA */}
          <button onClick={() => setIsDoctorModalOpen(true)}
            className="relative z-10 w-full font-mono text-[10px] tracking-[0.15em] uppercase py-3 rounded-2xl cursor-pointer transition-all"
            style={{ background: `${accentColor}12`, border: `1px solid ${accentColor}25`, color: accentColor }}>
            {distressScore > 60 ? '⚠ URGENT: CONSULT A DOCTOR NOW' : 'CONSULT A DOCTOR →'}
          </button>
        </div>
      )}

      {/* ── DOCTOR PORTAL ────────────────────────────────────────────────── */}
      <div className="rounded-3xl p-6 space-y-5 relative overflow-hidden"
        style={{ background: 'rgba(255,255,255,0.015)', border: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="absolute inset-0 pointer-events-none opacity-[0.02]"
          style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 3px, #22d3ee 3px, #22d3ee 4px)' }} />

        <div className="relative z-10 flex items-center justify-between">
          <p className="tele" style={{ letterSpacing: '0.25em' }}>TELE-CONSULTATION PORTAL</p>
          <button onClick={() => setIsDoctorModalOpen(true)}
            className="font-mono text-[9px] tracking-widest cursor-pointer" style={{ color: 'rgba(34,211,238,0.5)' }}>
            VIEW ALL →
          </button>
        </div>

        <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-4">
          {DOCTORS_LIST.map(doc => (
            <div key={doc.id} className="neural-row rounded-2xl p-4 space-y-3 overflow-hidden relative"
              style={{ background: 'rgba(255,255,255,0.015)' }}>
              <div className="flex items-center gap-3">
                <img src={doc.avatar} alt={doc.name}
                  className="w-10 h-10 rounded-full object-cover shrink-0"
                  style={{ border: '1px solid rgba(34,211,238,0.15)' }} />
                <div>
                  <p className="font-bold text-white text-xs">{doc.name}</p>
                  <p className="tele text-[8px]" style={{ color: 'rgba(255,255,255,0.2)' }}>{doc.qualification}</p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                    <span className="font-mono text-[9px] text-amber-400">{doc.rating}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-mono text-[8px]"
                  style={{ color: doc.isAvailableNow ? '#10b981' : 'rgba(255,255,255,0.2)' }}>
                  {doc.isAvailableNow ? '● ONLINE' : '○ OFFLINE'}
                </span>
                <button onClick={() => { setSelectedDoctorId(doc.id); setIsDoctorModalOpen(true); }}
                  className="font-mono text-[9px] tracking-widest px-3 py-1 rounded-full cursor-pointer transition-all"
                  style={{ background: 'rgba(34,211,238,0.06)', border: '1px solid rgba(34,211,238,0.15)', color: '#22d3ee' }}>
                  CONSULT
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── QUICK ACTIONS ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <button onClick={() => setIsDoctorModalOpen(true)}
          className="neural-row rounded-2xl p-5 flex items-center gap-4 cursor-pointer text-left group"
          style={{ background: 'rgba(255,255,255,0.01)' }}>
          <div className="p-2.5 rounded-xl" style={{ background: 'rgba(34,211,238,0.06)', border: '1px solid rgba(34,211,238,0.12)' }}>
            <Users className="w-4 h-4 text-cyan-400" />
          </div>
          <div>
            <p className="font-bold text-white text-xs">Caseworker Link</p>
            <p className="tele text-[8px] mt-0.5" style={{ color: 'rgba(255,255,255,0.2)' }}>DIRECT COUNSELLOR CONNECT</p>
          </div>
        </button>

        <a href="tel:14416"
          className="neural-row rounded-2xl p-5 flex items-center gap-4 text-left group"
          style={{ background: 'rgba(255,255,255,0.01)' }}>
          <div className="p-2.5 rounded-xl" style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.12)' }}>
            <PhoneCall className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <p className="font-bold text-white text-xs">Tele-MANAS Hotline</p>
            <p className="font-mono text-[9px] mt-0.5" style={{ color: 'rgba(16,185,129,0.5)' }}>DIAL 14416 // TOLL FREE</p>
          </div>
        </a>
      </div>

      {/* Modals */}
      <StressReportModal isOpen={isStressModalOpen} onClose={() => setIsStressModalOpen(false)} result={stressResult} />
      <ConsultDoctorModal isOpen={isDoctorModalOpen} onClose={() => setIsDoctorModalOpen(false)} stressResult={stressResult} initialDoctorId={selectedDoctorId} />
    </div>
  );
};
