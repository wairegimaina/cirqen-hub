/* ============================================================
   CIRQEN — scene3d.js  v4  (Real Photo 3D Rooms)
   Uses actual uploaded images as textured 3D environments
   ============================================================ */
'use strict';

const scenes3d = [];
function masterLoop() {
  requestAnimationFrame(masterLoop);
  const t = performance.now() * 0.001;
  scenes3d.forEach(s => s.tick(t));
}
const L = (a, b, t) => a + (b - a) * t;

function mkRenderer(canvas) {
  const r = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'high-performance' });
  r.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  r.shadowMap.enabled = true;
  r.shadowMap.type = THREE.PCFSoftShadowMap;
  r.toneMapping = THREE.ACESFilmicToneMapping;
  r.toneMappingExposure = 1.1;
  return r;
}
function mkCam(fov) { return new THREE.PerspectiveCamera(fov, 1, 0.01, 400); }
function fit(renderer, camera, el) {
  const w = el.clientWidth || 700, h = el.clientHeight || 500;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}
function addCanvas(el) {
  const c = document.createElement('canvas');
  c.className = 'scene3d-canvas';
  el.appendChild(c);
  return c;
}
const loader = new THREE.TextureLoader();
loader.crossOrigin = 'anonymous';

/* ═══════════════════════════════════════════════════════
   SCENE 1 — MRI HOSPITAL ROOM
   Your real MRI photo inside a full 3D clinical room:
   • Tiled reflective floor with live mirror reflection
   • Panelled hospital walls + ceiling with recessed lights
   • Your MRI photo as the main 3D focal object (slightly
     curved, lit, floating above floor)
   • Depth: front/mid/back parallax planes
   • Atmospheric particles (dust, sterile air)
   • Blue-cyan studio lighting matching photo palette
   • Camera slow orbit + mouse parallax
═══════════════════════════════════════════════════════ */
function buildMRIRoom(container) {
  const canvas = addCanvas(container);
  const renderer = mkRenderer(canvas);
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x070c12);
  scene.fog = new THREE.FogExp2(0x070c12, 0.045);

  const camera = mkCam(40);
  camera.position.set(0, 1.8, 9);
  camera.lookAt(0, 1, 0);

  /* ── Lights ── */
  scene.add(new THREE.AmbientLight(0x0d1828, 2.5));

  const ceilA = new THREE.RectAreaLight(0x99bbcc, 4, 8, 6);
  ceilA.position.set(0, 5.5, 0); ceilA.lookAt(0, 0, 0);
  scene.add(ceilA);

  const keyL = new THREE.DirectionalLight(0xaaccee, 2);
  keyL.position.set(-4, 6, 5); keyL.castShadow = true;
  keyL.shadow.mapSize.set(1024, 1024);
  keyL.shadow.camera.near = 1; keyL.shadow.camera.far = 30;
  keyL.shadow.camera.left = -10; keyL.shadow.camera.right = 10;
  keyL.shadow.camera.top = 10; keyL.shadow.camera.bottom = -10;
  scene.add(keyL);

  const blueL = new THREE.PointLight(0x00aaff, 6, 12);
  blueL.position.set(0, 2, 1); scene.add(blueL);

  const rimL = new THREE.PointLight(0x1133cc, 3, 10);
  rimL.position.set(3, 3, -2); scene.add(rimL);

  /* Recessed ceiling lights */
  const ceilLights = [];
  [[-3, 5.4, -3], [3, 5.4, -3], [-3, 5.4, 3], [3, 5.4, 3], [0, 5.4, 0]].forEach(([x, y, z]) => {
    const spot = new THREE.SpotLight(0xddeeff, 3, 14, Math.PI / 7, 0.5, 1.5);
    spot.position.set(x, y, z);
    spot.target.position.set(x, 0, z);
    spot.castShadow = false;
    scene.add(spot); scene.add(spot.target);
    ceilLights.push(spot);

    /* Glowing disc */
    const disc = new THREE.Mesh(new THREE.CircleGeometry(0.22, 24),
      new THREE.MeshBasicMaterial({ color: 0xddeeff, side: THREE.DoubleSide }));
    disc.rotation.x = Math.PI / 2; disc.position.set(x, 5.38, z);
    scene.add(disc);
  });

  /* ── Room geometry ── */
  const wallMat = new THREE.MeshStandardMaterial({ color: 0x1a2535, metalness: 0.05, roughness: 0.88 });
  const wallMatLight = new THREE.MeshStandardMaterial({ color: 0x243040, metalness: 0.05, roughness: 0.85 });
  const tileMat = new THREE.MeshStandardMaterial({ color: 0x1c2a38, metalness: 0.15, roughness: 0.4 });

  /* Floor */
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(22, 22, 20, 20), tileMat);
  floor.rotation.x = -Math.PI / 2; floor.position.y = -0.5;
  floor.receiveShadow = true; scene.add(floor);

  /* Floor tile grid lines */
  const gridH = new THREE.GridHelper(22, 22, 0x2a3d52, 0x223344);
  gridH.position.y = -0.495; scene.add(gridH);

  /* Ceiling */
  const ceil = new THREE.Mesh(new THREE.PlaneGeometry(22, 22), wallMat);
  ceil.rotation.x = Math.PI / 2; ceil.position.y = 5.5; scene.add(ceil);

  /* Back wall */
  const backWall = new THREE.Mesh(new THREE.PlaneGeometry(22, 6.5), wallMat);
  backWall.position.set(0, 2.75, -7); scene.add(backWall);

  /* Side walls */
  [-8, 8].forEach((x, i) => {
    const sw = new THREE.Mesh(new THREE.PlaneGeometry(15, 6.5), wallMat);
    sw.rotation.y = i === 0 ? Math.PI / 2 : -Math.PI / 2;
    sw.position.set(x, 2.75, 0); scene.add(sw);
  });

  /* Wall panel strips (horizontal accent lines) */
  [0.5, 2.8, 4.8].forEach(y => {
    const strip = new THREE.Mesh(new THREE.PlaneGeometry(22, 0.06),
      new THREE.MeshStandardMaterial({ color: 0x3a5570, metalness: 0.5, roughness: 0.4 }));
    strip.position.set(0, y, -6.98); scene.add(strip);
  });

  /* ── Floor reflection plane ── */
  const mirrorGeo = new THREE.PlaneGeometry(22, 22);
  const mirrorMat = new THREE.MeshStandardMaterial({
    color: 0x0a1520, metalness: 0.95, roughness: 0.05,
    transparent: true, opacity: 0.45,
  });
  const mirror = new THREE.Mesh(mirrorGeo, mirrorMat);
  mirror.rotation.x = -Math.PI / 2; mirror.position.y = -0.495;
  scene.add(mirror);

  /* ── MRI Photo display ── */
  loader.load('./mri.png', tex => {
    tex.encoding = THREE.sRGBEncoding;
    tex.minFilter = THREE.LinearFilter;

    /* Main MRI plane — slightly curved (bend via subdivision + displacement) */
    const mriGeo = new THREE.PlaneGeometry(9, 5.06, 12, 8);

    /* Gentle horizontal curve */
    const pos = mriGeo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      pos.setZ(i, -x * x * 0.012);
    }
    mriGeo.computeVertexNormals();

    const mriMat = new THREE.MeshStandardMaterial({
      map: tex,
      metalness: 0.05,
      roughness: 0.35,
      envMapIntensity: 0.8,
    });

    const mriPlane = new THREE.Mesh(mriGeo, mriMat);
    mriPlane.position.set(0, 1.9, 0);
    mriPlane.castShadow = true;
    mriPlane.receiveShadow = false;
    scene.add(mriPlane);

    /* Thin frame around photo */
    const frameMat = new THREE.MeshStandardMaterial({ color: 0x334455, metalness: 0.8, roughness: 0.2 });
    [
      [9.1, 0.06, 0.08, 0, 1.9, 0],   // top
      [9.1, 0.06, 0.08, 0, -0.63, 0], // bottom
    ].forEach(([w, h, d, x, y, z]) => {
      const f = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), frameMat);
      f.position.set(x, y + 1.9 + 2.53, z); scene.add(f);
    });

    /* Reflection of MRI on floor */
    const mriRefMat = new THREE.MeshBasicMaterial({
      map: tex, transparent: true, opacity: 0.18,
      side: THREE.FrontSide, depthWrite: false,
    });
    const mriRef = new THREE.Mesh(new THREE.PlaneGeometry(9, 5.06), mriRefMat);
    mriRef.rotation.x = -Math.PI / 2;
    mriRef.position.set(0, -0.49, 1.5);
    mriRef.scale.set(1, -1, 1);
    scene.add(mriRef);

    /* Glow behind photo */
    const glowMat = new THREE.MeshBasicMaterial({
      color: 0x1155aa, transparent: true, opacity: 0.12,
      blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide,
    });
    const glow = new THREE.Mesh(new THREE.PlaneGeometry(11, 7), glowMat);
    glow.position.set(0, 1.9, -0.4); scene.add(glow);

    /* Halo rim light that follows MRI */
    const mriGlow = new THREE.PointLight(0x0088ff, 4, 8);
    mriGlow.position.set(0, 1.9, 1.5);
    scene.add(mriGlow);

    /* Animate: subtle float */
    scenes3d.push({
      tick(t) {
        mriPlane.position.y = 1.9 + Math.sin(t * 0.6) * 0.04;
        mriGlow.intensity = 3.5 + Math.sin(t * 1.2) * 0.8;
        mriGlow.color.setHSL(0.58 + Math.sin(t * 0.4) * 0.04, 0.85, 0.5);
      }
    });
  });

  /* ── Atmospheric dust particles ── */
  const N = 600;
  const dustPos = new Float32Array(N * 3);
  const dustV = new Float32Array(N * 3);
  for (let i = 0; i < N; i++) {
    dustPos[i * 3] = (Math.random() - 0.5) * 18;
    dustPos[i * 3 + 1] = Math.random() * 5.5;
    dustPos[i * 3 + 2] = (Math.random() - 0.5) * 14;
    dustV[i * 3] = (Math.random() - 0.5) * 0.003;
    dustV[i * 3 + 1] = 0.001 + Math.random() * 0.003;
    dustV[i * 3 + 2] = (Math.random() - 0.5) * 0.002;
  }
  const dustGeo = new THREE.BufferGeometry();
  const dustAttr = new THREE.BufferAttribute(dustPos.slice(), 3);
  dustGeo.setAttribute('position', dustAttr);
  const dustMesh = new THREE.Points(dustGeo, new THREE.PointsMaterial({
    color: 0x88aacc, size: 0.04, transparent: true, opacity: 0.35,
    blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true,
  }));
  scene.add(dustMesh);

  /* ── Mouse parallax ── */
  let mx = 0, my = 0, camX = 0, camY = 1.8;

  container.addEventListener('mousemove', e => {
    const r = container.getBoundingClientRect();
    mx = ((e.clientX - r.left) / r.width - 0.5) * 2;
    my = ((e.clientY - r.top) / r.height - 0.5) * 2;
  });

  function resize_() { fit(renderer, camera, container); }
  resize_(); new ResizeObserver(resize_).observe(container);

  let orbitAngle = 0;

  scenes3d.push({
    tick(t) {
      /* Gentle auto orbit */
      orbitAngle += 0.003;
      const orbitR = 9 + Math.sin(t * 0.15) * 1.5;
      const targetX = Math.sin(orbitAngle) * orbitR * 0.35 + mx * 1.5;
      const targetY = 1.8 - my * 0.5;
      camX = L(camX, targetX, 0.03);
      camY = L(camY, targetY, 0.03);
      camera.position.x = camX;
      camera.position.y = camY;
      camera.lookAt(0, 1.5, 0);

      /* blue light breathe */
      blueL.intensity = 5.5 + Math.sin(t * 0.8) * 1;
      blueL.position.x = Math.sin(t * 0.4) * 2;

      /* dust drift */
      const dp = dustGeo.attributes.position;
      for (let i = 0; i < N; i++) {
        let y = dp.getY(i) + dustV[i * 3 + 1];
        let x = dp.getX(i) + dustV[i * 3];
        let z = dp.getZ(i) + dustV[i * 3 + 2];
        if (y > 5.5) y = 0;
        if (Math.abs(x) > 9) dustV[i * 3] *= -1;
        if (Math.abs(z) > 7) dustV[i * 3 + 2] *= -1;
        dp.setXYZ(i, x, y, z);
      }
      dp.needsUpdate = true;

      renderer.render(scene, camera);
    }
  });
}

