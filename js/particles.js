/**
 * ============================================================================
 * FARTY PIG - JUICE & PARTICLE SYSTEM (particles.js)
 * ============================================================================
 * "Juice" transforms a boring technical demo into a joyful, satisfying game!
 * This particle engine manages:
 * 1. Puffy cartoon fart clouds that grow and fade away behind the pig.
 * 2. Golden sparkle bursts and '+2 💩' popups when collecting poop.
 * 3. Circling yellow stars around the pig's head when crashed.
 * 4. Fluttering straw confetti when grazing hay bales.
 */

class ParticleSystem {
  constructor() {
    this.particles = [];
    this.floatingTexts = [];
    this.orbitingStars = [];
  }

  /**
   * Resets all active particles on game restart.
   */
  reset() {
    this.particles = [];
    this.floatingTexts = [];
    this.orbitingStars = [];
  }

  /**
   * 1. Fart Gas Cloud: Spawns expanding, semi-transparent cartoon puffs.
   * @param {number} x - Spawn X coordinate
   * @param {number} y - Spawn Y coordinate
   */
  spawnFartPuff(x, y) {
    const puffCount = CONFIG.PARTICLES.FART_PUFFS_PER_FLAP;

    for (let i = 0; i < puffCount; i++) {
      // Slight greenish-tan comedy gas tint
      const colors = [
        'rgba(197, 225, 165, ', // Pastel yellow-green
        'rgba(220, 237, 200, ', // Light green-tan
        'rgba(230, 238, 156, ', // Lime tint
        'rgba(255, 249, 196, '  // Pale yellow
      ];
      const baseColor = colors[Math.floor(Math.random() * colors.length)];

      this.particles.push({
        type: 'fart',
        x: x + (Math.random() - 0.5) * 14,
        y: y + (Math.random() - 0.5) * 14,
        vx: -120 - Math.random() * 90,        // Shoots backward away from pig
        vy: (Math.random() - 0.5) * 60,       // Slight vertical dispersal
        radius: 8 + Math.random() * 7,        // Starting size
        maxRadius: 26 + Math.random() * 16,   // Growth target
        color: baseColor,
        life: 0,
        maxLife: CONFIG.PARTICLES.FART_LIFESPAN * (0.8 + Math.random() * 0.4),
      });
    }
  }

