/**
 * ============================================================================
 * FARTY PIG - UI CONTROLLER & LOCAL STORAGE (ui.js)
 * ============================================================================
 * Handles all user interface transitions, modal dialogues, arcade buttons,
 * high score persistence via localStorage, and medal calculations.
 */

class UIManager {
  constructor() {
    // Screen Elements
    this.screenMenu = document.getElementById('screen-menu');
    this.screenReady = document.getElementById('screen-ready');
    this.screenPaused = document.getElementById('screen-paused');
    this.screenGameOver = document.getElementById('screen-gameover');
    this.modalInstructions = document.getElementById('modal-instructions');

    // HUD Elements
    this.hud = document.getElementById('hud');
    this.hudScore = document.getElementById('hud-score');
    this.hudPoop = document.getElementById('hud-poop');

    // Score & Stats Badges
    this.menuHighScore = document.getElementById('menu-high-score');
    this.gameoverScore = document.getElementById('gameover-score');
    this.gameoverBest = document.getElementById('gameover-best');
    this.gameoverPoop = document.getElementById('gameover-poop');
    this.medalIcon = document.getElementById('medal-icon');
    this.medalText = document.getElementById('medal-text');

    // Action Buttons
    this.btnPlay = document.getElementById('btn-play');
    this.btnRestart = document.getElementById('btn-restart');
    this.btnResume = document.getElementById('btn-resume');
    this.btnRestartPaused = document.getElementById('btn-restart-paused');
    this.btnPause = document.getElementById('btn-pause');
    this.btnSound = document.getElementById('btn-sound');
    this.btnToggleBgm = document.getElementById('btn-toggle-bgm');
    this.bgmStatusText = document.getElementById('bgm-status-text');
    this.btnHowToPlay = document.getElementById('btn-how-to-play');
    this.btnCloseInstructions = document.getElementById('btn-close-instructions');

    // Load persisted high scores and settings
    this.loadHighScores();
    this.initEvents();
  }

  /**
   * Safely reads high score from localStorage (protected by try/catch).
   */
  loadHighScores() {
    let best = 0;
    let totalPoop = 0;

    try {
      best = parseInt(localStorage.getItem(CONFIG.STORAGE_KEYS.HIGH_SCORE) || '0', 10);
      totalPoop = parseInt(localStorage.getItem(CONFIG.STORAGE_KEYS.TOTAL_POOP) || '0', 10);
    } catch (e) {
      console.warn('LocalStorage access restricted, using in-memory high score.');
    }

    if (window.gameEngine) {
      window.gameEngine.highScore = best;
    }
    if (this.menuHighScore) {
      this.menuHighScore.textContent = best;
    }
  }

  /**
   * Saves new high score to localStorage if beaten.
   */
  saveHighScore(currentScore, poopEarned) {
    let currentBest = 0;
    let totalPoop = 0;

    try {
      currentBest = parseInt(localStorage.getItem(CONFIG.STORAGE_KEYS.HIGH_SCORE) || '0', 10);
      totalPoop = parseInt(localStorage.getItem(CONFIG.STORAGE_KEYS.TOTAL_POOP) || '0', 10);

      if (currentScore > currentBest) {
        currentBest = currentScore;
        localStorage.setItem(CONFIG.STORAGE_KEYS.HIGH_SCORE, currentBest);
      }

      totalPoop += poopEarned;
      localStorage.setItem(CONFIG.STORAGE_KEYS.TOTAL_POOP, totalPoop);
    } catch (e) {
      console.warn('LocalStorage write failed:', e);
    }

    if (window.gameEngine) {
      window.gameEngine.highScore = currentBest;
    }
    if (this.menuHighScore) {
      this.menuHighScore.textContent = currentBest;
    }

    return currentBest;
  }

