import React, { useEffect, useRef, useState, memo } from 'react'; // Import memo
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

// Calculate total title sequence duration (Optional, not currently used but kept if needed later)
// const calculateTitlesDuration = (titles) => {
//   return titles.reduce((sum, item) => {
//     return typeof item === 'number' ? sum + item : sum + (item.length * 50);
//   }, 0);
// };

// --- Component Definition (Unchanged) ---
const Home = () => {
  const homeRef = useRef(null);
  // NOTE: We keep isVisible=true initially for intersection observer logic
  // If using Intersection Observer, initial visibility check should happen there.
  // If NOT using Intersection Observer, you might start isVisible as false and set true in a useEffect.
  // For simplicity with existing code, starting true.
  const [isVisible, setIsVisible] = useState(true);
  const [currentLanguage, setCurrentLanguage] = useState('en');
  const [isScrambling, setIsScrambling] = useState(false);
  const [titleCompleteCount, setTitleCompleteCount] = useState(0); // Used to reset TypeAnimation

  // Refs for elements to be scrambled
  const greetingRef = useRef(null);
  const nameRef = useRef(null);
  const descriptionRef = useRef(null);
  const button1Ref = useRef(null);
  const button2Ref = useRef(null);

  // Ref to store TextScramble instances
  const fxRefs = useRef({});
  const isInitialMount = useRef(true);
  // const activeScrambles = useRef(0); // Not strictly needed if just using Promise.all
  const languageSwitchTimeoutRef = useRef(null);

  // Initialize TextScramble instances and set initial text based on language
  useEffect(() => {
    // Ensure refs are available and instances haven't been created yet for the current visibility session
    if (isVisible && greetingRef.current && nameRef.current && descriptionRef.current && button1Ref.current && button2Ref.current && !fxRefs.current.greeting) {
      // console.log('Initializing TextScramble instances');
      fxRefs.current = {
        greeting: new TextScramble(greetingRef.current),
        name: new TextScramble(nameRef.current),
        description: new TextScramble(descriptionRef.current),
        button1: new TextScramble(button1Ref.current),
        button2: new TextScramble(button2Ref.current),
      };

      // Set initial text content based on the current language
      greetingRef.current.innerText = textContent[currentLanguage].greeting;
      nameRef.current.innerText = textContent[currentLanguage].name;
      descriptionRef.current.innerText = textContent[currentLanguage].description;
      button1Ref.current.innerText = textContent[currentLanguage].button1;
      button2Ref.current.innerText = textContent[currentLanguage].button2;
    }
    // Cleanup: Reset instances if component becomes hidden (if applicable)
    // return () => { if (!isVisible) fxRefs.current = {}; };
  }, [isVisible, currentLanguage]); // Rerun if visibility or language changes

  // Cleanup timeout on unmount or language change
  useEffect(() => {
    return () => {
      if (languageSwitchTimeoutRef.current) {
        clearTimeout(languageSwitchTimeoutRef.current);
        // console.log('Cleared language switch timeout');
      }
    };
  }, []); // Run only on mount/unmount

  // Trigger language switch after titles complete
  const handleTitleComplete = () => {
    // console.log('Title sequence completed. Setting timeout for language switch.');
    // Clear any previous timeout just in case
    if (languageSwitchTimeoutRef.current) {
      clearTimeout(languageSwitchTimeoutRef.current);
    }
    // Set a timeout after the last title display completes
    languageSwitchTimeoutRef.current = setTimeout(() => {
      if (!isScrambling) { // Ensure we don't switch while already scrambling
        // console.log('Executing language switch.');
        setIsScrambling(true); // Initiate scramble state
        setCurrentLanguage(prevLang => (prevLang === 'en' ? 'jp' : 'en'));
      }
    }, 1000); // Wait 1 second after title completion before scrambling
  };

  // Trigger scramble effect on language change
  useEffect(() => {
    // Skip initial mount and if not visible or instances not ready
    if (isInitialMount.current || !isVisible || !fxRefs.current.greeting) {
      isInitialMount.current = false; // Mark initial mount as passed
      return;
    }

    // Only run if the scramble process should start
    if (!isScrambling) return;

    // console.log(`Scrambling text to language: ${currentLanguage}`);
    const targetLang = currentLanguage;
    const scramblePromises = [];

    const runScramble = (key, text) => {
      const fx = fxRefs.current[key];
      if (fx) {
        const promise = fx.setText(text); // Call the scramble method
        scramblePromises.push(promise);
      } else {
         console.warn(`TextScramble instance for key "${key}" not found.`);
      }
    };

    // Run scrambles with a small stagger for a smoother visual effect
    setTimeout(() => runScramble('greeting', textContent[targetLang].greeting), 0);
    setTimeout(() => runScramble('name', textContent[targetLang].name), 100);
    setTimeout(() => runScramble('description', textContent[targetLang].description), 200);
    setTimeout(() => runScramble('button1', textContent[targetLang].button1), 300);
    setTimeout(() => runScramble('button2', textContent[targetLang].button2), 350);

    // After all scramble animations finish, reset the scrambling state
    // and increment the title counter to force TypeAnimation remount/reset
    Promise.all(scramblePromises).then(() => {
      // console.log('All text scrambles completed.');
      setIsScrambling(false); // End scramble state
      // Incrementing count forces TypeAnimation to restart with new sequence
      setTitleCompleteCount(count => count + 1);
    }).catch(error => {
        console.error("Error during text scramble:", error);
        setIsScrambling(false); // Ensure state is reset even on error
    });

  // Dependencies: Run when language changes, visibility changes (to potentially restart),
  // or when isScrambling becomes true.
  }, [currentLanguage, isVisible, isScrambling]);


  // --- Add Intersection Observer Logic (Optional but Recommended) ---
  // This replaces starting with isVisible = true and makes the animations
  // trigger only when the section scrolls into view.
  /*
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        // Update state based on whether component is intersecting
        setIsVisible(entry.isIntersecting);
        if (entry.isIntersecting) {
          // Optional: If you only want animations to run once
          // observer.unobserve(entry.target);
        }
      },
      {
        root: null, // relative to the viewport
        rootMargin: '0px',
        threshold: 0.1, // 10% of the element is visible
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
  }, []); // Empty dependency array ensures this runs only on mount
  */


  // --- JSX Structure (Unchanged) ---
  return (
    <div
      className={`${styles.homeContainer} ${isVisible ? styles.visible : ''}`} // Ensure .visible class applies styles/animations
      ref={homeRef}
    >
      <div className={styles.homeContent}>
        {/* Apply data-key for potential targeting if needed */}
        <div ref={greetingRef} className={styles.greeting} data-key="greeting">
          {/* Initial text set by useEffect */}
        </div>

        <h1 ref={nameRef} className={styles.name} data-key="name">
          {/* Initial text set by useEffect */}
        </h1>

        <div className={styles.title}>
          {/* Render TypeAnimation only when visible to avoid unnecessary processing */}
          {/* Key ensures it remounts when language/count changes */}
          {isVisible && (
            <TypeAnimation
              key={`${currentLanguage}-${titleCompleteCount}`}
              sequence={[
                ...textContent[currentLanguage].titles,
                handleTitleComplete // Pass the callback directly
              ]}
              wrapper="span"
              speed={50}
              cursor={true}
              repeat={0} // Set repeat to 0 so sequence runs only once per key change
              style={{ display: 'inline-block' }}
            />
          )}
          {/* Placeholder for layout stability when not visible */}
          {!isVisible && <span style={{ visibility: 'hidden' }}> </span>}
        </div>

        <p ref={descriptionRef} className={styles.description} data-key="description">
          {/* Initial text set by useEffect */}
        </p>

        <div className={styles.buttonContainer}>
          <a href="#contact" className={styles.primaryButton}>
            <span ref={button1Ref} className={styles.buttonTextSpan} data-key="button1">
              {/* Initial text set by useEffect */}
            </span>
          </a>
          <a href="#projects" className={styles.secondaryButton}>
            <span ref={button2Ref} className={styles.buttonTextSpan} data-key="button2">
              {/* Initial text set by useEffect */}
            </span>
          </a>
        </div>
      </div>
    </div>
  );
};

// --- Export with React.memo ---
export default memo(Home); // Wrap the component export with memo