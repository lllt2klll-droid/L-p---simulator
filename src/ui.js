import { sound } from './audio.js';
import { QUESTIONS_DATA } from './questions.js';

export class UIManager {
  constructor(tire, earth, cameraManager, renderer, scene, threeCamera) {
    this.tire = tire;
    this.earth = earth;
    this.cameraManager = cameraManager;
    this.renderer = renderer;
    this.scene = scene;
    this.threeCamera = threeCamera;

    this.input = {
      forward: false,
      backward: false,
      left: false,
      right: false,
      driveAxis: 0,
      steerAxis: 0,
      turbo: false
    };

    // Game Lifecycle State (START -> PLAYING -> QUESTION -> ENDING)
    this.gameState = 'START';
    this.currentQuestionIndex = 0;
    this.userAnswers = []; // Records 'A', 'B', 'C', 'D'
    this.distanceRolled = 0;
    this.distanceTarget = 22.0; // Distance in meters to trigger next question
    this.score = 0;

    this.setupPresets();
    this.bindDomElements();
    this.bindKeyboard();
    this.bindTouchControls();
    this.initGameUI();
  }

  setupPresets() {
    this.presets = {
      tan: {
        diameter: 3.2,
        width: 1.8,
        rimRatio: 0.58,
        rubberColor: '#282a2e',
        rimColor: '#3a3e46',
        eyeColor: '#4ea8de',
        noseSmileColor: '#ff733b',
        letterColor: '#ffd166',
        roughness: 0.65,
        metalness: 0.05,
        treadPattern: 'chevron',
        rimStyle: 'face',
        faceEnabled: true,
        gyroFace: false,
        hasSidewallRings: true,
        showTanText: true,
        antennaStyle: 'crown',
        accessory: 'crown',
        expression: 'happy'
      },
      buddy: {
        diameter: 3.2,
        width: 1.8,
        rimRatio: 0.58,
        rubberColor: '#2d3036',
        rimColor: '#3c4048',
        eyeColor: '#4ea8de',
        noseSmileColor: '#ff733b',
        letterColor: '#ffd166',
        roughness: 0.65,
        metalness: 0.05,
        treadPattern: 'chevron',
        rimStyle: 'face',
        faceEnabled: true,
        gyroFace: false,
        hasSidewallRings: true,
        showTanText: true,
        antennaStyle: 'none',
        accessory: 'none',
        expression: 'happy'
      },
      monster: {
        diameter: 3.8,
        width: 2.5,
        rimRatio: 0.52,
        rubberColor: '#1d2228',
        rimColor: '#2bd980',
        eyeColor: '#ffe600',
        noseSmileColor: '#2bd980',
        letterColor: '#2bd980',
        roughness: 0.75,
        metalness: 0.05,
        treadPattern: 'chunky',
        rimStyle: 'star',
        faceEnabled: false,
        gyroFace: false,
        hasSidewallRings: true,
        showTanText: true,
        antennaStyle: 'star',
        accessory: 'none',
        expression: 'confident'
      },
      bubblegum: {
        diameter: 3.0,
        width: 1.6,
        rimRatio: 0.62,
        rubberColor: '#f78fb3',
        rimColor: '#f8a5c2',
        eyeColor: '#63cdda',
        noseSmileColor: '#f3a683',
        letterColor: '#ffffff',
        roughness: 0.45,
        metalness: 0.02,
        treadPattern: 'heart',
        rimStyle: 'face',
        faceEnabled: true,
        gyroFace: false,
        hasSidewallRings: true,
        showTanText: true,
        antennaStyle: 'bow',
        accessory: 'bow',
        expression: 'wink'
      },
      golden: {
        diameter: 3.4,
        width: 1.7,
        rimRatio: 0.60,
        rubberColor: '#18191c',
        rimColor: '#ffd700',
        eyeColor: '#ffffff',
        noseSmileColor: '#ffcc00',
        letterColor: '#ffd700',
        roughness: 0.25,
        metalness: 0.6,
        treadPattern: 'chevron',
        rimStyle: 'spokes',
        faceEnabled: false,
        gyroFace: false,
        hasSidewallRings: true,
        showTanText: true,
        antennaStyle: 'crown',
        accessory: 'crown',
        expression: 'confident'
      },
      tractor: {
        diameter: 3.6,
        width: 2.0,
        rimRatio: 0.55,
        rubberColor: '#3b3d42',
        rimColor: '#ff9f1a',
        eyeColor: '#ffffff',
        noseSmileColor: '#ff9f1a',
        letterColor: '#ff9f1a',
        roughness: 0.8,
        metalness: 0.05,
        treadPattern: 'paddle',
        rimStyle: 'star',
        faceEnabled: false,
        gyroFace: false,
        hasSidewallRings: true,
        showTanText: false,
        antennaStyle: 'scarf',
        accessory: 'scarf',
        expression: 'happy'
      }
    };
  }

