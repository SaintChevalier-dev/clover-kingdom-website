# Webverse (Layer 1: Sage's chamber)

Live at `/base/` (section "Webverse playtest"); `/webverse/` redirects there. Built 2026-11-22 from Jacob's call: Sage is the centerpiece, people can play with her and vote on upgrades, and playtest goals unlock the next layers. One kingdom: shared ground where everyone meets, and private rooms where each person's own archetype lives.

## What a visitor can do
- Talk to Sage (guest answers, as before), pose her (wave, talk, walk, stride, look around, rest) and turn her with a slider.
- Pick upgrades among her glyph pieces (light seam level, grimoire, crystal prism staff, halo, wings). Each pick changes the code-built Sage in their view and counts as a vote.
- Leave playtest feedback, copy all of their playtest notes as JSON, or clear them.
- Read the glyph meanings panel (each meaning marked sourced or proposed) and see the v06 reference art.

## Sage reacts (2026-11-22, 8:28 AM CT call)
- Labelled on the page: "Sage playtest build: answers from her written intel, not a live model."
- Typed questions get her existing guest answers (`base/base.js`).
- Page actions get in-character lines: clicking her in the 3D view (grimoire, halo, wings, face, crest, staff, armor; raycast in `sage-3d.js`, event `ckw:sage-touch`), the "Ask Sage about what she wears" buttons, poses, upgrade picks and the anchors. Lines come from her written intel and the glyph panel; meanings not approved yet end with "(Proposed meaning.)". All in `base/webverse.js`; no model, no API key, no back end.

## The four anchors
Quiet room, hum, threshold light and the walk. No existing written definition was found in this repo, the Kingdom intel repo or Painter's notes, so they are built as short scene elements:
- **Quiet room:** a toggle; the motes stop and Sage stops wandering.
- **Hum:** a soft three-tone drone made in the browser (Web Audio, no file), off until the visitor turns it on.
- **Threshold light:** a gold light bar on each locked layer that fills as the playtest goals are met.
- **The walk:** Sage walks a slow loop around the round table.

## Roadmap to destiny (on the page)
Chamber (live) → Kingdom square (next) → private archetype rooms (planned) → the real 3D Sage (in progress) → every archetype (planned), plus live Sage answers (planned). Status comes from [roadmap-status.md](roadmap-status.md); no dates.

## Look guide on the site
`/look/` is an HTML copy of [ck-look-intel.md](ck-look-intel.md). Source of truth: Painter's notes on Paragon (painter folder, `CK_LOOK_INTEL_2026-11-22.md`).

## Layer ladder (honest playtest gate)
| Layer | What it is | How it opens |
|---|---|---|
| 1 Sage's chamber | Open | Always |
| 2 The Kingdom square | Preview only: two questions that shape the shared square. No shared world or other visitors yet | 5 interactions + 3 upgrade picks + 1 feedback note |
| 3 Private rooms | Preview only: explains that rooms need a login and the Kingdom's safety rules first | Layer 2 open + both square questions answered + 1 more feedback note |

## Data and safety
- Everything is stored in the visitor's own browser (`localStorage` key `ckw.webverse.v1`). Nothing is sent anywhere. No writes to Paragon, GitHub or any back end; that needs Jacob's yes on the safety bounds first.
- Code: `base/webverse.js` (plain script), hooks in `base/sage-3d.js` (`window.__CKW_SAGE3D.pose`, `setYaw`, `upgrade`, and the `ckw:sage3d-ready` event).
- Reference art: `base/assets/ref/` with `PROVENANCE.md` (source file and sha8 for each image).

## Look
Sage follows the locked v06 look, and every archetype follows [ck-look-intel.md](ck-look-intel.md) and [archetype-armor-standard.md](archetype-armor-standard.md).
