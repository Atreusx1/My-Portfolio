import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

// --- Optimization: Reusable THREE Objects ---
// Define these outside the component scope to avoid recreation per render.
const tempObject = new THREE.Object3D();       // For matrix calculations per instance
const tempColor = new THREE.Color();          // For initial color setup / manipulation
const tempEuler = new THREE.Euler();          // For reading/manipulating rotation
const tempQuaternion = new THREE.Quaternion();  // For reading/applying rotation
const tempScale = new THREE.Vector3();        // For reading scale if needed
const tempPosition = new THREE.Vector3();     // For reading position

// --- Configuration Constants ---
const FOG_PARTICLE_BASE_SIZE = 1.5;          // Base size of fog particles before random scaling
const FOG_PARTICLE_SIZE_VARIATION = 1.8;     // How much the size can vary randomly
const FOG_COUNT_DEFAULT = 800;               // Default number of fog particles
const FOG_SPREAD_X = 35;                     // Horizontal spread range (width)
const FOG_SPREAD_Y = 8;                      // Vertical spread range (height) - smaller for ground fog feel
const FOG_SPREAD_Z = 35;                     // Depth spread range
const FOG_BASE_OPACITY = 0.15;               // Material base opacity (can be subtle)
const FOG_COLOR_BASE = new THREE.Color("#d0d5d9"); // Slightly off-white/grey base
const FOG_COLOR_VARIATION = 0.08;            // How much color can vary R,G,B individually

// --- Function to create a soft particle texture (CanvasTexture) ---
const createFogTexture = () => {
    const size = 128; // Texture resolution
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = size;
    const context = canvas.getContext('2d');
    if (!context) {
        console.error("Failed to get 2D context for fog texture");
        return null; // Return null if context fails
    }

    const centerX = size / 2;
    const centerY = size / 2;
    const radius = size / 2;

    // Create a radial gradient: soft white center, fading to transparent
    const gradient = context.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)'); // Center alpha
    gradient.addColorStop(0.3, 'rgba(255, 255, 255, 0.3)'); // Mid alpha
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');    // Edge alpha

    context.fillStyle = gradient;
    context.fillRect(0, 0, size, size);

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true; // Ensure texture uploads
    console.log("Fog Texture Created");
    return texture;
};


// --- Optimization: Memoized Hook for Fog Particle Geometry ---
// Uses simple PlaneGeometry suitable for sprite-like particles.
const useFogGeometry = () => {
    return useMemo(() => {
        // Low segment count is sufficient for billboard-like particles
        const geometry = new THREE.PlaneGeometry(1, 1);
        // No need to center PlaneGeometry if using Object3D for positioning
        console.log("Fog Particle Geometry Created");
        return geometry;
    }, []); // Empty dependency array ensures it runs only once
};

// --- Optimization: Memoized Hook for Fog Particle Material ---
// Creates the material with the soft texture once.
const useFogMaterial = () => {
    return useMemo(() => {
        const fogTexture = createFogTexture();
        if (!fogTexture) {
            // Fallback if texture creation failed
            console.warn("Using fallback BasicMaterial due to texture creation failure.");
             return new THREE.MeshBasicMaterial({
                color: FOG_COLOR_BASE,
                transparent: true,
                opacity: FOG_BASE_OPACITY * 0.5, // Lower opacity for fallback
                depthWrite: false,
                blending: THREE.NormalBlending, // Or AdditiveBlending for brighter fog
            });
        }

        const material = new THREE.MeshBasicMaterial({
            map: fogTexture,
            color: 0xffffff,          // Start with white, tint with vertex colors
            vertexColors: true,       // Enable per-instance color tinting
            transparent: true,
            opacity: FOG_BASE_OPACITY,
            depthWrite: false,        // Crucial for transparency layering
            blending: THREE.NormalBlending, // NormalBlending is standard, AdditiveBlending for ethereal glow
            side: THREE.DoubleSide,   // Render both sides in case planes rotate
        });
        console.log("Fog Particle Material Created");
        return material;
    }, []); // Empty dependency array ensures it runs only once
};

