CITY.register('singapore', {
  caption: 'Marina Bay Sands',
  seed: 65,
  view: { pos: [-700, 170, 420], target: [220, 110, -40] },
  shadow: { c: [0, 0], r: 1500 },
  fog: [800, 7200],
  sun: [0.2, 0.8, 0.45],
  sunI: 2.8,
  hemiSky: '#e9f4ff', hemiGround: '#4d6a45',
  sky: { day: ['#3a86d8', '#e1ebef', '#9eb0b2'], night: ['#040612', '#1f2a4a', '#070a12'] },
  bloom: 0.75,
  build(c) {
    const { THREE, V3, smooth, fbm, distPoly, hash2, lerp, inPoly } = c;
    const BAY = [-250, -120], BR = 390;
    const channel = [[-120, 150], [250, 700], [420, 1500]];
    const river = [[-560, -200], [-900, -300], [-1250, -250], [-1650, -420], [-2100, -380]];
    const isWater = (x, z) => Math.hypot(x - BAY[0], z - BAY[1]) < BR || distPoly(x, z, channel) < 150 || distPoly(x, z, river) < 32 || z > 1450 + 120 * Math.sin(x * 0.001);
    const height = (x, z) => {
      if (isWater(x, z)) return -12;
      const faber = 100 * Math.exp(-(((x + 2600) / 380) ** 2) - (((z - 900) / 300) ** 2));
      const canning = 35 * Math.exp(-(((x + 1300) / 200) ** 2) - (((z + 700) / 180) ** 2));
      return faber + canning + 3 * fbm(x * 0.001, z * 0.001);
    };
    const gardens = [[380, 80], [1200, 80], [1300, 1300], [520, 1300], [300, 700]];
    const inGardens = (x, z) => inPoly(x, z, gardens);
    c.ground({
      height,
      city: (x, z) => (inGardens(x, z) ? 0 : 1 - smooth(3800, 4600, Math.hypot(x, z))),
      grid: { bx: 110, bz: 110, sx: 20, sz: 20, angle: -0.35, strength: 0.75 },
      color: (x, z, h, cm, col, pal) => { if (h < -0.5) col.copy(pal.bed); else if (inGardens(x, z)) col.set('#3f6e36'); else col.copy(pal.grass).lerp(pal.city, cm * 0.85); },
      colors: { grass: '#3f6b36', city: '#4c4f52' },
    });
    c.water({ color: '#245a66', glitterR: 3000, glitter: [1, 0.78, 0.55] });

    // ---------- Marina Bay Sands ----------
    const MX = 260;
    {
      const glass = c.facade({ color: '#8fa7b4', rough: 0.15, metal: 0.75 }, { bay: 3, floorH: 3.4, wx: [0.03, 0.97], wy: [0.12, 0.93], glassMul: 0.55, glassAdd: [0.03, 0.05, 0.07], litProb: 0.45, litColor: [1, 0.9, 0.72], litGain: 0.65 });
      const e = c.B();
      for (const zc of [-120, 0, 120]) {
        e.loft(glass, c.prof.rect(1, 1), [{ y: 0, sx: 9, sz: 20, x: MX + 14, z: zc }, { y: 194, sx: 9, sz: 20, x: MX + 14, z: zc }]);
        e.loft(glass, c.prof.rect(1, 1), [{ y: 0, sx: 9, sz: 20, x: MX - 40, z: zc }, { y: 60, sx: 9, sz: 20, x: MX - 22, z: zc }, { y: 120, sx: 9, sz: 20, x: MX - 9, z: zc }, { y: 194, sx: 9, sz: 20, x: MX - 3, z: zc }]);
      }
      const white = c.std({ color: '#eef1f1', rough: 0.35, metal: 0.3 });
      const boat = [[1, 0], [0.97, 0.55], [0.6, 1], [-0.6, 1], [-0.97, 0.55], [-1, 0], [-0.97, -0.55], [-0.6, -1], [0.6, -1], [0.97, -0.55]].map(([a, b]) => [b, a]);
      e.loft(white, boat, [{ y: 194, sx: 22, sz: 190, x: MX + 5, z: -35 }, { y: 197, sx: 24, sz: 195, x: MX + 5, z: -35 }, { y: 201, sx: 23, sz: 193, x: MX + 5, z: -35 }]);
      const pool = c.std({ color: '#3fa7c9', rough: 0.05, metal: 0.3, emissive: '#3fd0ff', night: 0.6 });
      e.box(pool, 12, 0.6, 150, MX - 6, 201, -35);
      const pod = c.facade({ color: '#d9dbd8', rough: 0.5 }, { bay: 5, floorH: 6, wx: [0.05, 0.95], wy: [0.3, 0.9], litProb: 0.85, litGain: 0.8 });
      e.box(pod, 120, 22, 330, MX - 120, 0, 0);
      e.add(c.std({ color: '#cfd6d9', rough: 0.3, metal: 0.5 }), new THREE.CylinderGeometry(60, 60, 330, 24, 1, true, 0, Math.PI).rotateX(Math.PI / 2).rotateZ(Math.PI / 2), c.M(MX - 120, 22, 0, 0, 0, 0, 1, 0.25, 1));
      e.done();
      const strip = c.mesh(new THREE.BoxGeometry(2, 1, 380), c.lamp('#bfe6ff', 2.6), c.root, false); strip.position.set(MX + 30, 196, -35);
      const strip2 = strip.clone(); strip2.position.x = MX - 20; c.root.add(strip2);
      // laser show at night
      const lasers = [];
      const lg = new THREE.CylinderGeometry(0.3, 1.5, 1800, 5, 1, true).translate(0, 900, 0);
      ['#39ff6a', '#39c6ff', '#ff39d4', '#39ff6a', '#ffffff'].forEach((col, i) => { const m = c.mesh(lg, c.glow(col, 0.45), c.root, false); m.position.set(MX, 203, -150 + i * 55); m.frustumCulled = false; lasers.push(m); });
      c.onFrame((t) => lasers.forEach((m, i) => m.rotation.set(-1.1 + 0.25 * Math.sin(t * 0.6 + i), 0, 0.5 * Math.sin(t * 0.45 + i * 1.3))));
    }

    // ---------- ArtScience Museum (lotus) ----------
    {
      const AX = 120, AZ = -330, e = c.B();
      const white = c.std({ color: '#f3f3ef', rough: 0.4, emissive: '#ffe8f4', night: 0.35 });
      e.sphere(white, 20, AX, 4, AZ, 0.6, 20, 10, Math.PI / 2);
      const L = [44, 36, 30, 40, 50, 60, 52, 34, 28, 38];
      for (let k = 0; k < 10; k++) {
        const a = k / 10 * Math.PI * 2 - Math.PI / 2, len = L[k];
        e.add(white, new THREE.SphereGeometry(1, 12, 8).scale(7, len / 2, 13).translate(0, len / 2, 0), c.M(AX + Math.cos(a) * 12, 4, AZ + Math.sin(a) * 12, 0, -a, 0).multiply(c.M(0, 0, 0, 0, 0, -0.75)));
      }
      e.done();
    }

    // ---------- Gardens by the Bay: Supertrees + cooled conservatories ----------
    {
      const trunk = c.std({ color: '#5c4a6a', rough: 0.7, flat: true });
      const canopy = c.std({ color: '#6d5a7a', rough: 0.6, side: THREE.DoubleSide, emissive: '#b04dff', night: 1.4 });
      const e = c.B();
      const trees = [[640, 330, 50], [590, 400, 42], [700, 420, 45], [660, 490, 32], [560, 300, 28], [750, 330, 30], [610, 540, 25], [720, 540, 27], [800, 440, 26], [530, 450, 30], [680, 250, 26], [780, 260, 24]];
      for (const [x, z, h] of trees) {
        e.cyl(trunk, 2.2, 3.4, h, 8, x, 0, z);
        e.add(canopy, new THREE.CylinderGeometry(h * 0.33, 2.5, h * 0.22, 14, 1, true), c.M(x, h + h * 0.11 - 1, z));
        for (let k = 0; k < 8; k++) { const a = k / 8 * Math.PI * 2; e.beam(trunk, new V3(x + Math.cos(a) * 3.2, 0, z + Math.sin(a) * 3.2), new V3(x + Math.cos(a + 0.8) * 2.2, h, z + Math.sin(a + 0.8) * 2.2), 0.5); }
      }
      const sky = []; for (let i = 0; i <= 24; i++) { const a = i / 24 * Math.PI * 2; sky.push(new V3(640 + Math.cos(a) * 60, 22, 400 + Math.sin(a) * 60)); }
      e.chain(trunk, sky, 1.2, 4);
      e.done();
      const glass = c.std({ color: '#cfe6ee', rough: 0.05, metal: 0.4, transparent: true, opacity: 0.55, emissive: '#bfe6ff', night: 0.6 });
      const d = c.B();
      d.add(glass, new THREE.SphereGeometry(1, 28, 12, 0, Math.PI * 2, 0, Math.PI / 2), c.M(480, 0, 700, 0, 0.6, 0, 110, 38, 60));
      d.add(glass, new THREE.SphereGeometry(1, 28, 12, 0, Math.PI * 2, 0, Math.PI / 2), c.M(560, 0, 860, 0, 0.6, 0, 80, 58, 55));
      d.done(c.root, { shadow: false });
      const inner = c.B(); inner.cone(c.std({ color: '#3f6e3a', rough: 0.9 }), 30, 50, 10, 560, 0, 860); inner.done();
    }

    // ---------- Singapore Flyer ----------
    {
      const FX = 540, FZ = -680, g = c.group(FX, 0, FZ, 0.9);
      const white = c.std({ color: '#eceff0', rough: 0.35, metal: 0.6 });
      const e = c.B();
      e.box(c.facade({ color: '#cfd4d3', rough: 0.5 }, { bay: 4, floorH: 5, litProb: 0.8 }), 120, 18, 60, 0, 0, 0);
      for (const s of [-1, 1]) { e.beam(white, new V3(-40, 18, s * 30), new V3(0, 90, s * 8), 3); e.beam(white, new V3(40, 18, s * 30), new V3(0, 90, s * 8), 3); }
      e.cyl(white, 3.5, 3.5, 18, 12, 0, 90, -9, Math.PI / 2);
      e.done(g);
      const wheel = new THREE.Group(); wheel.position.y = 90; g.add(wheel);
      const w = c.B(), R = 72;
      w.add(white, new THREE.TorusGeometry(R, 1.3, 6, 96)); w.add(white, new THREE.TorusGeometry(R - 7, 0.8, 6, 96));
      for (let k = 0; k < 28; k++) { const a = k / 28 * Math.PI * 2; for (const s of [-6, 6]) w.rod(white, new V3(0, 0, s), new V3(Math.cos(a) * (R - 7), Math.sin(a) * (R - 7), 0), 0.15, 3); }
      w.done(wheel, { shadow: false });
      c.mesh(new THREE.TorusGeometry(R + 0.3, 0.6, 4, 96), c.lamp('#8fd0ff', 2.3), wheel, false);
      const caps = new THREE.InstancedMesh(new THREE.CapsuleGeometry(2.2, 5, 4, 8).rotateX(Math.PI / 2), c.std({ color: '#e7f1f5', rough: 0.1, metal: 0.4, emissive: '#dff4ff', night: 1 }), 28);
      g.add(caps);
      const m = new THREE.Matrix4();
      c.onFrame((t) => { const r = t * 0.025; wheel.rotation.z = r; for (let k = 0; k < 28; k++) { const a = k / 28 * Math.PI * 2 + r; m.makeTranslation(Math.cos(a) * (R + 3), 90 + Math.sin(a) * (R + 3), 0); caps.setMatrixAt(k, m); } caps.instanceMatrix.needsUpdate = true; });
    }

    // ---------- Merlion, Esplanade durians, Helix Bridge ----------
    {
      const LX = -620, LZ = -120, g = c.group(LX, 0, LZ, -Math.PI / 2 - 0.4);
      const white = c.std({ color: '#f1f0ea', rough: 0.5, emissive: '#fff6e0', night: 0.5 });
      const e = c.B();
      e.cyl(c.std({ color: '#9c968a', rough: 0.8 }), 9, 10, 4, 16, 0, -3, 0);
      e.add(white, new THREE.SphereGeometry(1, 14, 10).scale(4, 8, 4), c.M(0, 9, 0));
      e.add(white, new THREE.TorusGeometry(4, 1.5, 8, 16, Math.PI * 1.2), c.M(0, 3, -4, 0, Math.PI / 2, 0));
      e.sphere(white, 4.2, 0, 19, 1.5, 1, 14, 10, Math.PI);
      for (let k = 0; k < 10; k++) { const a = k / 10 * Math.PI * 2; e.cone(white, 1.3, 4, 5, Math.cos(a) * 4.2, 16.5, 1.5 + Math.sin(a) * 4.2); }
      e.done(g);
      const jet = []; for (let i = 0; i <= 16; i++) { const t = i / 16; jet.push(new V3(0, 19 + 10 * t - 22 * t * t, 5 + t * 26)); }
      const jb = c.B(); jb.chain(c.std({ color: '#e7f6ff', rough: 0.1, transparent: true, opacity: 0.7, emissive: '#dff6ff', night: 1.2 }), jet, 0.7, 6); jb.done(g, { shadow: false });
      const dur = c.std({ color: '#9aa0a2', rough: 0.4, metal: 0.6, flat: true, emissive: '#ffd7a0', night: 0.35 });
      const d = c.B();
      d.add(dur, new THREE.IcosahedronGeometry(1, 3), c.M(-350, 0, -600, 0, 0, 0, 70, 28, 50));
      d.add(dur, new THREE.IcosahedronGeometry(1, 3), c.M(-230, 0, -640, 0, 0.4, 0, 55, 24, 42));
      d.done();
      const hb = c.B(), A = new V3(160, 12, -380), Bv = new V3(-60, 12, -520), steel = c.std({ color: '#dfe3e5', rough: 0.3, metal: 0.8 }), led = c.lamp('#ff66cc', 2.4);
      for (const ph of [0, Math.PI]) { const pts = []; for (let i = 0; i <= 80; i++) { const t = i / 80, a = t * Math.PI * 10 + ph, p = A.clone().lerp(Bv, t); const dir = Bv.clone().sub(A).normalize(), n = new V3(-dir.z, 0, dir.x); pts.push(p.add(n.multiplyScalar(Math.cos(a) * 6)).add(new V3(0, Math.sin(a) * 6, 0))); } hb.chain(ph ? led : steel, pts, 0.5, 4); }
      hb.done(c.root, { shadow: false });
      c.road([[A.x, 8, A.z], [Bv.x, 8, Bv.z]], { width: 7, thick: 1, lamps: false });
    }

    // ---------- CBD towers and HDB estates ----------
    const glassCols = ['#7f97a8', '#9aa9b3', '#6c7f8e', '#b7c3c9', '#8fa0a0', '#c9ced0'].map((x) => new THREE.Color(x));
    const hdbCols = ['#efe9dc', '#e8dfcf', '#f3efe6', '#e0e6e3', '#efe0d0', '#dfe8ec'].map((x) => new THREE.Color(x));
    const CBD = [-900, -250];
    const avoid = (x, z) => inGardens(x, z) || Math.hypot(x - MX + 60, z) < 230 || Math.hypot(x - 540, z + 680) < 120 || Math.hypot(x + 620, z + 120) < 40 || Math.hypot(x + 300, z + 610) < 110 || Math.hypot(x - 120, z + 330) < 60;
    const lots = c.grid({
      R: 4400, bx: 110, bz: 110, sx: 20, sz: 20, angle: -0.35, split: [2, 2], fill: [0.5, 0.85], jitter: 5, big: 0.05,
      exclude: (x, z) => avoid(x, z) || distPoly(x, z, river) < 55,
      density: (x, z, d) => 0.7 + 0.25 * Math.exp(-Math.hypot(x - CBD[0], z - CBD[1]) / 600) - 0.3 * smooth(3200, 4400, d),
      height: (x, z, d, r, big) => {
        const f = Math.exp(-Math.hypot(x - CBD[0], z - CBD[1]) / 450);
        if (f > 0.3) return Math.min(280, 90 + Math.pow(hash2(x | 0, z | 0), 0.8) * 200 * f + r * 40);
        return big ? 20 + r * 20 : 40 + r * 80;
      },
      color: (r, x, z, h) => (h > 130 || Math.hypot(x - CBD[0], z - CBD[1]) < 700 ? glassCols : hdbCols)[Math.floor(r * 19) % 6].clone(),
      decorate: (l, r) => {
        const cbd = Math.hypot(l.x - CBD[0], l.z - CBD[1]) < 700;
        if (!cbd && l.h > 38) { l.w = 58; l.d = 14; l.shape = 'slab'; l.roof = 'box'; l.rs = 0.35; l.rh = 4; l.rc = new THREE.Color('#d9533f'); }
        else if (cbd) { const k = r(); l.shape = k < 0.2 ? 'cyl' : k < 0.35 ? 'oct' : 'box'; }
      },
    });
    const mat = c.facade({ color: 0xffffff, rough: 0.35, metal: 0.4 }, { bay: 2.6, floorH: 3.2, wx: [0.12, 0.88], wy: [0.25, 0.85], glassMul: 0.45, litProb: 0.45, litColor: [1, 0.93, 0.8], litGain: 0.65 });
    c.buildings(lots, { mat, roofMats: { box: c.std({ color: '#fff', rough: 0.7 }) } });
    c.trees(c.scatter(3200, (r) => { const x = (r() - 0.5) * 8000, z = (r() - 0.5) * 7000; if (isWater(x, z)) return null; if (inGardens(x, z)) return [x, z, 9]; return r() < 0.25 && Math.hypot(x, z) < 4200 ? [x, z, 8] : height(x, z) > 20 ? [x, z, 12] : null; }), { hue: 0.3 });
    c.trees(c.scatter(500, (r) => { const a = r() * Math.PI * 2, d = BR + 20 + r() * 25; const x = BAY[0] + Math.cos(a) * d, z = BAY[1] + Math.sin(a) * d; return isWater(x, z) ? null : [x, z, 6]; }), { type: 'palm', hue: 0.26 });
    // container ships in the strait
    {
      const hull = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1).translate(0, 0.5, 0), c.std({ color: '#ffffff', rough: 0.7 }), 40);
      let k = 0;
      for (let i = 0; i < 20; i++) {
        const x = -3500 + hash2(i, 9) * 7000, z = 1800 + hash2(i, 3) * 1800, ry = hash2(i, 4) * 0.6 - 0.3, L = 120 + hash2(i, 5) * 160;
        hull.setMatrixAt(k, new THREE.Matrix4().compose(new V3(x, -5, z), new THREE.Quaternion().setFromAxisAngle(new V3(0, 1, 0), ry), new V3(28, 12, L))); hull.setColorAt(k++, new THREE.Color(hash2(i, 6) < 0.5 ? '#2b2f33' : '#7a2a24'));
        hull.setMatrixAt(k, new THREE.Matrix4().compose(new V3(x, 7, z), new THREE.Quaternion().setFromAxisAngle(new V3(0, 1, 0), ry), new V3(24, 10, L * 0.7))); hull.setColorAt(k++, new THREE.Color(['#c05a3a', '#3a6fa0', '#d4a13a', '#4f8a5a'][i % 4]));
      }
      hull.castShadow = false; hull.receiveShadow = true;
      c.root.add(hull);
    }
    c.road([[-2600, null, -900], [-1200, null, -800], [-500, 5, -760], [400, 10, -300], [900, 12, 0], [1400, null, 500], [2500, null, 900]], { width: 26, pillars: 40, traffic: 50 });
  },
});
