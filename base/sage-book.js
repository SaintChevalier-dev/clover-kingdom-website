/* Sage's floating book: a button the visitor can drag anywhere (mouse, touch, pen, or arrow keys).
   A tap or click (not a drag) opens the scroll and starts the chat; the scroll rides with the book
   and flips side or direction near the screen edges so it stays on screen.
   Position is kept for this browser session only (sessionStorage). */
(function () {
"use strict";
const book = document.getElementById("sage-book");
const scroll = document.getElementById("sage-scroll");
if (!book || !scroll) return;
const input = document.getElementById("sage-input");
const closeBtn = document.getElementById("sage-scroll-close");
const POS_KEY = "ckw-sage-book-pos";
const GAP = 10, EDGE = 8, DRAG_PX = 6;
let pos = null, drag = null, suppressClick = false;

function vw() { return document.documentElement.clientWidth || window.innerWidth; }
function vh() { return window.innerHeight; }
function size() { return { w: book.offsetWidth || 56, h: book.offsetHeight || 56 }; }
function clampPos(p) {
  const s = size();
  return { x: Math.min(Math.max(EDGE, p.x), vw() - s.w - EDGE), y: Math.min(Math.max(EDGE, p.y), vh() - s.h - EDGE) };
}
function defaultPos() { const s = size(); return { x: vw() - s.w - 20, y: vh() - s.h - 28 }; }
function load() {
  try { const v = JSON.parse(sessionStorage.getItem(POS_KEY) || "null"); if (v && isFinite(v.x) && isFinite(v.y)) return v; } catch (_) {}
  return null;
}
function save() { try { sessionStorage.setItem(POS_KEY, JSON.stringify(pos)); } catch (_) {} }
function apply() {
  pos = clampPos(pos || defaultPos());
  book.style.left = pos.x + "px";
  book.style.top = pos.y + "px";
  place();
}

/* Put the scroll beside the book: right if it fits, else left; if neither, above or below. */
function place() {
  if (scroll.hidden) return;
  const W = vw(), H = vh(), b = book.getBoundingClientRect();
  const sw = Math.min(360, W - 2 * EDGE);
  scroll.style.width = sw + "px";
  let side, left, top, maxH;
  if (b.right + GAP + sw <= W - EDGE) side = "right";
  else if (b.left - GAP - sw >= EDGE) side = "left";
  else side = (b.top - EDGE > H - b.bottom - EDGE) ? "above" : "below";
  if (side === "right" || side === "left") {
    maxH = Math.min(560, H - 2 * EDGE);
    scroll.style.maxHeight = maxH + "px";
    const sh = Math.min(scroll.scrollHeight, maxH);
    left = side === "right" ? b.right + GAP : b.left - GAP - sw;
    /* open downward from the book; near the bottom edge, grow upward instead */
    top = b.top + sh <= H - EDGE ? b.top : b.bottom - sh;
    top = Math.min(Math.max(EDGE, top), H - sh - EDGE);
  } else {
    const room = side === "above" ? b.top - GAP - EDGE : H - b.bottom - GAP - EDGE;
    maxH = Math.max(160, Math.min(560, room));
    scroll.style.maxHeight = maxH + "px";
    const sh = Math.min(scroll.scrollHeight, maxH);
    left = Math.min(Math.max(EDGE, b.left + b.width / 2 - sw / 2), W - sw - EDGE);
    top = side === "above" ? b.top - GAP - sh : b.bottom + GAP;
    top = Math.min(Math.max(EDGE, top), H - sh - EDGE);
  }
  scroll.style.left = Math.round(left) + "px";
  scroll.style.top = Math.round(top) + "px";
  scroll.setAttribute("data-side", side);
}

function open() {
  const first = !(window.CKWSageChat && window.CKWSageChat.started());
  scroll.hidden = false;
  book.setAttribute("aria-expanded", "true");
  document.body.classList.add("sage-open");
  if (window.CKWSageChat) window.CKWSageChat.start();
  place();
  if (input) input.focus({ preventScroll: true });
  if (first) book.classList.add("sage-book-used");
}
function close(focusBook) {
  scroll.hidden = true;
  book.setAttribute("aria-expanded", "false");
  document.body.classList.remove("sage-open");
  if (focusBook) book.focus();
}

book.addEventListener("pointerdown", (e) => {
  if (e.button !== undefined && e.button !== 0) return;
  drag = { id: e.pointerId, sx: e.clientX, sy: e.clientY, ox: pos.x, oy: pos.y, moved: false };
  try { book.setPointerCapture(e.pointerId); } catch (_) {}
});
book.addEventListener("pointermove", (e) => {
  if (!drag || e.pointerId !== drag.id) return;
  const dx = e.clientX - drag.sx, dy = e.clientY - drag.sy;
  if (!drag.moved && Math.hypot(dx, dy) < DRAG_PX) return;
  drag.moved = true;
  book.classList.add("sage-book-dragging");
  pos = { x: drag.ox + dx, y: drag.oy + dy };
  apply();
  e.preventDefault();
});
function endDrag(e) {
  if (!drag || (e && e.pointerId !== drag.id)) return;
  if (drag.moved) { suppressClick = true; save(); setTimeout(() => { suppressClick = false; }, 0); }
  book.classList.remove("sage-book-dragging");
  drag = null;
}
book.addEventListener("pointerup", endDrag);
book.addEventListener("pointercancel", endDrag);
/* click fires for a tap, a mouse click, and Enter/Space; a drag never opens the scroll */
book.addEventListener("click", (e) => {
  if (suppressClick) { e.preventDefault(); suppressClick = false; return; }
  if (scroll.hidden) open(); else close(false);
});
/* arrow keys move the book (Shift = bigger steps) */
book.addEventListener("keydown", (e) => {
  const step = e.shiftKey ? 64 : 16;
  const d = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] }[e.key];
  if (!d) return;
  e.preventDefault();
  pos = { x: pos.x + d[0], y: pos.y + d[1] };
  apply(); save();
});
scroll.addEventListener("keydown", (e) => { if (e.key === "Escape") { e.preventDefault(); close(true); } });
if (closeBtn) closeBtn.addEventListener("click", () => close(true));

/* re-place when the scroll grows (new messages) or the window changes */
if (window.ResizeObserver) new ResizeObserver(() => place()).observe(scroll);
const log = document.getElementById("sage-log");
if (log && window.MutationObserver) new MutationObserver(() => place()).observe(log, { childList: true });
window.addEventListener("resize", () => apply());

pos = load();
apply();
book.hidden = false;
/* deep link #talk or #sage-book opens the scroll */
if (location.hash === "#talk") open();
window.CKWSageBook = { open: open, close: close, moveTo: (x, y) => { pos = { x: x, y: y }; apply(); save(); }, place: place };
})();
