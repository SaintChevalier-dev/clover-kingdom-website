/* Sage sprite v1: a faceless robed figure with a halo and wings that drifts
   around the free space of /base/. No face is drawn (face rights not cleared).
   Plain JS, no libraries. Positions use the CSSOM (allowed by the page CSP). */
(function () {
"use strict";
const NS = "http://www.w3.org/2000/svg";
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
  <g class="ss-wing ss-wing-l">
    <path d="M52 58 C42 40 22 28 8 32 C2 44 10 60 26 68 C36 73 46 72 52 66 Z" fill="url(#ss-wing)"/>
    <path d="M48 60 C38 50 26 44 14 42 M46 64 C36 58 26 56 18 54" stroke="#ffffff" stroke-opacity="0.35" stroke-width="0.8" fill="none"/>
  </g>
  <g class="ss-wing ss-wing-r">
    <path d="M68 58 C78 40 98 28 112 32 C118 44 110 60 94 68 C84 73 74 72 68 66 Z" fill="url(#ss-wing)"/>
    <path d="M72 60 C82 50 94 44 106 42 M74 64 C84 58 94 56 102 54" stroke="#ffffff" stroke-opacity="0.35" stroke-width="0.8" fill="none"/>
  </g>
  <path d="M60 44 C50 44 46 50 45 58 L34 152 L86 152 L75 58 C74 50 70 44 60 44 Z" fill="url(#ss-robe)"/>
  <path d="M60 50 L60 150" stroke="#9a937f" stroke-width="0.8" opacity="0.5"/>
  <ellipse cx="60" cy="33" rx="9.5" ry="11" fill="#f1ecdf"/>
  <g transform="translate(60 66)" fill="#0a0a0b">
    <circle cx="0" cy="-2.6" r="1.7"/>
    <circle cx="2.5" cy="-0.8" r="1.7"/>
    <circle cx="1.5" cy="2.1" r="1.7"/>
    <circle cx="-1.5" cy="2.1" r="1.7"/>
    <circle cx="-2.5" cy="-0.8" r="1.7"/>
  </g>
  <ellipse class="ss-halo" cx="60" cy="16" rx="14" ry="4" fill="none" stroke="#e8c25a" stroke-width="2.4" filter="url(#ss-glow)"/>
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

/* On narrow screens the sprite lives in its own strip between the login bar and
   the chat, so it can never sit on the input. On wide screens it floats in the
   page's free space, fixed to the viewport. */
const stage = document.createElement("div");
stage.className = "ss-stage";
stage.setAttribute("aria-hidden", "true");
const sageBox = document.querySelector(".sage");
sageBox.parentNode.insertBefore(stage, sageBox);

let pos = { x: 0, y: 0 };
let timer = null;

function obstacles() {
  return [document.querySelector(".login"), sageBox].filter(Boolean).map((n) => n.getBoundingClientRect());
}
function hits(x, y, w, h, rects, pad) {
  return rects.some((r) => x < r.right + pad && x + w > r.left - pad && y < r.bottom + pad && y + h > r.top - pad);
}
function place(x, y) {
  pos = { x, y };
  sprite.style.transform = "translate(" + Math.round(x) + "px," + Math.round(y) + "px)";
}
function pickSpot() {
  const w = sprite.offsetWidth || 120, h = sprite.offsetHeight || 160;
  if (narrow.matches) {
    const max = Math.max(0, stage.clientWidth - w);
    return { x: Math.random() * max, y: 0 };
  }
  const rects = obstacles();
  const vw = window.innerWidth, vh = window.innerHeight;
  for (let i = 0; i < 60; i++) {
    const x = 8 + Math.random() * Math.max(0, vw - w - 16);
    const y = 8 + Math.random() * Math.max(0, vh - h - 16);
    if (!hits(x, y, w, h, rects, 16)) return { x, y };
  }
  return null; // no free space: stay where we are
}
function setMode() {
  const inStage = narrow.matches;
  sprite.classList.toggle("ss-inline", inStage);
  (inStage ? stage : document.body).appendChild(sprite);
  stage.hidden = !inStage;
  sprite.classList.add("ss-jump");
  const s = pickSpot() || (inStage ? { x: 0, y: 0 } : { x: 16, y: window.innerHeight - 176 });
  place(s.x, s.y);
  void sprite.offsetWidth;
  sprite.classList.remove("ss-jump");
  faceChat();
}
function drift() {
  if (!reduce.matches) {
    const s = pickSpot();
    if (s) place(s.x, s.y);
    faceChat();
  }
  clearTimeout(timer);
  timer = setTimeout(drift, 7000 + Math.random() * 5000);
}
/* Face toward the chat box: flip horizontally when the chat is to the left. */
function faceChat() {
  const r = sageBox.getBoundingClientRect();
  const left = narrow.matches ? stage.getBoundingClientRect().left + pos.x : pos.x;
  const center = left + (sprite.offsetWidth || 120) / 2;
  sprite.classList.toggle("ss-flip", center > r.left + r.width / 2);
}

/* Listening when the guest sends, speaking while Sage's reply appears. */
const form = document.getElementById("sage-form");
const log = document.getElementById("sage-log");
let speakT = null;
form.addEventListener("submit", () => {
  faceChat();
  sprite.classList.remove("ss-speaking");
  sprite.classList.add("ss-listening");
});
new MutationObserver((muts) => {
  const sageSpoke = muts.some((m) => Array.from(m.addedNodes).some((n) => n.classList && n.classList.contains("msg-sage")));
  if (!sageSpoke) return;
  clearTimeout(speakT);
  setTimeout(() => {
    sprite.classList.remove("ss-listening");
    sprite.classList.add("ss-speaking");
    speakT = setTimeout(() => sprite.classList.remove("ss-speaking"), 2200);
  }, 500);
}).observe(log, { childList: true });

narrow.addEventListener("change", setMode);
let rz = null;
window.addEventListener("resize", () => { clearTimeout(rz); rz = setTimeout(() => { if (!narrow.matches) { const s = pickSpot(); if (s) place(s.x, s.y); faceChat(); } }, 200); });
setMode();
timer = setTimeout(drift, 3000);
})();
