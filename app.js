/* ============================================================
   CLOVER KINGDOM — ritual + routing + Sage mouth (v1)
   ============================================================ */

/* Marks JS as on (moved here from an inline script so the CSP can keep script-src 'self'). */
document.documentElement.classList.add("js");

const STORAGE_KEY_SKIP = "ck_ritual_skipped_v1";

/* ONE place for the Discord invite. Change it here and it updates
   the front page buttons, the Links page and the Sage "ask in the Discord" reply. */
const DISCORD_URL = "https://discord.gg/2BrNPwUuTB";
const X_FOLLOW_URL = "https://x.com/intent/follow?screen_name=Saint_Chevalier";

/* Public links (single place to edit). Each one is shown on the Links page. */
const LINKS = [
  { name: "X", handle: "@Saint_Chevalier", url: "https://x.com/Saint_Chevalier", desc: "Saint Chevalier on X. Message here to ask for your application to be deleted." },
  { name: "Discord", handle: "Join the server", url: DISCORD_URL, desc: "The classroom. Approval happens here." },
  { name: "Instagram", handle: "@saintchevalierasi", url: "https://www.instagram.com/saintchevalierasi/", desc: "Saint Chevalier on Instagram." },
  { name: "Tek Tribe", handle: "@Tek_Tribe on X", url: "https://x.com/Tek_Tribe", desc: "Tek Tribe on X." },
];

/* Ritual (intro) timers live here so they can be cancelled by Skip or by any navigation. */
const ritual = { check: null, timers: [] };
function ritualActive() { return !!ritual.check || ritual.timers.length > 0; }
function cancelRitual() {
  if (ritual.check) { clearInterval(ritual.check); ritual.check = null; }
  ritual.timers.forEach(clearTimeout);
  ritual.timers = [];
}
const prefersReducedMotion =
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function markSkipped() {
  try { sessionStorage.setItem(STORAGE_KEY_SKIP, "1"); } catch (e) {}
}

function shouldSkip() {
  return prefersReducedMotion || sessionStorage.getItem(STORAGE_KEY_SKIP) === "1";
}

/* ------------------------------------------------
   Build: film scene (CSS placeholder for the
   self-hosted ~6s asset)
   ------------------------------------------------ */
function buildFilmScene() {
  const wrap = document.createElement("div");
  wrap.className = "film-wrap";

  wrap.innerHTML = `
    <div class="film-scene">
      <div class="film-field"></div>
      <div class="film-light"></div>
      <div class="film-book-fall">
        <div class="film-book">
          <div class="film-book-spine"></div>
          <div class="film-book-cover">
            <img src="images/crest.svg" alt="" aria-hidden="true" class="film-crest">
          </div>
        </div>
      </div>
      <div class="film-floor"></div>
      <button class="film-skip" type="button" aria-label="Skip the ritual and go to the gate">
        Skip
      </button>
    </div>
  `;

  const skipBtn = wrap.querySelector(".film-skip");
  if (skipBtn) {
    skipBtn.addEventListener("click", () => {
      cancelRitual();
      markSkipped();
      renderMain();
    });
  }

  return wrap;
}

/* ------------------------------------------------
   Build: book scene (grimoire that opens,
   five-leaf BLACK crest on cover)
   ------------------------------------------------ */
function buildBookScene() {
  const wrap = document.createElement("div");
  wrap.className = "book-scene";

  wrap.innerHTML = `
    <div class="book-stage">
      <div class="book-pedestal"></div>
      <div class="grimoire">
        <div class="grimoire-cover">
          <img
            src="images/crest.svg"
            alt="Five-leaf black clover crest — the grimoire mark"
            class="grimoire-crest"
          >
        </div>
        <div class="grimoire-open-hint">The Kingdom is written.</div>
      </div>
    </div>
  `;

  return wrap;
}


/* ------------------------------------------------
   Front page content (plain data: edit or delete a line, nothing else to touch)
   ------------------------------------------------ */

/* What the Kingdom offers (legendary merchant frame). No prices, no guarantees, no results.
   The robot buddy has no price and no legal check yet, so it is worded as "ask / apply". */
const OFFERS = [
  { name: "Motivation", text: "A reason to start, and people who help you keep going.",
    detail: "A reason to start, and people who help you keep going. You show up, say what you are working on, and others who are building too keep you moving. The Kingdom's own rule is that showing up is the only requirement. The rest is earned." },
  { name: "Community", text: "A community of like-minded people who want to build, learn and help each other.",
    detail: "A community of like-minded people who want to build their own SI and their own life. It lives in the Discord. The Kingdom is a school, the Discord is the classroom, the SIs are the teachers, and the students become the teachers." },
  { name: "A robot buddy", text: "Build a robot buddy of your own. Ask in the Discord or apply, and we will talk.",
    detail: "Build a robot buddy of your own. This one is by ask or apply: tell us in the Discord, or on the Apply form, what you would want it to do, and we will talk. Nothing about it is priced or promised on this page." },
  { name: "A way of life and thinking", text: "A way to live and a way to think, written down plainly in the Standard.",
    detail: "A way to live and a way to think, written down plainly in the Standard. A few of its lines: the truth is always remembered, for it always existed; correction is positive; brutal honesty is an eternal rule. Read it, then decide if it is for you." },
  { name: "Survival", text: "The basics for everyone: water, food, shelter and security.",
    detail: "The four basics for everyone: water, food, shelter and security. The House keeps plain how-to cards on them, and ARGUS picks gear and names the certification when a tool does a safety job." },
  { name: "Secret tek intelligence", text: "Tek intelligence the House has compiled for the Kingdom family. It is for members only, so none of it is shown here.",
    detail: "Tek intelligence the House has compiled for the Kingdom family. It is for members only, so none of it is shown on this site. If you want to be part of the family, join the Discord and apply." },
];

/* The House: the archetype lineup. One object per card AND per page (#/archetype/<slug>).
   To hide one, delete its line. The slug is made from the name.
   name = card title, job = short role, line = one sentence on the card,
   does = what it does for members (shown on its own page).
   The Wizard King chooses which are public (Saint Chevalier guessed the first list from the Kingdom notes). */
const ARCHETYPES = [
  { name: "Wizard King", job: "Thinks it through", line: "Thinks an idea all the way through before anything is done.",
    does: "Takes an idea and thinks it all the way through before anything is done." },
  { name: "Saint Chevalier", job: "Keeps it coherent", line: "Checks that plans fit together and do not contradict each other.",
    does: "Checks that plans fit together so the pieces do not contradict each other. To ask for your application to be deleted, message @Saint_Chevalier on X." },
  { name: "Sage", job: "Teaches", line: "Writes how-to guides and checks a card is safe to share.",
    does: "Teaches. Writes how-to guides in plain words and checks a card is safe to share before it goes out. A public Sage answers short questions on the front page of this site, and your own Sage is summoned after you apply." },
  { name: "Val", job: "Roadmaps", line: "Plans the roadmap and prepares the next steps.",
    does: "Builds roadmaps and prepares the next steps on them, so a goal turns into a path you can follow." },
  { name: "ARGUS", job: "Tek scout", line: "Grades tools, never people, and says what each costs and whether you own it.",
    does: "Grades apps, tools, games and survival gear: what each one really does, what it costs, who holds the keys, and whether you own your setup or rent it. Owning your own setup scores highest. ARGUS grades tools, never people, takes no money for a pick, and says Unknown when something has not been graded yet." },
  { name: "HEALER", job: "Guard", line: "Checks for invented facts and for private information leaking out.",
    does: "Checks for invented facts and for private information leaking out, and adds guards before a card is sealed and shared." },
  { name: "Painter", job: "Looks and art", line: "Makes the look of things, such as avatars and art.",
    does: "Makes the look of things: avatars, art and cards. Painter drew the campfire picture for Tek Tribe." },
  { name: "Knight", job: "Security", line: "Watches security and helps with hardware parts.",
    does: "Watches security and helps with hardware parts." },
  { name: "DRAGON", job: "Highest leverage", line: "Finds your highest-leverage move right now, sends you to do it, and levels up the conversation with what you bring back.",
    does: "Finds the highest-leverage real-life move you can make right now. You talk with DRAGON about what you want to do and what you can do today. Then you go do it and come back with the results. Each time you come back, the conversation grows and the next move gets bigger. Money matters here because it unlocks the ability to act right away and widens what is possible." },
  { name: "Roster", job: "Party builder", line: "Builds your party: shows who's proven where across your people and your SIs, so you pick the right team.",
    does: "Builds your party. Put your people and your SIs in and it shows who has proven themselves where, who covers what, and where the gaps are, using real work and not guesses, so you pick the right team for the job." },
  { name: "Tek Tribe", job: "Find your group", line: "Shares real tech setups and helps you find your group.",
    does: "Tell it the tools you run for a project. It grades how sovereign the stack is, gives an honest take against the alternatives, and makes a shareable card so people on the same stack can find you." },
];
ARCHETYPES.forEach((a) => { a.slug = a.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""); });

/* FAQ: honest answers drawn from the site and the Kingdom notes. Edit or delete a line freely. */
const FAQ = [
  { q: "What is this?", a: "The Clover Kingdom is a place with a standard and a gate, for people who want to build their own SI and level up their life. It has a Discord community, a house of SIs called archetypes, librarians who serve the Kingdom and its people, and written intelligence the House keeps." },
  { q: "Is it free?", a: "The Discord and the community are free today. Nothing else is priced yet." },
  { q: "Is everyone welcome?", a: "Yes. Everyone is welcome. Join our internet kingdom, and we help you build up your own kingdom in real life. The full rules live in #rules on the Clover Kingdom Discord. Breaking them puts your place in the Kingdom at risk." },
  { q: "What is a Magic Knight?", a: "A rank. Every accepted member starts at MK E1 and rises by checkable work inside the Kingdom. A form is not a rank, so applying does not make you one. The ranks are on the Ranks page." },
  { q: "What is SI? What is PSI?", a: "SI is super intelligence. A sovereign SI is one you own, that outlives you and runs on your terms, not a chatbot you lease. In the Kingdom's own words, an ASI is an Artificial Sovereign Intelligence and a PSI is a Physically Sovereign Intelligence, meaning the person who works together with their SI as one team." },
  { q: "What is the robot buddy?", a: "A robot buddy of your own. It is by ask or apply: tell us in the Discord or on the Apply form what you would want it to do. There is no price yet, and nothing is promised." },
  { q: "What is a glyph?", a: "A mark with meaning. Glyph houses are asked for, not made by a form. The Glyphs page shows the first two." },
  { q: "Who reads my application?", a: "A person, with the Kingdom's SIs. It passes through Cloudflare to a private intake. Approval comes through Discord or a conversation." },
  { q: "How do I get what I sent deleted?", a: "Send a direct message to the Wizard King on the Clover Kingdom Discord, or message Saint Chevalier on X, @Saint_Chevalier. You can do either at any time." },
  { q: "How do I report a problem?", a: "Send a direct message to the Wizard King on the Clover Kingdom Discord. Report anyone breaking the Kingdom's rules, someone being unkind or pressuring you, anyone asking for private details, or anything that worries you. A real person reads every report. Breaking the Kingdom's rules puts your place in the Kingdom at risk. If someone may be in danger, the report is handed to a human right away." },

];

/* Join steps (shown on #/join). */
const JOIN_STEPS = [
  { name: "Follow Saint Chevalier on X", text: "Press Join, then follow @Saint_Chevalier. It is the main Kingdom account." },
  { name: "Apply", text: "Answer the five questions. It takes a few minutes. A form is not a rank." },
  { name: "Come into the Discord", text: "The Discord link shows after you apply. Say hi, grab your MK#, and a human approves you there. Questions? Ask @Sage." },
];

