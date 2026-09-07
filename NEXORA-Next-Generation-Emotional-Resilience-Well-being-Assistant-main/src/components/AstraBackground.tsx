import React, { useEffect, useRef } from 'react';

interface Particle {
  x: number; y: number;
  vx: number; vy: number;
  radius: number; color: string;
  baseOpacity: number; pulseSpeed: number;
  phase: number; shadowBlur: number;
}

interface NebulaOrb {
  x: number; y: number;
  vx: number; vy: number;
  radius: number; color: string;
}

const COLORS = ['#ffffff','#60a5fa','#93c5fd','#38bdf8','#c084fc','#34d399'];
const COUNT  = 260;

/**
 * AstraBackground — Deep abyss (#010308) with:
 * - 260 twinkling particles
 * - 4 drifting nebula radials
 * - Mouse-reactive mesh lines (nearby particles connect)
 * - Cursor-following subtle radial spotlight
 */
export const AstraBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef  = useRef({ x: -9999, y: -9999 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let rafId: number;
    let W = 0, H = 0, DPR = 1;

    const particles: Particle[] = [];
    const nebulae: NebulaOrb[] = [
      { x:0, y:0, vx: 0.7,  vy: 0.5,  radius: 500, color:'rgba(34,211,238,0.14)'  },
      { x:0, y:0, vx:-0.6,  vy:-0.7,  radius: 560, color:'rgba(168,85,247,0.12)'  },
      { x:0, y:0, vx: 0.5,  vy:-0.5,  radius: 480, color:'rgba(59,130,246,0.10)'  },
      { x:0, y:0, vx:-0.45, vy: 0.6,  radius: 420, color:'rgba(52,211,153,0.09)'  },
    ];

    const resize = () => {
      DPR = Math.min(window.devicePixelRatio || 1, 2);
      W = window.innerWidth;
      H = window.innerHeight;
      canvas.width  = W * DPR;
      canvas.height = H * DPR;
      canvas.style.width  = `${W}px`;
      canvas.style.height = `${H}px`;
      ctx.scale(DPR, DPR);
      const maxR = Math.max(W, H);
      nebulae[0].radius = maxR * 0.44;
      nebulae[1].radius = maxR * 0.48;
      nebulae[2].radius = maxR * 0.40;
      nebulae[3].radius = maxR * 0.36;
    };

    resize();
    window.addEventListener('resize', resize);

    nebulae[0].x = W * 0.2;  nebulae[0].y = H * 0.25;
    nebulae[1].x = W * 0.8;  nebulae[1].y = H * 0.75;
    nebulae[2].x = W * 0.5;  nebulae[2].y = H * 0.5;
    nebulae[3].x = W * 0.75; nebulae[3].y = H * 0.2;

    for (let i = 0; i < COUNT; i++) {
      const r = Math.random() * 1.8 + 0.5;
      particles.push({
        x: Math.random() * W, y: Math.random() * H,
        vx: (Math.random() - 0.5) * 0.6,
        vy: (Math.random() - 0.5) * 0.6,
        radius: r, color: COLORS[Math.floor(Math.random() * COLORS.length)],
        baseOpacity: Math.random() * 0.5 + 0.25,
        pulseSpeed: Math.random() * 0.003 + 0.002,
        phase: Math.random() * Math.PI * 2,
        shadowBlur: r * (Math.random() * 3 + 2),
      });
    }

    const CONN_DIST = 80; // mesh connection distance (mouse-reactive)

    const render = (t: number) => {
      ctx.clearRect(0, 0, W, H);

      // 1. Nebula radials
      for (const orb of nebulae) {
        orb.x += orb.vx; orb.y += orb.vy;
        orb.vx += (Math.random() - 0.5) * 0.025;
        orb.vy += (Math.random() - 0.5) * 0.025;
        orb.vx = Math.max(-1, Math.min(1, orb.vx));
        orb.vy = Math.max(-1, Math.min(1, orb.vy));
        const pad = 100;
        if (orb.x < -pad) { orb.x = -pad; orb.vx = Math.abs(orb.vx); }
        else if (orb.x > W + pad) { orb.x = W + pad; orb.vx = -Math.abs(orb.vx); }
        if (orb.y < -pad) { orb.y = -pad; orb.vy = Math.abs(orb.vy); }
        else if (orb.y > H + pad) { orb.y = H + pad; orb.vy = -Math.abs(orb.vy); }

        const g = ctx.createRadialGradient(orb.x, orb.y, 0, orb.x, orb.y, orb.radius);
        g.addColorStop(0, orb.color);
        g.addColorStop(1, 'transparent');
        ctx.save(); ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(orb.x, orb.y, orb.radius, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
      }

      // 2. Cursor spotlight
      const mx = mouseRef.current.x, my = mouseRef.current.y;
      if (mx > 0) {
        const sg = ctx.createRadialGradient(mx, my, 0, mx, my, 260);
        sg.addColorStop(0, 'rgba(34,211,238,0.06)');
        sg.addColorStop(0.5, 'rgba(168,85,247,0.03)');
        sg.addColorStop(1, 'transparent');
        ctx.save(); ctx.fillStyle = sg;
        ctx.beginPath(); ctx.arc(mx, my, 260, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
      }

      // 3. Particles + mesh connections
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x += p.vx; p.y += p.vy;
        p.vx += (Math.random() - 0.5) * 0.012;
        p.vy += (Math.random() - 0.5) * 0.012;
        p.vx = Math.max(-0.9, Math.min(0.9, p.vx));
        p.vy = Math.max(-0.9, Math.min(0.9, p.vy));
        if (p.x < -10) p.x = W + 10; else if (p.x > W + 10) p.x = -10;
        if (p.y < -10) p.y = H + 10; else if (p.y > H + 10) p.y = -10;

        const op = Math.max(0.1, Math.min(0.9, p.baseOpacity * (0.6 + 0.4 * Math.sin(t * p.pulseSpeed + p.phase))));

        // Mouse-proximity mesh
        const dx = p.x - mx, dy = p.y - my;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 160) {
          ctx.save();
          ctx.strokeStyle = `rgba(34,211,238,${0.12 * (1 - dist / 160)})`;
          ctx.lineWidth = 0.5;
          ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(mx, my); ctx.stroke();
          ctx.restore();
        }

        // Particle-to-particle connections near cursor
        if (dist < 200) {
          for (let j = i + 1; j < particles.length; j++) {
            const q = particles[j];
            const qdx = p.x - q.x, qdy = p.y - q.y;
            const qd = Math.sqrt(qdx * qdx + qdy * qdy);
            if (qd < CONN_DIST) {
              ctx.save();
              ctx.strokeStyle = `rgba(34,211,238,${0.08 * (1 - qd / CONN_DIST)})`;
              ctx.lineWidth = 0.4;
              ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y); ctx.stroke();
              ctx.restore();
            }
          }
        }

        ctx.save();
        ctx.globalAlpha = op;
        ctx.shadowColor = p.color;
        ctx.shadowBlur  = p.shadowBlur;
        ctx.fillStyle   = p.color;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
      }

      rafId = requestAnimationFrame(render);
    };

    rafId = requestAnimationFrame(render);

    const onMove = (e: MouseEvent) => { mouseRef.current = { x: e.clientX, y: e.clientY }; };
    const onLeave = () => { mouseRef.current = { x: -9999, y: -9999 }; };
    window.addEventListener('mousemove', onMove);
    document.addEventListener('mouseleave', onLeave);

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseleave', onLeave);
      cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden" style={{ background: '#010308' }}>
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
    </div>
  );
};
