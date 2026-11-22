/* Sage 3D courtyard. Vendored three.js 0.187.0 (MIT, see vendor/VERSION.txt).

   Two bodies, one courtyard:
   1. Drop-in avatar: /base/assets/sage/sage.glb (rigged GLB, PBR skin). Loaded only when
      the canvas has data-glb (or ?glb=1 for testing), so a missing file never 404s.
      See docs/sage-3d-phase6.md "Drop-in avatar slot". Rights first, always.
   2. Procedural Sage (default), the locked v06 look (Jacob, 2026-11-22): v04 face with deep
      blue eyes, no hood, pearl-white plate with brushed-gold trim and warm light seams over a
      black under-suit (stomach, glutes and knee backs plated), bare hands, halo, small gold
      horns, full white wings from between the shoulder blades, and a floating white-and-gold
      grimoire. No aura on the avatar.
      Built here in code from primitives. No downloaded or generated model. Not based on any
      copyrighted character. Armor rules: docs/archetype-armor-standard.md. */
import * as THREE from "./vendor/three.module.min.js";
import { GLTFLoader } from "./vendor/GLTFLoader.js";

const GLB_URL = "/base/assets/sage/sage.glb";
/* Glyph meanings panel hook: keys match glyphParts below. Empty until the mapping from Sage's
   written intel is approved; nothing renders from it yet. Weapon slot is reserved. */
export const GLYPH_MEANINGS = { staff: null, armor: null, pauldrons: null, bracers: null, legArmor: null, halo: null, horns: null, crest: null, grimoire: null, wings: null, colors: null, weapon: null };
let glyphParts = null;
const SAGE_HEIGHT = 1.72;
const LAYER_KEY = "ckw-sage-layers-v1";
const LAYERS = [
  { id: "halo",  name: "halo glow",    socket: "HaloSocket" },
  { id: "wings", name: "wing light",   sockets: ["WingL", "WingR"] },
  { id: "armor", name: "armor seams",  socket: "ArmorSocket" },
  { id: "cape",  name: "aura",         socket: "CapeSocket" },
  { id: "crest", name: "crest glow",   socket: "CrestSocket" }
];

const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
const flags = {};
try { new URLSearchParams(location.search).forEach((v, k) => { flags[k] = v; }); } catch (e) {}
const LITE = window.innerWidth <= 900 || (navigator.hardwareConcurrency || 8) <= 4;

function hasWebGL() {
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") || c.getContext("webgl"));
  } catch (e) { return false; }
}

function loadUnlocked() {
  try {
    const raw = localStorage.getItem(LAYER_KEY);
    const n = raw ? JSON.parse(raw).unlocked : 0;
    return Math.max(0, Math.min(LAYERS.length, Number(n) || 0));
  } catch (e) { return 0; }
}
function saveUnlocked(n) {
  try { localStorage.setItem(LAYER_KEY, JSON.stringify({ unlocked: n })); } catch (e) {}
}

function failTo2D(why) {
  console.warn("CKW Sage 3D fallback:", why);
  const yard = document.getElementById("ckw-yard");
  if (yard) yard.hidden = true;
  if (typeof window.CKWStart2DSage === "function") window.CKWStart2DSage(flags);
}

function bone(name, parent, x, y, z) {
  const o = new THREE.Object3D();
  o.name = name;
  o.position.set(x || 0, y || 0, z || 0);
  parent.add(o);
  return o;
}

function mat(color, extra) {
  return new THREE.MeshStandardMaterial(Object.assign({ color, roughness: 0.72, metalness: 0.05 }, extra || {}));
}
function cloth(color, sheenColor, extra) {
  return new THREE.MeshPhysicalMaterial(Object.assign({
    color, roughness: 0.82, metalness: 0, sheen: 1, sheenRoughness: 0.55,
    sheenColor: new THREE.Color(sheenColor)
  }, extra || {}));
}

/* Deterministic hash noise, so folds look the same on every load. */
function hn(i) { const s = Math.sin(i * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); }

/* Lathe with cloth folds. pts: [radius, y, xScale?] bottom to top or top to bottom.
   fold(y01) gives fold depth (0 at the waist, more at the hem). */
function clothLathe(pts, opts) {
  const o = Object.assign({ seg: LITE ? 40 : 72, phiStart: 0, phiLength: Math.PI * 2, freq: 9, fold: () => 0, zScale: 0.8, sub: 3 }, opts || {});
  const path = [];
  for (let i = 0; i < pts.length - 1; i++) {
    for (let k = 0; k < o.sub; k++) {
      const t = k / o.sub, a = pts[i], b = pts[i + 1];
      const s = t * t * (3 - 2 * t);
      path.push([a[0] + (b[0] - a[0]) * s, a[1] + (b[1] - a[1]) * t, (a[2] || 1) + ((b[2] || 1) - (a[2] || 1)) * s]);
    }
  }
  const last = pts[pts.length - 1];
  path.push([last[0], last[1], last[2] || 1]);
  const ys = path.map((p) => p[1]);
  const yMin = Math.min(...ys), yMax = Math.max(...ys);
  const geo = new THREE.LatheGeometry(path.map((p) => new THREE.Vector2(Math.max(0.001, p[0]), p[1])), o.seg, o.phiStart, o.phiLength);
  const pos = geo.attributes.position;
  const v = new THREE.Vector3();
  const ph = [hn(1) * 6, hn(2) * 6, hn(3) * 6];
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    const y01 = 1 - (v.y - yMin) / Math.max(1e-6, yMax - yMin); /* 0 top, 1 bottom */
    const th = Math.atan2(v.x, v.z);
    const d = o.fold(y01);
    const wave = Math.sin(th * o.freq + ph[0] + y01 * 1.3) * 0.6 +
                 Math.sin(th * o.freq * 1.83 + ph[1] - y01 * 2.1) * 0.28 +
                 Math.sin(th * o.freq * 3.1 + ph[2]) * 0.12;
    const k = 1 + d * wave;
    /* row x-scale (shoulders wider than deep) */
    let xs = 1;
    for (let j = 0; j < path.length - 1; j++) {
      const a = path[j], b = path[j + 1];
      if ((v.y - a[1]) * (v.y - b[1]) <= 0) { const t = (v.y - a[1]) / ((b[1] - a[1]) || 1); xs = a[2] + (b[2] - a[2]) * t; break; }
    }
    pos.setXYZ(i, v.x * k * xs, v.y, v.z * k * o.zScale);
  }
  geo.computeVertexNormals();
  return geo;
}

/* Five-leaf stemless crest: five rounded leaves around a center. */
function crestGroup(material, size) {
  const g = new THREE.Group();
  const leaf = new THREE.Shape();
  leaf.moveTo(0, 0.18);
  leaf.bezierCurveTo(-0.42, 0.45, -0.46, 1.0, 0, 0.84);
  leaf.bezierCurveTo(0.46, 1.0, 0.42, 0.45, 0, 0.18);
  const geo = new THREE.ShapeGeometry(leaf, 10);
  for (let i = 0; i < 5; i++) {
    const m = new THREE.Mesh(geo, material);
    m.rotation.z = i * (Math.PI * 2 / 5);
    m.scale.setScalar(size);
    g.add(m);
  }
  const core = new THREE.Mesh(new THREE.CircleGeometry(size * 0.16, 16), material);
  core.position.z = 0.0005;
  g.add(core);
  return g;
}

function featherGeo(len, wid) {
  const s = new THREE.Shape();
  s.moveTo(0, 0);
  s.quadraticCurveTo(-wid, len * 0.45, -wid * 0.25, len);
  s.quadraticCurveTo(wid * 0.9, len * 0.55, 0, 0);
  return new THREE.ShapeGeometry(s, 6);
}

/* Sage v04 look, cyberpunk-saint knight (Jacob 2026-11-22: v04 approved; t1625u leg plates
   ride the leg bones; t1626u full-range armor for fights, jumps and runs; t1629u "cyberpunk
   knight with our saint twist, highest timeline, not the technocratic one").
   Sleek articulated plates in warm gold and pearl, thin warm light seams, black flexible
   under-suit, bare hands, original face, blonde hair, gold horns, halo, white wings, and a
   floating emerald grimoire with a gold aura. Every armor plate is parented to the bone
   it rides on, so nothing floats or slides when she moves. */