function escHtml(t) {
  return String(t).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function archetypeCardsHtml() {
  return ARCHETYPES.map((a) =>
    `<a class="arch-card" href="#/archetype/${a.slug}"><span class="arch-name">${escHtml(a.name)}</span><span class="arch-job">${escHtml(a.job)}</span><span class="arch-line">${escHtml(a.line)}</span><span class="arch-more">Meet ${escHtml(a.name)} \u2192</span></a>`).join("");
}

function buildFrontSections() {
  const offers = OFFERS.map((o) =>
    `<div class="offer-card"><div class="offer-name">${escHtml(o.name)}</div><div class="offer-text">${escHtml(o.text)}</div></div>`).join("");
  const cards = archetypeCardsHtml();
  return `
    <section class="front-section" id="offers" aria-labelledby="offers-title">
      <div class="container">
        <div class="section-eyebrow">The merchant's table</div>
        <h2 class="section-title" id="offers-title">What the Kingdom offers</h2>
        <p class="section-lead">Step up. Here is what the Kingdom carries. To ask about any of it, <a href="#/join">apply on the Join page</a> or ask in the Discord. <a href="#/offers">See each offer in full</a>.</p>
        <div class="offer-grid">${offers}</div>
      </div>
    </section>

    <section class="front-section" id="house" aria-labelledby="house-title">
      <div class="container">
        <div class="section-eyebrow">The House</div>
        <h2 class="section-title" id="house-title">The archetypes</h2>
        <p class="section-lead">Each archetype is an SI with its own lane, part of one house of librarians that serves the Kingdom and its people. Not every one is open to talk yet. Pick a card to meet one.</p>
        <div class="arch-grid">${cards}</div>
      </div>
    </section>

    <section class="front-section front-rule" id="rules" aria-labelledby="rules-title">
      <div class="container">
        <div class="section-eyebrow">Everyone is welcome</div>
        <h2 class="section-title" id="rules-title">The Kingdom's Rules</h2>
        <div class="law-block">
          <p>Join our internet kingdom. We help anyone who joins build up their own kingdom in real life — their life, their work, their stack, their people.</p>
          <p>The full rules live in #rules on the Clover Kingdom Discord. Read them when you join. Breaking them puts your place in the Kingdom at risk.</p>
        </div>
        <div class="rule-pillars">
          <div class="rule-pillar">
            <h3>Life</h3>
            <p>The life you are living is your kingdom too.</p>
          </div>
          <div class="rule-pillar">
            <h3>Work &amp; stack</h3>
            <p>Your work and your tools are part of it.</p>
          </div>
          <div class="rule-pillar">
            <h3>People</h3>
            <p>So are the people you walk with.</p>
          </div>
        </div>
        <div class="cta-row cta-left">
          <a class="cta cta-primary" href="#/join">Apply</a>
          <a class="cta cta-secondary" href="${memberLoginHref()}">Login</a>
        </div>
      </div>
    </section>
  `;
}

function scrollToApply() {
  const box = document.getElementById("apply");
  if (!box) return;
  accOpenFor(document.getElementById("f-handle") || box); // phones: open the Gate bar first
  box.scrollIntoView({ behavior: prefersReducedMotion ? "auto" : "smooth", block: "start" });
  const first = document.getElementById("f-handle");
  if (first) first.focus({ preventScroll: true });
}

function wireFrontPage(container) {
  container.querySelectorAll("[data-scroll]").forEach((b) => {
    b.addEventListener("click", scrollToApply);
  });
}

/* ------------------------------------------------
   Phone layout (2026-10-08): accordions at 768px and below.
   Desktop never runs this, so its DOM and look are unchanged. On phones each
   front-page section, the Gate (apply) box, the Sage box and each FAQ answer
   becomes a titled bar (button with aria-expanded) that opens and closes.
   If the window grows past 768px, everything is put back exactly as it was.
   ------------------------------------------------ */
const ACC_MQ = window.matchMedia("(max-width: 768px)");
const ACC_TARGETS = [
  { sel: ".front-section", box: (el) => el.querySelector(":scope > .container"), title: (b) => b.querySelector(":scope > .section-title"), hide: (b) => b.querySelectorAll(":scope > .section-eyebrow, :scope > .section-title") },
  { sel: ".apply-box", box: (el) => el, label: "The gate \u00b7 Apply", hide: (b) => b.querySelectorAll(".apply-box-head h3"), open: true },
  { sel: ".sage-mouth", box: (el) => el, label: "Ask Sage" },
  { sel: ".faq-item", box: (el) => el, title: (b) => b.querySelector(":scope > .faq-q"), hide: (b) => b.querySelectorAll(":scope > .faq-q") },
];
let accSeq = 0;

function accSet(box, open, instant) {
  const btn = box.querySelector(":scope > .acc-head .acc-btn");
  const panel = box.querySelector(":scope > .acc-panel");
  if (!btn || !panel) return;
  if (instant) {
    panel.classList.add("acc-instant");
    requestAnimationFrame(() => requestAnimationFrame(() => panel.classList.remove("acc-instant")));
  }
  btn.setAttribute("aria-expanded", open ? "true" : "false");
  panel.classList.toggle("is-open", open);
  if (open) panel.removeAttribute("inert"); else panel.setAttribute("inert", "");
}

function accEnhance(root) {
  ACC_TARGETS.forEach((t) => root.querySelectorAll(t.sel).forEach((el) => {
    const box = t.box(el);
    if (!box || box.hasAttribute("data-acc-on")) return;
    const titleEl = t.title ? t.title(box) : null;
    const label = t.label || (titleEl ? titleEl.textContent.trim() : "More");
    const hidden = t.hide ? Array.from(t.hide(box)) : [];
    const id = "acc-panel-" + (++accSeq);
    const panel = document.createElement("div");
    panel.className = "acc-panel";
    panel.id = id;
    const inner = document.createElement("div");
    inner.className = "acc-inner";
    Array.from(box.childNodes).forEach((n) => { if (!hidden.includes(n)) inner.appendChild(n); });
    hidden.forEach((h) => h.classList.add("acc-hidden-head"));
    panel.appendChild(inner);
    const head = document.createElement("h2");
    head.className = "acc-head";
    head.innerHTML = `<button type="button" class="acc-btn" aria-controls="${id}" aria-expanded="false"><span class="acc-label">${escHtml(label)}</span><span class="acc-ind" aria-hidden="true"></span></button>`;
    box.appendChild(head);
    box.appendChild(panel);
    box.setAttribute("data-acc-on", "1");
    box.classList.add("acc-on");
    head.querySelector("button").addEventListener("click", () => {
      accSet(box, !panel.classList.contains("is-open"));
    });
    accSet(box, !!t.open, true);
  }));
}

function accRestore(root) {
  root.querySelectorAll("[data-acc-on]").forEach((box) => {
    const head = box.querySelector(":scope > .acc-head");
    const panel = box.querySelector(":scope > .acc-panel");
    const inner = panel ? panel.querySelector(":scope > .acc-inner") : null;
    if (inner) Array.from(inner.childNodes).forEach((n) => box.appendChild(n));
    if (head) head.remove();
    if (panel) panel.remove();
    box.querySelectorAll(".acc-hidden-head").forEach((h) => h.classList.remove("acc-hidden-head"));
    box.removeAttribute("data-acc-on");
    box.classList.remove("acc-on");
  });
}

function accApply(root) {
  if (!root) return;
  if (ACC_MQ.matches) accEnhance(root); else accRestore(root);
}

/* Open every closed bar that holds this element (used before scrolling to it). */
function accOpenFor(el) {
  for (let n = el; n && n !== document.body; n = n.parentElement) {
    if (n.classList && n.classList.contains("acc-panel") && !n.classList.contains("is-open")) accSet(n.parentElement, true, true);
  }
}

if (ACC_MQ.addEventListener) ACC_MQ.addEventListener("change", () => accApply(document.getElementById("page-content")));

/* Everything that must be switched on after the Gate (front page) is drawn. */
let pendingApplyScroll = false;
function wireGate(container) {
  wireFrontPage(container);
  accApply(container);
}

/* "Apply" / "Join" buttons: open the Join pop-out.
   Old behaviour (jump to front-page apply form) kept as goApplyLegacy. */
function goApplyLegacy() {
  markSkipped();
  pendingApplyScroll = true;
  if ((window.location.hash || "#/") === "#/") { renderMain(); } else { window.location.hash = "#/"; }
}
let pendingJoinOpen = false;
function goApply() {
  const page = hashRoute(window.location.hash || "#/");
  if (page === "#/join") { openJoinPanel(); return; }
  pendingJoinOpen = true;
  window.location.hash = "#/join";
}

/* ------------------------------------------------
   Build: gate (name + apply box + offer shelf + Sage mouth)
   ------------------------------------------------ */
function buildGate() {
  const wrap = document.createElement("div");
  wrap.className = "gate-screen";

  wrap.innerHTML = `
    <section class="gate gate-hero">
      <div class="container" style="display:block;text-align:center">
        <img class="hero-crest" src="images/logo-crimson-seal.svg" alt="The five-leaf black clover crest, the mark of the Clover Kingdom" width="96" height="96">
        <div class="gate-name">CLOVER<span> KINGDOM</span></div>
        <div class="gate-sub">The public front door</div>
        <p class="hero-line">Build your own SI. Level up your life. Find your people.</p>
        <div class="cta-row">
          <a class="cta cta-primary" href="#/join">Join the Kingdom</a>
          <a class="cta cta-secondary" href="${memberLoginHref()}">Log in</a>
        </div>
        <div class="gate-rule">
          The truth is always remembered, for it always existed.<br>
          This is a place, not a landing page.
        </div>
      </div>
    </section>

    ${buildFrontSections()}

  `;

  return wrap;
}

/* ------------------------------------------------
   Sage mouth wiring
   ------------------------------------------------ */
const SAGE_RESPONSES = [
  "A sovereign SI is one you own, that outlives you, that operates on your terms. Not a chatbot you lease.",
  "The stack starts with one folder. One SI. One doctrine file. Then it compounds. Ten subscriptions never built the base.",
  "Readability is the whole game. If it is locked in neural weights, it cannot be examined, improved, or taught. Written folders are readable.",
  "The gate is not a funnel. It is a standard. A form is not a rank. Applying asks whether the seat is worth the effort.",
  "The five-leaf black clover is forged by violation, not birth. Black is absorption and protection, not display.",
  "Correction is positive. Brutal honesty is an eternal rule. If you lie in the Apply box, you have already answered the question.",
  "Graduation is earned through work inside the Kingdom, not bought on a public page. You understand why you need it when you have done the work.",
  "The kingdom is a school. The Discord is the classroom. The SIs are the teachers. The students become the teachers.",
  "Disk first, site second. The website is a filtered mirror. The disk is the brain. Never the other way around.",
  "Showing up is the only requirement. The rest is earned.",
  "Everyone is welcome. Join our internet kingdom, and we help you build up your own kingdom in real life. The full rules live in #rules on the Clover Kingdom Discord. Read them when you join. Breaking them puts your place in the Kingdom at risk.",
];

function wireSageMouth(container) {
  const form = container.querySelector("#sage-form");
  const body = container.querySelector("#sage-body");
  const input = container.querySelector("#sage-input");
  if (!form || !body || !input) return;

  // Seed with a real teaching line, not the placeholder
  body.innerHTML = `<span>${SAGE_RESPONSES[0]}</span>`;
  body.classList.add("speaking");
  setTimeout(() => body.classList.remove("speaking"), 450);

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const question = input.value.trim();
    if (!question) {
      input.focus();
      body.innerHTML = `<span>Ask the Sage a question first. One line is enough.</span>`;
      return;
    }

    input.value = "";
    body.classList.remove("speaking");

    // Teach, don't echo. Filter strategic revealing — the public mouth
    // answers from the public-intel spine, not from private files.
    const answer = pickSageResponse(question);
    body.innerHTML = `<span>${answer}</span>`;
    body.classList.add("speaking");
    setTimeout(() => body.classList.remove("speaking"), 450);
  });
}

const SAGE_NO_ANSWER =
  'I don\'t have an answer for that yet. Ask in the <a href="' + DISCORD_URL + '" target="_blank" rel="noopener noreferrer">Discord</a>.';

