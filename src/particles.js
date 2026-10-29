import * as THREE from 'three';

export class ParticleSystem {
  constructor(scene) {
    this.scene = scene;
    this.particles = [];
    this.maxParticles = 120;

    // Shared sphere geometry for cute round clay puffs
    this.puffGeo = new THREE.SphereGeometry(0.12, 6, 6);
    this.starGeo = new THREE.OctahedronGeometry(0.18, 0);

    this.materials = [
      new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.8, flatShading: true }),
      new THREE.MeshStandardMaterial({ color: 0xffdf70, roughness: 0.5, emissive: 0xffdf70, emissiveIntensity: 0.4 }),
      new THREE.MeshStandardMaterial({ color: 0x7be285, roughness: 0.6 }),
      new THREE.MeshStandardMaterial({ color: 0xff99bb, roughness: 0.6 })
    ];
  }

  emitDust(pos, normal, color = 0xffffff) {
    if (this.particles.length > this.maxParticles) return;

    const mesh = new THREE.Mesh(this.puffGeo, this.materials[0].clone());
    mesh.material.color.set(color);
    mesh.position.copy(pos);

    // Give random puff velocity outward and backward
    const tangent = new THREE.Vector3(
      (Math.random() - 0.5) * 0.4,
      (Math.random() - 0.5) * 0.4,
      (Math.random() - 0.5) * 0.4
    );
    const vel = normal.clone().multiplyScalar(0.4 + Math.random() * 0.4).add(tangent);

    const p = {
      mesh,
      velocity: vel,
      life: 1.0,
      decay: 1.8 + Math.random() * 1.0,
      scale: 0.6 + Math.random() * 0.5
    };

    mesh.scale.setScalar(p.scale);
    this.scene.add(mesh);
    this.particles.push(p);
  }

  emitCollectBurst(pos, normal) {
    const count = 14;
    for (let i = 0; i < count; i++) {
      const mat = this.materials[1 + Math.floor(Math.random() * 3)];
      const mesh = new THREE.Mesh(this.starGeo, mat);
      mesh.position.copy(pos);

      const angle = (i / count) * Math.PI * 2;
      const spread = new THREE.Vector3(
        Math.cos(angle) * (1.2 + Math.random()),
        (Math.random() - 0.5) * 0.8,
        Math.sin(angle) * (1.2 + Math.random())
      );
      const vel = normal.clone().multiplyScalar(1.5 + Math.random() * 1.5).add(spread);

      const p = {
        mesh,
        velocity: vel,
        life: 1.0,
        decay: 1.2 + Math.random() * 0.6,
        scale: 0.8 + Math.random() * 0.6,
        rotSpeed: new THREE.Vector3(Math.random() * 6, Math.random() * 6, Math.random() * 6)
      };

      mesh.scale.setScalar(p.scale);
      this.scene.add(mesh);
      this.particles.push(p);
    }
  }

  update(dt) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= p.decay * dt;

      if (p.life <= 0) {
        this.scene.remove(p.mesh);
        p.mesh.geometry.dispose();
        if (p.mesh.material.dispose) p.mesh.material.dispose();
        this.particles.splice(i, 1);
        continue;
      }

      p.mesh.position.addScaledVector(p.velocity, dt);
      p.velocity.multiplyScalar(0.94); // drag

      if (p.rotSpeed) {
        p.mesh.rotation.x += p.rotSpeed.x * dt;
        p.mesh.rotation.y += p.rotSpeed.y * dt;
      }

      const s = p.scale * p.life;
      p.mesh.scale.setScalar(s);
    }
  }
}
