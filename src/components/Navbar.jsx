import React, { useEffect, useState, useRef, useMemo, useCallback } from "react"; // Added useMemo, useCallback
// Using <a> tag for logo scroll-to-top, assuming no React Router needed for this.
// If you use React Router elsewhere, keep the import:
// import { Link } from "react-router-dom";

// Make sure paths and casing (Assets vs assets) are correct!
import menuIconUrl from "../Assets/menu.svg"; // Import the URL/path for hamburger icon
import closeIconUrl from "../Assets/close.svg"; // Import the URL/path for close icon
import { navLinks } from "./navlinks"; // Adjust path as needed for your navLinks data
import styles from './Navbar.module.css'; // Import the CSS Module

const Navbar = () => {
  const [active, setActive] = useState(""); // Tracks the active section ID based on scroll
  const [toggle, setToggle] = useState(false); // Mobile menu overlay open/closed state
  const [scrolled, setScrolled] = useState(false); // Scrolled past threshold (for hiding logo on desktop)
  const [isVisible, setIsVisible] = useState(true); // Navbar visible/hidden based on scroll activity
  const visibilityTimeoutRef = useRef(null); // Ref to store the timeout ID for hiding

  // --- Effects (Keep existing Effects 1-4 as they are) ---

  // Effect 1: Detect scroll past threshold
  useEffect(() => {
    const handleScrollState = () => {
      const scrollTop = window.scrollY;
      setScrolled(scrollTop > 50);
    };
    window.addEventListener("scroll", handleScrollState);
    handleScrollState();
    return () => window.removeEventListener("scroll", handleScrollState);
  }, []);

  // Effect 2: Handle the hide/show visibility
  useEffect(() => {
    const handleScrollVisibility = () => {
      if (window.scrollY === 0) {
        setIsVisible(true);
        if (visibilityTimeoutRef.current) clearTimeout(visibilityTimeoutRef.current);
        return;
      }
      setIsVisible(true);
      if (visibilityTimeoutRef.current) clearTimeout(visibilityTimeoutRef.current);
      visibilityTimeoutRef.current = setTimeout(() => {
         if (window.scrollY > 0) setIsVisible(false);
      }, 2000);
    };
    window.addEventListener("scroll", handleScrollVisibility);
    return () => {
      window.removeEventListener("scroll", handleScrollVisibility);
      if (visibilityTimeoutRef.current) clearTimeout(visibilityTimeoutRef.current);
    };
  }, []);

  // Effect 3: Intersection Observer for Active Link Highlighting
  useEffect(() => {
    const sections = document.querySelectorAll("section[id]");
    if (!sections.length || !navLinks || navLinks.length === 0) return;
    const firstLinkId = navLinks[0].id;
    const observerOptions = { root: null, rootMargin: '-40% 0px -60% 0px', threshold: 0 };
    let lastIntersectingEntryId = active || firstLinkId;

    const observer = new IntersectionObserver((entries) => {
        let foundActive = false;
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                setActive(entry.target.id);
                lastIntersectingEntryId = entry.target.id;
                foundActive = true;
            }
        });
         if (!foundActive && window.scrollY < window.innerHeight * 0.4) {
             setActive(firstLinkId);
             lastIntersectingEntryId = firstLinkId;
         } else if (!foundActive && window.scrollY >= window.innerHeight * 0.4) {
            setActive(lastIntersectingEntryId);
         }
    }, observerOptions);

    sections.forEach((section) => {
        if (navLinks.some(link => link.id === section.id)) {
             observer.observe(section);
        }
    });
    if (window.scrollY < window.innerHeight * 0.4) setActive(firstLinkId);
    return () => sections.forEach((section) => observer.unobserve(section));
  }, [navLinks, active]); // Include active here as it's used in the observer logic state

  // Effect 4: Prevent body scrolling when mobile menu is open
  useEffect(() => {
    if (toggle) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => { document.body.style.overflow = 'auto'; };
  }, [toggle]);


  // --- Event Handlers ---

  // Handles clicks on navigation links (primarily for mobile)
  // Memoize with useCallback because it's used in mobileMenuItems useMemo dependency
  const handleNavClick = useCallback((navId) => {
     setToggle(false); // Close mobile menu overlay
     // Scrolling handled by href="#id"
  }, []); // No dependencies, setToggle is stable

  // Handles click on the logo
  const handleLogoClick = (e) => {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setToggle(false);
      // Active state handled by observer
  }

  // --- Memoized Menu Items ---

  // Memoize the generation of desktop menu items
  const desktopMenuItems = useMemo(() => {
    // console.log('Recalculating desktop menu items'); // For debugging memoization
    return navLinks.map((nav) => (
      <li
        key={nav.id}
        className={`${styles.menuItem} ${active === nav.id ? styles.activeMenuItem : styles.inactiveMenuItem}`}
      >
        {active === nav.id && <div className={styles.activeIndicator}></div>}
        <a href={`#${nav.id}`}>{nav.title}</a>
      </li>
    ));
  // Dependencies: Recalculate only if navLinks or the active section changes
  }, [navLinks, active]);

  // Memoize the generation of mobile menu items
  const mobileMenuItems = useMemo(() => {
     // console.log('Recalculating mobile menu items'); // For debugging memoization
    return navLinks.map((nav) => (
      <li
        key={nav.id}
        className={`${styles.mobileMenuItem} ${active === nav.id ? styles.mobileActiveItem : styles.mobileInactiveItem}`}
        // Use the memoized handleNavClick
        onClick={() => handleNavClick(nav.id)}
      >
        <a href={`#${nav.id}`}>{nav.title}</a>
      </li>
    ));
  // Dependencies: Recalculate if navLinks, active section, or the handleNavClick function reference changes
  }, [navLinks, active, handleNavClick]);


  // --- Render ---
  return (
    <nav className={`
        ${styles.nav}
        ${scrolled ? styles.scrolled : ''}
        ${!isVisible && !toggle ? styles.hidden : ''}
      `}
    >
      <div className={styles.navWrapper}>
        {/* Logo Link */}
        <a
          href="/"
          className={`
            ${styles.logoLink}
            ${scrolled ? styles.logoHiddenWhenScrolled : ''}
          `}
          onClick={handleLogoClick}
          aria-label="The Invincible Studio - Home"
        >
          <p className={styles.logoText}>My Portfolio</p>
        </a>

        {/* Desktop Navigation Menu - Use memoized items */}
        <ul className={styles.desktopMenu}>
          {desktopMenuItems}
        </ul>

        {/* Mobile Navigation Container */}
        <div className={styles.mobileMenuContainer}>
           <button
              className={styles.mobileMenuToggle}
              onClick={() => setToggle(true)}
              aria-label="Open menu"
              aria-expanded={toggle}
              aria-controls="mobile-menu-list"
            >
              <img src={menuIconUrl} alt='' />
           </button>
        </div>

        {/* Mobile Dropdown Overlay */}
        <div
          id="mobile-menu-overlay"
          className={`${styles.mobileDropdown} ${toggle ? styles.mobileDropdownOpen : ''}`}
          role="dialog"
          aria-modal="true"
          aria-labelledby="mobile-menu-heading"
        >
             <button
                className={styles.mobileCloseButton}
                onClick={() => setToggle(false)}
                aria-label="Close menu"
              >
                 <img src={closeIconUrl} alt="" />
             </button>
             <h2 id="mobile-menu-heading" className={styles.visuallyHidden}>Navigation Menu</h2>

             {/* Mobile Navigation Links List - Use memoized items */}
             <ul className={styles.mobileMenuList} id="mobile-menu-list">
                {mobileMenuItems}
             </ul>
        </div>
      </div>
    </nav>
  );
};

export default Navbar; // Consider wrapping in React.memo if it receives props