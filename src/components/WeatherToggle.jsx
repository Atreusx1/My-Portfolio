// src/components/WeatherToggle.jsx
import React from 'react';
import { FaLeaf, FaRegSnowflake, FaCloudRain, FaFire } from 'react-icons/fa'; // Example icons

const WeatherToggle = ({ weatherMode, toggleWeatherMode }) => {
  const getWeatherIcon = () => {
    switch (weatherMode) {
      case 'sakura':
        return <FaLeaf title="Sakura" />; // Or a more specific flower/leaf icon
        case 'fireflies':
            return <FaFire title="Fireflies" />;
        case 'snow':
        return <FaRegSnowflake title="Snow" />;
      case 'rain':
        return <FaCloudRain title="Rain" />;
      // Or a sparkle/star icon
      default:
        return null;
    }
  };

  return (
    <button
      onClick={toggleWeatherMode}
      aria-label={`Switch weather effect (Current: ${weatherMode})`}
      className="weather-toggle-button" // Class for CSS styling
      // Inline styles are optional if handled entirely by CSS
      // style={{ ... }}
    >
      {getWeatherIcon()}
    </button>
  );
};

export default WeatherToggle;