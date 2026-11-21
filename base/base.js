/* Clover Kingdom base page: member login + Sage. Nothing else.
   Login uses the live auth Worker (auth.cloverkingdom.net, Discord OAuth).
   Sage answers are set answers adapted from /app.js (not live yet). Wording rule: say "archetype". */
(function () {
"use strict";
const CKW_AUTH = "https://auth.cloverkingdom.net";
const DISCORD_URL = "https://discord.gg/2BrNPwUuTB";

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
  { re: /\b(how (do i |to )?join|join(ing)? (the )?kingdom)\b/, a: "Three steps. Follow on X. Apply to the Discord. Then participate. Affiliation is not revealed to those who cannot enter." },
];

/* Whole-word matching, most specific first. Each entry points at one line of SAGE_RESPONSES. */
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

/* Login */
const statusEl = document.getElementById("login-status");
const loginBtn = document.getElementById("login-btn");
const logoutBtn = document.getElementById("logout-btn");

function showSignedOut(msg) {
  statusEl.textContent = msg || "Not logged in.";
  loginBtn.hidden = false;
  logoutBtn.hidden = true;
}
function showSignedIn(me) {
  statusEl.textContent = "Logged in as " + ((me && me.name) || "member") + ".";
  loginBtn.hidden = true;
  logoutBtn.hidden = false;
}
function checkLogin() {
  fetch(CKW_AUTH + "/api/me", { credentials: "include" })
    .then((r) => r.json().catch(() => null))
    .then((me) => (me && me.signedIn ? showSignedIn(me) : showSignedOut()))
    .catch(() => showSignedOut("Login service could not be reached."));
}
logoutBtn.addEventListener("click", () => {
  fetch(CKW_AUTH + "/auth/logout", { method: "POST", credentials: "include" }).finally(checkLogin);
});
checkLogin();

/* Sage */
const log = document.getElementById("sage-log");
const form = document.getElementById("sage-form");
const input = document.getElementById("sage-input");

function pickSageResponse(question) {
  const q = question.toLowerCase();
  /* Specific FAQ questions first, then keyword rules; the generic clover line is last. */
  for (const f of SAGE_FAQ) if (f.re.test(q)) return f.a;
  for (const rule of SAGE_RULES) if (rule.re.test(q)) return SAGE_RESPONSES[rule.say];
  return null;
}
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
  const a = pickSageResponse(q);
  if (a) say("sage", a);
  else say("sage", NO_ANSWER, { href: DISCORD_URL, label: "Open the Discord" });
});
say("sage", "Hello. Ask me anything about the Clover Kingdom.");
})();
