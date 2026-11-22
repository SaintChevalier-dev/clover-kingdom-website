/* Clover Kingdom content layer (read-only renderer).
   Pages that opt in wrap their editable part in <div data-ck-root data-ck-page="NAME">...static fallback...</div>
   and load this script. It fetches /content/NAME.json and rebuilds that part with plain text only:
   no innerHTML, links only https:// or a same-site path. If anything fails, the static fallback stays. */
(function () {
  "use strict";
  var root = document.querySelector("[data-ck-root][data-ck-page]");
  if (!root) return;
  var page = root.getAttribute("data-ck-page");
  if (!/^[a-z0-9-]{1,40}$/.test(page)) return;

  function safeHref(h) {
    h = String(h || "").trim();
    if (/^https:\/\/[^\s"'<>]+$/i.test(h)) return h;
    if (/^\/(?!\/)[^\s"'<>]*$/.test(h)) return h;
    return null;
  }
  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null && text !== "") e.textContent = String(text);
    return e;
  }
  function links(list, into) {
    var n = 0;
    (list || []).forEach(function (l) {
      var href = safeHref(l && l.href), label = l && l.label;
      if (!href || !label) return;
      if (n++) into.appendChild(document.createTextNode(" \u00b7 "));
      var a = el("a", null, label);
      a.href = href;
      if (/^https:/i.test(href)) a.rel = "noopener";
      into.appendChild(a);
    });
    return n;
  }
  function item(it) {
    var li = el("li");
    if (it && typeof it === "object") {
      if (it.title) li.appendChild(el("strong", null, it.title));
      if (it.title && it.text) li.appendChild(document.createTextNode(" "));
      if (it.text) li.appendChild(document.createTextNode(String(it.text)));
    } else li.textContent = String(it || "");
    return li;
  }
  function genericSection(s) {
    var frag = document.createDocumentFragment();
    var h = el("h2", null, s.heading);
    if (s.kicker) { h.appendChild(document.createTextNode(" ")); h.appendChild(el("small", null, s.kicker)); }
    if (s.id) h.id = String(s.id).replace(/[^a-z0-9-]/gi, "");
    frag.appendChild(h);
    var list = (s.items || []).filter(Boolean);
    if (list.length) {
      var ul = el(s.list === "ol" ? "ol" : "ul", s.listClass ? String(s.listClass).replace(/[^a-z0-9- ]/gi, "") : null);
      list.forEach(function (it) { ul.appendChild(item(it)); });
      frag.appendChild(ul);
    }
    (s.paragraphs || []).forEach(function (p) { if (p) frag.appendChild(el("p", null, p)); });
    if ((s.links || []).length) { var p = el("p"); if (links(s.links, p)) frag.appendChild(p); }
    return frag;
  }
  /* Seats page: the four day-one seats keep their art and seal (not editable); text comes from JSON. */
  var SEAT_ART = {
    painter: { seal: "PA" }, xtt: { seal: "TT" }, knight: { seal: "KN" },
    sage: { img: "/base/assets/ref/sage-v06-front-noaura.jpg", alt: "Sage, v06 look: pearl-white plate with gold trim, white wings, halo, small gold horns, floating white-and-gold grimoire" }
  };
  function seatCard(s) {
    var art = SEAT_ART[s.id];
    var li = el("li", "seat"); li.id = s.id;
    if (art.img) {
      var im = el("img", "seat-art"); im.src = art.img; im.alt = art.alt; im.width = 720; im.height = 720; im.loading = "lazy";
      li.appendChild(im);
    } else {
      var mark = el("div", "seat-mark"); mark.setAttribute("aria-hidden", "true");
      var seal = el("img"); seal.src = "/images/logo-crimson-seal-144.png"; seal.alt = ""; seal.width = 72; seal.height = 72;
      mark.appendChild(seal); mark.appendChild(el("span", null, art.seal)); li.appendChild(mark);
    }
    var h = el("h2", null, s.heading);
    if (s.kicker) { h.appendChild(document.createTextNode(" ")); h.appendChild(el("small", null, s.kicker)); }
    li.appendChild(h);
    var ps = s.paragraphs || [];
    if (ps[0]) li.appendChild(el("p", "seat-lane", ps[0]));
    var extra = ps.slice(2).filter(Boolean);
    extra.forEach(function (p) { li.appendChild(el("p", "seat-lane", p)); });
    if ((s.items || []).length) {
      var d = el("details", "seat-card"); d.appendChild(el("summary", null, "From " + (s.id === "sage" ? "her" : "the") + " Kingdom card (public part)"));
      var ul = el("ul"); s.items.forEach(function (it) { ul.appendChild(item(it)); }); d.appendChild(ul); li.appendChild(d);
    }
    if (ps[1] || (s.links || []).length) {
      var meta = el("p", "seat-meta", ps[1] ? ps[1] + ((s.links || []).length ? " " : "") : "");
      links(s.links, meta); li.appendChild(meta);
    }
    return li;
  }
  function render(c) {
    if (!c || c.page !== page || !Array.isArray(c.sections)) throw new Error("bad content");
    var frag = document.createDocumentFragment();
    frag.appendChild(el("h1", null, c.title));
    if (c.intro) frag.appendChild(el("p", null, c.intro));
    if (page === "seats") {
      var grid = el("ul", "seat-grid");
      c.sections.forEach(function (s) {
        if (s && SEAT_ART[s.id]) grid.appendChild(seatCard(s));
      });
      frag.appendChild(grid);
      c.sections.forEach(function (s) { if (s && !SEAT_ART[s.id]) frag.appendChild(genericSection(s)); });
    } else {
      c.sections.forEach(function (s) { if (s) frag.appendChild(genericSection(s)); });
    }
    root.textContent = "";
    root.appendChild(frag);
    root.setAttribute("data-ck-rendered", c.version || "1");
  }
  fetch("/content/" + page + ".json", { cache: "no-cache", credentials: "omit" })
    .then(function (r) { if (!r.ok) throw new Error("http " + r.status); return r.json(); })
    .then(render)
    .catch(function () { /* keep the static fallback */ });
})();
