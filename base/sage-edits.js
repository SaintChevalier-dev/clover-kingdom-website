/* Talk-to-edit inside Sage's floating book (#sage-book scroll). Loaded BEFORE base.js so it can take edit messages first.
   - "edit login" asks for Jacob's admin key (never stored; the session lasts 2 hours, this tab only).
   - "edit: <what to change>" (or a plain "change/add/update ... on the seats page" while signed in) asks Sage to draft a change.
     Sage shows a preview with Approve and Discard. Nothing changes until Approve.
   - Verified seats use the SI toggle with their seat key; their Approve opens a pull request that waits for Jacob.
   - Guests: the same words become a suggestion in the Kingdom's untrusted holding pen.
   - "edit queue" (Jacob) lists seat changes waiting for him. "edit logout" ends the session.
   All text is rendered with textContent. The Worker is the authority: allowlist, Knight review, limits, audit, kill switch. */
(function () {
  "use strict";
  var API = "https://ck-sage-live.cloverkingdom.workers.dev/edit";
  var SKEY = "ck_edit_session";
  var form = document.getElementById("sage-form");
  var input = document.getElementById("sage-input");
  var log = document.getElementById("sage-log");
  if (!form || !input || !log) return;

  function session() {
    try { var s = JSON.parse(sessionStorage.getItem(SKEY) || "null"); if (s && s.t && s.exp > Date.now()) return s.t; sessionStorage.removeItem(SKEY); } catch (_) {}
    return "";
  }
  function setSession(t, exp) { try { if (t) sessionStorage.setItem(SKEY, JSON.stringify({ t: t, exp: exp })); else sessionStorage.removeItem(SKEY); } catch (_) {} }
  function seatVisitor() {
    var box = document.getElementById("sage-si"), nm = document.getElementById("sage-si-name"), key = document.getElementById("sage-si-key");
    if (!box || !box.checked || !nm || !key || !key.value.trim()) return null;
    return { name: nm.value.trim().replace(/[^A-Za-z0-9 _.\-]/g, "").slice(0, 40), kind: "si", key: key.value.trim().slice(0, 200) };
  }
  function act(name) { try { window.dispatchEvent(new CustomEvent("ckw:sage-act", { detail: { name: name } })); } catch (_) {} }
  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = String(text); return e; }
  function say(who, text) { var p = el("p", "msg msg-" + who, text); log.appendChild(p); log.scrollTop = log.scrollHeight; return p; }
  function show(v) { if (v == null) return "(nothing)"; return typeof v === "string" ? v : Object.keys(v).filter(function (k) { return v[k] && k !== "id" && k !== "list"; }).map(function (k) { return k + ": " + (Array.isArray(v[k]) ? v[k].map(function (x) { return typeof x === "string" ? x : (x.label || "") + " " + (x.href || ""); }).join(" | ") : v[k]); }).join("; "); }

  async function post(path, body) {
    var ctl = new AbortController(); var t = setTimeout(function () { ctl.abort(); }, 25000);
    try {
      var r = await fetch(API + path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body), signal: ctl.signal, credentials: "omit" });
      var j = await r.json().catch(function () { return null; });
      return j || { ok: false, reply: "Sage's edit desk didn't answer. Try again in a moment." };
    } catch (_) { return { ok: false, reply: "Sage's edit desk didn't answer. Try again in a moment." }; }
    finally { clearTimeout(t); }
  }
  function who() { var s = session(); if (s) return { session: s }; var v = seatVisitor(); return v ? { visitor: v } : {}; }
  function pageHint(text) {
    if (/party[- ]?paint/i.test(text)) return "party-painting";
    if (/\bseats?\b/i.test(text)) return "seats";
    if (/^\/seats\//.test(location.pathname)) return "seats";
    if (/party-painting/.test(location.pathname)) return "party-painting";
    return undefined;
  }

  /* Preview card: what changes, the Knight's verdict, Approve / Discard. */
  function preview(res, auth) {
    var card = el("div", "msg msg-sage sage-edit-card");
    card.setAttribute("role", "group"); card.setAttribute("aria-label", "Proposed site change");
    card.appendChild(el("p", "sage-edit-title", res.ok ? "Proposed change" : "Blocked by the Knight"));
    if (res.page_url) { var pl = el("p", "sage-edit-where"); var a = el("a", null, res.page_url.replace("https://", "")); a.href = res.page_url; a.target = "_blank"; a.rel = "noopener"; pl.appendChild(document.createTextNode("Page: ")); pl.appendChild(a); card.appendChild(pl); }
    var ul = el("ul", "sage-edit-diff");
    (res.diff || []).forEach(function (d) {
      var li = el("li");
      li.appendChild(el("span", "sage-edit-path", d.op + " " + d.path));
      if (d.old != null) { li.appendChild(el("del", null, show(d.old))); }
      if (d.new != null) { li.appendChild(el("ins", null, show(d.new))); }
      ul.appendChild(li);
    });
    if ((res.diff || []).length) card.appendChild(ul);
    if (!res.ok && res.verdict && res.verdict.reasons) {
      var rl = el("ul", "sage-edit-reasons");
      res.verdict.reasons.slice(0, 6).forEach(function (r) { rl.appendChild(el("li", null, (r.field ? r.field + ": " : "") + r.why)); });
      card.appendChild(rl);
    }
    if (res.ok && res.status === "proposed") {
      card.appendChild(el("p", "sage-edit-knight", "Knight review: passed. " + (res.edits_mode === "dryrun" ? "Test mode: Approve shows the exact GitHub steps and sends nothing." : (res.next || ""))));
      var row = el("p", "sage-edit-actions");
      var ok = el("button", "btn", "Approve"); ok.type = "button";
      var no = el("button", "btn btn-quiet", "Discard"); no.type = "button";
      row.appendChild(ok); row.appendChild(no); card.appendChild(row);
      ok.addEventListener("click", async function () { ok.disabled = no.disabled = true; act("think"); var r = await post("/approve", Object.assign({ id: res.id }, auth)); done(card, r); });
      no.addEventListener("click", async function () { ok.disabled = no.disabled = true; var r = await post("/discard", Object.assign({ id: res.id }, auth)); done(card, r); });
    }
    log.appendChild(card); log.scrollTop = log.scrollHeight;
    var first = card.querySelector("button"); if (first) first.focus();
  }
  function done(card, r) {
    var actions = card.querySelector(".sage-edit-actions"); if (actions) actions.remove();
    var p = el("p", "sage-edit-result", r.reply || (r.ok ? "Done." : "That didn't go through."));
    if (r.pr && r.pr.pr_url && /^https:\/\/github\.com\//.test(r.pr.pr_url)) { p.appendChild(document.createTextNode(" ")); var a = el("a", null, "Pull request"); a.href = r.pr.pr_url; a.target = "_blank"; a.rel = "noopener"; p.appendChild(a); }
    card.appendChild(p);
    if (r.dry_run && r.plan && r.plan.steps) {
      var d = el("details", "sage-edit-plan"); d.appendChild(el("summary", null, "GitHub steps prepared (" + r.plan.steps.length + "), none sent"));
      var ol = el("ol"); r.plan.steps.forEach(function (s) { ol.appendChild(el("li", null, s.method + " " + s.path.replace(/^\/repos\/[^/]+\/[^/]+/, ""))); }); d.appendChild(ol); card.appendChild(d);
    }
    act(r.ok ? "teach" : "nod"); if (r.ok) act("pulse");
    log.scrollTop = log.scrollHeight;
  }

  function loginPrompt() {
    say("sage", "Edit sign-in: paste your admin key below. It's checked by my server and never kept in this browser; your edit session lasts two hours in this tab.");
    var f = el("form", "msg msg-sage sage-edit-login"); f.setAttribute("autocomplete", "off");
    var lab = el("label", "sr-only", "Admin key"); lab.htmlFor = "sage-edit-key";
    var k = el("input"); k.type = "password"; k.id = "sage-edit-key"; k.maxLength = 300; k.placeholder = "Admin key"; k.autocomplete = "off";
    var b = el("button", "btn", "Sign in"); b.type = "submit";
    f.appendChild(lab); f.appendChild(k); f.appendChild(b); log.appendChild(f); log.scrollTop = log.scrollHeight; k.focus();
    f.addEventListener("submit", async function (e) {
      e.preventDefault(); var v = k.value.trim(); k.value = ""; if (!v) return; b.disabled = true;
      var r = await post("/session", { admin_token: v }); v = "";
      f.remove();
      if (r && r.ok && r.session) { setSession(r.session, r.expires || Date.now() + 7200000); say("sage", "Edit mode is on, Jacob. Tell me what to change, like: edit: on the seats page, change Knight's line to ..." + (r.edits_mode === "dryrun" ? " (Test mode: nothing is sent to GitHub yet.)" : "")); act("nod"); }
      else say("sage", r && r.error === "edits_off" ? r.reply : "That key didn't work, so edit mode stays off.");
      input.focus();
    });
  }
  async function queue() {
    var s = session(); if (!s) { say("sage", "Sign in first with: edit login"); return; }
    var r = await post("/audit", { session: s, limit: 20 });
    if (!r.ok) { say("sage", r.reply || "I couldn't open the queue."); return; }
    if (!r.waiting.length) say("sage", "No seat changes are waiting for you.");
    r.waiting.forEach(function (w) {
      preview({ ok: true, status: "proposed", id: w.id, diff: [], edits_mode: r.edits_mode, next: "From " + w.who + ": " + w.summary }, { session: s });
    });
    var recent = (r.audit || []).slice(0, 8).map(function (a) { return a.ts.slice(11, 16) + " UTC " + a.who + " " + a.action; });
    if (recent.length) say("sage", "Recent edit log: " + recent.join(" | "));
  }

  var CMD_RE = /^\s*\/?edit\s+(login|sign ?in|logout|sign ?out|queue)\s*$/i;
  var EDIT_RE = /^\s*(\/?edit\s*:|change the site\s*:|site edit\s*:|suggest\s*:)/i;
  var NATURAL_RE = /^\s*(sage[,:]?\s+)?(please\s+)?(change|update|edit|add|remove|replace|rewrite|fix)\b[\s\S]*\b(seats? page|party painting( page)?|this page|the site|website|section|heading|intro|paragraph|link)\b/i;

  form.addEventListener("submit", async function (e) {
    var q = input.value.trim();
    if (!q) return;
    var cmd = q.match(CMD_RE);
    var explicit = EDIT_RE.test(q);
    var natural = !explicit && NATURAL_RE.test(q) && (session() || seatVisitor());
    if (!cmd && !explicit && !natural) return; /* normal chat: base.js handles it */
    e.preventDefault(); e.stopImmediatePropagation();
    input.value = "";
    if (cmd) {
      var c = cmd[1].toLowerCase().replace(/\s/g, "");
      say("you", q);
      if (c === "login" || c === "signin") return loginPrompt();
      if (c === "logout" || c === "signout") { var s = session(); if (s) await post("/logout", { session: s }); setSession(""); say("sage", "Edit mode is off."); return; }
      return queue();
    }
    var text = q.replace(EDIT_RE, "").trim();
    say("you", q);
    act("think");
    var thinking = say("sage", "Sage is drafting the change…"); form.setAttribute("aria-busy", "true");
    var auth = who();
    var res = await post("/propose", Object.assign({ request: text.slice(0, 600), page: pageHint(text) }, auth));
    form.removeAttribute("aria-busy"); thinking.remove();
    if (res.error === "session_expired") setSession("");
    say("sage", res.reply || (res.ok ? "Here's the change." : "I couldn't draft that change."));
    if (res.id && (res.status === "proposed" || res.status === "blocked") && res.diff) preview(res, auth);
    act(res.ok ? "teach" : "nod");
  }, true);

  window.CKSageEdits = { login: loginPrompt, queue: queue, signedIn: function () { return !!session(); } };
})();
