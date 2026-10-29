import * as THREE from 'three';

export class StandaloneTire {
  constructor(scene, earthRadius = 26.0) {
    this.scene = scene;
    this.earthRadius = earthRadius;

    // Customization parameters
    this.params = {
      diameter: 3.2,             // Outer diameter
      width: 1.8,                // Tire tread width
      rimRatio: 0.58,            // Rim diameter as fraction of tire diameter
      rubberColor: '#2b2d31',    // Deep charcoal clay rubber
      rimColor: '#3c4048',       // Rim backdrop color
      eyeColor: '#4ea8de',       // Cyan/blue clay eyes
      noseSmileColor: '#ff733b', // Bright orange clay nose & smile
      letterColor: '#ffd166',    // Bright warm gold clay for "TÂN" lettering
      roughness: 0.65,
      metalness: 0.05,
      treadPattern: 'chevron',   // chevron, chunky, paddle, heart, smooth
      rimStyle: 'face',          // face, star, swirl, spokes, disc
      faceEnabled: true,
      gyroFace: false,           // whether face stays upright or tumbles with tire
      hasSidewallRings: true,
      showTanText: true,         // Show 3D raised "TÂN" lettering
      antennaStyle: 'crown'      // none, crown, star, heart
    };

    // Dimensions
    this.radius = this.params.diameter / 2;
    this.centerDist = this.earthRadius + this.radius;

    // Strict Right-Handed Coordinate System:
    // right (X = 1, 0, 0), up (Y = 0, 1, 0), forward (Z = 0, 0, 1)
    // right x up = forward
    // up x forward = right
    // forward x right = up
    this.position = new THREE.Vector3(0, this.centerDist, 0); // Start at North Pole
    this.forward = new THREE.Vector3(0, 0, 1);
    this.up = new THREE.Vector3(0, 1, 0);
    this.right = new THREE.Vector3(1, 0, 0);

    // Dynamics
    this.linearSpeed = 0;
    this.maxSpeed = 16.0;
    this.acceleration = 18.0;
    this.friction = 7.5;
    this.steeringAngle = 0;
    this.steerSpeed = 2.6;
    this.steerReturnSpeed = 7.0;
    this.rollAngle = 0;

    // Jump dynamics (pure position offset, NO mesh deformation)
    this.jumpHeight = 0;
    this.jumpVelocity = 0;
    this.gravity = 35.0;
    this.isGrounded = true;

    // Three.js Hierarchy
    this.root = new THREE.Group();
    this.scene.add(this.root);

    // Roll pivot (rotates strictly around X axle with uniform 1,1,1 scale)
    this.rollPivot = new THREE.Group();
    this.root.add(this.rollPivot);

    // Face group
    this.faceAnchor = new THREE.Group();
    this.rollPivot.add(this.faceAnchor);

    // Antenna group
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
      roughness: 0.45,
      metalness: 0.1
    });

    this.eyeMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color(this.params.eyeColor),
      roughness: 0.3,
      metalness: 0.05
    });

    this.pupilMaterial = new THREE.MeshStandardMaterial({
      color: 0x111317,
      roughness: 0.15,
      metalness: 0.1
    });

    this.accentMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color(this.params.noseSmileColor),
      roughness: 0.4,
      metalness: 0.05
    });

    this.letterMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color(this.params.letterColor),
      roughness: 0.32,
      metalness: 0.12,
      emissive: new THREE.Color(0x3a2a00)
    });

    this.blushMaterial = new THREE.MeshStandardMaterial({
      color: 0xff8fa3,
      roughness: 0.5,
      metalness: 0.02
    });

    this.buildFullTire();
    this.updateTransform();
  }

  buildFullTire() {
    // Clear previous geometry children
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

    // Build the main tire rubber torus/body with pristine roundness
    this.buildRubberBody();

    // Build raised 3D tread blocks
    this.buildTreads();

    // Build rim & wheel hub
    this.buildRim();

    // Build decorative sidewall rings and 3D "TÂN" lettering
    this.buildSidewallDetails();

    // Build Face if rim style is 'face' or faceEnabled
    if (this.params.faceEnabled && this.params.rimStyle === 'face') {
      this.buildCuteFace();
    }

    // Build Antenna / Crown topper
    if (this.params.antennaStyle !== 'none') {
      this.buildAntenna();
    }

    // Gyro Face attachment
    if (this.params.gyroFace) {
      this.root.add(this.faceAnchor);
    } else {
      this.rollPivot.add(this.faceAnchor);
    }

    // Ensure scale is always strictly uniform (1, 1, 1)
    this.rollPivot.scale.set(1, 1, 1);
    this.root.scale.set(1, 1, 1);
  }

  buildRubberBody() {
    const outerR = this.radius;
    const rimR = outerR * this.params.rimRatio;
    const halfW = this.params.width / 2;

    // Plump, perfectly rounded, chunky toy tire profile
    const controlPoints = [
      new THREE.Vector2(rimR, -halfW * 0.70),
      new THREE.Vector2(rimR * 1.06, -halfW * 0.94),
      new THREE.Vector2(rimR + (outerR - rimR) * 0.42, -halfW * 1.02),
      new THREE.Vector2(outerR * 0.92, -halfW * 0.96),
      new THREE.Vector2(outerR * 0.986, -halfW * 0.55),
      new THREE.Vector2(outerR, 0),
      new THREE.Vector2(outerR * 0.986, halfW * 0.55),
      new THREE.Vector2(outerR * 0.92, halfW * 0.96),
      new THREE.Vector2(rimR + (outerR - rimR) * 0.42, halfW * 1.02),
      new THREE.Vector2(rimR * 1.06, halfW * 0.94),
      new THREE.Vector2(rimR, halfW * 0.70)
    ];

    const spline = new THREE.SplineCurve(controlPoints);
    const profilePoints = spline.getPoints(26);

    const latheGeo = new THREE.LatheGeometry(profilePoints, 48);
    latheGeo.rotateZ(-Math.PI / 2);
    latheGeo.computeVertexNormals();

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

      const radY = cosA;
      const radZ = sinA;

      if (pattern === 'chevron') {
        // Chunky V-groove chevron treads matching Reference #2
        const armW = width * 0.44;
        const armH = outerR * 0.095;
        const armL = outerR * 0.17;
        const armGeo = new THREE.BoxGeometry(armW, armH, armL);

        [-1, 1].forEach(side => {
          const arm = new THREE.Mesh(armGeo, treadMat);
          arm.castShadow = true;

          const xPos = side * (width * 0.22);
          const yPos = outerR * 0.992 * radY;
          const zPos = outerR * 0.992 * radZ;
          arm.position.set(xPos, yPos, zPos);

          const vAngle = side * 0.42;
          const rotQ = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), -angle);
          const vQ = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), vAngle);
          arm.quaternion.copy(rotQ).multiply(vQ);

          this.rollPivot.add(arm);
        });

      } else if (pattern === 'chunky') {
        const isStagger = i % 2 === 0;
        const cleatW = width * 0.38;
        const cleatH = outerR * 0.12;
        const cleatL = outerR * 0.15;
        const cleatGeo = new THREE.BoxGeometry(cleatW, cleatH, cleatL);

        const cleat = new THREE.Mesh(cleatGeo, treadMat);
        cleat.castShadow = true;

        const xOff = isStagger ? -width * 0.22 : width * 0.22;
        cleat.position.set(xOff, outerR * 0.995 * radY, outerR * 0.995 * radZ);
        cleat.quaternion.setFromAxisAngle(new THREE.Vector3(1, 0, 0), -angle);
        this.rollPivot.add(cleat);

        const centerGeo = new THREE.BoxGeometry(width * 0.22, cleatH * 0.85, cleatL * 0.8);
        const center = new THREE.Mesh(centerGeo, treadMat);
        center.castShadow = true;
        center.position.set(0, outerR * 0.995 * radY, outerR * 0.995 * radZ);
        center.quaternion.setFromAxisAngle(new THREE.Vector3(1, 0, 0), -angle);
        this.rollPivot.add(center);

      } else if (pattern === 'paddle') {
        const paddleGeo = new THREE.BoxGeometry(width * 0.88, outerR * 0.13, outerR * 0.15);
        const paddle = new THREE.Mesh(paddleGeo, treadMat);
        paddle.castShadow = true;
        paddle.position.set(0, outerR * 1.005 * radY, outerR * 1.005 * radZ);
        paddle.quaternion.setFromAxisAngle(new THREE.Vector3(1, 0, 0), -angle);
        this.rollPivot.add(paddle);

      } else if (pattern === 'heart') {
        const heartGeo = new THREE.CylinderGeometry(outerR * 0.085, outerR * 0.085, width * 0.34, 14);
        heartGeo.rotateZ(Math.PI / 2);
        const heart = new THREE.Mesh(heartGeo, treadMat);
        heart.castShadow = true;
        heart.position.set(0, outerR * 1.005 * radY, outerR * 1.005 * radZ);
        heart.quaternion.setFromAxisAngle(new THREE.Vector3(1, 0, 0), -angle);
        this.rollPivot.add(heart);
      }
    }
  }

  buildRim() {
    const outerR = this.radius;
    const rimR = outerR * this.params.rimRatio;
    const halfW = this.params.width / 2;
    const style = this.params.rimStyle;

    const hubDepth = halfW * 0.8;
    const discGeo = new THREE.CylinderGeometry(rimR * 0.98, rimR * 0.98, hubDepth, 32);
    discGeo.rotateZ(Math.PI / 2);

    const hub = new THREE.Mesh(discGeo, this.rimMaterial);
    hub.castShadow = true;
    hub.receiveShadow = true;
    this.rollPivot.add(hub);

    // Decorative inner rim ring
    const ringGeo = new THREE.TorusGeometry(rimR * 0.96, rimR * 0.07, 16, 32);
    ringGeo.rotateY(Math.PI / 2);

    [-1, 1].forEach(side => {
      const ring = new THREE.Mesh(ringGeo, this.rimMaterial);
      ring.position.x = side * (halfW * 0.55);
      this.rollPivot.add(ring);
    });

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

    // Decorative sidewall rings
    if (this.params.hasSidewallRings) {
      const ringGeo = new THREE.TorusGeometry(ringR, outerR * 0.035, 16, 48);
      ringGeo.rotateY(Math.PI / 2);

      [-1, 1].forEach(side => {
        const ring = new THREE.Mesh(ringGeo, this.accentMaterial);
        ring.position.x = side * (halfW * 0.98);
        ring.castShadow = true;
        this.rollPivot.add(ring);
      });
    }

    // 3D RAISED CLAY LETTERING "★ TÂN ★" CURVED ALONG THE UPPER SIDEWALL
    if (this.params.showTanText) {
      [-1, 1].forEach(side => {
        this.buildCurvedTextTan(side, halfW, outerR, rimR);
      });
    }
  }

  // Builder for 3D raised curved "★ TÂN ★" on sidewall
  buildCurvedTextTan(side, halfW, outerR, rimR) {
    const textRadius = rimR + (outerR - rimR) * 0.62;
    const letterScale = outerR * 0.45;
    const xPos = side * (halfW * 1.015);

    // Letter elements to curve along upper arc
    // Angle spacing along the circular upper perimeter (radians)
    const elements = [
      { type: 'star', angle: -0.42 },
      { type: 'T',    angle: -0.21 },
      { type: 'A',    angle: 0.00 },
      { type: 'N',    angle: 0.21 },
      { type: 'star', angle: 0.42 }
    ];

    elements.forEach(item => {
      let mesh = null;
      if (item.type === 'T') {
        mesh = this.createLetterT(letterScale);
      } else if (item.type === 'A') {
        mesh = this.createLetterA(letterScale);
      } else if (item.type === 'N') {
        mesh = this.createLetterN(letterScale);
      } else if (item.type === 'star') {
        mesh = this.createClayStar(letterScale * 0.42);
      }

      if (!mesh) return;

      // When side = 1 (right side): angle positive is +Z
      // When side = -1 (left side): mirror angle so text reads left-to-right on both sides!
      const effAngle = side > 0 ? item.angle : -item.angle;

      const y = textRadius * Math.cos(effAngle);
      const z = textRadius * Math.sin(effAngle);

      mesh.position.set(xPos, y, z);

      // Rotate letter to align tangentially to the circle arc
      // Base rotation so letter face normal points outward (+X on right, -X on left)
      if (side > 0) {
        mesh.rotation.y = Math.PI / 2;
        mesh.rotation.x = effAngle;
      } else {
        mesh.rotation.y = -Math.PI / 2;
        mesh.rotation.x = -effAngle;
      }

      this.rollPivot.add(mesh);
    });

    // Cute decorative bottom dots on opposite side of tire
    for (let i = -2; i <= 2; i++) {
      const dotA = Math.PI + i * 0.18;
      const dotGeo = new THREE.SphereGeometry(outerR * 0.035, 10, 8);
      dotGeo.scale(0.5, 1, 1);
      const dot = new THREE.Mesh(dotGeo, this.letterMaterial);
      dot.position.set(xPos, textRadius * Math.cos(dotA), textRadius * Math.sin(dotA));
      this.rollPivot.add(dot);
    }
  }

  createLetterT(scale) {
    const group = new THREE.Group();
    // Top bar
    const barGeo = new THREE.BoxGeometry(scale * 0.38, scale * 0.08, scale * 0.065);
    const topBar = new THREE.Mesh(barGeo, this.letterMaterial);
    topBar.castShadow = true;
    topBar.position.y = scale * 0.16;
    group.add(topBar);

    // Stem
    const stemGeo = new THREE.BoxGeometry(scale * 0.09, scale * 0.35, scale * 0.065);
    const stem = new THREE.Mesh(stemGeo, this.letterMaterial);
    stem.castShadow = true;
    stem.position.y = -scale * 0.02;
    group.add(stem);

    return group;
  }

  createLetterA(scale) {
    const group = new THREE.Group();
    const legGeo = new THREE.BoxGeometry(scale * 0.08, scale * 0.38, scale * 0.065);

    // Left leg
    const leftLeg = new THREE.Mesh(legGeo, this.letterMaterial);
    leftLeg.castShadow = true;
    leftLeg.position.set(-scale * 0.09, -scale * 0.02, 0);
    leftLeg.rotation.z = 0.28;
    group.add(leftLeg);

    // Right leg
    const rightLeg = new THREE.Mesh(legGeo, this.letterMaterial);
    rightLeg.castShadow = true;
    rightLeg.position.set(scale * 0.09, -scale * 0.02, 0);
    rightLeg.rotation.z = -0.28;
    group.add(rightLeg);

    // Crossbar
    const crossGeo = new THREE.BoxGeometry(scale * 0.17, scale * 0.065, scale * 0.065);
    const cross = new THREE.Mesh(crossGeo, this.letterMaterial);
    cross.castShadow = true;
    cross.position.set(0, -scale * 0.06, 0);
    group.add(cross);

    // Hat circumflex '^' for Â
    const hatGeo = new THREE.BoxGeometry(scale * 0.065, scale * 0.13, scale * 0.065);
    const leftHat = new THREE.Mesh(hatGeo, this.letterMaterial);
    leftHat.castShadow = true;
    leftHat.position.set(-scale * 0.045, scale * 0.23, 0);
    leftHat.rotation.z = 0.75;
    group.add(leftHat);

    const rightHat = new THREE.Mesh(hatGeo, this.letterMaterial);
    rightHat.castShadow = true;
    rightHat.position.set(scale * 0.045, scale * 0.23, 0);
    rightHat.rotation.z = -0.75;
    group.add(rightHat);

    return group;
  }

  createLetterN(scale) {
    const group = new THREE.Group();
    const stemGeo = new THREE.BoxGeometry(scale * 0.08, scale * 0.38, scale * 0.065);

    // Left stem
    const leftStem = new THREE.Mesh(stemGeo, this.letterMaterial);
    leftStem.castShadow = true;
    leftStem.position.set(-scale * 0.13, -scale * 0.02, 0);
    group.add(leftStem);

    // Right stem
    const rightStem = new THREE.Mesh(stemGeo, this.letterMaterial);
    rightStem.castShadow = true;
    rightStem.position.set(scale * 0.13, -scale * 0.02, 0);
    group.add(rightStem);

    // Diagonal
    const diagGeo = new THREE.BoxGeometry(scale * 0.075, scale * 0.41, scale * 0.065);
    const diag = new THREE.Mesh(diagGeo, this.letterMaterial);
    diag.castShadow = true;
    diag.position.set(0, -scale * 0.02, 0);
    diag.rotation.z = -0.62;
    group.add(diag);

    return group;
  }

  createClayStar(size) {
    const starGeo = new THREE.OctahedronGeometry(size, 0);
    starGeo.scale(0.5, 1.0, 1.0);
    const star = new THREE.Mesh(starGeo, this.letterMaterial);
    star.castShadow = true;
    return star;
  }

  buildCuteFace() {
    const outerR = this.radius;
    const rimR = outerR * this.params.rimRatio;
    const halfW = this.params.width / 2;

    [-1, 1].forEach(side => {
      const faceSide = new THREE.Group();
      faceSide.position.x = side * (halfW * 0.48);
      if (side < 0) {
        faceSide.rotation.y = Math.PI;
      }

      const eyeScale = rimR * 0.32;

      // Eyes: Pill / Capsule geometry (blue clay)
      const eyeGeo = new THREE.CapsuleGeometry(eyeScale * 0.52, eyeScale * 0.62, 12, 16);
      eyeGeo.scale(0.4, 1.0, 0.75);

      // Pupils: black glossy beads
      const pupilGeo = new THREE.SphereGeometry(eyeScale * 0.35, 16, 12);
      pupilGeo.scale(0.3, 1.0, 0.9);

      // Specular highlight
      const hlGeo = new THREE.SphereGeometry(eyeScale * 0.12, 8, 8);
      const hlMat = new THREE.MeshBasicMaterial({ color: 0xffffff });

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

      // Cute Blushing Cheeks (pink clay)
      const blushGeo = new THREE.SphereGeometry(rimR * 0.14, 14, 10);
      blushGeo.scale(0.3, 1.0, 1.0);

      const leftBlush = new THREE.Mesh(blushGeo, this.blushMaterial);
      leftBlush.position.set(rimR * 0.09, -rimR * 0.08, rimR * 0.44);
      faceSide.add(leftBlush);

      const rightBlush = new THREE.Mesh(blushGeo, this.blushMaterial);
      rightBlush.position.set(rimR * 0.09, -rimR * 0.08, -rimR * 0.44);
      faceSide.add(rightBlush);

      // Nose: Round clay ball in center with highlight
      const noseGeo = new THREE.SphereGeometry(rimR * 0.22, 20, 16);
      noseGeo.scale(0.85, 1.0, 1.0);
      const nose = new THREE.Mesh(noseGeo, this.accentMaterial);
      nose.castShadow = true;
      nose.position.set(rimR * 0.14, 0, 0);
      faceSide.add(nose);

      const noseHl = new THREE.Mesh(hlGeo, hlMat);
      noseHl.position.set(rimR * 0.14 + eyeScale * 0.18, eyeScale * 0.12, 0);
      faceSide.add(noseHl);

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

      // Cute cheek dimples at smile tips
      const dimpleGeo = new THREE.SphereGeometry(rimR * 0.08, 12, 10);
      const leftDimple = new THREE.Mesh(dimpleGeo, this.accentMaterial);
      leftDimple.position.set(rimR * 0.09, -rimR * 0.18, rimR * 0.44);
      faceSide.add(leftDimple);

      const rightDimple = new THREE.Mesh(dimpleGeo, this.accentMaterial);
      rightDimple.position.set(rimR * 0.09, -rimR * 0.18, -rimR * 0.44);
      faceSide.add(rightDimple);

      this.faceAnchor.add(faceSide);
    });
  }

  buildAntenna() {
    const outerR = this.radius;
    const style = this.params.antennaStyle;

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

    if (style === 'crown') {
      // Golden "TÂN" Crown Badge on top of tire!
      const crownGroup = new THREE.Group();
      crownGroup.position.set(0, outerR + 1.38, 0);

      // Gold badge base
      const badgeGeo = new THREE.CylinderGeometry(0.55, 0.55, 0.12, 24);
      badgeGeo.rotateX(Math.PI / 2);
      const badge = new THREE.Mesh(badgeGeo, this.letterMaterial);
      badge.castShadow = true;
      crownGroup.add(badge);

      // Mini 3D "TÂN" text on the crown badge
      const letterScale = 0.38;
      const tMesh = this.createLetterT(letterScale);
      tMesh.position.set(-0.25, 0, 0.08);
      crownGroup.add(tMesh);

      const aMesh = this.createLetterA(letterScale);
      aMesh.position.set(0, 0, 0.08);
      crownGroup.add(aMesh);

      const nMesh = this.createLetterN(letterScale);
      nMesh.position.set(0.25, 0, 0.08);
      crownGroup.add(nMesh);

      this.antennaGroup.add(crownGroup);

    } else if (style === 'star') {
      const topperGeo = new THREE.OctahedronGeometry(0.38, 0);
      const topper = new THREE.Mesh(topperGeo, this.letterMaterial);
      topper.position.set(0, outerR + 1.35, 0);
      this.antennaGroup.add(topper);

    } else if (style === 'heart') {
      const topperGeo = new THREE.SphereGeometry(0.32, 16, 12);
      const topper = new THREE.Mesh(topperGeo, this.accentMaterial);
      topper.position.set(0, outerR + 1.35, 0);
      this.antennaGroup.add(topper);
    }
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
    if (this.params.letterColor) {
      this.letterMaterial.color.set(this.params.letterColor);
    }

    // Rebuild geometry
    this.buildFullTire();

    // Re-anchor to ground cleanly without sinking
    this.position.copy(this.up).multiplyScalar(this.centerDist);
    this.updateTransform();
  }

  jump() {
    if (this.isGrounded) {
      this.jumpVelocity = 14.0;
      this.isGrounded = false;
      return true;
    }
    return false;
  }

  update(dt, input) {
    // 1. Steering & Acceleration
    // When input.left is pressed or joystick dragged left: steerInput is POSITIVE
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
    if (Math.abs(steerInput) > 0.01) {
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
    if (Math.abs(driveInput) > 0.01) {
      this.linearSpeed += driveInput * this.acceleration * dt * turbo;
      this.linearSpeed = THREE.MathUtils.clamp(this.linearSpeed, -currentMaxSpeed * 0.6, currentMaxSpeed);
    } else {
      if (this.linearSpeed > 0) {
        this.linearSpeed = Math.max(0, this.linearSpeed - this.friction * dt);
      } else if (this.linearSpeed < 0) {
        this.linearSpeed = Math.min(0, this.linearSpeed + this.friction * dt);
      }
    }

    // 2. Jump / Bounce physics (pure position offset, NO mesh deformation)
    if (!this.isGrounded) {
      this.jumpVelocity -= this.gravity * dt;
      this.jumpHeight += this.jumpVelocity * dt;
      if (this.jumpHeight <= 0) {
        this.jumpHeight = 0;
        this.jumpVelocity = 0;
        this.isGrounded = true;
      }
    }

    // 3. Spherical Motion & Great Circle Rolling
    const deltaDist = this.linearSpeed * dt;

    // Steering: Rotate forward vector around local Up normal
    // Fixed: Left input steers LEFT, Right input steers RIGHT!
    if (Math.abs(this.steeringAngle) > 0.001) {
      const steerDelta = this.steeringAngle * dt;
      this.forward.applyAxisAngle(this.up, steerDelta).normalize();

      // Maintain strict Right-Handed Orthonormal Basis:
      // right = up x forward
      // forward = right x up
      this.right.crossVectors(this.up, this.forward).normalize();
      this.forward.crossVectors(this.right, this.up).normalize();
    }

    // Great circle forward step on Earth sphere of radius centerDist
    if (Math.abs(deltaDist) > 0.0001) {
      // Rotation angle strictly synchronized: delta theta = delta s / r
      const rollDelta = deltaDist / this.radius;
      this.rollAngle += rollDelta;

      // Angular displacement along Earth sphere
      const sphereAngle = deltaDist / this.centerDist;

      // Rotate position and heading vector around axle (right vector)
      this.position.applyAxisAngle(this.right, sphereAngle);
      this.forward.applyAxisAngle(this.right, sphereAngle).normalize();

      // Surface normal pointing from Earth center (0, 0, 0)
      this.up.copy(this.position).normalize();

      // Ensure exact radial distance from Earth center
      this.position.copy(this.up).multiplyScalar(this.centerDist);

      // Re-orthonormalize:
      // right = up x forward
      // forward = right x up
      this.right.crossVectors(this.up, this.forward).normalize();
      this.forward.crossVectors(this.right, this.up).normalize();
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
    // Root position: sphere surface position + jump height
    const currentPos = this.position.clone().addScaledVector(this.up, this.jumpHeight);
    this.root.position.copy(currentPos);

    // Guaranteed Right-Handed Rotation Matrix:
    // Column 0 = right (+X axle)
    // Column 1 = up (+Y normal)
    // Column 2 = forward (+Z heading)
    // Determinant is strictly +1.0!
    const rotMatrix = new THREE.Matrix4().makeBasis(this.right, this.up, this.forward);
    this.root.quaternion.setFromRotationMatrix(rotMatrix);

    // Rolling rotation strictly around axle (local X axis)
    this.rollPivot.rotation.x = this.rollAngle;

    // Scale is strictly (1, 1, 1) - no mesh distortion ever
    this.rollPivot.scale.set(1, 1, 1);
    this.root.scale.set(1, 1, 1);

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
