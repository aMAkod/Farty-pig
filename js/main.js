/**
 * ============================================================================
 * FARTY PIG - MAIN GAME LOOP & PARALLAX WORLD (main.js)
 * ============================================================================
 * This is the central conductor of our game!
 * It manages:
 * 1. The High-DPI Canvas scaler and automatic 16:9 letterboxing.
 * 2. The Delta-Time (dt) game loop via requestAnimationFrame.
 * 3. The Finite State Machine (LOADING -> MENU -> READY -> PLAYING -> PAUSED -> GAME_OVER).
 * 4. Multi-layer Parallax Farm world with clouds, hills, barn, fences, and grassy turf.
 * 5. User input routing (Space, ArrowUp, Mouse Click, Touch).
 */

class GameEngine {
  constructor() {
    this.canvas = document.getElementById('game-canvas');
    this.ctx = this.canvas.getContext('2d');
    this.container = document.getElementById('game-container');

    // Logical dimensions from CONFIG
    this.width = CONFIG.WORLD.WIDTH;
    this.height = CONFIG.WORLD.HEIGHT;

    // Delta Time tracking
    this.lastTime = 0;
    this.deltaTime = 0;

    // Game state: 'MENU' | 'READY' | 'PLAYING' | 'PAUSED' | 'GAME_OVER'
    this.state = 'MENU';
    this.gameOverTime = 0; // Cooldown to avoid accidental instant restart

    // Game scores
    this.score = 0;
    this.poopCount = 0;
    this.highScore = 0;

    // Screen Shake effect
    this.screenShakeTime = 0;
    this.screenShakeMagnitude = 0;

    // Parallax scrolling offsets
    this.scrollCloud = 0;
    this.scrollFarHills = 0;
    this.scrollMidGround = 0;
    this.scrollGround = 0;

    // Procedural cloud positions
    this.clouds = [
      { x: 120, y: 70, scale: 1.1, speed: 12 },
      { x: 480, y: 110, scale: 0.8, speed: 9 },
      { x: 890, y: 60, scale: 1.3, speed: 14 },
      { x: 1240, y: 95, scale: 0.95, speed: 11 }
    ];

    // Bind handlers
    this.loop = this.loop.bind(this);
    this.handleResize = this.handleResize.bind(this);
    this.handleInput = this.handleInput.bind(this);

    // Initialize systems
    this.setupCanvas();
    this.initEvents();
  }

  /**
   * Sets up high-DPI canvas buffer for retina crispness.
   */
  setupCanvas() {
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = this.width * dpr;
    this.canvas.height = this.height * dpr;
    this.ctx.scale(dpr, dpr);
    this.handleResize();
  }

  handleResize() {
    this.ctx.imageSmoothingEnabled = true;
    this.ctx.imageSmoothingQuality = 'high';
  }

