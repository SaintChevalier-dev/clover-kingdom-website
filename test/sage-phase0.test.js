"use strict";
/* Phase zero: Sage roams and breathes on its own. Runs sage-front.js in a tiny fake browser (no deps). */
const { readFileSync } = require("node:fs");
const { join } = require("node:path");
const { test } = require("node:test");
const assert = require("node:assert/strict");
const vm = require("node:vm");
const root = join(__dirname, "..");
const sf = readFileSync(join(root, "sage-front.js"), "utf8");
const css = readFileSync(join(root, "sage-front.css"), "utf8");

function fakeBrowser({ search = "", referrer = "", storage = true } = {}) {
  const store = new Map();
  const sessionStorage = storage
    ? { getItem: (k) => (store.has(k) ? store.get(k) : null), setItem: (k, v) => store.set(k, String(v)), removeItem: (k) => store.delete(k) }
    : { getItem: () => { throw new Error("blocked"); }, setItem: () => { throw new Error("blocked"); }, removeItem: () => { throw new Error("blocked"); } };
  const el = () => ({ innerHTML: "", textContent: "", set innerHTML(v) { this._h = v; this.textContent = String(v).replace(/<[^>]+>/g, ""); }, get innerHTML() { return this._h || ""; } });
  const ctx = {
    console, setTimeout, clearTimeout, URL, URLSearchParams, Intl, Date, Math, JSON,
    location: { hostname: "cloverkingdom.net", search },
    navigator: { language: "en-US", onLine: true },
    document: { referrer, getElementById: () => null, querySelector: () => null, createElement: el, body: { classList: { contains: () => true } } },
    sessionStorage,
    DISCORD_URL: "https://discord.gg/2BrNPwUuTB",
    pickSageResponse: () => "I don't have an answer for that yet.",
  };
  ctx.window = { matchMedia: () => ({ matches: false }), addEventListener: () => {} };
  ctx.window.matchMedia = ctx.window.matchMedia;
  ctx.matchMedia = ctx.window.matchMedia;
  vm.createContext(ctx);
  vm.runInContext(sf.replace(/^"use strict";/m, "") + "\n;this.__x = { sageReply, sageGreeting, sageGuestScan, sageLoadConvo, sageSaveConvo, sageClearConvo, SAGE_STARTERS, activeFrontArchetype };", ctx);
  return ctx.__x;
}

test("stub answers route guests to the right door", () => {
  const x = fakeBrowser();
  assert.equal(x.sageReply("How do I reach Jacob?").door, "contact");
  assert.equal(x.sageReply("how do i join the discord").door, "discord");
  assert.equal(x.sageReply("What do members get?").door, "member");
  assert.match(x.sageReply("what does the discord offer").text, /robot buddy/);
  assert.match(x.sageReply("are you a bot?").text, /AI archetype/);
  assert.equal(x.sageReply("   ").text, "Ask me anything. One line is enough.");
  const unknown = x.sageReply("zxqv plorp");
  assert.match(unknown.text, /don't have that answer at the door yet/);
  assert.equal(unknown.door, "discord");
});

test("stub answers carry no prices and no invented handles", () => {
  const faq = sf.slice(sf.indexOf("const SAGE_FRONT_FAQ"), sf.indexOf("function sageGuestScan"));
  assert.equal(/\$\d|\d+\s*(usd|dollars)/i.test(faq), false);
  const handles = [...faq.matchAll(/@[A-Za-z_]{3,}/g)].map((m) => m[0]);
  assert.ok(handles.every((h) => h === "@Saint_Chevalier"));
});

test("greeting reads the referrer or utm locally", () => {
  assert.match(fakeBrowser({ search: "?utm_source=x.com" }).sageGreeting(fakeBrowser({ search: "?utm_source=x.com" }).sageGuestScan()), /You came in from X/);
  const g = fakeBrowser();
  assert.match(g.sageGreeting(g.sageGuestScan()), /I am Sage/);
});

test("conversation is kept in session storage, capped, and survives blocked storage", () => {
  const x = fakeBrowser();
  assert.equal(x.sageLoadConvo().length, 0);
  const many = Array.from({ length: 55 }, (_, i) => ({ who: i % 2 ? "sage" : "you", text: "m" + i }));
  x.sageSaveConvo(many);
  const back = x.sageLoadConvo();
  assert.equal(back.length, 40);
  assert.equal(back[39].text, "m54");
  x.sageClearConvo();
  assert.equal(x.sageLoadConvo().length, 0);
  const blocked = fakeBrowser({ storage: false });
  assert.doesNotThrow(() => blocked.sageSaveConvo([{ who: "you", text: "hi" }]));
  assert.deepEqual(Array.from(blocked.sageLoadConvo()), []);
});

test("Sage greets unprompted, offers starters, handles offline and mic fallback", () => {
  assert.match(sf, /const SAGE_GREET_DELAY_MS = \d+/);
  assert.match(sf, /say\("sage", sageGreeting\(sageGuestScan\(\)\)\)/);
  const x = fakeBrowser();
  assert.ok(x.SAGE_STARTERS.length >= 3);
  assert.match(sf, /window\.addEventListener\("offline", showNet\)/);
  assert.match(sf, /\$\{mic \? "" : " hidden"\}/);
  assert.match(sf, /"not-allowed":/);
  assert.match(sf, /"no-speech":/);
});

test("roaming companion and accessibility hooks exist", () => {
  assert.match(sf, /function syncSageRoamer/);
  assert.match(sf, /role="log" aria-live="polite"/);
  assert.match(sf, /aria-pressed="false"/);
  assert.match(css, /\.sf-roam \{ animation: sf-drift/);
  assert.match(css, /prefers-reduced-motion: reduce\) \{\n  \.sf-roam/);
  assert.match(css, /\.sf-typing\[hidden\] \{ display: flex; visibility: hidden; \}/);
});

test("guests do not download the background film; members get it back", () => {
  assert.match(sf, /function sageParkBgVideo/);
  assert.match(sf, /function sageRestoreBgVideo/);
  assert.match(sf, /sageRestoreBgVideo\(\);\n      if \(document\.body\.classList\.contains\("guest-mode"\)\) routeFromHash\(\);/);
});

test("switcher stays a hook that returns Sage", () => {
  assert.equal(fakeBrowser().activeFrontArchetype(), "sage");
});
