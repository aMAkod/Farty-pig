/**
 * ============================================================================
 * FARTY PIG - OBSTACLES & POOP COLLECTIBLES (obstacles.js)
 * ============================================================================
 * This system brings the world to life with:
 * 1. Procedural Stacked Golden Hay Bales tied with twine rope & loose straw wisps.
 * 2. Swirly Brown Cartoon Poop collectibles bobbing in the gaps with buzzing flies!
 * 3. Forgiving circular/AABB collision detection for maximum arcade fun.
 * 4. Progressive difficulty scaling (speed increases and gap tightens).
 */

class ObstacleManager {
  constructor() {
    this.obstacles = [];
    this.poops = [];
    this.spawnTimer = 0;
    this.animTime = 0;
  }

  /**
   * Clears all active obstacles and reset timers.
   */
  reset() {
    this.obstacles = [];
    this.poops = [];
    this.spawnTimer = 0.5; // Quick initial spawn after start
    this.animTime = 0;
  }

  /**
   * Spawns a pair of top and bottom hay bale towers with a poop collectible in the gap.
   */
  spawn() {
    const currentScore = window.gameEngine ? window.gameEngine.score : 0;

    // Dynamic difficulty: Gap gradually narrows as score climbs
    const gapShrink = Math.min(
      currentScore * CONFIG.HAY.GAP_SHRINK_PER_SCORE,
      CONFIG.HAY.INITIAL_GAP - CONFIG.HAY.MIN_GAP
    );
    const gapHeight = CONFIG.HAY.INITIAL_GAP - gapShrink;

    // Playable vertical area between ceiling and ground
    const groundY = CONFIG.WORLD.HEIGHT - CONFIG.WORLD.GROUND_HEIGHT;
    const minTop = CONFIG.HAY.MIN_TOP_HEIGHT;
    const maxTop = groundY - gapHeight - 80;

    // Randomized gap position
    const topHeight = minTop + Math.random() * (maxTop - minTop);
    const bottomY = topHeight + gapHeight;
    const bottomHeight = groundY - bottomY;

    const obstacleX = CONFIG.WORLD.WIDTH + 20;

    // Add Hay Tower Obstacle
    this.obstacles.push({
      x: obstacleX,
      width: CONFIG.HAY.WIDTH,
      topHeight: topHeight,
      bottomY: bottomY,
      bottomHeight: bottomHeight,
      passed: false
    });

    // 75% chance to spawn a swirly poop collectible inside the gap
    if (Math.random() < 0.75) {
      const poopY = topHeight + gapHeight * 0.5;
      
      // Setup 3 orbiting flies
      const flies = [];
      for (let i = 0; i < CONFIG.POOP.FLY_COUNT; i++) {
        flies.push({
          angle: (i / CONFIG.POOP.FLY_COUNT) * Math.PI * 2,
          radiusX: 20 + Math.random() * 8,
          radiusY: 10 + Math.random() * 6,
          speed: 4.5 + Math.random() * 3.0,
          wingPhase: 0
        });
      }

      this.poops.push({
        x: obstacleX + CONFIG.HAY.WIDTH * 0.5,
        baseY: poopY,
        y: poopY,
        collected: false,
        flies: flies
      });
    }
  }

