// src/components/WeatherToggle.jsx
import React from 'react';
// Import the new icon
import { FaLeaf, FaRegSnowflake, FaCloudRain, FaFire, FaCanadianMapleLeaf } from 'react-icons/fa'; // <-- ADDED FaCanadianMapleLeaf

// --- Constants ---
// <-- ADDED 'autumn'
const WEATHER_MODES_ARRAY = ['sakura', 'fireflies', 'snow', 'rain', 'autumn'];
const MODE_DETAILS = {
  sakura: { icon: <FaLeaf />, label: 'Sakura' },
  fireflies: { icon: <FaFire />, label: 'Fireflies' },
  snow: { icon: <FaRegSnowflake />, label: 'Snow' },
  rain: { icon: <FaCloudRain />, label: 'Rain' },
  autumn: { icon: <FaCanadianMapleLeaf />, label: 'Autumn' }, // <-- ADDED Autumn entry
};

const WeatherToggle = React.memo(({ weatherMode, toggleWeatherMode }) => {

  // Ensure weatherMode is valid, fallback if not
  const validWeatherMode = WEATHER_MODES_ARRAY.includes(weatherMode) ? weatherMode : WEATHER_MODES_ARRAY[0];
  const currentMode = MODE_DETAILS[validWeatherMode];

  // Calculate the next mode
  const currentIndex = WEATHER_MODES_ARRAY.indexOf(validWeatherMode);
  const nextIndex = (currentIndex + 1) % WEATHER_MODES_ARRAY.length;
  const nextModeKey = WEATHER_MODES_ARRAY[nextIndex];
  const nextMode = MODE_DETAILS[nextModeKey];

  const renderedIcons = Object.entries(MODE_DETAILS).map(([key, { icon }]) => (
    <span
      key={key}
      // Use validWeatherMode for comparison
      className={`icon ${key === validWeatherMode ? 'active' : ''}`}
    >
      {icon}
    </span>
  ));

  return (
    <button
      onClick={toggleWeatherMode}
      // Apply validWeatherMode class
      className={`weather-toggle-button ${validWeatherMode}`}
      aria-label={`Switch weather effect. Current: ${currentMode.label}. Click to switch to ${nextMode.label}.`}
      title={`Switch to ${nextMode.label}`}
    >
      <div className="toggle-icon-container">
        {renderedIcons}
      </div>
      {/* Apply validWeatherMode class here too */}
      <div className={`toggle-background-elements ${validWeatherMode}`}></div>
    </button>
  );
});

export default WeatherToggle;