// src/components/Loading.jsx
import React, { useState, useEffect, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';

import FloatingParticles from './FloatingParticles';
import Fireflies from './Fireflies';
import ParticleSpinner from './ThreeSpinner';
import styles from './Loading.module.css';

const ANIMATION_DURATION_MS = 1200; // Must match CSS animation duration (1.2s) or mobile fade duration
const SAKURA_COUNT = 100;
const FIREFLY_COUNT = 75;

// Receive isInitiallyDark prop
const Loading = ({ isLoading, isInitiallyDark }) => {
  const [isExiting, setIsExiting] = useState(false);
  const [isHidden, setIsHidden] = useState(false);

  useEffect(() => {
    let hideTimer;

    if (!isLoading && !isExiting) {
      setIsExiting(true);
      // Use the same duration for hiding the component regardless of animation type
      hideTimer = setTimeout(() => {
        setIsHidden(true);
      }, ANIMATION_DURATION_MS);
    }

    return () => {
      clearTimeout(hideTimer);
    };
  }, [isLoading, isExiting]);

// Inside Loading.jsx, within the Loading component function
if (isHidden) {
  console.log("LOADING SCREEN: Returning null, component removed."); // <<< ADD THIS
  return null;
}

  // Add initial theme class based on prop
  const initialThemeClass = isInitiallyDark ? styles.darkModeInitial : styles.lightModeInitial;

  const containerClasses = `${styles.loadingScreenSplit} ${
    isExiting ? styles.exiting : ''
  } ${initialThemeClass}`; // Add the theme class here

  return (
    // Container now has initial theme class
    <div className={containerClasses}>

      {/* --- Left Half (Day) - Always rendered but maybe hidden by CSS on mobile --- */}
      <div className={`${styles.loadingHalf} ${styles.loadingLeft}`}>
        <Canvas
          className={styles.particleCanvas}
          camera={{ position: [0, 0, 10], fov: 55 }}
        >
          <Suspense fallback={null}>
            {/* Render particles only if NOT exiting */}
            {!isExiting && <FloatingParticles count={SAKURA_COUNT} />}
          </Suspense>
        </Canvas>
      </div>

      {/* --- Right Half (Night) - Always rendered but maybe hidden by CSS on mobile --- */}
      <div className={`${styles.loadingHalf} ${styles.loadingRight}`}>
        <Canvas
          className={styles.particleCanvas}
          camera={{ position: [0, 0, 10], fov: 55 }}
        >
          <Suspense fallback={null}>
            {!isExiting && <Fireflies count={FIREFLY_COUNT} />}
          </Suspense>
        </Canvas>
      </div>

      {/* --- Centered Loader Overlay (Remains the same) --- */}
      <div className={styles.loaderOverlay}>
        <div className={styles.loaderCanvasContainer}>
          <Canvas
            className={styles.loaderCanvas}
            camera={{ position: [0, 0, 5], fov: 45 }}
          >
            <Suspense fallback={null}>
              {!isExiting && <ParticleSpinner />}
            </Suspense>
          </Canvas>
        </div>
        <p className={styles.loadingText}>
          Conjuring magic... Please wait!
        </p>
      </div>

    </div>
  );
};

export default Loading;