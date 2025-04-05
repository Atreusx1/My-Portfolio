import React, { useState, useEffect, Suspense, useRef } from 'react';
import { Canvas } from '@react-three/fiber';

// Particle component imports (ensure these are performant)
import FloatingParticles from './FloatingParticles';
import Fireflies from './Fireflies';

// Spinner component import
import GhibliSpinner from './ThreeSpinner';

import styles from './Loading.module.css';

// Image paths (used for deferred loading)
const ghibliDayPath = '/ghibli-day.webp';
const ghibliNightPath = '/ghibli-night.webp';

// Animation/Effect Constants
const ANIMATION_DURATION_MS = 1200;
// --- Consider reducing these counts significantly for LCP/performance ---
const SAKURA_COUNT = 100; // High count, likely impacts LCP render delay
const FIREFLY_COUNT = 75;  // High count, likely impacts LCP render delay
// --- End potential optimization area ---

const Loading = ({ isLoading, isInitiallyDark }) => {
  const [isExiting, setIsExiting] = useState(false);
  const [isHidden, setIsHidden] = useState(false);
  const [imagesLoaded, setImagesLoaded] = useState(false);

  // Refs
  const containerRef = useRef(null);
  const leftHalfRef = useRef(null);
  const rightHalfRef = useRef(null);

  // Effect: Apply deferred background images via CSS variables
  useEffect(() => {
    const applyImages = () => {
      if (leftHalfRef.current) {
        leftHalfRef.current.style.setProperty('--bg-day', `url(${ghibliDayPath})`);
      }
      if (rightHalfRef.current) {
        rightHalfRef.current.style.setProperty('--bg-night', `url(${ghibliNightPath})`);
      }
      if (containerRef.current) {
         containerRef.current.style.setProperty('--bg-mobile-main', `url(${ghibliDayPath})`);
      }
      setImagesLoaded(true); // Trigger fade-in for backgrounds
    };

    if (document.readyState === 'complete') {
      applyImages();
    } else {
      window.addEventListener('load', applyImages);
    }
    // Cleanup listener
    return () => window.removeEventListener('load', applyImages);
  }, []); // Run only once

  // Effect: Handle component exit animation and final hiding
  useEffect(() => {
    let hideTimer;
    if (!isLoading && !isExiting) {
      setIsExiting(true);
      hideTimer = setTimeout(() => setIsHidden(true), ANIMATION_DURATION_MS);
    }
    // Cleanup timer
    return () => clearTimeout(hideTimer);
  }, [isLoading, isExiting]); // Rerun if loading state changes

  // Don't render anything if fully hidden
  if (isHidden) {
    return null;
  }

  // Determine initial classes for theme and fade-in state
  const initialThemeClass = isInitiallyDark ? styles.darkModeInitial : styles.lightModeInitial;
  const containerClasses = `${styles.loadingScreenSplit} ${isExiting ? styles.exiting : ''} ${initialThemeClass} ${imagesLoaded ? styles.imagesVisible : ''}`;

  return (
    <div ref={containerRef} className={containerClasses}>

      {/* --- Left Half (Day) --- */}
      <div ref={leftHalfRef} className={`${styles.loadingHalf} ${styles.loadingLeft}`}>
        {/* Canvas for Sakura particles - PERFORMANCE BOTTLENECK for LCP */}
        <Canvas className={styles.particleCanvas} camera={{ position: [0, 0, 10], fov: 55 }}>
          <Suspense fallback={null}> {/* Suspense for lazy loaded particle component */}
            {!isExiting && <FloatingParticles count={SAKURA_COUNT} />}
          </Suspense>
        </Canvas>
      </div>

      {/* --- Right Half (Night) --- */}
      <div ref={rightHalfRef} className={`${styles.loadingHalf} ${styles.loadingRight}`}>
        {/* Canvas for Firefly particles - PERFORMANCE BOTTLENECK for LCP */}
        <Canvas className={styles.particleCanvas} camera={{ position: [0, 0, 10], fov: 55 }}>
          <Suspense fallback={null}> {/* Suspense for lazy loaded particle component */}
            {!isExiting && <Fireflies count={FIREFLY_COUNT} />}
          </Suspense>
        </Canvas>
      </div>

      {/* --- Centered Loader Overlay --- */}
      <div className={styles.loaderOverlay}>
        <div className={styles.loaderSpinnerContainer}>
          {!isExiting && (
            <GhibliSpinner
              size={25}
              color="var(--flower-yellow)" // Example color
            />
          )}
        </div>
        <p className={styles.loadingText}>
          Conjuring magic... Please wait!
        </p>
      </div>

    </div>
  );
};

export default Loading;