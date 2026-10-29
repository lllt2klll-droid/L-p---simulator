import * as THREE from 'three';

export class CuteEnvironment {
  constructor(scene) {
    this.scene = scene;
    this.stars = [];

    this.setupLighting();
    this.setupBackground();
  }

  setupLighting() {
    // Hemisphere light for soft, natural toy-like illumination
    const hemiLight = new THREE.HemisphereLight(0xdcf3ff, 0xffeedd, 1.15);
    hemiLight.position.set(0, 50, 0);
    this.scene.add(hemiLight);

    // Warm Key Directional Light with soft shadows
    this.dirLight = new THREE.DirectionalLight(0xfffbf2, 1.8);
    this.dirLight.position.set(30, 45, 25);
    this.dirLight.castShadow = true;

    this.dirLight.shadow.mapSize.width = 2048;
    this.dirLight.shadow.mapSize.height = 2048;
    this.dirLight.shadow.camera.near = 10;
    this.dirLight.shadow.camera.far = 100;
    this.dirLight.shadow.bias = -0.0004;

    const d = 35;
    this.dirLight.shadow.camera.left = -d;
    this.dirLight.shadow.camera.right = d;
    this.dirLight.shadow.camera.top = d;
    this.dirLight.shadow.camera.bottom = -d;

    this.scene.add(this.dirLight);

    // Soft Cyan/Sky Rim Light to bring out bevels and tire edges
    const rimLight = new THREE.DirectionalLight(0x76c5f0, 0.75);
    rimLight.position.set(-25, 20, -30);
    this.scene.add(rimLight);

    // Warm low fill
    const fillLight = new THREE.DirectionalLight(0xffd6a5, 0.4);
    fillLight.position.set(0, -30, 0);
    this.scene.add(fillLight);
  }

  setupBackground() {
    // Cheerful pastel studio sky color
    this.scene.background = new THREE.Color(0xd7efff);

    // Floating cute background stars / pastel confetti sparkles in the distance
    const starCount = 180;
    const starGeo = new THREE.OctahedronGeometry(0.35, 0);
    const starColors = [0xffd166, 0xffffff, 0xef476f, 0x06d6a0, 0x118ab2];

    const starGroup = new THREE.Group();
    for (let i = 0; i < starCount; i++) {
      const color = starColors[i % starColors.length];
      const mat = new THREE.MeshBasicMaterial({ color });
      const mesh = new THREE.Mesh(starGeo, mat);

      const r = 85 + Math.random() * 45;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);

      mesh.position.set(
        r * Math.sin(phi) * Math.cos(theta),
        r * Math.sin(phi) * Math.sin(theta),
        r * Math.cos(phi)
      );

      mesh.scale.setScalar(0.5 + Math.random() * 0.8);

      starGroup.add(mesh);
      this.stars.push({
        mesh,
        rotSpeed: 0.5 + Math.random() * 1.5,
        pulseSpeed: 1.0 + Math.random() * 2.0,
        baseScale: mesh.scale.x
      });
    }

    this.scene.add(starGroup);
    this.starGroup = starGroup;
  }

  update(dt, time, tirePos) {
    // Keep directional light oriented with tire to provide optimal shading
    if (tirePos) {
      const lightOffset = new THREE.Vector3(25, 35, 20);
      this.dirLight.position.copy(tirePos).add(lightOffset);
      this.dirLight.target.position.copy(tirePos);
      this.dirLight.target.updateMatrixWorld();
    }

    // Twinkling stars
    this.stars.forEach(s => {
      s.mesh.rotation.x += s.rotSpeed * dt;
      s.mesh.rotation.y += s.rotSpeed * 0.8 * dt;
      const scale = s.baseScale * (0.8 + 0.3 * Math.sin(time * s.pulseSpeed));
      s.mesh.scale.setScalar(scale);
    });

    if (this.starGroup) {
      this.starGroup.rotation.y += dt * 0.015;
    }
  }
}
