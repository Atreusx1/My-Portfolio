// src/components/Rainfall.jsx
import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

// --- Optimization: Reusable THREE Objects ---
// Define these outside the component scope to avoid recreation.
const tempObject = new THREE.Object3D(); // Used for matrix calculations
const tempVec3 = new THREE.Vector3();   // Used for vector math (e.g., wind lerp, rotation calc)
const tempEuler = new THREE.Euler();    // Used for calculating rotation from vector
const tempColor = new THREE.Color();    // Used for setting initial colors

// --- Optimization: Memoized Hook for Raindrop Geometry ---
// Use useMemo to create the geometry only once.
const useRaindropGeometry = () => {
    return useMemo(() => {
        console.log("Creating Raindrop Geometry");
        const topRadius = 0.0015;
        const bottomRadius = 0.004;
        const height = 0.35;
        const radialSegments = 4; // Keep low poly
        const geometry = new THREE.CylinderGeometry(topRadius, bottomRadius, height, radialSegments);
        geometry.translate(0, -height / 3, 0); // Position pivot point
        return geometry;
    }, []); // Empty dependency array means it runs only once
};

// --- Rain Colors (Unchanged from your version) ---
const raindropColors = [
    new THREE.Color("#c8d1e0").multiplyScalar(0.9),
    new THREE.Color("#d2dae6").multiplyScalar(0.9),
    new THREE.Color("#bcc7d7").multiplyScalar(0.9),
    new THREE.Color("#d8e0ea").multiplyScalar(0.9),
];

