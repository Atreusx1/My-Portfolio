import React, { useRef, useEffect } from 'react';
// You might want to rename this import and the file if you have Anish's image
import anish from '../Assets/images/anish.webp'; // Keeping the original import name as requested

const About = () => {
  const aboutRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-in');
        }
      },
      { threshold: 0.1 } // Keep animation trigger logic
    );

    if (aboutRef.current) {
      observer.observe(aboutRef.current);
    }

    return () => {
      if (aboutRef.current) {
        observer.unobserve(aboutRef.current);
      }
    };
  }, []);

  return (
    <div className="section-container" ref={aboutRef}>
      <h2 className="section-title">Know Me Better</h2>
      <div className="about-content">

        <div className="about-image">
          <div className="image-placeholder">
            {/* Using the original image variable 'ajinkya'. Replace src if you have Anish's image */}
            <img src= {anish} alt="Anish Kadam's Image" width="320" height="290" loading='lazy' style={{ borderRadius: "10%" }} />
          </div>
        </div>

        <div className="about-text">
        <p>
            Think of me as a digital lego builder who accidentally got a Master's in Blockchain! I love snapping together cool Web2 sites (MERN, Django) and futuristic Web3 DApps (Solana, MONAD, Solidity). My superpower? Making complex code run fast and play nice.
          </p>
          <p>
             Basically, I turn caffeine and code into working software. Got a blockchain puzzle or a web challenge? Let's build something awesome (and hopefully stable)!
          </p>
          <div className="personal-info">
            <div className="info-item">
              <span className="info-label">Name:</span>
              <span className="info-value">Anish Kadam</span>
            </div>
            <div className="info-item">
              <span className="info-label">Email:</span>
              <span className="info-value">Anishkadam92@gmail.com</span>
            </div>
            <div className="info-item">
              <span className="info-label">Location:</span>
              <span className="info-value">Pune, Maharashtra</span>
            </div>
            <div className="info-item">
              <span className="info-label">Availability:</span>
              <span className="info-value">Open to opportunities</span>
            </div>
          </div>
          {/* Make sure the resume PDF exists at this path in your public/Assets folder */}
          <a href="/Assets/Anish-Kadam-Resume.pdf" target="_blank" rel="noopener noreferrer" className="resume-button">Download Resume</a>
        </div>
      </div>
    </div>
  );
};

export default About;