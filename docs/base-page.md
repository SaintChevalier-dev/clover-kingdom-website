# /base/ — the stripped base page

Live at https://cloverkingdom.net/base/. It is the base Jacob iterates on: he asks for a change, it ships, he refreshes.

## What is on the page
- **Login bar.** "Log in with Discord" uses the existing login service at `auth.cloverkingdom.net` (Discord OAuth with PKCE, membership in the Clover Kingdom Discord required). Signed in, it shows the member's display name and a Log out button.
- **Sage chat.** Guests get canned answers (no live AI). Safety answers come first (crisis -> 988, identity, privacy, therapy, private topics), then the join steps, sign-in, "about", the public FAQ (price, ranks, deletion, reports), and a gentle "let's talk it through" fallback. Members get the full set of answers. Nothing typed leaves the browser.
- **Join answer.** "How do I join?" (and sign up / apply / become a member) gets the same three steps as the main site's How to join: follow Saint Chevalier on X, message him or apply to the Discord, take part. It comes with an "Open the Discord" link. Only sign-in / account questions get the "Log in with Discord above" pointer. (Fixed 2026-11-21 after the guest-mode update sent every join question to the login pointer.)
- **3D stand-in Sage** (since 2026-11-21, `base/sage-3d.js`, three.js 0.187.0 self-hosted in `base/vendor/`). Sage in the locked v06 look, built in code (no downloaded or generated model): v04 face with deep blue eyes, pearl-white plate with gold trim and warm light seams over a black under-suit, bare hands, halo, small gold horns, full white wings from between the shoulder blades, and a white-and-gold grimoire floating beside her. No aura. Labelled "Sage, v06 look (built in code)". Below the chat card is the Webverse playtest ([webverse.md](webverse.md)). On wide screens the courtyard is slid to the right of the chat card so she stays visible. With no WebGL it falls back to the 2D sprite ([sage-sprite.md](sage-sprite.md)). A real rigged avatar drops in at `/base/assets/sage/sage.glb` ([sage-3d-phase6.md](sage-3d-phase6.md), "Drop-in avatar slot"). Flags: `?layers=N`, `?pose=walk|talk|wave|stride`, `&yaw=` (turn her), `?cam=close` (portrait view for review), `?glb=1` (test the avatar slot).
- **Look layers.** "Look: default / Reset look" shows which look layers are unlocked (saved in this browser).
- **Local eDisk stub** (`base/edisk.js`). Each chat turn plus a non-identifying context note (returning or not, time of day, device type, referrer present or not) is saved to this browser's localStorage under `ckw-edisk-stub-v1`. Nothing is sent anywhere. A real server hookup needs a typed yes and a new privacy line first.
- **Privacy line and edit indicator** in the footer.

## Privacy line (exact text)
> Privacy: talking to Sage as a guest keeps a copy in this browser only, so Sage can improve on this device. Your messages never reach us. If you log in with Discord, we keep your Discord ID, your display name and your login times so you stay signed in. We never sell your data.

(Changed 2026-11-21 with the local eDisk stub. The first version said "saves nothing", which stopped being true once chats were kept in the browser.)

Why it is true today:
- Sage's answers are computed in the browser (`base/base.js`). No chat request is sent anywhere.
- The eDisk stub writes only to this browser's localStorage. Sage's own answer to "are my chats saved?" says the same thing.
- The only network call the page makes is `GET auth.cloverkingdom.net/api/me` ("am I signed in?"). Guests get `401 {"signedIn":false}`.
- The login service stores a member row (Discord ID, display name), a hashed session token (24 hours) and a login/logout audit log. It ignores the Discord refresh token.
- If live Sage ever stores chats, this line must change before that ships.

## Edit indicator
The footer shows `Last edited <date>`. Update it in `base/index.html` with every change to /base/, so Jacob can see a refresh picked up the new version.

## Files
- `base/index.html` — markup and CSP (`script-src 'self'`; only `auth.cloverkingdom.net` may be fetched)
- `base/base.js` — login bar, login-return marker, Sage set answers
- `base/base.css` — styles, including the sprite's paint
- `base/sage-sprite.js` — the 2D sprite and its behavior engine (fallback when there is no WebGL)
- `base/sage-3d.js`, `base/vendor/` — 3D stand-in Sage and self-hosted three.js
- `base/edisk.js` — local-only eDisk stub
- `.github/scripts/base-smoke.js` — headless smoke test (see [ci-loops.md](ci-loops.md))
