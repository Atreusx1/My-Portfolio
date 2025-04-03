// src/App.jsx
import React, { useState, useEffect, Suspense, useRef, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';

// --- Child Components ---
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ScrollButton from './components/ScrollUpButton';
import WeatherToggle from './components/WeatherToggle';
import LoadingScreen from './components/Loading';

// Section Components
import Home from './components/Home';
import About from './components/About';
import Skills from './components/Skills';
import Education from './components/Education';
import Projects from './components/Projects';
import Contact from './components/Contact';

// Particle Effect Components
import FloatingParticles from './components/FloatingParticles'; // Sakura
import Fireflies from './components/Fireflies';
import Snowfall from './components/Snowfall';
import Rainfall from './components/Rainfall'; // Make sure this imports the NEW Rainfall component

// --- CSS ---
import './App.css';

// --- Constants ---
const LOADING_DELAY_MS = 3500;
const SAKURA_COUNT = 250;
const FIREFLY_COUNT = 120;
const SNOW_COUNT = 350;
// Use a count suitable for the background rainfall effect
const RAIN_COUNT = 350; // Adjusted from original 800 based on example, tune as needed
const WEATHER_MODES = ['sakura', 'fireflies', 'snow', 'rain']; // Order for cycling

// --- Rainfall Specific Configuration (Optional but good practice) ---
const RAIN_CONFIG = {
  areaWidth: 50,
  areaHeight: 40,
  areaDepth: 40,
  windStrength: 0.04,
  baseSpeed: 0.5,
  opacity: 0.9, // Slightly increased opacity from example for visibility, tune as needed
  fogNear: 20,
  fogFar: 50,
};

function App() {
  // --- State ---
  const [isLoading, setIsLoading] = useState(true);

  const [weatherMode, setWeatherMode] = useState(() => {
    const savedWeather = localStorage.getItem('weatherMode');
    if (savedWeather && WEATHER_MODES.includes(savedWeather)) {
      return savedWeather;
    }
    return 'sakura';
  });

  const isEffectivelyDarkMode = weatherMode === 'fireflies';

  // Refs
  const appRef = useRef(null);
  const fixedBgRef = useRef(null);

  // --- Effects ---
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, LOADING_DELAY_MS);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const currentThemeClass = isEffectivelyDarkMode ? 'dark-mode' : 'light-mode';
    const oppositeThemeClass = isEffectivelyDarkMode ? 'light-mode' : 'dark-mode';

    document.body.classList.remove(oppositeThemeClass);
    document.body.classList.add(currentThemeClass);

    const elementsToUpdate = [appRef.current, fixedBgRef.current];
    const weatherClass = `weather-${weatherMode}`;

    elementsToUpdate.forEach(el => {
      if (el) {
        WEATHER_MODES.forEach(mode => el.classList.remove(`weather-${mode}`));
        el.classList.add(weatherClass);
        el.classList.remove(oppositeThemeClass);
        el.classList.add(currentThemeClass);
      }
    });

    localStorage.setItem('weatherMode', weatherMode);
  }, [weatherMode, isEffectivelyDarkMode]);

  // --- Event Handlers ---
  const toggleWeatherMode = useCallback(() => {
    setWeatherMode(prevMode => {
      const currentIndex = WEATHER_MODES.indexOf(prevMode);
      const nextIndex = (currentIndex + 1) % WEATHER_MODES.length;
      return WEATHER_MODES[nextIndex];
    });
  }, []);

  // --- Render Logic ---

  // Render correct particle component based on weatherMode
  const renderParticles = () => {
    switch (weatherMode) {
      case 'sakura':
        return <FloatingParticles count={SAKURA_COUNT} />;
      case 'fireflies':
        return <Fireflies count={FIREFLY_COUNT} />;
      case 'snow':
        return <Snowfall count={SNOW_COUNT} />;
      case 'rain':
        // Use the new Rainfall component with specific background props
        return (
          <Rainfall
            count={RAIN_COUNT} // Use the constant defined above
            areaWidth={RAIN_CONFIG.areaWidth}
            areaHeight={RAIN_CONFIG.areaHeight}
            areaDepth={RAIN_CONFIG.areaDepth}
            windStrength={RAIN_CONFIG.windStrength}
            baseSpeed={RAIN_CONFIG.baseSpeed}
            opacity={RAIN_CONFIG.opacity}
            fogNear={RAIN_CONFIG.fogNear}
            fogFar={RAIN_CONFIG.fogFar}
          />
        );
      default:
        return null;
    }
  };

  // Determine initial classes based on state loaded from storage
  const initialWeatherMode = weatherMode;
  const initialIsDarkMode = initialWeatherMode === 'fireflies';
  const initialThemeClass = initialIsDarkMode ? 'dark-mode' : 'light-mode';
  const initialWeatherClass = `weather-${initialWeatherMode}`;

  return (
    <>
      <LoadingScreen isLoading={isLoading} isInitiallyDark={initialIsDarkMode} />

      <div ref={fixedBgRef} className={`fixed-background ${initialThemeClass} ${initialWeatherClass}`}></div>

      <div ref={appRef} className={`app ${initialThemeClass} ${initialWeatherClass}`}>

        <WeatherToggle weatherMode={weatherMode} toggleWeatherMode={toggleWeatherMode} />
        <ScrollButton />

        {/* --- Background Particle Canvas --- */}
        <div className="canvas-container">
          {/* key={weatherMode} is essential! */}
          <Canvas camera={{ position: [0, 0, 12], fov: 55 }} key={weatherMode}>
            <ambientLight intensity={isEffectivelyDarkMode ? 0.15 : 0.5} />
            <Suspense fallback={null}>
              {renderParticles()}
            </Suspense>
          </Canvas>
        </div>

        {/* --- Scrollable Page Content --- */}
        {!isLoading && (
            <div className="content">
              <Navbar isDarkMode={isEffectivelyDarkMode}/>
              <main className="sections">
                <section id="home"><Home isAppLoaded={!isLoading} /></section>
                <section id="about"><About /></section>
                <section id="skills"><Skills /></section>
                <section id="education"><Education /></section>
                <section id="projects"><Projects /></section>
                <section id="contact"><Contact /></section>
              </main>
              <Footer />
            </div>
        )}
      </div>
    </>
  );
}

export default App;