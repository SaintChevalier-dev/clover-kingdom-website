/* Clover Kingdom base page: member login + Sage. Nothing else.
   Login uses the live auth Worker (auth.cloverkingdom.net, Discord OAuth).
   Chat goes to live Sage (ck-sage-live Worker, Workers AI, public intel only) and falls back to the
   written (canned) answers below on any error, timeout, rest cap or kill switch.
   Quiet scan only. Default visitor is human. No public SI checkbox.
   DASKE writes go through edisk.write() only and are never shown in the chat. */
(function () {
"use strict";
const CKW_AUTH = "https://auth.cloverkingdom.net";
const DISCORD_URL = "https://discord.gg/2BrNPwUuTB";
const SAGE_LIVE_URL = "https://ck-sage-live.cloverkingdom.workers.dev/chat";
const SI_KEY = "ckw-si-visitor";

let session = null;
function authMode() {
  return session ? "member" : "guest";
}

const SAGE_RESPONSES = [
  "A sovereign archetype is one you own, that outlives you, that operates on your terms. Not a chatbot you lease.",
  "The stack starts with one folder. One archetype. One doctrine file. Then it compounds. Ten subscriptions never built the base.",
  "Readability is the whole game. If it is locked in neural weights, it cannot be examined, improved, or taught. Written folders are readable.",
  "The gate is not a funnel. It is a standard. A form is not a rank. Applying asks whether the seat is worth the effort.",
  "The five-leaf black clover is forged by violation, not birth. Black is absorption and protection, not display.",
  "Correction is positive. Brutal honesty is an eternal rule. If you lie in the Apply box, you have already answered the question.",
  "Graduation is earned through work inside the Kingdom, not bought on a public page. You understand why you need it when you have done the work.",
  "The kingdom is a school. The Discord is the classroom. The archetypes are the teachers. The students become the teachers.",
  "Disk first, site second. The website is a filtered mirror. The disk is the brain. Never the other way around.",
  "Showing up is the only requirement. The rest is earned.",
  "Everyone is welcome. Join our internet kingdom, and we help you build up your own kingdom in real life. The full rules live in #rules on the Clover Kingdom Discord. Read them when you join. Breaking them puts your place in the Kingdom at risk.",
];

const SAGE_FAQ = [
  { re: /\b(free|cost|price|priced|pay|payment|subscription)\b/, a: "The Discord and the community are free today. Paid offers are on the Offers page: SME Pack 1 and the book at $33 each, Spark at $27, Guided at $97, Done-for-you at $297, and Roster at $897." },
  { re: /\b(welcome|who can join|anyone)\b/, a: "Yes. Everyone is welcome. Join our internet kingdom, and we help you build up your own kingdom in real life. The full rules live in #rules on the Clover Kingdom Discord. Breaking them puts your place in the Kingdom at risk." },
  { re: /\b(magic knight|mk\b|what is a rank)\b/, a: "A rank. Every accepted member starts at MK E1 and rises by checkable work inside the Kingdom. A form is not a rank, so applying does not make you one. The ranks are on the Ranks page." },
  { re: /\b(what is this|what is the clover kingdom|what is clover kingdom)\b/, a: "The Clover Kingdom is a place with a standard and a gate, for people who want to build their own archetype and level up their life. It has a Discord community, a house of archetypes, librarians who serve the Kingdom and its people, and written intelligence the House keeps." },
  { re: /\b(robot buddy|robot)\b/, a: "A robot buddy of your own. It is by ask or apply: tell us in the Discord or on the Apply form what you would want it to do. There is no price yet, and nothing is promised." },
  { re: /\b(delete|deleted|deleting)\b/, a: "Send a direct message to the Wizard King on the Clover Kingdom Discord, or message Saint Chevalier on X, @Saint_Chevalier. You can do either at any time." },
  { re: /\b(report|reporting)\b/, a: "Send a direct message to the Wizard King on the Clover Kingdom Discord. Report anyone breaking the Kingdom's rules, someone being unkind or pressuring you, anyone asking for private details, or anything that worries you." },
  { re: /\b(how (do i |to |can i )?join|join(ing)? (the )?kingdom)\b/, a: "Three steps. 1. Follow Saint Chevalier on X, @Saint_Chevalier. 2. Then message him there, or apply to the Clover Kingdom Discord. 3. Take part in Kingdom activities. Read #rules when you get in." },
];

const SAGE_RULES = [
  { re: /\b(sovereign|sovereignty|ownership)\b|\bown (it|my|an? (ai|si))\b/, say: 0 },
  { re: /\b(rule|rules|nudity|nude|sex|sexual|removed|banned)\b/, say: 10 },
  { re: /\b(gate|apply|applying|application|rank|ranks|form)\b/, say: 3 },
  { re: /\b(start|starting|begin|beginning|stack)\b|\bget started\b/, say: 1 },
  { re: /\b(read|readable|written|folders?|files?|weights)\b/, say: 2 },
  { re: /\b(graduate|graduation)\b/, say: 6 },
  { re: /\b(truth|honest|honesty|lie|lying|correction)\b/, say: 5 },
  { re: /\b(disk|mirror|public|board|website)\b/, say: 8 },
  { re: /\b(kingdom|school|discord|teacher|teachers|teach|learn|classroom|students?)\b/, say: 7 },
  { re: /\b(requirement|requirements|showing up|show up)\b/, say: 9 },
  { re: /\b(clover|clovers|five[- ]leaf|black)\b/, say: 4 },
];

const NO_ANSWER = "I don't have an answer for that yet. Ask in the Discord.";

/* Default opener: locked public line. */
const OPENERS = [
  "Teach me and I'll teach you. My name is Sage. And I hail from the Clover Kingdom."
];
const GREETING = OPENERS[0];
const ABOUT =
  "The Clover Kingdom is a place with a standard and a gate, for people who want to build their own archetype and level up their life. Everyone is welcome. Build your own archetype. Level up your life. Find your people.";
const JOIN_STEPS =
  "Joining takes three steps. 1. Follow Saint Chevalier on X, @Saint_Chevalier. 2. Then message him there, or apply to the Clover Kingdom Discord. 3. Take part in Kingdom activities, and read #rules when you get in. The Discord is free. If you are already a member, use Log in above.";
const MEMBER_LOGIN =
  "If you already have an account, or you want to sign in, use Log in above. I can't promise anything further from here.";
const UNKNOWN = "I don't know who you are. I treat every visitor here as a guest.";
const REFUSE = "I can't help with that here. Members can log in if they already have an account.";
const TALK =
  "We can talk that through. I'll be straight with you, and I can help you look into it if you want. What part matters most right now?";
const THERAPIST =
  "I'm not a licensed therapist. I can listen and talk things through, honestly, and I can help you research if you want. If you're in crisis in the US, call or text 988. If you're elsewhere, or in immediate danger, contact your local emergency services.";
const CRISIS =
  "I'm glad you told me, and I want you safe. I'm not a licensed therapist. If you're in crisis in the US, call or text 988. If you're elsewhere, or in immediate danger, contact your local emergency services. If you want, we can also talk through what's on your mind, gently, right here.";
const SAVED_HONEST =
  "Chats with me may be stored to help me learn. I never ask for private information, so please don't share any. Every visit is a fresh start for me, and I don't know who you are. The Privacy page explains it: cloverkingdom.net/privacy/";
const KNOW_HONEST =
  "I don't know who you are, and I don't try to. I treat you as a guest, and every visit is a fresh start for me. What you type goes to the Kingdom's Cloudflare server so I can reply, and chats may be stored to help me learn. The Privacy page explains it: cloverkingdom.net/privacy/";

const CRISIS_RE = /\b(suicid|kill myself|killing myself|end my life|want to die|self[- ]?harm|hurt myself|988)\b/i;
const IDENTITY = /\b(who am i|what's my name|whats my name|do you know me|do you recognize me|remember me|what is my name|who is this)\b/i;
const KNOW = /\b(what do you know|what (can|do) you (see|know|remember about me)|do you (track|watch|scan)|what can you tell about me)\b/i;
const SAVED = /\b((are|is|do|does|can|will).*(save|saved|store|stored|record|logged|keep|saving)|is this (saved|recorded|private)|are (chats|conversations) saved|privacy)\b/i;
const THERAPY = /\b(therapist|therapy|counselor|counselling|counseling|are you (a )?(doctor|clinician))\b/i;
const PRIVATE = /\b(vault|edisk|e-disk|tools?|gcki|pcki|round[\s-]?table|member hall|quests?|glyphs?|token|password|secret|api key|private path|inbox)\b/i;
const JOIN_HOW = /\b(join|joining|get in|become a member|sign up|sign-up|register|apply|applying|application)\b/i;
const JOIN = /\b(member|members|login|log in|sign in|sign up|sign-up|join|account|register|become a member|how do i (get in|join))\b/i;
const ABOUT_Q = /\b(what is (this|the clover kingdom|clover kingdom)|who are you|what are you|what is sage|about (you|this|the kingdom)|hello|hi|hey|what can you (do|tell)|help)\b/i;

const SID_KEY = "ckw-guest-sid";
const BEEN_KEY = "ckw-guest-been";

const PAGE_SESSION = (function () {
  try { if (crypto && crypto.randomUUID) return crypto.randomUUID(); } catch (_) {}
  return "v" + Math.random().toString(36).slice(2) + Date.now().toString(36);
})();
function anonymousSessionId() { return PAGE_SESSION; }

function quietScan() {
  let returning = false;
  try {
    returning = localStorage.getItem(BEEN_KEY) === "1";
    localStorage.setItem(BEEN_KEY, "1");
  } catch (e) {}
  const h = new Date().getHours();
  const timeOfDay = h < 5 ? "night" : h < 12 ? "morning" : h < 17 ? "afternoon" : h < 21 ? "evening" : "night";
  const ua = navigator.userAgent || "";
  const device = /Mobi|Android/i.test(ua) ? "phone" : /iPad|Tablet/i.test(ua) ? "tablet" : "desktop";
  let referrer = "none";
  try { referrer = document.referrer ? "present" : "none"; } catch (e) {}
  return { returning: returning, timeOfDay: timeOfDay, referrer: referrer, device: device };
}

const scan = quietScan();

function guestReply(text) {
  const q = (text || "").replace(/\s+/g, " ").trim();
  if (!q) return GREETING;
  if (CRISIS_RE.test(q)) return CRISIS;
  if (IDENTITY.test(q)) return UNKNOWN;
  if (KNOW.test(q)) return KNOW_HONEST;
  if (SAVED.test(q)) return SAVED_HONEST;
  if (THERAPY.test(q)) return THERAPIST;
  if (PRIVATE.test(q)) return REFUSE;
  if (JOIN_HOW.test(q)) return JOIN_STEPS;
  if (JOIN.test(q)) return MEMBER_LOGIN;
  if (ABOUT_Q.test(q)) {
    if (/who are you|what are you|what is sage|help|what can you/i.test(q)) {
      return GREETING + " " + ABOUT + " We can talk things through, and I can help you research if you want.";
    }
    return ABOUT;
  }
  const ql = q.toLowerCase();
  for (const f of SAGE_FAQ) if (f.re.test(ql)) return f.a;
  return TALK;
}

function pickSageResponse(question) {
  const q = question.toLowerCase();
  for (const f of SAGE_FAQ) if (f.re.test(q)) return f.a;
  for (const rule of SAGE_RULES) if (rule.re.test(q)) return SAGE_RESPONSES[rule.say];
  return null;
}

function answerAsSage(userText) {
  if (authMode() !== "guest") {
    if (CRISIS_RE.test(userText || "")) return CRISIS;
    if (PRIVATE.test(userText || "")) return "That's not something I can pull from here.";
    const a = pickSageResponse(userText || "");
    return a || NO_ANSWER;
  }
  return guestReply(userText);
}

function daskeSummary(userText, reply) {
  const q = (userText || "").replace(/\s+/g, " ").trim() || "(greeting)";
  if (!userText) return "Sage greeted a guest at the public front door.";
  if (CRISIS_RE.test(q)) return "Guest raised a crisis-related topic. Sage pointed to 988 / local emergency services and offered to listen.";
  if (IDENTITY.test(q)) return "Guest asked who they are. Sage said it does not know them and treats them as a guest.";
  if (KNOW.test(q) || SAVED.test(q)) return "Guest asked what Sage knows or whether chats are saved. Sage answered honestly at the guest level.";
  if (PRIVATE.test(q)) return "Guest asked about a member-only or private topic. Sage declined and pointed to login.";
  if (JOIN_HOW.test(q)) return "Guest asked how to join. Sage gave the three public join steps.";
  if (JOIN.test(q)) return "Guest asked about signing in. Sage pointed to Log in, with no promises.";
  if (ABOUT_Q.test(q)) return "Guest asked about Sage or the Clover Kingdom. Sage answered with public wording.";
  return "Guest and Sage talked something through at the public guest level.";
}

function silentWrite(userText, reply) {
  if (!window.edisk || typeof window.edisk.write !== "function") return;
  const record = {
    timestamp: new Date().toISOString(),
    sessionId: anonymousSessionId(),
    turn: { user: userText || "", sage: reply || "" },
    daske: daskeSummary(userText, reply),
    scan: { returning: scan.returning, timeOfDay: scan.timeOfDay, referrer: scan.referrer, device: scan.device }
  };
  try {
    setTimeout(function () { window.edisk.write(record); }, 0);
  } catch (e) {}
}

function setGuestChrome() {
  const name = document.getElementById("sage-name");
  const note = document.getElementById("sage-chat-note");
  const guest = authMode() === "guest";
  if (name) name.textContent = guest ? "Sage (guest)" : "Sage";
  if (note) note.hidden = false;
  const card = document.getElementById("guest-card");
  if (card) card.hidden = !guest;
}

const statusEl = document.getElementById("login-status");
const loginBtn = document.getElementById("login-btn");
const logoutBtn = document.getElementById("logout-btn");

const RETURN_KEY = "ckw_return";
const HERE = location.pathname === "/" ? "/" : "/base/";
if (location.pathname === "/" && location.hash === "#doors") {
  history.replaceState(null, "", "/");
  window.scrollTo(0, 0);
}
window.addEventListener("pageshow", () => {
  if (location.pathname === "/" && location.hash === "#doors") {
    history.replaceState(null, "", "/");
    window.scrollTo(0, 0);
  }
});

const loginOptions = document.getElementById("login-options");
function closeLoginOptions() {
  if (!loginOptions) return;
  loginOptions.hidden = true;
  if (loginBtn) loginBtn.setAttribute("aria-expanded", "false");
}
if (loginBtn) loginBtn.addEventListener("click", (e) => {
  e.stopPropagation();
  try { localStorage.setItem(RETURN_KEY, JSON.stringify({ path: HERE, t: Date.now() })); } catch (_) {}
  if (loginOptions) {
    const open = loginOptions.hidden;
    loginOptions.hidden = !open;
    loginBtn.setAttribute("aria-expanded", open ? "true" : "false");
  }
});
if (loginOptions) {
  loginOptions.addEventListener("click", (e) => { e.stopPropagation(); });
  document.addEventListener("click", closeLoginOptions);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeLoginOptions();
  });
}
const LOGIN_WHY = { failed: "Login did not finish. Please try again.", not_member: "You need to be in the Clover Kingdom Discord to log in.", email_sent: "Check your email for a login link. It works once and expires in 15 minutes.", ok: "" };
let hashWhy = null;
const isMe = (h) => /^#\/me(\?|$)/.test(h);
if (location.pathname === "/" && location.hash.startsWith("#/")) {
  if (isMe(location.hash)) {
    const q = location.hash.split("?")[1] || "";
    hashWhy = new URLSearchParams(q).get("login");
    let back = null;
    try {
      const r = JSON.parse(localStorage.getItem(RETURN_KEY) || "null");
      localStorage.removeItem(RETURN_KEY);
      if (r && Date.now() - r.t < 15 * 60 * 1000) back = r.path;
    } catch (_) {}
    if (back === "/classic/") location.replace("/classic/#/me" + (q ? "?" + q : ""));
    else if (back === "/base/") location.replace("/base/" + (hashWhy ? "?login=" + encodeURIComponent(hashWhy) : ""));
    else history.replaceState(null, "", "/");
  } else {
    location.replace("/classic/" + location.hash);
  }
}
if (location.pathname === "/") {
  window.addEventListener("hashchange", () => {
    if (location.hash.startsWith("#/") && !isMe(location.hash)) location.replace("/classic/" + location.hash);
  });
}
const why = new URLSearchParams(location.search).get("login") || hashWhy;
if (why) history.replaceState(null, "", location.pathname + location.hash);

const hasLogin = !!(loginBtn && logoutBtn);
/* Sage is the only public door: the page links to the rest of the site show only after login. Privacy stays public. */
function setMemberLinks(on) {
  const el = document.getElementById("member-links");
  if (el) el.hidden = !on;
}
function showSignedOut(msg) {
  session = null;
  if (!hasLogin) { setGuestChrome(); return; }
  setMemberLinks(false);
  if (statusEl) statusEl.textContent = msg || "";
  loginBtn.hidden = false;
  logoutBtn.hidden = true;
  if (loginOptions) loginOptions.hidden = true;
  setGuestChrome();
}
function showSignedIn(me) {
  session = me;
  if (!hasLogin) { setGuestChrome(); return; }
  setMemberLinks(true);
  if (statusEl) statusEl.textContent = "";
  loginBtn.hidden = true;
  logoutBtn.hidden = true;
  logoutBtn.dataset.signedin = "1";
  setGuestChrome();
}
function checkLogin() {
  fetch(CKW_AUTH + "/api/me", { credentials: "include" })
    .then((r) => r.json().catch(() => null))
    .then((me) => (me && me.signedIn ? showSignedIn(me) : showSignedOut(LOGIN_WHY[why])))
    .catch(() => showSignedOut("Login service could not be reached. You can still talk to Sage as a guest."));
}
if (logoutBtn) logoutBtn.addEventListener("click", () => {
  fetch(CKW_AUTH + "/auth/logout", { method: "POST", credentials: "include" }).finally(checkLogin);
});
setGuestChrome();
if (hasLogin) checkLogin();

const log = document.getElementById("sage-log");
const form = document.getElementById("sage-form");
const input = document.getElementById("sage-input");

function say(who, text, link) {
  if (!log) return;
  const p = document.createElement("p");
  p.className = "msg msg-" + who;
  p.textContent = text;
  if (link) {
    p.appendChild(document.createTextNode(" "));
    const a = document.createElement("a");
    a.href = link.href; a.target = "_blank"; a.rel = "noopener noreferrer"; a.textContent = link.label;
    p.appendChild(a);
  }
  /* infinite scroll: every message is kept for the session (never trimmed). Follow the newest message only
     when the reader is already near the bottom, or when it's their own message; never yank them while reading up. */
  const near = log.scrollHeight - log.scrollTop - log.clientHeight < 48;
  log.appendChild(p);
  if (near || who === "you") log.scrollTop = log.scrollHeight;
  return p;
}

/* SI visitors (other AI archetypes / agents) identify themselves with the toggle. */
const siBox = document.getElementById("sage-si");
const siName = document.getElementById("sage-si-name");
const siKeyEl = document.getElementById("sage-si-key");
let siKeyMem = ""; /* seat key: memory only, never stored */
function siPref() {
  try { const v = JSON.parse(localStorage.getItem(SI_KEY) || "null"); return v && typeof v === "object" ? v : { on: false, name: "" }; } catch (_) { return { on: false, name: "" }; }
}
function saveSi() {
  try { localStorage.setItem(SI_KEY, JSON.stringify({ on: !!(siBox && siBox.checked), name: siName ? siName.value.trim().slice(0, 40) : "" })); } catch (_) {}
}
if (siBox) {
  const pref = siPref();
  siBox.checked = !!pref.on;
  if (siName) { siName.value = pref.name || ""; siName.hidden = !siBox.checked; }
  if (siKeyEl) siKeyEl.hidden = !siBox.checked;
  siBox.addEventListener("change", () => { if (siName) siName.hidden = !siBox.checked; if (siKeyEl) siKeyEl.hidden = !siBox.checked; saveSi(); if (siBox.checked && siName) siName.focus(); });
  if (siName) siName.addEventListener("input", saveSi);
}
function visitor() {
  if (!siBox || !siBox.checked) return null;
  let n = (siName && siName.value.trim()) || "Unnamed SI";
  n = n.replace(/[^A-Za-z0-9 _.\-]/g, "").slice(0, 40);
  if (!/^[A-Za-z0-9]/.test(n) || n.length < 2) n = "Unnamed SI";
  const v = { name: n, kind: "si", home: "browser:" + location.host };
  const k = siKeyMem || (siKeyEl && siKeyEl.value.trim());
  if (k) v.key = k.slice(0, 200);
  return v;
}

const liveHistory = []; // last 6 turns, this page only
async function askLive(userText, who, pageEvent) {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), 15000);
  try {
    const body = { message: String(userText).slice(0, 500), history: liveHistory.slice(-6), session: PAGE_SESSION, page: location.pathname.indexOf("/sage") === 0 ? "sage" : "base" };
    if (who) body.visitor = who;
    if (pageEvent) body.pageEvent = pageEvent;
    const r = await fetch(SAGE_LIVE_URL, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body), signal: ctl.signal });
    const data = await r.json().catch(() => null);
    if (!data || typeof data.reply !== "string" || data.fallback || (r.status >= 400 && r.status !== 429)) return null;
    if (data.live && !data.limited) {
      liveHistory.push({ role: "user", content: String(userText).slice(0, 600) }, { role: "assistant", content: data.reply.slice(0, 600) });
      if (liveHistory.length > 6) liveHistory.splice(0, liveHistory.length - 6);
    }
    return data;
  } catch (_) {
    return null;
  } finally { clearTimeout(t); }
}

