import { useEffect, useRef } from 'react';

interface FinalScreenProps {
  onRestart: () => void;
  onExplore: () => void;
}

export default function FinalScreen({ onRestart, onExplore }: FinalScreenProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    let animId: number;
    let time = 0;

    interface StarParticle {
      x: number; y: number; s: number; b: number; speed: number;
    }

    const stars: StarParticle[] = Array.from({ length: 150 }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      s: 0.5 + Math.random() * 2,
      b: Math.random(),
      speed: 0.1 + Math.random() * 0.3,
    }));

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio, 2);
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      ctx.scale(dpr, dpr);
    };
    resize();
    window.addEventListener('resize', resize);

    const animate = () => {
      time++;
      const w = window.innerWidth;
      const h = window.innerHeight;

      // Background
      const bgGrad = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w * 0.7);
      bgGrad.addColorStop(0, '#0a1020');
      bgGrad.addColorStop(0.5, '#060a14');
      bgGrad.addColorStop(1, '#020408');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, w, h);

      // Stars
      for (const star of stars) {
        const twinkle = Math.sin(time * 0.015 * star.speed + star.x * 0.01) * 0.3 + 0.7;
        ctx.fillStyle = `rgba(180, 200, 255, ${star.b * twinkle * 0.5})`;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.s, 0, Math.PI * 2);
        ctx.fill();
      }

      // Central glow
      const glowGrad = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, 300);
      glowGrad.addColorStop(0, 'rgba(0, 229, 255, 0.04)');
      glowGrad.addColorStop(0.5, 'rgba(0, 229, 255, 0.01)');
      glowGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = glowGrad;
      ctx.fillRect(0, 0, w, h);

      // Orbiting particles
      for (let i = 0; i < 8; i++) {
        const angle = (time * 0.005 + i * Math.PI / 4);
        const radius = 150 + Math.sin(time * 0.01 + i) * 30;
        const px = w / 2 + Math.cos(angle) * radius;
        const py = h / 2 + Math.sin(angle) * radius * 0.4;
        
        ctx.fillStyle = `rgba(0, 229, 255, ${0.3 + Math.sin(time * 0.02 + i) * 0.2})`;
        ctx.beginPath();
        ctx.arc(px, py, 2, 0, Math.PI * 2);
        ctx.fill();
      }

      animId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <div className="final-screen">
      <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} />
      
      <div className="intro-corner intro-corner--tl" />
      <div className="intro-corner intro-corner--tr" />
      <div className="intro-corner intro-corner--bl" />
      <div className="intro-corner intro-corner--br" />
      
      <div className="final-content">
        <div className="final-statement" style={{ '--delay': '0.3s' } as React.CSSProperties}>
          THE FUTURE OF CITIES IS NOT ABOUT<br /> BUILDING <em>MORE.</em>
        </div>

        <div className="final-statement" style={{ '--delay': '1.2s' } as React.CSSProperties}>
          IT'S ABOUT BUILDING <em>BETTER.</em>
        </div>

        <div className="final-words">
          {['SMARTER.', 'CLEANER.', 'SAFER.', 'MORE CONNECTED.', 'MORE HUMAN.'].map((word, i) => (
            <div
              key={i}
              className="final-word text-gradient"
              style={{ '--delay': `${2.5 + i * 0.4}s` } as React.CSSProperties}
            >
              {word}
            </div>
          ))}
        </div>

        <div className="final-actions">
          <button className="btn-primary" onClick={onExplore} id="explore-again-btn">
            EXPLORE THE CITY AGAIN
          </button>
          <button className="btn-secondary" onClick={onRestart} id="restart-btn">
            START OVER
          </button>
        </div>
      </div>
    </div>
  );
}
