CITY.register('dubai', {
  caption: 'Burj Khalifa · 828 m',
  seed: 828,
  view: { pos: [620, 260, 900], target: [0, 360, 0] },
  shadow: { c: [0, 0], r: 1800 },
  fog: [700, 7000],
  sun: [0.45, 0.75, 0.35],
  sunColor: '#fff0d6',
  sunI: 3.0,
  hemiSky: '#fff4e2', hemiGround: '#b59a70',
  sky: { day: ['#7ea9cf', '#eadfc8', '#cbb896'], night: ['#050610', '#2b2335', '#0b0909'] },
  maxDist: 6000,
  build(c) {
    const { THREE, V3, smooth, fbm, hash2, lerp } = c;
    // coast runs along T; N points inland. Sea where cc < -1500
    const T = [0.8, -0.6], N = [0.6, 0.8];
    const toW = (s, n) => [T[0] * s + N[0] * n, T[1] * s + N[1] * n];
    const toL = (x, z) => [x * T[0] + z * T[1], x * N[0] + z * N[1]];
    const LAKE = [120, 330];
    const lake = (x, z) => (((x - LAKE[0]) / 330) ** 2 + ((z - LAKE[1]) / 170) ** 2) < 1;
    const height = (x, z) => {
      const [s, n] = toL(x, z);
      if (n < -1500 + 40 * Math.sin(s * 0.002)) return -14;
      if (lake(x, z)) return -6;
      return 5 * smooth(-1500, -1300, n) + smooth(2800, 4500, n) * 90 * fbm(x * 0.002, z * 0.002) - 5;
    };
    c.ground({
      height: (x, z) => height(x, z) + 5 - 5,
      city: (x, z, h) => { const [s, n] = toL(x, z); return h < 10 && n < 2800 && Math.abs(s) < 4500 ? 1 : 0; },
      grid: { bx: 180, bz: 180, sx: 34, sz: 34, angle: Math.atan2(0.6, 0.8), strength: 0.9 },
      colors: { grass: '#cdb58a', rock: '#c29d6b', city: '#9e9486', sand: '#d9c49b', bed: '#2f5f6a' },
      lamp: [1, 0.72, 0.4],
    });
    c.water({ color: '#2a6f7f', glitterR: 3000 });

    // ---------- Burj Khalifa ----------
    {
      const silver = c.facade({ color: '#b9c3cc', rough: 0.2, metal: 0.8 }, { bay: 1.5, floorH: 4, wx: [0.2, 0.95], wy: [0.05, 0.97], glassMul: 0.55, glassAdd: [0.03, 0.05, 0.08], litProb: 0.35, litColor: [0.9, 0.95, 1], litGain: 0.6 });
      const steel = c.std({ color: '#d5dadd', rough: 0.25, metal: 0.9, emissive: '#e8f4ff', night: 0.9 });
      const e = c.B();
      const L = [62, 62, 62];
      let y = 0;
      for (let k = 0; k < 28; k++) {
        const y1 = k === 0 ? 40 : y + 20;
        for (let i = 0; i < 3; i++) {
          if (L[i] < 6) continue;
          const a = i * Math.PI * 2 / 3;
          e.add(silver, new THREE.BoxGeometry(24, y1 - y, L[i]).translate(0, (y1 - y) / 2, L[i] / 2), c.M(0, y, 0, 0, a));
          e.add(silver, new THREE.CylinderGeometry(12, 12, y1 - y, 10).translate(0, (y1 - y) / 2, L[i]), c.M(0, y, 0, 0, a));
        }
        if (k > 0) L[k % 3] -= 6.2;
        y = y1;
      }
      e.cyl(silver, 13, 15, y + 40 - 0, 12, 0, 0);
      e.cyl(silver, 9, 12, 60, 12, 0, y + 40);
      e.cyl(steel, 5, 8, 90, 10, 0, y + 100);
      e.cyl(steel, 0.5, 5, 828 - (y + 190), 8, 0, y + 190);
      e.done();
      c.beacon(0, 829, 0, 1.4);
      const tip = c.mesh(new THREE.CylinderGeometry(2.2, 2.5, 60, 8, 1, true), c.lamp('#eaf6ff', 2.6), c.root, false); tip.position.y = 760;
      // Dubai Mall
      const mall = c.facade({ color: '#d8ccb6', rough: 0.7 }, { bay: 6, floorH: 7, wx: [0.1, 0.9], wy: [0.4, 0.8], litProb: 0.8, litGain: 0.7 });
      const m = c.B(); m.box(mall, 420, 32, 220, 330, 0, 620); m.done();
    }
    // ---------- Dubai Fountain ----------
    {
      const jets = [], g = c.group(LAKE[0], -2, LAKE[1]);
      const jm = c.glow('#dff4ff', 0.55), jg = new THREE.CylinderGeometry(0.8, 2.2, 1, 6, 1, true).translate(0, 0.5, 0);
      for (let i = 0; i < 44; i++) {
        const a = i / 44 * Math.PI * 1.6 - Math.PI * 0.8, m = c.mesh(jg, jm, g, false);
        m.position.set(Math.sin(a) * 230, 0, -Math.cos(a) * 110 + 30); jets.push(m);
      }
      c.onFrame((t) => jets.forEach((m, i) => { m.scale.y = 5 + 70 * Math.max(0, Math.sin(t * 1.6 + i * 0.45)) ** 2; }));
    }

    // ---------- Museum of the Future ----------
    const [mx, mz] = toW(1500, -250);
    {
      const g = c.group(mx, 0, mz, Math.atan2(0.6, 0.8) + Math.PI / 2);
      const skin = c.facade({ color: '#c8ced2', rough: 0.25, metal: 0.85 }, { bay: 2.3, floorH: 2.9, wx: [0.1, 0.55], wy: [0.35, 0.6], glassMul: 0.3, glassAdd: [0.02, 0.02, 0.03], litProb: 0.9, litColor: [1, 0.85, 0.6], litGain: 1.3 });
      const e = c.B();
      e.add(skin, new THREE.TorusGeometry(40, 17, 18, 48).scale(1, 1.2, 0.62), c.M(0, 50, 0));
      e.add(c.std({ color: '#5f8a3f', rough: 0.9 }), new THREE.SphereGeometry(1, 24, 10, 0, Math.PI * 2, 0, Math.PI / 2), c.M(0, 0, 0, 0, 0, 0, 90, 14, 70));
      e.done(g);
    }
    // ---------- Dubai Frame ----------
    const [fx, fz] = toW(700, 1500);
    {
      const g = c.group(fx, 0, fz, Math.atan2(0.6, 0.8));
      const gold = c.std({ color: '#d4a64a', rough: 0.3, metal: 0.95, emissive: '#ffb84d', night: 0.7 });
      const glass = c.facade({ color: '#9fb2bd', rough: 0.1, metal: 0.6 }, { bay: 2, floorH: 4, wx: [0.05, 0.95], wy: [0.1, 0.95], litProb: 1, litGain: 1.1 });
      const e = c.B();
      for (const s of [-1, 1]) { e.box(gold, 24, 150, 22, s * 46.5); e.box(glass, 16, 142, 23, s * 46.5, 4); }
      e.box(gold, 117, 18, 22, 0, 132); e.box(glass, 80, 12, 23, 0, 135);
      e.done(g);
      c.trees(c.scatter(240, (r) => { const [x, z] = toW(700 + (r() - 0.5) * 700, 1500 + (r() - 0.5) * 500); return Math.hypot(x - fx, z - fz) > 80 ? [x, z, 7] : null; }), { type: 'palm', hue: 0.25 });
    }

    // ---------- Burj Al Arab ----------
    const [ax, az] = toW(-1300, -1780);
    {
      const g = c.group(ax, 0, az, Math.atan2(0.6, 0.8) + Math.PI);
      const island = c.B();
      island.cyl(c.std({ color: '#d8c6a0', rough: 0.9 }), 62, 70, 4, 24, 0, -3, 0);
      island.done(g);
      const sailShape = new THREE.Shape();
      sailShape.moveTo(0, 0); sailShape.lineTo(78, 0);
      sailShape.bezierCurveTo(95, 120, 70, 230, 6, 300);
      sailShape.lineTo(0, 300); sailShape.lineTo(0, 0);
      const geo = new THREE.ExtrudeGeometry(sailShape, { depth: 60, bevelEnabled: false, curveSegments: 24 });
      geo.translate(0, 0, -30);
      const p = geo.attributes.position;
      for (let i = 0; i < p.count; i++) p.setZ(i, p.getZ(i) * Math.max(0.05, 1 - p.getX(i) / 95));
      geo.computeVertexNormals();
      const fabric = c.std({ color: '#f4f5f4', rough: 0.45, metal: 0.05, emissive: '#6fa8ff', night: 1.2 });
      const e = c.B();
      e.add(fabric, geo, c.M(-20, 1, 0));
      const steel = c.std({ color: '#e2e5e6', rough: 0.3, metal: 0.8 });
      for (const s of [-1, 1]) {
        e.beam(steel, new V3(-30, 0, s * 34), new V3(-22, 300, s * 3), 3.2);
        for (let y = 20; y < 270; y += 40) e.beam(steel, new V3(-30 + y * 0.027, y, s * (34 - y * 0.103)), new V3(-29 + (y + 40) * 0.027, y + 40, -s * (30 - (y + 40) * 0.1) * 0.2), 1.2);
      }
      e.beam(steel, new V3(-22, 300, 0), new V3(-18, 321, 0), 2);
      e.cyl(steel, 16, 16, 2, 20, 72, 200, 0);
      e.beam(steel, new V3(40, 170, 0), new V3(72, 200, 0), 3);
      e.done(g);
      const [bx1, bz1] = toW(-1300, -1540);
      c.road([[ax - 40 * N[0], 3, az - 40 * N[1]], [bx1, 2, bz1]].map(([x, y, z]) => [x, y, z]).concat([]), { width: 10, pillars: 40 });
      c.onNight(() => {});
      c.onFrame((t) => fabric.emissive.setHSL(0.55 + 0.35 * Math.sin(t * 0.15), 0.8, 0.55));
    }

    // ---------- Palm Jumeirah ----------
    {
      const sand = c.std({ color: '#dcc99f', rough: 0.95 });
      const e = c.B(), ang = Math.atan2(N[0], N[1]);
      const [px, pz] = toW(-2800, -1500);
      const g = c.group(px, 0, pz, ang + Math.PI);
      e.box(sand, 90, 3, 1300, 0, -2.5, 650);
      for (let i = 0; i < 8; i++) for (const s of [-1, 1]) {
        const zz = 380 + i * 110, len = 420 - Math.abs(i - 3.5) * 25, a = s * (Math.PI / 2 - 0.25 - i * 0.07);
        e.add(sand, new THREE.BoxGeometry(34, 3, len).translate(0, 1.5, len / 2), c.M(0, -2.5, zz, 0, a));
      }
      e.add(sand, new THREE.TorusGeometry(820, 22, 4, 64, Math.PI * 1.3).rotateX(Math.PI / 2), c.M(0, -2, 680, 0, Math.PI * 0.15, 0));
      const pink = c.facade({ color: '#e7b9a3', rough: 0.6 }, { bay: 3, floorH: 3.5, litProb: 0.6, litGain: 0.7 });
      e.box(pink, 60, 90, 40, -60, -1, 1500); e.box(pink, 60, 90, 40, 60, -1, 1500); e.box(pink, 180, 22, 40, 0, 88, 1500);
      e.done(g, { shadow: false });
      const villas = [];
      for (let i = 0; i < 8; i++) for (const s of [-1, 1]) {
        const zz = 380 + i * 110, len = 420 - Math.abs(i - 3.5) * 25, a = s * (Math.PI / 2 - 0.25 - i * 0.07);
        for (let d = 30; d < len - 10; d += 26) for (const side of [-1, 1]) {
          const lx = Math.sin(a) * d + Math.cos(a) * side * 10, lz = zz + Math.cos(a) * d - Math.sin(a) * side * 10;
          const wv = new V3(lx, 0, lz).applyAxisAngle(new V3(0, 1, 0), ang + Math.PI);
          villas.push({ x: px + wv.x, z: pz + wv.z, y: 0, w: 12, d: 12, h: 7, r: ang + a, c: new THREE.Color('#efe6d6'), roof: 'box', rs: 0.5, rh: 2, rc: new THREE.Color('#e9dfcc') });
        }
      }
      c.buildings(villas, { mat: c.facade({ color: '#ffffff', rough: 0.8 }, { bay: 4, floorH: 3.5, litProb: 0.5 }), noShadow: true });
    }

    // ---------- Sheikh Zayed Road towers, Downtown, Marina ----------
    const glassCols = ['#8fa7b8', '#a9b6bf', '#6f8799', '#c5ccd0', '#8a98a0', '#b3a58c'].map((x) => new THREE.Color(x));
    const sandCols = ['#e3d5bd', '#d9c7a8', '#efe5d3', '#cbb895'].map((x) => new THREE.Color(x));
    const szrN = -300;
    const nearSZR = (x, z) => Math.abs(toL(x, z)[1] - szrN);
    const avoid = (x, z) => Math.hypot(x, z) < 110 || lake(x, z) || Math.hypot(x - 330, z - 620) < 260 || Math.hypot(x - mx, z - mz) < 130 || Math.hypot(x - fx, z - fz) < 380 || nearSZR(x, z) < 45;
    const lots = c.grid({
      R: 5200, bx: 180, bz: 180, sx: 34, sz: 34, angle: Math.atan2(0.6, 0.8), split: [2, 2], fill: [0.45, 0.8], jitter: 6,
      exclude: (x, z) => avoid(x, z) || height(x, z) < -1 || toL(x, z)[1] > 2700 || toL(x, z)[1] < -1450,
      density: (x, z) => { const [s, n] = toL(x, z); const tower = Math.exp(-(((n - szrN) / 260) ** 2)) * (s > -3800 ? 1 : 0); return 0.35 + 0.6 * Math.max(tower, Math.exp(-Math.hypot(x, z) / 700), Math.exp(-(((n + 1300) / 300) ** 2)) * (s < -2600 ? 1 : 0)); },
      height: (x, z, d, r) => {
        const [s, n] = toL(x, z);
        const szr = Math.exp(-(((n - szrN) / 200) ** 2)) * (s > 200 && s < 3200 ? 1 : 0.35);
        const down = Math.exp(-Math.hypot(x, z) / 600), marina = Math.exp(-Math.hypot(s + 3600, n + 1250) / 450);
        const f = Math.max(szr, down, marina);
        if (f < 0.25) return 8 + r * 8;
        return 40 + Math.pow(hash2(x | 0, z | 0), 1.4) * 330 * f + r * 30;
      },
      color: (r, x, z, h) => (h < 20 ? sandCols : glassCols)[Math.floor(r * 17) % (h < 20 ? 4 : 6)].clone(),
      decorate: (l, r) => {
        if (l.h < 20) { l.w *= 0.5; l.d *= 0.5; l.roof = 'box'; l.rs = 0.6; l.rh = 2; l.rc = l.c.clone().multiplyScalar(0.95); }
        else {
          l.w = Math.min(l.w, 48); l.d = Math.min(l.d, 48);
          const k = r(); l.shape = k < 0.25 ? 'cyl' : k < 0.45 ? 'taper' : k < 0.55 ? 'oct' : 'box';
          if (l.h > 150 && r() < 0.4) { l.roof = 'pyramid'; l.rh = 20 + r() * 25; l.rs = 0.7; l.rc = new THREE.Color('#d9dfe3'); }
        }
      },
    });
    const mat = c.facade({ color: 0xffffff, rough: 0.25, metal: 0.55 }, { bay: 2.4, floorH: 3.7, wx: [0.08, 0.92], wy: [0.12, 0.92], glassMul: 0.55, glassAdd: [0.03, 0.05, 0.07], litProb: 0.32, litColor: [1, 0.88, 0.7], litGain: 0.6 });
    c.buildings(lots, { mat, roofMats: { pyramid: c.std({ color: '#dde3e6', rough: 0.3, metal: 0.8, emissive: '#fff4de', night: 0.8 }), box: c.std({ color: '#fff', rough: 0.8 }) } });

    // SZR + Dubai Metro viaduct
    const szr = [], metro = [];
    for (let s = -5000; s <= 5000; s += 500) { const [x, z] = toW(s, szrN); szr.push([x, null, z]); const [x2, z2] = toW(s, szrN + 40); metro.push([x2, 14, z2]); }
    c.road(szr, { width: 56, traffic: 90, lamps: true, thick: 0.5 });
    const line = c.road(metro, { width: 9, pillars: 40, lamps: false, mat: c.std({ color: '#d7d9da', rough: 0.5 }) });
    {
      const tm = c.std({ color: '#e7e9ea', rough: 0.3, metal: 0.4, emissive: '#bfe0ff', night: 0.9 });
      const e = c.B(); for (let i = 0; i < 5; i++) e.box(tm, 3, 3.6, 17, 0, 0, i * 18 - 36);
      const train = e.done(c.group(), { shadow: false });
      const p = new V3(), tan = new V3();
      c.onFrame((t) => { const u = (t * 0.012) % 1; line.getPointAt(u, p); line.getTangentAt(u, tan); train.position.copy(p); train.rotation.y = Math.atan2(tan.x, tan.z); });
    }
    c.trees(c.scatter(900, (r) => { const s = (r() - 0.5) * 9000, side = r() < 0.5 ? -1 : 1; const [x, z] = toW(s, szrN + side * (34 + r() * 6)); return height(x, z) > -1 ? [x, z, 7] : null; }), { type: 'palm', hue: 0.24 });
  },
});
