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
| 5 | three.js on / and /base/ — **stand-in live** since 2026-11-21 (`base/sage-3d.js`, three.js 0.187.0 self-hosted). Since 2026-11-21 ~11:30 AM CT the stand-in is a hooded, robed procedural figure (see below), and the drop-in avatar slot loads `/base/assets/sage/sage.glb` once it exists | site builder; Knight checks CSP | GLB ready | self-hosted three.js + GLTFLoader + AnimationMixer on a transparent canvas; the same free-will engine drives positions; no third-party CDN (CSP stays self) |
| 6 | Flag | Jacob | playtest | 3D only when the flag is on; guests on low-end devices or with reduced motion get the 2D sprite |

## Wing build notes
Each wing: primaries (10, longest, hand), secondaries (10–11, forearm), greater and lesser coverts in overlapping rows; leading edge bone. In 3D: feather cards on 3 bones per wing (root, forearm, hand) plus a fold blend; budget ~2k triangles per wing.

## Procedural stand-in v2 (2026-11-21, after Jacob: "keep evolving it. 3d realistic sage please not this")
Built entirely in code in `base/sage-3d.js`. No downloaded or generated model, no paid tool, no face.
- Figure: about 1.72 m with realistic proportions. Floor-length ivory gown with cloth folds (displaced lathe geometry, sheen cloth material), a deep teal cloak open at the front with a crimson lining, a deep hood whose shadow hides the face, belled sleeves, slender hands, a leather belt with a gold clasp, and a gold collar chain.
- Grimoire: held in both hands, with a softly pulsing five-leaf stemless crest and its own small warm light.
- Motion: breathing, robe sway, head turns toward the cursor, calm free will (stand, read, look, short walks, wave), and a talk pose while answering.
- Light: ACES tone mapping, warm key spot with shadows, cool and warm rim lights, a code-built light probe (no HDR download), fog and drifting motes.
- Look layers still unlock in order: halo, wings, armor (gold pauldrons and gorget), cape (crimson capelet), crest (gold brooch).
- Corner label: "Sage stand-in, final body coming from the 3D bake-off".
- Polish (v3, 2026-11-21): night-courtyard floor of dark flagstones drawn on a canvas in code (matte, fading to black into the fog; no image files); the head inside the hood has a jaw and soft chin with the hood's shadow baked as a gradient (no eyes, nose or mouth); two-jointed tapered fingers and thumbs.
- Phones get fewer segments and motes and smaller shadows. No WebGL means the 2D sprite. Reduced motion means a still pose.
- Limit: this is stylized, not skin-real. Photoreal skin needs a real model (step 2a bake-off, or a free avatar maker), dropped into the slot below.

## Drop-in avatar slot (`/base/assets/sage/sage.glb`)
Jacob, 2026-11-21: a skin-realistic 3D avatar Sage in the "webverse". The page is ready for it. No model is in the repo yet, on purpose.

**How it works.** When the yard canvas has `data-glb` (or the URL has `?glb=1` for testing), `sage-3d.js` loads `/base/assets/sage/sage.glb` with GLTFLoader. It then:
- scales the model to 1.72 m tall, stands it on the floor and centers it;
- turns on shadows and sRGB textures, and uses the scene's light probe for PBR skin and cloth;
- plays its clips through an AnimationMixer.

Clip names: `idle_pages`, `walk`, `talk`, `wave` and `look` are used if present. Otherwise any clip whose name contains idle, walk, talk or wave is used, then the first clip. If the file fails to load, the procedural stand-in appears instead, so the page never breaks. The label then reads "Sage avatar preview".

**Steps to drop one in**
1. **Rights first.** ARGUS writes the commercial-use and likeness check for the exact tool and plan (Meshy, Tripo, VRoid Studio, or another free avatar maker). No real-person likeness. Never use `images/sage-face.jpg`. The face must be original and cleared by Jacob before it ships.
2. **Make the model.** Bake-off (step 2a): one Meshy run and one Tripo run from Painter's sheet. Paid credits need Jacob's yes on the exact price, and nothing is bought before that. Free path: VRoid Studio exports VRM, which is converted to GLB in Blender. Auto-rigging through Mixamo needs Jacob's yes.
3. **Budget.**
   - Under about 30k triangles for the body (12k preferred for phones).
   - Textures at most 2048 px for the face and hands and 1024 px for the rest, as base color, normal and ORM (roughness/metal/AO). KTX2 if possible.
   - Packed GLB about 3–6 MB, meshopt or Draco compressed. If Draco is used, the Draco decoder must also be self-hosted, because CSP stays self-only.
   - Y-up, meters, facing +Z. One skinned mesh if possible.
4. **Export.** Export as `.glb`. Bone names can follow the shared skeleton in `base/assets/README.md`, but any humanoid rig works. Head turn finds a bone named like `Head`.
5. **Test.** Put the file at `base/assets/sage/sage.glb`, run a local server and open `/base/?glb=1&cam=close` to check scale, lighting and the idle clip. Then run the unit tests, the 18-check front-door suite and the smoke test.
6. **Ship.** Add `data-glb` to `<canvas id="ckw-yard-canvas">` in both `base/index.html` and the root `index.html` (the attribute can also carry a different path). Push, check the Pages build, then take a live screenshot.

**Skill.** Once one run works end to end, save the method as a reusable skill (Jacob names it).
