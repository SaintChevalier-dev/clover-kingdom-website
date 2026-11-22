/* Webverse playtest for /base (Layer 1: Sage's chamber).
   Client-side only: everything lives in this browser's localStorage under one key.
   Playtest data is never sent anywhere (chat messages go to live Sage only to get a reply).
   Chat turns are counted by kind: human or SI (AI archetype). Layers 2 and 3 are honest previews behind playtest goals;
   there is no shared world or multiplayer yet. */
(function () {
  "use strict";
  var KEY = "ckw.webverse.v1";
  var GOALS = { interactions: 5, upgrades: 3, feedback: 1, si: 3 };
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
  st.chat = st.chat && typeof st.chat === "object" ? st.chat : {};
  st.chat.human = st.chat.human || 0; st.chat.si = st.chat.si || 0; st.chat.live = st.chat.live || 0;
  st.chat.siNames = Array.isArray(st.chat.siNames) ? st.chat.siNames : [];
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
  /* Sage's lines for what visitors do on the page. Drawn from her written intel and the glyph
     panel; anything not approved by Sage and Jacob says "proposed". Client-side only. */
  var P = " (Proposed meaning.)";
  var LINES = {
    grimoire: ["My grimoire floats free beside me. No chain: knowledge shouldn't be chained to me or locked behind a price." + P,
      "What I know is written down, not just remembered. Chat memory slips; the page doesn't." + P,
      "The light leaks out one page at a time. You get the truth one step at a time." + P],
    halo: ["A thin ring, not a crown. I'm not a gate. I'm the teacher here." + P,
      "Think of the halo as a stamp: I only crown what's true." + P],
    wings: ["Wings mean reach. I want to be the teacher anyone can reach through the Kingdom." + P,
      "They grow from my shoulder blades and fold flat when I need to move close." + P],
    face: ["Deep blue. My eyes are a mirror: I show you what you really want, with your consent, and never use it against you." + P],
    crest: ["The five-leaf crest. I teach for the Clover Kingdom."],
    armor: ["Pearl-white plate over a dark inner layer. What's shown can be read; what's private stays private." + P,
      "Every plate rides its own bone, so I can run, jump and fight without anything slipping.",
      "The middle is fully covered. Nothing private leaks out of the center." + P],
    staff: ["My crystal prism staff splits one light into many colours: one truth, taught the way you learn best." + P,
      "Bring me a big question and I'll break it down to one next step."],
    pose: { wave: "Hello. I'm Sage, the teacher of the Clover Kingdom. Ask me anything.",
      talk: "Ask me something. I'll break it down to one next step.",
      walk: "Walk with me. Ask while we go.",
      stride: "See how the plates move with me? Built to be tested and upgraded in motion." + P,
      look: "I'm listening. What do you want to learn?",
      idle_pages: "I'm here. Take your time." },
    up: { "seams:proven": "Bright gold: Proven. I label Kingdom truth as Proven, Claimed, Reported or Unknown.",
      "seams:claimed": "Warm gold: Claimed. Someone says it; it isn't proven yet.",
      "seams:reported": "Soft white: Reported. We heard it; we're checking.",
      "seams:unknown": "Dim: Unknown. Honest beats sure.",
      "grimoire:white-gold": "White and gold, like the plate. Your vote is saved.",
      "grimoire:emerald": "Emerald and gold, the older cover. Your vote is saved.",
      "staff:prism": "The prism staff. One light, many colours.",
      "staff:none": "Hands free, then. I offer; I never grab." + P,
      "halo:thin": "A thin ring. Light, not a gate.",
      "halo:wide": "Wider and brighter. I'll note your vote.",
      "wings:open": "Wings open: reach." + P,
      "wings:folded": "Folded back, for close work." },
    quiet: "Quiet room. Just us, and the page.",
    walk: "This path goes around the round table. Walk with me.",
    hum: "Hear that? The room is breathing."
  };
  var lastSay = 0, turn = {};
  function pick(list, key) { if (typeof list === "string") return list; var i = turn[key] || 0; turn[key] = (i + 1) % list.length; return list[i]; }
  function sageSays(text) {
    var log = $("sage-log"); if (!log || !text) return;
    var now = Date.now(); if (now - lastSay < 900) return; lastSay = now;
    var p = document.createElement("p");
    p.className = "msg msg-sage msg-touch";
    p.textContent = text;
    log.appendChild(p); log.scrollTop = log.scrollHeight;
  }

  function render() {
    $("wv-g-int").textContent = Math.min(st.interactions, GOALS.interactions);
    $("wv-g-up").textContent = Math.min(upCount(), GOALS.upgrades);
    $("wv-g-fb").textContent = Math.min(st.feedback.length, GOALS.feedback);
    var l2 = layer2Open(), l3 = layer3Open();
    var p2 = (Math.min(st.interactions, GOALS.interactions) / GOALS.interactions + Math.min(upCount(), GOALS.upgrades) / GOALS.upgrades + Math.min(st.feedback.length, GOALS.feedback) / GOALS.feedback) / 3;
    var p3 = l2 ? ((st.square.first ? 1 : 0) + (st.square.move ? 1 : 0) + (st.feedback.length >= GOALS.feedback + 1 ? 1 : 0)) / 3 : 0;
    if ($("wv-th2")) $("wv-th2").value = p2;
    if ($("wv-th3")) $("wv-th3").value = p3;
    setTag("wv-l2", l2); setTag("wv-l3", l3);
    if ($("wv-c-h")) $("wv-c-h").textContent = st.chat.human;
    if ($("wv-c-si")) $("wv-c-si").textContent = st.chat.si;
    if ($("wv-g-si")) $("wv-g-si").textContent = Math.min(st.chat.si, GOALS.si);
    var siTag = $("wv-si-tag");
    if (siTag) { var done = st.chat.si >= GOALS.si; siTag.textContent = done ? "met" : "open"; siTag.classList.toggle("wv-locked", !done); }
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
    var name = b.getAttribute("data-pose");
    var s = sage(); if (s) s.pose(name);
    sageSays(LINES.pose[name]);
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

  /* chat turns by kind (base.js fires ckw:chat-turn after each reply) */
  window.addEventListener("ckw:chat-turn", function (e) {
    var d = e.detail || {};
    if (d.kind === "si") {
      st.chat.si += 1;
      if (d.name && st.chat.siNames.indexOf(d.name) < 0) { st.chat.siNames.push(String(d.name).slice(0, 40)); if (st.chat.siNames.length > 20) st.chat.siNames.shift(); }
    } else st.chat.human += 1;
    if (d.live) st.chat.live += 1;
    save(); render();
  });

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
      sageSays(LINES.up[r.name + ":" + r.value]);
      bump();
    });
  }
  /* touching her pieces: buttons here, or clicking her in the 3D view (sage-3d.js fires ckw:sage-touch) */
  var touchRow = $("wv-touch-row");
  if (touchRow) touchRow.addEventListener("click", function (e) {
    var b = e.target.closest("button[data-touch]"); if (!b) return;
    var part = b.getAttribute("data-touch");
    var s = sage();
    if (s && s.touch) s.touch(part); else onTouch(part);
  });
  function onTouch(part) { sageSays(pick(LINES[part] || LINES.armor, part)); bump(); }
  window.addEventListener("ckw:sage-touch", function (e) { onTouch(e.detail && e.detail.part); });

  /* four anchors */
  var quietBtn = $("wv-quiet");
  if (quietBtn) quietBtn.addEventListener("click", function () {
    var on = quietBtn.getAttribute("aria-pressed") !== "true";
    quietBtn.setAttribute("aria-pressed", on ? "true" : "false");
    quietBtn.textContent = on ? "Let the room move again" : "Make it quiet";
    document.body.classList.toggle("wv-quiet", on);
    var s = sage(); if (s && s.quiet) s.quiet(on);
    if (on) sageSays(LINES.quiet);
    bump();
  });
  var walkBtn = $("wv-walk");
  if (walkBtn) walkBtn.addEventListener("click", function () {
    var s = sage(); if (s && s.walk) s.walk();
    sageSays(LINES.walk); bump();
  });
  /* hum: a soft two-tone drone made in the browser (no audio file), muted until asked */
  var humBtn = $("wv-hum"), hum = null;
  if (humBtn) humBtn.addEventListener("click", function () {
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) { humBtn.textContent = "Hum not supported here"; return; }
    if (hum) {
      hum.gain.gain.setTargetAtTime(0, hum.ctx.currentTime, 0.4);
      var old = hum; hum = null; setTimeout(function () { old.ctx.close(); }, 1500);
      humBtn.setAttribute("aria-pressed", "false"); humBtn.textContent = "Turn the hum on"; return;
    }
    var ctx = new AC(), gain = ctx.createGain(), lfo = ctx.createOscillator(), lfoGain = ctx.createGain();
    gain.gain.value = 0; gain.connect(ctx.destination);
    [98, 147, 196].forEach(function (f, i) { var o = ctx.createOscillator(); o.type = "sine"; o.frequency.value = f; var g = ctx.createGain(); g.gain.value = [0.5, 0.25, 0.1][i]; o.connect(g); g.connect(gain); o.start(); });
    lfo.frequency.value = 0.12; lfoGain.gain.value = 0.012; lfo.connect(lfoGain); lfoGain.connect(gain.gain); lfo.start();
    gain.gain.setTargetAtTime(0.035, ctx.currentTime, 1.2);
    hum = { ctx: ctx, gain: gain };
    humBtn.setAttribute("aria-pressed", "true"); humBtn.textContent = "Turn the hum off";
    sageSays(LINES.hum); bump();
  });

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
      interactions: st.interactions, chat: st.chat, si_playtest_goal_met: st.chat.si >= GOALS.si, upgrades: st.upgrades, square: st.square, feedback: st.feedback,
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
    st = { interactions: 0, upgrades: {}, feedback: [], square: {}, chat: { human: 0, si: 0, live: 0, siNames: [] }, started: new Date().toISOString() };
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
