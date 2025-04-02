// src/App.js
import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import FloatingParticles from './components/FloatingParticles';
import Navbar from './components/Navbar';
import Home from './components/Home';
// import About from './components/About'; // Uncomment if needed
import Skills from './components/Skills';
import Education from './components/Education';
import Projects from './components/Projects';
import Contact from './components/Contact';
import Footer from './components/Footer';
import ScrollButton from './components/ScrollUpButton';

import './App.css';

function App() {
  return (
    <>
      {/* Fixed background element that stays in place */}
      <div className="fixed-background"></div>
      
      <div className="app">
        {/* Canvas container for particles */}
        <div className="canvas-container">
          <Canvas camera={{ position: [0, 0, 12], fov: 50 }}>
            <Suspense fallback={null}>
              <ambientLight intensity={0.5} />
              <FloatingParticles count={500} />
            </Suspense>
          </Canvas>
        </div>

        <div className="content">
          <Navbar />
          <main className="sections">
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
    </>
  );
}

export default App;