function buildStandIn() {
  const root = new THREE.Group();
  root.name = "Sage";

  const hips = bone("Hips", root, 0, 0.95, 0);
  const spine = bone("Spine", hips, 0, 0.12, 0);
  const chest = bone("Chest", spine, 0, 0.18, 0);
  const neck = bone("Neck", chest, 0, 0.17, 0.0);
  const head = bone("Head", neck, 0, 0.09, 0.01);
  const shoulderL = bone("ShoulderL", chest, 0.165, 0.1, -0.01);
  const upperArmL = bone("UpperArmL", shoulderL, 0.015, 0, 0);
  const lowerArmL = bone("LowerArmL", upperArmL, 0, -0.27, 0);
  const handL = bone("HandL", lowerArmL, 0, -0.24, 0);
  const shoulderR = bone("ShoulderR", chest, -0.165, 0.1, -0.01);
  const upperArmR = bone("UpperArmR", shoulderR, -0.015, 0, 0);
  const lowerArmR = bone("LowerArmR", upperArmR, 0, -0.27, 0);
  const handR = bone("HandR", lowerArmR, 0, -0.24, 0);
  const upperLegL = bone("UpperLegL", hips, 0.085, -0.03, 0);
  const lowerLegL = bone("LowerLegL", upperLegL, 0, -0.43, 0);
  const footL = bone("FootL", lowerLegL, 0, -0.43, 0.0);
  const upperLegR = bone("UpperLegR", hips, -0.085, -0.03, 0);
  const lowerLegR = bone("LowerLegR", upperLegR, 0, -0.43, 0);
  const footR = bone("FootR", lowerLegR, 0, -0.43, 0.0);
  const haloSock = bone("HaloSocket", head, 0, 0.215, -0.03);
  const wingL = bone("WingL", chest, 0.06, 0.08, -0.13);
  const wingR = bone("WingR", chest, -0.06, 0.08, -0.13);
  const armorSock = bone("ArmorSocket", chest, 0, 0.0, 0);
  const capeSock = bone("CapeSocket", chest, 0, 0.12, -0.02);
  const crestSock = bone("CrestSocket", chest, 0, 0.07, 0.118);

  /* Materials (v06): pearl-white plate, brushed-gold trim, soft black suit, warm light seams. */
  /* v06: pearl-white ceramic-composite plate */
  const plateMat = new THREE.MeshPhysicalMaterial({ color: 0xf4f0e8, metalness: 0.04, roughness: 0.26, clearcoat: 1, clearcoatRoughness: 0.06, sheen: 0.25, sheenColor: new THREE.Color(0xfff6e4), envMapIntensity: 1.2 });
  /* v06: brushed-gold trim */
  const trimMat = new THREE.MeshPhysicalMaterial({ color: 0xdcb46a, metalness: 0.95, roughness: 0.28, envMapIntensity: 1.6, clearcoat: 0.5, clearcoatRoughness: 0.2 });
  const suitMat = new THREE.MeshPhysicalMaterial({ color: 0x15151a, roughness: 0.55, metalness: 0.1, sheen: 0.6, sheenRoughness: 0.35, sheenColor: new THREE.Color(0x5a5560) });
  const seamMat = new THREE.MeshStandardMaterial({ color: 0xfff0c8, emissive: 0xffc870, emissiveIntensity: 1.8, roughness: 0.4 });
  const skinMat = new THREE.MeshPhysicalMaterial({
    color: 0xd9a88c, roughness: 0.52, metalness: 0, sheen: 0.35, sheenRoughness: 0.5,
    sheenColor: new THREE.Color(0xff9e88), clearcoat: 0.06, clearcoatRoughness: 0.6
  });
  const hairMat = new THREE.MeshPhysicalMaterial({ color: 0xe8c47e, roughness: 0.45, metalness: 0, sheen: 1, sheenRoughness: 0.3, sheenColor: new THREE.Color(0xffe2a8), side: THREE.DoubleSide });
  const featherMat = cloth(0xf4f1ea, 0xffffff, { side: THREE.DoubleSide, roughness: 0.7, emissive: 0x000000 });
  const haloMat = new THREE.MeshStandardMaterial({ color: 0xfff0c0, emissive: 0xffd27a, emissiveIntensity: 2.2, roughness: 0.3 });

  function mesh(geo, material, parent, px, py, pz) {
    const m = new THREE.Mesh(geo, material);
    m.castShadow = true;
    m.receiveShadow = true;
    m.position.set(px || 0, py || 0, pz || 0);
    parent.add(m);
    return m;
  }
  /* A curved armor plate: a slice of a tapered tube, wrapped around a limb axis (local Y). */
  function plate(parent, mat, rTop, rBot, h, arcStart, arcLen, px, py, pz, segs) {
    const g = new THREE.CylinderGeometry(rTop, rBot, h, segs || 24, 3, true, arcStart, arcLen);
    const p = g.attributes.position, v = new THREE.Vector3();
    for (let i = 0; i < p.count; i++) { /* gentle belly so plates read as formed metal */
      v.fromBufferAttribute(p, i);
      const t = 1 - Math.pow((v.y / (h / 2)), 2);
      const k = 1 + t * 0.06;
      p.setXYZ(i, v.x * k, v.y, v.z * k);
    }
    g.computeVertexNormals();
    const m = mesh(g, mat, parent, px, py, pz);
    m.material = mat;
    if (mat === plateMat || mat === trimMat) m.material.side = THREE.DoubleSide;
    return m;
  }
  /* A thin glowing seam ring around a limb or plate edge. */
  function seam(parent, r, px, py, pz, arc, rx, sx, sz) {
    const m = mesh(new THREE.TorusGeometry(r, 0.0022, 4, 40, arc || Math.PI * 2), seamMat, parent, px, py, pz);
    m.rotation.x = rx == null ? Math.PI / 2 : rx;
    m.scale.set(sx || 1, sz || 1, 1);
    m.castShadow = false;
    return m;
  }
  plateMat.side = THREE.DoubleSide; trimMat.side = THREE.DoubleSide;

  /* ---------- Body under-suit ---------- */
  mesh(clothLathe([
    [0.118, -0.14, 1.0], [0.11, -0.02, 1.02], [0.125, 0.08, 1.1], [0.14, 0.16, 1.14],
    [0.145, 0.23, 1.22], [0.135, 0.28, 1.3], [0.095, 0.32, 1.22], [0.05, 0.36, 1.0], [0.045, 0.42, 1.0]
  ], { freq: 5, fold: () => 0.0, zScale: 0.74, sub: 2 }), suitMat, spine);
  const pelvis = mesh(new THREE.SphereGeometry(0.15, 28, 18), suitMat, hips, 0, -0.02, 0);
  pelvis.scale.set(1.0, 0.72, 0.74);
  [[upperLegL, 1], [upperLegR, -1]].forEach(([b]) => {
    mesh(new THREE.CapsuleGeometry(0.072, 0.3, 6, 18), suitMat, b, 0, -0.2, 0).scale.set(1, 1, 0.95);
  });
  [lowerLegL, lowerLegR].forEach((b) => mesh(new THREE.CapsuleGeometry(0.052, 0.32, 6, 16), suitMat, b, 0, -0.2, -0.005));
  [upperArmL, upperArmR].forEach((b) => mesh(new THREE.CapsuleGeometry(0.043, 0.2, 6, 16), suitMat, b, 0, -0.13, 0));
  [lowerArmL, lowerArmR].forEach((b) => mesh(new THREE.CapsuleGeometry(0.035, 0.18, 6, 14), suitMat, b, 0, -0.11, 0));

  /* ---------- Torso armor (rides Chest/Spine) ---------- */
  const armor = new THREE.Group();
  armor.name = "ArmorPlate";
  armor.userData.mat = plateMat;
  armorSock.add(armor);
  /* breastplate: two sculpted halves with a center ridge, open at the sides for the arms */
  const bp = clothLathe([[0.122, -0.06, 1.05], [0.142, 0.02, 1.12], [0.152, 0.1, 1.18], [0.148, 0.16, 1.24], [0.118, 0.2, 1.24], [0.08, 0.225, 1.1]],
    { phiStart: -1.35, phiLength: 2.7, freq: 2, fold: () => 0, zScale: 0.84, seg: 48, sub: 3 });
  const breast = mesh(bp, plateMat, chest, 0, -0.02, 0.004);
  breast.scale.set(0.95, 1, 1.04);
  const ridge = mesh(new THREE.BoxGeometry(0.008, 0.2, 0.01), trimMat, chest, 0, 0.06, 0.142);
  ridge.rotation.x = -0.12;
  seam(chest, 0.15, 0, -0.07, 0.0, Math.PI * 0.86, Math.PI / 2, 1.06, 0.86).rotation.z = Math.PI * 0.07;
  /* abdomen: three overlapping lames that can flex when she bends or jumps */
  for (let i = 0; i < 3; i++) {
    const lame = mesh(clothLathe([[0.12 - i * 0.004, 0.0, 1.03], [0.124 - i * 0.004, -0.04]], { phiStart: -1.35, phiLength: 2.7, fold: () => 0, zScale: 0.8, seg: 32, sub: 2 }),
      plateMat, spine, 0, 0.1 - i * 0.045, 0.006);
    lame.scale.set(1.05, 1, 1.08);
  }
  seam(spine, 0.12, 0, 0.012, 0.006, Math.PI * 0.66, Math.PI / 2, 1.05, 0.86).rotation.z = Math.PI * 0.17;
  /* v06: back lames over the lower back (ride the Spine), so the middle is covered all round */
  for (let i = 0; i < 2; i++) {
    const bl = mesh(clothLathe([[0.122 - i * 0.004, 0.0, 1.03], [0.126 - i * 0.004, -0.05]], { phiStart: Math.PI - 1.25, phiLength: 2.5, fold: () => 0, zScale: 0.8, seg: 28, sub: 2 }), plateMat, spine, 0, 0.14 - i * 0.055, -0.004);
    bl.scale.set(1.05, 1, 1.08);
  }
  /* back plate */
  mesh(clothLathe([[0.12, -0.02, 1.05], [0.146, 0.1, 1.2], [0.12, 0.2, 1.22]], { phiStart: Math.PI - 1.2, phiLength: 2.4, fold: () => 0, zScale: 0.8, seg: 32, sub: 3 }), plateMat, chest, 0, -0.02, -0.004);
  /* high collar with a light seam */
  const collar = mesh(new THREE.CylinderGeometry(0.056, 0.07, 0.07, 28, 1, true), suitMat, neck, 0, -0.005, 0);
  collar.material = suitMat;
  seam(neck, 0.057, 0, 0.028, 0.0);
  /* hip plate and belt line */
  mesh(clothLathe([[0.15, 0.03, 1.02], [0.158, -0.04, 1.02]], { fold: () => 0, zScale: 0.76, seg: 48, sub: 2 }), plateMat, hips, 0, 0.02, 0);
  seam(hips, 0.151, 0, 0.055, 0, Math.PI * 2, Math.PI / 2, 1.0, 0.76);

  /* ---------- Crest on the chest (always on; layer 5 makes it glow) ---------- */
  const crestMat = new THREE.MeshStandardMaterial({ color: 0xffe2a0, emissive: 0xe8a840, emissiveIntensity: 0.6, metalness: 0.6, roughness: 0.3, side: THREE.DoubleSide });
  const crestDisc = mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.008, 32), trimMat, crestSock, 0, 0, -0.002);
  crestDisc.rotation.x = Math.PI / 2;
  const crest = crestGroup(crestMat, 0.022);
  crest.name = "Crest";
  crest.position.z = 0.0045;
  crest.userData.mat = crestMat;
  crestSock.add(crest);
  seam(crestSock, 0.031, 0, 0, 0.003, Math.PI * 2, 0);

  /* ---------- Shoulders: layered pauldrons on the arm bone (they lift with the arm) ---------- */
  [[upperArmL, 1], [upperArmR, -1]].forEach(([b, s]) => {
    for (let i = 0; i < 3; i++) {
      const cap = mesh(new THREE.SphereGeometry(0.088 - i * 0.008, 28, 14, 0, Math.PI * 2, 0, Math.PI * (0.42 - i * 0.04)),
        i === 1 ? trimMat : plateMat, b, s * (0.008 + i * 0.012), 0.04 - i * 0.045, 0);
      cap.scale.set(1.0, 0.78, 0.94);
      cap.rotation.z = s * (-0.25 - i * 0.12);
    }
    seam(b, 0.07, s * 0.02, -0.035, 0, Math.PI * 2, Math.PI / 2 + s * 0.3, 1, 0.9).rotation.y = 0;
  });

  /* ---------- Arms: bracers on the forearm, couter on the elbow, bare hands ---------- */
  [[upperArmL, lowerArmL, handL, 1], [upperArmR, lowerArmR, handR, -1]].forEach(([ua, la, hand, side]) => {
    plate(la, plateMat, 0.041, 0.037, 0.15, 0, Math.PI * 2, 0, -0.14, 0, 28);
    seam(la, 0.043, 0, -0.07, 0);
    seam(la, 0.039, 0, -0.205, 0);
    const insert = plate(la, trimMat, 0.0425, 0.0385, 0.08, -0.6, 1.2, 0, -0.14, 0, 16);
    insert.scale.set(1.02, 1, 1.02);
    const elbow = mesh(new THREE.SphereGeometry(0.04, 20, 12, 0, Math.PI * 2, 0, Math.PI * 0.5), plateMat, la, 0, 0.0, -0.012);
    elbow.rotation.x = -Math.PI / 2 - 0.3; elbow.scale.set(1, 1, 0.6);
    mesh(new THREE.CylinderGeometry(0.022, 0.026, 0.06, 12), skinMat, la, 0, -0.23, 0);
    const palm = mesh(new THREE.SphereGeometry(0.038, 18, 12), skinMat, hand, 0, -0.028, 0);
    palm.scale.set(0.98, 1.2, 0.46);
    const seg = LITE ? 6 : 10;
    for (let f = 0; f < 4; f++) {
      const len = [0.054, 0.062, 0.058, 0.046][f];
      const rad = [0.0078, 0.008, 0.0076, 0.0068][f];
      const base = new THREE.Object3D();
      base.position.set(side * (-0.021 + f * 0.0142), -0.068, 0.003);
      base.rotation.set(0.18 + f * 0.04, 0, side * (f - 1.5) * 0.05);
      hand.add(base);
      const p1 = len * 0.55, p2 = len * 0.45;
      mesh(new THREE.CapsuleGeometry(rad, p1, 4, seg), skinMat, base, 0, -p1 / 2, 0);
      mesh(new THREE.SphereGeometry(rad * 1.12, 10, 8), skinMat, base, 0, 0, 0);
      const mid = new THREE.Object3D(); mid.position.y = -p1; mid.rotation.x = 0.28; base.add(mid);
      mesh(new THREE.SphereGeometry(rad * 1.04, 10, 8), skinMat, mid, 0, 0, 0);
      mesh(new THREE.CapsuleGeometry(rad * 0.88, p2, 4, seg), skinMat, mid, 0, -p2 / 2, 0);
    }
    const tb = new THREE.Object3D(); tb.position.set(side * -0.031, -0.028, 0.013); tb.rotation.set(0.3, 0, side * -0.55); hand.add(tb);
    mesh(new THREE.CapsuleGeometry(0.0095, 0.026, 4, seg), skinMat, tb, 0, -0.013, 0);
    const tbm = new THREE.Object3D(); tbm.position.y = -0.028; tbm.rotation.x = 0.2; tb.add(tbm);
    mesh(new THREE.CapsuleGeometry(0.0085, 0.022, 4, seg), skinMat, tbm, 0, -0.011, 0);
  });

  /* ---------- Legs: every plate rides its own bone (t1625u) ---------- */
  const legParts = [];
  [[upperLegL, lowerLegL, footL, 1], [upperLegR, lowerLegR, footR, -1]].forEach(([ul, ll, ft, s]) => {
    /* tassets: two lames hinged at the hip line, parented to the THIGH, front and outside */
    const t1 = plate(ul, plateMat, 0.098, 0.104, 0.12, s > 0 ? -0.35 : -1.05, 1.4, 0, -0.05, 0.005, 24);
    const t2 = plate(ul, trimMat, 0.1, 0.104, 0.07, s > 0 ? -0.3 : -1.0, 1.3, 0, -0.135, 0.005, 20);
    seam(ul, 0.099, 0, -0.105, 0.005, 1.3, Math.PI / 2).rotation.z = s > 0 ? -0.3 : Math.PI + 0.3 - 1.3 + 1.3;
    t1.name = s > 0 ? "TassetL" : "TassetR"; t2.name = t1.name + "2";
    /* cuisse on the thigh */
    plate(ul, plateMat, 0.08, 0.07, 0.17, -1.0, 2.0, 0, -0.29, 0.0, 24);
    /* poleyn (knee) on the SHIN bone top, so it bends with the knee */
    const knee = mesh(new THREE.SphereGeometry(0.05, 24, 14, 0, Math.PI * 2, 0, Math.PI * 0.55), plateMat, ll, 0, 0.0, 0.03);
    knee.rotation.x = Math.PI / 2 - 0.15; knee.scale.set(1, 1, 0.55);
    seam(ll, 0.034, 0, 0.0, 0.054, Math.PI * 2, 0);
    /* greave wraps the SHIN */
    const gr = plate(ll, plateMat, 0.06, 0.05, 0.3, -1.25, 2.5, 0, -0.21, 0.004, 28);
    gr.name = s > 0 ? "GreaveL" : "GreaveR";
    plate(ll, trimMat, 0.0615, 0.0515, 0.18, -0.35, 0.7, 0, -0.2, 0.004, 12);
    seam(ll, 0.057, 0, -0.07, 0.004, 2.5, Math.PI / 2).rotation.z = 0;
    /* sabaton on the FOOT */
    const sb = mesh(new THREE.SphereGeometry(0.05, 20, 12), plateMat, ft, 0, -0.035, 0.045);
    sb.scale.set(0.82, 0.6, 1.75);
    const heel = mesh(new THREE.CylinderGeometry(0.045, 0.05, 0.05, 16), plateMat, ft, 0, -0.035, -0.01);
    heel.castShadow = true;
    seam(ft, 0.05, 0, -0.012, 0.02, Math.PI * 2, Math.PI / 2, 0.84, 1.6);
    /* v06: plate over the glutes (rides the THIGH) and a knee-back lame (rides the SHIN) */
    const glute = plate(ul, plateMat, 0.088, 0.098, 0.15, Math.PI - 1.0, 2.0, 0, -0.06, -0.012, 24);
    glute.name = s > 0 ? "GluteL" : "GluteR";
    seam(ul, 0.093, 0, -0.135, -0.012, 1.6, Math.PI / 2).rotation.z = Math.PI / 2 + 0.8;
    const kb = plate(ll, plateMat, 0.054, 0.056, 0.07, Math.PI - 0.9, 1.8, 0, -0.06, -0.004, 16);
    kb.name = s > 0 ? "KneeBackL" : "KneeBackR";
    /* v06 back of the leg: thigh and calf plates (each on its own bone) */
    plate(ul, plateMat, 0.076, 0.066, 0.17, Math.PI - 1.1, 2.2, 0, -0.29, -0.002, 20).name = s > 0 ? "CuisseBackL" : "CuisseBackR";
    plate(ll, plateMat, 0.058, 0.047, 0.24, Math.PI - 1.2, 2.4, 0, -0.24, -0.004, 20).name = s > 0 ? "CalfL" : "CalfR";
    seam(ll, 0.055, 0, -0.12, -0.004, 2.4, Math.PI / 2).rotation.z = Math.PI / 2 + 1.2;
    legParts.push(t1, t2, gr, glute, kb);
  });

  /* ---------- Head: original face, blonde hair, gold horns ---------- */
  mesh(new THREE.CylinderGeometry(0.038, 0.045, 0.09, 16), skinMat, neck, 0, 0.05, 0.004);
  const headGeo = new THREE.SphereGeometry(0.092, 44, 34);
  {
    const p = headGeo.attributes.position, v = new THREE.Vector3();
    for (let i = 0; i < p.count; i++) {
      v.fromBufferAttribute(p, i);
      const low = Math.max(0, -v.y / 0.092), front = Math.max(0, v.z / 0.092);
      v.x *= 1 - low * 0.36;
      if (v.y < 0) v.y *= 1 + front * 0.18;
      v.z += front * low * 0.016;
      if (v.y > -0.03 && v.y < 0.01) v.x *= 1.02;
      p.setXYZ(i, v.x, v.y, v.z);
    }
    headGeo.computeVertexNormals();
  }
  const headMesh = mesh(headGeo, skinMat, head, 0, 0.05, 0);
  headMesh.scale.set(0.88, 1.04, 0.98);
  headMesh.name = "HeadSkin";
  /* soft features only: brow, nose bridge, lips, deep blue eyes, subtle rainbow cheek glints */
  const nose = mesh(new THREE.CapsuleGeometry(0.008, 0.026, 4, 8), skinMat, head, 0, 0.036, 0.087);
  nose.rotation.x = -0.25;
  const lipMat = new THREE.MeshPhysicalMaterial({ color: 0xb8706a, roughness: 0.4, clearcoat: 0.3 });
  const lip = mesh(new THREE.CapsuleGeometry(0.006, 0.022, 4, 8), lipMat, head, 0, 0.008, 0.08);
  lip.rotation.z = Math.PI / 2; lip.scale.set(1, 1, 0.6);
  const eyeWhite = new THREE.MeshPhysicalMaterial({ color: 0xf2eee8, roughness: 0.15, clearcoat: 1 });
  const iris = new THREE.MeshStandardMaterial({ color: 0x1b3a8f, emissive: 0x0b1f5c, emissiveIntensity: 0.35, roughness: 0.18 /* deep blue (Jacob, 2026-11-22) */ });
  const browMat = new THREE.MeshStandardMaterial({ color: 0x8a6438, roughness: 0.7 });
  const glintMat = new THREE.MeshStandardMaterial({ color: 0xf4f0ff, emissive: 0xc8d8ff, emissiveIntensity: 0.3, transparent: true, opacity: 0.45 }); /* subtle rainbow glints */
  [1, -1].forEach((s) => {
    const e = mesh(new THREE.SphereGeometry(0.0135, 16, 12), eyeWhite, head, s * 0.03, 0.058, 0.07);
    e.scale.set(1.25, 0.7, 0.6);
    const ir = mesh(new THREE.CircleGeometry(0.0072, 16), iris, head, s * 0.03, 0.058, 0.0772);
    ir.castShadow = false;
    const pu = mesh(new THREE.CircleGeometry(0.003, 12), new THREE.MeshBasicMaterial({ color: 0x0a0a10 }), head, s * 0.03, 0.058, 0.0775);
    pu.castShadow = false;
    const br = mesh(new THREE.CapsuleGeometry(0.0028, 0.024, 3, 6), browMat, head, s * 0.031, 0.077, 0.073);
    br.rotation.z = Math.PI / 2 + s * 0.12;
    const cg = mesh(new THREE.CircleGeometry(0.0028, 6), glintMat, head, s * 0.047, 0.03, 0.071);
    cg.rotation.y = s * 0.55; cg.castShadow = false;
  });
  /* hair: crown cap, long wavy back fall, and side locks over the shoulders */
  const cap = mesh(new THREE.SphereGeometry(0.1, 36, 24, 0, Math.PI * 2, 0, Math.PI * 0.5), hairMat, head, 0, 0.058, -0.014);
  cap.scale.set(0.9, 1.08, 1.02);
  cap.rotation.x = -0.42; /* hairline sits back so the forehead and eyes show */
  const fall = mesh(clothLathe([[0.085, 0.08, 1.0], [0.1, 0.0, 1.05], [0.12, -0.12, 1.25], [0.15, -0.3, 1.4], [0.16, -0.42, 1.45]],
    { phiStart: Math.PI / 2 + 0.75, phiLength: Math.PI * 2 - 1.5, freq: 14, fold: (y) => 0.03 + y * 0.12, zScale: 0.75, seg: 56 }), hairMat, head, 0, 0.05, -0.015);
  fall.name = "Hair";
  [1, -1].forEach((s) => {
    const lock = mesh(clothLathe([[0.026, 0.0], [0.03, -0.12], [0.034, -0.24], [0.018, -0.3]], { freq: 5, fold: (y) => 0.1 * y, zScale: 0.5, seg: 18 }), hairMat, head, s * 0.072, 0.06, 0.03);
    lock.rotation.z = s * 0.12;
  });
  /* horns: tapered and curving up-and-in, warm gold */
  [1, -1].forEach((s) => {
    const hg = new THREE.ConeGeometry(0.014, 0.12, 14, 10);
    const p = hg.attributes.position, v = new THREE.Vector3();
    for (let i = 0; i < p.count; i++) {
      v.fromBufferAttribute(p, i);
      const t = (v.y + 0.06) / 0.12;
      v.x += s * (0.035 * Math.sin(t * Math.PI * 0.55) - 0.03 * t * t * t);
      v.z -= 0.012 * t;
      p.setXYZ(i, v.x, v.y, v.z);
    }
    hg.computeVertexNormals();
    const h = mesh(hg, trimMat, head, s * 0.046, 0.16, -0.006);
    h.rotation.z = s * -0.18;
    h.scale.setScalar(0.72); /* v06: small gold horns */
  });

  /* ---------- Halo ---------- */
  const halo = mesh(new THREE.TorusGeometry(0.15, 0.0055, 8, 72), haloMat, haloSock, 0, 0, 0);
  halo.rotation.x = Math.PI / 2 - 0.12;
  halo.castShadow = false;
  halo.name = "Halo";

  /* ---------- Wings (v06): full white wings growing from between the shoulder blades ----------
     Built on the WingL/WingR bones behind the back plate. Smooth layered rows: scapulars and
     coverts near the root, secondaries, and long primaries whose tips reach below the knees.
     Feathers are rounded, cupped and slightly varied so the wing reads as one soft shape. */
  const featherMat2 = cloth(0xe9e5dd, 0xffffff, { side: THREE.DoubleSide, roughness: 0.75 });
  function softFeather(len, wid) {
    const sh = new THREE.Shape();
    sh.moveTo(-wid * 0.25, 0);
    sh.quadraticCurveTo(-wid, len * 0.5, -wid * 0.6, len * 0.9);
    sh.quadraticCurveTo(-wid * 0.1, len * 1.04, wid * 0.45, len * 0.92);
    sh.quadraticCurveTo(wid * 0.85, len * 0.5, wid * 0.25, 0);
    sh.lineTo(-wid * 0.25, 0);
    const g = new THREE.ShapeGeometry(sh, 8);
    const p = g.attributes.position;
    for (let k = 0; k < p.count; k++) {
      const x = p.getX(k), y = p.getY(k);
      p.setZ(k, -0.35 * x * x / Math.max(wid, 0.001) + 0.04 * len * Math.pow(y / len, 2));
    }
    g.computeVertexNormals();
    return g;
  }
  function makeWing(sock, side) {
    const g = new THREE.Group();
    g.name = side > 0 ? "WingMeshL" : "WingMeshR";
    g.rotation.y = side * 0.42; /* swept back from the shoulder blades */
    const n = LITE ? 18 : 30;
    /* leading edge: up and out from the root, then over and down toward the tip */
    const edge = (t) => new THREE.Vector3(side * (0.05 + 0.64 * t), 0.02 + 0.44 * Math.sin(Math.min(1, t * 1.35) * Math.PI * 0.5) - 0.2 * Math.max(0, t - 0.6), -0.01 - 0.05 * t);
    const rows = [
      /* [length scale, width, z offset, material, length curve] */
      [1.0, 0.07, 0.0, featherMat2, (t) => 0.14 + 1.12 * Math.pow(t, 0.85)],
      [0.62, 0.075, -0.012, featherMat, (t) => 0.22 + 0.85 * t],
      [0.36, 0.07, -0.024, featherMat, (t) => 0.4 + 0.55 * t],
      [0.18, 0.06, -0.034, featherMat, () => 0.8]
    ];
    rows.forEach(([scale, wid, dz, fm, curve], row) => {
      const cnt = row === 3 ? Math.round(n * 0.8) : n;
      for (let i = 0; i < cnt; i++) {
        const t = i / (cnt - 1);
        const e = edge(t);
        const len = scale * curve(t) * (0.94 + 0.12 * hn(i * 3.7 + row * 11));
        const f = new THREE.Mesh(softFeather(len, wid * (1.1 + t * 0.4)), fm);
        f.position.set(e.x, e.y - row * 0.012, e.z + dz);
        f.rotation.set(0.04, side * 0.12, Math.PI + side * (0.5 * (1 - t) + t * 0.3 + row * 0.02)); /* inner feathers angle outward so the back shows */
        f.castShadow = row < 2;
        f.receiveShadow = true;
        g.add(f);
      }
    });
    /* the wing's arm: a smooth covert band along the leading edge that hides the feather roots */
    const pts = [];
    for (let k = 0; k <= 24; k++) { const e = edge(k / 24); pts.push(new THREE.Vector3(e.x, e.y, e.z - 0.04)); }
    const arm = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 48, 0.03, 10, false), featherMat);
    arm.scale.set(1, 1, 0.55);
    arm.castShadow = true;
    g.add(arm);
    sock.add(g);
    return g;
  }
  const wingMeshL = makeWing(wingL, 1);
  const wingMeshR = makeWing(wingR, -1);

  /* ---------- Floating grimoire (v06: white leather and gold, five-leaf crest, no chain) ---------- */
  const book = new THREE.Group();
  book.name = "Book";
  const coverMat = new THREE.MeshPhysicalMaterial({ color: 0xf2ede3, roughness: 0.42, sheen: 0.4, sheenColor: new THREE.Color(0xfff2d8), clearcoat: 0.25 });
  const pagesMat = mat(0xefe2c0, { roughness: 0.95 });
  mesh(new THREE.BoxGeometry(0.2, 0.27, 0.012), coverMat, book, 0, 0, 0.026);
  mesh(new THREE.BoxGeometry(0.2, 0.27, 0.012), coverMat, book, 0, 0, -0.026);
  mesh(new THREE.BoxGeometry(0.19, 0.258, 0.042), pagesMat, book, 0.004, 0, 0);
  mesh(new THREE.BoxGeometry(0.016, 0.27, 0.064), coverMat, book, -0.1, 0, 0);
  [-0.09, -0.03, 0.03, 0.09].forEach((y) => mesh(new THREE.BoxGeometry(0.019, 0.008, 0.066), trimMat, book, -0.1, y, 0));
  [[1, 1], [1, -1], [-1, 1], [-1, -1]].forEach(([sx, sy]) => {
    const c = mesh(new THREE.BoxGeometry(0.04, 0.04, 0.068), trimMat, book, sx * 0.082, sy * 0.117, 0);
    c.scale.set(1, 1, 1);
  });
  const medal = mesh(new THREE.CylinderGeometry(0.048, 0.048, 0.006, 40), trimMat, book, 0.005, 0, 0.033);
  medal.rotation.x = Math.PI / 2;
  [[0, 0.118, 0.17, 0.005], [0, -0.118, 0.17, 0.005], [0.083, 0, 0.005, 0.23], [-0.072, 0, 0.005, 0.23]].forEach(([x, y, w, h]) => {
    mesh(new THREE.BoxGeometry(w, h, 0.002), trimMat, book, x, y, 0.033);
    mesh(new THREE.BoxGeometry(w, h, 0.002), trimMat, book, x, y, -0.033);
  });
  const glowMat = new THREE.MeshStandardMaterial({ color: 0xffe7a8, emissive: 0xffb84a, emissiveIntensity: 1.4, roughness: 0.4, side: THREE.DoubleSide });
  const bookCrest = crestGroup(glowMat, 0.038);
  bookCrest.position.set(0.005, 0, 0.037);
  book.add(bookCrest);
  const page = new THREE.Object3D(); page.name = "Page"; book.add(page);
  const bookLight = new THREE.PointLight(0xffd690, 0.3, 1.0, 2);
  bookLight.position.set(0, 0, 0.15);
  book.add(bookLight);
  /* gold aura: a soft additive glow and a ring of drifting sparks */
  const auraTex = glowTexture();
  const bookAura = new THREE.Sprite(new THREE.SpriteMaterial({ map: auraTex, color: 0xffcf7a, transparent: true, opacity: 0.55, depthWrite: false, blending: THREE.AdditiveBlending }));
  bookAura.scale.set(0.55, 0.55, 1);
  book.add(bookAura);
  bookAura.visible = false; /* v06: no aura on the avatar */
  const sparks = makeSparks(LITE ? 24 : 48, 0.22);
  book.add(sparks);
  sparks.visible = false;
  const bookHolder = new THREE.Group();
  bookHolder.name = "BookFloat";
  bookHolder.position.set(0.52, 1.12, 0.12);
  bookHolder.add(book);
  book.rotation.set(0.05, -0.35, 0.08);
  root.add(bookHolder);

  /* body aura: faint warm rim around her */
  const bodyAura = new THREE.Sprite(new THREE.SpriteMaterial({ map: auraTex, color: 0xffd890, transparent: true, opacity: 0.16, depthWrite: false, blending: THREE.AdditiveBlending }));
  bodyAura.scale.set(1.5, 2.3, 1);
  bodyAura.position.set(0, 1.0, -0.2);
  root.add(bodyAura);
  bodyAura.visible = false;

  /* Crystal prism staff (glyph upgrade, off by default): StaffSocket under HandR per the shared skeleton standard */
  const staffSock = bone("StaffSocket", handR, 0, -0.06, 0.02);
  const staff = new THREE.Group(); staff.name = "Staff"; staff.visible = false;
  mesh(new THREE.CylinderGeometry(0.011, 0.013, 1.5, 12), trimMat, staff, 0, 0.2, 0);
  const prismMat = new THREE.MeshPhysicalMaterial({ color: 0xf4f8ff, roughness: 0.05, metalness: 0, transparent: true, opacity: 0.72, iridescence: 1, iridescenceIOR: 1.6, clearcoat: 1, emissive: 0x9ab8ff, emissiveIntensity: 0.25 });
  const prism = mesh(new THREE.OctahedronGeometry(0.06, 0), prismMat, staff, 0, 1.0, 0);
  prism.scale.set(0.8, 1.6, 0.8);
  mesh(new THREE.TorusGeometry(0.035, 0.005, 6, 24), trimMat, staff, 0, 0.93, 0).rotation.x = Math.PI / 2;
  staffSock.add(staff);
  root.userData.parts = { halo, armor, crest, crestMat, book, bookHolder, page, wingL, wingR, wingMeshL, wingMeshR, bookLight, glowMat, bookAura, bodyAura, sparks, seamMat, legParts, featherMat, coverMat, staff, prism, seamBase: 1.8 };
  /* Glyph hook: every piece carries a meaning drawn from Sage's written intel (Jacob, 2026-11-22).
     Meanings are mapped by a separate sheet run and are NOT invented here; a later "glyph meanings"
     panel fills GLYPH_MEANINGS[key] and reads these part keys. */
  glyphParts = { armor, pauldrons: [upperArmL, upperArmR], bracers: [lowerArmL, lowerArmR], legArmor: legParts,
    halo, horns: head, crest, grimoire: book, wings: [wingL, wingR], staff, colors: { plateMat, trimMat, suitMat, seamMat } };
  return root;
}

