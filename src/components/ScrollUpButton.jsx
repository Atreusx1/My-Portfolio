import React, { useState, useEffect } from 'react';

const ScrollUpButton = () => {
  const [scrollPosition, setScrollPosition] = useState(0);

  const handleScroll = () => {
    setScrollPosition(window.scrollY);
  };

  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const scrollPercentage = Math.min(
    100,
    (scrollPosition / (document.documentElement.scrollHeight - window.innerHeight)) * 100
  );

  const scrollUp = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  return (
    <button
      className="scroll-up-button"
      onClick={scrollUp}
      title="Scroll to top"
      style={{
        background: `conic-gradient(
          #a931e1a2 0%,
          #E97451 ${scrollPercentage}%,
          transparent ${scrollPercentage}%,
          transparent 100%
        )`,
      }}
    >
      <span className="inner-circle">
        <span className="arrow">↑</span>
      </span>
    </button>
  );
};

export default ScrollUpButton;