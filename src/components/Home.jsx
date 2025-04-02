import React, { useEffect, useRef } from 'react';
import { TypeAnimation } from 'react-type-animation';

const Home = () => {
  const homeRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-in');
        }
      },
      { threshold: 0.1 }
    );

    if (homeRef.current) {
      observer.observe(homeRef.current);
    }

    return () => {
      if (homeRef.current) {
        observer.unobserve(homeRef.current);
      }
    };
  }, []);

  return (
    <div className="home-container" ref={homeRef}>
      <div className="home-content">
        <div className="greeting">Hey there, I am</div>
        <h1 className="name">Anish Kadam</h1>
        <div className="title">
          <TypeAnimation
            sequence={[
              // 'Web Developer', 2000,
              'BlockChain Developer', 2000,
              'Full Stack Developer', 2000,
              'MERN Stack Developer', 2000,
            ]}
            wrapper="span"
            speed={50}
            repeat={Infinity}
          />
        </div>
        <p className="description">
        "Hey there, I’m Anish – your friendly neighborhood code wizard. I turn coffee into code and bugs into features (well, sometimes). If you need someone to make your software dreams come true with a dash of sarcasm and a lot of debugging, I’m your guy."
        </p>
        <div className="button-container">
          <a href="#contact" className="primary-button">Get In Touch</a>
          <a href="#projects" className="secondary-button">View Work</a>
        </div>
      </div>
    </div>
  );
};

export default Home;
