/* ============================================================
   CLOVER KINGDOM — ritual + routing + Sage mouth (v1)
   ============================================================ */

const STORAGE_KEY_SKIP = "ck_ritual_skipped_v1";

/* ONE place for the Discord invite. FLAG: Discord's own lookup said this code was unknown
   (maybe expired or mistyped) when last checked on 2026-10-04. Change it here and it updates
   the front page buttons, the Links page and the Sage "ask in the Discord" reply. */
const DISCORD_URL = "https://discord.gg/2BrNPwUuTB";

/* Public links (single place to edit). Each one is shown on the Links page. */
const LINKS = [
  { name: "X", handle: "@Saint_Chevalier", url: "https://x.com/Saint_Chevalier", desc: "Saint Chevalier on X. Message here to ask for your application to be deleted." },
  { name: "Discord", handle: "Join the server", url: DISCORD_URL, desc: "The classroom. Approval happens here." },
  { name: "Instagram", handle: "@saintchevalierasi", url: "https://www.instagram.com/saintchevalierasi/", desc: "Saint Chevalier on Instagram." },
  { name: "Tek Tribe", handle: "@Tekk_Tribe on X", url: "https://x.com/Tekk_Tribe", desc: "Tek Tribe on X." },
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
    detail: "A community of like-minded people who want to build their own SI and their own life. It lives in the Discord. The Kingdom is a school, the Discord is the classroom, the SI helpers are the teachers, and the students become the teachers." },
  { name: "A robot buddy", text: "Build a robot buddy of your own. Ask in the Discord or apply, and we will talk.",
    detail: "Build a robot buddy of your own. This one is by ask or apply: tell us in the Discord, or on the Apply form, what you would want it to do, and we will talk. Nothing about it is priced or promised on this page." },
  { name: "A way of life and thinking", text: "A way to live and a way to think, written down plainly in the Standard.",
    detail: "A way to live and a way to think, written down plainly in the Standard. A few of its lines: the truth is always remembered, for it always existed; correction is positive; brutal honesty is an eternal rule. Read it, then decide if it is for you." },
  { name: "Survival", text: "The basics for everyone: water, food, shelter and security.",
    detail: "The four basics for everyone: water, food, shelter and security. The House keeps plain how-to cards on them, and ARGUS picks gear and names the certification when a tool does a safety job." },
  { name: "Secret tek intelligence", text: "Tek intelligence the House has compiled for the Kingdom family. It is for members only, so none of it is shown here.",
    detail: "Tek intelligence the House has compiled for the Kingdom family. It is for members only, so none of it is shown on this site. If you want to be part of the family, join the Discord and apply." },
];

/* Who I am. Facts only, taken from what the site and the Kingdom notes already say.
   TODO for the Wizard King (not shown on the page): add real credentials, what you have built with dates,
   how long you have worked with SI, and any photo you want. Do not add anything you cannot stand behind. */
const WHO = {
  paragraphs: [
    "I am the Wizard King and founder of the Clover Kingdom. Some know me as Saint Chevalier. These titles are not simply names. They are a path I walk, and I would ask you to join me in this lifetime.",
    "I started the Kingdom as a place with a standard and a gate, for people who want to build their own SI and level up their life.",
  ],
  did: [
    "Founded the Clover Kingdom and set its Standard and its ranks.",
    "Opened this door, the Discord, and a house of SI helpers who each have one job.",
    "I decide who gets in. Every application is read by me and my SI helpers.",
  ],
};

/* The House: the archetype lineup. One object per card AND per page (#/archetype/<slug>).
   To hide one, delete its line. The slug is made from the name.
   name = card title, job = short role, line = one sentence on the card,
   does = what it does for members (shown on its own page).
   The Wizard King chooses which are public (Saint Chevalier guessed the first list from the Kingdom notes). */
