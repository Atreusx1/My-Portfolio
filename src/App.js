// src/App.jsx
import React, { useState, useEffect, Suspense, useRef, useCallback, lazy } from 'react';
import { Canvas } from '@react-three/fiber';
import { SpeedInsights } from "@vercel/speed-insights/react";
import './App.css'; // Your main CSS file

// --- Standard Child Components ---
import Navbar from './components/Navbar'; // Assuming you have this
// import Footer from './components/Footer'; // Uncomment if you use Footer
import ScrollButton from './components/ScrollUpButton';
import LoadingScreen from './components/Loading';

// --- Lazy Loaded Components ---
const WeatherToggle = lazy(() => import('./components/WeatherToggle'));

// Section Components (Lazy Loaded)
const Home = lazy(() => import('./components/Home'));
const About = lazy(() => import('./components/About'));
const Skills = lazy(() => import('./components/Skills'));
const Education = lazy(() => import('./components/Education'));
const Projects = lazy(() => import('./components/Projects'));
const Contact = lazy(() => import('./components/Contact'));

// Particle Effect Components (Lazy Loaded)
const FloatingParticles = lazy(() => import('./components/FloatingParticles')); // Sakura
const Fireflies = lazy(() => import('./components/Fireflies'));
const Snowfall = lazy(() => import('./components/Snowfall'));
const Rainfall = lazy(() => import('./components/Rainfall'));
const AutumnLeaves = lazy(() => import('./components/AutumnLeaves'));

// --- Constants ---
const LOADING_DELAY_MS = 3500; // Adjust as needed
const SAKURA_COUNT = 250;
const FIREFLY_COUNT = 120;
const SNOW_COUNT = 350;
const RAIN_COUNT = 350;
const AUTUMN_LEAVES_COUNT = 300;
const WEATHER_MODES = ['sakura', 'fireflies', 'snow', 'rain', 'autumn'];

// Time definitions (24-hour format)
const MORNING_START_HOUR = 6; // 6 AM
const AFTERNOON_START_HOUR = 12; // 12 PM (Noon)
const EVENING_START_HOUR = 17; // 6 PM
const NIGHT_START_HOUR = 19; // 9 PM

// Configuration for Rainfall component
const RAIN_CONFIG = {
  areaWidth: 50, areaHeight: 40, areaDepth: 40,
  windStrength: 0.04, baseSpeed: 0.5, opacity: 0.9,
  fogNear: 20, fogFar: 50,
};

// --- Helper Function: Get Initial Weather Mode ---
const getInitialWeatherMode = () => {
  // Priority 1: Check localStorage for user's explicit choice
  const savedWeather = localStorage.getItem('weatherMode');
  if (savedWeather && WEATHER_MODES.includes(savedWeather)) {
    console.log(`Using saved weather mode from localStorage: ${savedWeather}`);
    return savedWeather;
  }

  // Priority 2: Determine default based on time of day
  const currentHour = new Date().getHours();
  let timeBasedMode;

  if (currentHour >= MORNING_START_HOUR && currentHour < AFTERNOON_START_HOUR) {
    // Morning (6am - 11:59am): Randomly Snow or Rain
    timeBasedMode = Math.random() < 0.5 ? 'snow' : 'rain';
    console.log(`Initial weather mode (Morning): Randomly selected ${timeBasedMode}`);
  } else if (currentHour >= AFTERNOON_START_HOUR && currentHour < EVENING_START_HOUR) {
    // Afternoon (12pm - 5:59pm): Sakura
    timeBasedMode = 'sakura';
    console.log(`Initial weather mode (Afternoon): ${timeBasedMode}`);
  } else if (currentHour >= EVENING_START_HOUR && currentHour < NIGHT_START_HOUR) {
    // Evening (6pm - 8:59pm): Autumn
    timeBasedMode = 'autumn';
    console.log(`Initial weather mode (Evening): ${timeBasedMode}`);
  } else {
    // Night (9pm - 5:59am): Fireflies
    timeBasedMode = 'fireflies';
    console.log(`Initial weather mode (Night): ${timeBasedMode}`);
  }

  return timeBasedMode;
};

// --- Determine initial state outside component (runs once on load) ---
const initialWeatherModeGlobal = getInitialWeatherMode();
// Dark mode is specifically tied ONLY to the 'fireflies' effect in this setup
const initialIsDarkModeGlobal = initialWeatherModeGlobal === 'fireflies';
const initialThemeClassGlobal = initialIsDarkModeGlobal ? 'dark-mode' : 'light-mode';
const initialWeatherClassGlobal = `weather-${initialWeatherModeGlobal}`;

