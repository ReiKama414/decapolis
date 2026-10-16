(() => {
'use strict';
const { THREE, OrbitControls, EffectComposer, RenderPass, UnrealBloomPass, OutputPass, mergeGeometries } = window.T;
const V3 = THREE.Vector3;
const lerp = (a, b, t) => a + (b - a) * t;
const clamp = (x, a, b) => Math.min(Math.max(x, a), b);
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const ease = (k) => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2);

// ---------- Quality tier (keeps phones from falling over) ----------
const LOW = matchMedia('(pointer: coarse)').matches || Math.min(innerWidth, innerHeight) < 600 || (navigator.deviceMemory || 8) <= 4;
const Q = { low: LOW, density: LOW ? 0.5 : 1, trees: LOW ? 0.35 : 1, seg: LOW ? 150 : 240, traffic: LOW ? 0.4 : 1 };

// ---------- Renderer / scene ----------
const renderer = new THREE.WebGLRenderer({ antialias: !LOW, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, LOW ? 1 : 1.5));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.shadowMap.autoUpdate = false; // sun is static: re-render shadows only when the city changes
renderer.toneMapping = THREE.ACESFilmicToneMapping;
document.body.prepend(renderer.domElement);

const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0xcfe0ec, 900, 7500);
const camera = new THREE.PerspectiveCamera(45, innerWidth / innerHeight, 1, 20000);
camera.position.set(0, 3000, 3000);
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.maxPolarAngle = Math.PI * 0.495;
controls.minDistance = 40;
controls.autoRotateSpeed = 0.5;

const U = { uNight: { value: 0 }, uTint: { value: new THREE.Color() }, uTime: { value: 0 } };

// ---------- Utilities ----------
function rng(seed) {
  return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}
function hash2(i, j) { let h = Math.imul(i, 374761393) + Math.imul(j, 668265263) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967295; }
function vnoise(x, z) {
  const i = Math.floor(x), j = Math.floor(z), fx = x - i, fz = z - j, u = fx * fx * (3 - 2 * fx), v = fz * fz * (3 - 2 * fz);
  const a = hash2(i, j), b = hash2(i + 1, j), c = hash2(i, j + 1), d = hash2(i + 1, j + 1);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
function fbm(x, z, o = 4) { let s = 0, a = 0.5, f = 1, n = 0; for (let k = 0; k < o; k++) { s += a * vnoise(x * f, z * f); n += a; f *= 2.03; a *= 0.5; } return s / n; }
// distance from point to polyline [[x,z],...]
function distPoly(x, z, pts) {
  let best = Infinity;
  for (let i = 0; i < pts.length - 1; i++) {
    const [ax, az] = pts[i], [bx, bz] = pts[i + 1], dx = bx - ax, dz = bz - az;
    const t = clamp(((x - ax) * dx + (z - az) * dz) / (dx * dx + dz * dz), 0, 1);
    best = Math.min(best, Math.hypot(x - ax - dx * t, z - az - dz * t));
  }
  return best;
}
function inPoly(x, z, poly) {
  let c = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, zi] = poly[i], [xj, zj] = poly[j];
    if ((zi > z) !== (zj > z) && x < (xj - xi) * (z - zi) / (zj - zi) + xi) c = !c;
  }
  return c;
}
const M = (x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, sx = 1, sy = sx, sz = sx) =>
  new THREE.Matrix4().compose(new V3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz)), new V3(sx, sy, sz));

