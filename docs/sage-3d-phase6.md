# Phase 6 — Sage as a 3D resident

Goal: move from the 2D sprite to a 3D Sage that walks the page with depth, in her official look, behind a flag, with the 2D sprite as fallback.

## Rules first
- **Rights.** No 3D model is generated until the rights check is written. Sage's face stays a simple original stylized face (blue eyes, rainbow cheek glints). No portrait or photo face, and no likeness of any existing character.
- **Tools.** Any generator must have a plan that allows commercial use (checked by ARGUS in writing). Paid plans go through the CKAKRT vote, then Jacob's yes. Mixamo and any cloud 3D tool need Jacob's yes.

## Steps
| # | Step | Owner | Gate | Done when |
|---|---|---|---|---|
| 0 | Rights + generator commercial-use check | ARGUS, Painter | written grade | grade on record, face rule on record |
| 1 | T-pose model sheet (front/side/back) | Painter | — | **done v01**: [`art/sage-3d/`](../art/sage-3d/) (2026-11-21) |
| 1b | Wing study (feather bands, back attachment, folded view) | Painter | — | v01 drawn 2026-11-21, kept off the public repo until v2 fixes (free-standing staff, labels, gold wing-root ring) |
| 2a | **Bake-off** (Jacob, 2026-11-21): one run of Painter's Sage sheet through Meshy and one through Tripo; compare the two rigged models; the winner becomes Sage's real body for the door | Painter | step 0 (rights first); any paid credits need Jacob's yes on the exact price, nothing bought before that | both rigged models compared side by side (same sheet, same pose, same lighting) and the winner recorded here and in the roadmap |
| 2 | Model (cleanup of the bake-off winner; VRoid is the free fallback) | Painter | step 2a | rigged Sage with armor, cloak, horns, halo, feathered wings and staff as separate parts. Preferred: VRoid Studio (free) exporting VRM. Alternate: licensed image-to-3D + Blender cleanup |
| 3 | Size budget | Painter + site builder | — | one GLB (Draco or meshopt), ~10k triangles, 1024 px textures, a few MB |
| 4 | Rig | Painter | shared skeleton confirmed | shared humanoid skeleton (Dragon keeps its own), extra wing bones; clips: walk, idle, wave, sit, read |
| 5 | three.js on /base/ — **stand-in live** since 2026-11-21 (`base/sage-3d.js`, three.js 0.187.0 self-hosted, placeholder figure, loads `/base/assets/sage.glb` once it exists) | site builder; Knight checks CSP | GLB ready | self-hosted three.js + GLTFLoader + AnimationMixer on a transparent canvas; the same free-will engine drives positions; no third-party CDN (CSP stays self) |
| 6 | Flag | Jacob | playtest | 3D only when the flag is on; guests on low-end devices or with reduced motion get the 2D sprite |

## Wing build notes
Each wing: primaries (10, longest, hand), secondaries (10–11, forearm), greater and lesser coverts in overlapping rows; leading edge bone. In 3D: feather cards on 3 bones per wing (root, forearm, hand) plus a fold blend; budget ~2k triangles per wing.