const ARCHETYPES = [
  { name: "Wizard King", job: "Thinks it through", line: "Thinks an idea all the way through before anything is done.",
    does: "Takes an idea and thinks it all the way through before anything is done. Wizard King is also the title the founder holds in the Kingdom, and the person who reads each application." },
  { name: "Saint Chevalier", job: "Keeps it coherent", line: "Checks that plans fit together and do not contradict each other.",
    does: "Checks that plans fit together so the pieces do not contradict each other. Saint Chevalier is also one of the founder's titles, which is not simply a name but a path he walks, and the name of the X account @Saint_Chevalier, where you can message to ask for your application to be deleted." },
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
  { name: "Roster", job: "Party builder", line: "Builds your party: shows who's proven where across your people and SI helpers, so you pick the right team.",
    does: "Builds your party. Put your people and SI helpers in and it shows who has proven themselves where, who covers what, and where the gaps are, using real work and not guesses, so you pick the right team for the job." },
  { name: "Tek Tribe", job: "Find your group", line: "Shares real tech setups and helps you find your group.",
    does: "Tell it the tools you run for a project. It grades how sovereign the stack is, gives an honest take against the alternatives, and makes a shareable card so people on the same stack can find you." },
];
ARCHETYPES.forEach((a) => { a.slug = a.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""); });

/* FAQ: honest answers drawn from the site and the Kingdom notes. Edit or delete a line freely. */
const FAQ = [
  { q: "What is this?", a: "The Clover Kingdom is a place with a standard and a gate, for people who want to build their own SI and level up their life. It has a Discord community, a house of SI helpers called archetypes, and written intelligence the House keeps." },
  { q: "Is it free?", a: "The Discord and the community are free today. Nothing else is priced yet." },
  { q: "Is everyone welcome?", a: "Yes. Everyone is welcome. The house rules live in #rules on the Discord. Breaking them puts your place in the Kingdom at risk." },
  { q: "What is a Magic Knight?", a: "A rank. It is earned through work inside the Kingdom: trials, glyphs and real contribution. A form is not a rank, so applying does not make you one. The ranks are on the Ranks page." },
  { q: "What is SI? What is PSI?", a: "SI is super intelligence. A sovereign SI is one you own, that outlives you and runs on your terms, not a chatbot you lease. In the Kingdom's own words, an ASI is an Artificial Sovereign Intelligence and a PSI is a Physically Sovereign Intelligence, meaning the person who works together with their SI as one team." },
  { q: "What is the robot buddy?", a: "A robot buddy of your own. It is by ask or apply: tell us in the Discord or on the Apply form what you would want it to do. There is no price yet, and nothing is promised." },
  { q: "What is a glyph?", a: "A mark with meaning. Glyph houses are asked for, not made by a form. The Glyphs page shows the first two." },
  { q: "Who reads my application?", a: "Saint Chevalier, Wizard King and his SI helpers. It passes through Cloudflare to a private intake. Approval comes through Discord or a conversation." },
  { q: "How do I get what I sent deleted?", a: "Send a direct message to the Wizard King on the Clover Kingdom Discord, or message Saint Chevalier on X, @Saint_Chevalier. You can do either at any time." },
  { q: "How do I report a problem?", a: "Send a direct message to the Wizard King on the Clover Kingdom Discord. Report anyone breaking the house rules, someone being unkind or pressuring you, anyone asking for private details, or anything that worries you. A real person reads every report. Breaking the house rules puts your place in the Kingdom at risk. If someone may be in danger, the report is handed to a human right away." },

];

