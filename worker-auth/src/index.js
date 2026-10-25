// CKW auth Worker: Sign in with Discord (OAuth2 code flow + state + PKCE).
// Scopes: identify + guilds.members.read (user token checks CKD membership; no bot token in this Worker).
// Routes: GET /auth/login, GET /auth/callback, POST /auth/logout, GET /api/me. No delete endpoints.
const COOKIE = "__Host-ckw_session";
const FLOW = "__Host-ckw_oauth";
const SESSION_DAYS = 14;
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

function cors(env, res) {
  res.headers.set("Access-Control-Allow-Origin", env.SITE_ORIGIN);
  res.headers.set("Access-Control-Allow-Credentials", "true");
  res.headers.set("Vary", "Origin");
  res.headers.set("Cache-Control", "no-store");
  return res;
}
const json = (env, body, status = 200) => cors(env, new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } }));
const redirect = (url, cookies = []) => { const h = new Headers({ Location: url, "Cache-Control": "no-store" }); cookies.forEach((c) => h.append("Set-Cookie", c)); return new Response(null, { status: 302, headers: h }); };

export async function audit(env, actor, action, detail) {
  await env.DB.prepare("INSERT INTO audit_log (at, actor_discord_id, action, detail) VALUES (?, ?, ?, ?)").bind(now(), actor, action, detail ? JSON.stringify(detail) : null).run();
}

export async function sessionMember(env, req) {
  const tok = parseCookies(req.headers.get("Cookie"))[COOKIE];
  if (!tok) return null;
  const row = await env.DB.prepare(
    "SELECT m.discord_id, m.display_name, m.is_si, m.owner_discord_id FROM sessions s JOIN members m ON m.discord_id = s.discord_id WHERE s.id_hash = ? AND s.revoked_at IS NULL AND s.expires_at > ?"
  ).bind(await sha256(tok), now()).first();
  return row || null;
}

async function login(env) {
  const state = rand(), verifier = rand(48);
  const challenge = b64url(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier)));
  const u = new URL(DISCORD + "/oauth2/authorize");
  u.search = new URLSearchParams({ response_type: "code", client_id: env.DISCORD_CLIENT_ID, scope: "identify guilds.members.read",
    redirect_uri: env.AUTH_ORIGIN + "/auth/callback", state, code_challenge: challenge, code_challenge_method: "S256" }).toString();
  return redirect(u.toString(), [setCookie(FLOW, state + "." + verifier, 600)]);
}

async function callback(env, req, url) {
  const back = (why) => redirect(env.SITE_ORIGIN + "/#/me?login=" + why, [setCookie(FLOW, "", 0)]);
  const flow = parseCookies(req.headers.get("Cookie"))[FLOW] || "";
  const [state, verifier] = flow.split(".");
  const code = url.searchParams.get("code");
  if (!state || !verifier || !code || url.searchParams.get("state") !== state) { await audit(env, null, "login_bad_state", null); return back("failed"); }
  const tr = await fetch(API + "/oauth2/token", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "authorization_code", code, redirect_uri: env.AUTH_ORIGIN + "/auth/callback",
      client_id: env.DISCORD_CLIENT_ID, client_secret: env.DISCORD_CLIENT_SECRET, code_verifier: verifier }) });
  if (!tr.ok) { await audit(env, null, "login_token_error", { status: tr.status }); return back("failed"); }
  const { access_token } = await tr.json();
  const auth = { headers: { Authorization: "Bearer " + access_token } };
  const ur = await fetch(API + "/users/@me", auth);
  if (!ur.ok) return back("failed");
  const user = await ur.json();
  // Server-side gate: must be in the CKD server.
  const gr = await fetch(`${API}/users/@me/guilds/${env.CKD_GUILD_ID}/member`, auth);
  if (!gr.ok) { await audit(env, user.id, "login_not_ckd_member", null); return back("not_member"); }
  const gm = await gr.json();
  const name = (gm.nick || user.global_name || user.username || "member").slice(0, 64);
  const t = now();
  // Add or edit, never delete.
  await env.DB.prepare("INSERT INTO members (discord_id, display_name, is_si, owner_discord_id, created_at, updated_at) VALUES (?, ?, 0, NULL, ?, ?) ON CONFLICT(discord_id) DO UPDATE SET display_name = excluded.display_name, updated_at = excluded.updated_at")
    .bind(user.id, name, t, t).run();
  const tok = rand(32);
  const exp = new Date(Date.now() + SESSION_DAYS * 864e5).toISOString();
  await env.DB.prepare("INSERT INTO sessions (id_hash, discord_id, created_at, expires_at) VALUES (?, ?, ?, ?)").bind(await sha256(tok), user.id, t, exp).run();
  await audit(env, user.id, "login", null);
  return redirect(env.SITE_ORIGIN + "/#/me", [setCookie(FLOW, "", 0), setCookie(COOKIE, tok, SESSION_DAYS * 86400)]);
}

async function logout(env, req) {
  const origin = req.headers.get("Origin");
  if (origin !== env.SITE_ORIGIN) return json(env, { error: "bad_origin" }, 403); // CSRF guard
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

export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    const k = req.method + " " + url.pathname;
    if (req.method === "OPTIONS") {
      const r = cors(env, new Response(null, { status: 204 }));
      r.headers.set("Access-Control-Allow-Methods", "GET, POST"); return r;
    }
    if (k === "GET /auth/login") return login(env);
    if (k === "GET /auth/callback") return callback(env, req, url);
    if (k === "POST /auth/logout") return logout(env, req);
    if (k === "GET /api/me") {
      const m = await sessionMember(env, req);
      if (!m) return json(env, { signedIn: false }, 401);
      return json(env, { signedIn: true, name: m.display_name, isSI: !!m.is_si });
    }
    return json(env, { error: "not_found" }, 404);
  },
};
