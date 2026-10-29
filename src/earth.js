import * as THREE from 'three';

export class CuteEarth {
  constructor(scene, radius = 26.0) {
    this.scene = scene;
    this.radius = radius;
    this.group = new THREE.Group();
    this.scene.add(this.group);

    this.clouds = [];
    this.collectibles = [];
    this.faceGroup = null;

    this.buildPlanet();
    this.buildContinents();
    this.buildClouds();
    this.buildFace();
    this.buildCollectibles();
  }

  buildPlanet() {
    // Generate beautiful custom texture for the Earth base
    const canvas = document.createElement('canvas');
    canvas.width = 2048;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');

    // Rich sky-blue ocean
    const oceanGrad = ctx.createLinearGradient(0, 0, 0, 1024);
    oceanGrad.addColorStop(0, '#56b8ee');
    oceanGrad.addColorStop(0.5, '#42aced');
    oceanGrad.addColorStop(1, '#3b9ed8');
    ctx.fillStyle = oceanGrad;
    ctx.fillRect(0, 0, 2048, 1024);

    // Subtle wavy ocean rings / cute sea swirls
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.18)';
    ctx.lineWidth = 6;
    for (let i = 0; i < 30; i++) {
      const cx = (i * 137.5) % 2048;
      const cy = 120 + ((i * 73) % 780);
      ctx.beginPath();
      ctx.arc(cx, cy, 25 + (i % 4) * 10, 0, Math.PI * 1.5);
      ctx.stroke();
    }

    // Draw stylized continents with rounded clay-like edges
    ctx.fillStyle = '#78cf52';
    ctx.shadowColor = '#418b2c';
    ctx.shadowBlur = 12;
    ctx.shadowOffsetX = 3;
    ctx.shadowOffsetY = 4;

    const landPolys = [
      // Americas (North & South)
      [
        [320, 240, 120], [380, 280, 140], [420, 340, 110], [440, 440, 80],
        [460, 520, 70], [480, 600, 100], [500, 720, 90], [510, 820, 70],
        [340, 360, 90], [280, 260, 80]
      ],
      // Eurasia & Africa
      [
        [1000, 260, 130], [1120, 240, 150], [1280, 280, 160], [1420, 320, 140],
        [1520, 380, 110], [1200, 360, 130], [1080, 420, 110], [1020, 540, 120],
        [1060, 660, 130], [1120, 780, 100], [980, 620, 90], [940, 460, 80]
      ],
      // Australia & East islands
      [
        [1600, 680, 110], [1680, 720, 90], [1540, 740, 80], [1480, 620, 40],
        [1560, 540, 45], [1720, 460, 50], [1360, 620, 40]
      ],
      // Cute polar / extra friendly islands
      [
        [700, 180, 70], [780, 220, 60], [120, 300, 60], [680, 780, 55],
        [220, 700, 65], [1820, 260, 75], [1920, 340, 65]
      ]
    ];

    landPolys.forEach(group => {
      group.forEach(([x, y, r]) => {
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
        // Inner highlight for clay 3D pillow feel
        ctx.save();
        ctx.shadowColor = 'transparent';
        ctx.fillStyle = '#8ce065';
        ctx.beginPath();
        ctx.arc(x - r * 0.15, y - r * 0.15, r * 0.65, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });
    });

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;

    const geo = new THREE.SphereGeometry(this.radius, 64, 48);
    const mat = new THREE.MeshStandardMaterial({
      map: texture,
      roughness: 0.58,
      metalness: 0.04
    });

    this.oceanMesh = new THREE.Mesh(geo, mat);
    this.oceanMesh.receiveShadow = true;
    this.group.add(this.oceanMesh);

    // Subtle atmospheric glow layer
    const atmoGeo = new THREE.SphereGeometry(this.radius * 1.025, 48, 32);
    const atmoMat = new THREE.MeshStandardMaterial({
      color: 0x9be8ff,
      transparent: true,
      opacity: 0.14,
      roughness: 0.9,
      side: THREE.BackSide
    });
    this.atmoMesh = new THREE.Mesh(atmoGeo, atmoMat);
    this.group.add(this.atmoMesh);
  }