  /**
   * Connects DOM buttons to game engine events.
   */
  initEvents() {
    // Play button
    this.btnPlay.addEventListener('click', (e) => {
      e.stopPropagation();
      if (window.soundManager) window.soundManager.playClick();
      
      // Try screen orientation lock on mobile devices (fails gracefully if unsupported)
      if (screen.orientation && screen.orientation.lock) {
        screen.orientation.lock('landscape').catch(() => {});
      }

      window.gameEngine.setState('READY');
    });

    // Play Again button
    this.btnRestart.addEventListener('click', (e) => {
      e.stopPropagation();
      if (window.soundManager) window.soundManager.playClick();
      window.gameEngine.restartGame();
    });

    // Resume button
    this.btnResume.addEventListener('click', (e) => {
      e.stopPropagation();
      if (window.soundManager) window.soundManager.playClick();
      window.gameEngine.setState('PLAYING');
    });

    // Restart from pause menu
    this.btnRestartPaused.addEventListener('click', (e) => {
      e.stopPropagation();
      if (window.soundManager) window.soundManager.playClick();
      window.gameEngine.restartGame();
    });

    // Pause button in HUD
    this.btnPause.addEventListener('click', (e) => {
      e.stopPropagation();
      if (window.soundManager) window.soundManager.playClick();
      window.gameEngine.togglePause();
    });

    // Mute sound toggle button
    this.btnSound.addEventListener('click', (e) => {
      e.stopPropagation();
      if (window.soundManager) {
        const isMuted = window.soundManager.toggleMute();
        this.btnSound.textContent = isMuted ? '🔇' : '🔊';
      }
    });

    // BGM toggle in pause screen
    this.btnToggleBgm.addEventListener('click', (e) => {
      e.stopPropagation();
      if (window.soundManager) {
        const isEnabled = window.soundManager.toggleBGM();
        this.bgmStatusText.textContent = isEnabled ? 'ON' : 'OFF';
      }
    });

    // How to Play modal
    this.btnHowToPlay.addEventListener('click', (e) => {
      e.stopPropagation();
      if (window.soundManager) window.soundManager.playClick();
      this.modalInstructions.classList.remove('hidden');
    });

    this.btnCloseInstructions.addEventListener('click', (e) => {
      e.stopPropagation();
      if (window.soundManager) window.soundManager.playClick();
      this.modalInstructions.classList.add('hidden');
    });
  }

  /**
   * Updates UI screens according to the current state machine state.
   * @param {string} state - 'MENU' | 'READY' | 'PLAYING' | 'PAUSED' | 'GAME_OVER'
   */
  updateState(state) {
    this.screenMenu.classList.add('hidden');
    this.screenReady.classList.add('hidden');
    this.screenPaused.classList.add('hidden');
    this.screenGameOver.classList.add('hidden');

    switch (state) {
      case 'MENU':
        this.screenMenu.classList.remove('hidden');
        this.hud.style.opacity = '0';
        break;

      case 'READY':
        this.screenReady.classList.remove('hidden');
        this.hud.style.opacity = '1';
        break;

      case 'PLAYING':
        this.hud.style.opacity = '1';
        break;

      case 'PAUSED':
        this.screenPaused.classList.remove('hidden');
        break;

      case 'GAME_OVER':
        this.showGameOver();
        break;
    }
  }

  /**
   * Populates and displays the Game Over card with medal calculations.
   */
  showGameOver() {
    const score = window.gameEngine ? window.gameEngine.score : 0;
    const poop = window.gameEngine ? window.gameEngine.poopCount : 0;
    const best = this.saveHighScore(score, poop);

    this.gameoverScore.textContent = score;
    this.gameoverBest.textContent = best;
    this.gameoverPoop.textContent = `💩 ${poop}`;

    // Calculate Achievement Medal
    let medal = '🥉';
    let rank = 'Bronze Piglet!';
    if (score >= 25) {
      medal = '🥇';
      rank = 'Golden Gas Master!';
    } else if (score >= 10) {
      medal = '🥈';
      rank = 'Silver Squealer!';
    }

    this.medalIcon.textContent = medal;
    this.medalText.textContent = rank;

    if (window.soundManager) {
      window.soundManager.playGameOver();
    }

    // Delay showing the card slightly so the player sees the crash tumble
    setTimeout(() => {
      if (window.gameEngine && window.gameEngine.state === 'GAME_OVER') {
        this.screenGameOver.classList.remove('hidden');
      }
    }, 450);
  }

  setScore(score) {
    if (this.hudScore) this.hudScore.textContent = score;
  }

  setPoop(count) {
    if (this.hudPoop) this.hudPoop.textContent = count;
  }
}

// Global instance
window.addEventListener('DOMContentLoaded', () => {
  window.uiManager = new UIManager();
});
