import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// --- Optimization: Reuse THREE Objects ---
// Define temporary objects *outside* the component scope to avoid reallocation.
const tempObject = new THREE.Object3D();
const tempColor = new THREE.Color(); // Reusable for color calculations if needed
const tempVec3 = new THREE.Vector3(); // Reusable vector if needed
const tempEuler = new THREE.Euler(); // Reusable Euler if needed
const tempQuat = new THREE.Quaternion(); // Reusable Quaternion if needed
const resetQuat = new THREE.Quaternion(); // For resetting rotation


// --- Optimization: React Memoization ---
// Wrap component definition with React.memo
const InstancedFallingItems = React.memo(({
    count = 100,
    geometry, // REQUIRED: Pass the geometry to instance
    colorPalette, // REQUIRED: Pass an array of THREE.Color objects
    physicsConfig = {} // Optional: Pass custom physics ranges
}) => {
    const meshRef = useRef(); // Ref to the instanced mesh

    // --- Default Physics (useMemo applied correctly) ---
    // --- Optimization: Internal Memoization (already done correctly) ---
    const config = useMemo(() => ({
        scaleRange: [0.08, 0.14],
        fallSpeedRange: [0.009, 0.015],
        swayFactorRange: [0.5, 1.0],
        rotSpeedRange: [0.008, 0.018],
        initialDepthSpread: 16,
        initialHorizontalSpreadFactor: 1.8,
        initialVerticalSpreadFactor: 1.1,
        resetBoundaryOffset: 2,
        resetVerticalSpread: 3,
        ...physicsConfig
    }), [physicsConfig]); // Dependency array is correct


    // --- Memoized Hook for Particle Data (useMemo applied correctly) ---
    // --- Optimization: Internal Memoization (already done correctly) ---
    const particles = useMemo(() => {
        // console.log(`Generating ${count} particle data instances...`);
        if (!geometry || !colorPalette || colorPalette.length === 0) {
            console.warn("Cannot generate particles: Missing geometry or colorPalette.");
            return [];
        }
        const temp = [];
        // Use static values for initial spread calculation, viewport changes handled in useFrame
        const initialViewportWidth = 20;
        const initialViewportHeight = 10;
        const R = config.initialDepthSpread;

        for (let i = 0; i < count; i++) {
            const x = (Math.random() - 0.5) * initialViewportWidth * config.initialHorizontalSpreadFactor;
            // Adjust initial Y slightly higher to account for potential initial fall
            const y = (Math.random()) * initialViewportHeight * config.initialVerticalSpreadFactor + initialViewportHeight * 0.1;
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
            const factorY = 0.35 + Math.random() * 0.25; // Keep original variation

            const baseSway = config.swayFactorRange[0];
            const swayRange = config.swayFactorRange[1] - config.swayFactorRange[0];
            const swayFactorX = (Math.random() - 0.5) * 2 * (baseSway + Math.random() * swayRange);

            const baseRot = config.rotSpeedRange[0];
            const rotRange = config.rotSpeedRange[1] - config.rotSpeedRange[0];
            const rotMagnitude = baseRot + Math.random() * rotRange;
            const rotSpeedX = (Math.random() - 0.5) * 2 * rotMagnitude;
            const rotSpeedY = (Math.random() - 0.5) * 2 * rotMagnitude * 0.8;
            const rotSpeedZ = (Math.random() - 0.5) * 2 * rotMagnitude;

            // Use reusable tempColor for modifications
            tempColor.copy(colorPalette[Math.floor(Math.random() * colorPalette.length)]);
            tempColor.r += (Math.random() - 0.5) * 0.08;
            tempColor.g += (Math.random() - 0.5) * 0.08;
            tempColor.b += (Math.random() - 0.5) * 0.08;
            tempColor.r = Math.max(0, Math.min(1, tempColor.r));
            tempColor.g = Math.max(0, Math.min(1, tempColor.g));
            tempColor.b = Math.max(0, Math.min(1, tempColor.b));

            temp.push({
                // Store initial values, not THREE objects unless absolutely necessary
                initialPosX: x, initialPosY: y, initialPosZ: z,
                initialRotX: rx, initialRotY: ry, initialRotZ: rz,
                scale,
                factorY,
                speedFactor,
                swayFactorX,
                rotSpeedX,
                rotSpeedY,
                rotSpeedZ,
                // Store the final calculated color components
                colorR: tempColor.r, colorG: tempColor.g, colorB: tempColor.b,
            });
        }
        return temp;
    }, [count, geometry, colorPalette, config]); // Dependencies are correct


    // --- Effect for Initial Instance Setup ---
    // --- Optimization: Correct useEffect Dependencies (already correct) ---
    useEffect(() => {
        const mesh = meshRef.current;
        if (!mesh || !particles || particles.length === 0 || !geometry) {
            // console.log("Skipping instance setup: Missing elements.");
             // Ensure mesh count is 0 if we bail early
             if(mesh) mesh.count = 0;
            return;
        }
        // console.log(`Running Initial Instance Setup for ${count} items...`);

        // Color Attribute Handling (Robustness check)
        let colorAttribute = mesh.geometry.getAttribute('color'); // Check on mesh's geometry instance
        const requiredColorArrayLength = count * 3;
        let needsColorAttributeUpdate = false;

        // Check if attribute exists, is Instanced, is vec3, and has correct count/buffer size
        if (
            !colorAttribute ||
            !(colorAttribute instanceof THREE.InstancedBufferAttribute) ||
            colorAttribute.itemSize !== 3 ||
            colorAttribute.count !== count ||
            colorAttribute.array.length < requiredColorArrayLength // Buffer needs to be large enough
        ) {
            // console.log("Creating/Replacing color attribute");
            const colorArray = new Float32Array(requiredColorArrayLength);
            colorAttribute = new THREE.InstancedBufferAttribute(colorArray, 3);
            colorAttribute.setUsage(THREE.DynamicDrawUsage); // Use DynamicDrawUsage for potential future updates
            mesh.geometry.setAttribute('color', colorAttribute); // Set on the mesh's geometry instance
        } else {
             // console.log("Reusing existing color attribute structure");
        }

        // Get the actual array to write to
        const colorBufferArray = colorAttribute.array;

        // Set initial matrices and colors
        for (let i = 0; i < count; i++) {
            if (!particles[i]) continue;
            const p = particles[i];

            // Use temporary objects for calculation
            tempVec3.set(p.initialPosX, p.initialPosY, p.initialPosZ);
            tempEuler.set(p.initialRotX, p.initialRotY, p.initialRotZ);
            tempQuat.setFromEuler(tempEuler);
            tempObject.position.copy(tempVec3);
            tempObject.quaternion.copy(tempQuat);
            tempObject.scale.setScalar(p.scale);
            tempObject.updateMatrix();
            mesh.setMatrixAt(i, tempObject.matrix);

            // Set color directly into the buffer array
            colorBufferArray[i * 3 + 0] = p.colorR;
            colorBufferArray[i * 3 + 1] = p.colorG;
            colorBufferArray[i * 3 + 2] = p.colorB;
            needsColorAttributeUpdate = true; // Mark that color data was written
        }

        // --- Optimization: Efficient Buffer Updates (needsUpdate) ---
        // Mark buffers for update *once* after the loop
        mesh.instanceMatrix.needsUpdate = true;
        if (needsColorAttributeUpdate) {
            colorAttribute.needsUpdate = true;
        }

        // Ensure the InstancedMesh knows how many instances to render
        // This is crucial if the count changes
        mesh.count = count;

        // console.log("Initial instance setup complete.");

    }, [particles, count, geometry]); // Rerun setup if particle data, count, or geometry changes


    // --- Animation Loop ---
    useFrame((state, delta) => {
        // --- Optimization: Cache Lookups ---
        // Get mesh ref *once* per frame
        const mesh = meshRef.current;

        // Early exit if mesh or essential data is not ready
        if (!mesh || !mesh.instanceMatrix || !particles || particles.length === 0 || mesh.count !== count) {
            // If count mismatches, setup effect hasn't finished or props changed rapidly.
            // Avoid running animation logic on potentially incorrect instance count.
             // console.warn("useFrame skipped: Mesh not ready or count mismatch.");
             return;
        }

        const time = state.clock.elapsedTime;
        const { viewport } = state; // Get current viewport info
        const topEdge = viewport.height / 2;
        const bottomEdge = -topEdge;
        const boundaryY = bottomEdge - config.resetBoundaryOffset;
        const currentViewportWidth = viewport.width;

        // --- Optimization: Efficient Buffer Updates (needsUpdate) ---
        // Flag to track if any matrix actually changed
        let matrixNeedsUpdate = false;

        // Clamp delta to avoid instability on frame drops/lag spikes
        const dt = Math.min(delta, 0.1); // Adjust max delta if needed

        const currentCount = mesh.count; // Use the mesh's current count

        // --- Optimization: Minimize Work in Loop ---
        // Loop through existing instances
        for (let i = 0; i < currentCount; i++) {
            // Get particle data (already optimized by useMemo)
            const p = particles[i];
            if (!p) continue; // Should not happen if particles array is correct, but safety check

            // --- Optimization: Reuse THREE Objects ---
            // Get current matrix of the instance
            mesh.getMatrixAt(i, tempObject.matrix);

            // --- Optimization: Avoid Unnecessary Decompositions ---
            // Decompose matrix only if needed components aren't already tracked.
            // Here we need position and rotation, so decompose is appropriate.
            tempObject.matrix.decompose(tempObject.position, tempObject.quaternion, tempObject.scale);

            // Calculate updates using cached particle properties and reused objects
            const fallSpeed = p.factorY * p.speedFactor * 60 * dt; // Scale by dt
            const swaySpeed = Math.sin(time * 0.4 + i * 0.6) * p.swayFactorX * p.speedFactor * 30 * dt; // Scale by dt

            tempObject.position.y -= fallSpeed;
            tempObject.position.x += swaySpeed;

            // Apply rotation update (using temporary Euler/Quat is slightly cleaner)
            tempEuler.setFromQuaternion(tempObject.quaternion, 'XYZ'); // Get current rotation
            tempEuler.x += p.rotSpeedX * 60 * dt; // Scale by dt
            tempEuler.y += p.rotSpeedY * 60 * dt; // Scale by dt
            tempEuler.z += p.rotSpeedZ * 60 * dt; // Scale by dt
            tempObject.quaternion.setFromEuler(tempEuler); // Update quaternion

            // Reset particle if it goes below the boundary
            if (tempObject.position.y < boundaryY) {
                tempObject.position.y = topEdge + 1 + Math.random() * config.resetVerticalSpread;
                // Reset X based on *current* viewport width
                tempObject.position.x = (Math.random() - 0.5) * currentViewportWidth * (config.initialHorizontalSpreadFactor * 0.9);
                tempObject.position.z = (Math.random() - 0.5) * config.initialDepthSpread; // Keep Z spread consistent

                // Reset rotation smoothly (optional: slerp towards a random rotation)
                resetQuat.setFromEuler(tempEuler.set(
                     Math.random() * Math.PI * 0.5,
                     Math.random() * Math.PI * 2,
                     Math.random() * Math.PI * 0.5
                ));
                // Slightly randomize rotation on reset instead of instant snap
                tempObject.quaternion.slerp(resetQuat, 0.1);
            }

            // Recompose matrix after updates
            tempObject.updateMatrix();

            // Update the instance matrix in the InstancedMesh buffer
            mesh.setMatrixAt(i, tempObject.matrix);

            // Mark that *at least one* matrix has been updated
            matrixNeedsUpdate = true;
        }

        // --- Optimization: Efficient Buffer Updates (needsUpdate) ---
        // Set needsUpdate = true *only once* per frame, *after* the loop,
        // and *only if* any matrices were actually updated.
        if (matrixNeedsUpdate) {
            mesh.instanceMatrix.needsUpdate = true;
        }
        // Note: We are not updating color per frame, so colorAttribute.needsUpdate = false here.
    });

    // --- Render ---
    // Ensure geometry is valid and count is positive before rendering
    if (!geometry || count <= 0) return null;

    return (
        <instancedMesh
            // --- Optimization: React Memoization & Keys ---
            // Key helps React efficiently update/replace if geometry type changes.
            key={geometry.uuid}
            ref={meshRef}
            // Set initial count hint, but useEffect manages the actual count later
            args={[geometry, undefined, count]}
            // Frustum culling might hide particles unexpectedly if they span large areas
            frustumCulled={false}
        >
            {/* Material properties affect appearance, keep as is */}
            <meshBasicMaterial
                vertexColors={true} // Use the instanced 'color' attribute
                side={THREE.DoubleSide} // Render both sides of the leaf
                transparent={true}
                opacity={0.95}
                depthWrite={false} // Often improves blending for transparent objects
                alphaTest={0.05} // Discard pixels below this alpha threshold (helps with leaf edges)
                // No need to dispose basic materials unless they use textures
            />
        </instancedMesh>
    );
});

// Set display name for better debugging in React DevTools
InstancedFallingItems.displayName = 'InstancedFallingItems';

export default InstancedFallingItems;