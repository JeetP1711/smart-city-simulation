import { useState, useEffect } from 'react';

interface CityOSProps {
  onBack: () => void;
}

interface SystemStatus {
  name: string;
  icon: string;
  status: string;
  statusColor: string;
  value: number;
  gradient: string;
}

const SYSTEMS: SystemStatus[] = [
  { name: 'Mobility', icon: '🚗', status: 'OPTIMAL', statusColor: 'var(--accent-emerald)', value: 94, gradient: 'linear-gradient(135deg, rgba(0, 229, 255, 0.08), rgba(0, 229, 255, 0.02))' },
  { name: 'Energy', icon: '⚡', status: 'STABLE', statusColor: 'var(--accent-emerald)', value: 87, gradient: 'linear-gradient(135deg, rgba(255, 214, 0, 0.08), rgba(255, 214, 0, 0.02))' },
  { name: 'Water', icon: '💧', status: 'HEALTHY', statusColor: 'var(--accent-emerald)', value: 96, gradient: 'linear-gradient(135deg, rgba(0, 145, 234, 0.08), rgba(0, 145, 234, 0.02))' },
  { name: 'Environment', icon: '🌿', status: 'GOOD', statusColor: 'var(--accent-emerald)', value: 82, gradient: 'linear-gradient(135deg, rgba(0, 230, 118, 0.08), rgba(0, 230, 118, 0.02))' },
  { name: 'Safety', icon: '🛡️', status: 'ACTIVE', statusColor: 'var(--accent-cyan)', value: 98, gradient: 'linear-gradient(135deg, rgba(124, 77, 255, 0.08), rgba(124, 77, 255, 0.02))' },
  { name: 'Waste', icon: '♻️', status: 'EFFICIENT', statusColor: 'var(--accent-emerald)', value: 89, gradient: 'linear-gradient(135deg, rgba(0, 230, 118, 0.08), rgba(0, 230, 118, 0.02))' },
];

export default function CityOS({ onBack }: CityOSProps) {
  const [mounted, setMounted] = useState(false);
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    setMounted(true);
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (d: Date) => {
    return d.toLocaleTimeString('en-US', { hour12: false });
  };

  return (
    <div className="cityos-screen">
      <div className="ambient-bg">
        <div className="ambient-orb ambient-orb--cyan" />
        <div className="ambient-orb ambient-orb--purple" />
      </div>

      <div className="nav-back">
        <button className="btn-secondary" onClick={onBack} id="cityos-back-btn">
          ← BACK TO CITY
        </button>
      </div>

      <div className="cityos-header">
        <div className="cityos-header__left">
          <h1 className="cityos-title text-gradient">CITY OS</h1>
          <span className="cityos-subtitle">URBAN OPERATING SYSTEM • REAL-TIME MONITORING</span>
        </div>
        <div className="city-status">
          <span className="city-status__label">UPTIME</span>
          <span className="city-status__value">
            <span className="status-dot status-dot--online" />
            {formatTime(time)}
          </span>
        </div>
      </div>

      <div className="cityos-body">
        {SYSTEMS.map((sys, index) => (
          <div 
            key={sys.name}
            className="cityos-card glass-panel"
            style={{
              opacity: mounted ? 1 : 0,
              transform: mounted ? 'translateY(0)' : 'translateY(30px)',
              transition: `all 0.6s cubic-bezier(0.16, 1, 0.3, 1) ${index * 0.1}s`,
            }}
            id={`cityos-${sys.name.toLowerCase()}`}
          >
            <div className="cityos-card__bg" style={{ background: sys.gradient }} />
            
            <div>
              <div className="cityos-card__icon">{sys.icon}</div>
              <h3 className="cityos-card__name">{sys.name}</h3>
              <div className="cityos-card__status" style={{ color: sys.statusColor }}>
                <span className="status-dot status-dot--online" />
                {sys.status}
              </div>
            </div>

            <div className="cityos-card__meter">
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                marginBottom: '6px',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.6rem',
                color: 'var(--text-tertiary)',
                letterSpacing: '0.05em',
              }}>
                <span>EFFICIENCY</span>
                <span style={{ color: 'var(--text-primary)' }}>{sys.value}%</span>
              </div>
              <div className="progress-bar">
                <div 
                  className="progress-bar__fill progress-bar__fill--cyan"
                  style={{ 
                    width: mounted ? `${sys.value}%` : '0%',
                    transition: `width 1.5s cubic-bezier(0.16, 1, 0.3, 1) ${0.5 + index * 0.1}s`,
                  }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* City Health Overview */}
      <div style={{
        position: 'absolute',
        bottom: 'var(--space-xl)',
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-xl)',
        padding: 'var(--space-md) var(--space-xl)',
        background: 'var(--glass-bg)',
        backdropFilter: 'blur(16px)',
        border: '1px solid var(--glass-border)',
        borderRadius: 'var(--radius-full)',
        opacity: mounted ? 1 : 0,
        transition: 'opacity 1s ease 0.8s',
      }}>
        <span style={{ 
          fontFamily: 'var(--font-mono)', 
          fontSize: '0.6rem', 
          letterSpacing: '0.12em',
          color: 'var(--text-tertiary)',
          textTransform: 'uppercase' as const,
        }}>
          CITY HEALTH
        </span>
        <span style={{ 
          fontFamily: 'var(--font-display)', 
          fontSize: '1.2rem', 
          fontWeight: 700,
          color: 'var(--accent-emerald)',
        }}>
          98%
        </span>
        <span className="status-dot status-dot--online" />
        <span style={{ 
          fontFamily: 'var(--font-mono)', 
          fontSize: '0.6rem', 
          color: 'var(--accent-emerald)',
          letterSpacing: '0.08em',
        }}>
          ALL SYSTEMS NOMINAL
        </span>
      </div>
    </div>
  );
}
