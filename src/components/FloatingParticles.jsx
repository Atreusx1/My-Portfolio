import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

// --- Optimization: Reusable THREE Objects ---
// Define these outside the component scope to avoid recreation.
const tempObject = new THREE.Object3D(); // Used for matrix calculations
const tempColor = new THREE.Color();   // Used for initial color setup
// Reusable Quaternion and Euler for rotation updates if needed,
// but tempObject internal ones are often sufficient.
// const tempQuaternion = new THREE.Quaternion();
// const tempEuler = new THREE.Euler();

// --- Function to create a Sakura Petal Shape (Unchanged) ---
const createSakuraPetalShape = () => {
    const shape = new THREE.Shape();
    const length = 1.0; const width = 0.6;
    shape.moveTo(0, -length * 0.5);
    shape.bezierCurveTo(-width * 0.6, -length * 0.3, -width * 0.9, length * 0.1, -width * 0.15, length * 0.45);
    shape.quadraticCurveTo(0, length*0.48, width * 0.15, length * 0.45);
    shape.bezierCurveTo(width * 0.9, length * 0.1, width * 0.6, -length * 0.3, 0, -length * 0.5);
    return shape;
};

// --- Optimization: Memoized Hook for Petal Geometry ---
// Use useMemo to create the geometry only once.
const usePetalGeometry = () => {
    return useMemo(() => {
        const petalShape = createSakuraPetalShape();
        // Use ShapeGeometry - ExtrudeGeometry adds unnecessary complexity if thickness isn't required.
        const geometry = new THREE.ShapeGeometry(petalShape);
        geometry.center(); // Center the geometry
        // Note: Initial rotations here affect the *base* geometry shared by all instances.
        // Instance-specific initial rotation is handled separately.
        // geometry.rotateX(Math.PI * 0.05 + Math.random() * 0.1); // Keep random rotation per-instance if desired
        // geometry.rotateY(Math.random() * Math.PI * 2);
        // geometry.rotateZ(Math.random() * 0.1 - 0.05);
        console.log("Petal Geometry Created"); // Log geometry creation
        return geometry;
    }, []); // Empty dependency array means it runs only once
};

// --- Sakura Colors (Unchanged) ---
const sakuraColors = [
  new THREE.Color("#F4B3C2"), new THREE.Color("#E992A9"),
  new THREE.Color("#DB7F98"), new THREE.Color("#D88BA1"),
  new THREE.Color("#C87287"), new THREE.Color("#BF6B7E"),
  new THREE.Color("#E37F95"), new THREE.Color("#CA6679"),
];


