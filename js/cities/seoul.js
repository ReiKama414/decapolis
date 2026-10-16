CITY.register('seoul', {
  caption: 'Lotte World Tower · 555 m',
  seed: 82,
  view: { pos: [650, 260, -1450], target: [0, 250, 0] },
  shadow: { c: [-900, -900], r: 1800 },
  fog: [800, 7500],
  sun: [0.35, 0.55, 0.75],
  sky: { day: ['#4a86cf', '#dde5ea', '#a2aaae'], night: ['#03040c', '#1c2140', '#07080e'] },
  maxDist: 6000,
  build(c) {
    const { THREE, V3, smooth, fbm, distPoly, hash2, lerp } = c;
    const han = [[-5200, -500], [-3600, -950], [-2400, -1150], [-1300, -1000], [-300, -850], [700, -1050], [1700, -900], [3000, -500], [5000, -700]];
    const HW = 330;
    const YEOUIDO = [-3500, -1000];
    const onYeouido = (x, z) => ((x - YEOUIDO[0]) / 420) ** 2 + ((z - YEOUIDO[1]) / 130) ** 2 < 1;
    const NAM = [-2400, -2300], PAL = [-3000, -3600], DDP = [-1500, -2700];
    const height = (x, z) => {
      if (distPoly(x, z, han) < HW && !onYeouido(x, z)) return -12;
      const nam = 230 * Math.exp(-(((x - NAM[0]) / 420) ** 2) - (((z - NAM[1]) / 330) ** 2));
      const bukak = 330 * Math.exp(-(((x - PAL[0]) / 700) ** 2) - (((z - PAL[1] + 900) / 400) ** 2));
      const ring = smooth(3600, 5600, Math.hypot(x + 800, z + 1300)) * (250 + 600 * fbm(x * 0.0006, z * 0.0006 + 7));
      const seokchon = Math.hypot(x - 300, z - 60) < 110 || Math.hypot(x - 520, z - 70) < 90 ? -14 : 0;
      return Math.max(nam, bukak, ring) + seokchon;
    };
    c.ground({
      height,
      city: (x, z, h) => (h < 40 ? 1 - smooth(4200, 5200, Math.hypot(x + 800, z + 1300)) : 0),
      grid: { bx: 130, bz: 130, sx: 26, sz: 26, angle: 0.12, strength: 0.8 },
      colors: { grass: '#4b6a3c', rock: '#3b5232' },
    });
    c.water({ color: '#2d4c58', glitterR: 4200, cx: -1000, cz: -1000 });

    // ---------- Lotte World Tower ----------
    {
      const glass = c.facade({ color: '#cfd8de', rough: 0.12, metal: 0.75 }, { bay: 1.8, floorH: 4.2, wx: [0.04, 0.96], wy: [0.08, 0.96], glassMul: 0.6, glassAdd: [0.04, 0.06, 0.08], litProb: 0.35, litColor: [0.92, 0.96, 1], litGain: 0.6 });
      const P = [];
      for (let i = 0; i < 48; i++) {
        const a = i / 48 * Math.PI * 2, cs = Math.cos(a), sn = Math.sin(a);
        let r = 1 / Math.pow(Math.pow(Math.abs(cs), 5) + Math.pow(Math.abs(sn), 5), 1 / 5);
        const seam = Math.min(...[0, 0.5, 1, 1.5, 2].map((k) => Math.abs(a - k * Math.PI)));
        if (seam < 0.07) r *= 0.94;
        P.push([cs * r, sn * r]);
      }
      const L = []; for (let i = 0; i <= 16; i++) { const y = i / 16 * 500; L.push({ y, s: 42 * Math.pow(1 - y / 640, 1.05) }); }
      const e = c.B();
      e.loft(glass, P, L);
      const crown = c.std({ color: '#e9eef0', rough: 0.3, metal: 0.7, emissive: '#eaf4ff', night: 1.4 });
      const sTop = L.at(-1).s;
      for (let k = 0; k < 16; k++) {
        const a = k / 16 * Math.PI * 2;
        e.beam(crown, new V3(Math.cos(a) * sTop, 500, Math.sin(a) * sTop), new V3(Math.cos(a + 0.6) * 1.2, 555, Math.sin(a + 0.6) * 1.2), 0.9);
        e.beam(crown, new V3(Math.cos(a) * sTop, 500, Math.sin(a) * sTop), new V3(Math.cos(a - 0.6) * 1.2, 555, Math.sin(a - 0.6) * 1.2), 0.9);
      }
      e.cyl(crown, 1, 1, 2, 8, 0, 554);
      const pod = c.facade({ color: '#d6d3cb', rough: 0.5 }, { bay: 5, floorH: 6, wx: [0.05, 0.95], wy: [0.3, 0.9], litProb: 0.85, litGain: 0.8 });
      e.box(pod, 240, 36, 130, 60, 0, 130);
      e.done();
      const seam = c.lamp('#ffffff', 2.2, 0), sg = c.B();
      for (let k = 0; k < 4; k++) { const a = k * Math.PI / 2; const pts = L.map((l) => new V3(Math.cos(a) * l.s * 0.96, l.y, Math.sin(a) * l.s * 0.96)); sg.chain(seam, pts, 0.5, 4); }
      sg.done(c.root, { shadow: false });
      c.beacon(0, 556, 0, 1.3);
    }

    // ---------- N Seoul Tower on Namsan ----------
    {
      const [x, z] = NAM, y = height(x, z) - 4, e = c.B();
      const conc = c.std({ color: '#e4e2dc', rough: 0.6 });
      e.box(c.facade({ color: '#cfccc4', rough: 0.6 }, { bay: 3, floorH: 4, litProb: 0.8 }), 40, 14, 30, x, y, z);
      e.cyl(conc, 5.5, 7, 130, 16, x, y, z);
      e.cyl(conc, 15, 11, 10, 24, x, y + 128, z); e.cyl(c.facade({ color: '#b9c3c8', rough: 0.2, metal: 0.5 }, { bay: 2, floorH: 3.5, litProb: 1, litGain: 0.9 }), 15, 15, 9, 24, x, y + 138, z); e.cyl(conc, 11, 15, 5, 24, x, y + 147, z);
      for (let i = 0; i < 8; i++) e.cyl(c.std({ color: i % 2 ? '#e8e8e8' : '#d0342c', rough: 0.5 }), 2.4 - i * 0.2, 2.6 - i * 0.2, 11, 8, x, y + 152 + i * 11, z);
      e.done();
      const ringLed = c.lamp('#ff5ad7', 2.6);
      for (let i = 0; i < 3; i++) { const r = c.mesh(new THREE.CylinderGeometry(3.2 - i * 0.3, 3.2 - i * 0.3, 2.5, 12, 1, true), ringLed, c.root, false); r.position.set(x, y + 160 + i * 22, z); }
      c.onFrame((t) => ringLed.color.setHSL((t * 0.05) % 1, 0.9, 0.55).multiplyScalar(2.6 * c.U.uNight.value));
      c.beacon(x, y + 242, z, 1.2);
      c.trees(c.scatter(900, (r) => { const a = r() * 6.28, d = r() * 600; const px = x + Math.cos(a) * d, pz = z + Math.sin(a) * d * 0.8; return height(px, pz) > 25 ? [px, pz, 13] : null; }), { hue: 0.3 });
    }

    // ---------- Gyeongbokgung Palace ----------
    {
      const [x, z] = PAL, g = c.group(x, 0, z, 0);
      const wall = c.std({ color: '#d8cdb8', rough: 0.9 });
      const tile = c.std({ color: '#3c3f42', rough: 0.6, flat: true, emissive: '#ffcf8a', night: 0.12 });
      const red = c.std({ color: '#9b2b22', rough: 0.6, emissive: '#ffb070', night: 0.4 });
      const green = c.std({ color: '#3f7f68', rough: 0.6 });
      const stone = c.std({ color: '#c9c3b6', rough: 0.85 });
      const e = c.B();
      const W = 300, D = 440;
      e.box(wall, W, 6, 3, 0, 0, D / 2); e.box(wall, W, 6, 3, 0, 0, -D / 2); e.box(wall, 3, 6, D, W / 2, 0, 0); e.box(wall, 3, 6, D, -W / 2, 0, 0);
      const roof = (cx, y, cz, sx, sz, h) => e.loft(tile, c.prof.rect(1, 1), [{ y, sx: sx + 3, sz: sz + 3, x: cx, z: cz }, { y: y + 0.8, sx: sx + 4, sz: sz + 4, x: cx, z: cz }, { y: y + h * 0.45, sx: sx * 0.72, sz: sz * 0.62, x: cx, z: cz }, { y: y + h, sx: sx * 0.55, sz: 0.8, x: cx, z: cz }]);
      // Gwanghwamun gate
      e.box(stone, 60, 11, 16, 0, 0, D / 2);
      e.box(red, 40, 6, 11, 0, 11, D / 2); e.box(green, 42, 1.2, 12, 0, 16.5, D / 2);
      roof(0, 17, D / 2, 23, 8, 7); e.box(red, 30, 4, 8, 0, 24, D / 2); roof(0, 28, D / 2, 18, 6, 7);
      // Geunjeongjeon throne hall on two stone terraces
      e.box(stone, 110, 2, 80, 0, 0, 0); e.box(stone, 90, 2, 62, 0, 2, 0);
      e.box(red, 60, 10, 32, 0, 4, 0); e.box(green, 62, 1.4, 34, 0, 13.6, 0);
      roof(0, 15, 0, 34, 20, 8); e.box(red, 48, 4, 24, 0, 22, 0); roof(0, 26, 0, 29, 16, 9);
      // Gyeonghoeru pavilion on its pond
      for (let i = 0; i < 6; i++) for (let j = 0; j < 4; j++) e.cyl(stone, 0.8, 0.8, 6, 8, -95 + i * 8, -2, -120 + j * 8);
      e.box(red, 44, 5, 28, -75, 4, -108); roof(-75, 9, -108, 24, 16, 6);
      for (const [cx, cz] of [[0, -90], [0, 90], [80, -40], [-80, 80], [90, 120]]) { e.box(red, 34, 6, 14, cx, 0, cz); roof(cx, 6, cz, 18, 8, 5); }
      e.done(g);
      const pond = c.mesh(new THREE.PlaneGeometry(90, 60).rotateX(-Math.PI / 2), c.std({ color: '#335a5e', rough: 0.1, metal: 0.3 }), g, false); pond.position.set(-75, 0.3, -108);
      const yard = c.mesh(new THREE.PlaneGeometry(W, D).rotateX(-Math.PI / 2), c.std({ color: '#cbbfa6', rough: 0.95 }), g, false); yard.position.y = 0.2; yard.receiveShadow = true;
      c.road([[x, null, z + D / 2 + 20], [x, null, z + D / 2 + 900]], { width: 60, thick: 0.3, traffic: 30 });
    }

    // ---------- Dongdaemun Design Plaza ----------
    {
      const [x, z] = DDP;
      const geo = new THREE.SphereGeometry(1, 72, 20);
      const p = geo.attributes.position;
      for (let i = 0; i < p.count; i++) {
        let px = p.getX(i) * 150, py = p.getY(i) * 30, pz = p.getZ(i) * 75;
        pz += 26 * Math.sin(px * 0.018); py = Math.min(py, 22 + 6 * Math.sin(px * 0.03)); if (py < 0) py = 0;
        p.setXYZ(i, px, py, pz);
      }
      geo.computeVertexNormals();
      const skin = c.facade({ color: '#c6cbcf', rough: 0.3, metal: 0.8 }, { bay: 3, floorH: 2.2, wx: [0.05, 0.95], wy: [0.1, 0.4], glassMul: 0.7, glassAdd: [0.02, 0.02, 0.02], litProb: 0.25, litColor: [0.9, 0.95, 1], litGain: 0.9 });
      c.mesh(geo, skin).position.set(x, 0, z);
      const plaza = c.mesh(new THREE.CircleGeometry(200, 40).rotateX(-Math.PI / 2), c.std({ color: '#a8a8a2', rough: 0.9 }), c.root, false); plaza.position.set(x, 0.2, z);
      const leds = c.lamp('#ffffff', 1.8), lg = c.B();
      for (let i = 0; i < 400; i++) { const a = hash2(i, 1) * Math.PI * 2, d = 110 + hash2(i, 2) * 70; lg.box(leds, 0.4, 1.2, 0.4, x + Math.cos(a) * d, 0, z + Math.sin(a) * d * 0.7); }
      lg.done(c.root, { shadow: false });
    }

    // ---------- Han River bridges (Banpo with its rainbow fountain) ----------
    const crossings = [[-4100, 'arch'], [-3000, 'girder'], [-2000, 'girder'], [-900, 'arch'], [200, 'girder'], [1300, 'stayed'], [2400, 'arch']];
    const riverZ = (x) => { for (let i = 0; i < han.length - 1; i++) { const [ax, az] = han[i], [bx, bz] = han[i + 1]; if (x >= ax && x <= bx) return lerp(az, bz, (x - ax) / (bx - ax)); } return -800; };
    for (const [x, type] of crossings) {
      const zc = riverZ(x);
      c.bridge({ a: [x + 30, zc + HW + 40], b: [x - 30, zc - HW - 40], type, deck: type === 'girder' ? 14 : 18, towerH: type === 'stayed' ? 120 : 55, width: 30, span: [0.1, 0.9], towers: [0.5], reach: 0.35, piers: 55, traffic: 26, cableLamp: c.lamp(type === 'arch' ? '#6fb8ff' : '#fff0d0', 2.4), deckLamp: c.lamp(type === 'girder' ? '#8fd0ff' : '#ffe6b8', 2.6) });
    }
    {
      const x = -2000, zc = riverZ(x), rb = ['#ff4d4d', '#ffae3a', '#fff04a', '#5cff7a', '#4ab0ff', '#9a5cff'];
      const mats = rb.map((col) => c.glow(col, 0.55)), arcs = [];
      const arcGeo = new THREE.TorusGeometry(10, 0.35, 4, 12, Math.PI);
      for (let i = 0; i < 70; i++) for (const s of [-1, 1]) {
        const m = c.mesh(arcGeo, mats[i % 6], c.root, false);
        m.position.set(x + s * 15, 3, zc - HW + 20 + i * ((2 * HW - 40) / 70)); m.rotation.y = s > 0 ? 0 : Math.PI; arcs.push(m);
      }
      c.onFrame((t) => arcs.forEach((m, i) => { m.scale.set(1, 0.8 + 0.25 * Math.sin(t * 2 + i * 0.3), 1); }));
    }

    // ---------- Riverside expressways + parks ----------
    for (const s of [-1, 1]) {
      const pts = [];
      for (let i = 0; i < han.length; i++) { const [x, z] = han[i], [nx0, nz0] = han[Math.min(i + 1, han.length - 1)], [px, pz] = han[Math.max(i - 1, 0)]; const tx = nx0 - px, tz = nz0 - pz, L = Math.hypot(tx, tz); pts.push([x - tz / L * (HW + 45) * s, 6, z + tx / L * (HW + 45) * s]); }
      c.road(pts, { width: 24, pillars: 50, traffic: 70 });
    }
    c.trees(c.scatter(1500, (r) => { const x = -5000 + r() * 9800, zc = riverZ(x), s = r() < 0.5 ? -1 : 1, z = zc + s * (HW + 12 + r() * 20); return height(x, z) > -1 ? [x, z, 8] : null; }), { hue: 0.28 });

    // ---------- 63 Building & Yeouido ----------
    {
      const gold = c.facade({ color: '#c9a45a', rough: 0.15, metal: 0.95 }, { bay: 2, floorH: 4, wx: [0.04, 0.96], wy: [0.08, 0.96], glassMul: 0.7, litProb: 0.35, litGain: 0.6 });
      const e = c.B(), x = YEOUIDO[0] + 260, z = YEOUIDO[1] + 40;
      e.loft(gold, c.prof.rect(1, 0.45), [{ y: 0, s: 36, x, z }, { y: 200, s: 36, x, z }, { y: 250, s: 18, x, z }]);
      const glass = c.facade({ color: '#8ea3b3', rough: 0.15, metal: 0.8 }, { bay: 2, floorH: 4, wx: [0.04, 0.96], wy: [0.08, 0.96], glassMul: 0.5, litProb: 0.4, litGain: 0.6 });
      for (const [dx, dz, h, w] of [[-120, 20, 280, 34], [-60, -30, 220, 30], [0, 30, 200, 28], [-200, -20, 180, 30], [60, -40, 150, 26]]) e.box(glass, w, h, w, YEOUIDO[0] + dx, 0, YEOUIDO[1] + dz, 0, 0.12);
      e.done();
      c.beacon(x, 251, z);
    }

    // ---------- City: apartment superblocks + commercial corridors ----------
    const aptCols = ['#efebe3', '#e7e4dc', '#f2eee6', '#e3e6e8', '#ede4d8'].map((x) => new THREE.Color(x));
    const glassCols = ['#8fa3b4', '#a4b1bb', '#6f8392', '#c1c8cc', '#7f8a93'].map((x) => new THREE.Color(x));
    const busy = (x, z) => Math.hypot(x - 20, z - 70) < 230 || Math.hypot(x - 300, z - 60) < 150 || Math.hypot(x - 520, z - 70) < 120 || Math.hypot(x - NAM[0], z - NAM[1]) < 520 ||
      (Math.abs(x - PAL[0]) < 180 && Math.abs(z - PAL[1]) < 250) || (Math.abs(x - PAL[0]) < 40 && z > PAL[1] && z < PAL[1] + 1200) || Math.hypot(x - DDP[0], z - DDP[1]) < 210 || distPoly(x, z, han) < HW + 75 || onYeouido(x, z);
    const lots = c.grid({
      R: 5200, cx: -800, cz: -1300, bx: 130, bz: 130, sx: 26, sz: 26, angle: 0.12, split: [1, 1], fill: [0.8, 0.9], jitter: 2, big: 0,
      exclude: busy, maxSlope: 12,
      density: (x, z, d) => 0.97 - 0.4 * smooth(3800, 5200, d),
      height: () => 1,
      color: () => null,
    });
    const out = [], r = c.rand;
    for (const l of lots) {
      const teheran = Math.abs((l.z - 250) - (l.x + 900) * 0.35) < 160 && l.x < 0 && l.x > -2400;
      const jongno = l.z < -1900 && l.z > -3000 && l.x > -3300 && l.x < -800;
      if (teheran || jongno || hash2(l.x | 0, l.z | 0) < 0.12) {
        for (const [ox, oz] of [[-26, -26], [26, -26], [-26, 26], [26, 26]]) {
          if (r() < 0.2) continue;
          const h = teheran ? 60 + r() * 150 : 20 + r() * 60;
          out.push({ x: l.x + ox, z: l.z + oz, y: l.y, w: 34, d: 34, h, r: l.r, c: (teheran ? glassCols : aptCols)[Math.floor(r() * 5)].clone() });
        }
      } else {
        // apartment superblock: parallel slabs facing south, same height per block
        const h = [45, 60, 75][Math.floor(hash2(l.z | 0, l.x | 0) * 3)], col = aptCols[Math.floor(r() * 5)];
        for (const oz of [-38, 0, 38]) for (const ox of [-30, 30]) out.push({ x: l.x + ox, z: l.z + oz, y: l.y, w: 48, d: 13, h, r: l.r, c: col.clone(), shape: 'slab', roof: 'box', rs: 0.25, rh: 5, rc: new THREE.Color('#5b7fa8') });
      }
    }
    const mat = c.facade({ color: 0xffffff, rough: 0.65, metal: 0.2 }, { bay: 2.6, floorH: 2.9, wx: [0.1, 0.9], wy: [0.3, 0.85], glassMul: 0.4, litProb: 0.5, litColor: [1, 0.9, 0.75], litGain: 0.6 });
    c.buildings(out, { mat, roofMats: { box: c.std({ color: '#fff', rough: 0.6 }) } });
    c.trees(c.scatter(1500, (r) => { const x = (r() - 0.5) * 11000 - 800, z = (r() - 0.5) * 11000 - 1300, h = height(x, z); return h > 60 ? [x, z, 14] : null; }), { hue: 0.29 });
  },
});
