/* Seats in the Webverse: day-one doors from content/seats.json, plus an honest
   DRAGON placeholder until that design is written down. No made-up faces. */
(function () {
  "use strict";

  const SEATS_URL = "/content/seats.json";
  const SEAT_IDS = ["painter", "xtt", "knight", "sage"];
  const INITIALS = { painter: "PA", xtt: "TT", knight: "KN", sage: "SG", dragon: "DR" };
  const PLACE = { painter: { x: -2.05, z: 0.85 }, xtt: { x: -1.7, z: -0.85 }, knight: { x: 1.7, z: -0.85 }, dragon: { x: 2.05, z: 0.85 } };
  const RESERVED = { talk: 1, chat: 1, "sage-book": 1, login: 1, doors: 1 };

  const nav = document.getElementById("wv-seats");
  const plaque = document.getElementById("wv-plaque");
  if (!nav || !plaque) return;

  const titleEl = document.getElementById("wv-plaque-title");
  const kickerEl = document.getElementById("wv-plaque-kicker");
  const bodyEl = document.getElementById("wv-plaque-body");
  const linksEl = document.getElementById("wv-plaque-links");
  const closeBtn = document.getElementById("wv-plaque-close");

  let seats = {};
  let current = "";
  const order = SEAT_IDS.concat(["dragon"]);

  const DRAGON = {
    id: "dragon",
    heading: "DRAGON",
    kicker: "Not written yet",
    paragraphs: [
      "DRAGON's part of the Webverse is not written down yet. The design stays with DRAGON until it is.",
      "This standing stone is only a placeholder, so the seat is marked in the world without inventing the look."
    ],
    items: [],
    links: []
  };

  function initialsFor(id) { return INITIALS[id] || (id || "").slice(0, 2).toUpperCase(); }

  function buildNav() {
    nav.textContent = "";
    const label = document.createElement("p");
    label.className = "wv-seats-label";
    label.textContent = "Seats";
    nav.appendChild(label);
    const list = document.createElement("ul");
    order.forEach((id) => {
      const rec = seats[id];
      if (!rec) return;
      const li = document.createElement("li");
      const b = document.createElement("button");
      b.type = "button";
      b.className = "wv-seat-btn" + (id === "dragon" ? " wv-seat-stub" : "");
      b.setAttribute("data-seat", id);
      b.setAttribute("aria-pressed", "false");
      const mark = document.createElement("span");
      mark.className = "wv-seat-initials";
      mark.textContent = initialsFor(id);
      const name = document.createElement("span");
      name.className = "wv-seat-name";
      name.textContent = rec.heading;
      b.appendChild(mark);
      b.appendChild(name);
      b.addEventListener("click", () => openSeat(id, true));
      li.appendChild(b);
      list.appendChild(li);
    });
    nav.appendChild(list);
  }

  function setPressed(id) {
    nav.querySelectorAll("[data-seat]").forEach((b) => {
      b.setAttribute("aria-pressed", b.getAttribute("data-seat") === id ? "true" : "false");
    });
  }

  function openSeat(id, setHash) {
    const rec = seats[id];
    if (!rec) return;
    current = id;
    setPressed(id);
    titleEl.textContent = rec.heading || id;
    const kicker = (rec.kicker || "").trim();
    if (kickerEl) {
      kickerEl.textContent = kicker;
      kickerEl.hidden = !kicker;
    }
    const lines = [];
    (rec.paragraphs || []).forEach((p) => { if (p && String(p).trim()) lines.push(String(p).trim()); });
    (rec.items || []).forEach((p) => { if (p && String(p).trim()) lines.push(String(p).trim()); });
    bodyEl.textContent = "";
    lines.forEach((line) => {
      const p = document.createElement("p");
      p.textContent = line;
      bodyEl.appendChild(p);
    });
    linksEl.textContent = "";
    (rec.links || []).forEach((lnk) => {
      if (!lnk || !lnk.href || !lnk.label) return;
      const a = document.createElement("a");
      a.href = lnk.href;
      a.textContent = lnk.label;
      if (/^https?:/i.test(lnk.href)) { a.target = "_blank"; a.rel = "noopener noreferrer"; }
      linksEl.appendChild(a);
    });
    if (id === "sage") {
      const talk = document.createElement("button");
      talk.type = "button";
      talk.className = "wv-plaque-talk";
      talk.textContent = "Talk with Sage";
      talk.addEventListener("click", () => {
        if (window.CKWSageBook && typeof window.CKWSageBook.open === "function") window.CKWSageBook.open();
        else if (window.CKWSageChat && typeof window.CKWSageChat.start === "function") {
          const book = document.getElementById("sage-book");
          if (book) book.click();
        }
      });
      linksEl.appendChild(talk);
    } else if (id !== "dragon") {
      const more = document.createElement("a");
      more.href = "/seats/#" + encodeURIComponent(id);
      more.textContent = "Day-one seats";
      linksEl.appendChild(more);
    }
    plaque.hidden = false;
    plaque.setAttribute("aria-hidden", "false");
    if (window.__CKW_SAGE3D && typeof window.__CKW_SAGE3D.highlightSeat === "function") {
      window.__CKW_SAGE3D.highlightSeat(id);
    }
    if (setHash) {
      const next = "#" + id;
      if (location.hash !== next) history.replaceState(null, "", next);
    }
  }

  function closePlaque(clearHash) {
    current = "";
    setPressed("");
    plaque.hidden = true;
    plaque.setAttribute("aria-hidden", "true");
    if (window.__CKW_SAGE3D && typeof window.__CKW_SAGE3D.highlightSeat === "function") {
      window.__CKW_SAGE3D.highlightSeat("");
    }
    if (clearHash) {
      const h = (location.hash || "").replace(/^#/, "").toLowerCase();
      if (seats[h] && !RESERVED[h]) history.replaceState(null, "", location.pathname + location.search);
    }
  }

  function applyHash() {
    const raw = location.hash || "";
    if (/^#\/me(\?|$)/.test(raw)) return;
    const id = raw.replace(/^#/, "").toLowerCase();
    if (!id || RESERVED[id]) {
      if (id !== "talk" && id !== "chat" && id !== "sage-book") closePlaque(false);
      return;
    }
    if (seats[id]) openSeat(id, false);
  }

  function place3D() {
    const api = window.__CKW_SAGE3D;
    if (!api || typeof api.addSeatDoor !== "function") return;
    const home = typeof api.seatHome === "function" ? api.seatHome() : { tx: 0.05, tz: 1.4, narrow: false };
    const scale = home.narrow ? 0.85 : 1;
    order.forEach((id) => {
      if (id === "sage") return; /* Sage is already standing in the courtyard */
      const rec = seats[id];
      if (!rec) return;
      const pos = PLACE[id] || { x: 0, z: 0 };
      api.addSeatDoor({ id: id, initials: initialsFor(id), stub: id === "dragon", x: pos.x * scale, z: pos.z * scale });
    });
  }

  if (closeBtn) closeBtn.addEventListener("click", () => closePlaque(true));
  window.addEventListener("ckw:seat-pick", (e) => {
    const id = e && e.detail && e.detail.id;
    if (id) openSeat(id, true);
  });
  window.addEventListener("hashchange", applyHash);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !plaque.hidden && !document.body.classList.contains("sage-open")) {
      e.preventDefault();
      closePlaque(true);
      return;
    }
    const tag = (e.target && e.target.tagName) || "";
    if (tag === "INPUT" || tag === "TEXTAREA" || (e.target && e.target.isContentEditable)) return;
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    const n = { "1": "painter", "2": "xtt", "3": "knight", "4": "sage", "5": "dragon" }[e.key];
    if (n && seats[n]) openSeat(n, true);
  });

  closePlaque(false);

  fetch(SEATS_URL, { credentials: "same-origin" })
    .then((r) => r.ok ? r.json() : Promise.reject())
    .then((data) => {
      (data && data.sections ? data.sections : []).forEach((s) => {
        if (s && SEAT_IDS.indexOf(s.id) !== -1) seats[s.id] = s;
      });
      seats.dragon = DRAGON;
      buildNav();
      const place = () => place3D();
      if (window.__CKW_SAGE3D) place();
      else window.addEventListener("ckw:sage3d-ready", place, { once: true });
      applyHash();
    })
    .catch(() => {
      /* If seats.json fails, still show the honest DRAGON stone and Sage. */
      seats = {
        sage: { id: "sage", heading: "Sage", kicker: "", paragraphs: ["Teacher of the Clover Kingdom."], items: [], links: [{ label: "Talk with her", href: "/" }] },
        dragon: DRAGON
      };
      buildNav();
      applyHash();
    });
})();