function glowTexture() {
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const g = c.getContext("2d");
  const r = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  r.addColorStop(0, "rgba(255,255,255,1)");
  r.addColorStop(0.25, "rgba(255,240,200,0.55)");
  r.addColorStop(0.6, "rgba(255,210,140,0.15)");
  r.addColorStop(1, "rgba(255,200,120,0)");
  g.fillStyle = r;
  g.fillRect(0, 0, 128, 128);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function makeSparks(count, radius) {
  const geo = new THREE.BufferGeometry();
  const pos = new Float32Array(count * 3), seed = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    const a = hn(i * 4.1) * Math.PI * 2, r = radius * (0.5 + hn(i * 2.7) * 0.7);
    pos[i * 3] = Math.cos(a) * r; pos[i * 3 + 1] = (hn(i * 6.3) - 0.5) * radius * 1.6; pos[i * 3 + 2] = Math.sin(a) * r * 0.6;
    seed[i] = hn(i * 8.8);
  }
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  const p = new THREE.Points(geo, new THREE.PointsMaterial({ color: 0xffd98a, size: 0.012, transparent: true, opacity: 0.9, depthWrite: false, blending: THREE.AdditiveBlending }));
  p.userData.seed = seed;
  p.userData.base = pos.slice();
  return p;
}

