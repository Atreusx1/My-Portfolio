import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

// Create reusable objects outside the component
const tempObject = new THREE.Object3D();
const tempColor = new THREE.Color(); // Reusable color object

// --- Function to create a Sakura Petal Shape matching anime style ---
const createSakuraPetalShape = () => {
    const shape = new THREE.Shape();
    // Adjusted shape for a slightly more typical sakura look
    const length = 1.0; const width = 0.6; // Slightly narrower
    shape.moveTo(0, -length * 0.5);
    // Smoother curves, less pronounced notch
    shape.bezierCurveTo(-width * 0.6, -length * 0.3, -width * 0.9, length * 0.1, -width * 0.15, length * 0.45); // Outer curve left
    shape.quadraticCurveTo(0, length*0.48, width * 0.15, length * 0.45); // Top notch (subtle)
    shape.bezierCurveTo(width * 0.9, length * 0.1, width * 0.6, -length * 0.3, 0, -length * 0.5); // Outer curve right
    return shape;
};

// --- Memoized Hook for Petal Geometry ---
const usePetalGeometry = () => {
    return useMemo(() => {
        const petalShape = createSakuraPetalShape();
        // Extrude geometry for a little thickness, can make lighting look better if used
        // const extrudeSettings = { depth: 0.02, bevelEnabled: false };
        // const geometry = new THREE.ExtrudeGeometry(petalShape, extrudeSettings);
        const geometry = new THREE.ShapeGeometry(petalShape); // Keep ShapeGeometry if extrusion not desired
        geometry.center(); // Center the geometry
        // Apply some initial random rotation variation to each *type* of petal, not instance
        geometry.rotateX(Math.PI * 0.05 + Math.random() * 0.1);
        geometry.rotateY(Math.random() * Math.PI * 2);
        geometry.rotateZ(Math.random() * 0.1 - 0.05);
        return geometry;
    }, []);
};

// Updated darker sakura colors (kept from original request)
const sakuraColors = [
  new THREE.Color("#F4B3C2"), new THREE.Color("#E992A9"),
  new THREE.Color("#DB7F98"), new THREE.Color("#D88BA1"),
  new THREE.Color("#C87287"), new THREE.Color("#BF6B7E"),
  new THREE.Color("#E37F95"), new THREE.Color("#CA6679"),
];

