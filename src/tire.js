import * as THREE from 'three';

export class StandaloneTire {
  constructor(scene, earthRadius = 26.0) {
    this.scene = scene;
    this.earthRadius = earthRadius;

    // Customization parameters
    this.params = {
      diameter: 3.2,       // Outer diameter
      width: 1.8,          // Tire tread width
      rimRatio: 0.58,      // Rim diameter as fraction of tire diameter
      rubberColor: '#2b2d31', // Deep charcoal clay rubber like reference
      rimColor: '#3c4048',    // Rim backdrop color
      eyeColor: '#4ea8de',    // Cyan/blue clay eyes like reference
      noseSmileColor: '#ff733b', // Bright orange clay nose and smile like reference
      roughness: 0.65,
      metalness: 0.05,
      treadPattern: 'chevron', // chevron, chunky, paddle, heart, smooth
      rimStyle: 'face',        // face, star, swirl, spokes, disc
      faceEnabled: true,
      gyroFace: false,         // whether face stays upright or tumbles with tire
      hasSidewallRings: true,
      antennaStyle: 'none'     // none, star, heart
    };

    // Physics / Motion state
    this.radius = this.params.diameter / 2;
    this.centerDist = this.earthRadius + this.radius;

    // Spherical position & orientation frame
    // P = position on sphere (length = centerDist)
    this.position = new THREE.Vector3(0, this.centerDist, 0); // Start at North Pole
    this.forward = new THREE.Vector3(0, 0, 1);                 // Tangent forward
    this.up = new THREE.Vector3(0, 1, 0);                      // Surface normal
    this.right = new THREE.Vector3(1, 0, 0);                    // Axle vector

    // Dynamics
    this.linearSpeed = 0;
    this.maxSpeed = 16.0;
    this.acceleration = 18.0;
    this.friction = 7.0;
    this.steeringAngle = 0;
    this.steerSpeed = 2.8;
    this.steerReturnSpeed = 6.0;
    this.rollAngle = 0;

    // Bounce / Jump dynamics
    this.jumpHeight = 0;
    this.jumpVelocity = 0;
    this.gravity = 35.0;
    this.isGrounded = true;
    this.squashStretch = new THREE.Vector3(1, 1, 1);

    // Root Three.js hierarchy
    this.root = new THREE.Group();
    this.scene.add(this.root);

    // Rolling pivot group: this rotates around the axle X-axis
    this.rollPivot = new THREE.Group();
    this.root.add(this.rollPivot);

    // Face group (can either be attached to rollPivot or root depending on gyroFace)
    this.faceAnchor = new THREE.Group();
    this.rollPivot.add(this.faceAnchor);

    // Antenna anchor (always on root so it stays on top of tire)
    this.antennaGroup = new THREE.Group();
    this.root.add(this.antennaGroup);

    // Materials
    this.rubberMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color(this.params.rubberColor),
      roughness: this.params.roughness,
      metalness: this.params.metalness
    });

    this.rimMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color(this.params.rimColor),
      roughness: 0.5,
      metalness: 0.1
    });

    this.eyeMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color(this.params.eyeColor),
      roughness: 0.35,
      metalness: 0.05
    });

    this.pupilMaterial = new THREE.MeshStandardMaterial({
      color: 0x111317,
      roughness: 0.15,
      metalness: 0.1
    });

    this.accentMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color(this.params.noseSmileColor),
      roughness: 0.45,
      metalness: 0.05
    });

    this.buildFullTire();
    this.updateTransform();
  }

  buildFullTire() {
    // Clear previous children of rollPivot except faceAnchor
    while (this.rollPivot.children.length > 0) {
      const child = this.rollPivot.children[0];
      if (child === this.faceAnchor) {
        this.rollPivot.remove(this.faceAnchor);
      } else {
        this.rollPivot.remove(child);
        if (child.geometry) child.geometry.dispose();
      }
    }
    while (this.faceAnchor.children.length > 0) {
      const child = this.faceAnchor.children[0];
      this.faceAnchor.remove(child);
      if (child.geometry) child.geometry.dispose();
    }
    while (this.antennaGroup.children.length > 0) {
      const child = this.antennaGroup.children[0];
      this.antennaGroup.remove(child);
      if (child.geometry) child.geometry.dispose();
    }

    this.radius = this.params.diameter / 2;
    this.centerDist = this.earthRadius + this.radius;

    // Build the main tire rubber torus/body
    this.buildRubberBody();

    // Build raised 3D tread blocks
    this.buildTreads();

    // Build rim & wheel hub
    this.buildRim();

    // Build decorative sidewall rings if enabled
    if (this.params.hasSidewallRings) {
      this.buildSidewallDetails();
    }

    // Build Face if rim style is 'face' or faceEnabled
    if (this.params.faceEnabled && this.params.rimStyle === 'face') {
      this.buildCuteFace();
    }

    // Build Antenna
    if (this.params.antennaStyle !== 'none') {
      this.buildAntenna();
    }

    // Reattach face anchor to rollPivot or root based on gyro mode
    if (this.params.gyroFace) {
      this.root.add(this.faceAnchor);
    } else {
      this.rollPivot.add(this.faceAnchor);
    }
  }

  buildRubberBody() {
    // Axle is along Z or X. In our local tire frame:
    // Forward is +Z, Up is +Y, Axle is +X.
    // Rolling rotates around +X!
    // So the tire circular silhouette is in the Y-Z plane!
    const outerR = this.radius;
    const rimR = outerR * this.params.rimRatio;
    const halfW = this.params.width / 2;

    // Create tire cross-section profile for LatheGeometry
    // Silhouette in Y-Z plane rotated around X axis:
    // LatheGeometry rotates 2D points (x, y) around Y axis.
    // So we generate points in (radius, widthOffset) and rotate around width-axis,
    // then orient the mesh so its cylinder axis aligns with local X axis!
    const points = [];
    const segments = 16;

    // Cross-section curve: from inner rim (rimR, -halfW*0.6) around the outer tread to other rim
    // Inner bevel at rim left
    points.push(new THREE.Vector2(rimR, -halfW * 0.7));
    points.push(new THREE.Vector2(rimR * 1.05, -halfW * 0.95));

    // Outer shoulder left
    points.push(new THREE.Vector2(outerR * 0.88, -halfW * 1.02));
    points.push(new THREE.Vector2(outerR * 0.98, -halfW * 0.85));

    // Flat beveled crown / tread top
    points.push(new THREE.Vector2(outerR, -halfW * 0.5));
    points.push(new THREE.Vector2(outerR * 1.01, 0));
    points.push(new THREE.Vector2(outerR, halfW * 0.5));

    // Outer shoulder right
    points.push(new THREE.Vector2(outerR * 0.98, halfW * 0.85));
    points.push(new THREE.Vector2(outerR * 0.88, halfW * 1.02));

    // Inner bevel at rim right
    points.push(new THREE.Vector2(rimR * 1.05, halfW * 0.95));
    points.push(new THREE.Vector2(rimR, halfW * 0.7));

    const latheGeo = new THREE.LatheGeometry(points, 36);
    // Lathe revolves around Y. We rotate it so axle aligns with local X axis!
    latheGeo.rotateZ(-Math.PI / 2);

    const tireMesh = new THREE.Mesh(latheGeo, this.rubberMaterial);
    tireMesh.castShadow = true;
    tireMesh.receiveShadow = true;
    this.rollPivot.add(tireMesh);
    this.tireMesh = tireMesh;
  }

  buildTreads() {
    const pattern = this.params.treadPattern;
    if (pattern === 'smooth') return;

    const outerR = this.radius;
    const width = this.params.width;
    const numTreads = pattern === 'paddle' ? 18 : 28;

    const treadMat = this.rubberMaterial;

    for (let i = 0; i < numTreads; i++) {
      const angle = (i / numTreads) * Math.PI * 2;
      const cosA = Math.cos(angle);
      const sinA = Math.sin(angle);

      // Tread position on perimeter: in local Y-Z plane
      // y = outerR * cosA, z = outerR * sinA
      if (pattern === 'chevron') {
        // V-groove / chevron treads like reference #2!
        // Left arm of V
        const armGeo = new THREE.BoxGeometry(width * 0.46, outerR * 0.14, outerR * 0.09);
        // Bevel / round edges with simple scale
        const leftArm = new THREE.Mesh(armGeo, treadMat);
        leftArm.castShadow = true;

        leftArm.position.set(-width * 0.22, outerR * 0.995 * cosA, outerR * 0.995 * sinA);
        leftArm.rotation.x = -angle;
        leftArm.rotation.y = 0.38; // V angle
        this.rollPivot.add(leftArm);

        // Right arm of V
        const rightArm = new THREE.Mesh(armGeo, treadMat);
        rightArm.castShadow = true;
        rightArm.position.set(width * 0.22, outerR * 0.995 * cosA, outerR * 0.995 * sinA);
        rightArm.rotation.x = -angle;
        rightArm.rotation.y = -0.38; // V angle
        this.rollPivot.add(rightArm);

      } else if (pattern === 'chunky') {
        // Chunky off-road rectangular cleat blocks with center stagger
        const isStagger = i % 2 === 0;
        const cleatW = width * 0.38;
        const cleatGeo = new THREE.BoxGeometry(cleatW, outerR * 0.16, outerR * 0.12);
        const cleat = new THREE.Mesh(cleatGeo, treadMat);
        cleat.castShadow = true;

        const xOff = isStagger ? -width * 0.22 : width * 0.22;
        cleat.position.set(xOff, outerR * 0.995 * cosA, outerR * 0.995 * sinA);
        cleat.rotation.x = -angle;
        this.rollPivot.add(cleat);

        // Center mini cleat
        const centerGeo = new THREE.BoxGeometry(width * 0.2, outerR * 0.12, outerR * 0.1);
        const center = new THREE.Mesh(centerGeo, treadMat);
        center.castShadow = true;
        center.position.set(0, outerR * 0.995 * cosA, outerR * 0.995 * sinA);
        center.rotation.x = -angle;
        this.rollPivot.add(center);

      } else if (pattern === 'paddle') {
        // Deep tractor/dune paddle slats
        const paddleGeo = new THREE.BoxGeometry(width * 0.88, outerR * 0.15, outerR * 0.14);
        const paddle = new THREE.Mesh(paddleGeo, treadMat);
        paddle.castShadow = true;
        paddle.position.set(0, outerR * 1.01 * cosA, outerR * 1.01 * sinA);
        paddle.rotation.x = -angle;
        this.rollPivot.add(paddle);

      } else if (pattern === 'heart') {
        // Cute heart-shaped treads
        const heartGeo = new THREE.CylinderGeometry(outerR * 0.08, outerR * 0.08, width * 0.28, 8);
        heartGeo.rotateZ(Math.PI / 2);
        const heart = new THREE.Mesh(heartGeo, treadMat);
        heart.castShadow = true;
        heart.position.set(0, outerR * 1.01 * cosA, outerR * 1.01 * sinA);
        heart.rotation.x = -angle;
        this.rollPivot.add(heart);
      }
    }
  }

  buildRim() {
    const outerR = this.radius;
    const rimR = outerR * this.params.rimRatio;
    const halfW = this.params.width / 2;
    const style = this.params.rimStyle;

    // Recessed center hub cylinder / disc (both sides)
    const hubDepth = halfW * 0.8;
    const discGeo = new THREE.CylinderGeometry(rimR * 0.98, rimR * 0.98, hubDepth, 32);
    discGeo.rotateZ(Math.PI / 2); // Cylinder along X axle

    const hub = new THREE.Mesh(discGeo, this.rimMaterial);
    hub.castShadow = true;
    hub.receiveShadow = true;
    this.rollPivot.add(hub);

    // Decorative inner rim ring
    const ringGeo = new THREE.TorusGeometry(rimR * 0.96, rimR * 0.08, 16, 32);
    ringGeo.rotateY(Math.PI / 2); // Normal along X axis

    const leftRing = new THREE.Mesh(ringGeo, this.rimMaterial);
    leftRing.position.x = -halfW * 0.55;
    this.rollPivot.add(leftRing);

    const rightRing = new THREE.Mesh(ringGeo, this.rimMaterial);
    rightRing.position.x = halfW * 0.55;
    this.rollPivot.add(rightRing);

    // Build specific rim styles
    if (style === 'star') {
      this.buildStarRim(rimR, halfW);
    } else if (style === 'swirl') {
      this.buildSwirlRim(rimR, halfW);
    } else if (style === 'spokes') {
      this.buildSpokeRim(rimR, halfW);
    }
  }

  buildStarRim(rimR, halfW) {
    const numPoints = 5;
    const spokeMat = this.accentMaterial;

    [-1, 1].forEach(side => {
      const xPos = side * (halfW * 0.52);
      for (let i = 0; i < numPoints; i++) {
        const a = (i / numPoints) * Math.PI * 2;
        const spokeGeo = new THREE.BoxGeometry(rimR * 0.18, rimR * 0.7, rimR * 0.16);
        const spoke = new THREE.Mesh(spokeGeo, spokeMat);
        spoke.castShadow = true;
        spoke.position.set(xPos, Math.cos(a) * rimR * 0.45, Math.sin(a) * rimR * 0.45);
        spoke.rotation.x = -a;
        this.rollPivot.add(spoke);
      }
      // Center star cap
      const capGeo = new THREE.SphereGeometry(rimR * 0.28, 16, 12);
      capGeo.scale(0.5, 1, 1);
      const cap = new THREE.Mesh(capGeo, spokeMat);
      cap.position.x = xPos * 1.05;
      this.rollPivot.add(cap);
    });
  }

  buildSwirlRim(rimR, halfW) {
    const numArms = 4;
    [-1, 1].forEach(side => {
      const xPos = side * (halfW * 0.52);
      for (let i = 0; i < numArms; i++) {
        const baseA = (i / numArms) * Math.PI * 2;
        const curve = new THREE.CatmullRomCurve3([
          new THREE.Vector3(xPos, 0, 0),
          new THREE.Vector3(xPos, Math.cos(baseA + 0.4) * rimR * 0.45, Math.sin(baseA + 0.4) * rimR * 0.45),
          new THREE.Vector3(xPos, Math.cos(baseA + 1.1) * rimR * 0.85, Math.sin(baseA + 1.1) * rimR * 0.85)
        ]);
        const tubeGeo = new THREE.TubeGeometry(curve, 16, rimR * 0.08, 10, false);
        const arm = new THREE.Mesh(tubeGeo, this.accentMaterial);
        arm.castShadow = true;
        this.rollPivot.add(arm);
      }
    });
  }

  buildSpokeRim(rimR, halfW) {
    const numSpokes = 8;
    [-1, 1].forEach(side => {
      const xPos = side * (halfW * 0.52);
      for (let i = 0; i < numSpokes; i++) {
        const a = (i / numSpokes) * Math.PI * 2;
        const spokeGeo = new THREE.CylinderGeometry(rimR * 0.05, rimR * 0.05, rimR * 0.82, 8);
        const spoke = new THREE.Mesh(spokeGeo, this.accentMaterial);
        spoke.castShadow = true;
        spoke.position.set(xPos, Math.cos(a) * rimR * 0.42, Math.sin(a) * rimR * 0.42);
        spoke.rotation.x = -a;
        this.rollPivot.add(spoke);
      }
    });
  }

  buildSidewallDetails() {
    const outerR = this.radius;
    const rimR = outerR * this.params.rimRatio;
    const halfW = this.params.width / 2;
    const ringR = (outerR + rimR) * 0.5;

    // Cute decorative sidewall rings (like vintage white-wall or playful colored accent ring)
    const ringGeo = new THREE.TorusGeometry(ringR, outerR * 0.035, 16, 48);
    ringGeo.rotateY(Math.PI / 2);

    [-1, 1].forEach(side => {
      const ring = new THREE.Mesh(ringGeo, this.accentMaterial);
      ring.position.x = side * (halfW * 0.98);
      ring.castShadow = true;
      this.rollPivot.add(ring);
    });
  }

  buildCuteFace() {
    // Exact match for Reference Image #2:
    // On the outer hub face (both sides so tire is cute from every angle!):
    // 1. Two blue pill-shaped clay eyes with glossy black pupils
    // 2. An orange round clay ball nose in center
    // 3. A happy orange clay sausage smile with gentle dimples!
    const outerR = this.radius;
    const rimR = outerR * this.params.rimRatio;
    const halfW = this.params.width / 2;

    [-1, 1].forEach(side => {
      const faceSide = new THREE.Group();
      // Side 1: facing +X (right). Side -1: facing -X (left).
      faceSide.position.x = side * (halfW * 0.48);
      if (side < 0) {
        faceSide.rotation.y = Math.PI; // Face outwards on left side too!
      }

      const eyeScale = rimR * 0.32;

      // Eyes: Pill / Capsule geometry (blue clay)
      const eyeGeo = new THREE.CapsuleGeometry(eyeScale * 0.52, eyeScale * 0.62, 12, 16);
      eyeGeo.scale(0.4, 1.0, 0.75); // Flattish clay pill

      // Pupils: black glossy beads
      const pupilGeo = new THREE.SphereGeometry(eyeScale * 0.35, 16, 12);
      pupilGeo.scale(0.3, 1.0, 0.9);

      // Pupil highlight
      const hlGeo = new THREE.SphereGeometry(eyeScale * 0.12, 8, 8);
      const hlMat = new THREE.MeshBasicMaterial({ color: 0xffffff });

      // Eye positions: slightly above center, left and right along local Z axis
      const eyeSpacingZ = rimR * 0.32;
      const eyeHeightY = rimR * 0.28;

      // Front Eye (+Z)
      const eye1 = new THREE.Mesh(eyeGeo, this.eyeMaterial);
      eye1.castShadow = true;
      eye1.position.set(rimR * 0.08, eyeHeightY, eyeSpacingZ);
      faceSide.add(eye1);

      const pupil1 = new THREE.Mesh(pupilGeo, this.pupilMaterial);
      pupil1.position.set(eyeScale * 0.22, 0, 0);
      eye1.add(pupil1);

      const hl1 = new THREE.Mesh(hlGeo, hlMat);
      hl1.position.set(eyeScale * 0.3, eyeScale * 0.12, eyeScale * 0.08);
      eye1.add(hl1);

      // Back Eye (-Z)
      const eye2 = new THREE.Mesh(eyeGeo, this.eyeMaterial);
      eye2.castShadow = true;
      eye2.position.set(rimR * 0.08, eyeHeightY, -eyeSpacingZ);
      faceSide.add(eye2);

      const pupil2 = new THREE.Mesh(pupilGeo, this.pupilMaterial);
      pupil2.position.set(eyeScale * 0.22, 0, 0);
      eye2.add(pupil2);

      const hl2 = new THREE.Mesh(hlGeo, hlMat);
      hl2.position.set(eyeScale * 0.3, eyeScale * 0.12, -eyeScale * 0.08);
      eye2.add(hl2);

      // Nose: Chunky orange clay ball in exact center!
      const noseGeo = new THREE.SphereGeometry(rimR * 0.22, 20, 16);
      noseGeo.scale(0.85, 1.0, 1.0);
      const nose = new THREE.Mesh(noseGeo, this.accentMaterial);
      nose.castShadow = true;
      nose.position.set(rimR * 0.14, 0, 0);
      faceSide.add(nose);

      // Smile: Thick curved clay sausage
      const smileCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(rimR * 0.08, -rimR * 0.18, -rimR * 0.44),
        new THREE.Vector3(rimR * 0.12, -rimR * 0.42, -rimR * 0.25),
        new THREE.Vector3(rimR * 0.14, -rimR * 0.48, 0),
        new THREE.Vector3(rimR * 0.12, -rimR * 0.42, rimR * 0.25),
        new THREE.Vector3(rimR * 0.08, -rimR * 0.18, rimR * 0.44)
      ]);
      const smileGeo = new THREE.TubeGeometry(smileCurve, 24, rimR * 0.11, 14, false);
      const smile = new THREE.Mesh(smileGeo, this.accentMaterial);
      smile.castShadow = true;
      faceSide.add(smile);

      this.faceAnchor.add(faceSide);
    });
  }

  buildAntenna() {
    const outerR = this.radius;
    const style = this.params.antennaStyle;

    // Cute spring topper on tire crown
    const springCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, outerR, 0),
      new THREE.Vector3(0.08, outerR + 0.3, 0.08),
      new THREE.Vector3(-0.08, outerR + 0.6, -0.08),
      new THREE.Vector3(0.06, outerR + 0.9, 0.06),
      new THREE.Vector3(0, outerR + 1.2, 0)
    ]);
    const springGeo = new THREE.TubeGeometry(springCurve, 20, 0.04, 8, false);
    const spring = new THREE.Mesh(springGeo, this.accentMaterial);
    this.antennaGroup.add(spring);

    // Topper (Star or Heart)
    const topperGeo = style === 'star'
      ? new THREE.OctahedronGeometry(0.35, 0)
      : new THREE.SphereGeometry(0.3, 16, 12);
    const topperMat = new THREE.MeshStandardMaterial({
      color: 0xffe066,
      emissive: 0xffc720,
      emissiveIntensity: 0.4,
      roughness: 0.3
    });
    const topper = new THREE.Mesh(topperGeo, topperMat);
    topper.position.set(0, outerR + 1.35, 0);
    this.antennaGroup.add(topper);
  }

  updateCustomization(newParams) {
    Object.assign(this.params, newParams);

    // Update materials
    this.rubberMaterial.color.set(this.params.rubberColor);
    this.rubberMaterial.roughness = this.params.roughness;
    this.rubberMaterial.metalness = this.params.metalness;

    this.rimMaterial.color.set(this.params.rimColor);
    this.eyeMaterial.color.set(this.params.eyeColor);
    this.accentMaterial.color.set(this.params.noseSmileColor);

    // Rebuild geometry
    this.buildFullTire();
    this.updateTransform();
  }

  jump() {
    if (this.isGrounded) {
      this.jumpVelocity = 14.0;
      this.isGrounded = false;
      // Spring squash effect
      this.squashStretch.set(1.2, 0.7, 1.2);
      return true;
    }
    return false;
  }

  update(dt, input) {
    // 1. Steering & Acceleration (supports both analog axis and digital keys)
    let steerInput = 0;
    if (typeof input.steerAxis === 'number' && Math.abs(input.steerAxis) > 0.02) {
      steerInput = input.steerAxis;
    } else {
      steerInput = (input.left ? 1 : 0) - (input.right ? 1 : 0);
    }

    let driveInput = 0;
    if (typeof input.driveAxis === 'number' && Math.abs(input.driveAxis) > 0.02) {
      driveInput = input.driveAxis;
    } else {
      driveInput = (input.forward ? 1 : 0) - (input.backward ? 1 : 0);
    }

    const turbo = input.turbo ? 1.6 : 1.0;

    // Steering rate
    if (steerInput !== 0) {
      this.steeringAngle = THREE.MathUtils.lerp(
        this.steeringAngle,
        steerInput * this.steerSpeed,
        dt * 8.0
      );
    } else {
      this.steeringAngle = THREE.MathUtils.lerp(
        this.steeringAngle,
        0,
        dt * this.steerReturnSpeed
      );
    }

    // Acceleration & linear speed
    const currentMaxSpeed = this.maxSpeed * turbo;
    if (driveInput !== 0) {
      this.linearSpeed += driveInput * this.acceleration * dt * turbo;
      this.linearSpeed = THREE.MathUtils.clamp(this.linearSpeed, -currentMaxSpeed * 0.6, currentMaxSpeed);
    } else {
      // Natural deceleration / rolling friction
      if (this.linearSpeed > 0) {
        this.linearSpeed = Math.max(0, this.linearSpeed - this.friction * dt);
      } else if (this.linearSpeed < 0) {
        this.linearSpeed = Math.min(0, this.linearSpeed + this.friction * dt);
      }
    }

    // 2. Jump / Bounce physics
    if (!this.isGrounded) {
      this.jumpVelocity -= this.gravity * dt;
      this.jumpHeight += this.jumpVelocity * dt;
      if (this.jumpHeight <= 0) {
        this.jumpHeight = 0;
        this.jumpVelocity = 0;
        this.isGrounded = true;
        // Impact squash
        this.squashStretch.set(1.3, 0.65, 1.3);
      }
    }

    // Recover squash & stretch to 1.0
    this.squashStretch.lerp(new THREE.Vector3(1, 1, 1), dt * 9.0);

    // 3. Spherical Motion & Great Circle Rolling
    // Distance traveled this frame
    const deltaDist = this.linearSpeed * dt;

    if (Math.abs(this.steeringAngle) > 0.001) {
      // Rotate forward vector around the surface normal (steering)
      const steerDelta = this.steeringAngle * dt;
      this.forward.applyAxisAngle(this.up, steerDelta).normalize();
      this.right.crossVectors(this.forward, this.up).normalize();
    }

    if (Math.abs(deltaDist) > 0.0001) {
      // Rolling angle delta: strictly s = r * theta!
      const rollDelta = deltaDist / this.radius;
      this.rollAngle += rollDelta;

      // Great circle step on Earth sphere of radius centerDist
      const sphereAngle = deltaDist / this.centerDist;

      // Rotate position and forward vector around axle (right vector)
      this.position.applyAxisAngle(this.right, sphereAngle);
      this.forward.applyAxisAngle(this.right, sphereAngle).normalize();

      // Recalculate up normal from Earth center (0, 0, 0)
      this.up.copy(this.position).normalize();

      // Ensure exact distance from Earth center
      this.position.copy(this.up).multiplyScalar(this.centerDist);

      // Re-orthonormalize right and forward to eliminate precision drift
      this.right.crossVectors(this.forward, this.up).normalize();
      this.forward.crossVectors(this.up, this.right).normalize();
    }

    // 4. Update Three.js meshes
    this.updateTransform();

    return {
      speedRatio: this.linearSpeed / this.maxSpeed,
      contactPos: this.position.clone().addScaledVector(this.up, -this.radius + this.jumpHeight),
      normal: this.up.clone(),
      deltaDist: deltaDist
    };
  }

  updateTransform() {
    // Tire root position: spherical position + vertical jump offset
    const currentPos = this.position.clone().addScaledVector(this.up, this.jumpHeight);
    this.root.position.copy(currentPos);

    // Construct basis matrix from local frame:
    // X = right (axle), Y = up (normal), Z = forward (heading)
    const rotMatrix = new THREE.Matrix4().makeBasis(this.right, this.up, this.forward);
    this.root.quaternion.setFromRotationMatrix(rotMatrix);

    // Apply squash and stretch scale to rollPivot
    this.rollPivot.scale.copy(this.squashStretch);

    // Roll angle around axle (local X axis)
    // Synchronized strictly with rolling distance:
    this.rollPivot.rotation.x = this.rollAngle;

    // If gyroFace is active, the face stays upright
    if (this.params.gyroFace && this.faceAnchor.parent === this.root) {
      this.faceAnchor.rotation.x = 0;
    }
  }

  resetPosition() {
    this.radius = this.params.diameter / 2;
    this.centerDist = this.earthRadius + this.radius;
    this.position.set(0, this.centerDist, 0);
    this.forward.set(0, 0, 1);
    this.up.set(0, 1, 0);
    this.right.set(1, 0, 0);
    this.linearSpeed = 0;
    this.steeringAngle = 0;
    this.rollAngle = 0;
    this.jumpHeight = 0;
    this.jumpVelocity = 0;
    this.isGrounded = true;
    this.updateTransform();
  }
}
