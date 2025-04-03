import React, { useEffect, useRef, useState } from 'react';
import { TypeAnimation } from 'react-type-animation';
import styles from './Home.module.css'; // Import the CSS Module

const Home = () => {
  const homeRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false); // State to track visibility

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target); // Animate only once
        }
        // Optional: Reset if it scrolls out (uncomment else block)
        // else {
        //   setIsVisible(false);
        // }
      },
      {
        threshold: 0.1, // Trigger when 10% is visible
      }
    );

    const currentRef = homeRef.current;

    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, []);

  return (
    // Apply the visibility class to the container to trigger child animations
    <div
      className={`${styles.homeContainer} ${isVisible ? styles.visible : ''}`}
      ref={homeRef}
    >
      {/* No need for getAnimationClass anymore, CSS handles targeting */}
      <div className={styles.homeContent}>
        {/* Apply base classes. Animation is triggered by parent .visible class */}
        <div className={styles.greeting}>
          Hey there, I am
        </div>

        <h1 className={styles.name}>
          Anish Kadam
        </h1>

        <div className={styles.title}>
          {/* Conditionally render TypeAnimation */}
          {isVisible && (
            <TypeAnimation
              sequence={[
                'BlockChain Developer', 2000,
                'Full Stack Developer', 2000,
                'MERN Stack Developer', 2000,
              ]}
              wrapper="span"
              speed={50}
              repeat={Infinity}
              cursor={true}
              style={{ display: 'inline-block' }} // Ensures span behaves well
            />
          )}
          {/* Fallback/Placeholder for layout before TypeAnimation mounts */}
          {!isVisible && <span> </span>}
        </div>

        <p className={styles.description}>
          "Hey there, I’m Anish – your friendly neighborhood code wizard. I turn coffee into code and bugs into features (well, sometimes). If you need someone to make your software dreams come true with a dash of sarcasm and a lot of debugging, I’m your guy."
        </p>

        <div className={styles.buttonContainer}>
          <a href="#contact" className={styles.primaryButton}>Get In Touch</a>
          <a href="#projects" className={styles.secondaryButton}>View Work</a>
        </div>
      </div>
    </div>
  );
};

export default Home;