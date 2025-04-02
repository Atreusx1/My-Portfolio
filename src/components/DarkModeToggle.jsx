// src/components/DarkModeToggle.jsx
import React from 'react';
import { FaSun, FaMoon } from 'react-icons/fa';

const DarkModeToggle = ({ isDarkMode, toggleDarkMode }) => {
  return (
    <button
      onClick={toggleDarkMode}
      aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
      // Add a className for CSS targeting
      className="dark-mode-toggle-button"
      // Keep non-positional styles inline, or move them to CSS as well
      style={{
        // REMOVED: position, top, right, zIndex
        background: 'var(--bg-overlay-medium)', // Use theme variable
        color: 'var(--text-light)',
        border: '1px solid var(--sky-blue)',
        borderRadius: '50%',
        width: '45px',
        height: '45px',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        cursor: 'pointer',
        fontSize: '1.4rem', // Adjust icon size
        transition: 'background-color 0.3s ease, border-color 0.3s ease',
        // Optional: Add backdrop-filter here if you want it inline
        // backdropFilter: 'blur(5px)',
      }}
      // Keep JS hover effects if you prefer them over CSS :hover
      onMouseOver={(e) => {
          e.currentTarget.style.backgroundColor = 'var(--bg-overlay-blue)';
          e.currentTarget.style.borderColor = 'var(--flower-yellow)';
      }}
       onMouseOut={(e) => {
           e.currentTarget.style.backgroundColor = 'var(--bg-overlay-medium)';
           e.currentTarget.style.borderColor = 'var(--sky-blue)';
       }}
    >
      {isDarkMode ? <FaSun /> : <FaMoon />}
    </button>
  );
};

export default DarkModeToggle;