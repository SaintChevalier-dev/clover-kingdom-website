// Run: npm i --no-save sql.js && npm test   (SQLite stands in for D1; Discord is mocked)
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import initSqlJs from "sql.js";
const SQL = await initSqlJs();
import worker, { SESSION_HOURS, SECURITY_HEADERS } from "../src/index.js";

function fakeD1() {
  const db = new SQL.Database();
  db.exec(fs.readFileSync(new URL("../schema.sql", import.meta.url), "utf8"));
  const all = (sql, a = []) => { const st = db.prepare(sql); st.bind(a); const out = []; while (st.step()) out.push(st.getAsObject()); st.free(); return out; };
  const raw = { exec: (q) => db.exec(q), prepare: (q) => ({ get: (...a) => all(q, a)[0], all: (...a) => all(q, a) }) };
  return { raw, prepare(sql) { let a = [];
    const o = { bind(...x) { a = x; return o; }, async run() { db.run(sql, a); return {}; }, async first() { return all(sql, a)[0] || null; } }; return o; } };
}
const env = () => ({ DB: fakeD1(), SITE_ORIGIN: "https://cloverkingdom.net", AUTH_ORIGIN: "https://auth.cloverkingdom.net",
  CKD_GUILD_ID: "123", DISCORD_CLIENT_ID: "cid", DISCORD_CLIENT_SECRET: "sec",
  AUTH_LIMITER: { calls: 0, async limit() { this.calls++; return { success: true }; } } });
const req = (path, init = {}) => new Request("https://auth.cloverkingdom.net" + path, init);
const cookieVal = (res, name) => res.headers.getSetCookie().find((c) => c.startsWith(name + "="))?.split(";")[0].slice(name.length + 1);

function mockDiscord(member = true, token = { access_token: "ACCESS_TOK_X", refresh_token: "REFRESH_TOK_X" }) {
  globalThis.fetch = async (u) => { u = String(u);
    if (u.endsWith("/oauth2/token")) return Response.json(token);
    if (u.endsWith("/users/@me")) return Response.json({ id: "42", username: "jacob", global_name: "Jacob" });
    if (u.includes("/guilds/123/member")) return member ? Response.json({ nick: null }) : new Response("", { status: 404 });
    throw new Error("unexpected " + u); };
}
async function startLogin(e) {
  const r = await worker.fetch(req("/auth/login"), e);
  const loc = new URL(r.headers.get("Location"));
  return { loc, flow: cookieVal(r, "__Host-ckw_oauth"), r };
}

test("login redirects to Discord with state, PKCE, scopes", async () => {
  const { loc, flow, r } = await startLogin(env());
  assert.equal(loc.host, "discord.com");
  assert.equal(loc.searchParams.get("scope"), "identify guilds.members.read");
  assert.equal(loc.searchParams.get("code_challenge_method"), "S256");
  assert.equal(flow.split(".")[0], loc.searchParams.get("state"));
  assert.match(r.headers.getSetCookie()[0], /HttpOnly; Secure; SameSite=Lax/);
});

test("callback rejects bad state", async () => {
  const e = env(); const { flow } = await startLogin(e);
  const r = await worker.fetch(req("/auth/callback?code=c&state=WRONG", { headers: { Cookie: "__Host-ckw_oauth=" + encodeURIComponent(flow) } }), e);
  assert.match(r.headers.get("Location"), /login=failed/);
  assert.equal(e.DB.raw.prepare("SELECT COUNT(*) n FROM sessions").get().n, 0);
});

test("non-CKD member is refused server-side", async () => {
  const e = env(); mockDiscord(false); const { loc, flow } = await startLogin(e);
  const r = await worker.fetch(req(`/auth/callback?code=c&state=${loc.searchParams.get("state")}`, { headers: { Cookie: "__Host-ckw_oauth=" + encodeURIComponent(flow) } }), e);
  assert.match(r.headers.get("Location"), /login=not_member/);
  assert.equal(e.DB.raw.prepare("SELECT COUNT(*) n FROM members").get().n, 0);
});

