/* ------------------------------------------------
   Sage front door (branch sage-front-door-2026-11-21, PREVIEW ONLY).
   Voice-sourced design from Jacob's call, Sat Nov 21 2026. Not official until he types it.

   - Logged-out visitors see ONLY this page: Sage, a chat box (type or talk), and three doors:
     contact Jacob, apply to the Discord, become a member (Discord login).
   - Everything else on the site sits behind the member login (see routeFromHash in app.js).
   - Replies: STUB. No server route for live Sage exists yet, so answers come from the site's
     own set answers (pickSageResponse in app.js) plus the small CK FAQ below. Nothing typed here
     leaves the browser in this preview. A later /api/sage Worker route can replace sageReply().
   - Guest scan: STUB, local only. Reads what the browser already hands every site (referrer host,
     utm_* tags, language, time zone, screen class) to greet the visitor. Nothing is stored or sent.
   ------------------------------------------------ */
"use strict";

const SAGE_FRONT_TITLE = "CLOVER KINGDOM | Talk to Sage";

/* HOOK ONLY, NOT BUILT (voice-sourced 2026-11-21 7:23 AM CT; unverified until Jacob types it).
   Member archetype switcher: once logged in, a member (Jacob only for now) picks which SI
   archetype is "main-ing" the site, chosen from all existing archetypes (ARCHETYPES in app.js).
   Sage roams and stays the default public face. Guests always get Sage.
   Playtest order: (1) this Sage-only public front door, no login; (2) the switcher, after (1) is solid.
   When built: read the member's choice from the auth Worker (not localStorage), check role on the
   server, and return that archetype's name, portrait and voice here. Until then this always returns Sage. */
const SAGE_FRONT_DEFAULT_ARCHETYPE = "sage";
function activeFrontArchetype() { return SAGE_FRONT_DEFAULT_ARCHETYPE; }
const SAGE_CONTACT_URL = "https://x.com/Saint_Chevalier";

/* Small CK FAQ for the stub. Checked before the older set answers. */
const SAGE_FRONT_FAQ = [
  { re: /\b(contact|reach|talk to|message|email|dm)\b.*\b(jacob|owner|founder|human|person|someone|saint)\b|\b(jacob|founder)\b/,
    a: "Jacob reads his messages on X. Message @Saint_Chevalier there and say you met Sage on the website.", door: "contact" },
  { re: /\b(discord|apply|application|join|get in|inner)\b/,
    a: "The Discord is the inner family. You apply to get in, and a human reads it. Ask me anything first if you want to know what it offers.", door: "discord" },
  { re: /\b(member|membership|login|log in|sign in|account|behind)\b/,
    a: "Members log in with Discord and get everything on this site: the Tek Tribe game, the Round Table, quests and more. Join the Discord first, then log in.", door: "member" },
  { re: /\b(what (is|are) (this|you|the clover kingdom|clover kingdom)|who are you|what do you do)\b/,
    a: "I am Sage, the Clover Kingdom's guide at the front door. The Kingdom is a place with a standard and a gate, for people who want to build their own SI and level up their life. Ask me anything about it." },
  { re: /\b(si|super intelligence|ai|archetype|archetypes)\b/,
    a: "SI means super intelligence. Archetypes are the Kingdom's SIs, each with its own lane. I am one of them. The rest live past the gate." },
  { re: /\b(money|offer|offers|opportunit|work|job|earn|sell|buy)\b/,
    a: "There are offers and opportunities for members. Join the Discord, log in, and you will see them. Nothing is priced on this page." },
  { re: /\b(privacy|data|track|tracking|cookie|collect|scan)\b/,
    a: "In this preview I only read what your browser already tells every site (where you came from, your language and time zone) to greet you. Nothing you type leaves your browser. The privacy note has the full list." },
  { re: /\b(hi|hello|hey|yo|sup|greetings)\b/,
    a: "Hello. Ask me anything about the Clover Kingdom." },
];

/* What the browser already tells every site. Local only, never sent in this preview. */
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
    "youtube.com": "YouTube", "github.com": "GitHub", "reddit.com": "Reddit", "linkedin.com": "LinkedIn",
  };
  const src = scan.utm.utm_source || scan.from;
  const where = src ? (known[src.toLowerCase()] || src) : "";
  const hello = where ? `Welcome. You came in from ${where}.` : "Welcome to the Clover Kingdom.";
  return `${hello} I am Sage. Ask me anything about the Kingdom. I can get you to Jacob, into the Discord, or into a membership.`;
}

