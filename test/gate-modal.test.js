"use strict";

const { readFileSync } = require("node:fs");
const { join } = require("node:path");
const { test } = require("node:test");
const assert = require("node:assert/strict");

const root = join(__dirname, "..");
const appBuf = readFileSync(join(root, "app.js"));
const app = appBuf.toString("utf8");
const html = readFileSync(join(root, "index.html"), "utf8");
const css = readFileSync(join(root, "styles.css"), "utf8");

const INVITE = "https://discord.gg/2BrNPwUuTB";

test("app.js keeps CRLF line endings", () => {
  assert.ok(appBuf.includes(Buffer.from("\r\n")));
  assert.equal(appBuf.toString("binary").replace(/\r\n/g, "").includes("\n"), false);
});

test("uses the existing Discord invite and no other invite", () => {
  assert.match(app, /const DISCORD_URL = "https:\/\/discord\.gg\/2BrNPwUuTB"/);
  const invites = [...app.matchAll(/https:\/\/discord\.gg\/[A-Za-z0-9]+/g)].map((m) => m[0]);
  assert.ok(invites.length > 0);
  assert.ok(invites.every((u) => u === INVITE));
  const htmlInvites = [...html.matchAll(/https:\/\/discord\.gg\/[A-Za-z0-9]+/g)].map((m) => m[0]);
  assert.ok(htmlInvites.every((u) => u === INVITE));
});

test("defines data-driven signup steps for the login popup", () => {
  assert.match(app, /const GATE_SIGNUP_STEPS = \[/);
  assert.match(app, /Join the Clover Kingdom Discord/);
  assert.match(app, /Read #rules/);
  assert.match(app, /Come back and log in/);
  assert.match(app, /You'll land in the Member Hall/);
  assert.match(app, /function gateSignupStepsHtml/);
});

test("login buttons are wired to open the gate modal", () => {
  assert.match(app, /function openGateModal/);
  assert.match(app, /function closeGateModal/);
  assert.match(app, /function wireGateLoginOnce/);
  assert.match(app, /data-gate-login/);
  assert.match(html, /data-gate-login="1"/);
  assert.match(html, /class="nav-login"[^>]*data-gate-login="1"/);
  assert.match(html, /href="#\/members"[^>]*data-gate-login="1"[^>]*>Member login</);
});

test("modal explains membership check and has a login fallback line", () => {
  assert.match(app, /Login checks Discord membership, so outside connections stay outside until they're ready to join\./);
  assert.match(app, /Login page not loading\? Your network may still be catching up on our new address; try again in a bit or on mobile data\./);
});

test("member Discord login goes to the auth worker", () => {
  assert.match(app, /const MEMBERS_SIGNIN_URL = CKW_AUTH \+ "\/auth\/login"/);
  assert.match(app, /id="gate-modal-login" href="\$\{MEMBERS_SIGNIN_URL\}"/);
});

test("Escape and the backdrop close the modal, and it is a dialog", () => {
  assert.match(app, /role="dialog" aria-modal="true"/);
  assert.match(app, /data-gate-close="1"/);
  assert.match(app, /if \(e\.key === "Escape"\) \{ e\.preventDefault\(\); closeGateModal\(\); return; \}/);
  assert.match(app, /if \(e\.key === "Tab" && dialog\)/);
});

test("cache bust is 20261111k", () => {
  assert.match(html, /styles\.css\?v=20261111k/);
  assert.match(html, /app\.js\?v=20261111k/);
  assert.equal((html.match(/20261111j/g) || []).length, 0);
});

test("modal styles exist and disable motion under prefers-reduced-motion", () => {
  assert.match(css, /\.gate-modal-root/);
  assert.match(css, /body\.gate-modal-open/);
  assert.match(css, /@media \(max-width: 700px\)/);
  assert.match(css, /prefers-reduced-motion: reduce/);
});
