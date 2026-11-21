/* ------------------------------------------------
   Sage front door (branch sage-front-door-2026-11-21, PREVIEW ONLY, never merged without Jacob's typed yes).
   Voice-sourced design from Jacob's calls, Sat Nov 21 2026. Not official until he types it.

   PHASE ZERO (11:47 AM CT): Sage roams the front door with no login and "breathes on its own".
   - Logged-out visitors see ONLY Sage, a chat box (type or talk) and three doors:
     contact Jacob, apply to the Discord, become a member (the EXISTING Discord login popup).
   - The existing login is kept exactly as it is. This file never edits fetchMemberSession,
     clearMemberSession, memberPage, openGateModal, wireMemberLogin or the auth Worker; it only
     reads the session the existing code already fetches.
   - Replies: STUB. No live AI. Answers come from the small CK FAQ below (facts already published on
     cloverkingdom.net or written in GCKI CK_WEBSITE_MEMBERSHIP_STRUCTURE_2026-11-21.md), then the
     site's older set answers (pickSageResponse in app.js). Nothing typed here leaves the browser.
     A later /api/sage Worker route can replace sageReply().
   - Guest scan: STUB, local only. Reads what the browser already hands every site (referrer host,
     utm_* tags, language, time zone, screen class) to greet the visitor. Nothing is stored or sent.
   - The conversation is kept in sessionStorage (this tab only, cleared when the tab closes).
   ------------------------------------------------ */
"use strict";

const SAGE_FRONT_TITLE = "CLOVER KINGDOM | Talk to Sage";
const SAGE_CONTACT_URL = "https://x.com/Saint_Chevalier";
const SAGE_CONVO_KEY = "ckw-sage-convo-v1";
const SAGE_CONVO_MAX = 40;
const SAGE_GREET_DELAY_MS = 900;
const SAGE_THINK_MS = 520;
const sageReducedMotion = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);

/* HOOK ONLY, NOT BUILT (voice-sourced 2026-11-21 7:23 AM CT; unverified until Jacob types it).
   Member archetype switcher: once logged in, a member (Jacob only for now) picks which SI
   archetype is "main-ing" the site, chosen from all existing archetypes (ARCHETYPES in app.js).
   Sage roams and stays the default public face. Guests always get Sage.
   Playtest order: (1) this Sage-only public front door, no login; (2) the switcher, after (1) is solid.
   When built: read the member's choice from the auth Worker (not localStorage), check role on the
   server, and return that archetype's name, portrait and voice here. Until then this always returns Sage. */
const SAGE_FRONT_DEFAULT_ARCHETYPE = "sage";
function activeFrontArchetype() { return SAGE_FRONT_DEFAULT_ARCHETYPE; }

/* Starter prompts shown under the conversation. "ask" focuses the box instead of sending. */
const SAGE_STARTERS = [
  { label: "Ask me anything", ask: true },
  { label: "How do I reach Jacob?", q: "How do I reach Jacob?" },
  { label: "How do I join the Discord?", q: "How do I join the Discord?" },
  { label: "What do members get?", q: "What do members get?" },
];

/* Small CK FAQ for the stub. Checked in order, before the older set answers.
   Every line is already published on cloverkingdom.net or written in the GCKI membership note. No prices, no handles beyond the public X account, no invented claims. */