/* Webverse glyph upgrades (playtest picks). Procedural Sage only; a GLB ignores what it lacks. */
const SEAM_TIERS = { proven: 3.0, claimed: 1.8, reported: 1.0, unknown: 0.45 };
function applyUpgrade(root, key, val) {
  const parts = (root && root.userData.parts) || {};
  if (key === "seams" && SEAM_TIERS[val] != null) {
    parts.seamBase = SEAM_TIERS[val];
    if (parts.seamMat) parts.seamMat.emissive.setHex(val === "reported" ? 0xfff4e0 : 0xffc870);
  } else if (key === "staff" && parts.staff) {
    parts.staff.visible = val === "prism";
  } else if (key === "grimoire" && parts.coverMat) {
    parts.coverMat.color.setHex(val === "emerald" ? 0x0e5a42 : 0xf2ede3);
    parts.coverMat.sheenColor.setHex(val === "emerald" ? 0x6ac8a0 : 0xfff2d8);
  } else if (key === "halo" && parts.halo) {
    parts.halo.scale.setScalar(val === "wide" ? 1.25 : 1);
    parts.halo.material.emissiveIntensity = val === "wide" ? 3.0 : 2.2;
  } else if (key === "wings" && parts.wingMeshL) {
    const fold = val === "folded";
    [[parts.wingMeshL, 1], [parts.wingMeshR, -1]].forEach(([w, sd]) => { w.rotation.y = sd * (fold ? 1.2 : 0.42); w.scale.x = fold ? 0.7 : 1; });
  } else return false;
  return true;
}

