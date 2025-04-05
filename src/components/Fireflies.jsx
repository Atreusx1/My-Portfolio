// src/components/Fireflies.jsx
import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

// --- Reusable objects (Optimization: Avoid creating these in loops) ---
const tempObject = new THREE.Object3D();
const tempColor = new THREE.Color(); // Reusable color object

// --- Constants ---
const fireflyColors = [
    new THREE.Color("#ADFF2F"), // GreenYellow base
    new THREE.Color("#9ACD32"), // YellowGreen
    new THREE.Color("#CCFF00"), // Bright Lime
    new THREE.Color("#DAA520"), // Goldenrod hint
];
const BASE_RADIUS = 0.03;
const BASE_GEOMETRY_SEGMENTS = 8; // (Optimization: Keep segments low for simple geometry)

const Fireflies = ({ count = 150 }) => {
    const meshRef = useRef();
    const { viewport } = useThree(); // Destructure only what's needed

    // --- Memoized Geometry (Optimization: Create geometry only once) ---
    const fireflyGeometry = useMemo(
        () => new THREE.SphereGeometry(BASE_RADIUS, BASE_GEOMETRY_SEGMENTS, BASE_GEOMETRY_SEGMENTS),
        [] // Empty dependency array means it runs only once
    );

    // --- Generate Initial Per-Instance Data (Optimization: useMemo avoids recalculation on every render) ---
    const particles = useMemo(() => {
        console.log("Generating Firefly Particles Data..."); // Log when this expensive operation runs
        const temp = [];
        const R = 10; // Spread radius for Z
        // Use default values if viewport isn't ready initially, though useThree usually provides it
        const viewportWidth = viewport.width || 15;
        const viewportHeight = viewport.height || 10;

        for (let i = 0; i < count; i++) {
            // Distribute more evenly within the viewport volume
            const x = (Math.random() - 0.5) * viewportWidth * 1.5;
            const y = (Math.random() - 0.5) * viewportHeight * 1.2;
            const z = (Math.random() - 0.5) * R;

            const scale = 0.8 + Math.random() * 0.6;
            const driftSpeed = 0.05 + Math.random() * 0.1;
            const driftDirection = new THREE.Vector3(
                (Math.random() - 0.5) * 0.3,
                (Math.random() - 0.5) * 0.3,
                (Math.random() - 0.5) * 0.1
            ).normalize();
            const phase = Math.random() * Math.PI * 2;
            const flickerSpeed = 0.5 + Math.random() * 1.5;
            const baseColor = fireflyColors[Math.floor(Math.random() * fireflyColors.length)].clone();

            temp.push({
                initialPosition: new THREE.Vector3(x, y, z),
                baseScale: scale,
                driftSpeed,
                driftDirection,
                phase,
                flickerSpeed,
                baseColor,
                currentPosition: new THREE.Vector3(x, y, z),
            });
        }
        return temp;
        // Dependency array includes viewport dimensions now
        // This means particles *will* regenerate if viewport size changes,
        // which might be desirable to redistribute them. If not, remove viewport.*
    }, [count, viewport.height, viewport.width]);

    // --- Set Initial Transforms and Colors (Optimization: useEffect with correct dependencies) ---
    useEffect(() => {
        console.log("Setting Initial Firefly State..."); // Log when this effect runs
        if (!meshRef.current || !particles || particles.length === 0) return;

        const mesh = meshRef.current;

        // Initialize or update the instance color buffer attribute
        let colorAttribute = mesh.geometry.getAttribute('color');
        if (!colorAttribute || colorAttribute.count !== count) {
            // Create new attribute if it doesn't exist or count changed
             const colorArray = new Float32Array(count * 3);
             particles.forEach((p, i) => p.baseColor.toArray(colorArray, i * 3));
             // Create a *new* attribute and assign it
             mesh.geometry.setAttribute('color', new THREE.InstancedBufferAttribute(colorArray, 3));
             console.log("Created new color attribute for fireflies.");
        } else {
             // Update existing attribute's array data
             console.log("Updating existing color attribute for fireflies.");
             const colorArray = colorAttribute.array;
             particles.forEach((p, i) => p.baseColor.toArray(colorArray, i * 3));
             colorAttribute.needsUpdate = true; // Mark for upload
        }

        // Set initial matrix for each instance
        for (let i = 0; i < count; i++) {
            if (!particles[i]) continue; // Should not happen, but safe check
            const p = particles[i];
            tempObject.position.copy(p.initialPosition);
            tempObject.scale.setScalar(p.baseScale);
            tempObject.updateMatrix(); // Calculate matrix from position/scale
            mesh.setMatrixAt(i, tempObject.matrix);
        }
        mesh.instanceMatrix.needsUpdate = true; // Mark matrix buffer for upload

        // Dependencies ensure this runs only when particle data or count changes.
        // The explicit `count` dependency handles cases where `particles` might hypothetically
        // not change reference even if `count` did (though unlikely with useMemo setup).
    }, [particles, count]);

    // --- Animation Logic (Optimization: Cache lookups outside the loop) ---
    useFrame((state, delta) => {
        const mesh = meshRef.current;
        // Early exit if mesh isn't ready or no particles
        if (!mesh || !particles || particles.length === 0) return;

        const time = state.clock.elapsedTime;
        const colorAttribute = mesh.geometry.getAttribute('color');
        const colorArray = colorAttribute?.array; // Cache attribute array

        // Define boundaries based on current viewport (Optimization: Read viewport once per frame)
        const boundaryX = viewport.width / 2 * 1.3;
        const boundaryY = viewport.height / 2 * 1.3;
        const boundaryZ = 12;

        let matrixNeedsUpdate = false; // (Optimization: Flag to track if *any* matrix changed)
        let colorNeedsUpdate = false; // (Optimization: Flag to track if *any* color changed)

        for (let i = 0; i < count; i++) {
            const p = particles[i]; // Cache particle data
             if (!p) continue; // Safety check

            // Get current matrix data
            mesh.getMatrixAt(i, tempObject.matrix);
            // Decompose matrix into reusable tempObject's position, quaternion, scale
            tempObject.matrix.decompose(tempObject.position, tempObject.quaternion, tempObject.scale);

            // --- Update Position (Slow Drift) ---
            const driftAmount = p.driftSpeed * delta;
            tempObject.position.addScaledVector(p.driftDirection, driftAmount);
            // Store current position (though not strictly needed if reset logic doesn't use it)
            // p.currentPosition.copy(tempObject.position); // Can be removed if reset logic is self-contained

             // Add slight random wobble/change direction over time
            if (Math.random() < 0.005) {
                 p.driftDirection.x += (Math.random() - 0.5) * 0.1;
                 p.driftDirection.y += (Math.random() - 0.5) * 0.1;
                 p.driftDirection.z += (Math.random() - 0.5) * 0.05;
                 p.driftDirection.normalize();
            }

            // --- Update Scale (Pulsing/Flickering) ---
            const pulse = (Math.sin(time * p.flickerSpeed + p.phase) + 1) / 2; // 0 to 1
            const currentScale = p.baseScale * (0.6 + pulse * 0.8); // Modulate base scale
            tempObject.scale.setScalar(currentScale);

            // --- Update Color Brightness (Subtle flicker linked to pulse) ---
            if (colorArray) { // Ensure color attribute exists and we have the array
                // Use the reusable tempColor object
                tempColor.setRGB(
                    p.baseColor.r * (0.7 + pulse * 0.6),
                    p.baseColor.g * (0.7 + pulse * 0.6),
                    p.baseColor.b * (0.7 + pulse * 0.6)
                );
                 tempColor.toArray(colorArray, i * 3); // Write updated color to the buffer array
                 colorNeedsUpdate = true; // Mark that colors have changed
            }

             // --- Boundary Check & Reset ---
             // Check if particle is too far outside boundaries
            if (Math.abs(tempObject.position.x) > boundaryX ||
                Math.abs(tempObject.position.y) > boundaryY ||
                Math.abs(tempObject.position.z) > boundaryZ)
            {
                // Reset to a random edge just inside the opposite boundary
                const edge = Math.floor(Math.random() * 4); // 0:left, 1:right, 2:bottom, 3:top
                let resetX, resetY;
                const marginFactor = 0.98; // Place slightly inside the boundary

                if (edge === 0) { // Coming from right, reset to left
                    resetX = -boundaryX * marginFactor;
                    resetY = (Math.random() - 0.5) * viewport.height * 1.1;
                } else if (edge === 1) { // Coming from left, reset to right
                    resetX = boundaryX * marginFactor;
                    resetY = (Math.random() - 0.5) * viewport.height * 1.1;
                } else if (edge === 2) { // Coming from top, reset to bottom
                    resetX = (Math.random() - 0.5) * viewport.width * 1.1;
                    resetY = -boundaryY * marginFactor;
                } else { // Coming from bottom, reset to top
                    resetX = (Math.random() - 0.5) * viewport.width * 1.1;
                    resetY = boundaryY * marginFactor;
                }

                tempObject.position.set(
                    resetX,
                    resetY,
                    (Math.random() - 0.5) * 8 // Reset z within a reasonable range
                );
                 // p.currentPosition.copy(tempObject.position); // Update stored position if needed elsewhere
            }

            // --- Update Matrix ---
            tempObject.updateMatrix(); // Recalculate the matrix from updated position/scale
            mesh.setMatrixAt(i, tempObject.matrix); // Write updated matrix to the instance buffer
            matrixNeedsUpdate = true; // Mark that matrices have changed
        }

        // --- Buffer Updates (Optimization: Set needsUpdate only once after the loop, if needed) ---
        if (matrixNeedsUpdate) {
            mesh.instanceMatrix.needsUpdate = true;
        }
        if (colorNeedsUpdate && colorAttribute) {
            colorAttribute.needsUpdate = true;
        }
    });

    // --- Resource Cleanup (Optimization: Dispose geometry on unmount) ---
    useEffect(() => {
        // Return a cleanup function
        return () => {
            console.log("Disposing Firefly Geometry");
            fireflyGeometry.dispose();
            // Materials without textures usually don't need explicit disposal,
            // but if you add textures later, dispose the material too.
        };
    }, [fireflyGeometry]); // Dependency ensures it cleans up the correct geometry


    return (
        <instancedMesh
            ref={meshRef}
            // Using count directly as key forces remount if count changes,
            // which is simple but potentially heavy. The useEffect handles count changes now.
            // Consider removing the key if count changes aren't frequent or drastic.
            key={count}
            args={[fireflyGeometry, null, count]}
        >
            {/* Use a single material for all instances */}
            <meshBasicMaterial
                vertexColors={true} // Enable instance colors
                transparent={true}
                opacity={0.9} // Adjust as needed
                blending={THREE.AdditiveBlending} // Key for glow effect
                depthWrite={false} // Important for additive blending order
            />
        </instancedMesh>
    );
};

// --- React Memoization (Optimization: Prevent re-renders if props haven't changed) ---
export default React.memo(Fireflies);