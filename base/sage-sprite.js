/* Sage sprite v2: faceless robed figure (halo, wings, tiny clover) with a
   client-side "free will protocol": a weighted-random behavior loop so she
   acts on her own (wander, float, read, flutter, glance, perch, wave), and
   chat events interrupt into listen/speak poses before she resumes.
   Bounds: never covers the login bar or the chat input, no sound, no popups,
   no chat messages of her own, pauses when the tab is hidden, honors
   prefers-reduced-motion. No face is drawn (face rights not cleared). */
(function () {
"use strict";
const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
const narrow = window.matchMedia("(max-width: 900px)");

const SVG = `
<svg viewBox="0 0 120 160" width="120" height="160" aria-hidden="true" focusable="false">
  <defs>
    <linearGradient id="ss-robe" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#f1ecdf"/>
      <stop offset="0.7" stop-color="#bdb6a3"/>
      <stop offset="1" stop-color="#bdb6a3" stop-opacity="0"/>
    </linearGradient>
    <linearGradient id="ss-wing" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#ffffff" stop-opacity="0.85"/>
      <stop offset="1" stop-color="#dfe6f0" stop-opacity="0.15"/>
    </linearGradient>
    <filter id="ss-glow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="2.2" result="b"/>
      <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>
  <g transform="rotate(4 60 150)">
  <g class="ss-wing ss-wing-l">
    <path d="M52 58 C42 40 22 28 8 32 C2 44 10 60 26 68 C36 73 46 72 52 66 Z" fill="url(#ss-wing)"/>
    <path d="M48 60 C38 50 26 44 14 42 M46 64 C36 58 26 56 18 54" stroke="#ffffff" stroke-opacity="0.35" stroke-width="0.8" fill="none"/>
  </g>
  <g class="ss-wing ss-wing-r">
    <path d="M68 58 C78 40 98 28 112 32 C118 44 110 60 94 68 C84 73 74 72 68 66 Z" fill="url(#ss-wing)"/>
    <path d="M72 60 C82 50 94 44 106 42 M74 64 C84 58 94 56 102 54" stroke="#ffffff" stroke-opacity="0.35" stroke-width="0.8" fill="none"/>
  </g>
  <path class="ss-hit" d="M60 44 C50 44 46 50 45 58 L34 152 L86 152 L75 58 C74 50 70 44 60 44 Z" fill="url(#ss-robe)"/>
  <path d="M60 50 L60 150" stroke="#9a937f" stroke-width="0.8" opacity="0.5"/>
  <ellipse class="ss-hit" cx="61" cy="33" rx="9.5" ry="11" fill="#f1ecdf"/>
  <g transform="translate(60 66)" fill="#0a0a0b">
    <circle cx="0" cy="-2.6" r="1.7"/>
    <circle cx="2.5" cy="-0.8" r="1.7"/>
    <circle cx="1.5" cy="2.1" r="1.7"/>
    <circle cx="-1.5" cy="2.1" r="1.7"/>
    <circle cx="-2.5" cy="-0.8" r="1.7"/>
  </g>
  <ellipse class="ss-halo" cx="61" cy="16" rx="14" ry="4" fill="none" stroke="#e8c25a" stroke-width="2.4" filter="url(#ss-glow)"/>
  <g class="ss-book">
    <path d="M60 72 L47 68 L47 80 L60 84 Z" fill="#fbf3d6"/>
    <path d="M60 72 L73 68 L73 80 L60 84 Z" fill="#f3e7bd"/>
    <path d="M60 72 L60 84" stroke="#c9a44c" stroke-width="0.8"/>
    <circle class="ss-book-light" cx="60" cy="68" r="7" fill="#ffd977" opacity="0.35" filter="url(#ss-glow)"/>
  </g>
  </g>
</svg>`;

const sprite = document.createElement("div");
sprite.className = "ss";
sprite.setAttribute("aria-hidden", "true");
const pose = document.createElement("div");
pose.className = "ss-pose";
const bob = document.createElement("div");
bob.className = "ss-bob";
bob.innerHTML = SVG;
pose.appendChild(bob);
sprite.appendChild(pose);

/* Narrow screens: her own strip between the login bar and the chat.
   Wide screens: fixed to the viewport, in the page's free space. */
const stage = document.createElement("div");
stage.className = "ss-stage";
stage.setAttribute("aria-hidden", "true");
const sageBox = document.querySelector(".sage");
const loginBar = document.querySelector(".login");
const form = document.getElementById("sage-form");
const log = document.getElementById("sage-log");
sageBox.parentNode.insertBefore(stage, sageBox);

let pos = { x: 0, y: 0 };
let jumping = false;
let flip = false, tilt = 0;
let cursor = null;
let state = "idle", busy = false;
let stateTimer = null, speakTimer = null;
const lastRun = {};

function size() { return { w: sprite.offsetWidth || 120, h: sprite.offsetHeight || 160 }; }
function hits(x, y, w, h, rects, pad) {
  return rects.some((r) => x < r.right + pad && x + w > r.left - pad && y < r.bottom + pad && y + h > r.top - pad);
}
/* True if gliding in a straight line from the current spot to (x, y) would
   pass over any of the rects. */
function pathHits(x, y, w, h, rects, pad) {
  if (narrow.matches || jumping) return false;
  for (let i = 1; i <= 24; i++) {
    const t = i / 24;
    if (hits(pos.x + (x - pos.x) * t, pos.y + (y - pos.y) * t, w, h, rects, pad)) return true;
  }
  return false;
}
function place(x, y) {
  pos = { x, y };
  sprite.style.transform = "translate(" + Math.round(x) + "px," + Math.round(y) + "px)";
}
function setPose() { pose.style.transform = "scaleX(" + (flip ? -1 : 1) + ") rotate(" + tilt + "deg)"; }
function screenCenterX() {
  const base = narrow.matches ? stage.getBoundingClientRect().left : 0;
  return base + pos.x + size().w / 2;
}
/* The figure leans right by default; flip makes her lean/look left. */
function faceX(x) { flip = x < screenCenterX(); setPose(); }
function faceChat() { const r = sageBox.getBoundingClientRect(); faceX(r.left + r.width / 2); }

function wanderSpot() {
  const { w, h } = size();
  if (narrow.matches) return { x: Math.random() * Math.max(0, stage.clientWidth - w), y: 0 };
  const rects = [loginBar.getBoundingClientRect(), sageBox.getBoundingClientRect()];
  const vw = window.innerWidth, vh = window.innerHeight;
  for (let i = 0; i < 60; i++) {
    const x = 8 + Math.random() * Math.max(0, vw - w - 16);
    const y = 8 + Math.random() * Math.max(0, vh - h - 16);
    if (!hits(x, y, w, h, rects, 16) && !pathHits(x, y, w, h, rects, 8)) return { x, y };
  }
  return null;
}
/* Perch: rest against the left or right edge of the chat card, clear of the
   login bar and the input row. */
function perchSpot() {
  const { w, h } = size();
  if (narrow.matches) return { x: Math.max(0, stage.clientWidth - w), y: 0 };
  const r = sageBox.getBoundingClientRect();
  const avoid = [loginBar.getBoundingClientRect(), form.getBoundingClientRect()];
  const y = Math.min(window.innerHeight - h - 8, Math.max(8, r.bottom - h - 70));
  const sides = Math.random() < 0.5 ? [r.right - 8, r.left - w + 8] : [r.left - w + 8, r.right - 8];
  for (const x of sides) {
    if (x >= 0 && x + w <= window.innerWidth && !hits(x, y, w, h, avoid, 12) &&
        !pathHits(x, y, w, h, avoid, 8)) return { x, y };
  }
  return null;
}

function setStateClass(name) {
  sprite.className = sprite.className.replace(/\bss-st-\S+/g, "").trim() + " ss-st-" + name;
}

/* The free will protocol. weight = how often, dur = how long (ms),
   cd = cooldown before she does it again, move = needs motion allowed. */
const STATES = {
  wander:  { w: 3,   dur: [6500, 9000],   cd: 0,     move: true },
  idle:    { w: 3,   dur: [4000, 8000],   cd: 0 },
  read:    { w: 2,   dur: [7000, 12000],  cd: 20000 },
  flutter: { w: 1.5, dur: [1800, 2600],   cd: 12000, move: true },
  glance:  { w: 1.5, dur: [2500, 4000],   cd: 10000, need: () => !!cursor },
  perch:   { w: 1.5, dur: [9000, 15000],  cd: 30000, move: true },
  wave:    { w: 1,   dur: [1800, 2200],   cd: 25000, move: true },
};
const rand = (a, b) => a + Math.random() * (b - a);

function chooseState() {
  const now = Date.now();
  const options = Object.keys(STATES).filter((k) => {
    const s = STATES[k];
    if (k === state && k !== "wander") return false;
    if (s.move && reduce.matches) return false;
    if (s.need && !s.need()) return false;
    return !lastRun[k] || now - lastRun[k] >= s.cd;
  });
  let total = options.reduce((t, k) => t + STATES[k].w, 0), roll = Math.random() * total;
  for (const k of options) { roll -= STATES[k].w; if (roll <= 0) return k; }
  return "idle";
}

function enter(name) {
  state = name;
  lastRun[name] = Date.now();
  sprite.classList.remove("ss-perched");
  tilt = 0;
  if (name === "wander") {
    const s = wanderSpot();
    if (s) { faceX((narrow.matches ? stage.getBoundingClientRect().left : 0) + s.x + size().w / 2); place(s.x, s.y); }
  } else if (name === "perch") {
    const s = perchSpot();
    if (!s) { name = state = "idle"; }
    else { place(s.x, s.y); faceChat(); sprite.classList.add("ss-perched"); }
  } else if (name === "glance" && cursor) {
    faceX(cursor.x); tilt = 4;
  } else if (name === "read" || name === "idle") {
    faceChat();
  }
  setPose();
  setStateClass(name);
  const d = STATES[name].dur;
  clearTimeout(stateTimer);
  stateTimer = setTimeout(next, rand(d[0], d[1]));
}
function next() {
  if (busy || document.hidden) return;
  enter(chooseState());
}

/* Chat interrupts: listen when the guest sends, speak while the reply appears. */
form.addEventListener("submit", () => {
  busy = true;
  clearTimeout(stateTimer); clearTimeout(speakTimer);
  sprite.classList.remove("ss-speaking");
  setStateClass("idle");
  faceChat(); tilt = 6; setPose();
  sprite.classList.add("ss-listening");
});
new MutationObserver((muts) => {
  const sageSpoke = muts.some((m) => Array.from(m.addedNodes).some((n) => n.classList && n.classList.contains("msg-sage")));
  if (!sageSpoke || !busy) return;
  clearTimeout(speakTimer);
  speakTimer = setTimeout(() => {
    sprite.classList.remove("ss-listening");
    sprite.classList.add("ss-speaking");
    tilt = 0; setPose();
    speakTimer = setTimeout(() => {
      sprite.classList.remove("ss-speaking");
      busy = false;
      clearTimeout(stateTimer);
      stateTimer = setTimeout(next, 1500);
    }, 2200);
  }, 500);
}).observe(log, { childList: true });

/* Click her to wave (only her body takes clicks; she never sits on a control). */
bob.addEventListener("click", () => {
  if (busy || reduce.matches) return;
  enter("wave");
});

/* Cursor is only remembered, never followed every frame. */
window.addEventListener("mousemove", (e) => { cursor = { x: e.clientX, y: e.clientY }; }, { passive: true });

/* Pause everything when the tab is hidden. */
document.addEventListener("visibilitychange", () => {
  sprite.classList.toggle("ss-paused", document.hidden);
  clearTimeout(stateTimer);
  if (!document.hidden && !busy) stateTimer = setTimeout(next, 800);
});

function setMode() {
  const inStage = narrow.matches;
  sprite.classList.toggle("ss-inline", inStage);
  (inStage ? stage : document.body).appendChild(sprite);
  stage.hidden = !inStage;
  sprite.classList.add("ss-jump");
  jumping = true;
  const s = wanderSpot() || (inStage ? { x: 0, y: 0 } : { x: 16, y: window.innerHeight - 176 });
  place(s.x, s.y);
  void sprite.offsetWidth;
  sprite.classList.remove("ss-jump");
  jumping = false;
  faceChat();
}
narrow.addEventListener("change", setMode);
let rz = null;
window.addEventListener("resize", () => {
  clearTimeout(rz);
  rz = setTimeout(() => {
    const { w, h } = size();
    const r = [loginBar.getBoundingClientRect(), form.getBoundingClientRect()];
    if (!narrow.matches && (hits(pos.x, pos.y, w, h, r, 8) || pos.x + w > window.innerWidth || pos.y + h > window.innerHeight)) {
      const s = wanderSpot(); if (s) place(s.x, s.y);
    }
  }, 200);
});

setMode();
setStateClass("idle");
stateTimer = setTimeout(next, 2500);
window.__sageSprite = { state: () => state }; /* read-only hook for the smoke test */
})();