function sageReply(question) {
  const q = String(question || "").toLowerCase();
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

function buildSageFrontDoor() {
  const wrap = document.createElement("section");
  wrap.className = "sf-door";
  wrap.setAttribute("aria-label", "Talk to Sage");
  wrap.innerHTML = `
    <div class="sf-stage">
      <div class="sf-avatar" id="sf-avatar" aria-hidden="true">
        <div class="sf-halo"></div>
        <div class="sf-ring"></div>
        <img class="sf-face" src="images/sage-face.jpg" alt="" width="640" height="640" decoding="async">
        <div class="sf-glint"></div>
      </div>
      <h1 class="sf-name">SAGE</h1>
      <p class="sf-tag">Clover Kingdom guide &middot; AI</p>
    </div>
    <div class="sf-chat">
      <div class="sf-log" id="sf-log" role="log" aria-live="polite" aria-label="Conversation with Sage"></div>
      <div class="sf-doors" id="sf-doors">
        <a class="sf-door-btn" data-door="contact" href="${SAGE_CONTACT_URL}" target="_blank" rel="noopener noreferrer">Contact Jacob</a>
        <a class="sf-door-btn" data-door="discord" href="${DISCORD_URL}" target="_blank" rel="noopener noreferrer">Apply to the Discord</a>
        <a class="sf-door-btn sf-door-primary" data-door="member" href="#/members" data-gate-login="1" aria-haspopup="dialog">Become a member</a>
      </div>
      <form class="sf-form" id="sf-form" autocomplete="off">
        <button type="button" class="sf-mic" id="sf-mic" aria-label="Talk to Sage" title="Talk to Sage" hidden>
          <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false"><rect x="9" y="3" width="6" height="12" rx="3" fill="currentColor"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3M8 21h8" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"/></svg>
        </button>
        <input class="sf-input" id="sf-input" type="text" maxlength="500" placeholder="Ask Sage anything about the Clover Kingdom" aria-label="Ask Sage anything about the Clover Kingdom">
        <button type="submit" class="sf-send">Ask</button>
      </form>
      <div class="sf-foot">
        <label class="sf-voice-toggle"><input type="checkbox" id="sf-voice"> Sage speaks out loud</label>
        <span class="sf-sep">&middot;</span>
        <span>Sage is an AI guide. Preview answers are set answers.</span>
        <span class="sf-sep">&middot;</span>
        <a href="#/privacy">Privacy</a>
      </div>
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

  const say = (who, text) => {
    const row = document.createElement("div");
    row.className = "sf-msg sf-" + who;
    const b = document.createElement("div");
    b.className = "sf-bubble";
    b.textContent = text; // always text nodes, never HTML
    row.appendChild(b);
    log.appendChild(row);
    log.scrollTop = log.scrollHeight;
  };
  const pulse = () => { face.classList.add("is-speaking"); setTimeout(() => face.classList.remove("is-speaking"), 1400); };
  const highlight = (door) => {
    doors.querySelectorAll(".sf-door-btn").forEach((a) => a.classList.toggle("is-suggested", !!door && a.dataset.door === door));
  };

  const scan = sageGuestScan();
  say("sage", sageGreeting(scan));

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const q = input.value.trim();
    if (!q) { input.focus(); return; }
    input.value = "";
    say("you", q);
    const r = sageReply(q);
    setTimeout(() => { say("sage", r.text); highlight(r.door); pulse(); sageSpeak(r.text, voice.checked); }, 380);
  });

  /* Gentle "alive" motion: the portrait leans toward the pointer. Off under reduced motion. */
  const reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!reduce) {
    window.addEventListener("pointermove", (e) => {
      if (!document.body.contains(face)) return;
      const x = (e.clientX / window.innerWidth - 0.5) * 2;
      const y = (e.clientY / window.innerHeight - 0.5) * 2;
      face.style.setProperty("--tx", (x * 6).toFixed(1) + "deg");
      face.style.setProperty("--ty", (-y * 6).toFixed(1) + "deg");
    }, { passive: true });
  }

  /* Talk: Web Speech API where the browser has it (Chrome, Edge, Safari; not Firefox Android).
     Some browsers send audio to their own speech service; the privacy note says so. */
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (SR) {
    mic.hidden = false;
    let rec = null;
    mic.addEventListener("click", () => {
      if (rec) { rec.stop(); return; }
      rec = new SR();
      rec.lang = navigator.language || "en-US";
      rec.interimResults = true;
      rec.maxAlternatives = 1;
      mic.classList.add("is-listening");
      face.classList.add("is-listening");
      rec.onresult = (ev) => {
        let t = "";
        for (let i = 0; i < ev.results.length; i++) t += ev.results[i][0].transcript;
        input.value = t;
        if (ev.results[ev.results.length - 1].isFinal) { voice.checked = true; form.requestSubmit(); }
      };
      const done = () => { mic.classList.remove("is-listening"); face.classList.remove("is-listening"); rec = null; };
      rec.onend = done;
      rec.onerror = (ev) => { done(); if (ev.error === "not-allowed") say("sage", "I could not hear you: the microphone is blocked. You can type instead."); };
      try { rec.start(); } catch (_) { done(); }
    });
  }
}

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
      <p>In this version, nowhere. Sage uses it inside your browser to greet you and answer, and nothing is stored or sent to the Clover Kingdom. If you use the microphone, your browser may send the audio to its own speech service (Google in Chrome, Apple in Safari) to turn it into text.</p>
      <p>No ads. No ad trackers. No selling of your data.</p>
      <h2>Members</h2>
      <p>Member login uses Discord. The login service keeps your Discord name, avatar and whether you are in the Clover Kingdom Discord, so it can let you in.</p>
      <h2>Questions or deletion</h2>
      <p>Message Saint Chevalier on X (@Saint_Chevalier) or the Wizard King on the Clover Kingdom Discord.</p>
    </div>`;
  return wrap;
}
