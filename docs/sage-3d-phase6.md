# Phase 6 — Sage as a 3D resident

Goal: move from the 2D sprite to a 3D Sage that walks the page with depth, in her official look, behind a flag, with the 2D sprite as fallback.

## Rules first
- **Rights.** No 3D model is generated until the rights check is written. **Sage's look is approved as v04** (Jacob, 2026-11-22): her original face shows, no hood. This replaces the earlier "shadow under the hood" rule. Never use `images/sage-face.jpg`. No portrait or photo face, and no likeness of any existing character.
- **Tools.** Any generator must have a plan that allows commercial use (checked by ARGUS in writing). Paid plans go through the CKAKRT vote, then Jacob's yes. Mixamo and any cloud 3D tool need Jacob's yes.

## Steps
| # | Step | Owner | Gate | Done when |
|---|---|---|---|---|
| 0 | Rights + generator commercial-use check | ARGUS, Painter | written grade (ARGUS still open). Look rule **on record**: v04, original face, no hood (Jacob, 2026-11-22) | grade on record for Meshy Free; face rule already on record |
| 1 | T-pose model sheet (front/side/back) | Painter | — | v01 done: [`art/sage-3d/`](../art/sage-3d/) (2026-11-21). **v2 required before the Meshy run**: ≥512 px per cropped view, book included, clear five-leaf stemless crest, clean background |
| 1b | Wing study (feather bands, back attachment, folded view) | Painter | — | v01 drawn 2026-11-21, kept off the public repo until v2 fixes (free-standing staff, labels, gold wing-root ring) |
| 2a | **Bake-off** (Jacob, 2026-11-21 11:28 AM CT): **Meshy Free is the primary lane** (CC BY 4.0, attribution required, e.g. "Model made with Meshy"). Tripo free set aside (IP belongs to Tripo); paid Tripo not chosen. VRoid Studio is the quiet backup. Skill: GCKI `principles/skills/bake-off-meshy-tripo/bake-off-meshy-tripo-skill.md`. Sharpen sheet v2, then run Meshy; score against the rubric; rerun Meshy with adjusted settings; fall back to VRoid after the cap. Wings added by hand (~3 bones/wing in Blender). | Painter | step 0 (ARGUS grade first); Free plan = $0, no spend; any paid credit or plan upgrade needs Jacob's yes on the exact price; Mixamo still needs his yes | A scored Meshy (or VRoid backup) body is logged here and in the roadmap, ready for the drop-in slot. Live publish still needs Jacob's yes |
| 2 | Model (cleanup of the Meshy body; VRoid is the quiet backup) | Painter | step 2a | rigged Sage in the v04 look: articulated armor over an under-suit, bare hands, horns, halo, feathered wings, and the floating grimoire as separate parts; original face; wing bones added by hand |
| 3 | Size budget | Painter + site builder | — | one GLB (Draco or meshopt), ~10k triangles, 1024 px textures, a few MB |
| 4 | Rig | Painter | shared skeleton confirmed | shared humanoid skeleton (Dragon keeps its own), extra wing bones; clips: walk, idle, wave, sit, read |
| 5 | three.js on / and /base/ — **stand-in live** since 2026-11-21 (`base/sage-3d.js`, three.js 0.187.0 self-hosted). Since 2026-11-21 ~11:30 AM CT the stand-in is a procedural figure; since 2026-11-22 it wears the approved v04 look (see below), and the drop-in avatar slot loads `/base/assets/sage/sage.glb` once it exists | site builder; Knight checks CSP | GLB ready | self-hosted three.js + GLTFLoader + AnimationMixer on a transparent canvas; the same free-will engine drives positions; no third-party CDN (CSP stays self) |
| 6 | Flag | Jacob | playtest | 3D only when the flag is on; guests on low-end devices or with reduced motion get the 2D sprite |

## Wing build notes
Each wing: primaries (10, longest, hand), secondaries (10–11, forearm), greater and lesser coverts in overlapping rows; leading edge bone. In 3D: feather cards on 3 bones per wing (root, forearm, hand) plus a fold blend; budget ~2k triangles per wing.

