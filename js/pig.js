/**
 * ============================================================================
 * FARTY PIG - PIG SKELETAL VECTOR ART & ANIMATIONS (pig.js)
 * ============================================================================
 * Meet our star, the Farty Pig!
 * Built completely with Canvas 2D vector geometry (arcs, beziers, gradients).
 * It features dynamic skeletal animations:
 * - Breathing and blinking when sitting idle
 * - Ear flapping, leg tucking, and tail wiggling when flying
 * - Joyful sparkle grin when gobbling poop
 * - Dizzy spiral eyes and tumbling physics when crashing
 */

class Pig {
  constructor() {
    this.reset();
  }

  /**
   * Resets the pig to initial spawn state.
   */
  reset() {
    this.x = CONFIG.PIG.START_X;
    this.y = CONFIG.PIG.START_Y;
    this.vy = 0;
    this.rotation = 0;

    // Animation & Internal Timers
    this.animTime = 0;           // Continuous time for breathing and wagging
    this.blinkTimer = 2.5;       // Seconds until next blink
    this.blinkDuration = 0;      // Current blink progress
    this.flapTimer = 0;          // Seconds remaining for ear flap & leg tuck
    this.happyTimer = 0;         // Seconds remaining for poop grin
    this.crashTime = 0;          // Tumbling timer during game over
    this.isDead = false;

    // Visual dimensions & hitbox
    this.width = CONFIG.PIG.WIDTH;
    this.height = CONFIG.PIG.HEIGHT;
    this.hitboxRadius = CONFIG.PIG.HITBOX_RADIUS;
  }

  /**
   * Flaps the pig upward with fart power!
   */
  flap() {
    if (this.isDead) return;

    // Apply upward impulse
    this.vy = CONFIG.PIG.FLAP_IMPULSE;
    
    // Tilt upward immediately
    this.rotation = CONFIG.PIG.MIN_ROTATION;

    // Trigger flap animation timer (ears back, legs tuck)
    this.flapTimer = 0.28;

    // Spawn fart gas cloud behind the pig
    if (window.particleSystem) {
      // Butt coordinates: roughly at (-width/2, +4) in local pig space
      const buttX = this.x - Math.cos(this.rotation) * 36;
      const buttY = this.y - Math.sin(this.rotation) * 36 + 6;
      window.particleSystem.spawnFartPuff(buttX, buttY);
    }

    // Play procedural fart sound
    if (window.soundManager) {
      window.soundManager.playFart();
    }
  }

  /**
   * Triggered when collecting a poop collectible!
   */
  collectPoop() {
    this.happyTimer = 0.6; // Smile and sparkle for 0.6s
    if (window.particleSystem) {
      window.particleSystem.spawnSparkles(this.x + 20, this.y);
      window.particleSystem.spawnFloatingText(this.x + 20, this.y - 20, '+2 💩');
    }
  }

  /**
   * Triggered on crash into hay, ceiling, or ground.
   */
  crash() {
    if (this.isDead) return;
    this.isDead = true;
    this.vy = -200; // Small bounce on impact

    if (window.soundManager) {
      window.soundManager.playCrash();
    }

    if (window.gameEngine) {
      window.gameEngine.triggerScreenShake(0.35, 14);
    }

    if (window.particleSystem) {
      window.particleSystem.spawnStars(this.x, this.y - 25);
    }
  }

