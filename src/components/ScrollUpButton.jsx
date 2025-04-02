import React, { useState, useEffect, useRef } from 'react';

// --- Configuration ---
const VISIBILITY_THRESHOLD_DIVISOR = 1; // Show button after scrolling 1/X of the viewport height (e.g., 2 = half)
const INACTIVITY_TIMEOUT_MS = 500; // Hide button after 2000ms (2 seconds) of no scrolling

const ScrollUpButton = () => {
  const [scrollPosition, setScrollPosition] = useState(0);
  const [isVisible, setIsVisible] = useState(false); // Based on scroll position from top
  const [isScrolling, setIsScrolling] = useState(false); // Tracks if scroll happened recently
  const inactivityTimerRef = useRef(null); // Ref to store the timeout ID

  // --- Scroll Event Handler ---
  const handleScroll = () => {
    const currentPosition = window.scrollY;
    setScrollPosition(currentPosition);

    // 1. Determine visibility based on distance from top
    const showThreshold = window.innerHeight / VISIBILITY_THRESHOLD_DIVISOR;
    setIsVisible(currentPosition > showThreshold);

    // 2. Handle scrolling activity detection
    setIsScrolling(true); // Mark as currently scrolling

    // Clear any existing inactivity timer
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
    }

    // Set a new timer to mark as inactive after a delay
    inactivityTimerRef.current = setTimeout(() => {
      setIsScrolling(false); // Set to inactive after timeout
    }, INACTIVITY_TIMEOUT_MS);
  };

  // --- Effect for adding/removing scroll listener ---
  useEffect(() => {
    // Add listener
    window.addEventListener('scroll', handleScroll, { passive: true });

    // Initial check in case the page loads scrolled down
    handleScroll();

    // Cleanup function: remove listener and clear timer on unmount
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current); // Important cleanup
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array ensures this runs only on mount and unmount

  // --- Calculate Scroll Percentage ---
  const scrollPercentage = Math.min(
    100,
    document.documentElement.scrollHeight > window.innerHeight
      ? (scrollPosition / (document.documentElement.scrollHeight - window.innerHeight)) * 100
      : 0
  );

  // --- Scroll To Top Function ---
  const scrollUp = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
    // Optional: Immediately hide the button after clicking scroll up
    // setIsScrolling(false);
    // if (inactivityTimerRef.current) {
    //   clearTimeout(inactivityTimerRef.current);
    // }
  };

  // --- Determine Final Button Visibility ---
  // Button should only be rendered as 'visible' if:
  // 1. Scrolled down far enough (isVisible)
  // 2. Scrolling has happened recently (isScrolling)
  const showButton = isVisible && isScrolling;

  return (
    <button
      // Apply 'visible' class based on the combined condition
      className={`scroll-up-button ${showButton ? 'visible' : ''}`}
      onClick={scrollUp}
      title="Scroll to top"
      aria-hidden={!showButton} // Accessibility: hide from screen readers when not visible
      style={{
        // Conic gradient background (using theme variables)
        background: `conic-gradient(
          var(--sky-blue, #55a6e0) ${scrollPercentage}%,
          transparent ${scrollPercentage}%
        )`,
        // Fallback background color for the button itself
        backgroundColor: 'var(--tree-green-dark, #305A40)',
      }}
    >
      <span className="inner-circle">
        <span className="arrow">↑</span>
      </span>
    </button>
  );
};

export default ScrollUpButton;