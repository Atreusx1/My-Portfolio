import React, { useRef, useEffect } from 'react';
import ajinkya from '../Assets/images/AJINKYA1.webp';

const About = () => {
  const aboutRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-in');
        }
      },
      { threshold: 0.1 }
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
    <img src= {ajinkya} alt="Ajinkya's Image" width="320" height="290" loading='lazy' style={{ borderRadius: "10%" }} />
  </div>
</div>
        <div className="about-text">
          <p>
            I'm a passionate software developer with over a year of experience building modern web applications.
            I specialize in creating interactive experiences using React, Node.js, MongoDB and other cutting-edge technologies.
          </p>
          <p>
            My journey in software development began when I built my first website at 16. Since then,
            I've been continuously learning and improving my skills to deliver high-quality, user-centered applications.
          </p>
          <p>
            When I'm not coding, you can find me hiking in the mountains, reading science fiction, or experimenting with
            new web technologies and frameworks.
          </p>
          <div className="personal-info">
            <div className="info-item">
              <span className="info-label">Name:</span>
              <span className="info-value">Ajinkya Gajarmal</span>
            </div>
            <div className="info-item">
              <span className="info-label">Email:</span>
              <span className="info-value">ajinkya.gajarmal@gmail.com</span>
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
          <a href="/Assets/Ajinkya-Gajarmal-Resume.pdf" target="_blank" className="resume-button">Download Resume</a>
        </div>
      </div>
    </div>
  );
};

export default About;