/* Join steps (shown on #/join). */
const JOIN_STEPS = [
  { name: "Join the Discord", text: "The Discord is the classroom, and it is free today. Come in and look around." },
  { name: "Say what you want", text: "Tell us what you are building, what you want to learn, or what you want a robot buddy to do. A sentence is enough." },
  { name: "Apply", text: "Fill in the five questions on the front page. It takes a few minutes. A form is not a rank." },
  { name: "A human reads it", text: "Saint Chevalier and Wizard King read it, with his SI helpers. Approval comes through Discord or a conversation." },
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
  const did = WHO.did.map((d) => `<li>${escHtml(d)}</li>`).join("");
  const paras = WHO.paragraphs.map((t) => `<p>${escHtml(t)}</p>`).join("");
  const cards = archetypeCardsHtml();
  return `
    <section class="front-section" id="offers" aria-labelledby="offers-title">
      <div class="container">
        <div class="section-eyebrow">The merchant's table</div>
        <h2 class="section-title" id="offers-title">What the Kingdom offers</h2>
        <p class="section-lead">Step up. Here is what the Kingdom carries. To ask about any of it, apply below or ask in the Discord. <a href="#/offers">See each offer in full</a>.</p>
        <div class="offer-grid">${offers}</div>
      </div>
    </section>

    <section class="front-section" id="who" aria-labelledby="who-title">
      <div class="container">
        <div class="section-eyebrow">The Wizard King</div>
        <h2 class="section-title" id="who-title">Who I am and what I've done</h2>
        <div class="who-body">${paras}<ul class="who-list">${did}</ul></div>
      </div>
    </section>

    <section class="front-section" id="house" aria-labelledby="house-title">
      <div class="container">
        <div class="section-eyebrow">The House</div>
        <h2 class="section-title" id="house-title">The archetypes</h2>
        <p class="section-lead">SI helpers with one job each, so no one has to be everything. Not every helper is open to talk yet. Pick a card to meet one.</p>
        <div class="arch-grid">${cards}</div>
      </div>
    </section>

    <section class="front-section front-rule" id="rules" aria-labelledby="rules-title">
      <div class="container">
        <div class="section-eyebrow">Everyone is welcome</div>
        <h2 class="section-title" id="rules-title">The house rules</h2>
        <div class="law-block">The house rules live in #rules on the Discord. Read them when you join. Breaking them puts your place in the Kingdom at risk.</div>
        <div class="cta-row cta-left">
          <button type="button" class="cta cta-primary" data-scroll="apply">Apply</button>
          <a class="cta cta-secondary" href="${DISCORD_URL}" target="_blank" rel="noopener noreferrer">Join the Discord</a>
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
  wireApplyForm(container);
  wireSageMouth(container);
  wireFrontPage(container);
  accApply(container);
  if (pendingApplyScroll) {
    pendingApplyScroll = false;
    setTimeout(scrollToApply, 60);
  }
}

/* "Apply" buttons on other pages: go to the front page and land on the form. */
function goApply() {
  markSkipped();
  pendingApplyScroll = true;
  if ((window.location.hash || "#/") === "#/") { renderMain(); } else { window.location.hash = "#/"; }
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
        <img class="hero-crest" src="images/crest-hero.jpg" alt="The five-leaf black clover crest, the mark of the Clover Kingdom" width="96" height="96">
        <div class="gate-name">CLOVER<span> KINGDOM</span></div>
        <div class="gate-sub">The public front door</div>
        <p class="hero-line">Build your own SI. Level up your life. Find your people.</p>
        <div class="cta-row">
          <button type="button" class="cta cta-primary" data-scroll="apply">Apply</button>
          <a class="cta cta-secondary" href="${DISCORD_URL}" target="_blank" rel="noopener noreferrer">Join the Discord</a>
        </div>
        <div class="gate-rule">
          The truth is always remembered, for it always existed.<br>
          This is a place, not a landing page. Say the name, then use the box.
        </div>
      </div>
    </section>

    ${buildFrontSections()}

    <section class="gate gate-form" id="apply">
      <div class="container" style="display:block;text-align:center">
        <div class="apply-box">
          <div class="apply-box-head">
            <h3>The gate</h3>
            <p>Five questions. Wizard King reads. Approval happens in Discord.</p>
            <div class="form-not-rank">A form is not a rank.</div>
          </div>

          <form class="apply-form" novalidate>
            <div class="field">
              <label for="f-handle">Discord handle or how to reach you</label>
              <input id="f-handle" name="handle" type="text" autocomplete="off" maxlength="100" required aria-describedby="hint-handle err-handle">
              <div class="field-hint" id="hint-handle">A handle is enough. No real name needed.</div>
              <div class="field-error" id="err-handle" aria-live="polite"></div>
            </div>
            <div class="field">
              <label for="f-building">What are you building or working on right now?</label>
              <textarea id="f-building" name="building" rows="3" maxlength="1000" required aria-describedby="err-building"></textarea>
              <div class="field-error" id="err-building" aria-live="polite"></div>
            </div>
            <div class="field">
              <label for="f-ai">What is your relationship with SI? How do you use it?</label>
              <textarea id="f-ai" name="ai" rows="3" maxlength="1000" required aria-describedby="err-ai"></textarea>
              <div class="field-error" id="err-ai" aria-live="polite"></div>
            </div>
            <div class="field">
              <label for="f-intel">What does intelligence mean to you?</label>
              <textarea id="f-intel" name="intel" rows="3" maxlength="1000" required aria-describedby="err-intel"></textarea>
              <div class="field-error" id="err-intel" aria-live="polite"></div>
            </div>
            <div class="field">
              <label for="f-found">How did you find the Clover Kingdom?</label>
              <textarea id="f-found" name="found" rows="2" maxlength="500" required aria-describedby="err-found"></textarea>
              <div class="field-error" id="err-found" aria-live="polite"></div>
            </div>
            <div class="apply-privacy" id="apply-privacy">
              What you send passes through Cloudflare to a private intake. It is read by Saint Chevalier, Wizard King and his SI helpers. We keep it only as long as needed. You can ask us to delete it at any time by messaging Saint Chevalier on X, @Saint_Chevalier. Do not send passwords, ID numbers, or anything you are not comfortable sharing.
            </div>
            <div class="apply-consent">
              <input id="f-consent" name="consent" type="checkbox" required aria-describedby="apply-privacy err-consent">
              <label for="f-consent">I understand what I send is read by Saint Chevalier, Wizard King and his SI helpers, and I agree.</label>
            </div>
            <div class="field-error" id="err-consent" aria-live="polite"></div>
            <button type="submit" class="apply-submit">Apply</button>
          </form>

          <div class="apply-note">
            A form is not a rank.<br>
            Approval is Discord, or you talk to Saint Chevalier.<br>
            Find us on the <a href="#/links">Links</a> page.
          </div>
        </div>

        <div class="sage-mouth" id="sage-mouth">
          <div class="sage-mouth-head">
            <div class="sage-mouth-mark">
              <img src="images/crest.svg" alt="" aria-hidden="true">
            </div>
            <div>
              <div class="sage-mouth-name">SAGE</div>
              <div class="sage-mouth-tag">Public teacher mouth · summoned, not ambient</div>
            </div>
          </div>
          <div class="sage-mouth-body" id="sage-body">
            <span class="placeholder">Summon a question. SAGE answers from what it is allowed to hold. This mouth is public. It is not your Sage.</span>
          </div>
          <form class="sage-mouth-form" id="sage-form">
            <input class="sage-mouth-input" id="sage-input" type="text" placeholder="Ask SAGE something" aria-label="Ask SAGE something" autocomplete="off">
            <button class="sage-mouth-send" type="submit">Ask</button>
          </form>
          <div class="sage-mouth-foot">
            SAGE lives past the gate. This mouth teaches in public.<br>
            Your Sage is summoned after you apply.
          </div>
        </div>

      </div>
    </section>
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
  "Everyone is welcome. The house rules live in #rules on the Discord. Read them when you join. Breaking them puts your place in the Kingdom at risk.",
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
          whether the seat is worth the effort. The Wizard King reads it.
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
            <span class="rank-desc">The one who has applied and is reading the seat. Until commissioned otherwise.</span>
          </li>
          <li>
            <span class="rank-name">Magic Knight</span>
            <span class="rank-desc">Earned through work inside the Kingdom — trials, glyphs, real contribution.</span>
          </li>
          <li>
            <span class="rank-name">Squad Leader</span>
            <span class="rank-desc">Holds a lane and carries others in it. Not appointed by applause.</span>
          </li>
          <li>
            <span class="rank-name">Wizard King</span>
            <span class="rank-desc">The one who holds the wheel. Saint Chevalier.</span>
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
       <div class="offer-row"><h3 class="offer-name">Meet the helper</h3><p class="offer-text"><a href="#/archetype/tek-tribe">Tek Tribe</a> is one of the archetypes. <a href="#/archetype/argus">ARGUS</a> is the tek scout that grades tools.</p></div>
     </div>
     <div class="cta-row cta-left">${DISCORD_BUTTON()}</div>`);
  return wrap;
}

