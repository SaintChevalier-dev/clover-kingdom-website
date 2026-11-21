"use strict";
const { readFileSync } = require("node:fs");
const { join } = require("node:path");
const { test } = require("node:test");
const assert = require("node:assert/strict");
const root = join(__dirname, "..");
const app = readFileSync(join(root, "app.js"), "utf8");
const sf = readFileSync(join(root, "sage-front.js"), "utf8");
const html = readFileSync(join(root, "index.html"), "utf8");

test("guests see only the Sage front door", () => {
  assert.match(app, /const GUEST_OPEN_ROUTES = new Set\(\["#\/privacy", "#\/members", "#\/login"\]\)/);
  assert.match(app, /if \(!memberSession\.signedIn && !GUEST_OPEN_ROUTES\.has\(page\)\)/);
  assert.match(app, /main\.appendChild\(buildSageFrontDoor\(\)\)/);
  assert.match(html, /<body class="guest-mode">/);
});

test("Sage front door has type, talk and the three doors", () => {
  assert.match(sf, /function buildSageFrontDoor/);
  assert.match(sf, /SpeechRecognition \|\| window\.webkitSpeechRecognition/);
  assert.match(sf, />Contact Jacob</);
  assert.match(sf, />Apply to the Discord</);
  assert.match(sf, />Become a member</);
  assert.match(sf, /data-gate-login="1"/);
});

test("Sage renders chat with text nodes and sends nothing in the stub", () => {
  assert.match(sf, /b\.textContent = text/);
  assert.equal(/fetch\(/.test(sf), false);
  assert.equal(/sendBeacon|XMLHttpRequest/.test(sf), false);
});

test("sage-front.js loads before app.js", () => {
  assert.ok(html.indexOf("sage-front.js") < html.indexOf('src="app.js'));
});

test("archetype switcher is a documented hook only and always returns Sage", () => {
  assert.match(sf, /HOOK ONLY, NOT BUILT/);
  assert.match(sf, /function activeFrontArchetype\(\) \{ return SAGE_FRONT_DEFAULT_ARCHETYPE; \}/);
  assert.match(sf, /const SAGE_FRONT_DEFAULT_ARCHETYPE = "sage"/);
});

test("existing login is untouched: session functions do not know about the front door", () => {
  const fms = app.slice(app.indexOf("function fetchMemberSession"), app.indexOf("function clearMemberSession"));
  const cms = app.slice(app.indexOf("function clearMemberSession"), app.indexOf("function memberGateHtml"));
  assert.equal(/routeFromHash|guest-mode/.test(fms), false);
  assert.equal(/routeFromHash|guest-mode/.test(cms), false);
  assert.match(app, /const CKW_AUTH = "https:\/\/auth\.cloverkingdom\.net"/);
  assert.match(sf, /fetchMemberSession\(\)\.then/);
});
