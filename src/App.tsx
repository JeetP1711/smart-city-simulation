import { useState, useCallback } from 'react';
import IntroScreen from './components/IntroScreen';
import CityView from './components/CityView';
import CityOS from './components/CityOS';
import SimulationMode from './components/SimulationMode';
import BeforeAfter from './components/BeforeAfter';
import PeopleSection from './components/PeopleSection';
import Timeline from './components/Timeline';
import FinalScreen from './components/FinalScreen';
import './App.css';

export type AppScreen = 'intro' | 'city' | 'cityos' | 'simulation' | 'beforeafter' | 'people' | 'timeline' | 'final';

function App() {
  const [currentScreen, setCurrentScreen] = useState<AppScreen>('intro');
  const [isTransitioning, setIsTransitioning] = useState(false);

  const navigateTo = useCallback((screen: AppScreen) => {
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentScreen(screen);
      setTimeout(() => setIsTransitioning(false), 100);
    }, 600);
  }, []);

  return (
    <div className="app-container">
      <div className={`screen-wrapper ${isTransitioning ? 'transitioning' : ''}`}>
        {currentScreen === 'intro' && (
          <IntroScreen onEnter={() => navigateTo('city')} />
        )}
        {currentScreen === 'city' && (
          <CityView onNavigate={navigateTo} />
        )}
        {currentScreen === 'cityos' && (
          <CityOS onBack={() => navigateTo('city')} />
        )}
        {currentScreen === 'simulation' && (
          <SimulationMode onBack={() => navigateTo('city')} />
        )}
        {currentScreen === 'beforeafter' && (
          <BeforeAfter onBack={() => navigateTo('city')} onContinue={() => navigateTo('people')} />
        )}
        {currentScreen === 'people' && (
          <PeopleSection onBack={() => navigateTo('city')} onContinue={() => navigateTo('timeline')} />
        )}
        {currentScreen === 'timeline' && (
          <Timeline onBack={() => navigateTo('city')} onContinue={() => navigateTo('final')} />
        )}
        {currentScreen === 'final' && (
          <FinalScreen onRestart={() => navigateTo('intro')} onExplore={() => navigateTo('city')} />
        )}
      </div>
    </div>
  );
}

export default App;
