import React, { useEffect, useRef } from 'react';

// ==========================================
// Ambient Rising Cooking Steam / Smoke Effect
// Beautifully color-graded for both Light and Dark modes
// ==========================================

interface SteamParticle {
  x: number;
  y: number;
  radius: number;
  vx: number;
  vy: number;
  alpha: number;
  maxAlpha: number;
  growth: number;
  angle: number;
  angularSpeed: number;
}

export function SmokeEffect() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);

    const particles: SteamParticle[] = [];
    const maxParticles = 30;

    const spawnParticle = (startY?: number): SteamParticle => {
      const x = Math.random() * width;
      const y = startY !== undefined ? startY : height + Math.random() * 60;
      const radius = Math.random() * 35 + 30;
      const maxAlpha = Math.random() * 0.08 + 0.03;

      return {
        x,
        y,
        radius,
        vx: (Math.random() - 0.5) * 0.35,
        vy: -(Math.random() * 0.55 + 0.35),
        alpha: 0.01,
        maxAlpha,
        growth: Math.random() * 0.2 + 0.12,
        angle: Math.random() * Math.PI * 2,
        angularSpeed: (Math.random() - 0.5) * 0.006,
      };
    };

    for (let i = 0; i < maxParticles; i++) {
      particles.push(spawnParticle(Math.random() * height));
    }

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      const isDark = document.documentElement.classList.contains('dark');

      if (particles.length < maxParticles && Math.random() < 0.25) {
        particles.push(spawnParticle());
      }

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];

        p.x += p.vx + Math.sin(p.angle) * 0.25;
        p.y += p.vy;
        p.radius += p.growth;
        p.angle += p.angularSpeed;

        const lifeFraction = (height - p.y) / height;
        if (lifeFraction < 0.2) {
          p.alpha = Math.min(p.maxAlpha, p.alpha + 0.003);
        } else if (lifeFraction > 0.7) {
          p.alpha = Math.max(0, p.alpha - 0.002);
        }

        if (p.alpha > 0.001) {
          const grad = ctx.createRadialGradient(p.x, p.y, p.radius * 0.1, p.x, p.y, p.radius);
          
          if (isDark) {
            grad.addColorStop(0, `rgba(255, 235, 205, ${p.alpha * 1.2})`);
            grad.addColorStop(0.5, `rgba(244, 180, 70, ${p.alpha * 0.4})`);
            grad.addColorStop(1, 'rgba(255, 235, 205, 0)');
          } else {
            // Warm golden-amber culinary steam in light mode
            grad.addColorStop(0, `rgba(230, 120, 60, ${p.alpha * 0.45})`);
            grad.addColorStop(0.5, `rgba(245, 175, 75, ${p.alpha * 0.25})`);
            grad.addColorStop(1, 'rgba(250, 240, 225, 0)');
          }

          ctx.save();
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }

        if (p.y + p.radius < 0 || p.alpha <= 0.001) {
          particles.splice(i, 1);
        }
      }

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-10 opacity-70"
    />
  );
}
