import React, { useEffect, useRef, useState } from 'react';
import { TypeAnimation } from 'react-type-animation';
import styles from './Home.module.css';
import TextScramble from './textScramble'; // Import modified TextScramble

// --- Text Content ---
const textContent = {
  en: {
    greeting: "Hey there, I am",
    name: "Anish Kadam",
    titles: [ 'BlockChain Developer', 2000, 'Full Stack Developer', 2000, 'MERN Stack Developer', 2000 ],
    description: "Hey there, I'm Anish – your friendly neighborhood code wizard. I turn coffee into code and bugs into features (well, sometimes). If you need someone to make your software dreams come true with a dash of sarcasm and a lot of debugging, I'm your guy.",
    button1: "Get In Touch",
    button2: "View Work",
  },
  jp: {
    greeting: "こんにちは、私は",
    name: "アニシュ カダム",
    titles: [ 'ブロックチェーン開発者', 2000, 'フルスタック開発者', 2000, 'MERNスタック開発者', 2000 ],
    description: "こんにちは、アニシュです。あなたの身近なコードの魔法使い。コーヒーをコードに変え、バグを機能に変えます（まあ、時々ですが）。少しの皮肉と多くのデバッグでソフトウェアの夢を実現する人が必要なら、私にお任せください。",
    button1: "お問い合わせ",
    button2: "実績を見る",
  }
};

// Calculate total title sequence duration
const calculateTitlesDuration = (titles) => {
  return titles.reduce((sum, item) => {
    return typeof item === 'number' ? sum + item : sum + (item.length * 50);
  }, 0);
};

const Home = () => {
  const homeRef = useRef(null);
  const [isVisible, setIsVisible] = useState(true);
  const [currentLanguage, setCurrentLanguage] = useState('en');
  const [isScrambling, setIsScrambling] = useState(false);
  const [titleCompleteCount, setTitleCompleteCount] = useState(0);
  
  // Refs for elements to be scrambled
  const greetingRef = useRef(null);
  const nameRef = useRef(null);
  const descriptionRef = useRef(null);
  const button1Ref = useRef(null);
  const button2Ref = useRef(null);

  // Ref to store TextScramble instances
  const fxRefs = useRef({});
  const isInitialMount = useRef(true);
  const activeScrambles = useRef(0);
  const languageSwitchTimeoutRef = useRef(null);

  // Initialize TextScramble instances when visible
  useEffect(() => {
    if (isVisible && greetingRef.current && nameRef.current && descriptionRef.current && button1Ref.current && button2Ref.current && !fxRefs.current.greeting) {
      fxRefs.current = {
        greeting: new TextScramble(greetingRef.current),
        name: new TextScramble(nameRef.current),
        description: new TextScramble(descriptionRef.current),
        button1: new TextScramble(button1Ref.current),
        button2: new TextScramble(button2Ref.current),
      };
      
      greetingRef.current.innerText = textContent[currentLanguage].greeting;
      nameRef.current.innerText = textContent[currentLanguage].name;
      descriptionRef.current.innerText = textContent[currentLanguage].description;
      button1Ref.current.innerText = textContent[currentLanguage].button1;
      button2Ref.current.innerText = textContent[currentLanguage].button2;
    }
  }, [isVisible, currentLanguage]);

  // Handle TypeAnimation completion
  useEffect(() => {
    // Clear any existing timeout when component unmounts or language changes
    return () => {
      if (languageSwitchTimeoutRef.current) {
        clearTimeout(languageSwitchTimeoutRef.current);
      }
    };
  }, [currentLanguage]);

  // Trigger language switch after titles complete
  const handleTitleComplete = () => {
    // Set a timeout after the last title display completes
    languageSwitchTimeoutRef.current = setTimeout(() => {
      if (!isScrambling) {
        setIsScrambling(true);
        setCurrentLanguage(prevLang => (prevLang === 'en' ? 'jp' : 'en'));
      }
    }, 1000); // Wait 1 second after title completion before scrambling
  };

  // Trigger scramble effect on language change
  useEffect(() => {
    if (isInitialMount.current || !isVisible || !fxRefs.current.greeting) {
      isInitialMount.current = false;
      return;
    }

    if (!isScrambling) return;

    const targetLang = currentLanguage;
    const scramblePromises = [];
    activeScrambles.current = 0;

    const runScramble = (key, text) => {
      const fx = fxRefs.current[key];
      if (fx) {
        activeScrambles.current += 1;
        const promise = fx.setText(text).finally(() => {
          activeScrambles.current -= 1;
        });
        scramblePromises.push(promise);
      }
    };

    // Run scrambles with a small stagger for smoothness
    setTimeout(() => runScramble('greeting', textContent[targetLang].greeting), 0);
    setTimeout(() => runScramble('name', textContent[targetLang].name), 100);
    setTimeout(() => runScramble('description', textContent[targetLang].description), 200);
    setTimeout(() => runScramble('button1', textContent[targetLang].button1), 300);
    setTimeout(() => runScramble('button2', textContent[targetLang].button2), 350);

    // After all scrambles finish, allow new title sequence
    Promise.all(scramblePromises).then(() => {
      setIsScrambling(false);
      setTitleCompleteCount(count => count + 1);
    });
  }, [currentLanguage, isVisible, isScrambling]);

  return (
    <div
      className={`${styles.homeContainer} ${isVisible ? styles.visible : ''}`}
      ref={homeRef}
    >
      <div className={styles.homeContent}>
        <div ref={greetingRef} className={styles.greeting} data-key="greeting">
          {textContent[currentLanguage].greeting}
        </div>

        <h1 ref={nameRef} className={styles.name} data-key="name">
          {textContent[currentLanguage].name}
        </h1>

        <div className={styles.title}>
          {isVisible && (
            <TypeAnimation
              key={`${currentLanguage}-${titleCompleteCount}`}
              sequence={[
                ...textContent[currentLanguage].titles,
                () => handleTitleComplete()
              ]}
              wrapper="span"
              speed={50}
              cursor={true}
              style={{ display: 'inline-block' }}
            />
          )}
          {!isVisible && <span style={{ visibility: 'hidden' }}> </span>}
        </div>

        <p ref={descriptionRef} className={styles.description} data-key="description">
          {textContent[currentLanguage].description}
        </p>

        <div className={styles.buttonContainer}>
          <a href="#contact" className={styles.primaryButton}>
            <span ref={button1Ref} className={styles.buttonTextSpan} data-key="button1">
              {textContent[currentLanguage].button1}
            </span>
          </a>
          <a href="#projects" className={styles.secondaryButton}>
            <span ref={button2Ref} className={styles.buttonTextSpan} data-key="button2">
              {textContent[currentLanguage].button2}
            </span>
          </a>
        </div>
      </div>
    </div>
  );
};

export default Home;