// ---------- Sky ----------
const skyU = {
  uTop: { value: new THREE.Color() }, uHorizon: { value: new THREE.Color() }, uBottom: { value: new THREE.Color() },
  uSunDir: { value: new V3(0.6, 0.5, -0.45).normalize() }, uSun: { value: 1 },
};
const skyMat = new THREE.ShaderMaterial({
  uniforms: skyU, side: THREE.BackSide, depthWrite: false, fog: false,
  vertexShader: `varying vec3 vDir; void main(){ vDir = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
  fragmentShader: `
    uniform vec3 uTop, uHorizon, uBottom, uSunDir; uniform float uSun; varying vec3 vDir;
    void main(){
      vec3 d = normalize(vDir); float h = d.y;
      vec3 c = h > 0.0 ? mix(uHorizon, uTop, pow(clamp(h, 0.0, 1.0), 0.45)) : mix(uHorizon, uBottom, pow(clamp(-h, 0.0, 1.0), 0.35));
      float s = max(dot(d, normalize(uSunDir)), 0.0);
      c += uSun * (vec3(10.0, 9.0, 7.5) * pow(s, 1500.0) + vec3(0.45, 0.32, 0.18) * pow(s, 12.0));
      gl_FragColor = vec4(c, 1.0);
    }`,
});
const skyGeo = new THREE.SphereGeometry(9000, 48, 24);
const sky = new THREE.Mesh(skyGeo, skyMat);
sky.renderOrder = -1;
sky.frustumCulled = false;
scene.add(sky);
let stars;
{
  const r = rng(7), n = LOW ? 900 : 2000, p = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    const u = r() * Math.PI * 2, v = Math.acos(r() * 0.95);
    p.set([Math.sin(v) * Math.cos(u) * 8500, Math.cos(v) * 8500, Math.sin(v) * Math.sin(u) * 8500], i * 3);
  }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(p, 3));
  stars = new THREE.Points(g, new THREE.PointsMaterial({ color: 0xffffff, size: 1.1, sizeAttenuation: false, transparent: true, opacity: 0, fog: false, depthWrite: false }));
  sky.add(stars);
}
const PAL_DEFAULT = {
  day: ['#3f7fcc', '#cfe0ec', '#9aa7b0'],
  night: ['#020410', '#1b2440', '#06080e'],
};
let pal = null;
function setPalette(p) {
  const c = (a) => a.map((x) => new THREE.Color(x));
  pal = { day: c(p.day), night: c(p.night) };
}
function applySky(t) {
  skyU.uTop.value.lerpColors(pal.day[0], pal.night[0], t);
  skyU.uHorizon.value.lerpColors(pal.day[1], pal.night[1], t);
  skyU.uBottom.value.lerpColors(pal.day[2], pal.night[2], t);
  skyU.uSun.value = 1 - t;
}

// ---------- Lights ----------
const hemi = new THREE.HemisphereLight(0xdfefff, 0x5a5f55, 0.6);
scene.add(hemi);
const sun = new THREE.DirectionalLight(0xfff1dd, 2.6);
sun.castShadow = true;
sun.shadow.mapSize.set(LOW ? 1024 : 4096, LOW ? 1024 : 4096);
sun.shadow.bias = -0.0002;
sun.shadow.normalBias = 0.6;
scene.add(sun, sun.target);

// ---------- Environment maps (per city palette) ----------
const pmrem = new THREE.PMREMGenerator(renderer);
const envScene = new THREE.Scene();
envScene.add(new THREE.Mesh(skyGeo, skyMat));
let env = null;
function makeEnv() {
  if (env) { env.rtDay.dispose(); env.rtNight.dispose(); }
  applySky(0); const rtDay = pmrem.fromScene(envScene, 0, 0.1, 20000);
  applySky(1); const rtNight = pmrem.fromScene(envScene, 0, 0.1, 20000);
  env = { rtDay, rtNight, day: rtDay.texture, night: rtNight.texture };
}

// ---------- Post ----------
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloom = new UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), 0.15, 0.6, 0.95);
composer.addPass(bloom);
composer.addPass(new OutputPass());

// ============================================================
// Per-city live state + builder API
// ============================================================
let live = null;

function std(o = {}) {
  const m = new THREE.MeshStandardMaterial({
    color: o.color ?? 0xffffff, roughness: o.rough ?? 0.6, metalness: o.metal ?? 0.1, flatShading: !!o.flat,
    side: o.side ?? THREE.FrontSide, transparent: !!o.transparent, opacity: o.opacity ?? 1, vertexColors: !!o.vc,
  });
  if (o.emissive) { m.emissive.set(o.emissive); live.nightMats.push([m, o.day ?? 0, o.night ?? 1]); }
  return m;
}
// Glowing unlit material; brightness follows night (HDR values feed bloom)
function lamp(color, hdr = 3, day = 0) {
  const m = new THREE.MeshBasicMaterial({ color });
  live.lamps.push([m, new THREE.Color(color), hdr, day]);
  return m;
}
// Additive beam / halo material, only visible at night
function glow(color, opacity = 0.35) {
  const m = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false });
  live.nightFns.push((t) => { m.opacity = opacity * t; m.visible = t > 0.01; });
  return m;
}

const FDEF = {
  bay: 3, floorH: 3.6, wx: [0.15, 0.85], wy: [0.25, 0.85], glassMul: 0.4, glassAdd: [0.03, 0.05, 0.07], glassRough: 0.15, glassMetal: 0.6,
  litProb: 0.3, litColor: [1, 0.78, 0.5], litGain: 0.55, glow: 0, modStart: 0, modH: 1, modEnd: 0, led: 0, ledMin: 0, minY: -1e4,
};
// Procedural window facade in world space: works on any planar face, instanced or not
function facade(base, opts) {
  const m = std(base);
  const o = { ...FDEF, ...opts };
  const f = (x) => Number(x).toFixed(4);
  const v3 = (a) => `vec3(${a.map(f).join(',')})`;
  const avg = (o.wx[1] - o.wx[0]) * (o.wy[1] - o.wy[0]);
  m.customProgramCacheKey = () => 'fac' + JSON.stringify(o);
  m.onBeforeCompile = (sh) => {
    sh.uniforms.uNight = U.uNight; sh.uniforms.uTint = U.uTint; sh.uniforms.uTime = U.uTime;
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vWPos;')
      .replace('#include <worldpos_vertex>', `#include <worldpos_vertex>
        vec4 fwp = vec4(transformed, 1.0);
        #ifdef USE_INSTANCING
          fwp = instanceMatrix * fwp;
        #endif
        vWPos = (modelMatrix * fwp).xyz;`);
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', `#include <common>
        varying vec3 vWPos; uniform float uNight; uniform vec3 uTint; uniform float uTime;
        float fHash(vec3 p){ return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453); }
        vec3 fHsv(float h){ return clamp(abs(mod(h * 6.0 + vec3(0.0, 4.0, 2.0), 6.0) - 3.0) - 1.0, 0.0, 1.0); }`)
      .replace('#include <metalnessmap_fragment>', `#include <metalnessmap_fragment>
        vec3 fNc = cross(dFdx(vWPos), dFdy(vWPos));
        vec3 fN = fNc / max(length(fNc), 1e-10);
        float fSide = (1.0 - step(0.6, abs(fN.y))) * step(${f(o.minY)}, vWPos.y);
        vec2 fT = normalize(vec2(-fN.z, fN.x) + vec2(1e-6));
        float fH = dot(vWPos.xz, fT);
        float fO = dot(vWPos.xz, vec2(fT.y, -fT.x));
        vec2 fCell = vec2(fH / ${f(o.bay)}, vWPos.y / ${f(o.floorH)});
        vec2 fF = fract(fCell);
        float fWinSharp = step(${f(o.wx[0])}, fF.x) * step(fF.x, ${f(o.wx[1])}) * step(${f(o.wy[0])}, fF.y) * step(fF.y, ${f(o.wy[1])});
        vec2 fW = vec2(length(vec2(dot(dFdx(vWPos.xz), fT), dot(dFdy(vWPos.xz), fT))) / ${f(o.bay)}, fwidth(vWPos.y) / ${f(o.floorH)});
        float fAA = clamp(1.5 - max(fW.x, fW.y) * 3.0, 0.0, 1.0);
        float fWin = mix(${f(avg)}, fWinSharp, fAA) * fSide;
        float fR = fHash(vec3(floor(fCell), floor(abs(fO) * 0.5)));
        diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * ${f(o.glassMul)} + ${v3(o.glassAdd)}, fWin);
        roughnessFactor = mix(roughnessFactor, ${f(o.glassRough)}, fWin);
        metalnessFactor = mix(metalnessFactor, ${f(o.glassMetal)}, fWin);`)
      .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
        float fLit = mix(${f(o.litProb)}, step(${f(1 - o.litProb)}, fR), fAA);
        totalEmissiveRadiance += fWin * fLit * uNight * ${v3(o.litColor)} * ${f(o.litGain)} * (0.55 + 0.9 * fract(fR * 31.7));
        #if ${o.glow > 0 ? 1 : 0}
          float fM = (vWPos.y - ${f(o.modStart)}) / ${f(o.modH)};
          float fIn = step(0.0, fM) * step(vWPos.y, ${f(o.modEnd)});
          totalEmissiveRadiance += uTint * uNight * ${f(o.glow)} * pow(fract(fM), 2.2) * fIn * fSide * (1.0 - 0.45 * fWin);
        #endif
        #if ${o.led > 0 ? 1 : 0}
          float fBand = smoothstep(0.72, 1.0, sin(vWPos.y * 0.05 - uTime * 1.4 + fO * 0.015) * 0.5 + 0.5);
          vec3 fLed = fHsv(fract(fO * 0.0011 + fH * 0.0006 + uTime * 0.035)) * 0.8 + 0.2;
          totalEmissiveRadiance += fLed * fBand * uNight * ${f(o.led)} * fSide * step(${f(o.ledMin)}, vWPos.y);
        #endif`);
  };
  return m;
}

// ---------- Geometry helpers ----------
const prof = {
  notched(n) {
    const corner = [[1, 1 - 2 * n], [1 - n, 1 - 2 * n], [1 - n, 1 - n], [1 - 2 * n, 1 - n], [1 - 2 * n, 1]];
    const pts = [];
    for (let k = 0; k < 4; k++) for (const [x, y] of corner) {
      let X = x, Y = y;
      for (let r = 0; r < k; r++) { const t = X; X = -Y; Y = t; }
      pts.push([X, Y]);
    }
    return pts;
  },
  rect(ax = 1, ay = 1) { return [[ax, -ay], [ax, ay], [-ax, ay], [-ax, -ay]]; },
  ngon(n, phase = 0, r = 1) { const p = []; for (let i = 0; i < n; i++) { const a = phase + i / n * Math.PI * 2; p.push([Math.cos(a) * r, Math.sin(a) * r]); } return p; },
  chamfer(ax, ay, c) { return [[ax, -ay + c], [ax, ay - c], [ax - c, ay], [-ax + c, ay], [-ax, ay - c], [-ax, -ay + c], [-ax + c, -ay], [ax - c, -ay]]; },
  ccw(p) { let a = 0; for (let i = 0; i < p.length; i++) { const [x1, y1] = p[i], [x2, y2] = p[(i + 1) % p.length]; a += x1 * y2 - x2 * y1; } return a < 0 ? p.slice().reverse() : p; },
};
// Stack a 2D profile at several levels: {y, s | sx,sz, x, z}
function loft(profile, levels, { capTop = true, capBottom = true } = {}) {
  profile = prof.ccw(profile);
  const pos = [], n = profile.length;
  levels = levels.map((l) => (l.p ? { ...l, p: prof.ccw(l.p) } : l));
  const P = (i, l) => {
    const [px, py] = (l.p ?? profile)[i % n], sx = l.sx ?? l.s ?? 1, sz = l.sz ?? l.s ?? 1;
    return [px * sx + (l.x || 0), l.y, -py * sz + (l.z || 0)];
  };
  for (let j = 0; j < levels.length - 1; j++) {
    const a = levels[j], b = levels[j + 1];
    for (let i = 0; i < n; i++) {
      const p0 = P(i, a), p1 = P(i + 1, a), p2 = P(i + 1, b), p3 = P(i, b);
      pos.push(...p0, ...p1, ...p2, ...p0, ...p2, ...p3);
    }
  }
  const v2 = profile.map(([x, y]) => new THREE.Vector2(x, y));
  const tris = THREE.ShapeUtils.triangulateShape(v2, []).map(([a, b, c]) => {
    const A = v2[a], B = v2[b], Cc = v2[c];
    return (B.x - A.x) * (Cc.y - A.y) - (B.y - A.y) * (Cc.x - A.x) > 0 ? [a, b, c] : [a, c, b];
  });
  if (capTop) { const l = levels.at(-1); for (const [a, b, c] of tris) pos.push(...P(a, l), ...P(b, l), ...P(c, l)); }
  if (capBottom) { const l = levels[0]; for (const [a, b, c] of tris) pos.push(...P(a, l), ...P(c, l), ...P(b, l)); }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.computeVertexNormals();
  return g;
}

