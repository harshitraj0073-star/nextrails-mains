import React, { useEffect, useState } from 'react';

/**
 * GlobalCockpitOverlay
 * Implements:
 * 1. Global Ambient Cursor Spotlight: a dynamic radial glow that follows the user's cursor behind all glass cards.
 * 2. Subtle grid/scan-line telemetry overlay across the background container.
 */
export const GlobalCockpitOverlay: React.FC = () => {
  const [mousePos, setMousePos] = useState({ x: -500, y: -500 });
  const [isPointerActive, setIsPointerActive] = useState(false);

  useEffect(() => {
    let ticking = false;

    const handleMouseMove = (e: MouseEvent) => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setMousePos({ x: e.clientX, y: e.clientY });
          if (!isPointerActive) setIsPointerActive(true);
          ticking = false;
        });
        ticking = true;
      }
    };

    const handleMouseLeave = () => {
      setIsPointerActive(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [isPointerActive]);

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none">
      {/* 1. Dynamic Cursor Spotlight (behind glass cards, above background canvas) */}
      <div
        className="absolute w-[600px] h-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full pointer-events-none transition-opacity duration-500 ease-out"
        style={{
          left: `${mousePos.x}px`,
          top: `${mousePos.y}px`,
          opacity: isPointerActive ? 0.35 : 0,
          background: 'radial-gradient(circle, rgba(56, 189, 248, 0.28) 0%, rgba(168, 85, 247, 0.12) 40%, rgba(6, 182, 212, 0) 70%)',
          filter: 'blur(30px)',
        }}
      />

      {/* 2. Cybernetic / Cockpit Telemetry Scanlines & Subtle Grid */}
      <div 
        className="absolute inset-0 opacity-[0.035] pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(56, 189, 248, 0.4) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(56, 189, 248, 0.4) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
        }}
      />

      {/* 3. Subtle Horizontal Scanline Sweep */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-[0.025]"
        style={{
          backgroundImage: 'repeating-linear-gradient(0deg, #000, #000 2px, transparent 2px, transparent 4px)',
        }}
      />
    </div>
  );
};
