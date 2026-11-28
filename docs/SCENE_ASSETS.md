# Front-page scene assets (local test copy, not pushed)

The front page scene is only: floor, sky, one realistic round table, one chair, Sage. No seat stones, doors, rail or plaque.

| Asset | File (served from /base/assets/) | Source | License |
|---|---|---|---|
| Round table | scene/table.glb (+ table_tex0-2.jpg), scene/table_lite.glb for phones | Poly Haven "Round Wooden Table 01" by Ulan Cabanilla, https://polyhaven.com/a/round_wooden_table_01 | CC0 (public domain) |
| Chair | scene/chair.glb (+ chair_tex0-2.jpg), scene/chair_lite.glb for phones | Poly Haven "Wooden Chair 01" by Jake Mobley, https://polyhaven.com/a/WoodenChair_01 | CC0 (public domain) |
| Sage | sage/sage.glb (+ sage_tex0-2.jpg), sage/sage_lite.glb for phones | Meshy 7.5 image-to-3D from the official v06 art, Meshy Pro, private license | Kingdom-owned |

CC0 means no attribution is required; credit is given here anyway.

Processing (Blender 4.2.5, scripts in sage_3d/pipeline and painter_out/2026-11-28/meshy_web/pipeline): table scaled x0.80 (1.12 m wide, top at 0.80 m), chair scaled x0.72 (seat about 0.47 m, back 1.64 m), feet on y=0, welded, textures kept at 2K (1K for phones), exported as plain GLB with JPEG textures moved to external same-origin files (CSP script-src 'self', no blob:). Phone versions: table 8,640 -> 4,499 tris, chair 19,992 -> 8,999 tris.