  /**
   * Updates pig physics and animation frames.
   * @param {number} dt - Delta time in seconds
   * @param {string} gameState - Current state of the game
   */
  update(dt, gameState) {
    this.animTime += dt;

    // Handle blinking cycles
    this.blinkTimer -= dt;
    if (this.blinkTimer <= 0) {
      this.blinkDuration = 0.15; // Quick 150ms blink
      this.blinkTimer = 2.5 + Math.random() * 2.0; // Next blink in 2.5-4.5s
    }
    if (this.blinkDuration > 0) {
      this.blinkDuration -= dt;
    }

    // Decay timers
    if (this.flapTimer > 0) this.flapTimer -= dt;
    if (this.happyTimer > 0) this.happyTimer -= dt;

    // State-specific physics behavior
    if (gameState === 'MENU' || gameState === 'READY') {
      // Idle sitting / hovering: gentle sinusoidal float
      this.vy = 0;
      this.rotation = Math.sin(this.animTime * 2.5) * 0.05;
      
      if (gameState === 'READY') {
        this.y = CONFIG.PIG.START_Y + Math.sin(this.animTime * 4) * 8;
      } else {
        // Sitting on the ground in the menu
        this.y = CONFIG.WORLD.HEIGHT - CONFIG.WORLD.GROUND_HEIGHT - 38;
      }
      return;
    }

    if (gameState === 'PLAYING') {
      // 1. Apply Gravity: v = v0 + g * dt
      this.vy += CONFIG.PIG.GRAVITY * dt;
      if (this.vy > CONFIG.PIG.MAX_FALL_SPEED) {
        this.vy = CONFIG.PIG.MAX_FALL_SPEED;
      }

      // 2. Update Position: y = y0 + v * dt
      this.y += this.vy * dt;

      // 3. Smooth Pitch Rotation: tilt downward as fall speed builds
      if (this.vy > 100) {
        this.rotation += CONFIG.PIG.ROTATION_SPEED * dt;
        if (this.rotation > CONFIG.PIG.MAX_ROTATION) {
          this.rotation = CONFIG.PIG.MAX_ROTATION;
        }
      }

      // 4. Ceiling & Ground Collisions
      // Ceiling check
      if (this.y < 30) {
        this.y = 30;
        this.vy = 50;
      }

      // Ground check
      const groundLimit = CONFIG.WORLD.HEIGHT - CONFIG.WORLD.GROUND_HEIGHT - 22;
      if (this.y >= groundLimit) {
        this.y = groundLimit;
        this.crash();
        if (window.gameEngine) {
          window.gameEngine.setState('GAME_OVER');
        }
      }
    }

    if (gameState === 'GAME_OVER') {
      // Tumble down to ground if in the air
      this.crashTime += dt;
      const groundLimit = CONFIG.WORLD.HEIGHT - CONFIG.WORLD.GROUND_HEIGHT - 22;
      
      if (this.y < groundLimit) {
        this.vy += CONFIG.PIG.GRAVITY * dt;
        this.y += this.vy * dt;
        this.rotation += 8 * dt; // Rapid tumbling spin
      } else {
        this.y = groundLimit;
        this.rotation = 1.1; // Rest sideways
      }
    }
  }

  /**
   * Forgiving circular hitbox for precision collisions.
   */
  getHitbox() {
    return {
      x: this.x,
      y: this.y,
      radius: this.hitboxRadius
    };
  }

