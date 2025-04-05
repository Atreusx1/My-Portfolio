// utils/leafShapes.js (or similar file)
import * as THREE from 'three';

// --- Maple Leaf Shape (Simplified) ---
export const createMapleLeafShape = () => {
    const shape = new THREE.Shape();
    const l = 1.0; // Length scale

    shape.moveTo(0, -l * 0.1); // Stem bottom
    shape.lineTo(0, l * 0.1);  // Stem top

    // Lobes (simplified)
    const lobe = (multX, multY, angle) => {
        const cp1x = l * 0.1 * multX; const cp1y = l * 0.3 * multY;
        const cp2x = l * 0.5 * multX; const cp2y = l * 0.6 * multY;
        const endX = l * 0.05 * multX; const endY = l * 0.8 * multY;

        // Rotate points
        const rot = (x, y) => ({
          x: x * Math.cos(angle) - y * Math.sin(angle),
          y: x * Math.sin(angle) + y * Math.cos(angle),
        });

        const p1 = rot(cp1x, cp1y);
        const p2 = rot(cp2x, cp2y);
        const p3 = rot(endX, endY);
        const p4 = rot(-endX, endY); // Mirrored point for return curve
        const p5 = rot(-cp2x, cp2y);
        const p6 = rot(-cp1x, cp1y);

       shape.bezierCurveTo(p1.x, p1.y, p2.x, p2.y, p3.x, p3.y); // Outer curve
       shape.quadraticCurveTo(0, l * 0.75 * multY, p4.x, p4.y); // Tip curve (simplified)
       shape.bezierCurveTo(p5.x, p5.y, p6.x, p6.y, 0, l * 0.1); // Inner curve back to center
    };

    lobe(1, 1, 0); // Center lobe
    lobe(1.1, 0.9, Math.PI / 4); // Right lobe
    lobe(1.1, 0.9, -Math.PI / 4); // Left lobe
    // Add smaller bottom lobes if desired

    return shape;
};

// --- Oak Leaf Shape (Simplified Lobed Oval) ---
export const createOakLeafShape = () => {
    const shape = new THREE.Shape();
    const l = 1.2; const w = 0.5;

    shape.moveTo(0, -l * 0.5); // Stem
    shape.quadraticCurveTo(0, -l*0.4, w*0.1, -l*0.4); // Base curve

    // Lobes - alternating sides
    shape.bezierCurveTo(w * 0.6, -l * 0.3, w * 0.7, -l * 0.1, w * 0.45, l * 0.05);
    shape.bezierCurveTo(w * 0.8, l * 0.2, w * 0.6, l * 0.35, w*0.1, l*0.4);

    shape.bezierCurveTo(-w * 0.6, l * 0.35, -w * 0.8, l * 0.2, -w * 0.45, l * 0.05);
    shape.bezierCurveTo(-w * 0.7, -l * 0.1, -w * 0.6, -l * 0.3, -w*0.1, -l*0.4);

    shape.quadraticCurveTo(0, -l*0.4, 0, -l * 0.5); // Back to stem

    return shape;
};

// --- Birch Leaf Shape (Simple Spade/Triangle) ---
export const createBirchLeafShape = () => {
    const shape = new THREE.Shape();
    const l = 1.0; const w = 0.7;

    shape.moveTo(0, -l * 0.5); // Bottom point
    shape.quadraticCurveTo(-w * 0.5, -l * 0.4, -w * 0.55, 0); // Left bulge
    shape.quadraticCurveTo(-w * 0.5, l * 0.4, 0, l * 0.5); // Left top curve to point
    shape.quadraticCurveTo(w * 0.5, l * 0.4, w * 0.55, 0); // Right top curve
    shape.quadraticCurveTo(w * 0.5, -l * 0.4, 0, -l * 0.5); // Right bulge to bottom

    return shape;
};