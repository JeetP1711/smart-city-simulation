import { useEffect, useRef, useState, useCallback } from 'react';
import { CityRenderer, ActiveSystem, CityState } from '../engine/CityRenderer';
import type { AppScreen } from '../App';

interface CityViewProps {
  onNavigate: (screen: AppScreen) => void;
}

interface SystemInfo {
  title: string;
  subtitle: string;
  description: string;
  metrics: Array<{ label: string; value: string; unit?: string; percent: number; color: string }>;
  flow?: Array<{ icon: string; label: string }>;
  toggleLabel?: string;
  alert?: { type: 'warning' | 'success' | 'danger'; text: string };
}

const SYSTEM_DATA: Record<string, SystemInfo> = {
  mobility: {
    title: 'Smart Mobility',
    subtitle: 'THE CITY MOVES AS ONE.',
    description: 'Connected traffic infrastructure, intelligent signals, and coordinated public transport create seamless urban movement.',
    metrics: [
      { label: 'Traffic Flow', value: '87', unit: '%', percent: 87, color: 'cyan' },
      { label: 'Avg Speed', value: '34', unit: 'km/h', percent: 68, color: 'emerald' },
      { label: 'Transit On-Time', value: '94', unit: '%', percent: 94, color: 'cyan' },
      { label: 'EV Charging', value: '72', unit: '%', percent: 72, color: 'emerald' },
    ],
    flow: [
      { icon: '📡', label: 'Sensors Detect Traffic' },
      { icon: '🧠', label: 'AI Analyzes Flow' },
      { icon: '🚦', label: 'Signals Adapt' },
      { icon: '🚗', label: 'Traffic Moves' },
    ],
    toggleLabel: 'SMART TRAFFIC',
  },
  energy: {
    title: 'Smart Energy',
    subtitle: 'POWER FLOWS WHERE IT\'S NEEDED.',
    description: 'Solar generation, smart grids, and intelligent building management create an efficient, sustainable energy ecosystem.',
    metrics: [
      { label: 'Solar Generation', value: '4.2', unit: 'MW', percent: 78, color: 'amber' },
      { label: 'Grid Efficiency', value: '92', unit: '%', percent: 92, color: 'emerald' },
      { label: 'Building Savings', value: '35', unit: '%', percent: 35, color: 'cyan' },
      { label: 'Storage Level', value: '67', unit: '%', percent: 67, color: 'cyan' },
    ],
    flow: [
      { icon: '☀️', label: 'Solar Collection' },
      { icon: '🔋', label: 'Energy Storage' },
      { icon: '⚡', label: 'Smart Distribution' },
      { icon: '🏢', label: 'Building Delivery' },
    ],
    toggleLabel: 'SMART ENERGY',
  },
  water: {
    title: 'Smart Water',
    subtitle: 'EVERY DROP MATTERS.',
    description: 'Underground monitoring, leak detection, and intelligent distribution ensure clean water reaches every building efficiently.',
    metrics: [
      { label: 'Distribution', value: '96', unit: '%', percent: 96, color: 'cyan' },
      { label: 'Leak Detection', value: '99', unit: '%', percent: 99, color: 'emerald' },
      { label: 'Water Quality', value: 'A+', percent: 95, color: 'cyan' },
      { label: 'Reuse Rate', value: '41', unit: '%', percent: 41, color: 'emerald' },
    ],
    flow: [
      { icon: '💧', label: 'Reservoir' },
      { icon: '🔬', label: 'Treatment' },
      { icon: '🔄', label: 'Distribution' },
      { icon: '🏠', label: 'Buildings' },
      { icon: '♻️', label: 'Reuse' },
    ],
    toggleLabel: 'SMART WATER',
    alert: { type: 'warning', text: 'WATER ANOMALY DETECTED — SECTOR 7' },
  },
  environment: {
    title: 'Environment',
    subtitle: 'A CITY THAT BREATHES.',
    description: 'Air quality monitoring, smart parks, and green infrastructure create a healthier urban environment.',
    metrics: [
      { label: 'Air Quality', value: 'Good', percent: 82, color: 'emerald' },
      { label: 'Green Cover', value: '34', unit: '%', percent: 34, color: 'emerald' },
      { label: 'CO₂ Reduction', value: '28', unit: '%', percent: 28, color: 'cyan' },
      { label: 'Noise Level', value: 'Low', percent: 75, color: 'cyan' },
    ],
    toggleLabel: 'SMART ENVIRONMENT',
  },
  safety: {
    title: 'Public Safety',
    subtitle: 'THE CITY RESPONDS AS ONE.',
    description: 'Coordinated emergency services, smart infrastructure monitoring, and connected response systems protect citizens.',
    metrics: [
      { label: 'Response Time', value: '4.2', unit: 'min', percent: 85, color: 'cyan' },
      { label: 'Coverage', value: '98', unit: '%', percent: 98, color: 'emerald' },
      { label: 'Systems Active', value: '247', percent: 92, color: 'cyan' },
      { label: 'Alert Status', value: 'LOW', percent: 15, color: 'emerald' },
    ],
    toggleLabel: 'SMART SAFETY',
  },
  waste: {
    title: 'Smart Waste',
    subtitle: 'CLEANER. SMARTER. GREENER.',
    description: 'Sensor-equipped bins, optimized collection routes, and data-driven waste management minimize environmental impact.',
    metrics: [
      { label: 'Collection Eff.', value: '89', unit: '%', percent: 89, color: 'emerald' },
      { label: 'Route Opt.', value: '42', unit: '%', percent: 42, color: 'cyan' },
      { label: 'Recycling', value: '56', unit: '%', percent: 56, color: 'emerald' },
      { label: 'Bins Online', value: '96', unit: '%', percent: 96, color: 'cyan' },
    ],
    flow: [
      { icon: '🗑️', label: 'Smart Bins' },
      { icon: '📊', label: 'Data Analysis' },
      { icon: '🗺️', label: 'Route Optimization' },
      { icon: '🚛', label: 'Collection' },
    ],
    toggleLabel: 'SMART WASTE',
  },
  health: {
    title: 'Smart Health',
    subtitle: 'CARE THAT COMES TO YOU.',
    description: 'Connected healthcare, coordinated emergency response, and hospital resource management save lives.',
    metrics: [
      { label: 'Ambulance Avg', value: '5.8', unit: 'min', percent: 82, color: 'cyan' },
      { label: 'Hospital Cap.', value: '73', unit: '%', percent: 73, color: 'emerald' },
      { label: 'Connected', value: '12', unit: 'facilities', percent: 100, color: 'cyan' },
      { label: 'Telehealth', value: 'Active', percent: 88, color: 'emerald' },
    ],
    toggleLabel: 'EMERGENCY RESPONSE',
    alert: { type: 'danger', text: 'EMERGENCY ROUTE ACTIVATED' },
  },
};