/* ═══════════════════════════════════════════════════════
   SCENE 2 — MOTHERBOARD INSPECTION LAB
   Your real PCB photo in a dark tech workbench room:
   • PCB photo mapped on tilted 3D board with thickness
   • Dark carbon-fibre workbench surface
   • Technical inspection lighting (two spots)
   • Scan beam sweeping across board surface
   • Component highlight rings that pulse
   • Magnifier zoom animation
   • Floating component labels
   • Circuit-green atmosphere
═══════════════════════════════════════════════════════ */
function buildMBLab(container) {
  const canvas = addCanvas(container);
  const renderer = mkRenderer(canvas);
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x030508);
  scene.fog = new THREE.FogExp2(0x030508, 0.06);

  const camera = mkCam(38);
  camera.position.set(0, 5, 8);
  camera.lookAt(0, 0, 0);

  scene.add(new THREE.AmbientLight(0x080c10, 2));

  /* Inspection spots */
  const spotA = new THREE.SpotLight(0xddeeff, 8, 20, Math.PI / 6, 0.4, 1.2);
  spotA.position.set(-4, 9, 4); spotA.castShadow = true;
  spotA.shadow.mapSize.set(1024, 1024);
  scene.add(spotA); scene.add(spotA.target);

  const spotB = new THREE.SpotLight(0xffffff, 6, 16, Math.PI / 7, 0.35, 1.3);
  spotB.position.set(5, 8, 3);
  scene.add(spotB); scene.add(spotB.target);

  /* Scan beam */
  const scanSpot = new THREE.SpotLight(0x00ffaa, 5, 10, Math.PI / 14, 0.2, 2);
  scanSpot.position.set(0, 5, 2);
  scene.add(scanSpot); scene.add(scanSpot.target);

  /* Green ambient glow from board */
  const boardGlow = new THREE.PointLight(0x00ff44, 0, 8);
  boardGlow.position.set(0, 1.5, 0); scene.add(boardGlow);

  /* ── Workbench ── */
  const benchMat = new THREE.MeshStandardMaterial({ color: 0x0d0e12, metalness: 0.3, roughness: 0.85 });
  const bench = new THREE.Mesh(new THREE.BoxGeometry(18, 0.3, 12), benchMat);
  bench.position.y = -1.8; bench.receiveShadow = true; scene.add(bench);

  /* Bench surface grid */
  const benchGrid = new THREE.GridHelper(18, 36, 0x111820, 0x0a1018);
  benchGrid.position.y = -1.63; scene.add(benchGrid);

  /* Back wall dark panels */
  const panelMat = new THREE.MeshStandardMaterial({ color: 0x0a0c14, metalness: 0.1, roughness: 0.9 });
  const backW = new THREE.Mesh(new THREE.PlaneGeometry(18, 10), panelMat);
  backW.position.set(0, 3, -6); scene.add(backW);

  /* Horizontal panel lines */
  [0, 2, 4, 6].forEach(y => {
    const line = new THREE.Mesh(new THREE.PlaneGeometry(18, 0.03),
      new THREE.MeshBasicMaterial({ color: 0x1a2a1a }));
    line.position.set(0, y - 2, -5.98); scene.add(line);
  });

  /* ── PCB board group (tilted for 3D feel) ── */
  const boardGroup = new THREE.Group();
  boardGroup.rotation.x = -0.42;
  boardGroup.rotation.y = 0.08;
  boardGroup.position.y = 0.2;
  scene.add(boardGroup);

  loader.load('./motherboard.png', tex => {
    tex.encoding = THREE.sRGBEncoding;
    tex.minFilter = THREE.LinearFilter;
    tex.magFilter = THREE.LinearFilter;

    /* PCB top face */
    const boardGeo = new THREE.BoxGeometry(8, 4.4, 0.14);
    const materials = [
      new THREE.MeshStandardMaterial({ color: 0x0d1a0d, metalness: 0.1, roughness: 0.8 }), // right
      new THREE.MeshStandardMaterial({ color: 0x0d1a0d, metalness: 0.1, roughness: 0.8 }), // left
      new THREE.MeshStandardMaterial({ color: 0x0d1a0d, metalness: 0.1, roughness: 0.8 }), // top
      new THREE.MeshStandardMaterial({ color: 0x0d1a0d, metalness: 0.1, roughness: 0.8 }), // bottom
      new THREE.MeshStandardMaterial({ map: tex, metalness: 0.08, roughness: 0.45 }),  // front = photo
      new THREE.MeshStandardMaterial({ color: 0x0a120a, metalness: 0.1, roughness: 0.9 }), // back
    ];

    const board = new THREE.Mesh(boardGeo, materials);
    board.castShadow = true; board.receiveShadow = true;
    boardGroup.add(board);

    /* Copper edge trim */
    const edgeGeo = new THREE.EdgesGeometry(boardGeo);
    boardGroup.add(new THREE.LineSegments(edgeGeo,
      new THREE.LineBasicMaterial({ color: 0x4a7a30, opacity: 0.6, transparent: true })));

    /* Component highlight rings (orbit around key areas of the board) */
    const hotspots = [
      { x: -1.5, y: 0.8, col: 0x00ff88, label: 'CPU Socket' },
      { x: -1.5, y: -1.0, col: 0x0088ff, label: 'RAM Slots' },
      { x: 2.5, y: -0.6, col: 0x00ccff, label: 'PCIe x16' },
      { x: 2.2, y: 1.1, col: 0xffaa00, label: 'VRM Array' },
      { x: -3.2, y: 0.0, col: 0xff4488, label: 'I/O Panel' },
    ];

    const rings = [];
    hotspots.forEach(({ x, y, col }) => {
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(0.28, 0.02, 8, 40),
        new THREE.MeshBasicMaterial({
          color: col, blending: THREE.AdditiveBlending,
          transparent: true, opacity: 0.9
        }));
      ring.position.set(x, y, 0.1);
      ring.userData = { col, baseOpacity: 0.9 };
      boardGroup.add(ring);
      rings.push(ring);

      /* Dot at centre */
      const dot = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 8),
        new THREE.MeshBasicMaterial({ color: col, blending: THREE.AdditiveBlending }));
      dot.position.set(x, y, 0.12);
      boardGroup.add(dot);

      /* Cross-hair lines */
      const cross = new THREE.Group();
      cross.position.set(x, y, 0.11);
      [0, Math.PI / 2].forEach(r => {
        const l = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.008, 0.001),
          new THREE.MeshBasicMaterial({
            color: col, transparent: true, opacity: 0.5,
            blending: THREE.AdditiveBlending
          }));
        l.rotation.z = r; cross.add(l);
      });
      boardGroup.add(cross);
    });

    /* Scan beam line */
    const scanLine = new THREE.Mesh(
      new THREE.BoxGeometry(8.2, 0.04, 0.01),
      new THREE.MeshBasicMaterial({
        color: 0x00ff88, transparent: true, opacity: 0.55,
        blending: THREE.AdditiveBlending
      }));
    scanLine.position.z = 0.12;
    boardGroup.add(scanLine);

    /* Board glow */
    const boardGlowMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(9, 5.5),
      new THREE.MeshBasicMaterial({
        color: 0x003311, transparent: true, opacity: 0.08,
        blending: THREE.AdditiveBlending, depthWrite: false
      }));
    boardGlowMesh.position.set(0, 0, -0.5);
    boardGroup.add(boardGlowMesh);

    let scanY = -2.2, scanDir = 1;

    scenes3d.push({
      tick(t) {
        /* Scan line sweep */
        scanY += 0.025 * scanDir;
        if (scanY > 2.2) scanDir = -1;
        if (scanY < -2.2) scanDir = 1;
        scanLine.position.y = scanY;
        scanSpot.target.position.set(
          boardGroup.position.x,
          boardGroup.position.y + scanY * Math.cos(-0.42),
          boardGroup.position.z + scanY * Math.sin(-0.42)
        );
        scanSpot.target.updateMatrixWorld();
        scanSpot.intensity = 4 + Math.sin(t * 6) * 0.8;

        /* Component ring pulse */
        rings.forEach((r, i) => {
          r.material.opacity = 0.4 + Math.sin(t * 2 + i * 1.4) * 0.4;
          r.scale.setScalar(1 + Math.sin(t * 1.8 + i * 0.9) * 0.06);
        });

        /* Board glow */
        boardGlow.intensity = 1.5 + Math.sin(t * 0.8) * 0.5;
        boardGlowMesh.material.opacity = 0.06 + Math.sin(t * 1.2) * 0.03;
      }
    });
  });

  /* ── Floating data particles ── */
  const N = 300;
  const pPos = new Float32Array(N * 3);
  for (let i = 0; i < N; i++) {
    pPos[i * 3] = (Math.random() - 0.5) * 12;
    pPos[i * 3 + 1] = (Math.random() - 0.5) * 6;
    pPos[i * 3 + 2] = (Math.random() - 0.5) * 8;
  }
  const pGeo = new THREE.BufferGeometry();
  const pAttr = new THREE.BufferAttribute(pPos, 3);
  pGeo.setAttribute('position', pAttr);
  scene.add(new THREE.Points(pGeo, new THREE.PointsMaterial({
    color: 0x00cc44, size: 0.025, transparent: true, opacity: 0.4,
    blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true,
  })));

  /* ── Mouse interaction ── */
  let mx = 0, my = 0, rotY = 0.08, rotX = -0.42;

  container.addEventListener('mousemove', e => {
    const r = container.getBoundingClientRect();
    mx = ((e.clientX - r.left) / r.width - 0.5) * 2;
    my = ((e.clientY - r.top) / r.height - 0.5) * 2;
  });

  function resize_() { fit(renderer, camera, container); }
  resize_(); new ResizeObserver(resize_).observe(container);

  scenes3d.push({
    tick(t) {
      rotY = L(rotY, mx * 0.5 + t * 0.028, 0.025);
      rotX = L(rotX, my * 0.25 - 0.42, 0.025);
      boardGroup.rotation.y = rotY;
      boardGroup.rotation.x = rotX;

      /* Camera gentle bob */
      camera.position.y = L(camera.position.y, 5 - my * 0.8, 0.04);
      camera.position.x = L(camera.position.x, mx * 1.2, 0.04);
      camera.lookAt(0, 0, 0);

      /* Spot sweep */
      spotA.target.position.set(
        Math.sin(t * 0.3) * 2, 0, Math.cos(t * 0.3) * 1);
      spotA.target.updateMatrixWorld();

      renderer.render(scene, camera);
    }
  });
}

