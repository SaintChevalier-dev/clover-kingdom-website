/* Sage 3D courtyard. Vendored three.js 0.187.0 (MIT, see vendor/VERSION.txt).
   Loads assets/sage.glb when present (shared skeleton + named clips).
   Otherwise builds a FACELESS stand-in on the same bone names. The stand-in
   is not Sage's final look and is not based on any copyrighted character.
   Rights-first: no real Sage head until an original face is cleared. */
import * as THREE from "./vendor/three.module.min.js";
import { GLTFLoader } from "./vendor/GLTFLoader.js";

const GLB_URL = "assets/sage.glb";
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
  const o = Object.assign({ color, roughness: 0.72, metalness: 0.05 }, extra || {});
  return new THREE.MeshStandardMaterial(o);
}

/* Stand-in Sage: robe, armor plate, layered-plane wings, halo, book.
   Faceless head (no eyes, mouth, or nose). Labeled in the page, not the mesh. */
function buildStandIn() {
  const root = new THREE.Group();
  root.name = "Sage";

  const hips = bone("Hips", root, 0, 0.95, 0);
  const spine = bone("Spine", hips, 0, 0.12, 0);
  const chest = bone("Chest", spine, 0, 0.16, 0);
  const neck = bone("Neck", chest, 0, 0.16, 0.02);
  const head = bone("Head", neck, 0, 0.12, 0);
  const shoulderL = bone("ShoulderL", chest, 0.14, 0.12, 0);
  const upperArmL = bone("UpperArmL", shoulderL, 0.02, -0.08, 0);
  const lowerArmL = bone("LowerArmL", upperArmL, 0, -0.22, 0);
  const handL = bone("HandL", lowerArmL, 0, -0.2, 0);
  const shoulderR = bone("ShoulderR", chest, -0.14, 0.12, 0);
  const upperArmR = bone("UpperArmR", shoulderR, -0.02, -0.08, 0);
  const lowerArmR = bone("LowerArmR", upperArmR, 0, -0.22, 0);
  const handR = bone("HandR", lowerArmR, 0, -0.2, 0);
  const upperLegL = bone("UpperLegL", hips, 0.08, -0.02, 0);
  const lowerLegL = bone("LowerLegL", upperLegL, 0, -0.38, 0);
  const footL = bone("FootL", lowerLegL, 0, -0.36, 0.04);
  const upperLegR = bone("UpperLegR", hips, -0.08, -0.02, 0);
  const lowerLegR = bone("LowerLegR", upperLegR, 0, -0.38, 0);
  const footR = bone("FootR", lowerLegR, 0, -0.36, 0.04);
  const haloSock = bone("HaloSocket", head, 0, 0.18, 0);
  const wingL = bone("WingL", chest, 0.06, 0.08, -0.08);
  const wingR = bone("WingR", chest, -0.06, 0.08, -0.08);
  const armorSock = bone("ArmorSocket", chest, 0, 0.02, 0.07);
  const capeSock = bone("CapeSocket", chest, 0, 0.1, -0.06);
  const crestSock = bone("CrestSocket", chest, 0, 0.04, 0.1);

  const robeMat = mat(0xe6dfd0, { roughness: 0.88 });
  const goldMat = mat(0xc9a44c, { metalness: 0.55, roughness: 0.35 });
  const inkMat = mat(0x1a1a1e, { roughness: 0.8 });
  const skinMat = mat(0xedd3be, { roughness: 0.65 });
  const featherMat = mat(0xf4f1ea, { roughness: 0.7, side: THREE.DoubleSide });
  const haloMat = mat(0xe8c25a, { emissive: 0xe8c25a, emissiveIntensity: 0.9, roughness: 0.3, metalness: 0.2 });

  function mesh(geo, material, parent, py) {
    const m = new THREE.Mesh(geo, material);
    m.castShadow = true;
    m.receiveShadow = true;
    if (py) m.position.y = py;
    parent.add(m);
    return m;
  }

  mesh(new THREE.SphereGeometry(0.11, 14, 12), skinMat, head, 0.02);
  /* Faceless: no features added on purpose. */

  mesh(new THREE.CylinderGeometry(0.07, 0.22, 0.7, 14), robeMat, chest, -0.18);
  mesh(new THREE.CylinderGeometry(0.06, 0.07, 0.22, 8), inkMat, upperArmL, -0.1);
  mesh(new THREE.CylinderGeometry(0.05, 0.055, 0.2, 8), inkMat, lowerArmL, -0.1);
  mesh(new THREE.SphereGeometry(0.045, 8, 8), skinMat, handL, 0);
  mesh(new THREE.CylinderGeometry(0.06, 0.07, 0.22, 8), inkMat, upperArmR, -0.1);
  mesh(new THREE.CylinderGeometry(0.05, 0.055, 0.2, 8), inkMat, lowerArmR, -0.1);
  mesh(new THREE.SphereGeometry(0.045, 8, 8), skinMat, handR, 0);
  mesh(new THREE.CylinderGeometry(0.055, 0.05, 0.36, 8), goldMat, upperLegL, -0.18);
  mesh(new THREE.CylinderGeometry(0.05, 0.045, 0.34, 8), goldMat, lowerLegL, -0.18);
  const bootL = mesh(new THREE.BoxGeometry(0.08, 0.05, 0.16), inkMat, footL, -0.02);
  bootL.position.z = 0.04;
  mesh(new THREE.CylinderGeometry(0.055, 0.05, 0.36, 8), goldMat, upperLegR, -0.18);
  mesh(new THREE.CylinderGeometry(0.05, 0.045, 0.34, 8), goldMat, lowerLegR, -0.18);
  const bootR = mesh(new THREE.BoxGeometry(0.08, 0.05, 0.16), inkMat, footR, -0.02);
  bootR.position.z = 0.04;

  const armor = mesh(new THREE.BoxGeometry(0.22, 0.2, 0.06), goldMat, armorSock, 0);
  armor.name = "ArmorPlate";
  const crest = mesh(new THREE.SphereGeometry(0.03, 8, 8), goldMat, crestSock, 0);
  crest.name = "Crest";
  crest.material = goldMat.clone();

  const cape = mesh(new THREE.BoxGeometry(0.32, 0.5, 0.04), mat(0x3a2c14, { roughness: 0.9, side: THREE.DoubleSide }), capeSock, -0.2);
  cape.name = "Cape";
  cape.rotation.x = 0.15;

  const halo = mesh(new THREE.TorusGeometry(0.13, 0.012, 8, 24), haloMat, haloSock, 0);
  halo.rotation.x = Math.PI / 2;
  halo.name = "Halo";

  function makeWing(sock, side) {
    const g = new THREE.Group();
    g.name = side > 0 ? "WingMeshL" : "WingMeshR";
    for (let i = 0; i < 7; i++) {
      const len = 0.55 - i * 0.04;
      const plane = new THREE.Mesh(new THREE.PlaneGeometry(0.09, len), featherMat);
      plane.position.set(side * (0.04 + i * 0.015), 0.12 + i * 0.03, -0.08 - i * 0.02);
      plane.rotation.z = side * (0.4 + i * 0.08);
      plane.rotation.x = -0.5;
      plane.castShadow = true;
      g.add(plane);
    }
    sock.add(g);
    return g;
  }
  makeWing(wingL, 1);
  makeWing(wingR, -1);

  const book = new THREE.Group();
  book.name = "Book";
  const cover = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.02, 0.16), goldMat);
  const page = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.005, 0.15), mat(0xfbf3d6, { roughness: 0.95 }));
  page.name = "Page";
  page.position.y = 0.01;
  book.add(cover);
  book.add(page);
  book.position.set(0.02, 0.02, 0.06);
  book.rotation.x = -0.4;
  handL.add(book);

  root.userData.parts = { halo, cape, armor, crest, book, page, wingL, wingR };
  return root;
}