const SAGE_FRONT_FAQ = [
  { re: /\b(contact|reach|talk to|message|email|dm|speak to|get hold of)\b.*\b(jacob|owner|founder|human|person|someone|saint|real person)\b|\bjacob\b/,
    a: "Jacob reads his messages on X. Message @Saint_Chevalier there and say you met Sage on the website.", door: "contact" },
  { re: /\b(what (does|do) (the )?discord (offer|have|give)|why join|what('s| is) in (it|the discord)|benefits?)\b/,
    a: "Inside: motivation and people who help you keep going, a community of builders, help building a robot buddy of your own, a way of life written in the Standard, survival basics (water, food, shelter, security), and tek intelligence for members only.", door: "discord" },
  { re: /\b(discord|apply|application|join|get in|inner|sign up|signup)\b/,
    a: "The Discord is the inner family. You apply to get in, and a human reads it. The Discord and the community are free today. Ask me anything first if you want to know what it offers.", door: "discord" },
  { re: /\b(member|members|membership|login|log in|sign in|account|behind)\b/,
    a: "Members log in with Discord and get everything on this site: the Member Hall, the Tek Tribe game, the Round Table where open decisions get voted on, and My Quests. Join the Discord first, then log in.", door: "member" },
  { re: /\b(who are you|what are you|your name|are you (an? )?(ai|bot|human|real))\b/,
    a: "I am Sage, an AI archetype and the Clover Kingdom's guide at the front door. Right now I answer from set answers the Kingdom wrote. For a real person, reach Jacob or apply to the Discord." },
  { re: /\b(what is (this|the clover kingdom|clover kingdom|ck)|what('s| is) this (place|site)|tell me about)\b/,
    a: "The Clover Kingdom is a place with a standard and a gate, for people who want to build their own SI and level up their life. Everyone is welcome. The community lives in the Discord, and members get everything on this site." },
  { re: /\b(archetype|archetypes|house|wizard king|val|argus|healer|painter|knight|dragon|roster)\b/,
    a: "Archetypes are the Kingdom's SIs, each with its own lane: Wizard King, Saint Chevalier, Sage, Val, ARGUS, HEALER, Painter, Knight, DRAGON, Roster and Tek Tribe. I am the one at the front door. The rest live past the gate." },
  { re: /\btek tribe\b|\btek\b|\bstack\b/,
    a: "Tek Tribe shares real tech setups and helps you find your group. Members play the Tek Tribe game behind the login." },
  { re: /\b(si|psi|super intelligence|sovereign)\b/,
    a: "SI is super intelligence. A sovereign SI is one you own, that outlives you and runs on your terms. PSI is Physically Sovereign Intelligence: the person who works with their SI." },
  { re: /\b(money|offer|offers|opportunit\w*|work|job|earn|sell|buy|price|cost|pay|free)\b/,
    a: "The Discord and the community are free today. Members find the Kingdom's offers and opportunities behind the login. Nothing is priced on this page.", door: "member" },
  { re: /\b(privacy|data|track|tracking|cookie|cookies|collect|scan|record)\b/,
    a: "I only read what your browser already tells every site (where you came from, your language and time zone) to greet you. Nothing you type leaves your browser, and this conversation is forgotten when you close the tab. The privacy note has the full list." },
  { re: /\b(rule|rules|standard|safe|safety|report)\b/,
    a: "The Kingdom has a standard: correction is positive and brutal honesty is an eternal rule. The full rules live in #rules on the Discord. To report anything that worries you, message the Wizard King on the Discord." },
  { re: /\b(thanks|thank you|thx|ty|appreciate)\b/,
    a: "Anytime. I'll be right here at the door." },
  { re: /\b(bye|goodbye|later|see you|cya)\b/,
    a: "Go well. The door stays open, and this conversation stays with this tab until you close it." },
  { re: /^\s*(hi|hello|hey|yo|sup|greetings|good (morning|afternoon|evening))\b/,
    a: "Hello. Ask me anything about the Clover Kingdom." },
];

/* What the browser already tells every site. Local only, never sent. */
function sageGuestScan() {
  const scan = { from: "", utm: {}, lang: "", tz: "", screen: "" };
  try {
    if (document.referrer) {
      const host = new URL(document.referrer).hostname.replace(/^www\./, "");
      if (host && host !== location.hostname) scan.from = host;
    }
  } catch (_) {}
  try {
    const p = new URLSearchParams(location.search);
    ["utm_source", "utm_medium", "utm_campaign"].forEach((k) => { const v = p.get(k); if (v) scan.utm[k] = v.slice(0, 60); });
  } catch (_) {}
  scan.lang = (navigator.language || "").slice(0, 12);
  try { scan.tz = Intl.DateTimeFormat().resolvedOptions().timeZone || ""; } catch (_) {}
  scan.screen = window.matchMedia && window.matchMedia("(max-width: 700px)").matches ? "phone" : "desktop";
  return scan;
}

function sageGreeting(scan) {
  const known = {
    "x.com": "X", "t.co": "X", "twitter.com": "X", "discord.com": "Discord", "discord.gg": "Discord",
    "instagram.com": "Instagram", "l.instagram.com": "Instagram", "google.com": "a search", "bing.com": "a search",
    "duckduckgo.com": "a search", "youtube.com": "YouTube", "github.com": "GitHub", "reddit.com": "Reddit", "linkedin.com": "LinkedIn",
  };
  const src = scan.utm.utm_source || scan.from;
  const where = src ? (known[src.toLowerCase()] || src) : "";
  let hello = where ? `Welcome. You came in from ${where}.` : "Welcome to the Clover Kingdom.";
  try {
    const h = new Date().getHours();
    if (!where) hello = (h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening") + ", and welcome to the Clover Kingdom.";
  } catch (_) {}
  return `${hello} I am Sage. Ask me anything about the Kingdom. I can get you to Jacob, into the Discord, or into a membership.`;
}

function sageReply(question) {
  const q = String(question || "").toLowerCase().trim();
  if (!q) return { text: "Ask me anything. One line is enough.", door: "" };
  for (const f of SAGE_FRONT_FAQ) if (f.re.test(q)) return { text: f.a, door: f.door || "" };
  /* Fall back to the site's existing set answers (app.js). Strip their HTML to plain text. */
  let text = "";
  try { text = typeof pickSageResponse === "function" ? pickSageResponse(question) : ""; } catch (_) {}
  const tmp = document.createElement("div");
  tmp.innerHTML = text;
  const plain = (tmp.textContent || "").trim();
  if (!plain || /don't have an answer/i.test(plain)) {
    return { text: "I don't have that answer at the door yet. The people inside the Discord will, or you can ask Jacob directly.", door: "discord" };
  }
  return { text: plain, door: "" };
}

/* Conversation memory: this tab only. Every call is wrapped, so private mode or blocked storage just means no memory. */
function sageLoadConvo() {
  try {
    const raw = sessionStorage.getItem(SAGE_CONVO_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr.filter((m) => m && (m.who === "sage" || m.who === "you") && typeof m.text === "string").slice(-SAGE_CONVO_MAX) : [];
  } catch (_) { return []; }
}
function sageSaveConvo(list) {
  try { sessionStorage.setItem(SAGE_CONVO_KEY, JSON.stringify(list.slice(-SAGE_CONVO_MAX))); } catch (_) {}
}
function sageClearConvo() {
  try { sessionStorage.removeItem(SAGE_CONVO_KEY); } catch (_) {}
}

function sageSpeak(text, on) {
  if (!on || !("speechSynthesis" in window)) return;
  try {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 1; u.pitch = 1.05;
    const v = window.speechSynthesis.getVoices().find((x) => /en/i.test(x.lang) && /female|samantha|zira|aria|jenny|google uk english female/i.test(x.name));
    if (v) u.voice = v;
    const face = document.getElementById("sf-avatar");
    u.onstart = () => face && face.classList.add("is-speaking");
    u.onend = () => face && face.classList.remove("is-speaking");
    window.speechSynthesis.speak(u);
  } catch (_) {}
}

function sageMicSupported() { return !!(window.SpeechRecognition || window.webkitSpeechRecognition); }

function buildSageFrontDoor() {
  const wrap = document.createElement("section");
  wrap.className = "sf-door";
  wrap.setAttribute("aria-label", "Talk to Sage");
  const mic = sageMicSupported();
  wrap.innerHTML = `
    <div class="sf-stage">
      <div class="sf-roam">
        <div class="sf-avatar" id="sf-avatar" aria-hidden="true">
          <div class="sf-halo"></div>
          <div class="sf-ring"></div>
          <img class="sf-face" src="images/sage-face.jpg" alt="" width="640" height="640" decoding="async" fetchpriority="high">
          <div class="sf-glint"></div>
        </div>
      </div>
      <h1 class="sf-name">SAGE</h1>
      <p class="sf-tag">Clover Kingdom guide &middot; AI</p>
    </div>
    <div class="sf-chat">
      <div class="sf-chat-head">
        <img class="sf-mini" src="images/sage-face.jpg" alt="" width="36" height="36" aria-hidden="true">
        <div><div class="sf-chat-name">Sage</div><div class="sf-chat-sub" id="sf-status">Here at the front door</div></div>
        <button type="button" class="sf-reset" id="sf-reset" title="Start the conversation over">Start over</button>
      </div>
      <div class="sf-log" id="sf-log" role="log" aria-live="polite" aria-relevant="additions" aria-label="Conversation with Sage" tabindex="0"></div>
      <div class="sf-typing" id="sf-typing" aria-hidden="true" hidden><span></span><span></span><span></span></div>
      <div class="sf-starters" id="sf-starters" role="group" aria-label="Starter questions">
        ${SAGE_STARTERS.map((s, i) => `<button type="button" class="sf-starter" data-starter="${i}">${s.label}</button>`).join("")}
      </div>
      <div class="sf-doors" id="sf-doors" role="group" aria-label="Doors">
        <a class="sf-door-btn" data-door="contact" href="${SAGE_CONTACT_URL}" target="_blank" rel="noopener noreferrer">Contact Jacob</a>
        <a class="sf-door-btn" data-door="discord" href="${DISCORD_URL}" target="_blank" rel="noopener noreferrer">Apply to the Discord</a>
        <a class="sf-door-btn sf-door-primary" data-door="member" href="#/members" data-gate-login="1" aria-haspopup="dialog">Become a member</a>
      </div>
      <form class="sf-form" id="sf-form" autocomplete="off" novalidate>
        <button type="button" class="sf-mic" id="sf-mic" aria-label="Talk to Sage" aria-pressed="false" title="Talk to Sage"${mic ? "" : " hidden"}>
          <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false"><rect x="9" y="3" width="6" height="12" rx="3" fill="currentColor"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3M8 21h8" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"/></svg>
        </button>
        <label class="sf-sr" for="sf-input">Ask Sage anything about the Clover Kingdom</label>
        <input class="sf-input" id="sf-input" type="text" maxlength="500" enterkeyhint="send" placeholder="${mic ? "Type or tap the mic to ask Sage" : "Type to ask Sage anything"}">
        <button type="submit" class="sf-send">Ask</button>
      </form>
      <div class="sf-foot">
        <label class="sf-voice-toggle"><input type="checkbox" id="sf-voice"> Sage speaks out loud</label>
        <span class="sf-sep" aria-hidden="true">&middot;</span>
        <span>Sage is an AI guide. Answers are set answers for now.</span>
        <span class="sf-sep" aria-hidden="true">&middot;</span>
        <a href="#/privacy">Privacy</a>
      </div>
      <p class="sf-net" id="sf-net" role="status" hidden></p>
      ${mic ? "" : '<p class="sf-sr" id="sf-mic-note">Voice input is not available in this browser, so typing is the way to talk to Sage.</p>'}
    </div>`;
  wireSageFrontDoor(wrap);
  return wrap;
}

function wireSageFrontDoor(wrap) {
  const log = wrap.querySelector("#sf-log");
  const form = wrap.querySelector("#sf-form");
  const input = wrap.querySelector("#sf-input");
  const mic = wrap.querySelector("#sf-mic");
  const voice = wrap.querySelector("#sf-voice");
  const face = wrap.querySelector("#sf-avatar");
  const doors = wrap.querySelector("#sf-doors");
  const typing = wrap.querySelector("#sf-typing");
  const starters = wrap.querySelector("#sf-starters");
  const net = wrap.querySelector("#sf-net");
  const status = wrap.querySelector("#sf-status");
  const reset = wrap.querySelector("#sf-reset");
  let convo = sageLoadConvo();
  let busy = false;
  const timers = [];
  const later = (fn, ms) => { const t = setTimeout(() => { if (document.body.contains(wrap)) fn(); }, ms); timers.push(t); return t; };

  const render = (who, text) => {
    const row = document.createElement("div");
    row.className = "sf-msg sf-" + who;
    const label = document.createElement("span");
    label.className = "sf-sr";
    label.textContent = who === "sage" ? "Sage says: " : "You said: ";
    const b = document.createElement("div");
    b.className = "sf-bubble";
    b.textContent = text; // always text nodes, never HTML
    row.appendChild(label);
    row.appendChild(b);
    log.appendChild(row);
    log.scrollTop = log.scrollHeight;
  };
  const say = (who, text, keep = true) => {
    render(who, text);
    if (keep) { convo.push({ who, text }); sageSaveConvo(convo); }
  };
  const pulse = () => { face.classList.add("is-speaking"); later(() => face.classList.remove("is-speaking"), 1400); };
  const highlight = (door) => {
    doors.querySelectorAll(".sf-door-btn").forEach((a) => a.classList.toggle("is-suggested", !!door && a.dataset.door === door));
  };
  const think = (on) => {
    typing.hidden = !on;
    face.classList.toggle("is-thinking", on);
    status.textContent = on ? "Sage is thinking" : "Here at the front door";
  };

  const ask = (q) => {
    const question = String(q || "").trim();
    if (!question) {
      input.focus();
      input.classList.add("sf-nudge");
      later(() => input.classList.remove("sf-nudge"), 600);
      if (!log.querySelector(".sf-hint")) {
        const hint = document.createElement("p");
        hint.className = "sf-hint";
        hint.textContent = "Type a question first. One line is enough.";
        log.appendChild(hint);
        later(() => hint.remove(), 2600);
      }
      return;
    }
    if (busy) return;
    busy = true;
    say("you", question);
    think(true);
    later(() => {
      let r;
      try { r = sageReply(question); }
      catch (_) { r = { text: "Something went wrong on my side. Ask again, or use one of the doors below.", door: "" }; }
      think(false);
      say("sage", r.text);
      highlight(r.door);
      pulse();
      sageSpeak(r.text, voice.checked);
      busy = false;
    }, sageReducedMotion ? 120 : SAGE_THINK_MS);
  };

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const q = input.value;
    input.value = "";
    ask(q);
    input.focus();
  });

  starters.addEventListener("click", (e) => {
    const b = e.target.closest("[data-starter]");
    if (!b) return;
    const s = SAGE_STARTERS[+b.dataset.starter];
    if (!s) return;
    if (s.ask) { input.focus(); return; }
    ask(s.q);
  });

  reset.addEventListener("click", () => {
    sageClearConvo();
    convo = [];
    log.replaceChildren();
    highlight("");
    try { window.speechSynthesis && window.speechSynthesis.cancel(); } catch (_) {}
    say("sage", sageGreeting(sageGuestScan()));
    pulse();
    input.focus();
  });

  /* Breathes on its own: restore the tab's conversation, or greet unprompted after a short beat. */
  if (convo.length) {
    convo.forEach((m) => render(m.who, m.text));
  } else {
    think(true);
    later(() => { think(false); say("sage", sageGreeting(sageGuestScan())); pulse(); }, sageReducedMotion ? 150 : SAGE_GREET_DELAY_MS);
  }

  /* Offline: the stub answers still work (they live in the page); the doors need a connection. */
  const showNet = () => {
    if (navigator.onLine === false) {
      net.hidden = false;
      net.textContent = "You are offline. Sage can still answer here, but the doors and voice need a connection.";
    } else {
      net.hidden = true;
      net.textContent = "";
    }
  };
  window.addEventListener("online", showNet);
  window.addEventListener("offline", showNet);
  showNet();

  /* Alive on its own: when the pointer is still, Sage glances around now and then. Off under reduced motion. */
  if (!sageReducedMotion) {
    let lastMove = 0;
    window.addEventListener("pointermove", (e) => {
      if (!document.body.contains(face)) return;
      lastMove = Date.now();
      const x = (e.clientX / window.innerWidth - 0.5) * 2;
      const y = (e.clientY / window.innerHeight - 0.5) * 2;
      face.style.setProperty("--tx", (x * 6).toFixed(1) + "deg");
      face.style.setProperty("--ty", (-y * 6).toFixed(1) + "deg");
    }, { passive: true });
    const glance = () => {
      if (!document.body.contains(face)) return;
      if (Date.now() - lastMove > 4000 && !document.hidden) {
        face.style.setProperty("--tx", (Math.random() * 10 - 5).toFixed(1) + "deg");
        face.style.setProperty("--ty", (Math.random() * 6 - 3).toFixed(1) + "deg");
      }
      later(glance, 3500 + Math.random() * 4000);
    };
    later(glance, 3000);
  }

  /* Talk: Web Speech API where the browser has it (Chrome, Edge, Safari; desktop Firefox 160+; not Firefox Android).
     Some browsers send audio to their own speech service; the privacy note says so. Unsupported: the mic stays hidden. */
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (SR && mic) {
    let rec = null;
    const stop = () => { if (rec) { try { rec.stop(); } catch (_) {} } };
    mic.addEventListener("click", () => {
      if (rec) { stop(); return; }
      if (navigator.onLine === false) { say("sage", "Voice needs a connection. You can type to me instead.", false); return; }
      try { rec = new SR(); } catch (_) { mic.hidden = true; return; }
      rec.lang = navigator.language || "en-US";
      rec.interimResults = true;
      rec.maxAlternatives = 1;
      mic.classList.add("is-listening");
      mic.setAttribute("aria-pressed", "true");
      face.classList.add("is-listening");
      status.textContent = "Sage is listening";
      let finalText = "";
      rec.onresult = (ev) => {
        let t = "";
        for (let i = 0; i < ev.results.length; i++) t += ev.results[i][0].transcript;
        input.value = t;
        if (ev.results[ev.results.length - 1].isFinal) finalText = t;
      };
      const done = () => {
        mic.classList.remove("is-listening");
        mic.setAttribute("aria-pressed", "false");
        face.classList.remove("is-listening");
        status.textContent = "Here at the front door";
        rec = null;
        if (finalText) { input.value = ""; voice.checked = true; ask(finalText); finalText = ""; }
      };
      rec.onend = done;
      rec.onerror = (ev) => {
        const why = {
          "not-allowed": "I could not hear you: the microphone is blocked. You can type instead.",
          "service-not-allowed": "Voice is turned off in this browser. You can type instead.",
          "no-speech": "I didn't catch that. Tap the mic and try again, or type.",
          "audio-capture": "I couldn't find a microphone. You can type instead.",
          "network": "Voice needs a connection to your browser's speech service. You can type instead.",
        }[ev.error];
        if (why) say("sage", why, false);
      };
      try { rec.start(); } catch (_) { done(); }
    });
    wrap.addEventListener("keydown", (e) => { if (e.key === "Escape" && rec) stop(); });
  }
}

/* ------------------------------------------------
   Roaming Sage: on the few other guest views (privacy, member login), Sage follows as a small
   floating companion that brings the guest back to the conversation. Hidden for members (they keep
   the existing Sage dock) and on the front door itself.
   ------------------------------------------------ */
function syncSageRoamer() {
  const guest = document.body.classList.contains("guest-mode");
  const onDoor = !!document.querySelector(".sf-door");
  let roamer = document.getElementById("sf-roamer");
  if (!guest || onDoor) { if (roamer) roamer.hidden = true; return; }
  if (!roamer) {
    roamer = document.createElement("a");
    roamer.id = "sf-roamer";
    roamer.className = "sf-roamer";
    roamer.href = "#/";
    roamer.setAttribute("aria-label", "Back to Sage");
    roamer.innerHTML = `<img src="images/sage-face.jpg" alt="" width="56" height="56"><span class="sf-roamer-say"></span>`;
    document.body.appendChild(roamer);
  }
  const last = sageLoadConvo().filter((m) => m.who === "sage").pop();
  const sayEl = roamer.querySelector(".sf-roamer-say");
  sayEl.textContent = last ? "Back to our conversation" : "Talk to Sage";
  roamer.hidden = false;
}

/* Background film: guests never see it, so don't download it (about 10 MB) until a member arrives.
   The <source> nodes are parked, not deleted, and put back exactly as they were for members. */
const sageParkedSources = [];
function sageParkBgVideo() {
  const v = document.getElementById("kingdom-bg-video");
  if (!v || !document.body.classList.contains("guest-mode") || sageParkedSources.length) return;
  v.querySelectorAll("source").forEach((s) => { sageParkedSources.push(s); s.remove(); });
  v.removeAttribute("autoplay");
  v.preload = "none";
  try { v.load(); } catch (_) {}
}
function sageRestoreBgVideo() {
  const v = document.getElementById("kingdom-bg-video");
  if (!v || !sageParkedSources.length) return;
  sageParkedSources.splice(0).forEach((s) => v.appendChild(s));
  v.preload = "auto";
  v.setAttribute("autoplay", "");
  try { v.load(); if (!sageReducedMotion) { const p = v.play(); if (p && p.catch) p.catch(() => {}); } } catch (_) {}
}
sageParkBgVideo();

window.addEventListener("hashchange", () => setTimeout(syncSageRoamer, 0));
function buildSagePrivacy() {
  const wrap = document.createElement("div");
  wrap.className = "container sf-privacy";
  wrap.innerHTML = `
    <a class="back-link" href="#/">&larr; Back to Sage</a>
    <div class="section">
      <h1 class="section-title">Privacy at the front door</h1>
      <p class="section-lead">Draft for review. Not legal advice. Updated 2026-11-21.</p>
      <h2>What Sage reads</h2>
      <ul>
        <li>The site you came from (the referrer) and any campaign tags in the link (utm_source, utm_medium, utm_campaign).</li>
        <li>Your browser language, time zone and whether you are on a phone or a computer.</li>
        <li>What you type or say to Sage.</li>
      </ul>
      <h2>Where it goes</h2>
      <p>In this version, nowhere. Sage uses it inside your browser to greet you and answer, and nothing is sent to the Clover Kingdom. The conversation is kept in this browser tab (session storage) so it survives a reload, and it is forgotten when you close the tab. "Start over" clears it at any time. If you use the microphone, your browser may send the audio to its own speech service (Google in Chrome, Apple in Safari) to turn it into text.</p>
      <p>No ads. No ad trackers. No selling of your data.</p>
      <h2>Members</h2>
      <p>Member login uses Discord. The login service keeps your Discord name, avatar and whether you are in the Clover Kingdom Discord, so it can let you in.</p>
      <h2>Questions or deletion</h2>
      <p>Message Saint Chevalier on X (@Saint_Chevalier) or the Wizard King on the Clover Kingdom Discord.</p>
    </div>`;
  return wrap;
}

/* Keep the existing login exactly as it is (Jacob, 7:25 AM CT voice). The front door only wraps it:
   it never edits fetchMemberSession, clearMemberSession, memberPage, the gate modal or the auth Worker.
   It just listens for the session the existing code already fetched, then shows the member site. */
window.addEventListener("DOMContentLoaded", () => {
  if (typeof fetchMemberSession !== "function") return;
  fetchMemberSession().then((s) => {
    if (s && s.signedIn) {
      sageRestoreBgVideo();
      if (document.body.classList.contains("guest-mode")) routeFromHash();
    }
    syncSageRoamer();
  });
  setTimeout(syncSageRoamer, 0);
});
