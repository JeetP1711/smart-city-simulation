interface TimelineProps {
  onBack: () => void;
  onContinue: () => void;
}

const STAGES = [
  {
    label: 'PHASE 01',
    name: 'Today',
    desc: 'Traditional infrastructure with isolated systems. Limited data collection and manual monitoring of city services.',
  },
  {
    label: 'PHASE 02',
    name: 'Connected',
    desc: 'Sensors and IoT devices deployed across infrastructure. Data begins flowing between systems, creating visibility.',
  },
  {
    label: 'PHASE 03',
    name: 'Intelligent',
    desc: 'AI and machine learning analyze data in real-time. Systems begin making autonomous decisions and predictions.',
  },
  {
    label: 'PHASE 04',
    name: 'Sustainable',
    desc: 'Energy optimization, water conservation, and waste reduction become automated. The city becomes self-sustaining.',
  },
  {
    label: 'PHASE 05',
    name: 'Human-Centered',
    desc: 'Technology becomes invisible. Citizens experience seamless services that adapt to their needs and preferences.',
  },
  {
    label: 'PHASE 06',
    name: 'Future City',
    desc: 'A fully integrated urban ecosystem where every system works in harmony. The city thinks, adapts, and evolves.',
  },
];

export default function Timeline({ onBack, onContinue }: TimelineProps) {
  return (
    <div className="timeline-screen">
      <div className="ambient-bg">
        <div className="ambient-orb ambient-orb--cyan" />
        <div className="ambient-orb ambient-orb--purple" />
      </div>

      <div className="nav-back">
        <button className="btn-secondary" onClick={onBack} id="timeline-back-btn">← BACK TO CITY</button>
      </div>

      <div className="timeline-header">
        <div className="text-label-accent" style={{ marginBottom: '12px' }}>EVOLUTION</div>
        <h1 className="timeline-title">
          THE ROAD TO A <span className="text-gradient">SMARTER CITY</span>
        </h1>
      </div>

      <div className="timeline-body">
        <div className="timeline-line" />
        
        {STAGES.map((stage, i) => (
          <div 
            className="timeline-stage" 
            key={i}
            style={{ '--delay': `${0.3 + i * 0.15}s` } as React.CSSProperties}
          >
            <div className="timeline-stage__content" style={{ textAlign: i % 2 === 0 ? 'right' : 'left' }}>
              <div className="timeline-stage__label">{stage.label}</div>
              <div className="timeline-stage__name">{stage.name}</div>
              <p className="timeline-stage__desc">{stage.desc}</p>
            </div>
            <div className="timeline-stage__dot" />
            <div style={{ flex: 1 }} />
          </div>
        ))}
      </div>

      <div className="nav-continue">
        <button className="btn-primary" onClick={onContinue} id="timeline-continue-btn">
          CONTINUE →
        </button>
      </div>
    </div>
  );
}