function applyAttachments(root, unlocked) {
  const parts = root.userData.parts || {};
  if (parts.halo) parts.halo.visible = unlocked >= 1;
  if (parts.halo && parts.halo.material && parts.halo.material.emissiveIntensity != null) {
    parts.halo.material.emissiveIntensity = unlocked >= 1 ? 1.4 : 0.2;
  }
  if (parts.wingL) parts.wingL.visible = unlocked >= 2;
  if (parts.wingR) parts.wingR.visible = unlocked >= 2;
  if (parts.armor) {
    parts.armor.visible = unlocked >= 3;
    if (parts.armor.material && parts.armor.material.color) {
      parts.armor.material.color.setHex(unlocked >= 3 ? 0xf0c85a : 0xc9a44c);
    }
  }
  if (parts.cape) parts.cape.visible = unlocked >= 4;
  if (parts.crest) {
    parts.crest.visible = unlocked >= 5;
    if (parts.crest.material && parts.crest.material.color) {
      parts.crest.material.color.setHex(0xffe08a);
    }
  }
  const status = document.getElementById("layer-status");
  if (status) {
    status.textContent = unlocked <= 0 ? "Look: default" : "Look: " + LAYERS.slice(0, unlocked).map((L) => L.name).join(", ");
  }
}

function findBones(root) {
  const map = {};
  root.traverse((o) => { if (o.name) map[o.name] = o; });
  return map;
}

