import React, { useState, useRef, useEffect } from 'react';
import { faTrophy, faGraduationCap, faBriefcase } from '@fortawesome/free-solid-svg-icons'; // Added faBriefcase
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

// Your existing CSS styles will be applied here.
// We'll add specific styles for tabs and potentially selected items later.

const ExperienceEducation = () => {
  const sectionRef = useRef(null);
  const [activeTab, setActiveTab] = useState('experience'); // Default to experience tab
  const [selectedExperienceIndex, setSelectedExperienceIndex] = useState(0); // Select the first experience by default

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-in');
          // Optional: Trigger animation on tab change if desired
        }
      },
      { threshold: 0.1 }
    );

    const currentRef = sectionRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, []); // Observe only once when the component mounts

  // --- Experience Data from Resume ---
  const experienceData = [
    {
      title: 'BLOCKCHAIN DEVELOPER',
      company: 'TecMetaverse',
      location: 'Pune',
      period: 'JANUARY 2025 – PRESENT',
      details: [
        'Spearheaded blockchain development using Layer 1 (Solana, MONAD) and Layer 2 solutions.',
        'Engineered Web3 DApps and Web2 websites (MERN stack, Solidity).',
        'Optimized React builds with custom scripts for maximum performance.',
        'Enhanced deployment efficiency via advanced server configurations (URL rewrites, reverse proxies).',
        'Mentored interns in emerging technologies, driving product innovation.',
      ],
    },
    {
      title: 'SOFTWARE DEVELOPER INTERN',
      company: 'Portalwiz Technologies',
      location: 'Pune',
      period: 'FEBRUARY 2024 – AUGUST 2024',
      details: [
        'Developed Django APIs and React user interfaces for client projects.',
        'Integrated MongoDB for efficient data storage solutions.',
        'Created a chatbot solution to streamline client communication processes.',
        'Contributed to building and optimizing products enhancing user experience.',
      ],
    },
    {
      title: 'SOFTWARE INTERN',
      company: 'Alpha Analytics Services',
      location: 'Pune',
      period: 'JANUARY 2023 – DECEMBER 2023',
      details: [
        'Worked on multiple web applications utilizing the MERN stack.',
        'Developed React frontends and Node.js APIs.',
        'Ensured seamless integration with MongoDB for data management.',
        'Performed debugging, testing, and optimization of application performance.',
        'Collaborated closely with the team to meet project deadlines and goals.',
      ],
    },
  ];

  // --- Education Data (Keep as is) ---
  const educationData = [
    {
      degree: 'MSC. IN BLOCKCHAIN TECHNOLOGY',
      institution: 'MIT WORLD PEACE UNIVERSITY',
      location: 'Pune',
      period: '2022 – 2024',
      description: 'Focus on distributed ledger technology, smart contracts, and blockchain frameworks. Achieved 7.8 CGPA.',
    },
    {
      degree: 'BACHELOR OF COMPUTER SCIENCE',
      institution: 'MARATHWADA MITRAMANDAL COLLEGE OF COMMERCE',
      location: 'Pune',
      period: '2019 - 2022',
      description: 'Solid foundation in core computer science principles. Achieved 7.5 CGPA.',
    },
  ];

  // --- Certification Data (Keep as is) ---
  const certificationData = [
    { title: 'Certified Blockchain Developer', issuer: 'Blockchain Council' },
    { title: 'Certified Smart Contract Developer', issuer: 'Blockchain Council' },
    { title: 'Certified Hyperledger Developer', issuer: 'Blockchain Council' },
    { title: 'JavaScript Algorithms and Data Structures', issuer: 'freeCodeCamp' },
    { title: 'Responsive Web Design', issuer: 'freeCodeCamp' },
  ];

  const handleExperienceSelect = (index) => {
    setSelectedExperienceIndex(index);
  };

  const selectedExperience = experienceData[selectedExperienceIndex];

  return (
    <div ref={sectionRef} className="section-container"> {/* Apply ref to the main container */}
      {/* Tab Navigation */}
      <h1 className="section-title1">Journey So far...</h1>
      <div className="tabs-container">
        <button
          className={`tab-button ${activeTab === 'experience' ? 'active' : ''}`}
          onClick={() => setActiveTab('experience')}
        >
          Experience
        </button>
        <button
          className={`tab-button ${activeTab === 'education' ? 'active' : ''}`}
          onClick={() => setActiveTab('education')}
        >
          Education
        </button>
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {activeTab === 'experience' && (
          <>
            {/* <h2 className="section-title2">Experience</h2> */}
            <div className="content-grid"> {/* Use a generic grid class */}
              {/* Experience Timeline Section */}
              <div className="timeline-section"> {/* Generic name */}
                 {/* No subsection title needed if section title is above */}
                 <h3 className="subsection-title">Experience</h3>

                <div className="timeline">
                  {experienceData.map((item, index) => (
                    <div
                      key={index}
                      className={`timeline-item ${index === selectedExperienceIndex ? 'selected' : ''}`}
                      onClick={() => handleExperienceSelect(index)}
                      style={{ cursor: 'pointer' }} // Indicate clickability
                    >
                      <div className="timeline-marker experience-marker">
                         <FontAwesomeIcon icon={faBriefcase} className="timeline-marker-icon" />
                      </div>
                      <div className="timeline-content">
                        <div className="timeline-period">{item.period}</div>
                        <h4 className="timeline-title">{item.title}</h4>
                        <p className="timeline-institution">{item.company}, {item.location}</p>
                         {/* No description needed here, details are on the right */}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Experience Details Section */}
<div className="details-section">
    <h3 className="subsection-title">Summary & Responsibilities</h3>
    {selectedExperience ? (
        <div className="experience-details-list"> {/* This div might be redundant now, can remove if only ul is inside */}
            {/* We will style the ul and li directly */}
            <ul className="details-points">
                {selectedExperience.details.map((point, idx) => (
                <li key={idx} className="details-point">
                    {/* Text content remains here */}
                    {point}
                </li>
                ))}
            </ul>
        </div>
    ) : (
        <p className="no-selection-message">Select an experience from the timeline to see details.</p>
    )}
</div>
            </div>
          </>
        )}

        {activeTab === 'education' && (
          <>
            {/* <h2 className="section-title2">Education & Certifications</h2> */}
            <div className="content-grid"> {/* Use the same generic grid class */}
              {/* Education Timeline Section */}
              <div className="timeline-section"> {/* Generic name */}
                <h3 className="subsection-title">Education</h3>
                <div className="timeline">
                  {educationData.map((item, index) => (
                    <div key={index} className="timeline-item">
                      <div className="timeline-marker education-marker">
                         <FontAwesomeIcon icon={faGraduationCap} className="timeline-marker-icon"/>
                      </div>
                      <div className="timeline-content">
                        <div className="timeline-period">{item.period}</div>
                        <h4 className="timeline-title">{item.degree}</h4>
                        <p className="timeline-institution">{item.institution}, {item.location}</p>
                        <p className="timeline-description">{item.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Certifications List Section */}
              <div className="certification-section"> {/* Keep specific name */}
                <h3 className="subsection-title">Certifications</h3>
                <div className="certifications-list">
                  {certificationData.map((item, index) => (
                    <div key={index} className="certification-item">
                      <div className="certification-icon">
                        <FontAwesomeIcon icon={faTrophy} style={{ color: '#FFD700', fontSize: '1.5em' }} /> {/* Keep styling */}
                      </div>
                      <div className="certification-details">
                        <h4 className="certification-title">{item.title}</h4>
                        <p className="certification-issuer">{item.issuer}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ExperienceEducation; // Rename component appropriately