// src/components/AutumnLeaves.jsx
import React, { useMemo, useEffect } from 'react';
import * as THREE from 'three';

import InstancedFallingItems from './utils/InstancedFallingItems'; // Adjust path if needed
// Adjust paths to your utils folder
import { createMapleLeafShape, createOakLeafShape, createBirchLeafShape } from './utils/leafShapes';
import { autumnMapleColors, autumnOakColors, autumnBirchColors } from './utils/autumnColors';

// --- Geometry Creation Hook ---
const useLeafGeometries = () => {
    const mapleGeometry = useMemo(() => {
        // console.log("Creating Maple Geometry"); // Less verbose
        const geom = new THREE.ShapeGeometry(createMapleLeafShape());
        geom.center();
        return geom;
    }, []);

    const oakGeometry = useMemo(() => {
        // console.log("Creating Oak Geometry"); // Less verbose
        const geom = new THREE.ShapeGeometry(createOakLeafShape());
        geom.center();
        geom.rotateZ(Math.PI * 0.1);
        return geom;
    }, []);

    const birchGeometry = useMemo(() => {
        // console.log("Creating Birch Geometry"); // Less verbose
        const geom = new THREE.ShapeGeometry(createBirchLeafShape());
        geom.center();
        return geom;
    }, []);

    // Effect for disposing geometries when the component unmounts
    useEffect(() => {
        return () => {
            // console.log("Disposing Leaf Geometries"); // Less verbose
            mapleGeometry.dispose();
            oakGeometry.dispose();
            birchGeometry.dispose();
        };
    }, [mapleGeometry, oakGeometry, birchGeometry]);

    return { mapleGeometry, oakGeometry, birchGeometry };
};


function AutumnLeaves({ totalCount = 300 }) {
    // --- Distribute Count ---
    const counts = useMemo(() => {
        const baseCount = Math.floor(totalCount / 3);
        const remainder = totalCount % 3;
        // Ensure count is never negative if totalCount is very small
        const mapleCount = Math.max(0, baseCount + (remainder > 0 ? 1 : 0));
        const oakCount = Math.max(0, baseCount + (remainder > 1 ? 1 : 0));
        const birchCount = Math.max(0, baseCount);
        // Adjust if totalCount was less than 3 to avoid counts summing > totalCount
        if (totalCount < 3 && totalCount > 0) {
             if (mapleCount + oakCount + birchCount > totalCount) {
                // Simple redistribution logic for small counts
                return { maple: totalCount >= 1 ? 1 : 0, oak: totalCount >= 2 ? 1 : 0, birch: totalCount >= 3 ? 1 : 0 };
            }
        } else if (totalCount === 0) {
            return { maple: 0, oak: 0, birch: 0 };
        }
         return { maple: mapleCount, oak: oakCount, birch: birchCount };
    }, [totalCount]);

    // --- Get Geometries ---
    const { mapleGeometry, oakGeometry, birchGeometry } = useLeafGeometries();

    // --- Optional: Customize Physics per Leaf Type ---
    const oakPhysics = useMemo(() => ({
        scaleRange: [0.10, 0.18],
        fallSpeedRange: [0.010, 0.016],
        rotSpeedRange: [0.006, 0.015],
    }), []);

    const maplePhysics = useMemo(() => ({
        scaleRange: [0.09, 0.16],
        fallSpeedRange: [0.008, 0.014],
        rotSpeedRange: [0.010, 0.020],
        swayFactorRange: [0.7, 1.2],
    }), []);

    // Birch uses default physics

    // Render only if geometries are ready
    if (!mapleGeometry || !oakGeometry || !birchGeometry) {
        return null;
    }

    return (
        <>
            {/* Maple Leaves - Only render if count > 0 */}
            {counts.maple > 0 && (
                <InstancedFallingItems
                    key="maple" // Key is good practice here
                    count={counts.maple}
                    geometry={mapleGeometry}
                    colorPalette={autumnMapleColors}
                    physicsConfig={maplePhysics}
                />
            )}

            {/* Oak Leaves - Only render if count > 0 */}
            {counts.oak > 0 && (
                <InstancedFallingItems
                    key="oak"
                    count={counts.oak}
                    geometry={oakGeometry}
                    colorPalette={autumnOakColors}
                    physicsConfig={oakPhysics}
                />
            )}

            {/* Birch Leaves - Only render if count > 0 */}
            {counts.birch > 0 && (
                <InstancedFallingItems
                    key="birch"
                    count={counts.birch}
                    geometry={birchGeometry}
                    colorPalette={autumnBirchColors}
                    // Uses default physics
                />
            )}
        </>
    );
}

export default AutumnLeaves;