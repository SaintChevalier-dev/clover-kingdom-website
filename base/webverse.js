/* Webverse playtest for /base (Layer 1: Sage's chamber).
   Client-side only: everything lives in this browser's localStorage under one key.
   Nothing is sent anywhere. Layers 2 and 3 are honest previews behind playtest goals;
   there is no shared world or multiplayer yet. */
(function () {
  "use strict";
  var KEY = "ckw.webverse.v1";
  var GOALS = { interactions: 5, upgrades: 3, feedback: 1 };
  var UPGRADE_KEYS = ["seams", "grimoire", "staff", "halo", "wings"];
  var GLYPHS = [
    ["The whole avatar", "Every piece reads as a teacher's kit, not a warlord's. Sage is the teacher of the Clover Kingdom.", "sourced"],
    ["Five-leaf stemless crest", "The Clover Kingdom mark, on her chest and on the grimoire: she teaches for the Kingdom.", "sourced"],
    ["Deep blue eyes", "The colour is canon. Proposed meaning: the eyes are a mirror, calm and safe to look into.", "proposed"],
    ["Rainbow cheek glints and the crystal prism staff", "Both are in her official spec. Proposed meaning: a prism splits one light into many colours, so one truth is taught in each person's own way and a big question breaks into one next step.", "proposed"],
    ["Halo", "Proposed: a stamp of truth worn above the head. A thin ring, not a crown or a gate.", "proposed"],
    ["Wings", "Proposed: reach. She is the teacher anyone can reach through the Kingdom.", "proposed"],
    ["Floating grimoire, no chain", "Proposed: knowledge that isn't chained to her or locked behind a price. The book is what she has written down, not just remembered.", "proposed"],
    ["Bare hands", "Proposed: open hands. She offers, she never grabs.", "proposed"],
    ["Covered middle (no midriff gap)", "Proposed: the core is fully covered, so nothing private leaks out.", "proposed"],
    ["Bracers and pauldrons", "Proposed: guards at the edge of the open hand, and shoulders that carry her own limits.", "proposed"],
    ["Horns", "Proposed: two short points for the top of her lane. Short, so they never dominate.", "proposed"],
    ["Light seams", "Proposed: four brightness levels for how sure a truth is (Proven, Claimed, Reported, Unknown).", "proposed"],
    ["Pearl-white plate and black under-suit", "Proposed: a clean surface where every mark can be read, over a private inner layer.", "proposed"]
  ];

  function load() {
    try { var d = JSON.parse(localStorage.getItem(KEY) || "{}"); return d && typeof d === "object" ? d : {}; } catch (e) { return {}; }
  }
  var st = load();
  st.interactions = st.interactions || 0;
  st.upgrades = st.upgrades || {};
  st.feedback = Array.isArray(st.feedback) ? st.feedback : [];
  st.square = st.square || {};
  st.started = st.started || new Date().toISOString();
  function save() { try { localStorage.setItem(KEY, JSON.stringify(st)); } catch (e) { /* storage full or blocked: playtest still works this visit */ } }

  function $(id) { return document.getElementById(id); }
  function sage() { return window.__CKW_SAGE3D && typeof window.__CKW_SAGE3D.pose === "function" ? window.__CKW_SAGE3D : null; }

  function upCount() { return UPGRADE_KEYS.filter(function (k) { return st.upgrades[k]; }).length; }
  function layer2Open() { return st.interactions >= GOALS.interactions && upCount() >= GOALS.upgrades && st.feedback.length >= GOALS.feedback; }
  function layer3Open() { return layer2Open() && st.square.first && st.square.move && st.feedback.length >= GOALS.feedback + 1; }

  function setTag(id, open) {
    var t = $(id); if (!t) return;
    t.textContent = open ? "open" : "locked";
    t.classList.toggle("wv-locked", !open);
    var li = t.closest(".wv-layer"); if (li) li.classList.toggle("wv-open", open);
  }
  function render() {
    $("wv-g-int").textContent = Math.min(st.interactions, GOALS.interactions);
    $("wv-g-up").textContent = Math.min(upCount(), GOALS.upgrades);
    $("wv-g-fb").textContent = Math.min(st.feedback.length, GOALS.feedback);
    var l2 = layer2Open(), l3 = layer3Open();
    setTag("wv-l2", l2); setTag("wv-l3", l3);
    $("wv-square").hidden = !l2;
    $("wv-rooms").hidden = !l3;
  }
  function bump() { st.interactions += 1; save(); render(); }

  /* glyph panel */
  var gl = $("wv-glyph-list");
  if (gl) GLYPHS.forEach(function (g) {
    var li = document.createElement("li");
    var b = document.createElement("strong"); b.textContent = g[0];
    var tag = document.createElement("span"); tag.className = "wv-st wv-st-" + g[2]; tag.textContent = g[2];
    var p = document.createElement("span"); p.textContent = " " + g[1];
    li.appendChild(b); li.appendChild(tag); li.appendChild(p); gl.appendChild(li);
  });

  /* poses */
  var poses = $("wv-poses");
  if (poses) poses.addEventListener("click", function (e) {
    var b = e.target.closest("button[data-pose]"); if (!b) return;
    var s = sage(); if (s) s.pose(b.getAttribute("data-pose"));
    bump();
  });
  /* rotate */
  var yaw = $("wv-yaw"), yawVal = $("wv-yaw-val"), yawTimer = null, yawCounted = false;
  if (yaw) yaw.addEventListener("input", function () {
    var deg = parseInt(yaw.value, 10) || 0;
    yawVal.textContent = deg + "°";
    var s = sage(); if (s) s.setYaw(deg * Math.PI / 180);
    if (!yawCounted) { yawCounted = true; bump(); }
    clearTimeout(yawTimer); yawTimer = setTimeout(function () { yawCounted = false; }, 1500);
  });
  var free = $("wv-yaw-free");
  if (free) free.addEventListener("click", function () { var s = sage(); if (s) s.setYaw(null); yawVal.textContent = "free"; });

  /* chat messages count as interactions */
  var form = $("sage-form");
  if (form) form.addEventListener("submit", function () { var i = $("sage-input"); if (i && i.value.trim()) bump(); });

  /* upgrades */
  function applyAll() {
    var s = sage(); if (!s) return;
    UPGRADE_KEYS.forEach(function (k) { if (st.upgrades[k]) s.upgrade(k, st.upgrades[k]); });
  }
  var ups = $("wv-upgrades");
  if (ups) {
    UPGRADE_KEYS.forEach(function (k) {
      if (!st.upgrades[k]) return;
      var r = ups.querySelector('input[name="' + k + '"][value="' + st.upgrades[k] + '"]'); if (r) r.checked = true;
    });
    ups.addEventListener("change", function (e) {
      var r = e.target; if (!r || r.type !== "radio" || UPGRADE_KEYS.indexOf(r.name) < 0) return;
      st.upgrades[r.name] = r.value; save();
      var s = sage(); if (s) s.upgrade(r.name, r.value);
      bump();
    });
  }
  /* square questions */
  var sq = $("wv-square");
  if (sq) {
    ["first", "move"].forEach(function (k) {
      if (!st.square[k]) return;
      var r = sq.querySelector('input[name="sq-' + k + '"][value="' + st.square[k] + '"]'); if (r) r.checked = true;
    });
    sq.addEventListener("change", function (e) {
      var r = e.target; if (!r || r.type !== "radio") return;
      st.square[r.name.replace("sq-", "")] = r.value; save(); render();
    });
  }
  /* feedback */
  var fb = $("wv-fb"), fbStatus = $("wv-fb-status");
  $("wv-fb-save").addEventListener("click", function () {
    var t = (fb.value || "").trim();
    if (!t) { fbStatus.textContent = "Write something first."; return; }
    st.feedback.push({ at: new Date().toISOString(), layer: layer2Open() ? 2 : 1, text: t.slice(0, 1000) });
    if (st.feedback.length > 50) st.feedback = st.feedback.slice(-50);
    save(); fb.value = ""; fbStatus.textContent = "Saved in this browser."; render();
  });
  function notes() {
    return JSON.stringify({ webverse_playtest: "v1", page: location.pathname, started: st.started, exported: new Date().toISOString(),
      interactions: st.interactions, upgrades: st.upgrades, square: st.square, feedback: st.feedback,
      layers_open: [1].concat(layer2Open() ? [2] : [], layer3Open() ? [3] : []) }, null, 2);
  }
  $("wv-copy").addEventListener("click", function () {
    var txt = notes();
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(txt).then(function () { fbStatus.textContent = "Copied. Paste it wherever you want to share it."; },
        function () { fallback(txt); });
    } else fallback(txt);
  });
  function fallback(txt) { fb.value = txt; fb.select(); fbStatus.textContent = "Your notes are in the box above. Copy them from there."; }
  $("wv-clear").addEventListener("click", function () {
    try { localStorage.removeItem(KEY); } catch (e) { /* ignore */ }
    st = { interactions: 0, upgrades: {}, feedback: [], square: {}, started: new Date().toISOString() };
    Array.prototype.forEach.call(document.querySelectorAll(".wv input[type=radio]"), function (r) { r.checked = false; });
    fbStatus.textContent = "Cleared."; render();
  });

  /* 3D hookup: sage-3d.js is a module and loads after this script */
  function ready() {
    var s3 = $("wv-3d-status");
    if (sage()) { applyAll(); if (s3) s3.textContent = sage().usingGLB() ? "3D avatar loaded. Some upgrades only show on the built-in Sage." : "3D Sage is ready."; }
  }
  window.addEventListener("ckw:sage3d-ready", ready);
  setTimeout(function () { if (!sage()) { var s3 = $("wv-3d-status"); if (s3) s3.textContent = "3D view isn't available on this device. Poses and upgrades still count as playtest votes."; } else ready(); }, 6000);
  if (sage()) ready();
  render();
  window.__CKW_WEBVERSE = { state: function () { return JSON.parse(JSON.stringify(st)); } };
})();