// --- Main App Component ---
function App() {
  // --- State ---
  const [isLoading, setIsLoading] = useState(true);
  // Initialize state using the pre-calculated global value
  const [weatherMode, setWeatherMode] = useState(initialWeatherModeGlobal);
  // Derived state: determines dark mode based *only* on fireflies effect
  const isEffectivelyDarkMode = weatherMode === 'fireflies';

  // --- Refs ---
  const appRef = useRef(null); // Ref for the main app container
  const fixedBgRef = useRef(null); // Ref for the fixed background element (iOS fix)

  // --- Effects ---

  // Loading timer effect
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), LOADING_DELAY_MS);
    // Cleanup function to clear the timer if the component unmounts
    return () => clearTimeout(timer);
  }, []); // Empty dependency array ensures this runs only once on mount

  // Theme and Weather class update effect
  useEffect(() => {
    const currentThemeClass = isEffectivelyDarkMode ? 'dark-mode' : 'light-mode';
    const oppositeThemeClass = isEffectivelyDarkMode ? 'light-mode' : 'dark-mode';
    const currentActivityClass = `weather-${weatherMode}`;

    // Helper to update classes on an element
    const updateElementClasses = (element) => {
      if (!element) return;
      // Remove all possible weather classes first for clean switching
      WEATHER_MODES.forEach(mode => element.classList.remove(`weather-${mode}`));
      // Remove the opposite theme class
      element.classList.remove(oppositeThemeClass);
      // Add the current theme and weather classes
      element.classList.add(currentThemeClass);
      element.classList.add(currentActivityClass);
    };

    // Update body class (for global styles if needed)
    document.body.classList.remove(oppositeThemeClass);
    document.body.classList.add(currentThemeClass);

    // Update specific elements using the helper
    updateElementClasses(appRef.current);
    updateElementClasses(fixedBgRef.current);

    // Save the *current* weather mode choice to localStorage whenever it changes
    localStorage.setItem('weatherMode', weatherMode);
    console.log(`Saved weather mode to localStorage: ${weatherMode}`);

    // Dependencies: Run this effect when weatherMode or the derived dark mode state changes
  }, [weatherMode, isEffectivelyDarkMode]);

  // --- Event Handlers ---

  // Toggle Weather Mode: Cycles through the WEATHER_MODES array
  // useCallback ensures the function reference is stable unless dependencies change (none here)
  const toggleWeatherMode = useCallback(() => {
    setWeatherMode(prevMode => {
      const currentIndex = WEATHER_MODES.indexOf(prevMode);
      const nextIndex = (currentIndex + 1) % WEATHER_MODES.length; // Cycle using modulo
      const nextMode = WEATHER_MODES[nextIndex];
      console.log(`Toggled weather mode from ${prevMode} to ${nextMode}`);
      return nextMode;
    });
  }, []); // No dependencies needed for this callback

  // --- Render Logic ---

  // Function to determine which particle component to render based on weatherMode
  const renderParticles = () => {
    switch (weatherMode) {
      case 'sakura':    return <FloatingParticles count={SAKURA_COUNT} />;
      case 'fireflies': return <Fireflies count={FIREFLY_COUNT} />;
      case 'snow':      return <Snowfall count={SNOW_COUNT} />;
      case 'rain':      return <Rainfall count={RAIN_COUNT} {...RAIN_CONFIG} />; // Spread config props
      case 'autumn':    return <AutumnLeaves totalCount={AUTUMN_LEAVES_COUNT} />;
      default:          return null; // Fallback if mode is invalid
    }
  };

  // --- JSX Structure ---
  return (
    <>
      {/* Vercel Speed Insights */}
      <SpeedInsights />

      {/* Loading Screen - passes initial dark mode state for correct initial appearance */}
      <LoadingScreen isLoading={isLoading} isInitiallyDark={initialIsDarkModeGlobal} />

      {/* Fixed Background Element (Primarily for iOS fix) */}
      {/* Apply pre-calculated initial classes directly */}
      <div
        ref={fixedBgRef}
        className={`fixed-background ${initialThemeClassGlobal} ${initialWeatherClassGlobal}`}
        aria-hidden="true" // Hide from screen readers as it's decorative
      ></div>

      {/* Main App Container */}
      {/* Apply pre-calculated initial classes directly */}
      <div
        ref={appRef}
        className={`app ${initialThemeClassGlobal} ${initialWeatherClassGlobal}`}
      >

        {/* Weather Toggle Button - Lazy loaded */}
        {/* Suspense provides fallback while the component loads */}
        <Suspense fallback={
          // Simple placeholder div while toggle loads
          <div style={{
              position: 'fixed', top: '40px', right: '20px',
              width: '55px', height: '55px', borderRadius: '50%',
              backgroundColor: 'rgba(150, 150, 150, 0.5)', // Semi-transparent placeholder
              zIndex: 1001,
              boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
             }}
             aria-label="Loading weather toggle"
          />
        }>
          <WeatherToggle weatherMode={weatherMode} toggleWeatherMode={toggleWeatherMode} />
        </Suspense>

        {/* Scroll-to-top Button */}
        <ScrollButton />

        {/* Background Particle Canvas Container */}
<div className="canvas-container" aria-hidden="true">
  {!isLoading && ( // <-- Add this condition
    <Canvas camera={{ position: [0, 0, 12], fov: 55 }}>
      <ambientLight intensity={isEffectivelyDarkMode ? 0.15 : 0.5} />
      <Suspense fallback={null}>
        {renderParticles()}
      </Suspense>
    </Canvas>
  )}
</div>
        {/* --- Scrollable Page Content --- */}
        {/* Only render content after the loading screen is done */}
        {!isLoading && (
          <div className="content">
            {/* Pass derived dark mode state to Navbar */}
            <Navbar isDarkMode={isEffectivelyDarkMode} />
            <main className="sections">
              {/* Use a single Suspense boundary for all lazy-loaded sections */}
              <Suspense fallback={
                // Placeholder for sections while they load
                <div className="section-loader" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', color: 'var(--text-medium)' }}>
                  Loading Content...
                </div>
              }>
                {/* Add role="region" and aria-labelledby for better structure if needed */}
                <section id="home" aria-labelledby="home-heading"><Home isAppLoaded={!isLoading} /></section>
                <section id="about" aria-labelledby="about-heading"><About /></section>
                <section id="skills" aria-labelledby="skills-heading"><Skills /></section>
                <section id="education" aria-labelledby="education-heading"><Education /></section>
                <section id="projects" aria-labelledby="projects-heading"><Projects /></section>
                <section id="contact" aria-labelledby="contact-heading"><Contact /></section>
              </Suspense>
            </main>
            {/* <Footer /> */} {/* Uncomment if you have and use a Footer component */}
          </div>
        )}
      </div>
    </>
  );
}

export default App;