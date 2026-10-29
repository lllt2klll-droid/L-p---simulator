import * as THREE from 'three';

export class CuteCameraManager {
  constructor(camera, domElement) {
    this.camera = camera;
    this.domElement = domElement;

    // Modes: 'follow', 'orbit', 'planet'
    this.mode = 'follow';

    // Follow camera parameters
    this.distBack = 8.5;
    this.distUp = 4.2;
    this.lookAhead = 3.5;
    this.lookUp = 1.0;
    this.followSpeed = 7.0;

    // Current camera position and look target (smoothed)
    this.currentPos = new THREE.Vector3(0, 35, 12);
    this.currentTarget = new THREE.Vector3(0, 27, 0);
    this.currentUp = new THREE.Vector3(0, 1, 0);

    // Orbit mode state
    this.orbitRadius = 7.5;
    this.orbitTheta = 0.6; // yaw
    this.orbitPhi = 0.45;  // pitch
    this.isDragging = false;
    this.prevMouse = { x: 0, y: 0 };

    this.setupOrbitEvents();
  }

  setupOrbitEvents() {
    this.domElement.addEventListener('pointerdown', (e) => {
      if (this.mode !== 'orbit') return;
      this.isDragging = true;
      this.prevMouse = { x: e.clientX, y: e.clientY };
    });

    window.addEventListener('pointermove', (e) => {
      if (!this.isDragging || this.mode !== 'orbit') return;
      const dx = e.clientX - this.prevMouse.x;
      const dy = e.clientY - this.prevMouse.y;
      this.prevMouse = { x: e.clientX, y: e.clientY };

      this.orbitTheta -= dx * 0.008;
      this.orbitPhi = THREE.MathUtils.clamp(this.orbitPhi + dy * 0.008, 0.05, Math.PI * 0.48);
    });

    window.addEventListener('pointerup', () => {
      this.isDragging = false;
    });

    this.domElement.addEventListener('wheel', (e) => {
      if (this.mode === 'orbit') {
        this.orbitRadius = THREE.MathUtils.clamp(this.orbitRadius + e.deltaY * 0.01, 3.5, 18.0);
      }
    }, { passive: true });
  }

  setMode(mode) {
    this.mode = mode;
  }

  update(dt, tire) {
    if (this.mode === 'follow') {
      this.updateFollow(dt, tire);
    } else if (this.mode === 'orbit') {
      this.updateOrbit(dt, tire);
    } else if (this.mode === 'planet') {
      this.updatePlanet(dt, tire);
    }
  }

  updateFollow(dt, tire) {
    // Tire position, forward, up, and right vectors
    const tirePos = tire.root.position;
    const forward = tire.forward;
    const up = tire.up;

    // Ideal camera position: behind and above
    const idealPos = tirePos.clone()
      .addScaledVector(forward, -this.distBack)
      .addScaledVector(up, this.distUp);

    // Ideal target: slightly in front of tire
    const idealTarget = tirePos.clone()
      .addScaledVector(forward, this.lookAhead)
      .addScaledVector(up, this.lookUp);

    // Smooth lerp
    const lerpFactor = Math.min(1.0, dt * this.followSpeed);
    this.currentPos.lerp(idealPos, lerpFactor);
    this.currentTarget.lerp(idealTarget, lerpFactor);
    this.currentUp.lerp(up, lerpFactor);

    this.camera.position.copy(this.currentPos);
    this.camera.up.copy(this.currentUp);
    this.camera.lookAt(this.currentTarget);
  }

  updateOrbit(dt, tire) {
    const tirePos = tire.root.position;
    const up = tire.up;
    const right = tire.right;
    const forward = tire.forward;

    // Calculate position in local spherical coordinates relative to tire's frame
    const sinPhi = Math.sin(this.orbitPhi);
    const cosPhi = Math.cos(this.orbitPhi);
    const sinTheta = Math.sin(this.orbitTheta);
    const cosTheta = Math.cos(this.orbitTheta);

    // Offset in tire local space
    const offset = new THREE.Vector3()
      .addScaledVector(right, this.orbitRadius * cosPhi * sinTheta)
      .addScaledVector(up, this.orbitRadius * sinPhi)
      .addScaledVector(forward, this.orbitRadius * cosPhi * cosTheta);

    const targetPos = tirePos.clone().add(offset);
    this.camera.position.lerp(targetPos, Math.min(1.0, dt * 10.0));
    this.camera.up.copy(up);
    this.camera.lookAt(tirePos);
  }

  updatePlanet(dt, tire) {
    // Cinematic overview of Earth and tire
    const tirePos = tire.root.position;
    const up = tire.up;
    const widePos = tirePos.clone().normalize().multiplyScalar(tire.earthRadius * 2.1);
    widePos.y += 10.0;

    this.camera.position.lerp(widePos, Math.min(1.0, dt * 4.0));
    this.camera.up.copy(up);
    this.camera.lookAt(tirePos.clone().multiplyScalar(0.7));
  }
}
