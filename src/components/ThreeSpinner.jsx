// src/components/ParticleSpinner.jsx
import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// Helper function to distribute points evenly on a sphere
// (Using simple random spherical coords here for simplicity,
// can be replaced with Fibonacci sphere or other methods if needed)
function getRandomPointOnSphere(radius) {
    const u = Math.random();
    const v = Math.random();
    const theta = 2 * Math.PI * u; // Azimuthal angle
    const phi = Math.acos(2 * v - 1); // Polar angle
    const x = radius * Math.sin(phi) * Math.cos(theta);
    const y = radius * Math.sin(phi) * Math.sin(theta);
    const z = radius * Math.cos(phi);
    return new THREE.Vector3(x, y, z);
}

// --- Configuration ---
const DEFAULT_COUNT = 500;
const DEFAULT_RADIUS = 1.5;
const DEFAULT_COLOR_INSIDE = '#C8A2C8'; // Lilac (or your preference)
const DEFAULT_COLOR_OUTSIDE = '#FFFFFF'; // White (or your preference)
const DEFAULT_SIZE = 0.035;
const DEFAULT_ROTATION_SPEED = 0.3;
const DEFAULT_SWIRL_FREQUENCY = 0.2; // How fast the individual particles oscillate
const DEFAULT_SWIRL_AMPLITUDE = 0.15; // How far the individual particles move

const ParticleSpinner = ({
  count = DEFAULT_COUNT,
  radius = DEFAULT_RADIUS,
  colorInside = DEFAULT_COLOR_INSIDE,
  colorOutside = DEFAULT_COLOR_OUTSIDE,
  particleSize = DEFAULT_SIZE,
  rotationSpeed = DEFAULT_ROTATION_SPEED,
  swirlFrequency = DEFAULT_SWIRL_FREQUENCY,
  swirlAmplitude = DEFAULT_SWIRL_AMPLITUDE,
}) => {
  const pointsRef = useRef();
  const materialRef = useRef();

  // Memoize initial positions and colors to avoid recalculation on re-renders
  const [initialPositions, colors] = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const vertexColors = new Float32Array(count * 3);
    const color1 = new THREE.Color(colorInside);
    const color2 = new THREE.Color(colorOutside);

    for (let i = 0; i < count; i++) {
      const pos = getRandomPointOnSphere(radius);
      positions[i * 3] = pos.x;
      positions[i * 3 + 1] = pos.y;
      positions[i * 3 + 2] = pos.z;

      // Interpolate color based on normalized Y position (or other metric)
      const normalizedY = (pos.y / radius + 1) / 2; // Map y from [-radius, radius] to [0, 1]
      const color = color1.clone().lerp(color2, normalizedY);

      vertexColors[i * 3] = color.r;
      vertexColors[i * 3 + 1] = color.g;
      vertexColors[i * 3 + 2] = color.b;
    }
    return [positions, vertexColors];
  }, [count, radius, colorInside, colorOutside]);

  // Store the initial positions separately for animation reference
  const originalPositions = useMemo(() => new Float32Array(initialPositions), [initialPositions]);

  useFrame((state) => {
    const { clock } = state;
    const elapsedTime = clock.getElapsedTime();

    if (pointsRef.current) {
      // --- Overall Rotation ---
      pointsRef.current.rotation.y = elapsedTime * rotationSpeed;

      // --- Individual Particle Swirl ---
      const positions = pointsRef.current.geometry.attributes.position.array;

      for (let i = 0; i < count; i++) {
        const ix = i * 3;
        const iy = i * 3 + 1;
        const iz = i * 3 + 2;

        // Get original position for stable oscillation base
        const ox = originalPositions[ix];
        const oy = originalPositions[iy];
        const oz = originalPositions[iz];

        // Calculate offset using sine waves based on original position and time
        const time = elapsedTime * swirlFrequency;
        const offsetX = Math.sin(time + ox * 2.0) * swirlAmplitude;
        const offsetY = Math.cos(time + oy * 1.5) * swirlAmplitude;
        const offsetZ = Math.sin(time + oz * 2.5) * swirlAmplitude;

        // Apply offset to the current position attribute
        positions[ix] = ox + offsetX;
        positions[iy] = oy + offsetY;
        positions[iz] = oz + offsetZ;
      }

      // IMPORTANT: Notify Three.js that the position attribute needs updating
      pointsRef.current.geometry.attributes.position.needsUpdate = true;

      // Optional: Subtle overall wobble (like before, but maybe slower)
      const wobbleAmplitude = 0.1;
      const wobbleFrequency = 0.15;
      pointsRef.current.rotation.x = Math.sin(elapsedTime * wobbleFrequency) * wobbleAmplitude;
      pointsRef.current.rotation.z = Math.cos(elapsedTime * wobbleFrequency) * wobbleAmplitude;
    }
  });

  return (
    <>
      <points ref={pointsRef}>
        {/* Use bufferGeometry to provide custom attributes */}
        <bufferGeometry attach="geometry">
          {/* Define position attribute */}
          <bufferAttribute
            attach="attributes-position" // Use the recommended attribute name format
            count={count}
            array={initialPositions} // Start with the memoized positions
            itemSize={3} // x, y, z
            usage={THREE.DynamicDrawUsage} // Mark as dynamic since we update it
          />
          {/* Define color attribute */}
          <bufferAttribute
            attach="attributes-color"
            count={count}
            array={colors}
            itemSize={3} // r, g, b
            normalized={false} // Colors are 0-1 floats already
          />
        </bufferGeometry>
        <pointsMaterial
          ref={materialRef}
          size={particleSize}
          sizeAttenuation={true}
          transparent={true}
          opacity={0.9} // Slightly increased opacity might look good with colors
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          vertexColors={true} // IMPORTANT: Enable vertex colors
        />
      </points>
    </>
  );
};

export default ParticleSpinner;