test("full login -> /api/me -> logout -> /api/me 401, audit append-only, no deletes", async () => {
  const e = env(); mockDiscord(true); const { loc, flow } = await startLogin(e);
  const cb = await worker.fetch(req(`/auth/callback?code=c&state=${loc.searchParams.get("state")}`, { headers: { Cookie: "__Host-ckw_oauth=" + encodeURIComponent(flow) } }), e);
  assert.equal(cb.headers.get("Location"), "https://cloverkingdom.net/#/me");
  const tok = cookieVal(cb, "__Host-ckw_session"); assert.ok(tok && tok.length > 20);
  const stored = e.DB.raw.prepare("SELECT id_hash FROM sessions").get().id_hash; assert.notEqual(stored, tok);
  const C = { Cookie: "__Host-ckw_session=" + tok };
  const me = await worker.fetch(req("/api/me", { headers: C }), e);
  assert.equal(me.status, 200); assert.deepEqual(await me.json(), { signedIn: true, name: "Jacob", isSI: false });
  assert.equal(me.headers.get("Access-Control-Allow-Origin"), "https://cloverkingdom.net");
  const badOut = await worker.fetch(req("/auth/logout", { method: "POST", headers: { ...C, Origin: "https://evil.example" } }), e);
  assert.equal(badOut.status, 403);
  const out = await worker.fetch(req("/auth/logout", { method: "POST", headers: { ...C, Origin: "https://cloverkingdom.net" } }), e);
  assert.equal(out.status, 200);
  assert.equal((await worker.fetch(req("/api/me", { headers: C }), e)).status, 401);
  const acts = e.DB.raw.prepare("SELECT action FROM audit_log ORDER BY id").all().map((x) => x.action);
  assert.deepEqual(acts, ["login", "logout"]);
  assert.throws(() => e.DB.raw.exec("DELETE FROM audit_log"), /append-only/);
  assert.throws(() => e.DB.raw.exec("UPDATE audit_log SET action='x'"), /append-only/);
  assert.throws(() => e.DB.raw.exec("DELETE FROM members"), /never deleted/);
  assert.throws(() => e.DB.raw.exec("DELETE FROM sessions"), /never deleted/);
});

test("no cookie -> 401; unknown route 404; no DELETE route", async () => {
  const e = env();
  assert.equal((await worker.fetch(req("/api/me"), e)).status, 401);
  assert.equal((await worker.fetch(req("/api/me", { method: "DELETE" }), e)).status, 404);
});

async function fullLogin(e, extraCookie = "") {
  mockDiscord(true); const { loc, flow } = await startLogin(e);
  const cb = await worker.fetch(req(`/auth/callback?code=c&state=${loc.searchParams.get("state")}`, { headers: { Cookie: "__Host-ckw_oauth=" + encodeURIComponent(flow) + extraCookie } }), e);
  return { cb, tok: cookieVal(cb, "__Host-ckw_session") };
}
const me = (e, tok) => worker.fetch(req("/api/me", { headers: { Cookie: "__Host-ckw_session=" + tok } }), e);

test("blocked member: session rejected and re-login refused", async () => {
  const e = env(); const { tok } = await fullLogin(e);
  assert.equal((await me(e, tok)).status, 200);
  e.DB.raw.exec("UPDATE members SET blocked = 1 WHERE discord_id = '42'");
  assert.equal((await me(e, tok)).status, 401);
  const { cb } = await fullLogin(e);
  assert.match(cb.headers.get("Location"), /login=failed/);
  assert.ok(e.DB.raw.prepare("SELECT action FROM audit_log").all().some((x) => x.action === "login_blocked"));
});

test("epoch bump revokes every session (no delete)", async () => {
  const e = env(); const { tok } = await fullLogin(e);
  e.DB.raw.exec("UPDATE members SET session_epoch = session_epoch + 1 WHERE discord_id = '42'");
  assert.equal((await me(e, tok)).status, 401);
  const { tok: t2 } = await fullLogin(e);
  assert.equal((await me(e, t2)).status, 200);
});