  /**
   * Main update step: moves obstacles, checks scoring, and detects collisions.
   * @param {number} dt - Delta time in seconds
   */
  update(dt) {
    this.animTime += dt;

    // Calculate current speed with dynamic difficulty ramp
    const currentScore = window.gameEngine ? window.gameEngine.score : 0;
    const currentSpeed = Math.min(
      CONFIG.HAY.INITIAL_SPEED + currentScore * CONFIG.HAY.SPEED_INCREASE,
      CONFIG.HAY.MAX_SPEED
    );

    // Spawn countdown
    this.spawnTimer -= dt;
    if (this.spawnTimer <= 0) {
      this.spawn();
      this.spawnTimer = CONFIG.HAY.SPAWN_INTERVAL;
    }

    const pig = window.pig;
    const pigHitbox = pig ? pig.getHitbox() : null;

    // 1. Update Hay Obstacles
    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      const obs = this.obstacles[i];
      obs.x -= currentSpeed * dt;

      // Score check: pig passes center of hay stack
      if (!obs.passed && pig && pig.x > obs.x + obs.width * 0.5) {
        obs.passed = true;
        if (window.gameEngine) {
          window.gameEngine.score += 1;
          if (window.uiManager) window.uiManager.setScore(window.gameEngine.score);
          if (window.soundManager) window.soundManager.playScoreDing();
        }
      }

      // Collision Check with Top and Bottom Hay Stacks
      if (pig && !pig.isDead) {
        // Forgiving hitbox: slightly shrink hay collision rectangle by 6px
        // Reason: forgiving hitboxes prevent frustration and make close evasions exciting!
        const pad = 6;
        const topRect = { x: obs.x + pad, y: 0, width: obs.width - pad * 2, height: obs.topHeight };
        const botRect = { x: obs.x + pad, y: obs.bottomY, width: obs.width - pad * 2, height: obs.bottomHeight };

        if (this.checkCircleRectCollision(pigHitbox, topRect) || 
            this.checkCircleRectCollision(pigHitbox, botRect)) {
          pig.crash();
          if (window.particleSystem) {
            window.particleSystem.spawnStrawTufts(pig.x, pig.y);
          }
          if (window.gameEngine) {
            window.gameEngine.setState('GAME_OVER');
          }
        }
      }

      // Remove off-screen obstacles to eliminate memory leaks
      if (obs.x + obs.width < -60) {
        this.obstacles.splice(i, 1);
      }
    }