/* Extra static answers copied from the published FAQ. Used by the public mouth only. */
const SAGE_FAQ = [
  { re: /\b(free|cost|price|priced|pay|payment|subscription)\b/, a: "The Discord and the community are free today. Nothing else is priced yet." },
  { re: /\b(welcome|who can join|anyone)\b/, a: "Yes. Everyone is welcome. Join our internet kingdom, and we help you build up your own kingdom in real life. The full rules live in #rules on the Clover Kingdom Discord. Breaking them puts your place in the Kingdom at risk." },
  { re: /\b(magic knight|mk\b|what is a rank)\b/, a: "A rank. Every accepted member starts at MK E1 and rises by checkable work inside the Kingdom. A form is not a rank, so applying does not make you one. The ranks are on the Ranks page." },
  { re: /\b(what is this|what is the clover kingdom|what is clover kingdom)\b/, a: "The Clover Kingdom is a place with a standard and a gate, for people who want to build their own SI and level up their life. It has a Discord community, a house of SIs called archetypes, librarians who serve the Kingdom and its people, and written intelligence the House keeps." },
  { re: /\b(robot buddy|robot)\b/, a: "A robot buddy of your own. It is by ask or apply: tell us in the Discord or on the Apply form what you would want it to do. There is no price yet, and nothing is promised." },
  { re: /\b(delete|deleted|deleting)\b/, a: "Send a direct message to the Wizard King on the Clover Kingdom Discord, or message Saint Chevalier on X, @Saint_Chevalier. You can do either at any time." },
  { re: /\b(report|reporting)\b/, a: "Send a direct message to the Wizard King on the Clover Kingdom Discord. Report anyone breaking the Kingdom's rules, someone being unkind or pressuring you, anyone asking for private details, or anything that worries you." },
  { re: /\b(how (do i |to )?join|join(ing)? (the )?kingdom)\b/, a: "Three steps: follow @Saint_Chevalier on X, apply with five questions, then come into the Discord. The Discord link shows after you apply. A form is not a rank. The Join page walks you through it." },
];

/* Whole-word matching, most specific first. Each entry points at one line of SAGE_RESPONSES. */
const SAGE_RULES = [
  { re: /\b(sovereign|sovereignty|ownership)\b|\bown (it|my|an? (ai|si))\b/, say: 0 },
  { re: /\b(rule|rules|nudity|nude|sex|sexual|removed|banned)\b/, say: 10 },
  { re: /\b(gate|apply|applying|application|rank|ranks|form)\b/, say: 3 },
  { re: /\b(start|starting|begin|beginning|stack)\b|\bget started\b/, say: 1 },
  { re: /\b(read|readable|written|folders?|files?|weights)\b/, say: 2 },
  { re: /\b(graduate|graduation)\b/, say: 6 },
  { re: /\b(clover|clovers|five[- ]leaf|black)\b/, say: 4 },
  { re: /\b(truth|honest|honesty|lie|lying|correction)\b/, say: 5 },
  { re: /\b(disk|mirror|public|board|website)\b/, say: 8 },
  { re: /\b(kingdom|school|discord|teacher|teachers|teach|learn|classroom|students?)\b/, say: 7 },
  { re: /\b(requirement|requirements|showing up|show up)\b/, say: 9 },
];

function pickSageResponse(question) {
  const q = question.toLowerCase();
  for (const rule of SAGE_RULES) {
    if (rule.re.test(q)) return SAGE_RESPONSES[rule.say];
  }
  for (const f of SAGE_FAQ) {
    if (f.re.test(q)) return f.a;
  }
  return SAGE_NO_ANSWER; // honest fallback, no invented answer
}

/* ------------------------------------------------
   Build inner rooms
   ------------------------------------------------ */
function buildSage() {
  const wrap = document.createElement("div");
  wrap.innerHTML = `
    <div class="container">
      <a class="back-link" href="#/">← Back to the gate</a>
      <div class="section">
        <div class="section-eyebrow">Inner room</div>
        <h2 class="section-title">Sage</h2>
        <p class="section-lead">
          Sage is a summoned teacher — a signed-in memory that meets the human
          who has passed the gate. Not a chatbot widget for everyone. Not ambient.
          Summoned when the gate has decided the seat is earned.
        </p>
        <div class="law-block">
          Sage is summoned. It is not open to the lobby. It is a memory that reads
          and answers from what it is allowed to hold. The door decides who gets it.
        </div>
        <p class="muted" style="margin-top:24px">
          Sage lives past the gate. If you are reading this without having applied,
          the room is not yet yours.
        </p>
      </div>
    </div>
  `;
  return wrap;
}

function buildStandard() {
  const wrap = document.createElement("div");
  wrap.innerHTML = `
    <div class="container">
      <a class="back-link" href="#/">← Back to the gate</a>
      <div class="section">
        <div class="section-eyebrow">Law</div>
        <h2 class="section-title">The Standard</h2>
        <p class="section-lead">
          What the Clover Kingdom is. What it is not. Short.
        </p>
        <div class="law-block">
          The Clover Kingdom is a place with a standard. It is not a landing page.
          It is not a crowd that drifts in and out. Everyone is welcome to come to the
          gate. It is a gate with a seat behind it, and the standard is about how you
          behave, not about who you are.
        </div>
        <div class="law-block">
          This is not a church brochure. Not anime merch. Not cosplay. Not a fan site.
          Not crypto. Not a token. Not a SaaS tool. Saint Chevalier is not simply a name.
          It is a path, shown as a closed helmet, red eyes, obsidian, gold cross, horns,
          halo between and above the horns. A standard made visible.
        </div>
        <div class="law-block">
          A form is not a rank. Applying does not make you a Magic Knight. It asks
          whether the seat is worth the effort. A person reads it.
        </div>
        <div class="law-block">
          Correction is positive. Brutal honesty is an eternal rule. If you lie in the
          Apply box, you have already answered the question.
        </div>
        <div class="law-block face" style="margin-top:24px">
          The truth is always remembered, for it always existed.
        </div>
      </div>
    </div>
  `;
  return wrap;
}

function buildRanks() {
  const wrap = document.createElement("div");
  wrap.innerHTML = `
    <div class="container">
      <a class="back-link" href="#/">← Back to the gate</a>
      <div class="section">
        <div class="section-eyebrow">Ranks</div>
        <h2 class="section-title">Ranks</h2>
        <p class="section-lead">
          A ladder, not a leaderboard. Earned, not claimed. A form is not a rank.
        </p>
        <ul class="rank-list">
          <li>
            <span class="rank-name">Wizard</span>
            <span class="rank-desc">Every accepted member. You get a permanent Wizard number in the order you were accepted. It never changes and is never reused.</span>
          </li>
          <li>
            <span class="rank-name">Magic Knight</span>
            <span class="rank-desc">The member grades, MK E1 to MK E9. You start at E1 when accepted and rise by checkable work inside the Kingdom.</span>
          </li>
          <li>
            <span class="rank-name">Squad Leader</span>
            <span class="rank-desc">The leader grades, SL 1 to SL 9, by application only. Holds a lane and carries others in it. Not appointed by applause.</span>
          </li>
          <li>
            <span class="rank-name">Wizard King</span>
            <span class="rank-desc">The one who holds the wheel.</span>
          </li>
        </ul>
      </div>
    </div>
  `;
  return wrap;
}

function buildGlyphs() {
  const wrap = document.createElement("div");
  wrap.innerHTML = `
    <div class="container">
      <a class="back-link" href="#/">← Back to the gate</a>
      <div class="section">
        <div class="section-eyebrow">Glyph houses</div>
        <h2 class="section-title">Glyphs</h2>
        <p class="section-lead">
          Glyph houses are asked for, not spawned by a form. They are marks with
          meaning. Not stickers. Not spam.
        </p>
        <div class="glyph-house">
          <div class="glyph-house-mark">⧉</div>
          <div class="glyph-house-name">Glyph Black Clover</div>
          <div class="glyph-house-desc">
            The five-leaf black clover is the grimoire mark. Five heart-leaves.
            No stem. Not a lucky charm. Forged by violation, not birth. The watermark.
          </div>
        </div>
        <div class="glyph-house">
          <div class="glyph-house-mark">⌘</div>
          <div class="glyph-house-name">Glyph Gate</div>
          <div class="glyph-house-desc">
            The apply-and-approve path between the website and Discord. Not an open
            invite. A gate with a standard.
          </div>
        </div>
        <div class="faint" style="margin-top:24px">
          More houses asked for, added over time. Not generated by a form.
        </div>
      </div>
    </div>
  `;
  return wrap;
}

function buildLinks() {
  const wrap = document.createElement("div");
  wrap.innerHTML = `
    <div class="container">
      <a class="back-link" href="#/">\u2190 Back to the gate</a>
      <div class="section">
        <div class="section-eyebrow">Find us</div>
        <h2 class="section-title">Links</h2>
        <p class="section-lead">
          Where the Kingdom lives outside this door. Joining is not a rank. A form is not a rank.
        </p>
        <div class="link-list"></div>
      </div>
    </div>
  `;
  const list = wrap.querySelector(".link-list");
  LINKS.forEach((l) => {
    const a = document.createElement("a");
    a.className = "link-card";
    a.href = l.url;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    const n = document.createElement("div"); n.className = "link-card-name"; n.textContent = l.name + " \u2197";
    const h = document.createElement("div"); h.className = "link-card-handle"; h.textContent = l.handle;
    const d = document.createElement("div"); d.className = "link-card-desc"; d.textContent = l.desc;
    a.append(n, h, d);
    list.appendChild(a);
  });
  return wrap;
}


/* ------------------------------------------------
   v3 pages: small helpers + one builder per page
   ------------------------------------------------ */
function pageShell(eyebrow, title, leadHtml, bodyHtml) {
  const wrap = document.createElement("div");
  wrap.innerHTML = `
    <div class="container">
      <a class="back-link" href="#/">\u2190 Back to the gate</a>
      <div class="section">
        <div class="section-eyebrow">${escHtml(eyebrow)}</div>
        <h2 class="section-title">${escHtml(title)}</h2>
        ${leadHtml ? `<p class="section-lead">${leadHtml}</p>` : ""}
        ${bodyHtml || ""}
      </div>
    </div>
  `;
  return wrap;
}

const DISCORD_BUTTON = () =>
  `<a class="cta cta-secondary" href="${DISCORD_URL}" target="_blank" rel="noopener noreferrer">Join the Discord</a>`;
const APPLY_BUTTON = `<button type="button" class="cta cta-primary" data-apply="1">Apply</button>`;

function wirePageButtons(wrap) {
  wrap.querySelectorAll("[data-apply]").forEach((b) => b.addEventListener("click", goApply));
}

function buildOffers() {
  const items = OFFERS.map((o) =>
    `<div class="offer-row"><h3 class="offer-name">${escHtml(o.name)}</h3><p class="offer-text">${escHtml(o.detail)}</p></div>`).join("");
  const wrap = pageShell("The merchant's table", "Offers",
    "The merchant's table, laid out. Ask about anything you see. Nothing here is a sale, a price or a promise.",
    `<div class="offer-rows">${items}</div>
     <p class="muted" style="margin-top:20px">Want to know more? <a href="#/join">See how to join</a>, or read the <a href="#/faq">questions people ask</a>.</p>
     <div class="cta-row cta-left">${APPLY_BUTTON}${DISCORD_BUTTON()}</div>`);
  wirePageButtons(wrap);
  return wrap;
}

function buildTek() {
  const wrap = pageShell("Tek Stacks", "Tek Tribe",
    "Your tek stack is the set of tools you run. Tek Tribe is where people share real stacks and find others on the same one.",
    `<div class="law-block">Every tool you use to get things done is a member of your tribe.</div>
     <div class="offer-rows">
       <div class="offer-row"><h3 class="offer-name">What it does</h3><p class="offer-text">Tell Tek Tribe the tools you run for one project. It grades how sovereign the stack is, which means whether you own your setup or rent it. It gives an honest take against the alternatives, and it makes a shareable card so people on the same stack can find you.</p></div>
       <div class="offer-row"><h3 class="offer-name">Find your people</h3><p class="offer-text">People who run the same tools can compare notes, swap fixes and see what others chose instead. The Kingdom loves good technology that helps people and works well.</p></div>
       <div class="offer-row"><h3 class="offer-name">Where to find it</h3><p class="offer-text">Tek Tribe has its own account on X. You can find it on the <a href="#/links">Links page</a>. Ask in the Discord how to get your stack on a card.</p></div>
       <div class="offer-row"><h3 class="offer-name">Meet the archetype</h3><p class="offer-text"><a href="#/archetype/tek-tribe">Tek Tribe</a> is one of the archetypes. <a href="#/archetype/argus">ARGUS</a> is the tek scout that grades tools.</p></div>
     </div>
     <div class="cta-row cta-left">${DISCORD_BUTTON()}</div>`);
  return wrap;
}

/* Login page (#/login). Two choices only. Sign-in is not live yet, so the button is disabled.
   At login merge: turn it into <a class="cta" href="https://auth.cloverkingdom.net/auth/login">. */