test("sessions last 24h, cookie Max-Age 24h, last_verified_at set, no refresh token stored", async () => {
  const e = env(); const { cb, tok } = await fullLogin(e);
  assert.equal(SESSION_HOURS, 24);
  assert.match(cb.headers.getSetCookie().find((c) => c.startsWith("__Host-ckw_session=")), /Max-Age=86400/);
  const s = e.DB.raw.prepare("SELECT created_at, expires_at FROM sessions").get();
  assert.ok(Math.abs(Date.parse(s.expires_at) - Date.parse(s.created_at) - 24 * 3600e3) < 1000);
  assert.ok(e.DB.raw.prepare("SELECT last_verified_at FROM members").get().last_verified_at);
  e.DB.raw.exec("UPDATE sessions SET expires_at = '2000-01-01T00:00:00.000Z'");
  assert.equal((await me(e, tok)).status, 401);
  const dump = JSON.stringify([e.DB.raw.prepare("SELECT * FROM sessions").all(), e.DB.raw.prepare("SELECT * FROM members").all(), e.DB.raw.prepare("SELECT * FROM audit_log").all()]);
  assert.ok(!dump.includes("REFRESH_TOK_X"), "refresh token must not be stored");
  assert.ok(!dump.includes("ACCESS_TOK_X"));
});

test("re-login revokes the previous cookie's session by flag", async () => {
  const e = env(); const { tok } = await fullLogin(e);
  const { tok: t2 } = await fullLogin(e, "; __Host-ckw_session=" + tok);
  assert.equal((await me(e, tok)).status, 401);
  assert.equal((await me(e, t2)).status, 200);
  assert.equal(e.DB.raw.prepare("SELECT COUNT(*) n FROM sessions").get().n, 2);
  assert.equal(e.DB.raw.prepare("SELECT COUNT(*) n FROM sessions WHERE revoked_at IS NOT NULL").get().n, 1);
});

test("callback fails closed: missing access_token, Discord down", async () => {
  for (const setup of [() => mockDiscord(true, { refresh_token: "x" }), () => { globalThis.fetch = async () => { throw new Error("network"); }; }]) {
    const e = env(); const { loc, flow } = await startLogin(e); setup();
    const cb = await worker.fetch(req(`/auth/callback?code=c&state=${loc.searchParams.get("state")}`, { headers: { Cookie: "__Host-ckw_oauth=" + encodeURIComponent(flow) } }), e);
    assert.equal(cb.status, 302); assert.match(cb.headers.get("Location"), /login=failed/);
    assert.match(cb.headers.getSetCookie().find((c) => c.startsWith("__Host-ckw_oauth=")), /Max-Age=0/);
    assert.equal(cookieVal(cb, "__Host-ckw_session"), undefined);
    assert.equal(e.DB.raw.prepare("SELECT COUNT(*) n FROM sessions").get().n, 0);
    assert.equal(e.DB.raw.prepare("SELECT action FROM audit_log").get().action, "login_error");
  }
});

test("security headers on every response", async () => {
  const e = env(); mockDiscord(true);
  const rs = [await worker.fetch(req("/auth/login"), e), await worker.fetch(req("/api/me"), e), await worker.fetch(req("/nope"), e),
    await worker.fetch(req("/auth/callback?code=x&state=y"), e), await worker.fetch(req("/auth/logout", { method: "POST" }), e)];
  for (const r of rs) for (const [k, v] of Object.entries(SECURITY_HEADERS)) assert.equal(r.headers.get(k), v, k);
  assert.equal(SECURITY_HEADERS["Content-Security-Policy"], "default-src 'none'; frame-ancestors 'none'");
  assert.match(SECURITY_HEADERS["Strict-Transport-Security"], /max-age=\d+/);
});

test("rate limit binding wired: used on login+callback, 429 when over or missing; wrangler.toml declares it", async () => {
  const e = env(); await worker.fetch(req("/auth/login"), e); await worker.fetch(req("/auth/callback"), e);
  assert.equal(e.AUTH_LIMITER.calls, 2);
  e.AUTH_LIMITER.limit = async () => ({ success: false });
  assert.equal((await worker.fetch(req("/auth/login"), e)).status, 429);
  assert.equal((await worker.fetch(req("/auth/callback"), e)).status, 429);
  delete e.AUTH_LIMITER;
  assert.equal((await worker.fetch(req("/auth/login"), e)).status, 429);
  const toml = fs.readFileSync(new URL("../wrangler.toml", import.meta.url), "utf8");
  assert.match(toml, /\[\[ratelimits\]\][\s\S]*name = "AUTH_LIMITER"/);
  assert.match(toml, /workers_dev = false/);
});
