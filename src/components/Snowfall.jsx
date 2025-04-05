// snowfall.jsx
import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

// --- Optimization: Reusable THREE Objects ---
// Define these outside the component scope to avoid recreation.
const tempObject = new THREE.Object3D(); // Used for matrix calculations
const tempColor = new THREE.Color();   // Used for initial color setup

// --- Optimization: Memoized Hook for Snowflake Geometry ---
// Use useMemo to create the geometry only once.
const useSnowflakeGeometry = () => {
    return useMemo(() => {
        console.log("Creating Snowflake Geometry");
        // Low-poly sphere is efficient
        const geometry = new THREE.SphereGeometry(0.025, 6, 6);
        // SphereGeometry is already centered
        return geometry;
    }, []); // Empty dependency array means it runs only once
};

// --- Snowflake Colors (Unchanged) ---
const snowflakeColors = [
  new THREE.Color("#FFFFFF"),
  new THREE.Color("#f0f8ff"),
  new THREE.Color("#e6faff"),
  new THREE.Color("#ffffff"),
];

// --- Optimization: Wrap Component in React.memo ---
// Prevents re-renders if props (like `count`) haven't changed.
const Snowfall = React.memo(({ count = 500 }) => {
    const meshRef = useRef();
    const { viewport, size } = useThree();
    const snowflakeGeometry = useSnowflakeGeometry(); // Use the memoized geometry

    // --- Optimization: Internal Memoization for Initial Particle Data ---
    // Calculate particle properties only when dependencies change.
    const particles = useMemo(() => {
        console.log("Generating Particle Data (Snow)...");
        const temp = [];
        const R = 18; // Depth spread
        // Use size for potentially more stable initial values
        const initialViewportWidth = size.width > 0 ? (size.width / (size.height / viewport.height)) : 20;
        const initialViewportHeight = size.height > 0 ? viewport.height : 10;

        for (let i = 0; i < count; i++) {
            const x = (Math.random() - 0.5) * initialViewportWidth * 1.8;
            const y = (Math.random() - 0.5) * initialViewportHeight * 1.2;
            const z = (Math.random() - 0.5) * R;

            const rx = Math.random() * Math.PI;
            const ry = Math.random() * Math.PI * 2;
            const rz = Math.random() * Math.PI;

            const scale = 0.8 + Math.random() * 0.7;
            const factorY = 0.15 + Math.random() * 0.15; // Slower fall
            const speedFactor = 0.008 + Math.random() * 0.006; // Slower speed
            const swayFactorX = (Math.random() - 0.5) * 0.6; // Gentler sway
            const rotSpeedX = (Math.random() - 0.5) * 0.006; // Slower tumble
            const rotSpeedY = (Math.random() - 0.5) * 0.008;
            const rotSpeedZ = (Math.random() - 0.5) * 0.006;

            // Use tempColor safely via .clone()
            const baseColor = snowflakeColors[Math.floor(Math.random() * snowflakeColors.length)].clone();
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
    // --- Optimization: Correct useEffect/useMemo Dependencies ---
    // Add viewport.width as horizontal spread depends on it.
    // Size ensures recalc if container size changes affecting initial viewport guess.
    }, [count, viewport.height, viewport.width, size.width, size.height]);


    // --- Optimization: Correct useEffect Dependencies & Setup ---
    // This effect sets up the initial state of the instances.
    useEffect(() => {
        // Guard clauses
        if (!meshRef.current || !particles || particles.length === 0 || !snowflakeGeometry) {
            console.log("Snow Setup skipped: Missing refs, particles, or geometry");
            return;
        }
        console.log("Running Initial Instance Setup Effect (Snow)...");

        const mesh = meshRef.current;

        // --- Optimization: Efficient Buffer Updates (Initial Setup) ---
        // Ensure color attribute exists on the *base* geometry.
        let colorAttribute = snowflakeGeometry.getAttribute('color');
        const requiredSize = count * 3;

        // Check if attribute exists and has the correct size
        if (!colorAttribute || colorAttribute.array.length !== requiredSize) {
            console.log("Creating/Resizing color attribute for snowflakes");
            // Create/replace attribute on the shared geometry
            colorAttribute = new THREE.InstancedBufferAttribute(new Float32Array(requiredSize), 3);
            snowflakeGeometry.setAttribute('color', colorAttribute);
        } else {
             console.log("Using existing color attribute for snowflakes");
        }

        // Temporary local array for color data
        const localColorArray = new Float32Array(requiredSize);

        for (let i = 0; i < count; i++) {
             if (!particles[i]) continue; // Safety check
            const p = particles[i];

            // Set initial matrix using reusable tempObject
            tempObject.position.copy(p.initialPosition);
            tempObject.rotation.copy(p.initialRotation);
            tempObject.scale.setScalar(p.scale); // Use setScalar for uniform scale
            tempObject.updateMatrix(); // Calculate matrix
            mesh.setMatrixAt(i, tempObject.matrix); // Set matrix for instance i

            // Set initial color into the *local* array using tempColor
            tempColor.copy(p.initialColor);
            tempColor.toArray(localColorArray, i * 3);
        }

        // --- Optimization: Efficient Buffer Updates (.needsUpdate) ---
        // Copy data from local array to the buffer attribute's array
        colorAttribute.array.set(localColorArray);

        // Mark buffers for GPU upload *once* after initial values are set.
        mesh.instanceMatrix.needsUpdate = true;
        colorAttribute.needsUpdate = true; // Mark color buffer for update

        console.log("Snow initial setup complete.");

    // Dependencies: Rerun if particle data, count, or geometry changes.
    // Size/Viewport deps are handled via `particles` dependency.
    }, [particles, count, snowflakeGeometry]);


    // --- Optimization: Resource Disposal ---
    // Use useEffect cleanup to dispose of geometry when the component unmounts.
    useEffect(() => {
        return () => {
            if (snowflakeGeometry) {
                console.log("Disposing Snowflake Geometry");
                snowflakeGeometry.dispose();
            }
        };
    }, [snowflakeGeometry]); // Run cleanup when geometry instance changes (on unmount)


    // --- Optimization: Animation Loop (useFrame) ---
    useFrame((state, delta) => {
        // --- Optimization: Cache Lookups ---
        const mesh = meshRef.current;
        // Early exit if not ready
        if (!mesh?.instanceMatrix || !particles || particles.length === 0) {
             // console.warn("Snowfall: Missing mesh, matrix or particles. Skipping frame.");
            return;
        }

        const time = state.clock.elapsedTime;
        const currentViewport = state.viewport; // Use current viewport for dynamic resize handling
        const topEdge = currentViewport.height / 2;
        const bottomEdge = -topEdge;
        const currentViewportWidth = currentViewport.width;
        const boundaryY = bottomEdge - 2; // Reset boundary

        // --- Optimization: Efficient Buffer Updates (.needsUpdate Flag) ---
        let matrixNeedsUpdate = false;

        // --- Particle Update Loop ---
        for (let i = 0; i < count; i++) {
            if (!particles[i]) continue; // Safety
            const p = particles[i];

            // Get current matrix (reusing tempObject)
            mesh.getMatrixAt(i, tempObject.matrix);
            // Decompose is necessary for position/rotation updates
            tempObject.matrix.decompose(tempObject.position, tempObject.quaternion, tempObject.scale);

            // --- Update Position (using tempObject.position) ---
            // Apply delta for frame rate independence
            const fallSpeed = p.factorY * p.speedFactor * 60 * delta;
            const swaySpeed = Math.sin(time * 0.2 + i * 0.5) * p.swayFactorX * p.speedFactor * 30 * delta;

            tempObject.position.y -= fallSpeed;
            tempObject.position.x += swaySpeed;

            // --- Update Rotation (using tempObject.quaternion via Euler) ---
            tempObject.rotation.setFromQuaternion(tempObject.quaternion); // Get current rotation as Euler
            tempObject.rotation.x += p.rotSpeedX * 60 * delta;
            tempObject.rotation.y += p.rotSpeedY * 60 * delta;
            tempObject.rotation.z += p.rotSpeedZ * 60 * delta;
            tempObject.quaternion.setFromEuler(tempObject.rotation); // Convert back to Quaternion

            // --- Boundary Check and Reset ---
            if (tempObject.position.y < boundaryY) {
                // Reset position above the top edge
                tempObject.position.y = topEdge + 1 + Math.random() * 3;
                tempObject.position.x = (Math.random() - 0.5) * currentViewportWidth * 1.6;
                tempObject.position.z = (Math.random() - 0.5) * 16; // Use depth range from particle generation

                // Optional: Reset rotation slightly if desired
                // tempObject.rotation.set(Math.random() * Math.PI * 0.1, Math.random() * Math.PI * 2, Math.random() * Math.PI * 0.1);
                // tempObject.quaternion.setFromEuler(tempObject.rotation);
            }

            // --- Update Matrix ---
            // Recompose matrix from updated pos/quat/scale (scale is unchanged)
            tempObject.updateMatrix();
            mesh.setMatrixAt(i, tempObject.matrix);
            matrixNeedsUpdate = true; // Matrix changed
        } // End particle loop

        // --- Optimization: Efficient Buffer Updates (.needsUpdate) ---
        // Set needsUpdate flag *once* after the loop, only if needed.
        if (matrixNeedsUpdate) {
            mesh.instanceMatrix.needsUpdate = true;
        }

        // Colors are not updated per frame in this example.
    }); // End useFrame

    // --- Render the InstancedMesh ---
    return (
        <instancedMesh
            ref={meshRef}
            // Provide geometry and count directly as args
            args={[snowflakeGeometry, undefined, count]} // Material is child
            key={count} // Optional: helps React if count changes drastically
            // Frustum culling is default true and usually beneficial
            // frustumCulled={true}
        >
            {/* Define material as a child */}
            <meshBasicMaterial
                vertexColors={true}      // Use instance colors
                transparent={true}       // Enable transparency
                opacity={0.85}           // Snow opacity
                depthWrite={false}       // Good for multiple transparent layers
            />
        </instancedMesh>
    );
}); // End of React.memo wrap

// --- Optimization: Lazy Loading (How to Use) ---
// In the parent component where you use <Snowfall />:
/*
import React, { Suspense, lazy } from 'react';
const LazySnowfall = lazy(() => import('./components/Snowfall')); // Adjust path

function WeatherScene() {
  return (
    <Suspense fallback={null}> // Show nothing or a loader while loading
      <LazySnowfall count={600} />
    </Suspense>
    // ... other scene elements
  );
}
*/

export default Snowfall;