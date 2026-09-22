interface BeforeAfterProps {
  onBack: () => void;
  onContinue: () => void;
}

const BEFORE_ITEMS = [
  { icon: '🚗', name: 'Traffic Congestion', desc: 'Fixed signals, no coordination' },
  { icon: '💡', name: 'Wasted Energy', desc: 'Lights on 24/7, no optimization' },
  { icon: '💧', name: 'Water Leaks', desc: 'Undetected for days or weeks' },
  { icon: '🗑️', name: 'Overflowing Waste', desc: 'Fixed collection schedules' },
  { icon: '🚑', name: 'Slow Response', desc: 'Delayed emergency coordination' },
];

const AFTER_ITEMS = [
  { icon: '🚦', name: 'Connected Traffic', desc: 'AI-optimized flow everywhere' },
  { icon: '☀️', name: 'Optimized Energy', desc: 'Smart grid, solar, storage' },
  { icon: '📡', name: 'Water Monitoring', desc: 'Real-time leak detection' },
  { icon: '♻️', name: 'Smart Collection', desc: 'Data-driven, efficient routes' },
  { icon: '🏥', name: 'Coordinated Response', desc: 'Connected emergency network' },
];

export default function BeforeAfter({ onBack, onContinue }: BeforeAfterProps) {
  return (
    <div className="beforeafter-screen">
      <div className="ambient-bg">
        <div className="ambient-orb ambient-orb--cyan" />
        <div className="ambient-orb ambient-orb--emerald" />
      </div>

      <div className="nav-back">
        <button className="btn-secondary" onClick={onBack} id="ba-back-btn">← BACK TO CITY</button>
      </div>

      <div className="beforeafter-header">
        <div className="text-label-accent" style={{ marginBottom: '12px' }}>TRANSFORMATION</div>
        <h1 className="beforeafter-title">
          FROM CITY → <span className="text-gradient">SMART CITY</span>
        </h1>
      </div>

      <div className="beforeafter-body">
        {/* Before Side */}
        <div className="beforeafter-side beforeafter-side--before">
          <div className="beforeafter-side__label">⬤ TRADITIONAL CITY</div>
          <div className="beforeafter-items">
            {BEFORE_ITEMS.map((item, i) => (
              <div 
                className="beforeafter-item" 
                key={i}
                style={{ '--delay': `${0.3 + i * 0.15}s` } as React.CSSProperties}
              >
                <div className="beforeafter-item__icon">{item.icon}</div>
                <div className="beforeafter-item__text">
                  <div className="beforeafter-item__name">{item.name}</div>
                  <div className="beforeafter-item__desc">{item.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Divider */}
        <div className="beforeafter-divider">→</div>

        {/* After Side */}
        <div className="beforeafter-side beforeafter-side--after">
          <div className="beforeafter-side__label">⬤ SMART CITY</div>
          <div className="beforeafter-items">
            {AFTER_ITEMS.map((item, i) => (
              <div 
                className="beforeafter-item" 
                key={i}
                style={{ '--delay': `${0.5 + i * 0.15}s` } as React.CSSProperties}
              >
                <div className="beforeafter-item__icon">{item.icon}</div>
                <div className="beforeafter-item__text">
                  <div className="beforeafter-item__name">{item.name}</div>
                  <div className="beforeafter-item__desc">{item.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="nav-continue">
        <button className="btn-primary" onClick={onContinue} id="ba-continue-btn">
          CONTINUE →
        </button>
      </div>
    </div>
  );
}
