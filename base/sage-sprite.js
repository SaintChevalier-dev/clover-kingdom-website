/* Sage sprite v3: Sage herself, drawn as an articulated inline SVG from her
   2026-10-28 turnaround (blonde wavy hair, short gold horns, gold halo, gold
   plate over a black bodysuit, charcoal tabard and cloak, gold greaves,
   crystal staff, white feathered wings). Her face is a simple ORIGINAL
   stylized face (blue eyes, rainbow cheek glint); not a copy of any character.
   Free will protocol: a weighted-random behavior loop (walk, idle, read,
   stretch, flutter, glance, perch, wave); chat interrupts bring her back to
   the chat to listen and speak. Never covers the login bar or chat, never
   blocks clicks, no sound/popups/own messages, pauses when the tab is hidden,
   honors prefers-reduced-motion. No libraries, no images. */
(function () {
"use strict";
/* SAGE_DRAW_START */
/* Sage figure: side/three-quarter view facing right, articulated for walking.
   Original stylized face (blue eyes, rainbow cheek glint); not based on any existing character. */
const SAGE_VB = "-10 -4 240 294";
function sageFeather(ax, ay, ang, len, wid, cls) {
  const r = ang * Math.PI / 180, dx = Math.cos(r), dy = Math.sin(r), nx = -dy, ny = dx;
  const tx = ax + dx * len, ty = ay + dy * len;
  const m1x = ax + dx * len * 0.55 + nx * wid, m1y = ay + dy * len * 0.55 + ny * wid;
  const m2x = ax + dx * len * 0.55 - nx * wid * 0.75, m2y = ay + dy * len * 0.55 - ny * wid * 0.75;
  const t1x = tx - dx * wid * 0.6 + nx * wid * 0.45, t1y = ty - dy * wid * 0.6 + ny * wid * 0.45;
  const f = (n) => n.toFixed(1);
  return `<path class="${cls}" d="M${f(ax)} ${f(ay)} Q${f(m1x)} ${f(m1y)} ${f(t1x)} ${f(t1y)} Q${f(tx)} ${f(ty)} ${f(tx - nx * wid * 0.2)} ${f(ty - ny * wid * 0.2)} Q${f(m2x)} ${f(m2y)} ${f(ax)} ${f(ay)}Z"/>` +
         `<path class="ss-shaft" d="M${f(ax)} ${f(ay)} L${f(ax + dx * len * 0.9)} ${f(ay + dy * len * 0.9)}"/>`;
}
/* One wing, root at (0,0), arching up and back (to the left), feathers hanging down. */
function sageWing(scale) {
  let s = "";
  const lerp = (a, b, t) => a + (b - a) * t;
  const arm = (t) => t < 0.55 ? { x: lerp(0, -30, t / 0.55), y: lerp(-6, -82, t / 0.55) }
                               : { x: lerp(-30, -58, (t - 0.55) / 0.45), y: lerp(-82, -70, (t - 0.55) / 0.45) };
  // primaries: along the hand (wrist -> tip), longest, hanging down and back
  for (let i = 9; i >= 0; i--) {
    const t = i / 9, A = arm(0.55 + 0.45 * t);
    s += sageFeather(A.x, A.y, lerp(96, 116, t), lerp(176, 132, t) * scale, 8.5, "ss-fp");
  }
  // secondaries: along the forearm (root -> wrist)
  for (let i = 0; i <= 10; i++) {
    const t = i / 10, A = arm(0.55 * t);
    s += sageFeather(A.x, A.y, lerp(88, 97, t), lerp(84, 168, t) * scale, 8, "ss-fs");
  }
  // greater coverts
  for (let i = 0; i <= 12; i++) {
    const t = i / 12, A = arm(t);
    s += sageFeather(A.x + 2, A.y + 4, lerp(86, 112, t), lerp(46, 58, t) * scale, 7.5, "ss-fc");
  }
  // lesser coverts
  for (let i = 0; i <= 14; i++) {
    const t = i / 14, A = arm(t);
    s += sageFeather(A.x + 1, A.y + 1, lerp(80, 110, t), 24 * scale, 6.5, "ss-fl");
  }
  s += `<path class="ss-fedge" d="M0 -6 Q-14 -52 -30 -82 Q-44 -92 -58 -70"/>`;
  return s;
}
function sageStaffShaft() {
  let d = "M0 0", e = "M0 0";
  for (let y = 0; y <= 210; y += 6) { d += ` L${(Math.sin(y / 9) * 1.1).toFixed(1)} ${y}`; e += ` L${(-Math.sin(y / 9) * 1.1).toFixed(1)} ${y}`; }
  return `<path class="ss-staff-a" d="${d}"/><path class="ss-staff-b" d="${e}"/>`;
}
function sageLeg(id, far) {
  const c = far ? " ss-far" : "";
  return `<g class="ss-leg${c}" id="${id}">
      <path class="ss-thigh" d="M-9 0 L9 0 L8 42 L-7 42 Z"/>
      <path class="ss-plate" d="M-8 6 L8 6 M-7 22 L7 22"/>
      <g class="ss-shin-g">
        <circle class="ss-knee" cx="0" cy="42" r="6.5"/>
        <path class="ss-shin" d="M-7 44 L7 44 L6 86 L-6 86 Z"/>
        <path class="ss-plate" d="M-5 58 L5 58 M-5 72 L5 72"/>
        <g class="ss-foot-g">
          <path class="ss-foot" d="M-7 84 L6 84 L8 92 L20 96 Q22 100 18 101 L-7 101 Z"/>
        </g>
      </g>
    </g>`;
}
function sageSVG() {
  return `
<svg class="ss-svg" viewBox="${SAGE_VB}" aria-hidden="true" focusable="false">
  <defs>
    <linearGradient id="ss-gold" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#fff0b0"/><stop offset=".35" stop-color="#e2b64a"/><stop offset=".7" stop-color="#a87a1e"/><stop offset="1" stop-color="#6e4c10"/>
    </linearGradient>
    <linearGradient id="ss-gold-v" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#8a6216"/><stop offset=".4" stop-color="#f3d27a"/><stop offset=".7" stop-color="#c8962e"/><stop offset="1" stop-color="#7a5512"/>
    </linearGradient>
    <linearGradient id="ss-feather" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#ffffff"/><stop offset=".6" stop-color="#f1ede4"/><stop offset="1" stop-color="#cfc8ba"/>
    </linearGradient>
    <linearGradient id="ss-feather-far" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#dcd6ca"/><stop offset="1" stop-color="#a9a296"/>
    </linearGradient>
    <linearGradient id="ss-hair" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#f8e3a0"/><stop offset=".5" stop-color="#e3bf62"/><stop offset="1" stop-color="#c49a3e"/>
    </linearGradient>
    <linearGradient id="ss-cloak" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#3a3b40"/><stop offset="1" stop-color="#1f2024"/>
    </linearGradient>
    <radialGradient id="ss-orb" cx=".5" cy=".5" r=".5">
      <stop offset="0" stop-color="#ffffff"/><stop offset=".5" stop-color="#d9f1ff"/><stop offset="1" stop-color="#8fd3ff" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="ss-rainbow" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#ff5a5a"/><stop offset=".25" stop-color="#ffd24a"/><stop offset=".5" stop-color="#5ee07a"/><stop offset=".75" stop-color="#4ab8ff"/><stop offset="1" stop-color="#b06bff"/>
    </linearGradient>
    <filter id="ss-glow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>
  <g class="ss-shadow-g"><ellipse class="ss-shadow" cx="128" cy="283" rx="34" ry="5"/></g>
  <g class="ss-body" id="ss-body">
    <g class="ss-wing ss-wing-far" id="ss-wing-far" transform="translate(136 88) rotate(14)"><g class="ss-wing-in">${sageWing(0.94)}</g></g>
    <path class="ss-cloak" id="ss-cloak" d="M110 92 Q96 150 88 262 Q112 270 132 262 L134 150 Z"/>
    <path class="ss-hair-back" d="M116 40 Q96 58 100 84 Q104 100 96 116 Q92 132 100 146 Q104 136 110 132 Q106 120 114 106 Q122 90 118 76 Q124 60 130 48 Z"/>
    <g transform="translate(122 168)">${sageLeg("ss-leg-far", true)}</g>
    <g class="ss-wing ss-wing-near" id="ss-wing-near" transform="translate(108 94)"><g class="ss-wing-in">${sageWing(1)}</g></g>
    <path class="ss-suit" d="M112 80 L136 80 L140 126 L134 172 L110 172 L106 126 Z"/>
    <path class="ss-armor" d="M110 84 Q124 78 140 86 L143 112 Q138 128 132 136 L114 136 Q106 122 106 106 Z"/>
    <path class="ss-armor-line" d="M125 86 Q127 110 124 134 M110 104 Q124 113 142 101 M112 122 Q124 128 138 120"/>
    <path class="ss-gem" d="M124 98 l3 4 -3 4 -3 -4z"/>
    <path class="ss-belt" d="M108 136 L138 136 L140 146 L106 146 Z"/>
    <path class="ss-faulds" d="M106 146 L140 146 L142 170 L124 176 L104 168 Z"/>
    <g transform="translate(126 168)">${sageLeg("ss-leg-near", false)}</g>
    <path class="ss-tabard" id="ss-tabard" d="M118 146 L136 146 L140 236 L127 248 L114 236 Z"/>
    <path class="ss-tabard-trim" d="M118 230 L127 240 L136 230"/>
    <path class="ss-pauldron" d="M110 82 Q122 74 136 84 Q138 96 132 100 Q120 94 108 98 Z"/>
    <path class="ss-neck" d="M118 66 L130 66 L131 80 L117 80 Z"/>
    <g class="ss-head" id="ss-head">
      <path class="ss-hair-back2" d="M108 40 Q100 66 108 92 Q112 104 106 118 Q120 112 122 92 Q126 70 132 52 Z"/>
      <ellipse class="ss-skin" cx="128" cy="50" rx="13.5" ry="16"/>
      <path class="ss-skin" d="M138 52 Q144 56 141 60 Q139 62 137 62 Z"/>
      <path class="ss-eye-white" d="M131 47 Q135.5 44.5 140 47 Q135.5 50 131 47 Z"/>
      <circle class="ss-iris" cx="136" cy="47.2" r="2.1"/>
      <circle class="ss-pupil" cx="136.4" cy="47.2" r="0.9"/>
      <path class="ss-lash" d="M130.5 46.5 Q135.5 43.5 140.5 46.3"/>
      <path class="ss-brow" d="M131 42.5 Q136 40.5 140.5 42.3"/>
      <path class="ss-rainbow" d="M132 54.5 L138.5 53.4"/>
      <path class="ss-mouth" d="M133.5 63 Q137 64.5 139.5 62.5"/>
      <path class="ss-hair-front" d="M113 52 Q110 32 128 31 Q144 31 143 45 Q138 38 130 39 Q122 41 121 52 Q120 62 123 70 Q114 66 113 52 Z"/>
      <path class="ss-hair-strand" d="M121 46 Q116 58 121 70 Q125 80 119 92 Q115 100 119 110"/><path class="ss-hair-strand ss-hs2" d="M116 50 Q110 66 114 80 Q118 92 110 104"/>
      <path class="ss-horn" d="M119 35 Q112 26 116 16 Q117 12 121 11 Q118 18 120 24 Q122 30 125 33 Z"/>
      <path class="ss-horn" d="M132 33 Q132 22 138 15 Q141 12 144 12 Q139 18 138 24 Q137 29 137 33 Z"/>
      <ellipse class="ss-halo" cx="127" cy="12" rx="17" ry="4.5"/>
    </g>
    <g class="ss-arm" id="ss-arm">
      <g class="ss-staff" id="ss-staff" transform="translate(156 58)">
        <g transform="translate(0 30)">${sageStaffShaft()}</g>
        <path class="ss-staff-ring" d="M-9 26 Q-12 12 -4 6 M9 26 Q12 12 4 6"/>
        <circle class="ss-orb" cx="0" cy="18" r="9"/>
        <path class="ss-prism" d="M0 -6 L5 8 L0 16 L-5 8 Z"/>
        <path class="ss-prism-glint" d="M2 18 L14 14" />
        <path class="ss-staff-gem" d="M0 30 l3 4 -3 4 -3 -4z"/>
      </g>
      <path class="ss-sleeve" d="M121 92 L133 89 L138 118 L128 121 Z M129 115 L138 113 L151 127 L145 133 Z"/>
      <path class="ss-bracer" d="M134 116 L141 114 L150 125 L144 131 Z"/><circle class="ss-elbow" cx="133" cy="118" r="4"/>
      <ellipse class="ss-hand" cx="152" cy="132" rx="5" ry="5.5"/>
      <path class="ss-pauldron2" d="M122 84 Q134 80 140 90 Q140 98 132 100 Q126 94 120 94 Z"/>
    </g>
    <g class="ss-book" id="ss-book" transform="translate(176 104)">
      <circle class="ss-book-light" cx="0" cy="-4" r="13"/>
      <path class="ss-page" d="M0 0 L-13 -5 L-13 6 L0 10 Z"/>
      <path class="ss-page ss-page2" d="M0 0 L13 -5 L13 6 L0 10 Z"/>
      <path class="ss-spine" d="M0 0 L0 10"/>
      <path class="ss-runes" d="M-10 -2 L-3 1 M-10 1 L-3 4 M3 1 L10 -2 M3 4 L10 1"/>
    </g>
  </g>
</svg>`;
}
/* SAGE_DRAW_END */

/* SAGE_POSE_START */
function sagePoseRefs(svg) {
  const q = (id) => svg.querySelector("#" + id);
  const leg = (id) => { const g = q(id); return { hip: g, knee: g.querySelector(".ss-shin-g"), foot: g.querySelector(".ss-foot-g") }; };
  return { body: q("ss-body"), near: leg("ss-leg-near"), far: leg("ss-leg-far"), cloak: q("ss-cloak"), tabard: q("ss-tabard"),
    wingN: q("ss-wing-near").firstElementChild, wingF: q("ss-wing-far").firstElementChild, head: q("ss-head"), arm: q("ss-arm") };
}
/* o: { walk: phase or null, wing: deg, arm: deg, head: deg, lift: px } */
function sagePose(R, o) {
  const d = (x) => x.toFixed(2);
  let hipN = 0, hipF = 0, kN = 0, kF = 0, fN = 0, fF = 0, bodyY = 0, sway = 0, armSwing = 0, wingSway = 0;
  if (o.walk != null) {
    const p = o.walk;
    hipN = -24 * Math.sin(p); hipF = -24 * Math.sin(p + Math.PI);
    kN = 3 + 46 * Math.max(0, Math.cos(p)); kF = 3 + 46 * Math.max(0, Math.cos(p + Math.PI));
    fN = -(hipN + kN) * (Math.cos(p) > 0 ? 0.55 : 1); fF = -(hipF + kF) * (Math.cos(p + Math.PI) > 0 ? 0.55 : 1);
    const stance = Math.cos(p) <= 0 ? hipN : hipF;
    bodyY = 86 * (1 - Math.cos(stance * Math.PI / 180)) - 1.2 * Math.cos(2 * p);
    sway = 3 * Math.sin(2 * p);
    armSwing = 5 * Math.sin(p);
    wingSway = 2.5 * Math.sin(2 * p);
  } else if (o.sit) {
    hipN = -80; hipF = -72; kN = 82; kF = 88; fN = -4; fF = -10; bodyY = 30;
  }
  R.near.hip.setAttribute("transform", `rotate(${d(hipN)})`);
  R.near.knee.setAttribute("transform", `rotate(${d(kN)} 0 42)`);
  R.near.foot.setAttribute("transform", `rotate(${d(fN)} 0 86)`);
  R.far.hip.setAttribute("transform", `rotate(${d(hipF)})`);
  R.far.knee.setAttribute("transform", `rotate(${d(kF)} 0 42)`);
  R.far.foot.setAttribute("transform", `rotate(${d(fF)} 0 86)`);
  R.body.setAttribute("transform", `translate(0 ${d(bodyY - (o.lift || 0))})`);
  R.cloak.setAttribute("transform", `rotate(${d(sway + (o.walk != null ? 4 : 0))} 110 92)`);
  R.tabard.setAttribute("transform", `rotate(${d(-hipN * 0.35)} 127 146)`);
  R.wingN.setAttribute("transform", `rotate(${d(wingSway + (o.wing || 0))})`);
  R.wingF.setAttribute("transform", `rotate(${d(-wingSway * 0.7 + (o.wing || 0) * 0.9)})`);
  R.head.setAttribute("transform", `rotate(${d(o.head || 0)} 124 66)`);
  R.arm.setAttribute("transform", `rotate(${d(armSwing + (o.arm || 0))} 126 88)`);
}
/* SAGE_POSE_END */

/* ---------- controller: free will protocol ---------- */
const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
const narrow = window.matchMedia("(max-width: 900px)");

const sprite = document.createElement("div");
sprite.className = "ss";
sprite.setAttribute("aria-hidden", "true");
const flipper = document.createElement("div");
flipper.className = "ss-pose";
const bob = document.createElement("div");
bob.className = "ss-bob";
bob.innerHTML = sageSVG();
flipper.appendChild(bob);
sprite.appendChild(flipper);
const R = sagePoseRefs(bob.querySelector("svg"));

const stage = document.createElement("div");
stage.className = "ss-stage";
stage.setAttribute("aria-hidden", "true");
const sageBox = document.querySelector(".sage");
const loginBar = document.querySelector(".login");
const form = document.getElementById("sage-form");
const log = document.getElementById("sage-log");
sageBox.parentNode.insertBefore(stage, sageBox);

let pos = { x: 0, y: 0 }, facingLeft = false;
const P = { walk: null, wing: 0, arm: 0, head: 0, lift: 0, sit: false };
let cursor = null, state = "idle", busy = false;
let stateTimer = null, speakTimer = null, raf = 0;
const lastRun = {};
const rand = (a, b) => a + Math.random() * (b - a);

function size() { return { w: sprite.offsetWidth || 190, h: sprite.offsetHeight || 233 }; }
function hits(x, y, w, h, rects, pad) {
  return rects.some((r) => x < r.right + pad && x + w > r.left - pad && y < r.bottom + pad && y + h > r.top - pad);
}
function blockers() { return [loginBar.getBoundingClientRect(), sageBox.getBoundingClientRect()]; }
function pathHits(x, y, w, h, rects, pad) {
  if (narrow.matches) return false;
  for (let i = 1; i <= 32; i++) {
    const t = i / 32;
    if (hits(pos.x + (x - pos.x) * t, pos.y + (y - pos.y) * t, w, h, rects, pad)) return true;
  }
  return false;
}
function place(x, y) {
  pos = { x, y };
  sprite.style.transform = "translate(" + Math.round(x) + "px," + Math.round(y) + "px)";
}
function face(left) { facingLeft = left; flipper.style.transform = left ? "scaleX(-1)" : "none"; }
function stageLeft() { return narrow.matches ? stage.getBoundingClientRect().left : 0; }
function centerX() { return stageLeft() + pos.x + size().w / 2; }
function faceChat() { const r = sageBox.getBoundingClientRect(); face(r.left + r.width / 2 < centerX()); }
function draw() { sagePose(R, P); }

/* Destinations: free space only, a real distance away, and a straight walk
   that never crosses the login bar or the chat card. */
function walkSpot(minDist) {
  const { w, h } = size();
  if (narrow.matches) {
    const max = Math.max(0, stage.clientWidth - w);
    for (let i = 0; i < 20; i++) { const x = Math.random() * max; if (Math.abs(x - pos.x) >= Math.min(minDist, max / 2)) return { x, y: 0 }; }
    return { x: Math.random() * max, y: 0 };
  }
  const rects = blockers(), vw = window.innerWidth, vh = window.innerHeight;
  let best = null;
  for (let i = 0; i < 80; i++) {
    const x = 8 + Math.random() * Math.max(0, vw - w - 16);
    const y = 8 + Math.random() * Math.max(0, vh - h - 16);
    if (hits(x, y, w, h, rects, 16) || pathHits(x, y, w, h, rects, 8)) continue;
    const d = Math.hypot(x - pos.x, y - pos.y);
    if (d >= minDist) return { x, y };
    if (!best || d > best.d) best = { x, y, d };
  }
  return best;
}
/* A free spot right beside the chat card (for perching and for coming back to talk). */
function besideChat() {
  const { w, h } = size();
  if (narrow.matches) return { x: Math.max(0, stage.clientWidth - w), y: 0 };
  const r = sageBox.getBoundingClientRect(), rects = blockers();
  const y = Math.min(window.innerHeight - h - 8, Math.max(8, r.top + 40));
  const sides = centerX() > r.left + r.width / 2 ? [r.right + 10, r.left - w - 10] : [r.left - w - 10, r.right + 10];
  for (const x of sides) {
    if (x >= 0 && x + w <= window.innerWidth && !hits(x, y, w, h, rects, 6) && !pathHits(x, y, w, h, rects, 4)) return { x, y };
  }
  return null;
}

/* Animation loop: runs only while she is walking or doing a timed gesture. */
let walkTo = null, onArrive = null, gesture = null, lastT = 0;
function loop(t) {
  raf = 0;
  const dt = Math.min(0.05, (t - (lastT || t)) / 1000); lastT = t;
  if (walkTo) {
    const dx = walkTo.x - pos.x, dy = walkTo.y - pos.y, dist = Math.hypot(dx, dy);
    const speed = narrow.matches ? 44 : 80; /* px per second */
    const step = speed * dt;
    if (dist <= step) {
      place(walkTo.x, walkTo.y); walkTo = null; P.walk = null;
      sprite.classList.remove("ss-walking");
      const cb = onArrive; onArrive = null; if (cb) cb();
    } else {
      place(pos.x + dx / dist * step, pos.y + dy / dist * step);
      const stride = narrow.matches ? 30 : 56; /* px per half cycle */
      P.walk = (P.walk || 0) + Math.PI * step / stride;
    }
  }
  if (gesture) {
    const k = (t - gesture.start) / gesture.dur;
    if (k >= 1) { gesture.end(); gesture = null; }
    else gesture.step(k);
  }
  draw();
  if (walkTo || gesture) raf = requestAnimationFrame(loop);
  else lastT = 0;
}
function kick() { if (!raf && !document.hidden) raf = requestAnimationFrame(loop); }
function walk(to, cb) {
  if (!to) { if (cb) cb(); return; }
  P.sit = false; P.head = 0; P.arm = 0;
  face(stageLeft() + to.x + size().w / 2 < centerX());
  sprite.classList.add("ss-walking");
  walkTo = to; onArrive = cb; kick();
}
function stopWalk() { walkTo = null; onArrive = null; P.walk = null; sprite.classList.remove("ss-walking"); }
function play(dur, step, end) { gesture = { start: performance.now(), dur, step, end }; kick(); }

function setStateClass(name) {
  sprite.className = sprite.className.replace(/\bss-st-\S+/g, "").trim() + " ss-st-" + name;
}

/* The free will protocol. w = how often, dur = how long she stays in it (ms),
   cd = cooldown before she picks it again, move = needs motion allowed. */
const STATES = {
  walk:    { w: 4,   dur: [2500, 5000],  cd: 0,     move: true },
  idle:    { w: 2.5, dur: [3000, 7000],  cd: 0 },
  read:    { w: 2,   dur: [7000, 12000], cd: 20000 },
  stretch: { w: 1.5, dur: [2600, 2600],  cd: 15000, move: true },
  flutter: { w: 1,   dur: [1600, 1600],  cd: 12000, move: true },
  glance:  { w: 1.5, dur: [2500, 4000],  cd: 10000, need: () => !!cursor },
  perch:   { w: 1.5, dur: [9000, 15000], cd: 30000, move: true },
  wave:    { w: 1,   dur: [2000, 2000],  cd: 25000, move: true },
};
function chooseState() {
  const now = Date.now();
  const options = Object.keys(STATES).filter((k) => {
    const s = STATES[k];
    if (k === state && k !== "walk") return false;
    if (s.move && reduce.matches) return false;
    if (s.need && !s.need()) return false;
    return !lastRun[k] || now - lastRun[k] >= s.cd;
  });
  let roll = Math.random() * options.reduce((t, k) => t + STATES[k].w, 0);
  for (const k of options) { roll -= STATES[k].w; if (roll <= 0) return k; }
  return "idle";
}
function hold(name) {
  const d = STATES[name].dur;
  clearTimeout(stateTimer);
  stateTimer = setTimeout(next, rand(d[0], d[1]));
}
function enter(name) {
  state = name; lastRun[name] = Date.now();
  setStateClass(name);
  P.head = 0; P.arm = 0; P.wing = 0;
  if (name !== "perch") P.sit = false;
  clearTimeout(stateTimer);
  if (name === "walk") {
    walk(walkSpot(narrow.matches ? 120 : 260), () => { setStateClass("idle"); hold("walk"); });
    return;
  }
  if (name === "perch") {
    walk(besideChat(), () => { faceChat(); P.sit = true; draw(); hold("perch"); });
    return;
  }
  if (name === "read") { P.head = 10; faceChat(); }
  if (name === "glance" && cursor) { face(cursor.x < centerX()); P.head = cursor.y < pos.y + 40 ? -6 : 5; }
  if (name === "stretch") play(2600, (k) => { P.wing = -22 * Math.sin(Math.PI * k); }, () => { P.wing = 0; });
  if (name === "flutter") play(1600, (k) => { P.wing = -9 * Math.abs(Math.sin(k * Math.PI * 6)); }, () => { P.wing = 0; });
  if (name === "wave") play(2000, (k) => { P.arm = -38 * Math.sin(Math.PI * Math.min(1, k * 1.2)) + 8 * Math.sin(k * Math.PI * 8) * Math.sin(Math.PI * k); }, () => { P.arm = 0; });
  draw();
  hold(name);
}
function next() {
  if (busy || document.hidden) return;
  enter(chooseState());
}

/* Chat interrupts: she walks back beside the chat, listens, then speaks. */
function listen() { faceChat(); P.walk = null; P.head = 6; P.sit = false; draw(); sprite.classList.add("ss-listening"); }
form.addEventListener("submit", () => {
  busy = true;
  /* Sage's reply is added by base.js before this runs, so the speak timer is already set; leave it. */
  clearTimeout(stateTimer);
  gesture = null; P.wing = 0; P.arm = 0;
  setStateClass("idle");
  const r = sageBox.getBoundingClientRect(), { w } = size();
  const near = narrow.matches || pos.x + w > r.left - 60 && pos.x < r.right + 60;
  if (near || reduce.matches) { stopWalk(); listen(); }
  else walk(besideChat(), listen);
});
new MutationObserver((muts) => {
  const sageSpoke = muts.some((m) => Array.from(m.addedNodes).some((n) => n.classList && n.classList.contains("msg-sage")));
  if (!sageSpoke) return;
  busy = true;
  clearTimeout(speakTimer);
  speakTimer = setTimeout(function speak() {
    if (walkTo) { speakTimer = setTimeout(speak, 300); return; }
    sprite.classList.remove("ss-listening");
    sprite.classList.add("ss-speaking");
    P.head = 0; draw();
    speakTimer = setTimeout(() => {
      sprite.classList.remove("ss-speaking");
      busy = false;
      clearTimeout(stateTimer);
      stateTimer = setTimeout(next, 2500);
    }, 2400);
  }, 500);
}).observe(log, { childList: true });

/* Click her to wave. Only her painted shapes take clicks; she never stands on a control. */
bob.addEventListener("click", () => { if (!busy && !reduce.matches && !walkTo) enter("wave"); });
window.addEventListener("mousemove", (e) => { cursor = { x: e.clientX, y: e.clientY }; }, { passive: true });

/* Pause everything when the tab is hidden. */
document.addEventListener("visibilitychange", () => {
  sprite.classList.toggle("ss-paused", document.hidden);
  clearTimeout(stateTimer);
  if (document.hidden) { if (raf) cancelAnimationFrame(raf); raf = 0; lastT = 0; }
  else { if (walkTo || gesture) kick(); else if (!busy) stateTimer = setTimeout(next, 800); }
});

function setMode() {
  stopWalk(); gesture = null;
  const inStage = narrow.matches;
  sprite.classList.toggle("ss-inline", inStage);
  (inStage ? stage : document.body).appendChild(sprite);
  stage.hidden = !inStage;
  const { w, h } = size();
  let s = null;
  if (inStage) s = { x: Math.max(0, stage.clientWidth - w) * 0.2, y: 0 };
  else {
    const rects = blockers();
    for (let i = 0; i < 80 && !s; i++) {
      const x = 8 + Math.random() * Math.max(0, window.innerWidth - w - 16), y = 8 + Math.random() * Math.max(0, window.innerHeight - h - 16);
      if (!hits(x, y, w, h, rects, 16)) s = { x, y };
    }
    s = s || { x: 16, y: window.innerHeight - h - 16 };
  }
  place(s.x, s.y); faceChat(); draw();
}
narrow.addEventListener("change", setMode);
let rz = null;
window.addEventListener("resize", () => {
  clearTimeout(rz);
  rz = setTimeout(() => {
    const { w, h } = size();
    if (!narrow.matches && (hits(pos.x, pos.y, w, h, blockers(), 4) || pos.x + w > window.innerWidth || pos.y + h > window.innerHeight)) setMode();
  }, 200);
});

setMode();
setStateClass("idle");
stateTimer = setTimeout(next, 2000);
window.__sageSprite = { state: () => state, walking: () => !!walkTo }; /* read-only hook for the smoke test */
})();
