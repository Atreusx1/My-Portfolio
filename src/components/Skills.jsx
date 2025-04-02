import React, { useRef, useEffect } from 'react';
import {
    DiJavascript,
    DiReact,
    DiNodejs,
    DiMongodb,
    // DiPython, // Removed Python
    DiGithubBadge, // Using this for Git/GitHub representation
    DiGo,
    DiRust,
    DiDocker,
    DiHtml5,
    DiCss3,
} from 'react-icons/di'; // Devicons
import {
    SiPostgresql,
    SiSolidity,
    SiExpress,
    SiWeb3Dotjs,
    SiTypescript,
    SiNextdotjs, // Added Next.js
    // SiJest, // Keeping Jest out for now to stick to 18 core skills
} from 'react-icons/si'; // Simple Icons
import {
    FaEthereum,
    FaHardHat,
    FaAws,
} from 'react-icons/fa'; // Font Awesome

// --- CSS (Ensure your CSS is updated as per the previous instructions) ---

const Skills = () => {
    const skillsRef = useRef(null);

    useEffect(() => {
        // Intersection Observer setup (remains the same)
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate-in');
                }
            },
            { threshold: 0.1 }
        );

        const currentRef = skillsRef.current;
        if (currentRef) {
            observer.observe(currentRef);
        }

        return () => {
            if (currentRef) {
                observer.unobserve(currentRef);
            }
        };
    }, []);

    // Reordered list of 18 relevant skills (Recruiter Perspective)
    const techSkills = [
        // --- Tier 1: Core Blockchain & Full Stack Must-Haves ---
        { Icon: SiSolidity, name: 'Solidity' },        // Smart Contracts
        { Icon: DiReact, name: 'React.js' },           // Core Frontend (MERN)
        { Icon: DiNodejs, name: 'Node.js' },           // Core Backend (MERN)
        { Icon: DiJavascript, name: 'JavaScript' },    // Foundational Language
        { Icon: FaEthereum, name: 'Ethereum' },        // Primary Blockchain Platform
        { Icon: FaHardHat, name: 'Hardhat' },          // Standard Dev Environment
        { Icon: SiWeb3Dotjs, name: 'Web3.js / Ethers' },// dApp Interaction Library
        { Icon: DiGithubBadge, name: 'GitHub' }, // Essential Version Control

        // --- Tier 2: Highly Desirable Modern Stack & Tools ---
        { Icon: SiNextdotjs, name: 'Next.js' },        // Modern React Framework
        { Icon: SiTypescript, name: 'TypeScript' },    // Enhanced JavaScript
        { Icon: SiExpress, name: 'Express.js' },       // Node.js Framework (MERN)
        { Icon: DiDocker, name: 'Docker' },            // Containerization
        { Icon: DiRust, name: 'Rust' },                // Important for Solana/Layer 1s (Shows Breadth)
        { Icon: FaAws, name: 'AWS' },                  // Cloud Deployment/Infrastructure

        // --- Tier 3: Supporting & Foundational ---
        { Icon: DiMongodb, name: 'MongoDB' },          // NoSQL Database (MERN)
        // { Icon: SiPostgresql, name: 'PostgreSQL' },    // SQL Database (Versatility)
        { Icon: DiHtml5, name: 'HTML5' },              // Fundamental Web Tech
        { Icon: DiCss3, name: 'CSS3' },                // Fundamental Web Tech
        // { Icon: DiGo, name: 'Go' },                 // Secondary Backend Language (Less emphasis than Node based on MERN focus)
        // Removed Go to keep exactly 18, prioritizing others. Can be swapped back if needed.
    ];

     // Add Go back if you want exactly 18 and feel it's more important than CSS/HTML (unlikely for full stack)
     // Example: Add Go back and remove CSS3 if needed.
     // For now, keeping HTML/CSS as they are fundamental for the "Full Stack" part. Let's add Go back to make it 19 temporarily and let you decide which one to remove if 18 is strict.
     const finalTechSkills = [
        ...techSkills, // Previous 17
        { Icon: DiGo, name: 'Go' }, // Add Go back for 18
     ];


    return (
        <div className="section-container" ref={skillsRef}>
            <h2 className="section-title">My Tech Stack</h2>

            <div className="tech-icons-grid">
                {finalTechSkills.map((skill) => ( // Use finalTechSkills
                    <div key={skill.name} className="tech-icons">
                        <skill.Icon className="icon-element" />
                        <p className="skill-name">{skill.name}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Skills;