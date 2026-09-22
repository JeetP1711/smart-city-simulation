import { useEffect, useRef, useState, useCallback } from 'react';
import { CityRenderer, CityState } from '../engine/CityRenderer';

interface SimulationModeProps {
  onBack: () => void;
}

interface ToggleDef {
  key: keyof CityState;
  name: string;
  icon: string;
  desc: string;
}

const TOGGLES: ToggleDef[] = [
  { key: 'smartTraffic', name: 'Smart Traffic', icon: '🚦', desc: 'Intelligent signal coordination' },
  { key: 'smartEnergy', name: 'Smart Energy', icon: '⚡', desc: 'Optimized power distribution' },
  { key: 'smartWater', name: 'Smart Water', icon: '💧', desc: 'Leak detection & monitoring' },
  { key: 'smartWaste', name: 'Smart Waste', icon: '♻️', desc: 'Automated collection routing' },
  { key: 'smartSafety', name: 'Smart Safety', icon: '🛡️', desc: 'Coordinated emergency response' },
  { key: 'smartEnvironment', name: 'Smart Environment', icon: '🌿', desc: 'Air quality & green monitoring' },
];

export default function SimulationMode({ onBack }: SimulationModeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<CityRenderer | null>(null);
  const [cityState, setCityState] = useState<CityState>({
    smartTraffic: true,
    smartEnergy: true,
    smartWater: true,
    smartWaste: true,
    smartSafety: true,
    smartEnvironment: true,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const renderer = new CityRenderer(canvas);
    rendererRef.current = renderer;
    renderer.start();

    const handleResize = () => renderer.resize();
    window.addEventListener('resize', handleResize);

    return () => {
      renderer.stop();
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const toggleSystem = useCallback((key: keyof CityState) => {
    setCityState(prev => {
      const next = { ...prev, [key]: !prev[key] };
      rendererRef.current?.setCityState(next);
      return next;
    });
  }, []);

  const activeCount = Object.values(cityState).filter(Boolean).length;
  const totalSystems = Object.values(cityState).length;

  const getImpact = () => {
    const impacts = [];
    impacts.push({
      label: 'Traffic Efficiency',
      value: cityState.smartTraffic ? '+42%' : '-28%',
      positive: cityState.smartTraffic,
    });
    impacts.push({
      label: 'Energy Savings',
      value: cityState.smartEnergy ? '+35%' : '-15%',
      positive: cityState.smartEnergy,
    });
    impacts.push({
      label: 'Water Loss',
      value: cityState.smartWater ? '-89%' : '+45%',
      positive: cityState.smartWater,
    });
    impacts.push({
      label: 'Waste Collection',
      value: cityState.smartWaste ? '+56%' : '-30%',
      positive: cityState.smartWaste,
    });
    impacts.push({
      label: 'Response Time',
      value: cityState.smartSafety ? '-65%' : '+120%',
      positive: cityState.smartSafety,
    });
    impacts.push({
      label: 'Air Quality',
      value: cityState.smartEnvironment ? '+28%' : '-12%',
      positive: cityState.smartEnvironment,
    });
    return impacts;
  };

  return (
    <div className="simulation-screen">
      <div className="nav-back">
        <button className="btn-secondary" onClick={onBack} id="sim-back-btn">
          ← BACK TO CITY
        </button>
      </div>

      <div className="simulation-city">
        <canvas ref={canvasRef} />
      </div>

      <div className="simulation-controls">
        <div className="simulation-controls__header">
          <h2 className="simulation-controls__title text-gradient">Simulation</h2>
          <span className="simulation-controls__sub">
            TOGGLE SYSTEMS TO SEE IMPACT
          </span>
        </div>

        <div className="simulation-controls__body">
          {/* Active Systems Counter */}
          <div style={{
            textAlign: 'center',
            padding: 'var(--space-lg)',
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            marginBottom: 'var(--space-sm)',
          }}>
            <div style={{
              fontFamily: 'var(--font-display)',
              fontSize: '2.5rem',
              fontWeight: 800,
              color: activeCount === totalSystems ? 'var(--accent-emerald)' : 
                     activeCount > totalSystems / 2 ? 'var(--accent-cyan)' : 'var(--accent-amber)',
              transition: 'color 0.3s ease',
            }}>
              {activeCount}/{totalSystems}
            </div>
            <div style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.6rem',
              color: 'var(--text-tertiary)',
              letterSpacing: '0.12em',
              textTransform: 'uppercase' as const,
            }}>
              SYSTEMS ACTIVE
            </div>
          </div>

          {/* Toggles */}
          {TOGGLES.map(toggle => (
            <div className="simulation-toggle" key={toggle.key}>
              <div className="simulation-toggle__info">
                <div className="simulation-toggle__name">
                  {toggle.icon} {toggle.name}
                </div>
                <div className="simulation-toggle__desc">{toggle.desc}</div>
              </div>
              <button
                className={`toggle-switch ${cityState[toggle.key] ? 'active' : ''}`}
                onClick={() => toggleSystem(toggle.key)}
                id={`sim-toggle-${toggle.key}`}
              />
            </div>
          ))}

          {/* Impact Analysis */}
          <div className="simulation-impact">
            <div className="simulation-impact__title">
              CITY IMPACT ANALYSIS
            </div>
            {getImpact().map((impact, i) => (
              <div className="simulation-impact__item" key={i}>
                <span className="simulation-impact__label">{impact.label}</span>
                <span className={`simulation-impact__value ${impact.positive ? 'positive' : 'negative'}`}>
                  {impact.value}
                </span>
              </div>
            ))}
          </div>

          {/* Master controls */}
          <div style={{ display: 'flex', gap: 'var(--space-sm)', marginTop: 'var(--space-md)' }}>
            <button 
              className="btn-primary" 
              style={{ flex: 1, fontSize: '0.7rem' }}
              onClick={() => {
                const allOn: CityState = { smartTraffic: true, smartEnergy: true, smartWater: true, smartWaste: true, smartSafety: true, smartEnvironment: true };
                setCityState(allOn);
                rendererRef.current?.setCityState(allOn);
              }}
              id="enable-all-btn"
            >
              ENABLE ALL
            </button>
            <button 
              className="btn-secondary" 
              style={{ flex: 1, fontSize: '0.7rem' }}
              onClick={() => {
                const allOff: CityState = { smartTraffic: false, smartEnergy: false, smartWater: false, smartWaste: false, smartSafety: false, smartEnvironment: false };
                setCityState(allOff);
                rendererRef.current?.setCityState(allOff);
              }}
              id="disable-all-btn"
            >
              DISABLE ALL
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
