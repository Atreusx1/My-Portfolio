// src/components/Rainfall.jsx
import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

// Reusable objects
const tempObject = new THREE.Object3D();
const tempVec3 = new THREE.Vector3();
const tempEuler = new THREE.Euler();

// --- Memoized Hook for Raindrop Geometry ---
const useRaindropGeometry = () => {
    return useMemo(() => {
        // Slightly larger dimensions for better visibility
        const topRadius = 0.0015;    // Increased
        const bottomRadius = 0.004; // Increased
        const height = 0.35;      // Slightly increased
        const radialSegments = 4;  // Keep low for performance
        const geometry = new THREE.CylinderGeometry(topRadius, bottomRadius, height, radialSegments);
        geometry.translate(0, -height / 3, 0); // Offset remains useful
        return geometry;
    }, []);
};

// --- Rain Colors (Slightly Brighter) ---
const raindropColors = [
    new THREE.Color("#c8d1e0").multiplyScalar(0.9), // Increased brightness scalar
    new THREE.Color("#d2dae6").multiplyScalar(0.9),
    new THREE.Color("#bcc7d7").multiplyScalar(0.9),
    new THREE.Color("#d8e0ea").multiplyScalar(0.9),
];

const Rainfall = ({
    count = 700, // Maybe slightly increase default count
    windStrength = 0.05,
    areaWidth = 40,
    areaHeight = 30,
    areaDepth = 30,
    baseSpeed = 0.8,
    fogNear = 18,     // Start fog slightly further away
    fogFar = 45,      // End fog slightly further away
    opacity = 0.55    // Increased default opacity significantly
}) => {
    const meshRef = useRef();
    const { camera } = useThree();
    const raindropGeometry = useRaindropGeometry(); // Use the updated geometry hook

    const rainAreaCenter = useRef(new THREE.Vector3(0, areaHeight / 2, 0));

    const windEffect = useRef({
        direction: new THREE.Vector2(0.1, 0),
        strength: windStrength,
        noiseTime: Math.random() * 100,
    });

    // --- Generate Initial Per-Instance Data ---
    const particles = useMemo(() => {
        const temp = [];
        const halfWidth = areaWidth / 2;
        const halfDepth = areaDepth / 2;
        const center = rainAreaCenter.current;

        for (let i = 0; i < count; i++) {
            const x = (Math.random() - 0.5) * areaWidth + center.x;
            const y = Math.random() * areaHeight + center.y - areaHeight / 2;
            const z = (Math.random() - 0.5) * areaDepth + center.z;

            const rx = Math.PI;
            const ry = 0;
            const rz = 0;

            // Slightly larger base scale, maintain variation
            const scale = 0.4 + Math.random() * 0.5; // Increased base scale slightly
            const dropLengthFactor = 0.8 + Math.random() * 0.4;

            const speedFactor = baseSpeed * (0.8 + Math.random() * 0.4);
            const depthRatio = THREE.MathUtils.inverseLerp(center.z - halfDepth, center.z + halfDepth, z);
            const depthSpeedFactor = 0.8 + depthRatio * 0.4;

            const windInfluence = (1.0 - scale) * (0.8 + Math.random() * 0.4);
            const wobbleFactor = 0.005 + Math.random() * 0.01;
            const phase = Math.random() * Math.PI * 2;

            const baseColor = raindropColors[Math.floor(Math.random() * raindropColors.length)].clone(); // Use brighter colors

            // Alpha factor remains, modulates brightness/fog
            const alphaFactor = 0.7 + Math.random() * 0.3; // Slightly higher base alpha factor

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
                initialZ: z
            });
        }
        return temp;
    }, [count, areaWidth, areaHeight, areaDepth, baseSpeed]);

    // --- Set Initial Transforms and Colors ---
    useEffect(() => {
        if (!meshRef.current || !particles || particles.length === 0 || !raindropGeometry) return;
        const mesh = meshRef.current;

        let colorAttribute = mesh.geometry.getAttribute('color');
        if (!colorAttribute || colorAttribute.count !== count) {
             colorAttribute = new THREE.InstancedBufferAttribute(new Float32Array(count * 3), 3);
             mesh.geometry.setAttribute('color', colorAttribute);
        }
        const colorArray = colorAttribute.array;

        particles.forEach((p, i) => {
            tempObject.position.copy(p.initialPosition);
            tempObject.rotation.copy(p.initialRotation);
            tempObject.scale.set(p.scale, p.scale * p.dropLengthFactor, p.scale);
            tempObject.updateMatrix();
            mesh.setMatrixAt(i, tempObject.matrix);
            p.baseColor.toArray(colorArray, i * 3);
        });

        mesh.instanceMatrix.needsUpdate = true;
        colorAttribute.needsUpdate = true;

    }, [particles, count, raindropGeometry]);

    // --- Animation Logic ---
    useFrame((state, delta) => {
        if (!meshRef.current?.instanceMatrix || !particles || particles.length === 0) return;
        const mesh = meshRef.current;
        if (!mesh.geometry.attributes.color) { // Guard clause
             // console.warn("Rainfall: Color attribute not found. Skipping frame.");
             return;
        }

        const time = state.clock.elapsedTime;
        const camPos = camera.position;
        const colorArray = mesh.geometry.attributes.color.array;

        // --- Update Wind --- (No changes needed here for visibility)
        windEffect.current.noiseTime += delta * 0.1;
        const noiseX = (Math.sin(windEffect.current.noiseTime * 0.5) + Math.sin(windEffect.current.noiseTime * 1.5)) * 0.5;
        const noiseZ = (Math.sin(windEffect.current.noiseTime * 0.7) + Math.sin(windEffect.current.noiseTime * 1.2)) * 0.5;
        const targetWindX = noiseX * windEffect.current.strength;
        const targetWindZ = noiseZ * windEffect.current.strength * 0.3;
        windEffect.current.direction.lerp(tempVec3.set(targetWindX, targetWindZ, 0), delta * 0.5);
        const windX = windEffect.current.direction.x;
        const windZ = windEffect.current.direction.y;

        // --- Define World Boundaries --- (No changes needed here)
        const center = rainAreaCenter.current;
        const worldYTop = center.y + areaHeight / 2;
        const worldYBottom = center.y - areaHeight / 2;
        const worldXMin = center.x - areaWidth / 2;
        const worldZMin = center.z - areaDepth / 2;

        // --- Particle Update Loop ---
        for (let i = 0; i < count; i++) {
            if (!particles[i]) continue;
            const p = particles[i];

            mesh.getMatrixAt(i, tempObject.matrix);
            tempObject.matrix.decompose(tempObject.position, tempObject.quaternion, tempObject.scale);

            // --- Update Position --- (No changes needed here)
            const fallSpeed = p.speedFactor * p.depthSpeedFactor * 60 * delta;
            tempObject.position.y -= fallSpeed;
            tempObject.position.x += windX * p.windInfluence * 40 * delta;
            tempObject.position.z += windZ * p.windInfluence * 40 * delta;
            tempObject.position.x += Math.sin(time * 1.5 + p.phase) * p.wobbleFactor;
            tempObject.position.z += Math.cos(time * 1.5 + p.phase) * p.wobbleFactor * 0.5;

            // --- Update Rotation --- (No changes needed here)
            tempVec3.set(
                windX * p.windInfluence * 40 * delta,
                -fallSpeed,
                windZ * p.windInfluence * 40 * delta
            ).normalize();
            const angleX = Math.atan2(tempVec3.x, -tempVec3.y);
            const angleZ = Math.atan2(tempVec3.z, -tempVec3.y);
            tempEuler.set(Math.PI - angleZ * 0.3, 0, angleX * 0.8, 'XYZ');
            tempObject.quaternion.setFromEuler(tempEuler);

            // --- Distance Fading (Fog) --- ADJUSTED ---
            const distanceZ = Math.abs(tempObject.position.z - camPos.z);
            const fadeFactor = THREE.MathUtils.smoothstep(distanceZ, fogNear, fogFar);
            // Reduced the dimming effect: fadeFactor * 0.5 instead of 0.7
            const effectiveBrightness = (1.0 - fadeFactor * 0.5) * p.alphaFactor;

            colorArray[i * 3] = p.baseColor.r * effectiveBrightness;
            colorArray[i * 3 + 1] = p.baseColor.g * effectiveBrightness;
            colorArray[i * 3 + 2] = p.baseColor.b * effectiveBrightness;

            // --- Boundary Check and Reset --- (No changes needed here)
             if (tempObject.position.y < worldYBottom - 5) {
                 tempObject.position.y = worldYTop + Math.random() * 5;
                 tempObject.position.x = worldXMin + Math.random() * areaWidth - windX * 5;
                 tempObject.position.z = worldZMin + Math.random() * areaDepth - windZ * 5;
                 // Optional rotation reset
                 // const resetAngleX = Math.atan2(windX, -1);
                 // const resetAngleZ = Math.atan2(windZ, -1);
                 // tempEuler.set(Math.PI - resetAngleZ * 0.3, 0, resetAngleX * 0.8, 'XYZ');
                 // tempObject.quaternion.setFromEuler(tempEuler);
             }

            // --- Update Matrix ---
            tempObject.updateMatrix();
            mesh.setMatrixAt(i, tempObject.matrix);
        } // End particle loop

        // --- Flag Instance Updates ---
        mesh.instanceMatrix.needsUpdate = true;
        if (mesh.geometry.attributes.color) { // Check attribute exists
             mesh.geometry.attributes.color.needsUpdate = true;
        }

    }); // End useFrame

    // Render the InstancedMesh
    return (
        <instancedMesh
            ref={meshRef}
            args={[raindropGeometry, undefined, count]}
            key={count}
            frustumCulled
        >
            <meshBasicMaterial
                vertexColors={true}
                transparent={true}
                opacity={opacity} // Use the updated default or passed prop
                depthWrite={false}
                blending={THREE.NormalBlending}
            />
        </instancedMesh>
    );
};

export default Rainfall;