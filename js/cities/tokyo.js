CITY.register('tokyo', {
  caption: 'Tokyo Tower · 333 m',
  seed: 333,
  view: { pos: [460, 210, 520], target: [0, 140, 0] },
  shadow: { c: [0, 0], r: 1400 },
  fog: [700, 8000],
  sun: [0.5, 0.55, -0.6],
  sky: { day: ['#4a86d0', '#dde6ee', '#a4acb3'], night: ['#03040c', '#1d1f3a', '#07070e'] },
  build(c) {
    const { THREE, V3, smooth, fbm, distPoly, hash2 } = c;
    const inBay = (x, z) => z + 0.25 * x > 1750 + 250 * Math.sin(x * 0.0012);
    const sumida = [[1300, -4800], [1250, -2200], [1500, -900], [1650, 400], [1900, 1500]];
    const height = (x, z) => {
      const bay = smooth(-120, 120, (z + 0.25 * x) - (1750 + 250 * Math.sin(x * 0.0012)));
      const riv = 1 - smooth(50, 80, distPoly(x, z, sumida));
      const w = Math.max(bay, riv);
      const hill = 12 * fbm(x * 0.001, z * 0.001) * smooth(0, 800, -z);
      return (hill + 0) * (1 - w) - 14 * w;
    };
    c.ground({ height, city: (x, z, h) => (h > -0.5 ? 1 - smooth(3600, 4400, Math.hypot(x, z)) : 0), grid: { bx: 70, bz: 90, sx: 11, sz: 13, angle: 0.18, strength: 0.9 } });
    c.water({ color: '#264452', glitterR: 3500, cz: 1800 });

    // Mt Fuji on the western horizon
    {
      const fm = new THREE.MeshBasicMaterial({ color: '#8a9db3', fog: false });
      const sm = new THREE.MeshBasicMaterial({ color: '#eef3f8', fog: false });
      c.onNight((t) => { fm.color.set('#8a9db3').lerp(new THREE.Color('#141a2c'), t); sm.color.set('#eef3f8').lerp(new THREE.Color('#2a3350'), t); });
      const f = c.B();
      f.add(fm, new THREE.CylinderGeometry(260, 3800, 1500, 48, 1, true));
      f.add(sm, new THREE.CylinderGeometry(120, 900, 360, 48, 1, true).translate(0, 575, 0));
      const g = f.done(c.group(-8200, 700, -3600), { shadow: false, receive: false });
      g.children.forEach((m) => { m.renderOrder = -0.5; });
    }

    // ---------- Tokyo Tower (orange / white lattice) ----------
    const orange = c.std({ color: '#f0541e', rough: 0.5, metal: 0.3, emissive: '#ff7a2a', night: 1.1 });
    const whiteT = c.std({ color: '#f4f1ea', rough: 0.5, metal: 0.3, emissive: '#fff0d8', night: 0.9 });
    const deck = c.facade({ color: '#d9dcd8', rough: 0.3, metal: 0.4 }, { bay: 2, floorH: 4, wx: [0.05, 0.95], wy: [0.2, 0.95], glassMul: 0.2, litProb: 0.9, litGain: 0.9 });
    const tt = c.B();
    const halfW = (y) => (y < 150 ? 40 * Math.pow(1 - y / 150, 1.6) + 9 : 9 * (1 - (y - 150) / 190) + 1.5);
    const band = (y) => (Math.floor(y / 25) % 2 ? whiteT : orange);
    const ys = []; for (let y = 0; y <= 250; y += y < 150 ? 10 : 12.5) ys.push(y);
    for (let i = 0; i < ys.length - 1; i++) {
      const y0 = ys[i], y1 = ys[i + 1], w0 = halfW(y0), w1 = halfW(y1), m = band(y0);
      for (const [sx, sz] of [[1, 1], [-1, 1], [-1, -1], [1, -1]]) {
        tt.beam(m, new V3(sx * w0, y0, sz * w0), new V3(sx * w1, y1, sz * w1), 2.2);
      }
      for (let k = 0; k < 4; k++) {
        const a = [[1, 1], [-1, 1], [-1, -1], [1, -1]][k], bb = [[1, 1], [-1, 1], [-1, -1], [1, -1]][(k + 1) % 4];
        tt.beam(m, new V3(a[0] * w0, y0, a[1] * w0), new V3(bb[0] * w1, y1, bb[1] * w1), 0.8);
        tt.beam(m, new V3(bb[0] * w0, y0, bb[1] * w0), new V3(a[0] * w1, y1, a[1] * w1), 0.8);
        tt.beam(m, new V3(a[0] * w1, y1, a[1] * w1), new V3(bb[0] * w1, y1, bb[1] * w1), 0.9);
      }
    }
    // arches between legs
    for (let k = 0; k < 4; k++) {
      const pts = [];
      for (let i = 0; i <= 16; i++) { const u = i / 16 * 2 - 1, x = u * 42, y = 38 * (1 - u * u); pts.push(new V3(x, y, 44 - y * 0.25).applyAxisAngle(new V3(0, 1, 0), k * Math.PI / 2)); }
      tt.chain(orange, pts, 1.1, 5);
    }
    tt.box(deck, 34, 12, 34, 0, 145); tt.box(orange, 36, 2, 36, 0, 157);
    tt.box(deck, 16, 6, 16, 0, 247); tt.box(whiteT, 17, 1.5, 17, 0, 253);
    const hi = tt.done(new THREE.Group());
    const ant = c.B();
    ant.cyl(whiteT, 1.8, 3.2, 40, 8, 0, 254); ant.cyl(orange, 0.9, 1.8, 40, 8, 0, 294);
    ant.done(hi);
    const lo = c.B();
    lo.loft(orange, c.prof.rect(1, 1), [{ y: 0, s: 45 }, { y: 50, s: 26 }, { y: 150, s: 9 }, { y: 250, s: 4 }]);
    lo.cyl(orange, 0.9, 3, 83, 6, 0, 250);
    c.lod(0, 0, hi, lo.done(new THREE.Group()), 2600);
    c.beacon(0, 334, 0, 1.2);
    // base building (Foot Town)
    const ftMat = c.facade({ color: '#e7e3da', rough: 0.6 }, { bay: 3, floorH: 4, litProb: 0.8, litGain: 0.7 });
    const ft = c.B(); ft.box(ftMat, 110, 20, 70, 0, 0, 40); ft.done();

    // ---------- Tokyo Skytree ----------
    {
      const SX = 1850, SZ = -1500;
      const sk = c.std({ color: '#e7ecf0', rough: 0.4, metal: 0.5, emissive: '#6fb6ff', night: 0.5 });
      const glass = c.facade({ color: '#9fb4c4', rough: 0.2, metal: 0.6 }, { bay: 2, floorH: 5, wx: [0.05, 0.95], wy: [0.15, 0.95], glassMul: 0.35, litProb: 0.95, litColor: [0.8, 0.9, 1], litGain: 1.0 });
      const s = c.B();
      const r = (y) => 34 * Math.pow(1 - y / 700, 1.9) + 5;
      const N = 12;
      for (let y = 0; y < 495; y += 15) {
        for (let k = 0; k < N; k++) {
          const a0 = k / N * Math.PI * 2 + y * 0.004, a1 = (k + 1) / N * Math.PI * 2 + (y + 15) * 0.004;
          const p0 = new V3(Math.cos(a0) * r(y), y, Math.sin(a0) * r(y)), p1 = new V3(Math.cos(a1) * r(y + 15), y + 15, Math.sin(a1) * r(y + 15));
          const p2 = new V3(Math.cos(a0 + 0.26) * r(y + 15), y + 15, Math.sin(a0 + 0.26) * r(y + 15));
          s.beam(sk, p0, p1, 0.9); s.beam(sk, p0, p2, 1.4);
        }
      }
      s.cyl(sk, 9, 12, 500, 12, 0, 0);
      s.cyl(glass, 21, 18, 14, 24, 0, 340); s.cyl(sk, 22, 22, 2, 24, 0, 354); s.cyl(glass, 16, 16, 12, 24, 0, 356);
      s.cyl(glass, 13, 12, 8, 24, 0, 445); s.cyl(sk, 14, 14, 1.5, 24, 0, 453);
      s.cyl(sk, 3.5, 6, 70, 10, 0, 495); s.cyl(sk, 1.2, 3.5, 70, 8, 0, 565);
      const hiS = s.done(new THREE.Group());
      const l = c.B(); l.cyl(sk, 6, 38, 500, 10, 0, 0); l.cyl(sk, 1.2, 6, 134, 6, 0, 500); l.cyl(glass, 21, 21, 16, 12, 0, 340);
      c.lod(SX, SZ, hiS, l.done(new THREE.Group()), 2400);
      const halo = c.mesh(new THREE.CylinderGeometry(22.5, 22.5, 3, 32, 1, true), c.lamp('#8fd0ff', 3), c.root, false);
      halo.position.set(SX, 348, SZ);
      c.beacon(SX, 635, SZ, 1.4);
      const sb = c.B(); sb.box(ftMat, 240, 24, 90, SX, 0, SZ + 90); sb.done();
    }

    // ---------- Tokyo Metropolitan Government Building (Shinjuku) ----------
    const TX = -1900, TZ = -600;
    {
      const g = c.facade({ color: '#b4b1a9', rough: 0.55, metal: 0.2 }, { bay: 1.8, floorH: 4, wx: [0.3, 0.7], wy: [0.3, 0.8], glassMul: 0.25, litProb: 0.55, litColor: [0.95, 0.95, 1], litGain: 0.6 });
      const t = c.B();
      t.box(g, 110, 150, 38, TX, 0, TZ);
      for (const s of [-1, 1]) {
        const x = TX + s * 30;
        t.box(g, 38, 70, 38, x, 150, TZ);
        t.loft(g, c.prof.chamfer(1, 1, 0.2), [{ y: 220, s: 17, x, z: TZ }, { y: 243, s: 17, x, z: TZ }]);
        t.box(g, 30, 3, 30, x, 243, TZ);
      }
      t.box(g, 60, 36, 30, TX, 150, TZ);
      t.done();
      c.beacon(TX - 30, 247, TZ); c.beacon(TX + 30, 247, TZ);
    }

    // ---------- Shibuya scramble crossing ----------
    const BX = -1100, BZ = 1000;
    {
      const zebra = c.std({ color: '#f2f2f2', rough: 0.7 });
      const z = c.B();
      for (let k = 0; k < 4; k++) {
        const a = k * Math.PI / 2;
        for (let i = -6; i <= 6; i++) z.box(zebra, 1.6, 0.12, 16, BX + Math.cos(a) * 32 + Math.sin(a) * i * 3, 0.3, BZ + Math.sin(a) * 32 - Math.cos(a) * i * 3, 0, a);
      }
      for (const a of [Math.PI / 4, -Math.PI / 4]) for (let i = -14; i <= 14; i++) z.box(zebra, 1.6, 0.12, 12, BX + Math.cos(a) * i * 3, 0.32, BZ + Math.sin(a) * i * 3, 0, -a);
      const asphalt = c.std({ color: '#3a3c40', rough: 0.9 });
      z.box(asphalt, 110, 0.2, 110, BX, 0.1, BZ);
      z.done(c.root, { shadow: false });
      // Shibuya 109 and screen-covered corner buildings
      const s109 = c.facade({ color: '#c9c6c0', rough: 0.4, metal: 0.4 }, { bay: 2.5, floorH: 3.8, litProb: 0.7, litGain: 0.8 });
      const sb = c.B();
      sb.cyl(s109, 16, 16, 58, 20, BX - 90, 0, BZ - 90);
      sb.box(s109, 50, 55, 40, BX + 95, 0, BZ - 85);
      sb.box(s109, 60, 42, 50, BX - 95, 0, BZ + 95);
      sb.box(s109, 45, 80, 45, BX + 95, 0, BZ + 90);
      sb.done();
      const cols = ['#ff3ea5', '#35e0ff', '#ffe23a', '#7a5cff', '#ff6a2a'];
      const screens = cols.map((col) => c.lamp(col, 2.2, 0.35));
      const sc = c.B();
      [[BX + 70, 30, BZ - 85, Math.PI / 2, 30, 18], [BX - 72, 26, BZ + 95, -Math.PI / 2, 36, 16], [BX + 95, 45, BZ + 67, 0, 30, 22], [BX - 90, 40, BZ - 73, 0, 12, 14], [BX + 120, 20, BZ - 85, Math.PI / 2, 20, 12]]
        .forEach(([x, y, zz, ry, w, h], i) => sc.add(screens[i], new THREE.PlaneGeometry(w, h), c.M(x, y, zz, 0, ry, 0)));
      sc.done(c.root, { shadow: false });
      c.onFrame((t) => screens.forEach((m, i) => m.color.offsetHSL(Math.sin(t * 0.7 + i) * 0.002, 0, 0)));
    }

    // ---------- Rainbow Bridge ----------
    c.bridge({
      a: [-150, 1650], b: [700, 2450], deck: 52, towerH: 126, width: 30, type: 'suspension', towers: [0.3, 0.7], cableR: 1.1,
      cableLamp: c.lamp('#fff6e8', 2.8), traffic: 30,
      towerFn: (b, p, ang, H, W) => {
        const w = c.std({ color: '#f2f2ee', rough: 0.4, metal: 0.2 });
        for (const s of [-1, 1]) {
          const q = p.clone().add(new V3(Math.cos(ang), 0, -Math.sin(ang)).multiplyScalar(s * (W / 2 + 3)));
          b.box(w, 7, H + 4, 9, q.x, -4, q.z, 0, ang);
        }
        for (const y of [H * 0.35, H * 0.7, H - 6]) b.box(w, W + 12, 5, 6, p.x, y, p.z, 0, ang);
      },
    });
    const rainbow = ['#ff4d4d', '#ffae3a', '#fff04a', '#5cff7a', '#4ab0ff', '#9a5cff'].map((x) => c.lamp(x, 2.2));
    {
      const rb = c.B(), A = new V3(-150, 55, 1650), Bv = new V3(700, 55, 2450), steps = 60;
      for (let i = 0; i < steps; i++) {
        const p = A.clone().lerp(Bv, i / steps), q = A.clone().lerp(Bv, (i + 0.7) / steps);
        rb.rod(rainbow[Math.floor(i / 10) % 6], p.setY(56.5), q.setY(56.5), 0.5, 4);
      }
      rb.done(c.root, { shadow: false });
    }
    // Shuto expressway on pillars
    c.road([[-3000, 22, -200], [-1900, 22, -330], [-800, 22, -120], [-200, 20, 300], [300, 20, 900], [120, 26, 1500]], { width: 18, pillars: 45, traffic: 40 });
    c.road([[-2300, 20, 2100], [-1500, 20, 1250], [-600, 18, 700], [300, 20, 900], [1200, 20, 700], [2600, 22, 400]], { width: 18, pillars: 45, traffic: 40 });

    // ---------- City: very dense, small plots, low/mid-rise with tall clusters ----------
    const colors = ['#cfcac1', '#b8b6b0', '#9ea3a8', '#e1ddd4', '#8b8f93', '#c2b8a8', '#d7d2c8', '#aab3ba'].map((x) => new THREE.Color(x));
    const clusters = [[TX, TZ, 600, 180], [-800, 1100, 500, 120], [-700, -700, 600, 150], [SXc(), -1500, 500, 90]];
    function SXc() { return 1850; }
    const clear = [[-80, 80, -60, 110], [BX - 130, BX + 130, BZ - 130, BZ + 130], [TX - 90, TX + 90, TZ - 40, TZ + 40], [1850 - 130, 1850 + 130, -1540, -1380], [-700, 100, -1650, -1050]];
    const lots = c.grid({
      R: 4200, bx: 70, bz: 90, sx: 11, sz: 13, angle: 0.18, split: [2, 3], fill: [0.7, 0.95], jitter: 2, rotJitter: 0.06, big: 0.04,
      density: (x, z, d) => 0.98 - 0.25 * smooth(3000, 4200, d),
      exclude: (x, z) => Math.hypot(x, z + 20) < 210 || clear.some(([a, b2, cc, d]) => x > a && x < b2 && z > cc && z < d) || distPoly(x, z, sumida) < 100,
      height: (x, z, d, r, big) => {
        let h = 9 + Math.pow(r, 1.6) * 26;
        for (const [cx, cz, rad, hmax] of clusters) {
          const f = Math.exp(-Math.hypot(x - cx, z - cz) / rad);
          if (hash2(x | 0, z | 0) < 0.16 * f) h += 40 + hash2(z | 0, x | 0) * hmax * f;
        }
        return big ? h * 1.4 + 20 : h;
      },
      color: (r) => colors[Math.floor(r * colors.length)].clone().multiplyScalar(0.9 + (r * 13 % 1) * 0.2),
      decorate: (l, r) => { if (l.h < 30 && r() < 0.3) { l.roof = 'box'; l.rs = 0.5; l.rh = 3; l.rc = new THREE.Color('#9aa0a4'); } },
    });
    const mat = c.facade({ color: 0xffffff, rough: 0.7, metal: 0.15 }, { bay: 2.8, floorH: 3.4, wx: [0.12, 0.88], wy: [0.35, 0.85], glassMul: 0.35, litProb: 0.38, litColor: [0.95, 0.93, 0.88], litGain: 0.55 });
    c.buildings(lots, { mat, roofMats: { box: c.std({ color: '#fff', rough: 0.6, metal: 0.4 }) } });
    // neon signs stuck to low buildings
    {
      const neon = ['#ff3ea5', '#35e0ff', '#ffe23a', '#ff5a3a', '#7dff6a'].map((x) => c.lamp(x, 2.4, 0.25));
      const n = c.B(), r = c.rand;
      let k = 0;
      for (const l of lots) {
        if (l.h > 45 || Math.hypot(l.x - BX, l.z - BZ) > 900 || r() > 0.35 || k++ > 260) continue;
        const ang = l.r, face = new V3(Math.sin(ang), 0, Math.cos(ang));
        n.box(neon[Math.floor(r() * 5)], 1.2, 6 + r() * 8, 3, l.x + face.x * (l.d / 2 + 0.8), 6 + r() * (l.h - 16), l.z + face.z * (l.d / 2 + 0.8), 0, ang + Math.PI / 2);
      }
      n.done(c.root, { shadow: false });
    }
    // parks: Shiba park around the tower, Imperial Palace gardens
    c.trees(c.scatter(160, (r) => { const a = r() * 6.28, d = 90 + r() * 110; return [Math.cos(a) * d, Math.sin(a) * d * 0.8 - 60, 9]; }), { shadow: true });
    c.trees(c.scatter(500, (r) => { const x = -300 + (r() - 0.5) * 700, z = -1350 + (r() - 0.5) * 500; return [x, z, 10]; }), { hue: 0.32 });
    const moat = c.B();
    moat.add(c.std({ color: '#2c4a4a', rough: 0.2 }), new THREE.RingGeometry(330, 360, 32).rotateX(-Math.PI / 2), c.M(-300, 0.3, -1350, 0, 0, 0, 1, 1, 0.7));
    moat.done(c.root, { shadow: false });
  },
});