const FloatingParticles = ({ count = 200 }) => {
    const meshRef = useRef();
    const { viewport, size } = useThree(); // Use size for stable initial positioning if viewport isn't ready
    const petalGeometry = usePetalGeometry();

    // --- Generate Initial Per-Instance Data ---
    const particles = useMemo(() => {
        const temp = [];
        const R = 16; // Depth spread range
        // Use size directly for more reliable initial values, fallback to viewport
        const initialViewportWidth = size.width > 0 ? (size.width / (size.height / viewport.height)) : 20;
        const initialViewportHeight = size.height > 0 ? viewport.height : 10;
        const halfHeight = initialViewportHeight / 2;

        for (let i = 0; i < count; i++) {
            const x = (Math.random() - 0.5) * initialViewportWidth * 1.8; // Spread wide horizontally
            // *** CHANGE: Start petals RANDOMLY within the vertical viewport ***
            const y = (Math.random() - 0.5) * initialViewportHeight * 1.1; // Spread across the screen height + a little buffer
            const z = (Math.random() - 0.5) * R * 1.2; // Spread in depth

            // Initial random rotation for each instance
            const rx = Math.random() * Math.PI;
            const ry = Math.random() * Math.PI * 2;
            const rz = Math.random() * Math.PI;

            const scale = 0.08 + Math.random() * 0.06; // Random scale

            // *** CHANGE: Slightly increased base speed and range ***
            const factorY = 0.35 + Math.random() * 0.25; // Base downward speed factor
            const speedFactor = 0.009 + Math.random() * 0.006; // Overall speed multiplier (increased)

            const swayFactorX = (Math.random() - 0.5) * 0.7; // Sideways sway intensity

            // Rotation speeds
            const rotSpeedX = (Math.random() - 0.5) * 0.015; // Slightly faster potential rotation
            const rotSpeedY = (Math.random() - 0.5) * 0.012;
            const rotSpeedZ = (Math.random() - 0.5) * 0.015;

            // Color variation logic (kept from original)
            const baseColor = sakuraColors[Math.floor(Math.random() * sakuraColors.length)].clone();
            baseColor.r += (Math.random() - 0.5) * 0.08;
            baseColor.g += (Math.random() - 0.5) * 0.08;
            baseColor.b += (Math.random() - 0.5) * 0.08;
            baseColor.r = Math.max(0, Math.min(1, baseColor.r));
            baseColor.g = Math.max(0, Math.min(1, baseColor.g));
            baseColor.b = Math.max(0, Math.min(1, baseColor.b));

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
    }, [count, viewport.height, size.width, size.height]);

    // --- Set Initial Transforms and Colors ---
    useEffect(() => {
        if (!meshRef.current || !particles || particles.length === 0 || !petalGeometry) return;

        const mesh = meshRef.current;
        const colorArray = new Float32Array(count * 3);

        for (let i = 0; i < count; i++) {
             if (!particles[i]) continue; // Safety check
            const p = particles[i];

            // Set initial matrix
            tempObject.position.copy(p.initialPosition);
            tempObject.rotation.copy(p.initialRotation);
            tempObject.scale.setScalar(p.scale);
            tempObject.updateMatrix();
            mesh.setMatrixAt(i, tempObject.matrix);

            // Set initial color
            p.initialColor.toArray(colorArray, i * 3);
        }

        // Ensure the color attribute exists before setting/updating it
        if (!mesh.geometry.attributes.color) {
             // Important: Use the base geometry (petalGeometry) to add the attribute
             petalGeometry.setAttribute('color', new THREE.InstancedBufferAttribute(colorArray, 3));
        } else {
             // Update existing attribute
             mesh.geometry.attributes.color.copyArray(colorArray);
             mesh.geometry.attributes.color.needsUpdate = true;
        }

        mesh.instanceMatrix.needsUpdate = true; // Signal update for transforms
        // console.log("Initial setup complete. Viewport:", viewport, "Size:", size);

    // Add petalGeometry to dependency array to ensure color attribute setup runs when geometry is ready
    }, [particles, count, petalGeometry, size.width, size.height]); // Added size dependency here too


    // --- Animation Logic ---
    useFrame((state, delta) => {
        // Ensure mesh and necessary attributes are ready
        if (!meshRef.current?.instanceMatrix || !particles || particles.length === 0) return;

        const mesh = meshRef.current;
        const time = state.clock.elapsedTime;
        const currentViewport = state.viewport; // Use state.viewport for dynamic resize handling
        const topEdge = currentViewport.height / 2;
        const bottomEdge = -topEdge;
        const currentViewportWidth = currentViewport.width;

        // Define the boundary slightly below the visible bottom edge
        const boundaryY = bottomEdge - 2; // Reset when 2 units below the bottom edge

        for (let i = 0; i < count; i++) {
            // Guard against missing particle data (though unlikely with proper init)
            if (!particles[i]) continue;
            const p = particles[i];

            // Get current matrix of the instance
            mesh.getMatrixAt(i, tempObject.matrix);
            // Decompose matrix to get current position, rotation (as quaternion), and scale
            tempObject.matrix.decompose(tempObject.position, tempObject.quaternion, tempObject.scale);

            // --- Update Position ---
            // Apply downward movement (scaled by delta for frame rate independence)
            tempObject.position.y -= p.factorY * p.speedFactor * 60 * delta;
            // Apply sideways sway based on time and instance index (scaled by delta)
            tempObject.position.x += Math.sin(time * 0.3 + i * 0.5) * p.swayFactorX * p.speedFactor * 20 * delta; // Slightly increased sway effect

            // --- Update Rotation ---
            // Convert quaternion to Euler for easier incremental rotation
            tempObject.rotation.setFromQuaternion(tempObject.quaternion);
            // Apply rotation speeds (scaled by delta)
            tempObject.rotation.x += p.rotSpeedX * 60 * delta;
            tempObject.rotation.y += p.rotSpeedY * 60 * delta;
            tempObject.rotation.z += p.rotSpeedZ * 60 * delta;
            // Convert back to quaternion for storage in the matrix
            tempObject.quaternion.setFromEuler(tempObject.rotation);

            // --- Boundary Check and Reset ---
            if (tempObject.position.y < boundaryY) {
                // Reset position to somewhere above the top edge
                tempObject.position.y = topEdge + 1 + Math.random() * 3; // Start 1 to 4 units above top

                // Reset horizontal position randomly across the viewport width
                tempObject.position.x = (Math.random() - 0.5) * currentViewportWidth * 1.6;
                // Reset depth position
                tempObject.position.z = (Math.random() - 0.5) * 15; // Use a fixed depth range for reset

                // Optionally reset rotation to prevent excessive spinning over time
                // tempObject.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI * 2, Math.random() * Math.PI);
                // tempObject.quaternion.setFromEuler(tempObject.rotation);
            }

            // --- Update Matrix ---
            // Recompose the matrix from the updated position, quaternion, and scale
            tempObject.updateMatrix();
            // Set the updated matrix for the instance
            mesh.setMatrixAt(i, tempObject.matrix);
        }

        // Signal that the instance matrix has been updated and needs to be sent to the GPU
        mesh.instanceMatrix.needsUpdate = true;
    });

    // Render the InstancedMesh
    return (
        <instancedMesh
            ref={meshRef}
            // Use geometry directly, args={[geometry, material, count]}
            args={[petalGeometry, undefined, count]}
            // Key ensures recreation if count changes drastically (usually not needed unless count is dynamic)
            key={count}
        >
            {/* Material definition */}
            <meshBasicMaterial
                vertexColors={true} // Use the instance colors we set up
                side={THREE.DoubleSide} // Render both sides of the petal
                transparent={true} // Enable transparency
                opacity={0.9} // Slight transparency
                depthWrite={false} // Helps with transparency sorting issues
            />
        </instancedMesh>
    );
};

export default FloatingParticles;