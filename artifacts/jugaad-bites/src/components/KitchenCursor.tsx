import React, { useEffect, useState } from 'react';

// ==========================================
// Custom Interactive Kitchen Tool Cursor
// Ultra-sharp Chef Spatula with golden sizzle sparks
// ==========================================

interface SizzleSpark {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  alpha: number;
  color: string;
}

export function KitchenCursor() {
  const [pos, setPos] = useState<{ x: number; y: number }>({ x: -100, y: -100 });
  const [isHovering, setIsHovering] = useState<boolean>(false);
  const [isClicking, setIsClicking] = useState<boolean>(false);
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const [sparks, setSparks] = useState<SizzleSpark[]>([]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.matchMedia('(pointer: coarse)').matches) return;

    const styleEl = document.createElement('style');
    styleEl.id = 'jugaad-hide-default-cursor';
    styleEl.innerHTML = `
      @media (pointer: fine) {
        *, *::before, *::after, html, body, a, button, input, select, textarea, label, [role="button"] {
          cursor: none !important;
        }
      }
    `;
    document.head.appendChild(styleEl);

    const handleMouseMove = (e: MouseEvent) => {
      setPos({ x: e.clientX, y: e.clientY });
      if (!isVisible) setIsVisible(true);

      const target = e.target as HTMLElement | null;
      if (target) {
        const isClickable =
          target.tagName === 'BUTTON' ||
          target.tagName === 'A' ||
          target.tagName === 'INPUT' ||
          target.closest('button') ||
          target.closest('a') ||
          target.closest('.recipe-card') ||
          target.closest('label') ||
          target.getAttribute('role') === 'button';
        setIsHovering(!!isClickable);
      }
    };

    const handleMouseDown = (e: MouseEvent) => {
      setIsClicking(true);

      const colors = ['#f59e0b', '#ff542e', '#10b981', '#fbbf24'];
      const newSparks: SizzleSpark[] = Array.from({ length: 6 }).map((_, i) => ({
        id: Date.now() + i,
        x: e.clientX,
        y: e.clientY,
        vx: (Math.random() - 0.5) * 6,
        vy: (Math.random() - 0.7) * 6,
        alpha: 1,
        color: colors[Math.floor(Math.random() * colors.length)],
      }));

      setSparks((prev) => [...prev.slice(-14), ...newSparks]);
    };

    const handleMouseUp = () => {
      setIsClicking(false);
    };

    const handleMouseLeave = () => {
      setIsVisible(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      styleEl.remove();
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [isVisible]);

  // Particle updates
  useEffect(() => {
    if (sparks.length === 0) return;

    const interval = setInterval(() => {
      setSparks((prev) =>
        prev
          .map((s) => ({
            ...s,
            x: s.x + s.vx,
            y: s.y + s.vy,
            vy: s.vy + 0.25,
            alpha: s.alpha - 0.06,
          }))
          .filter((s) => s.alpha > 0)
      );
    }, 16);

    return () => clearInterval(interval);
  }, [sparks.length]);

  if (!isVisible) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-[99999] overflow-visible">
      {/* Sizzle Spark Particles on Click */}
      {sparks.map((spark) => (
        <div
          key={spark.id}
          className="absolute h-2 w-2 rounded-full shadow-[0_0_8px_currentColor]"
          style={{
            left: spark.x,
            top: spark.y,
            backgroundColor: spark.color,
            color: spark.color,
            opacity: spark.alpha,
            transform: 'translate(-50%, -50%)',
          }}
        />
      ))}

      {/* Target Precision Dot at exact pointer tip */}
      <div
        className={`absolute h-2 w-2 rounded-full transition-transform duration-100 ${
          isHovering
            ? 'bg-[#ff5533] shadow-[0_0_10px_#ff5533] scale-125'
            : 'bg-[#0f9f6e] shadow-[0_0_6px_#0f9f6e]'
        }`}
        style={{
          left: pos.x,
          top: pos.y,
          transform: 'translate(-50%, -50%)',
        }}
      />

      {/* Trailing Glow Ring on Hover */}
      <div
        className={`absolute rounded-full border transition-all duration-150 ease-out ${
          isHovering
            ? 'h-10 w-10 border-[#ff5533] bg-[#ff5533]/15 scale-100'
            : 'h-4 w-4 border-[#0f9f6e]/30 bg-transparent scale-90'
        }`}
        style={{
          left: pos.x,
          top: pos.y,
          transform: 'translate(-50%, -50%)',
        }}
      />

      {/* Chef Spatula (Clean vector tool) */}
      <div
        className="absolute transition-transform duration-75 ease-out drop-shadow-lg"
        style={{
          left: pos.x,
          top: pos.y,
          transform: `translate(3px, 3px) rotate(${isClicking ? '-30deg' : isHovering ? '-15deg' : '0deg'}) scale(${
            isClicking ? 0.9 : isHovering ? 1.12 : 1
          })`,
          transformOrigin: '0 0',
        }}
      >
        <svg
          width="32"
          height="32"
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Spatula Blade */}
          <path
            d="M3 2L11 2L15 10L7 10L3 2Z"
            fill={isHovering ? '#ff5533' : '#0f766e'}
            stroke="#ffffff"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
          {/* Blade Slots */}
          <line x1="7" y1="4" x2="8.5" y2="8" stroke="#ffffff" strokeWidth="1.2" strokeLinecap="round" />
          <line x1="10" y1="4" x2="11.5" y2="8" stroke="#ffffff" strokeWidth="1.2" strokeLinecap="round" />
          {/* Metal Neck */}
          <line x1="11" y1="10" x2="23" y2="23" stroke={isHovering ? '#ff5533' : '#0f766e'} strokeWidth="3" strokeLinecap="round" />
          {/* Wooden Grip Handle */}
          <line x1="17" y1="17" x2="26" y2="26" stroke="#f59e0b" strokeWidth="4.5" strokeLinecap="round" />
        </svg>
      </div>
    </div>
  );
}
