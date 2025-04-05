import React, { useEffect, useState, useRef, useMemo, useCallback } from "react";
// Assuming navigation is same-page scrolling via href="#id"
// If using React Router for actual page navigation, you'd import { Link }

// Ensure asset paths are correct relative to this file
import menuIconUrl from "../Assets/menu.svg";
import closeIconUrl from "../Assets/close.svg";
// Ensure navlinks path is correct
import { navLinks } from "./navlinks";
import styles from './Navbar.module.css'; // Import CSS Module

const Navbar = () => {
  // --- State ---
  const [active, setActive] = useState(""); // Active section ID based on scroll
  const [toggle, setToggle] = useState(false); // Mobile menu overlay visibility
  const [scrolled, setScrolled] = useState(false); // Whether user has scrolled past a threshold
  const [isVisible, setIsVisible] = useState(true); // Navbar visibility for hide-on-scroll effect
  const visibilityTimeoutRef = useRef(null); // Ref for the hide-on-scroll timeout

  // --- Effects ---

  // Effect 1: Update 'scrolled' state based on scroll position
  useEffect(() => {
    const handleScrollState = () => {
      setScrolled(window.scrollY > 50); // Set true if scrolled more than 50px
    };
    window.addEventListener("scroll", handleScrollState);
    handleScrollState(); // Initial check
    return () => window.removeEventListener("scroll", handleScrollState); // Cleanup
  }, []);

  // Effect 2: Handle Navbar visibility (hide after scroll inactivity)
  useEffect(() => {
    const handleScrollVisibility = () => {
      // Always show if at the top
      if (window.scrollY === 0) {
        setIsVisible(true);
        if (visibilityTimeoutRef.current) clearTimeout(visibilityTimeoutRef.current);
        return;
      }
      // Show immediately on scroll
      setIsVisible(true);
      // Clear previous hide timeout
      if (visibilityTimeoutRef.current) clearTimeout(visibilityTimeoutRef.current);
      // Set new timeout to hide after inactivity
      visibilityTimeoutRef.current = setTimeout(() => {
         if (window.scrollY > 0) setIsVisible(false); // Hide only if not at top
      }, 2000); // Hide after 2 seconds
    };
    window.addEventListener("scroll", handleScrollVisibility);
    // Cleanup listener and timeout
    return () => {
      window.removeEventListener("scroll", handleScrollVisibility);
      if (visibilityTimeoutRef.current) clearTimeout(visibilityTimeoutRef.current);
    };
  }, []);

  // Effect 3: Intersection Observer for highlighting active nav link
  useEffect(() => {
    const sections = document.querySelectorAll("section[id]");
    if (!sections.length || !navLinks || navLinks.length === 0) return;

    const firstLinkId = navLinks[0].id; // Assumes first link corresponds to top section
    const observerOptions = {
        root: null,
        rootMargin: '-40% 0px -60% 0px', // Active when section is in middle 20% vertically
        threshold: 0,
    };
    let lastIntersectingEntryId = active || firstLinkId; // Keep track of last known active section

    const observer = new IntersectionObserver((entries) => {
        let foundActive = false;
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                setActive(entry.target.id);
                lastIntersectingEntryId = entry.target.id; // Update tracker
                foundActive = true;
            }
        });
        // Fallback logic if nothing is intersecting
         if (!foundActive && window.scrollY < window.innerHeight * 0.4) {
             setActive(firstLinkId); // Set to first if near top
             lastIntersectingEntryId = firstLinkId;
         } else if (!foundActive && window.scrollY >= window.innerHeight * 0.4) {
            setActive(lastIntersectingEntryId); // Keep last active if scrolled down
         }
    }, observerOptions);

    // Observe only sections relevant to nav links
    sections.forEach((section) => {
        if (navLinks.some(link => link.id === section.id)) {
             observer.observe(section);
        }
    });

    // Initial active state check on load
    if (window.scrollY < window.innerHeight * 0.4) setActive(firstLinkId);

    // Cleanup observer
    return () => sections.forEach((section) => observer.unobserve(section));
  }, [active]); // Dependency: Re-evaluate observer logic if 'active' state changes internally

  // Effect 4: Prevent body scroll when mobile overlay is open
  useEffect(() => {
    document.body.style.overflow = toggle ? 'hidden' : 'auto';
    // Cleanup function to restore scroll on unmount
    return () => { document.body.style.overflow = 'auto'; };
  }, [toggle]); // Dependency: Run when 'toggle' state changes

  // --- Event Handlers ---

  // Close mobile menu on link click (scroll handled by href)
  const handleNavClick = useCallback((navId) => {
     setToggle(false);
  }, []); // Empty dependency array as setToggle is stable

  // Scroll to top on logo click
  const handleLogoClick = (e) => {
      e.preventDefault(); // Prevent default anchor jump
      window.scrollTo({ top: 0, behavior: 'smooth' }); // Smooth scroll
      setToggle(false); // Close mobile menu if open
      // Observer will set active state correctly
  }

  // --- Memoized Menu Item Lists ---

  // Memoize desktop navigation list generation
  const desktopMenuItems = useMemo(() => {
    return navLinks.map((nav) => (
      <li
        key={nav.id}
        className={`${styles.menuItem} ${active === nav.id ? styles.activeMenuItem : styles.inactiveMenuItem}`}
      >
        {/* Render blue indicator only for the active item */}
        {active === nav.id && <div className={styles.activeIndicator}></div>}
        <a href={`#${nav.id}`}>{nav.title}</a>
      </li>
    ));
  // Dependency: Recalculate only when 'active' state changes
  }, [active]);

  // Memoize mobile navigation list generation
  const mobileMenuItems = useMemo(() => {
    return navLinks.map((nav) => (
      <li
        key={nav.id}
        className={`${styles.mobileMenuItem} ${active === nav.id ? styles.mobileActiveItem : styles.mobileInactiveItem}`}
        // Close overlay on click using the memoized handler
        onClick={() => handleNavClick(nav.id)}
      >
        <a href={`#${nav.id}`}>{nav.title}</a>
      </li>
    ));
  // Dependencies: Recalculate when 'active' or 'handleNavClick' changes
  }, [active, handleNavClick]);


  // --- Component Render ---
  return (
    <nav className={`
        ${styles.nav}
        ${scrolled ? styles.scrolled : ''}
        ${!isVisible && !toggle ? styles.hidden : ''}
      `}
    >
      {/* Wrapper div for content alignment */}
      <div className={styles.navWrapper}>

        {/* Logo - Link to top */}
        <a
          href="/" // Points to page root, click handler scrolls
          className={`
            ${styles.logoLink}
            ${scrolled ? styles.logoHiddenWhenScrolled : ''}
          `}
          onClick={handleLogoClick}
          aria-label="My Portfolio - Home"
        >
          <p className={styles.logoText}>My Portfolio</p> {/* Or use an <img> tag */}
        </a>

        {/* Desktop Navigation Links */}
        <ul className={styles.desktopMenu}>
          {/* Render memoized desktop list */}
          {desktopMenuItems}
        </ul>

        {/* Mobile Menu Trigger (Hamburger Icon) */}
        <div className={styles.mobileMenuContainer}>
           <button
              className={styles.mobileMenuToggle}
              onClick={() => setToggle(true)} // Open overlay
              aria-label="Open menu"
              aria-expanded={toggle}
              aria-controls="mobile-menu-overlay" // Points to the overlay div
            >
              {/* Use imported SVG path */}
              <img src={menuIconUrl} alt="Menu" /> {/* Add meaningful alt */}
           </button>
        </div>

        {/* Mobile Menu Overlay (Fullscreen) */}
        <div
          id="mobile-menu-overlay"
          className={`${styles.mobileDropdown} ${toggle ? styles.mobileDropdownOpen : ''}`}
          role="dialog" // Semantically a dialog
          aria-modal="true" // It traps focus (or should if fully implemented)
          aria-labelledby="mobile-menu-heading" // Needs a visible or invisible heading
        >
             {/* Close Button inside overlay */}
             <button
                className={styles.mobileCloseButton}
                onClick={() => setToggle(false)} // Close overlay
                aria-label="Close menu"
              >
                 {/* Use imported SVG path */}
                 <img src={closeIconUrl} alt="Close" /> {/* Add meaningful alt */}
             </button>

             {/* Accessible heading (can be visually hidden) */}
             <h2 id="mobile-menu-heading" className={styles.visuallyHidden}>
               Navigation Menu
             </h2>

             {/* Mobile Navigation Links List */}
             <ul className={styles.mobileMenuList} id="mobile-menu-list">
                {/* Render memoized mobile list */}
                {mobileMenuItems}
             </ul>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;