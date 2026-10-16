CITY.register('london', {
  caption: 'Elizabeth Tower · 96 m',
  seed: 1859,
  view: { pos: [430, 110, 250], target: [0, 45, 60] },
  shadow: { c: [600, -300], r: 1500 },
  fog: [600, 6200],
  sun: [0.3, 0.45, 0.8],
  sunColor: '#f4efe6',
  sunI: 1.8,
  hemi: 1.0,
  hemiSky: '#e6ebef', hemiGround: '#6b6a64',
  sky: { day: ['#8fa3b8', '#d8dcde', '#9a9e9f'], night: ['#05060c', '#23243a', '#08080d'] },
  build(c) {
    const { THREE, V3, smooth, fbm, distPoly, hash2, lerp, inPoly } = c;
    const thames = [[-4600, 1400], [-2600, 1350], [-1500, 1150], [-600, 850], [150, 330], [165, -250], [420, -780], [1100, -900], [1700, -720], [2400, -500], [3200, -300], [3800, 400], [4700, 800]];
    const parks = [
      [[-1180, -150], [-640, -420], [-560, -250], [-1100, 20]], // St James's
      [[-1500, -250], [-1250, -900], [-1050, -820], [-1230, -180]], // Green Park
      [[-3300, -400], [-2100, -900], [-1750, -600], [-2950, -50]], // Hyde Park
    ];
    const inPark = (x, z) => parks.some((p) => inPoly(x, z, p));
    const height = (x, z) => (distPoly(x, z, thames) < 115 ? -12 : 2 * fbm(x * 0.001, z * 0.001) + smooth(-1500, -3500, z) * 60 * fbm(x * 0.0006, z * 0.0006 + 3));
    c.ground({
      height,
      city: (x, z) => (inPark(x, z) ? 0 : 1 - smooth(4000, 4800, Math.hypot(x, z))),
      grid: { bx: 85, bz: 70, sx: 12, sz: 12, angle: 0.3, strength: 0.4, cars: 0.6 },
      color: (x, z, h, cm, col, pal) => { if (h < -0.5) col.copy(pal.bed); else if (inPark(x, z)) col.set('#4d6b3c'); else col.copy(pal.grass).lerp(pal.city, cm); },
      colors: { city: '#57575a' },
    });
    c.water({ color: '#3d4a47', glitterR: 3500 });
    const portland = c.facade({ color: '#d8ceb4', rough: 0.8 }, { bay: 2.2, floorH: 4, wx: [0.35, 0.65], wy: [0.2, 0.85], glassMul: 0.35, litProb: 0.55, litColor: [1, 0.8, 0.5], litGain: 0.8 });
    const flood = c.std({ color: '#d7c9a6', rough: 0.8, emissive: '#ffcf7a', night: 0.55 });
    const slate = c.std({ color: '#4d555b', rough: 0.6, metal: 0.2 });
    const gold = c.std({ color: '#c9a44a', rough: 0.35, metal: 0.95, emissive: '#ffcb62', night: 0.6 });

    // ---------- Elizabeth Tower (Big Ben) ----------
    {
      const e = c.B();
      e.box(flood, 13, 55, 13, 0, 0, 0);
      for (const [sx, sz] of [[1, 1], [-1, 1], [-1, -1], [1, -1]]) e.box(flood, 1.4, 55, 1.4, sx * 6.6, 0, sz * 6.6);
      e.box(flood, 15, 16, 15, 0, 55);
      e.box(gold, 15.4, 1, 15.4, 0, 71);
      e.box(flood, 12, 8, 12, 0, 72);
      for (let k = 0; k < 4; k++) { const a = k * Math.PI / 2; for (const t of [-1, 1]) e.cyl(gold, 0.3, 0.9, 6, 4, Math.sin(a) * 6 + Math.cos(a) * t * 6, 80, Math.cos(a) * 6 - Math.sin(a) * t * 6); }
      e.loft(slate, c.prof.rect(1, 1), [{ y: 80, s: 6.3 }, { y: 92, s: 1.6 }, { y: 94, s: 1.6 }]);
      e.cyl(gold, 0.15, 0.8, 4, 6, 0, 94);
      e.done();
      const face = c.lamp('#ffe7b8', 2.6, 0.55), faceGeo = new THREE.CircleGeometry(3.6, 32), ring = c.B();
      for (let k = 0; k < 4; k++) {
        const a = k * Math.PI / 2, m = c.mesh(faceGeo, face, c.root, false);
        m.position.set(Math.sin(a) * 7.6, 63, Math.cos(a) * 7.6); m.rotation.y = a;
        ring.add(gold, new THREE.TorusGeometry(3.8, 0.35, 6, 32), c.M(Math.sin(a) * 7.7, 63, Math.cos(a) * 7.7, 0, a));
      }
      ring.done(c.root, { shadow: false });
    }
    // ---------- Palace of Westminster ----------
    {
      const e = c.B();
      e.box(portland, 32, 26, 270, 16, 0, 140);
      e.box(portland, 60, 22, 200, -30, 0, 150);
      e.add(slate, new THREE.ExtrudeGeometry(new THREE.Shape([new THREE.Vector2(-16, 0), new THREE.Vector2(16, 0), new THREE.Vector2(0, 8)]), { depth: 270, bevelEnabled: false }), c.M(16, 26, 5));
      for (let z = 12; z < 280; z += 9) for (const x of [0.8, 31.2]) e.cone(flood, 0.9, 7, 4, x, 26, z);
      e.box(flood, 22, 76, 22, 10, 0, 285); e.box(flood, 24, 4, 24, 10, 76, 285);
      for (const [sx, sz] of [[1, 1], [-1, 1], [-1, -1], [1, -1]]) { e.cyl(flood, 1.6, 1.6, 90, 8, 10 + sx * 11, 0, 285 + sz * 11); e.cone(gold, 1.8, 8, 8, 10 + sx * 11, 90, 285 + sz * 11); }
      e.cyl(flood, 7, 7, 30, 8, -12, 22, 150); e.cone(slate, 7.5, 34, 8, -12, 52, 150);
      e.done();
    }
    // ---------- Westminster Bridge ----------
    c.bridge({ a: [15, -35], b: [330, -70], type: 'arch', deck: 7, towerH: 2, width: 26, span: [0.12, 0.88], ramp: 25, piers: 45, traffic: 16, deckMat: c.std({ color: '#3f6a4a', rough: 0.6 }) });

    // ---------- London Eye ----------
    {
      const EX = 330, EZ = -200, g = c.group(EX, 0, EZ, 0.55);
      const white = c.std({ color: '#eef0f0', rough: 0.35, metal: 0.6 });
      const e = c.B();
      e.beam(white, new V3(-40, 0, -35), new V3(0, 70, -6), 2.4); e.beam(white, new V3(-40, 0, 35), new V3(0, 70, 6), 2.4);
      e.beam(white, new V3(-40, 0, -35), new V3(-40, 0, 35), 2);
      e.cyl(white, 3, 3, 14, 12, 0, 70, -7, Math.PI / 2);
      e.done(g);
      const wheel = new THREE.Group(); wheel.position.y = 70; g.add(wheel);
      const w = c.B(), R = 62;
      w.add(white, new THREE.TorusGeometry(R, 1.1, 6, 96));
      w.add(white, new THREE.TorusGeometry(R - 5, 0.7, 6, 96));
      for (let k = 0; k < 32; k++) { const a = k / 32 * Math.PI * 2; w.rod(white, new V3(0, 0, -5), new V3(Math.cos(a) * (R - 5), Math.sin(a) * (R - 5), 0), 0.15, 3); w.rod(white, new V3(0, 0, 5), new V3(Math.cos(a) * (R - 5), Math.sin(a) * (R - 5), 0), 0.15, 3); }
      w.done(wheel, { shadow: false });
      const led = c.lamp('#5fa9ff', 2.4, 0);
      const rimLed = c.mesh(new THREE.TorusGeometry(R + 0.2, 0.5, 4, 96), led, wheel, false);
      const capMat = c.std({ color: '#dfe7ea', rough: 0.1, metal: 0.4, emissive: '#bfe1ff', night: 1.0 });
      const caps = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 10, 6).scale(2.2, 2, 4), capMat, 32);
      g.add(caps);
      c.onFrame((t) => {
        const r = t * 0.03; wheel.rotation.z = r;
        const m = new THREE.Matrix4();
        for (let k = 0; k < 32; k++) { const a = k / 32 * Math.PI * 2 + r; m.makeTranslation(Math.cos(a) * (R + 2.5), 70 + Math.sin(a) * (R + 2.5), 0); caps.setMatrixAt(k, m); }
        caps.instanceMatrix.needsUpdate = true;
        led.color.setHSL((t * 0.02) % 1, 0.8, 0.5).multiplyScalar(2.2 * c.U.uNight.value);
      });
      rimLed.frustumCulled = false;
    }
    // ---------- The Shard ----------
    const SX = 1900, SZ = -330;
    {
      const glass = c.facade({ color: '#a7b8c6', rough: 0.08, metal: 0.85 }, { bay: 1.6, floorH: 4, wx: [0.04, 0.96], wy: [0.06, 0.97], glassMul: 0.55, glassAdd: [0.04, 0.06, 0.09], litProb: 0.35, litColor: [0.9, 0.95, 1], litGain: 0.55 });
      const P = [[1, -0.3], [0.9, 0.5], [0.3, 1], [-0.5, 0.85], [-1, 0.2], [-0.85, -0.6], [-0.2, -1], [0.55, -0.85]];
      const e = c.B();
      e.loft(glass, P, [{ y: 0, s: 34, x: SX, z: SZ }, { y: 120, s: 26, x: SX, z: SZ }, { y: 240, s: 11, x: SX + 1, z: SZ }, { y: 270, s: 6, x: SX + 1, z: SZ }]);
      for (let k = 0; k < 4; k++) { const a = k * 1.6 + 0.3; e.beam(glass, new V3(SX + Math.cos(a) * 5, 262, SZ + Math.sin(a) * 5), new V3(SX + Math.cos(a) * 2.5, 309, SZ + Math.sin(a) * 2.5), 2.4, 0.8); }
      e.done();
      const top = c.mesh(new THREE.CylinderGeometry(3.5, 6.5, 40, 8, 1, true), c.lamp('#f3f8ff', 2.4), c.root, false); top.position.set(SX + 1, 285, SZ);
      c.beacon(SX + 1, 311, SZ, 1);
    }
    // ---------- City of London cluster ----------
    {
      const e = c.B(), CX = 1450, CZ = -1250;
      const gher = c.facade({ color: '#3f5663', rough: 0.15, metal: 0.8 }, { bay: 2.4, floorH: 4.2, wx: [0.05, 0.95], wy: [0.08, 0.95], glassMul: 0.7, litProb: 0.4, litGain: 0.6 });
      const pts = []; for (let i = 0; i <= 20; i++) { const y = i / 20 * 180; pts.push(new THREE.Vector2(Math.max(0.5, 28 * Math.sin(Math.PI * Math.min(1, (y + 50) / 235))), y)); }
      e.add(gher, new THREE.LatheGeometry(pts, 24), c.M(CX, 0, CZ));
      const wt = c.facade({ color: '#8fa1ae', rough: 0.12, metal: 0.8 }, { bay: 2, floorH: 4, wx: [0.05, 0.95], wy: [0.08, 0.95], glassMul: 0.55, litProb: 0.35, litGain: 0.6 });
      e.loft(wt, c.prof.rect(1, 0.8), [{ y: 0, sx: 22, sz: 22, x: CX + 330, z: CZ + 280 }, { y: 80, sx: 28, sz: 26, x: CX + 330, z: CZ + 280 }, { y: 160, sx: 34, sz: 30, x: CX + 330, z: CZ + 280 }]);
      e.loft(wt, c.prof.rect(1, 1), [{ y: 0, sx: 28, sz: 22, x: CX + 120, z: CZ + 120 }, { y: 225, sx: 28, sz: 3, x: CX + 120, z: CZ + 101 }]);
      for (const [dx, dz, h, w] of [[-150, 140, 230, 26], [220, -80, 200, 30], [-60, 280, 180, 24], [300, 120, 190, 28], [90, -160, 160, 24]]) e.box(wt, w, h, w, CX + dx, 0, CZ + dz, 0, 0.3);
      e.done();
    }
    // ---------- Tower Bridge ----------
    {
      const TX = 2450, zN = -560, zS = -430;
      const stone = c.std({ color: '#c7bda9', rough: 0.8, emissive: '#ffdca8', night: 0.4 });
      const blue = c.std({ color: '#6aa3c8', rough: 0.5, metal: 0.4, emissive: '#8fc6ff', night: 0.8 });
      const e = c.B();
      for (const z of [zN, zS]) {
        e.box(stone, 26, 8, 44, TX, -10, z);
        e.box(stone, 20, 52, 20, TX, -2, z);
        for (const [sx, sz] of [[1, 1], [-1, 1], [-1, -1], [1, -1]]) { e.cyl(stone, 2.8, 2.8, 58, 8, TX + sx * 9, -2, z + sz * 9); e.cone(slate, 3.2, 10, 8, TX + sx * 9, 56, z + sz * 9); }
        e.loft(slate, c.prof.rect(1, 1), [{ y: 50, s: 10.5, x: TX, z }, { y: 62, s: 3, x: TX, z }]);
        e.cone(gold, 0.8, 6, 6, TX, 62, z);
        e.box(stone, 12, 20, 20.4, TX, 0, z);
      }
      for (const s of [-1, 1]) { e.box(blue, 4, 5, zS - zN - 20, TX + s * 5, 42, (zN + zS) / 2); for (let i = 0; i < 10; i++) e.beam(blue, new V3(TX + s * 5, 42, zN + 10 + i * 11), new V3(TX + s * 5, 47, zN + 15.5 + i * 11), 0.5); }
      for (const [z0, z1] of [[zN, zN - 150], [zS, zS + 150]]) for (const s of [-1, 1]) {
        const pts = []; for (let i = 0; i <= 12; i++) { const t = i / 12; pts.push(new V3(TX + s * 7, lerp(44, 12, Math.sqrt(t)) - 8 * Math.sin(t * Math.PI), lerp(z0, z1, t))); }
        e.chain(blue, pts, 0.9, 5);
      }
      e.done();
      c.road([[TX, null, zN - 170], [TX, 10, zN - 60], [TX, 10, zS + 60], [TX, null, zS + 170]], { width: 20, pillars: 50, traffic: 12 });
    }
    // ---------- Buckingham Palace, The Mall, Victoria Memorial ----------
    {
      const BX = -1250, BZ = -120, g = c.group(BX, 0, BZ, -0.45), e = c.B();
      e.box(portland, 108, 24, 20, 0, 0, 0); e.box(portland, 20, 24, 100, -44, 0, -50); e.box(portland, 20, 24, 100, 44, 0, -50); e.box(portland, 108, 24, 18, 0, 0, -100);
      e.box(flood, 30, 4, 21, 0, 24, 0);
      for (let i = 0; i < 12; i++) e.box(flood, 1.5, 16, 1.5, -40 + i * 7.3, 4, 10.5);
      e.done(g);
      const m = c.B(); m.cyl(c.std({ color: '#f1efe8', rough: 0.5, emissive: '#fff', night: 0.3 }), 6, 9, 16, 16, 0, 0, 70); m.cone(gold, 2.2, 8, 8, 0, 16, 70); m.cyl(c.std({ color: '#6d6a60' }), 40, 40, 0.6, 32, 0, 0, 70);
      m.done(g);
      c.road([[BX + 60, null, BZ + 50], [-600, null, -300], [-250, null, -520]], { width: 22, thick: 0.3, traffic: 16, lampMat: c.lamp('#ffd28a', 3) });
      c.trees(c.scatter(260, (r) => { const t = r(); const x = lerp(BX + 60, -250, t), z = lerp(BZ + 50, -520, t) + (r() < 0.5 ? -18 : 18); return [x, z, 9]; }));
    }
    // ---------- City: irregular mid-rise, brick & Portland stone, slate roofs ----------
    const brick = ['#8e5b46', '#a0725a', '#7a4f40', '#b08d74', '#d6ccb4', '#cfc4aa', '#bdb49d'].map((x) => new THREE.Color(x));
    const clear = (x, z) => distPoly(x, z, thames) < 140 || inPark(x, z) || (x > -70 && x < 60 && z > -40 && z < 320) || Math.hypot(x - 330, z + 200) < 100 || Math.hypot(x - SX, z - SZ) < 70 ||
      Math.hypot(x - 1600, z + 1150) < 380 || (Math.abs(x - 2450) < 40 && z > -780 && z < -210) || Math.hypot(x + 1250, z + 170) < 170 || (x > -1250 && x < -250 && Math.abs(z - lerp(-70, -520, (x + 1250) / 1000)) < 40);
    const lots = c.grid({
      R: 4700, bx: 85, bz: 70, sx: 12, sz: 12, angle: 0.3, split: [2, 2], fill: [0.8, 0.97], jitter: 6, rotJitter: 0.35, big: 0.05,
      exclude: clear,
      density: (x, z, d) => 0.95 - 0.35 * smooth(3200, 4700, d),
      height: (x, z, d, r, big) => {
        const cityF = Math.exp(-Math.hypot(x - 1500, z + 1200) / 500) + 0.6 * Math.exp(-Math.hypot(x - 3600, z + 700) / 400);
        let h = 14 + r * 16;
        if (hash2(x | 0, z | 0) < 0.3 * cityF) h += 30 + hash2(z | 0, x | 0) * 140 * cityF;
        return big ? h * 1.15 : h;
      },
      color: (r) => brick[Math.floor(r * 29) % brick.length].clone(),
      decorate: (l, r) => { if (l.h < 34) { l.roof = r() < 0.6 ? 'gable' : 'hip'; l.rh = 5 + r() * 3; l.rs = 1; l.rc = new THREE.Color(r() < 0.7 ? '#4f575d' : '#7a4a3c'); } },
    });
    const mat = c.facade({ color: 0xffffff, rough: 0.8 }, { bay: 2.6, floorH: 3.4, wx: [0.3, 0.7], wy: [0.25, 0.8], glassMul: 0.3, litProb: 0.33, litColor: [1, 0.8, 0.52], litGain: 0.6 });
    c.buildings(lots, { mat, roofMats: { gable: slate, hip: slate } });
    c.trees(c.scatter(2200, (r) => { const x = -3400 + r() * 3000, z = -1000 + r() * 1100; return inPark(x, z) && !(Math.abs(x + 820) < 150 && Math.abs(z + 200) < 30) ? [x, z, 10] : null; }), { hue: 0.27 });
    c.trees(c.scatter(500, (r) => { const i = Math.floor(r() * (thames.length - 1)), t = r(); const [ax, az] = thames[i], [bx, bz] = thames[i + 1]; const nx = -(bz - az), nz = bx - ax, L = Math.hypot(nx, nz), s = r() < 0.5 ? -1 : 1; return [lerp(ax, bx, t) + s * nx / L * 128, lerp(az, bz, t) + s * nz / L * 128, 8]; }));
    // embankment roads
    for (const s of [-1, 1]) {
      const pts = []; for (let i = 0; i < thames.length; i++) { const [x, z] = thames[i], [nx0, nz0] = thames[Math.min(i + 1, thames.length - 1)], [px, pz] = thames[Math.max(i - 1, 0)]; const tx = nx0 - px, tz = nz0 - pz, L = Math.hypot(tx, tz); pts.push([x - tz / L * 126 * s, null, z + tx / L * 126 * s]); }
      c.road(pts, { width: 12, thick: 0.4, traffic: 30, lampMat: c.lamp('#ffe6b0', 3.2) });
    }
  },
});
