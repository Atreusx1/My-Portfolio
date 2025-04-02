// src/components/Fireflies.jsx
import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

// Reusable object
const tempObject = new THREE.Object3D();
const tempColor = new THREE.Color(); // Reusable color object

// Firefly colors (Yellowish-green with variations)
const fireflyColors = [
    new THREE.Color("#ADFF2F"), // GreenYellow base
    new THREE.Color("#9ACD32"), // YellowGreen
    new THREE.Color("#CCFF00"), // Bright Lime
    new THREE.Color("#DAA520"), // Goldenrod hint
];

const Fireflies = ({ count = 150 }) => { // Fewer fireflies than petals
    const meshRef = useRef();
    const { viewport, size } = useThree();

    // Memoized geometry (simple small sphere)
    const fireflyGeometry = useMemo(() => new THREE.SphereGeometry(0.03, 8, 8), []); // Smaller radius, fewer segments

    // Generate Initial Per-Instance Data
    const particles = useMemo(() => {
        const temp = [];
        const R = 10; // Spread radius
        const viewportWidth = viewport.width || 15;
        const viewportHeight = viewport.height || 10;

        for (let i = 0; i < count; i++) {
            // Distribute more evenly within the viewport volume
            const x = (Math.random() - 0.5) * viewportWidth * 1.5;
            const y = (Math.random() - 0.5) * viewportHeight * 1.2;
            const z = (Math.random() - 0.5) * R;

            const scale = 0.8 + Math.random() * 0.6; // Base scale + random variation
            const driftSpeed = 0.05 + Math.random() * 0.1;
            const driftDirection = new THREE.Vector3(
                (Math.random() - 0.5) * 0.3,
                (Math.random() - 0.5) * 0.3,
                (Math.random() - 0.5) * 0.1
            ).normalize();
            const phase = Math.random() * Math.PI * 2; // For pulsing/flickering
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
                currentPosition: new THREE.Vector3(x, y, z), // Store current position for reset logic
            });
        }
        return temp;
    }, [count, viewport.height, viewport.width]);

    // Set Initial Transforms and Colors
    useEffect(() => {
        if (!meshRef.current || !particles || particles.length === 0) return;
        const mesh = meshRef.current;
        const colorAttribute = mesh.geometry.getAttribute('color');

        // Initialize color attribute if it doesn't exist
        if (!colorAttribute || colorAttribute.count !== count) {
             const colorArray = new Float32Array(count * 3);
             particles.forEach((p, i) => p.baseColor.toArray(colorArray, i * 3));
             mesh.geometry.setAttribute('color', new THREE.InstancedBufferAttribute(colorArray, 3));
        } else {
             // If it exists, update it (useful if count changes, though not typical here)
             const colorArray = colorAttribute.array;
             particles.forEach((p, i) => p.baseColor.toArray(colorArray, i * 3));
             colorAttribute.needsUpdate = true;
        }

        for (let i = 0; i < count; i++) {
            if (!particles[i]) continue;
            const p = particles[i];
            tempObject.position.copy(p.initialPosition);
            tempObject.scale.setScalar(p.baseScale);
            tempObject.updateMatrix();
            mesh.setMatrixAt(i, tempObject.matrix);
        }
        mesh.instanceMatrix.needsUpdate = true;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [particles, count]); // Only re-run if particles array or count changes

    // Animation Logic
    useFrame((state, delta) => {
        if (!meshRef.current || !particles || particles.length === 0) return;

        const mesh = meshRef.current;
        const time = state.clock.elapsedTime;
        const colorAttribute = mesh.geometry.getAttribute('color');
        const colorArray = colorAttribute?.array;

        // Define boundaries based on viewport
        const boundaryX = viewport.width / 2 * 1.3; // A bit outside the view
        const boundaryY = viewport.height / 2 * 1.3;
        const boundaryZ = 12; // Arbitrary depth boundary


        for (let i = 0; i < count; i++) {
            if (!particles[i]) continue;
            const p = particles[i];

            mesh.getMatrixAt(i, tempObject.matrix);
            tempObject.matrix.decompose(tempObject.position, tempObject.quaternion, tempObject.scale);

            // --- Update Position (Slow Drift) ---
            const driftAmount = p.driftSpeed * delta;
            tempObject.position.addScaledVector(p.driftDirection, driftAmount);
            p.currentPosition.copy(tempObject.position); // Update stored position

             // Add slight random wobble/change direction over time
            if (Math.random() < 0.005) { // Occasionally change direction slightly
                 p.driftDirection.x += (Math.random() - 0.5) * 0.1;
                 p.driftDirection.y += (Math.random() - 0.5) * 0.1;
                 p.driftDirection.z += (Math.random() - 0.5) * 0.05;
                 p.driftDirection.normalize();
            }


            // --- Update Scale (Pulsing/Flickering) ---
            const pulse = (Math.sin(time * p.flickerSpeed + p.phase) + 1) / 2; // Value between 0 and 1
            const currentScale = p.baseScale * (0.6 + pulse * 0.8); // Modulate base scale (ensure it doesn't go to 0)
            tempObject.scale.setScalar(currentScale);

            // --- Update Color Brightness (Subtle flicker linked to pulse) ---
            if (colorArray) {
                tempColor.setRGB(
                    p.baseColor.r * (0.7 + pulse * 0.6),
                    p.baseColor.g * (0.7 + pulse * 0.6),
                    p.baseColor.b * (0.7 + pulse * 0.6)
                );
                 tempColor.toArray(colorArray, i * 3);
            }

             // --- Boundary Check & Reset ---
             // Check if particle is too far outside boundaries
            if (Math.abs(tempObject.position.x) > boundaryX ||
                Math.abs(tempObject.position.y) > boundaryY ||
                Math.abs(tempObject.position.z) > boundaryZ)
            {
                // Reset to the opposite side or a random edge
                const edge = Math.floor(Math.random() * 4); // 0:left, 1:right, 2:bottom, 3:top
                let resetX, resetY;

                if (edge === 0) { // Left
                    resetX = -boundaryX * 0.95;
                    resetY = (Math.random() - 0.5) * viewport.height * 1.1;
                } else if (edge === 1) { // Right
                    resetX = boundaryX * 0.95;
                    resetY = (Math.random() - 0.5) * viewport.height * 1.1;
                } else if (edge === 2) { // Bottom
                    resetX = (Math.random() - 0.5) * viewport.width * 1.1;
                    resetY = -boundaryY * 0.95;
                } else { // Top
                    resetX = (Math.random() - 0.5) * viewport.width * 1.1;
                    resetY = boundaryY * 0.95;
                }

                tempObject.position.set(
                    resetX,
                    resetY,
                    (Math.random() - 0.5) * 8 // Reset z within a range
                );
                 p.currentPosition.copy(tempObject.position); // Update stored position
            }


            // Update Matrix
            tempObject.updateMatrix();
            mesh.setMatrixAt(i, tempObject.matrix);
        }

        mesh.instanceMatrix.needsUpdate = true;
        if (colorAttribute) {
            colorAttribute.needsUpdate = true;
        }
    });

    return (
        <instancedMesh
            ref={meshRef}
            args={[fireflyGeometry, null, count]}
            key={count} // Ensure remount if count changes drastically
        >
            {/* Material for glowing effect */}
            <meshBasicMaterial
                vertexColors={true}       // Use the instance colors
                transparent={true}
                opacity={0.9}
                blending={THREE.AdditiveBlending} // Key for glow effect
                depthWrite={false}         // Important for additive blending
            />
        </instancedMesh>
    );
};

export default Fireflies;