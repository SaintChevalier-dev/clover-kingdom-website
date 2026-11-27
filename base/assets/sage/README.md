# Sage avatar (live draft)

`sage.glb` is the walkable Sage v06 3D draft (owned build: Hunyuan3D-2mini shape + Blender rig, custom wing bones,
hand-authored idle / walk / talk / wave clips). Look locked by Jacob on Nov 27, 2026: halo, book, armor, wings, hair.
No staff (that's a later layer). Put live by Jacob's own yes on Nov 27, 2026, 9:14 AM CT.

`sage_tex0.jpg` is the base-color texture. The GLB references it by relative URI, so keep both files together.
It's kept outside the GLB because the site CSP has no `blob:` in connect-src, which blocks embedded GLB textures.

Turned on by `data-glb` on `#ckw-yard-canvas` in `/index.html`. Bump `?v=` there when the files change.
Steps: `docs/sage-3d-phase6.md`, section "Drop-in avatar slot".
