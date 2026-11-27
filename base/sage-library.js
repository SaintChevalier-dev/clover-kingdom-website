/* Sage's Library section inside Sage's chat scroll (CSP-safe external file). The five-leaf clover glyph button
   (#sage-book, wired by sage-book.js) opens the scroll; clicking 3D Sage (ckw:sage-touch) opens the scroll and this section. Ask: answers only from the verified library, with citations.
   Propose: logged-in members send an entry; the Knight checks it and the Paragon agent writes it to the E: library.
   Jacob's account also sees flagged entries and can approve or deny them. All text is rendered with textContent. */
(function () {
  "use strict";
  var meta = function (n) { var m = document.querySelector('meta[name="' + n + '"]'); return m ? m.getAttribute("content") : ""; };
  var API = (meta("ck-sage-library-api") || "").replace(/\/$/, "");
  var PASS_URL = meta("ck-sage-pass-url");
  if (!API) return;
  var pass = null, me = null;

  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
  function api(path, opts) {
    opts = opts || {}; var h = { "Content-Type": "application/json" };
    if (pass) h.Authorization = "Bearer " + pass;
    return fetch(API + path, { method: opts.method || "GET", headers: h, body: opts.body ? JSON.stringify(opts.body) : undefined })
      .then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { j._status = r.status; return j; }); })
      .catch(function () { return { _status: 0, error: "Sage's library didn't answer. Try again in a moment." }; });
  }
  // Public mode never depends on login: the pass is asked for ONLY when base.js has already shown a signed-in
  // session (logout button marked data-signedin), and only for the member-only Propose / flagged tools.
  function signedIn() { var b = document.getElementById("logout-btn"); return !!(b && b.dataset.signedin === "1"); }
  function getPass() {
    if (!PASS_URL || !signedIn()) { pass = null; me = null; return Promise.resolve(null); }
    return fetch(PASS_URL, { credentials: "include" }).then(function (r) { return r.ok ? r.json() : null; })
      .then(function (j) { if (j && j.pass) { pass = j.pass; me = { name: j.name, owner: !!j.owner }; } else { pass = null; me = null; } return me; })
      .catch(function () { pass = null; me = null; return null; });
  }

  // ---- build the library section INSIDE Sage's chat scroll (#sage-scroll); the clover glyph button opens the scroll ----
  var scroll = document.getElementById("sage-scroll");
  var glyph = document.getElementById("sage-book");
  if (!scroll) return;
  var panel = el("details", "sl-panel"); panel.id = "sage-lib";
  var sum = el("summary", "sl-title", "Sage's Library: ask what's verified"); panel.appendChild(sum);
  panel.appendChild(el("p", "sl-note", "Here I answer only from what the Kingdom has verified and written down, and I show where each answer comes from."));

  var askF = el("form", "sl-ask"); askF.id = "sl-ask";
  var askI = el("input"); askI.id = "sl-q"; askI.type = "text"; askI.maxLength = 300; askI.placeholder = "Ask the library"; askI.setAttribute("aria-label", "Ask the library");
  var askB = el("button", "sl-btn", "Ask"); askB.type = "submit";
  askF.appendChild(askI); askF.appendChild(askB); panel.appendChild(askF);
  var out = el("div", "sl-out"); out.id = "sl-out"; out.setAttribute("aria-live", "polite"); panel.appendChild(out);

  var propWrap = el("details", "sl-propose"); propWrap.id = "sl-propose";
  propWrap.appendChild(el("summary", null, "Propose an entry"));
  var propNote = el("p", "sl-small"); propNote.id = "sl-prop-note"; propWrap.appendChild(propNote);
  var pf = el("form", "sl-pform"); pf.id = "sl-pform";
  var pt = el("input"); pt.id = "sl-ptitle"; pt.maxLength = 140; pt.placeholder = "Title"; pt.setAttribute("aria-label", "Entry title");
  var pb = el("textarea"); pb.id = "sl-pbody"; pb.maxLength = 4000; pb.rows = 4; pb.placeholder = "What should the library keep? Facts only."; pb.setAttribute("aria-label", "Entry text");
  var ps = el("textarea"); ps.id = "sl-psources"; ps.rows = 2; ps.placeholder = "Sources, one per line (https link or known Kingdom file)"; ps.setAttribute("aria-label", "Sources");
  var pgo = el("button", "sl-btn", "Send to the Knight"); pgo.type = "submit";
  [pt, pb, ps, pgo].forEach(function (x) { pf.appendChild(x); });
  propWrap.appendChild(pf);
  var receipt = el("div", "sl-receipt"); receipt.id = "sl-receipt"; receipt.setAttribute("aria-live", "polite"); propWrap.appendChild(receipt);
  panel.appendChild(propWrap);

  var flagWrap = el("div", "sl-flags"); flagWrap.id = "sl-flags"; flagWrap.hidden = true; panel.appendChild(flagWrap);
  var anchor = document.getElementById("guest-card");
  scroll.insertBefore(panel, anchor && anchor.parentNode === scroll ? anchor : null);

  // ---- behaviour ----
  var loaded = false;
  function refreshMember() {
    return getPass().then(function (m) {
      pf.hidden = !m;
      propNote.textContent = m ? "Signed in as " + m.name + ". The Knight checks every entry: it needs a source, can't repeat or contradict the library, and secrets are removed." : "Log in (top of the page) to propose an entry.";
      if (m && m.owner) loadFlags(); else flagWrap.hidden = true;
    });
  }
  propWrap.addEventListener("toggle", function () { if (propWrap.open && !loaded) { loaded = true; refreshMember(); } });
  panel.addEventListener("toggle", function () { if (panel.open) { setTimeout(function () { askI.focus(); }, 0); if (signedIn() && !loaded) { loaded = true; refreshMember(); } } });
  function open() {
    if (scroll.hidden && glyph && !glyph.hidden) glyph.click();
    if (scroll.hidden) { scroll.hidden = false; }
    panel.open = true;
  }
  function shut() { panel.open = false; }
  window.addEventListener("ckw:sage-touch", function () { open(); });

  function cite(c) {
    var li = el("li", "sl-cite");
    li.appendChild(el("strong", null, c.id + " "));
    li.appendChild(document.createTextNode(c.title));
    var s = el("span", "sl-src", " Sources: " + (c.sources || []).join(", ")); li.appendChild(s);
    return li;
  }
  askF.addEventListener("submit", function (e) {
    e.preventDefault(); var q = askI.value.trim(); if (!q) return;
    out.textContent = "Looking in the library\u2026";
    api("/library/ask?q=" + encodeURIComponent(q)).then(function (j) {
      out.textContent = "";
      var a = el("p", j.found ? "sl-answer" : "sl-answer sl-none", j.answer || j.error || "No answer."); a.id = "sl-answer"; out.appendChild(a);
      if (j.citations && j.citations.length) { var ul = el("ul", "sl-cites"); ul.id = "sl-cites"; j.citations.forEach(function (c) { ul.appendChild(cite(c)); }); out.appendChild(ul); }
    });
  });

  var lastPid = null;
  function showReceipt(j) {
    receipt.textContent = "";
    var st = j.status || (j.error ? "error" : "unknown");
    var line = el("p", "sl-status sl-" + st, st === "queued" ? "Queued for the Knight on Paragon." : st === "written" ? "Written to the library as " + j.entry_id + "." :
      st === "flagged" ? "Held for Jacob: it clashes with a verified entry." : st === "rejected" ? "Rejected by the Knight." : st === "refused" ? "Refused by the Knight." : (j.error || st));
    line.id = "sl-status"; line.setAttribute("data-status", st); receipt.appendChild(line);
    (j.reasons || []).forEach(function (r) { receipt.appendChild(el("p", "sl-reason", "\u2022 " + r)); });
    if (j.sealed && j.sealed.length) receipt.appendChild(el("p", "sl-reason sl-sealed", "\u2022 Removed before saving: " + j.sealed.join(", ")));
    if (lastPid && (st === "queued")) { var b = el("button", "sl-btn sl-small-btn", "Check again"); b.type = "button"; b.id = "sl-recheck"; b.addEventListener("click", recheck); receipt.appendChild(b); }
  }
  function recheck() { if (lastPid) getPass().then(function () { api("/library/status/" + lastPid).then(showReceipt); }); }
  pf.addEventListener("submit", function (e) {
    e.preventDefault();
    var body = { title: pt.value.trim(), body: pb.value.trim(), sources: ps.value.split(/\n+/).map(function (s) { return s.trim(); }).filter(Boolean) };
    getPass().then(function () {
      if (!pass) { showReceipt({ error: "Log in to propose an entry." }); return; }
      api("/library/propose", { method: "POST", body: body }).then(function (j) { lastPid = j.proposal_id || null; receipt.setAttribute("data-pid", lastPid || ""); showReceipt(j); });
    });
  });

  function loadFlags() {
    api("/library/flagged").then(function (j) {
      flagWrap.textContent = ""; flagWrap.hidden = false;
      flagWrap.appendChild(el("h3", null, "Flagged for you"));
      var list = (j && j.flagged) || [];
      if (!list.length) { flagWrap.appendChild(el("p", "sl-small", "Nothing waiting.")); return; }
      list.forEach(function (f) {
        var card = el("div", "sl-flag"); card.setAttribute("data-flag", f.flag_id);
        card.appendChild(el("p", "sl-flag-title", f.title + " (from " + f.by + ")"));
        card.appendChild(el("p", "sl-small", f.body));
        (f.reasons || []).forEach(function (r) { card.appendChild(el("p", "sl-reason", "\u2022 " + r)); });
        if (f.clash) card.appendChild(el("p", "sl-reason", "Library says: " + f.clash.theirs));
        ["approve", "deny"].forEach(function (d) {
          var b = el("button", "sl-btn sl-small-btn", d === "approve" ? "Approve (replaces the old entry)" : "Deny"); b.type = "button"; b.className += " sl-" + d;
          b.addEventListener("click", function () { api("/library/decide", { method: "POST", body: { flag_id: f.flag_id, decision: d } }).then(function (r) { card.appendChild(el("p", "sl-status", r.ok ? "Decision queued. Paragon applies it at the next sync." : (r.error || "Failed."))); }); });
          card.appendChild(b);
        });
        flagWrap.appendChild(card);
      });
    });
  }
  window.CKWSageLibrary = { open: open, close: shut };
})();
