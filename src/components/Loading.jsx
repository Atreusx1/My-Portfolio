// src/components/Loading.jsx
import React, { useState, useEffect, Suspense } from 'react'; // Keep Suspense for particles
import { Canvas } from '@react-three/fiber'; // Keep Canvas for particles

// Keep particle imports (if you are keeping particles on the loading screen)
import FloatingParticles from './FloatingParticles';
import Fireflies from './Fireflies';

// --- REMOVE ParticleSpinner Import ---
// import ParticleSpinner from './ThreeSpinner';

// --- ADD GhibliSpinner Import ---
// Ensure the path is correct. This component should now contain the PacmanLoader.
import GhibliSpinner from './ThreeSpinner';

import styles from './Loading.module.css';

const ANIMATION_DURATION_MS = 1200;
const SAKURA_COUNT = 100; // Only relevant if particles are kept
const FIREFLY_COUNT = 75;  // Only relevant if particles are kept

const Loading = ({ isLoading, isInitiallyDark }) => {
  const [isExiting, setIsExiting] = useState(false);
  const [isHidden, setIsHidden] = useState(false);

  useEffect(() => {
    let hideTimer;
    if (!isLoading && !isExiting) {
      setIsExiting(true);
      hideTimer = setTimeout(() => {
        setIsHidden(true);
      }, ANIMATION_DURATION_MS);
    }
    return () => {
      clearTimeout(hideTimer);
    };
  }, [isLoading, isExiting]);

  if (isHidden) {
    // console.log("LOADING SCREEN: Returning null, component removed.");
    return null;
  }

  const initialThemeClass = isInitiallyDark ? styles.darkModeInitial : styles.lightModeInitial;
  const containerClasses = `${styles.loadingScreenSplit} ${isExiting ? styles.exiting : ''} ${initialThemeClass}`;

  return (
    <div className={containerClasses}>

      {/* --- Left Half (Day) --- */}
      {/* Keep this Canvas ONLY if you are keeping the FloatingParticles */}
      <div className={`${styles.loadingHalf} ${styles.loadingLeft}`}>
        <Canvas className={styles.particleCanvas} camera={{ position: [0, 0, 10], fov: 55 }}>
          <Suspense fallback={null}>
            {!isExiting && <FloatingParticles count={SAKURA_COUNT} />}
          </Suspense>
        </Canvas>
      </div>

      {/* --- Right Half (Night) --- */}
      {/* Keep this Canvas ONLY if you are keeping the Fireflies */}
      <div className={`${styles.loadingHalf} ${styles.loadingRight}`}>
        <Canvas className={styles.particleCanvas} camera={{ position: [0, 0, 10], fov: 55 }}>
          <Suspense fallback={null}>
            {!isExiting && <Fireflies count={FIREFLY_COUNT} />}
          </Suspense>
        </Canvas>
      </div>

      {/* --- Centered Loader Overlay --- */}
      <div className={styles.loaderOverlay}>
        {/* --- MODIFIED: Replace Canvas/ParticleSpinner with GhibliSpinner --- */}
        {/* Use a simpler container class name if preferred */}
        <div className={styles.loaderSpinnerContainer}> {/* Renamed/Adjusted container */}
          {/* Render GhibliSpinner (which uses PacmanLoader) conditionally */}
          {!isExiting && (
            <GhibliSpinner
              size={25} // Use the desired smaller size
              color="var(--flower-yellow)" // Example: Use theme color variable
              // You can add other PacmanLoader props here if needed:
              // speedMultiplier={1}
            />
          )}
        </div>
        {/* --- End Modification --- */}

        <p className={styles.loadingText}>
          Conjuring magic... Please wait!
        </p>
      </div>

    </div>
  );
};

export default Loading;