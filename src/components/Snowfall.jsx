// snowfall.jsx
import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

// Create reusable objects outside the component
const tempObject = new THREE.Object3D();
const tempColor = new THREE.Color(); // Reusable color object

// --- Memoized Hook for Snowflake Geometry ---
const useSnowflakeGeometry = () => {
    return useMemo(() => {
        // Use a simple sphere geometry for snowflakes
        // Small radius, low detail for performance
        const geometry = new THREE.SphereGeometry(0.025, 6, 6);
        // Sphere geometry is already centered, no need for geometry.center()
        return geometry;
    }, []);
};

// --- Snowflake Colors ---
const snowflakeColors = [
  new THREE.Color("#FFFFFF"), // White
  new THREE.Color("#f0f8ff"), // AliceBlue (very light blue tint)
  new THREE.Color("#e6faff"), // Lighter blue tint
  new THREE.Color("#ffffff"), // More white
];

const Snowfall = ({ count = 500 }) => { // Increased default count
    const meshRef = useRef();
    const { viewport, size } = useThree();
    const snowflakeGeometry = useSnowflakeGeometry();

    // --- Generate Initial Per-Instance Data ---
    const particles = useMemo(() => {
        const temp = [];
        const R = 18; // Depth spread range slightly increased
        const initialViewportWidth = size.width > 0 ? (size.width / (size.height / viewport.height)) : 20;
        const initialViewportHeight = size.height > 0 ? viewport.height : 10;

        for (let i = 0; i < count; i++) {
            const x = (Math.random() - 0.5) * initialViewportWidth * 1.8; // Spread wide horizontally
            const y = (Math.random() - 0.5) * initialViewportHeight * 1.2; // Spread across the screen height + buffer
            const z = (Math.random() - 0.5) * R; // Spread in depth

            // Initial random rotation for each instance
            const rx = Math.random() * Math.PI;
            const ry = Math.random() * Math.PI * 2;
            const rz = Math.random() * Math.PI;

            // --- CHANGE: Snowflake Scale ---
            const scale = 0.8 + Math.random() * 0.7; // Adjust scale for snowflake size (relative to sphere radius)

            // --- CHANGE: Snowflake Movement Parameters ---
            const factorY = 0.15 + Math.random() * 0.15; // Slower base downward speed
            const speedFactor = 0.008 + Math.random() * 0.006; // Slightly reduced overall speed multiplier
            const swayFactorX = (Math.random() - 0.5) * 0.6; // Gentler sideways sway intensity

            // Rotation speeds (snowflakes tumble gently)
            const rotSpeedX = (Math.random() - 0.5) * 0.006; // Slower rotation
            const rotSpeedY = (Math.random() - 0.5) * 0.008; // Bit more potential Y rotation (tumble)
            const rotSpeedZ = (Math.random() - 0.5) * 0.006; // Slower rotation

            // --- CHANGE: Snowflake Color ---
            const baseColor = snowflakeColors[Math.floor(Math.random() * snowflakeColors.length)].clone();
            // Optional: Add slight brightness variation
            const brightnessVariation = (Math.random() - 0.5) * 0.1;
            baseColor.r = Math.max(0, Math.min(1, baseColor.r + brightnessVariation));
            baseColor.g = Math.max(0, Math.min(1, baseColor.g + brightnessVariation));
            baseColor.b = Math.max(0, Math.min(1, baseColor.b + brightnessVariation));


            temp.push({
                initialPosition: new THREE.Vector3(x, y, z),
                initialRotation: new THREE.Euler(rx, ry, rz),
                scale,
                factorY,
                speedFactor,
                swayFactorX,
                rotSpeedX,
                rotSpeedY,
                rotSpeedZ,
                initialColor: baseColor
            });
        }
        return temp;
    // Add size.width and size.height as dependencies for reliable initial positioning
    }, [count, viewport.height, viewport.width, size.width, size.height]); // Added viewport.width for horizontal spread dependency


    // --- Set Initial Transforms and Colors ---
    useEffect(() => {
        if (!meshRef.current || !particles || particles.length === 0 || !snowflakeGeometry) return;

        const mesh = meshRef.current;
        const colorArray = new Float32Array(count * 3);

        particles.forEach((p, i) => {
            // Set initial matrix
            tempObject.position.copy(p.initialPosition);
            tempObject.rotation.copy(p.initialRotation);
            tempObject.scale.setScalar(p.scale);
            tempObject.updateMatrix();
            mesh.setMatrixAt(i, tempObject.matrix);

            // Set initial color
            p.initialColor.toArray(colorArray, i * 3);
        });

        // Ensure the color attribute exists before setting/updating it
        // Use the base geometry (snowflakeGeometry) to add the attribute
        if (!mesh.geometry.attributes.color) {
            snowflakeGeometry.setAttribute('color', new THREE.InstancedBufferAttribute(colorArray, 3));
        } else {
            mesh.geometry.attributes.color.copyArray(colorArray);
            mesh.geometry.attributes.color.needsUpdate = true;
        }

        mesh.instanceMatrix.needsUpdate = true; // Signal update for transforms

    // Add snowflakeGeometry to dependency array
    }, [particles, count, snowflakeGeometry, size.width, size.height]);


    // --- Animation Logic ---
    useFrame((state, delta) => {
        if (!meshRef.current?.instanceMatrix || !particles || particles.length === 0) return;

        const mesh = meshRef.current;
        const time = state.clock.elapsedTime;
        const currentViewport = state.viewport;
        const topEdge = currentViewport.height / 2;
        const bottomEdge = -topEdge;
        const currentViewportWidth = currentViewport.width;

        // Define the boundary slightly below the visible bottom edge
        const boundaryY = bottomEdge - 2; // Reset when 2 units below the bottom edge

        for (let i = 0; i < count; i++) {
             if (!particles[i]) continue;
            const p = particles[i];

            // Get current matrix
            mesh.getMatrixAt(i, tempObject.matrix);
            tempObject.matrix.decompose(tempObject.position, tempObject.quaternion, tempObject.scale);

            // --- Update Position (Snow Movement) ---
            tempObject.position.y -= p.factorY * p.speedFactor * 60 * delta;
            // Sideways drift/sway
            tempObject.position.x += Math.sin(time * 0.2 + i * 0.5) * p.swayFactorX * p.speedFactor * 30 * delta; // Adjusted sway timing/intensity

            // --- Update Rotation (Snow Tumble) ---
            tempObject.rotation.setFromQuaternion(tempObject.quaternion);
            tempObject.rotation.x += p.rotSpeedX * 60 * delta;
            tempObject.rotation.y += p.rotSpeedY * 60 * delta;
            tempObject.rotation.z += p.rotSpeedZ * 60 * delta;
            tempObject.quaternion.setFromEuler(tempObject.rotation);

            // --- Boundary Check and Reset ---
            if (tempObject.position.y < boundaryY) {
                // Reset position to somewhere above the top edge
                tempObject.position.y = topEdge + 1 + Math.random() * 3; // Start 1 to 4 units above top

                // Reset horizontal position randomly across the viewport width
                tempObject.position.x = (Math.random() - 0.5) * currentViewportWidth * 1.6;
                // Reset depth position
                tempObject.position.z = (Math.random() - 0.5) * 16; // Slightly adjusted depth reset range

                // Optional: Reset rotation slightly if they spin too much over time
                // tempObject.rotation.set(Math.random() * Math.PI * 0.2, Math.random() * Math.PI * 2, Math.random() * Math.PI * 0.2);
                // tempObject.quaternion.setFromEuler(tempObject.rotation);
            }

            // --- Update Matrix ---
            tempObject.updateMatrix();
            mesh.setMatrixAt(i, tempObject.matrix);
        }

        mesh.instanceMatrix.needsUpdate = true;
    });

    // Render the InstancedMesh
    return (
        <instancedMesh
            ref={meshRef}
            args={[snowflakeGeometry, undefined, count]} // Use snowflake geometry
            key={count} // Consider removing if count is static for slight perf gain
        >
            <meshBasicMaterial
                vertexColors={true} // Use instance colors
                // side={THREE.DoubleSide} // Not strictly needed for spheres
                transparent={true}
                opacity={0.85} // Slightly adjusted opacity for snow
                depthWrite={false} // Good for transparency
            />
        </instancedMesh>
    );
};

export default Snowfall;