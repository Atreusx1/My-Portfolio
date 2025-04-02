// src/App.js
import React, { Suspense, useEffect } from 'react'; // Removed useState
import { Canvas } from '@react-three/fiber';
import FloatingParticles from './components/FloatingParticles';
import Navbar from './components/Navbar'; // Ensure correct path
import Home from './components/Home';
import About from './components/About';
import Skills from './components/Skills';
import Education from './components/Education';
import Projects from './components/Projects';
import Contact from './components/Contact';
import Footer from './components/Footer';
import ScrollButton from './components/ScrollUpButton';
// Removed LoadingScreen import unless you still need it elsewhere

import './App.css'; // Your main CSS

function App() {
  // Remove useState for currentSection
  // Remove handleNavigation function
  // Remove IntersectionObserver useEffect

  return (
    <div className="app">
      <div className="canvas-container">
        <Canvas camera={{ position: [0, 0, 12], fov: 50 }}>
          <Suspense fallback={null}>
            <ambientLight intensity={0.5} />
            <FloatingParticles count={500} />
          </Suspense>
        </Canvas>
      </div>

      <div className="content">
        {/* Navbar no longer takes props */}
        <Navbar />
        <main>
          {/* Ensure all sections have correct IDs matching navLinks */}
          <section id="home"><Home /></section>
          {/* <section id="about"><About /></section> */}
          <section id="skills"><Skills /></section>
          <section id="education"><Education /></section>
          <section id="projects"><Projects /></section>
          <section id="contact"><Contact /></section>
        </main>
        <Footer />
        <ScrollButton />
      </div>
    </div>
  );
}

export default App;