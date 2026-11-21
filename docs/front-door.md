# The base page is the front door (live)

Status: **live since 2026-11-21** (merged on Jacob's go). Undo: revert the merge commit; Pages redeploys in about a minute.

## What changed
- `/` serves the base page: Discord login, Sage (3D stand-in, 2D fallback), guest chat, privacy line, edit indicator, and links to How to join, The archetypes, FAQ and the full site.
- The previous front page is at `/classic/`, content unchanged. Its assets load from absolute paths (`/styles.css`, `/app.js`, `/images/...`, `/round-table.json`).
- Old deep links on `/` such as `/#/join` or `/#/members` forward to `/classic/#/...`, including hash changes after load.
- `/base/` stays as an alias (not indexed).
- `sitemap.xml` and `llms.txt` point at the new paths.

## Login return
The login service still lands on `/#/me`. The front door reads a short marker (15 minutes, allowlisted paths only: `/`, `/base/`, `/classic/`) left when sign-in was clicked:
- started on `/classic/` -> back to `/classic/#/me` (Member Hall flow unchanged)
- started on `/base/` -> back to `/base/`
- started on `/` or no marker -> stays on `/`, shows the signed-in state, cleans the URL
`?login=failed|not_member` is carried through. The cleaner login-service fix is in [login-return.md](login-return.md).

## Checked before merge
Headless Chrome against a local copy: front door title, privacy line, links, Sage present, join answer; `/#/join` and hash changes forward to `/classic/`; classic home renders with no broken images; `/#/me` cleans to `/`; markers for `/classic/` and `/base/` return correctly; an outside URL in the marker is ignored; classic sign-in click leaves the marker; `/base/` works; no page errors; no 4xx assets (the looping video's aborted range request is normal). Unit tests in `test/` pass.