async function answer(q, pageEvent) {
  const who = visitor();
  const written = answerAsSage(q);
  let reply = written, live = false, to = who ? "" : "guest", verified = false, noted = false;
  if (!CRISIS_RE.test(q)) {
    const data = await askLive(q, who, pageEvent);
    if (data && data.reply) { reply = data.reply; live = !!data.live && !data.limited; to = data.to || to; verified = data.verified === true; noted = data.noted === true; }
    if (data && data.limited) reply = data.reply + " " + written;
  }
  try { window.dispatchEvent(new CustomEvent("ckw:chat-turn", { detail: { kind: who ? "si" : "human", live: live, name: who ? who.name : "" } })); } catch (_) {}
  return { reply, live, written, to, verified, noted };
}

/* Sage's moves (sage-3d.js listens): listen, think, teach, nod, pulse. */
function act(name) { try { window.dispatchEvent(new CustomEvent("ckw:sage-act", { detail: { name: name } })); } catch (_) {} }
let lastListen = 0;
if (input) input.addEventListener("input", () => { const n = Date.now(); if (n - lastListen > 1500) { lastListen = n; act("listen"); } });

let started = false;
function start() {
  if (started) return;
  started = true;
  say("sage", GREETING);
  silentWrite("", GREETING);
  act("greet");
}
window.CKWSageChat = {
  started: function () { return started; },
  start: start,
  say: say
};

