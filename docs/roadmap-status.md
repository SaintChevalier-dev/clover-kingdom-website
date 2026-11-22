# Six-phase site path — status

Updated 2026-11-21 11:28 AM CT. Wording rule: archetype, never SI. Nothing here is spent or connected live without the gates below.

**Login rule (Jacob, 2026-11-21 10:46 AM CT):** "Discord login on cloverkingdom.net/base must be available but not required. Make the Discord sign-in optional — guests can browse and use Sage without logging in. Do not remove the login option entirely, just stop gating access behind it." Guests browse every public page and talk to Sage with no login; "Log in with Discord" stays visible and working. Only per-member pages (Member Hall, Round Table votes, My Quests, Account, the Tek Tribe game) still need login, because they show that member's own data.

| Phase | Step | Owner | Status | Blocker | Done when |
|---|---|---|---|---|---|
| 1 /base/ look and wording | 1 Sage on the page | Painter | Done: 2D armored sprite (a339831); 3D stand-in added (09afe69), slid clear of the chat card (ebdbbac) | — | Sage visible and moving on desktop and phone; 2D fallback without WebGL |
| | 2 "archetype" wording | Painter | Done everywhere: /base/ (8744748), full site copy (ebdbbac), header tags and the definitions FAQ ("AI = Archetype Intelligence"; "What is an archetype? What is PSI?") (HEALER's flag, 2026-11-21) | — | No "SI" in public copy |
| 2 Test loops and visitor trust | 3 Smoke + leak-scan workflows | Painter | Written, held off GitHub | GitHub workflow permission on the pushing machine (Jacob's sign-in) | Both workflows on main and green in `gh run list` |
| | 4 Privacy line + edit indicator | Painter | Done (d258ea8); privacy line updated with the local eDisk stub (09afe69); docs match (ebdbbac) | — | Footer text true to what the page does |
| | 4b Sage's join answer | Painter | Done (ebdbbac): real three join steps + Discord link; guests also get the public FAQ | — | "How do I join?" gives the steps |
| 3 Login return | 5 Return to where login started | Painter (front end), Tek Tribe (login service) | Front end done for /, /base/ and /classic/. Login service records: last completed sign-in 9:13 AM CT (before the return fix); none since, as of 10:25 AM CT | None. The real Discord login test is **optional (not a blocker)** per Jacob's 10:46 AM CT rule; run it whenever convenient. The login-service change in [login-return.md](login-return.md) still needs Jacob's yes, then Tek Tribe | A real login from each page lands back on that page, signed in (optional check) |
| 4 Sage library and live talk | 6 Read-only library | Jacob, then Painter | Plan written ([sage-library-and-live-ai.md](sage-library-and-live-ai.md)) | Jacob's yes on the bounds and the folder | Sage cites library pages, read-only |
| | 7 Live Sage answers | CKAKRT, Jacob, Knight | Plan written | CKAKRT vote, then Jacob's spend yes, then Knight's review | Live answers behind the bounds, canned fallback |
| | 5b Login optional for guests | Painter | Done (2026-11-21): login button shows at once on / and /base/ with "Login is optional"; Tek Tribe and CKC pages and nav open to guests | — | Guest with no cookie can browse public pages and chat with Sage; login button present |
| 5 Front door | 8 Base page at / | Painter | **Live** (merged 2026-11-21 on Jacob's go). Full site at /classic/; old /#/ links forward there | — | / is the base page; /classic/ and old links work |
| 6 Sage 3D | 0 Rights + generator check | ARGUS, Painter | Look on record: v04, original face, no hood (Jacob 2026-11-22). ARGUS grade still open | ARGUS's written grade for Meshy Free | Grade on record; look already on record |
| | 1 T-pose sheet, 1b wing study | Painter | v01 done; **v2 required before the Meshy run** (≥512 px/view, book, clear five-leaf stemless crest, clean bg); wing study v2 still open | — | v2 sheet + fixed wing study |
| | 2a Bake-off: Meshy primary, VRoid quiet backup | Painter | Lane chosen (Jacob 11:28 AM CT): Meshy Free (CC BY 4.0, attribution); Tripo free set aside; paid Tripo not chosen; VRoid is the quiet backup. Skill approved in GCKI. Sheet v2 comes first; no generate yet | ARGUS grade before the run; Free plan = $0, no spend; any paid upgrade needs Jacob's yes on the exact price | Scored Meshy (or VRoid backup) body logged; live ship still needs Jacob's yes |
| | 2–6 Model, size, rig, three.js, flag | Painter, site builder, Knight, Jacob | three.js Sage in the v06 cyberpunk-saint look live with the Webverse playtest (2026-11-22); drop-in slot `/base/assets/sage/sage.glb`; real model waits on 2a. Wings by hand; armor per docs/archetype-armor-standard.md | Step 2a | Real GLB live behind the flag, 2D fallback |

Details: [sage-3d-phase6.md](sage-3d-phase6.md), [front-door.md](front-door.md), [ci-loops.md](ci-loops.md).
