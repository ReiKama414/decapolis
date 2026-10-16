CITY.register('hongkong', {
  caption: 'Bank of China Tower · 367 m',
  seed: 852,
  view: { pos: [520, 280, -700], target: [-250, 190, 650] },
  shadow: { c: [-300, 500], r: 1700 },
  fog: [800, 7500],
  sun: [-0.3, 0.6, -0.7],
  sky: { day: ['#5a8fc9', '#dce4ea', '#a0a9ae'], night: ['#03040c', '#1e2140', '#07070f'] },
  bloom: 0.75,
  build(c) {
    const { THREE, V3, smooth, fbm, hash2, lerp } = c;
    const shoreN = (x) => -350 + 70 * Math.sin(x * 0.001) + 230 * Math.exp(-(((x + 1400) / 450) ** 2));
    const shoreS = (x) => 450 + 50 * Math.sin(x * 0.0013 + 1);
    const hills = (x, z) => {
      const island = smooth(shoreS(x) + 280, shoreS(x) + 1500, z);
      const peak = 560 * Math.exp(-(((x + 600) / 900) ** 2) - (((z - 2100) / 900) ** 2));
      const ridge = (260 + 220 * fbm(x * 0.0008, z * 0.0008 + 5)) * island;
      const kow = smooth(-2300, -3400, z) * (300 + 250 * fbm(x * 0.0007 + 9, z * 0.0007));
      return Math.max(peak * smooth(shoreS(x) + 150, shoreS(x) + 900, z), ridge) + kow;
    };
    const height = (x, z) => {
      if (z > shoreN(x) && z < shoreS(x)) return -14;
      return hills(x, z);
    };
    c.ground({
      height,
      city: (x, z, h) => (h < 160 ? (1 - smooth(3200, 4200, Math.abs(x))) : 0),
      grid: { bx: 70, bz: 80, sx: 12, sz: 14, angle: 0.05, strength: 0.8 },
      colors: { grass: '#40613a', rock: '#2f4a2c' },
    });
    c.water({ color: '#1f3f4f', glitterR: 3500, glitter: [1, 0.75, 0.55], cz: 50 });

    // ---------- Bank of China Tower ----------
    const BX = 0, BZ = 720;
    {
      const g = c.group(BX, 0, BZ, 0.3);
      const glass = c.facade({ color: '#4d5f73', rough: 0.15, metal: 0.8 }, { bay: 2.2, floorH: 4, wx: [0.05, 0.95], wy: [0.08, 0.95], glassMul: 0.6, glassAdd: [0.02, 0.04, 0.07], litProb: 0.4, litColor: [0.9, 0.95, 1], litGain: 0.55 });
      const brace = c.std({ color: '#e9ecef', rough: 0.4, metal: 0.5, emissive: '#ffffff', night: 1.6 });
      const e = c.B(), S = 26;
      const corners = [[S, S], [-S, S], [-S, -S], [S, -S]];
      const H = [315, 262, 202, 136];
      for (let k = 0; k < 4; k++) {
        const [ax, az] = corners[k], [bx, bz] = corners[(k + 1) % 4], h = H[k], cap = k === 0 ? 50 : 26;
        const tri = [[0, 0], [ax, -az], [bx, -bz]];
        e.loft(glass, tri, [{ y: 0, s: 1 }, { y: h, s: 1 }], { capTop: false });
        const top = new THREE.BufferGeometry().setFromPoints([new V3(0, h + cap, 0), new V3(ax, h, az), new V3(bx, h, bz), new V3(0, h + cap, 0), new V3(bx, h, bz), new V3(ax, h, az)]);
        top.computeVertexNormals();
        e.add(glass, top);
        // X bracing on the outer face
        const A = new V3(ax * 1.01, 0, az * 1.01), B = new V3(bx * 1.01, 0, bz * 1.01);
        for (let y = 0; y + 1 < h; y += 52) {
          const y1 = Math.min(y + 52, h);
          e.beam(brace, A.clone().setY(y), B.clone().setY(y1), 1.3); e.beam(brace, B.clone().setY(y), A.clone().setY(y1), 1.3);
          e.beam(brace, A.clone().setY(y1), B.clone().setY(y1), 1.3);
        }
        e.beam(brace, A, A.clone().setY(h), 1.6);
        e.beam(brace, A.clone().setY(h), new V3(0, h + cap, 0), 1.2); e.beam(brace, B.clone().setY(h), new V3(0, h + cap, 0), 1.2);
      }
      e.box(c.std({ color: '#8b8f8f', rough: 0.7 }), 70, 14, 70, 0, 0, 0);
      for (const s of [-1, 1]) e.cyl(c.std({ color: '#d0d4d6', metal: 0.8, rough: 0.3 }), 0.5, 1.4, 55, 6, s * 4, 360, s * 4);
      e.done(g);
      c.beacon(BX, 416, BZ, 1.1);
    }

    // ---------- IFC (Two International Finance Centre) ----------
    const IX = -750, IZ = 600;
    const whiteGlass = c.facade({ color: '#c4ccd2', rough: 0.25, metal: 0.55 }, { bay: 1.6, floorH: 4, wx: [0.25, 0.95], wy: [0.1, 0.95], glassMul: 0.45, glassAdd: [0.04, 0.06, 0.08], litProb: 0.35, litColor: [0.92, 0.96, 1], litGain: 0.6 });
    {
      const e = c.B(), P = c.prof.chamfer(1, 1, 0.25);
      e.loft(whiteGlass, P, [{ y: 0, s: 34, x: IX, z: IZ }, { y: 340, s: 31, x: IX, z: IZ }]);
      e.loft(whiteGlass, P, [{ y: 340, s: 27, x: IX, z: IZ }, { y: 368, s: 25, x: IX, z: IZ }]);
      e.loft(whiteGlass, P, [{ y: 368, s: 21, x: IX, z: IZ }, { y: 388, s: 19, x: IX, z: IZ }]);
      const fin = c.std({ color: '#e9eef2', rough: 0.3, metal: 0.6, emissive: '#dfefff', night: 1.2 });
      for (let k = 0; k < 4; k++) {
        const a = k * Math.PI / 2 + Math.PI / 4;
        e.box(fin, 3, 36, 10, IX + Math.cos(a) * 26, 376, IZ + Math.sin(a) * 26, 0, -a);
      }
      e.box(c.facade({ color: '#b9b4aa', rough: 0.6 }, { bay: 3, floorH: 4, litProb: 0.7, litGain: 0.6 }), 200, 30, 90, IX + 60, 0, IZ - 40);
      e.done();
      c.beacon(IX, 413, IZ, 1);
    }

    // ---------- ICC (West Kowloon) ----------
    const KX = -1400, KZ = -250;
    {
      const icc = c.facade({ color: '#7c8f9e', rough: 0.15, metal: 0.8 }, { bay: 1.8, floorH: 4.2, wx: [0.05, 0.95], wy: [0.08, 0.95], glassMul: 0.55, litProb: 0.35, litGain: 0.5, led: 0.6, ledMin: 60 });
      const e = c.B(), P = c.prof.notched(0.12);
      e.loft(icc, P, [{ y: 0, s: 46, x: KX, z: KZ }, { y: 20, s: 38, x: KX, z: KZ }, { y: 60, s: 33, x: KX, z: KZ }, { y: 460, s: 31, x: KX, z: KZ }, { y: 484, s: 27, x: KX, z: KZ }]);
      e.box(c.facade({ color: '#a8a39a', rough: 0.6 }, { bay: 4, floorH: 5, litProb: 0.6 }), 260, 40, 160, KX, 0, KZ - 150);
      e.done();
      c.beacon(KX, 486, KZ, 1.2);
    }

    // ---------- Convention Centre wing roof ----------
    {
      const e = c.B(), x0 = 650, z0 = shoreS(650) + 30;
      e.box(whiteGlass, 150, 18, 90, x0, 0, z0 + 30);
      e.add(c.std({ color: '#dfe3e3', rough: 0.35, metal: 0.4 }), new THREE.SphereGeometry(1, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), c.M(x0, 18, z0 + 20, 0, 0, 0, 95, 18, 60));
      e.done();
    }

    // ---------- Victoria Peak & Peak Tower ----------
    {
      const px = -700, pz = 1900, py = height(px, pz);
      const e = c.B(), m = c.std({ color: '#d3d2cc', rough: 0.5, emissive: '#ffe9c2', night: 0.5 });
      e.cyl(m, 14, 18, 14, 16, px, py - 4, pz);
      e.add(m, new THREE.LatheGeometry([[16, 0], [30, 8], [44, 20], [46, 24], [30, 22], [18, 12]].map(([r, y]) => new THREE.Vector2(r, y)), 32), c.M(px, py + 10, pz));
      e.done();
    }

    // ---------- Skyline ----------
    const cols = ['#c9ccce', '#aeb6bd', '#d9d6cf', '#8e9aa5', '#b8b1a4', '#e1e2de', '#7e8a96'].map((x) => new THREE.Color(x));
    const res = ['#d8d2c6', '#c7c9c4', '#e6e0d3', '#b9bcb8', '#d1c7b5'].map((x) => new THREE.Color(x));
    const avoid = (x, z) => Math.hypot(x - BX, z - BZ) < 75 || Math.hypot(x - IX, z - IZ) < 120 || Math.hypot(x - KX, z - KZ) < 180 || (Math.abs(x - 650) < 110 && z < shoreS(650) + 150 && z > 300);
    const island = c.grid({
      R: 4200, bx: 70, bz: 80, sx: 12, sz: 14, angle: 0.05, split: [2, 2], fill: [0.55, 0.8], big: 0.05, maxSlope: 30,
      exclude: (x, z) => z < shoreS(x) + 25 || avoid(x, z) || height(x, z) > 170,
      density: (x, z) => 0.95 - 0.6 * smooth(900, 2000, z - shoreS(x)),
      height: (x, z, d, r, big) => {
        const band = Math.exp(-(((z - shoreS(x) - 170) / 260) ** 2)) * (1 - smooth(2200, 3600, Math.abs(x + 200)));
        const hillside = smooth(250, 450, z - shoreS(x));
        let h = 35 + r * 50 + band * (30 + Math.pow(hash2(x | 0, z | 0), 1.5) * 150);
        if (hillside > 0) h = 70 + r * 90;
        return big ? h * 1.2 : h;
      },
      color: (r, x, z) => (z - shoreS(x) > 250 ? res : cols)[Math.floor(r * 23) % 5].clone(),
      decorate: (l) => { if (l.z - shoreS(l.x) > 250) { l.w = Math.min(l.w, 26); l.d = Math.min(l.d, 26); } },
    });
    const kowloon = c.grid({
      R: 4200, bx: 75, bz: 75, sx: 13, sz: 13, angle: 0.12, split: [2, 2], fill: [0.65, 0.9], big: 0.04,
      exclude: (x, z) => z > shoreN(x) - 25 || avoid(x, z) || height(x, z) > 30,
      density: (x, z) => 0.97 - 0.3 * smooth(2000, 3000, -z),
      height: (x, z, d, r, big) => {
        const tst = Math.exp(-Math.hypot(x - 100, z + 600) / 500);
        let h = 35 + r * 60;
        if (hash2(x | 0, z | 0) < 0.25 * tst + 0.05) h += 40 + hash2(z | 0, x | 0) * 130 * (0.4 + tst);
        return big ? h * 1.2 : h;
      },
      color: (r) => (r < 0.6 ? res : cols)[Math.floor(r * 31) % 5].clone(),
    });
    const mat = c.facade({ color: 0xffffff, rough: 0.6, metal: 0.25 }, { bay: 2.2, floorH: 3.2, wx: [0.15, 0.85], wy: [0.3, 0.85], glassMul: 0.4, litProb: 0.45, litColor: [0.95, 0.92, 0.85], litGain: 0.6 });
    c.buildings([...island, ...kowloon], { mat });
    // neon over Kowloon streets
    {
      const neon = ['#ff2a5a', '#2ae5ff', '#ffd02a', '#b44aff'].map((x) => c.lamp(x, 2.3, 0.2));
      const n = c.B(), r = c.rand;
      let k = 0;
      for (const l of kowloon) {
        if (r() > 0.25 || k++ > 300) continue;
        const face = new V3(Math.sin(l.r), 0, Math.cos(l.r));
        n.box(neon[Math.floor(r() * 4)], 8 + r() * 10, 3 + r() * 5, 0.8, l.x + face.x * (l.d / 2 + 4), 7 + r() * 20, l.z + face.z * (l.d / 2 + 4), 0, l.r);
      }
      n.done(c.root, { shadow: false });
    }
    c.trees(c.scatter(1400, (r) => { const x = (r() - 0.5) * 8000, z = 600 + r() * 3000, h = height(x, z); return h > 60 && h < 520 ? [x, z, 14] : null; }), { hue: 0.3 });

    // ---------- Harbour life: Star Ferries and a red-sailed junk ----------
    {
      const hull = c.std({ color: '#2f6b45', rough: 0.6 }), deckW = c.std({ color: '#f1f1ea', rough: 0.6 });
      const sail = c.std({ color: '#b3261e', rough: 0.8, side: THREE.DoubleSide, emissive: '#ff5533', night: 0.4 });
      const boats = [];
      for (let i = 0; i < 7; i++) {
        const e = c.B(), junk = i === 6;
        if (junk) {
          e.box(c.std({ color: '#5a3a24' }), 7, 3, 22, 0, -1);
          for (const [zz, h] of [[-5, 16], [3, 20]]) e.add(sail, new THREE.PlaneGeometry(12, h), c.M(0, 4 + h / 2, zz, 0, Math.PI / 2, 0));
        } else { e.box(hull, 9, 3, 30, 0, -1); e.box(deckW, 8, 3, 24, 0, 2); e.box(hull, 8.5, 0.6, 26, 0, 5); }
        const g = e.done(c.group(), { shadow: false });
        boats.push({ g, x: -1200 + i * 380, ph: i * 1.7, sp: 0.03 + (i % 3) * 0.01, junk });
      }
      c.onFrame((t) => boats.forEach((b) => {
        if (b.junk) { const a = t * 0.02 + b.ph; b.g.position.set(-200 + Math.cos(a) * 1300, -1.6, 60 + Math.sin(a * 2) * 120); b.g.rotation.y = Math.atan2(-Math.sin(a) * 1300, Math.cos(a * 2) * 240); return; }
        const k = (Math.sin(t * b.sp + b.ph) + 1) / 2, zN = shoreN(b.x) + 40, zS = shoreS(b.x) - 40;
        b.g.position.set(b.x, -1.6, lerp(zN, zS, k)); b.g.rotation.y = 0;
      }));
    }

    // ---------- Symphony of Lights ----------
    {
      const beamGeo = new THREE.CylinderGeometry(0.6, 3.5, 1600, 6, 1, true).translate(0, 800, 0);
      const colsL = ['#35ff7a', '#3aa8ff', '#ff3af0', '#ffffff', '#35ff7a', '#ffee3a'];
      const tops = [[BX, 400, BZ], [IX, 395, IZ], [KX, 486, KZ], [300, 250, 640], [-300, 230, 620], [900, 220, 700]];
      const beams = tops.map(([x, y, z], i) => { const m = c.mesh(beamGeo, c.glow(colsL[i], 0.5), c.root, false); m.position.set(x, y, z); m.frustumCulled = false; return m; });
      c.onFrame((t) => beams.forEach((m, i) => { m.rotation.set(0.5 + 0.35 * Math.sin(t * 0.4 + i), t * 0.3 + i * 1.3, 0.3 * Math.cos(t * 0.33 + i), 'YXZ'); }));
    }
    // Island Eastern Corridor on the waterfront
    const ec = []; for (let x = -2600; x <= 3000; x += 250) ec.push([x, 12, shoreS(x) + 12]);
    c.road(ec, { width: 20, pillars: 40, traffic: 50 });
  },
});