const NAV_ITEMS: Array<{ id: ActiveSystem; label: string; icon: string }> = [
  { id: 'overview', label: 'Overview', icon: '◉' },
  { id: 'mobility', label: 'Mobility', icon: '🚗' },
  { id: 'energy', label: 'Energy', icon: '⚡' },
  { id: 'water', label: 'Water', icon: '💧' },
  { id: 'environment', label: 'Environment', icon: '🌿' },
  { id: 'safety', label: 'Safety', icon: '🛡️' },
  { id: 'waste', label: 'Waste', icon: '♻️' },
  { id: 'health', label: 'Health', icon: '🏥' },
];

export default function CityView({ onNavigate }: CityViewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<CityRenderer | null>(null);
  const [activeSystem, setActiveSystem] = useState<ActiveSystem>('overview');
  const [cityState, setCityState] = useState<CityState>({
    smartTraffic: true,
    smartEnergy: true,
    smartWater: true,
    smartWaste: true,
    smartSafety: true,
    smartEnvironment: true,
  });
  const [showAlert, setShowAlert] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const renderer = new CityRenderer(canvas);
    rendererRef.current = renderer;
    renderer.start();

    const handleResize = () => renderer.resize();
    window.addEventListener('resize', handleResize);

    const handleMouseMove = (e: MouseEvent) => {
      renderer.handleMouseMove(e.clientX, e.clientY);
    };
    canvas.addEventListener('mousemove', handleMouseMove);

    return () => {
      renderer.stop();
      window.removeEventListener('resize', handleResize);
      canvas.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  const handleSystemChange = useCallback((system: ActiveSystem) => {
    setActiveSystem(system);
    rendererRef.current?.setActiveSystem(system);

    if (system === 'health') {
      rendererRef.current?.setEmergency(true);
      setShowAlert(true);
    } else {
      rendererRef.current?.setEmergency(false);
      setShowAlert(false);
    }

    if (system === 'water') {
      rendererRef.current?.setWaterAnomaly(true);
    } else {
      rendererRef.current?.setWaterAnomaly(false);
    }
  }, []);

  const toggleSystem = useCallback((key: keyof CityState) => {
    setCityState(prev => {
      const next = { ...prev, [key]: !prev[key] };
      rendererRef.current?.setCityState(next);
      return next;
    });
  }, []);

  const systemInfo = activeSystem !== 'overview' ? SYSTEM_DATA[activeSystem] : null;

  const getToggleKey = (system: ActiveSystem): keyof CityState | null => {
    const map: Record<string, keyof CityState> = {
      mobility: 'smartTraffic',
      energy: 'smartEnergy',
      water: 'smartWater',
      waste: 'smartWaste',
      safety: 'smartSafety',
      environment: 'smartEnvironment',
    };
    return map[system] || null;
  };

  return (
    <div className="city-view">
      {/* City Canvas */}
      <div className="city-canvas-container">
        <canvas ref={canvasRef} />
      </div>

      {/* Top Bar */}
      <div className="city-topbar">
        <div className="city-logo">
          <span className="city-logo__name">CITYNEXUS</span>
          <span className="city-logo__tag">SMART CITY • DIGITAL TWIN</span>
        </div>
        <div className="city-status">
          <span className="city-status__label">CITY STATUS</span>
          <span className="city-status__value">
            <span className="status-dot status-dot--online" />
            ONLINE — 98% OPERATIONAL
          </span>
        </div>
      </div>

      {/* Left Toolbar */}
      <div className="city-toolbar">
        <button 
          className="toolbar-btn" 
          title="City OS"
          onClick={() => onNavigate('cityos')}
          id="cityos-btn"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="3" y="3" width="7" height="7" rx="1" />
            <rect x="14" y="3" width="7" height="7" rx="1" />
            <rect x="3" y="14" width="7" height="7" rx="1" />
            <rect x="14" y="14" width="7" height="7" rx="1" />
          </svg>
        </button>
        <button 
          className="toolbar-btn" 
          title="Simulation"
          onClick={() => onNavigate('simulation')}
          id="simulation-btn"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
          </svg>
        </button>
        <button 
          className="toolbar-btn" 
          title="Before & After"
          onClick={() => onNavigate('beforeafter')}
          id="beforeafter-btn"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M12 3v18M3 12h18" />
            <path d="M8 8l-4 4 4 4M16 8l4 4-4 4" />
          </svg>
        </button>
        <button 
          className="toolbar-btn" 
          title="People"
          onClick={() => onNavigate('people')}
          id="people-btn"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
        </button>
        <button 
          className="toolbar-btn" 
          title="Timeline"
          onClick={() => onNavigate('timeline')}
          id="timeline-btn"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 6v6l4 2" />
          </svg>
        </button>
      </div>

      {/* Bottom Navigation */}
      <nav className="city-nav" id="system-nav">
        {NAV_ITEMS.map(item => (
          <button
            key={item.id}
            className={`city-nav__btn ${activeSystem === item.id ? 'active' : ''}`}
            onClick={() => handleSystemChange(item.id)}
            id={`nav-${item.id}`}
          >
            <span>{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      {/* System Info Panel */}
      {systemInfo && (
        <div className="system-panel glass-panel" id="system-panel">
          <div className="system-panel__content">
            <div className="system-panel__header">
              <h2 className="system-panel__title">{systemInfo.title}</h2>
              <button 
                className="system-panel__close" 
                onClick={() => handleSystemChange('overview')}
                id="close-panel-btn"
              >
                ✕
              </button>
            </div>

            <p className="system-panel__subtitle">{systemInfo.subtitle}</p>
            <p className="system-panel__desc">{systemInfo.description}</p>

            {/* Alert */}
            {systemInfo.alert && showAlert && (
              <div className={`alert-banner alert-banner--${systemInfo.alert.type}`}>
                <span>⚠</span>
                <span className="alert-banner__text">{systemInfo.alert.text}</span>
              </div>
            )}

            {/* Metrics */}
            <div className="metrics-grid">
              {systemInfo.metrics.map((m, i) => (
                <div className="metric-card" key={i}>
                  <div className="metric-card__label">{m.label}</div>
                  <div className="metric-card__value">
                    {m.value}
                    {m.unit && <span className="metric-card__unit">{m.unit}</span>}
                  </div>
                  <div className="metric-card__bar">
                    <div className="progress-bar">
                      <div 
                        className={`progress-bar__fill progress-bar__fill--${m.color}`}
                        style={{ width: `${m.percent}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Flow Diagram */}
            {systemInfo.flow && (
              <div className="flow-diagram">
                {systemInfo.flow.map((step, i) => (
                  <div key={i}>
                    <div className="flow-step">
                      <div className="flow-step__icon">{step.icon}</div>
                      <span className="flow-step__label">{step.label}</span>
                    </div>
                    {i < systemInfo.flow!.length - 1 && <div className="flow-arrow" />}
                  </div>
                ))}
              </div>
            )}

            {/* Toggle */}
            {systemInfo.toggleLabel && getToggleKey(activeSystem) && (
              <div className="toggle-container">
                <span className="toggle-label">{systemInfo.toggleLabel}</span>
                <button
                  className={`toggle-switch ${cityState[getToggleKey(activeSystem)!] ? 'active' : ''}`}
                  onClick={() => toggleSystem(getToggleKey(activeSystem)!)}
                  id={`toggle-${activeSystem}`}
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
