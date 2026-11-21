# Login return to /base/

## The problem
The login service (`auth.cloverkingdom.net`, a Cloudflare Worker owned by Tek Tribe) always redirects to `https://cloverkingdom.net/#/me` after Discord login (and `/#/me?login=failed|not_member` on errors). A login started on /base/ therefore landed on the old member page.

## Front-end fix (live, this repo only)
1. When the visitor presses "Log in with Discord" on /base/, `base/base.js` stores a short marker in `localStorage`: `ckw_return = {"path":"/base/","t":<now>}`.
2. When the main site loads on `#/me`, `app.js` (top of file, `loginReturn()`) reads and deletes the marker. If the path is exactly `/base/` (or `/` for the future front door) and it is under 15 minutes old, it `location.replace`s to that path, passing `?login=failed|not_member` along.
3. /base/ shows a plain message for those two errors and cleans the URL.

**Since the front door went live (2026-11-21):** `/#/me` is now served by the base page itself, so `base/base.js` does the return at `/`: marker `/classic/` -> `/classic/#/me`, marker `/base/` -> `/base/`, otherwise stay on `/`. The full site (`app.js` at `/classic/`) leaves a `/classic/` marker when its Discord sign-in link is clicked. `app.js`'s own `loginReturn()` stays as a safety net. See [front-door.md](front-door.md).

Safety: only two hard-coded paths are allowed (no open redirect), the marker is one-time and short-lived, and with storage off the old behavior simply stays. Undo by removing `loginReturn()` from `app.js` and the click handler from `base/base.js`.

## Cleaner fix in the auth Worker (Tek Tribe; needs Jacob's yes; not done here)
Let `/auth/login` take an allowlisted return path and carry it through the OAuth flow cookie:

```js
// login(env, url): accept ?return=/base/ (allowlist only)
const RETURN_OK = new Set(["/", "/base/"]);
const ret = RETURN_OK.has(url.searchParams.get("return")) ? url.searchParams.get("return") : "/";
// store it with state + verifier in the existing 10-minute flow cookie
return redirect(u.toString(), [setCookie(FLOW, state + "." + verifier + "." + encodeURIComponent(ret), 600)]);

// callback(): read it back and use it instead of "/#/me"
const [state, verifier, retRaw] = flow.split(".");
const ret = RETURN_OK.has(decodeURIComponent(retRaw || "")) ? decodeURIComponent(retRaw) : null;
const dest = ret ? env.SITE_ORIGIN + ret : env.SITE_ORIGIN + "/#/me";
// success: redirect(dest, [...]); errors: redirect(dest + (ret ? "?login=" : "#/me?login=") + why, [...])
```

Then /base/ links to `https://auth.cloverkingdom.net/auth/login?return=/base/`, and the front-end marker can be removed. Route `route()` must pass `url` into `login()`. Test: one login from /base/ returns to /base/ signed in; a `return=https://evil.example` request falls back to `/#/me`.
