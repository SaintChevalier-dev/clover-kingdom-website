/* Sage 3D courtyard. Vendored three.js 0.187.0 (MIT, see vendor/VERSION.txt).

   Two bodies, one courtyard:
   1. Drop-in avatar: /base/assets/sage/sage.glb (rigged GLB, PBR skin). Loaded only when
      the canvas has data-glb (or ?glb=1 for testing), so a missing file never 404s.
      See docs/sage-3d-phase6.md "Drop-in avatar slot". Rights first, always.
   2. Procedural stand-in (default): a hooded, robed figure built here in code from
      primitives. No downloaded or generated model, no face (the hood keeps it in
      shadow until an original face is cleared). Not based on any copyrighted character. */
import * as THREE from "./vendor/three.module.min.js";
import { GLTFLoader } from "./vendor/GLTFLoader.js";

const GLB_URL = "/base/assets/sage/sage.glb";
const SAGE_HEIGHT = 1.72;
const LAYER_KEY = "ckw-sage-layers-v1";
const LAYERS = [
  { id: "halo",  name: "halo glow",    socket: "HaloSocket" },
  { id: "wings", name: "wings",        sockets: ["WingL", "WingR"] },
  { id: "armor", name: "armor tint",   socket: "ArmorSocket" },
  { id: "cape",  name: "cape",         socket: "CapeSocket" },
  { id: "crest", name: "crest colors", socket: "CrestSocket" }
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

/* Procedural stand-in. Same bone names as the GLB rig plan, so clips and layers line up. */
function buildStandIn() {
  const root = new THREE.Group();
  root.name = "Sage";

  const hips = bone("Hips", root, 0, 0.95, 0);
  const spine = bone("Spine", hips, 0, 0.12, 0);
  const chest = bone("Chest", spine, 0, 0.18, 0);
  const neck = bone("Neck", chest, 0, 0.17, 0.0);
  const head = bone("Head", neck, 0, 0.09, 0.01);
  const shoulderL = bone("ShoulderL", chest, 0.16, 0.1, -0.01);
  const upperArmL = bone("UpperArmL", shoulderL, 0.02, 0, 0);
  const lowerArmL = bone("LowerArmL", upperArmL, 0, -0.27, 0);
  const handL = bone("HandL", lowerArmL, 0, -0.24, 0);
  const shoulderR = bone("ShoulderR", chest, -0.16, 0.1, -0.01);
  const upperArmR = bone("UpperArmR", shoulderR, -0.02, 0, 0);
  const lowerArmR = bone("LowerArmR", upperArmR, 0, -0.27, 0);
  const handR = bone("HandR", lowerArmR, 0, -0.24, 0);
  const upperLegL = bone("UpperLegL", hips, 0.08, -0.02, 0);
  const lowerLegL = bone("LowerLegL", upperLegL, 0, -0.42, 0);
  const footL = bone("FootL", lowerLegL, 0, -0.44, 0.02);
  const upperLegR = bone("UpperLegR", hips, -0.08, -0.02, 0);
  const lowerLegR = bone("LowerLegR", upperLegR, 0, -0.42, 0);
  const footR = bone("FootR", lowerLegR, 0, -0.44, 0.02);
  const haloSock = bone("HaloSocket", head, 0, 0.2, -0.03);
  const wingL = bone("WingL", chest, 0.07, 0.06, -0.14);
  const wingR = bone("WingR", chest, -0.07, 0.06, -0.14);
  const armorSock = bone("ArmorSocket", chest, 0, 0.0, 0);
  const capeSock = bone("CapeSocket", chest, 0, 0.12, -0.02);
  const crestSock = bone("CrestSocket", chest, 0, 0.13, 0.115);
  const bookSock = bone("BookSocket", chest, 0, -0.3, 0.3);

  const gownMat = cloth(0xb3a78f, 0xe8dcc0, { roughness: 0.9, sheen: 0.7 });
  const cloakMat = cloth(0x102624, 0x3d6b66, { side: THREE.DoubleSide, roughness: 0.92, sheen: 0.8 });
  const cloakInMat = cloth(0x3a1418, 0x8a4048, { side: THREE.BackSide, roughness: 0.9, sheen: 0.6 });
  const goldMat = new THREE.MeshPhysicalMaterial({ color: 0xc9a44c, metalness: 0.9, roughness: 0.32, clearcoat: 0.3 });
  const leatherMat = mat(0x3a2516, { roughness: 0.6 });
  const shadowMat = new THREE.MeshStandardMaterial({ color: 0x050405, roughness: 1, metalness: 0 });
  const skinMat = new THREE.MeshPhysicalMaterial({
    color: 0x8c6a5a, roughness: 0.6, metalness: 0, sheen: 0.35, sheenRoughness: 0.5,
    sheenColor: new THREE.Color(0xd08070), clearcoat: 0.08, clearcoatRoughness: 0.6
  });
  const featherMat = cloth(0xf2eee4, 0xffffff, { side: THREE.DoubleSide, roughness: 0.75 });
  const haloMat = new THREE.MeshStandardMaterial({ color: 0xffe2a0, emissive: 0xe8c25a, emissiveIntensity: 1.6, roughness: 0.3 });

  function mesh(geo, material, parent, px, py, pz) {
    const m = new THREE.Mesh(geo, material);
    m.castShadow = true;
    m.receiveShadow = true;
    m.position.set(px || 0, py || 0, pz || 0);
    parent.add(m);
    return m;
  }

  /* Gown skirt: hangs from the hips to the floor in soft folds. */
  const skirt = mesh(clothLathe([
    [0.125, 0.08], [0.15, 0.0, 1.05], [0.178, -0.1, 1.08], [0.2, -0.3, 1.06], [0.235, -0.55, 1.04],
    [0.285, -0.8], [0.315, -0.92], [0.312, -0.945]
  ], { freq: 8, fold: (y) => 0.02 + y * y * 0.11, zScale: 0.82 }), gownMat, hips);
  skirt.name = "Skirt";

  /* Bodice: waist to shoulders, wider than deep. */
  mesh(clothLathe([
    [0.118, -0.14, 1.0], [0.112, -0.02, 1.02], [0.128, 0.08, 1.08], [0.142, 0.16, 1.12],
    [0.15, 0.23, 1.22], [0.14, 0.28, 1.32], [0.1, 0.32, 1.25], [0.058, 0.36, 1.0], [0.05, 0.4, 1.0]
  ], { freq: 5, fold: () => 0.008, zScale: 0.72, sub: 2 }), gownMat, spine);

  /* Belt with a gold clasp. */
  const belt = mesh(new THREE.TorusGeometry(0.118, 0.014, 8, 40), leatherMat, spine, 0, -0.02, 0);
  belt.rotation.x = Math.PI / 2;
  belt.scale.set(1.02, 0.74, 1);
  mesh(new THREE.BoxGeometry(0.04, 0.035, 0.012), goldMat, spine, 0, -0.02, 0.088);

  /* Hem trim on the gown. */
  const hem = mesh(new THREE.TorusGeometry(0.313, 0.008, 6, 64), goldMat, hips, 0, -0.935, 0);
  hem.rotation.x = Math.PI / 2;
  hem.scale.set(1.02, 0.82 * 1.02, 1);

  /* Cloak: over the shoulders and back, open in front, to the floor. */
  const cloakPts = [
    [0.075, 0.26], [0.14, 0.215, 1.15], [0.2, 0.15, 1.3], [0.225, 0.07, 1.28], [0.23, -0.1, 1.2],
    [0.25, -0.4, 1.12], [0.29, -0.75, 1.08], [0.35, -1.05, 1.05], [0.38, -1.2], [0.385, -1.215]
  ];
  const cloakFold = (y) => 0.015 + y * y * 0.13;
  const cloak = mesh(clothLathe(cloakPts, { phiStart: 0.62, phiLength: Math.PI * 2 - 1.24, freq: 10, fold: cloakFold, zScale: 0.9 }), cloakMat, chest);
  cloak.name = "Cloak";
  const lining = mesh(clothLathe(cloakPts.map((p) => [p[0] * 0.985, p[1], p[2]]), { phiStart: 0.62, phiLength: Math.PI * 2 - 1.24, freq: 10, fold: cloakFold, zScale: 0.9 }), cloakInMat, chest);
  lining.castShadow = false;

  /* Gold chain across the chest holds the cloak closed at the collar. */
  const chain = mesh(new THREE.TorusGeometry(0.11, 0.005, 6, 32, Math.PI), goldMat, chest, 0, 0.17, 0.1);
  chain.rotation.set(0.25, 0, Math.PI);
  chain.scale.set(1, 0.5, 1);
  [1, -1].forEach((sd) => mesh(new THREE.SphereGeometry(0.016, 12, 8), goldMat, chest, sd * 0.11, 0.17, 0.1));

  /* Neck and head. The head is a dark shape: the hood's shadow, no face. */
  const cowl = mesh(new THREE.TorusGeometry(0.072, 0.034, 10, 32), gownMat, neck, 0, 0.005, 0.012);
  cowl.rotation.x = Math.PI / 2 - 0.15; cowl.scale.set(1.1, 0.9, 1);
  mesh(new THREE.CylinderGeometry(0.042, 0.05, 0.1, 16), shadowMat, neck, 0, 0.04, 0);
  const headMesh = mesh(new THREE.SphereGeometry(0.094, 32, 24), shadowMat, head, 0, 0.05, -0.01);
  headMesh.scale.set(0.86, 1.08, 0.98);
  headMesh.name = "HeadShadow";

  /* Deep hood: open at the front, peaked at the back, draping onto the shoulders. */
  const hoodGeo = new THREE.SphereGeometry(0.145, LITE ? 28 : 48, LITE ? 20 : 32, Math.PI / 2 + 0.48, Math.PI * 2 - 0.96, 0, Math.PI * 0.86);
  {
    const p = hoodGeo.attributes.position, v = new THREE.Vector3();
    for (let i = 0; i < p.count; i++) {
      v.fromBufferAttribute(p, i);
      if (v.z < 0 && v.y > 0) v.z -= (v.y / 0.145) * (-v.z / 0.145) * 0.05; /* peak */
      if (v.z > 0) { v.z *= 1.18 + 0.12 * Math.max(0, v.y / 0.145); v.y -= (v.z / 0.145) * 0.012; } /* brim reaches forward over the face */
      const w = Math.sin(Math.atan2(v.x, v.z) * 7) * 0.004;
      p.setXYZ(i, v.x * (1 + w * 8), v.y, v.z);
    }
    hoodGeo.computeVertexNormals();
  }
  const hood = mesh(hoodGeo, cloakMat, head, 0, 0.07, 0.0);
  hood.scale.set(1.04, 1.16, 1.3);
  hood.name = "Hood";
  const hoodIn = mesh(hoodGeo, cloakInMat, head, 0, 0.07, 0.0);
  hoodIn.scale.set(1.025, 1.145, 1.285);
  hoodIn.castShadow = false;
  /* Sleeves: fitted at the shoulder, belled at the wrist. Hands: slender, skin PBR. */
  function arm(upper, lower, hand, side) {
    mesh(new THREE.CylinderGeometry(0.052, 0.058, 0.28, 18, 1, true), gownMat, upper, 0, -0.135, 0).material.side = THREE.DoubleSide;
    const s = mesh(clothLathe([[0.048, 0.02], [0.055, -0.08], [0.066, -0.17], [0.084, -0.25], [0.086, -0.262]],
      { freq: 6, fold: (y) => y * 0.12, zScale: 0.9, seg: 28 }), cloakMat, lower, 0, 0, 0);
    s.name = side > 0 ? "SleeveL" : "SleeveR";
    mesh(new THREE.CylinderGeometry(0.024, 0.028, 0.1, 12), skinMat, lower, 0, -0.22, 0);
    const palm = mesh(new THREE.SphereGeometry(0.04, 16, 12), skinMat, hand, 0, -0.025, 0);
    palm.scale.set(0.95, 1.15, 0.5);
    for (let f = 0; f < 4; f++) {
      const len = [0.055, 0.062, 0.058, 0.046][f];
      const fg = mesh(new THREE.CapsuleGeometry(0.0085, len, 4, 8), skinMat, hand, side * (-0.021 + f * 0.014), -0.06 - len / 2, 0.018);
      fg.rotation.x = 0.95;
    }
    const th = mesh(new THREE.CapsuleGeometry(0.009, 0.04, 4, 8), skinMat, hand, side * -0.04, -0.04, 0.012);
    th.rotation.z = side * -0.6;
  }
  arm(upperArmL, lowerArmL, handL, 1);
  arm(upperArmR, lowerArmR, handR, -1);

  /* Boots peek out under the hem. */
  [footL, footR].forEach((f) => {
    const b = mesh(new THREE.SphereGeometry(0.05, 14, 10), leatherMat, f, 0, 0.0, 0.05);
    b.scale.set(0.85, 0.55, 1.6);
  });

  /* Grimoire with the glowing five-leaf crest. */
  const book = new THREE.Group();
  book.name = "Book";
  const coverMat = new THREE.MeshPhysicalMaterial({ color: 0x3a1216, roughness: 0.55, sheen: 0.4, sheenColor: new THREE.Color(0xc07060) });
  const back = mesh(new THREE.BoxGeometry(0.2, 0.014, 0.27), coverMat, book, 0, -0.022, 0);
  const pages = mesh(new THREE.BoxGeometry(0.188, 0.032, 0.258), mat(0xefe2c0, { roughness: 0.95 }), book, 0.004, 0, 0);
  const front = mesh(new THREE.BoxGeometry(0.2, 0.014, 0.27), coverMat, book, 0, 0.022, 0);
  mesh(new THREE.BoxGeometry(0.014, 0.058, 0.27), coverMat, book, -0.1, 0, 0);
  [-0.1, 0.1].forEach((z) => mesh(new THREE.BoxGeometry(0.03, 0.06, 0.012), goldMat, book, 0.09, 0, z));
  const page = mesh(new THREE.PlaneGeometry(0.17, 0.24), mat(0xf6ecd0, { roughness: 0.95, side: THREE.DoubleSide }), book, 0, 0.031, 0);
  page.rotation.x = -Math.PI / 2;
  page.name = "Page";
  page.visible = false;
  const glowMat = new THREE.MeshStandardMaterial({ color: 0xd9a441, emissive: 0xd99a3a, emissiveIntensity: 1.2, roughness: 0.4, side: THREE.DoubleSide });
  const bookCrest = crestGroup(glowMat, 0.05);
  bookCrest.rotation.x = -Math.PI / 2;
  bookCrest.position.set(0.005, 0.0295, 0);
  book.add(bookCrest);
  book.rotation.set(0.3, 0, 0);
  book.scale.set(1.25, 1, 1.05);
  bookSock.add(book);
  const bookLight = new THREE.PointLight(0xffc56a, 0.25, 1.0, 2);
  bookLight.position.set(0, 0.3, 0.05);
  book.add(bookLight);

  /* Look layers (unlocked by talking to Sage). */
  const halo = mesh(new THREE.TorusGeometry(0.15, 0.006, 8, 64), haloMat, haloSock, 0, 0, 0);
  halo.rotation.x = Math.PI / 2 - 0.25;
  halo.castShadow = false;
  halo.name = "Halo";

  function makeWing(sock, side) {
    const g = new THREE.Group();
    g.name = side > 0 ? "WingMeshL" : "WingMeshR";
    const rows = [[11, 0.62, 0.07, 0.0], [10, 0.38, 0.06, 0.02], [9, 0.22, 0.05, 0.04]];
    rows.forEach(([n, len, wid, dz], r) => {
      for (let i = 0; i < n; i++) {
        const t = i / (n - 1);
        const f = new THREE.Mesh(featherGeo(len * (1 - t * 0.45), wid * 1.5), featherMat);
        f.position.set(side * (0.02 + t * 0.42), 0.18 + Math.sin(t * Math.PI) * 0.16 - r * 0.05, -dz - t * 0.06);
        f.rotation.set(0, side * 0.35, side * (Math.PI * 0.85 + t * 0.9));
        f.castShadow = true;
        g.add(f);
      }
    });
    g.rotation.y = side * -0.35;
    sock.add(g);
    return g;
  }
  makeWing(wingL, 1);
  makeWing(wingR, -1);

  const armor = new THREE.Group();
  armor.name = "ArmorPlate";
  const armorMat = goldMat.clone();
  armor.userData.mat = armorMat;
  [1, -1].forEach((s) => {
    const p = mesh(new THREE.SphereGeometry(0.085, 24, 12, 0, Math.PI * 2, 0, Math.PI * 0.5), armorMat, armor, s * 0.175, 0.105, -0.005);
    p.scale.set(1.1, 0.7, 1.0);
    p.rotation.z = s * -0.35;
  });
  const gorget = mesh(new THREE.TorusGeometry(0.085, 0.018, 8, 32, Math.PI), armorMat, armor, 0, 0.16, 0.035);
  gorget.rotation.set(Math.PI / 2 + 0.25, 0, Math.PI);
  gorget.scale.set(1, 0.85, 1);
  armorSock.add(armor);

  const cape = mesh(clothLathe([[0.13, 0.12, 1.2], [0.22, 0.04, 1.3], [0.27, -0.08, 1.25], [0.28, -0.2], [0.282, -0.215]],
    { phiStart: 0.9, phiLength: Math.PI * 2 - 1.8, freq: 12, fold: (y) => 0.02 + y * 0.06, zScale: 0.95, seg: 48 }),
    cloth(0x5b1a20, 0xd08080, { side: THREE.DoubleSide }), capeSock, 0, -0.02, 0);
  cape.name = "Cape";

  const crestMat = goldMat.clone();
  const crest = crestGroup(crestMat, 0.026);
  crest.name = "Crest";
  crest.userData.mat = crestMat;
  crestSock.add(crest);

  root.userData.parts = { halo, cape, armor, crest, book, page, wingL, wingR, bookLight, glowMat, skirt, cloak };
  root.traverse((o) => { if (o.isMesh) o.frustumCulled = true; });
  return root;
}

function applyAttachments(root, unlocked) {
  const parts = root.userData.parts || {};
  if (parts.halo) {
    parts.halo.visible = unlocked >= 1;
    if (parts.halo.material && parts.halo.material.emissiveIntensity != null) parts.halo.material.emissiveIntensity = unlocked >= 1 ? 1.8 : 0.2;
  }
  if (parts.wingL) parts.wingL.visible = unlocked >= 2;
  if (parts.wingR) parts.wingR.visible = unlocked >= 2;
  if (parts.armor) {
    parts.armor.visible = unlocked >= 3;
    const m = parts.armor.userData.mat || parts.armor.material;
    if (m && m.color) m.color.setHex(unlocked >= 3 ? 0xf0c85a : 0xc9a44c);
  }
  if (parts.cape) parts.cape.visible = unlocked >= 4;
  if (parts.crest) {
    parts.crest.visible = unlocked >= 5;
    const m = parts.crest.userData.mat || parts.crest.material;
    if (m && m.color) m.color.setHex(0xffe08a);
  }
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
  scene.fog = new THREE.FogExp2(0x07070a, 0.07);
  try { scene.environment = makeEnvironment(renderer); scene.environmentIntensity = 0.55; } catch (e) {}

  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 40);
  let narrow = layoutYard(yard, camera, renderer);

  scene.add(new THREE.HemisphereLight(0x33405e, 0x2a2010, 0.55));
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
  const rimL = new THREE.DirectionalLight(0x9fb6ff, 1.7);
  rimL.position.set(-3.5, 3.2, -3.5);
  scene.add(rimL);
  const rimR = new THREE.DirectionalLight(0xffe3b0, 0.9);
  rimR.position.set(3.5, 2.0, -2.5);
  scene.add(rimR);
  const lantern = new THREE.PointLight(0xe8b25a, 2.2, 6, 1.8);
  lantern.position.set(0, 1.2, 0);
  scene.add(lantern);

  const floorMat = new THREE.MeshPhysicalMaterial({ color: 0x17161a, roughness: 0.62, metalness: 0.0, clearcoat: 0.25, clearcoatRoughness: 0.5 });
  const floor = new THREE.Mesh(new THREE.CircleGeometry(5.5, 64), floorMat);
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
      label.textContent = "Sage stand-in, final body coming from the 3D bake-off";
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

  /* Holding pose: both forearms forward, cradling the grimoire at the waist. */
  function poseProcedural(name, t, dt) {
    const b = bones;
    const hip = b.Hips;
    if (!hip) return;
    const k = Math.min(1, dt * 6);
    const breath = Math.sin(tAll * 1.5);
    const holdL = { x: -0.3, z: -0.16 }, holdR = { x: -0.3, z: 0.16 };
    let lowL = -1.0, lowR = -1.0, headX = 0.12 + breath * 0.012, headZ = 0;
    let skirtSway = Math.sin(tAll * 0.9) * 0.012;
    let aRx = holdR.x, aRz = holdR.z, laR = lowR;
    hip.position.y = 0.95 + breath * 0.003;
    if (b.Chest) b.Chest.scale.set(1 + breath * 0.008, 1, 1 + breath * 0.012);
    if (name === "walk") {
      const s = Math.sin(t * 7);
      ["UpperLegL", "UpperLegR"].forEach((n, i) => { if (b[n]) b[n].rotation.x = (i ? -s : s) * 0.42; });
      if (b.LowerLegL) b.LowerLegL.rotation.x = Math.max(0, -s) * 0.6;
      if (b.LowerLegR) b.LowerLegR.rotation.x = Math.max(0, s) * 0.6;
      hip.position.y = 0.95 + Math.abs(s) * 0.018;
      hip.rotation.y = s * 0.05;
      skirtSway = s * 0.05;
      headX = 0.05;
    } else {
      ["UpperLegL", "UpperLegR", "LowerLegL", "LowerLegR"].forEach((n) => { if (b[n]) ease(b[n], "x", 0, k); });
      hip.rotation.y = lerp(hip.rotation.y, 0, k);
    }
    if (name === "talk") {
      aRx = -0.55 + Math.sin(t * 4) * 0.12; aRz = 0.2; laR = -1.35 + Math.sin(t * 5) * 0.15;
      headX = 0.02 + Math.sin(t * 6) * 0.04;
    } else if (name === "wave") {
      aRx = -2.4 + Math.sin(t * 2) * 0.05; aRz = 0.35 + Math.sin(t * 8) * 0.25; laR = -0.35;
      headX = -0.02;
    } else if (name === "look") {
      headZ = Math.sin(t * 0.6) * 0.06;
    } else if (name === "idle_pages") {
      headX = 0.22 + breath * 0.015;
    }
    if (b.UpperArmL) { ease(b.UpperArmL, "x", holdL.x, k); ease(b.UpperArmL, "z", holdL.z, k); }
    if (b.LowerArmL) { ease(b.LowerArmL, "x", lowL, k); ease(b.LowerArmL, "y", 0, k); ease(b.LowerArmL, "z", 0.12, k); }
    if (b.UpperArmR) { ease(b.UpperArmR, "x", aRx, k); ease(b.UpperArmR, "z", aRz, k); }
    if (b.LowerArmR) { ease(b.LowerArmR, "x", laR, k); ease(b.LowerArmR, "y", 0, k); ease(b.LowerArmR, "z", name === "wave" ? 0 : -0.12, k); }
    if (b.HandL) ease(b.HandL, "x", 0.25, k);
    if (b.HandR) ease(b.HandR, "x", name === "wave" ? -0.3 : 0.25, k);
    if (b.Head && !(lookTarget && name !== "walk")) { ease(b.Head, "x", headX, k); ease(b.Head, "z", headZ, k); }
    if (b.Head && lookTarget && name !== "walk") ease(b.Head, "z", headZ, k);
    if (parts.skirt) { parts.skirt.rotation.x = skirtSway * 0.6; parts.skirt.rotation.z = Math.sin(tAll * 0.7) * 0.008; }
    if (parts.cloak) parts.cloak.rotation.x = -Math.abs(skirtSway) * 0.5 - 0.01;
    const pulse = 0.5 + 0.5 * Math.sin(tAll * 1.8);
    if (parts.bookLight) parts.bookLight.intensity = 0.18 + pulse * 0.2 + (name === "talk" ? 0.3 : 0);
    if (parts.glowMat) parts.glowMat.emissiveIntensity = 0.9 + pulse * 0.7 + (name === "talk" ? 0.8 : 0);
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
    stop: () => { hidden = true; renderer.dispose(); yard.hidden = true; }
  };

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

    if (!usingGLB) poseProcedural(reduce.matches ? "pause" : state, state === "walk" ? tWalk : stateT, reduce.matches ? 1 : dt);

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
