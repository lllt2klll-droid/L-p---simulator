import { sound } from './audio.js';

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

    this.score = 0;
    this.setupPresets();
    this.bindDomElements();
    this.bindKeyboard();
    this.bindTouchControls();
  }

  setupPresets() {
    this.presets = {
      buddy: {
        diameter: 3.2,
        width: 1.8,
        rimRatio: 0.58,
        rubberColor: '#2d3036',
        rimColor: '#3c4048',
        eyeColor: '#4ea8de',
        noseSmileColor: '#ff733b',
        roughness: 0.65,
        metalness: 0.05,
        treadPattern: 'chevron',
        rimStyle: 'face',
        faceEnabled: true,
        gyroFace: false,
        antennaStyle: 'none'
      },
      monster: {
        diameter: 3.8,
        width: 2.5,
        rimRatio: 0.52,
        rubberColor: '#1d2228',
        rimColor: '#2bd980',
        eyeColor: '#ffe600',
        noseSmileColor: '#2bd980',
        roughness: 0.75,
        metalness: 0.05,
        treadPattern: 'chunky',
        rimStyle: 'star',
        faceEnabled: false,
        gyroFace: false,
        antennaStyle: 'star'
      },
      bubblegum: {
        diameter: 3.0,
        width: 1.6,
        rimRatio: 0.62,
        rubberColor: '#f78fb3',
        rimColor: '#f8a5c2',
        eyeColor: '#63cdda',
        noseSmileColor: '#f3a683',
        roughness: 0.45,
        metalness: 0.02,
        treadPattern: 'heart',
        rimStyle: 'face',
        faceEnabled: true,
        gyroFace: false,
        antennaStyle: 'heart'
      },
      golden: {
        diameter: 3.4,
        width: 1.7,
        rimRatio: 0.60,
        rubberColor: '#18191c',
        rimColor: '#ffd700',
        eyeColor: '#ffffff',
        noseSmileColor: '#ffcc00',
        roughness: 0.25,
        metalness: 0.6,
        treadPattern: 'chevron',
        rimStyle: 'spokes',
        faceEnabled: false,
        gyroFace: false,
        antennaStyle: 'none'
      },
      tractor: {
        diameter: 3.6,
        width: 2.0,
        rimRatio: 0.55,
        rubberColor: '#3b3d42',
        rimColor: '#ff9f1a',
        eyeColor: '#ffffff',
        noseSmileColor: '#ff9f1a',
        roughness: 0.8,
        metalness: 0.05,
        treadPattern: 'paddle',
        rimStyle: 'star',
        faceEnabled: false,
        gyroFace: false,
        antennaStyle: 'none'
      },
      mint: {
        diameter: 3.1,
        width: 1.7,
        rimRatio: 0.58,
        rubberColor: '#70a1ff',
        rimColor: '#ffffff',
        eyeColor: '#2ed573',
        noseSmileColor: '#ff4757',
        roughness: 0.5,
        metalness: 0.1,
        treadPattern: 'chevron',
        rimStyle: 'swirl',
        faceEnabled: false,
        gyroFace: false,
        antennaStyle: 'star'
      }
    };
  }

  bindDomElements() {
    // Customizer toggle
    const toggleBtn = document.getElementById('btn-toggle-customizer');
    const panel = document.getElementById('customizer-panel');
    const closeBtn = document.getElementById('btn-close-panel');

    const togglePanel = () => {
      sound.playClick();
      panel.classList.toggle('hidden');
    };

    if (toggleBtn) toggleBtn.addEventListener('click', togglePanel);
    if (closeBtn) closeBtn.addEventListener('click', () => panel.classList.add('hidden'));

    // Camera buttons (Desktop individual buttons & Mobile cycle button)
    const camBtns = document.querySelectorAll('[data-cam-mode]');
    camBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        sound.playClick();
        camBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const mode = btn.dataset.camMode;
        this.cameraManager.setMode(mode);
      });
    });

    // Mobile single Camera cycle button
    const camCycleBtn = document.getElementById('btn-cam-cycle');
    if (camCycleBtn) {
      camCycleBtn.addEventListener('click', () => {
        sound.playClick();
        this.cycleCamera();
      });
    }

    // Sound mute button
    const soundBtn = document.getElementById('btn-sound');
    if (soundBtn) {
      soundBtn.addEventListener('click', () => {
        const isMuted = sound.toggleMute();
        soundBtn.textContent = isMuted ? '🔇' : '🔊';
      });
    }

    // Reset button
    const resetBtn = document.getElementById('btn-reset');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        sound.playClick();
        this.tire.resetPosition();
      });
    }

    // Screenshot button
    const snapBtn = document.getElementById('btn-screenshot');
    if (snapBtn) {
      snapBtn.addEventListener('click', () => {
        sound.playCollect();
        this.takeScreenshot();
      });
    }

    // Help modal
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

    // Tab buttons
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

    // Preset buttons
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

    // Tread option cards
    const treadCards = document.querySelectorAll('[data-tread]');
    treadCards.forEach(card => {
      card.addEventListener('click', () => {
        sound.playClick();
        treadCards.forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        this.tire.updateCustomization({ treadPattern: card.dataset.tread });
      });
    });

    // Rim option cards
    const rimCards = document.querySelectorAll('[data-rim]');
    rimCards.forEach(card => {
      card.addEventListener('click', () => {
        sound.playClick();
        rimCards.forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        this.tire.updateCustomization({ rimStyle: card.dataset.rim });
      });
    });

    // Dimension sliders
    this.bindSlider('slider-diameter', 'val-diameter', (v) => {
      this.tire.updateCustomization({ diameter: parseFloat(v) });
    });
    this.bindSlider('slider-width', 'val-width', (v) => {
      this.tire.updateCustomization({ width: parseFloat(v) });
    });
    this.bindSlider('slider-rim-ratio', 'val-rim-ratio', (v) => {
      this.tire.updateCustomization({ rimRatio: parseFloat(v) });
    });
    this.bindSlider('slider-roughness', 'val-roughness', (v) => {
      this.tire.updateCustomization({ roughness: parseFloat(v) });
    });

    // Color Pickers
    this.bindColorPicker('color-rubber', (c) => this.tire.updateCustomization({ rubberColor: c }));
    this.bindColorPicker('color-rim', (c) => this.tire.updateCustomization({ rimColor: c }));
    this.bindColorPicker('color-accent', (c) => this.tire.updateCustomization({ noseSmileColor: c, eyeColor: c }));

    // Swatches
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
      });
    });

    // Toggles
    const toggleSidewall = document.getElementById('toggle-sidewall');
    if (toggleSidewall) {
      toggleSidewall.addEventListener('change', (e) => {
        sound.playClick();
        this.tire.updateCustomization({ hasSidewallRings: e.target.checked });
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

    // Antenna options
    document.querySelectorAll('[data-antenna]').forEach(card => {
      card.addEventListener('click', () => {
        sound.playClick();
        document.querySelectorAll('[data-antenna]').forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        this.tire.updateCustomization({ antennaStyle: card.dataset.antenna });
      });
    });
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
    setVal('slider-rim-ratio', preset.rimRatio);
    setLbl('val-rim-ratio', preset.rimRatio);
    setVal('slider-roughness', preset.roughness);
    setLbl('val-roughness', preset.roughness);

    setVal('color-rubber', preset.rubberColor);
    setVal('color-rim', preset.rimColor);
    setVal('color-accent', preset.noseSmileColor);

    document.querySelectorAll('[data-tread]').forEach(c => {
      c.classList.toggle('selected', c.dataset.tread === preset.treadPattern);
    });

    document.querySelectorAll('[data-rim]').forEach(c => {
      c.classList.toggle('selected', c.dataset.rim === preset.rimStyle);
    });
  }

  bindKeyboard() {
    window.addEventListener('keydown', (e) => {
      sound.ensureContext();
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
    // 1. Virtual Analog Joystick
    const zone = document.getElementById('joystick-zone');
    const base = document.getElementById('joystick-base');
    const knob = document.getElementById('joystick-knob');

    if (zone && base && knob) {
      let activePointerId = null;
      let startX = 0;
      let startY = 0;
      const maxRadius = 45; // max displacement in pixels

      const onPointerDown = (e) => {
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

        // Visual position
        knob.style.transform = `translate(${clampedX}px, ${clampedY}px)`;

        // Calculate normalized analog axes:
        // dy < 0 means dragging up -> forward
        // dx < 0 means dragging left -> steer left
        this.input.driveAxis = -clampedY / maxRadius;
        this.input.steerAxis = -clampedX / maxRadius;
      };

      const onPointerUp = (e) => {
        if (e.pointerId !== activePointerId) return;
        try { zone.releasePointerCapture(e.pointerId); } catch (err) {}
        activePointerId = null;

        // Reset
        knob.style.transform = 'translate(0px, 0px)';
        this.input.driveAxis = 0;
        this.input.steerAxis = 0;
      };

      zone.addEventListener('pointerdown', onPointerDown);
      zone.addEventListener('pointermove', handlePointerMove);
      zone.addEventListener('pointerup', onPointerUp);
      zone.addEventListener('pointercancel', onPointerUp);
    }

    // 2. Action buttons (Jump, Turbo, Honk)
    const jumpBtn = document.getElementById('touch-jump');
    if (jumpBtn) {
      jumpBtn.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        sound.ensureContext();
        if (this.tire.jump()) {
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

    // Update desktop camera buttons
    const camBtns = document.querySelectorAll('[data-cam-mode]');
    camBtns.forEach(b => b.classList.toggle('active', b.dataset.camMode === nextMode));

    // Update mobile camera cycle button text/icon
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

  takeScreenshot() {
    this.renderer.render(this.scene, this.threeCamera);
    const dataURL = this.renderer.domElement.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = dataURL;
    a.download = `cute-tire-earth-${Date.now()}.png`;
    a.click();
  }

  addScore(pts = 1) {
    this.score += pts;
    const scoreEl = document.getElementById('hud-score');
    if (scoreEl) {
      scoreEl.textContent = this.score;
      scoreEl.style.transform = 'scale(1.3)';
      setTimeout(() => scoreEl.style.transform = 'scale(1.0)', 180);
    }
  }

  updateHUD(speedRatio) {
    const speedEl = document.getElementById('hud-speed');
    if (speedEl) {
      const kmh = Math.round(Math.abs(speedRatio) * 45);
      speedEl.textContent = `${kmh} km/h`;
    }
  }
}