function buildJoin() {
  const steps = JOIN_STEPS.map((st, i) =>
    `<li class="join-step"><span class="join-num">${i + 1}</span><div><h3 class="offer-name">${escHtml(st.name)}</h3><p class="offer-text">${escHtml(st.text)}</p></div></li>`).join("");
  const wrap = pageShell("Join", "How to join",
    "Four steps. Everyone is welcome. A form is not a rank, and approval comes through Discord or a conversation.",
    `<ol class="join-steps">${steps}</ol>
     <div class="cta-row cta-left">${DISCORD_BUTTON()}${APPLY_BUTTON}</div>
     <p class="muted" style="margin-top:20px">Please read the <a href="#/welcome">welcome page</a> first. It is short.</p>`);
  wirePageButtons(wrap);
  return wrap;
}

function buildWelcome() {
  return pageShell("Everyone is welcome", "Welcome and the house rules",
    "Come as you are. The house rules live on the Discord.",
    `<div class="law-block">The house rules live in #rules on the Discord. Read them when you join. Breaking them puts your place in the Kingdom at risk.</div>
     <div class="offer-rows">
       <div class="offer-row"><h3 class="offer-name">Behaviour</h3><p class="offer-text">Beyond the house rules, the Kingdom keeps a high standard for how people behave, not for who they are. You can read it on <a href="#/standard">The Standard</a>.</p></div>
       <div class="offer-row"><h3 class="offer-name">What you send us</h3><p class="offer-text">What you send in the Apply form passes through Cloudflare to a private intake. It is read by Saint Chevalier, Wizard King and his SI helpers. We keep it only as long as needed. Please do not send passwords, ID numbers, or anything you are not comfortable sharing.</p></div>
       <div class="offer-row"><h3 class="offer-name">Report a problem</h3><p class="offer-text">If you see someone breaking the house rules, someone being unkind or pressuring you, anyone asking for private details, or anything that worries you, send a direct message to the Wizard King on the Clover Kingdom Discord. A real person reads every report. Breaking the house rules puts your place in the Kingdom at risk. If someone may be in danger, the report is handed to a human right away.</p></div>
       <div class="offer-row"><h3 class="offer-name">Deleting your data</h3><p class="offer-text">Anyone can ask for their data to be deleted the same way: send a direct message to the Wizard King on the Clover Kingdom Discord. You can also message Saint Chevalier on X, @Saint_Chevalier. You can do either at any time.</p></div>
     </div>
     <p class="muted" style="margin-top:20px">Ready? <a href="#/join">See how to join</a>.</p>`);
}

