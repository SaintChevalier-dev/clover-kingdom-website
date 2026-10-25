// CKW auth Worker: Sign in with Discord (OAuth2 code flow + state + PKCE).
// Deploy target: auth.cloverkingdom.net ONLY (workers_dev = false). Never workers.dev.
// Scopes: identify + guilds.members.read (user token checks CKD membership; no bot token in this Worker).
// Routes: GET /auth/login, GET /auth/callback, POST /auth/logout, GET /api/me. No delete endpoints.
// Tokens: the Discord access token is used once in memory; the refresh token is never read or stored.
const COOKIE = "__Host-ckw_session";
const FLOW = "__Host-ckw_oauth";
export const SESSION_HOURS = 24;
const DISCORD = "https://discord.com";
const API = "https://discord.com/api/v10";

const b64url = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const rand = (n = 32) => b64url(crypto.getRandomValues(new Uint8Array(n)));
const sha256 = async (s) => b64url(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s)));
const now = () => new Date().toISOString();

export function parseCookies(h) {
  const out = {};
  (h || "").split(/;\s*/).forEach((p) => { const i = p.indexOf("="); if (i > 0) out[p.slice(0, i)] = decodeURIComponent(p.slice(i + 1)); });
  return out;
}
const setCookie = (name, val, maxAge) => `${name}=${encodeURIComponent(val)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`;

export const SECURITY_HEADERS = {
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "no-referrer",
  "Content-Security-Policy": "default-src 'none'; frame-ancestors 'none'",
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
  "Cache-Control": "no-store",
};
function secure(res) { for (const [k, v] of Object.entries(SECURITY_HEADERS)) res.headers.set(k, v); return res; }
function cors(env, res) {
  res.headers.set("Access-Control-Allow-Origin", env.SITE_ORIGIN);
  res.headers.set("Access-Control-Allow-Credentials", "true");
  res.headers.set("Vary", "Origin");
  return res;
}
const json = (env, body, status = 200) => cors(env, new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } }));
const redirect = (url, cookies = []) => { const h = new Headers({ Location: url }); cookies.forEach((c) => h.append("Set-Cookie", c)); return new Response(null, { status: 302, headers: h }); };

export async function audit(env, actor, action, detail) {
  await env.DB.prepare("INSERT INTO audit_log (at, actor_discord_id, action, detail) VALUES (?, ?, ?, ?)").bind(now(), actor, action, detail ? JSON.stringify(detail) : null).run();
}

export async function sessionMember(env, req) {
  const tok = parseCookies(req.headers.get("Cookie"))[COOKIE];
  if (!tok) return null;
  const row = await env.DB.prepare(
    "SELECT m.discord_id, m.display_name, m.is_si, m.owner_discord_id FROM sessions s JOIN members m ON m.discord_id = s.discord_id " +
    "WHERE s.id_hash = ? AND s.revoked_at IS NULL AND s.expires_at > ? AND m.blocked = 0 AND s.session_epoch = m.session_epoch"
  ).bind(await sha256(tok), now()).first();
  return row || null;
}

// Rate limit (Workers rate-limit binding). Missing binding = fail closed (deploy gate).
async function limited(env, req, route) {
  if (!env.AUTH_LIMITER) return true;
  const ip = req.headers.get("CF-Connecting-IP") || "unknown";
  const { success } = await env.AUTH_LIMITER.limit({ key: route + ":" + ip });
  return !success;
}

async function login(env) {
  const state = rand(), verifier = rand(48);
  const challenge = b64url(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier)));
  const u = new URL(DISCORD + "/oauth2/authorize");
  u.search = new URLSearchParams({ response_type: "code", client_id: env.DISCORD_CLIENT_ID, scope: "identify guilds.members.read",
    redirect_uri: env.AUTH_ORIGIN + "/auth/callback", state, code_challenge: challenge, code_challenge_method: "S256" }).toString();
  return redirect(u.toString(), [setCookie(FLOW, state + "." + verifier, 600)]);
}

// Revoke the session from any previous cookie (flag, not delete).
async function revokePrev(env, req) {
  const prev = parseCookies(req.headers.get("Cookie"))[COOKIE];
  if (prev) await env.DB.prepare("UPDATE sessions SET revoked_at = ? WHERE id_hash = ? AND revoked_at IS NULL").bind(now(), await sha256(prev)).run();
}

// Audit-safe error code: only our own short snake_case codes pass; anything else (which could carry a token) becomes "unexpected".
export function safeErr(err) {
  const m = String((err && err.message) || "");
  return /^[a-z_]{1,32}(_\d{3})?$/.test(m) ? m : "unexpected";
}