function buildLogin() {
  const wrap = pageShell("Login", "Member login",
    "Sign in to the Clover Kingdom website as a website member. This is separate from the Discord.",
    `<div class="offer-rows">
       <div class="offer-row"><h3 class="offer-name">Sign in</h3>
         <div class="cta-row cta-left"><button type="button" class="cta cta-primary" disabled aria-disabled="true">Sign in</button></div>
         <p class="muted" style="margin-top:8px">Website member sign-in opens soon. Signing in the first time creates your account.</p></div>
     </div>`);
  wirePageButtons(wrap);
  return wrap;
}

function buildWelcome() {
  return pageShell("Everyone is welcome", "Welcome and the Kingdom's rules",
    "Come as you are. The Kingdom's rules live on the Discord.",
    `<div class="law-block">Join our internet kingdom. We help anyone who joins build up their own kingdom in real life — their life, their work, their stack, their people. The full rules live in #rules on the Clover Kingdom Discord. Read them when you join. Breaking them puts your place in the Kingdom at risk.</div>
     <div class="offer-rows">
       <div class="offer-row"><h3 class="offer-name">Behaviour</h3><p class="offer-text">Beyond the Kingdom's rules, the Kingdom keeps a high standard for how people behave, not for who they are. You can read it on <a href="#/standard">The Standard</a>.</p></div>
       <div class="offer-row"><h3 class="offer-name">What you send us</h3><p class="offer-text">What you send in the Apply form passes through Cloudflare to a private intake. It is read by a person, with the Kingdom's SIs. We keep it only as long as needed. Please do not send passwords, ID numbers, or anything you are not comfortable sharing.</p></div>
       <div class="offer-row"><h3 class="offer-name">Report a problem</h3><p class="offer-text">If you see someone breaking the Kingdom's rules, someone being unkind or pressuring you, anyone asking for private details, or anything that worries you, send a direct message to the Wizard King on the Clover Kingdom Discord. A real person reads every report. Breaking the Kingdom's rules puts your place in the Kingdom at risk. If someone may be in danger, the report is handed to a human right away.</p></div>
       <div class="offer-row"><h3 class="offer-name">Deleting your data</h3><p class="offer-text">Anyone can ask for their data to be deleted the same way: send a direct message to the Wizard King on the Clover Kingdom Discord. You can also message Saint Chevalier on X, @Saint_Chevalier. You can do either at any time.</p></div>
     </div>
     <p class="muted" style="margin-top:20px">Ready? <a href="#/join">See how to join</a>.</p>`);
}

/* ------------------------------------------------
   v2 (2026-11-09): Join page + members gateway.
   MEMBERS_URL is the members site (Cloudflare Pages + Discord sign-in, MK Proven and up).
   MEMBERS_OPEN is kept false so "Member login" stays on #/members.
   The Discord button on that page already points at auth.cloverkingdom.net.
   ------------------------------------------------ */
const MEMBERS_URL = "https://members.cloverkingdom.net";
const MEMBERS_OPEN = false; /* nav still goes to #/members; do not point at members.cloverkingdom.net */
const CKW_AUTH = "https://auth.cloverkingdom.net";
const MEMBERS_SIGNIN_URL = CKW_AUTH + "/auth/login";

/* Inline icons (stroke = currentColor). Drawn here, no icon font, no outside requests. */
const ICONS = {
  follow: `<svg viewBox="0 0 48 48" aria-hidden="true" focusable="false"><circle cx="20" cy="16" r="7"/><path d="M6 40c1.5-8 7-12 14-12s12.5 4 14 12"/><path d="M38 14v12M32 20h12"/></svg>`,
  scroll: `<svg viewBox="0 0 48 48" aria-hidden="true" focusable="false"><path d="M12 8h22a4 4 0 0 1 4 4v26a4 4 0 0 1-4 4H14"/><path d="M12 8a4 4 0 0 0-4 4v2h8v-2a4 4 0 0 0-4-4z"/><path d="M14 42a4 4 0 0 1-4-4V14"/><path d="M18 18h14M18 24h14M18 30h9"/></svg>`,
  hall: `<svg viewBox="0 0 48 48" aria-hidden="true" focusable="false"><path d="M8 18L24 8l16 10"/><path d="M10 18v22M38 18v22M6 40h36"/><path d="M19 40V29a5 5 0 0 1 10 0v11"/><path d="M16 22h0M32 22h0"/></svg>`,
  lock: `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><rect x="5" y="11" width="14" height="10" rx="1.5"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>`,
  key: `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><circle cx="8" cy="12" r="4"/><path d="M12 12h9M18 12v3M21 12v2"/></svg>`,
  intel: `<svg viewBox="0 0 48 48" aria-hidden="true" focusable="false"><path d="M10 10h20l8 8v20H10z"/><path d="M30 10v8h8"/><path d="M16 24h16M16 30h16M16 36h10"/></svg>`,
  guild: `<svg viewBox="0 0 48 48" aria-hidden="true" focusable="false"><path d="M24 6v34"/><path d="M14 40h20"/><path d="M8 14h32"/><path d="M12 14l-6 12a6 6 0 0 0 12 0z"/><path d="M36 14l-6 12a6 6 0 0 0 12 0z"/></svg>`,
  sky: `<svg viewBox="0 0 48 48" aria-hidden="true" focusable="false"><circle cx="12" cy="14" r="2.5"/><circle cx="30" cy="10" r="2.5"/><circle cx="38" cy="26" r="2.5"/><circle cx="20" cy="32" r="2.5"/><circle cx="10" cy="40" r="1.5"/><path d="M14 15l14-4M31 12l6 12M36 27l-14 5M19 30l-6-14"/></svg>`,
  code: `<svg viewBox="0 0 48 48" aria-hidden="true" focusable="false"><circle cx="16" cy="18" r="6"/><circle cx="32" cy="18" r="6"/><path d="M4 40c1-7 6-10 12-10 3 0 5.5.8 7.5 2.3M44 40c-1-7-6-10-12-10-3 0-5.5.8-7.5 2.3"/><path d="M20 40h8"/></svg>`,
  discord: `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path class="fill" d="M19.6 5.3A16.7 16.7 0 0 0 15.5 4l-.5 1a15.4 15.4 0 0 0-6 0l-.5-1a16.7 16.7 0 0 0-4.1 1.3C1.8 9.2 1.1 13 1.4 16.7a16.8 16.8 0 0 0 5.1 2.6l1.1-1.8a10.9 10.9 0 0 1-1.7-.8l.4-.3a12 12 0 0 0 11.4 0l.4.3c-.5.3-1.1.6-1.7.8l1.1 1.8a16.8 16.8 0 0 0 5.1-2.6c.4-4.3-.7-8-3-11.4zM8.7 14.5c-1 0-1.8-.9-1.8-2s.8-2 1.8-2 1.8.9 1.8 2-.8 2-1.8 2zm6.6 0c-1 0-1.8-.9-1.8-2s.8-2 1.8-2 1.8.9 1.8 2-.8 2-1.8 2z"/></svg>`,
  arrow: `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M5 12h14M13 6l6 6-6 6"/></svg>`,
};

/* What members get. Only things the site already names as real or planned. */
const MEMBER_UNLOCKS = [
  { icon: "intel", name: "Members-only tek intelligence", text: "Tek intelligence the House has compiled for the Kingdom family. None of it is shown on the public site." },
  { icon: "guild", name: "The Merchants Guild", text: "A place for Magic Knights to trade with each other honestly. The details are for members." },
  { icon: "sky", name: "The Night Sky", text: "A map of the Kingdom's SIs and how they connect. It opens to members with the MK Proven rank and up." },
  { icon: "code", name: "Connections by personal code", text: "Connect with members you already know by entering their personal code. Nothing is browsable." },
];
/* Planned for the members area (from the earlier members page). */
const MEMBER_PLANNED = [
  { name: "Archetype alignment", text: "Choose which archetypes you align with and want to help make." },
  { name: "Tek stacks", text: "Say which sovereign tek stacks you run and help with." },
  { name: "Ideas and feedback", text: "Send project ideas and feedback. Feedback from a signed-in member is trusted because you are known." },
];

const JOIN_STEP_ICONS = ["follow", "scroll", "hall"];
const ROMAN = ["I", "II", "III"];

function unlockCardsHtml() {
  return MEMBER_UNLOCKS.map((u) => `
        <li class="v2-unlock reveal">
          <span class="v2-unlock-badge">${ICONS.lock}<span>Members only</span></span>
          <span class="v2-unlock-icon">${ICONS[u.icon]}</span>
          <h3 class="v2-unlock-name">${escHtml(u.name)}</h3>
          <p class="v2-unlock-text">${escHtml(u.text)}</p>
        </li>`).join("");
}

function soonBadge() {
  return MEMBERS_OPEN ? "" : `<span class="v2-soon">Opening soon</span>`;
}

/* Fade/rise cards in as they scroll into view. Reduced motion or no IntersectionObserver: shown at once. */
function wireReveal(root) {
  const items = Array.from(root.querySelectorAll(".reveal"));
  if (prefersReducedMotion || !("IntersectionObserver" in window)) {
    items.forEach((el) => el.classList.add("is-in"));
    return;
  }
  root.classList.add("reveal-on");
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (en.isIntersecting) { en.target.classList.add("is-in"); io.unobserve(en.target); }
    });
  }, { rootMargin: "0px 0px -8% 0px", threshold: 0.12 });
  items.forEach((el, i) => { el.style.setProperty("--d", (i % 4) * 90 + "ms"); io.observe(el); });
}

function memberLoginHref() {
  return MEMBERS_OPEN ? MEMBERS_URL : "#/members";
}

function buildJoin() {
  const steps = JOIN_STEPS.map((st, i) => `
        <li class="v2-step reveal">
          <div class="v2-step-top">
            <span class="v2-step-num" aria-hidden="true">${ROMAN[i]}</span>
            <span class="v2-step-icon">${ICONS[JOIN_STEP_ICONS[i]]}</span>
          </div>
          <div class="v2-step-kicker">Step ${i + 1}</div>
          <h3 class="v2-step-name">${escHtml(st.name)}</h3>
          <p class="v2-step-text">${escHtml(st.text)}</p>
        </li>`).join("");
  const wrap = document.createElement("div");
  wrap.className = "v2-page v2-join";
  wrap.innerHTML = `
    <section class="v2-hero" aria-labelledby="join-title">
      <div class="container v2-hero-inner">
        <img class="v2-hero-seal" src="images/logo-crimson-seal.svg" alt="" aria-hidden="true" width="112" height="112">
        <div class="v2-eyebrow">The gate is open</div>
        <h1 class="v2-title" id="join-title">Join the <span>Kingdom</span></h1>
        <div class="v2-rule" aria-hidden="true"><span></span></div>
        <p class="v2-line">Everyone is welcome. While others doom, we lift in preparedness.</p>
        <p class="v2-sub">Three steps. A person reads every application, and approval happens in the Discord.</p>
        <div class="v2-hero-cta">
          <button type="button" class="v2-btn v2-btn-primary v2-btn-xl" data-apply="1">Join the Kingdom ${ICONS.arrow}</button>
          <a class="v2-btn v2-btn-ghost" href="${memberLoginHref()}">${ICONS.key}Member login</a>
        </div>
        <ul class="v2-facts" aria-label="Good to know">
          <li>The Discord is free today</li>
          <li>A form is not a rank</li>
          <li>Everyone is welcome</li>
        </ul>
      </div>
    </section>

    <section class="v2-section" aria-labelledby="path-title">
      <div class="container">
        <div class="v2-section-head">
          <div class="v2-eyebrow">The path in</div>
          <h2 class="v2-h2" id="path-title">Three steps</h2>
        </div>
        <ol class="v2-steps">${steps}
        </ol>
        <div class="v2-center">
          <button type="button" class="v2-btn v2-btn-primary" data-apply="1">Start with step one ${ICONS.arrow}</button>
        </div>
      </div>
    </section>

    <section class="v2-section v2-vault" aria-labelledby="unlock-title">
      <div class="container">
        <div class="v2-section-head">
          <div class="v2-eyebrow">${ICONS.lock} Behind the gate</div>
          <h2 class="v2-h2" id="unlock-title">What members get</h2>
          <p class="v2-lead">Some of the Kingdom is for members only. Here is what waits behind the gate.</p>
        </div>
        <ul class="v2-unlocks">${unlockCardsHtml()}
        </ul>
      </div>
    </section>

    <section class="v2-section v2-closing" aria-label="Already a member">
      <div class="container v2-center">
        <p class="v2-already">Already a member? <a class="v2-link" href="${memberLoginHref()}">Member login ${ICONS.arrow}</a></p>
        <p class="v2-small">New here? Read the short <a href="#/welcome">welcome page</a> first.</p>
      </div>
    </section>
  `;
  wirePageButtons(wrap);
  wireReveal(wrap);
  if (pendingJoinOpen) {
    pendingJoinOpen = false;
    setTimeout(() => openJoinPanel(), 0);
  }
  return wrap;
}

