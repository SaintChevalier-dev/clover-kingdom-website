# /base/ — the stripped base page

Live at https://cloverkingdom.net/base/. It is the base Jacob iterates on: he asks for a change, it ships, he refreshes.

## What is on the page
- **Login bar.** "Log in with Discord" uses the existing login service at `auth.cloverkingdom.net` (Discord OAuth with PKCE, membership in the Clover Kingdom Discord required). Signed in, it shows the member's display name and a Log out button.
- **Sage chat.** Sage answers from a fixed set of answers (keyword matched, specific questions first, the generic clover line last). There is no live AI yet. Nothing typed leaves the browser.
- **Sage sprite.** Sage walks and acts on her own around the free space of the page. See [sage-sprite.md](sage-sprite.md).
- **Privacy line and edit indicator** in the footer.

Nothing else: no other residents, no courtyard, no crest animation, no marketing copy.

## Privacy line (exact text)
> Privacy: talking to Sage as a guest saves nothing. Your messages stay in your browser and never reach us. If you log in with Discord, we keep your Discord ID, your display name and your login times so you stay signed in. We never sell your data.

Why it is true today:
- Sage's answers are computed in the browser (`base/base.js`). No chat request is sent anywhere.
- The only network call the page makes is `GET auth.cloverkingdom.net/api/me` ("am I signed in?"). Guests get `401 {"signedIn":false}`.
- The login service stores a member row (Discord ID, display name), a hashed session token (24 hours) and a login/logout audit log. It ignores the Discord refresh token.
- If live Sage ever stores chats, this line must change before that ships.

## Edit indicator
The footer shows `Last edited <date>`. Update it in `base/index.html` with every change to /base/, so Jacob can see a refresh picked up the new version.

## Files
- `base/index.html` — markup and CSP (`script-src 'self'`; only `auth.cloverkingdom.net` may be fetched)
- `base/base.js` — login bar, login-return marker, Sage set answers
- `base/base.css` — styles, including the sprite's paint
- `base/sage-sprite.js` — the sprite and its behavior engine
- `.github/scripts/base-smoke.js` — headless smoke test (see [ci-loops.md](ci-loops.md))
