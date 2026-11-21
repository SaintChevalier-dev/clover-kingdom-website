# CI loops (written, not yet on GitHub)

Two GitHub Actions workflows are ready but cannot be pushed yet: GitHub refuses workflow files from a sign-in that lacks the `workflow` permission.

| Workflow | When | Does |
|---|---|---|
| `base-smoke` | every push to main, nightly, manual | Waits for the Pages build of the pushed commit, loads https://cloverkingdom.net/base/ in headless Chrome, fails on non-200, any console error (except the expected signed-out 401 from `/api/me`), a missing sprite or login bar, or Sage not replying to a test message. Script: `.github/scripts/base-smoke.js` (already in the repo). |
| `intel-scan` | every push and pull request | Scans only the new commits / diff (older history is known to hold some strings): gitleaks, plus a grep that fails on Windows drive paths, user-profile paths, private email domains and the private sky-map name. |

## To turn them on
1. On the machine that pushes, run `gh auth refresh -s workflow` and approve the GitHub sign-in in the browser (Jacob).
2. Add the two files under `.github/workflows/` and push.
3. Check `gh run list` shows both passing.

Until then the smoke script is run by hand before each push (`node .github/scripts/base-smoke.js https://cloverkingdom.net/base/`).