function layoutYard(yard, camera, renderer) {
  const sageBox = document.querySelector(".sage");
  const main = document.querySelector("main.base");
  const inline = window.innerWidth <= 900;
  yard.classList.toggle("ckw-yard-inline", inline);
  if (inline && sageBox && main) main.insertBefore(yard, sageBox);
  else document.body.insertBefore(yard, document.body.firstChild);
  if (camera) {
    if (inline) { camera.fov = 40; camera.position.set(0.1, 1.45, 3.15); camera.lookAt(-0.2, 0.85, 1.2); }
    else { camera.fov = 38; camera.position.set(0.35, 2.15, 4.6); camera.lookAt(0, 0.85, 0); }
    camera.updateProjectionMatrix();
  }
  if (renderer) {
    const w = inline ? yard.clientWidth : window.innerWidth;
    const h = inline ? yard.clientHeight : window.innerHeight;
    renderer.setSize(Math.max(1, w), Math.max(1, h), false);
    if (camera) { camera.aspect = w / Math.max(1, h); camera.updateProjectionMatrix(); }
  }
  return inline;
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

  renderer.setPixelRatio(Math.min(1.5, window.devicePixelRatio || 1));
  renderer.setSize(window.innerWidth, window.innerHeight, false);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x07070a);
  scene.fog = new THREE.FogExp2(0x07070a, 0.045);

  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 40);
  let narrow = layoutYard(yard, camera, renderer);
  renderer.setPixelRatio(Math.min(1.5, window.devicePixelRatio || 1));


  scene.add(new THREE.HemisphereLight(0x1c2744, 0x2a2010, 0.7));
  const moon = new THREE.DirectionalLight(0xc5d0ee, 0.55);
  moon.position.set(-3, 5.5, 2.5);
  moon.castShadow = true;
  moon.shadow.mapSize.set(512, 512);
  moon.shadow.camera.near = 1;
  moon.shadow.camera.far = 14;
  moon.shadow.camera.left = moon.shadow.camera.bottom = -4;
  moon.shadow.camera.right = moon.shadow.camera.top = 4;
  scene.add(moon);
  const lantern = new THREE.PointLight(0xe8c25a, 1.35, 7, 1.6);
  lantern.position.set(0, 1.15, 0);
  lantern.castShadow = false;
  scene.add(lantern);

  const floor = new THREE.Mesh(
    new THREE.CircleGeometry(4.2, 48),
    mat(0x16161c, { roughness: 0.95, metalness: 0.02 })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);

  const table = new THREE.Group();
  table.name = "StoneTable";
  const top = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.7, 0.07, 32), mat(0x4a4a52, { roughness: 0.8 }));
  top.position.y = 0.72;
  top.castShadow = true;
  top.receiveShadow = true;
  const pedestal = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.22, 0.68, 16), mat(0x3a3a42, { roughness: 0.85 }));
  pedestal.position.y = 0.34;
  pedestal.castShadow = true;
  table.add(top);
  table.add(pedestal);
  scene.add(table);

  let sage = null, usingGLB = false, mixer = null, clips = {};
  try {
    // Only request the model when index.html opts in (data-glb on the canvas),
    // so a missing file never logs a 404 console error (smoke test stays green).
    if (!canvas.hasAttribute("data-glb")) throw new Error("no sage.glb yet");
    const gltf = await new Promise((ok, err) => {
      const loader = new GLTFLoader();
      loader.load(GLB_URL, ok, undefined, err);
    });
    sage = gltf.scene;
    sage.name = "Sage";
    usingGLB = true;
    mixer = new THREE.AnimationMixer(sage);
    (gltf.animations || []).forEach((c) => { clips[c.name] = c; });
    if (label) label.hidden = true;
  } catch (e) {
    sage = buildStandIn();
    usingGLB = false;
    if (label) {
      label.hidden = false;
      label.textContent = "Placeholder 3D, not Sage's final look";
    }
  }
  scene.add(sage);

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

  let yaw = 0, tx = narrow ? -0.55 : -1.4, tz = narrow ? 1.55 : 1.4, vx = 0, vz = 0;
  sage.position.set(tx, 0, tz);
  sage.rotation.y = yaw;
  let state = "idle_pages", stateT = 0, busy = false, hidden = false, posed = false;
  let action = null, lookTarget = null;
  const clock = new THREE.Clock();

  function playClip(name, loop) {
    if (!mixer || !clips[name]) return false;
    if (action) action.fadeOut(0.2);
    action = mixer.clipAction(clips[name]);
    action.reset().setLoop(loop === false ? THREE.LoopOnce : THREE.LoopRepeat, loop === false ? 1 : Infinity).fadeIn(0.2).play();
    return true;
  }

  function poseProcedural(name, t, dt) {
    const b = bones;
    const hip = b.Hips, uL = b.UpperLegL, lL = b.LowerLegL, fL = b.FootL;
    const uR = b.UpperLegR, lR = b.LowerLegR, fR = b.FootR;
    const aR = b.UpperArmR, laR = b.LowerArmR, aL = b.UpperArmL;
    const hd = b.Head, pg = sage.getObjectByName("Page");
    if (!hip) return;
    if (name === "walk") {
      const s = Math.sin(t * 8), c = Math.cos(t * 8);
      if (uL) uL.rotation.x = s * 0.55;
      if (lL) lL.rotation.x = Math.max(0, -s) * 0.7;
      if (fL) fL.rotation.x = s * 0.15;
      if (uR) uR.rotation.x = -s * 0.55;
      if (lR) lR.rotation.x = Math.max(0, s) * 0.7;
      if (fR) fR.rotation.x = -s * 0.15;
      hip.position.y = 0.95 + Math.abs(s) * 0.03;
      if (aL) aL.rotation.x = -s * 0.25;
      if (aR) aR.rotation.x = s * 0.25;
    } else if (name === "idle_pages") {
      if (uL) uL.rotation.x = 0;
      if (uR) uR.rotation.x = 0;
      if (lL) lL.rotation.x = 0.05;
      if (lR) lR.rotation.x = 0.05;
      hip.position.y = 0.95 + Math.sin(t * 1.6) * 0.008;
      if (aL) aL.rotation.x = -0.6;
      if (aR) aR.rotation.x = -0.45;
      if (pg) pg.rotation.z = Math.sin(t * 2.2) * 0.45;
      if (hd) hd.rotation.x = -0.15 + Math.sin(t * 1.4) * 0.04;
    } else if (name === "talk") {
      hip.position.y = 0.95;
      if (hd) hd.rotation.x = Math.sin(t * 6) * 0.08;
      if (aR) aR.rotation.x = -0.35 + Math.sin(t * 5) * 0.1;
      if (pg) pg.rotation.z = 0;
    } else if (name === "wave") {
      if (aR) aR.rotation.z = 0.3;
      if (aR) aR.rotation.x = -2.1 + Math.sin(t * 9) * 0.35;
      if (laR) laR.rotation.x = -0.2;
    } else if (name === "look") {
      if (hd) {
        hd.rotation.y = Math.sin(t * 0.8) * 0.45;
        hd.rotation.x = Math.sin(t * 0.5) * 0.15;
      }
    } else if (name === "pause") {
      if (uL) uL.rotation.x = 0;
      if (uR) uR.rotation.x = 0;
      hip.position.y = 0.95;
    }
  }

  function setState(name) {
    state = name;
    stateT = 0;
    if (usingGLB) playClip(name === "idle_pages" ? "idle_pages" : name, true);
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

  function pickFreeWill() {
    const roll = Math.random();
    if (roll < 0.4) return "walk";
    if (roll < 0.55) return "pause";
    if (roll < 0.7) return "look";
    if (roll < 0.8) return "wave";
    return "idle_pages";
  }

  let nextAt = 1.5, dest = null;

  function goTalk() {
    busy = true;
    dest = { x: -1.15, z: 2.05 };
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
    renderer.setPixelRatio(Math.min(1.5, window.devicePixelRatio || 1));
  }
  window.addEventListener("resize", onResize);

  document.addEventListener("visibilitychange", () => {
    hidden = document.hidden;
    if (!hidden) clock.getDelta();
  });

  if (flags.pose) {
    posed = true;
    if (flags.pose === "walk") {
      if (window.innerWidth <= 900) {
        sage.position.set(-0.7, 0, 1.7);
        yaw = 0.6; sage.rotation.y = yaw;
        dest = { x: 0.2, z: 1.45 };
      } else {
        sage.position.set(-1.55, 0, 1.85);
        yaw = 0.4; sage.rotation.y = yaw;
        dest = { x: -1.05, z: 1.45 };
      }
      setState("walk");
    }
    else if (flags.pose === "talk") { setState("talk"); busy = true; }
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
  function tick() {
    requestAnimationFrame(tick);
    if (hidden) return;
    const dt = Math.min(0.05, clock.getDelta());
    stateT += dt;
    if (mixer) mixer.update(dt);

    if (!posed && !busy && !reduce.matches) {
      nextAt -= dt;
      if (nextAt <= 0 && state !== "walk") {
        const n = pickFreeWill();
        if (n === "walk") dest = wanderTarget();
        setState(n);
        nextAt = n === "walk" ? 99 : (2.5 + Math.random() * 3);
      }
    }

    if (state === "walk" && dest && !reduce.matches) {
      const dx = dest.x - sage.position.x, dz = dest.z - sage.position.z;
      const dist = Math.hypot(dx, dz);
      const speed = 0.85;
      if (dist < 0.05) {
        dest = null;
        if (!busy) { setState("idle_pages"); nextAt = 2 + Math.random() * 2; }
        else setState("talk");
      } else {
        const step = speed * dt;
        sage.position.x += dx / dist * Math.min(step, dist);
        sage.position.z += dz / dist * Math.min(step, dist);
        faceToward(dest.x, dest.z, dt, 3.2);
        tWalk += dt;
      }
    } else if (lookTarget && bones.Head && state !== "walk") {
      const hd = bones.Head;
      hd.rotation.y = THREE.MathUtils.lerp(hd.rotation.y || 0, lookTarget.x * 0.4, 0.08);
      hd.rotation.x = THREE.MathUtils.lerp(hd.rotation.x || 0, -lookTarget.y * 0.15, 0.08);
    }

    if (!usingGLB && !reduce.matches) poseProcedural(state, state === "walk" ? tWalk : stateT, dt);
    else if (!usingGLB && reduce.matches) poseProcedural("pause", 0, dt);

    renderer.render(scene, camera);
  }
  tick();
}

boot().catch((e) => failTo2D(e && e.message ? e.message : e));