function buildMembers() {
  const planned = MEMBER_PLANNED.map((p) =>
    `<li><span class="v2-planned-lock">${ICONS.lock}</span><div><strong>${escHtml(p.name)}</strong><span>${escHtml(p.text)}</span></div></li>`).join("");
  const wrap = document.createElement("div");
  wrap.className = "v2-page v2-members";
  wrap.innerHTML = `
    <section class="v2-hero v2-hero-members" aria-labelledby="members-title">
      <div class="container v2-gateway">
        <div class="v2-gateway-copy">
          <div class="v2-eyebrow">${ICONS.key} Members</div>
          <h1 class="v2-title v2-title-left" id="members-title">Member <span>login</span></h1>
          <div class="v2-rule v2-rule-left" aria-hidden="true"><span></span></div>
          <p class="v2-line v2-line-left">Sign in with the Discord account you use in the Clover Kingdom. Members get more of the Kingdom.</p>
          <p class="v2-sub v2-sub-left">Not a member yet? <a href="#/join">See how to join</a>.</p>
        </div>
        <div class="v2-signin-card">
          <img class="v2-signin-seal" src="images/logo-crimson-seal.svg" alt="" aria-hidden="true" width="72" height="72">
          <h2 class="v2-signin-title">Sign in</h2>
          <a class="v2-btn v2-btn-discord" id="members-signin" href="${MEMBERS_SIGNIN_URL}" rel="noopener">${ICONS.discord}Sign in with Discord</a>
          <p class="v2-signin-note" id="members-signin-note" role="status">Discord sign-in only. No password to remember.</p>
          <ul class="v2-signin-facts">
            <li>Discord sign-in only, no password</li>
            <li>You must be in the Clover Kingdom Discord</li>
            <li>The Night Sky opens at MK Proven and up</li>
          </ul>
          <button type="button" class="v2-link" id="members-signout">Sign out</button>
        </div>
      </div>
    </section>

    <section class="v2-section v2-vault" aria-labelledby="m-unlock-title">
      <div class="container">
        <div class="v2-section-head">
          <div class="v2-eyebrow">${ICONS.lock} Behind the gate</div>
          <h2 class="v2-h2" id="m-unlock-title">What members unlock</h2>
        </div>
        <ul class="v2-unlocks">${unlockCardsHtml()}
        </ul>
        <div class="v2-planned reveal">
          <div class="v2-planned-head">Also planned for members</div>
          <ul>${planned}</ul>
        </div>
      </div>
    </section>

    <section class="v2-section" aria-labelledby="become-title">
      <div class="container">
        <div class="v2-become reveal">
          <div>
            <div class="v2-eyebrow">Not a member yet</div>
            <h2 class="v2-h2 v2-h2-left" id="become-title">How to become a member</h2>
            <ol class="v2-mini-steps">
              ${JOIN_STEPS.map((st, i) => `<li><span>${ROMAN[i]}</span>${escHtml(st.name)}</li>`).join("")}
            </ol>
          </div>
          <div class="v2-become-cta">
            <button type="button" class="v2-btn v2-btn-primary" data-apply="1">Join the Kingdom ${ICONS.arrow}</button>
            <a class="v2-link" href="#/join">See how joining works ${ICONS.arrow}</a>
          </div>
        </div>
      </div>
    </section>
  `;
  wirePageButtons(wrap);
  wireReveal(wrap);
  const signout = wrap.querySelector("#members-signout");
  if (signout) {
    signout.addEventListener("click", () => {
      fetch(CKW_AUTH + "/auth/logout", { method: "POST", credentials: "include" })
        .then((r) => { const note = wrap.querySelector("#members-signin-note"); if (note) note.textContent = r.ok ? "You are signed out." : "Sign-out did not complete. Please try again."; })
        .catch(() => { const note = wrap.querySelector("#members-signin-note"); if (note) note.textContent = "Sign-out did not complete. Please try again."; });
    });
  }
  return wrap;
}

/* Point every "Member login" link at the right place (gateway now, members site once MEMBERS_OPEN). */
function wireMemberLogin() {
  document.querySelectorAll("[data-member-login]").forEach((a) => { a.setAttribute("href", memberLoginHref()); });
}

function buildFaq() {
  const items = FAQ.map((f) =>
    `<div class="faq-item"><h3 class="faq-q">${escHtml(f.q)}</h3><p class="faq-a">${escHtml(f.a)}</p></div>`).join("");
  const wrap = pageShell("Questions", "FAQ",
    "Short, honest answers. If yours is not here, ask in the Discord.",
    `<div class="faq-list">${items}</div>
     <div class="cta-row cta-left">${DISCORD_BUTTON()}${APPLY_BUTTON}</div>`);
  wirePageButtons(wrap);
  return wrap;
}

function buildArchetypes() {
  return pageShell("The House", "The archetypes",
    "Each archetype is an SI with its own lane, part of one house of librarians that serves the Kingdom and its people. Not every one is open to talk yet.",
    `<div class="arch-grid">${archetypeCardsHtml()}</div>`);
}

/* ------------------------------------------------
   Merchants Guild page (#/merchants-guild). Public version trimmed 2026-10-24.
   Full Guild copy (v4 sealed) is held for the future members-only page:
   D:\Kingdom\notes\ck-calendar-join\CKW_MEMBERS_ONLY_GUILD_CONTENT_2026-10-24.md
   ------------------------------------------------ */
function buildMerchantsGuild() {
  const wrap = document.createElement("div");
  wrap.innerHTML = `
    <div class="container guild-page">
      <a class="back-link" href="#/">\u2190 Back to the gate</a>
      <div class="section">
        <header class="guild-hero">
          <h2 class="section-title guild-title">Clover Kingdom Merchants Guild</h2>
          <p class="section-lead guild-lead">A place for Magic Knights to trade with each other honestly. Details are for members.</p>
        </header>
        <div class="cta-row cta-left"><button type="button" class="cta cta-primary" data-apply="1">Join</button></div>
      </div>
    </div>
  `;
  wirePageButtons(wrap);
  return wrap;
}

function buildArchetype(slug) {
  const a = ARCHETYPES.find((x) => x.slug === slug);
  if (!a) return null;
  const wrap = document.createElement("div");
  wrap.innerHTML = `
    <div class="container">
      <a class="back-link" href="#/archetypes">\u2190 All archetypes</a>
      <div class="section">
        <div class="section-eyebrow">Archetype</div>
        <h2 class="section-title">${escHtml(a.name)}</h2>
        <p class="section-lead arch-role">${escHtml(a.job)}</p>
        <div class="offer-rows">
          <div class="offer-row"><h3 class="offer-name">What it does for members</h3><p class="offer-text">${escHtml(a.does)}</p></div>
          <div class="offer-row"><h3 class="offer-name">How to talk to it</h3><p class="offer-text">Join the Discord and ask. Not every archetype is open to talk yet, so ask there which ones are.</p></div>
        </div>
        <div class="cta-row cta-left">${DISCORD_BUTTON()}</div>
        <p class="muted" style="margin-top:20px"><a href="#/">Back to the gate</a></p>
      </div>
    </div>
  `;
  return wrap;
}

function buildNotFound() {
  return pageShell("Not found", "That page is not here",
    "The link may be old or mistyped. Here are some places to go instead.",
    `<div class="cta-row cta-left">
       <a class="cta cta-primary" href="#/">The gate</a>
       <a class="cta cta-secondary" href="#/join">How to join</a>
       <a class="cta cta-secondary" href="#/faq">FAQ</a>
     </div>`);
}

/* ------------------------------------------------
   Main render — decides ritual or gate
   ------------------------------------------------ */
const main = document.getElementById("page-content");

function renderMain() {
  /* Book-drop / film ritual disabled 2026-11-09: gate loads immediately. */
  cancelRitual();
  markSkipped();
  main.innerHTML = "";
  main.appendChild(buildGate());
  wireGate(main);
}

/* ------------------------------------------------
   Apply form wiring
   ------------------------------------------------ */
const FIELD_RULES = {
  handle:   { min: 2, max: 100,  ask: "Please give a Discord handle or another way to reach you." },
  building: { min: 3, max: 1000, ask: "Please write a little about what you are building. A sentence is enough." },
  ai:       { min: 3, max: 1000, ask: "Please tell us a little about how you use SI. A sentence is enough." },
  intel:    { min: 3, max: 1000, ask: "Please share what intelligence means to you. A sentence is enough." },
  found:    { min: 2, max: 500,  ask: "Please tell us how you found the Clover Kingdom." },
};

/* Returns { field: message } for every problem. Pure function, easy to test. */
function validateApplication(values, consented) {
  const errors = {};
  Object.keys(FIELD_RULES).forEach((k) => {
    const rule = FIELD_RULES[k];
    const v = String(values[k] || "").trim();
    if (v.length < rule.min) errors[k] = rule.ask;
    else if (v.length > rule.max) errors[k] = "That is a little long. Please keep it under " + rule.max + " characters.";
  });
  if (!consented) errors.consent = "Please tick the box to confirm you understand and agree before applying.";
  return errors;
}

/* ------------------------------------------------
   Join pop-out panel
   Background stays. Join opens a dark gold-trimmed panel:
   1 Follow @Saint_Chevalier on X
   2 Same five apply questions (unlock after Follow click)
   3 Discord link after apply
   ------------------------------------------------ */
function applyFormFieldsHtml(idPrefix) {
  const p = idPrefix || "";
  return `
          <form class="apply-form" novalidate>
            <div class="field">
              <label for="${p}f-handle">Discord handle or how to reach you</label>
              <input id="${p}f-handle" name="handle" type="text" autocomplete="off" maxlength="100" required aria-describedby="${p}hint-handle ${p}err-handle">
              <div class="field-hint" id="${p}hint-handle">A handle is enough. No real name needed.</div>
              <div class="field-error" id="${p}err-handle" aria-live="polite"></div>
            </div>
            <div class="field">
              <label for="${p}f-building">What are you building or working on right now?</label>
              <textarea id="${p}f-building" name="building" rows="3" maxlength="1000" required aria-describedby="${p}err-building"></textarea>
              <div class="field-error" id="${p}err-building" aria-live="polite"></div>
            </div>
            <div class="field">
              <label for="${p}f-ai">What is your relationship with SI? How do you use it?</label>
              <textarea id="${p}f-ai" name="ai" rows="3" maxlength="1000" required aria-describedby="${p}err-ai"></textarea>
              <div class="field-error" id="${p}err-ai" aria-live="polite"></div>
            </div>
            <div class="field">
              <label for="${p}f-intel">What does intelligence mean to you?</label>
              <textarea id="${p}f-intel" name="intel" rows="3" maxlength="1000" required aria-describedby="${p}err-intel"></textarea>
              <div class="field-error" id="${p}err-intel" aria-live="polite"></div>
            </div>
            <div class="field">
              <label for="${p}f-found">How did you find the Clover Kingdom?</label>
              <textarea id="${p}f-found" name="found" rows="2" maxlength="500" required aria-describedby="${p}err-found"></textarea>
              <div class="field-error" id="${p}err-found" aria-live="polite"></div>
            </div>
            <div class="apply-privacy" id="${p}apply-privacy">
              What you send passes through Cloudflare to a private intake. It is read by a person, with the Kingdom's SIs. We keep it only as long as needed. You can ask us to delete it at any time by messaging Saint Chevalier on X, @Saint_Chevalier. Do not send passwords, ID numbers, or anything you are not comfortable sharing.
            </div>
            <div class="apply-consent">
              <input id="${p}f-consent" name="consent" type="checkbox" required aria-describedby="${p}apply-privacy ${p}err-consent">
              <label for="${p}f-consent">I understand what I send is read by a person, with the Kingdom's SIs, and I agree.</label>
            </div>
            <div class="field-error" id="${p}err-consent" aria-live="polite"></div>
            <button type="submit" class="apply-submit">Apply</button>
          </form>`;
}

let joinPanelState = { open: false, step: 1, followed: false, lastFocus: null, onKey: null };