  initGameUI() {
    const startScreen = document.getElementById('start-screen');
    if (startScreen) startScreen.style.display = 'flex';

    const journeyHud = document.getElementById('journey-hud');
    if (journeyHud) journeyHud.style.display = 'none';

    const kbdGuide = document.getElementById('keyboard-guide');
    if (kbdGuide) kbdGuide.style.display = 'none';
  }

  bindDomElements() {
    // 1. START SCREEN BUTTONS
    const btnStart = document.getElementById('btn-start-game');
    if (btnStart) {
      btnStart.addEventListener('click', () => {
        sound.playClick();
        this.startGame();
      });
    }

    const btnCustomizerStart = document.getElementById('btn-open-customizer-start');
    if (btnCustomizerStart) {
      btnCustomizerStart.addEventListener('click', () => {
        sound.playClick();
        const panel = document.getElementById('customizer-panel');
        if (panel) panel.classList.remove('hidden');
      });
    }

    // 2. CUSTOMIZER TOGGLE & CLOSE
    const toggleBtn = document.getElementById('btn-toggle-customizer');
    const panel = document.getElementById('customizer-panel');
    const closeBtn = document.getElementById('btn-close-panel');

    const togglePanel = () => {
      sound.playClick();
      panel.classList.toggle('hidden');
    };

    if (toggleBtn) toggleBtn.addEventListener('click', togglePanel);
    if (closeBtn) closeBtn.addEventListener('click', () => panel.classList.add('hidden'));

    // 3. TOP BAR CAMERA & UTILITY BUTTONS
    const camBtns = document.querySelectorAll('[data-cam-mode]');
    camBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        sound.playClick();
        camBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.cameraManager.setMode(btn.dataset.camMode);
      });
    });

    const camCycleBtn = document.getElementById('btn-cam-cycle');
    if (camCycleBtn) {
      camCycleBtn.addEventListener('click', () => {
        sound.playClick();
        this.cycleCamera();
      });
    }

    const soundBtn = document.getElementById('btn-sound');
    if (soundBtn) {
      soundBtn.addEventListener('click', () => {
        const isMuted = sound.toggleMute();
        soundBtn.textContent = isMuted ? '🔇' : '🔊';
      });
    }

    const resetBtn = document.getElementById('btn-reset');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        sound.playClick();
        this.tire.resetPosition();
      });
    }

    const clearCacheBtn = document.getElementById('btn-clear-cache');
    if (clearCacheBtn) {
      clearCacheBtn.addEventListener('click', () => {
        this.clearCacheAndUpdate();
      });
    }

    const snapBtn = document.getElementById('btn-screenshot');
    if (snapBtn) {
      snapBtn.addEventListener('click', () => {
        sound.playCollect();
        this.takeScreenshot();
      });
    }

    const helpBtn = document.getElementById('btn-help');
    const helpModal = document.getElementById('help-modal');
    const helpClose = document.getElementById('btn-close-help');
    if (helpBtn && helpModal) {
      helpBtn.addEventListener('click', () => {
        sound.playClick();
        helpModal.classList.add('open');
      });
      if (helpClose) {
        helpClose.addEventListener('click', () => helpModal.classList.remove('open'));
      }
      helpModal.addEventListener('click', (e) => {
        if (e.target === helpModal) helpModal.classList.remove('open');
      });
    }

    // 4. QUESTION MODAL CONTROLS
    const btnOpenQuestionNow = document.getElementById('btn-open-question-now');
    if (btnOpenQuestionNow) {
      btnOpenQuestionNow.addEventListener('click', () => {
        sound.playClick();
        this.openQuestion(this.currentQuestionIndex);
      });
    }

    const btnNextQuestion = document.getElementById('btn-next-question');
    if (btnNextQuestion) {
      btnNextQuestion.addEventListener('click', () => {
        sound.playClick();
        this.advanceToNextQuestion();
      });
    }

    // 5. ENDING MODAL CONTROLS
    const btnReplay = document.getElementById('btn-replay');
    if (btnReplay) {
      btnReplay.addEventListener('click', () => {
        sound.playClick();
        this.restartGame();
      });
    }

    const btnSnapEnding = document.getElementById('btn-snap-ending');
    if (btnSnapEnding) {
      btnSnapEnding.addEventListener('click', () => {
        sound.playCollect();
        this.takeScreenshot();
      });
    }

    // 6. CUSTOMIZER TABS & OPTIONS
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabSections = document.querySelectorAll('.tab-content');
    tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        sound.playClick();
        tabBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const targetTab = btn.dataset.tab;
        tabSections.forEach(sec => {
          sec.style.display = sec.id === `tab-${targetTab}` ? 'flex' : 'none';
        });
      });
    });

    const presetChips = document.querySelectorAll('.preset-chip');
    presetChips.forEach(chip => {
      chip.addEventListener('click', () => {
        sound.playClick();
        const pKey = chip.dataset.preset;
        if (this.presets[pKey]) {
          this.applyPreset(this.presets[pKey]);
        }
      });
    });

    document.querySelectorAll('[data-tread]').forEach(card => {
      card.addEventListener('click', () => {
        sound.playClick();
        document.querySelectorAll('[data-tread]').forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        this.tire.updateCustomization({ treadPattern: card.dataset.tread });
      });
    });

    document.querySelectorAll('[data-rim]').forEach(card => {
      card.addEventListener('click', () => {
        sound.playClick();
        document.querySelectorAll('[data-rim]').forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        this.tire.updateCustomization({ rimStyle: card.dataset.rim });
      });
    });

    document.querySelectorAll('[data-antenna]').forEach(card => {
      card.addEventListener('click', () => {
        sound.playClick();
        document.querySelectorAll('[data-antenna]').forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        const style = card.dataset.antenna;
        this.tire.updateCustomization({ antennaStyle: style, accessory: style });
      });
    });

    document.querySelectorAll('[data-expression]').forEach(card => {
      card.addEventListener('click', () => {
        sound.playClick();
        document.querySelectorAll('[data-expression]').forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        this.tire.updateCustomization({ expression: card.dataset.expression });
      });
    });

    this.bindSlider('slider-diameter', 'val-diameter', (v) => {
      this.tire.updateCustomization({ diameter: parseFloat(v) });
    });
    this.bindSlider('slider-width', 'val-width', (v) => {
      this.tire.updateCustomization({ width: parseFloat(v) });
    });
    this.bindSlider('slider-roughness', 'val-roughness', (v) => {
      this.tire.updateCustomization({ roughness: parseFloat(v) });
    });

    this.bindColorPicker('color-rubber', (c) => this.tire.updateCustomization({ rubberColor: c }));
    this.bindColorPicker('color-rim', (c) => this.tire.updateCustomization({ rimColor: c }));
    this.bindColorPicker('color-accent', (c) => this.tire.updateCustomization({ noseSmileColor: c, eyeColor: c }));
    this.bindColorPicker('color-letter', (c) => this.tire.updateCustomization({ letterColor: c }));

    document.querySelectorAll('.swatch[data-target]').forEach(swatch => {
      swatch.addEventListener('click', () => {
        sound.playClick();
        const target = swatch.dataset.target;
        const col = swatch.dataset.color;
        const input = document.getElementById(target);
        if (input) input.value = col;

        if (target === 'color-rubber') this.tire.updateCustomization({ rubberColor: col });
        else if (target === 'color-rim') this.tire.updateCustomization({ rimColor: col });
        else if (target === 'color-accent') this.tire.updateCustomization({ noseSmileColor: col });
        else if (target === 'color-letter') this.tire.updateCustomization({ letterColor: col });
      });
    });

    const toggleTanText = document.getElementById('toggle-tan-text');
    if (toggleTanText) {
      toggleTanText.addEventListener('change', (e) => {
        sound.playClick();
        this.tire.updateCustomization({ showTanText: e.target.checked });
      });
    }

    const toggleGyro = document.getElementById('toggle-gyro');
    if (toggleGyro) {
      toggleGyro.addEventListener('change', (e) => {
        sound.playClick();
        this.tire.updateCustomization({ gyroFace: e.target.checked });
      });
    }

    const toggleEarthFace = document.getElementById('toggle-earth-face');
    if (toggleEarthFace) {
      toggleEarthFace.addEventListener('change', (e) => {
        sound.playClick();
        this.earth.setFaceVisible(e.target.checked);
      });
    }
  }

  startGame() {
    this.gameState = 'PLAYING';
    const startScreen = document.getElementById('start-screen');
    if (startScreen) startScreen.style.display = 'none';

    const journeyHud = document.getElementById('journey-hud');
    if (journeyHud) journeyHud.style.display = 'flex';

    const kbdGuide = document.getElementById('keyboard-guide');
    if (kbdGuide && window.innerWidth >= 820) kbdGuide.style.display = 'flex';

    this.currentQuestionIndex = 0;
    this.userAnswers = [];
    this.distanceRolled = 0;
    this.updateJourneyHUD();

    this.cameraManager.setMode('follow');
    sound.playJump();
  }

  openQuestion(index) {
    if (index >= QUESTIONS_DATA.length) {
      this.showEnding();
      return;
    }

    this.gameState = 'QUESTION';
    this.tire.linearSpeed = 0;

    const modal = document.getElementById('question-modal');
    const badge = document.getElementById('q-station-badge');
    const title = document.getElementById('q-text');
    const optionsContainer = document.getElementById('q-options');
    const feedbackBox = document.getElementById('q-feedback-box');
    const btnNext = document.getElementById('btn-next-question');

    const q = QUESTIONS_DATA[index];
    if (badge) badge.textContent = `Trạm Dừng #${q.id}/10 🛞`;
    if (title) title.textContent = `Câu ${q.id}. ${q.question}`;

    if (feedbackBox) feedbackBox.style.display = 'none';
    if (btnNext) btnNext.style.display = 'none';

    // Populate Options A, B, C, D
    if (optionsContainer) {
      optionsContainer.innerHTML = '';
      q.options.forEach(opt => {
        const btn = document.createElement('button');
        btn.className = 'q-opt-btn';
        btn.innerHTML = `<span class="opt-key">${opt.key}</span> <span class="opt-text">${opt.text}</span>`;
        btn.addEventListener('click', () => {
          this.selectAnswer(q, opt.key, btn);
        });
        optionsContainer.appendChild(btn);
      });
    }

    if (modal) modal.classList.add('open');
    sound.playCollect();
    if (navigator.vibrate) try { navigator.vibrate(25); } catch (e) {}
  }

  selectAnswer(q, selectedKey, btnElement) {
    sound.playClick();
    if (navigator.vibrate) try { navigator.vibrate(15); } catch (e) {}

    // Highlight selected button
    document.querySelectorAll('.q-opt-btn').forEach(b => b.classList.remove('selected'));
    btnElement.classList.add('selected');

    // Record answer
    this.userAnswers[this.currentQuestionIndex] = selectedKey;

    // Show witty response
    const feedbackBox = document.getElementById('q-feedback-box');
    const feedbackText = document.getElementById('q-feedback-text');
    const btnNext = document.getElementById('btn-next-question');

    if (feedbackBox && feedbackText) {
      feedbackText.textContent = q.responses[selectedKey];
      feedbackBox.style.display = 'block';
    }

    if (btnNext) {
      btnNext.style.display = 'inline-flex';
      btnNext.innerHTML = (this.currentQuestionIndex === QUESTIONS_DATA.length - 1)
        ? '<span>👑</span> XEM KẾT THÚC HÀNH TRÌNH'
        : '<span>✨</span> TIẾP TỤC LĂN BÁNH';
    }
  }

  advanceToNextQuestion() {
    const modal = document.getElementById('question-modal');
    if (modal) modal.classList.remove('open');

    this.currentQuestionIndex++;
    this.distanceRolled = 0;

    if (this.currentQuestionIndex >= QUESTIONS_DATA.length) {
      this.showEnding();
    } else {
      this.gameState = 'PLAYING';
      this.updateJourneyHUD();
    }
  }

  updateJourneyHUD() {
    const textEl = document.getElementById('progress-question-text');
    const fillEl = document.getElementById('progress-bar-fill');
    if (textEl) {
      textEl.textContent = `Câu ${this.currentQuestionIndex + 1}/10`;
    }
    if (fillEl) {
      const pct = Math.min(100, Math.round(((this.currentQuestionIndex) / 10) * 100));
      fillEl.style.width = `${Math.max(10, pct)}%`;
    }
  }

  showEnding() {
    this.gameState = 'ENDING';
    this.tire.linearSpeed = 0;

    const modal = document.getElementById('ending-modal');
    const badge = document.getElementById('ending-badge');
    const title = document.getElementById('ending-title');
    const quote = document.getElementById('ending-quote');
    const desc = document.getElementById('ending-desc');
    const summary = document.getElementById('stat-answers-summary');
    const titleStat = document.getElementById('stat-title');
    const cContainer = document.getElementById('c-particles-container');

    // Strict Evaluation Order from PLAN.md Section 9:
    // 1. Condition B (Highest Priority): All 10 answers are 'C'
    const isAllC = this.userAnswers.length === 10 && this.userAnswers.every(ans => ans === 'C');

    // 2. Condition A: >= 6 superOption answers
    let superCount = 0;
    this.userAnswers.forEach((ans, idx) => {
      if (QUESTIONS_DATA[idx] && ans === QUESTIONS_DATA[idx].superOption) {
        superCount++;
      }
    });
    const isSuperTire = superCount >= 6;

    if (summary) {
      summary.textContent = this.userAnswers.join(' - ');
    }

    if (cContainer) cContainer.innerHTML = '';

    if (isAllC) {
      // Ending B — CHỌN TOÀN C
      if (badge) badge.textContent = '🌟 KẾT THÚC BÍ MẬT';
      if (title) title.textContent = 'THÁNH CHỌN C';
      if (quote) quote.textContent = '“Bạn không cần đáp án đúng. Bạn chỉ cần đáp án C.”';
      if (desc) desc.textContent = 'Đỉnh cao của sự kiên định! Dù cuộc đời có ra đề trắc nghiệm oái oăm thế nào, tôn chỉ của bạn là: Cứ C Là Chọn!';
      if (titleStat) titleStat.textContent = 'Thánh C Bất Chấp Lý Lẽ';

      // Flying 'C' characters around the screen
      this.spawnFloatingCParticles();
      sound.playCollect();

    } else if (isSuperTire) {
      // Ending A — SIÊU LỐP
      if (badge) badge.textContent = '🏆 KẾT THÚC SIÊU CẤP';
      if (title) title.textContent = 'SIÊU LỐP BẤT DIỆT';
      if (quote) quote.textContent = '“Không phải ai cũng xứng đáng với áp suất của bạn!”';
      if (desc) desc.textContent = `Bạn đã chọn ${superCount}/10 câu trả lời siêu lốp bản lĩnh! Sức chịu đựng và độ dày cao su của bạn đã đạt đẳng cấp vô địch thiên hạ!`;
      if (titleStat) titleStat.textContent = 'Siêu Lốp Bọc Thép Hạng Nhất';

      this.tire.updateCustomization({ antennaStyle: 'crown', accessory: 'crown' });
      sound.playCollect();

    } else {
      // Ending C — THỨC TỈNH (Default fallback)
      if (badge) badge.textContent = '✨ KẾT THÚC THỨC TỈNH';
      if (title) title.textContent = 'THỨC TỈNH RỰC RỠ';
      if (quote) quote.textContent = '“Bạn không phải lốp dự phòng của cuộc đời ai cả. Hãy tự lăn con đường của mình!”';
      if (desc) desc.textContent = 'Đã đến lúc đóng nắp cốp xe lại, gạt bỏ quá khứ sơ-cua và tự tin lăn bánh tự do dưới ánh mặt trời rạng rỡ!';
      if (titleStat) titleStat.textContent = 'Lốp Xe Tự Do & Bản Lĩnh';

      this.tire.updateCustomization({ antennaStyle: 'glasses', accessory: 'glasses', expression: 'confident' });
      sound.playJump();
    }

    if (modal) modal.classList.add('open');
  }

  spawnFloatingCParticles() {
    const container = document.getElementById('c-particles-container');
    if (!container) return;
    container.innerHTML = '';

    for (let i = 0; i < 35; i++) {
      const c = document.createElement('div');
      c.className = 'floating-c-letter';
      c.textContent = 'C';
      c.style.left = `${Math.random() * 95}vw`;
      c.style.top = `${Math.random() * 95}vh`;
      c.style.animationDelay = `${Math.random() * 2}s`;
      c.style.fontSize = `${24 + Math.random() * 38}px`;
      container.appendChild(c);
    }
  }

  restartGame() {
    const endingModal = document.getElementById('ending-modal');
    if (endingModal) endingModal.classList.remove('open');

    const cContainer = document.getElementById('c-particles-container');
    if (cContainer) cContainer.innerHTML = '';

    this.currentQuestionIndex = 0;
    this.userAnswers = [];
    this.distanceRolled = 0;
    this.tire.resetPosition();

    // Return to start screen
    this.gameState = 'START';
    this.initGameUI();
  }

  updateGameProgress(deltaDist) {
    if (this.gameState !== 'PLAYING') return;

    this.distanceRolled += Math.abs(deltaDist);
    if (this.distanceRolled >= this.distanceTarget) {
      this.distanceRolled = 0;
      this.openQuestion(this.currentQuestionIndex);
    }
  }

  bindSlider(id, labelId, onChange) {
    const el = document.getElementById(id);
    const lbl = document.getElementById(labelId);
    if (!el) return;
    el.addEventListener('input', (e) => {
      if (lbl) lbl.textContent = e.target.value;
      onChange(e.target.value);
    });
  }

  bindColorPicker(id, onChange) {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('input', (e) => {
      onChange(e.target.value);
    });
  }

  applyPreset(preset) {
    this.tire.updateCustomization(preset);

    const setVal = (id, v) => {
      const el = document.getElementById(id);
      if (el) el.value = v;
    };
    const setLbl = (id, v) => {
      const el = document.getElementById(id);
      if (el) el.textContent = v;
    };

    setVal('slider-diameter', preset.diameter);
    setLbl('val-diameter', preset.diameter);
    setVal('slider-width', preset.width);
    setLbl('val-width', preset.width);
    setVal('slider-roughness', preset.roughness);
    setLbl('val-roughness', preset.roughness);

    setVal('color-rubber', preset.rubberColor);
    setVal('color-rim', preset.rimColor);
    setVal('color-accent', preset.noseSmileColor);
    if (preset.letterColor) setVal('color-letter', preset.letterColor);

    const toggleTanEl = document.getElementById('toggle-tan-text');
    if (toggleTanEl && preset.showTanText !== undefined) {
      toggleTanEl.checked = preset.showTanText;
    }

    document.querySelectorAll('[data-tread]').forEach(c => {
      c.classList.toggle('selected', c.dataset.tread === preset.treadPattern);
    });

    document.querySelectorAll('[data-rim]').forEach(c => {
      c.classList.toggle('selected', c.dataset.rim === preset.rimStyle);
    });

    document.querySelectorAll('[data-antenna]').forEach(c => {
      c.classList.toggle('selected', c.dataset.antenna === preset.antennaStyle);
    });

    document.querySelectorAll('[data-expression]').forEach(c => {
      c.classList.toggle('selected', c.dataset.expression === (preset.expression || 'happy'));
    });
  }

  bindKeyboard() {
    window.addEventListener('keydown', (e) => {
      sound.ensureContext();
      if (this.gameState === 'QUESTION' || this.gameState === 'START' || this.gameState === 'ENDING') {
        return; // Don't move tire while modal is open
      }
      switch (e.code) {
        case 'KeyW':
        case 'ArrowUp':
          this.input.forward = true;
          break;
        case 'KeyS':
        case 'ArrowDown':
          this.input.backward = true;
          break;
        case 'KeyA':
        case 'ArrowLeft':
          this.input.left = true;
          break;
        case 'KeyD':
        case 'ArrowRight':
          this.input.right = true;
          break;
        case 'ShiftLeft':
        case 'ShiftRight':
          this.input.turbo = true;
          break;
        case 'Space':
          e.preventDefault();
          if (this.tire.jump()) {
            sound.playJump();
            if (navigator.vibrate) try { navigator.vibrate(20); } catch (err) {}
          }
          break;
        case 'KeyH':
          sound.playHonk();
          break;
        case 'KeyC':
          this.cycleCamera();
          break;
        case 'KeyR':
          this.tire.resetPosition();
          break;
      }
    });

    window.addEventListener('keyup', (e) => {
      switch (e.code) {
        case 'KeyW':
        case 'ArrowUp':
          this.input.forward = false;
          break;
        case 'KeyS':
        case 'ArrowDown':
          this.input.backward = false;
          break;
        case 'KeyA':
        case 'ArrowLeft':
          this.input.left = false;
          break;
        case 'KeyD':
        case 'ArrowRight':
          this.input.right = false;
          break;
        case 'ShiftLeft':
        case 'ShiftRight':
          this.input.turbo = false;
          break;
      }
    });
  }

  bindTouchControls() {
    const zone = document.getElementById('joystick-zone');
    const base = document.getElementById('joystick-base');
    const knob = document.getElementById('joystick-knob');

    if (zone && base && knob) {
      let activePointerId = null;
      let startX = 0;
      let startY = 0;
      const maxRadius = 45;

      const onPointerDown = (e) => {
        if (this.gameState === 'QUESTION' || this.gameState === 'START' || this.gameState === 'ENDING') return;
        if (activePointerId !== null) return;
        activePointerId = e.pointerId;
        zone.setPointerCapture(e.pointerId);
        sound.ensureContext();

        const rect = base.getBoundingClientRect();
        startX = rect.left + rect.width / 2;
        startY = rect.top + rect.height / 2;

        handlePointerMove(e);
      };

      const handlePointerMove = (e) => {
        if (e.pointerId !== activePointerId) return;

        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        const dist = Math.hypot(dx, dy);

        let clampedX = dx;
        let clampedY = dy;
        if (dist > maxRadius) {
          clampedX = (dx / dist) * maxRadius;
          clampedY = (dy / dist) * maxRadius;
        }

        knob.style.transform = `translate(${clampedX}px, ${clampedY}px)`;

        // Analog input:
        this.input.driveAxis = -clampedY / maxRadius;
        this.input.steerAxis = -clampedX / maxRadius;
      };

      const onPointerUp = (e) => {
        if (e.pointerId !== activePointerId) return;
        try { zone.releasePointerCapture(e.pointerId); } catch (err) {}
        activePointerId = null;

        knob.style.transform = 'translate(0px, 0px)';
        this.input.driveAxis = 0;
        this.input.steerAxis = 0;
      };

      zone.addEventListener('pointerdown', onPointerDown);
      zone.addEventListener('pointermove', handlePointerMove);
      zone.addEventListener('pointerup', onPointerUp);
      zone.addEventListener('pointercancel', onPointerUp);
    }

    const jumpBtn = document.getElementById('touch-jump');
    if (jumpBtn) {
      jumpBtn.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        sound.ensureContext();
        if (this.gameState === 'PLAYING' && this.tire.jump()) {
          sound.playJump();
          if (navigator.vibrate) try { navigator.vibrate(22); } catch (err) {}
        }
      });
    }

    const turboBtn = document.getElementById('touch-turbo');
    if (turboBtn) {
      const setTurbo = (state) => {
        this.input.turbo = state;
        turboBtn.classList.toggle('active', state);
      };
      turboBtn.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        sound.ensureContext();
        setTurbo(true);
      });
      const endTurbo = (e) => {
        e.preventDefault();
        setTurbo(false);
      };
      turboBtn.addEventListener('pointerup', endTurbo);
      turboBtn.addEventListener('pointercancel', endTurbo);
      turboBtn.addEventListener('pointerleave', endTurbo);
    }

    const honkBtn = document.getElementById('touch-honk');
    if (honkBtn) {
      honkBtn.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        sound.ensureContext();
        sound.playHonk();
        if (navigator.vibrate) try { navigator.vibrate(15); } catch (err) {}
      });
    }
  }

  cycleCamera() {
    const modes = ['follow', 'orbit', 'planet'];
    const currentIdx = modes.indexOf(this.cameraManager.mode);
    const nextMode = modes[(currentIdx + 1) % modes.length];
    this.cameraManager.setMode(nextMode);

    const camBtns = document.querySelectorAll('[data-cam-mode]');
    camBtns.forEach(b => b.classList.toggle('active', b.dataset.camMode === nextMode));

    const mobileCam = document.getElementById('btn-cam-cycle');
    if (mobileCam) {
      const labels = {
        follow: '🎥 Follow',
        orbit: '🔄 Orbit',
        planet: '🌍 Planet'
      };
      mobileCam.textContent = labels[nextMode];
    }
  }

  async clearCacheAndUpdate() {
    sound.playCollect();
    if (navigator.vibrate) {
      try { navigator.vibrate([30, 40, 50]); } catch (e) {}
    }

    const toast = document.getElementById('toast-notify');
    const toastText = document.getElementById('toast-text');
    if (toast && toastText) {
      toastText.textContent = '🧹 Đang dọn sạch cache & nạp phiên bản mới...';
      toast.classList.add('show');
    }

    try {
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(name => caches.delete(name)));
      }
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map(reg => reg.unregister()));
      }
      try {
        localStorage.clear();
        sessionStorage.clear();
      } catch (err) {}
    } catch (err) {
      console.warn('Error during cache clear:', err);
    }

    setTimeout(() => {
      const cleanUrl = window.location.origin + window.location.pathname;
      window.location.replace(`${cleanUrl}?v=${Date.now()}`);
    }, 500);
  }

  takeScreenshot() {
    this.renderer.render(this.scene, this.threeCamera);
    const dataURL = this.renderer.domElement.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = dataURL;
    a.download = `lop-si-tinh-${Date.now()}.png`;
    a.click();
  }
}
