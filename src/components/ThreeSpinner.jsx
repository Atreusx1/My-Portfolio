// src/components/GhibliSpinner.jsx
import React from 'react';
import PacmanLoader from "react-spinners/PacmanLoader";

const GhibliSpinner = ({
  // --- CHANGE THE DEFAULT VALUE HERE ---
  size = 25,           // Smaller default size (e.g., 25px). Adjust as needed.
  // -----------------------------------
  color = "#ffd600", // Default Ghibli-esque yellow
  speedMultiplier = 1,
  margin = 2,
  cssOverride = {},
  loading = true
}) => {

  return (
    <div
      className="pacman-spinner-container"
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        margin: 'auto' // For centering
        // No fixed width/height needed here, let the loader determine it
      }}
    >
      <PacmanLoader
        color={color}
        loading={loading}
        cssOverride={cssOverride}
        size={size} // Pass the size prop down
        speedMultiplier={speedMultiplier}
        margin={margin}
        aria-label="Loading Spinner"
        data-testid="loader"
      />
    </div>
  );
};

export default GhibliSpinner;