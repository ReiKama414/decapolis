CITY.register('chongqing', {
  caption: 'Raffles City · Chaotianmen',
  seed: 2019,
  view: { pos: [1350, 230, -200], target: [-200, 170, 0] },
  shadow: { c: [-700, 0], r: 1700 },
  fog: [650, 6000],
  sun: [0.2, 0.55, 0.8],
  sunI: 2.1,
  hemi: 0.8,
  sky: { day: ['#8aa4bd', '#d4d7d6', '#a0a3a1'], night: ['#05050d', '#2c2238', '#0a080d'] },
  bloom: 0.6,
  build(c) {
    const { THREE, V3, smooth, fbm, distPoly, hash2, lerp } = c;
    const jialing = [[-4600, -950], [-3000, -1000], [-2000, -800], [-1000, -710], [-300, -470], [200, -260], [700, 40]];
    const yangtze = [[-4600, 1650], [-3000, 1150], [-2000, 850], [-1000, 620], [-200, 460], [300, 260], [700, 40], [1500, -220], [3000, -720], [4600, -1000]];
    const JW = 170, YW = 260;
    const bankDist = (x, z) => Math.min(distPoly(x, z, jialing) - JW, distPoly(x, z, yangtze) - YW);
    const height = (x, z) => {
      const b = bankDist(x, z);
      if (b < 0) return -14;
      const ridge = 165 * smooth(30, 750, b) * (0.55 + 0.45 * fbm(x * 0.0011, z * 0.0011));
      const nanshan = 380 * smooth(1200, 2700, z + 0.3 * x) * (0.5 + 0.5 * fbm(x * 0.0008 + 4, z * 0.0008));
      const tip = smooth(-200, 250, x) * smooth(-400, 400, z) * (1 - smooth(-600, -200, z)) * 0;
      return 6 + 14 * smooth(0, 25, b) + ridge + nanshan - tip;
    };
    c.ground({
      height,
      city: (x, z, h) => (h < 300 ? 1 - smooth(3600, 4400, Math.hypot(x + 400, z)) : 0),
      grid: { bx: 62, bz: 70, sx: 10, sz: 11, angle: 0.25, strength: 0.85 },
      colors: { grass: '#4a5f3c', rock: '#35482e', city: '#4a4a4c', bed: '#3a3a30', sand: '#6b6450' },
      lamp: [1, 0.7, 0.35],
    });
    c.water({ color: '#4a5a4a', glitterR: 4000, glitter: [1, 0.7, 0.5] });

    // ---------- Raffles City (Chaotianmen) ----------
    {
      const glass = c.facade({ color: '#9fb2c0', rough: 0.12, metal: 0.8 }, { bay: 2, floorH: 4, wx: [0.04, 0.96], wy: [0.08, 0.96], glassMul: 0.5, glassAdd: [0.03, 0.05, 0.08], litProb: 0.4, litColor: [0.9, 0.95, 1], litGain: 0.6, led: 0.45, ledMin: 50 });
      const e = c.B(), base = height(-150, 0);
      const pod = c.facade({ color: '#b9b6ae', rough: 0.5 }, { bay: 5, floorH: 6, wx: [0.05, 0.95], wy: [0.35, 0.9], litProb: 0.85, litGain: 0.8 });
      e.box(pod, 560, base + 30, 190, -210, 0, 0);
      const tower = (x, z, h, lean, side) => {
        const P = c.prof.chamfer(1, 0.62, 0.3), L = [];
        for (let i = 0; i <= 8; i++) { const t = i / 8, y = base + 30 + t * (h - 30); L.push({ y, s: 27 - t * 3, x: x + lean * t * t * 30, z: z + side * t * t * 22 }); }
        e.loft(glass, P, L);
      };
      [-380, -270, -160, -50].forEach((x) => tower(x, 0, 250, 0.3, 0));
      tower(80, -72, 350, 1, -1); tower(80, 72, 350, 1, 1);
      tower(-500, -80, 250, -0.6, -1); tower(-500, 80, 250, -0.6, 1);
      const crystal = c.std({ color: '#b6cad6', rough: 0.05, metal: 0.8, emissive: '#bfe4ff', night: 1.4 });
      const cy = base + 250;
      e.loft(crystal, c.prof.chamfer(1, 0.14, 0.12), [{ y: cy, s: 170, x: -215, z: 0 }, { y: cy + 18, s: 175, x: -215, z: 0 }, { y: cy + 28, sx: 165, sz: 150, x: -215, z: 0 }]);
      e.done();
      c.beacon(80 + 30, base + 352, -94); c.beacon(80 + 30, base + 352, 94);
      // Chaotianmen square stepping down to the confluence
      const sq = c.B(), stone = c.std({ color: '#a39d8f', rough: 0.85 });
      for (let i = 0; i < 6; i++) sq.box(stone, 60 - i * 5, 5, 150 - i * 12, 110 + i * 30, base - 5 - i * 5 - 2, 0);
      sq.done();
    }

    // ---------- Hongyadong stilted houses on the Jialing cliff ----------
    {
      const HX = -1120, bankZ = -710 + JW + 5;
      const warm = c.facade({ color: '#6b4a34', rough: 0.8 }, { bay: 3, floorH: 3.4, wx: [0.1, 0.9], wy: [0.25, 0.9], glassMul: 0.5, glassAdd: [0.05, 0.03, 0.01], litProb: 0.95, litColor: [1, 0.72, 0.32], litGain: 1.6 });
      const tile = c.std({ color: '#2f3033', rough: 0.7, flat: true, emissive: '#ffb347', night: 0.25 });
      const pillar = c.std({ color: '#5a3a28', rough: 0.8 });
      const e = c.B(), top = height(HX, bankZ + 90);
      for (let i = 0; i < 6; i++) {
        const y0 = i * 11 - 2, depth = 26, zc = bankZ + 8 + i * 11 + depth / 2, len = 420 - i * 30;
        if (i === 0) for (let x = -len / 2; x <= len / 2; x += 24) e.cyl(pillar, 1.2, 1.2, 12, 6, HX + x, -12, bankZ + 6);
        e.box(warm, len, 9, depth, HX, y0, zc);
        e.loft(tile, c.prof.rect(1, 1), [{ y: y0 + 9, sx: len / 2 + 4, sz: depth / 2 + 5, x: HX, z: zc - 6 }, { y: y0 + 9.6, sx: len / 2 + 3.5, sz: depth / 2 + 4, x: HX, z: zc - 6 }, { y: y0 + 11, sx: len / 2 - 2, sz: 2, x: HX, z: zc - 6 }]);
      }
      for (let k = -3; k <= 3; k++) {
        const x = HX + k * 55, y = 66;
        e.box(warm, 26, 12, 22, x, y - 2, bankZ + 60);
        e.loft(tile, c.prof.rect(1, 1), [{ y: y + 10, sx: 17, sz: 15, x, z: bankZ + 71 }, { y: y + 16, sx: 8, sz: 1.5, x, z: bankZ + 71 }]);
      }
      e.done();
      const lanterns = c.lamp('#ff3b2a', 3, 0.5), lg = c.B();
      for (let i = 0; i < 6; i++) for (let x = -190 + i * 14; x < 190 - i * 14; x += 16) lg.sphere(lanterns, 0.9, HX + x, i * 11 + 7.5, bankZ + 6 + i * 11, 1.2, 8, 6);
      lg.done(c.root, { shadow: false });
      if (top > 0) c.bridge({ a: [HX + 180, bankZ + 70], b: [HX + 220, -710 - JW - 60], type: 'stayed', deck: top - 4, towerH: top + 150, towers: [0.72], width: 26, reach: 0.34, stays: 14, cableLamp: c.lamp('#ffe0b0', 2.5), towerMat: c.std({ color: '#c9d1d6', rough: 0.4, metal: 0.4, emissive: '#dfefff', night: 0.6 }), traffic: 24 });
    }

    // ---------- Jiefangbei monument & CBD ----------
    const JX = -900, JZ = 30;
    {
      const y = height(JX, JZ) - 1, e = c.B();
      const m = c.std({ color: '#e9e3d6', rough: 0.6, emissive: '#fff2d6', night: 0.5 });
      e.cyl(m, 5.5, 6.5, 3, 8, JX, y, JZ); e.cyl(m, 3.6, 3.6, 20, 8, JX, y + 3, JZ); e.cyl(m, 4.2, 4.2, 4, 8, JX, y + 23, JZ); e.cone(m, 4.3, 5, 8, JX, y + 27, JZ);
      e.cyl(c.std({ color: '#8e8a84', rough: 0.9 }), 60, 60, 1, 24, JX, y - 0.5, JZ);
      e.done();
      const clk = c.mesh(new THREE.CylinderGeometry(3.7, 3.7, 2.5, 8, 1, true), c.lamp('#fff2c8', 2, 0.6), c.root, false); clk.position.set(JX, y + 24.5, JZ);
    }

    // ---------- Liziba: the monorail runs through a residential tower ----------
    const trackPts = [];
    for (let x = -4200; x <= -600; x += 200) {
      const z = riverZ(jialing, x) + JW + 55 + 25 * Math.sin(x * 0.003);
      trackPts.push([x, Math.max(height(x, z), 12) + 22, z]);
    }
    function riverZ(line, x) { for (let i = 0; i < line.length - 1; i++) { const [ax, az] = line[i], [bx, bz] = line[i + 1]; if (x >= ax && x <= bx) return lerp(az, bz, (x - ax) / (bx - ax)); } return line.at(-1)[1]; }
    const track = c.road(trackPts, { width: 5, pillars: 36, pillarR: 1.4, lamps: false, mat: c.std({ color: '#b7b9b5', rough: 0.6 }) });
    {
      const u = 0.35, p = track.getPointAt(u), t = track.getTangentAt(u), ang = Math.atan2(t.x, t.z);
      const g = c.group(p.x, 0, p.z, ang), gy = height(p.x, p.z) - 3, rel = p.y - gy;
      const slab = c.facade({ color: '#d7d3c9', rough: 0.8 }, { bay: 3.2, floorH: 3, litProb: 0.5, litGain: 0.7 });
      const e = c.B();
      e.box(slab, 60, rel - 5, 16, 0, gy, 0);
      e.box(slab, 60, 62 - rel, 16, 0, p.y + 6, 0);
      for (const s of [-1, 1]) e.box(slab, 22, 11, 16, s * 19, p.y - 5, 0);
      e.done(g);
    }
    {
      const tm = c.std({ color: '#e5e7e4', rough: 0.4, metal: 0.3, emissive: '#cde7ff', night: 0.9 }), band = c.std({ color: '#d0332a', rough: 0.5 });
      const e = c.B(); for (let i = 0; i < 4; i++) { e.box(tm, 3, 3.6, 14, 0, 0.8, i * 15 - 22); e.box(band, 3.05, 0.8, 14, 0, 2, i * 15 - 22); }
      const train = e.done(c.group(), { shadow: false });
      const p = new V3(), tan = new V3();
      c.onFrame((t) => { const u = (t * 0.018) % 1; track.getPointAt(u, p); track.getTangentAt(u, tan); train.position.copy(p); train.rotation.y = Math.atan2(tan.x, tan.z); });
    }

    // ---------- Yangtze River Cableway ----------
    {
      const a = new V3(-700, 0, 330), b = new V3(-640, 0, 960);
      a.y = height(a.x, a.z) + 18; b.y = height(b.x, b.z) + 22;
      const st = c.std({ color: '#b8b2a6', rough: 0.8 });
      const e = c.B();
      e.box(st, 24, a.y - height(a.x, a.z) + 6, 18, a.x, height(a.x, a.z), a.z - 8);
      e.box(st, 24, b.y - height(b.x, b.z) + 6, 18, b.x, height(b.x, b.z), b.z + 8);
      const cable = (s) => { const pts = []; for (let i = 0; i <= 30; i++) { const t = i / 30; pts.push(a.clone().lerp(b, t).add(new V3(s, -40 * Math.sin(Math.PI * t), 0))); } return pts; };
      const cm = c.std({ color: '#333', rough: 0.6 });
      e.chain(cm, cable(-3), 0.25, 3); e.chain(cm, cable(3), 0.25, 3);
      e.done();
      const cabs = [-3, 3].map((s) => { const m = c.B(); m.box(c.std({ color: '#c8302a', rough: 0.5, emissive: '#ff6a4a', night: 0.8 }), 4, 3.5, 6, 0, -5, 0); m.box(cm, 0.3, 4, 0.3, 0, -1.5, 0); return { g: m.done(c.group(), { shadow: false }), s }; });
      c.onFrame((t) => cabs.forEach(({ g, s }, i) => {
        const k = (Math.sin(t * 0.08 + i * Math.PI) + 1) / 2;
        g.position.copy(a).lerp(b, k).add(new V3(s, -40 * Math.sin(Math.PI * k), 0));
        g.rotation.y = Math.atan2(b.x - a.x, b.z - a.z);
      }));
    }

    // ---------- Bridges across both rivers ----------
    const lampB = c.lamp('#fff0cf', 2.6);
    c.bridge({ a: [1060, -420], b: [1180, 300], type: 'arch', deck: 40, towerH: 150, span: [0.12, 0.88], width: 32, archR: 3, cableLamp: c.lamp('#ffd27a', 2.6), towerMat: c.std({ color: '#8c9aa6', rough: 0.4, metal: 0.6 }), traffic: 30 });
    c.bridge({ a: [-240, 150], b: [-170, 780], type: 'stayed', deck: 46, towerH: 170, towers: [0.3, 0.7], width: 30, reach: 0.18, stays: 10, cableLamp: lampB, towerMat: c.std({ color: '#d9dcd6', rough: 0.4 }), traffic: 30 });
    c.bridge({ a: [-2400, -760], b: [-2420, -1170], type: 'arch', deck: 40, towerH: 110, width: 28, cableLamp: c.lamp('#9fd3ff', 2.4), traffic: 20 });
    c.bridge({ a: [-2350, 700], b: [-2300, 1250], type: 'suspension', deck: 45, towerH: 150, width: 28, cableLamp: lampB, traffic: 24 });

    // ---------- Elevated riverside roads and a spiral interchange ----------
    for (const [line, off, s] of [[jialing, JW + 18, 1], [yangtze, YW + 18, -1]]) {
      const pts = [];
      for (let i = 0; i < line.length; i++) {
        const [x, z] = line[i], [nx0, nz0] = line[Math.min(i + 1, line.length - 1)], [px, pz] = line[Math.max(i - 1, 0)];
        const tx = nx0 - px, tz = nz0 - pz, L = Math.hypot(tx, tz), wx = x - tz / L * off * s, wz = z + tx / L * off * s;
        if (wx > 200) continue;
        pts.push([wx, 18 + (i % 2) * 4, wz]);
      }
      c.road(pts, { width: 22, pillars: 40, traffic: 50 });
    }
    {
      const cx = -1750, cz = 340, gy = height(cx, cz), pts = [];
      for (let i = 0; i <= 60; i++) { const a = i / 60 * Math.PI * 2 * 2.5; pts.push([cx + Math.cos(a) * 90, gy + 4 + i * 0.8, cz + Math.sin(a) * 90]); }
      c.road(pts, { width: 14, pillars: 30, traffic: 16, step: 6 });
      c.road([[cx + 90, gy + 52, cz], [cx + 400, gy + 50, cz - 150], [cx + 900, height(cx + 900, cz - 300) + 30, cz - 300]], { width: 16, pillars: 35, traffic: 14 });
    }

    // ---------- Mountain city: dense towers on slopes ----------
    const cols = ['#c9c6bf', '#b3b5b4', '#d7d0c2', '#9fa5aa', '#e0ddd5', '#a9a296', '#8d9499'].map((x) => new THREE.Color(x));
    const avoid = (x, z) => (x > -620 && x < 220 && Math.abs(z) < 130) || Math.hypot(x - JX, z - JZ) < 70 || (x > -1360 && x < -880 && z < -440 && z > -640) ||
      distPoly(x, z, trackPts.map(([a, , b]) => [a, b])) < 16 || Math.hypot(x + 1750, z - 340) < 120 || Math.hypot(x + 700, z - 330) < 30 || Math.hypot(x + 640, z - 960) < 30;
    const lots = c.grid({
      R: 4400, cx: -500, bx: 62, bz: 70, sx: 10, sz: 11, angle: 0.25, split: [2, 2], fill: [0.5, 0.75], jitter: 5, rotJitter: 0.25, big: 0.03, maxSlope: 48,
      exclude: (x, z) => avoid(x, z) || bankDist(x, z) < 22 || height(x, z) > 330,
      density: (x, z, d) => 0.95 - 0.45 * smooth(2800, 4400, d),
      height: (x, z, d, r, big) => {
        const cbd = Math.exp(-Math.hypot(x - JX, z - JZ) / 380) + Math.exp(-Math.hypot(x - 300, z + 800) / 420) + 0.6 * Math.exp(-Math.hypot(x + 300, z - 1100) / 400);
        let h = 45 + r * 70;
        if (hash2(x | 0, z | 0) < 0.3 * cbd + 0.04) h += 60 + hash2(z | 0, x | 0) * 200 * Math.min(1, cbd + 0.3);
        return big ? h * 1.1 : h;
      },
      color: (r) => cols[Math.floor(r * 37) % cols.length].clone(),
      decorate: (l) => { l.w = Math.min(l.w, 30); l.d = Math.min(l.d, 34); },
    });
    const mat = c.facade({ color: 0xffffff, rough: 0.7, metal: 0.2 }, { bay: 2.3, floorH: 3, wx: [0.15, 0.85], wy: [0.3, 0.85], glassMul: 0.35, litProb: 0.5, litColor: [1, 0.85, 0.62], litGain: 0.65 });
    const ledMat = c.facade({ color: 0xffffff, rough: 0.4, metal: 0.4 }, { bay: 2.3, floorH: 3.2, wx: [0.1, 0.9], wy: [0.2, 0.9], glassMul: 0.45, litProb: 0.45, litColor: [0.9, 0.93, 1], litGain: 0.6, led: 0.4, ledMin: 40 });
    c.buildings(lots.filter((l) => l.h < 140), { mat });
    c.buildings(lots.filter((l) => l.h >= 140), { mat: ledMat });
    c.trees(c.scatter(1600, (r) => { const x = (r() - 0.5) * 9000, z = (r() - 0.5) * 9000, h = height(x, z); return h > 120 && (h > 300 || r() < 0.3) ? [x, z, 14] : null; }), { hue: 0.29 });
  },
});