  /**
   * Universal input handling (Keyboard, Mouse, Touch).
   */
  initEvents() {
    window.addEventListener('resize', this.handleResize);

    // Auto-pause if phone is rotated to portrait while playing
    const portraitQuery = window.matchMedia('(orientation: portrait)');
    const checkOrientation = (e) => {
      if (e.matches && this.state === 'PLAYING') {
        this.setState('PAUSED');
      }
    };
    if (portraitQuery.addEventListener) {
      portraitQuery.addEventListener('change', checkOrientation);
    }

    window.addEventListener('keydown', (e) => {
      if (['Space', 'ArrowUp', 'KeyW'].includes(e.code)) {
        e.preventDefault();
        this.handleInput();
      } else if (e.code === 'KeyP' || e.code === 'Escape') {
        e.preventDefault();
        this.togglePause();
      } else if (e.code === 'KeyM') {
        e.preventDefault();
        if (window.soundManager) {
          const isMuted = window.soundManager.toggleMute();
          const btn = document.getElementById('btn-sound');
          if (btn) btn.textContent = isMuted ? '🔇' : '🔊';
        }
      } else if (e.code === 'Enter' || e.code === 'NumpadEnter') {
        e.preventDefault();
        // Play procedural fart sound on demand!
        if (window.soundManager) {
          window.soundManager.resumeContext();
          window.soundManager.playFart();
        }
        // Spawn a comedic fart puff behind the pig and trigger an ear/tail wiggle
        if (window.pig && window.particleSystem) {
          const buttX = window.pig.x - Math.cos(window.pig.rotation) * 36;
          const buttY = window.pig.y - Math.sin(window.pig.rotation) * 36 + 6;
          window.particleSystem.spawnFartPuff(buttX, buttY);
          window.pig.flapTimer = 0.22;
        }
      }
    });

    this.canvas.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      this.handleInput();
    });
  }

  handleInput() {
    if (window.soundManager) {
      window.soundManager.resumeContext();
    }

    switch (this.state) {
      case 'MENU':
        this.setState('READY');
        break;

      case 'READY':
        this.setState('PLAYING');
        if (window.pig) window.pig.flap();
        break;

      case 'PLAYING':
        if (window.pig) window.pig.flap();
        break;

      case 'GAME_OVER':
        // Only restart if the player has had at least 400ms to register the crash
        if (this.gameOverTime >= 0.4) {
          this.restartGame();
        }
        break;
    }
  }

  setState(newState) {
    this.state = newState;
    if (newState === 'GAME_OVER') {
      this.gameOverTime = 0;
    }
    if (window.uiManager) {
      window.uiManager.updateState(newState);
    }
  }

  togglePause() {
    if (this.state === 'PLAYING') {
      this.setState('PAUSED');
    } else if (this.state === 'PAUSED') {
      this.setState('PLAYING');
    }
  }

  restartGame() {
    this.score = 0;
    this.poopCount = 0;
    if (window.uiManager) {
      window.uiManager.setScore(0);
      window.uiManager.setPoop(0);
    }
    if (window.pig) window.pig.reset();
    if (window.obstacleManager) window.obstacleManager.reset();
    if (window.particleSystem) window.particleSystem.reset();

    this.setState('READY');
  }

  triggerScreenShake(duration = 0.35, magnitude = 12) {
    this.screenShakeTime = duration;
    this.screenShakeMagnitude = magnitude;
  }

  start() {
    this.lastTime = performance.now();
    requestAnimationFrame(this.loop);
  }

  loop(timestamp) {
    this.deltaTime = Math.min((timestamp - this.lastTime) / 1000, 0.1);
    this.lastTime = timestamp;

    this.update(this.deltaTime);
    this.render();

    requestAnimationFrame(this.loop);
  }

  update(dt) {
    if (this.screenShakeTime > 0) {
      this.screenShakeTime -= dt;
    }

    if (this.state === 'GAME_OVER') {
      this.gameOverTime += dt;
    }

    // Parallax scrolling updates (moves faster during PLAYING)
    const worldSpeed = (this.state === 'PLAYING') ? CONFIG.HAY.INITIAL_SPEED : 35;

    // 1. Clouds scroll slowly
    for (let cloud of this.clouds) {
      cloud.x -= cloud.speed * dt;
      if (cloud.x < -180) {
        cloud.x = this.width + 100;
        cloud.y = 40 + Math.random() * 120;
      }
    }

    // 2. Far hills
    this.scrollFarHills = (this.scrollFarHills + worldSpeed * 0.15 * dt) % this.width;

    // 3. Barn & fence midground
    this.scrollMidGround = (this.scrollMidGround + worldSpeed * 0.45 * dt) % this.width;

    // 4. Grassy ground
    this.scrollGround = (this.scrollGround + worldSpeed * dt) % 40;

    // Update Pig
    if (window.pig) {
      window.pig.update(dt, this.state);
    }

    // Update Obstacles when playing
    if (this.state === 'PLAYING') {
      if (window.obstacleManager) {
        window.obstacleManager.update(dt);
      }
    }

    // Update Particles
    if (window.particleSystem) {
      window.particleSystem.update(dt);
    }
  }

  render() {
    this.ctx.save();

    // Screen Shake displacement
    if (this.screenShakeTime > 0) {
      const shakeX = (Math.random() - 0.5) * this.screenShakeMagnitude;
      const shakeY = (Math.random() - 0.5) * this.screenShakeMagnitude;
      this.ctx.translate(shakeX, shakeY);
    }

    this.ctx.clearRect(0, 0, this.width, this.height);

    // 1. Sky & Sun
    this.drawSky();

    // 2. Clouds
    this.drawClouds();

    // 3. Far Rolling Blue/Green Hills
    this.drawFarHills();

    // 4. Midground Farm, Barn & Silo
    this.drawMidGround();

    // 5. Obstacles (Hay towers & poop)
    if (window.obstacleManager) {
      window.obstacleManager.draw(this.ctx);
    }

    // 6. Particle FX (Fart clouds, sparkles)
    if (window.particleSystem) {
      window.particleSystem.draw(this.ctx);
    }

    // 7. The Star: Farty Pig!
    if (window.pig) {
      window.pig.draw(this.ctx);
    }

    // 8. Grassy Ground Turf
    this.drawGround();

    this.ctx.restore();
  }

  drawSky() {
    const skyGrad = this.ctx.createLinearGradient(0, 0, 0, this.height - CONFIG.WORLD.GROUND_HEIGHT);
    skyGrad.addColorStop(0, '#4fc3f7');
    skyGrad.addColorStop(0.5, '#b3e5fc');
    skyGrad.addColorStop(1, '#e1f5fe');
    this.ctx.fillStyle = skyGrad;
    this.ctx.fillRect(0, 0, this.width, this.height);

    // Soft morning sun glow
    this.ctx.save();
    const sunGrad = this.ctx.createRadialGradient(200, 110, 10, 200, 110, 85);
    sunGrad.addColorStop(0, 'rgba(255, 249, 196, 0.9)');
    sunGrad.addColorStop(0.5, 'rgba(255, 238, 88, 0.35)');
    sunGrad.addColorStop(1, 'rgba(255, 238, 88, 0)');
    this.ctx.fillStyle = sunGrad;
    this.ctx.beginPath();
    this.ctx.arc(200, 110, 85, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.restore();
  }

  drawClouds() {
    this.ctx.save();
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.88)';

    for (let c of this.clouds) {
      this.ctx.save();
      this.ctx.translate(c.x, c.y);
      this.ctx.scale(c.scale, c.scale);

      // Fluffy cartoon cloud puffs
      this.ctx.beginPath();
      this.ctx.arc(0, 0, 26, 0, Math.PI * 2);
      this.ctx.arc(22, -10, 22, 0, Math.PI * 2);
      this.ctx.arc(46, -4, 25, 0, Math.PI * 2);
      this.ctx.arc(68, 4, 18, 0, Math.PI * 2);
      this.ctx.arc(26, 12, 24, 0, Math.PI * 2);
      this.ctx.fill();

      this.ctx.restore();
    }
    this.ctx.restore();
  }

  drawFarHills() {
    const groundY = this.height - CONFIG.WORLD.GROUND_HEIGHT;
    this.ctx.save();

    // Distant pastel hills
    this.ctx.fillStyle = '#81c784';
    this.ctx.beginPath();
    this.ctx.moveTo(0, groundY);

    for (let x = 0; x <= this.width + 40; x += 40) {
      const hillX = (x + this.scrollFarHills) * 0.005;
      const y = groundY - 70 - Math.sin(hillX) * 45 - Math.cos(hillX * 1.8) * 25;
      this.ctx.lineTo(x, y);
    }
    this.ctx.lineTo(this.width, groundY);
    this.ctx.closePath();
    this.ctx.fill();

    this.ctx.restore();
  }

  drawMidGround() {
    const groundY = this.height - CONFIG.WORLD.GROUND_HEIGHT;
    this.ctx.save();

    // Midground rolling pastures
    this.ctx.fillStyle = '#66bb6a';
    this.ctx.beginPath();
    this.ctx.moveTo(0, groundY);

    for (let x = 0; x <= this.width + 30; x += 30) {
      const waveX = (x + this.scrollMidGround) * 0.008;
      const y = groundY - 35 - Math.sin(waveX) * 22;
      this.ctx.lineTo(x, y);
    }
    this.ctx.lineTo(this.width, groundY);
    this.ctx.closePath();
    this.ctx.fill();

    // Draw Classic Red Barn and Silo on the midground
    const barnX = (this.width * 0.65 - this.scrollMidGround + this.width) % this.width;
    this.drawBarn(barnX, groundY - 55);

    // White Picket Fence along the horizon
    this.drawFence(groundY);

    this.ctx.restore();
  }

  drawBarn(x, y) {
    this.ctx.save();
    this.ctx.translate(x, y);

    // Silo (to the right of barn)
    this.ctx.fillStyle = '#90a4ae';
    this.ctx.fillRect(82, -28, 26, 68);
    // Silo dome
    this.ctx.fillStyle = '#78909c';
    this.ctx.beginPath();
    this.ctx.arc(95, -28, 13, Math.PI, 0);
    this.ctx.fill();

    // Barn Body (Red)
    this.ctx.fillStyle = '#c62828';
    this.ctx.fillRect(0, 0, 80, 48);

    // Gambrel Barn Roof (White/Light gray trim)
    this.ctx.fillStyle = '#b71c1c';
    this.ctx.beginPath();
    this.ctx.moveTo(-6, 0);
    this.ctx.lineTo(16, -26);
    this.ctx.lineTo(64, -26);
    this.ctx.lineTo(86, 0);
    this.ctx.closePath();
    this.ctx.fill();

    // White Barn Doors & Cross Beams
    this.ctx.fillStyle = '#fff';
    this.ctx.fillRect(26, 14, 28, 34);
    this.ctx.strokeStyle = '#c62828';
    this.ctx.lineWidth = 3;
    // X marks on door
    this.ctx.beginPath();
    this.ctx.moveTo(26, 14);
    this.ctx.lineTo(54, 48);
    this.ctx.moveTo(54, 14);
    this.ctx.lineTo(26, 48);
    this.ctx.stroke();

    this.ctx.restore();
  }

  drawFence(groundY) {
    this.ctx.save();
    this.ctx.strokeStyle = '#ffffff';
    this.ctx.fillStyle = '#ffffff';
    this.ctx.lineWidth = 2.5;

    // Fence rails
    this.ctx.beginPath();
    this.ctx.moveTo(0, groundY - 14);
    this.ctx.lineTo(this.width, groundY - 14);
    this.ctx.moveTo(0, groundY - 6);
    this.ctx.lineTo(this.width, groundY - 6);
    this.ctx.stroke();

    // Fence pickets
    const picketSpacing = 36;
    const offset = this.scrollMidGround % picketSpacing;
    for (let x = -offset; x < this.width + picketSpacing; x += picketSpacing) {
      this.ctx.fillRect(x - 2, groundY - 22, 5, 22);
      // Pointed picket top
      this.ctx.beginPath();
      this.ctx.moveTo(x - 2, groundY - 22);
      this.ctx.lineTo(x + 0.5, groundY - 27);
      this.ctx.lineTo(x + 3, groundY - 22);
      this.ctx.fill();
    }

    this.ctx.restore();
  }

  drawGround() {
    const groundY = this.height - CONFIG.WORLD.GROUND_HEIGHT;

    // Earth/Dirt Layer
    const dirtGrad = this.ctx.createLinearGradient(0, groundY, 0, this.height);
    dirtGrad.addColorStop(0, '#5d4037');
    dirtGrad.addColorStop(0.3, '#4e342e');
    dirtGrad.addColorStop(1, '#3e2723');
    this.ctx.fillStyle = dirtGrad;
    this.ctx.fillRect(0, groundY + 16, this.width, CONFIG.WORLD.GROUND_HEIGHT - 16);

    // Rich Green Turf Strip
    this.ctx.fillStyle = '#4caf50';
    this.ctx.fillRect(0, groundY, this.width, 16);

    // Dark Grass Shadow Line
    this.ctx.fillStyle = '#2e7d32';
    this.ctx.fillRect(0, groundY + 12, this.width, 4);

    // Animated Grass Tufts scrolling across
    this.ctx.fillStyle = '#81c784';
    const tuftSpacing = 40;
    for (let x = -this.scrollGround; x < this.width + tuftSpacing; x += tuftSpacing) {
      this.ctx.beginPath();
      this.ctx.moveTo(x, groundY);
      this.ctx.lineTo(x + 6, groundY - 7);
      this.ctx.lineTo(x + 12, groundY);
      this.ctx.lineTo(x + 18, groundY - 9);
      this.ctx.lineTo(x + 24, groundY);
      this.ctx.fill();
    }
  }
}

// Launch
window.addEventListener('DOMContentLoaded', () => {
  window.gameEngine = new GameEngine();
  window.gameEngine.start();
});
