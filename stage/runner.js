/* ==========================================================================
   Run to the Stage — a 3-lane runner through the Coliseu Porto.
   Dad (a 3D model built in code, based on his portrait: bald, big smile,
   black western shirt with red rose-embroidered yoke) runs down the main aisle of the Art Deco hall. Jump chairs, flight cases and saxes, slide
   under keyboards, dodge drum kits and speaker columns, collect guitar picks.
   Reach the stage and he smashes his guitar. Uses three.js (assets/vendor/three.min.js, r128).
   ========================================================================== */
(function () {
  "use strict";
  const { sfx, fx, store } = Arcade;
  const { t } = I18n;
  const $ = (id) => document.getElementById(id);

  /* ------------------------------------------------------------ tuning */
  const LANE = 2.3;            // lane spacing
  const LENGTH = 820;          // distance from the start to the stage steps
  const SPEED0 = 14, SPEED1 = 23;
  const GRAVITY = 34, JUMP_V = 12.5;
  const SLIDE_TIME = 0.78;
  const LIVES = 3;
  const STAGE_Z = -LENGTH;     // front edge of the stage

  // Background music, kept quiet. Put the song at assets/audio/money-for-nothing.mp3
  // (until then it falls back to Sultans of Swing). `start` = seconds into the song.
  const MUSIC = {
    src: "../assets/audio/money-for-nothing.mp3",
    fallback: "../assets/audio/sultans-of-swing.mp3",
    start: 0, fallbackStart: 26,
    volume: 0.2, danceVolume: 0.32,
  };

  /* ---------------------------------------------------------- renderer */
  const canvas = $("scene");
  const mobile = Math.min(innerWidth, innerHeight) < 700;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance" });
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  const C = (hex) => new THREE.Color(hex).convertSRGBToLinear();

  const scene = new THREE.Scene();
  scene.background = C(0x2a1d12);
  scene.fog = new THREE.Fog(C(0x3a2a1a), 50, 340);
  const camera = new THREE.PerspectiveCamera(60, 1, 0.05, 1600);

  function resize() {
    const w = innerWidth, h = innerHeight;
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, w < 900 ? 1.5 : 2));
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.fov = w / h < 0.8 ? 72 : w / h < 1.2 ? 64 : 56;
    camera.updateProjectionMatrix();
  }
  addEventListener("resize", resize);
  resize();

  let ENV = null; // warm reflections for metal surfaces only (gold trim, chrome, cymbals), set up below
  const std = (hex, o = {}) => new THREE.MeshStandardMaterial(Object.assign({ color: C(hex), roughness: 0.7, metalness: 0, envMap: (o.metalness || 0) >= 0.5 ? ENV : null }, o));
  const glow = (hex, o = {}) => new THREE.MeshBasicMaterial(Object.assign({ color: C(hex) }, o));
  const box = (w, h, d) => new THREE.BoxGeometry(w, h, d);
  const cyl = (rt, rb, h, s = 20) => new THREE.CylinderGeometry(rt, rb, h, s);
  const sph = (r, a = 20, b = 14) => new THREE.SphereGeometry(r, a, b);
  function mesh(geo, mat, x = 0, y = 0, z = 0, parent = scene) {
    const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); parent.add(m); return m;
  }
  function canvasTex(w, h, draw, rx = 1, ry = 1) {
    const c = document.createElement("canvas"); c.width = w; c.height = h;
    draw(c.getContext("2d"), w, h);
    const tx = new THREE.CanvasTexture(c);
    tx.encoding = THREE.sRGBEncoding;
    tx.wrapS = tx.wrapT = THREE.RepeatWrapping; tx.repeat.set(rx, ry);
    tx.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
    return tx;
  }
  function texCopy(tx, rx, ry) { const c = tx.clone(); c.repeat.set(rx, ry); c.needsUpdate = true; return c; }
  const noise = (g, w, h, a = 0.06, n = 4000) => {
    for (let i = 0; i < n; i++) { g.fillStyle = `rgba(${Math.random() < 0.5 ? "0,0,0" : "255,255,255"},${Math.random() * a})`; g.fillRect(Math.random() * w, Math.random() * h, 2, 2); }
  };

  {
    // a soft "hall" panorama: cream ceiling with lamps, gold band, dark wood below
    const pano = canvasTex(256, 128, (g, w, h) => {
      const gr = g.createLinearGradient(0, 0, 0, h);
      gr.addColorStop(0, "#fff6e0"); gr.addColorStop(0.42, "#e8cf9a"); gr.addColorStop(0.52, "#b08a4a");
      gr.addColorStop(0.6, "#5a3420"); gr.addColorStop(1, "#22120a");
      g.fillStyle = gr; g.fillRect(0, 0, w, h);
      g.fillStyle = "rgba(255,250,230,.95)";
      for (let i = 0; i < 16; i++) { g.beginPath(); g.arc((i + 0.5) * w / 16, 18 + (i % 3) * 9, 3, 0, 7); g.fill(); }
    });
    pano.mapping = THREE.EquirectangularReflectionMapping;
    const pm = new THREE.PMREMGenerator(renderer);
    ENV = pm.fromEquirectangular(pano).texture;
    pm.dispose();
  }

  /* --------------------------------------------------------- lighting */
  scene.add(new THREE.HemisphereLight(C(0xfff0d8), C(0x4a3420), 0.6));
  const sun = new THREE.DirectionalLight(C(0xffe6c2), 1.15);
  sun.castShadow = true;
  sun.shadow.mapSize.set(mobile ? 1024 : 2048, mobile ? 1024 : 2048);
  Object.assign(sun.shadow.camera, { left: -7, right: 7, top: 7, bottom: -7, near: 1, far: 40 });
  sun.shadow.bias = -0.0006;
  scene.add(sun, sun.target);
  const fill = new THREE.DirectionalLight(C(0xffd6a0), 0.35); // warm front fill so his face is lit
  scene.add(fill, fill.target);

  /* ================================================ textures (Art Deco) */
  const GOLD = "#c9a24e", CREAM = "#ecdcb2";

  const woodTex = canvasTex(512, 512, (g, w, h) => {
    for (let i = 0; i < 8; i++) {
      const y = i * h / 8; g.fillStyle = i % 2 ? "#5a3a22" : "#634026"; g.fillRect(0, y, w, h / 8);
      g.strokeStyle = "rgba(0,0,0,.35)"; g.lineWidth = 3; g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke();
      for (let k = 0; k < 14; k++) { g.strokeStyle = "rgba(40,20,8,.18)"; g.lineWidth = 1; g.beginPath(); const yy = y + Math.random() * h / 8; g.moveTo(0, yy); g.bezierCurveTo(w / 3, yy + 4, w * 2 / 3, yy - 4, w, yy); g.stroke(); }
    }
    noise(g, w, h, 0.05);
  }, 8, 120);

  const carpetTex = canvasTex(256, 256, (g, w, h) => {
    g.fillStyle = "#7c1622"; g.fillRect(0, 0, w, h);
    noise(g, w, h, 0.08, 6000);
    g.strokeStyle = "rgba(201,162,78,.55)"; g.lineWidth = 3;
    g.beginPath(); g.moveTo(w / 2, 40); g.lineTo(w - 70, h / 2); g.lineTo(w / 2, h - 40); g.lineTo(70, h / 2); g.closePath(); g.stroke();
    g.fillStyle = "rgba(201,162,78,.5)"; g.beginPath(); g.arc(w / 2, h / 2, 10, 0, 7); g.fill();
    g.fillStyle = "rgba(201,162,78,.75)"; g.fillRect(0, 0, 10, h); g.fillRect(w - 10, 0, 10, h);
    g.fillStyle = "rgba(60,8,14,.8)"; g.fillRect(12, 0, 6, h); g.fillRect(w - 18, 0, 6, h);
  });

  const wallTex = canvasTex(512, 1024, (g, w, h) => {
    g.fillStyle = CREAM; g.fillRect(0, 0, w, h);
    for (let x = 0; x < w; x += 32) { const gr = g.createLinearGradient(x, 0, x + 32, 0); gr.addColorStop(0, "rgba(0,0,0,.07)"); gr.addColorStop(.5, "rgba(255,255,255,.12)"); gr.addColorStop(1, "rgba(0,0,0,.07)"); g.fillStyle = gr; g.fillRect(x, 0, 32, h); }
    g.fillStyle = GOLD; g.fillRect(0, h * 0.62, w, 10); g.fillRect(0, h * 0.62 + 18, w, 4);
    g.fillStyle = "rgba(201,162,78,.8)";
    for (let k = 0; k < 4; k++) g.fillRect(w / 2 - 60 + k * 15, h * 0.62 - 20 - k * 14, 120 - k * 30, 6);
    noise(g, w, h, 0.03);
  });

  const balconyTex = canvasTex(512, 128, (g, w, h) => {
    g.fillStyle = "#f2e6c6"; g.fillRect(0, 0, w, h);
    g.fillStyle = GOLD; g.fillRect(0, 6, w, 6); g.fillRect(0, h - 12, w, 6);
    g.strokeStyle = GOLD; g.lineWidth = 3;
    const cx = w / 2, cy = h - 14;
    for (let a = 0; a <= 12; a++) { const ang = Math.PI + a * Math.PI / 12; g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + Math.cos(ang) * 70, cy + Math.sin(ang) * 70); g.stroke(); }
    g.beginPath(); g.arc(cx, cy, 70, Math.PI, 2 * Math.PI); g.stroke();
    for (const s of [-1, 1]) for (let k = 0; k < 5; k++) {
      const x0 = cx + s * (110 + k * 26);
      g.beginPath(); g.moveTo(x0 - 10, 30); g.lineTo(x0, 52); g.lineTo(x0 - 10, 74); g.stroke();
      g.beginPath(); g.moveTo(x0, 30); g.lineTo(x0 + 10, 52); g.lineTo(x0, 74); g.stroke();
    }
    noise(g, w, h, 0.03, 800);
  });

  const ceilingTex = canvasTex(512, 512, (g, w, h) => {
    g.fillStyle = "#dcc28c"; g.fillRect(0, 0, w, h);
    g.strokeStyle = "rgba(160,120,60,.6)"; g.lineWidth = 10; g.strokeRect(20, 20, w - 40, h - 40);
    g.strokeStyle = GOLD; g.lineWidth = 4; g.strokeRect(46, 46, w - 92, h - 92);
    g.beginPath(); g.arc(w / 2, h / 2, 90, 0, 7); g.stroke();
    for (let a = 0; a < 16; a++) { const ang = a * Math.PI / 8; g.beginPath(); g.moveTo(w / 2 + Math.cos(ang) * 40, h / 2 + Math.sin(ang) * 40); g.lineTo(w / 2 + Math.cos(ang) * 90, h / 2 + Math.sin(ang) * 90); g.stroke(); }
    noise(g, w, h, 0.04);
  }, 4, 60);

  const friezeTex = canvasTex(1024, 192, (g, w, h) => {
    const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, "#e8cf8c"); gr.addColorStop(1, "#a9853c");
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
    g.fillStyle = "rgba(90,60,20,.55)"; g.strokeStyle = "rgba(90,60,20,.55)"; g.lineWidth = 7; g.lineCap = "round";
    for (let i = 0; i < 9; i++) { // stylised dancers in relief
      const x = 60 + i * 113, y = h / 2 + 10, f = i % 2 ? -1 : 1;
      g.beginPath(); g.arc(x, y - 52, 13, 0, 7); g.fill();
      g.beginPath(); g.moveTo(x - 14, y - 36); g.lineTo(x + 14, y - 36); g.lineTo(x + 18 * f, y + 20); g.lineTo(x - 10 * f, y + 20); g.fill();
      for (const [a, b, c, d] of [[-10, -30, -34 * f, -64], [10, -30, 30 * f, -6], [-6, 18, -22 * f, 66], [6, 18, 20 * f, 66]]) { g.beginPath(); g.moveTo(x + a, y + b); g.lineTo(x + c, y + d); g.stroke(); }
    }
    g.fillStyle = "rgba(255,240,200,.35)"; g.fillRect(0, 8, w, 4); g.fillRect(0, h - 12, w, 4);
  });

  const seatTex = canvasTex(64, 64, (g, w, h) => { g.fillStyle = "#2b3638"; g.fillRect(0, 0, w, h); noise(g, w, h, 0.12, 600); });

  /* ========================================================== the hall */
  const HALL_START = 40, HALL_END = STAGE_Z - 4;
  const hallLen = HALL_START - HALL_END, hallMid = (HALL_START + HALL_END) / 2;
  const creamMat = std(0xffffff, { map: texCopy(wallTex, hallLen / 6, 1), roughness: 0.85 });
  const goldMat = std(0xd8b25e, { metalness: 0.85, roughness: 0.35 });
  const darkWood = std(0x3e2414, { roughness: 0.5 });
  const balcMat = std(0xffffff, { map: texCopy(balconyTex, hallLen / 8, 1), roughness: 0.75 });
  const balcMatS = std(0xffffff, { map: texCopy(balconyTex, 1, 1), roughness: 0.75 });

  const floor = mesh(new THREE.PlaneGeometry(40, hallLen), std(0xffffff, { map: woodTex, roughness: 0.55 }), 0, 0, hallMid);
  floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true;
  const carpet = mesh(new THREE.PlaneGeometry(LANE * 3 + 1, hallLen), std(0xffffff, { map: texCopy(carpetTex, 3, hallLen / 2.6), roughness: 0.95 }), 0, 0.012, hallMid);
  carpet.rotation.x = -Math.PI / 2; carpet.receiveShadow = true;

  // rows of seats (instanced)
  {
    const ROW = 1.15, xs = [];
    for (let x = 4.7; x <= 15.5; x += 0.95) xs.push(x, -x);
    const rows = Math.floor((HALL_START - 4 - (STAGE_Z + 12)) / ROW);
    const n = rows * xs.length;
    const fab = std(0xffffff, { map: seatTex, roughness: 0.95 });
    const backs = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.42, 0.42, 0.9, 12, 1, false, -0.6, 1.2), fab, n);
    const seats = new THREE.InstancedMesh(box(0.8, 0.14, 0.55), fab, n);
    const arms = new THREE.InstancedMesh(box(0.07, 0.5, 0.55), darkWood, n);
    const m4 = new THREE.Matrix4(); let i = 0;
    for (let r = 0; r < rows; r++) {
      const z = HALL_START - 4 - r * ROW;
      for (const x of xs) {
        m4.makeTranslation(x, 0.95, z - 0.1); backs.setMatrixAt(i, m4);
        m4.makeTranslation(x, 0.5, z); seats.setMatrixAt(i, m4);
        m4.makeTranslation(x + 0.44 * Math.sign(x), 0.45, z); arms.setMatrixAt(i, m4);
        i++;
      }
    }
    scene.add(backs, seats, arms);
    for (const s of [-1, 1]) {
      mesh(box(0.25, 0.8, hallLen - 18), darkWood, s * 4.05, 0.4, hallMid + 9);
      mesh(box(0.3, 0.06, hallLen - 18), goldMat, s * 4.05, 0.82, hallMid + 9);
    }
  }

  // walls: fluted cream, wood dado with gold rail, rounded balcony fronts with deco pattern
  const lampDiscs = [];
  for (const s of [-1, 1]) {
    mesh(box(1, 18, hallLen), creamMat, s * 18, 9, hallMid);
    mesh(box(1, 2.6, hallLen), darkWood, s * 17.4, 1.3, hallMid);
    mesh(box(0.2, 0.12, hallLen), goldMat, s * 16.9, 2.62, hallMid);
    for (const [y, depth] of [[5.6, 5], [10.4, 3.6]]) {
      mesh(box(depth, 1.5, hallLen), std(0xf2e6c6), s * (17.5 - depth / 2), y, hallMid);
      const front = mesh(new THREE.CylinderGeometry(0.75, 0.75, hallLen, 16, 1, false, 0, Math.PI), balcMat, s * (17.5 - depth), y, hallMid);
      front.rotation.x = Math.PI / 2; front.rotation.z = s > 0 ? 0 : Math.PI; // rounded front facing the aisle
      mesh(box(0.14, 0.1, hallLen), goldMat, s * (17.5 - depth), y + 0.78, hallMid);
      mesh(box(0.06, 0.12, hallLen), glow(0xffe0a0), s * (17.5 - depth - 0.1), y - 0.8, hallMid);
      for (let z = HALL_START - 2; z > HALL_END; z -= 3) lampDiscs.push([s * (17.5 - depth / 2), z, y - 0.76]);
    }
  }
  {
    // Art Deco pilasters between dado and first balcony, with fan sconces in between
    const zs = []; for (let z = HALL_START - 6; z > HALL_END + 6; z -= 12) zs.push(z);
    const n = zs.length * 2;
    const pil = new THREE.InstancedMesh(box(0.9, 2.2, 0.5), std(0xf6ebcd, { roughness: 0.8 }), n);
    const cap = new THREE.InstancedMesh(box(1.2, 0.25, 0.7), goldMat, n);
    const sconce = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.42, 0.12, 0.7, 16, 1, true, 0, Math.PI), glow(0xffe7b0, { side: THREE.DoubleSide }), n);
    const m4 = new THREE.Matrix4(); let i = 0;
    for (const z of zs) for (const s of [-1, 1]) {
      m4.makeTranslation(s * 17.0, 3.75, z); pil.setMatrixAt(i, m4);
      m4.makeTranslation(s * 17.0, 4.85, z); cap.setMatrixAt(i, m4);
      m4.makeTranslation(s * 16.9, 3.75, z - 6).multiply(new THREE.Matrix4().makeRotationY(s > 0 ? Math.PI / 2 : -Math.PI / 2)); sconce.setMatrixAt(i, m4);
      i++;
    }
    scene.add(pil, cap, sconce);
  }
  const ceil = mesh(new THREE.PlaneGeometry(40, hallLen), std(0xffffff, { map: ceilingTex, roughness: 0.9 }), 0, 17, hallMid);
  ceil.rotation.x = Math.PI / 2;
  {
    for (let z = HALL_START; z > HALL_END; z -= 9) for (const x of [-9, 0, 9]) lampDiscs.push([x, z, 16.95]);
    const disc = new THREE.InstancedMesh(new THREE.CircleGeometry(0.3, 14), glow(0xfff2cf), lampDiscs.length);
    const m4 = new THREE.Matrix4(), rot = new THREE.Matrix4().makeRotationX(Math.PI / 2);
    lampDiscs.forEach(([x, z, y], i) => { m4.makeTranslation(x, y, z).multiply(rot); disc.setMatrixAt(i, m4); });
    scene.add(disc);
    // Art Deco ring chandeliers down the middle
    for (let z = HALL_START - 20; z > STAGE_Z + 40; z -= 45) {
      mesh(new THREE.TorusGeometry(1.2, 0.07, 8, 32), goldMat, 0, 14.6, z).rotation.x = Math.PI / 2;
      mesh(new THREE.CylinderGeometry(1.1, 0.5, 0.5, 24, 1, true), glow(0xfff0c8, { side: THREE.DoubleSide }), 0, 14.4, z);
      mesh(cyl(0.02, 0.02, 2.4, 6), goldMat, 0, 15.8, z);
    }
  }
  // back wall behind the start line
  mesh(box(38, 18, 1), creamMat, 0, 9, HALL_START + 0.5);
  for (const [y, d] of [[5.6, 5], [10.4, 3.6]]) {
    mesh(box(36, 1.5, d), std(0xffffff, { map: texCopy(balconyTex, 5, 1), roughness: 0.75 }), 0, y, HALL_START - d / 2);
    mesh(box(36, 0.12, 0.08), glow(0xffe2a0), 0, y - 0.78, HALL_START - d);
  }
  mesh(box(38, 2.6, 1), darkWood, 0, 1.3, HALL_START - 0.1);

  /* ========================================================= the stage */
  const stageGrp = new THREE.Group(); scene.add(stageGrp);
  const SH = 1.4;
  const stageFloor = mesh(box(26, SH, 14), std(0xffffff, { map: texCopy(woodTex, 4, 3), roughness: 0.5 }), 0, SH / 2, STAGE_Z - 7, stageGrp);
  stageFloor.receiveShadow = true;
  mesh(box(26, 0.1, 0.25), goldMat, 0, SH, STAGE_Z - 0.1, stageGrp);
  for (let i = 0; i < 4; i++) mesh(box(7, SH * (i + 1) / 4, 0.55), darkWood, 0, SH * (i + 1) / 8, STAGE_Z + 2.2 - i * 0.55, stageGrp).receiveShadow = true;
  // stepped (ziggurat) Art Deco proscenium in three frames
  const proMat = std(0xf2e2b8, { roughness: 0.8 });
  for (let k = 0; k < 3; k++) {
    const inset = k * 1.1, zz = STAGE_Z - 1.2 - k * 0.35, m = k === 1 ? goldMat : proMat;
    mesh(box(2.2, 17, 0.6), m, -14.1 + inset, 8.5, zz, stageGrp);
    mesh(box(2.2, 17, 0.6), m, 14.1 - inset, 8.5, zz, stageGrp);
    mesh(box(30 - inset * 2, 1.6, 0.6), m, 0, 13.6 - k * 0.9, zz, stageGrp);
  }
  mesh(box(42, 4, 1), proMat, 0, 16, STAGE_Z - 1.2, stageGrp);
  mesh(new THREE.PlaneGeometry(16, 3), std(0xffffff, { map: friezeTex, metalness: 0.5, roughness: 0.45 }), 0, 15.6, STAGE_Z - 0.68, stageGrp);
  // side towers of boxes (camarotes) with rounded gold-trimmed fronts
  for (const s of [-1, 1]) {
    mesh(box(4.4, 17, 1), proMat, s * 17.6, 8.5, STAGE_Z - 1.6, stageGrp);
    for (let k = 0; k < 4; k++) {
      const y = 2.4 + k * 3.3;
      mesh(box(2.6, 1.6, 0.25), glow(0x2a170c), s * 17.6, y + 0.9, STAGE_Z - 1.05, stageGrp);
      const fr = mesh(new THREE.CylinderGeometry(1.5, 1.5, 0.9, 20, 1, false, -Math.PI / 2, Math.PI), balcMatS, s * 17.6, y, STAGE_Z - 1.1, stageGrp);
      fr.rotation.y = Math.PI; fr.scale.z = 0.35;
      mesh(new THREE.TorusGeometry(1.5, 0.05, 6, 20, Math.PI), goldMat, s * 17.6, y + 0.45, STAGE_Z - 1.1, stageGrp).rotation.x = Math.PI / 2;
    }
  }
  // backdrop revealed when the curtain opens
  function signTexture() {
    const c = document.createElement("canvas"); c.width = 1024; c.height = 512;
    const g = c.getContext("2d");
    const bg = g.createRadialGradient(512, 256, 40, 512, 256, 560);
    bg.addColorStop(0, "#5a1220"); bg.addColorStop(1, "#12060a");
    g.fillStyle = bg; g.fillRect(0, 0, 1024, 512);
    g.strokeStyle = "rgba(232,195,106,.3)"; g.lineWidth = 3;
    for (let a = 0; a < 24; a++) { const ang = a * Math.PI / 12; g.beginPath(); g.moveTo(512, 256); g.lineTo(512 + Math.cos(ang) * 700, 256 + Math.sin(ang) * 700); g.stroke(); }
    g.textAlign = "center"; g.shadowColor = "#ff3b52"; g.shadowBlur = 40; g.fillStyle = "#fff";
    g.font = "bold 130px 'Bebas Neue', Impact, sans-serif"; g.fillText("GREAT STRAITS", 512, 250);
    g.shadowColor = "#e8c36a"; g.fillStyle = "#f4d68a"; g.font = "bold 54px 'Bebas Neue', Impact, sans-serif";
    g.fillText("COLISEU PORTO", 512, 340);
    const tx = new THREE.CanvasTexture(c); tx.encoding = THREE.sRGBEncoding; return tx;
  }
  const backdrop = mesh(new THREE.PlaneGeometry(26, 13), glow(0xffffff, { map: signTexture(), fog: false }), 0, SH + 6.2, STAGE_Z - 13.5, stageGrp);
  document.fonts && document.fonts.ready.then(() => { backdrop.material.map = signTexture(); });
  // green velvet curtain in two halves (folds by displacement)
  const velvet = std(0x1e3d2c, { roughness: 0.92, side: THREE.DoubleSide });
  const curtains = [];
  for (const s of [-1, 1]) {
    const g = new THREE.PlaneGeometry(13.4, 11.6, 90, 1);
    const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) p.setZ(i, Math.sin(p.getX(i) * 4.2) * 0.16);
    g.computeVertexNormals();
    curtains.push({ g: mesh(g, velvet, s * 6.5, SH + 5.8, STAGE_Z - 3, stageGrp), s });
  }
  mesh(box(28, 1.2, 0.4), velvet, 0, SH + 11.6, STAGE_Z - 2.8, stageGrp); // pelmet
  mesh(box(28, 0.1, 0.42), goldMat, 0, SH + 11.0, STAGE_Z - 2.8, stageGrp);
  // lighting truss with lamps and soft light cones
  mesh(box(24, 0.3, 0.3), std(0x161616, { metalness: 0.6, roughness: 0.4 }), 0, 10.6, STAGE_Z - 2.2, stageGrp);
  const coneMat = new THREE.MeshBasicMaterial({ color: C(0xfff1c8), transparent: true, opacity: 0.07, depthWrite: false, blending: THREE.AdditiveBlending, fog: false });
  for (let k = 0; k < 9; k++) {
    const x = -10 + k * 2.5;
    mesh(box(0.45, 0.55, 0.45), std(0x111111, { metalness: 0.5, roughness: 0.4 }), x, 10.15, STAGE_Z - 2.2, stageGrp);
    mesh(new THREE.CircleGeometry(0.18, 12), glow(0xfff6dc), x, 9.86, STAGE_Z - 2.2, stageGrp).rotation.x = Math.PI / 2;
    mesh(new THREE.ConeGeometry(2.4, 8.6, 20, 1, true), coneMat, x, 5.5, STAGE_Z - 3.5, stageGrp).rotation.x = 0.18;
  }
  const stageLight = new THREE.SpotLight(C(0xffe2b0), 0, 30, 0.5, 0.6, 1);
  stageLight.position.set(0, 10, STAGE_Z - 1); stageLight.target.position.set(0, SH, STAGE_Z - 5.4);
  scene.add(stageLight, stageLight.target);


  /* ===================================================== Dad, in 3D */
  // Based on his portrait: bald with a short silver fringe, warm smile, brown eyes,
  // black western shirt with red rose-embroidered yoke and white piping, pearl snaps,
  // black trousers and boots, silver resonator guitar. Faces -z (into the hall).
  const shirtTex = canvasTex(1024, 512, (g, w, h) => {
    g.fillStyle = "#151515"; g.fillRect(0, 0, w, h); noise(g, w, h, 0.05, 5000);
    // yoke at the top (shoulders). u: 0 = back centre, .5 = front centre
    const yv = (u) => {
      if (u > 0.27 && u < 0.73) { // front: dips to points either side of the placket
        const d = Math.min(Math.abs(u - 0.43), Math.abs(u - 0.57));
        return h * (0.25 + 0.13 * Math.max(0, 1 - d / 0.1));
      }
      const b = Math.min(u, 1 - u); // back: gentle scallops
      return h * (0.27 + 0.035 * Math.cos(b / 0.27 * Math.PI * 2));
    };
    g.fillStyle = "#b3142c"; g.beginPath(); g.moveTo(0, 0);
    for (let x = 0; x <= w; x += 4) g.lineTo(x, yv(x / w));
    g.lineTo(w, 0); g.closePath(); g.fill();
    noise(g, w, h * 0.4, 0.06, 1500);
    g.strokeStyle = "#f4f1ea"; g.lineWidth = 5; g.beginPath();
    for (let x = 0; x <= w; x += 4) x ? g.lineTo(x, yv(x / w) + 4) : g.moveTo(x, yv(0) + 4);
    g.stroke();
    const rose = (x, y, r) => {
      g.fillStyle = "#2f7d3a";
      for (const a of [-0.9, 0.9, 2.4]) { g.save(); g.translate(x, y); g.rotate(a); g.beginPath(); g.ellipse(r * 1.5, 0, r * 0.9, r * 0.4, 0, 0, 7); g.fill(); g.restore(); }
      for (let k = 4; k >= 1; k--) { g.fillStyle = k % 2 ? "#e0283f" : "#8e0c20"; g.beginPath(); g.arc(x + (k % 2) * 1.5, y, r * k / 4, 0, 7); g.fill(); }
      g.strokeStyle = "#5a0614"; g.lineWidth = 1.5; g.beginPath(); g.arc(x, y, r * 0.55, 0.3, 5); g.stroke();
    };
    for (const u of [0.4, 0.6]) { rose(u * w, h * 0.13, 15); rose(u * w + (u < 0.5 ? -26 : 26), h * 0.2, 10); }
    for (const u of [0.1, 0.9]) { rose(u * w, h * 0.13, 16); rose(u * w + (u < 0.5 ? 24 : -24), h * 0.19, 9); }
    g.strokeStyle = "#f4f1ea"; g.lineWidth = 4; // white arrow pocket tips
    for (const u of [0.4, 0.6]) {
      const x = u * w, y = h * 0.5;
      g.beginPath(); g.moveTo(x - 22, y); g.lineTo(x + 22, y); g.stroke();
      for (const s of [-1, 1]) { g.beginPath(); g.moveTo(x + s * 30, y); g.lineTo(x + s * 22, y - 7); g.lineTo(x + s * 22, y + 7); g.closePath(); g.stroke(); }
    }
    g.fillStyle = "rgba(255,255,255,.06)"; g.fillRect(w * 0.5 - 12, 0, 24, h);
    for (let k = 0; k < 6; k++) { g.fillStyle = "#efe9dd"; g.beginPath(); g.arc(w * 0.5, h * (0.2 + k * 0.14), 6, 0, 7); g.fill(); }
  });

  function makeHead(SKIN) {
    const g = new THREE.SphereGeometry(1, 48, 36);
    const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) {
      let x = p.getX(i), y = p.getY(i), z = p.getZ(i);
      if (y < 0) { const k = -y; x *= 1 - 0.2 * k * k; z *= 1 - 0.06 * k; }
      if (y < -0.5 && z < 0) z -= 0.08 * (-y - 0.5) * -z;                       // chin
      if (z < -0.55 && y > 0.05 && y < 0.38) z -= 0.03 * (1 - Math.abs(y - 0.2) / 0.18); // brow
      for (const s of [-1, 1]) {                                                 // eye sockets
        const d = (x - s * 0.36) ** 2 + ((y - 0.06) ** 2) * 1.8;
        if (z < -0.6) z += 0.06 * Math.exp(-d / 0.018);
      }
      if (z < -0.4 && y < -0.05 && y > -0.45) z -= 0.03 * Math.exp(-((Math.abs(x) - 0.45) ** 2) / 0.02); // cheeks
      if (z > 0) z *= 1.05;
      p.setXYZ(i, x, y * 1.18, z * 1.04);
    }
    g.computeVertexNormals();
    return new THREE.Mesh(g, std(SKIN, { roughness: 0.48 }));
  }

  function guitarShape() {
    const s = new THREE.Shape();
    s.moveTo(0, -0.33);
    s.bezierCurveTo(0.17, -0.33, 0.22, -0.2, 0.21, -0.1);
    s.bezierCurveTo(0.2, 0.0, 0.12, 0.0, 0.13, 0.06);
    s.bezierCurveTo(0.14, 0.12, 0.17, 0.16, 0.16, 0.22);
    s.bezierCurveTo(0.15, 0.3, 0.06, 0.32, 0, 0.32);
    s.bezierCurveTo(-0.06, 0.32, -0.15, 0.3, -0.16, 0.22);
    s.bezierCurveTo(-0.17, 0.16, -0.14, 0.12, -0.13, 0.06);
    s.bezierCurveTo(-0.12, 0.0, -0.2, 0.0, -0.21, -0.1);
    s.bezierCurveTo(-0.22, -0.2, -0.17, -0.33, 0, -0.33);
    return s;
  }
  const faceTex = canvasTex(512, 768, (g, w, h) => {
    // UV space of the guitar outline: x -0.22..0.22, y -0.33..0.33 (bottom = lower bout)
    const X = (x) => (x / 0.44 + 0.5) * w, Y = (y) => (0.5 - y / 0.66) * h;
    const gr = g.createLinearGradient(0, 0, w, h);
    gr.addColorStop(0, "#f2f5f8"); gr.addColorStop(0.45, "#b8c1ca"); gr.addColorStop(0.7, "#e9edf1"); gr.addColorStop(1, "#97a2ad");
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
    const cx = X(0), cy = Y(-0.1), r = 0.15 / 0.44 * w;
    // cover plate ring + star ribs
    g.strokeStyle = "rgba(255,255,255,.9)"; g.lineWidth = 6; g.beginPath(); g.arc(cx, cy, r, 0, 7); g.stroke();
    g.strokeStyle = "rgba(90,98,108,.6)"; g.lineWidth = 3; g.beginPath(); g.arc(cx, cy, r + 5, 0, 7); g.stroke();
    for (let a = 0; a < 10; a++) { const ang = a * Math.PI / 5 + Math.PI / 10; g.strokeStyle = "rgba(110,118,128,.55)"; g.lineWidth = 4; g.beginPath(); g.moveTo(cx + Math.cos(ang) * r * 0.32, cy + Math.sin(ang) * r * 0.32); g.lineTo(cx + Math.cos(ang) * r * 0.95, cy + Math.sin(ang) * r * 0.95); g.stroke(); }
    // diamond clusters of little sound holes between the ribs
    for (let a = 0; a < 10; a++) {
      const ang = a * Math.PI / 5, dx = cx + Math.cos(ang) * r * 0.66, dy = cy + Math.sin(ang) * r * 0.66;
      g.fillStyle = "#2c3036";
      for (let i = -3; i <= 3; i++) for (let j = -3; j <= 3; j++) if (Math.abs(i) + Math.abs(j) <= 3) { g.beginPath(); g.arc(dx + (i - j) * 4.2, dy + (i + j) * 4.2, 1.7, 0, 7); g.fill(); }
    }
    // bridge cover in the middle
    g.fillStyle = "#c8ced5"; g.strokeStyle = "#7d8792"; g.lineWidth = 3;
    g.beginPath(); g.ellipse(cx, cy, r * 0.36, r * 0.17, 0, 0, 7); g.fill(); g.stroke();
    // f-holes on the upper bout
    g.fillStyle = "#0b0b0d";
    for (const s of [-1, 1]) {
      const fx = X(s * 0.085), fy = Y(0.17);
      g.beginPath(); g.ellipse(fx, fy - 34, 5, 5, 0, 0, 7); g.fill(); g.beginPath(); g.ellipse(fx, fy + 34, 5, 5, 0, 0, 7); g.fill();
      g.lineWidth = 6; g.strokeStyle = "#0b0b0d"; g.beginPath(); g.moveTo(fx, fy - 34); g.bezierCurveTo(fx + s * 14, fy - 10, fx - s * 14, fy + 10, fx, fy + 34); g.stroke();
    }
  });
  faceTex.repeat.set(1 / 0.44, 1 / 0.66); faceTex.offset.set(0.5, 0.5);

  function makeGuitar() {
    const gtr = new THREE.Group();
    const chrome = std(0xdfe4ea, { metalness: 1, roughness: 0.22 });
    const part = (m, p) => { m.userData.part = p; return m; };
    part(mesh(new THREE.ExtrudeGeometry(guitarShape(), { depth: 0.085, bevelEnabled: true, bevelSize: 0.012, bevelThickness: 0.012, bevelSegments: 3, curveSegments: 24 }), chrome, 0, 0, -0.0425, gtr), "body");
    part(mesh(new THREE.ShapeGeometry(guitarShape(), 24), std(0xffffff, { map: faceTex, metalness: 0.85, roughness: 0.28 }), 0, 0, 0.0555, gtr), "body");
    // spider tailpiece
    part(mesh(box(0.05, 0.07, 0.012), chrome, 0, -0.27, 0.06, gtr), "body");
    part(mesh(cyl(0.028, 0.02, 0.012, 16), chrome, 0, -0.305, 0.06, gtr), "body").rotation.x = Math.PI / 2;
    const neckMat = std(0x5b3418, { roughness: 0.5 });
    part(mesh(box(0.056, 0.52, 0.04), neckMat, 0, 0.58, 0.01, gtr), "neck");
    part(mesh(box(0.05, 0.52, 0.008), std(0x1e120a, { roughness: 0.4 }), 0, 0.58, 0.034, gtr), "neck");
    for (let k = 0; k < 12; k++) part(mesh(box(0.05, 0.004, 0.004), chrome, 0, 0.34 + k * 0.042, 0.039, gtr), "neck");
    for (const k of [2, 4, 6, 8, 11]) part(mesh(sph(0.004, 6, 4), std(0xf4f1ea), 0, 0.34 + (k + 0.5) * 0.042, 0.04, gtr), "neck");
    part(mesh(box(0.075, 0.17, 0.03), neckMat, 0, 0.92, 0, gtr), "neck").rotation.x = -0.15;
    for (const s of [-1, 1]) for (let k = 0; k < 3; k++) part(mesh(cyl(0.008, 0.008, 0.05, 8), chrome, s * 0.055, 0.87 + k * 0.045, 0, gtr), "neck").rotation.z = Math.PI / 2;
    for (let k = 0; k < 6; k++) part(mesh(cyl(0.0012, 0.0012, 0.9, 4), chrome, -0.018 + k * 0.0072, 0.44, 0.062, gtr), "body");
    gtr.traverse((o) => { if (o.isMesh) o.castShadow = true; });
    return gtr;
  }

  function makeDad() {
    const SKIN = 0xe7ab86, BLACK = 0x161616, RED = 0xb3142c, PIPE = 0xf4f1ea;
    const root = new THREE.Group();
    const body = new THREE.Group(); root.add(body);
    const shirt = std(BLACK, { roughness: 0.75 }), red = std(RED, { roughness: 0.7 });
    const pants = std(0x141416, { roughness: 0.8 }), boot = std(0x0c0c0c, { roughness: 0.32 });
    const skin = std(SKIN, { roughness: 0.48 });
    const cuffMat = std(0xffffff, { roughness: 0.7, map: canvasTex(256, 64, (g, w, h) => {
      g.fillStyle = "#b3142c"; g.fillRect(0, 0, w, h);
      g.fillStyle = "#f4f1ea"; g.fillRect(0, 0, w, 4);
      for (let x = 20; x < w; x += 64) { g.fillStyle = "#2f7d3a"; g.beginPath(); g.ellipse(x + 10, 34, 9, 4, 0.5, 0, 7); g.fill(); g.fillStyle = "#e8304a"; g.beginPath(); g.arc(x, 32, 8, 0, 7); g.fill(); }
      for (let x = 44; x < w; x += 64) { g.fillStyle = "#efe9dd"; g.beginPath(); g.arc(x, 44, 4, 0, 7); g.fill(); }
    }) });
    const M = (geo, mat, x, y, z, p = body) => { const m = mesh(geo, mat, x, y, z, p); m.castShadow = true; return m; };

    // legs: hip → knee → boot
    const hips = [], knees = [];
    for (const s of [-1, 1]) {
      const hip = new THREE.Group(); hip.position.set(s * 0.1, 0.92, 0); body.add(hip);
      M(cyl(0.085, 0.07, 0.46, 14), pants, 0, -0.23, 0, hip);
      const knee = new THREE.Group(); knee.position.set(0, -0.45, 0); hip.add(knee);
      M(cyl(0.068, 0.058, 0.4, 14), pants, 0, -0.2, 0, knee);
      M(cyl(0.064, 0.06, 0.12, 14), boot, 0, -0.36, 0, knee);
      M(box(0.11, 0.09, 0.27), boot, 0, -0.43, -0.06, knee);
      M(box(0.115, 0.025, 0.28), std(0x050505), 0, -0.47, -0.06, knee);
      for (let k = 0; k < 4; k++) M(box(0.06, 0.005, 0.006), std(0x2a2a2a), 0, -0.385 + k * 0.022 - 0.02, -0.055 - k * 0.012 - 0.07, knee).rotation.x = -0.5;
      hips.push(hip); knees.push(knee);
    }
    // torso (lathe) wearing the western shirt
    const prof = [[0.16, 0], [0.165, 0.06], [0.158, 0.16], [0.17, 0.28], [0.188, 0.4], [0.192, 0.48], [0.17, 0.545], [0.1, 0.6], [0.055, 0.62]]
      .map(([r, y]) => new THREE.Vector2(r, y));
    M(new THREE.LatheGeometry(prof, 40), std(0xffffff, { map: shirtTex, roughness: 0.75 }), 0, 0.9, 0).scale.z = 0.7;
    M(cyl(0.162, 0.162, 0.05, 24), std(0x0e0e0e, { roughness: 0.4 }), 0, 0.92, 0).scale.z = 0.7;               // belt
    M(box(0.06, 0.04, 0.02), std(0xcfd3d8, { metalness: 1, roughness: 0.25 }), 0, 0.92, -0.115);              // buckle
    for (const s of [-1, 1]) {                                                                                // collar + piping
      M(box(0.07, 0.05, 0.012), shirt, s * 0.035, 1.5, -0.085).rotation.set(-0.5, 0, s * 0.5);
      M(box(0.075, 0.006, 0.014), std(PIPE), s * 0.036, 1.477, -0.093).rotation.set(-0.5, 0, s * 0.5);
    }
    M(new THREE.TorusGeometry(0.06, 0.016, 8, 20), shirt, 0, 1.51, 0).rotation.x = Math.PI / 2;
    M(cyl(0.058, 0.062, 0.1, 14), skin, 0, 1.55, 0);                                                          // neck
    // arms: shoulder → elbow → hand
    const shoulders = [], elbows = [];
    for (const s of [-1, 1]) {
      M(sph(0.068), red, s * 0.18, 1.43, 0).scale.set(1, 0.85, 0.85);
      const sh = new THREE.Group(); sh.position.set(s * 0.215, 1.42, 0); body.add(sh);
      M(cyl(0.056, 0.05, 0.3, 14), shirt, 0, -0.15, 0, sh);
      const el = new THREE.Group(); el.position.set(0, -0.3, 0); sh.add(el);
      M(cyl(0.048, 0.042, 0.22, 14), shirt, 0, -0.11, 0, el);
      M(cyl(0.047, 0.047, 0.08, 16), cuffMat, 0, -0.245, 0, el);                                             // embroidered red cuff
      M(new THREE.TorusGeometry(0.046, 0.005, 6, 16), std(PIPE), 0, -0.22, 0, el).rotation.x = Math.PI / 2;
      M(cyl(0.032, 0.035, 0.05, 10), skin, 0, -0.3, 0, el);
      M(sph(0.045), skin, 0, -0.35, -0.005, el).scale.set(0.75, 1.15, 0.5);
      M(sph(0.018), skin, s * -0.028, -0.33, -0.02, el).scale.set(1, 1.6, 1);                                // thumb
      shoulders.push(sh); elbows.push(el);
    }
    // head
    const head = new THREE.Group(); head.position.set(0, 1.685, 0.005); body.add(head);
    const R = 0.122;
    const skull = makeHead(SKIN); skull.scale.setScalar(R); skull.castShadow = true; head.add(skull);
    const Hd = (geo, mat, x, y, z) => mesh(geo, mat, x, y, z, head);
    for (const s of [-1, 1]) {
      Hd(sph(0.03, 14, 10), skin, s * 0.116, 0.0, 0.005).scale.set(0.42, 1.05, 0.72);                        // ears
      Hd(sph(0.024, 12, 10), std(0xc98a68), s * 0.12, 0.0, 0.0).scale.set(0.2, 0.75, 0.5);
      const ex = s * 0.043, ey = 0.018, ez = -0.097;                                                         // eyes
      Hd(sph(0.02, 16, 12), std(0xf6f2ea, { roughness: 0.2 }), ex, ey, ez);
      Hd(sph(0.0105, 12, 10), std(0x5a3418, { roughness: 0.25 }), ex, ey, ez - 0.0135);
      Hd(sph(0.0055, 10, 8), std(0x0a0605, { roughness: 0.1 }), ex, ey, ez - 0.0195);
      Hd(new THREE.SphereGeometry(0.0215, 16, 8, 0, Math.PI * 2, 0, Math.PI * 0.36), skin, ex, ey, ez).rotation.x = -0.45; // smiling lids
      Hd(new THREE.SphereGeometry(0.0212, 16, 6, 0, Math.PI * 2, Math.PI * 0.76, Math.PI * 0.24), skin, ex, ey, ez).rotation.x = 0.25;
      const brow = Hd(box(0.04, 0.008, 0.01), std(0x6f6258, { roughness: 0.9 }), ex + s * 0.002, 0.05, -0.108);
      brow.rotation.z = -s * 0.14; brow.rotation.x = 0.25;
      Hd(sph(0.026, 12, 10), std(0xe9a17f, { roughness: 0.55 }), s * 0.052, -0.035, -0.088).scale.set(1, 0.8, 0.6); // cheeks
    }
    Hd(sph(0.014, 12, 10), skin, 0, -0.005, -0.112).scale.set(0.9, 2.0, 0.8);                               // nose
    Hd(sph(0.0135, 12, 10), skin, 0, -0.03, -0.12);
    for (const s of [-1, 1]) Hd(sph(0.01, 10, 8), skin, s * 0.013, -0.035, -0.113);
    const mouth = new THREE.Shape();                                                                         // big smile with teeth
    mouth.moveTo(-0.04, 0.006); mouth.quadraticCurveTo(0, -0.004, 0.04, 0.006); mouth.quadraticCurveTo(0, -0.05, -0.04, 0.006);
    const faceSide = { side: THREE.DoubleSide };
    Hd(new THREE.ShapeGeometry(mouth, 20), glow(0x3a0d0d, faceSide), 0, -0.062, -0.111);
    const teeth = new THREE.Shape();
    teeth.moveTo(-0.034, 0.003); teeth.quadraticCurveTo(0, -0.006, 0.034, 0.003); teeth.quadraticCurveTo(0, -0.026, -0.034, 0.003);
    Hd(new THREE.ShapeGeometry(teeth, 20), std(0xf7f3ea, Object.assign({ roughness: 0.3 }, faceSide)), 0, -0.062, -0.1115);
    const lip = Hd(new THREE.TorusGeometry(0.032, 0.005, 6, 18, Math.PI), std(0xc0705e, { roughness: 0.5 }), 0, -0.067, -0.108);
    lip.rotation.z = Math.PI; lip.scale.set(1.15, 0.72, 1);
    // short grey hair round the sides and back (bald on top), as in the reference
    const hairTex = canvasTex(256, 128, (g, w, h) => {
      g.fillStyle = "#b4b2ae"; g.fillRect(0, 0, w, h);
      for (let i = 0; i < 1400; i++) { g.strokeStyle = Math.random() < 0.5 ? "rgba(90,88,84,.35)" : "rgba(235,233,228,.45)"; g.lineWidth = 1; const x = Math.random() * w, y = Math.random() * h; g.beginPath(); g.moveTo(x, y); g.lineTo(x + (Math.random() - 0.5) * 3, y + 6); g.stroke(); }
    });
    const hairMat = std(0xffffff, { map: hairTex, roughness: 1 });
    Hd(new THREE.SphereGeometry(R * 1.04, 36, 12, -Math.PI / 2 + 1.0, Math.PI * 2 - 2.0, Math.PI * 0.36, Math.PI * 0.24), hairMat, 0, 0, 0).scale.set(1, 1.18, 1.05);
    Hd(new THREE.SphereGeometry(R * 1.042, 28, 10, Math.PI / 2 - 1.05, 2.1, Math.PI * 0.2, Math.PI * 0.22), hairMat, 0, 0, 0).scale.set(1, 1.18, 1.05);

    const shadow = mesh(new THREE.CircleGeometry(0.42, 24), new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.25, depthWrite: false }), 0, 0.02, 0);
    shadow.rotation.x = -Math.PI / 2;
    return { root, body, hips, knees, shoulders, elbows, head, shadow };
  }
  const dad = makeDad();
  scene.add(dad.root);

  /* =========================== the guitar waiting on stage — and the smash */
  const STOP_Z = STAGE_Z - 5.2, STAND_Z = STAGE_Z - 6.0;
  const standMat = std(0x1c1c20, { metalness: 0.7, roughness: 0.35 });
  const stand = new THREE.Group(); stand.position.set(0, SH, STAND_Z); scene.add(stand);
  for (const s of [-1, 1]) mesh(cyl(0.012, 0.012, 0.5, 6), standMat, s * 0.13, 0.2, 0.1, stand).rotation.set(0.35, 0, s * 0.5);
  mesh(cyl(0.012, 0.012, 0.5, 6), standMat, 0, 0.2, -0.12, stand).rotation.x = -0.5;
  mesh(cyl(0.013, 0.013, 1.05, 6), standMat, 0, 0.62, -0.05, stand).rotation.x = -0.1;  // upright
  mesh(box(0.34, 0.03, 0.1), standMat, 0, 0.14, 0.02, stand);                              // cradle
  mesh(new THREE.TorusGeometry(0.04, 0.008, 6, 12, Math.PI), standMat, 0, 1.13, -0.1, stand); // neck yoke
  stand.traverse((o) => { if (o.isMesh) o.castShadow = true; });

  const stageGtr = makeGuitar();
  const grip = new THREE.Group(); dad.root.add(grip); // where his hands hold the neck
  function gtrOnStand() {
    stand.add(stageGtr); stageGtr.position.set(0, 0.47, 0.03); stageGtr.rotation.set(-0.1, 0, 0);
    stageGtr.traverse((o) => { if (o.isMesh) o.visible = true; });
  }
  function gtrToHands() { grip.add(stageGtr); stageGtr.position.set(0, -0.86, 0); stageGtr.rotation.set(0, Math.PI, 0); }
  gtrOnStand();

  // flying chrome shards, wood splinters and sparks
  const debris = [], debrisGrp = new THREE.Group(); scene.add(debrisGrp);
  const shardChrome = std(0xdfe4ea, { metalness: 1, roughness: 0.25 }), shardWood = std(0x5b3418, { roughness: 0.5 });
  const sparkMat = new THREE.MeshBasicMaterial({ color: C(0xffd27a), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false });
  function shatter(at) {
    for (let i = 0; i < 28; i++) {
      const isChrome = i < 19;
      const geo = isChrome ? new THREE.TetrahedronGeometry(0.035 + Math.random() * 0.07) : box(0.025, 0.07 + Math.random() * 0.14, 0.025);
      const m = mesh(geo, isChrome ? shardChrome : shardWood, at.x + (Math.random() - 0.5) * 0.2, at.y + Math.random() * 0.15, at.z + (Math.random() - 0.5) * 0.2, debrisGrp);
      m.castShadow = true;
      debris.push({ m, v: new THREE.Vector3((Math.random() - 0.5) * 5, 2.5 + Math.random() * 4, (Math.random() - 0.2) * 4), spin: new THREE.Vector3(Math.random() * 12, Math.random() * 12, Math.random() * 12), life: Infinity });
    }
    for (let i = 0; i < 44; i++) {
      const m = mesh(sph(0.012 + Math.random() * 0.012, 6, 4), sparkMat, at.x, at.y + 0.05, at.z, debrisGrp);
      debris.push({ m, v: new THREE.Vector3((Math.random() - 0.5) * 8, 1 + Math.random() * 6, (Math.random() - 0.5) * 8), spin: null, life: 0.4 + Math.random() * 0.5 });
    }
  }
  function updateDebris(dt) {
    for (let i = debris.length - 1; i >= 0; i--) {
      const d = debris[i], p = d.m.position;
      d.v.y -= 18 * dt; p.addScaledVector(d.v, dt);
      if (d.spin) { d.m.rotation.x += d.spin.x * dt; d.m.rotation.y += d.spin.y * dt; d.m.rotation.z += d.spin.z * dt; }
      const floorY = Math.abs(p.x) < 13 && p.z < STAGE_Z ? SH : 0;
      if (p.y < floorY + 0.02) { p.y = floorY + 0.02; d.v.y *= -0.3; d.v.x *= 0.6; d.v.z *= 0.6; if (d.spin) d.spin.multiplyScalar(0.6); }
      if (d.life !== Infinity) { d.life -= dt; d.m.scale.setScalar(Math.max(0.01, d.life * 2)); if (d.life <= 0) { debrisGrp.remove(d.m); debris.splice(i, 1); } }
    }
  }
  function clearDebris() { debris.length = 0; debrisGrp.clear(); }

  /* ================================================ obstacles: instruments */
  const chromeM = std(0xdfe4ea, { metalness: 1, roughness: 0.25 });
  const brass = std(0xd9b04a, { metalness: 1, roughness: 0.3 });
  const blackM = std(0x121214, { roughness: 0.55 });
  const grille = canvasTex(128, 128, (g, w, h) => { g.fillStyle = "#1a1a1c"; g.fillRect(0, 0, w, h); g.fillStyle = "#2c2c30"; for (let y = 0; y < h; y += 4) for (let x = (y / 4) % 2 ? 2 : 0; x < w; x += 4) g.fillRect(x, y, 2, 2); });
  const tweed = canvasTex(128, 128, (g, w, h) => { g.fillStyle = "#c8a46a"; g.fillRect(0, 0, w, h); g.strokeStyle = "rgba(90,60,30,.45)"; g.lineWidth = 2; for (let k = -h; k < w; k += 6) { g.beginPath(); g.moveTo(k, 0); g.lineTo(k + h, h); g.stroke(); } });
  const drumHead = canvasTex(256, 256, (g) => {
    g.fillStyle = "#f3efe6"; g.beginPath(); g.arc(128, 128, 128, 0, 7); g.fill();
    g.strokeStyle = "#b3142c"; g.lineWidth = 16; g.beginPath(); g.arc(128, 128, 96, 0, 7); g.stroke();
    g.fillStyle = "#1a1a1a"; g.textAlign = "center"; g.font = "bold 44px 'Bebas Neue', Impact, sans-serif"; g.fillText("SULTANS", 128, 142);
  });
  const sparkleRed = std(0xa3101f, { metalness: 0.6, roughness: 0.35 });
  const caseTex = canvasTex(512, 256, (g, w, h) => {
    g.fillStyle = "#141416"; g.fillRect(0, 0, w, h); noise(g, w, h, 0.08, 2500);
    g.fillStyle = "#f4f2ec"; g.textAlign = "center";
    g.font = "bold 58px 'Bebas Neue', Impact, sans-serif"; g.fillText("DIRE STRAITS", w / 2, 108);
    g.font = "bold 30px 'Space Mono', monospace"; g.fillText("WORLD TOUR · FRAGILE", w / 2, 158);
    g.fillRect(40, 186, w - 80, 6);
    g.font = "bold 24px 'Space Mono', monospace"; g.fillText("STAGE LEFT  ▲  THIS WAY UP", w / 2, 226);
  });
  const sheetTex = canvasTex(128, 96, (g, w, h) => {
    g.fillStyle = "#f6f0de"; g.fillRect(0, 0, w, h); g.strokeStyle = "#333"; g.lineWidth = 1;
    for (let st = 0; st < 3; st++) for (let l = 0; l < 5; l++) { const y = 12 + st * 28 + l * 4; g.beginPath(); g.moveTo(6, y); g.lineTo(w - 6, y); g.stroke(); }
    g.fillStyle = "#222"; for (let n = 0; n < 18; n++) { const x = 12 + (n % 6) * 18, y = 12 + Math.floor(n / 6) * 28 + (n * 7 % 5) * 3; g.beginPath(); g.ellipse(x, y, 3, 2.2, -0.4, 0, 7); g.fill(); g.fillRect(x + 2, y - 10, 1, 10); }
  });
  const headMat = std(0xf3efe6, { roughness: 0.6 });
  function shadowsOn(g) { g.traverse((o) => { if (o.isMesh) o.castShadow = true; }); return g; }

  const OBST = {
    // drum kit: change lane
    drums: () => {
      const g = new THREE.Group();
      mesh(cyl(0.36, 0.36, 0.42, 28), sparkleRed, 0, 0.38, 0, g).rotation.x = Math.PI / 2;
      mesh(new THREE.CircleGeometry(0.35, 28), std(0xffffff, { map: drumHead, roughness: 0.6 }), 0, 0.38, -0.215, g).rotation.y = Math.PI;
      for (const z of [-0.21, 0.21]) mesh(new THREE.TorusGeometry(0.36, 0.02, 6, 28), chromeM, 0, 0.38, z, g);
      for (const s of [-1, 1]) {
        mesh(cyl(0.15, 0.15, 0.18, 20), sparkleRed, s * 0.18, 0.9, -0.05, g).rotation.x = 0.35;
        mesh(cyl(0.152, 0.152, 0.01, 20), headMat, s * 0.18, 0.99, -0.08, g).rotation.x = 0.35;
      }
      mesh(cyl(0.2, 0.2, 0.36, 22), sparkleRed, 0.62, 0.42, 0.1, g);
      mesh(cyl(0.2, 0.2, 0.01, 22), headMat, 0.62, 0.605, 0.1, g);
      mesh(cyl(0.16, 0.16, 0.13, 22), chromeM, -0.55, 0.66, -0.05, g);
      mesh(cyl(0.162, 0.162, 0.01, 22), headMat, -0.55, 0.73, -0.05, g);
      mesh(cyl(0.012, 0.012, 0.6, 6), chromeM, -0.55, 0.3, -0.05, g);
      mesh(cyl(0.012, 0.012, 1.0, 6), chromeM, -0.85, 0.5, 0.15, g);
      for (const y of [0.98, 1.02]) mesh(cyl(0.18, 0.01, 0.02, 24), brass, -0.85, y, 0.15, g);
      mesh(cyl(0.012, 0.012, 1.75, 6), chromeM, 0.78, 0.88, -0.25, g);
      mesh(cyl(0.26, 0.012, 0.025, 28), brass, 0.72, 1.78, -0.3, g).rotation.z = 0.35;
      mesh(cyl(0.012, 0.012, 1.55, 6), chromeM, -0.3, 0.78, 0.25, g);
      mesh(cyl(0.22, 0.012, 0.022, 28), brass, -0.38, 1.56, 0.2, g).rotation.z = -0.3;
      return { g: shadowsOn(g), w: 0.95, d: 0.5, y0: 0, y1: 2.2 };
    },
    // PA speaker column: change lane
    speakers: () => {
      const g = new THREE.Group();
      const gm = std(0xffffff, { map: grille, roughness: 0.9 });
      for (let k = 0; k < 3; k++) {
        const y = 0.48 + k * 0.97;
        mesh(box(1.4, 0.94, 0.8), blackM, 0, y, 0, g);
        mesh(box(1.3, 0.84, 0.02), gm, 0, y, -0.41, g);
        for (const x of [-0.33, 0.33]) {
          mesh(new THREE.TorusGeometry(0.26, 0.03, 8, 24), std(0x2c2c30, { roughness: 0.6 }), x, y, -0.425, g);
          mesh(sph(0.07, 12, 8), std(0x3a3a3e, { metalness: 0.4, roughness: 0.4 }), x, y, -0.4, g).scale.z = 0.5;
        }
        for (const x of [-0.7, 0.7]) mesh(box(0.04, 0.94, 0.82), std(0x2a2a2c, { metalness: 0.5, roughness: 0.4 }), x, y, 0, g);
      }
      return { g: shadowsOn(g), w: 0.85, d: 0.45, y0: 0, y1: 2.9 };
    },
    // two vintage velvet chairs: jump
    chairs: () => {
      const g = new THREE.Group();
      const wood = std(0x6b3a1e, { roughness: 0.5 }), velv = std(0x8a1626, { roughness: 0.95 });
      for (const x of [-0.45, 0.45]) {
        mesh(box(0.62, 0.08, 0.55), velv, x, 0.48, 0, g);
        mesh(box(0.66, 0.05, 0.58), wood, x, 0.43, 0, g);
        for (const [lx, lz] of [[-0.28, -0.24], [0.28, -0.24], [-0.28, 0.24], [0.28, 0.24]]) mesh(cyl(0.025, 0.02, 0.43, 8), wood, x + lx, 0.21, lz, g);
        mesh(box(0.62, 0.5, 0.06), velv, x, 0.78, 0.26, g);
        mesh(cyl(0.035, 0.035, 0.66, 10), wood, x, 1.05, 0.27, g).rotation.z = Math.PI / 2;
        for (const lx of [-0.3, 0.3]) mesh(cyl(0.028, 0.028, 0.62, 8), wood, x + lx, 0.78, 0.27, g);
      }
      return { g: shadowsOn(g), w: 0.95, d: 0.4, y0: 0, y1: 0.95 };
    },
    // black-and-white concert flight case on castors: jump
    case: () => {
      const g = new THREE.Group();
      const alu = std(0xc9ced4, { metalness: 0.9, roughness: 0.35 });
      mesh(box(1.6, 0.74, 0.62), std(0xffffff, { map: caseTex, roughness: 0.6 }), 0, 0.5, 0, g);
      for (const y of [0.13, 0.87]) mesh(box(1.64, 0.05, 0.66), alu, 0, y, 0, g);          // aluminium edges
      for (const x of [-0.8, 0.8]) mesh(box(0.05, 0.78, 0.66), alu, x, 0.5, 0, g);
      for (const x of [-0.79, 0.79]) for (const y of [0.14, 0.86]) for (const z of [-0.31, 0.31]) mesh(sph(0.045, 10, 8), chromeM, x, y, z, g); // ball corners
      for (const x of [-0.45, 0.45]) mesh(box(0.12, 0.08, 0.03), chromeM, x, 0.78, -0.33, g); // latches
      mesh(new THREE.TorusGeometry(0.1, 0.018, 6, 14, Math.PI), std(0x111111), 0, 0.9, 0, g);  // handle
      for (const x of [-0.65, 0.65]) for (const z of [-0.22, 0.22]) { mesh(cyl(0.06, 0.06, 0.04, 12), std(0x111111), x, 0.06, z, g).rotation.z = Math.PI / 2; }
      return { g: shadowsOn(g), w: 0.9, d: 0.4, y0: 0, y1: 0.92 };
    },
    // jazz corner: saxophone and trumpet on their stands, music stand: jump
    sax: () => {
      const g = new THREE.Group();
      const brassM = std(0xd9b04a, { metalness: 1, roughness: 0.28 });
      // sax stand (tripod) + alto saxophone
      for (const a of [0, 2.1, 4.2]) { const l = mesh(cyl(0.01, 0.01, 0.4, 6), blackM, -0.35 + Math.cos(a) * 0.1, 0.16, Math.sin(a) * 0.1, g); l.rotation.set(Math.sin(a) * 0.5, 0, -Math.cos(a) * 0.5); }
      const sax = new THREE.Group(); sax.position.set(-0.35, 0.28, 0); g.add(sax);
      const tube = new THREE.CatmullRomCurve3([new THREE.Vector3(0.05, 0.62, 0), new THREE.Vector3(0, 0.35, 0), new THREE.Vector3(0, 0.08, 0), new THREE.Vector3(0.08, -0.02, 0), new THREE.Vector3(0.16, 0.06, 0)]);
      mesh(new THREE.TubeGeometry(tube, 24, 0.045, 10), brassM, 0, 0, 0, sax);
      mesh(cyl(0.11, 0.05, 0.16, 18, ), brassM, 0.2, 0.14, 0, sax).rotation.z = -0.3;           // bell
      mesh(new THREE.TorusGeometry(0.035, 0.012, 6, 12), brassM, 0.09, 0.66, 0, sax);           // neck crook
      for (let k = 0; k < 6; k++) mesh(cyl(0.016, 0.016, 0.012, 10), std(0xf1e7c9, { roughness: 0.3 }), -0.045, 0.15 + k * 0.07, -0.02, sax).rotation.z = Math.PI / 2; // keys
      // trumpet resting on a small stand
      mesh(cyl(0.012, 0.012, 0.45, 6), blackM, 0.4, 0.22, 0, g);
      const tr = new THREE.Group(); tr.position.set(0.4, 0.5, 0); tr.rotation.z = Math.PI / 2; g.add(tr);
      mesh(cyl(0.018, 0.018, 0.42, 10), brassM, 0, 0, 0, tr);
      mesh(cyl(0.075, 0.018, 0.14, 16, 1), brassM, 0, 0.27, 0, tr);
      for (let k = 0; k < 3; k++) mesh(cyl(0.012, 0.012, 0.08, 8), brassM, 0.03, -0.05 + k * 0.035, 0, tr).rotation.z = Math.PI / 2;
      // music stand with a page of notes
      mesh(cyl(0.01, 0.01, 0.8, 6), blackM, 0.02, 0.4, 0.15, g);
      const desk = mesh(box(0.42, 0.3, 0.012), std(0xffffff, { map: sheetTex, roughness: 0.8 }), 0.02, 0.85, 0.13, g); desk.rotation.x = -0.35;
      return { g: shadowsOn(g), w: 0.9, d: 0.3, y0: 0, y1: 0.95 };
    },
    // upright double bass on its stand, with a stool: change lane
    bass: () => {
      const g = new THREE.Group();
      const wood = std(0x7a3a16, { roughness: 0.4, metalness: 0.05 });
      const bassShape = new THREE.Shape();
      bassShape.moveTo(0, -0.55);
      bassShape.bezierCurveTo(0.34, -0.55, 0.38, -0.2, 0.3, -0.05); bassShape.bezierCurveTo(0.22, 0.05, 0.22, 0.12, 0.26, 0.22);
      bassShape.bezierCurveTo(0.3, 0.4, 0.18, 0.5, 0, 0.5); bassShape.bezierCurveTo(-0.18, 0.5, -0.3, 0.4, -0.26, 0.22);
      bassShape.bezierCurveTo(-0.22, 0.12, -0.22, 0.05, -0.3, -0.05); bassShape.bezierCurveTo(-0.38, -0.2, -0.34, -0.55, 0, -0.55);
      const body = mesh(new THREE.ExtrudeGeometry(bassShape, { depth: 0.2, bevelEnabled: true, bevelSize: 0.02, bevelThickness: 0.02, curveSegments: 20 }), wood, 0, 0.72, -0.1, g);
      body.rotation.x = -0.12;
      for (const sx of [-1, 1]) mesh(box(0.02, 0.16, 0.01), blackM, sx * 0.1, 0.78, -0.12, g).rotation.z = sx * 0.2;   // f-holes
      mesh(box(0.06, 0.75, 0.05), std(0x1a0f08, { roughness: 0.4 }), 0, 1.6, -0.05, g);         // fingerboard
      mesh(new THREE.TorusGeometry(0.05, 0.02, 6, 12), wood, 0, 2.02, -0.03, g);                // scroll
      mesh(box(0.14, 0.02, 0.02), std(0xe8dcc0), 0, 0.62, -0.13, g);                             // bridge
      for (let k = 0; k < 4; k++) mesh(cyl(0.002, 0.002, 1.35, 4), chromeM, -0.03 + k * 0.02, 1.25, -0.12, g);
      mesh(cyl(0.012, 0.012, 0.2, 6), chromeM, 0, 0.1, -0.05, g);                                // end pin
      // bar stool beside it
      mesh(cyl(0.18, 0.18, 0.06, 18), std(0x8a1626, { roughness: 0.9 }), 0.62, 0.78, 0.05, g);
      for (const a of [0.5, 2.6, 4.7]) { const l = mesh(cyl(0.015, 0.015, 0.78, 6), chromeM, 0.62 + Math.cos(a) * 0.12, 0.38, 0.05 + Math.sin(a) * 0.12, g); l.rotation.set(Math.sin(a) * 0.15, 0, -Math.cos(a) * 0.15); }
      return { g: shadowsOn(g), w: 0.95, d: 0.45, y0: 0, y1: 2.1 };
    },
    // keyboard on a tall stand across the lane: slide under it
    keys: () => {
      const g = new THREE.Group();
      mesh(box(1.9, 0.12, 0.42), blackM, 0, 1.36, 0, g);
      mesh(box(1.76, 0.04, 0.2), std(0xf4f1ea, { roughness: 0.35 }), 0, 1.43, -0.08, g);
      for (let k = 0; k < 24; k++) if ([1, 3, 6, 8, 10].includes(k % 12)) mesh(box(0.035, 0.05, 0.12), blackM, -0.86 + k * 0.075, 1.46, -0.04, g);
      mesh(box(1.9, 0.03, 0.02), std(0xb3142c), 0, 1.33, -0.215, g);
      for (const x of [-0.98, 0.98]) {
        mesh(cyl(0.03, 0.03, 1.36, 8), chromeM, x, 0.68, 0, g);
        mesh(box(0.06, 0.04, 0.6), chromeM, x, 0.02, 0, g);
      }
      return { g: shadowsOn(g), w: 1.0, d: 0.3, y0: 1.0, y1: 1.6 };
    },
  };

  const pickGeo = (() => {
    const s = new THREE.Shape();
    s.moveTo(0, -0.3); s.bezierCurveTo(-0.15, -0.13, -0.26, 0.11, -0.22, 0.19);
    s.bezierCurveTo(-0.17, 0.28, 0.17, 0.28, 0.22, 0.19); s.bezierCurveTo(0.26, 0.11, 0.15, -0.13, 0, -0.3);
    return new THREE.ExtrudeGeometry(s, { depth: 0.05, bevelEnabled: true, bevelSize: 0.02, bevelThickness: 0.02, bevelSegments: 2 });
  })();
  const pickMat = std(0xff3b52, { roughness: 0.25, metalness: 0.2, emissive: C(0x4a0812) });

  let world = [];
  const worldGrp = new THREE.Group(); scene.add(worldGrp);
  function rng(seed) { return () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296); }

  function buildCourse() {
    worldGrp.clear(); world = [];
    const rand = rng((Date.now() & 0xffff) + 7);
    const add = (kind, lane, z, y) => {
      if (kind === "pick") {
        const m = new THREE.Mesh(pickGeo, pickMat); m.position.set(lane * LANE, y, z); worldGrp.add(m);
        world.push({ kind, lane, z, y, g: m, got: false });
        return;
      }
      const o = OBST[kind](); o.g.position.set(lane * LANE, 0, z); worldGrp.add(o.g);
      o.g.rotation.y = Math.PI; // models are built facing -z; turn them to face the oncoming runner
      world.push(Object.assign(o, { kind, lane, z, hit: false }));
    };
    const JUMP = ["chairs", "case", "sax"], SLIDE = ["keys"], DODGE = ["drums", "speakers", "bass"];
    let z = -50;
    while (z > STAGE_Z + 34) {
      const p = -z / LENGTH;
      const free = Math.floor(rand() * 3) - 1;
      const pool = p < 0.2 ? [...JUMP, ...SLIDE, ...JUMP] : [...JUMP, ...SLIDE, ...DODGE, ...DODGE];
      let placed = 0;
      for (const lane of [-1, 0, 1]) {
        if (lane === free) continue;
        if (rand() < 0.55 + p * 0.35) { add(pool[Math.floor(rand() * pool.length)], lane, z); placed++; }
      }
      // sometimes the free lane gets something jumpable/slidable too (never a lane-blocker)
      if (placed === 2 && rand() < 0.25 + p * 0.3) add(rand() < 0.5 ? JUMP[Math.floor(rand() * JUMP.length)] : "keys", free, z);
      for (let k = 0; k < 5; k++) add("pick", free, z + 6 + k * 2, 1.0);
      if (rand() < 0.35) { // an arc of picks over something jumpable elsewhere
        const lane = [-1, 0, 1][Math.floor(rand() * 3)];
        if (!world.some((o) => o.kind !== "pick" && o.lane === lane && Math.abs(o.z - (z - 9)) < 4)) {
          add(JUMP[Math.floor(rand() * JUMP.length)], lane, z - 9);
          for (let k = -2; k <= 2; k++) add("pick", lane, z - 9 + k * 1.3, 2.2 - Math.abs(k) * 0.35);
        }
      }
      z -= 26 - 9 * p + rand() * 5;
    }
    // a little row of picks under every keyboard: only reachable by sliding
    for (const o of world.filter((w) => w.kind === "keys")) for (let k = -1; k <= 1; k++) add("pick", o.lane, o.z + k * 0.9, 0.45);
  }

  /* ============================================================ state */
  const S = {
    mode: "intro",   // intro | count | run | paused | win | over
    z: 6, x: 0, lane: 0, y: 0, vy: 0, slide: 0, speed: SPEED0,
    lives: LIVES, picks: 0, time: 0, invuln: 0, slow: 1, phase: 0, t: 0, endT: 0, shake: 0,
    grabbed: false, wound: false, smashed: false, tossed: false,
  };
  const BEST_KEY = "run-best";

  // quiet background music, following the site's sound button
  const music = new Audio();
  music.preload = "auto"; music.loop = true; music.volume = MUSIC.volume;
  let musicStart = MUSIC.start;
  music.addEventListener("error", () => {
    if (music.src.indexOf("money-for-nothing") >= 0) { music.src = MUSIC.fallback; musicStart = MUSIC.fallbackStart; }
  });
  music.src = MUSIC.src;
  function musicPlay() { if (sfx.muted) return; try { music.play().catch(() => {}); } catch (e) {} }
  function musicFrom(sec) { try { music.currentTime = sec; } catch (e) {} }

  function renderLives() {
    $("lives").innerHTML = Array.from({ length: LIVES }, (_, i) => `<span class="${i < S.lives ? "" : "lost"}">❤️</span>`).join("");
    $("lives").setAttribute("aria-label", t("r.livesN", { n: S.lives }));
  }

  function resetPose() {
    dad.root.rotation.set(0, 0, 0); dad.body.rotation.set(0, 0, 0); dad.body.position.set(0, 0, 0);
    dad.head.rotation.set(0, 0, 0);
    [...dad.hips, ...dad.knees, ...dad.shoulders, ...dad.elbows].forEach((j) => j.rotation.set(0, 0, 0));
    clearDebris(); gtrOnStand(); grip.position.set(0, 0, 0); grip.rotation.set(0, 0, 0);
    S.grabbed = false; S.smashed = false; S.wound = false; S.tossed = false; stageGtr.visible = true;
  }

  function reset() {
    buildCourse();
    Object.assign(S, { z: 6, x: 0, lane: 0, y: 0, vy: 0, slide: 0, speed: SPEED0, lives: LIVES, picks: 0, time: 0, invuln: 0, slow: 1, endT: 0, shake: 0, grabbed: false, wound: false, smashed: false, tossed: false });
    resetPose(); dad.root.position.set(0, 0, S.z);
    curtains.forEach((c) => (c.g.position.x = c.s * 6.5));
    stageLight.intensity = 0;
    music.volume = MUSIC.volume;
    $("picks").textContent = "0"; renderLives();
  }

  function showBest() {
    const b = store.get(BEST_KEY, null);
    $("best-line").textContent = b ? t("r.bestLine", { time: b.time.toFixed(1), picks: b.picks }) : "";
  }

  function start() {
    sfx.unlock();
    reset();
    $("start").hidden = true; $("end").hidden = true; $("end").classList.remove("won"); $("paused").hidden = true;
    $("hud").hidden = false; $("pause-btn").hidden = false;
    S.mode = "count"; S.t = 0;
    musicFrom(musicStart); musicPlay();
    let n = 3;
    const tick = () => {
      const el = $("count");
      el.classList.remove("go"); void el.offsetWidth;
      el.textContent = n > 0 ? String(n) : t("r.go");
      el.classList.add("go");
      sfx.click();
      if (n > 0) { n--; setTimeout(tick, 700); }
      else setTimeout(() => { el.textContent = ""; S.mode = "run"; }, 600);
    };
    tick();
  }

  function pause(on) {
    if (on && S.mode === "run") { S.mode = "paused"; $("paused").hidden = false; music.pause(); }
    else if (!on && S.mode === "paused") { S.mode = "run"; $("paused").hidden = true; musicPlay(); }
  }

  function endGame(won) {
    S.mode = won ? "win" : "over"; S.endT = 0;
    $("pause-btn").hidden = true;
    if (won) {
      const prev = store.get(BEST_KEY, null);
      const rec = !prev || S.time < prev.time;
      if (rec) store.set(BEST_KEY, { time: S.time, picks: S.picks });
      music.volume = MUSIC.danceVolume;
      setTimeout(() => sfx.cheer(), 300);
      setTimeout(() => {
        $("end-h").textContent = t("r.winH");
        $("end-text").textContent = t("r.winText", { time: S.time.toFixed(1), picks: S.picks }) + (rec ? t("r.record") : "");
        $("end").classList.add("won"); $("end").hidden = false; $("hud").hidden = true;
      }, 6400);
    } else {
      sfx.bad(); music.pause();
      const left = Math.max(0, Math.round(S.z - STAGE_Z));
      setTimeout(() => {
        $("end-h").textContent = t("r.overH");
        $("end-text").textContent = t("r.overText", { m: left, picks: S.picks });
        $("end").hidden = false; $("hud").hidden = true;
      }, 1300);
    }
  }

  /* ========================================================= controls */
  function act(a) {
    if (S.mode !== "run") return;
    if (a === "left" || a === "right") {
      const nl = Math.max(-1, Math.min(1, S.lane + (a === "left" ? -1 : 1)));
      if (nl !== S.lane) { S.lane = nl; sfx.flip(); } else sfx.bad();
    } else if (a === "jump" && S.y <= 0.001) {
      S.vy = JUMP_V; S.slide = 0; sfx.whoosh();
    } else if (a === "slide") {
      if (S.y > 0) S.vy = -GRAVITY * 0.6;
      S.slide = SLIDE_TIME; sfx.whoosh();
    }
  }
  addEventListener("keydown", (e) => {
    if (e.target.closest && e.target.closest("input, textarea")) return;
    const k = e.key;
    const map = { ArrowLeft: "left", a: "left", A: "left", ArrowRight: "right", d: "right", D: "right",
      ArrowUp: "jump", w: "jump", W: "jump", " ": "jump", ArrowDown: "slide", s: "slide", S: "slide" };
    if (k === "Escape" || k === "p" || k === "P") { pause(S.mode === "run"); e.preventDefault(); return; }
    if (map[k]) {
      if (S.mode === "run") { act(map[k]); e.preventDefault(); }
      else if (k === " " && S.mode === "paused") { pause(false); e.preventDefault(); }
    }
    if (k === "Enter" && !$("start").hidden) start();
  });
  let touch = null;
  addEventListener("touchstart", (e) => { if (e.touches.length === 1) touch = { x: e.touches[0].clientX, y: e.touches[0].clientY }; }, { passive: true });
  addEventListener("touchend", (e) => {
    if (!touch) return;
    const p = e.changedTouches[0], dx = p.clientX - touch.x, dy = p.clientY - touch.y;
    touch = null;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 28) return;
    if (Math.abs(dx) > Math.abs(dy)) act(dx < 0 ? "left" : "right"); else act(dy < 0 ? "jump" : "slide");
  }, { passive: true });

  $("start-btn").addEventListener("click", start);
  $("again-btn").addEventListener("click", start);
  $("resume-btn").addEventListener("click", () => pause(false));
  $("pause-btn").addEventListener("click", () => pause(true));
  document.addEventListener("visibilitychange", () => { if (document.hidden) pause(true); });

  /* ======================================================= simulation */
  const PLAYER_H = 1.85;
  function collide() {
    const top = S.slide > 0 ? 0.8 : PLAYER_H, bottom = S.y;
    for (const o of world) {
      const dz = Math.abs(o.z - S.z);
      if (o.kind === "pick") {
        if (!o.got && dz < 0.7 && Math.abs(o.g.position.x - S.x) < 0.9 && o.y > bottom - 0.3 && o.y < bottom + top + 0.45) {
          o.got = true; o.g.visible = false; S.picks++; $("picks").textContent = String(S.picks); sfx.hover(); sfx.click();
        }
        continue;
      }
      if (o.hit || dz > o.d + 0.3) continue;
      if (Math.abs(o.lane * LANE - S.x) > o.w + 0.2) continue;
      if (bottom < o.y1 && bottom + top > o.y0) {
        o.hit = true;
        if (S.invuln > 0) continue;
        S.lives--; renderLives(); S.invuln = 1.6; S.slow = 0.45; S.shake = 0.4; sfx.bad();
        if (S.lives <= 0) { endGame(false); return; }
      }
    }
  }

  const lerp = (a, b, k) => a + (b - a) * k;
  function setJ(j, x, y, z, k) { j.rotation.x = lerp(j.rotation.x, x, k); j.rotation.y = lerp(j.rotation.y, y, k); j.rotation.z = lerp(j.rotation.z, z, k); }

  function poseRun(dt) {
    S.phase += dt * S.speed * 0.6;
    const sw = Math.sin(S.phase), k = Math.min(1, dt * 20);
    const air = S.y > 0.01, slide = S.slide > 0;
    const [hL, hR] = dad.hips, [kL, kR] = dad.knees, [sL, sR] = dad.shoulders, [eL, eR] = dad.elbows;
    if (slide) {
      setJ(hL, 1.3, 0, 0, k); setJ(hR, 1.1, 0, 0, k); setJ(kL, -0.2, 0, 0, k); setJ(kR, -0.5, 0, 0, k);
      setJ(sL, 0.6, 0, -0.5, k); setJ(sR, 0.6, 0, 0.5, k); setJ(eL, 0.6, 0, 0, k); setJ(eR, 0.6, 0, 0, k);
    } else if (air) {
      setJ(hL, 0.9, 0, 0, k); setJ(hR, -0.2, 0, 0, k); setJ(kL, -1.1, 0, 0, k); setJ(kR, -0.6, 0, 0, k);
      setJ(sL, 2.5, 0, -0.25, k); setJ(sR, 2.5, 0, 0.25, k); setJ(eL, 0.3, 0, 0, k); setJ(eR, 0.3, 0, 0, k);
    } else {
      hL.rotation.set(sw * 0.85, 0, 0); hR.rotation.set(-sw * 0.85, 0, 0);
      kL.rotation.set(-Math.max(0, -Math.sin(S.phase - 0.6)) * 1.4 - 0.1, 0, 0);
      kR.rotation.set(-Math.max(0, Math.sin(S.phase - 0.6)) * 1.4 - 0.1, 0, 0);
      sL.rotation.set(-sw * 0.8, 0, -0.1); sR.rotation.set(sw * 0.8, 0, 0.1);
      eL.rotation.set(1.3, 0, 0); eR.rotation.set(1.3, 0, 0);
    }
    dad.body.position.set(0, air || slide ? (slide ? 0.05 : 0) : Math.abs(Math.cos(S.phase)) * 0.06, 0);
    dad.body.rotation.x = lerp(dad.body.rotation.x, slide ? 1.2 : air ? 0 : -0.12, Math.min(1, dt * 18));
    dad.body.rotation.z = 0;
    dad.body.rotation.y = (S.lane * LANE - S.x) * -0.25;
    dad.head.rotation.set(slide ? -0.6 : 0.08, 0, 0);
    dad.root.visible = S.invuln > 0 ? Math.floor(S.invuln * 12) % 2 === 0 : true;
  }

  // aim his arms at the grip point (dad-local), bending the elbows when it's close
  function armsTo(gp, k, only) {
    for (const i of [0, 1]) {
      if (only !== undefined && i !== only) continue;
      const s = i ? 1 : -1, dy = gp.y - 1.42, dz = gp.z, dist = Math.hypot(dy, dz, 0.2);
      setJ(dad.shoulders[i], Math.atan2(-dz, -dy), 0, -s * 0.32, k);
      setJ(dad.elbows[i], Math.max(0, (0.66 - dist) / 0.66) * 2.2, 0, 0, k);
    }
  }
  const ease = (x) => (x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2);
  const seg = (t, a, b) => Math.min(1, Math.max(0, (t - a) / (b - a)));

  // on stage: grab the resonator off its stand, turn to the hall, swing it overhead and smash it
  function poseSmash(t, dt) {
    const k = Math.min(1, dt * 12);
    const [hL, hR] = dad.hips, [kL, kR] = dad.knees;
    let lean = 0, crouch = 0;
    if (t < 0.5) {                                   // reach for the guitar
      lean = -0.3 * ease(seg(t, 0, 0.4)); crouch = 0.25;
      armsTo({ y: 1.3, z: -0.62 }, k);
      if (t > 0.42 && !S.grabbed) { S.grabbed = true; gtrToHands(); grip.position.set(0, 1.28, -0.58); grip.rotation.x = 0; sfx.click(); }
    } else if (t < 1.1) {                            // lift it and turn round to face the hall
      const p = ease(seg(t, 0.5, 1.1));
      dad.root.rotation.y = Math.PI * p;
      grip.position.set(0, 1.28 + 0.1 * p, -0.58 + 0.12 * p);
    } else if (t < 1.8) {                            // wind-up: right over his head
      const p = ease(seg(t, 1.1, 1.8));
      if (!S.wound) { S.wound = true; sfx.whoosh(); }
      grip.rotation.x = p * (Math.PI + 0.65);
      grip.position.set(0, 1.38 + 0.42 * p, -0.46 + 0.4 * p);
      lean = 0.22 * p;
    } else if (t < 2.0) {                            // SMASH
      const p = Math.pow(seg(t, 1.8, 2.0), 2);
      grip.rotation.x = (Math.PI + 0.65) + (0.45 - Math.PI - 0.65) * p;
      grip.position.set(0, 1.8 - 0.7 * p, -0.06 - 0.46 * p);
      lean = 0.22 - 0.7 * p; crouch = 0.6 * p;
    } else if (t < 2.7) {                            // impact — hold the pose
      lean = -0.48; crouch = 0.6;
    } else if (t >= 3.6) {                           // toss the neck away, arms down… and dance
      if (!S.tossed) {
        S.tossed = true;
        const at = new THREE.Vector3(); stageGtr.getWorldPosition(at);
        stageGtr.visible = false;
        const neck = mesh(box(0.06, 0.6, 0.05), shardWood, at.x, at.y, at.z, debrisGrp); neck.castShadow = true;
        debris.push({ m: neck, v: new THREE.Vector3(-2.5, 3, 1.2), spin: new THREE.Vector3(6, 2, 9), life: Infinity });
        sfx.whoosh();
      }
      if (t < 4.1) {
        const p = ease(seg(t, 3.6, 4.1));
        setJ(dad.shoulders[0], 0.1, 0, -0.1, p); setJ(dad.shoulders[1], 0.1, 0, 0.1, p);
        setJ(dad.elbows[0], 0.25, 0, 0, p); setJ(dad.elbows[1], 0.25, 0, 0, p);
        dad.body.rotation.set(0, 0, 0); dad.body.position.y = 0;
        [...dad.hips, ...dad.knees].forEach((j) => setJ(j, 0, 0, 0, k));
        dad.head.rotation.set(0, 0, 0);
      } else poseDance(t - 4.1, dt);
      return;
    } else {                                         // triumph: the broken neck held high, fist pumping
      const p = ease(seg(t, 2.7, 3.2)), b = Math.abs(Math.sin((t - 2.7) * 7));
      grip.rotation.x = 0.45 + (Math.PI - 0.45) * p;
      grip.position.set(0.14 * p, 1.1 + 0.85 * p, -0.52 + 0.52 * p);
      lean = -0.48 * (1 - p); crouch = 0.6 * (1 - p) + 0.25 * b * p;
      dad.body.position.y = 0.06 * b * p;
      setJ(dad.shoulders[0], 2.75 + 0.25 * Math.sin((t - 2.7) * 7), 0, -0.35, k);
      setJ(dad.elbows[0], 0.5 + 0.4 * b, 0, 0, k);
    }
    if (t >= 2.0 && !S.smashed) {
      S.smashed = true;
      const at = new THREE.Vector3(); stageGtr.getWorldPosition(at); at.y = SH + 0.1;
      stageGtr.traverse((o) => { if (o.isMesh && o.userData.part === "body") o.visible = false; });
      shatter(at); S.shake = 0.7;
      sfx.bad(); sfx.whoosh(); sfx.note(82.4, 1.2); sfx.note(110, 1.2); sfx.note(146.8, 1.2);
      setTimeout(() => { sfx.fanfare(); sfx.cheer(); }, 250);
      setTimeout(() => fx.rain({ count: 220 }), 600);
    }
    if (S.grabbed && !S.tossed) armsTo(grip.position, k, t >= 2.7 ? 1 : undefined);
    dad.body.rotation.set(lean, 0, 0);
    if (!(t >= 2.7)) dad.body.position.y = -crouch * 0.12;
    setJ(hL, crouch * 0.6, 0, 0, k); setJ(hR, crouch * 0.6, 0, 0, k);
    setJ(kL, -crouch * 1.1, 0, 0, k); setJ(kR, -crouch * 1.1, 0, 0, k);
    dad.head.rotation.set(t > 2.7 ? -0.25 : 0.1, 0, 0);
  }

  // dance routine on stage, facing the hall (~134 bpm, Money for Nothing tempo)
  function poseDance(d, dt) {
    const k = Math.min(1, dt * 10), beat = d * 2.23 * Math.PI;
    const [hL, hR] = dad.hips, [kL, kR] = dad.knees, [sL, sR] = dad.shoulders, [eL, eR] = dad.elbows;
    const cycle = d % 12, bounce = Math.abs(Math.sin(beat));
    let spin = 0;
    dad.body.position.set(0, -bounce * 0.05, 0);
    setJ(hL, 0.2 * bounce, 0, 0, k); setJ(hR, 0.2 * bounce, 0, 0, k);
    setJ(kL, -0.4 * bounce, 0, 0, k); setJ(kR, -0.4 * bounce, 0, 0, k);
    dad.head.rotation.set(0.1 * Math.sin(beat * 2), 0, 0);
    if (cycle < 4) {                          // groove: hips sway, elbows pumping
      dad.body.rotation.z = Math.sin(beat) * 0.1;
      dad.body.position.x = Math.sin(beat) * 0.05;
      setJ(sL, 0.5 + 0.45 * Math.sin(beat), 0, -0.25, k); setJ(sR, 0.5 - 0.45 * Math.sin(beat), 0, 0.25, k);
      setJ(eL, 1.6, 0, 0, k); setJ(eR, 1.6, 0, 0, k);
    } else if (cycle < 5.6) {                 // spin with arms out
      const p = (cycle - 4) / 1.6; spin = ease(p) * Math.PI * 2;
      dad.body.rotation.z = 0;
      setJ(sL, 0, 0, -1.35, k); setJ(sR, 0, 0, 1.35, k); setJ(eL, 0.2, 0, 0, k); setJ(eR, 0.2, 0, 0, k);
    } else if (cycle < 9.2) {                 // disco point, other hand on the hip
      const up = Math.sin(beat / 2) > 0;
      dad.body.rotation.z = up ? -0.12 : 0.08;
      setJ(sR, up ? 0.4 : 0.6, 0, up ? 2.5 : 0.3, k); setJ(eR, up ? 0.1 : 0.4, 0, 0, k);
      setJ(sL, -0.3, 0, -0.7, k); setJ(eL, 1.9, 0, 0, k);
    } else {                                  // fists pumping in the air
      const a = Math.sin(beat) > 0;
      dad.body.rotation.z = 0;
      dad.body.position.y = Math.abs(Math.sin(beat)) * 0.08;
      setJ(sL, 2.9, 0, -0.3 - (a ? 0.2 : 0), k); setJ(sR, 2.9, 0, 0.3 + (a ? 0 : 0.2), k);
      setJ(eL, a ? 0.9 : 0.3, 0, 0, k); setJ(eR, a ? 0.3 : 0.9, 0, 0, k);
    }
    dad.body.rotation.x = 0; dad.body.rotation.y = 0;
    dad.root.rotation.y = Math.PI + spin;
  }

  function step(dt) {
    S.t += dt;
    if (S.mode === "run") {
      S.time += dt;
      const p = Math.min(1, (6 - S.z) / LENGTH);
      S.slow = Math.min(1, S.slow + dt * 0.5);
      S.speed = (SPEED0 + (SPEED1 - SPEED0) * p) * S.slow;
      S.z -= S.speed * dt;
      S.x += (S.lane * LANE - S.x) * Math.min(1, dt * 13);
      S.vy -= GRAVITY * dt; S.y = Math.max(0, S.y + S.vy * dt); if (S.y === 0) S.vy = 0;
      S.slide = Math.max(0, S.slide - dt);
      S.invuln = Math.max(0, S.invuln - dt);
      poseRun(dt);
      collide();
      if (S.z <= STAGE_Z + 3.2 && S.mode === "run") { S.invuln = 0; dad.root.visible = true; endGame(true); }
      $("track-fill").style.width = `${p * 100}%`;
      $("track-dad").style.left = `calc(${p} * (100% - 26px))`;
      $("dist").textContent = String(Math.max(0, Math.round(S.z - STAGE_Z)));
    } else if (S.mode === "win") {
      // up the steps to the guitar, then the smash while the curtain opens
      S.endT += dt;
      const k = Math.min(1, S.endT / 1.6);
      S.x += (0 - S.x) * Math.min(1, dt * 6); S.lane = 0;
      S.z = STAGE_Z + 3.2 - k * (3.2 + (STAGE_Z - STOP_Z));
      S.y = Math.min(SH, Math.max(0, (STAGE_Z + 2.4 - S.z) / 2.2) * SH);
      S.slide = 0;
      if (k < 1) { S.speed = 9; poseRun(dt); }
      else { dad.root.visible = true; poseSmash(S.endT - 1.6, dt); }
      const open = Math.min(1, Math.max(0, (S.endT - 0.8) / 2.2));
      curtains.forEach((c) => (c.g.position.x = c.s * (6.5 + open * 11)));
      stageLight.intensity = open * 1.1;
    } else if (S.mode === "over") {
      S.endT += dt;
      dad.root.visible = true;
      dad.body.rotation.x += (-1.45 - dad.body.rotation.x) * Math.min(1, dt * 6);
      dad.body.position.y = 0.15;
    } else if (S.mode === "intro" || S.mode === "count") {
      // relaxed idle; a friendly wave on the start screen
      const k = Math.min(1, dt * 6);
      dad.body.position.set(0, Math.sin(S.t * 2) * 0.008, 0);
      dad.body.rotation.set(0, 0, Math.sin(S.t * 0.9) * 0.02);
      dad.hips.forEach((j) => setJ(j, 0, 0, 0, k)); dad.knees.forEach((j) => setJ(j, 0, 0, 0, k));
      setJ(dad.shoulders[0], 0.05, 0, -0.12, k); setJ(dad.elbows[0], 0.2, 0, 0, k);
      if (S.mode === "intro") { setJ(dad.shoulders[1], 0.2, 0, 2.6 + Math.sin(S.t * 6) * 0.25, k); setJ(dad.elbows[1], 0.5, 0, 0, k); }
      else { setJ(dad.shoulders[1], 0.05, 0, 0.12, k); setJ(dad.elbows[1], 0.2, 0, 0, k); }
      dad.head.rotation.set(0, Math.sin(S.t * 0.5) * 0.15, 0);
    }
    S.shake = Math.max(0, S.shake - dt);

    dad.root.position.set(S.x, S.y, S.z);
    dad.shadow.position.set(S.x, (S.mode === "win" && S.y > 0 ? S.y : 0) + 0.02, S.z);
    dad.shadow.scale.setScalar(1 - Math.min(0.6, (S.mode === "win" ? 0 : S.y) / 4));
    if (sfx.muted && !music.paused) music.pause();
    else if (!sfx.muted && music.paused && (S.mode === "run" || S.mode === "count" || S.mode === "win")) musicPlay();
  }

  /* ============================================================ camera */
  const camPos = new THREE.Vector3(0, 2, 0), camLook = new THREE.Vector3();
  let camOverride = null; // local testing only (see the hook at the bottom)
  function updateCamera(dt) {
    if (camOverride) { camera.position.copy(camOverride.pos); camera.lookAt(camOverride.look); return; }
    const narrow = camera.aspect < 0.8, wide = camera.aspect > 1.3;
    let pos, look;
    if (S.mode === "intro") {
      // in front of Dad, slowly orbiting so you can see his face (right of the start panel)
      const a = Math.sin(S.t * 0.4) * 0.3, dist = narrow ? 3.4 : 2.6;
      pos = new THREE.Vector3(S.x + Math.sin(a) * dist + (wide ? 0.9 : 0), 1.55, S.z - Math.cos(a) * dist);
      look = new THREE.Vector3(S.x + (wide ? 1.2 : 0), narrow ? 1.15 : 1.35, S.z);
    } else if (S.mode === "win" && S.endT > 1.6) {
      const d = narrow ? 4.8 : 3.4;
      pos = new THREE.Vector3(0.5, SH + 1.45, STOP_Z + d);
      look = new THREE.Vector3(0, SH + 1.2, STOP_Z);
    } else {
      pos = new THREE.Vector3(S.x * 0.55, narrow ? 3.1 : 3.0, S.z + (narrow ? 5.6 : 6.4));
      look = new THREE.Vector3(S.x * 0.75, 1.3, S.z - 7);
    }
    const k = S.mode === "count" ? Math.min(1, dt * 3) : S.mode === "intro" ? 1 : Math.min(1, dt * 7);
    camPos.lerp(pos, k); camLook.lerp(look, k);
    camera.position.copy(camPos);
    if (S.shake > 0) camera.position.x += (Math.random() - 0.5) * S.shake;
    camera.lookAt(camLook);
    // key light (with shadows) follows Dad; warm fill from the front
    const ref = dad.root.position;
    sun.position.set(ref.x + 4, ref.y + 9, ref.z + 5); sun.target.position.set(ref.x, ref.y, ref.z);
    fill.position.set(ref.x - 2, ref.y + 3, ref.z - 6); fill.target.position.set(ref.x, ref.y + 1, ref.z);
  }

  /* ============================================================== loop */
  let last = performance.now();
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    if (S.mode !== "paused") { step(dt); updateDebris(dt); }
    for (const o of world) {
      if (o.kind === "pick") { if (!o.got && Math.abs(o.z - S.z) < 120) o.g.rotation.y += dt * 3; }
      else o.g.visible = o.z < S.z + 12 && o.z > S.z - 260; // skip far obstacles
    }
    updateCamera(dt);
    renderer.render(scene, camera);
    requestAnimationFrame(frame);
  }

  reset();
  showBest();
  updateCamera(1);
  requestAnimationFrame(frame);
  document.addEventListener("langchange", () => { showBest(); renderLives(); });

  // test hook for local development only (localhost + ?near): exposes the game state
  if (/^(localhost|127\.0\.0\.1)$/.test(location.hostname) && /[?&]near\b/.test(location.search)) {
    window.__runner = { S, start, get world() { return world; }, STAGE_Z, dad, scene, renderer, camera,
      setCam: (pos, look) => { camOverride = pos ? { pos: new THREE.Vector3(...pos), look: new THREE.Vector3(...look) } : null; } };
  }
})();
