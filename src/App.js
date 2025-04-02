// src/App.jsx
import React, { useState, useEffect, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';

// Particle Components
import FloatingParticles from './components/FloatingParticles'; // Sakura
import Fireflies from './components/Fireflies';             // Fireflies (Assumes this exists)

// Layout & Section Components
import Navbar from './components/Navbar';
import Home from './components/Home';
import About from './components/About';
import Skills from './components/Skills';
import Education from './components/Education'; // Make sure you have this component
import Projects from './components/Projects';
import Contact from './components/Contact';
import Footer from './components/Footer';
import ScrollButton from './components/ScrollUpButton'; // Or ScrollUpButton
import DarkModeToggle from './components/DarkModeToggle'; // Import the toggle button
import LoadingScreen from './components/Loading';   // Optional Loading Screen

// CSS
import './App.css'; // Your main CSS file
// Make sure your component CSS files are imported within the components themselves or here if global

// --- Image URLs (ensure these paths are correct in your public folder) ---
const ghibliDayBg = '/ghibli-day.png';
const ghibliNightBg = '/ghibli-night.png';

function App() {
  const [loading, setLoading] = useState(true); // Optional loading state
  const [isDarkMode, setIsDarkMode] = useState(false); // Default to light mode

  // Simulate loading
  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1500); // Adjust time as needed
    return () => clearTimeout(timer);
  }, []);

  // Function to toggle dark mode
  const toggleDarkMode = () => {
    setIsDarkMode(prevMode => !prevMode);
  };

  // Effect to add/remove class for styling based on mode
  useEffect(() => {
    // Target the elements that need the class for background switching
    const appElement = document.querySelector('.app');
    const fixedBgElement = document.querySelector('.fixed-background');

    const currentModeClass = isDarkMode ? 'dark-mode' : 'light-mode';
    const oppositeModeClass = isDarkMode ? 'light-mode' : 'dark-mode';

    // Apply to .app (for non-iOS fallback)
    if (appElement) {
        appElement.classList.remove(oppositeModeClass);
        appElement.classList.add(currentModeClass);
    }

    // Apply to .fixed-background (for iOS fix)
    if (fixedBgElement) {
        fixedBgElement.classList.remove(oppositeModeClass);
        fixedBgElement.classList.add(currentModeClass);
    }

    // Optional: Add class to body for global overrides if needed
    // document.body.classList.toggle('dark-mode-active', isDarkMode);

  }, [isDarkMode]);

  // Render Loading Screen if loading
  if (loading) {
    // Make sure LoadingScreen component exists and is imported
    // return <LoadingScreen />;
  }

  // Determine initial class based on default state (light-mode)
  const initialModeClass = isDarkMode ? 'dark-mode' : 'light-mode';

  return (
    <>
      {/* Fixed background element with initial class */}
      {/* This is primarily for the iOS fix */}
      <div className={`fixed-background ${initialModeClass}`}></div>

      {/* Main app container with initial class (for non-iOS fallback) */}
      <div className={`app ${initialModeClass}`}>
        {/* --- Dark Mode Toggle Button --- */}
        {/* Ensure DarkModeToggle component exists and receives props */}
        <DarkModeToggle isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} />

        {/* --- Canvas for Particles --- */}
        <div className="canvas-container">
          <Canvas camera={{ position: [0, 0, 12], fov: 55 }} shadows>
             {/* Shadows require lights that cast shadows and objects that receive/cast them */}
             {/* <directionalLight intensity={1.5} position={[5, 5, 5]} castShadow shadow-mapSize-width={1024} shadow-mapSize-height={1024} /> */}
            <ambientLight intensity={isDarkMode ? 0.2 : 0.6} /> {/* Adjust ambient light based on mode */}
            <Suspense fallback={null}>
              {/* --- Conditionally render particles --- */}
              {isDarkMode
                ? <Fireflies count={150} />      // Dark mode: Fireflies
                : <FloatingParticles count={200} /> // Light mode: Sakura (adjust count as needed)
              }
            </Suspense>
          </Canvas>
        </div>

        {/* --- Scrollable Content --- */}
        <div className="content">
          <Navbar /> {/* Ensure Navbar component exists */}
          <main className="sections">
            <section id="home"><Home /></section>
            <section id="about"><About /></section>
            <section id="skills"><Skills /></section>
            {/* Use Experience or Education based on your component name */}
            <section id="education"><Education /></section>
            <section id="projects"><Projects /></section>
            <section id="contact"><Contact /></section>
          </main>
          <Footer />
          {/* Use ScrollButton or ScrollUpButton based on your component name */}
          <ScrollButton />
          {/* <ScrollUpButton /> */}
        </div>
      </div>
    </>
  );
}

export default App;