import { useEffect, useRef, useState } from 'react';

interface IntroScreenProps {
  onEnter: () => void;
}

export default function IntroScreen({ onEnter }: IntroScreenProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    let animId: number;
    let time = 0;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio, 2);
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      ctx.scale(dpr, dpr);
    };
    resize();
    window.addEventListener('resize', resize);

    // Star field + city silhouette
    interface Star { x: number; y: number; s: number; b: number; speed: number; }
    const stars: Star[] = Array.from({ length: 200 }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight * 0.6,
      s: 0.5 + Math.random() * 1.5,
      b: Math.random(),
      speed: 0.2 + Math.random() * 0.5,
    }));

    // City buildings for silhouette
    interface Silhouette { x: number; w: number; h: number; }
    const buildings: Silhouette[] = [];
    let bx = 0;
    while (bx < window.innerWidth + 50) {
      const w = 15 + Math.random() * 45;
      const h = 40 + Math.random() * 200;
      buildings.push({ x: bx, w, h });
      bx += w + 2 + Math.random() * 8;
    }

    // Data particles
    interface DataParticle { x: number; y: number; vx: number; vy: number; life: number; maxLife: number; }
    const particles: DataParticle[] = [];

    const animate = () => {
      time++;
      const w = window.innerWidth;
      const h = window.innerHeight;
      
      ctx.clearRect(0, 0, w, h);

      // Sky gradient
      const skyGrad = ctx.createLinearGradient(0, 0, 0, h);
      skyGrad.addColorStop(0, '#020408');
      skyGrad.addColorStop(0.4, '#060a14');
      skyGrad.addColorStop(0.7, '#0a1020');
      skyGrad.addColorStop(1, '#0e1830');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, w, h);

      // Stars
      for (const star of stars) {
        const twinkle = Math.sin(time * 0.02 * star.speed + star.x * 0.01) * 0.3 + 0.7;
        ctx.fillStyle = `rgba(200, 220, 255, ${star.b * twinkle * 0.6})`;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.s, 0, Math.PI * 2);
        ctx.fill();
      }

      // Horizon glow
      const horizonY = h * 0.65;
      const glowGrad = ctx.createRadialGradient(w / 2, horizonY, 0, w / 2, horizonY, w * 0.6);
      glowGrad.addColorStop(0, 'rgba(0, 229, 255, 0.06)');
      glowGrad.addColorStop(0.5, 'rgba(0, 229, 255, 0.02)');
      glowGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = glowGrad;
      ctx.fillRect(0, 0, w, h);

      // City silhouette
      const baseY = h * 0.7;
      for (const b of buildings) {
        const sway = Math.sin(time * 0.003 + b.x * 0.01) * 1;
        
        // Building body
        ctx.fillStyle = '#0a0e18';
        ctx.fillRect(b.x, baseY - b.h + sway, b.w, b.h);

        // Windows
        const windowRows = Math.floor(b.h / 12);
        const windowCols = Math.floor(b.w / 8);
        for (let r = 0; r < windowRows; r++) {
          for (let c = 0; c < windowCols; c++) {
            const isLit = Math.sin(r * 7.3 + c * 11.1 + b.x * 0.3 + time * 0.005) > 0.2;
            if (isLit) {
              const intensity = Math.sin(time * 0.01 + r + c + b.x) * 0.3 + 0.7;
              const color = Math.random() > 0.3 ? 
                `rgba(0, 200, 255, ${0.15 * intensity})` : 
                `rgba(255, 200, 100, ${0.1 * intensity})`;
              ctx.fillStyle = color;
              ctx.fillRect(b.x + 3 + c * 8, baseY - b.h + 4 + r * 12 + sway, 4, 6);
            }
          }
        }

        // Roof line glow
        ctx.fillStyle = `rgba(0, 229, 255, ${0.05 + Math.sin(time * 0.02 + b.x * 0.05) * 0.03})`;
        ctx.fillRect(b.x, baseY - b.h + sway - 1, b.w, 1);
      }

      // Ground reflection
      const refGrad = ctx.createLinearGradient(0, baseY, 0, h);
      refGrad.addColorStop(0, 'rgba(0, 229, 255, 0.03)');
      refGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = refGrad;
      ctx.fillRect(0, baseY, w, h - baseY);

      // Data flow particles
      if (time % 5 === 0 && particles.length < 50) {
        const startBuilding = buildings[Math.floor(Math.random() * buildings.length)];
        particles.push({
          x: startBuilding.x + startBuilding.w / 2,
          y: baseY - startBuilding.h * (0.3 + Math.random() * 0.5),
          vx: (Math.random() - 0.5) * 2,
          vy: -0.5 - Math.random(),
          life: 100 + Math.random() * 100,
          maxLife: 200,
        });
      }

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy *= 0.99;
        p.vx *= 0.99;
        p.life--;
        
        const alpha = Math.min(1, p.life / p.maxLife) * 0.5;
        ctx.fillStyle = `rgba(0, 229, 255, ${alpha})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 1.5, 0, Math.PI * 2);
        ctx.fill();

        // Trail
        ctx.strokeStyle = `rgba(0, 229, 255, ${alpha * 0.3})`;
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x - p.vx * 5, p.y - p.vy * 5);
        ctx.stroke();

        if (p.life <= 0) particles.splice(i, 1);
      }

      // Horizontal data lines
      for (let i = 0; i < 3; i++) {
        const lineY = baseY - 40 - i * 50;
        const progress = ((time * (0.5 + i * 0.3)) % w);
        const lineGrad = ctx.createLinearGradient(progress - 100, 0, progress + 100, 0);
        lineGrad.addColorStop(0, 'transparent');
        lineGrad.addColorStop(0.5, `rgba(0, 229, 255, 0.15)`);
        lineGrad.addColorStop(1, 'transparent');
        ctx.strokeStyle = lineGrad;
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(progress - 100, lineY);
        ctx.lineTo(progress + 100, lineY);
        ctx.stroke();
      }

      animId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  const handleEnter = () => {
    setEntered(true);
    setTimeout(onEnter, 800);
  };

  // Generate floating particles
  const floatingParticles = Array.from({ length: 30 }, (_, i) => ({
    left: `${Math.random() * 100}%`,
    delay: `${Math.random() * 20}s`,
    duration: `${15 + Math.random() * 20}s`,
  }));

  return (
    <div className={`intro-screen ${entered ? 'entered' : ''}`}>
      <div className="intro-bg">
        <canvas ref={canvasRef} />
      </div>
      <div className="intro-overlay" />
      
      {/* Corner brackets */}
      <div className="intro-corner intro-corner--tl" />
      <div className="intro-corner intro-corner--tr" />
      <div className="intro-corner intro-corner--bl" />
      <div className="intro-corner intro-corner--br" />

      {/* Floating particles */}
      <div className="intro-particles">
        {floatingParticles.map((p, i) => (
          <div
            key={i}
            className="intro-particle"
            style={{
              left: p.left,
              bottom: '0',
              '--duration': p.duration,
              '--delay': p.delay,
            } as React.CSSProperties}
          />
        ))}
      </div>

      <div className="intro-content">
        <div className="intro-logo">CITYNEXUS</div>
        
        <h1 className="intro-title">
          A CITY THAT <span className="highlight">THINKS.</span>
        </h1>
        
        <p className="intro-subtitle">
          Explore how connected technology, data, and intelligent infrastructure create a safer, cleaner, and more human-centered urban future.
        </p>

        <div className="intro-actions">
          <button className="btn-primary" onClick={handleEnter} id="enter-city-btn">
            <span>ENTER THE CITY</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </button>
          <button className="btn-secondary" onClick={handleEnter} id="explore-systems-btn">
            EXPLORE SYSTEMS
          </button>
        </div>
      </div>

      <div className="intro-status">
        <span className="status-dot status-dot--online" />
        <span className="text-label">SYSTEMS ONLINE • READY</span>
      </div>
    </div>
  );
}
