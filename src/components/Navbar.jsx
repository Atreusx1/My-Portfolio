import React, { useEffect, useState, useRef } from "react";
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

  // Effect 1: Detect scroll past threshold to trigger 'scrolled' state
  useEffect(() => {
    const handleScrollState = () => {
      const scrollTop = window.scrollY;
      setScrolled(scrollTop > 50); // Set scrolled to true if scrolled more than 50px
    };

    window.addEventListener("scroll", handleScrollState);
    handleScrollState(); // Initial check on component mount
    // Cleanup scroll listener on component unmount
    return () => window.removeEventListener("scroll", handleScrollState);
  }, []);

  // Effect 2: Handle the hide/show visibility of the entire Navbar
  useEffect(() => {
    const handleScrollVisibility = () => {
      // Always show if at the very top of the page
      if (window.scrollY === 0) {
        setIsVisible(true);
        if (visibilityTimeoutRef.current) {
          clearTimeout(visibilityTimeoutRef.current); // Clear existing hide timeout
        }
        return; // Stop processing if at top
      }

      // Show navbar immediately whenever user scrolls
      setIsVisible(true);

      // Clear any previous timeout if user scrolls again quickly
      if (visibilityTimeoutRef.current) {
        clearTimeout(visibilityTimeoutRef.current);
      }

      // Set a new timeout to hide the navbar after scrolling stops
      visibilityTimeoutRef.current = setTimeout(() => {
         // Only hide if user is not at the very top
         if (window.scrollY > 0) {
             setIsVisible(false); // Hide the navbar
         }
      }, 2000); // Hide after 2 seconds of no scrolling (adjust as needed)
    };

    window.addEventListener("scroll", handleScrollVisibility);

    // Cleanup listener and timeout on component unmount
    return () => {
      window.removeEventListener("scroll", handleScrollVisibility);
      if (visibilityTimeoutRef.current) {
        clearTimeout(visibilityTimeoutRef.current);
      }
    };
  }, []); // Run this effect only once on mount

  // Effect 3: Intersection Observer for Active Link Highlighting
  useEffect(() => {
    const sections = document.querySelectorAll("section[id]");
    // Ensure sections and navLinks exist before proceeding
    if (!sections.length || !navLinks || navLinks.length === 0) return;

    const firstLinkId = navLinks[0].id; // Assume the first link corresponds to the top section

    const observerOptions = {
        root: null, // Observe intersections relative to the viewport
        rootMargin: '-40% 0px -60% 0px', // Trigger when section is in the middle 20% of the viewport
        threshold: 0, // Trigger as soon as any part enters the margin
    };

    let lastIntersectingEntryId = active || firstLinkId; // Keep track

    const observer = new IntersectionObserver((entries) => {
        let foundActive = false;
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                setActive(entry.target.id); // Set active ID to the intersecting section's ID
                lastIntersectingEntryId = entry.target.id;
                foundActive = true;
            }
        });

        // Fallback check: If scrolled near top and nothing is intersecting, set active to first link
         if (!foundActive && window.scrollY < window.innerHeight * 0.4) {
             setActive(firstLinkId);
             lastIntersectingEntryId = firstLinkId;
         }
         // Optional: if scrolled down and nothing is intersecting, keep the last active one
         else if (!foundActive && window.scrollY >= window.innerHeight * 0.4) {
            setActive(lastIntersectingEntryId);
         }

    }, observerOptions);

    // Observe sections whose IDs are present in navLinks
    sections.forEach((section) => {
        if (navLinks.some(link => link.id === section.id)) {
             observer.observe(section);
        }
    });

    // Initial check on load: Set active to first link if near the top
    if (window.scrollY < window.innerHeight * 0.4) {
        setActive(firstLinkId);
    }

    // Cleanup: Unobserve all sections on component unmount
    return () => sections.forEach((section) => observer.unobserve(section));
  // Dependency array includes navLinks in case it could change, though usually static
  }, [navLinks]);


  // Effect 4: Prevent body scrolling when the mobile menu overlay is open
  useEffect(() => {
    if (toggle) {
      document.body.style.overflow = 'hidden'; // Disable body scroll
    } else {
      document.body.style.overflow = 'auto'; // Enable body scroll
    }
    // Cleanup function to restore scroll on unmount
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [toggle]); // Run this effect whenever 'toggle' state changes


  // --- Event Handlers ---
  // Handles clicks on navigation links (primarily for mobile)
  const handleNavClick = (navId) => {
     setToggle(false); // Close mobile menu overlay
     // Let the browser handle the smooth scroll via the href="#id"
  }

  // Handles click on the logo
  const handleLogoClick = (e) => {
      e.preventDefault(); // Prevent default anchor behavior
      window.scrollTo({ top: 0, behavior: 'smooth' }); // Smooth scroll to top
      setToggle(false); // Ensure mobile menu is closed
      // Observer will automatically set active to 'home'/'firstLinkId' when at top
  }

  return (
    // Apply base styles and conditional classes for scrolled state and visibility
    <nav className={`
        ${styles.nav}
        ${scrolled ? styles.scrolled : ''}
         {/* Hide entire nav if not visible AND mobile menu is closed */}
        ${!isVisible && !toggle ? styles.hidden : ''}
      `}
    >
      <div className={styles.navWrapper}>
        {/* Logo Link: Use <a> for scroll, hidden on mobile, conditionally hidden on desktop scroll */}
        <a
          href="/"
          className={`
            ${styles.logoLink}
            ${scrolled ? styles.logoHiddenWhenScrolled : ''}
          `}
          onClick={handleLogoClick}
          aria-label="The Invincible Studio - Home" // Accessibility label
        >
          <p className={styles.logoText}>My Portfolio</p>
        </a>

        {/* Desktop Navigation Menu */}
        <ul className={styles.desktopMenu}>
          {navLinks.map((nav) => (
            <li
              key={nav.id}
              // Apply menu item base style and conditional active/inactive styles
              className={`${styles.menuItem} ${active === nav.id ? styles.activeMenuItem : styles.inactiveMenuItem}`}
            >
              {/* Render the blue active indicator bar */}
              {active === nav.id && <div className={styles.activeIndicator}></div>}
              {/* Standard anchor link for same-page scrolling */}
              <a href={`#${nav.id}`}>{nav.title}</a>
            </li>
          ))}
        </ul>

        {/* Mobile Navigation Container (holds the hamburger icon) */}
        <div className={styles.mobileMenuContainer}>
           {/* Hamburger Icon Button */}
           <button
              className={styles.mobileMenuToggle}
              onClick={() => setToggle(true)} // Open the mobile overlay
              aria-label="Open menu" // Accessibility label
              aria-expanded={toggle} // Indicate menu state
              aria-controls="mobile-menu-list" // Link to the menu it controls
            >
              <img src={menuIconUrl} alt='' /> {/* Alt can be empty for decorative icons within buttons */}
           </button>
        </div>

        {/* Mobile Dropdown Overlay (Fullscreen) */}
        <div
          id="mobile-menu-overlay" // ID for potential targeting
          className={`${styles.mobileDropdown} ${toggle ? styles.mobileDropdownOpen : ''}`}
          // Add ARIA properties for accessibility
          role="dialog"
          aria-modal="true"
          aria-labelledby="mobile-menu-heading" // Needs a heading element inside
        >
            {/* Close Button Inside Overlay */}
             <button
                className={styles.mobileCloseButton}
                onClick={() => setToggle(false)} // Close the mobile overlay
                aria-label="Close menu" // Accessibility label
              >
                 <img src={closeIconUrl} alt="" /> {/* Alt can be empty */}
             </button>

             {/* Add an invisible heading for screen readers */}
             <h2 id="mobile-menu-heading" className={styles.visuallyHidden}>Navigation Menu</h2>

             {/* Mobile Navigation Links List */}
             <ul className={styles.mobileMenuList} id="mobile-menu-list">
              {navLinks.map((nav) => (
                <li
                  key={nav.id}
                  // Apply base mobile item style and conditional active/inactive styles
                  className={`${styles.mobileMenuItem} ${active === nav.id ? styles.mobileActiveItem : styles.mobileInactiveItem}`}
                  // Click closes overlay (handleNavClick also sets toggle to false)
                  onClick={() => handleNavClick(nav.id)}
                >
                  {/* Standard anchor link */}
                  <a href={`#${nav.id}`}>{nav.title}</a>
                </li>
              ))}
            </ul>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;