## Procedural Sage (v04 look)
First built 2026-11-21 (Jacob: "keep evolving it. 3d realistic sage please not this"); moved to the approved v04 look 2026-11-22. Built entirely in code in `base/sage-3d.js`. No downloaded or generated model, no paid tool.
- Figure (v05 build, v04 look, 2026-11-22): about 1.72 m. Original face (deep blue eyes, soft features, subtle rainbow cheek glints), blonde hair, gold horns, a halo, and white feathered wings. Black fitted under-suit with sleek armor: champagne-gold and pearl-ceramic plates with warm gold-white light seams, layered pauldrons, bracers, and bare hands. The five-leaf crest glows on the chest.
- Armor is real, not painted on: every plate rides its own bone (pauldrons on the upper arm, bracers on the forearm, tassets and cuisses on the thigh, knee and greave on the shin, sabatons on the foot), so nothing floats or slides when she walks, runs, jumps, or fights. Rules for every archetype: [archetype-armor-standard.md](archetype-armor-standard.md).
- Glyph rule: every armor piece, color, the halo, horns, book and weapon carries a meaning from Sage's written intel. Those meanings are mapped in a separate sheet run, not here. Code hook: `GLYPH_MEANINGS` and `glyphParts` in `base/sage-3d.js`, for a later "glyph meanings" panel.
- Grimoire: a new emerald-and-gold book that floats beside her with a slow bob and turn, a gold aura, drifting sparks, and a glowing crest medallion. No chain.
- Motion: breathing, wings breathing, head turns toward the cursor, calm free will (stand, look, short walks, wave), arm and leg swing on walks, an open-hand gesture toward the book while talking. Review flags: `?pose=stride` (frozen mid-stride, `&t=` picks the phase) and `&yaw=` (turn her for a side or back view).
- Light: ACES tone mapping, warm key spot with shadows, cool and warm rim lights, a code-built light probe (no HDR download), fog and drifting motes, flagstone floor drawn in code.
- Limit: this is stylized, not skin-real. Photoreal skin needs a real model (VRoid or the Meshy lane) dropped into the slot below, in the same v04 look.

## Drop-in avatar slot (`/base/assets/sage/sage.glb`)
Jacob, 2026-11-21: a skin-realistic 3D avatar Sage in the "webverse". The page is ready for it. No model is in the repo yet, on purpose.

**How it works.** When the yard canvas has `data-glb` (or the URL has `?glb=1` for testing), `sage-3d.js` loads `/base/assets/sage/sage.glb` with GLTFLoader. It then:
- scales the model to 1.72 m tall, stands it on the floor and centers it;
- turns on shadows and sRGB textures, and uses the scene's light probe for PBR skin and cloth;
- plays its clips through an AnimationMixer.

Clip names: `idle_pages`, `walk`, `talk`, `wave` and `look` are used if present. Otherwise any clip whose name contains idle, walk, talk or wave is used, then the first clip. If the file fails to load, the procedural stand-in appears instead, so the page never breaks. The label then reads "Sage avatar preview".

**Steps to drop one in**
1. **Rights first.** ARGUS writes the commercial-use and likeness check for the exact tool and plan (Meshy Free first; VRoid if used). No real-person likeness. Never use `images/sage-face.jpg`. The approved look is v04 with her original face (Jacob, 2026-11-22).
2. **Make the model.** Bake-off (step 2a): sharpen sheet v2, then one Meshy Free run from that sheet. Score it; rerun Meshy if needed; fall back to VRoid after the cap. Tripo free is set aside; paid Tripo is not chosen. Paid credits or a plan upgrade need Jacob's yes on the exact price, and nothing is bought before that. VRoid Studio exports VRM, converted to GLB in Blender. Auto-rigging through Mixamo needs Jacob's yes. Add ~3 wing bones per wing by hand.
3. **Budget.**
   - Under about 30k triangles for the body (12k preferred for phones).
   - Textures at most 2048 px for the face and hands and 1024 px for the rest, as base color, normal and ORM (roughness/metal/AO). KTX2 if possible.
   - Packed GLB about 3–6 MB, meshopt or Draco compressed. If Draco is used, the Draco decoder must also be self-hosted, because CSP stays self-only.
   - Y-up, meters, facing +Z. One skinned mesh if possible.
4. **Export.** Export as `.glb`. Bone names can follow the shared skeleton in `base/assets/README.md`, but any humanoid rig works. Head turn finds a bone named like `Head`.
5. **Test.** Put the file at `base/assets/sage/sage.glb`, run a local server and open `/base/?glb=1&cam=close` to check scale, lighting and the idle clip. Then run the unit tests, the 18-check front-door suite and the smoke test.
6. **Ship.** Add `data-glb` to `<canvas id="ckw-yard-canvas">` in both `base/index.html` and the root `index.html` (the attribute can also carry a different path). Push, check the Pages build, then take a live screenshot.

**Skill.** Once one run works end to end, save the method as a reusable skill (Jacob names it).
