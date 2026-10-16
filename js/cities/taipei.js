CITY.register('taipei', {
  caption: 'Taipei 101 · 508 m',
  seed: 101,
  weekday: true,
  view: { pos: [430, 190, 560], target: [0, 210, 0] },
  shadow: { c: [-300, -300], r: 1300 },
  fog: [900, 7500],
  sky: { day: ['#3f7fcc', '#cfe0ec', '#9aa7b0'], night: ['#020410', '#1b2440', '#06080e'] },
  build(c) {
    const { THREE, smooth, fbm, distPoly, hash2 } = c;

    // ---------- Terrain: Taipei basin, Keelung & Tamsui rivers, Elephant Mountain, Yuanshan ----------
    const keelung = [[-5200, -1100], [-2650, -1750], [-1500, -2020], [-600, -1950], [300, -2250], [1500, -2150], [2800, -2500], [5200, -2300]];
    const tamsui = [[-3000, 5200], [-2900, 2400], [-2750, 400], [-2650, -1750], [-3100, -3600], [-4200, -5200]];
    const hills = (x, z) => {
      const d = Math.hypot(x * 0.9, z);
      const ring = smooth(3000, 5400, d) * (220 + 820 * fbm(x * 0.0006 + 3, z * 0.0006));
      const xiang = 175 * Math.exp(-(((x - 1250) ** 2) / (2 * 300 ** 2) + ((z - 950) ** 2) / (2 * 420 ** 2)));
      const yuan = 62 * Math.exp(-(((x + 1000) ** 2) / (2 * 260 ** 2) + ((z + 2480) ** 2) / (2 * 160 ** 2)));
      return ring + xiang + yuan;
    };
    const river = (x, z) => Math.max(1 - smooth(55, 90, distPoly(x, z, keelung)), 1 - smooth(120, 160, distPoly(x, z, tamsui)));
    const height = (x, z) => { const w = river(x, z); return hills(x, z) * (1 - w) - 12 * w; };
    c.ground({ height, city: (x, z, h) => (h < 3 ? 1 - smooth(2800, 3400, Math.hypot(x, z)) : 0), grid: { bx: 115, sx: 24 } });
    c.water({ color: '#2a4a52', glitterR: 3000 });

    // ---------- Materials ----------
    const towerMat = c.facade({ color: 0x78a097, rough: 0.45, metal: 0.35, flat: true }, {
      bay: 2.4, floorH: 4.25, wx: [0.07, 0.93], wy: [0.3, 0.95], glassMul: 0.35, glassAdd: [0.015, 0.06, 0.06], glassRough: 0.06, glassMetal: 0.85,
      litProb: 0.3, litColor: [0.8, 0.9, 1.0], litGain: 0.45, glow: 0.55, modStart: 101, modH: 34, modEnd: 373,
    });
    const trimMat = c.std({ color: 0xd4dcda, rough: 0.3, metal: 0.8, emissive: 0xffffff, night: 2.2, flat: true });
    const goldMat = c.std({ color: 0xd2a849, rough: 0.3, metal: 1.0, emissive: 0xffb640, night: 0.35 });
    const steelMat = c.std({ color: 0xc7cdd0, rough: 0.35, metal: 0.85 });
    c.setDayHook((col) => trimMat.emissive.set(col));

    // ---------- Taipei 101 ----------
    const b = c.B(), P = c.prof.notched(0.09);
    b.loft(towerMat, P, [{ y: 0, s: 33 }, { y: 101, s: 24 }]);
    for (let i = 0; i < 8; i++) {
      const y0 = 101 + i * 34, y1 = y0 + 34;
      b.loft(towerMat, P, [{ y: y0, s: 20.5 }, { y: y1, s: 24.5 }]);
      b.loft(trimMat, P, [{ y: y1 - 1.1, s: 24.85 }, { y: y1 + 0.35, s: 24.9 }]);
      for (let k = 0; k < 4; k++) {
        const a = k * Math.PI / 2 + Math.PI / 4, r = 24.5 * 0.91 * Math.SQRT2 + 1.6;
        b.add(goldMat, new THREE.BoxGeometry(1.4, 1.4, 5), c.M(Math.sin(a) * r, y1 + 0.6, Math.cos(a) * r, 0, a, 0).multiply(c.M(0, 0, 0, -0.45)));
      }
    }
    for (const [y0, y1, s0, s1] of [[373, 385, 17.5, 17.5], [385, 403, 15.5, 15], [403, 421, 12.5, 12], [421, 437, 9.5, 9], [437, 449, 6.5, 6]]) {
      b.loft(towerMat, P, [{ y: y0, s: s0 }, { y: y1, s: s1 }]);
      b.loft(trimMat, P, [{ y: y1 - 0.8, s: s1 + 0.3 }, { y: y1 + 0.3, s: s1 + 0.35 }]);
    }
    for (const [y0, y1, rt, rb, m] of [[449, 462, 4.2, 4.4, steelMat], [462, 463.2, 5.6, 5.6, trimMat], [463.2, 481, 3.0, 3.2, steelMat],
      [481, 482, 4.0, 4.0, trimMat], [482, 497, 1.8, 2.0, steelMat], [497, 508, 0.25, 1.0, steelMat]]) b.cyl(m, rt, rb, y1 - y0, 24, 0, y0, 0);
    // giant coin ornaments on the base
    {
      const shape = new THREE.Shape(); shape.absarc(0, 0, 7, 0, Math.PI * 2, false);
      const hole = new THREE.Path(), h = 2.4;
      hole.moveTo(-h, -h); hole.lineTo(-h, h); hole.lineTo(h, h); hole.lineTo(h, -h); hole.lineTo(-h, -h);
      shape.holes.push(hole);
      const cy = 86, slope = Math.atan(9 / 101), s = 33 - 9 * cy / 101;
      for (let k = 0; k < 4; k++) {
        const ry = k * Math.PI / 2;
        const base = c.M(0, 0, 0, 0, ry).multiply(c.M(0, cy, s + 0.6, -slope));
        b.add(goldMat, new THREE.ExtrudeGeometry(shape, { depth: 1, bevelEnabled: true, bevelThickness: 0.35, bevelSize: 0.35, bevelSegments: 2, curveSegments: 40 }).translate(0, 0, -0.5), base);
        b.add(goldMat, new THREE.TorusGeometry(5.3, 0.3, 6, 40), base.clone().multiply(c.M(0, 0, 1)));
      }
    }
    b.done();
    c.beacon(0, 508.6, 0, 1.0);
    for (let k = 0; k < 4; k++) { const a = k * Math.PI / 2 + Math.PI / 4; c.beacon(Math.cos(a) * 8.2, 449.8, Math.sin(a) * 8.2, 0.6); }

    // mall podium
    const podMat = c.facade({ color: 0xb3b7b2, rough: 0.6, metal: 0.2 }, { bay: 4, floorH: 6, wx: [0.05, 0.95], wy: [0.35, 0.9], glassMul: 0.3, litProb: 0.6, litColor: [1, 0.85, 0.6], litGain: 0.7 });
    const pb = c.B();
    pb.box(podMat, 165, 30, 110, 82, 0, 0);
    pb.box(podMat, 95, 9, 80, 100, 30, 0);
    pb.add(podMat, new THREE.CylinderGeometry(40, 40, 95, 32, 1, false, 0, Math.PI), c.M(100, 39, 0, 0, Math.PI / 2, Math.PI / 2, 1, 1, 0.25));
    pb.done();
    const plaza = c.mesh(new THREE.CircleGeometry(95, 48).rotateX(-Math.PI / 2), c.std({ color: 0x9b978f, rough: 0.8 }), c.root, false);
    plaza.position.y = 0.15; plaza.receiveShadow = true;

    // ---------- Chiang Kai-shek Memorial Hall & Liberty Square ----------
    const white = c.std({ color: '#f1efe9', rough: 0.55 });
    const blue = c.std({ color: '#1f4e9e', rough: 0.4, metal: 0.2, flat: true });
    const red = c.std({ color: '#a8261d', rough: 0.55 });
    const orange = c.std({ color: '#dc8a1e', rough: 0.45, metal: 0.2, flat: true });
    const floodW = c.std({ color: '#f1efe9', rough: 0.55, emissive: '#fff1d6', night: 0.35 });
    const HX = -1500, HZ = 500;
    {
      const g = c.group(HX, 0, HZ);
      const k = c.B();
      k.box(floodW, 92, 6, 92); k.box(floodW, 78, 6, 78, 0, 6); k.box(floodW, 64, 4, 64, 0, 12);
      k.add(floodW, new THREE.BoxGeometry(24, 1, 34).translate(0, 0, 0), c.M(-52, 8, 0, 0, 0, 0.42)); // front stair
      k.box(floodW, 44, 28, 44, 0, 16);
      const O = c.prof.ngon(8, Math.PI / 8);
      k.loft(blue, O, [{ y: 44, s: 34 }, { y: 47, s: 32 }, { y: 53, s: 22 }]);
      k.loft(floodW, O, [{ y: 53, s: 18.5 }, { y: 59, s: 18.5 }], { capTop: false });
      k.loft(blue, O, [{ y: 59, s: 25 }, { y: 62, s: 22 }, { y: 73, s: 3 }]);
      k.cyl(goldMat, 0.6, 1.8, 5, 12, 0, 72.5);
      k.done(g);
      // plaza, gate, theatre and concert hall
      const pl = c.mesh(new THREE.PlaneGeometry(620, 460).rotateX(-Math.PI / 2), c.std({ color: '#bdb6a8', rough: 0.85 }), g, false);
      pl.position.set(-250, 0.2, 0); pl.receiveShadow = true;
      const gb = c.B();
      for (const zz of [-34, -14, 14, 34]) gb.box(white, 6, 24, 10, -520, 0, zz);
      gb.box(white, 8, 24, 16, -520, 0, 0).box(white, 10, 8, 84, -520, 24, 0);
      gb.loft(blue, c.prof.rect(1, 1), [{ y: 32, sx: 8, sz: 46 }, { y: 36, sx: 3, sz: 38 }]);
      gb.done(g);
      for (const s of [-1, 1]) {
        const hb = c.B(), z = s * 190;
        hb.box(white, 110, 4, 70, -280, 0, z);
        for (let i = 0; i < 9; i++) for (const zz of [-26, 26]) hb.cyl(red, 1.6, 1.6, 18, 10, -325 + i * 11.2, 4, z + zz);
        hb.box(c.std({ color: '#efe6d2', rough: 0.6 }), 90, 18, 44, -280, 4, z);
        hb.loft(orange, c.prof.rect(1, 1), [{ y: 22, sx: 62, sz: 36, x: -280, z }, { y: 24, sx: 58, sz: 32, x: -280, z }, { y: 34, sx: 38, sz: 6, x: -280, z }]);
        hb.done(g);
      }
      c.trees([...Array(60)].map((_, i) => [HX - 520 + (i % 30) * 18, HZ + (i < 30 ? -215 : 215), 9]), { shadow: true });
    }

    // ---------- Taipei Main Station ----------
    const SX = -1900, SZ = -800;
    {
      const stMat = c.facade({ color: '#cdb892', rough: 0.7 }, { bay: 5, floorH: 5.5, wx: [0.3, 0.7], wy: [0.3, 0.8], glassMul: 0.3, litProb: 0.7, litGain: 0.6 });
      const roof = c.std({ color: '#5a3e2b', rough: 0.6, flat: true });
      const s = c.B();
      s.box(stMat, 190, 24, 150, SX, 0, SZ);
      s.loft(roof, c.prof.rect(1, 1), [{ y: 24, sx: 99, sz: 79, x: SX, z: SZ }, { y: 26, sx: 96, sz: 76, x: SX, z: SZ }, { y: 32, sx: 78, sz: 58, x: SX, z: SZ }]);
      s.box(stMat, 150, 6, 110, SX, 32, SZ);
      s.loft(roof, c.prof.rect(1, 1), [{ y: 38, sx: 80, sz: 60, x: SX, z: SZ }, { y: 40, sx: 77, sz: 57, x: SX, z: SZ }, { y: 52, sx: 40, sz: 20, x: SX, z: SZ }]);
      s.done();
      // Shin Kong Life Tower across the square
      const skMat = c.facade({ color: '#6f5a45', rough: 0.4, metal: 0.4 }, { bay: 2.5, floorH: 4, wx: [0.1, 0.9], wy: [0.2, 0.9], glassMul: 0.5, litGain: 0.5 });
      const t = c.B();
      t.loft(skMat, c.prof.chamfer(1, 0.55, 0.2), [{ y: 0, s: 34, x: SX + 180, z: SZ + 150 }, { y: 244, s: 34, x: SX + 180, z: SZ + 150 }]);
      t.done();
      c.beacon(SX + 180, 245, SZ + 150, 0.8);
    }

    // ---------- Grand Hotel on Yuanshan ----------
    {
      const GX = -1000, GZ = -2480, gy = height(GX, GZ) - 6;
      const hRed = c.facade({ color: '#b3261e', rough: 0.6 }, { bay: 4, floorH: 3.6, wx: [0.25, 0.75], wy: [0.3, 0.8], glassMul: 0.35, glassAdd: [0.05, 0.03, 0.02], litProb: 0.55, litGain: 0.8 });
      const gold = c.std({ color: '#e3a82b', rough: 0.4, metal: 0.3, flat: true, emissive: '#ffb347', night: 0.25 });
      const g = c.B();
      g.box(hRed, 170, 48, 28, GX, gy, GZ);
      const hip = (y, x, sx, sz, h) => g.loft(gold, c.prof.rect(1, 1), [{ y, sx: sx + 5, sz: sz + 5, x, z: GZ }, { y: y + 1.5, sx: sx + 3, sz: sz + 3, x, z: GZ }, { y: y + h, sx: sx * 0.75, sz: 1, x, z: GZ }]);
      hip(gy + 48, GX, 85, 14, 12);
      g.box(hRed, 52, 14, 22, GX, gy + 48, GZ);
      hip(gy + 62, GX, 26, 11, 11);
      for (const s of [-1, 1]) { g.box(hRed, 26, 10, 26, GX + s * 72, gy + 48, GZ); hip(gy + 58, GX + s * 72, 13, 13, 9); }
      g.done();
    }

    // ---------- City ----------
    const colors = ['#b5ada0', '#9aa3ab', '#c9c2b3', '#8f9690', '#d4cdbd', '#a39a8c', '#7f8a93', '#bfb9ae'].map((x) => new THREE.Color(x));
    const avoid = [[-110, 215, -120, 120], [HX - 820, HX + 60, HZ - 250, HZ + 250], [SX - 130, SX + 240, SZ - 110, SZ + 200]];
    const lots = c.grid({
      R: 3200, bx: 115, sx: 24,
      density: (x, z, d) => 0.97 - 0.2 * smooth(2200, 3200, d),
      exclude: (x, z) => avoid.some(([a, b2, cc, d]) => x > a && x < b2 && z > cc && z < d),
      height: (x, z, d, r) => {
        const f = Math.exp(-Math.hypot(x - 200, z - 100) / 800);
        let h = 14 + Math.pow(r, 2) * 38;
        if (hash2(x | 0, z | 0) < 0.2 * f + 0.02) h += 40 + hash2(z | 0, x | 0) * 160 * f;
        return h;
      },
      color: (r) => colors[Math.floor(r * colors.length)].clone().multiplyScalar(0.88 + (r * 7 % 1) * 0.24),
      decorate: (l, r) => { if (l.h < 55 && r() < 0.35) { l.roof = 'box'; l.rs = 0.4; l.rh = 3.5; l.rc = new THREE.Color('#7d8a90'); } },
    });
    const cityMat = c.facade({ color: 0xffffff, rough: 0.75, metal: 0.15 }, { bay: 3.3, floorH: 3.6, wx: [0.18, 0.82], wy: [0.3, 0.82], glassMul: 0.35, glassAdd: [0.02, 0.03, 0.045], glassRough: 0.2, glassMetal: 0.5, litProb: 0.28 });
    c.buildings(lots, { mat: cityMat, roofMats: { box: c.std({ color: '#ffffff', rough: 0.7, metal: 0.4 }) } });

    // riverside parks & mountain trees
    c.trees(c.scatter(700, (r) => {
      const x = (r() - 0.5) * 9000, z = (r() - 0.5) * 9000, h = height(x, z);
      return h > 25 && h < 700 ? [x, z, 14] : null;
    }), { hue: 0.3 });
    c.trees(c.scatter(260, (r) => {
      const x = (r() - 0.5) * 7000, z = -2300 + (r() - 0.5) * 1000, d = distPoly(x, z, keelung);
      return d > 95 && d < 150 && height(x, z) < 3 ? [x, z, 9] : null;
    }));
    c.bridge({ a: [-450, -1780], b: [-420, -2200], type: 'girder', deck: 14, width: 30, traffic: 20 });
    c.bridge({ a: [900, -2020], b: [940, -2430], type: 'arch', deck: 14, towerH: 60, width: 30 });
    c.bridge({ a: [-2400, -600], b: [-3050, -500], type: 'stayed', deck: 16, towerH: 110, width: 30, towers: [0.5] });
  },
});
