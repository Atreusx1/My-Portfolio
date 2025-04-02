import React, { useRef, useEffect } from 'react';
import { faTrophy, faGraduationCap } from '@fortawesome/free-solid-svg-icons'; // Added faGraduationCap
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

const Education = () => {
  const educationRef = useRef(null);

  useEffect(() => {
    // Intersection Observer remains the same
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-in');
        }
      },
      { threshold: 0.1 }
    );

    const currentRef = educationRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, []);

  // --- Updated Education Data from Resume ---
  const educationData = [
    {
      degree: 'MSC. IN BLOCKCHAIN TECHNOLOGY',
      institution: 'MIT WORLD PEACE UNIVERSITY',
      location: 'Pune',
      period: '2022 – 2024',
      description: 'Focus on distributed ledger technology, smart contracts, and blockchain frameworks. Achieved 7.8 CGPA.', // Added CGPA here
    },
    {
      degree: 'BACHELOR OF COMPUTER SCIENCE',
      institution: 'MARATHWADA MITRAMANDAL COLLEGE OF COMMERCE',
      location: 'Pune',
      period: '2019 - 2022',
      description: 'Solid foundation in core computer science principles. Achieved 7.5 CGPA.', // Added CGPA here
    },
  ];

  // --- Updated Certification Data from Resume ---
  const certificationData = [
    // Prioritized Blockchain Certs
    {
      title: 'Certified Blockchain Developer',
      issuer: 'Blockchain Council',
      // date: 'N/A' // Date not specified in resume
    },
    {
      title: 'Certified Smart Contract Developer',
      issuer: 'Blockchain Council',
      // date: 'N/A'
    },
    {
      title: 'Certified Hyperledger Developer',
      issuer: 'Blockchain Council',
      // date: 'N/A'
    },
    // Other Relevant Certs
    // {
    //     title: 'Applied Scrum for Agile Project Management',
    //     issuer: 'edX (University System of Maryland)',
    //     // date: 'N/A'
    // },
    {
        title: 'JavaScript Algorithms and Data Structures',
        issuer: 'freeCodeCamp',
        // date: 'N/A'
    },
    {
        title: 'Responsive Web Design',
        issuer: 'freeCodeCamp',
        // date: 'N/A'
    },
    // {
    //     title: 'Google Cloud Computing Foundation Course',
    //     issuer: 'Allison',
    //     // date: 'N/A'
    // },
    // {
    //     title: 'Overview of Geo Processing using Python',
    //     issuer: 'ISRO - IIRS',
    //     // date: 'N/A'
    // },
  ];

  return (
    // Applying the ref to the main container div
    <div ref={educationRef} className="section-container">
      <h2 className="section-title">Education & Certifications</h2> {/* Updated Title */}

      <div className="education-content">
        {/* Education Timeline Section */}
        <div className="education-section">
          <h3 className="subsection-title">Education</h3>
          <div className="timeline">
            {educationData.map((item, index) => (
              <div key={index} className="timeline-item">
                {/* Using a graduation cap icon for the marker */}
                <div className="timeline-marker">
                    {/* Optional: Add icon inside marker if CSS supports it */}
                    {/* <FontAwesomeIcon icon={faGraduationCap} /> */}
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
        <div className="certification-section">
          <h3 className="subsection-title">Certifications</h3>
          <div className="certifications-list">
            {certificationData.map((item, index) => (
              <div key={index} className="certification-item">
                <div className="certification-icon">
                  {/* Using the trophy icon */}
                  <FontAwesomeIcon icon={faTrophy} style={{ color: '#FFD700' }} /> {/* Gold color */}
                </div>
                <div className="certification-details">
                  <h4 className="certification-title">{item.title}</h4>
                  {/* Displaying only the issuer since dates aren't available */}
                  <p className="certification-issuer">{item.issuer}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Education;