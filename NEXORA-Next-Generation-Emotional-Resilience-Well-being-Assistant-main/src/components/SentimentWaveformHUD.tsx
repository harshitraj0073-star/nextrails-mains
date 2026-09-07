import React, { useEffect, useRef, useState } from 'react';
import { Activity, Radio, Cpu, Zap } from 'lucide-react';

interface SentimentWaveformHUDProps {
  distressScore?: number;
  className?: string;
}

export const SentimentWaveformHUD: React.FC<SentimentWaveformHUDProps> = ({
  distressScore = 24,
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [affectIndex, setAffectIndex] = useState('NOMINAL');
  const [cognitiveLoad, setCognitiveLoad] = useState('BALANCED');

  useEffect(() => {
    if (distressScore >= 70) {
      setAffectIndex('ACUTE ELEVATION');
      setCognitiveLoad('HIGH STRESS');
    } else if (distressScore >= 45) {
      setAffectIndex('MODERATE TENSION');
      setCognitiveLoad('ELEVATED');
    } else {
      setAffectIndex('NOMINAL');
      setCognitiveLoad('BALANCED');
    }
  }, [distressScore]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let phase = 0;
    let dpr = window.devicePixelRatio || 1;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
    };

    resize();
    window.addEventListener('resize', resize);

    const render = () => {
      const width = canvas.width / dpr;
      const height = canvas.height / dpr;
      ctx.clearRect(0, 0, width, height);

      // Speed & Amplitude scale with distress score
      const speed = 0.045 + (distressScore / 100) * 0.06;
      phase += speed;
      const amp = 16 + (distressScore / 100) * 22;

      // Draw Multi-tier Neon Glowing Waveforms
      const waves = [
        { color: '#38bdf8', alpha: 0.9, width: 2.2, freq: 0.018, offset: 0, ampMult: 1.0 },
        { color: '#a855f7', alpha: 0.7, width: 1.8, freq: 0.024, offset: 1.4, ampMult: 0.75 },
        { color: '#06b6d4', alpha: 0.5, width: 1.2, freq: 0.012, offset: 2.8, ampMult: 0.6 },
      ];

      waves.forEach(w => {
        ctx.save();
        ctx.beginPath();
        ctx.strokeStyle = w.color;
        ctx.globalAlpha = w.alpha;
        ctx.lineWidth = w.width;
        ctx.shadowColor = w.color;
        ctx.shadowBlur = 12;

        const centerY = height / 2;

        for (let x = 0; x < width; x++) {
          // Windowing envelope to taper ends
          const envelope = Math.sin((x / width) * Math.PI);
          const y = centerY + Math.sin(x * w.freq + phase + w.offset) * amp * w.ampMult * envelope;

          if (x === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }

        ctx.stroke();
        ctx.restore();
      });

      // Subtle vertical scan-line tick points
      ctx.save();
      ctx.fillStyle = 'rgba(56, 189, 248, 0.2)';
      for (let i = 0; i < width; i += 40) {
        ctx.fillRect(i, height / 2 - 2, 1, 4);
      }
      ctx.restore();

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, [distressScore]);

  return (
    <div className={`rounded-2xl bg-slate-950/80 border border-cyan-500/20 backdrop-blur-xl p-4 shadow-[0_0_30px_-8px_rgba(56,189,248,0.15)] select-none ${className}`}>
      {/* Top HUD Telemetry Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3 pb-2 border-b border-white/10 font-mono text-[11px]">
        <div className="flex items-center gap-2 text-cyan-300 font-semibold">
          <Activity className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
          <span>AFFECTIVE SINE-STREAM</span>
          <span className="text-white/20">//</span>
          <span className="text-slate-400">REAL-TIME RESONANCE</span>
        </div>

        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 text-slate-300">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_6px_#38bdf8] animate-ping" />
            [COGNITIVE LOAD: <strong className="text-white">{cognitiveLoad}</strong>]
          </span>
          <span className="hidden sm:inline text-white/20">|</span>
          <span className="flex items-center gap-1 text-purple-300">
            <Zap className="w-3 h-3 text-purple-400" />
            [AFFECT INDEX: <strong className="text-purple-200">{affectIndex}</strong>]
          </span>
        </div>
      </div>

      {/* Canvas Oscilloscope */}
      <div className="relative w-full h-24 sm:h-28 overflow-hidden rounded-xl bg-[#04060b]/90 border border-white/5 flex items-center justify-center">
        {/* Subtle grid backing */}
        <div 
          className="absolute inset-0 opacity-10 pointer-events-none"
          style={{
            backgroundImage: 'linear-gradient(rgba(56,189,248,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(56,189,248,0.5) 1px, transparent 1px)',
            backgroundSize: '20px 20px',
          }}
        />
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
      </div>

      {/* Footer Calibration Tags */}
      <div className="flex items-center justify-between mt-2.5 pt-1 text-[10px] font-mono text-slate-400">
        <span className="flex items-center gap-1">
          <Radio className="w-3 h-3 text-cyan-400 animate-pulse" />
          CARRIER: 432Hz HARMONIC
        </span>
        <span className="text-cyan-400/80">SAMPLING RATE: 120 FPS HIGH-FIDELITY</span>
      </div>
    </div>
  );
};
