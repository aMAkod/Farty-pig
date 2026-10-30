# 🐷💨 Farty Pig — Complete Game Developer's Guide

Welcome to **Farty Pig**, a comedy arcade game built completely from scratch using **vanilla HTML5, CSS, and modern JavaScript (ES6)**! No game engines (like Unity or Phaser), no external libraries, no bundlers, and zero audio files. It runs completely offline—just open `index.html` in any web browser!

---

## 🎮 How to Play

1. **How to Run:** Double-click [`index.html`](file:///c:/Users/Lenovo/pig/index.html) in your browser. That's it!
2. **Controls:**
   - **Flap / Fart:** Press <kbd>SPACE</kbd>, <kbd>UP ARROW</kbd>, or <kbd>Left Click / Tap</kbd> on the screen.
   - **Toot On Demand:** Press <kbd>ENTER</kbd> anytime to make the pig fart and puff smoke!
   - **Pause:** Press <kbd>P</kbd> or <kbd>ESC</kbd> (or tap the ⏸ button).
   - **Mute / Unmute:** Press <kbd>M</kbd> (or tap the 🔊 icon).
3. **Rules:**
   - Keep the pig airborne using the thrust of its comedic gas!
   - Navigate safely through the gaps in the **stacks of golden hay bales**.
   - Collect the **swirly brown poop** floating in the gaps for **+2 BONUS POINTS** each!
   - Passing each hay gap awards **+1 point**.
   - Crashing into hay, the ground, or the sky causes a wipeout!

---

## 📂 Project Architecture

Here is how the codebase is organized and what each file does:

```text
c:\Users\Lenovo\pig\
├── index.html          # HTML shell, 16:9 canvas container, UI modals, and HUD
├── css/
│   └── style.css       # Arcade typography, responsive letterbox, button animations
├── js/
│   ├── config.js       # GAME DESIGNER PANEL: All tweakable speeds, gaps, and physics
│   ├── audio.js        # PROCEDURAL SYNTHESIZER: Web Audio API farts, dings, and tunes
│   ├── particles.js    # JUICE ENGINE: Fart smoke clouds, sparkles, stars, floating text
│   ├── pig.js          # SKELETAL VECTOR ART: Anatomy, animations (idle, flap, smile, crash)
│   ├── obstacles.js    # WORLD HAZARDS: Stacked hay bales with twine & bobbing poop collectibles
│   ├── ui.js           # UI & STORAGE: High scores in localStorage, modals, medals
│   └── main.js         # ENGINE & STATE MACHINE: High-DPI canvas scaler, delta-time game loop
└── README.md           # This mentor guide & student challenges
```

---

## 🧠 Code Walkthrough (In Plain English)

### 1. The Game Designer Dashboard: [`js/config.js`](file:///c:/Users/Lenovo/pig/js/config.js)
In game studios, programmers don't hardcode numbers into game logic. Instead, they put all constants into a config object. If you want the pig to fall slower or fly higher, you change `PIG.GRAVITY` or `PIG.FLAP_IMPULSE` right here.

### 2. High-DPI Canvas & Game Loop: [`js/main.js`](file:///c:/Users/Lenovo/pig/js/main.js)
- **High-DPI / Retina Scaler:** Modern phone and laptop screens have high pixel densities (`window.devicePixelRatio`). If a canvas is $1280 \times 720$ physical pixels on a 2x screen, it looks fuzzy. We scale the internal buffer by `dpr`, so all lines and curves stay ultra-sharp!
- **Delta Time ($\Delta t$):** Different monitors run at 60Hz, 120Hz, or 144Hz. If you simply add $+5$ pixels per frame, high-refresh screens run faster. Delta time calculates the exact seconds passed between frames, ensuring movement speed is identical everywhere!

### 3. Layered Vector Art Pig: [`js/pig.js`](file:///c:/Users/Lenovo/pig/js/pig.js)
Instead of low-resolution PNG images that might blur or fail to load offline, our pig is constructed mathematically using Canvas 2D vector paths (`arc`, `ellipse`, `bezierCurveTo`).
- It has independent body parts that animate separately:
  - **Floppy ears** that fold back when farting.
  - **Corkscrew curly tail** that wiggles during thrust.
  - **Mouth** that opens with a pink tongue when grabbing poop.
  - **Blue eyes** with specular catchlights that blink every few seconds and turn into dizzy spirals when crashed.

### 4. Golden Hay Towers & Swirly Poop: [`js/obstacles.js`](file:///c:/Users/Lenovo/pig/js/obstacles.js)
- The hay obstacles are procedurally drawn with golden gradients, vertical and horizontal white twine rope cords, and loose straw wisps.
- The poop collectible uses 3 tiered swirly coils with specular highlights and an aroma steam trail, surrounded by animated flies with vibrating wings!
- **Forgiving Hitboxes:** We use an inner circle for the pig ($r=26\text{px}$) and inset rectangles for the hay ($6\text{px}$ inner padding). This makes near-misses feel thrilling instead of unfair!

### 5. Procedural Web Audio Engine: [`js/audio.js`](file:///c:/Users/Lenovo/pig/js/audio.js)
We do not use any external MP3 or WAV files. All audio is synthesized in real time using the browser's built-in **Web Audio API**:
- **Fart Noise:** A low-frequency oscillator ($55\text{–}115\text{Hz}$) with pitch flutter is combined with a buffer of generated white noise passed through a resonant bandpass filter. Pitch and duration are randomized on every flap so every fart sounds unique!
- **Poop Collect:** A sine wave rapidly gliding upward ($380\text{Hz} \to 1200\text{Hz}$) creates an irresistible arcade "plop!".
- **Crash:** Low bass thud ($120\text{Hz} \to 35\text{Hz}$) + comedic descending pig squeal ($780\text{Hz} \to 180\text{Hz}$).

---

## 📖 Beginner's Game Dev Glossary

| Term | What It Means |
|---|---|
| **Game Loop** | A continuous loop (`requestAnimationFrame`) running ~60 times per second that performs two core tasks: **Update** (move objects, check collisions) and **Render** (draw everything on screen). |
| **Delta Time ($\Delta t$)** | The fraction of a second elapsed since the last frame (e.g., $0.016\text{s}$ at 60 FPS). Multiplying speed by $\Delta t$ makes movement frame-rate independent. |
| **Finite State Machine (FSM)** | A design pattern where the game exists in one specific state at a time (`MENU`, `READY`, `PLAYING`, `PAUSED`, `GAME_OVER`). Input does different things depending on the active state. |
| **AABB Collision** | *Axis-Aligned Bounding Box* collision detection. Fast math that checks whether rectangular boxes overlap without accounting for rotation. |
| **Juice** | Visual and acoustic feedback (screen shake, squash & stretch, particle clouds, bouncing text) that turns basic code into a fun, responsive experience. |
| **Web Audio API** | A high-performance audio synthesis system built into modern browsers that lets you create sound waves, filters, and instruments directly in JavaScript. |

---

## 🎯 5 "Try It Yourself" Challenges!

Ready to level up your game development skills? Here are 5 fun challenges you can build yourself:

### Challenge 1: Night Mode Farm 🌙
- **Goal:** In `main.js` inside `drawSky()`, replace the bright blue sky gradient with a deep midnight blue/purple (`#0d1b2a` to `#1b263b`).
- **Bonus:** Draw a glowing white crescent moon in the corner and add yellow twinkling firefly particles!

### Challenge 2: Mud Armor Power-Up 🛡️
- **Goal:** In `obstacles.js`, add a 15% chance to spawn a "Golden Mud Bucket" instead of poop.
- **Effect:** When collected, set `pig.hasShield = true`. If the pig collides with a hay bale while shielded, shatter the shield with a burst of mud particles instead of dying!

### Challenge 3: Super Chili Taco (Turbo Fart!) 🌮🔥
- **Goal:** Create a rare spicy taco collectible.
- **Effect:** For 5 seconds, change the fart clouds to bright orange/red fiery explosions, boost obstacle scrolling speed, and make the pig invincible!

### Challenge 4: Second Character Skin (Party Pig) 🕶️🎉
- **Goal:** Add a button in the Start Menu to toggle character skins.
- **Implementation:** In `pig.js`, create a `drawSunglasses()` or `drawPartyHat()` method. Draw a triangular party hat on the pig's head when the skin is active!

### Challenge 5: Custom Fart Sound Synthesizer 🎛️
- **Goal:** Open `js/audio.js` and find `playFart()`.
- **Experiment:** Change `osc.type` from `'sawtooth'` to `'square'`. Increase `wobbleSpeed` or change the filter frequency. Listen to how drastically the comedic tone changes!

