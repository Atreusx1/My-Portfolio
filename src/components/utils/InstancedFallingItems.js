// InstancedFallingItems.js
import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// --- Optimization: Reusable THREE Objects ---
const tempObject = new THREE.Object3D();
const tempColor = new THREE.Color(); // Reusable for random adjustments

const InstancedFallingItems = React.memo(({
    count = 100,
    geometry, // REQUIRED: Pass the geometry to instance
    colorPalette, // REQUIRED: Pass an array of THREE.Color objects
    physicsConfig = {} // Optional: Pass custom physics ranges
}) => {
    const meshRef = useRef(); // No type needed in JS for useRef typically

    // --- Default Physics (can be overridden by physicsConfig prop) ---
    const config = useMemo(() => ({
        scaleRange: [0.08, 0.14],       // [minBase, maxBase] -> final = base + random * (max-min)
        fallSpeedRange: [0.009, 0.015], // [min, max] speedFactor
        swayFactorRange: [0.5, 1.0],    // [min, max] swayFactorX magnitude
        rotSpeedRange: [0.008, 0.018],  // [min, max] magnitude for rotation speeds (applied randomly +/-)
        initialDepthSpread: 16,        // R value for Z distribution
        initialHorizontalSpreadFactor: 1.8, // Multiplier for viewport width
        initialVerticalSpreadFactor: 1.1,   // Multiplier for viewport height
        resetBoundaryOffset: 2,       // How far below viewport edge to reset
        resetVerticalSpread: 3,        // Randomness added to Y when resetting
        ...physicsConfig // Override defaults with passed config
    }), [physicsConfig]);


    // --- Memoized Hook for Particle Data ---
    const particles = useMemo(() => {
        // console.log(`Generating ${count} particle data instances...`); // Less verbose logging
        if (!geometry || !colorPalette || colorPalette.length === 0) {
            console.warn("Cannot generate particles: Missing geometry or colorPalette.");
            return [];
        }
        const temp = [];
        const initialViewportWidth = 20;
        const initialViewportHeight = 10;
        const R = config.initialDepthSpread;

        for (let i = 0; i < count; i++) {
            const x = (Math.random() - 0.5) * initialViewportWidth * config.initialHorizontalSpreadFactor;
            const y = (Math.random() - 0.5) * initialViewportHeight * config.initialVerticalSpreadFactor;
            const z = (Math.random() - 0.5) * R * 1.2;

            const rx = Math.random() * Math.PI;
            const ry = Math.random() * Math.PI * 2;
            const rz = Math.random() * Math.PI;

            const baseScale = config.scaleRange[0];
            const scaleRange = config.scaleRange[1] - config.scaleRange[0];
            const scale = baseScale + Math.random() * scaleRange;

            const baseSpeed = config.fallSpeedRange[0];
            const speedRange = config.fallSpeedRange[1] - config.fallSpeedRange[0];
            const speedFactor = baseSpeed + Math.random() * speedRange;
            const factorY = 0.35 + Math.random() * 0.25;

            const baseSway = config.swayFactorRange[0];
            const swayRange = config.swayFactorRange[1] - config.swayFactorRange[0];
            const swayFactorX = (Math.random() - 0.5) * 2 * (baseSway + Math.random() * swayRange);

            const baseRot = config.rotSpeedRange[0];
            const rotRange = config.rotSpeedRange[1] - config.rotSpeedRange[0];
            const rotMagnitude = baseRot + Math.random() * rotRange;
            const rotSpeedX = (Math.random() - 0.5) * 2 * rotMagnitude;
            const rotSpeedY = (Math.random() - 0.5) * 2 * rotMagnitude * 0.8;
            const rotSpeedZ = (Math.random() - 0.5) * 2 * rotMagnitude;

            const baseColor = colorPalette[Math.floor(Math.random() * colorPalette.length)].clone();
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
    }, [count, geometry, colorPalette, config]);


    // --- Effect for Initial Instance Setup ---
    useEffect(() => {
        const mesh = meshRef.current; // Get mesh from ref
        if (!mesh || !particles || particles.length === 0 || !geometry) {
             // console.log("Skipping instance setup: Missing elements."); // Less verbose
            return;
        }
        // console.log(`Running Initial Instance Setup for ${count} items...`); // Less verbose

        // --- FIX IS HERE ---
        // Get the attribute directly without TypeScript assertion
        let colorAttribute = geometry.getAttribute('color');
        // --- END FIX ---

        const colorArray = new Float32Array(count * 3);

        // Check if the attribute exists and has the correct properties.
        // If not, create it.
        if (
            !colorAttribute ||
            !(colorAttribute instanceof THREE.InstancedBufferAttribute) || // Ensure it's the right type
            colorAttribute.itemSize !== 3 ||
            colorAttribute.count !== count // Check if count matches current prop
        ) {
            // console.log("Creating/Replacing color attribute");
            colorAttribute = new THREE.InstancedBufferAttribute(colorArray, 3);
            colorAttribute.setUsage(THREE.DynamicDrawUsage);
            geometry.setAttribute('color', colorAttribute);
        } else {
            // console.log("Reusing existing color attribute structure");
            // If reusing, ensure the underlying Float32Array buffer is large enough
            // (This check might be redundant if count check above is strict, but safer)
            if (colorAttribute.array.length < count * 3) {
                 console.warn("Color attribute array too small. Recreating.");
                 colorAttribute = new THREE.InstancedBufferAttribute(colorArray, 3);
                 colorAttribute.setUsage(THREE.DynamicDrawUsage);
                 geometry.setAttribute('color', colorAttribute);
            }
        }


        for (let i = 0; i < count; i++) {
            if (!particles[i]) continue;
            const p = particles[i];

            tempObject.position.copy(p.initialPosition);
            tempObject.rotation.copy(p.initialRotation);
            tempObject.scale.setScalar(p.scale);
            tempObject.updateMatrix();
            mesh.setMatrixAt(i, tempObject.matrix);

            p.initialColor.toArray(colorArray, i * 3);
        }

        // Copy data from the temporary array to the attribute's array
        // Note: We always create colorArray locally, so we need to set it.
        colorAttribute.array.set(colorArray);

        // Mark buffers for update
        mesh.instanceMatrix.needsUpdate = true;
        colorAttribute.needsUpdate = true;

        // Ensure the InstancedMesh knows how many instances to render
        mesh.count = count;

        // console.log("Initial instance setup complete."); // Less verbose

    }, [particles, count, geometry]); // Rerun setup if particle data, count, or geometry changes


    // --- Animation Loop ---
    useFrame((state, delta) => {
        const mesh = meshRef.current;
        if (!mesh || !mesh.instanceMatrix || !particles || particles.length === 0 || mesh.count === 0) return;

        const time = state.clock.elapsedTime;
        const { viewport } = state;
        const topEdge = viewport.height / 2;
        const bottomEdge = -topEdge;
        const boundaryY = bottomEdge - config.resetBoundaryOffset;
        const currentViewportWidth = viewport.width;

        let matrixNeedsUpdate = false;
        const currentCount = mesh.count; // Use the mesh's current count for the loop limit

        for (let i = 0; i < currentCount; i++) { // Iterate up to mesh.count
            if (!particles[i]) continue; // Still check particle data exists
            const p = particles[i];

            mesh.getMatrixAt(i, tempObject.matrix);
            tempObject.matrix.decompose(tempObject.position, tempObject.quaternion, tempObject.scale);

            const dt = Math.min(delta, 0.1);
            const fallSpeed = p.factorY * p.speedFactor * 60 * dt;
            const swaySpeed = Math.sin(time * 0.4 + i * 0.6) * p.swayFactorX * p.speedFactor * 30 * dt;

            tempObject.position.y -= fallSpeed;
            tempObject.position.x += swaySpeed;

            tempObject.rotation.setFromQuaternion(tempObject.quaternion);
            tempObject.rotation.x += p.rotSpeedX * 60 * dt;
            tempObject.rotation.y += p.rotSpeedY * 60 * dt;
            tempObject.rotation.z += p.rotSpeedZ * 60 * dt;
            tempObject.quaternion.setFromEuler(tempObject.rotation);

            if (tempObject.position.y < boundaryY) {
                tempObject.position.y = topEdge + 1 + Math.random() * config.resetVerticalSpread;
                tempObject.position.x = (Math.random() - 0.5) * currentViewportWidth * (config.initialHorizontalSpreadFactor * 0.9);
                tempObject.position.z = (Math.random() - 0.5) * config.initialDepthSpread;

                 tempObject.quaternion.slerp(new THREE.Quaternion().setFromEuler(new THREE.Euler(
                     Math.random() * Math.PI * 0.5,
                     Math.random() * Math.PI * 2,
                     Math.random() * Math.PI * 0.5
                 )), 0.1);
            }

            tempObject.updateMatrix();
            mesh.setMatrixAt(i, tempObject.matrix);
            matrixNeedsUpdate = true;
        }

        if (matrixNeedsUpdate) {
            mesh.instanceMatrix.needsUpdate = true;
        }
    });

    // --- Render ---
    if (!geometry || count === 0) return null;

    return (
        <instancedMesh
            // Using key helps React reset state if geometry changes fundamentally,
            // though the useEffect handles count/geometry changes internally too.
            // Can be useful if the *type* of geometry changes.
            key={geometry.uuid}
            ref={meshRef}
            args={[geometry, undefined, count]} // Set initial count hint
            frustumCulled={false}
        >
            <meshBasicMaterial
                vertexColors={true}
                side={THREE.DoubleSide}
                transparent={true}
                opacity={0.95}
                depthWrite={false}
                alphaTest={0.05}
            />
        </instancedMesh>
    );
});

export default InstancedFallingItems;