  /**
   * 2. Poop Collection Sparkles: Burst of shiny stars and glitter.
   */
  spawnSparkles(x, y) {
    const count = CONFIG.PARTICLES.SPARKLE_COUNT;
    const colors = ['#ffd700', '#ffeb3b', '#fff9c4', '#ff9800', '#ffffff'];

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 80 + Math.random() * 180;

      this.particles.push({
        type: 'sparkle',
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 3 + Math.random() * 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        life: 0,
        maxLife: 0.5 + Math.random() * 0.3,
        rotation: Math.random() * Math.PI,
        rotSpeed: (Math.random() - 0.5) * 12
      });
    }
  }

  /**
   * 3. Floating Score Text: Rises and fades gracefully.
   */
  spawnFloatingText(x, y, text) {
    this.floatingTexts.push({
      x: x,
      y: y,
      text: text,
      vy: -55, // Floats upward
      life: 0,
      maxLife: 0.85,
    });
  }

  /**
   * 4. Orbiting Dizzy Stars: Halo of cartoon stars when crashed.
   */
  spawnStars(x, y) {
    this.orbitingStars = [];
    const count = CONFIG.PARTICLES.CRASH_STAR_COUNT;

    for (let i = 0; i < count; i++) {
      this.orbitingStars.push({
        angle: (i / count) * Math.PI * 2,
        speed: 5.5,
        radiusX: 28,
        radiusY: 10,
        color: '#ffeb3b'
      });
    }
  }

  /**
   * 5. Straw Tufts: Emitted when clipping hay stacks.
   */
  spawnStrawTufts(x, y) {
    for (let i = 0; i < 8; i++) {
      this.particles.push({
        type: 'straw',
        x: x,
        y: y,
        vx: (Math.random() - 0.5) * 160,
        vy: -40 - Math.random() * 120,
        length: 8 + Math.random() * 10,
        color: '#f5c542',
        life: 0,
        maxLife: 0.6,
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 15
      });
    }
  }

  /**
   * Updates all active particles and removes expired ones (prevents memory leaks!).
   * @param {number} dt - Delta time in seconds
   */
  update(dt) {
    // 1. Update general particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life += dt;

      if (p.life >= p.maxLife) {
        this.particles.splice(i, 1);
        continue;
      }

      // Physics integration
      p.x += p.vx * dt;
      p.y += p.vy * dt;

      // Particle-specific transformations
      if (p.type === 'fart') {
        // Expand puff and decelerate horizontal velocity
        const progress = p.life / p.maxLife;
        p.currentRadius = p.radius + (p.maxRadius - p.radius) * Math.sin(progress * Math.PI * 0.5);
        p.vx *= (1 - 1.8 * dt);
      } else if (p.type === 'sparkle' || p.type === 'straw') {
        p.rotation += p.rotSpeed * dt;
        p.vy += 260 * dt; // Gravity on debris
      }
    }

    // 2. Update floating texts
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const t = this.floatingTexts[i];
      t.life += dt;
      if (t.life >= t.maxLife) {
        this.floatingTexts.splice(i, 1);
        continue;
      }
      t.y += t.vy * dt;
    }

    // 3. Update orbiting stars
    for (let star of this.orbitingStars) {
      star.angle += star.speed * dt;
    }
  }

  /**
   * Draws all active particle layers.
   * @param {CanvasRenderingContext2D} ctx 
   */
  draw(ctx) {
    // 1. Draw Fart Puffs, Sparkles, Straws
    for (let p of this.particles) {
      const alpha = Math.max(0, 1 - (p.life / p.maxLife));
      ctx.save();

      if (p.type === 'fart') {
        // Soft cartoon cloud puff with outline
        ctx.fillStyle = `${p.color}${alpha * 0.85})`;
        ctx.strokeStyle = `rgba(168, 198, 134, ${alpha * 0.5})`;
        ctx.lineWidth = 2;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.currentRadius || p.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Inner lighter puff core
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.6})`;
        ctx.beginPath();
        ctx.arc(p.x - 3, p.y - 3, (p.currentRadius || p.radius) * 0.45, 0, Math.PI * 2);
        ctx.fill();

      } else if (p.type === 'sparkle') {
        // 4-Pointed Sparkle Star
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = alpha;

        ctx.beginPath();
        ctx.moveTo(0, -p.size * 2);
        ctx.quadraticCurveTo(0, 0, p.size * 2, 0);
        ctx.quadraticCurveTo(0, 0, 0, p.size * 2);
        ctx.quadraticCurveTo(0, 0, -p.size * 2, 0);
        ctx.quadraticCurveTo(0, 0, 0, -p.size * 2);
        ctx.fill();

      } else if (p.type === 'straw') {
        // Flying hay needle
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 2.5;
        ctx.globalAlpha = alpha;
        ctx.beginPath();
        ctx.moveTo(-p.length * 0.5, 0);
        ctx.lineTo(p.length * 0.5, 0);
        ctx.stroke();
      }

      ctx.restore();
    }

    // 2. Draw Orbiting Dizzy Stars (if pig is crashed)
    if (window.pig && window.pig.isDead && this.orbitingStars.length > 0) {
      ctx.save();
      const pigX = window.pig.x;
      const pigY = window.pig.y - 32;

      for (let star of this.orbitingStars) {
        const starX = pigX + Math.cos(star.angle) * star.radiusX;
        const starY = pigY + Math.sin(star.angle) * star.radiusY;

        // Draw cute 5-point yellow cartoon star
        this.draw5PointStar(ctx, starX, starY, 5, 8, 4, star.color);
      }
      ctx.restore();
    }

    // 3. Draw Floating Score Popups
    for (let t of this.floatingTexts) {
      const progress = t.life / t.maxLife;
      const alpha = Math.max(0, 1 - progress);
      const scale = 1 + Math.sin(progress * Math.PI) * 0.3;

      ctx.save();
      ctx.translate(t.x, t.y);
      ctx.scale(scale, scale);
      ctx.font = '900 24px var(--font-chunky), Fredoka, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      // Text Stroke & Fill
      ctx.strokeStyle = `rgba(44, 26, 14, ${alpha})`;
      ctx.lineWidth = 4;
      ctx.strokeText(t.text, 0, 0);

      ctx.fillStyle = `rgba(255, 235, 59, ${alpha})`;
      ctx.fillText(t.text, 0, 0);

      ctx.restore();
    }
  }

  /**
   * Helper: draws a 5-point star on Canvas.
   */
  draw5PointStar(ctx, cx, cy, spikes, outerRadius, innerRadius, color) {
    let rot = Math.PI / 2 * 3;
    let x = cx;
    let y = cy;
    const step = Math.PI / spikes;

    ctx.save();
    ctx.fillStyle = color;
    ctx.strokeStyle = '#2c1a0e';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(cx, cy - outerRadius);

    for (let i = 0; i < spikes; i++) {
      x = cx + Math.cos(rot) * outerRadius;
      y = cy + Math.sin(rot) * outerRadius;
      ctx.lineTo(x, y);
      rot += step;

      x = cx + Math.cos(rot) * innerRadius;
      y = cy + Math.sin(rot) * innerRadius;
      ctx.lineTo(x, y);
      rot += step;
    }
    ctx.lineTo(cx, cy - outerRadius);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }
}

// Global instance
window.particleSystem = new ParticleSystem();
