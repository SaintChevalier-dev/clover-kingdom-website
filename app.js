/* ============================================================
   CLOVER KINGDOM — ritual + routing + Sage mouth (v1)
   ============================================================ */

const STORAGE_KEY_SKIP = "ck_ritual_skipped_v1";
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
   Build: gate (name + apply box + offer shelf + Sage mouth)
   ------------------------------------------------ */
function buildGate() {
  const wrap = document.createElement("div");
  wrap.className = "gate-screen";

  wrap.innerHTML = `
    <section class="gate">
      <div class="container" style="display:block;text-align:center">
        <div class="gate-name">CLOVER<span> KINGDOM</span></div>
        <div class="gate-sub">The public front door</div>
        <div class="gate-rule">
          The truth is always remembered, for it always existed.<br>
          This is a place, not a landing page. Say the name, then use the box.
        </div>

        <div class="apply-box">
          <div class="apply-box-head">
            <h3>The gate</h3>
            <p>Five questions. Wizard King reads. Approval happens in Discord.</p>
            <div class="form-not-rank">A form is not a rank.</div>
          </div>

          <form class="apply-form" novalidate>
            <div class="field">
              <label for="f-handle">Name / Discord handle</label>
              <input id="f-handle" name="handle" type="text" autocomplete="handle" required>
            </div>
            <div class="field">
              <label for="f-building">What are you building or working on right now?</label>
              <textarea id="f-building" name="building" rows="3" required></textarea>
            </div>
            <div class="field">
              <label for="f-ai">What is your relationship with AI? How do you use it?</label>
              <textarea id="f-ai" name="ai" rows="3" required></textarea>
            </div>
            <div class="field">
              <label for="f-intel">What does intelligence mean to you?</label>
              <textarea id="f-intel" name="intel" rows="3" required></textarea>
            </div>
            <div class="field">
              <label for="f-found">How did you find the Clover Kingdom?</label>
              <textarea id="f-found" name="found" rows="2" required></textarea>
            </div>
            <button type="submit" class="apply-submit">Apply</button>
          </form>

          <div class="apply-privacy">
            For adults, 18 or older. What you write here passes through Cloudflare to a private intake that Saint Chevalier and Wizard King read to decide on your application. Do not put passwords, ID numbers or anything private in the form.
          </div>

          <div class="apply-note">
            There is no open invite URL here. A form is not a rank.<br>
            Approval is Discord — or you talk to Saint Chevalier.
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
            <input class="sage-mouth-input" id="sage-input" type="text" placeholder="Ask SAGE something" autocomplete="off">
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
  "A sovereign AI is one you own, that outlives you, that operates on your terms. Not a chatbot you lease.",
  "The stack starts with one folder. One AI. One doctrine file. Then it compounds. Ten subscriptions never built the base.",
  "Readability is the whole game. If it is locked in neural weights, it cannot be examined, improved, or taught. Written folders are readable.",
  "The gate is not a funnel. It is a standard. A form is not a rank. Applying asks whether the seat is worth the effort.",
  "The five-leaf black clover is forged by violation, not birth. Black is absorption and protection, not display.",
  "Correction is positive. Brutal honesty is an eternal rule. If you lie in the Apply box, you have already answered the question.",
  "Scroll Lite is the graduation, not the onboarding. You earn it when you understand why you need it.",
  "The kingdom is a school. The Discord is the classroom. The AIs are the teachers. The students become the teachers.",
  "Disk first, site second. The website is a filtered mirror. The disk is the brain. Never the other way around.",
  "Showing up is the only requirement. The rest is earned.",
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
    // answers from the public-intel spine, not from disk or Paragon.
    const answer = pickSageResponse(question);
    body.innerHTML = `<span>${answer}</span>`;
    body.classList.add("speaking");
    setTimeout(() => body.classList.remove("speaking"), 450);
  });
}

function pickSageResponse(question) {
  const q = question.toLowerCase();
  if (q.includes("sovereign") || q.includes("own") || q.includes("own it")) {
    return SAGE_RESPONSES[0];
  }
  if (q.includes("stack") || q.includes("start") || q.includes("build") || q.includes("how")) {
    return SAGE_RESPONSES[6];
  }
  if (q.includes("read") || q.includes("written") || q.includes("folder") || q.includes("file")) {
    return SAGE_RESPONSES[2];
  }
  if (q.includes("gate") || q.includes("apply") || q.includes("rank") || q.includes("form")) {
    return SAGE_RESPONSES[3];
  }
  if (q.includes("clover") || q.includes("five") || q.includes("black")) {
    return SAGE_RESPONSES[4];
  }
  if (q.includes("truth") || q.includes("honest") || q.includes("lie") || q.includes("correction")) {
    return SAGE_RESPONSES[5];
  }
  if (q.includes("scroll") || q.includes("lite") || q.includes("graduate") || q.includes("learn")) {
    return SAGE_RESPONSES[6];
  }
  if (q.includes("kingdom") || q.includes("school") || q.includes("discord") || q.includes("teacher")) {
    return SAGE_RESPONSES[7];
  }
  if (q.includes("disk") || q.includes("mirror") || q.includes("public") || q.includes("board")) {
    return SAGE_RESPONSES[8];
  }
  return SAGE_RESPONSES[9];
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
          It is not a Discord lobby. It is not open to everyone. It is a gate with a
          seat behind it.
        </div>
        <div class="law-block">
          This is not a church brochure. Not anime merch. Not cosplay. Not a fan site.
          Not crypto. Not a token. Not a SaaS tool. The figure on the door is
          Saint Chevalier — closed helmet, red eyes, obsidian, gold cross, horns,
          halo between and above the horns. A standard made visible.
        </div>
        <div class="law-block">
          A form is not a rank. Applying does not make you a Magic Knight. It asks
          whether the seat is worth the effort. The Wizard King reads it.
        </div>
        <div class="law-block">
          Scroll Lite lives at its own address. It is not this door, and this door is
          not it. The invite code is GIVEN, not billed on the public page.
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
            <span class="rank-desc">The one who holds the wheel. Jacob Andrew Chevalier. Saint Chevalier.</span>
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

/* ------------------------------------------------
   Main render — decides ritual or gate
   ------------------------------------------------ */
const main = document.getElementById("page-content");

function renderMain() {
  main.innerHTML = "";
  if (shouldSkip()) {
    main.appendChild(buildGate());
    wireApplyForm(main);
    wireSageMouth(main);
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
    if (prefersReducedMotion) setTimeout(landBook, 200);
  } else {
    setTimeout(landBook, 2000);
  }

  const check = setInterval(() => {
    if (grimoire && grimoire.classList.contains("landed")) {
      clearInterval(check);
      setTimeout(() => {
        main.innerHTML = "";
        const gate = buildGate();
        main.appendChild(gate);
        markSkipped(); // ritual played once this session; do not replay on every Gate click
        wireApplyForm(main);
        wireSageMouth(main);
      }, 900);
    }
  }, 120);
}

/* ------------------------------------------------
   Apply form wiring
   ------------------------------------------------ */
function wireApplyForm(container) {
  const form = container.querySelector(".apply-form");
  if (!form) return;
  const RELAY = "https://clover-apply-relay.cloverkingdom.workers.dev";
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
  let sending = false;
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (sending) return;
    const data = new FormData(form);
    const payload = {
      handle: data.get("handle"),
      building: data.get("building"),
      ai: data.get("ai"),
      intel: data.get("intel"),
      found: data.get("found"),
      website: data.get("website") || "",
      timestamp: new Date().toISOString(),
    };
    sending = true;
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
    } finally {
      sending = false;
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
};

function routeFromHash() {
  const page = window.location.hash || "#/";
  const main = document.getElementById("page-content");
  main.innerHTML = "";
  stopSceneCycleIfAny();
  if (SUBPAGES[page]) {
    main.appendChild(SUBPAGES[page]());
    window.scrollTo(0, 0);
  } else {
    renderMain();
  }
}

function stopSceneCycleIfAny() { /* scenes keep running behind the page by design */ }

function wireNav() {
  // One router for everything: nav links, back links and the browser's own back button
  // all change the hash, and the hash decides the page.
  window.addEventListener("hashchange", routeFromHash);
  document.querySelectorAll(".site-nav-links a").forEach((a) => {
    a.addEventListener("click", () => {
      // Clicking the page you are already on: re-render it (hashchange will not fire).
      if (a.getAttribute("href") === (window.location.hash || "#/")) routeFromHash();
    });
  });

  const logo = document.getElementById("site-logo");
  if (logo) {
    logo.addEventListener("click", () => {
      if (window.location.hash !== "#/" && window.location.hash !== "") {
        window.location.hash = "#/";
      } else {
        routeFromHash();
      }
    });
  }
}

/* ------------------------------------------------
   Init
   ------------------------------------------------ */
const SCENES = [
  { n: 1, dot: "⬡", label: "Command · drones in the night" },
  { n: 2, dot: "⬡", label: "Grow · AI on the leafy green bed" },
  { n: 3, dot: "⬡", label: "Heal · analysis at the bedside" },
  { n: 4, dot: "⬡", label: "Build · materials in, walls up" },
  { n: 5, dot: "⬡", label: "Stand · the one who holds the wheel" },
];
let sceneIndex = 0;
let sceneTimer = null;

function showScene(n) {
  document.querySelectorAll(".scene-frame").forEach((f) => {
    f.classList.toggle("active", Number(f.dataset.scene) === n);
  });
  const s = SCENES.find((s) => s.n === n);
  if (!s) return;
  const cap = document.getElementById("scene-caption");
  if (cap) {
    cap.innerHTML = `${s.dot} ${s.label}`;
  }
}

function startSceneCycle() {
  stopSceneCycle();
  showScene(1);
  sceneTimer = setInterval(() => {
    sceneIndex = (sceneIndex % 5) + 1;
    showScene(sceneIndex);
  }, 5500);
}

function stopSceneCycle() {
  if (sceneTimer) {
    clearInterval(sceneTimer);
    sceneTimer = null;
  }
}

window.addEventListener("DOMContentLoaded", () => {
  wireNav();
  routeFromHash();
  startSceneCycle();
});

window.addEventListener("beforeunload", stopSceneCycle);

if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
  document.querySelectorAll(".scene-frame").forEach((f, i) => {
    if (i === 4) f.classList.add("active");
  });
  const cap = document.getElementById("scene-caption");
  if (cap) cap.innerHTML = `${SCENES[4].dot} ${SCENES[4].label}`;
}