/* Talking to Sage still unlocks five looks; on v04 they brighten what she already wears. */
function applyAttachments(root, unlocked) {
  const parts = root.userData.parts || {};
  if (parts.halo) {
    parts.halo.visible = true;
    if (parts.halo.material) parts.halo.material.emissiveIntensity = unlocked >= 1 ? 3.2 : 2.0;
  }
  if (parts.wingL) parts.wingL.visible = true;
  if (parts.wingR) parts.wingR.visible = true;
  if (parts.featherMat) parts.featherMat.emissive.setHex(unlocked >= 2 ? 0x3a3020 : 0x000000);
  if (parts.armor && parts.armor.userData.mat) parts.armor.userData.mat.sheen = unlocked >= 3 ? 0.6 : 0.25;
  if (parts.bookLight) parts.bookLight.userData.boost = unlocked >= 4 ? 0.25 : 0;
  if (parts.crestMat) parts.crestMat.emissiveIntensity = unlocked >= 5 ? 2.2 : 0.6;
  const status = document.getElementById("layer-status");
  if (status) {
    status.textContent = unlocked <= 0 ? "Look: default" : "Look: " + LAYERS.slice(0, unlocked).map((L) => L.name).join(", ");
  }
}

function findBones(root) {
  const map = {};
  root.traverse((o) => { if (o.name && !map[o.name]) map[o.name] = o; });
  /* GLB rigs name bones differently (mixamorig:Head, head, Head_01...). Map the ones we drive. */
  if (!map.Head) root.traverse((o) => { if (!map.Head && o.isBone && /(^|[:_])head($|[_0-9])/i.test(o.name)) map.Head = o; });
  return map;
}