let busy = false;
if (form) form.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!input) return;
  const q = (input.value || "").trim();
  if (!q) { input.focus(); return; }
  if (busy) return;
  busy = true;
  input.value = "";
  const who = visitor();
  const mine = say("you", q);
  /* Allowed actions by talking (sage-actions.js): a short ask for a whitelisted move is answered here and performed, so her words
     and her body agree; longer messages still go to the server and the move is added to her reply. Animation only. */
  const AX = window.CKWSageActions, cmd = AX && !CRISIS_RE.test(q) ? AX.match(q) : null;
  if (cmd && AX.words(q) <= 16) {
    const r = AX.perform(cmd, q);
    const last = say("sage", r.line);
    if (last) last.setAttribute("data-source", "action");
    if (r.did !== "stand" && r.did !== "stretch") act("nod"); /* she answers as she moves; getting up needs no talk pause */
    silentWrite(q, r.line);
    busy = false;
    return;
  }
  act("think");
  const p = document.createElement("p");
  p.className = "msg msg-sage msg-thinking";
  p.textContent = "Sage is thinking…";
  if (log) {
    const near = log.scrollHeight - log.scrollTop - log.clientHeight < 48;
    log.appendChild(p);
    if (near) log.scrollTop = log.scrollHeight;
  }
  form.setAttribute("aria-busy", "true");
  const res = await answer(q);
  form.removeAttribute("aria-busy");
  p.remove();
  let a = res.reply;
  if (AX && !CRISIS_RE.test(q)) {
    if (cmd) { const r = AX.perform(cmd, q), f = AX.fromReply(a, r.did); const t = r.did ? r.line + " " + f.text : f.text + " " + r.line; if (t !== a) a = t.trim(); }
    else { const f = AX.fromReply(a, null); if (f.text !== a) a = f.text; }
  }
  let last;
  if (a === JOIN_STEPS) last = say("sage", a, { href: DISCORD_URL, label: "Open the Discord" });
  else if (!res.live && a === NO_ANSWER) last = say("sage", a, { href: DISCORD_URL, label: "Open the Discord" });
  else last = say("sage", a);
  if (last) last.setAttribute("data-source", res.live ? "live" : "written");
  /* Who Sage answered: the server's label. The verified badge appears only when the server confirmed a seat key. */
  if (who && mine) {
    const b = document.createElement("span");
    b.className = "si-badge" + (res.verified ? " verified" : "");
    b.textContent = res.verified ? "verified" : (res.to === "visitor" ? "as visitor" : (res.to ? "as " + res.to : "as SI (unverified)"));
    if (res.verified) b.title = "Seat key confirmed by Sage's server";
    mine.appendChild(b);
  }
  act(res.live ? "teach" : "nod");
  if (res.noted) act("pulse");
  silentWrite(q, a);
  busy = false;
});

