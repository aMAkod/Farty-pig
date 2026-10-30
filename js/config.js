/**
 * ============================================================================
 * FARTY PIG - CONFIGURATION DASHBOARD (config.js)
 * ============================================================================
 * Welcome to the Game Designer's control room!
 * Every number that governs the speed, physics, difficulty, and size of objects
 * in the game lives here. Changing these values lets you completely reshape
 * how the game feels without ever touching the physics code!
 */

const CONFIG = {
  // --------------------------------------------------------------------------
  // 1. VIRTUAL SCREEN DIMENSIONS
  // --------------------------------------------------------------------------
  // We use a fixed 16:9 canvas coordinate system (1280 x 720).
  // The game automatically scales to fill any screen while keeping this aspect ratio.
  WORLD: {
    WIDTH: 1280,
    HEIGHT: 720,
    GROUND_HEIGHT: 110, // Height of the grassy dirt ground at the bottom
  },

  // --------------------------------------------------------------------------
  // 2. PIG PHYSICS & DYNAMICS
  // --------------------------------------------------------------------------
  PIG: {
    START_X: 280,            // Horizontal position where the pig hovers
    START_Y: 300,            // Starting vertical height
    WIDTH: 78,               // Visual width
    HEIGHT: 62,              // Visual height
    HITBOX_RADIUS: 26,       // Forgiving inner circle hitbox radius
    
    GRAVITY: 1450,           // Downward acceleration in pixels per second squared
    FLAP_IMPULSE: -520,      // Upward burst velocity applied on each fart/flap
    MAX_FALL_SPEED: 850,     // Terminal velocity (prevents infinite falling acceleration)
    
    // Rotation & Tilting (in radians)
    MIN_ROTATION: -0.42,     // ~ -24 degrees (pointing up when farting)
    MAX_ROTATION: 1.25,      // ~ +71 degrees (nosediving downward when dropping)
    ROTATION_SPEED: 2.8,     // How swiftly the pig tilts forward while falling
  },

  // --------------------------------------------------------------------------
  // 3. HAY BALE OBSTACLES (The Towers)
  // --------------------------------------------------------------------------
  HAY: {
    WIDTH: 115,              // Width of each hay bale stack
    INITIAL_SPEED: 230,      // Pixels per second the obstacles move left
    MAX_SPEED: 390,          // Speed cap at high scores
    SPEED_INCREASE: 6,       // Speed added for every point scored
    
    INITIAL_GAP: 225,        // Vertical clearance gap between top & bottom hay stacks
    MIN_GAP: 165,            // Narrowest gap allowed at maximum difficulty
    GAP_SHRINK_PER_SCORE: 1.5,// Gap shrinkage per point scored
    
    SPAWN_INTERVAL: 1.85,    // Seconds between spawning new hay bale stacks
    MIN_TOP_HEIGHT: 70,      // Minimum height of top hay stack
  },

  // --------------------------------------------------------------------------
  // 4. POOP COLLECTIBLES & FLIES
  // --------------------------------------------------------------------------
  POOP: {
    WIDTH: 44,               // Width of poop sprite
    HEIGHT: 40,              // Height of poop sprite
    HITBOX_RADIUS: 22,       // Pickup collection radius
    POINTS: 2,               // Bonus score awarded per poop
    BOB_SPEED: 4.5,          // Floating bob cycle speed (radians/sec)
    BOB_AMPLITUDE: 10,       // Vertical floating distance in pixels
    FLY_COUNT: 3,            // Number of animated flies buzzing around each poop
  },

  // --------------------------------------------------------------------------
  // 5. PARTICLE EFFECTS (Juice!)
  // --------------------------------------------------------------------------
  PARTICLES: {
    FART_PUFFS_PER_FLAP: 7,  // Number of gas cloud circles spawned per fart
    FART_LIFESPAN: 0.65,     // Lifespan of fart smoke in seconds
    SPARKLE_COUNT: 14,       // Sparkles that burst when collecting poop
    CRASH_STAR_COUNT: 5,     // Stars that circle the pig's head when dizzy
  },

  // --------------------------------------------------------------------------
  // 6. AUDIO & VOLUME CONTROL
  // --------------------------------------------------------------------------
  AUDIO: {
    MASTER_VOLUME: 0.7,      // 0.0 to 1.0 overall volume
    SFX_VOLUME: 0.85,        // Sound effects volume
    BGM_VOLUME: 0.30,        // Background music volume
  },

  // --------------------------------------------------------------------------
  // 7. SCORING & STORAGE
  // --------------------------------------------------------------------------
  STORAGE_KEYS: {
    HIGH_SCORE: 'farty_pig_high_score',
    TOTAL_POOP: 'farty_pig_total_poop',
    MUTED: 'farty_pig_audio_muted',
    BGM_ENABLED: 'farty_pig_bgm_enabled',
  }
};

// Freeze the configuration in development to prevent accidental mutations
Object.freeze(CONFIG);