/* Soft studio-like light probe built in code (no HDR file to download). */
function makeEnvironment(renderer) {
  const envScene = new THREE.Scene();
  const geo = new THREE.SphereGeometry(10, 32, 16);
  const cols = [];
  const p = geo.attributes.position;
  const top = new THREE.Color(0x26304a), mid = new THREE.Color(0x15151c), bot = new THREE.Color(0x2a1d10), warm = new THREE.Color(0xffc26a);
  const c = new THREE.Color();
  for (let i = 0; i < p.count; i++) {
    const y = p.getY(i) / 10, x = p.getX(i) / 10, z = p.getZ(i) / 10;
    if (y > 0) c.copy(mid).lerp(top, y); else c.copy(mid).lerp(bot, -y);
    const w = Math.max(0, (z * 0.7 + x * -0.3 - 0.4)) * 1.6;
    c.lerp(warm, Math.min(0.6, w * Math.max(0, 0.6 - Math.abs(y))));
    cols.push(c.r, c.g, c.b);
  }
  geo.setAttribute("color", new THREE.Float32BufferAttribute(cols, 3));
  envScene.add(new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide })));
  const pm = new THREE.PMREMGenerator(renderer);
  const rt = pm.fromScene(envScene, 0.04);
  pm.dispose();
  return rt.texture;
}

function makeMotes(count) {
  const geo = new THREE.BufferGeometry();
  const pos = new Float32Array(count * 3), seed = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    const a = hn(i * 3.1) * Math.PI * 2, r = 0.4 + hn(i * 7.7) * 2.6;
    pos[i * 3] = Math.cos(a) * r; pos[i * 3 + 1] = hn(i * 5.3) * 2.6; pos[i * 3 + 2] = Math.sin(a) * r;
    seed[i] = hn(i * 9.9);
  }
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  const m = new THREE.PointsMaterial({ color: 0xffd98a, size: 0.022, transparent: true, opacity: 0.55, depthWrite: false, blending: THREE.AdditiveBlending });
  const pts = new THREE.Points(geo, m);
  pts.userData.seed = seed;
  return pts;
}

/* Night courtyard floor: dark flagstones drawn on a canvas (no image files), lit near
   the table and fading to black at the edge so the floor melts into the fog. */
function makeFlagstones(size) {
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const g = c.getContext("2d");
  g.fillStyle = "#0b0a0c";
  g.fillRect(0, 0, size, size);
  const rows = 44, h = size / rows;
  let n = 0;
  for (let r = 0; r < rows; r++) {
    let x = -hn(r * 13.7) * h * 1.6;
    while (x < size) {
      const w = h * (1.1 + hn(++n * 3.3) * 1.3);
      const shade = 26 + Math.floor(hn(n * 7.1) * 22);
      const warm = Math.floor(hn(n * 5.9) * 6);
      g.fillStyle = `rgb(${shade + warm},${shade + Math.floor(warm / 2)},${shade + 2})`;
      const gap = Math.max(1, size / 512);
      g.fillRect(x + gap, r * h + gap, w - gap * 2, h - gap * 2);
      /* faint veins and wear */
      g.globalAlpha = 0.18;
      g.strokeStyle = hn(n * 2.2) > 0.5 ? "#4a4650" : "#0e0d10";
      g.lineWidth = gap;
      g.beginPath();
      g.moveTo(x + w * hn(n * 1.1), r * h + gap);
      g.quadraticCurveTo(x + w * hn(n * 4.4), r * h + h * 0.5, x + w * hn(n * 8.8), r * h + h - gap);
      g.stroke();
      g.globalAlpha = 1;
      x += w;
    }
  }
  /* grain */
  const img = g.getImageData(0, 0, size, size), d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    const k = (hn(i * 0.37) - 0.5) * 14;
    d[i] += k; d[i + 1] += k; d[i + 2] += k;
  }
  g.putImageData(img, 0, 0);
  /* radial falloff: candlelit near the middle, black at the rim */
  const grad = g.createRadialGradient(size / 2, size / 2, size * 0.06, size / 2, size / 2, size / 2);
  grad.addColorStop(0, "rgba(0,0,0,0)");
  grad.addColorStop(0.25, "rgba(0,0,0,0.3)");
  grad.addColorStop(0.55, "rgba(0,0,0,0.85)");
  grad.addColorStop(1, "rgba(0,0,0,1)");
  g.fillStyle = grad;
  g.fillRect(0, 0, size, size);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function layoutYard(yard, camera, renderer) {
  const sageBox = document.querySelector(".sage");
  const main = document.querySelector("main.base");
  const inline = window.innerWidth <= 900;
  yard.classList.toggle("ckw-yard-inline", inline);
  if (inline && sageBox && main) main.insertBefore(yard, sageBox);
  else document.body.insertBefore(yard, document.body.firstChild);
  if (camera) {
    if (inline) { camera.fov = 34; camera.position.set(0.2, 1.4, 4.4); camera.lookAt(-0.25, 0.95, 1.3); }
    else { camera.fov = 38; camera.position.set(0.35, 1.85, 4.6); camera.lookAt(0, 0.95, 0); }
    camera.updateProjectionMatrix();
  }
  if (renderer) {
    const w = inline ? yard.clientWidth : window.innerWidth;
    const h = inline ? yard.clientHeight : window.innerHeight;
    renderer.setSize(Math.max(1, w), Math.max(1, h), false);
    if (camera) {
      camera.aspect = w / Math.max(1, h);
      /* Wide screens: the chat card sits in the middle, so slide the courtyard to the
         right of it (a view offset, not a camera move) and Sage stays visible. */
      const card = !inline && sageBox ? sageBox.getBoundingClientRect() : null;
      if (card && w - card.right > 220) {
        const shift = Math.min(w * 0.36, (card.right + (w - card.right) / 2) - w / 2);
        camera.fov = 44;
        camera.setViewOffset(w, h, -shift, 0, w, h);
      } else if (camera.view) camera.clearViewOffset();
      camera.updateProjectionMatrix();
    }
  }
  return inline;
}

/* Fit a dropped-in GLB to Sage's height, standing on the floor, facing +Z. */
function prepareGLB(root) {
  root.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(root);
  const size = box.getSize(new THREE.Vector3());
  if (size.y > 0.01) {
    const s = SAGE_HEIGHT / size.y;
    root.scale.multiplyScalar(s);
    root.updateMatrixWorld(true);
    const b2 = new THREE.Box3().setFromObject(root);
    const ctr = b2.getCenter(new THREE.Vector3());
    root.position.x -= ctr.x; root.position.z -= ctr.z; root.position.y -= b2.min.y;
  }
  root.traverse((o) => {
    if (!o.isMesh) return;
    o.castShadow = true; o.receiveShadow = true;
    if (o.isSkinnedMesh) o.frustumCulled = false;
    const ms = Array.isArray(o.material) ? o.material : [o.material];
    ms.forEach((m) => { if (m && m.map) m.map.colorSpace = THREE.SRGBColorSpace; if (m) m.envMapIntensity = 1; });
  });
  const wrap = new THREE.Group();
  wrap.name = "Sage";
  wrap.add(root);
  wrap.userData.parts = {};
  return wrap;
}

