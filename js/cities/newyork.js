CITY.register('newyork', {
  caption: 'Empire State Building · 443 m',
  seed: 1931,
  view: { pos: [1050, 330, 150], target: [0, 220, 0] },
  shadow: { c: [0, -300], r: 1600 },
  fog: [900, 8500],
  sun: [0.35, 0.55, -0.75],
  sky: { day: ['#3b78c4', '#d6e2ec', '#98a2ab'], night: ['#02030a', '#1a1e36', '#06070c'] },
  maxDist: 5500,
  build(c) {
    const { THREE, V3, smooth, clamp, hash2 } = c;
    // Manhattan frame: u across the island, v along it (north = +v)
    const TH = 0.5, ct = Math.cos(TH), st = Math.sin(TH);
    const W = (u, v) => [u * ct + v * st, u * st - v * ct];
    const L = (x, z) => [x * ct + z * st, x * st - z * ct];
    const halfW = (v) => 650 * Math.sqrt(clamp((v + 2900) / 900, 0, 1));
    const park = (u, v) => Math.abs(u) < 260 && v > 1500 && v < 3500;
    const reservoir = (u, v) => ((u) / 180) ** 2 + ((v - 2900) / 220) ** 2 < 1;
    const LIB = [-1350, -4250];
    const land = (x, z) => {
      const [u, v] = L(x, z);
      const man = halfW(v) - Math.abs(u);
      const bk = u - 1030 + 60 * Math.sin(v * 0.002);
      const nj = -1500 - u + 50 * Math.sin(v * 0.0017);
      const lib = 90 - Math.hypot(u - LIB[0], v - LIB[1]);
      return Math.max(man, bk, nj, lib);
    };
    const height = (x, z) => {
      const s = land(x, z), [u, v] = L(x, z);
      if (reservoir(u, v)) return -6;
      const base = s > 0 ? 0 : -14;
      return base + smooth(-40, 0, s) * 0 + (s > 0 && park(u, v) ? 3 * Math.sin(u * 0.03) * Math.sin(v * 0.02) + 2 : 0);
    };
    c.ground({
      height,
      city: (x, z, h) => { const [u, v] = L(x, z); return park(u, v) ? 0 : 1 - smooth(4500, 5500, Math.hypot(x, z)); },
      grid: { bx: 240, bz: 80, sx: 30, sz: 18, angle: -TH },
    });
    c.water({ color: '#2a3f4c', glitterR: 4000, cz: -1000 });

    // ---------- Empire State Building ----------
    const lime = c.facade({ color: '#c9c2b2', rough: 0.6, metal: 0.1 }, { bay: 1.9, floorH: 3.8, wx: [0.35, 0.8], wy: [0.25, 0.85], glassMul: 0.3, litProb: 0.45, litGain: 0.6 });
    const crownMat = c.std({ color: '#d8d2c2', rough: 0.4, metal: 0.3, emissive: '#ffe7b0', night: 1.6 });
    const steel = c.std({ color: '#c9cdd0', rough: 0.3, metal: 0.9 });
    {
      const g = c.group(0, 0, 0, -TH), e = c.B();
      e.box(lime, 130, 25, 60);
      e.box(lime, 100, 55, 50, 0, 25); e.box(lime, 80, 40, 42, 0, 80);
      e.box(lime, 58, 200, 36, 0, 120);
      e.box(lime, 46, 12, 30, 0, 320); e.box(crownMat, 36, 10, 24, 0, 332); e.box(crownMat, 28, 8, 20, 0, 342);
      e.cyl(crownMat, 8, 10, 12, 8, 0, 350); e.cyl(crownMat, 5, 8, 12, 8, 0, 362); e.cone(crownMat, 5, 8, 8, 0, 374);
      e.cyl(steel, 0.4, 1.4, 60, 6, 0, 382);
      e.done(g);
      c.beacon(0, 443, 0, 1.0);
    }
    // ---------- Chrysler Building ----------
    {
      const [x, z] = W(330, 520), g = c.group(x, 0, z, -TH), e = c.B();
      const chr = c.std({ color: '#d7dadc', rough: 0.2, metal: 0.95, emissive: '#fff4d8', night: 1.3 });
      e.box(lime, 60, 60, 60); e.box(lime, 46, 180, 46, 0, 60);
      for (let i = 0; i < 7; i++) {
        const r = 22 - i * 3.1, y = 240 + i * 8;
        e.box(chr, r * 2, 8, r * 2, 0, y);
        for (let k = 0; k < 4; k++) e.add(chr, new THREE.CylinderGeometry(r, r, 1.2, 16, 1, false, -Math.PI / 2, Math.PI).rotateX(-Math.PI / 2), c.M(0, y + 8, 0, 0, k * Math.PI / 2).multiply(c.M(0, 0, r)));
      }
      e.cyl(chr, 0.3, 2.5, 36, 8, 0, 296);
      e.done(g);
    }
    // ---------- Billionaires' Row pencil towers along the park ----------
    const glassDark = c.facade({ color: '#6f7b86', rough: 0.2, metal: 0.7 }, { bay: 3, floorH: 4.5, wx: [0.05, 0.95], wy: [0.1, 0.95], glassMul: 0.45, litProb: 0.3, litColor: [0.9, 0.9, 1], litGain: 0.5 });
    {
      const e = c.B();
      for (const [u, v, w, h] of [[-120, 1420, 22, 470], [60, 1380, 18, 425], [180, 1440, 20, 435], [-200, 1330, 26, 330]]) {
        const [x, z] = W(u, v);
        e.add(glassDark, new THREE.BoxGeometry(w, h, w).translate(0, h / 2, 0), c.M(x, 0, z, 0, -TH));
        c.beacon(x, h + 1, z, 0.7);
      }
      e.done();
    }
    // ---------- One World Trade Center ----------
    {
      const [x, z] = W(-300, -2450), g = c.group(x, 0, z, -TH), e = c.B();
      const glass = c.facade({ color: '#8fa5b8', rough: 0.12, metal: 0.8 }, { bay: 2, floorH: 4, wx: [0.04, 0.96], wy: [0.08, 0.96], glassMul: 0.5, glassAdd: [0.03, 0.06, 0.1], litProb: 0.3, litColor: [0.85, 0.92, 1], litGain: 0.6 });
      const sq = [], rot = [];
      for (let k = 0; k < 8; k++) {
        const a = k / 8 * Math.PI * 2 + Math.PI / 4;
        const r1 = k % 2 === 0 ? Math.SQRT2 : 1; sq.push([Math.cos(a) * r1, Math.sin(a) * r1]);
        const a2 = k / 8 * Math.PI * 2, r2 = k % 2 === 0 ? Math.SQRT2 * 0.72 : 0.72; rot.push([Math.cos(a2) * r2, Math.sin(a2) * r2]);
      }
      e.box(glass, 61, 57, 61);
      e.loft(glass, sq, [{ y: 57, s: 30.5, p: sq }, { y: 417, s: 30.5, p: rot }]);
      e.cyl(steel, 9, 11, 8, 12, 0, 417);
      e.cyl(steel, 1.2, 2.2, 116, 8, 0, 425);
      e.done(g);
      c.beacon(x, 542, z, 1.2);
      const sp = c.mesh(new THREE.CylinderGeometry(1.5, 1.5, 116, 8, 1, true), c.lamp('#eaf4ff', 2.5), g, false); sp.position.y = 483;
    }

    // ---------- Statue of Liberty ----------
    {
      const [x, z] = W(LIB[0], LIB[1]), g = c.group(x, 0, z, -TH + 2.4), e = c.B();
      const granite = c.std({ color: '#b7ae9e', rough: 0.8, emissive: '#ffe3b0', night: 0.25 });
      const copper = c.std({ color: '#6fae98', rough: 0.55, metal: 0.35, emissive: '#9fffe0', night: 0.35 });
      const star = []; for (let k = 0; k < 22; k++) { const a = k / 22 * Math.PI * 2, r = k % 2 ? 42 : 62; star.push([Math.cos(a) * r, Math.sin(a) * r]); }
      e.loft(granite, star, [{ y: 0, s: 1 }, { y: 9, s: 1 }]);
      e.loft(granite, c.prof.rect(1, 1), [{ y: 9, s: 20 }, { y: 20, s: 16 }, { y: 38, s: 13 }, { y: 40, s: 15 }, { y: 47, s: 12 }]);
      e.add(copper, new THREE.LatheGeometry([[7.5, 0], [8, 6], [6.8, 16], [5.4, 26], [5.2, 30], [3.2, 34], [2.2, 35.5]].map(([r, y]) => new THREE.Vector2(r, y)), 14), c.M(0, 47, 0));
      e.sphere(copper, 2.8, 0, 85, 0, 1.15, 10, 8, Math.PI);
      for (let k = 0; k < 7; k++) { const a = -Math.PI / 2 + (k - 3) * 0.33; e.add(copper, new THREE.ConeGeometry(0.45, 4, 4).translate(0, 2, 0), c.M(Math.sin(a) * 2.7, 86.5, Math.cos(a) * 2.7, Math.cos(a) * 0.9, 0, -Math.sin(a) * 0.9)); }
      e.beam(copper, new V3(4.5, 79, 0), new V3(6, 99, 0.5), 2.2);
      e.cyl(copper, 1.6, 0.8, 3, 8, 6, 99, 0.5);
      e.beam(copper, new V3(-4.5, 76, 0), new V3(-5, 70, 2.5), 2);
      e.box(copper, 1.2, 6.5, 4, -5.2, 68, 3.2, 0.3, 0, 0);
      e.done(g);
      const flame = c.mesh(new THREE.ConeGeometry(1.4, 3.6, 8).translate(0, 1.8, 0), c.lamp('#ffc54a', 4, 0.6), g, false);
      flame.position.set(6, 102, 0.5);
      c.trees(c.scatter(40, (r) => { const a = r() * 6.28, d = 70 + r() * 15; return [x + Math.cos(a) * d, z + Math.sin(a) * d, 6]; }));
    }

    // ---------- Brooklyn Bridge ----------
    {
      const [ax, az] = W(560, -2330), [bx, bz] = W(1150, -2520);
      const stone = c.std({ color: '#b4a58b', rough: 0.85, emissive: '#ffdcaa', night: 0.3 });
      c.bridge({
        a: [ax, az], b: [bx, bz], deck: 40, towerH: 84, width: 26, towers: [0.24, 0.76], cableR: 0.9, piers: 60,
        cableLamp: c.lamp('#fff3d6', 2.2), cableMat: c.std({ color: '#8c8f8f', rough: 0.5, metal: 0.6 }),
        towerFn: (b, p, ang, H, Wd) => {
          const lat = new V3(Math.cos(ang), 0, -Math.sin(ang));
          for (const s of [-1, 0, 1]) { const q = p.clone().addScaledVector(lat, s * 14); b.box(stone, s ? 9 : 7, H + 14, 22, q.x, -14, q.z, 0, ang); }
          b.box(stone, 38, 14, 22, p.x, H - 16, p.z, 0, ang);
          for (const s of [-1, 1]) {
            const q = p.clone().addScaledVector(lat, s * 7);
            b.add(stone, new THREE.ConeGeometry(4.3, 9, 4).rotateY(Math.PI / 4).translate(0, 4.5, 0), c.M(q.x, H - 25, q.z, 0, ang, 0, 1, 1, 2.4));
          }
          b.box(stone, 40, 3, 24, p.x, H - 2, p.z, 0, ang);
        },
      });
    }

    // ---------- Central Park ----------
    {
      const pts = c.scatter(1600, (r) => { const u = (r() - 0.5) * 510, v = 1510 + r() * 1980; if (reservoir(u, v)) return null; const [x, z] = W(u, v); return [x, z, 9]; });
      c.trees(pts, { hue: 0.29 });
    }

    // ---------- City ----------
    const brick = ['#8a5a44', '#9b6b52', '#7a4e3d', '#a57b5f', '#6d4f45'].map((x) => new THREE.Color(x));
    const stoneC = ['#c7bca8', '#b3aa9a', '#d6cfc0', '#9ea3a6', '#8a9096', '#bdb4a2', '#707a84'].map((x) => new THREE.Color(x));
    const clearL = (u, v) => (Math.abs(u) < 90 && Math.abs(v) < 50) || (Math.abs(u - 330) < 45 && Math.abs(v - 520) < 45) || (Math.abs(u + 300) < 60 && Math.abs(v + 2450) < 60) || park(u, v);
    const manLots = c.grid({
      R: 5200, bx: 240, bz: 80, sx: 30, sz: 18, angle: -TH, split: [4, 1], fill: [0.75, 0.95], jitter: 1, big: 0.05,
      exclude: (x, z) => { const [u, v] = L(x, z); return Math.abs(u) > halfW(v) - 32 || clearL(u, v) || (v > 1300 && v < 1480 && Math.abs(u) < 260); },
      height: (x, z, d, r, big) => {
        const [u, v] = L(x, z);
        const mid = Math.exp(-((v - 1000) ** 2) / (2 * 650 ** 2)) * (1 - 0.8 * Math.exp(-(u * u + v * v) / (2 * 260 ** 2))), dt = Math.exp(-((v + 2300) ** 2) / (2 * 450 ** 2));
        const f = Math.max(mid, dt);
        let h = 22 + Math.pow(r, 1.5) * 45 + 90 * f * Math.pow(hash2(x | 0, z | 0), 2);
        if (hash2(z | 0, x | 0) < 0.3 * f) h += 80 + hash2(x | 0, 7) * 200 * f;
        return big ? h * 1.25 : h;
      },
      color: (r, x, z, h) => (h < 45 && r < 0.45 ? brick[Math.floor(r * 11) % brick.length] : stoneC[Math.floor(r * 17) % stoneC.length]).clone(),
      decorate: (l, r) => {
        if (l.h > 150) { l.shape = r() < 0.5 ? 'box' : 'taper'; l.c = new THREE.Color(r() < 0.5 ? '#7d8994' : '#a9b3ba'); }
        else if (l.h < 110 && r() < 0.45) l.roof = 'tank';
      },
    });
    const outLots = c.grid({
      R: 5200, bx: 240, bz: 80, sx: 30, sz: 18, angle: -TH, split: [5, 1], fill: [0.8, 0.95], jitter: 1,
      exclude: (x, z) => { const [u, v] = L(x, z); return Math.abs(u) < halfW(v) + 200 || Math.hypot(u - LIB[0], v - LIB[1]) < 200; },
      density: (x, z, d) => 0.9 - 0.4 * smooth(3000, 5200, d),
      height: (x, z, d, r) => {
        const [u, v] = L(x, z);
        const cl = Math.exp(-Math.hypot(u - 1400, v + 2300) / 400) + Math.exp(-Math.hypot(u + 1750, v + 2000) / 450) + Math.exp(-Math.hypot(u - 1350, v - 900) / 300);
        let h = 11 + r * 14;
        if (hash2(x | 0, z | 0) < 0.35 * cl) h += 60 + hash2(z | 0, x | 0) * 170 * cl;
        return h;
      },
      color: (r, x, z, h) => (h < 40 ? brick[Math.floor(r * 13) % brick.length] : stoneC[Math.floor(r * 7) % stoneC.length]).clone(),
      decorate: (l, r) => { if (l.h < 30 && r() < 0.15) l.roof = 'tank'; },
    });
    const mat = c.facade({ color: 0xffffff, rough: 0.7, metal: 0.12 }, { bay: 2.6, floorH: 3.6, wx: [0.25, 0.75], wy: [0.3, 0.85], glassMul: 0.3, litProb: 0.34, litColor: [1, 0.82, 0.58], litGain: 0.6 });
    const tank = c.std({ color: '#6d4b35', rough: 0.9 });
    c.buildings([...manLots, ...outLots], { mat, roofMats: { tank } });
    // FDR Drive / West Side Highway
    for (const s of [-1, 1]) {
      const pts = []; for (let v = -2700; v <= 4600; v += 400) { const u = s * (halfW(v) - 12); const [x, z] = W(u, v); pts.push([x, s > 0 ? 9 : null, z]); }
      c.road(pts, { width: 18, pillars: s > 0 ? 40 : 0, traffic: 50 });
    }
  },
});