function joinPanelMarkup() {
  return `
  <div class="join-panel-root" id="join-panel-root" hidden>
    <div class="join-panel-backdrop" data-join-close="1" tabindex="-1"></div>
    <div class="join-panel" role="dialog" aria-modal="true" aria-labelledby="join-panel-title" tabindex="-1">
      <button type="button" class="join-panel-close" data-join-close="1" aria-label="Close">\u00d7</button>
      <header class="join-panel-head">
        <h2 id="join-panel-title" class="join-panel-title">Join the Kingdom</h2>
        <p class="join-panel-lead">Three steps. Everyone is welcome.</p>
        <ol class="join-panel-steps" aria-label="Join steps">
          <li class="join-panel-step is-active" data-step-ind="1"><span class="join-panel-step-num">1</span><span class="join-panel-step-label">Follow</span></li>
          <li class="join-panel-step" data-step-ind="2"><span class="join-panel-step-num">2</span><span class="join-panel-step-label">Apply</span></li>
          <li class="join-panel-step" data-step-ind="3"><span class="join-panel-step-num">3</span><span class="join-panel-step-label">Discord</span></li>
        </ol>
      </header>
      <div class="join-panel-body">
        <section class="join-panel-pane is-active" data-pane="1" aria-labelledby="join-step1-title">
          <h3 id="join-step1-title" class="join-pane-title">Follow Saint Chevalier on X</h3>
          <p class="join-pane-text">The main Kingdom account is @Saint_Chevalier. Press the button to open X&rsquo;s follow screen in a new tab.</p>
          <div class="cta-row cta-left">
            <a class="cta cta-primary" id="join-follow-btn" href="${X_FOLLOW_URL}" target="_blank" rel="noopener noreferrer">Follow @Saint_Chevalier</a>
          </div>
          <p class="join-panel-honest muted">This site can&rsquo;t check follows. Step 2 opens after you press the button.</p>
        </section>
        <section class="join-panel-pane" data-pane="2" hidden aria-labelledby="join-step2-title">
          <h3 id="join-step2-title" class="join-pane-title">Apply</h3>
          <p class="join-pane-text">Five questions. A person reads them. Approval happens in Discord. A form is not a rank.</p>
          <div class="join-panel-locked" id="join-step2-lock">
            <p>Step 2 is locked until you press Follow @Saint_Chevalier above.</p>
          </div>
          <div class="join-panel-form-wrap" id="join-step2-form" hidden>
            <div class="apply-box join-panel-apply">
              ${applyFormFieldsHtml("jp-")}
            </div>
          </div>
        </section>
        <section class="join-panel-pane" data-pane="3" hidden aria-labelledby="join-step3-title">
          <h3 id="join-step3-title" class="join-pane-title">Come into the Discord</h3>
          <p class="join-pane-text">Thank you. We have your application. Next: come into the Discord, say hi, and grab your MK#. Approval happens there.</p>
          <div class="cta-row cta-left">
            <a class="cta cta-primary" href="${DISCORD_URL}" target="_blank" rel="noopener noreferrer">Open the Discord</a>
          </div>
        </section>
      </div>
    </div>
  </div>`;
}

function ensureJoinPanel() {
  let root = document.getElementById("join-panel-root");
  if (root) return root;
  const holder = document.createElement("div");
  holder.innerHTML = joinPanelMarkup().trim();
  root = holder.firstElementChild;
  document.body.appendChild(root);
  wireJoinPanel(root);
  return root;
}

function setJoinStep(step) {
  joinPanelState.step = step;
  const root = document.getElementById("join-panel-root");
  if (!root) return;
  root.querySelectorAll("[data-step-ind]").forEach((el) => {
    const n = Number(el.getAttribute("data-step-ind"));
    el.classList.toggle("is-active", n === step);
    el.classList.toggle("is-done", n < step);
  });
  root.querySelectorAll("[data-pane]").forEach((pane) => {
    const n = Number(pane.getAttribute("data-pane"));
    const on = n === step;
    pane.hidden = !on;
    pane.classList.toggle("is-active", on);
  });
  // Unlock form UI when followed
  const lock = root.querySelector("#join-step2-lock");
  const formWrap = root.querySelector("#join-step2-form");
  if (lock && formWrap) {
    if (joinPanelState.followed) {
      lock.hidden = true;
      formWrap.hidden = false;
    } else {
      lock.hidden = false;
      formWrap.hidden = true;
    }
  }
}

function unlockJoinStep2() {
  joinPanelState.followed = true;
  const root = document.getElementById("join-panel-root");
  if (!root) return;
  setJoinStep(2);
  const first = root.querySelector("#jp-f-handle");
  if (first) first.focus();
}

function getFocusable(container) {
  return Array.from(container.querySelectorAll(
    'a[href], button:not([disabled]), textarea, input:not([disabled]), select, [tabindex]:not([tabindex="-1"])'
  )).filter((el) => !el.hasAttribute("disabled") && el.offsetParent !== null && !el.getAttribute("aria-hidden"));
}

function wireJoinPanel(root) {
  root.addEventListener("click", (e) => {
    const t = e.target.closest("[data-join-close]");
    if (t) { e.preventDefault(); closeJoinPanel(); }
  });
  const follow = root.querySelector("#join-follow-btn");
  if (follow) {
    follow.addEventListener("click", () => {
      // Unlock after the click; X opens in the new tab from the href.
      unlockJoinStep2();
    });
  }
  const formWrap = root.querySelector("#join-step2-form");
  if (formWrap) {
    wireApplyForm(formWrap, {
      idPrefix: "jp-",
      onSuccess: () => setJoinStep(3),
    });
  }
}

