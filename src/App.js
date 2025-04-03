// src/App.jsx
import React, { useState, useEffect, Suspense, useRef } from 'react';
import { Canvas } from '@react-three/fiber';

// --- Child Components ---
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ScrollButton from './components/ScrollUpButton';
import DarkModeToggle from './components/DarkModeToggle';
import LoadingScreen from './components/Loading'; // Your enhanced loading screen

// Section Components
import Home from './components/Home'; // Updated import
import About from './components/About';
import Skills from './components/Skills';
import Education from './components/Education';
import Projects from './components/Projects';
import Contact from './components/Contact';

// Particle Effect Components
import FloatingParticles from './components/FloatingParticles';
import Fireflies from './components/Fireflies';

// --- CSS ---
import './App.css';

// --- Constants ---
const LOADING_DELAY_MS = 3500;
const SAKURA_COUNT = 250;
const FIREFLY_COUNT = 120;

function App() {
  // --- State ---
  const [isLoading, setIsLoading] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    // Determine initial dark mode state ONCE
    const savedMode = localStorage.getItem('darkMode');
    return savedMode ? JSON.parse(savedMode) : false;
  });

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

  // Apply theme classes and save preference
  useEffect(() => {
    const currentModeClass = isDarkMode ? 'dark-mode' : 'light-mode';
    const oppositeModeClass = isDarkMode ? 'light-mode' : 'dark-mode';

    if (appRef.current) {
      appRef.current.classList.remove(oppositeModeClass);
      appRef.current.classList.add(currentModeClass);
    }
    if (fixedBgRef.current) {
      fixedBgRef.current.classList.remove(oppositeModeClass);
      fixedBgRef.current.classList.add(currentModeClass);
    }
    document.body.classList.toggle('dark-mode-active', isDarkMode);
    localStorage.setItem('darkMode', JSON.stringify(isDarkMode));
  }, [isDarkMode]);

  // --- Event Handlers ---
  const toggleDarkMode = () => {
    setIsDarkMode(prevMode => !prevMode);
  };

  // --- Render Logic ---
  // Calculate the initial mode class based on the state determined above
  const initialModeClass = isDarkMode ? 'dark-mode' : 'light-mode';

  return (
    <>
      {/* Pass the initial dark mode state to LoadingScreen */}
      <LoadingScreen isLoading={isLoading} isInitiallyDark={isDarkMode} />

      {/* Apply initial mode class here too */}
      <div ref={fixedBgRef} className={`fixed-background ${initialModeClass}`}></div>

      <div ref={appRef} className={`app ${initialModeClass}`}>

        <DarkModeToggle isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} />
        <ScrollButton />

        {/* --- Background Particle Canvas --- */}
        <div className="canvas-container">
          <Canvas camera={{ position: [0, 0, 12], fov: 55 }}>
            <ambientLight intensity={isDarkMode ? 0.15 : 0.5} />
            <Suspense fallback={null}>
              {isDarkMode
                ? <Fireflies count={FIREFLY_COUNT} />
                : <FloatingParticles count={SAKURA_COUNT} />
              }
            </Suspense>
          </Canvas>
        </div>

        {/* --- Scrollable Page Content --- */}
        {!isLoading && (
            <div className="content">
              <Navbar isDarkMode={isDarkMode}/>
              <main className="sections">
                <section id="home"><Home isAppLoaded={!isLoading} /></section> {/* Pass isAppLoaded prop */}
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