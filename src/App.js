// src/App.jsx
import React, { useState, useEffect, Suspense, useRef, useCallback, lazy } from 'react';
import { Canvas } from '@react-three/fiber';
import { SpeedInsights } from "@vercel/speed-insights/react";
import './App.css';
// --- Child Components ---
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ScrollButton from './components/ScrollUpButton';
import LoadingScreen from './components/Loading';
// Optimization: Lazy load WeatherToggle if it's complex or has many icons/assets
const WeatherToggle = lazy(() => import('./components/WeatherToggle'));

// --- Section Components (Lazy Loaded) ---
// Optimization: Lazy load sections to improve initial bundle size and load time
const Home = lazy(() => import('./components/Home'));
const About = lazy(() => import('./components/About'));
const Skills = lazy(() => import('./components/Skills'));
const Education = lazy(() => import('./components/Education'));
const Projects = lazy(() => import('./components/Projects'));
const Contact = lazy(() => import('./components/Contact'));

// --- Particle Effect Components (Lazy Loaded) ---
// Optimization: Lazy load particle systems
const FloatingParticles = lazy(() => import('./components/FloatingParticles'));
const Fireflies = lazy(() => import('./components/Fireflies'));
const Snowfall = lazy(() => import('./components/Snowfall'));
const Rainfall = lazy(() => import('./components/Rainfall'));

// --- CSS ---


// --- Constants (remain outside) ---
const LOADING_DELAY_MS = 3500;
const SAKURA_COUNT = 250;
const FIREFLY_COUNT = 120;
const SNOW_COUNT = 350;
const RAIN_COUNT = 350;
const WEATHER_MODES = ['sakura', 'fireflies', 'snow', 'rain'];
const DAY_START_HOUR = 6;
const DAY_END_HOUR = 18;

const RAIN_CONFIG = {
  areaWidth: 50, areaHeight: 40, areaDepth: 40,
  windStrength: 0.04, baseSpeed: 0.5, opacity: 0.9,
  fogNear: 20, fogFar: 50,
};

// --- Helper Function (remains outside) ---
const getInitialWeatherMode = () => {
  const savedWeather = localStorage.getItem('weatherMode');
  if (savedWeather && WEATHER_MODES.includes(savedWeather)) {
    return savedWeather;
  }
  const currentHour = new Date().getHours();
  const isDayTime = currentHour >= DAY_START_HOUR && currentHour < DAY_END_HOUR;
  return isDayTime ? 'sakura' : 'fireflies';
};

// --- Determine initial state outside component ---
// Calculate these once before the component function runs
const initialWeatherModeGlobal = getInitialWeatherMode();
const initialIsDarkModeGlobal = initialWeatherModeGlobal === 'fireflies';
const initialThemeClassGlobal = initialIsDarkModeGlobal ? 'dark-mode' : 'light-mode';
const initialWeatherClassGlobal = `weather-${initialWeatherModeGlobal}`;

