// src/components/WeatherToggle.jsx
import React from 'react'; // No need for named import if not used directly
import { FaLeaf, FaRegSnowflake, FaCloudRain, FaFire } from 'react-icons/fa';

// --- Constants (Define outside component for clarity) ---
const WEATHER_MODES_ARRAY = ['sakura', 'fireflies', 'snow', 'rain'];
const MODE_DETAILS = {
  sakura: { icon: <FaLeaf />, label: 'Sakura' },
  fireflies: { icon: <FaFire />, label: 'Fireflies' },
  snow: { icon: <FaRegSnowflake />, label: 'Snow' },
  rain: { icon: <FaCloudRain />, label: 'Rain' },
};

// --- Optimization: Wrap component in React.memo ---
// This prevents re-rendering if props (weatherMode, toggleWeatherMode) haven't changed.
// Requires toggleWeatherMode to be memoized in the parent (which it is via useCallback).
const WeatherToggle = React.memo(({ weatherMode, toggleWeatherMode }) => {

  const currentMode = MODE_DETAILS[weatherMode] || MODE_DETAILS.sakura; // Default fallback

  // Calculate the next mode for preview or tooltip
  const currentIndex = WEATHER_MODES_ARRAY.indexOf(weatherMode);
  const nextIndex = (currentIndex + 1) % WEATHER_MODES_ARRAY.length;
  const nextModeKey = WEATHER_MODES_ARRAY[nextIndex];
  const nextMode = MODE_DETAILS[nextModeKey];

  // --- Optimization: Memoize icon rendering if it becomes complex ---
  // For this simple case, direct mapping is fine. If icons involved complex logic,
  // useMemo could be applied here, but likely unnecessary.
  const renderedIcons = Object.entries(MODE_DETAILS).map(([key, { icon }]) => (
    <span
      key={key}
      className={`icon ${key === weatherMode ? 'active' : ''}`}
    >
      {icon}
    </span>
  ));

  return (
    <button
      onClick={toggleWeatherMode}
      className={`weather-toggle-button ${weatherMode}`} // Apply current mode class for styling
      aria-label={`Switch weather effect. Current: ${currentMode.label}. Click to switch to ${nextMode.label}.`}
      title={`Switch to ${nextMode.label}`} // Tooltip
    >
      <div className="toggle-icon-container">
        {renderedIcons} {/* Render the mapped icons */}
      </div>

      {/* Background elements div for pseudo-element styling */}
      <div className={`toggle-background-elements ${weatherMode}`}></div>
    </button>
  );
}); // End of React.memo wrap

export default WeatherToggle;