    // 2. Update Poop Collectibles & Orbiting Flies
    for (let i = this.poops.length - 1; i >= 0; i--) {
      const poop = this.poops[i];
      poop.x -= currentSpeed * dt;

      // Sinusoidal floating bob
      poop.y = poop.baseY + Math.sin(this.animTime * CONFIG.POOP.BOB_SPEED) * CONFIG.POOP.BOB_AMPLITUDE;

      // Update flies
      for (let fly of poop.flies) {
        fly.angle += fly.speed * dt;
        fly.wingPhase += 45 * dt;
      }

      // Check Collection Collision with Pig
      if (pig && !pig.isDead && !poop.collected) {
        const dx = pig.x - poop.x;
        const dy = pig.y - poop.y;
        const dist = Math.hypot(dx, dy);

        if (dist < pigHitbox.radius + CONFIG.POOP.HITBOX_RADIUS) {
          poop.collected = true;
          pig.collectPoop();

          if (window.gameEngine) {
            window.gameEngine.score += CONFIG.POOP.POINTS;
            window.gameEngine.poopCount += 1;
            if (window.uiManager) {
              window.uiManager.setScore(window.gameEngine.score);
              window.uiManager.setPoop(window.gameEngine.poopCount);
            }
          }

          if (window.soundManager) {
            window.soundManager.playPoopCollect();
          }
        }
      }

      // Remove collected or off-screen poops
      if (poop.collected || poop.x < -60) {
        this.poops.splice(i, 1);
      }
    }
  }

  /**
   * Precision Circle vs Axis-Aligned Bounding Box (AABB) collision algorithm.
   */
  checkCircleRectCollision(circle, rect) {
    // Find closest point on rectangle to circle center
    const closestX = Math.max(rect.x, Math.min(circle.x, rect.x + rect.width));
    const closestY = Math.max(rect.y, Math.min(circle.y, rect.y + rect.height));

    // Distance from circle center to closest point
    const dx = circle.x - closestX;
    const dy = circle.y - closestY;
    return (dx * dx + dy * dy) < (circle.radius * circle.radius);
  }

  /**
   * Draws all active obstacles and poop collectibles.
   * @param {CanvasRenderingContext2D} ctx 
   */
  draw(ctx) {
    // 1. Draw Hay Bale Stacks
    for (let obs of this.obstacles) {
      // Top Hay Stack (hanging down from ceiling)
      this.drawHayStack(ctx, obs.x, 0, obs.width, obs.topHeight, true);

      // Bottom Hay Stack (rising up from ground)
      this.drawHayStack(ctx, obs.x, obs.bottomY, obs.width, obs.bottomHeight, false);
    }

    // 2. Draw Poop Collectibles
    for (let poop of this.poops) {
      if (!poop.collected) {
        this.drawPoop(ctx, poop.x, poop.y, poop.flies);
      }
    }
  }

  /**
   * Draws a procedurally stacked tower of golden hay bales with twine rope and straw wisps.
   * Matches the visual aesthetic of Reference Image 2!
   */
  drawHayStack(ctx, x, y, width, height, isTop) {
    ctx.save();

    const baleHeight = 52;
    const numBales = Math.ceil(height / baleHeight);

    for (let i = 0; i < numBales; i++) {
      let baleY = isTop ? (height - (i + 1) * baleHeight) : (y + i * baleHeight);
      let curBaleH = baleHeight;

      // Clip partial bale at boundary
      if (isTop && baleY < 0) {
        curBaleH += baleY;
        baleY = 0;
      } else if (!isTop && (baleY + curBaleH > y + height)) {
        curBaleH = (y + height) - baleY;
      }

      if (curBaleH <= 4) continue;

      this.drawSingleHayBale(ctx, x, baleY, width, curBaleH);
    }

    ctx.restore();
  }

  /**
   * Draws an individual golden hay bale with twine ties and loose straw tufts.
   */
  drawSingleHayBale(ctx, x, y, width, height) {
    ctx.save();

    // 1. Rich Golden-Yellow Bale Gradient
    const hayGrad = ctx.createLinearGradient(x, y, x + width, y + height);
    hayGrad.addColorStop(0, '#f9d342'); // Bright golden highlight
    hayGrad.addColorStop(0.5, '#f5c542'); // Golden yellow
    hayGrad.addColorStop(1, '#c79018');   // Amber shadow depth

    ctx.fillStyle = hayGrad;
    ctx.strokeStyle = '#2c1a0e';
    ctx.lineWidth = 3.5;

    // Rounded rectangle bale outline
    ctx.beginPath();
    ctx.roundRect(x, y, width, height, 8);
    ctx.fill();
    ctx.stroke();

    // 2. Straw Texture Striations (Golden flecks)
    ctx.strokeStyle = 'rgba(255, 245, 157, 0.65)';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    for (let offset = 10; offset < width - 10; offset += 16) {
      ctx.moveTo(x + offset, y + 4);
      ctx.lineTo(x + offset + 6, y + height - 4);
    }
    ctx.stroke();

    // 3. Twine Rope Ties (Cream-white cord tied across bale)
    ctx.strokeStyle = '#fff8e1';
    ctx.lineWidth = 3.5;
    
    // Horizontal Twine Line
    const twineY1 = y + height * 0.38;
    const twineY2 = y + height * 0.68;

    ctx.beginPath();
    ctx.moveTo(x, twineY1);
    ctx.lineTo(x + width, twineY1);
    if (height > 35) {
      ctx.moveTo(x, twineY2);
      ctx.lineTo(x + width, twineY2);
    }
    ctx.stroke();

    // Twine Rope Shading Outline
    ctx.strokeStyle = '#8d6e63';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(x, twineY1 + 2);
    ctx.lineTo(x + width, twineY1 + 2);
    if (height > 35) {
      ctx.moveTo(x, twineY2 + 2);
      ctx.lineTo(x + width, twineY2 + 2);
    }
    ctx.stroke();

    // Vertical Cross Twine
    ctx.strokeStyle = '#fff8e1';
    ctx.lineWidth = 3;
    const twineX1 = x + width * 0.35;
    const twineX2 = x + width * 0.68;
    ctx.beginPath();
    ctx.moveTo(twineX1, y);
    ctx.lineTo(twineX1, y + height);
    ctx.moveTo(twineX2, y);
    ctx.lineTo(twineX2, y + height);
    ctx.stroke();

    // 4. Loose Straw Tufts Poking Out around the edges
    ctx.strokeStyle = '#f5c542';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    // Left edge tufts
    ctx.moveTo(x, y + 10);
    ctx.lineTo(x - 6, y + 8);
    ctx.moveTo(x, y + height - 12);
    ctx.lineTo(x - 7, y + height - 14);
    // Right edge tufts
    ctx.moveTo(x + width, y + 14);
    ctx.lineTo(x + width + 7, y + 12);
    ctx.moveTo(x + width, y + height - 8);
    ctx.lineTo(x + width + 8, y + height - 6);
    ctx.stroke();

    ctx.restore();
  }

  /**
   * Draws the cute Swirly Brown Cartoon Poop and Orbiting Flies!
   * Matches Reference Image 3 perfectly!
   */
  drawPoop(ctx, x, y, flies) {
    ctx.save();
    ctx.translate(x, y);

    // Warm ambient glow behind the poop
    const glowGrad = ctx.createRadialGradient(0, 0, 4, 0, 0, 28);
    glowGrad.addColorStop(0, 'rgba(255, 235, 59, 0.35)');
    glowGrad.addColorStop(1, 'rgba(255, 235, 59, 0)');
    ctx.fillStyle = glowGrad;
    ctx.beginPath();
    ctx.arc(0, 0, 28, 0, Math.PI * 2);
    ctx.fill();

    // Outline and base color
    ctx.strokeStyle = '#2c1a0e';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Tier 1: Wide Bottom Coil
    const t1Grad = ctx.createLinearGradient(0, 6, 0, 18);
    t1Grad.addColorStop(0, '#8d6e63');
    t1Grad.addColorStop(1, '#5d4037');
    ctx.fillStyle = t1Grad;
    ctx.beginPath();
    ctx.ellipse(0, 12, 19, 7.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Specular shine on bottom coil
    ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.beginPath();
    ctx.ellipse(-6, 9, 7, 2.2, -0.15, 0, Math.PI * 2);
    ctx.fill();

    // Tier 2: Middle Coil
    const t2Grad = ctx.createLinearGradient(0, -2, 0, 10);
    t2Grad.addColorStop(0, '#a1887f');
    t2Grad.addColorStop(1, '#6d4c41');
    ctx.fillStyle = t2Grad;
    ctx.beginPath();
    ctx.ellipse(0, 4, 15, 6.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Tier 3: Swirly Top Peak with curly tip
    const t3Grad = ctx.createLinearGradient(0, -14, 0, 0);
    t3Grad.addColorStop(0, '#bcaaa4');
    t3Grad.addColorStop(1, '#795548');
    ctx.fillStyle = t3Grad;

    ctx.beginPath();
    ctx.moveTo(-10, 2);
    ctx.quadraticCurveTo(-11, -8, -2, -12);
    // Curl tip
    ctx.quadraticCurveTo(4, -16, 2, -18);
    ctx.quadraticCurveTo(0, -18, -1, -15);
    ctx.quadraticCurveTo(6, -10, 9, 2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Little cartoon steam aroma squiggle
    ctx.strokeStyle = 'rgba(78, 52, 46, 0.55)';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(0, -20);
    ctx.quadraticCurveTo(-4, -25, 0, -29);
    ctx.quadraticCurveTo(4, -33, 0, -37);
    ctx.stroke();

    // Orbiting Buzzing Flies
    if (flies) {
      for (let fly of flies) {
        const flyX = Math.cos(fly.angle) * fly.radiusX;
        const flyY = Math.sin(fly.angle) * fly.radiusY;

        ctx.save();
        ctx.translate(flyX, flyY);

        // Fly Body
        ctx.fillStyle = '#212121';
        ctx.beginPath();
        ctx.ellipse(0, 0, 2.8, 2, 0, 0, Math.PI * 2);
        ctx.fill();

        // Vibrating Translucent Wings
        const wingFlutter = Math.sin(fly.wingPhase) * 2.5;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
        ctx.beginPath();
        ctx.ellipse(-1.5, -2.5 + wingFlutter * 0.3, 2.5, 1.2, -0.6, 0, Math.PI * 2);
        ctx.ellipse(1.5, -2.5 - wingFlutter * 0.3, 2.5, 1.2, 0.6, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      }
    }

    ctx.restore();
  }
}

// Global instance
window.obstacleManager = new ObstacleManager();