// --- App Component ---
function App() {
  // --- State ---
  const [isLoading, setIsLoading] = useState(true);
  // Initialize state directly using the pre-calculated value
  const [weatherMode, setWeatherMode] = useState(initialWeatherModeGlobal);
  // Derived state: determines dark mode based *only* on fireflies effect
  const isEffectivelyDarkMode = weatherMode === 'fireflies';

  // --- Refs ---
  const appRef = useRef(null);
  const fixedBgRef = useRef(null);

  // --- Effects ---
  // Loading timer effect
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), LOADING_DELAY_MS);
    return () => clearTimeout(timer);
  }, []); // Empty dependency array ensures this runs only once on mount

  // Theme and Weather class update effect
  useEffect(() => {
    const currentThemeClass = isEffectivelyDarkMode ? 'dark-mode' : 'light-mode';
    const oppositeThemeClass = isEffectivelyDarkMode ? 'light-mode' : 'dark-mode';
    const currentActivityClass = `weather-${weatherMode}`;

    // --- Optimization: More robust class handling ---
    const updateElementClasses = (element) => {
      if (!element) return;
      // Remove all possible weather classes first
      WEATHER_MODES.forEach(mode => element.classList.remove(`weather-${mode}`));
      // Remove opposite theme class
      element.classList.remove(oppositeThemeClass);
      // Add current classes
      element.classList.add(currentThemeClass);
      element.classList.add(currentActivityClass);
    };

    // Update body
    document.body.classList.remove(oppositeThemeClass);
    document.body.classList.add(currentThemeClass);

    // Update specific elements using the helper
    updateElementClasses(appRef.current);
    updateElementClasses(fixedBgRef.current);

    // Save current mode to localStorage
    localStorage.setItem('weatherMode', weatherMode);

    // Dependencies are correct: Runs when weather or derived dark mode changes
  }, [weatherMode, isEffectivelyDarkMode]);

  // --- Event Handlers ---
  // Optimization: useCallback ensures this function reference is stable
  const toggleWeatherMode = useCallback(() => {
    setWeatherMode(prevMode => {
      const currentIndex = WEATHER_MODES.indexOf(prevMode);
      const nextIndex = (currentIndex + 1) % WEATHER_MODES.length;
      return WEATHER_MODES[nextIndex];
    });
  }, []); // Empty dependency array is correct here

  // --- Render Logic ---
  // Memoize particle rendering function if needed, but direct use is usually fine
  // as it rerenders only when weatherMode changes anyway.
  const renderParticles = () => {
    switch (weatherMode) {
      case 'sakura':    return <FloatingParticles count={SAKURA_COUNT} />;
      case 'fireflies': return <Fireflies count={FIREFLY_COUNT} />;
      case 'snow':      return <Snowfall count={SNOW_COUNT} />;
      case 'rain':      return <Rainfall count={RAIN_COUNT} {...RAIN_CONFIG} />; // Spread config
      default:          return null;
    }
  };

  return (
    <>
      <SpeedInsights />
      {/* Pass pre-calculated initial dark mode state */}
      <LoadingScreen isLoading={isLoading} isInitiallyDark={initialIsDarkModeGlobal} />

      {/* Apply pre-calculated initial classes */}
      <div ref={fixedBgRef} className={`fixed-background ${initialThemeClassGlobal} ${initialWeatherClassGlobal}`}></div>

      {/* Apply pre-calculated initial classes */}
      <div ref={appRef} className={`app ${initialThemeClassGlobal} ${initialWeatherClassGlobal}`}>

        {/* Use Suspense for the lazy-loaded WeatherToggle */}
        <Suspense fallback={<div className="weather-toggle-placeholder" />}>
          <WeatherToggle weatherMode={weatherMode} toggleWeatherMode={toggleWeatherMode} />
        </Suspense>

        <ScrollButton />

        {/* --- Background Particle Canvas --- */}
        <div className="canvas-container">
          {/* Optimization: REMOVED key={weatherMode} from Canvas */}
          {/* The Canvas component now persists across weather changes */}
          <Canvas camera={{ position: [0, 0, 12], fov: 55 }}>
            {/* Ambient light intensity updates correctly on re-render */}
            <ambientLight intensity={isEffectivelyDarkMode ? 0.15 : 0.5} />
            {/* Suspense handles lazy loading of particle components */}
            <Suspense fallback={null}>
              {/* React swaps the particle component *inside* the persistent Canvas */}
              {renderParticles()}
            </Suspense>
          </Canvas>
        </div>

        {/* --- Scrollable Page Content --- */}
        {!isLoading && (
          <div className="content">
            {/* Pass derived dark mode state */}
            <Navbar isDarkMode={isEffectivelyDarkMode} />
            <main className="sections">
              {/* Use Suspense to wrap lazy-loaded sections */}
              <Suspense fallback={<div className="section-loader">Loading...</div>}>
                <section id="home"><Home isAppLoaded={!isLoading} /></section>
                <section id="about"><About /></section>
                <section id="skills"><Skills /></section>
                <section id="education"><Education /></section>
                <section id="projects"><Projects /></section>
                <section id="contact"><Contact /></section>
              </Suspense>
            </main>
            {/* <Footer /> */}
          </div>
        )}
      </div>
    </>
  );
}

export default App;