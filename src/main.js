import * as THREE from 'three';
import { StandaloneTire } from './tire.js';
import { CuteEarth } from './earth.js';
import { CuteEnvironment } from './environment.js';
import { CuteCameraManager } from './camera.js';
import { ParticleSystem } from './particles.js';
import { sound } from './audio.js';
import { UIManager } from './ui.js';

class CuteTireApp {
  constructor() {
    this.container = document.getElementById('canvas-container');

    // 1. Scene & Renderer
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(
      52,
      window.innerWidth / window.innerHeight,
      0.1,
      500
    );

    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || window.innerWidth < 820;

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
      preserveDrawingBuffer: true
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1.75 : 2.0));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.08;

    this.container.appendChild(this.renderer.domElement);

    // 2. Systems
    this.earthRadius = 26.0;
    this.environment = new CuteEnvironment(this.scene);
    this.earth = new CuteEarth(this.scene, this.earthRadius);
    this.tire = new StandaloneTire(this.scene, this.earthRadius);
    this.particles = new ParticleSystem(this.scene);
    this.cameraManager = new CuteCameraManager(this.camera, this.renderer.domElement);

    // 3. UI & Controls
    this.ui = new UIManager(
      this.tire,
      this.earth,
      this.cameraManager,
      this.renderer,
      this.scene,
      this.camera
    );

    // 4. Timing & State
    this.clock = new THREE.Clock();
    this.dustTimer = 0;

    // Events
    window.addEventListener('resize', () => this.onResize());

    // Start loop
    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);
  }

  onResize() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  animate() {
    requestAnimationFrame(this.animate);

    const dt = Math.min(this.clock.getDelta(), 0.08);
    const elapsedTime = this.clock.getElapsedTime();

    // 1. Update tire motion & spherical physics
    const tireMotion = this.tire.update(dt, this.ui.input);

    // 2. Sound updates
    sound.updateRolling(tireMotion.speedRatio);

    // 3. Particle emission from contact patch
    const absSpeed = Math.abs(tireMotion.speedRatio);
    if (absSpeed > 0.1 && this.tire.isGrounded) {
      this.dustTimer += dt * (1.0 + absSpeed * 4.0);
      if (this.dustTimer > 0.08) {
        this.dustTimer = 0;
        const dustCol = this.tire.params.rubberColor === '#f78fb3' ? 0xffc2d4 : 0xffffff;
        this.particles.emitDust(tireMotion.contactPos, tireMotion.normal, dustCol);
      }
    }

    // 4. Check collectibles collision
    this.earth.checkCollision(this.tire.position, this.tire.radius, (pos, normal, isStar) => {
      sound.playCollect();
      if (navigator.vibrate) {
        try { navigator.vibrate(isStar ? [15, 30, 20] : 15); } catch (e) {}
      }
      this.particles.emitCollectBurst(pos, normal);
      this.ui.addScore(isStar ? 10 : 5);
    });

    // 5. Update other systems
    this.earth.update(dt, elapsedTime);
    this.particles.update(dt);
    this.environment.update(dt, elapsedTime, this.tire.position);
    this.cameraManager.update(dt, this.tire);
    this.ui.updateHUD(tireMotion.speedRatio);

    // 6. Render
    this.renderer.render(this.scene, this.camera);
  }
}

// Initialize on DOM loaded
window.addEventListener('DOMContentLoaded', () => {
  new CuteTireApp();
});