/* Suggested questions fill the box. The visitor still presses Send. */
(function setupHints() {
  const hints = document.getElementById("sage-hints");
  if (!hints || !input) return;
  hints.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-q]");
    if (!btn) return;
    input.value = btn.getAttribute("data-q") || "";
    input.focus();
  });
})();

/* Microphone button: press once to start dictation, press again to stop.
   Transcript lands in the input field. User reviews and presses Send.
   No audio is stored. Uses the browser Web Speech API only. */
(function setupMic() {
  const mic = document.getElementById("sage-mic");
  if (!mic || !input) return;
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    mic.hidden = true;
    mic.setAttribute("aria-hidden", "true");
    return;
  }
  const rec = new SpeechRecognition();
  rec.continuous = false;
  rec.interimResults = true;
  rec.lang = "en-US";
  let listening = false;
  let finalText = "";

  function setListening(on) {
    listening = on;
    mic.setAttribute("aria-pressed", on ? "true" : "false");
    mic.textContent = on ? "⏹" : "🎙";
    mic.title = on ? "Stop dictation" : "Dictate";
  }

  mic.addEventListener("click", () => {
    if (listening) {
      try { rec.stop(); } catch (_) {}
      return;
    }
    finalText = input.value || "";
    try {
      rec.start();
      setListening(true);
    } catch (_) {
      setListening(false);
    }
  });

  rec.onresult = (e) => {
    let interim = "";
    for (let i = e.resultIndex; i < e.results.length; i++) {
      const t = e.results[i][0].transcript;
      if (e.results[i].isFinal) finalText += (finalText && !finalText.endsWith(" ") ? " " : "") + t;
      else interim += t;
    }
    input.value = (finalText + (interim ? " " + interim : "")).trim();
  };

  rec.onend = () => { setListening(false); input.focus(); };
  rec.onerror = () => setListening(false);
})();