async function callback(env, req, url) {
  const clear = setCookie(FLOW, "", 0);
  const back = (why) => redirect(env.SITE_ORIGIN + "/#/me?login=" + why, [clear]);
  let actor = null;
  try {
    const flow = parseCookies(req.headers.get("Cookie"))[FLOW] || "";
    const [state, verifier] = flow.split(".");
    const code = url.searchParams.get("code");
    if (!state || !verifier || !code || url.searchParams.get("state") !== state) { await audit(env, null, "login_bad_state", null); return back("failed"); }
    const tr = await fetch(API + "/oauth2/token", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ grant_type: "authorization_code", code, redirect_uri: env.AUTH_ORIGIN + "/auth/callback",
        client_id: env.DISCORD_CLIENT_ID, client_secret: env.DISCORD_CLIENT_SECRET, code_verifier: verifier }) });
    if (!tr.ok) throw new Error("token_status_" + tr.status);
    const access_token = (await tr.json()).access_token; // refresh_token deliberately ignored, never stored
    if (typeof access_token !== "string" || !access_token) throw new Error("no_access_token");
    const auth = { headers: { Authorization: "Bearer " + access_token } };
    const ur = await fetch(API + "/users/@me", auth);
    if (!ur.ok) throw new Error("user_status_" + ur.status);
    const user = await ur.json();
    if (!user || typeof user.id !== "string") throw new Error("no_user_id");
    actor = user.id;
    // Server-side gate, re-checked on every login: must be in the CKD server.
    const gr = await fetch(`${API}/users/@me/guilds/${env.CKD_GUILD_ID}/member`, auth);
    if (!gr.ok) { await revokePrev(env, req); await audit(env, user.id, "login_not_ckd_member", null); return back("not_member"); }
    const gm = await gr.json();
    const name = String(gm.nick || user.global_name || user.username || "member").slice(0, 64);
    const t = now();
    // Add or edit, never delete. is_si stays 0 (no setter until an owner-confirm flow exists).
    await env.DB.prepare("INSERT INTO members (discord_id, display_name, is_si, owner_discord_id, blocked, session_epoch, last_verified_at, created_at, updated_at) VALUES (?, ?, 0, NULL, 0, 0, ?, ?, ?) " +
      "ON CONFLICT(discord_id) DO UPDATE SET display_name = excluded.display_name, last_verified_at = excluded.last_verified_at, updated_at = excluded.updated_at")
      .bind(user.id, name, t, t, t).run();
    const m = await env.DB.prepare("SELECT blocked, session_epoch FROM members WHERE discord_id = ?").bind(user.id).first();
    if (!m || m.blocked) { await audit(env, user.id, "login_blocked", null); return back("failed"); }
    // Revoke the session from any previous cookie (flag, not delete).
    await revokePrev(env, req);
    const tok = rand(32);
    const exp = new Date(Date.now() + SESSION_HOURS * 3600e3).toISOString();
    await env.DB.prepare("INSERT INTO sessions (id_hash, discord_id, session_epoch, created_at, expires_at) VALUES (?, ?, ?, ?, ?)").bind(await sha256(tok), user.id, m.session_epoch, t, exp).run();
    await audit(env, user.id, "login", null);
    return redirect(env.SITE_ORIGIN + "/#/me", [clear, setCookie(COOKIE, tok, SESSION_HOURS * 3600)]);
  } catch (err) {
    try { await audit(env, actor, "login_error", { error: safeErr(err) }); } catch (_) { /* still fail closed */ }
    return back("failed");
  }
}

async function logout(env, req) {
  if (req.headers.get("Origin") !== env.SITE_ORIGIN) return json(env, { error: "bad_origin" }, 403); // CSRF guard
  const tok = parseCookies(req.headers.get("Cookie"))[COOKIE];
  if (tok) {
    const m = await sessionMember(env, req);
    await env.DB.prepare("UPDATE sessions SET revoked_at = ? WHERE id_hash = ? AND revoked_at IS NULL").bind(now(), await sha256(tok)).run();
    await audit(env, m ? m.discord_id : null, "logout", null);
  }
  const res = json(env, { ok: true });
  res.headers.append("Set-Cookie", setCookie(COOKIE, "", 0));
  return res;
}

async function route(req, env) {
  const url = new URL(req.url);
  const k = req.method + " " + url.pathname;
  if (req.method === "OPTIONS") {
    const r = cors(env, new Response(null, { status: 204 }));
    r.headers.set("Access-Control-Allow-Methods", "GET, POST"); return r;
  }
  if (k === "GET /auth/login" || k === "GET /auth/callback") {
    if (await limited(env, req, url.pathname)) return new Response("Too many tries. Wait a minute.", { status: 429 });
    return k === "GET /auth/login" ? login(env) : callback(env, req, url);
  }
  if (k === "POST /auth/logout") return logout(env, req);
  if (k === "GET /api/me") {
    const m = await sessionMember(env, req);
    if (!m) return json(env, { signedIn: false }, 401);
    return json(env, { signedIn: true, name: m.display_name, isSI: !!m.is_si });
  }
  return json(env, { error: "not_found" }, 404);
}

export default {
  async fetch(req, env) {
    try { return secure(await route(req, env)); }
    catch (_) { return secure(new Response("error", { status: 500 })); }
  },
};