  buildContinents() {
    // Add real 3D raised tactile clay continents that physically stick out like the reference!
    const continentMat = new THREE.MeshStandardMaterial({
      color: 0x76ce50,
      roughness: 0.62,
      metalness: 0.02
    });
    const subContinents = [
      // Lat / Lon clusters for 3D raised masses
      { lat: 0.35, lon: -1.4, rad: 5.5, count: 6 },
      { lat: -0.4, lon: -1.1, rad: 4.8, count: 5 },
      { lat: 0.65, lon: 0.5, rad: 7.2, count: 9 },
      { lat: 0.1, lon: 0.45, rad: 5.6, count: 7 },
      { lat: -0.5, lon: 2.2, rad: 4.0, count: 4 },
      { lat: 0.8, lon: -2.8, rad: 3.8, count: 3 }
    ];

    subContinents.forEach(cluster => {
      for (let i = 0; i < cluster.count; i++) {
        const offsetLat = cluster.lat + (Math.random() - 0.5) * (cluster.rad / this.radius) * 1.4;
        const offsetLon = cluster.lon + (Math.random() - 0.5) * (cluster.rad / this.radius) * 1.4;
        const blobRadius = 2.2 + Math.random() * 2.4;

        const blobGeo = new THREE.SphereGeometry(blobRadius, 16, 12);
        // Squash slightly along radial direction to form a flat-topped smooth clay island
        blobGeo.scale(1.0, 0.45, 1.0);

        const blob = new THREE.Mesh(blobGeo, continentMat);
        blob.castShadow = true;
        blob.receiveShadow = true;

        const pos = this.latLonToVector3(offsetLat, offsetLon, this.radius + 0.12);
        blob.position.copy(pos);

        // Align blob normal to Earth center
        blob.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), pos.clone().normalize());

        this.group.add(blob);
      }
    });
  }

  buildFace() {
    // Cute Earth face matching reference #1!
    this.faceGroup = new THREE.Group();

    // Position face on the equator/ocean facing forward (+Z)
    const facePos = this.latLonToVector3(0.08, 1.57, this.radius + 0.28);
    this.faceGroup.position.copy(facePos);
    this.faceGroup.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), facePos.clone().normalize());

    const eyeMat = new THREE.MeshStandardMaterial({
      color: 0x181c24,
      roughness: 0.2,
      metalness: 0.1
    });

    const blushMat = new THREE.MeshStandardMaterial({
      color: 0xff8fa3,
      roughness: 0.5,
      metalness: 0.05
    });

    const eyeGeo = new THREE.SphereGeometry(0.85, 20, 16);
    eyeGeo.scale(0.85, 1.15, 0.4);

    // Left Eye
    const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
    leftEye.position.set(-2.8, 1.2, 0);
    this.faceGroup.add(leftEye);

    // Right Eye
    const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
    rightEye.position.set(2.8, 1.2, 0);
    this.faceGroup.add(rightEye);

    // Cute Eye Specular Highlights
    const specMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const specGeo = new THREE.SphereGeometry(0.24, 12, 10);
    const leftSpec = new THREE.Mesh(specGeo, specMat);
    leftSpec.position.set(-0.2, 0.35, 0.3);
    leftEye.add(leftSpec);
    const rightSpec = new THREE.Mesh(specGeo, specMat);
    rightSpec.position.set(-0.2, 0.35, 0.3);
    rightEye.add(rightSpec);

    // Blushing Cheeks
    const blushGeo = new THREE.SphereGeometry(1.2, 20, 12);
    blushGeo.scale(1.2, 0.85, 0.15);

    const leftBlush = new THREE.Mesh(blushGeo, blushMat);
    leftBlush.position.set(-4.5, -0.1, -0.05);
    this.faceGroup.add(leftBlush);

    const rightBlush = new THREE.Mesh(blushGeo, blushMat);
    rightBlush.position.set(4.5, -0.1, -0.05);
    this.faceGroup.add(rightBlush);

    // Clay Curved Smile
    const smileCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-1.8, 0.1, 0.05),
      new THREE.Vector3(-0.9, -0.9, 0.1),
      new THREE.Vector3(0, -1.2, 0.12),
      new THREE.Vector3(0.9, -0.9, 0.1),
      new THREE.Vector3(1.8, 0.1, 0.05)
    ]);
    const smileGeo = new THREE.TubeGeometry(smileCurve, 24, 0.38, 12, false);
    const smileMesh = new THREE.Mesh(smileGeo, eyeMat);
    this.faceGroup.add(smileMesh);

    this.group.add(this.faceGroup);
  }

  buildClouds() {
    const cloudMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.45,
      metalness: 0.05
    });

    // Puffy 3D toy clouds like in Reference Image #1
    const cloudCount = 10;
    for (let i = 0; i < cloudCount; i++) {
      const cloudObj = new THREE.Group();

      // Cloud is made of 4-6 overlapping squashed spheres
      const puffCount = 4 + Math.floor(Math.random() * 3);
      for (let p = 0; p < puffCount; p++) {
        const rad = 1.0 + Math.random() * 0.9;
        const puffGeo = new THREE.SphereGeometry(rad, 16, 12);
        puffGeo.scale(1.0, 0.8, 0.8);
        const puff = new THREE.Mesh(puffGeo, cloudMat);
        puff.castShadow = true;
        puff.position.set(
          (p - puffCount / 2) * 1.1 + (Math.random() - 0.5) * 0.4,
          (Math.random() - 0.5) * 0.4,
          (Math.random() - 0.5) * 0.3
        );
        cloudObj.add(puff);
      }

      const alt = this.radius + 2.2 + Math.random() * 1.2;
      const angle = (i / cloudCount) * Math.PI * 2 + (Math.random() - 0.5) * 0.4;
      const lat = (Math.random() - 0.5) * 1.2;

      cloudObj.position.copy(this.latLonToVector3(lat, angle, alt));
      cloudObj.quaternion.setFromUnitVectors(
        new THREE.Vector3(0, 1, 0),
        cloudObj.position.clone().normalize()
      );

      this.clouds.push({
        group: cloudObj,
        baseAngle: angle,
        lat: lat,
        altitude: alt,
        orbitSpeed: 0.04 + Math.random() * 0.05,
        bobSpeed: 1.5 + Math.random() * 1.5,
        bobOffset: Math.random() * 10
      });

      this.group.add(cloudObj);
    }
  }

  buildCollectibles() {
    // Scatter friendly collectible star gems and flowers on the planet
    const starGeo = new THREE.OctahedronGeometry(0.7, 0);
    const starMat = new THREE.MeshStandardMaterial({
      color: 0xffdf55,
      emissive: 0xffc830,
      emissiveIntensity: 0.35,
      roughness: 0.3,
      metalness: 0.2
    });

    const flowerMat = new THREE.MeshStandardMaterial({
      color: 0xff6b9d,
      roughness: 0.4
    });

    const numItems = 24;
    for (let i = 0; i < numItems; i++) {
      const isStar = i % 2 === 0;
      const lat = (Math.random() - 0.5) * 2.6;
      const lon = Math.random() * Math.PI * 2;
      const pos = this.latLonToVector3(lat, lon, this.radius + 0.65);

      const mesh = new THREE.Mesh(isStar ? starGeo : starGeo.clone(), isStar ? starMat : flowerMat);
      mesh.castShadow = true;
      mesh.position.copy(pos);

      // Normal
      const normal = pos.clone().normalize();
      mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), normal);

      this.group.add(mesh);
      this.collectibles.push({
        mesh,
        basePos: pos.clone(),
        normal,
        isStar,
        active: true,
        rotSpeed: 1.5 + Math.random() * 2,
        respawnTimer: 0
      });
    }
  }

  latLonToVector3(lat, lon, radius) {
    const phi = Math.PI / 2 - lat;
    const theta = lon;
    return new THREE.Vector3(
      radius * Math.sin(phi) * Math.sin(theta),
      radius * Math.cos(phi),
      radius * Math.sin(phi) * Math.cos(theta)
    );
  }

  setFaceVisible(visible) {
    if (this.faceGroup) {
      this.faceGroup.visible = visible;
    }
  }

  update(dt, time) {
    // Drifting clouds animation
    this.clouds.forEach(c => {
      c.baseAngle += c.orbitSpeed * dt * 0.15;
      const bob = Math.sin(time * c.bobSpeed + c.bobOffset) * 0.25;
      const currentPos = this.latLonToVector3(c.lat, c.baseAngle, c.altitude + bob);
      c.group.position.copy(currentPos);
      c.group.quaternion.setFromUnitVectors(
        new THREE.Vector3(0, 1, 0),
        currentPos.clone().normalize()
      );
    });

    // Spin and bob collectibles
    this.collectibles.forEach(item => {
      if (!item.active) {
        item.respawnTimer -= dt;
        if (item.respawnTimer <= 0) {
          item.active = true;
          item.mesh.visible = true;
          item.mesh.scale.set(0.01, 0.01, 0.01);
        }
        return;
      }

      if (item.mesh.scale.x < 1.0) {
        item.mesh.scale.addScalar(dt * 3.0);
        if (item.mesh.scale.x > 1.0) item.mesh.scale.set(1, 1, 1);
      }

      item.mesh.rotateY(item.rotSpeed * dt);
      const hover = Math.sin(time * 3 + item.mesh.id) * 0.15;
      item.mesh.position.copy(item.basePos).addScaledVector(item.normal, hover);
    });
  }

  checkCollision(tirePos, tireRadius, onCollect) {
    for (const item of this.collectibles) {
      if (!item.active) continue;
      const dist = tirePos.distanceTo(item.mesh.position);
      if (dist < tireRadius + 0.9) {
        item.active = false;
        item.mesh.visible = false;
        item.respawnTimer = 6.0; // Respawns after 6 seconds
        if (onCollect) {
          onCollect(item.mesh.position, item.normal, item.isStar);
        }
      }
    }
  }
}