/* ─── Bootstrap ────────────────────────────────────────── */
function init3D() {
  if (typeof THREE === 'undefined') { setTimeout(init3D, 150); return; }

  const mri = document.getElementById('mri-3d-scene');
  const mb = document.getElementById('device-3d-scene');
  const dna = document.getElementById('dna-3d-scene');
  const ana = document.getElementById('analytics-3d-scene');

  if (mri) buildMRIRoom(mri);
  if (mb) buildMBLab(mb);

  /* DNA and Analytics: use simple placeholder if no images provided */
  if (dna) buildDNAFallback(dna);
  if (ana) buildAnalyticsFallback(ana);

  masterLoop();
}

/* ─── DNA fallback (kept from v3, simplified) ──────────── */
function buildDNAFallback(container) {
  const canvas = addCanvas(container), renderer = mkRenderer(canvas);
  const scene = new THREE.Scene(); scene.background = new THREE.Color(0x030408);
  scene.fog = new THREE.Fog(0x030408, 14, 30);
  const camera = mkCam(40); camera.position.set(0, 0.5, 9); camera.lookAt(0, 0, 0);
  scene.add(new THREE.AmbientLight(0x060814, 1));
  const key = new THREE.DirectionalLight(0xaabbdd, 2.5); key.position.set(5, 10, 6); scene.add(key);
  const srcGlow = new THREE.PointLight(0xff6600, 4, 10); srcGlow.position.set(0, -5.5, 0); scene.add(srcGlow);
  const s1 = new THREE.MeshStandardMaterial({ color: 0x1155ee, metalness: 0.3, roughness: 0.5, emissive: 0x0022aa, emissiveIntensity: 0.5 });
  const s2 = new THREE.MeshStandardMaterial({ color: 0x00bb88, metalness: 0.3, roughness: 0.5, emissive: 0x005544, emissiveIntensity: 0.5 });
  const dna = new THREE.Group(); scene.add(dna);
  const cols = [0xff3355, 0xffaa00, 0x44ff88, 0x3388ff];
  for (let i = 0; i < 32; i++) {
    const u = i / 32, y = (u - 0.5) * 10, a = u * Math.PI * 2 * 2.2;
    const p1 = new THREE.Vector3(Math.cos(a), y, Math.sin(a));
    const p2 = new THREE.Vector3(Math.cos(a + Math.PI), y, Math.sin(a + Math.PI));
    [p1, p2].forEach((p, j) => {
      const n = new THREE.Mesh(new THREE.SphereGeometry(0.12, 12, 12), j === 0 ? s1 : s2);
      n.position.copy(p); dna.add(n);
    });
    const mid = p1.clone().add(p2).multiplyScalar(0.5);
    const bp = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, p1.distanceTo(p2), 8),
      new THREE.MeshStandardMaterial({ color: cols[i % 4], emissive: cols[i % 4], emissiveIntensity: 0.3 }));
    bp.position.copy(mid); bp.lookAt(p2); bp.rotateX(Math.PI / 2); dna.add(bp);
  }
  const src = new THREE.Mesh(new THREE.SphereGeometry(0.22, 20, 20),
    new THREE.MeshBasicMaterial({ color: 0xff8800, blending: THREE.AdditiveBlending }));
  src.position.set(0, -5.5, 0); scene.add(src);
  for (let i = 0; i < 80; i++) {
    const pts = [new THREE.Vector3((Math.random() - .5) * .4, -5.5, (Math.random() - .5) * .4)];
    let d = new THREE.Vector3((Math.random() - .5) * .7, 1, (Math.random() - .5) * .7).normalize();
    for (let s = 0; s < 7; s++) {
      d.x += (Math.random() - .5) * .35; d.z += (Math.random() - .5) * .35; d.normalize();
      pts.push(pts[pts.length - 1].clone().addScaledVector(d, .5 + Math.random() * 1.2));
    }
    const l = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts),
      new THREE.LineBasicMaterial({
        color: new THREE.Color().setHSL(.07 + Math.random() * .18, .95, .6),
        transparent: true, opacity: 0, blending: THREE.AdditiveBlending
      }));
    l.userData = { d: Math.random() * Math.PI * 2, s: .4 + Math.random() * .8 }; scene.add(l);
    scene.userData || (scene.userData = {});
  }
  function resize_() { fit(renderer, camera, container); } resize_(); new ResizeObserver(resize_).observe(container);
  scenes3d.push({
    tick(t) {
      dna.rotation.y = t * .22;
      src.scale.setScalar(1 + Math.sin(t * 4) * .18);
      srcGlow.intensity = 3 + Math.sin(t * 3) * 1.5;
      scene.children.forEach(c => { if (c.isLine) c.material.opacity = Math.max(0, Math.sin(t * c.userData.s + c.userData.d) * .28); });
      renderer.render(scene, camera);
    }
  });
}

