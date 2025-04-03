// src/App.jsx
import React, { useState, useEffect, Suspense, useRef, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';

// --- Child Components ---
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ScrollButton from './components/ScrollUpButton';
// import DarkModeToggle from './components/DarkModeToggle'; // No longer needed
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
import Rainfall from './components/Rainfall';

// --- CSS ---
import './App.css';

// --- Constants ---
const LOADING_DELAY_MS = 3500;
const SAKURA_COUNT = 250;
const FIREFLY_COUNT = 120;
const SNOW_COUNT = 500;
const RAIN_COUNT = 800;
const WEATHER_MODES = ['sakura', 'fireflies', 'snow', 'rain']; // Order for cycling

function App() {
  // --- State ---
  const [isLoading, setIsLoading] = useState(true);

  // Weather Mode State (with initial load from localStorage, defaults to sakura)
  const [weatherMode, setWeatherMode] = useState(() => {
    const savedWeather = localStorage.getItem('weatherMode');
    if (savedWeather && WEATHER_MODES.includes(savedWeather)) {
      return savedWeather;
    }
    return 'sakura'; // Default to sakura (light mode)
  });

  // DERIVED State: Determine if dark mode should be active based on weatherMode
  const isEffectivelyDarkMode = weatherMode === 'fireflies';

  // Refs
  const appRef = useRef(null);
  const fixedBgRef = useRef(null);

  // --- Effects ---

  // Loading timer
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, LOADING_DELAY_MS);
    return () => clearTimeout(timer);
  }, []);

  // Apply theme & weather classes and save preferences
  useEffect(() => {
    // Determine theme based *only* on weatherMode
    const currentThemeClass = isEffectivelyDarkMode ? 'dark-mode' : 'light-mode';
    const oppositeThemeClass = isEffectivelyDarkMode ? 'light-mode' : 'dark-mode';

    // Apply theme to body for global styles
    document.body.classList.remove(oppositeThemeClass);
    document.body.classList.add(currentThemeClass);

    // Apply weather and theme classes to background containers
    const elementsToUpdate = [appRef.current, fixedBgRef.current];
    const weatherClass = `weather-${weatherMode}`;

    elementsToUpdate.forEach(el => {
      if (el) {
        // Remove all potential weather classes first
        WEATHER_MODES.forEach(mode => el.classList.remove(`weather-${mode}`));
        // Add the current weather class
        el.classList.add(weatherClass);

        // Also apply the correct theme class
        el.classList.remove(oppositeThemeClass);
        el.classList.add(currentThemeClass);
      }
    });

    // Save only the weather preference (theme is derived)
    localStorage.setItem('weatherMode', weatherMode);
    // Optional: If you *really* need the derived dark mode state elsewhere immediately
    // after load before this effect runs, you could save it too, but it's generally
    // better to derive it.
    // localStorage.setItem('darkMode', JSON.stringify(isEffectivelyDarkMode));


  }, [weatherMode, isEffectivelyDarkMode]); // Rerun when weather changes (which dictates theme)

  // --- Event Handlers ---
  // Removed toggleDarkMode

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
        return <Rainfall count={RAIN_COUNT} />;
      default:
        return null;
    }
  };

  // Determine initial classes based on state loaded from storage
  const initialWeatherMode = weatherMode; // Use the state value directly
  const initialIsDarkMode = initialWeatherMode === 'fireflies';
  const initialThemeClass = initialIsDarkMode ? 'dark-mode' : 'light-mode';
  const initialWeatherClass = `weather-${initialWeatherMode}`;

  return (
    <>
      {/* Loading screen knows initial derived theme */}
      <LoadingScreen isLoading={isLoading} isInitiallyDark={initialIsDarkMode} />

      {/* Fixed background div for iOS fix */}
      <div ref={fixedBgRef} className={`fixed-background ${initialThemeClass} ${initialWeatherClass}`}></div>

      {/* Main App container */}
      <div ref={appRef} className={`app ${initialThemeClass} ${initialWeatherClass}`}>

        {/* Toggles */}
        {/* <DarkModeToggle isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} /> */} {/* Removed */}
        <WeatherToggle weatherMode={weatherMode} toggleWeatherMode={toggleWeatherMode} /> {/* Single Toggle */}
        <ScrollButton />

        {/* --- Background Particle Canvas --- */}
        <div className="canvas-container">
          {/* key={weatherMode} is essential to recreate canvas if particle types change significantly */}
          <Canvas camera={{ position: [0, 0, 12], fov: 55 }} key={weatherMode}>
             {/* Adjust ambient light based on the derived dark mode state */}
            <ambientLight intensity={isEffectivelyDarkMode ? 0.15 : 0.5} />
            <Suspense fallback={null}>
              {renderParticles()}
            </Suspense>
          </Canvas>
        </div>

        {/* --- Scrollable Page Content --- */}
        {!isLoading && (
            <div className="content">
              {/* Pass derived dark mode state to Navbar */}
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