// Merges many small parts into one mesh per material (few draw calls)
const _Y = new V3(0, 1, 0);
class Builder {
  constructor() { this.parts = new Map(); }
  add(mat, geo, m) {
    let g = geo.index ? geo.toNonIndexed() : geo.clone();
    geo.dispose();
    for (const k of Object.keys(g.attributes)) if (k !== 'position' && k !== 'normal') g.deleteAttribute(k);
    if (!g.attributes.normal) g.computeVertexNormals();
    g.morphAttributes = {};
    if (m) g.applyMatrix4(m);
    if (!this.parts.has(mat)) this.parts.set(mat, []);
    this.parts.get(mat).push(g);
    return this;
  }
  box(mat, w, h, d, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0) { return this.add(mat, new THREE.BoxGeometry(w, h, d).translate(0, h / 2, 0), M(x, y, z, rx, ry, rz)); }
  cyl(mat, rt, rb, h, seg, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0) { return this.add(mat, new THREE.CylinderGeometry(rt, rb, h, seg).translate(0, h / 2, 0), M(x, y, z, rx, ry, rz)); }
  sphere(mat, r, x = 0, y = 0, z = 0, sy = 1, ws = 16, hs = 10, phiLen = Math.PI) {
    return this.add(mat, new THREE.SphereGeometry(r, ws, hs, 0, Math.PI * 2, 0, phiLen), M(x, y, z, 0, 0, 0, 1, sy, 1));
  }
  cone(mat, r, h, seg, x = 0, y = 0, z = 0, ry = 0) { return this.add(mat, new THREE.ConeGeometry(r, h, seg).translate(0, h / 2, 0), M(x, y, z, 0, ry, 0)); }
  beam(mat, a, b, t = 1, t2 = t) {
    const d = new V3().subVectors(b, a), L = d.length();
    if (L < 1e-4) return this;
    const q = new THREE.Quaternion().setFromUnitVectors(_Y, d.normalize());
    return this.add(mat, new THREE.BoxGeometry(t, L, t2).translate(0, L / 2, 0), new THREE.Matrix4().compose(a, q, new V3(1, 1, 1)));
  }
  rod(mat, a, b, r = 0.5, seg = 5) {
    const d = new V3().subVectors(b, a), L = d.length();
    if (L < 1e-4) return this;
    const q = new THREE.Quaternion().setFromUnitVectors(_Y, d.normalize());
    return this.add(mat, new THREE.CylinderGeometry(r, r, L, seg, 1, true).translate(0, L / 2, 0), new THREE.Matrix4().compose(a, q, new V3(1, 1, 1)));
  }
  chain(mat, pts, r = 0.5, seg = 5) { for (let i = 0; i < pts.length - 1; i++) this.rod(mat, pts[i], pts[i + 1], r, seg); return this; }
  loft(mat, profile, levels, opts, m) { return this.add(mat, loft(profile, levels, opts), m); }
  done(parent = live.root, { shadow = true, receive = true } = {}) {
    const g = new THREE.Group();
    for (const [mat, list] of this.parts) {
      const merged = mergeGeometries(list, false);
      list.forEach((x) => x.dispose());
      const mesh = new THREE.Mesh(merged, mat);
      mesh.castShadow = shadow && !mat.transparent; mesh.receiveShadow = receive;
      g.add(mesh);
    }
    this.parts.clear();
    parent.add(g);
    return g;
  }
}

function mesh(geo, mat, parent = live.root, shadow = true) {
  const m = new THREE.Mesh(geo, mat);
  m.castShadow = m.receiveShadow = shadow;
  parent.add(m);
  return m;
}
function group(x = 0, y = 0, z = 0, ry = 0, parent = live.root) {
  const g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = ry; parent.add(g); return g;
}
function beacon(x, y, z, r = 0.9, parent = live.root) {
  if (!live.beaconMat) live.beaconMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(6, 0.25, 0.2) });
  const b = new THREE.Mesh(live.beaconGeo ??= new THREE.SphereGeometry(1, 10, 6), live.beaconMat);
  b.scale.setScalar(r); b.position.set(x, y, z); parent.add(b); live.beacons.push(b);
  return b;
}
// Detail swap for heavy landmarks: `high` near, `low` (or nothing) far
function lod(x, z, high, low, dist, parent = live.root) {
  const l = new THREE.LOD(); l.position.set(x, 0, z);
  l.addLevel(high, 0); l.addLevel(low || new THREE.Object3D(), dist);
  parent.add(l);
  return l;
}

