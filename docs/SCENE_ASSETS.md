# Front-page scene assets (local test copy, not pushed)

The front page scene is only: floor, sky, one realistic round table, one chair, Sage. No seat stones, doors, rail or plaque.

| Asset | File (served from /base/assets/) | Source | License |
|---|---|---|---|
| Round table | scene/table.glb (+ table_tex0-2.jpg), scene/table_lite.glb for phones | Poly Haven "Round Wooden Table 01" by Ulan Cabanilla, https://polyhaven.com/a/round_wooden_table_01 | CC0 (public domain) |
| Chair | scene/chair.glb (+ chair_tex0-2.jpg), scene/chair_lite.glb for phones | Poly Haven "Wooden Chair 01" by Jake Mobley, https://polyhaven.com/a/WoodenChair_01 | CC0 (public domain) |
| Sage | sage/sage.glb (+ sage_tex0-2.jpg), sage/sage_lite.glb for phones | Meshy 7.5 image-to-3D from the official v06 art, Meshy Pro, private license | Kingdom-owned |

CC0 means no attribution is required; credit is given here anyway.

Processing (Blender 4.2.5, scripts in sage_3d/pipeline and painter_out/2026-11-28/meshy_web/pipeline): table scaled x0.80 (1.12 m wide, top at 0.80 m), chair scaled x0.72 (seat about 0.47 m, back 1.64 m), feet on y=0, welded, textures kept at 2K (1K for phones), exported as plain GLB with JPEG textures moved to external same-origin files (CSP script-src 'self', no blob:). Phone versions: table 8,640 -> 4,499 tris, chair 19,992 -> 8,999 tris.

## Interaction update (local, not pushed)
Props are now true-scale to Sage (1.72 m): table top 0.75 m (TABLE_SCALE = 0.75/0.804) and chair seat 0.45 m (CHAIR_SCALE = 0.45/0.48), applied at runtime in
base/sage-3d.js on top of the baked x0.80 / x0.72 GLBs. The table is yawed -0.663 rad. Both register as interactables (chair-1 seat, table-1 surface) with marked use
points (`?points=1`). Sage uses sage/sage_rigged.glb and sage_rigged_lite.glb (Mixamo rig, 9 clips). See SAGE_3D_SME.md.

## Meshy sit clips update (local, not pushed)
sage_rigged(.glb / _lite.glb) now carry Meshy's own Sit_Down / Sit_Idle / Stand_Up / Sit_Talk (re-rooted so she sits on the 0.45 m seat) plus a procedural Table_Lean with the hands on the table top.
Chair moved to the back-right of the table at 1.22 m from its centre. Wing tuck is applied in sage-3d.js (bones Bone_038 / Bone_042). See SAGE_3D_SME.md.
