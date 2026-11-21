# /base/ becomes the front door (staged, not live)

Status: **prepared on branch `front-door-staging`, not merged.** The live front page is unchanged.

## What the staged change does
- `/` serves the base page (login + Sage + sprite), with its asset paths made absolute.
- The current front page moves to `/classic/` unchanged in content; its assets keep working via absolute paths.
- Old deep links such as `/#/join` or `/#/members` on `/` are forwarded to `/classic/#/...`, so nothing already shared breaks.
- The login service still lands on `/#/me`; the new front door treats that as "back from login" and shows the signed-in state, so login return works without the Worker change.
- `/base/` stays as an alias.

## Before it is safe to flip
1. Phase 2 step 3 (smoke test + leak scan running) — needs the GitHub workflow permission.
2. Phase 2 step 4 (privacy line + edit indicator) — done.
3. Phase 3 (login return) — front-end fix done; one real login test from /base/ still to run.
4. Knight reviews the diff.
5. Jacob says go.

## Flip and undo
Flip: merge `front-door-staging` into `main`. Undo: revert that merge commit; Pages redeploys in about a minute.