// ---------- Terrain with procedural streets ----------
function ground(o) {
  const size = o.size ?? 14000, seg = o.seg ?? Q.seg;
  const g = new THREE.PlaneGeometry(size, size, seg, seg); g.rotateX(-Math.PI / 2);
  const pos = g.attributes.position, col = new Float32Array(pos.count * 3), city = new Float32Array(pos.count), c = new THREE.Color();
  const pal = { city: '#3a3e43', grass: '#43603a', rock: '#2c4327', sand: '#b8a27c', bed: '#27343a', ...o.colors };
  for (const k in pal) pal[k] = new THREE.Color(pal[k]);
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), z = pos.getZ(i), h = o.height(x, z);
    pos.setY(i, h);
    const cm = h > -0.5 ? clamp(o.city ? o.city(x, z, h) : 0, 0, 1) : 0;
    if (o.color) o.color(x, z, h, cm, c, pal);
    else {
      if (h < -0.5) c.copy(pal.bed).lerp(pal.sand, smooth(-6, -0.5, h));
      else c.copy(pal.grass).lerp(pal.rock, smooth(40, 400, h)).lerp(pal.city, cm);
    }
    col.set([c.r, c.g, c.b], i * 3);
    city[i] = cm;
  }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  g.setAttribute('aCity', new THREE.BufferAttribute(city, 1));
  g.computeVertexNormals();
  const gr = { bx: 115, bz: 115, sx: 24, sz: 24, angle: 0, strength: 1, cars: 1, ...o.grid };
  const lc = o.lamp ?? [1, 0.62, 0.28];
  const f = (x) => Number(x).toFixed(4);
  const m = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.95, flatShading: true });
  m.customProgramCacheKey = () => 'gnd' + JSON.stringify(gr);
  m.onBeforeCompile = (sh) => {
    sh.uniforms.uNight = U.uNight; sh.uniforms.uTime = U.uTime;
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nattribute float aCity; varying vec3 vWPos; varying float vCity;')
      .replace('#include <worldpos_vertex>', '#include <worldpos_vertex>\nvWPos = (modelMatrix * vec4(transformed, 1.0)).xyz; vCity = aCity;');
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', `#include <common>
        varying vec3 vWPos; varying float vCity; uniform float uNight; uniform float uTime;
        float gHash(vec2 p){ return fract(sin(dot(p, vec2(41.3, 289.1))) * 43758.5453); }`)
      .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
        vec3 gNc = cross(dFdx(vWPos), dFdy(vWPos));
        vec3 gN = gNc / max(length(gNc), 1e-10);
        float gFlat = smoothstep(0.9, 0.97, abs(gN.y));
        float ca = cos(${f(gr.angle)}), sa = sin(${f(gr.angle)});
        vec2 L = vec2(vWPos.x * ca - vWPos.z * sa, vWPos.x * sa + vWPos.z * ca);
        vec2 B = vec2(${f(gr.bx)}, ${f(gr.bz)}), S = vec2(${f(gr.sx)}, ${f(gr.sz)});
        vec2 q = mod(L - B * 0.5, B);
        vec2 d = min(q, B - q);
        vec2 on = 1.0 - step(S * 0.5, d);
        float gm = vCity * gFlat * ${f(gr.strength)};
        float street = max(on.x, on.y) * gm;
        diffuseColor.rgb *= mix(1.12, 0.62, street);
        vec2 lq = (d - S * 0.4) / 1.4;
        vec2 le = exp(-lq * lq) * on;
        float lamps = max(le.x, le.y) * gm;
        // moving headlights / taillights
        vec2 k = floor((L - B * 0.5) / B + 0.5);
        vec2 side = step(B * 0.5, q);
        vec2 lane = on * (1.0 - step(S * 0.13, abs(d - S * 0.22)));
        float sA = L.y / 16.0 + uTime * mix(-1.7, 1.7, side.x) + gHash(vec2(k.x, 3.0)) * 9.0;
        float sB = L.x / 16.0 + uTime * mix(-1.7, 1.7, side.y) + gHash(vec2(k.y, 7.0)) * 9.0;
        float cA = lane.x * step(0.8, fract(sA)) * step(0.45, gHash(vec2(k.x, floor(sA))));
        float cB = lane.y * step(0.8, fract(sB)) * step(0.45, gHash(vec2(floor(sB), k.y)));
        vec3 carCol = cA * mix(vec3(1.0, 0.08, 0.04), vec3(1.0, 0.92, 0.75), side.x) + cB * mix(vec3(1.0, 0.08, 0.04), vec3(1.0, 0.92, 0.75), side.y);
        totalEmissiveRadiance += (vec3(${lc.map(f).join(',')}) * lamps * 0.55 + carCol * 1.4 * ${f(gr.cars)} * gm) * uNight;`);
  };
  const mesh_ = new THREE.Mesh(g, m);
  mesh_.receiveShadow = true;
  live.root.add(mesh_);
  live.h = o.height;
  return mesh_;
}