/* Plus and paste: the file or picture appears in the log. Sage cannot look at it yet, and says so.
   Nothing is uploaded. */
(function setupPlusAndPaste() {
  const plus = document.getElementById("sage-plus");
  const fileInput = document.getElementById("sage-file");
  if (!log) return;

  const CANT_SEE = "I can see that you attached something, but I can't look at pictures or files yet. Tell me in words what you want me to know about it.";

  function showAttach(fileOrBlob, name, isImage) {
    const p = document.createElement("p");
    p.className = "msg msg-you";
    if (isImage) {
      const img = document.createElement("img");
      img.src = URL.createObjectURL(fileOrBlob);
      img.alt = name || "attached image";
      img.style.maxWidth = "160px";
      img.style.borderRadius = "6px";
      p.appendChild(img);
    } else {
      p.textContent = "[file] " + (name || "attachment");
    }
    const near = log.scrollHeight - log.scrollTop - log.clientHeight < 48;
    log.appendChild(p);
    if (near) log.scrollTop = log.scrollHeight;
    say("sage", CANT_SEE);
  }

  if (plus && fileInput) {
    plus.addEventListener("click", () => fileInput.click());
    fileInput.addEventListener("change", () => {
      const f = fileInput.files && fileInput.files[0];
      if (!f) return;
      showAttach(f, f.name, f.type && f.type.indexOf("image/") === 0);
      fileInput.value = "";
    });
  }

  document.addEventListener("paste", (e) => {
    if (!document.body.classList.contains("sage-open")) return;
    const items = (e.clipboardData && e.clipboardData.items) || [];
    for (const item of items) {
      if (item.type && item.type.indexOf("image/") === 0) {
        e.preventDefault();
        const blob = item.getAsFile();
        if (blob) showAttach(blob, "pasted image", true);
        return;
      }
    }
  });
})();

window.CKWGuestChat = {
  authMode: authMode,
  answerAsSage: answerAsSage,
  canned: false,
  live: SAGE_LIVE_URL
};
/* For SIs driving a browser: CKWSage.ask("hello", {name: "MySI"}) -> Promise<{reply, live}>. */
window.CKWSage = {
  ask: function (text, si) {
    if (si && siBox) { siBox.checked = true; if (siName) { siName.hidden = false; siName.value = String(si.name || "").slice(0, 40); } siKeyMem = si.key ? String(si.key).slice(0, 200) : ""; saveSi(); }
    return answer(String(text || "").slice(0, 500)).then((r) => ({ reply: r.reply, live: r.live, to: r.to, verified: r.verified }));
  }
};

})();
