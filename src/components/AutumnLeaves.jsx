import React, { useMemo, useEffect } from 'react';
import * as THREE from 'three';

import InstancedFallingItems from './utils/InstancedFallingItems'; // Adjust path if needed
// Adjust paths to your utils folder
import { createMapleLeafShape, createOakLeafShape, createBirchLeafShape } from './utils/leafShapes';
import { autumnMapleColors, autumnOakColors, autumnBirchColors } from './utils/autumnColors';

// --- Geometry Creation Hook (Remains the same) ---
const useLeafGeometries = () => {
    const mapleGeometry = useMemo(() => {
        const geom = new THREE.ShapeGeometry(createMapleLeafShape());
        geom.center();
        return geom;
    }, []);

    const oakGeometry = useMemo(() => {
        const geom = new THREE.ShapeGeometry(createOakLeafShape());
        geom.center();
        geom.rotateZ(Math.PI * 0.1);
        return geom;
    }, []);

    const birchGeometry = useMemo(() => {
        const geom = new THREE.ShapeGeometry(createBirchLeafShape());
        geom.center();
        return geom;
    }, []);

    // Effect for disposing geometries when the component unmounts
    useEffect(() => {
        return () => {
            // console.log("Disposing Leaf Geometries");
            if (mapleGeometry) mapleGeometry.dispose();
            if (oakGeometry) oakGeometry.dispose();
            if (birchGeometry) birchGeometry.dispose();
        };
    }, [mapleGeometry, oakGeometry, birchGeometry]); // Dependencies ensure disposal happens correctly

    return { mapleGeometry, oakGeometry, birchGeometry };
};


function AutumnLeavesComponent({ totalCount = 300 }) { // Renamed slightly to avoid conflict with default export
    // --- Distribute Count (Remains the same) ---
    const counts = useMemo(() => {
        const baseCount = Math.floor(totalCount / 3);
        const remainder = totalCount % 3;
        const mapleCount = Math.max(0, baseCount + (remainder > 0 ? 1 : 0));
        const oakCount = Math.max(0, baseCount + (remainder > 1 ? 1 : 0));
        const birchCount = Math.max(0, baseCount);
        if (totalCount === 0) {
            return { maple: 0, oak: 0, birch: 0 };
        }
        // Adjust if totalCount was less than 3 to avoid counts summing > totalCount
         if (mapleCount + oakCount + birchCount > totalCount) {
             // Simple redistribution logic for small counts
             const m = totalCount >= 1 ? 1 : 0;
             const o = totalCount >= 2 ? 1 : 0;
             const b = totalCount >= 3 ? 1 : 0;
             // Ensure sum doesn't exceed totalCount
             const totalAllocated = m + o + b;
             if (totalAllocated > totalCount) {
                 // Prioritize maple, then oak
                 if (o > 0 && totalCount < 2) return { maple: 1, oak: 0, birch: 0 };
                 if (b > 0 && totalCount < 3) return { maple: m, oak: o, birch: 0 };
             }
             return { maple: m, oak: o, birch: b };

        }
         return { maple: mapleCount, oak: oakCount, birch: birchCount };
    }, [totalCount]);

    // --- Get Geometries (Remains the same) ---
    const { mapleGeometry, oakGeometry, birchGeometry } = useLeafGeometries();

    // --- Optional: Customize Physics per Leaf Type (Remains the same) ---
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

    // --- Resource Loading Check ---
    // Ensure geometries are created before attempting to render children
    if (!mapleGeometry || !oakGeometry || !birchGeometry) {
        return null; // Or a loading indicator
    }

    return (
        <>
            {/* Maple Leaves - Only render if count > 0 */}
            {counts.maple > 0 && mapleGeometry && ( // Add geometry check
                <InstancedFallingItems
                    key="maple" // Key is good practice here
                    count={counts.maple}
                    geometry={mapleGeometry}
                    colorPalette={autumnMapleColors}
                    physicsConfig={maplePhysics}
                />
            )}

            {/* Oak Leaves - Only render if count > 0 */}
            {counts.oak > 0 && oakGeometry && ( // Add geometry check
                <InstancedFallingItems
                    key="oak"
                    count={counts.oak}
                    geometry={oakGeometry}
                    colorPalette={autumnOakColors}
                    physicsConfig={oakPhysics}
                />
            )}

            {/* Birch Leaves - Only render if count > 0 */}
            {counts.birch > 0 && birchGeometry && ( // Add geometry check
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

// --- Optimization: React Memoization ---
// Wrap the component in React.memo. Ensure props passed *to* AutumnLeaves
// (like totalCount) are stable or memoized in the parent if needed.
const AutumnLeaves = React.memo(AutumnLeavesComponent);
export default AutumnLeaves;