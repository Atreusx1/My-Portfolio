import React from 'react';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="footer">
      <div className="footer-content" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="footer-left-container">
          <div className="footer-logo">
            <span className='logo-text'>The Invincible Studio</span>
          </div>
          <div className="footer-social">
            <a href="https://github.com/ajinkyagajarmal" target="_blank" rel="noopener noreferrer" className="social-icon">GitHub</a>
            <a href="https://www.linkedin.com/in/ajinkya-gajarmal-a87367245/" target="_blank" rel="noopener noreferrer" className="social-icon">LinkedIn</a>
            <a href="https://x.com/ajinkyagajarmal" target="_blank" rel="noopener noreferrer" className="social-icon">Twitter</a>
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
        <p>© {currentYear} Ajinkya Gajarmal. All Rights Reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;