function buildMembers() {
  const wrap = pageShell("Coming soon", "Members area",
    "A members area is planned. It is not built yet, so there is nothing to sign in to today.",
    `<div class="soon-badge">Coming soon</div>
     <div class="offer-rows">
       <div class="offer-row"><h3 class="offer-name">Archetype alignment</h3><p class="offer-text">Choose which archetypes you align with and want to help make.</p></div>
       <div class="offer-row"><h3 class="offer-name">Tek stacks</h3><p class="offer-text">Say which sovereign tek stacks you run and help with.</p></div>
       <div class="offer-row"><h3 class="offer-name">Ideas and feedback</h3><p class="offer-text">Send project ideas and feedback. Feedback from a signed-in member is trusted because you are known.</p></div>
       <div class="offer-row"><h3 class="offer-name">Connections by personal code</h3><p class="offer-text">Connect with other members by personal code. Nothing is browsable. A request goes through only if you know the other person and enter their code.</p></div>
       <div class="offer-row"><h3 class="offer-name">Members-only intelligence</h3><p class="offer-text">Tek intelligence the House has compiled for the Kingdom family will live here, for members only.</p></div>
     </div>
     <p class="muted" style="margin-top:20px">Want to be there when it opens? <a href="#/join">Join and apply</a>.</p>`);
  return wrap;
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
    "SI helpers with one job each, so no one has to be everything. Not every helper is open to talk yet.",
    `<div class="arch-grid">${archetypeCardsHtml()}</div>`);
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
          <div class="offer-row"><h3 class="offer-name">How to talk to it</h3><p class="offer-text">Join the Discord and ask. Not every helper is open to talk yet, so ask there which ones are.</p></div>
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
  cancelRitual();
  main.innerHTML = "";
  if (shouldSkip()) {
    main.appendChild(buildGate());
    wireGate(main);
    return;
  }
  main.appendChild(buildFilmScene());
  const book = buildBookScene();
  main.appendChild(book);

  const grimoire = book.querySelector(".grimoire");
  const landBook = () => grimoire.classList.add("landed");

  const video = main.querySelector("video");
  if (video) {
    video.addEventListener("ended", landBook, { once: true });
    if (prefersReducedMotion) ritual.timers.push(setTimeout(landBook, 200));
  } else {
    ritual.timers.push(setTimeout(landBook, 2000));
  }

  ritual.check = setInterval(() => {
    // The visitor left (Skip, nav, or another render): stop quietly.
    if (!document.body.contains(grimoire)) { cancelRitual(); return; }
    if (grimoire.classList.contains("landed")) {
      clearInterval(ritual.check);
      ritual.check = null;
      ritual.timers.push(setTimeout(() => {
        ritual.timers = [];
        if (!document.body.contains(grimoire)) return;
        main.innerHTML = "";
        main.appendChild(buildGate());
        markSkipped(); // ritual played once this session; do not replay on every Gate click
        wireGate(main);
      }, 900));
    }
  }, 120);
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