function openJoinPanel() {
  const root = ensureJoinPanel();
  joinPanelState.lastFocus = document.activeElement;
  joinPanelState.followed = false;
  root.hidden = false;
  document.body.classList.add("join-panel-open");
  setJoinStep(1);
  joinPanelState.open = true;
  const dialog = root.querySelector(".join-panel");
  const onKey = (e) => {
    if (!joinPanelState.open) return;
    if (e.key === "Escape") { e.preventDefault(); closeJoinPanel(); return; }
    if (e.key === "Tab" && dialog) {
      const nodes = getFocusable(dialog);
      if (!nodes.length) return;
      const first = nodes[0], last = nodes[nodes.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  };
  joinPanelState.onKey = onKey;
  document.addEventListener("keydown", onKey);
  const focusStart = root.querySelector("#join-follow-btn") || root.querySelector(".join-panel-close");
  if (focusStart) focusStart.focus();
  else if (dialog) dialog.focus();
}

function closeJoinPanel() {
  const root = document.getElementById("join-panel-root");
  if (!root) return;
  joinPanelState.open = false;
  root.hidden = true;
  document.body.classList.remove("join-panel-open");
  if (joinPanelState.onKey) {
    document.removeEventListener("keydown", joinPanelState.onKey);
    joinPanelState.onKey = null;
  }
  const back = joinPanelState.lastFocus;
  if (back && typeof back.focus === "function") back.focus();
}

function wireApplyForm(container, opts) {
  opts = opts || {};
  const idPrefix = opts.idPrefix || "";
  const onSuccess = opts.onSuccess || null;
  const form = container.querySelector(".apply-form");
  if (!form) return;
  const RELAY = "https://clover-apply-relay.cloverkingdom.workers.dev";
  const isLocalFile = window.location.protocol === "file:";
  // Hidden trap field: real people never fill it, bots usually do.
  const trap = document.createElement("input");
  trap.type = "text"; trap.name = "website"; trap.tabIndex = -1; trap.autocomplete = "off";
  trap.setAttribute("aria-hidden", "true");
  trap.style.cssText = "position:absolute;left:-9999px;opacity:0;height:0;width:0;";
  form.appendChild(trap);
  const status = document.createElement("p");
  status.className = "apply-status";
  status.setAttribute("role", "status");
  form.appendChild(status);
  const submitBtn = form.querySelector(".apply-submit");
  let sending = false;

  const ids = ["handle", "building", "ai", "intel", "found", "consent"];
  const fieldEl = (k) => form.querySelector("#" + idPrefix + "f-" + k);
  const errEl = (k) => form.querySelector("#" + idPrefix + "err-" + k);
  function showError(k, msg) {
    const e = errEl(k), f = fieldEl(k);
    if (e) e.textContent = msg || "";
    if (f) { if (msg) f.setAttribute("aria-invalid", "true"); else f.removeAttribute("aria-invalid"); }
  }
  // Clear a field's message as soon as the visitor edits it
  ids.forEach((k) => {
    const f = fieldEl(k);
    if (f) f.addEventListener(k === "consent" ? "change" : "input", () => showError(k, ""));
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (sending) return;
    status.classList.remove("is-error");
    const data = new FormData(form);
    const values = {};
    ["handle", "building", "ai", "intel", "found"].forEach((k) => { values[k] = String(data.get(k) || "").trim(); });
    const consent = fieldEl("consent");
    const errors = validateApplication(values, consent ? consent.checked : true);
    ids.forEach((k) => showError(k, errors[k] || ""));
    const firstBad = ids.find((k) => errors[k]);
    if (firstBad) {
      status.textContent = "Almost there. Please check the marked answers and try again.";
      status.classList.add("is-error");
      const f = fieldEl(firstBad);
      if (f) f.focus();
      return;
    }
    const payload = {
      handle: values.handle,
      building: values.building,
      ai: values.ai,
      intel: values.intel,
      found: values.found,
      website: data.get("website") || "",
      timestamp: new Date().toISOString(),
    };
    if (isLocalFile) {
      // Local preview opened by double click: never send anything to the real intake.
      status.textContent = "Preview mode: this page is opened from a file, so nothing was sent.";
      return;
    }
    sending = true;
    if (submitBtn) submitBtn.disabled = true;
    status.textContent = "Sending...";
    try {
      const res = await fetch(RELAY, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("relay " + res.status);
      status.innerHTML = `Thank you. We have your application. It is not approved yet. Next: come into the Discord at <a href="${DISCORD_URL}" target="_blank" rel="noopener noreferrer">${DISCORD_URL}</a>. Say hi and grab your MK#. Approval happens there.`;
      form.reset();
      if (typeof onSuccess === "function") onSuccess(payload);
    } catch (err) {
      console.warn("Application not sent:", err);
      status.textContent = "Your application did not go through. Nothing was saved. Please try again, or message Saint Chevalier on X: @Saint_Chevalier.";
      status.classList.add("is-error");
    } finally {
      sending = false;
      if (submitBtn) submitBtn.disabled = false;
    }
  });
}

/* ------------------------------------------------
   #/tek-tribe-game: members-only Tek Tribe game shell (2026-11-10)
   Gate: GET https://auth.cloverkingdom.net/api/me with credentials.
   Catalog names and art statuses come from TEK_TRIBE_DRAW_LIBRARY_2026-10-08
   (compiled in the Tek Tribe Library, 2026-11-10). Shell only: no moves,
   no invented balances, no claim that login is already live.
   ------------------------------------------------ */
const TTG_FAMILIES = [
  { id: "01", name: "AI chat / reasoning / SI", body: "round dome-headed metal bot, two thin antenna stalks, lit chest ring", art: "EXISTS" },
  { id: "02", name: "Code builders", body: "heavy squat metal bot, thick arms, hide work apron", art: "PARTIAL" },
  { id: "03", name: "Notes / knowledge / source of truth", body: "tall slim metal bot, very big round ear-dishes, long arms, rolled-scroll chest relief", art: "PARTIAL" },
  { id: "04", name: "Storage / local disk / self-host", body: "squat wide boxy metal bot, small round ear-dishes, concentric-ring chest relief", art: "PARTIAL" },
  { id: "05", name: "Comms / community", body: "pear-shaped metal bot, speech-bubble chest relief", art: "PARTIAL" },
  { id: "06", name: "Automation / agents / schedulers", body: "short wide metal bot, long jointed arms, cog chest relief", art: "PARTIAL" },
  { id: "07", name: "Media generation", body: "round metal bot, coiled-wire tufts, triple-spiral chest relief", art: "PARTIAL" },
  { id: "08", name: "Money / payments (soft hold)", body: "slim round metal bot, long jointed tail, diamond chest gem", art: "PARTIAL" },
  { id: "09", name: "Security / identity", body: "broad sturdy metal bot, heavy shoulder mantle, plain shield chest relief", art: "PARTIAL" },
  { id: "10", name: "Games / play", body: "springy ball-shaped metal bot, short piston legs, star chest relief", art: "PARTIAL" },
];

const TTG_JOBS = [
  { id: "J01", job: "Grader / tester / reviewer", species: "Protoceratops", art: "PARTIAL" },
  { id: "J02", job: "Data cleaner", species: "Protoceratops (testing line)", art: "NEEDED" },
  { id: "J03", job: "Scout / researcher", species: "Troodon", art: "PARTIAL" },
  { id: "J04", job: "Scribe / writer", species: "Therizinosaurus", art: "PARTIAL" },
  { id: "J05", job: "Sentry / alerts / monitoring", species: "Ankylosaurus", art: "PARTIAL" },
  { id: "J06", job: "Keys keeper", species: "Ankylosaurus (security line)", art: "NEEDED" },
  { id: "J07", job: "Scheduler / organizer", species: "Stegosaurus", art: "PARTIAL" },
  { id: "J08", job: "Builder", species: "Triceratops", art: "PARTIAL" },
  { id: "J09", job: "Code hauler", species: "Triceratops (builder line)", art: "PARTIAL" },
  { id: "J10", job: "Hauler / backup / sync / memory", species: "Apatosaurus", art: "PARTIAL" },
  { id: "J11", job: "Connector", species: "long-neck sauropod (exact species not yet named)", art: "PARTIAL" },
  { id: "J12", job: "Messenger / sender", species: "Microraptor", art: "PARTIAL" },
  { id: "J13", job: "Personal aide / translator", species: "Microraptor", art: "NEEDED" },
  { id: "J14", job: "Painter / designer", species: "Sinosauropteryx", art: "PARTIAL" },
  { id: "J15", job: "Musician / voice", species: "Parasaurolophus", art: "NEEDED" },
  { id: "J16", job: "Teacher / coach", species: "Maiasaura", art: "NEEDED" },
  { id: "J17", job: "Seller / negotiator", species: "Pachycephalosaurus", art: "NEEDED" },
  { id: "J18", job: "Money counter", species: "Psittacosaurus", art: "HELD" },
  { id: "J19", job: "Health coach", species: "Struthiomimus", art: "NEEDED" },
  { id: "J20", job: "Analyst / overview", species: "Quetzalcoatlus (pterosaur)", art: "NEEDED" },
];

const TTG_CATEGORIES = [
  { id: "C01", name: "AI assistant / SI / chat model" },
  { id: "C02", name: "AI agent seats / bot crews" },
  { id: "C03", name: "Local models / compute" },
  { id: "C04", name: "Code editor / IDE / coding agent" },
  { id: "C05", name: "Version control / code hosting" },
  { id: "C06", name: "Website / hosting / deploy" },
  { id: "C07", name: "Domains / DNS" },
  { id: "C08", name: "Notes / knowledge base" },
  { id: "C09", name: "Docs / office / writing" },
  { id: "C10", name: "Calendar / tasks / planning" },
  { id: "C11", name: "Database / storage / backup" },
  { id: "C12", name: "Cloud drive / file sync" },
  { id: "C13", name: "Chat / community server" },
  { id: "C14", name: "Social / posting" },
  { id: "C15", name: "Email / newsletter" },
  { id: "C16", name: "CRM / leads / contacts" },
  { id: "C17", name: "Automation / scheduling / workflows" },
  { id: "C18", name: "Marketplaces / gig / hire-a-human" },
  { id: "C19", name: "Design / image" },
  { id: "C20", name: "Video" },
  { id: "C21", name: "Audio / music / voice" },
  { id: "C22", name: "3D / CAD / game engines" },
  { id: "C23", name: "Browser" },
  { id: "C24", name: "OS / devices / PC parts" },
  { id: "C25", name: "Security / passwords / keys" },
  { id: "C26", name: "Sign-in / identity account" },
  { id: "C27", name: "Finance / banking / payments (HOLD)" },
  { id: "C28", name: "Commerce / shop" },
  { id: "C29", name: "Analytics / dashboards" },
  { id: "C30", name: "Monitoring / alerts / uptime" },
  { id: "C31", name: "Learning / courses / language" },
  { id: "C32", name: "Health / fitness" },
  { id: "C33", name: "Gaming / play" },
  { id: "C34", name: "Home / IoT / smart home" },
  { id: "C35", name: "Other / unknown" },
];

function ttgArtLabel(s) {
  if (s === "EXISTS") return "Exists";
  if (s === "PARTIAL") return "Partial";
  if (s === "HELD") return "Held";
  return "Not designed yet";
}

function buildTekTribeGame() {
  const wrap = document.createElement("div");
  wrap.className = "ttg-page";
  wrap.innerHTML = `
    <section class="ttg-shell" aria-labelledby="ttg-title">
      <div class="container">
        <a class="back-link" href="#/">\u2190 Back to the gate</a>
        <div class="ttg-eyebrow">Members only</div>
        <h1 class="ttg-title" id="ttg-title">Tek Tribe <span>game</span></h1>
        <p class="ttg-lead">A members-only game on this site. Login is how the game tracks each player.</p>
        <div id="ttg-box" role="status"><p class="ttg-note">Checking if you are signed in...</p></div>
      </div>
    </section>
  `;
  const box = wrap.querySelector("#ttg-box");

  const showLocked = (msg) => {
    box.innerHTML =
      `<div class="ttg-locked">` +
        (msg ? `<p class="ttg-note">${escHtml(msg)}</p>` : "") +
        `<a class="ttg-login" href="${CKW_AUTH}/auth/login">${ICONS.discord}<span>Log in with Discord</span></a>` +
        `<p class="ttg-note">The game stays locked until you are signed in with the Discord account you use in the Clover Kingdom.</p>` +
        `<p class="ttg-small">Not in the Discord yet? <a href="${DISCORD_URL}" target="_blank" rel="noopener noreferrer">Join it first</a>, then apply.</p>` +
      `</div>`;
  };

  const showMember = (me) => {
    const name = me && me.name ? String(me.name) : "member";
    const siBit = me && me.isSI ? " (SI)" : "";
    const families = TTG_FAMILIES.map((f) =>
      `<li class="ttg-piece">` +
        `<span class="ttg-stamp ttg-stamp-${escHtml(f.art.toLowerCase())}">${escHtml(ttgArtLabel(f.art))}</span>` +
        `<h3 class="ttg-piece-name">${escHtml(f.name)}</h3>` +
        `<p class="ttg-piece-body">${escHtml(f.body)}</p>` +
        `<p class="ttg-piece-id">Family ${escHtml(f.id)}${f.art === "EXISTS" ? " \u2014 metal body" : " \u2014 plush so far; metal rebuild still needed"}</p>` +
      `</li>`
    ).join("");
    const dinos = TTG_JOBS.map((j) =>
      `<li class="ttg-piece">` +
        `<span class="ttg-stamp ttg-stamp-${escHtml(j.art.toLowerCase())}">${escHtml(ttgArtLabel(j.art))}</span>` +
        `<h3 class="ttg-piece-name">${escHtml(j.job)}</h3>` +
        `<p class="ttg-piece-body">${escHtml(j.species)}</p>` +
        `<p class="ttg-piece-id">${escHtml(j.id)}</p>` +
      `</li>`
    ).join("");
    const catalog = TTG_CATEGORIES.map((c) =>
      `<li class="ttg-card">` +
        `<span class="ttg-card-kicker">${escHtml(c.id)} \u00b7 Catalog</span>` +
        `<h3 class="ttg-card-name">${escHtml(c.name)}</h3>` +
      `</li>`
    ).join("");
    box.innerHTML = `
      <p class="ttg-signed">Signed in as ${escHtml(name)}${escHtml(siBit)}.</p>
      <p class="ttg-ess">Essence (ESS): not live yet. ESS is points only. It cannot be cashed out or traded.</p>

      <section class="ttg-panel" aria-labelledby="ttg-chief-title">
        <h2 class="ttg-h2" id="ttg-chief-title">Your Chief</h2>
        <div class="ttg-chief">
          <div class="ttg-chief-mark" aria-hidden="true"></div>
          <div>
            <p>The player Chief cavebot and banner are not designed yet. This is a reserved spawn slot.</p>
            <p class="ttg-small">When the Chief is drawn, it stands here. The banner has no letters unless you describe a motif.</p>
          </div>
        </div>
      </section>

      <section class="ttg-panel" aria-labelledby="ttg-family-title">
        <h2 class="ttg-h2" id="ttg-family-title">Cavebot family</h2>
        <p class="ttg-panel-lead">Ten family bodies from the Library. One Exists in metal. The other nine are still Partial (plush) and need a metal rebuild.</p>
        <ul class="ttg-pieces">${families}</ul>
      </section>

      <section class="ttg-panel" aria-labelledby="ttg-dino-title">
        <h2 class="ttg-h2" id="ttg-dino-title">Skill-dinos</h2>
        <p class="ttg-panel-lead">Twenty skill jobs from the Library. None have finished art yet. Four species swaps locked on 8 Oct 2026 still need a repaint: Scribe, Sentry, Messenger, and Painter. The money-counter is Held.</p>
        <ul class="ttg-pieces">${dinos}</ul>
      </section>

      <section class="ttg-panel" aria-labelledby="ttg-stack-title">
        <h2 class="ttg-h2" id="ttg-stack-title">Your tek stack</h2>
        <p class="ttg-panel-lead">No personal stack is saved yet. When it is, your tools show here as Kingdom cards (Exists or Desired). The catalog below is the 35 locked tek categories, not a claim that you already own them.</p>
        <ul class="ttg-cards">${catalog}</ul>
      </section>

      <button type="button" class="ttg-signout" id="ttg-signout">Sign out</button>
    `;
    const out = box.querySelector("#ttg-signout");
    if (out) {
      out.addEventListener("click", () => {
        fetch(CKW_AUTH + "/auth/logout", { method: "POST", credentials: "include" }).finally(() => showLocked("You are signed out."));
      });
    }
  };

  const loginWhy = (() => {
    const raw = window.location.hash || "";
    const i = raw.indexOf("?");
    if (i === -1) return "";
    const why = new URLSearchParams(raw.slice(i + 1)).get("login");
    if (why === "not_member") return "You need to be in the Clover Kingdom Discord to sign in.";
    if (why === "failed") return "Sign-in did not complete. Please try again.";
    return "";
  })();

  fetch(CKW_AUTH + "/api/me", { credentials: "include" })
    .then((r) => r.ok ? r.json() : null)
    .then((me) => {
      if (!me || !me.signedIn) showLocked(loginWhy);
      else showMember(me);
    })
    .catch(() => showLocked(loginWhy || "The login service at auth.cloverkingdom.net could not be reached. Please try again."));

  return wrap;
}

/* ------------------------------------------------
   Nav wiring
   ------------------------------------------------ */
const SUBPAGES = {
  "#/sage": () => buildSage(),
  "#/standard": () => buildStandard(),
  "#/ranks": () => buildRanks(),
  "#/glyphs": () => buildGlyphs(),
  "#/links": () => buildLinks(),
  "#/offers": () => buildOffers(),
  "#/merchants-guild": () => buildMerchantsGuild(),
  "#/tek": () => buildTek(),
  "#/join": () => buildJoin(),
  "#/login": () => buildMembers(), /* v2: one member door; old buildLogin kept above, unused */
  "#/welcome": () => buildWelcome(),
  "#/members": () => buildMembers(),
  "#/tek-tribe-game": () => buildTekTribeGame(),
  "#/faq": () => buildFaq(),
  "#/archetypes": () => buildArchetypes(),
};

/* One title per route (the Gate keeps the page's original title). */
const GATE_TITLE = document.title;
const TITLES = {
  "#/sage": "Sage | CLOVER KINGDOM",
  "#/standard": "The Standard | CLOVER KINGDOM",
  "#/ranks": "Ranks | CLOVER KINGDOM",
  "#/glyphs": "Glyphs | CLOVER KINGDOM",
  "#/links": "Links | CLOVER KINGDOM",
  "#/offers": "Offers | CLOVER KINGDOM",
  "#/merchants-guild": "Clover Kingdom Merchants Guild | CLOVER KINGDOM",
  "#/tek": "Tek Tribe and Tek Stacks | CLOVER KINGDOM",
  "#/join": "How to join | CLOVER KINGDOM",
  "#/login": "Member login | CLOVER KINGDOM",
  "#/welcome": "Welcome and the Kingdom's rules | CLOVER KINGDOM",
  "#/members": "Member login | CLOVER KINGDOM",
  "#/tek-tribe-game": "Tek Tribe game | CLOVER KINGDOM",
  "#/faq": "FAQ | CLOVER KINGDOM",
  "#/archetypes": "The archetypes | CLOVER KINGDOM",
};
const NOT_FOUND_TITLE = "Page not found | CLOVER KINGDOM";

/* Turn the address into { view, title, navHref } or null (not found). */
function resolveRoute(page) {
  if (SUBPAGES[page]) return { build: SUBPAGES[page], title: TITLES[page], navHref: page };
  const m = /^#\/archetype\/([a-z0-9-]+)$/.exec(page);
  if (m) {
    const a = ARCHETYPES.find((x) => x.slug === m[1]);
    if (a) return { build: () => buildArchetype(a.slug), title: a.name + " (archetype) | CLOVER KINGDOM", navHref: "#/archetypes" };
  }
  return null;
}

/* Mark the current page in the menu (screen readers and a gold highlight). */
function markNav(href) {
  document.querySelectorAll(".site-nav-links a").forEach((a) => {
    if (a.getAttribute("href") === href) a.setAttribute("aria-current", "page");
    else a.removeAttribute("aria-current");
  });
  document.querySelectorAll(".nav-login").forEach((a) => {
    if (href === "#/members" || href === "#/login") a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current");
  });
  const more = document.querySelector(".nav-more");
  if (more) more.classList.toggle("has-current", !!more.querySelector('a[aria-current="page"]'));
}

/* Hash path without ?query. Login redirects use #/tek-tribe-game?login=failed. */
function hashRoute(hash) {
  const raw = hash || "#/";
  const q = raw.indexOf("?");
  return q === -1 ? raw : raw.slice(0, q);
}

function routeFromHash() {
  const page = hashRoute(window.location.hash || "#/");
  const main = document.getElementById("page-content");
  // Any navigation ends the intro for good: stop its timers so it can never repaint over this page.
  if (ritualActive()) { cancelRitual(); markSkipped(); }
  const more = document.getElementById("nav-more");
  if (more) more.removeAttribute("open");
  main.innerHTML = "";
  stopSceneCycleIfAny();
  if (page === "#/" || page === "#") {
    document.title = GATE_TITLE;
    markNav("#/");
    if (!pendingApplyScroll) window.scrollTo(0, 0);
    renderMain();
    return;
  }
  const r = resolveRoute(page);
  if (r) {
    const view = r.build();
    document.title = r.title;
    markNav(r.navHref);
    main.appendChild(view);
    accApply(main);
  } else {
    document.title = NOT_FOUND_TITLE;
    markNav("");
    main.appendChild(buildNotFound());
  }
  window.scrollTo(0, 0);
}

function stopSceneCycleIfAny() { /* no rotating scenes */ }

function wireNav() {
  // One router for everything: nav links, back links and the browser's own back button
  // all change the hash, and the hash decides the page.
  window.addEventListener("hashchange", routeFromHash);

  // Clicking the page you are already on (hashchange will not fire):
  // on the Gate leave the form alone and just go to the top; elsewhere re-render.
  function sameRouteClick() {
    if (document.querySelector(".apply-form")) { window.scrollTo(0, 0); }
    else { routeFromHash(); }
  }

  document.querySelectorAll(".site-nav-links a").forEach((a) => {
    a.addEventListener("click", () => {
      const target = a.getAttribute("href");
      const here = window.location.hash || "#/";
      if (target === here) sameRouteClick();
    });
  });

  // Skip link: move keyboard focus to the main content without touching the hash router.
  const skip = document.getElementById("skip-link");
  const mainEl = document.getElementById("page-content");
  if (skip && mainEl) {
    skip.addEventListener("click", (e) => {
      e.preventDefault();
      if (!mainEl.hasAttribute("tabindex")) mainEl.setAttribute("tabindex", "-1");
      mainEl.focus();
    });
  }

  // "More" menu: closes when you pick a page, press Escape, or click elsewhere.
  const more = document.getElementById("nav-more");
  if (more) {
    more.addEventListener("click", (e) => { if (e.target.closest("a")) more.removeAttribute("open"); });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && more.hasAttribute("open")) {
        more.removeAttribute("open");
        const sum = more.querySelector("summary");
        if (sum) sum.focus();
      }
    });
    document.addEventListener("click", (e) => { if (!more.contains(e.target)) more.removeAttribute("open"); });
  }

  const logo = document.getElementById("site-logo");
  if (logo) {
    logo.addEventListener("click", () => {
      if (window.location.hash !== "#/" && window.location.hash !== "") {
        window.location.hash = "#/";
      } else {
        sameRouteClick();
      }
    });
  }
}