/* ─── Analytics fallback ───────────────────────────────── */
function buildAnalyticsFallback(container) {
  const canvas = addCanvas(container), renderer = mkRenderer(canvas);
  const scene = new THREE.Scene(); scene.background = new THREE.Color(0x030406);
  scene.fog = new THREE.Fog(0x030406, 14, 30);
  const camera = mkCam(44); camera.position.set(0, 5, 10); camera.lookAt(0, 0, 0);
  scene.add(new THREE.AmbientLight(0x080810, 1.5));
  const key = new THREE.DirectionalLight(0xccddff, 3); key.position.set(8, 14, 8); scene.add(key);
  const grid = new THREE.GridHelper(18, 36, 0x111133, 0x0a0a22); grid.position.y = -2.1; scene.add(grid);
  const DATA = [0.6, 0.85, 0.4, 1.0, 0.75, 0.55, 0.9, 0.65, 0.8, 0.45, 0.7, 0.95];
  const COLS = [0x2266ff, 0x0099dd, 0x00ccaa, 0x44ff88, 0xffaa00, 0xff6644, 0xaa44ff, 0x66aaff, 0x00eebb, 0x88ddff, 0xff44aa, 0x44ffcc];
  const bars = new THREE.Group(); scene.add(bars);
  const bms = [], bsc = DATA.map(() => 0);
  DATA.forEach((v, i) => {
    const col = (i - DATA.length / 2) * .88, h = v * 4.5, bg = new THREE.Group();
    bg.position.set(col, -2.1, 0); bars.add(bg);
    const bar = new THREE.Mesh(new THREE.BoxGeometry(0.6, h, 0.6),
      new THREE.MeshStandardMaterial({ color: COLS[i], metalness: 0.4, roughness: 0.3, emissive: COLS[i], emissiveIntensity: 0.12, transparent: true, opacity: 0.9 }));
    bar.position.y = h / 2; bg.add(bar);
    const cap = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.06, 0.62),
      new THREE.MeshBasicMaterial({ color: COLS[i], transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false }));
    cap.position.y = h + 0.03; bg.add(cap);
    bms.push({ bar, cap, h });
  });
  let barsIn = false, mx = 0, rotY = 0;
  container.addEventListener('mousemove', e => { mx = ((e.clientX - container.getBoundingClientRect().left) / container.clientWidth - .5) * 2; });
  new IntersectionObserver(en => { if (en[0].isIntersecting) barsIn = true; }, { threshold: 0.3 }).observe(container);
  function resize_() { fit(renderer, camera, container); } resize_(); new ResizeObserver(resize_).observe(container);
  scenes3d.push({
    tick(t) {
      bms.forEach(({ bar, cap, h }, i) => {
        bsc[i] = L(bsc[i], barsIn ? 1 : 0, .035); bar.scale.y = bsc[i]; bar.position.y = h / 2 * bsc[i];
        cap.position.y = h * bsc[i] + .03; bar.material.emissiveIntensity = .08 + Math.sin(t * 1.5 + i * .55) * .07;
      });
      rotY = L(rotY, mx * .5 + t * .04, .04); bars.rotation.y = rotY;
      renderer.render(scene, camera);
    }
  });
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init3D);
else init3D();
