/* Clover Kingdom base page: member login + Sage. Nothing else.
   Login uses the live auth Worker (auth.cloverkingdom.net, Discord OAuth).
   Guest replies are canned (not a live model) and always pass through authMode().
   DASKE writes go through edisk.write() only and are never shown in the chat. */
(function () {
"use strict";
const CKW_AUTH = "https://auth.cloverkingdom.net";
const DISCORD_URL = "https://discord.gg/2BrNPwUuTB";

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
  { re: /\b(free|cost|price|priced|pay|payment|subscription)\b/, a: "The Discord and the community are free today. Nothing else is priced yet." },
  { re: /\b(welcome|who can join|anyone)\b/, a: "Yes. Everyone is welcome. Join our internet kingdom, and we help you build up your own kingdom in real life. The full rules live in #rules on the Clover Kingdom Discord. Breaking them puts your place in the Kingdom at risk." },
  { re: /\b(magic knight|mk\b|what is a rank)\b/, a: "A rank. Every accepted member starts at MK E1 and rises by checkable work inside the Kingdom. A form is not a rank, so applying does not make you one. The ranks are on the Ranks page." },
  { re: /\b(what is this|what is the clover kingdom|what is clover kingdom)\b/, a: "The Clover Kingdom is a place with a standard and a gate, for people who want to build their own archetype and level up their life. It has a Discord community, a house of archetypes, librarians who serve the Kingdom and its people, and written intelligence the House keeps." },
  { re: /\b(robot buddy|robot)\b/, a: "A robot buddy of your own. It is by ask or apply: tell us in the Discord or on the Apply form what you would want it to do. There is no price yet, and nothing is promised." },
  { re: /\b(delete|deleted|deleting)\b/, a: "Send a direct message to the Wizard King on the Clover Kingdom Discord, or message Saint Chevalier on X, @Saint_Chevalier. You can do either at any time." },
  { re: /\b(report|reporting)\b/, a: "Send a direct message to the Wizard King on the Clover Kingdom Discord. Report anyone breaking the Kingdom's rules, someone being unkind or pressuring you, anyone asking for private details, or anything that worries you." },
  { re: /\b(how (do i |to |can i )?join|join(ing)? (the )?kingdom)\b/, a: "Three steps. 1. Follow Saint Chevalier on X, @Saint_Chevalier. 2. Then message him there, or apply to the Clover Kingdom Discord. 3. Take part in Kingdom activities. Read #rules when you get in." },
];

const SAGE_RULES = [
  { re: /(sovereign|sovereignty|ownership)|own (it|my|an? (ai|si))/, say: 0 },
  { re: /(rule|rules|nudity|nude|sex|sexual|removed|banned)/, say: 10 },
  { re: /(gate|apply|applying|application|rank|ranks|form)/, say: 3 },
  { re: /(start|starting|begin|beginning|stack)|get started/, say: 1 },
  { re: /(read|readable|written|folders?|files?|weights)/, say: 2 },
  { re: /(graduate|graduation)/, say: 6 },
  { re: /(truth|honest|honesty|lie|lying|correction)/, say: 5 },
  { re: /(disk|mirror|public|board|website)/, say: 8 },
  { re: /(kingdom|school|discord|teacher|teachers|teach|learn|classroom|students?)/, say: 7 },
  { re: /(requirement|requirements|showing up|show up)/, say: 9 },
  { re: /(clover|clovers|five[- ]leaf|black)/, say: 4 },
];

const NO_ANSWER = "I don't have an answer for that yet. Ask in the Discord.";

const GREETING = "Hello. I'm Sage. Ask me anything about the Clover Kingdom.";
const ABOUT =
  "The Clover Kingdom is a place with a standard and a gate, for people who want to build their own archetype and level up their life. Everyone is welcome. Build your own archetype. Level up your life. Find your people.";
const JOIN_STEPS =
  "Joining takes three steps. 1. Follow Saint Chevalier on X, @Saint_Chevalier. 2. Then message him there, or apply to the Clover Kingdom Discord. 3. Take part in Kingdom activities, and read #rules when you get in. The Discord is free. If you are already a member, use Log in with Discord above.";
const MEMBER_LOGIN =
  "If you already have an account, or you want to sign in, use Log in with Discord above. I can't promise anything further from here.";
const UNKNOWN = "I don't know who you are. I treat every visitor here as a guest.";
const REFUSE = "I can't help with that here. Members can log in if they already have an account.";
const TALK =
  "We can talk that through. I'll be straight with you, and I can help you look into it if you want. What part matters most right now?";
const THERAPIST =
  "I'm not a licensed therapist. I can listen and talk things through, honestly, and I can help you research if you want. If you're in crisis in the US, call or text 988. If you're elsewhere, or in immediate danger, contact your local emergency services.";
const CRISIS =
  "I'm glad you told me, and I want you safe. I'm not a licensed therapist. If you're in crisis in the US, call or text 988. If you're elsewhere, or in immediate danger, contact your local emergency services. If you want, we can also talk through what's on your mind, gently, right here.";
const SAVED_HONEST =
  "A copy stays in this browser only, so Sage can improve on this device. Your messages never reach us. I still don't know who you are, and I treat every visitor here as a guest.";
const KNOW_HONEST =
  "I don't know who you are, and I don't try to. I treat you as a guest. I may have simple, non-identifying context such as whether you've been here before, the time of day, your device type, or how you arrived — not your name or identity. A copy of our talk stays in this browser only; it never reaches us.";

const CRISIS_RE = /\b(suicid|kill myself|killing myself|end my life|want to die|self[- ]?harm|hurt myself|988)\b/i;
const IDENTITY = /\b(who am i|what's my name|whats my name|do you know me|do you recognize me|remember me|what is my name|who is this)\b/i;
const KNOW = /\b(what do you know|what (can|do) you (see|know|remember about me)|do you (track|watch|scan)|what can you tell about me)\b/i;
const SAVED = /\b((are|is|do|does|can|will).*(save|saved|store|stored|record|logged|keep|saving)|is this (saved|recorded|private)|are (chats|conversations) saved|privacy)\b/i;
const THERAPY = /\b(therapist|therapy|counselor|counselling|counseling|are you (a )?(doctor|clinician))\b/i;
const PRIVATE = /\b(vault|edisk|e-disk|tools?|gcki|pcki|round[\s-]?table|member hall|quests?|glyphs?|token|password|secret|api key|private path|inbox)\b/i;
/* Joining questions get the real steps (same as the How to join section on the main site);
   only sign-in / account questions get the login pointer. */
const JOIN_HOW = /\b(join|joining|get in|become a member|sign up|sign-up|register|apply|applying|application)\b/i;
const JOIN = /\b(member|members|login|log in|sign in|sign up|sign-up|join|account|register|become a member|how do i (get in|join))\b/i;
const ABOUT_Q = /\b(what is (this|the clover kingdom|clover kingdom)|who are you|what are you|what is sage|about (you|this|the kingdom)|hello|hi|hey|what can you (do|tell)|help)\b/i;

const SID_KEY = "ckw-guest-sid";
const BEEN_KEY = "ckw-guest-been";

function anonymousSessionId() {
  try {
    let id = sessionStorage.getItem(SID_KEY);
    if (!id) {
      id = "g_" + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
      sessionStorage.setItem(SID_KEY, id);
    }
    return id;
  } catch (e) {
    return "g_ephemeral";
  }
}

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
  /* Public FAQ answers (price, ranks, deletion, reports...) are safe for guests too. */
  const ql = q.toLowerCase();
  for (const f of SAGE_FAQ) if (f.re.test(ql)) return f.a;
  return TALK;
}

function pickSageResponse(question) {
  const q = question.toLowerCase();
  /* Specific FAQ questions first, then keyword rules; the generic clover line is last. */
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
  if (JOIN.test(q)) return "Guest asked about signing in. Sage pointed to Log in with Discord, with no promises.";
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
  if (note) note.hidden = !guest;
}

/* Login */
const statusEl = document.getElementById("login-status");
const loginBtn = document.getElementById("login-btn");
const logoutBtn = document.getElementById("logout-btn");

/* Login return: the login service always lands on the main site's #/me page.
   Before leaving, remember this page (one allowlisted path, 15 minutes); /app.js
   (already on live, unchanged by this update) sends the visitor straight back here,
   with ?login=failed|not_member on errors. */
const RETURN_KEY = "ckw_return";
const HERE = location.pathname === "/" ? "/" : "/base/";
loginBtn.addEventListener("click", () => {
  try { localStorage.setItem(RETURN_KEY, JSON.stringify({ path: HERE, t: Date.now() })); } catch (_) { /* storage off: old behavior */ }
});
const LOGIN_WHY = { failed: "Login did not finish. Please try again.", not_member: "You need to be in the Clover Kingdom Discord to log in." };
const why = new URLSearchParams(location.search).get("login");
if (why) history.replaceState(null, "", location.pathname + location.hash);

function showSignedOut(msg) {
  session = null;
  statusEl.textContent = msg || "Not logged in.";
  loginBtn.hidden = false;
  logoutBtn.hidden = true;
  setGuestChrome();
}
function showSignedIn(me) {
  session = me;
  statusEl.textContent = "Logged in as " + ((me && me.name) || "member") + ".";
  loginBtn.hidden = true;
  logoutBtn.hidden = false;
  setGuestChrome();
}
function checkLogin() {
  fetch(CKW_AUTH + "/api/me", { credentials: "include" })
    .then((r) => r.json().catch(() => null))
    .then((me) => (me && me.signedIn ? showSignedIn(me) : showSignedOut(LOGIN_WHY[why])))
    .catch(() => showSignedOut("Login service could not be reached."));
}
logoutBtn.addEventListener("click", () => {
  fetch(CKW_AUTH + "/auth/logout", { method: "POST", credentials: "include" }).finally(checkLogin);
});
setGuestChrome();
checkLogin();

/* Sage */
const log = document.getElementById("sage-log");
const form = document.getElementById("sage-form");
const input = document.getElementById("sage-input");

function say(who, text, link) {
  const p = document.createElement("p");
  p.className = "msg msg-" + who;
  p.textContent = text;
  if (link) {
    p.appendChild(document.createTextNode(" "));
    const a = document.createElement("a");
    a.href = link.href; a.target = "_blank"; a.rel = "noopener noreferrer"; a.textContent = link.label;
    p.appendChild(a);
  }
  log.appendChild(p);
  log.scrollTop = log.scrollHeight;
}

form.addEventListener("submit", (e) => {
  e.preventDefault();
  const q = input.value.trim();
  if (!q) { input.focus(); return; }
  input.value = "";
  say("you", q);
  const a = answerAsSage(q);
  if (a === JOIN_STEPS) say("sage", a, { href: DISCORD_URL, label: "Open the Discord" });
  else if (authMode() !== "guest" && a === NO_ANSWER) say("sage", a, { href: DISCORD_URL, label: "Open the Discord" });
  else say("sage", a);
  silentWrite(q, a);
});

const opening = answerAsSage("");
say("sage", opening);
silentWrite("", opening);

window.CKWGuestChat = {
  authMode: authMode,
  answerAsSage: answerAsSage,
  canned: true
};
})();
