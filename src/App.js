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
const RAIN_COUNT = 350;
const WEATHER_MODES = ['sakura', 'fireflies', 'snow', 'rain']; // Order for cycling

// Day/Night thresholds (adjust as needed)
const DAY_START_HOUR = 6; // 6 AM (inclusive)
const DAY_END_HOUR = 18; // 6 PM (exclusive)

// --- Rainfall Specific Configuration ---
const RAIN_CONFIG = {
  areaWidth: 50,
  areaHeight: 40,
  areaDepth: 40,
  windStrength: 0.04,
  baseSpeed: 0.5,
  opacity: 0.9,
  fogNear: 20,
  fogFar: 50,
};

// --- Helper Function ---
const getInitialWeatherMode = () => {
  // 1. Check localStorage first - respect user's last choice
  const savedWeather = localStorage.getItem('weatherMode');
  if (savedWeather && WEATHER_MODES.includes(savedWeather)) {
    return savedWeather;
  }

  // 2. If no saved preference, determine based on time
  const currentHour = new Date().getHours(); // 0-23
  const isDayTime = currentHour >= DAY_START_HOUR && currentHour < DAY_END_HOUR;

  // Default to Sakura for day, Fireflies for night
  return isDayTime ? 'sakura' : 'fireflies';
};


function App() {
  // --- State ---
  const [isLoading, setIsLoading] = useState(true);

  // Use the helper function to determine the initial weather mode
  const [weatherMode, setWeatherMode] = useState(getInitialWeatherMode);

  // Determine dark mode based *solely* on whether 'fireflies' is active
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
    // Determine theme class based on the current state
    const currentThemeClass = isEffectivelyDarkMode ? 'dark-mode' : 'light-mode';
    const oppositeThemeClass = isEffectivelyDarkMode ? 'light-mode' : 'dark-mode';

    // Update body class
    document.body.classList.remove(oppositeThemeClass);
    document.body.classList.add(currentThemeClass);

    // Update specific elements' classes (app container, fixed background)
    const elementsToUpdate = [appRef.current, fixedBgRef.current];
    const weatherClass = `weather-${weatherMode}`; // Class specific to the active weather effect

    elementsToUpdate.forEach(el => {
      if (el) {
        // Remove all possible weather classes first
        WEATHER_MODES.forEach(mode => el.classList.remove(`weather-${mode}`));
        // Add the current weather class
        el.classList.add(weatherClass);
        // Remove the opposite theme class
        el.classList.remove(oppositeThemeClass);
        // Add the current theme class
        el.classList.add(currentThemeClass);
      }
    });

    // Save the *current* mode to localStorage whenever it changes
    localStorage.setItem('weatherMode', weatherMode);

  }, [weatherMode, isEffectivelyDarkMode]); // Rerun when weatherMode or derived dark mode changes


  // --- Event Handlers ---
  const toggleWeatherMode = useCallback(() => {
    setWeatherMode(prevMode => {
      const currentIndex = WEATHER_MODES.indexOf(prevMode);
      const nextIndex = (currentIndex + 1) % WEATHER_MODES.length;
      return WEATHER_MODES[nextIndex];
    });
  }, []); // No dependencies needed as it only uses the setter function


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
        return (
          <Rainfall
            count={RAIN_COUNT}
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

  // Calculate initial classes based on the *initial* state determined by `getInitialWeatherMode`
  // These are used for the very first render before useEffect runs
  const initialWeatherMode = weatherMode; // Get the initially calculated mode
  const initialIsDarkMode = initialWeatherMode === 'fireflies';
  const initialThemeClass = initialIsDarkMode ? 'dark-mode' : 'light-mode';
  const initialWeatherClass = `weather-${initialWeatherMode}`;


  return (
    <>
      {/* Pass the initial dark mode state to loading screen */}
      <LoadingScreen isLoading={isLoading} isInitiallyDark={initialIsDarkMode} />

      {/* Apply initial classes to fixed background */}
      <div ref={fixedBgRef} className={`fixed-background ${initialThemeClass} ${initialWeatherClass}`}></div>

      {/* Apply initial classes to main app container */}
      <div ref={appRef} className={`app ${initialThemeClass} ${initialWeatherClass}`}>

        <WeatherToggle weatherMode={weatherMode} toggleWeatherMode={toggleWeatherMode} />
        <ScrollButton />

        {/* --- Background Particle Canvas --- */}
        <div className="canvas-container">
           {/* Key change ensures component remounts on mode switch */}
          <Canvas camera={{ position: [0, 0, 12], fov: 55 }} key={weatherMode}>
             {/* Adjust ambient light based on effective dark mode */}
            <ambientLight intensity={isEffectivelyDarkMode ? 0.15 : 0.5} />
            <Suspense fallback={null}>
              {renderParticles()}
            </Suspense>
          </Canvas>
        </div>
{/* hey */}
        {/* --- Scrollable Page Content --- */}
        {!isLoading && (
            <div className="content">
               {/* Pass dark mode state to Navbar */}
              <Navbar isDarkMode={isEffectivelyDarkMode}/>
              <main className="sections">
                {/* Pass loading state to Home if needed for animations */}
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