// ---------- Water ----------
function water(o = {}) {
  const level = o.level ?? -2, size = o.size ?? 16000, R = o.glitterR ?? 2500, gc = o.glitter ?? [1, 0.72, 0.45];
  const m = new THREE.MeshStandardMaterial({ color: o.color ?? '#1d3a4a', roughness: o.rough ?? 0.16, metalness: 0.2 });
  const f = (x) => Number(x).toFixed(4);
  m.customProgramCacheKey = () => 'wat' + R + gc;
  m.onBeforeCompile = (sh) => {
    sh.uniforms.uNight = U.uNight; sh.uniforms.uTime = U.uTime;
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vWPos;')
      .replace('#include <worldpos_vertex>', '#include <worldpos_vertex>\nvWPos = (modelMatrix * vec4(transformed, 1.0)).xyz;');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec3 vWPos; uniform float uNight; uniform float uTime;')
      .replace('#include <normal_fragment_maps>', `#include <normal_fragment_maps>
        vec2 wp = vWPos.xz;
        vec3 wn = vec3(0.0);
        vec2 wd[4]; wd[0] = vec2(0.83, 0.55); wd[1] = vec2(-0.41, 0.91); wd[2] = vec2(0.97, -0.24); wd[3] = vec2(-0.7, -0.71);
        float wf[4]; wf[0] = 0.043; wf[1] = 0.071; wf[2] = 0.113; wf[3] = 0.19;
        for (int i = 0; i < 4; i++) { float ph = dot(wp, wd[i]) * wf[i] + uTime * (1.1 + float(i) * 0.37); wn.xz += wd[i] * cos(ph) / (1.0 + float(i)); }
        normal = normalize(normal + (viewMatrix * vec4(wn * 0.045, 0.0)).xyz);`)
      .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
        vec2 gc = floor(wp / vec2(2.5, 0.9));
        float gh = fract(sin(dot(gc + floor(uTime * 4.0 + gc.x * 0.37), vec2(12.9898, 78.233))) * 43758.5453);
        float gl = step(0.996, gh) * 1.3;
        totalEmissiveRadiance += uNight * vec3(${gc.map(f).join(',')}) * gl * (1.0 - smoothstep(${f(R * 0.4)}, ${f(R)}, length(wp - vec2(${f(o.cx ?? 0)}, ${f(o.cz ?? 0)})))) * 0.9;`);
  };
  const w = new THREE.Mesh(new THREE.PlaneGeometry(size, size).rotateX(-Math.PI / 2), m);
  w.position.y = level;
  w.receiveShadow = true;
  live.root.add(w);
  return w;
}

// ---------- Procedural street-grid lots ----------
function grid(o) {
  const r = live.rand;
  const bx = o.bx ?? 115, bz = o.bz ?? bx, sx = o.sx ?? 24, sz = o.sz ?? sx, ang = o.angle ?? 0, R = o.R ?? 2200;
  const cx = o.cx ?? 0, cz = o.cz ?? 0;
  const [nx, nz] = o.split ?? [2, 2], fill = o.fill ?? [0.6, 0.9], ux = bx - sx, uz = bz - sz;
  const ca = Math.cos(ang), sa = Math.sin(ang);
  const toW = (lx, lz) => [lx * ca + lz * sa, -lx * sa + lz * ca];
  const lots = [];
  const Ni = Math.ceil(R / bx) + 1, Nj = Math.ceil(R / bz) + 1;
  const i0 = Math.round((cx * ca - cz * sa) / bx), j0 = Math.round((cx * sa + cz * ca) / bz);
  for (let i = i0 - Ni; i <= i0 + Ni; i++) for (let j = j0 - Nj; j <= j0 + Nj; j++) {
    const big = r() < (o.big ?? 0.06);
    const sn = big ? [1, 1] : [nx, nz];
    for (let a = 0; a < sn[0]; a++) for (let b = 0; b < sn[1]; b++) {
      const lx = i * bx - ux / 2 + (a + 0.5) * ux / sn[0] + (r() - 0.5) * (o.jitter ?? 3);
      const lz = j * bz - uz / 2 + (b + 0.5) * uz / sn[1] + (r() - 0.5) * (o.jitter ?? 3);
      const [x, z] = toW(lx, lz);
      const dist = Math.hypot(x - cx, z - cz);
      const rr = r(), rh = r(), rc = r();
      if (dist > R) continue;
      if (rr > (o.density ? o.density(x, z, dist) : 1) * Q.density) continue;
      if (o.exclude && o.exclude(x, z)) continue;
      const w = ux / sn[0] * lerp(fill[0], fill[1], r()) * (big ? 0.85 : 1), d = uz / sn[1] * lerp(fill[0], fill[1], r()) * (big ? 0.85 : 1);
      // footprint must be on land; on slopes sink into the lowest corner
      let hmin = Infinity, hmax = -Infinity;
      for (const [px, pz] of [[-w / 2, -d / 2], [w / 2, -d / 2], [-w / 2, d / 2], [w / 2, d / 2], [0, 0]]) {
        const [qx, qz] = toW(lx + px, lz + pz), hh = live.h(qx, qz);
        hmin = Math.min(hmin, hh); hmax = Math.max(hmax, hh);
      }
      if (hmin < (o.minLand ?? -0.5)) continue;
      if (hmax - hmin > (o.maxSlope ?? 6)) continue;
      const h = o.height(x, z, dist, rh, big);
      if (!(h > 0)) continue;
      const lot = { x, z, y: hmin - 1, w, d, h: h + (hmax - hmin) + 1, r: ang + (r() - 0.5) * (o.rotJitter ?? 0), c: o.color ? o.color(rc, x, z, h) : null };
      if (o.decorate) o.decorate(lot, r);
      lots.push(lot);
    }
  }
  return lots;
}

// ---------- Instanced buildings, chunked for culling ----------
function unitGeos() {
  if (live.unit) return live.unit;
  const mk = (g) => g;
  const merge = (list) => { const gs = list.map((g) => { const n = g.index ? g.toNonIndexed() : g; n.deleteAttribute('uv'); return n; }); return mergeGeometries(gs); };
  live.unit = {
    box: mk(new THREE.BoxGeometry(1, 1, 1).translate(0, 0.5, 0)),
    cyl: mk(new THREE.CylinderGeometry(0.5, 0.5, 1, 16).translate(0, 0.5, 0)),
    oct: mk(new THREE.CylinderGeometry(0.5, 0.5, 1, 8, 1).rotateY(Math.PI / 8).translate(0, 0.5, 0)),
    taper: mk(loft(prof.rect(0.5, 0.5), [{ y: 0, s: 1 }, { y: 1, s: 0.72 }])),
    mansard: mk(loft(prof.rect(0.5, 0.5), [{ y: 0, s: 1.02 }, { y: 0.35, s: 0.98 }, { y: 1, s: 0.72 }])),
    gable: mk(new THREE.ExtrudeGeometry(new THREE.Shape([new THREE.Vector2(-0.5, 0), new THREE.Vector2(0.5, 0), new THREE.Vector2(0, 1)]), { depth: 1, bevelEnabled: false }).translate(0, 0, -0.5)),
    hip: mk(loft(prof.rect(0.5, 0.5), [{ y: 0, sx: 1.04, sz: 1.04 }, { y: 1, sx: 0.5, sz: 0.02 }])),
    pyramid: mk(new THREE.ConeGeometry(0.72, 1, 4, 1).rotateY(Math.PI / 4).translate(0, 0.5, 0)),
    dome: mk(new THREE.SphereGeometry(0.5, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2).scale(1, 2, 1)),
    tank: merge([new THREE.CylinderGeometry(0.5, 0.5, 0.65, 10).translate(0, 0.62, 0), new THREE.ConeGeometry(0.55, 0.3, 10).translate(0, 1.1, 0),
      new THREE.BoxGeometry(0.8, 0.3, 0.8).translate(0, 0.15, 0)]),
    slab: mk(new THREE.BoxGeometry(1, 1, 1).translate(0, 0.5, 0)),
  };
  return live.unit;
}
const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _p = new V3(), _s = new V3(), _c = new THREE.Color();
function buildings(lots, o) {
  const unit = unitGeos();
  const chunk = o.chunk ?? 700, shadowR = o.shadowR ?? live.def.shadow?.r ?? 900;
  const sc = live.def.shadow?.c ?? [0, 0];
  const chunks = new Map();
  for (const l of lots) {
    const key = Math.floor(l.x / chunk) + ',' + Math.floor(l.z / chunk);
    if (!chunks.has(key)) chunks.set(key, []);
    chunks.get(key).push(l);
  }
  for (const list of chunks.values()) {
    const g = new THREE.Group();
    let cx = 0, cz = 0; list.forEach((l) => { cx += l.x; cz += l.z; }); cx /= list.length; cz /= list.length;
    let rad = 0; list.forEach((l) => { rad = Math.max(rad, Math.hypot(l.x - cx, l.z - cz) + Math.max(l.w, l.d)); });
    const nearSun = Math.hypot(cx - sc[0], cz - sc[1]) < shadowR + rad;
    const byKey = new Map();
    const push = (k, item) => { if (!byKey.has(k)) byKey.set(k, []); byKey.get(k).push(item); };
    for (const l of list) {
      push('b:' + (l.shape || 'box'), l);
      if (l.roof) push('r:' + l.roof, l);
    }
    for (const [k, items] of byKey) {
      const [kind, name] = k.split(':');
      const isRoof = kind === 'r';
      const mat = isRoof ? (o.roofMats?.[name] ?? o.mat) : (o.mats?.[name] ?? o.mat);
      const im = new THREE.InstancedMesh(unit[name] ?? unit.box, mat, items.length);
      let colored = false;
      items.forEach((l, i) => {
        _q.setFromAxisAngle(_Y, l.r || 0);
        if (!isRoof) { _p.set(l.x, l.y, l.z); _s.set(l.w, l.h, l.d); }
        else if (name === 'tank') {
          const ox = (hash2(l.x | 0, l.z | 0) - 0.5) * l.w * 0.5, oz = (hash2(l.z | 0, l.x | 0) - 0.5) * l.d * 0.5;
          _p.set(l.x + ox, l.y + l.h, l.z + oz); _s.set(6, 9, 6);
        } else { _p.set(l.x, l.y + l.h, l.z); _s.set(l.w * (l.rs ?? 1), l.rh ?? 6, l.d * (l.rs ?? 1)); }
        im.setMatrixAt(i, _m.compose(_p, _q, _s));
        const col = isRoof ? l.rc : l.c;
        if (col) { colored = true; im.setColorAt(i, col); } else im.setColorAt(i, _c.set(1, 1, 1));
      });
      if (!colored) { im.instanceColor = null; }
      im.castShadow = nearSun && !o.noShadow; im.receiveShadow = true;
      im.computeBoundingSphere();
      g.add(im);
    }
    live.root.add(g);
    live.chunks.push({ g, x: cx, z: cz, r: rad });
  }
}

// ---------- Trees ----------
function trees(pts, o = {}) {
  const n = Math.floor(pts.length * Q.trees);
  if (!n) return;
  const type = o.type ?? 'round';
  let geo;
  if (type === 'palm') {
    const parts = [new THREE.CylinderGeometry(0.06, 0.1, 1, 5).translate(0, 0.5, 0)];
    for (let k = 0; k < 6; k++) parts.push(new THREE.ConeGeometry(0.12, 0.7, 3).rotateZ(Math.PI / 2 + 0.5).translate(0.3, 1.0, 0).rotateY(k / 6 * Math.PI * 2));
    geo = mergeGeometries(parts.map((g) => { const x = g.toNonIndexed(); x.deleteAttribute('uv'); return x; }));
  } else if (type === 'cone') geo = new THREE.ConeGeometry(0.45, 1.4, 6).translate(0, 0.9, 0);
  else geo = new THREE.IcosahedronGeometry(0.6, 0).translate(0, 0.9, 0);
  const im = new THREE.InstancedMesh(geo, std({ color: o.color ?? '#3d6b32', rough: 0.9, flat: true }), n);
  const r = live.rand;
  for (let i = 0; i < n; i++) {
    const [x, z, s = 8] = pts[Math.floor(i / Q.trees)] ?? pts[i];
    const sz = s * (0.75 + r() * 0.5);
    im.setMatrixAt(i, _m.compose(_p.set(x, live.h(x, z) - 0.3, z), _q.setFromAxisAngle(_Y, r() * 6), _s.set(sz, sz * (type === 'palm' ? 1.5 : 1), sz)));
    im.setColorAt(i, _c.setHSL(o.hue ?? 0.28, 0.35 + r() * 0.2, 0.2 + r() * 0.12));
  }
  im.castShadow = !!o.shadow; im.receiveShadow = true;
  im.computeBoundingSphere();
  live.root.add(im);
  return im;
}
function scatter(n, fn) { const out = [], r = live.rand; let guard = 0; while (out.length < n && guard++ < n * 30) { const p = fn(r); if (p) out.push(p); } return out; }

// ---------- Roads, traffic, bridges ----------
function tri(pos, a, b, c, hint) {
  const n = new V3().subVectors(b, a).cross(new V3().subVectors(c, a));
  if (n.dot(hint) < 0) pos.push(a.x, a.y, a.z, c.x, c.y, c.z, b.x, b.y, b.z);
  else pos.push(a.x, a.y, a.z, b.x, b.y, b.z, c.x, c.y, c.z);
}
function ribbonGeo(pts, width, thick, off = 0) {
  const pos = [], L = [], R = [], N = [];
  for (let i = 0; i < pts.length; i++) {
    const a = pts[Math.max(i - 1, 0)], b = pts[Math.min(i + 1, pts.length - 1)];
    const t = new V3(b.x - a.x, 0, b.z - a.z).normalize(), n = new V3(-t.z, 0, t.x);
    const c = pts[i].clone().addScaledVector(n, off);
    L.push(c.clone().addScaledVector(n, width / 2)); R.push(c.clone().addScaledVector(n, -width / 2)); N.push(n);
  }
  const up = new V3(0, 1, 0), dn = new V3(0, -1, 0), D = new V3(0, -thick, 0);
  for (let i = 0; i < pts.length - 1; i++) {
    const l0 = L[i], l1 = L[i + 1], r0 = R[i], r1 = R[i + 1];
    tri(pos, l0, l1, r1, up); tri(pos, l0, r1, r0, up);
    if (thick > 0) {
      const l0d = l0.clone().add(D), l1d = l1.clone().add(D), r0d = r0.clone().add(D), r1d = r1.clone().add(D);
      tri(pos, l0, l1, l1d, N[i]); tri(pos, l0, l1d, l0d, N[i]);
      const nr = N[i].clone().negate();
      tri(pos, r0, r1, r1d, nr); tri(pos, r0, r1d, r0d, nr);
      tri(pos, l0d, l1d, r1d, dn); tri(pos, l0d, r1d, r0d, dn);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.computeVertexNormals();
  return g;
}
function mats() {
  return live.sharedMats ??= {
    road: std({ color: '#55595e', rough: 0.85 }),
    concrete: std({ color: '#a4a19a', rough: 0.8 }),
    steel: std({ color: '#c7cdd0', rough: 0.35, metal: 0.8 }),
    white: std({ color: '#eef0ee', rough: 0.5, metal: 0.2 }),
    lampW: lamp('#ffd9a0', 3.2),
  };
}
// pts: [[x,y,z]...] (y null -> follow terrain + 0.4)
function road(points, o = {}) {
  const sm = mats();
  const v = points.map(([x, y, z]) => new V3(x, y ?? live.h(x, z) + 0.4, z));
  const curve = new THREE.CatmullRomCurve3(v, false, 'centripetal');
  const len = curve.getLength(), pts = curve.getSpacedPoints(Math.max(8, Math.ceil(len / (o.step ?? 10))));
  const w = o.width ?? 16, b = new Builder();
  b.add(o.mat ?? sm.road, ribbonGeo(pts, w, o.thick ?? 1.6));
  if (o.lamps !== false) {
    const lifted = pts.map((p) => p.clone().setY(p.y + 1.1));
    b.add(o.lampMat ?? sm.lampW, ribbonGeo(lifted, 0.45, 0.2, w / 2 - 0.4));
    b.add(o.lampMat ?? sm.lampW, ribbonGeo(lifted, 0.45, 0.2, -w / 2 + 0.4));
  }
  if (o.pillars) {
    const pm = o.pillarMat ?? sm.concrete;
    for (let d = o.pillars / 2; d < len; d += o.pillars) {
      const p = curve.getPointAt(d / len), gy = live.h(p.x, p.z);
      if (p.y - gy > 5) b.cyl(pm, o.pillarR ?? 2.2, o.pillarR ?? 2.2, p.y - gy - 1.2, 10, p.x, gy - 3, p.z);
    }
  }
  b.done(o.parent ?? live.root, { shadow: o.shadow ?? true });
  if (o.traffic) traffic(curve, w, o.traffic);
  return curve;
}
function traffic(curve, width, count) {
  count = Math.max(2, Math.floor(count * Q.traffic));
  const m = new THREE.MeshBasicMaterial({ color: 0xffffff });
  live.nightFns.push((t) => m.color.setScalar(lerp(0.55, 2.2, t)));
  const im = new THREE.InstancedMesh(live.carGeo ??= new THREE.BoxGeometry(2, 1.3, 4.4).translate(0, 0.65, 0), m, count);
  const len = curve.getLength(), cars = [];
  for (let i = 0; i < count; i++) {
    const dir = i % 2 ? 1 : -1;
    cars.push({ u: live.rand(), dir, lane: dir * width * (0.14 + 0.16 * (i % 4 > 1)), v: (13 + live.rand() * 8) / len });
    im.setColorAt(i, dir > 0 ? _c.set(1, 0.95, 0.8) : _c.set(1, 0.1, 0.06));
  }
  im.frustumCulled = false;
  live.root.add(im);
  const tan = new V3(), pt = new V3();
  live.frameFns.push((t, dt) => {
    cars.forEach((c, i) => {
      c.u = (c.u + c.v * dt * c.dir + 1) % 1;
      curve.getPointAt(c.u, pt); curve.getTangentAt(c.u, tan);
      const n = new V3(-tan.z, 0, tan.x).normalize();
      pt.addScaledVector(n, c.lane);
      _q.setFromUnitVectors(new V3(0, 0, 1), tan.setY(0).normalize());
      im.setMatrixAt(i, _m.compose(pt, _q, _s.set(1, 1, 1)));
    });
    im.instanceMatrix.needsUpdate = true;
  });
}
// Generic bridge: suspension | stayed | arch | girder
function bridge(o) {
  const sm = mats(), b = new Builder();
  const A = new V3(o.a[0], 0, o.a[1]), Bp = new V3(o.b[0], 0, o.b[1]);
  const dir = new V3().subVectors(Bp, A), len = dir.length(); dir.normalize();
  const lat = new V3(-dir.z, 0, dir.x), ang = Math.atan2(-dir.x, -dir.z);
  const at = (f, y = 0, l = 0) => A.clone().addScaledVector(dir, f * len).addScaledVector(lat, l).setY(y);
  const deck = o.deck ?? 40, W = o.width ?? 26, ramp = o.ramp ?? Math.min(len * 0.18, 260);
  const hA = live.h(o.a[0], o.a[1]), hB = live.h(o.b[0], o.b[1]);
  const deckPts = [at(0, hA + 0.4), at(ramp / len * 0.5, lerp(hA, deck, 0.6)), at(ramp / len, deck), at(0.5, deck + (o.camber ?? 3)), at(1 - ramp / len, deck), at(1 - ramp / len * 0.5, lerp(hB, deck, 0.6)), at(1, hB + 0.4)]
    .map((p) => [p.x, p.y, p.z]);
  road(deckPts, { width: W, pillars: o.piers ?? 70, pillarR: 3, traffic: o.traffic ?? 24, lampMat: o.deckLamp, mat: o.deckMat });
  const tm = o.towerMat ?? sm.white, cm = o.cableMat ?? sm.steel, lm = o.cableLamp ?? null;
  const type = o.type ?? 'suspension', H = o.towerH ?? deck + 90;
  if (type === 'suspension') {
    const [f1, f2] = o.towers ?? [0.25, 0.75];
    for (const f of [f1, f2]) {
      const p = at(f);
      if (o.towerFn) o.towerFn(b, p, ang, H, W);
      else {
        for (const s of [-1, 1]) { const q = at(f, 0, s * (W / 2 + 2)); b.box(tm, 4.5, H + 4, 5.5, q.x, -4, q.z, 0, ang); }
        for (const y of [deck - 6, H * 0.72, H - 4]) { const q = at(f, y); b.box(tm, W + 8, 4, 4, q.x, y, q.z, 0, ang); }
      }
    }
    for (const s of [-1, 1]) {
      const pts = [], L = s * (W / 2 + 1);
      const cableY = (f) => {
        if (f < f1) return lerp(deck + 2, H, Math.pow(f / f1, 1.3));
        if (f > f2) return lerp(deck + 2, H, Math.pow((1 - f) / (1 - f2), 1.3));
        const u = (f - f1) / (f2 - f1) * 2 - 1; return deck + 4 + (H - deck - 4) * u * u;
      };
      const steps = Math.ceil(len / 12);
      for (let i = 0; i <= steps; i++) { const f = ramp / len + (1 - 2 * ramp / len) * i / steps; pts.push(at(f, cableY(f), L)); }
      b.chain(cm, pts, o.cableR ?? 0.8, 6);
      if (lm) b.chain(lm, pts.map((p) => p.clone().setY(p.y + 0.9)), 0.3, 4);
      for (let i = 1; i < steps; i += 1) { const p = pts[i]; if (p.y - deck > 4) b.rod(cm, p, p.clone().setY(deck + 0.5), 0.18, 3); }
    }
  } else if (type === 'stayed') {
    for (const f of o.towers ?? [0.5]) {
      const p = at(f);
      if (o.towerFn) o.towerFn(b, p, ang, H, W);
      else b.box(tm, 7, H + 4, 9, p.x, -4, p.z, 0, ang);
      const n = o.stays ?? 12, reach = (o.reach ?? 0.22) * len;
      for (const s of [-1, 1]) for (const side of [-1, 1]) for (let i = 1; i <= n; i++) {
        const top = at(f, H - 6 - i * (H - deck) * 0.35 / n, side * 1.5);
        const d = at(f + s * (reach * i / n) / len, deck + 1, side * (W / 2 - 1));
        b.rod(cm, top, d, 0.35, 4);
        if (lm && i % 2 === 0) b.rod(lm, top.clone().setY(top.y + 0.5), d.clone().setY(d.y + 0.5), 0.15, 3);
      }
    }
  } else if (type === 'arch') {
    const [f1, f2] = o.span ?? [0.2, 0.8], steps = 40;
    for (const s of [-1, 1]) {
      const pts = [];
      for (let i = 0; i <= steps; i++) { const f = lerp(f1, f2, i / steps), u = i / steps * 2 - 1; pts.push(at(f, deck + (H - deck) * (1 - u * u), s * (W / 2 + 1))); }
      b.chain(tm, pts, o.archR ?? 2.2, 8);
      if (lm) b.chain(lm, pts.map((p) => p.clone().setY(p.y + 2.3)), 0.35, 4);
      for (let i = 2; i < steps - 1; i += 2) b.rod(cm, pts[i], pts[i].clone().setY(deck + 0.5), 0.25, 3);
    }
    for (let i = 4; i < steps - 3; i += 4) { const f = lerp(f1, f2, i / steps), u = i / steps * 2 - 1, y = deck + (H - deck) * (1 - u * u); const q = at(f, y); b.box(tm, W + 2, 1.5, 1.5, q.x, y, q.z, 0, ang); }
  }
  return b.done();
}

// ============================================================
// City lifecycle
// ============================================================
const CITIES = [
  ['taipei', 'Taipei', '台北'], ['tokyo', 'Tokyo', '東京'], ['newyork', 'New York', '紐約'], ['hongkong', 'Hong Kong', '香港'],
  ['dubai', 'Dubai', '杜拜'], ['paris', 'Paris', '巴黎'], ['london', 'London', '倫敦'], ['chongqing', 'Chongqing', '重慶'],
  ['singapore', 'Singapore', '新加坡'], ['seoul', 'Seoul', '首爾'],
];
window.CITY = { defs: {}, register(id, def) { this.defs[id] = def; } };
const loading = {};
function loadCity(id) {
  if (window.CITY.defs[id]) return Promise.resolve(window.CITY.defs[id]);
  return loading[id] ??= new Promise((res, rej) => {
    const s = document.createElement('script');
    s.src = `js/cities/${id}.js`;
    s.onload = () => (window.CITY.defs[id] ? res(window.CITY.defs[id]) : rej(new Error('City did not register: ' + id)));
    s.onerror = () => { delete loading[id]; rej(new Error('Failed to load ' + s.src)); };
    document.head.appendChild(s);
  });
}

function disposeCity() {
  if (!live) return;
  scene.remove(live.root);
  const geos = new Set(), mts = new Set();
  live.root.traverse((o) => {
    if (o.geometry) geos.add(o.geometry);
    if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => mts.add(m));
    if (o.isInstancedMesh) o.dispose();
  });
  if (live.unit) Object.values(live.unit).forEach((g) => geos.add(g));
  geos.forEach((g) => g.dispose());
  mts.forEach((m) => { for (const k in m) { const v = m[k]; if (v && v.isTexture) v.dispose(); } m.dispose(); });
  live = null;
}

const ctxAPI = {
  THREE, V3, Q, U, M, lerp, clamp, smooth, fbm, vnoise, hash2, distPoly, inPoly, prof, loft,
  std, lamp, glow, facade, mesh, group, beacon, lod, ground, water, grid, buildings, trees, scatter, road, traffic, bridge,
  B: () => new Builder(),
  onFrame: (fn) => live.frameFns.push(fn),
  onNight: (fn) => live.nightFns.push(fn),
  h: (x, z) => live.h(x, z),
  get rand() { return live.rand; },
  get root() { return live.root; },
};

function buildCity(id, def) {
  const root = new THREE.Group();
  live = { id, def, root, rand: rng(def.seed ?? 101), nightMats: [], lamps: [], nightFns: [], frameFns: [], chunks: [], beacons: [], h: () => 0 };
  setPalette(def.sky ?? PAL_DEFAULT);
  def.build(ctxAPI);
  scene.add(root);
  // lighting setup
  const sd = new V3(...(def.sun ?? [0.6, 0.5, -0.45])).normalize();
  skyU.uSunDir.value.copy(sd);
  const sc = def.shadow?.c ?? [0, 0], sr = def.shadow?.r ?? 700;
  sun.target.position.set(sc[0], 0, sc[1]);
  sun.position.copy(sun.target.position).addScaledVector(sd, 2500);
  Object.assign(sun.shadow.camera, { left: -sr, right: sr, top: sr, bottom: -sr, near: 10, far: 5000 });
  sun.shadow.camera.updateProjectionMatrix();
  sun.userData.day = new THREE.Color(def.sunColor ?? 0xfff1dd);
  hemi.color.set(def.hemiSky ?? 0xdfefff); hemi.groundColor.set(def.hemiGround ?? 0x5a5f55);
  scene.fog.near = def.fog?.[0] ?? 900;
  live.fogFar = def.fog?.[1] ?? 7500;
  controls.maxDistance = def.maxDist ?? 4500;
  makeEnv();
  setNight(night);
  renderer.shadowMap.needsUpdate = true;
  document.getElementById('days').style.display = def.weekday ? 'flex' : 'none';
  if (def.tint) U.uTint.value.set(def.tint);
  else if (def.weekday) setDay(dayIdx);
  const meta = CITIES.find((c) => c[0] === id);
  document.getElementById('cityName').innerHTML = `${meta[1]}<small>${meta[2]}</small>`;
  document.getElementById('cityCap').textContent = def.caption ?? '';
  document.title = meta[1] + ' · 3D';
}

// ---------- Day / night ----------
const moonCol = new THREE.Color(0x8fa8ff);
let night = 0, nightTarget = 0;
function setNight(t) {
  U.uNight.value = t;
  applySky(t);
  scene.fog.color.copy(skyU.uHorizon.value);
  if (!live) return;
  const d = live.def;
  stars.material.opacity = smooth(0.4, 1, t) * (d.stars ?? 1);
  sun.intensity = lerp(d.sunI ?? 2.6, 0.25, t);
  sun.color.lerpColors(sun.userData.day, moonCol, t);
  hemi.intensity = lerp(d.hemi ?? 0.6, 0.08, t);
  scene.environment = t < 0.5 ? env.day : env.night;
  scene.environmentIntensity = t < 0.5 ? lerp(1, 0.2, t * 2) : lerp(0.2, 1, (t - 0.5) * 2);
  bloom.strength = lerp(d.bloomDay ?? 0.12, d.bloom ?? 0.65, t);
  bloom.threshold = lerp(0.95, 0.55, t);
  renderer.toneMappingExposure = lerp(d.exposure ?? 1, 1, t);
  for (const [m, a, b] of live.nightMats) m.emissiveIntensity = lerp(a, b, t);
  for (const [m, base, hdr, day] of live.lamps) m.color.copy(base).multiplyScalar(hdr * lerp(day, 1, t));
  for (const fn of live.nightFns) fn(t);
}

// ---------- Tweens / transitions ----------
const tweens = [];
function tween(dur, fn) { return new Promise((res) => tweens.push({ t: 0, dur, fn, res })); }
const veil = document.getElementById('veil');
let busy = false, queued = null, currentId = null;

async function go(id, first = false) {
  if (busy) { queued = id; return; }
  if (id === currentId) return;
  busy = true; queued = null;
  highlight(id);
  document.getElementById('err').textContent = '';
  controls.enabled = false;
  const p = loadCity(id);
  if (!first) {
    const p0 = camera.position.clone(), t0 = controls.target.clone();
    const away = p0.clone().sub(t0).setY(0).normalize();
    const p1 = p0.clone().addScaledVector(away, 900).add(new V3(0, 1100, 0)), t1 = t0.clone().add(new V3(0, 350, 0));
    const f0 = scene.fog.far;
    veil.style.background = '#' + skyU.uHorizon.value.getHexString(THREE.SRGBColorSpace);
    await tween(1.1, (k) => {
      const e = ease(k);
      camera.position.lerpVectors(p0, p1, e); controls.target.lerpVectors(t0, t1, e);
      scene.fog.far = lerp(f0, scene.fog.near + 300, e);
      veil.style.opacity = smooth(0.35, 1, k);
    });
  } else veil.style.opacity = 1;
  let def;
  try { def = await p; } catch (e) { document.getElementById('err').textContent = e.message; busy = false; controls.enabled = true; veil.style.opacity = 0; if (live) scene.fog.far = live.fogFar; highlight(currentId); return; }
  disposeCity();
  buildCity(id, def);
  currentId = id;
  history.replaceState(null, '', '#' + id);
  const vp = new V3(...def.view.pos), vt = new V3(...def.view.target);
  const away = vp.clone().sub(vt).setY(0).normalize();
  const s0 = vp.clone().addScaledVector(away, first ? 1600 : 1200).add(new V3(0, first ? 700 : 1000, 0)), st = vt.clone().add(new V3(0, 250, 0));
  camera.position.copy(s0); controls.target.copy(st);
  veil.style.background = '#' + skyU.uHorizon.value.getHexString(THREE.SRGBColorSpace);
  const ff = live.fogFar;
  await tween(first ? 4 : 3, (k) => {
    const e = ease(k);
    camera.position.lerpVectors(s0, vp, e); controls.target.lerpVectors(st, vt, e);
    scene.fog.far = lerp(scene.fog.near + 300, ff, smooth(0, 0.6, k));
    veil.style.opacity = 1 - smooth(0, 0.35, k);
  });
  controls.enabled = true;
  busy = false;
  if (queued && queued !== id) go(queued);
}

// ---------- UI ----------
const nav = document.getElementById('cities');
CITIES.forEach(([id, name], i) => {
  const b = document.createElement('button');
  b.className = 't'; b.textContent = name; b.dataset.id = id; b.title = `${name} (${(i + 1) % 10})`;
  b.onclick = () => go(id);
  nav.appendChild(b);
});
function highlight(id) { [...nav.children].forEach((b) => b.classList.toggle('on', b.dataset.id === id)); }

const btnNight = document.getElementById('btnNight');
function toggleNight() { nightTarget = nightTarget ? 0 : 1; btnNight.classList.toggle('on', !!nightTarget); }
btnNight.onclick = toggleNight;
const btnRotate = document.getElementById('btnRotate');
function toggleRotate() { controls.autoRotate = !controls.autoRotate; btnRotate.classList.toggle('on', controls.autoRotate); }
btnRotate.onclick = toggleRotate;

// Taipei 101 weekday lighting colours
const DAYS = [['Sunday', '#a64dff'], ['Monday', '#ff2d2d'], ['Tuesday', '#ff8a1c'], ['Wednesday', '#ffd21f'], ['Thursday', '#2fe05a'], ['Friday', '#2a7bff'], ['Saturday', '#5b3dff']];
const daysEl = document.getElementById('days');
let dayIdx = new Date().getDay();
function setDay(i) {
  dayIdx = i;
  U.uTint.value.set(DAYS[i][1]);
  live?.onDay?.(DAYS[i][1]);
  [...daysEl.children].forEach((b) => b.classList.toggle('on', +b.dataset.i === i));
}
for (let j = 0; j < 7; j++) {
  const i = (j + 1) % 7, b = document.createElement('button');
  b.dataset.i = i; b.title = DAYS[i][0]; b.style.background = DAYS[i][1];
  b.onclick = () => { setDay(i); if (!nightTarget) toggleNight(); };
  daysEl.appendChild(b);
}
ctxAPI.setDayHook = (fn) => { live.onDay = fn; fn(DAYS[dayIdx][1]); };

addEventListener('keydown', (e) => {
  if (e.target.tagName === 'INPUT') return;
  const k = e.key;
  if (k === 'n' || k === 'N') toggleNight();
  else if (k === 'r' || k === 'R') toggleRotate();
  else if (/^[0-9]$/.test(k)) go(CITIES[(+k + 9) % 10][0]);
  else if (k === 'ArrowRight' || k === 'ArrowLeft') {
    const i = CITIES.findIndex((c) => c[0] === (queued ?? currentId));
    go(CITIES[(i + (k === 'ArrowRight' ? 1 : 9)) % 10][0]);
  }
});

// ---------- Loop ----------
const clock = new THREE.Clock();
let fc = 0;
let simT = 0;
function frame() {
  requestAnimationFrame(frame);
  step(Math.min(clock.getDelta(), 0.1));
  composer.render();
}
function step(dt) {
  const t = (simT += dt);
  U.uTime.value = t;
  for (let i = tweens.length - 1; i >= 0; i--) {
    const w = tweens[i]; w.t = Math.min(w.t + dt / w.dur, 1); w.fn(w.t);
    if (w.t >= 1) { tweens.splice(i, 1); w.res(); }
  }
  if (Math.abs(night - nightTarget) > 1e-4) {
    night += Math.sign(nightTarget - night) * Math.min(dt / 1.6, Math.abs(nightTarget - night));
    setNight(night);
  }
  if (live) {
    for (const fn of live.frameFns) fn(t, dt);
    const blink = Math.sin(t * 2.4) > 0.55;
    for (const b of live.beacons) b.visible = blink;
    if (++fc % 10 === 0) {
      const far = scene.fog.far + 200;
      for (const c of live.chunks) c.g.visible = Math.hypot(camera.position.x - c.x, camera.position.z - c.z) < far + c.r;
    }
  }
  controls.update();
  sky.position.copy(camera.position);
}
frame();

addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
  composer.setSize(innerWidth, innerHeight);
});

const start = location.hash.slice(1);
go(CITIES.some((c) => c[0] === start) ? start : 'taipei', true);
})();
