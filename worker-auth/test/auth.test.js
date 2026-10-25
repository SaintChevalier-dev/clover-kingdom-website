// Run: npm i --no-save sql.js && npm test   (SQLite stands in for D1; Discord is mocked)
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import initSqlJs from "sql.js";
const SQL = await initSqlJs();
import worker from "../src/index.js";

function fakeD1() {
  const db = new SQL.Database();
  db.exec(fs.readFileSync(new URL("../schema.sql", import.meta.url), "utf8"));
  const all = (sql, a = []) => { const st = db.prepare(sql); st.bind(a); const out = []; while (st.step()) out.push(st.getAsObject()); st.free(); return out; };
  const raw = { exec: (q) => db.exec(q), prepare: (q) => ({ get: (...a) => all(q, a)[0], all: (...a) => all(q, a) }) };
  return { raw, prepare(sql) { let a = [];
    const o = { bind(...x) { a = x; return o; }, async run() { db.run(sql, a); return {}; }, async first() { return all(sql, a)[0] || null; } }; return o; } };
}
const env = () => ({ DB: fakeD1(), SITE_ORIGIN: "https://cloverkingdom.net", AUTH_ORIGIN: "https://auth.cloverkingdom.net",
  CKD_GUILD_ID: "123", DISCORD_CLIENT_ID: "cid", DISCORD_CLIENT_SECRET: "sec" });
const req = (path, init = {}) => new Request("https://auth.cloverkingdom.net" + path, init);
const cookieVal = (res, name) => res.headers.getSetCookie().find((c) => c.startsWith(name + "="))?.split(";")[0].slice(name.length + 1);

function mockDiscord(member = true) {
  globalThis.fetch = async (u) => { u = String(u);
    if (u.endsWith("/oauth2/token")) return Response.json({ access_token: "at" });
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