// --- Optimization: Wrap Component in React.memo ---
// Prevents re-renders if props haven't changed.
const Rainfall = React.memo(({
    count = 700,
    windStrength = 0.05,
    areaWidth = 40,
    areaHeight = 30,
    areaDepth = 30,
    baseSpeed = 0.8,
    fogNear = 18,
    fogFar = 45,
    opacity = 0.55
}) => {
    const meshRef = useRef();
    const { camera } = useThree(); // Get camera for distance calcs
    const raindropGeometry = useRaindropGeometry(); // Use the memoized geometry

    // These don't strictly need useRef unless mutated outside React lifecycle,
    // but it's fine here.
    const rainAreaCenter = useRef(new THREE.Vector3(0, areaHeight / 2, 0));
    const windEffect = useRef({
        direction: new THREE.Vector2(0.1, 0), // Initial wind direction
        strength: windStrength, // Use prop for initial strength
        noiseTime: Math.random() * 100,
    });

    // Update wind strength if prop changes
    useEffect(() => {
        windEffect.current.strength = windStrength;
    }, [windStrength]);

    // --- Optimization: Internal Memoization for Initial Particle Data ---
    // Calculate particle properties only when dependencies change.
    const particles = useMemo(() => {
        console.log("Generating Particle Data...");
        const temp = [];
        const halfWidth = areaWidth / 2;
        const halfDepth = areaDepth / 2;
        const center = rainAreaCenter.current; // Read current center

        for (let i = 0; i < count; i++) {
            const x = (Math.random() - 0.5) * areaWidth + center.x;
            const y = Math.random() * areaHeight + center.y - areaHeight / 2;
            const z = (Math.random() - 0.5) * areaDepth + center.z;

            const rx = Math.PI; // Initial rotation (pointing down)
            const ry = 0;
            const rz = 0;

            const scale = 0.4 + Math.random() * 0.5;
            const dropLengthFactor = 0.8 + Math.random() * 0.4;
            const speedFactor = baseSpeed * (0.8 + Math.random() * 0.4);
            const depthRatio = THREE.MathUtils.inverseLerp(center.z - halfDepth, center.z + halfDepth, z);
            const depthSpeedFactor = 0.8 + depthRatio * 0.4;
            const windInfluence = (1.0 - scale) * (0.8 + Math.random() * 0.4);
            const wobbleFactor = 0.005 + Math.random() * 0.01;
            const phase = Math.random() * Math.PI * 2;

            // Use tempColor safely via .clone() or direct manipulation if sure
            const baseColor = raindropColors[Math.floor(Math.random() * raindropColors.length)].clone();
            const alphaFactor = 0.7 + Math.random() * 0.3;

            temp.push({
                initialPosition: new THREE.Vector3(x, y, z),
                initialRotation: new THREE.Euler(rx, ry, rz),
                scale,
                dropLengthFactor,
                speedFactor,
                depthSpeedFactor,
                windInfluence,
                wobbleFactor,
                phase,
                baseColor,
                alphaFactor,
                initialZ: z // Keep initial Z if needed, though position gets updated
            });
        }
        return temp;
    // --- Optimization: Correct useEffect/useMemo Dependencies ---
    }, [count, areaWidth, areaHeight, areaDepth, baseSpeed]); // Added relevant props

    // --- Optimization: Correct useEffect Dependencies & Setup ---
    // This effect sets up the initial state of the instances.
    useEffect(() => {
        // Guard clauses
        if (!meshRef.current || !particles || particles.length === 0 || !raindropGeometry) {
            console.log("Rain Setup skipped: Missing refs, particles, or geometry");
            return;
        }
        console.log("Running Initial Instance Setup Effect (Rain)...");

        const mesh = meshRef.current;

        // --- Optimization: Efficient Buffer Updates (Initial Setup) ---
        // Ensure color attribute exists on the *base* geometry.
        let colorAttribute = raindropGeometry.getAttribute('color');
        const requiredSize = count * 3;

        // Check if attribute exists and has the correct size
        if (!colorAttribute || colorAttribute.array.length !== requiredSize) {
            console.log("Creating/Resizing color attribute for raindrops");
            // If it doesn't exist or size is wrong, create/replace it
            // Important: Add/Set the attribute on the *shared* geometry.
            colorAttribute = new THREE.InstancedBufferAttribute(new Float32Array(requiredSize), 3);
            raindropGeometry.setAttribute('color', colorAttribute);
        } else {
            console.log("Using existing color attribute for raindrops");
        }

        // Create a temporary local array to hold the color data before copying
        const localColorArray = new Float32Array(requiredSize);

        for (let i = 0; i < count; i++) {
             if (!particles[i]) continue; // Safety check
            const p = particles[i];

            // Set initial matrix using the reusable tempObject
            tempObject.position.copy(p.initialPosition);
            tempObject.rotation.copy(p.initialRotation);
            tempObject.scale.set(p.scale, p.scale * p.dropLengthFactor, p.scale); // Apply length factor
            tempObject.updateMatrix(); // Calculate matrix
            mesh.setMatrixAt(i, tempObject.matrix); // Set matrix for instance i

            // Set initial color into the *local* array using tempColor
            tempColor.copy(p.baseColor); // Use reusable color object
            tempColor.toArray(localColorArray, i * 3);
        }

        // --- Optimization: Efficient Buffer Updates (.needsUpdate) ---
        // Copy the data from the local array to the buffer attribute's array
        colorAttribute.array.set(localColorArray);

        // Mark buffers for GPU upload *once* after all initial values are set.
        mesh.instanceMatrix.needsUpdate = true;
        colorAttribute.needsUpdate = true; // Mark color buffer for update

        console.log("Rain initial setup complete.");

    // Dependencies: Rerun if particle data, count, or the geometry itself changes.
    }, [particles, count, raindropGeometry]);


    // --- Optimization: Resource Disposal ---
    // Use useEffect cleanup to dispose of geometry when the component unmounts.
    useEffect(() => {
        return () => {
            if (raindropGeometry) {
                console.log("Disposing Raindrop Geometry");
                raindropGeometry.dispose();
            }
        };
    }, [raindropGeometry]); // Run cleanup when geometry instance changes (effectively on unmount)


    // --- Optimization: Animation Loop (useFrame) ---
    useFrame((state, delta) => {
        // --- Optimization: Cache Lookups ---
        const mesh = meshRef.current;
        // Early exit if essential components aren't ready
        if (!mesh?.instanceMatrix || !mesh.geometry?.attributes?.color || !particles || particles.length === 0) {
            return;
        }

        const time = state.clock.elapsedTime;
        const camPos = camera.position; // Cache camera position
        const colorAttribute = mesh.geometry.attributes.color; // Cache color attribute
        const colorArray = colorAttribute.array; // Cache color array

        // --- Wind Update (using reusable tempVec3) ---
        windEffect.current.noiseTime += delta * 0.1;
        // Simpler noise function for example, replace with yours if preferred
        const noiseX = Math.sin(windEffect.current.noiseTime * 0.8) * 0.5 + Math.sin(windEffect.current.noiseTime * 1.3) * 0.5;
        const noiseZ = Math.cos(windEffect.current.noiseTime * 0.6) * 0.5 + Math.cos(windEffect.current.noiseTime * 1.1) * 0.5;

        const targetWindX = noiseX * windEffect.current.strength;
        const targetWindZ = noiseZ * windEffect.current.strength * 0.3; // Z wind weaker

        // Lerp towards target wind direction using tempVec3
        windEffect.current.direction.lerp(tempVec3.set(targetWindX, targetWindZ, 0), delta * 0.5); // Use tempVec3 for target
        const windX = windEffect.current.direction.x;
        const windZ = windEffect.current.direction.y; // Note: direction.y stores Z wind component

        // --- World Boundaries (Read from refs/props) ---
        const center = rainAreaCenter.current;
        const worldYTop = center.y + areaHeight / 2;
        const worldYBottom = center.y - areaHeight / 2 - 5; // Reset boundary slightly lower
        const worldXMin = center.x - areaWidth / 2;
        const worldZMin = center.z - areaDepth / 2;

        // --- Optimization: Efficient Buffer Updates (.needsUpdate Flag) ---
        // Track if buffers need updating. They almost always will here due to movement and fading.
        let matrixNeedsUpdate = false;
        let colorNeedsUpdate = false;

        // --- Particle Update Loop ---
        for (let i = 0; i < count; i++) {
            if (!particles[i]) continue; // Safety
            const p = particles[i];

            // Get current matrix (reusing tempObject)
            mesh.getMatrixAt(i, tempObject.matrix);
            // Decompose is necessary for position/rotation updates and distance checks
            tempObject.matrix.decompose(tempObject.position, tempObject.quaternion, tempObject.scale);

            // --- Update Position (using tempObject.position & reusable tempVec3) ---
            const fallSpeed = p.speedFactor * p.depthSpeedFactor * 60 * delta;
            const windForceX = windX * p.windInfluence * 40 * delta;
            const windForceZ = windZ * p.windInfluence * 40 * delta;

            tempObject.position.y -= fallSpeed;
            tempObject.position.x += windForceX;
            tempObject.position.z += windForceZ;

            // Wobble (minor)
            tempObject.position.x += Math.sin(time * 1.5 + p.phase) * p.wobbleFactor;
            tempObject.position.z += Math.cos(time * 1.5 + p.phase) * p.wobbleFactor * 0.5;

            // --- Update Rotation (using tempEuler, tempVec3, tempObject.quaternion) ---
            // Calculate direction vector (reusing tempVec3)
            tempVec3.set(windForceX, -fallSpeed, windForceZ).normalize();
            // Calculate rotation angles based on direction
            // Avoid division by zero or instability near vertical using atan2
            const angleX = Math.atan2(tempVec3.z, -tempVec3.y); // Angle around X axis (causes pitch from Z wind) - Negate Y for correct direction
            const angleZ = Math.atan2(tempVec3.x, -tempVec3.y); // Angle around Z axis (causes roll from X wind) - Negate Y for correct direction

            // Apply rotation (reusing tempEuler) - Apply angles scaled, adjust as needed
            // Original rotation was PI on X, so we adjust from there. Using ZYX order might be intuitive here.
            tempEuler.set(Math.PI + angleX * 0.3, 0, angleZ * 0.8, 'ZYX'); // Try ZYX, adjust multipliers
            tempObject.quaternion.setFromEuler(tempEuler);

            // --- Distance Fading (Fog) ---
            const distanceZ = Math.abs(tempObject.position.z - camPos.z);
            // Smoothstep maps distance between fogNear/Far to 0-1 range
            const fadeFactor = THREE.MathUtils.smoothstep(distanceZ, fogNear, fogFar);
            // Apply fading based on particle's alpha and distance fade
            const effectiveBrightness = (1.0 - fadeFactor * 0.5) * p.alphaFactor; // Adjust dimming (0.5 here)

            // Update color buffer directly (reusing tempColor is possible but direct array access is fine)
            colorArray[i * 3] = p.baseColor.r * effectiveBrightness;
            colorArray[i * 3 + 1] = p.baseColor.g * effectiveBrightness;
            colorArray[i * 3 + 2] = p.baseColor.b * effectiveBrightness;
            colorNeedsUpdate = true; // Color changed

             // --- Boundary Check and Reset ---
             if (tempObject.position.y < worldYBottom) {
                 // Reset position (consider wind displacement for respawn)
                 tempObject.position.y = worldYTop + Math.random() * 5;
                 tempObject.position.x = worldXMin + Math.random() * areaWidth - windX * 5; // Offset by recent wind
                 tempObject.position.z = worldZMin + Math.random() * areaDepth - windZ * 5; // Offset by recent wind

                 // Optional: Reset rotation slightly towards current wind direction
                 // tempVec3.set(windX, -p.speedFactor, windZ).normalize();
                 // const resetAngleX = Math.atan2(tempVec3.z, -tempVec3.y);
                 // const resetAngleZ = Math.atan2(tempVec3.x, -tempVec3.y);
                 // tempEuler.set(Math.PI + resetAngleX * 0.3, 0, resetAngleZ * 0.8, 'ZYX');
                 // tempObject.quaternion.setFromEuler(tempEuler);
             }

            // --- Update Matrix ---
            // Recompose matrix from updated pos/quat/scale (scale is unchanged here)
            tempObject.updateMatrix();
            mesh.setMatrixAt(i, tempObject.matrix);
            matrixNeedsUpdate = true; // Matrix changed
        } // End particle loop

        // --- Optimization: Efficient Buffer Updates (.needsUpdate) ---
        // Set needsUpdate flags *once* after the loop, only if needed.
        if (matrixNeedsUpdate) {
            mesh.instanceMatrix.needsUpdate = true;
        }
        if (colorNeedsUpdate) {
            // We already cached colorAttribute, no need for mesh.geometry.attributes check
            colorAttribute.needsUpdate = true;
        }

    }); // End useFrame

    // --- Render the InstancedMesh ---
    return (
        <instancedMesh
            ref={meshRef}
            // Provide geometry and count directly as args
            args={[raindropGeometry, undefined, count]} // Material is child
            key={count} // Optional: Helps React if count changes drastically
            // Frustum culling is generally good for performance
            frustumCulled={true}
        >
            {/* Define material as a child */}
            <meshBasicMaterial
                vertexColors={true}      // Use instance colors
                transparent={true}       // Enable transparency
                opacity={opacity}        // Use prop for opacity
                depthWrite={false}       // Often helps with transparency sorting
                // Blending mode can affect appearance, NormalBlending is default
                blending={THREE.NormalBlending}
            />
        </instancedMesh>
    );
}); // End of React.memo wrap

// --- Optimization: Lazy Loading (How to Use) ---
// In the parent component where you use <Rainfall />:
/*
import React, { Suspense, lazy } from 'react';
const LazyRainfall = lazy(() => import('./components/Rainfall')); // Adjust path

function Scene() {
  return (
    <Suspense fallback={null}> // Show nothing or a loader while loading
      <LazyRainfall count={700} windStrength={0.06} />
    </Suspense>
    // ... other scene elements
  );
}
*/

export default Rainfall;