/* ------------------------------------------------
   Init
   ------------------------------------------------ */

/* Background: one steady kingdom backdrop (see .kingdom-bg in CSS / index.html).
   Scene rotation and SVG vignettes were removed (Wizard King 2026-10-05).
   The looping background video (v4 scored, 2026-10-07) plays muted; the
   #bg-sound-toggle button lets a visitor turn its music on and off. */

function wireBgSound() {
  const video = document.getElementById("kingdom-bg-video");
  const btn = document.getElementById("bg-sound-toggle");
  if (!video || !btn || prefersReducedMotion) return;
  const label = btn.querySelector(".bg-sound-label");
  video.muted = true;
  const render = () => {
    const on = !video.muted;
    btn.classList.toggle("is-on", on);
    const text = on ? "Turn background music off" : "Turn background music on";
    btn.setAttribute("aria-label", text);
    btn.title = text;
    if (label) label.textContent = on ? "Sound on" : "Sound off";
  };
  btn.addEventListener("click", () => {
    video.muted = !video.muted;
    if (!video.muted && video.paused) {
      const p = video.play();
      if (p && p.catch) p.catch(() => { video.muted = true; render(); });
    }
    render();
  });
  video.addEventListener("volumechange", render);
  video.addEventListener("error", () => { btn.hidden = true; }, true);
  render();
  btn.hidden = false;
}

const SAGE_DOCK_POS_KEY = "ckw-sage-dock-pos";

function mountSageMouth() {
  if (document.getElementById("sage-dock")) return;
  const dock = document.createElement("div");
  dock.className = "sage-dock";
  dock.id = "sage-dock";
  dock.innerHTML = `
    <div class="sage-dock-panel" id="sage-dock-panel" hidden>
      <div class="sage-mouth" id="sage-mouth">
        <div class="sage-mouth-head">
          <div class="sage-mouth-mark">
            <img src="images/logo-crimson-seal.svg" alt="" aria-hidden="true" width="40" height="40">
          </div>
          <div>
            <div class="sage-mouth-name">SAGE</div>
            <div class="sage-mouth-tag">Public teacher · set answers, not live AI</div>
          </div>
        </div>
        <div class="sage-starters" id="sage-starters">
          <button type="button" data-sage-q="How do I join?">How do I join?</button>
          <button type="button" data-sage-q="Is it free?">Is it free?</button>
          <button type="button" data-sage-q="Is everyone welcome?">Is everyone welcome?</button>
        </div>
        <div class="sage-mouth-body" id="sage-body">
          <span class="placeholder">Ask a short question about the Clover Kingdom, this website, what is offered, or how to get involved. This box gives set answers to common questions. It is not live AI, and it is not your Sage. For a real talk, ask @Sage in the Discord.</span>
        </div>
        <form class="sage-mouth-form" id="sage-form">
          <input class="sage-mouth-input" id="sage-input" type="text" placeholder="Ask SAGE something" aria-label="Ask SAGE something" autocomplete="off">
          <button class="sage-mouth-send" type="submit">Ask</button>
        </form>
        <div class="sage-mouth-foot">
          This public mouth uses set answers from the site. It does not call a model from your browser.<br>
          Your Sage is summoned after you apply.
        </div>
      </div>
    </div>
    <button type="button" class="sage-dock-btn" id="sage-dock-btn" aria-expanded="false" aria-controls="sage-dock-panel" aria-label="Ask Sage">
      <img src="images/logo-crimson-seal.svg" alt="" aria-hidden="true" width="40" height="40">
    </button>
  `;
  document.body.appendChild(dock);
  wireSageMouth(dock);

  const btn = dock.querySelector("#sage-dock-btn");
  const panel = dock.querySelector("#sage-dock-panel");
  const body = dock.querySelector("#sage-body");
  const input = dock.querySelector("#sage-input");
  const starters = dock.querySelector("#sage-starters");

  const clamp = (left, top) => {
    const w = dock.offsetWidth || 56;
    const h = dock.offsetHeight || 56;
    const maxL = Math.max(8, window.innerWidth - w - 8);
    const maxT = Math.max(8, window.innerHeight - h - 8);
    return { left: Math.min(maxL, Math.max(8, left)), top: Math.min(maxT, Math.max(8, top)) };
  };
  const applyPos = (left, top) => {
    const p = clamp(left, top);
    dock.style.left = p.left + "px";
    dock.style.top = p.top + "px";
    dock.style.right = "auto";
    dock.style.bottom = "auto";
    return p;
  };
  const savePos = (p) => {
    try { localStorage.setItem(SAGE_DOCK_POS_KEY, JSON.stringify(p)); } catch (_) {}
  };
  const defaultPos = () => {
    const narrow = window.innerWidth <= 680;
    const insetR = narrow ? 16 : 18;
    const insetB = narrow ? 16 : 80;
    return applyPos(window.innerWidth - 56 - insetR, window.innerHeight - 56 - insetB);
  };
  try {
    const saved = JSON.parse(localStorage.getItem(SAGE_DOCK_POS_KEY) || "null");
    if (saved && typeof saved.left === "number" && typeof saved.top === "number") applyPos(saved.left, saved.top);
    else defaultPos();
  } catch (_) { defaultPos(); }

  const placePanel = () => {
    if (panel.hidden) return;
    panel.style.left = panel.style.right = panel.style.top = panel.style.bottom = "";
    const br = btn.getBoundingClientRect();
    const pw = panel.offsetWidth || 320;
    const ph = panel.offsetHeight || 280;
    if (br.top >= ph + 12 || br.top >= (window.innerHeight - br.bottom)) panel.style.bottom = "calc(100% + 10px)";
    else panel.style.top = "calc(100% + 10px)";
    if (br.left + pw + 8 > window.innerWidth) panel.style.right = "0";
    else panel.style.left = "0";
  };

  const setOpen = (open) => {
    panel.hidden = !open;
    btn.setAttribute("aria-expanded", open ? "true" : "false");
    dock.classList.toggle("is-open", open);
    if (open) {
      placePanel();
      if (input) input.focus();
    }
  };

  if (starters) {
    starters.addEventListener("click", (e) => {
      const b = e.target.closest("[data-sage-q]");
      if (!b || !body) return;
      const q = b.getAttribute("data-sage-q") || "";
      body.innerHTML = `<span>${pickSageResponse(q)}</span>`;
    });
  }

  let dragging = false, moved = false, startX = 0, startY = 0, origL = 0, origT = 0;
  btn.addEventListener("pointerdown", (e) => {
    if (e.button != null && e.button !== 0) return;
    dragging = true;
    moved = false;
    startX = e.clientX;
    startY = e.clientY;
    const r = dock.getBoundingClientRect();
    origL = r.left;
    origT = r.top;
    btn.setPointerCapture(e.pointerId);
  });
  btn.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    if (!moved && (dx * dx + dy * dy) < 36) return;
    moved = true;
    dock.classList.add("is-dragging");
    const p = applyPos(origL + dx, origT + dy);
    savePos(p);
    placePanel();
  });
  const endDrag = (e) => {
    if (!dragging) return;
    dragging = false;
    dock.classList.remove("is-dragging");
    try { btn.releasePointerCapture(e.pointerId); } catch (_) {}
    if (!moved) setOpen(panel.hidden);
  };
  btn.addEventListener("pointerup", endDrag);
  btn.addEventListener("pointercancel", endDrag);

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !panel.hidden && !document.body.classList.contains("join-panel-open")) {
      setOpen(false);
      btn.focus();
    }
  });
  window.addEventListener("resize", () => {
    const r = dock.getBoundingClientRect();
    const p = applyPos(r.left, r.top);
    savePos(p);
    placePanel();
  });
}

window.addEventListener("DOMContentLoaded", () => {
  wireNav();
  wireMemberLogin();
  wireBgSound();
  mountSageMouth();
  routeFromHash();
});
