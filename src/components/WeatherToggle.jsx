// src/components/WeatherToggle.jsx
import React from 'react';
import { FaLeaf, FaRegSnowflake, FaCloudRain, FaFire } from 'react-icons/fa';
// No specific CSS import needed here if App.css is loaded globally

const WeatherToggle = ({ weatherMode, toggleWeatherMode }) => {

  const weatherModesArray = ['sakura', 'fireflies', 'snow', 'rain'];

  // Define icon and text for each mode
  const modeDetails = {
    sakura: { icon: <FaLeaf />, label: 'Sakura' },
    fireflies: { icon: <FaFire />, label: 'Fireflies' },
    snow: { icon: <FaRegSnowflake />, label: 'Snow' },
    rain: { icon: <FaCloudRain />, label: 'Rain' },
  };

  const currentMode = modeDetails[weatherMode] || modeDetails.sakura; // Default fallback

  // Calculate the next mode for preview or tooltip
  const currentIndex = weatherModesArray.indexOf(weatherMode);
  const nextIndex = (currentIndex + 1) % weatherModesArray.length;
  const nextModeKey = weatherModesArray[nextIndex];
  const nextMode = modeDetails[nextModeKey];

  return (
    <button
      onClick={toggleWeatherMode}
      // Apply base class and the current weatherMode directly as a class
      className={`weather-toggle-button ${weatherMode}`}
      aria-label={`Switch weather effect. Current: ${currentMode.label}. Click to switch to ${nextMode.label}.`}
      title={`Switch to ${nextMode.label}`} // Tooltip for hover
    >
      <div className="toggle-icon-container">
        {/* Map through all possible modes to render icons */}
        {Object.entries(modeDetails).map(([key, { icon }]) => (
          <span
            key={key}
            // Apply base 'icon' class and conditionally apply the 'active' class
            className={`icon ${key === weatherMode ? 'active' : ''}`}
          >
            {icon}
          </span>
        ))}
      </div>

      {/* Add background elements div, apply mode class for specific pseudo styles */}
      {/* Applying the mode class here allows targeting its pseudo-elements */}
      <div className={`toggle-background-elements ${weatherMode}`}>
        {/* This div is primarily for the pseudo-elements defined in App.css */}
      </div>
    </button>
  );
};

export default WeatherToggle;