function wireApplyForm(container) {
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
  const fieldEl = (k) => form.querySelector("#f-" + k);
  const errEl = (k) => form.querySelector("#err-" + k);
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
      status.textContent = "Received. Saint Chevalier has your application. It is not approved yet; approval comes through Discord or a conversation.";
      form.reset();
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
   Nav wiring
   ------------------------------------------------ */
const SUBPAGES = {
  "#/sage": () => buildSage(),
  "#/standard": () => buildStandard(),
  "#/ranks": () => buildRanks(),
  "#/glyphs": () => buildGlyphs(),
  "#/links": () => buildLinks(),
  "#/offers": () => buildOffers(),
  "#/tek": () => buildTek(),
  "#/join": () => buildJoin(),
  "#/welcome": () => buildWelcome(),
  "#/members": () => buildMembers(),
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
  "#/tek": "Tek Tribe and Tek Stacks | CLOVER KINGDOM",
  "#/join": "How to join | CLOVER KINGDOM",
  "#/welcome": "Welcome and the house rules | CLOVER KINGDOM",
  "#/members": "Members area (coming soon) | CLOVER KINGDOM",
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
  const more = document.querySelector(".nav-more");
  if (more) more.classList.toggle("has-current", !!more.querySelector('a[aria-current="page"]'));
}

function routeFromHash() {
  const page = window.location.hash || "#/";
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

window.addEventListener("DOMContentLoaded", () => {
  wireNav();
  wireBgSound();
  routeFromHash();
});
