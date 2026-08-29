import React, { useEffect, useRef } from 'react';

// =========================================================================
// Dual-Mode Culinary Ambiance Engine
// - Light Mode: Floating Simmer Flavor Bubbles, Spice/Herb Flakes & Rising Aroma Lines
// - Dark Mode: Ambient Midnight Smoke Steam Puffs & Luminous Caustics
// =========================================================================

interface DarkSteamParticle {
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

interface LightBubbleParticle {
  x: number;
  y: number;
  radius: number;
  vx: number;
  vy: number;
  alpha: number;
  wobble: number;
  wobbleSpeed: number;
  color: string;
  type: 'bubble' | 'flake' | 'aroma';
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

    // Dark Mode Smoke State
    const darkParticles: DarkSteamParticle[] = [];
    const maxDarkParticles = 26;

    // Light Mode Culinary Particles State
    const lightParticles: LightBubbleParticle[] = [];
    const maxLightParticles = 32;

    const flakeColors = [
      '#e11d48', // Chili Paprika Flake
      '#d97706', // Saffron Gold
      '#15803d', // Fresh Herb Leaf
      '#ea580c', // Hot Spice
      '#334155', // Cracked Pepper
    ];

    // Spawn Dark Mode Smoke Steam
    const spawnDarkParticle = (startY?: number): DarkSteamParticle => {
      const x = Math.random() * width;
      const y = startY !== undefined ? startY : height + Math.random() * 60;
      return {
        x,
        y,
        radius: Math.random() * 35 + 28,
        vx: (Math.random() - 0.5) * 0.35,
        vy: -(Math.random() * 0.55 + 0.35),
        alpha: 0.01,
        maxAlpha: Math.random() * 0.12 + 0.05,
        growth: Math.random() * 0.18 + 0.1,
        angle: Math.random() * Math.PI * 2,
        angularSpeed: (Math.random() - 0.5) * 0.006,
      };
    };

    // Spawn Light Mode Culinary Particle
    const spawnLightParticle = (startY?: number): LightBubbleParticle => {
      const rand = Math.random();
      const type: 'bubble' | 'flake' | 'aroma' = rand < 0.45 ? 'bubble' : rand < 0.85 ? 'flake' : 'aroma';
      const x = Math.random() * width;
      const y = startY !== undefined ? startY : height + Math.random() * 40;

      let radius = Math.random() * 5 + 3;
      if (type === 'bubble') radius = Math.random() * 8 + 4;
      if (type === 'flake') radius = Math.random() * 2.8 + 1.8;
      if (type === 'aroma') radius = Math.random() * 14 + 10;

      const color = type === 'flake'
        ? flakeColors[Math.floor(Math.random() * flakeColors.length)]
        : '#e65e3d';

      return {
        x,
        y,
        radius,
        vx: (Math.random() - 0.5) * 0.5,
        vy: -(Math.random() * 0.75 + 0.4),
        alpha: Math.random() * 0.4 + 0.25,
        wobble: Math.random() * Math.PI * 2,
        wobbleSpeed: Math.random() * 0.03 + 0.015,
        color,
        type,
      };
    };

    // Pre-populate
    for (let i = 0; i < maxDarkParticles; i++) {
      darkParticles.push(spawnDarkParticle(Math.random() * height));
    }
    for (let i = 0; i < maxLightParticles; i++) {
      lightParticles.push(spawnLightParticle(Math.random() * height));
    }

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      const isDark = document.documentElement.classList.contains('dark');

      if (isDark) {
        // ==========================================
        // DARK MODE: Rising Ambient Steam
        // ==========================================
        if (darkParticles.length < maxDarkParticles && Math.random() < 0.25) {
          darkParticles.push(spawnDarkParticle());
        }

        for (let i = darkParticles.length - 1; i >= 0; i--) {
          const p = darkParticles[i];
          p.x += p.vx + Math.sin(p.angle) * 0.25;
          p.y += p.vy;
          p.radius += p.growth;
          p.angle += p.angularSpeed;

          const life = (height - p.y) / height;
          if (life < 0.25) p.alpha = Math.min(p.maxAlpha, p.alpha + 0.003);
          else if (life > 0.65) p.alpha = Math.max(0, p.alpha - 0.003);

          if (p.alpha > 0.003) {
            const grad = ctx.createRadialGradient(p.x, p.y, p.radius * 0.05, p.x, p.y, p.radius);
            grad.addColorStop(0, `rgba(255, 235, 205, ${p.alpha * 1.2})`);
            grad.addColorStop(0.4, `rgba(244, 180, 70, ${p.alpha * 0.5})`);
            grad.addColorStop(1, 'rgba(255, 235, 205, 0)');

            ctx.save();
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
          }

          if (p.y + p.radius < -10 || p.alpha <= 0.002) {
            darkParticles.splice(i, 1);
          }
        }
      } else {
        // ==========================================
        // LIGHT MODE: Dedicated Culinary Flavor Simmer
        // ==========================================
        if (lightParticles.length < maxLightParticles && Math.random() < 0.3) {
          lightParticles.push(spawnLightParticle());
        }

        for (let i = lightParticles.length - 1; i >= 0; i--) {
          const p = lightParticles[i];
          p.wobble += p.wobbleSpeed;
          p.x += p.vx + Math.sin(p.wobble) * 0.45;
          p.y += p.vy;

          const life = (height - p.y) / height;
          if (life > 0.85) {
            p.alpha = Math.max(0, p.alpha - 0.015);
          }

          if (p.alpha > 0.01) {
            ctx.save();
            ctx.globalAlpha = p.alpha;

            if (p.type === 'bubble') {
              // Translucent Warm Simmer Bubble with Highlight Ring
              ctx.strokeStyle = '#e65e3d';
              ctx.lineWidth = 1.2;
              ctx.beginPath();
              ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
              ctx.stroke();

              // Bubble inner soft tint
              ctx.fillStyle = 'rgba(244, 196, 83, 0.2)';
              ctx.fill();

              // Top-left glossy glare dot
              ctx.fillStyle = '#ffffff';
              ctx.beginPath();
              ctx.arc(p.x - p.radius * 0.35, p.y - p.radius * 0.35, p.radius * 0.25, 0, Math.PI * 2);
              ctx.fill();
            } else if (p.type === 'flake') {
              // Floating Spice / Herb Flake
              ctx.fillStyle = p.color;
              ctx.beginPath();
              ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
              ctx.fill();

              // Micro flare on golden saffron
              if (p.color === '#d97706' || p.color === '#e11d48') {
                ctx.strokeStyle = p.color;
                ctx.lineWidth = 0.6;
                ctx.beginPath();
                ctx.moveTo(p.x - p.radius * 1.5, p.y);
                ctx.lineTo(p.x + p.radius * 1.5, p.y);
                ctx.stroke();
              }
            } else if (p.type === 'aroma') {
              // Wavy Aroma Vapor Ring
              ctx.strokeStyle = 'rgba(230, 94, 61, 0.4)';
              ctx.lineWidth = 1.5;
              ctx.beginPath();
              ctx.arc(p.x, p.y, p.radius, p.wobble, p.wobble + Math.PI * 1.2);
              ctx.stroke();
            }

            ctx.restore();
          }

          if (p.y < -20 || p.alpha <= 0.01) {
            lightParticles.splice(i, 1);
          }
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
      className="pointer-events-none fixed inset-0 z-0 opacity-85 transition-opacity duration-300"
    />
  );
}
