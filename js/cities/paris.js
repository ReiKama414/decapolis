CITY.register('paris', {
  caption: 'Tour Eiffel · 330 m',
  seed: 1889,
  view: { pos: [-330, 120, 420], target: [0, 150, 0] },
  shadow: { c: [300, -300], r: 1500 },
  fog: [800, 7000],
  sun: [0.4, 0.5, 0.75],
  sunColor: '#fff0dc',
  sky: { day: ['#5b8fd0', '#e3e6e8', '#a9aca8'], night: ['#03040c', '#1f2138', '#07070d'] },
  build(c) {
    const { THREE, V3, smooth, fbm, distPoly, hash2, lerp } = c;
    const seine = [[-4500, 1300], [-2600, 900], [-1300, 250], [-250, -330], [700, -500], [1600, -420], [2300, -250], [3100, 150], [4500, 700]];
    const CITE = [2300, -250];
    const island = (x, z) => ((x - CITE[0]) / 170) ** 2 + ((z - CITE[1]) / 45) ** 2 < 1;
    const MONT = [900, -2700];
    const height = (x, z) => {
      const d = distPoly(x, z, seine);
      if (d < 70 && !island(x, z)) return -12;
      const mont = 110 * Math.exp(-(((x - MONT[0]) / 380) ** 2) - (((z - MONT[1]) / 330) ** 2));
      return smooth(70, 90, d) * 0 + mont + 6 * fbm(x * 0.0008, z * 0.0008);
    };
    const ARC = [-1200, -1400];
    const LOUVRE = [1500, -800];
    const avenues = [];
    for (let k = 0; k < 12; k++) {
      const a = k / 12 * Math.PI * 2 + 0.15;
      avenues.push([ARC, [ARC[0] + Math.cos(a) * 1500, ARC[1] + Math.sin(a) * 1500]]);
    }
    const champs = [ARC, [LOUVRE[0] - 200, LOUVRE[1] + 40]];
    const onAvenue = (x, z, w) => avenues.some((a) => distPoly(x, z, a) < w) || distPoly(x, z, champs) < w + 10;
    const champDeMars = (x, z) => { const u = (x - 0) * 0.8 + (z - 0) * 0.6, v = -(x) * 0.6 + z * 0.8; return u > 60 && u < 900 && Math.abs(v) < 110; };
    c.ground({
      height,
      city: (x, z, h) => (champDeMars(x, z) ? 0 : 1 - smooth(3800, 4600, Math.hypot(x, z))),
      grid: { bx: 95, bz: 110, sx: 14, sz: 14, angle: 0.35, strength: 0.7 },
      color: (x, z, h, cm, col, pal) => {
        if (h < -0.5) col.copy(pal.bed);
        else if (champDeMars(x, z)) col.set('#5f7d44');
        else col.copy(pal.grass).lerp(pal.city, cm);
      },
      colors: { city: '#6b6660' },
    });
    c.water({ color: '#3a5256', glitterR: 3500 });

    // ---------- Eiffel Tower ----------
    const iron = c.std({ color: '#6b5a48', rough: 0.6, metal: 0.5, emissive: '#ffad3d', night: 1.0 });
    {
      const e = c.B();
      const half = (y) => (y < 57 ? lerp(62, 40, Math.pow(y / 57, 0.8)) : y < 115 ? lerp(40, 22, (y - 57) / 58) : y < 276 ? lerp(22, 5, Math.pow((y - 115) / 161, 0.75)) : lerp(5, 2.2, (y - 276) / 36));
      const legW = (y) => (y < 115 ? lerp(15, 8, y / 115) : 0);
      // four lattice legs up to the 2nd platform
      for (const [sx, sz] of [[1, 1], [-1, 1], [-1, -1], [1, -1]]) {
        let prev = null;
        for (let y = 0; y <= 115; y += 7.5) {
          const h = half(y), w = legW(y), cx = sx * (h - w / 2), cz = sz * (h - w / 2);
          const pts = [[cx - w / 2, cz - w / 2], [cx + w / 2, cz - w / 2], [cx + w / 2, cz + w / 2], [cx - w / 2, cz + w / 2]].map(([x, z]) => new V3(x, y, z));
          if (prev) for (let i = 0; i < 4; i++) {
            e.beam(iron, prev[i], pts[i], 1.3);
            e.beam(iron, prev[i], pts[(i + 1) % 4], 0.45);
            e.beam(iron, prev[(i + 1) % 4], pts[i], 0.45);
          }
          prev = pts;
        }
      }
      // single tapering shaft
      let prev = null;
      for (let y = 115; y <= 312; y += y < 200 ? 9 : 7) {
        const h = half(y), pts = [[h, h], [-h, h], [-h, -h], [h, -h]].map(([x, z]) => new V3(x, y, z));
        if (prev) for (let i = 0; i < 4; i++) { e.beam(iron, prev[i], pts[i], 1.2); e.beam(iron, prev[i], pts[(i + 1) % 4], 0.4); e.beam(iron, prev[(i + 1) % 4], pts[i], 0.4); }
        prev = pts;
      }
      // decorative arches on the first level
      for (let k = 0; k < 4; k++) {
        const pts = [];
        for (let i = 0; i <= 20; i++) { const u = i / 20 * 2 - 1, x = u * 44, y = 20 + 30 * Math.sqrt(1 - u * u); pts.push(new V3(x, y, 47 + (57 - y) * 0.2).applyAxisAngle(new V3(0, 1, 0), k * Math.PI / 2)); }
        e.chain(iron, pts, 1.1, 5);
      }
      // platforms
      e.loft(iron, c.prof.rect(1, 1), [{ y: 55, s: 46 }, { y: 60, s: 45 }]);
      e.loft(iron, c.prof.rect(1, 1), [{ y: 113, s: 24 }, { y: 118, s: 24 }]);
      e.box(iron, 12, 8, 12, 0, 274); e.box(iron, 9, 6, 9, 0, 282);
      e.cyl(iron, 0.8, 2.2, 24, 6, 0, 288);
      const hi = e.done(new THREE.Group());
      const lo = c.B();
      lo.loft(iron, c.prof.rect(1, 1), [{ y: 0, s: 60 }, { y: 57, s: 40 }, { y: 115, s: 22 }, { y: 276, s: 5 }, { y: 312, s: 1 }], { capBottom: false });
      c.lod(0, 0, hi, lo.done(new THREE.Group()), 2800);
      c.beacon(0, 313, 0, 1);
      // sparkle + rotating beacon at night
      const sparkGeo = new THREE.BufferGeometry(), sp = [];
      for (let i = 0; i < 700; i++) { const y = Math.random() * 300, h = half(y) * 1.02; const s = Math.floor(Math.random() * 4), t = Math.random() * 2 - 1; const [px, pz] = [[h, t * h], [t * h, h], [-h, t * h], [t * h, -h]][s]; sp.push(px, y, pz); }
      sparkGeo.setAttribute('position', new THREE.Float32BufferAttribute(sp, 3));
      const sparkMat = new THREE.PointsMaterial({ color: new THREE.Color(4, 4, 4.5), size: 2.4, sizeAttenuation: false, transparent: true, opacity: 0, depthWrite: false });
      const spark = new THREE.Points(sparkGeo, sparkMat); c.root.add(spark);
      const beam = c.mesh(new THREE.CylinderGeometry(0.5, 14, 2400, 8, 1, true).translate(0, 1200, 0).rotateZ(-Math.PI / 2 + 0.03), c.glow('#fff4d6', 0.22), c.root, false);
      beam.position.y = 300; beam.frustumCulled = false;
      let nightV = 0;
      c.onNight((t) => { nightV = t; });
      c.onFrame((t) => {
        beam.rotation.y = t * 0.5;
        const on = (t % 30) < 8 ? 1 : 0;
        sparkMat.opacity = nightV * on * (0.5 + 0.5 * Math.sin(t * 40));
        if (on && Math.floor(t * 12) % 2) { const a = sparkGeo.attributes.position; for (let i = 0; i < 40; i++) { const j = Math.floor(Math.random() * a.count); a.setX(j, a.getX(j) * (0.99 + Math.random() * 0.02)); } a.needsUpdate = true; }
      });
    }

    // ---------- Arc de Triomphe & Étoile ----------
    const stone = c.std({ color: '#d9ccb0', rough: 0.8, emissive: '#ffdca0', night: 0.35 });
    {
      const e = c.B(), [x, z] = ARC, ry = Math.atan2(LOUVRE[1] - z, LOUVRE[0] - x);
      const g = c.group(x, 0, z, -ry + Math.PI / 2);
      for (const s of [-1, 1]) for (const t of [-1, 1]) e.box(stone, 14, 34, 9, s * 15, 0, t * 7.5);
      e.box(stone, 45, 17, 24, 0, 34); e.box(stone, 46, 2, 25, 0, 48);
      e.done(g);
      const ring = c.mesh(new THREE.RingGeometry(80, 120, 48).rotateX(-Math.PI / 2), c.std({ color: '#5d5c5a', rough: 0.85 }), c.root, false);
      ring.position.set(x, height(x, z) + 0.3, z);
    }
    for (const [a, b] of avenues) c.road([[a[0], null, a[1]], [(a[0] + b[0]) / 2, null, (a[1] + b[1]) / 2], [b[0], null, b[1]]].map(([x, y, z]) => [x, height(x, z) + 0.5, z]), { width: 26, thick: 0.4, traffic: 18 });
    c.road([[ARC[0], null, ARC[1]], [LOUVRE[0] - 200, null, LOUVRE[1] + 40]].map(([x, y, z]) => [x, height(x, z) + 0.5, z]), { width: 50, thick: 0.4, traffic: 40 });

    // ---------- Louvre & pyramid ----------
    const haus = c.facade({ color: '#e3d8c1', rough: 0.75 }, { bay: 3.5, floorH: 4.2, wx: [0.3, 0.7], wy: [0.25, 0.8], glassMul: 0.3, litProb: 0.5, litColor: [1, 0.8, 0.52], litGain: 0.7 });
    const zinc = c.std({ color: '#5b6670', rough: 0.55, metal: 0.4 });
    {
      const [x, z] = LOUVRE, g = c.group(x, 0, z, -0.35), e = c.B();
      const wing = (cx, cz, w, d) => { e.box(haus, w, 20, d, cx, 0, cz); e.loft(zinc, c.prof.rect(1, 1), [{ y: 20, sx: w / 2, sz: d / 2, x: cx, z: cz }, { y: 27, sx: w / 2 - 5, sz: d / 2 - 5, x: cx, z: cz }]); };
      wing(0, -150, 520, 26); wing(0, 150, 520, 26); wing(-160, 0, 150, 26);
      wing(-250, -75, 26, 175); wing(-250, 75, 26, 175); wing(-70, 0, 26, 300);
      e.done(g);
      const glass = c.std({ color: '#a9c2cf', rough: 0.05, metal: 0.8, transparent: true, opacity: 0.75, emissive: '#fff1c8', night: 1.5 });
      const p = c.mesh(new THREE.ConeGeometry(25, 21.6, 4).rotateY(Math.PI / 4).translate(0, 10.8, 0), glass, g);
      p.position.set(60, 0, 0);
      const court = c.mesh(new THREE.PlaneGeometry(260, 270).rotateX(-Math.PI / 2), c.std({ color: '#c9bea8', rough: 0.85 }), g, false);
      court.position.set(70, 0.3, 0);
    }

    // ---------- Notre-Dame on Île de la Cité ----------
    {
      const [x, z] = CITE, e = c.B(), g = c.group(x + 20, 0, z, 0.25);
      const nd = c.std({ color: '#cdbfa3', rough: 0.85, emissive: '#ffd9a0', night: 0.35 });
      const lead = c.std({ color: '#4d565c', rough: 0.5, metal: 0.4 });
      c.mesh(new THREE.CylinderGeometry(1, 1, 3, 32).scale(175, 1, 48), c.std({ color: '#b8ad99', rough: 0.9 }), c.root).position.set(x, -0.5, z);
      e.box(nd, 42, 44, 40, -60, 0, 0);
      for (const s of [-1, 1]) e.box(nd, 14, 25, 14, -64, 44, s * 13);
      e.box(nd, 100, 33, 34, 10, 0, 0);
      e.add(lead, new THREE.ExtrudeGeometry(new THREE.Shape([new THREE.Vector2(-17, 0), new THREE.Vector2(17, 0), new THREE.Vector2(0, 14)]), { depth: 100, bevelEnabled: false }).rotateY(Math.PI / 2), c.M(-40, 33, 0));
      e.box(nd, 18, 30, 50, 20, 0, 0);
      e.cyl(nd, 18, 18, 30, 12, 60, 0, 0);
      e.cyl(lead, 0.5, 4, 50, 8, 20, 46, 0);
      for (let i = 0; i < 6; i++) for (const s of [-1, 1]) e.beam(nd, new V3(-30 + i * 16, 4, s * 30), new V3(-30 + i * 16, 28, s * 17), 2.2);
      e.done(g);
    }

    // ---------- Sacré-Cœur on Montmartre, Tour Montparnasse, La Défense ----------
    {
      const [x, z] = MONT, y = height(x, z) - 3, e = c.B();
      const white = c.std({ color: '#f2efe8', rough: 0.6, emissive: '#fff4e0', night: 0.45 });
      e.box(white, 70, 26, 40, x, y, z);
      e.cyl(white, 11, 11, 16, 16, x, y + 26, z); e.sphere(white, 11, x, y + 42, z, 1.5, 16, 10, Math.PI / 2);
      for (const s of [-1, 1]) { e.cyl(white, 5, 5, 10, 12, x + s * 24, y + 26, z); e.sphere(white, 5, x + s * 24, y + 36, z, 1.5, 12, 8, Math.PI / 2); }
      e.box(white, 10, 70, 10, x, y, z - 26);
      e.done();
      const mt = c.facade({ color: '#35393d', rough: 0.3, metal: 0.6 }, { bay: 2.5, floorH: 3.8, wx: [0.05, 0.95], wy: [0.1, 0.95], glassMul: 0.8, litProb: 0.3, litGain: 0.5 });
      const m = c.B(); m.loft(mt, c.prof.chamfer(1, 0.55, 0.35), [{ y: 0, s: 42, x: 800, z: 1900 }, { y: 210, s: 42, x: 800, z: 1900 }]); m.done();
      c.beacon(800, 211, 1900);
      const def = c.facade({ color: '#9fb4c6', rough: 0.15, metal: 0.8 }, { bay: 2.2, floorH: 4, wx: [0.05, 0.95], wy: [0.1, 0.95], glassMul: 0.5, litProb: 0.4, litGain: 0.6 });
      const d = c.B();
      for (let i = 0; i < 14; i++) { const x0 = -3900 + (hash2(i, 1) - 0.5) * 700, z0 = -2400 + (hash2(i, 2) - 0.5) * 700, h = 90 + hash2(i, 3) * 140, w = 30 + hash2(i, 4) * 25; d.box(def, w, h, w * 0.7, x0, 0, z0, 0, hash2(i, 5)); }
      d.box(c.std({ color: '#e8e8e4', rough: 0.4 }), 100, 110, 20, -3600, 0, -2050, 0, -0.5);
      d.done();
    }

    // ---------- Haussmann city: uniform cream blocks, dark zinc mansards ----------
    const cream = ['#e6dcc6', '#ddd0b5', '#ece4d2', '#d6c9ae', '#e2d7c0'].map((x) => new THREE.Color(x));
    const clearZone = (x, z) => Math.hypot(x, z) < 160 || champDeMars(x, z) || Math.hypot(x - ARC[0], z - ARC[1]) < 140 || onAvenue(x, z, 22) ||
      Math.hypot(x - LOUVRE[0], z - LOUVRE[1]) < 330 || Math.hypot(x - MONT[0], z - MONT[1]) < 150 || Math.hypot(x - 800, z - 1900) < 60 || Math.hypot(x + 3700, z + 2300) < 600 || distPoly(x, z, seine) < 95;
    const lots = c.grid({
      R: 4400, bx: 95, bz: 110, sx: 14, sz: 14, angle: 0.35, split: [2, 2], fill: [0.88, 1.0], jitter: 1, big: 0.02, rotJitter: 0.08, maxSlope: 14,
      exclude: clearZone,
      density: (x, z, d) => 0.98 - 0.35 * smooth(3200, 4400, d),
      height: (x, z, d, r) => 18 + r * 6,
      color: (r) => cream[Math.floor(r * 23) % cream.length].clone(),
      decorate: (l) => { l.roof = 'mansard'; l.rh = 7; l.rs = 1; l.rc = new THREE.Color('#5a646d'); },
    });
    c.buildings(lots, { mat: haus, roofMats: { mansard: zinc } });
    // quays, bridges, plane trees along the Seine and the Champ de Mars
    for (const [a, b] of [[[-600, -150], [-460, -470]], [[400, -370], [460, -630]], [[1200, -340], [1250, -600]], [[1900, -230], [1960, -470]], [[2600, -80], [2680, -380]]]) c.bridge({ a, b, type: 'arch', deck: 6, towerH: 3, width: 28, span: [0.15, 0.85], ramp: 30, piers: 60, traffic: 10 });
    c.trees(c.scatter(1500, (r) => { const i = Math.floor(r() * (seine.length - 1)), t = r(); const [ax, az] = seine[i], [bx, bz] = seine[i + 1]; const x = lerp(ax, bx, t), z = lerp(az, bz, t), nx = -(bz - az), nz = bx - ax, L = Math.hypot(nx, nz), s = r() < 0.5 ? -1 : 1; const px = x + s * nx / L * 82, pz = z + s * nz / L * 82; return clearZone(px, pz) && distPoly(px, pz, seine) > 78 ? [px, pz, 9] : null; }), { hue: 0.26 });
    c.trees(c.scatter(500, (r) => { const u = 80 + r() * 800, v = (r() - 0.5) * 200; return [u * 0.8 - v * 0.6, u * 0.6 + v * 0.8, 8]; }), { hue: 0.27, type: 'cone' });
    c.trees(c.scatter(500, (r) => { const u = r() * 3200, t = LOUVRE, a = ARC; const x = lerp(a[0], t[0], u / 3200), z = lerp(a[1], t[1], u / 3200), s = r() < 0.5 ? -1 : 1; return [x + s * 18 * 0.1, z + s * 30, 7]; }));
  },
});
