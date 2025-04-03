class TextScramble {
    constructor(el) {
      this.el = el;
      // Character set that includes all possible characters for both languages
      this.chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyzアイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン。「」、・0123456789!@#$%^&*()-_=+[]{}|;:,.<>/?\'"`~ ';
      this.update = this.update.bind(this);
    }
    
    setText(newText) {
      // Ensure el exists before trying to access innerText
      const oldText = this.el ? this.el.innerText : '';
      const length = Math.max(oldText.length, newText.length);
      const promise = new Promise((resolve) => this.resolve = resolve);
      this.queue = [];
      
      // Create scramble queue with improved timing
      for (let i = 0; i < length; i++) {
        const from = oldText[i] || '';
        const to = newText[i] || '';
        
        // Set ALL characters to start scrambling at almost the same time
        // Small variation to prevent CPU spikes, but visually simultaneous
        const start = Math.floor(Math.random() * 5); // Nearly simultaneous start (0-4 frames)
        
        // Duration varies by character for visual interest
        // But keep duration short for faster transitions
        const duration = 15 + Math.floor(Math.random() * 20); // Duration between 15-34 frames
        const end = start + duration;
        
        this.queue.push({ from, to, start, end });
      }
      
      cancelAnimationFrame(this.frameRequest);
      this.frame = 0;
      this.update();
      return promise;
    }
    
    update() {
      // Ensure el exists before trying to update
      if (!this.el) {
        if (this.resolve) this.resolve(); // Resolve promise if element is gone
        return;
      }
      
      let output = '';
      let complete = 0;
      
      for (let i = 0, n = this.queue.length; i < n; i++) {
        let { from, to, start, end, char } = this.queue[i];
        
        if (this.frame >= end) {
          complete++;
          output += to;
        } else if (this.frame >= start) {
          // Generate a new scramble character with higher frequency
          // This makes it look more chaotic and scrambled
          if (!char || Math.random() < 0.4) {
            char = this.randomChar();
            this.queue[i].char = char;
          }
          // Add class for styling the scramble character
          output += `<span class="dud">${char}</span>`;
        } else {
          output += from;
        }
      }
      
      this.el.innerHTML = output;
      
      if (complete === this.queue.length) {
        // All characters have finished scrambling
        this.resolve();
      } else {
        this.frameRequest = requestAnimationFrame(this.update);
        this.frame++;
      }
    }
    
    randomChar() {
      return this.chars[Math.floor(Math.random() * this.chars.length)];
    }
  }
  
  export default TextScramble;