// --- Fog Component Wrapped in React.memo ---
// Prevents re-renders if props (like `count`) haven't changed significantly.
const FogVolume = React.memo(({ count = FOG_COUNT_DEFAULT }) => {
    const meshRef = useRef();
    const { viewport, size } = useThree(); // Access viewport for boundary checks

    // Get memoized geometry and material
    const fogGeometry = useFogGeometry();
    const fogMaterial = useFogMaterial();

    // --- Optimization: Internal Memoization for Initial Particle Data ---
    // Recalculates only when count or initial dimensions change.
    const particles = useMemo(() => {
        console.log(`Generating ${count} Particle Data Sets...`);
        const tempParticles = [];

        // Use initial size/viewport as fallback before first frame if needed
        const initialViewportWidth = size.width > 0 ? (size.width / (size.height / viewport.height)) : FOG_SPREAD_X;
        const initialViewportHeight = size.height > 0 ? viewport.height : FOG_SPREAD_Y * 2;

        // Calculate spread based on constants or viewport, whichever is larger initially
        const spreadX = Math.max(FOG_SPREAD_X, initialViewportWidth * 0.8);
        const spreadY = FOG_SPREAD_Y; // Keep Y spread relatively constant unless needed
        const spreadZ = FOG_SPREAD_Z;

        for (let i = 0; i < count; i++) {
            // Initial Position (spread out in the defined volume)
            const x = (Math.random() - 0.5) * spreadX;
            // Bias Y towards the lower end for ground fog, but allow some height
            const y = (Math.random() - 0.8) * spreadY;
            const z = (Math.random() - 0.5) * spreadZ;

            // Initial Rotation (random orientation for the planes)
            const rx = Math.random() * Math.PI * 2;
            const ry = Math.random() * Math.PI * 2;
            const rz = Math.random() * Math.PI * 2;

            // Scale (size of the fog particle)
            const scale = FOG_PARTICLE_BASE_SIZE + Math.random() * FOG_PARTICLE_SIZE_VARIATION;

            // Movement Factors (determining speed and drift)
            // Slow base speed, can be positive or negative for up/down drift
            const speedFactor = (0.01 + Math.random() * 0.02) * (Math.random() < 0.3 ? -1 : 1);
            // Horizontal sway/drift speed and range
            const swayFactorX = (Math.random() - 0.5) * 0.1;
            // Depth sway/drift speed and range
            const swayFactorZ = (Math.random() - 0.5) * 0.1;
            // Time offset for desynchronizing sine wave movement
            const timeOffsetX = Math.random() * 100;
            const timeOffsetZ = Math.random() * 100;

            // Rotation Speed (slow random tumbling)
            const rotSpeedX = (Math.random() - 0.5) * 0.005;
            const rotSpeedY = (Math.random() - 0.5) * 0.005;
            const rotSpeedZ = (Math.random() - 0.5) * 0.005;

            // Initial Color (subtle variations around the base fog color)
            // Use tempColor safely by cloning the base or direct manipulation
            const baseColor = FOG_COLOR_BASE.clone();
            baseColor.r += (Math.random() - 0.5) * FOG_COLOR_VARIATION;
            baseColor.g += (Math.random() - 0.5) * FOG_COLOR_VARIATION;
            baseColor.b += (Math.random() - 0.5) * FOG_COLOR_VARIATION;
            // Clamp color values to valid range [0, 1]
            baseColor.r = Math.max(0, Math.min(1, baseColor.r));
            baseColor.g = Math.max(0, Math.min(1, baseColor.g));
            baseColor.b = Math.max(0, Math.min(1, baseColor.b));

            tempParticles.push({
                initialPosition: new THREE.Vector3(x, y, z),
                initialRotation: new THREE.Euler(rx, ry, rz),
                scale,
                speedFactor, // Includes direction (+/-)
                swayFactorX,
                swayFactorZ,
                timeOffsetX,
                timeOffsetZ,
                rotSpeedX,
                rotSpeedY,
                rotSpeedZ,
                initialColor: baseColor,
                // Store initial spread for boundary checks if needed, or derive from constants
                spreadX, spreadY, spreadZ
            });
        }
        return tempParticles;
    // --- Optimization: Correct useEffect/useMemo Dependencies ---
    // Rerun if count changes or initial viewport/size suggests recalculation needed.
    }, [count, viewport.height, size.width, size.height]);


    // --- Optimization: Setup Effect for Initial Instance State ---
    // Runs once after mount or when particle data/geometry changes.
    useEffect(() => {
        // Guard clauses for safety
        if (!meshRef.current || !particles || particles.length === 0 || !fogGeometry) {
            console.log("Fog setup skipped: Missing refs, particles, or geometry.");
            return;
        }
        console.log("Running Initial Fog Instance Setup Effect...");

        const mesh = meshRef.current;

        // --- Optimization: Efficient Buffer Updates (Initial Setup) ---
        // Prepare the color buffer attribute.
        const colorArray = new Float32Array(count * 3); // Allocate buffer size

        // Check if the attribute already exists (e.g., due to HMR)
        let colorAttribute = mesh.geometry.getAttribute('color'); // Try to get existing

        if (!colorAttribute || colorAttribute.array.length !== colorArray.length) {
            if(colorAttribute) {
                 console.warn("Color attribute size mismatch or missing. Recreating.");
            } else {
                console.log("Creating new color attribute for fog instances.");
            }
            // Create or recreate the attribute and add it to the *base* geometry.
            // This is essential for InstancedMesh to recognize it.
            colorAttribute = new THREE.InstancedBufferAttribute(colorArray, 3);
            fogGeometry.setAttribute('color', colorAttribute);
        } else {
             console.log("Updating existing fog color attribute array.");
        }

        // Loop through particle data to set initial state for each instance
        for (let i = 0; i < count; i++) {
             if (!particles[i]) continue; // Safety check for sparse arrays if count changes weirdly
            const p = particles[i];

            // Set initial matrix using the reusable tempObject
            tempObject.position.copy(p.initialPosition);
            tempObject.rotation.copy(p.initialRotation);
            // Note: Applying scale to Object3D affects the matrix directly
            tempObject.scale.setScalar(p.scale); // Use setScalar for uniform scaling
            tempObject.updateMatrix(); // Calculate the transformation matrix

            // Apply the calculated matrix to the instance
            mesh.setMatrixAt(i, tempObject.matrix);

            // Set initial color into the local colorArray buffer
            p.initialColor.toArray(colorArray, i * 3);
        }

        // --- Optimization: Efficient Buffer Updates (.needsUpdate) ---
        // Copy the local colorArray data to the actual buffer attribute's array
        colorAttribute.array.set(colorArray);

        // Mark buffers for GPU upload *once* after all initial values are set.
        mesh.instanceMatrix.needsUpdate = true;
        colorAttribute.needsUpdate = true; // Mark color buffer for update

        console.log("Initial fog setup complete.");

    // Dependencies: Rerun if particle data structure, count, or geometry changes.
    }, [particles, count, fogGeometry]);


    // --- Optimization: Resource Disposal Effect ---
    // Cleans up GPU resources when the component unmounts.
    useEffect(() => {
        // This cleanup function runs when the component unmounts
        return () => {
            console.log("Disposing Fog Resources...");
            if (fogGeometry) {
                console.log("Disposing Fog Geometry");
                fogGeometry.dispose();
            }
            if (fogMaterial) {
                 console.log("Disposing Fog Material");
                 // Dispose texture if it exists on the material
                 if (fogMaterial.map && fogMaterial.map.dispose) {
                    console.log("Disposing Fog Texture");
                    fogMaterial.map.dispose();
                 }
                fogMaterial.dispose();
            }
        };
    }, [fogGeometry, fogMaterial]); // Dependencies ensure cleanup targets the correct resources


    // --- Optimization: Animation Loop (useFrame) ---
    // Updates particle positions and rotations each frame.
    useFrame((state, delta) => {
        // --- Optimization: Cache Lookups & Early Exit ---
        const mesh = meshRef.current;
        if (!mesh || !mesh.instanceMatrix || !particles || particles.length === 0) {
            return; // Exit if mesh or particle data isn't ready
        }

        const time = state.clock.elapsedTime;
        // Define boundaries based on the initial spread constants.
        // Could also use current viewport for dynamic resizing, but constant spread is simpler.
        const halfSpreadX = FOG_SPREAD_X / 2;
        const halfSpreadZ = FOG_SPREAD_Z / 2;
        // Define vertical boundaries (e.g., keep fog generally low)
        const topBoundary = FOG_SPREAD_Y * 0.5; // Upper limit
        const bottomBoundary = -FOG_SPREAD_Y * 1.5; // Lower limit (allows going slightly below initial spread)

        // --- Optimization: Efficient Buffer Updates (.needsUpdate Flag) ---
        // Track if any matrix actually changed this frame.
        let matrixNeedsUpdate = false;

        for (let i = 0; i < count; i++) {
            if (!particles[i]) continue; // Safety check
            const p = particles[i];

            // --- Get Current State ---
            // Get the current matrix of the instance without creating a new Matrix4
            mesh.getMatrixAt(i, tempObject.matrix);
            // Decompose the matrix to get current position, rotation (quaternion), and scale
            // This is necessary to apply incremental updates based on particle properties.
            tempObject.matrix.decompose(tempPosition, tempQuaternion, tempScale);

            // --- Update Position (using tempPosition) ---
            // Apply delta for frame-rate independence (scaled by 60 for intuitive speed values)
            const effectiveDelta = delta * 60;

            // Vertical Drift (can be up or down based on speedFactor sign)
            tempPosition.y += p.speedFactor * effectiveDelta * 0.1; // Slow vertical movement

            // Horizontal & Depth Drift (using sine waves for smooth oscillation)
            tempPosition.x += Math.sin(time * 0.1 + p.timeOffsetX) * p.swayFactorX * effectiveDelta;
            tempPosition.z += Math.cos(time * 0.1 + p.timeOffsetZ) * p.swayFactorZ * effectiveDelta;


            // --- Update Rotation (using tempQuaternion via Euler for ease) ---
            // Convert quaternion to Euler for easier incremental rotation
            tempEuler.setFromQuaternion(tempQuaternion);

            // Apply slow rotation speeds
            tempEuler.x += p.rotSpeedX * effectiveDelta;
            tempEuler.y += p.rotSpeedY * effectiveDelta;
            tempEuler.z += p.rotSpeedZ * effectiveDelta;

            // Convert back to quaternion for matrix composition
            tempQuaternion.setFromEuler(tempEuler);


            // --- Boundary Check and Reset/Wrap ---
            // If particle goes too far out, reset its position to the opposite side or randomly within bounds.
            let needsReset = false;
            if (tempPosition.y < bottomBoundary || tempPosition.y > topBoundary) {
                // Reset Y to the opposite boundary or a random position within vertical range
                tempPosition.y = (p.speedFactor > 0) ? bottomBoundary + Math.random() : topBoundary - Math.random(); // Appear at opposite edge
                 // tempPosition.y = (Math.random() - 0.8) * FOG_SPREAD_Y; // Reset randomly
                needsReset = true;
            }
             if (tempPosition.x < -halfSpreadX || tempPosition.x > halfSpreadX) {
                 tempPosition.x = Math.sign(tempPosition.x) * -halfSpreadX * (0.9 + Math.random() * 0.1); // Wrap around X
                 needsReset = true;
             }
             if (tempPosition.z < -halfSpreadZ || tempPosition.z > halfSpreadZ) {
                 tempPosition.z = Math.sign(tempPosition.z) * -halfSpreadZ * (0.9 + Math.random() * 0.1); // Wrap around Z
                 needsReset = true;
             }

             // Optional: If reset, could also slightly randomize rotation or speed again
             if (needsReset) {
                 // Example: Give it a slightly new rotation drift
                 // tempEuler.set(Math.random()*PI2, Math.random()*PI2, Math.random()*PI2);
                 // tempQuaternion.setFromEuler(tempEuler);
             }


            // --- Update Matrix ---
            // Recompose the matrix from the updated position, quaternion, and *original* scale
            tempObject.matrix.compose(tempPosition, tempQuaternion, tempScale);
            // Set the updated matrix back into the InstancedMesh buffer
            mesh.setMatrixAt(i, tempObject.matrix);

            // Mark that at least one matrix has changed
            matrixNeedsUpdate = true;
        }

        // --- Optimization: Efficient Buffer Updates (.needsUpdate) ---
        // Set needsUpdate = true *only once* per frame, *after* the loop,
        // and *only if* any matrix actually changed. Avoids redundant GPU uploads.
        if (matrixNeedsUpdate) {
            mesh.instanceMatrix.needsUpdate = true;
        }

        // Colors are static in this example (set only during init), so no need to update color buffer per frame.
    });

    // --- Render the InstancedMesh ---
    return (
        <instancedMesh
            ref={meshRef}
            // Provide geometry, material, and count directly as args
            args={[fogGeometry, fogMaterial, count]}
            // Consider adding a key if `count` can change dynamically, helps React manage lifecycle.
            // key={count}
        >
            {/* Geometry and Material are passed via args, no need for children here */}
            {/* Unless you wanted to override material properties dynamically, */}
            {/* but it's generally cleaner to manage the material via the ref or useMemo */}
        </instancedMesh>
    );
}); // End of React.memo wrap

// --- How to Use (Example in Parent) ---
/*
import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
// import FogVolume from './FogVolume'; // Assuming FogVolume is in this file or imported

function Scene() {
  return (
    <Canvas camera={{ position: [0, 2, 20], fov: 50 }}>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 15, 10]} intensity={0.8} />

      <Suspense fallback={null}> // Use Suspense if fog component might load asynchronously
        <FogVolume count={1000} /> // Adjust count as needed
      </Suspense>

      // ... other scene elements (ground plane, objects, etc.)
      <mesh position={[0, -5, 0]}> // Example ground plane
         <planeGeometry args={[50, 50]} />
         <meshStandardMaterial color="gray" />
      </mesh>
    </Canvas>
  );
}
*/

export default FogVolume; // Export the component