async function boot() {
  if (!hasWebGL()) { failTo2D("no WebGL"); return; }

  const yard = document.getElementById("ckw-yard");
  const canvas = document.getElementById("ckw-yard-canvas");
  const label = document.getElementById("ckw-yard-label");
  if (!yard || !canvas) { failTo2D("missing courtyard markup"); return; }
  yard.hidden = false;

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: window.innerWidth > 700, alpha: false, powerPreference: "low-power" });
  } catch (e) { failTo2D(e && e.message); return; }

  renderer.setPixelRatio(Math.min(LITE ? 1.25 : 1.5, window.devicePixelRatio || 1));
  renderer.setSize(window.innerWidth, window.innerHeight, false);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x07070a);
  scene.fog = new THREE.FogExp2(0x07070a, 0.085);
  try { scene.environment = makeEnvironment(renderer); scene.environmentIntensity = 0.55; } catch (e) {}

  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 40);
  let narrow = layoutYard(yard, camera, renderer);

  scene.add(new THREE.HemisphereLight(0x2c2f3c, 0x1a1208, 0.4));
  /* Key: warm, from the table side, soft shadows. */
  const key = new THREE.SpotLight(0xffd6a0, 14, 12, 0.5, 0.8, 1.4);
  key.position.set(1.4, 3.4, 3.2);
  key.castShadow = true;
  key.shadow.mapSize.set(LITE ? 512 : 1024, LITE ? 512 : 1024);
  key.shadow.bias = -0.0004;
  key.shadow.normalBias = 0.02;
  key.shadow.radius = 4;
  scene.add(key);
  scene.add(key.target);
  /* Rim: cool moonlight from behind, separates the robe from the dark. */
  const rimL = new THREE.DirectionalLight(0xa9b8e8, 1.5);
  rimL.position.set(-3.5, 3.2, -3.5);
  scene.add(rimL);
  const rimR = new THREE.DirectionalLight(0xffe3b0, 0.9);
  rimR.position.set(3.5, 2.0, -2.5);
  scene.add(rimR);
  const lantern = new THREE.PointLight(0xe8b25a, 2.2, 6, 1.8);
  lantern.position.set(0, 1.2, 0);
  scene.add(lantern);

  const floorTex = makeFlagstones(LITE ? 512 : 1024);
  floorTex.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy());
  const floorMat = new THREE.MeshLambertMaterial({ map: floorTex, color: 0xffffff }); /* matte stone, no grazing sheen */
  const floor = new THREE.Mesh(new THREE.CircleGeometry(8, 72), floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);
  /* Flagstone ring under the table. */
  const ring = new THREE.Mesh(new THREE.RingGeometry(0.95, 1.0, 64), new THREE.MeshStandardMaterial({ color: 0x8a6a2c, roughness: 0.5, metalness: 0.6 }));
  ring.rotation.x = -Math.PI / 2; ring.position.y = 0.002; ring.receiveShadow = true;
  scene.add(ring);

  const table = new THREE.Group();
  table.name = "StoneTable";
  const stone = new THREE.MeshPhysicalMaterial({ color: 0x55545c, roughness: 0.78, clearcoat: 0.1 });
  const top = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.68, 0.08, 64), stone);
  top.position.y = 0.72; top.castShadow = true; top.receiveShadow = true;
  const lip = new THREE.Mesh(new THREE.TorusGeometry(0.7, 0.012, 8, 96), new THREE.MeshPhysicalMaterial({ color: 0xc9a44c, metalness: 0.9, roughness: 0.3 }));
  lip.rotation.x = Math.PI / 2; lip.position.y = 0.76;
  const pedestal = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.24, 0.68, 32), stone);
  pedestal.position.y = 0.34; pedestal.castShadow = true; pedestal.receiveShadow = true;
  const tableCrest = crestGroup(new THREE.MeshStandardMaterial({ color: 0xffe0a0, emissive: 0xe8b04a, emissiveIntensity: 1.2, side: THREE.DoubleSide }), 0.14);
  tableCrest.rotation.x = -Math.PI / 2; tableCrest.position.y = 0.762;
  table.add(top, lip, pedestal, tableCrest);
  scene.add(table);

  const motes = LITE ? makeMotes(60) : makeMotes(160);
  scene.add(motes);

  let sage = null, usingGLB = false, mixer = null, clips = {};
  try {
    // Only request the model when index.html opts in (data-glb on the canvas, or ?glb=1),
    // so a missing file never logs a 404 console error (smoke test stays green).
    if (!canvas.hasAttribute("data-glb") && flags.glb !== "1") throw new Error("no sage.glb yet");
    const url = canvas.getAttribute("data-glb") || GLB_URL;
    const gltf = await new Promise((ok, err) => new GLTFLoader().load(url && url !== "" ? url : GLB_URL, ok, undefined, err));
    sage = prepareGLB(gltf.scene);
    usingGLB = true;
    mixer = new THREE.AnimationMixer(gltf.scene);
    (gltf.animations || []).forEach((c) => { clips[c.name] = c; });
    if (label) { label.hidden = false; label.textContent = "Sage avatar preview"; }
  } catch (e) {
    if (usingGLB === false && sage) sage = null;
    sage = buildStandIn();
    usingGLB = false;
    if (label) {
      label.hidden = false;
      label.textContent = "Sage, v06 look (built in code)";
    }
  }
  scene.add(sage);
  const parts = sage.userData.parts || {};

  const bones = findBones(sage);
  let unlocked = loadUnlocked();
  if (flags.layers != null && flags.layers !== "") {
    unlocked = Math.max(0, Math.min(LAYERS.length, parseInt(flags.layers, 10) || 0));
  }
  applyAttachments(sage, unlocked);

  const reset = document.getElementById("layer-reset");
  if (reset) {
    reset.addEventListener("click", () => {
      unlocked = 0;
      saveUnlocked(0);
      applyAttachments(sage, unlocked);
    });
  }

  let yaw = 0, tx = narrow ? -0.55 : 0.05, tz = narrow ? 1.55 : 1.4;
  sage.position.set(tx, 0, tz);
  sage.rotation.y = yaw;
  key.target.position.set(tx, 1.0, tz);
  /* ?cam=close: a portrait framing for review screenshots. */
  const closeCam = () => {
    if (flags.cam !== "close") return;
    camera.clearViewOffset(); camera.fov = 30;
    camera.position.set(tx + 0.3, 1.4, tz + 2.6); camera.lookAt(tx, 1.08, tz);
    camera.updateProjectionMatrix();
  };
  closeCam();
  let state = "idle_pages", stateT = 0, busy = false, hidden = false, posed = false;
  let action = null, lookTarget = null, tAll = 0;
  let lastT = performance.now();

  function findClip(name) {
    if (clips[name]) return clips[name];
    const re = { idle_pages: /idle|breath|stand/i, walk: /walk/i, talk: /talk|speak/i, wave: /wave|greet/i, look: /look|idle/i, pause: /idle|stand/i }[name];
    const all = Object.values(clips);
    return (re && all.find((c) => re.test(c.name))) || all.find((c) => /idle/i.test(c.name)) || all[0] || null;
  }
  function playClip(name, loop) {
    if (!mixer) return false;
    const clip = findClip(name);
    if (!clip) return false;
    const next = mixer.clipAction(clip);
    if (action === next) return true;
    if (action) action.fadeOut(0.3);
    action = next;
    action.reset().setLoop(loop === false ? THREE.LoopOnce : THREE.LoopRepeat, loop === false ? 1 : Infinity).fadeIn(0.3).play();
    return true;
  }

  const lerp = THREE.MathUtils.lerp;
  function ease(o, axis, v, k) { o.rotation[axis] = lerp(o.rotation[axis] || 0, v, k); }

  /* Free-hands pose (v04): the grimoire floats on its own, so her arms rest, swing and gesture.
     ?pose=stride freezes a mid-stride frame for review (?t= picks the phase). */
  function poseProcedural(name, t, dt) {
    const b = bones;
    const hip = b.Hips;
    if (!hip) return;
    const k = Math.min(1, dt * 6);
    const breath = Math.sin(tAll * 1.5);
    let aL = { x: 0.04, z: 0.13 }, aR = { x: 0.04, z: -0.13 }, laL = -0.16, laR = -0.16;
    let headX = 0.04 + breath * 0.01, headZ = 0;
    hip.position.y = 0.95 + breath * 0.003;
    if (b.Chest) b.Chest.scale.set(1 + breath * 0.006, 1, 1 + breath * 0.01);
    if (name === "walk" || name === "stride") {
      const s = Math.sin(t * 7);
      if (b.UpperLegL) b.UpperLegL.rotation.x = s * 0.5;
      if (b.UpperLegR) b.UpperLegR.rotation.x = -s * 0.5;
      if (b.LowerLegL) b.LowerLegL.rotation.x = Math.max(0, -s) * 0.75 + 0.05;
      if (b.LowerLegR) b.LowerLegR.rotation.x = Math.max(0, s) * 0.75 + 0.05;
      if (b.FootL) b.FootL.rotation.x = -s * 0.18;
      if (b.FootR) b.FootR.rotation.x = s * 0.18;
      hip.position.y = 0.95 - (1 - Math.abs(s)) * 0.02;
      hip.rotation.y = s * 0.06;
      aL.x = -s * 0.32; aR.x = s * 0.32; laL = -0.25 - Math.max(0, s) * 0.2; laR = -0.25 - Math.max(0, -s) * 0.2;
      headX = 0.02;
    } else {
      ["UpperLegL", "UpperLegR", "LowerLegL", "LowerLegR", "FootL", "FootR"].forEach((n) => { if (b[n]) ease(b[n], "x", 0, k); });
      hip.rotation.y = lerp(hip.rotation.y, 0, k);
    }
    if (name === "talk") {
      aL = { x: -0.5 + Math.sin(t * 3) * 0.08, z: 0.35 }; laL = -0.9 + Math.sin(t * 4) * 0.12;
      headX = Math.sin(t * 6) * 0.03; headZ = -0.04;
    } else if (name === "wave") {
      aR = { x: -0.2, z: -2.5 + Math.sin(t * 2) * 0.05 }; laR = -0.2;
      if (b.LowerArmR) ease(b.LowerArmR, "z", Math.sin(t * 8) * 0.35, k);
    } else if (name === "look") {
      headZ = Math.sin(t * 0.6) * 0.05;
    } else if (name === "idle_pages") {
      aL = { x: -0.18 + breath * 0.02, z: 0.3 }; laL = -0.55; /* left hand open toward the floating book */
    }
    if (b.UpperArmL) { ease(b.UpperArmL, "x", aL.x, k); ease(b.UpperArmL, "z", aL.z, k); }
    if (b.UpperArmR) { ease(b.UpperArmR, "x", aR.x, k); ease(b.UpperArmR, "z", aR.z, k); }
    if (b.LowerArmL) { ease(b.LowerArmL, "x", laL, k); ease(b.LowerArmL, "z", 0, k); }
    if (b.LowerArmR) { ease(b.LowerArmR, "x", laR, k); if (name !== "wave") ease(b.LowerArmR, "z", 0, k); }
    if (b.HandL) ease(b.HandL, "x", name === "talk" || name === "idle_pages" ? -0.2 : 0.08, k);
    if (b.HandR) ease(b.HandR, "x", 0.08, k);
    if (b.Head && !(lookTarget && name !== "walk")) { ease(b.Head, "x", headX, k); ease(b.Head, "z", headZ, k); }
    if (b.Head && lookTarget && name !== "walk") ease(b.Head, "z", headZ, k);
    /* wings breathe; grimoire bobs, turns slowly and pulses */
    if (b.WingL) b.WingL.rotation.y = Math.sin(tAll * 0.9) * 0.04;
    if (b.WingR) b.WingR.rotation.y = -Math.sin(tAll * 0.9) * 0.04;
    const pulse = 0.5 + 0.5 * Math.sin(tAll * 1.8);
    if (parts.bookHolder) {
      parts.bookHolder.position.y = 1.12 + Math.sin(tAll * 1.2) * 0.03 + (name === "talk" ? 0.06 : 0);
      parts.book.rotation.y = -0.35 + Math.sin(tAll * 0.5) * 0.15;
      parts.book.rotation.z = 0.08 + Math.sin(tAll * 0.8) * 0.04;
    }
    if (parts.sparks) {
      const sp = parts.sparks.geometry.attributes.position, base = parts.sparks.userData.base, sd = parts.sparks.userData.seed;
      for (let i = 0; i < sd.length; i++) {
        const a = tAll * (0.4 + sd[i] * 0.6) + sd[i] * 6.28;
        sp.setX(i, base[i * 3] * Math.cos(a * 0.3) - base[i * 3 + 2] * Math.sin(a * 0.3));
        sp.setY(i, base[i * 3 + 1] + Math.sin(a) * 0.03);
      }
      sp.needsUpdate = true;
    }
    if (parts.bookLight) parts.bookLight.intensity = 0.2 + pulse * 0.15 + (parts.bookLight.userData.boost || 0) + (name === "talk" ? 0.3 : 0);
    if (parts.glowMat) parts.glowMat.emissiveIntensity = 0.9 + pulse * 0.5 + (name === "talk" ? 0.8 : 0);
    if (parts.bookAura) parts.bookAura.material.opacity = 0.4 + pulse * 0.25;
    if (parts.seamMat) parts.seamMat.emissiveIntensity = (parts.seamBase || 1.8) * (unlocked >= 3 ? 1.25 : 1) + pulse * 0.25 * (parts.seamBase || 1.8);
  }

  function setState(name) {
    state = name;
    stateT = 0;
    if (usingGLB) playClip(name, true);
  }

  function wanderTarget() {
    for (let i = 0; i < 16; i++) {
      const a = Math.random() * Math.PI * 2;
      const r = 1.2 + Math.random() * 1.0;
      const x = Math.cos(a) * r, z = Math.sin(a) * r;
      if (Math.hypot(x - tx, z - tz) > 0.6) return { x, z };
    }
    return { x: -1.5, z: 1.2 };
  }

  function faceToward(x, z, dt, speed) {
    const want = Math.atan2(x - sage.position.x, z - sage.position.z);
    let d = want - yaw;
    while (d > Math.PI) d -= Math.PI * 2;
    while (d < -Math.PI) d += Math.PI * 2;
    yaw += THREE.MathUtils.clamp(d, -speed * dt, speed * dt);
    sage.rotation.y = yaw;
  }

  /* Calmer free will: a realistic figure mostly stands, reads, and looks around. */
  function pickFreeWill() {
    const roll = Math.random();
    if (roll < 0.18) return "walk";
    if (roll < 0.4) return "look";
    if (roll < 0.48) return "wave";
    return "idle_pages";
  }

  let nextAt = 3, dest = null, home = { x: tx, z: tz };

  function goTalk() {
    busy = true;
    dest = { x: home.x + 0.1, z: home.z + 0.45 };
    setState("walk");
  }

  const form = document.getElementById("sage-form");
  const log = document.getElementById("sage-log");
  if (form) form.addEventListener("submit", () => { if (!reduce.matches) goTalk(); else setState("talk"); });
  if (log) {
    new MutationObserver((muts) => {
      const spoke = muts.some((m) => Array.from(m.addedNodes).some((n) => n.classList && n.classList.contains("msg-sage")));
      if (!spoke || !busy) return;
      setTimeout(() => {
        dest = null;
        setState("talk");
        setTimeout(() => {
          if (unlocked < LAYERS.length) { unlocked += 1; saveUnlocked(unlocked); applyAttachments(sage, unlocked); }
          busy = false;
          setState("idle_pages");
          nextAt = 3;
        }, 1800);
      }, 200);
    }).observe(log, { childList: true });
  }

  window.addEventListener("mousemove", (e) => {
    lookTarget = { x: (e.clientX / window.innerWidth) * 2 - 1, y: -(e.clientY / window.innerHeight) * 2 + 1 };
  }, { passive: true });

  function onResize() {
    narrow = layoutYard(yard, camera, renderer);
    closeCam();
    renderer.setPixelRatio(Math.min(LITE ? 1.25 : 1.5, window.devicePixelRatio || 1));
  }
  window.addEventListener("resize", onResize);

  document.addEventListener("visibilitychange", () => {
    hidden = document.hidden;
    if (!hidden) lastT = performance.now();
  });

  let tWalkFixed = 0;
  let manualYaw = null;
  if (flags.pose) {
    posed = true;
    if (flags.pose === "walk") {
      sage.position.set(tx - 0.5, 0, tz + 0.3);
      yaw = 0.6; sage.rotation.y = yaw;
      dest = { x: tx, z: tz };
      setState("walk");
    }
    else if (flags.pose === "talk") { setState("talk"); busy = true; }
    else if (flags.pose === "wave") setState("wave");
    else if (flags.pose === "stride") { setState("stride"); tWalkFixed = parseFloat(flags.t || "0.22") || 0.22; }
    else setState("idle_pages");
  } else {
    setState(reduce.matches ? "pause" : "idle_pages");
  }

  yard.hidden = false;
  if (window.__sageSprite && typeof window.__sageSprite.stop === "function") window.__sageSprite.stop();
  window.__CKW_SAGE3D = {
    state: () => state,
    usingGLB: () => usingGLB,
    layers: () => unlocked,
    stop: () => { hidden = true; renderer.dispose(); yard.hidden = true; },
    /* Webverse playtest controls (client-side only) */
    pose: (name) => {
      if (name === "walk") { dest = wanderTarget(); setState("walk"); nextAt = 99; return; }
      if (name === "stride") { tWalkFixed = 0.22; }
      dest = null; setState(name); nextAt = name === "idle_pages" ? 3 : 7;
    },
    setYaw: (r) => { manualYaw = (r == null || isNaN(r)) ? null : r; },
    upgrade: (key, val) => applyUpgrade(sage, key, val),
    glyphKeys: () => Object.keys(GLYPH_MEANINGS)
  };
  window.dispatchEvent(new Event("ckw:sage3d-ready"));

  let tWalk = 0;
  const mp = motes.geometry.attributes.position, seeds = motes.userData.seed;
  function tick() {
    requestAnimationFrame(tick);
    if (hidden) return;
    const now = performance.now(); const dt = Math.min(0.05, (now - lastT) / 1000); lastT = now;
    stateT += dt;
    if (!reduce.matches) tAll += dt;
    if (mixer) mixer.update(dt);

    if (!posed && !busy && !reduce.matches) {
      nextAt -= dt;
      if (nextAt <= 0 && state !== "walk") {
        const n = pickFreeWill();
        if (n === "walk") dest = wanderTarget();
        setState(n);
        nextAt = n === "walk" ? 99 : (3 + Math.random() * 4);
      }
    }

    if (state === "walk" && dest && !reduce.matches) {
      const dx = dest.x - sage.position.x, dz = dest.z - sage.position.z;
      const dist = Math.hypot(dx, dz);
      const speed = 0.6;
      if (dist < 0.05) {
        dest = null;
        if (!busy) { setState("idle_pages"); nextAt = 3 + Math.random() * 3; }
        else setState("talk");
      } else {
        const step = speed * dt;
        sage.position.x += dx / dist * Math.min(step, dist);
        sage.position.z += dz / dist * Math.min(step, dist);
        faceToward(dest.x, dest.z, dt, 2.4);
        tWalk += dt;
      }
    } else if (manualYaw != null) {
      yaw = lerp(yaw, manualYaw, Math.min(1, dt * 8)); sage.rotation.y = yaw;
    } else if (flags.yaw != null && posed) {
      yaw = parseFloat(flags.yaw) || 0; sage.rotation.y = yaw;
    } else if (state !== "walk" && !dest) {
      /* settle facing the viewer, slightly toward the table */
      faceToward(sage.position.x + 0.35, sage.position.z + 1, dt, 1.2);
    }
    if (lookTarget && bones.Head && state !== "walk") {
      const hd = bones.Head;
      hd.rotation.y = lerp(hd.rotation.y || 0, lookTarget.x * 0.35, 0.05);
      hd.rotation.x = lerp(hd.rotation.x || 0, 0.12 - lookTarget.y * 0.12, 0.05);
    }
    key.target.position.set(sage.position.x, 1.0, sage.position.z);

    if (!usingGLB) poseProcedural(reduce.matches ? "pause" : state, state === "walk" ? tWalk : state === "stride" ? tWalkFixed : stateT, reduce.matches ? 1 : dt);

    if (!reduce.matches) {
      for (let i = 0; i < seeds.length; i++) {
        let y = mp.getY(i) + dt * (0.04 + seeds[i] * 0.06);
        if (y > 2.6) y = 0.05;
        mp.setY(i, y);
        mp.setX(i, mp.getX(i) + Math.sin(tAll * 0.5 + seeds[i] * 20) * dt * 0.02);
      }
      mp.needsUpdate = true;
    }

    renderer.render(scene, camera);
  }
  tick();
}

boot().catch((e) => failTo2D(e && e.message ? e.message : e));
