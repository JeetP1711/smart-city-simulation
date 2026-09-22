import { useState } from 'react';

interface PeopleSectionProps {
  onBack: () => void;
  onContinue: () => void;
}

interface Persona {
  id: string;
  name: string;
  avatar: string;
  benefits: Array<{ icon: string; title: string; desc: string }>;
}

const PERSONAS: Persona[] = [
  {
    id: 'student',
    name: 'Student',
    avatar: '🎓',
    benefits: [
      { icon: '🚌', title: 'Faster Transit', desc: 'Smart routes cut commute time by 30%' },
      { icon: '🛡️', title: 'Safer Roads', desc: 'Connected crosswalks and bike lanes' },
      { icon: '📶', title: 'Public Wi-Fi', desc: 'City-wide connectivity for study' },
      { icon: '📱', title: 'Digital Services', desc: 'Access everything from your phone' },
    ],
  },
  {
    id: 'worker',
    name: 'Worker',
    avatar: '💼',
    benefits: [
      { icon: '🚗', title: 'Smart Mobility', desc: 'Intelligent routing saves 45 min/day' },
      { icon: '🏢', title: 'Comfort', desc: 'Smart buildings optimize work environment' },
      { icon: '⚡', title: 'Reliability', desc: 'Consistent power and connectivity' },
      { icon: '🌿', title: 'Clean Air', desc: 'Monitored environment improves health' },
    ],
  },
  {
    id: 'family',
    name: 'Family',
    avatar: '👨‍👩‍👧',
    benefits: [
      { icon: '🛡️', title: 'Safety', desc: 'Connected emergency response' },
      { icon: '🌳', title: 'Clean Environment', desc: 'Monitored air and water quality' },
      { icon: '💧', title: 'Reliable Utilities', desc: 'Smart water and energy never fail' },
      { icon: '🏥', title: 'Healthcare Access', desc: 'Connected healthcare nearby' },
    ],
  },
  {
    id: 'senior',
    name: 'Senior',
    avatar: '👴',
    benefits: [
      { icon: '🏥', title: 'Health Monitoring', desc: 'Connected care and telemedicine' },
      { icon: '🚌', title: 'Accessible Transit', desc: 'Smart public transport for all' },
      { icon: '🚨', title: 'Emergency Response', desc: 'Faster help when needed' },
      { icon: '💡', title: 'Smart Home', desc: 'Automated comfort and safety' },
    ],
  },
  {
    id: 'disabled',
    name: 'Accessibility',
    avatar: '♿',
    benefits: [
      { icon: '🚶', title: 'Smart Navigation', desc: 'Accessible routes and signals' },
      { icon: '🚌', title: 'Inclusive Transit', desc: 'Real-time accessibility info' },
      { icon: '🏢', title: 'Smart Buildings', desc: 'Automatic doors, elevators, ramps' },
      { icon: '📱', title: 'Digital Access', desc: 'Universal design in all services' },
    ],
  },
  {
    id: 'responder',
    name: 'Responder',
    avatar: '🚒',
    benefits: [
      { icon: '🚦', title: 'Priority Routes', desc: 'Traffic clears automatically' },
      { icon: '📡', title: 'Real-time Data', desc: 'Full situation awareness' },
      { icon: '🏥', title: 'Coordination', desc: 'Hospital pre-alerts on route' },
      { icon: '🗺️', title: 'Smart Routing', desc: 'Fastest path calculated instantly' },
    ],
  },
];

export default function PeopleSection({ onBack, onContinue }: PeopleSectionProps) {
  const [activePersona, setActivePersona] = useState(PERSONAS[0]);

  return (
    <div className="people-screen">
      <div className="ambient-bg">
        <div className="ambient-orb ambient-orb--cyan" />
        <div className="ambient-orb ambient-orb--emerald" />
      </div>

      <div className="nav-back">
        <button className="btn-secondary" onClick={onBack} id="people-back-btn">← BACK TO CITY</button>
      </div>

      <div className="people-header">
        <div className="text-label-accent" style={{ marginBottom: '12px' }}>HUMAN-CENTERED DESIGN</div>
        <h1 className="people-title">
          SMART TECHNOLOGY. <span className="text-gradient">HUMAN BENEFIT.</span>
        </h1>
        <p className="people-subtitle">
          Select a person to see how smart city technology improves their daily life.
        </p>
      </div>

      {/* Persona Selector */}
      <div className="people-personas">
        {PERSONAS.map(p => (
          <button
            key={p.id}
            className={`persona-btn ${activePersona.id === p.id ? 'active' : ''}`}
            onClick={() => setActivePersona(p)}
            id={`persona-${p.id}`}
          >
            <div className="persona-btn__avatar">{p.avatar}</div>
            <div className="persona-btn__name">{p.name}</div>
          </button>
        ))}
      </div>

      {/* Benefits Grid */}
      <div className="persona-benefits" key={activePersona.id}>
        {activePersona.benefits.map((benefit, i) => (
          <div 
            className="benefit-card" 
            key={`${activePersona.id}-${i}`}
            style={{ '--delay': `${i * 0.1}s` } as React.CSSProperties}
          >
            <div className="benefit-card__icon">{benefit.icon}</div>
            <div className="benefit-card__title">{benefit.title}</div>
            <div className="benefit-card__desc">{benefit.desc}</div>
          </div>
        ))}
      </div>

      {/* Message */}
      <div className="people-message">
        <p className="people-message__text">
          A smart city isn't defined by how much technology it has.<br />
          It's defined by <em>how much better life becomes.</em>
        </p>
      </div>

      <div className="nav-continue">
        <button className="btn-primary" onClick={onContinue} id="people-continue-btn">
          CONTINUE →
        </button>
      </div>
    </div>
  );
}