  /**
   * Master drawing pipeline: renders layered anatomical vector artwork.
   * @param {CanvasRenderingContext2D} ctx 
   */
  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rotation);

    // Subtle squash & stretch during flap or breathing
    let scaleX = 1;
    let scaleY = 1;
    if (this.flapTimer > 0) {
      // Stretch forward during flap impulse
      scaleX = 1.08;
      scaleY = 0.94;
    } else {
      // Gentle breathing idle squish
      scaleX = 1 + Math.sin(this.animTime * 3) * 0.02;
      scaleY = 1 - Math.sin(this.animTime * 3) * 0.02;
    }
    ctx.scale(scaleX, scaleY);

    // 1. Curly Tail (Behind body)
    this.drawTail(ctx);

    // 2. Back Legs
    this.drawBackLegs(ctx);

    // 3. Round Pink Body
    this.drawBody(ctx);

    // 4. Belly Highlight
    this.drawBelly(ctx);

    // 5. Front Legs
    this.drawFrontLegs(ctx);

    // 6. Big Floppy Ears
    this.drawEars(ctx);

    // 7. Cheeks & Blush
    this.drawCheeks(ctx);

    // 8. Snout & Nostrils
    this.drawSnout(ctx);

    // 9. Mouth (Happy grin or open)
    this.drawMouth(ctx);

    // 10. Big Blue Expressive Eyes
    this.drawEyes(ctx);

    ctx.restore();

    // Debug hitbox visualizer (uncomment to inspect precision)
    // this.drawDebugHitbox(ctx);
  }

  /**
   * 1. Animated Corkscrew Curly Tail
   */
  drawTail(ctx) {
    ctx.save();
    ctx.translate(-34, 4);

    // Tail wiggle angle
    const wiggle = Math.sin(this.animTime * 14) * 0.18;
    ctx.rotate(wiggle);

    ctx.strokeStyle = '#ff85a2';
    ctx.lineWidth = 4.5;
    ctx.lineCap = 'round';

    ctx.beginPath();
    ctx.arc(0, 0, 9, 0, Math.PI * 1.6);
    ctx.stroke();

    // Cute tip curl
    ctx.beginPath();
    ctx.arc(-4, -6, 5, 0, Math.PI * 1.5, true);
    ctx.stroke();

    ctx.restore();
  }

  /**
   * 2. Rear Legs & Brown Hooves
   */
  drawBackLegs(ctx) {
    const isFlapping = this.flapTimer > 0;
    const legAngle = isFlapping ? -0.4 : (this.vy > 300 ? 0.35 : 0);

    // Left Rear Leg
    this.drawLeg(ctx, -18, 20, legAngle, '#e05378', '#5d4037');
    // Right Rear Leg
    this.drawLeg(ctx, -6, 22, legAngle * 0.8, '#e05378', '#5d4037');
  }

  /**
   * 5. Front Legs & Brown Hooves
   */
  drawFrontLegs(ctx) {
    const isFlapping = this.flapTimer > 0;
    const legAngle = isFlapping ? -0.3 : (this.vy > 300 ? 0.25 : 0);

    // Left Front Leg
    this.drawLeg(ctx, 10, 22, legAngle, '#ff85a2', '#4e342e');
    // Right Front Leg
    this.drawLeg(ctx, 22, 20, legAngle * 1.1, '#ff85a2', '#4e342e');
  }

  /**
   * Single Leg & Hoof Primitive
   */
  drawLeg(ctx, offsetX, offsetY, angle, legColor, hoofColor) {
    ctx.save();
    ctx.translate(offsetX, offsetY);
    ctx.rotate(angle);

    // Leg flesh
    ctx.fillStyle = legColor;
    ctx.beginPath();
    ctx.roundRect(-5, 0, 10, 16, 4);
    ctx.fill();

    // Brown hoof
    ctx.fillStyle = hoofColor;
    ctx.beginPath();
    ctx.roundRect(-5, 12, 10, 6, [0, 0, 3, 3]);
    ctx.fill();

    // Hoof cleft slit
    ctx.strokeStyle = '#2c1a0e';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(0, 14);
    ctx.lineTo(0, 18);
    ctx.stroke();

    ctx.restore();
  }

  /**
   * 3. Plump Round Pink Body
   */
  drawBody(ctx) {
    ctx.save();

    // Body radial gradient for rich 3D shading
    const bodyGrad = ctx.createRadialGradient(-6, -6, 8, 0, 0, 38);
    bodyGrad.addColorStop(0, '#ffc4d4'); // Soft bright highlight
    bodyGrad.addColorStop(0.65, '#ff85a2'); // Base pink
    bodyGrad.addColorStop(1, '#e05378');   // Shadow pink rim

    ctx.fillStyle = bodyGrad;
    ctx.strokeStyle = '#2c1a0e';
    ctx.lineWidth = 3.5;

    ctx.beginPath();
    // Beautiful plump egg-shaped body
    ctx.ellipse(0, 2, 38, 30, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.restore();
  }

  /**
   * 4. Soft Belly Highlight
   */
  drawBelly(ctx) {
    ctx.save();
    ctx.fillStyle = 'rgba(255, 235, 240, 0.45)';
    ctx.beginPath();
    ctx.ellipse(-2, 12, 24, 14, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  /**
   * 6. Big Floppy Pig Ears (with dark pink inner lobes)
   */
  drawEars(ctx) {
    const isFlapping = this.flapTimer > 0;
    // Ear flap flutter angle
    const earFlap = isFlapping ? -0.45 : Math.sin(this.animTime * 6) * 0.08;

    // Left Ear (pointed up-left)
    ctx.save();
    ctx.translate(-8, -22);
    ctx.rotate(-0.35 + earFlap);
    this.drawSingleEar(ctx);
    ctx.restore();

    // Right Ear (pointed up-right)
    ctx.save();
    ctx.translate(18, -20);
    ctx.rotate(0.35 - earFlap * 0.7);
    this.drawSingleEar(ctx);
    ctx.restore();
  }

  /**
   * Single Ear geometry
   */
  drawSingleEar(ctx) {
    ctx.fillStyle = '#ff85a2';
    ctx.strokeStyle = '#2c1a0e';
    ctx.lineWidth = 3;

    // Outer ear lobe
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(-14, -18, 0, -28);
    ctx.quadraticCurveTo(14, -18, 0, 0);
    ctx.fill();
    ctx.stroke();

    // Inner darker pink lobe (from reference design)
    ctx.fillStyle = '#e05378';
    ctx.beginPath();
    ctx.moveTo(0, -3);
    ctx.quadraticCurveTo(-8, -16, 0, -22);
    ctx.quadraticCurveTo(8, -16, 0, -3);
    ctx.fill();
  }

  /**
   * 7. Cheeks & Rosy Blush
   */
  drawCheeks(ctx) {
    ctx.save();
    ctx.fillStyle = 'rgba(255, 112, 147, 0.45)';
    
    // Left cheek blush
    ctx.beginPath();
    ctx.arc(8, 10, 7, 0, Math.PI * 2);
    ctx.fill();

    // Right cheek blush
    ctx.beginPath();
    ctx.arc(32, 8, 7, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  /**
   * 8. Round Snout with Two Nostrils
   */
  drawSnout(ctx) {
    ctx.save();
    ctx.translate(22, 6);

    // Snout gradient
    const snoutGrad = ctx.createLinearGradient(0, -10, 0, 10);
    snoutGrad.addColorStop(0, '#ff9eb5');
    snoutGrad.addColorStop(1, '#ff6b8b');

    ctx.fillStyle = snoutGrad;
    ctx.strokeStyle = '#2c1a0e';
    ctx.lineWidth = 3;

    // Rounded oval snout
    ctx.beginPath();
    ctx.ellipse(0, 0, 14, 11, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Top shine on snout
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.beginPath();
    ctx.ellipse(0, -5, 8, 3, 0, 0, Math.PI * 2);
    ctx.fill();

    // Two oval nostrils
    ctx.fillStyle = '#880e4f';
    // Left nostril
    ctx.beginPath();
    ctx.ellipse(-5, 0, 2.5, 4.5, -0.1, 0, Math.PI * 2);
    ctx.fill();
    // Right nostril
    ctx.beginPath();
    ctx.ellipse(5, 0, 2.5, 4.5, 0.1, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  /**
   * 9. Mouth with Happy Tongue
   */
  drawMouth(ctx) {
    ctx.save();
    ctx.translate(20, 18);

    const isHappy = this.happyTimer > 0;

    if (isHappy) {
      // Wide open cheerful grin with tongue!
      ctx.fillStyle = '#880e4f';
      ctx.strokeStyle = '#2c1a0e';
      ctx.lineWidth = 2.5;

      ctx.beginPath();
      ctx.arc(0, 0, 9, 0, Math.PI);
      ctx.fill();
      ctx.stroke();

      // Pink tongue
      ctx.fillStyle = '#ff4081';
      ctx.beginPath();
      ctx.arc(0, 3, 6, 0, Math.PI);
      ctx.fill();
    } else {
      // Gentle cartoon smile line
      ctx.strokeStyle = '#2c1a0e';
      ctx.lineWidth = 2.8;
      ctx.lineCap = 'round';

      ctx.beginPath();
      ctx.arc(0, -2, 7, 0.2, Math.PI * 0.85);
      ctx.stroke();
    }

    ctx.restore();
  }

  /**
   * 10. Big Blue Eyes (Sparkling, wide, or dizzy spiral)
   */
  drawEyes(ctx) {
    // Left Eye
    this.drawSingleEye(ctx, 4, -8, 8.5);
    // Right Eye
    this.drawSingleEye(ctx, 20, -10, 8.5);
  }

  /**
   * Single Eye Renderer with Dizzy / Blink / Blue pupil logic
   */
  drawSingleEye(ctx, x, y, radius) {
    ctx.save();
    ctx.translate(x, y);

    // If blinking (closed eyelid slit)
    if (this.blinkDuration > 0 && !this.isDead) {
      ctx.strokeStyle = '#2c1a0e';
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.arc(0, 2, radius * 0.8, 0.1, Math.PI * 0.9);
      ctx.stroke();
      ctx.restore();
      return;
    }

    // Eyeball Sclera (White)
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#2c1a0e';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Dizzy Spiral Eyes on Crash!
    if (this.isDead) {
      ctx.strokeStyle = '#2c1a0e';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      // Spiral coils
      for (let i = 0; i < 40; i++) {
        const angle = 0.25 * i;
        const r = (radius * 0.85) * (i / 40);
        const px = Math.cos(angle + this.crashTime * 8) * r;
        const py = Math.sin(angle + this.crashTime * 8) * r;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();
      ctx.restore();
      return;
    }

    // Iris & Pupil (Bright Blue from reference image)
    const irisRadius = radius * 0.65;
    const pupilX = this.vy > 300 ? 1 : 2; // Look down when falling, forward when flying
    const pupilY = this.vy > 300 ? 2 : 0;

    // Blue Iris
    ctx.fillStyle = '#0288d1';
    ctx.beginPath();
    ctx.arc(pupilX, pupilY, irisRadius, 0, Math.PI * 2);
    ctx.fill();

    // Dark Pupil
    ctx.fillStyle = '#011627';
    ctx.beginPath();
    ctx.arc(pupilX, pupilY, irisRadius * 0.6, 0, Math.PI * 2);
    ctx.fill();

    // Specular Catchlights (Gives that lively cartoon shine!)
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(pupilX - 2.5, pupilY - 2.5, 2.4, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.arc(pupilX + 2, pupilY + 2, 1.2, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  /**
   * Optional debug visualization for hitbox.
   */
  drawDebugHitbox(ctx) {
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 0, 0, 0.8)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.hitboxRadius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
}

// Global instance
window.pig = new Pig();
