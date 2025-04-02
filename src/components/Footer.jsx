import React from 'react';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="footer">
      <div className="footer-content" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="footer-left-container">
          <div className="footer-logo">
            <span className='logo-text'>My Portfolio</span>
          </div>
          <div className="footer-social">
            <a href="https://github.com/atreusx1" target="_blank" rel="noopener noreferrer" className="social-icon">GitHub</a>
            <a href="https://www.linkedin.com/in/anish-defi/" target="_blank" rel="noopener noreferrer" className="social-icon">LinkedIn</a>
          </div>
        </div>
        
        <div className="footer-links" style={{ display: 'flex', gap: '1rem' }}>
          <a href="#home">Home</a>
          <a href="#about">About</a>
          <a href="#skills">Skills</a>
          <a href="#projects">Projects</a>
          <a href="#education">Education</a>
          <a href="#contact">Contact</a>
        </div>
      </div>
      
      <div className="footer-bottom">
        <p>© {currentYear} Anish Kadam. All Rights Reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;