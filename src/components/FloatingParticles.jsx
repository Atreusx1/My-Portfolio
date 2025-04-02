import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

// Create reusable objects outside the component
const tempObject = new THREE.Object3D();

// --- Function to create a Sakura Petal Shape matching anime style ---
const createSakuraPetalShape = () => {
    const shape = new THREE.Shape();
    const length = 1.0; const width = 0.62;
    shape.moveTo(0, -length * 0.5);
    shape.bezierCurveTo(-width * 0.7, -length * 0.3, -width, length * 0.3, -width * 0.2, length * 0.46);
    shape.lineTo(-width * 0.12, length * 0.42); shape.lineTo(0, length * 0.5);
    shape.lineTo(width * 0.12, length * 0.42); shape.lineTo(width * 0.2, length * 0.46);
    shape.bezierCurveTo(width, length * 0.3, width * 0.7, -length * 0.3, 0, -length * 0.5);
    return shape;
};

// --- Memoized Hook for Petal Geometry ---
const usePetalGeometry = () => {
    return useMemo(() => {
        const petalShape = createSakuraPetalShape();
        const geometry = new THREE.ShapeGeometry(petalShape);
        geometry.center();
        geometry.rotateX(Math.PI * 0.05 + Math.random() * 0.1);
        geometry.rotateY(Math.random() * Math.PI * 2);
        geometry.rotateZ(Math.random() * 0.1 - 0.05);
        return geometry;
    }, []);
};

// Updated darker sakura colors
const sakuraColors = [
  new THREE.Color("#F4B3C2"), new THREE.Color("#E992A9"),
  new THREE.Color("#DB7F98"), new THREE.Color("#D88BA1"),
  new THREE.Color("#C87287"), new THREE.Color("#BF6B7E"),
  new THREE.Color("#E37F95"), new THREE.Color("#CA6679"),
];

const FloatingParticles = ({ count = 200 }) => {
    const meshRef = useRef();
    const { viewport } = useThree();
    const petalGeometry = usePetalGeometry();

    // --- Generate Initial Per-Instance Data ---
    const particles = useMemo(() => {
        const temp = [];
        const R = 16;
        const viewportWidth = viewport.width || 20;
        const topEdge = viewport.height / 2;

        for (let i = 0; i < count; i++) {
            const x = (Math.random() - 0.5) * viewportWidth * 1.8;
            // Start petals above the screen (unchanged)
            const y = topEdge + 1 + Math.random() * (viewport.height * 0.5);
            const z = (Math.random() - 0.5) * R * 1.2;
            const rx = Math.random() * Math.PI;
            const ry = Math.random() * Math.PI * 2;
            const rz = Math.random() * Math.PI;
            const scale = 0.08 + Math.random() * 0.06;
            const factorY = 0.32 + Math.random() * 0.2;
            const speedFactor = 0.006 + Math.random() * 0.004;
            const swayFactorX = (Math.random() - 0.5) * 0.7;
            const rotSpeedX = (Math.random() - 0.5) * 0.012;
            const rotSpeedY = (Math.random() - 0.5) * 0.01;
            const rotSpeedZ = (Math.random() - 0.5) * 0.012;
            const baseColor = sakuraColors[Math.floor(Math.random() * sakuraColors.length)].clone();
            baseColor.r += (Math.random() - 0.5) * 0.08;
            baseColor.g += (Math.random() - 0.5) * 0.08;
            baseColor.b += (Math.random() - 0.5) * 0.08;
            baseColor.r = Math.max(0, Math.min(1, baseColor.r));
            baseColor.g = Math.max(0, Math.min(1, baseColor.g));
            baseColor.b = Math.max(0, Math.min(1, baseColor.b));
            temp.push({
                initialPosition: new THREE.Vector3(x, y, z), initialRotation: new THREE.Euler(rx, ry, rz),
                scale, factorY, speedFactor, swayFactorX, rotSpeedX, rotSpeedY, rotSpeedZ, initialColor: baseColor
            });
        }
        return temp;
    }, [count, viewport.height, viewport.width]);

    // --- Set Initial Transforms and Colors ---
    useEffect(() => {
        if (!meshRef.current || !particles || particles.length === 0) return;
        const colorArray = new Float32Array(count * 3);
        const mesh = meshRef.current;
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
        if (!mesh.geometry.attributes.color) {
             mesh.geometry.setAttribute('color', new THREE.InstancedBufferAttribute(colorArray, 3));
        } else {
             mesh.geometry.attributes.color.copyArray(colorArray);
             mesh.geometry.attributes.color.needsUpdate = true;
        }
        mesh.instanceMatrix.needsUpdate = true;
    }, [particles, count]);

    // --- Animation Logic ---
    useFrame((state, delta) => {
        if (!meshRef.current?.geometry?.attributes?.color) return;

        const mesh = meshRef.current;
        const time = state.clock.elapsedTime;
        const topEdge = viewport.height / 2;
        const viewportWidth = viewport.width;

        // --- ADJUSTED BOUNDARY AND RESET ---
        // 1. Raise the lower boundary: Reset just below the bottom edge
        const boundaryY = -topEdge - 1; // Reset 1 unit below the bottom edge

        for (let i = 0; i < count; i++) {
            mesh.getMatrixAt(i, tempObject.matrix);
            tempObject.matrix.decompose(tempObject.position, tempObject.quaternion, tempObject.scale);

            if (!particles[i]) continue;
            const p = particles[i];

            // Position Update
            tempObject.position.y -= p.factorY * p.speedFactor * 60 * delta;
            tempObject.position.x += Math.sin(time * 0.2 + i * 0.3) * p.swayFactorX * p.speedFactor * 15 * delta;

            // Rotation Update
            tempObject.rotation.setFromQuaternion(tempObject.quaternion);
            tempObject.rotation.x += p.rotSpeedX * 60 * delta;
            tempObject.rotation.y += p.rotSpeedY * 60 * delta;
            tempObject.rotation.z += p.rotSpeedZ * 60 * delta;
            tempObject.quaternion.setFromEuler(tempObject.rotation);

            // Boundary Check
            if (tempObject.position.y < boundaryY) {
                // 2. Lower the reset height: Reset closer to the top edge
                tempObject.position.y = topEdge + 1 + Math.random() * 2; // Start 1-3 units above top

                // Keep horizontal and depth reset logic
                tempObject.position.x = (Math.random() - 0.5) * viewportWidth * 1.6;
                tempObject.position.z = (Math.random() - 0.5) * 15;

                // Keep rotation reset logic
                tempObject.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI * 2, Math.random() * Math.PI);
                tempObject.quaternion.setFromEuler(tempObject.rotation);
            }

            // Update Matrix
            tempObject.updateMatrix();
            mesh.setMatrixAt(i, tempObject.matrix);
        }
        mesh.instanceMatrix.needsUpdate = true;
    });

    return (
        <instancedMesh
            ref={meshRef}
            args={[petalGeometry, null, count]}
            key={count}
        >
            <meshBasicMaterial
                vertexColors={true}
                side={THREE.DoubleSide}
                transparent={true}
                opacity={0.95}
            />
        </instancedMesh>
    );
};

export default FloatingParticles;