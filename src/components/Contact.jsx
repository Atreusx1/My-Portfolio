import React, { useRef, useEffect, useState } from 'react';


const Contact = () => {
  const contactRef = useRef(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [formStatus, setFormStatus] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormStatus('sending');
  
    try {
      // Make a POST request to the serverless function
      const response = await fetch('/api/server', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData), // Send form data to the backend API
      });
  
      const result = await response.json();
  
      if (response.ok) {
        setFormStatus('success');
        setFormData({
          name: '',
          email: '',
          subject: '',
          message: '',
        });
  
        // Reset status after 5 seconds
        setTimeout(() => {
          setFormStatus(null);
        }, 5000);
      } else {
        setFormStatus('error');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setFormStatus('error');
    }
  };
  
  

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-in');
        }
      },
      { threshold: 0.1 }
    );

    if (contactRef.current) {
      observer.observe(contactRef.current);
    }

    return () => {
      if (contactRef.current) {
        observer.unobserve(contactRef.current);
      }
    };
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };


  return (
    <div className="section-container" ref={contactRef}>
      <h2 className="section-title">Let's Connect</h2>
      
      <div className="contact-content">
        <div className="contact-info">
          <h3>Get In Touch</h3>
          <p>
            I'm currently available for freelance work and full-time positions.
            If you have a project that you want to get started or have any questions,
            feel free to reach out. I'll do my best to get back to you as soon as possible.
          </p>
          
          <div className="contact-details">
            <div className="contact-item">
              <div className="contact-icon">📧</div>
              <div className="contact-text">
                <h4>Email</h4>
                <a href="mailto:ajinkya.gajarmal@gmail.com" style={{ textDecoration: 'none' }}>
                  <p>ajinkya.gajarmal@gmail.com</p>
                </a>
              </div>
            </div>
            
            <div className="contact-item">
              <div className="contact-icon">📱</div>
              <div className="contact-text">
                <h4>Phone</h4>
                <a href="tel:+919890467841" style={{ textDecoration: 'none' }}>
                  <p>+91 9890467841</p>
                </a>
              </div>
            </div>
            
            <div className="contact-item">
              <div className="contact-icon">📍</div>
              <div className="contact-text">
                <h4>Location</h4>
                <p>Pune, Maharashtra</p>
              </div>
            </div>
          </div>
          
          <div className="social-links">
            <a href="https://github.com/ajinkyagajarmal" target="_blank" rel="noopener noreferrer" className="social-link">GitHub</a>
            <a href="https://www.linkedin.com/in/ajinkya-gajarmal-a87367245/" target="_blank" rel="noopener noreferrer" className="social-link">LinkedIn</a>
            <a href="https://x.com/ajinkyagajarmal" target="_blank" rel="noopener noreferrer" className="social-link">Twitter</a>
          </div>
        </div>
        
        <div className="contact-form-container">
          <form className="contact-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="name">Name</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Your Name"
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Your Email"
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="subject">Subject</label>
              <input
                type="text"
                id="subject"
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                placeholder="Subject"
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="message">Message</label>
              <textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleChange}
                placeholder="Your Message"
                rows="5"
                required
              ></textarea>
            </div>
            
            <button 
              type="submit" 
              className={`submit-button ${formStatus ? formStatus : ''}`}
              disabled={formStatus === 'sending'}
            >
              {formStatus === 'sending' ? 'Sending...' : 
               formStatus === 'success' ? 'Message Sent!' : 
               'Send Message'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Contact;