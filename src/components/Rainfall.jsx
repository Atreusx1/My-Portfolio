// rainfall.jsx
import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

// Create reusable objects outside the component
const tempObject = new THREE.Object3D();
const tempColor = new THREE.Color(); // Reusable color object

// --- Memoized Hook for Raindrop Geometry ---
const useRaindropGeometry = () => {
    return useMemo(() => {
        // Use a thin cylinder for rain streaks
        const radius = 0.008; // Very thin
        const height = 0.4;   // Length of the streak
        const radialSegments = 4; // Low detail is fine for thin streaks
        const geometry = new THREE.CylinderGeometry(radius, radius, height, radialSegments);
        // No need to center, cylinder is already centered vertically
        return geometry;
    }, []);
};

// --- Rain Colors ---
const raindropColors = [
  new THREE.Color("#a0b0c0"), // Light grey-blue
  new THREE.Color("#b0c0d0"),
  new THREE.Color("#c0d0e0"),
  new THREE.Color("#9ab0c8"),
];

const Rainfall = ({ count = 800 }) => { // Adjust count for desired density
    const meshRef = useRef();
    const { viewport, size } = useThree();
    const raindropGeometry = useRaindropGeometry();

    // --- Generate Initial Per-Instance Data ---
    const particles = useMemo(() => {
        const temp = [];
        const R = 15; // Depth spread range
        const initialViewportWidth = size.width > 0 ? (size.width / (size.height / viewport.height)) : 20;
        const initialViewportHeight = size.height > 0 ? viewport.height : 10;

        for (let i = 0; i < count; i++) {
            const x = (Math.random() - 0.5) * initialViewportWidth * 1.8;
            const y = (Math.random() - 0.5) * initialViewportHeight * 1.3; // Start spread out vertically
            const z = (Math.random() - 0.5) * R;

            // Initial rotation (can be minimal for cylinders unless angled rain is desired)
            const rx = 0; // Math.random() * 0.1; // Minimal rotation
            const ry = Math.random() * Math.PI * 2; // Random rotation around Y
            const rz = 0; // Math.random() * 0.1;

            // --- CHANGE: Raindrop Scale ---
            // Scale can slightly vary thickness and length
            const scale = 0.8 + Math.random() * 0.5;

            // --- CHANGE: Rain Movement Parameters ---
            const factorY = 1.8 + Math.random() * 1.2; // Much faster base downward speed
            const speedFactor = 0.012 + Math.random() * 0.008; // Faster overall speed multiplier
            const swayFactorX = (Math.random() - 0.5) * 0.05; // Very minimal sideways sway

            // Rotation speeds (negligible for rain streaks)
            const rotSpeedX = (Math.random() - 0.5) * 0.001;
            const rotSpeedY = (Math.random() - 0.5) * 0.001;
            const rotSpeedZ = (Math.random() - 0.5) * 0.001;

            // --- CHANGE: Rain Color ---
            const baseColor = raindropColors[Math.floor(Math.random() * raindropColors.length)].clone();
             // Optional: Slight brightness variation
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
    }, [count, viewport.height, viewport.width, size.width, size.height]);


    // --- Set Initial Transforms and Colors ---
    useEffect(() => {
        if (!meshRef.current || !particles || particles.length === 0 || !raindropGeometry) return;

        const mesh = meshRef.current;
        const colorArray = new Float32Array(count * 3);

        particles.forEach((p, i) => {
            tempObject.position.copy(p.initialPosition);
            tempObject.rotation.copy(p.initialRotation);
            tempObject.scale.setScalar(p.scale); // Uniform scale usually fine for streaks
            tempObject.updateMatrix();
            mesh.setMatrixAt(i, tempObject.matrix);

            p.initialColor.toArray(colorArray, i * 3);
        });

        if (!mesh.geometry.attributes.color) {
            raindropGeometry.setAttribute('color', new THREE.InstancedBufferAttribute(colorArray, 3));
        } else {
            mesh.geometry.attributes.color.copyArray(colorArray);
            mesh.geometry.attributes.color.needsUpdate = true;
        }

        mesh.instanceMatrix.needsUpdate = true;

    }, [particles, count, raindropGeometry, size.width, size.height]);


    // --- Animation Logic ---
    useFrame((state, delta) => {
        if (!meshRef.current?.instanceMatrix || !particles || particles.length === 0) return;

        const mesh = meshRef.current;
        const time = state.clock.elapsedTime;
        const currentViewport = state.viewport;
        const topEdge = currentViewport.height / 2;
        const bottomEdge = -topEdge;
        const currentViewportWidth = currentViewport.width;

        // Boundary slightly below the visible edge
        const boundaryY = bottomEdge - 3; // Increase buffer slightly as rain is faster

        for (let i = 0; i < count; i++) {
            if (!particles[i]) continue;
            const p = particles[i];

            mesh.getMatrixAt(i, tempObject.matrix);
            tempObject.matrix.decompose(tempObject.position, tempObject.quaternion, tempObject.scale);

            // --- Update Position (Rain Movement) ---
            tempObject.position.y -= p.factorY * p.speedFactor * 60 * delta;
            // Minimal sway
            tempObject.position.x += Math.sin(time * 0.1 + i * 0.5) * p.swayFactorX * p.speedFactor * 30 * delta;

            // --- Update Rotation (Minimal/None) ---
            // Rotation update is largely unnecessary for visual streaks, but kept for structure
             tempObject.rotation.setFromQuaternion(tempObject.quaternion);
             tempObject.rotation.x += p.rotSpeedX * 60 * delta;
             tempObject.rotation.y += p.rotSpeedY * 60 * delta;
             tempObject.rotation.z += p.rotSpeedZ * 60 * delta;
             tempObject.quaternion.setFromEuler(tempObject.rotation);

            // --- Boundary Check and Reset ---
            if (tempObject.position.y < boundaryY) {
                // Reset position above the top edge
                tempObject.position.y = topEdge + 1 + Math.random() * 4; // Start slightly higher

                // Reset horizontal position randomly
                tempObject.position.x = (Math.random() - 0.5) * currentViewportWidth * 1.6;
                // Reset depth
                tempObject.position.z = (Math.random() - 0.5) * R;

                 // Reset rotation (optional, minimal impact)
                 // tempObject.rotation.set(0, Math.random() * Math.PI * 2, 0);
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
            args={[raindropGeometry, undefined, count]} // Use raindrop geometry
            key={count}
        >
            <meshBasicMaterial
                vertexColors={true}
                transparent={true}
                // --- CHANGE: Rain Opacity ---
                opacity={0.65} // Adjust for desired rain visibility
                depthWrite={false}
                // Optional: Blending mode can affect appearance
                // blending={THREE.AdditiveBlending} // Might make rain brighter where overlapping
            />
        </instancedMesh>
    );
};

export default Rainfall;