// --- Optimization: Wrap Component in React.memo ---
// Prevents re-renders if props (like `count`) haven't changed.
const FloatingParticles = React.memo(({ count = 250 }) => {
    const meshRef = useRef();
    const { viewport, size } = useThree();
    const petalGeometry = usePetalGeometry(); // Use the memoized geometry

    // --- Optimization: Internal Memoization for Initial Particle Data ---
    // Calculate particle properties only when count or initial dimensions change.
    const particles = useMemo(() => {
        console.log("Generating Particle Data...");
        const temp = [];
        const R = 16; // Depth spread range
        // Use size for potentially more stable initial values before first frame's viewport calculation
        const initialViewportWidth = size.width > 0 ? (size.width / (size.height / viewport.height)) : 20;
        const initialViewportHeight = size.height > 0 ? viewport.height : 10;

        for (let i = 0; i < count; i++) {
            const x = (Math.random() - 0.5) * initialViewportWidth * 1.8;
            const y = (Math.random() - 0.5) * initialViewportHeight * 1.1;
            const z = (Math.random() - 0.5) * R * 1.2;

            const rx = Math.random() * Math.PI;
            const ry = Math.random() * Math.PI * 2;
            const rz = Math.random() * Math.PI;

            const scale = 0.08 + Math.random() * 0.06;
            const factorY = 0.35 + Math.random() * 0.25;
            const speedFactor = 0.009 + Math.random() * 0.006;
            const swayFactorX = (Math.random() - 0.5) * 0.7;
            const rotSpeedX = (Math.random() - 0.5) * 0.015;
            const rotSpeedY = (Math.random() - 0.5) * 0.012;
            const rotSpeedZ = (Math.random() - 0.5) * 0.015;

            // Use tempColor safely via .clone() or direct manipulation if sure
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
    // --- Optimization: Correct useEffect/useMemo Dependencies ---
    // Ensure this runs only when these specific values change.
    }, [count, viewport.height, size.width, size.height]);

    // --- Optimization: Correct useEffect Dependencies & Setup ---
    // This effect sets up the initial state of the instances.
    useEffect(() => {
        // Guard clauses
        if (!meshRef.current || !particles || particles.length === 0 || !petalGeometry) {
            console.log("Setup skipped: Missing refs, particles, or geometry");
            return;
        }
        console.log("Running Initial Instance Setup Effect...");

        const mesh = meshRef.current;

        // --- Optimization: Efficient Buffer Updates (Initial Setup) ---
        // Create color buffer once. Use InstancedBufferAttribute.
        // Check if the attribute already exists (e.g., due to HMR or complex scenarios)
        let colorAttribute = mesh.geometry.getAttribute('color'); // Try to get existing
        const colorArray = new Float32Array(count * 3); // Allocate buffer size

        if (!colorAttribute) {
            console.log("Creating new color attribute");
            // If it doesn't exist, create it and add it to the *base* geometry
            colorAttribute = new THREE.InstancedBufferAttribute(colorArray, 3);
            // Important: Add the attribute to the *shared* geometry so InstancedMesh knows about it.
            petalGeometry.setAttribute('color', colorAttribute);
        } else {
             console.log("Updating existing color attribute array");
             // If it exists, ensure our array matches its size (should if count hasn't changed)
             // And re-use the existing attribute, just updating its array content.
             if (colorAttribute.array.length !== colorArray.length) {
                 console.warn("Color attribute size mismatch. Recreating attribute.");
                 // Handle potential size mismatch (e.g., if count changed)
                 colorAttribute = new THREE.InstancedBufferAttribute(colorArray, 3);
                 petalGeometry.setAttribute('color', colorAttribute);
             } else {
                 // Use the existing attribute's array directly for filling
                 // colorArray = colorAttribute.array; // NOTE: This line is conceptually wrong, we need to fill our *new* array then copy it.
             }
        }

        for (let i = 0; i < count; i++) {
             if (!particles[i]) continue; // Safety check
            const p = particles[i];

            // Set initial matrix using the reusable tempObject
            tempObject.position.copy(p.initialPosition);
            tempObject.rotation.copy(p.initialRotation);
            tempObject.scale.setScalar(p.scale);
            tempObject.updateMatrix(); // Calculate matrix from pos/rot/scale
            mesh.setMatrixAt(i, tempObject.matrix); // Set matrix for instance i

            // Set initial color into the local array
            // Use the reusable tempColor object OR the particle's color object directly
            p.initialColor.toArray(colorArray, i * 3);
        }

        // Copy the data from the local colorArray to the buffer attribute's array
        colorAttribute.array.set(colorArray);

        // --- Optimization: Efficient Buffer Updates (.needsUpdate) ---
        // Mark buffers for GPU upload *once* after all initial values are set.
        mesh.instanceMatrix.needsUpdate = true;
        colorAttribute.needsUpdate = true; // Mark color buffer for update

        console.log("Initial setup complete.");

    // Dependencies: Rerun if particle data, count, or the geometry itself changes.
    // Size dependencies are implicitly handled via `particles` dependency.
    }, [particles, count, petalGeometry]); // Keep minimal dependencies


    // --- Optimization: Resource Disposal ---
    // Use useEffect cleanup to dispose of geometry when the component unmounts.
    useEffect(() => {
        // This function runs when the component unmounts
        return () => {
            if (petalGeometry) {
                console.log("Disposing Petal Geometry");
                petalGeometry.dispose();
            }
            // Basic materials usually don't need disposal unless they use textures.
            // If using ExtrudeGeometry, dispose that instead.
        };
    }, [petalGeometry]); // Run cleanup when petalGeometry instance changes (should only be on unmount)


    // --- Optimization: Animation Loop (useFrame) ---
    useFrame((state, delta) => {
        // --- Optimization: Cache Lookups ---
        const mesh = meshRef.current;
        if (!mesh || !mesh.instanceMatrix || !particles || particles.length === 0) return; // Early exit if not ready

        const time = state.clock.elapsedTime;
        const currentViewport = state.viewport; // Use current viewport for dynamic resize handling
        const topEdge = currentViewport.height / 2;
        const bottomEdge = -topEdge;
        const currentViewportWidth = currentViewport.width;
        const boundaryY = bottomEdge - 2; // Reset boundary

        // --- Optimization: Efficient Buffer Updates (.needsUpdate Flag) ---
        // Track if any matrix actually changed this frame.
        let matrixNeedsUpdate = false;

        for (let i = 0; i < count; i++) {
            if (!particles[i]) continue; // Safety check
            const p = particles[i];

            // Get current matrix (avoids creating new Matrix4)
            mesh.getMatrixAt(i, tempObject.matrix);

            // --- Optimization: Avoid Unnecessary Decompositions (if possible) ---
            // Decompose is necessary here because we need current position/rotation
            // to apply incremental updates based on particle properties.
            // Direct matrix manipulation is complex and usually not worth it unless
            // this is proven to be the absolute bottleneck.
            tempObject.matrix.decompose(tempObject.position, tempObject.quaternion, tempObject.scale);

            // --- Update Position (using tempObject.position) ---
            // Apply delta for frame rate independence
            const fallSpeed = p.factorY * p.speedFactor * 60 * delta;
            const swaySpeed = Math.sin(time * 0.3 + i * 0.5) * p.swayFactorX * p.speedFactor * 20 * delta;

            tempObject.position.y -= fallSpeed;
            tempObject.position.x += swaySpeed;

            // --- Update Rotation (using tempObject.quaternion via Euler) ---
            // Convert quaternion to Euler for incremental rotation (more intuitive)
            tempObject.rotation.setFromQuaternion(tempObject.quaternion);
            tempObject.rotation.x += p.rotSpeedX * 60 * delta;
            tempObject.rotation.y += p.rotSpeedY * 60 * delta;
            tempObject.rotation.z += p.rotSpeedZ * 60 * delta;
            // Convert back to quaternion for matrix composition
            tempObject.quaternion.setFromEuler(tempObject.rotation);

            // --- Boundary Check and Reset ---
            if (tempObject.position.y < boundaryY) {
                // Reset position above the top edge
                tempObject.position.y = topEdge + 1 + Math.random() * 3;
                tempObject.position.x = (Math.random() - 0.5) * currentViewportWidth * 1.6;
                tempObject.position.z = (Math.random() - 0.5) * 15;

                // Optionally reset rotation if they spin too wildly over long periods
                // tempObject.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI * 2, Math.random() * Math.PI);
                // tempObject.quaternion.setFromEuler(tempObject.rotation);
            }

            // --- Update Matrix ---
            // Recompose the matrix from updated pos/quat/scale (scale is unchanged)
            tempObject.updateMatrix();
            // Set the updated matrix for this instance
            mesh.setMatrixAt(i, tempObject.matrix);

            // Mark that at least one matrix has changed
            matrixNeedsUpdate = true;
        }

        // --- Optimization: Efficient Buffer Updates (.needsUpdate) ---
        // Set needsUpdate = true *only once* per frame, *after* the loop,
        // and *only if* any matrix actually changed.
        if (matrixNeedsUpdate) {
            mesh.instanceMatrix.needsUpdate = true;
        }

        // Colors are not updated per frame in this example, so no need to update color buffer.
        // if (colorNeedsUpdate) {
        //    mesh.geometry.attributes.color.needsUpdate = true;
        // }
    });

    // --- Render the InstancedMesh ---
    return (
        <instancedMesh
            ref={meshRef}
            // Provide geometry and count directly as args
            args={[petalGeometry, undefined, count]} // Material is child
            // Key prop can help React manage component lifecycle if count changes drastically,
            // but often not needed if setup effect handles count changes properly.
            // key={count}
        >
            {/* Define material as a child */}
            <meshBasicMaterial
                vertexColors={true}      // Enable instance colors
                side={THREE.DoubleSide}  // Render both sides
                transparent={true}
                opacity={0.9}
                depthWrite={false}     // Often helps with transparency sorting
            />
        </instancedMesh>
    );
}); // End of React.memo wrap

// --- Optimization: Lazy Loading (How to Use) ---
// In the parent component where you use <FloatingParticles />:
/*
import React, { Suspense, lazy } from 'react';
const LazyFloatingParticles = lazy(() => import('./FloatingParticles')); // Adjust path

function App() {
  return (
    <Canvas>
      <Suspense fallback={null}> // Show nothing or a loader while component loads
        <LazyFloatingParticles count={250} />
      </Suspense>
      // ... other scene elements
    </Canvas>
  );
}
*/

export default FloatingParticles;