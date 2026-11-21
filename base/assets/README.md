# Sage assets for the base page

## Sprite sheet (Tier A, 2D fallback)

Drop Painter's Sage sprite sheet here as `sage.png` if one is delivered.

Expected file: a transparent PNG, 4 columns by 4 rows, each frame 256×352 pixels (sheet 1024×1408). Rows from the top: idle, walk, talk, wave. Character faces right.

Until `sage.png` is present, the 2D fallback is the live Sage sprite v3 (armor, feathered wings, staff, articulated walk). That figure is a stand-in, not the final Painter sheet.

Optional later: per-layer PNGs in `layers/` (halo.png, wings.png, armor.png, cape.png, crest.png).

## 3D model contract: `sage.glb` (shared skeleton)

Drop the real Sage model here as `sage.glb`. Until that file is present, the page builds a faceless procedural stand-in on the same skeleton and labels it "Placeholder 3D, not Sage's final look."

### Coordinates
- Y-up, units in meters, character faces +Z at rest.
- Root on the ground plane (y = 0). Eye height around 1.5–1.7 m.
- Same camera, scale, and ground line as later residents so they can share a courtyard.

### Shared humanoid skeleton (bone names, exact spelling)

Hips
  Spine
    Chest
      Neck
        Head
      ShoulderL → UpperArmL → LowerArmL → HandL
      ShoulderR → UpperArmR → LowerArmR → HandR
      HaloSocket
      WingL
      WingR
      ArmorSocket
      CapeSocket
      CrestSocket
  UpperLegL → LowerLegL → FootL
  UpperLegR → LowerLegR → FootR

Halos, wings, armor, cape and crest snap to those sockets (and later holy-knight gear can too). Dragon will need its own rig; Sage uses this humanoid one.

### Animation clips (exact names)
- `idle_pages` — idle, turning pages of a book
- `walk` — stepping walk with foot plants
- `talk` — talk loop while answering
- `wave`
- `look` — look around

### Rights
No Sage head or face in the official GLB until an original face is cleared. The residents pack says Sage is not cleared yet and must not be modeled on a copyrighted or trademarked character. The local 3D stand-in is faceless on purpose.

### Size budget (proposed, not decided)
The residents pack leaves the budget to the site build. Proposed starting cap, open for Jacob and the site build to change:
- Sage: at most about 12,000 triangles
- Courtyard props in the GLB, if any: at most about 2,000 triangles
- Textures: at most 1024×1024, prefer 512 where it still looks right
- Packed `sage.glb`: at most about 1.5 MB
A later courtyard of many residents may need a tighter cap.

### 3D generator
Confirm commercial-use terms of any 3D tool before generating a real model. That check is still open.

### Turning the model on
When `sage.glb` is committed here, also add `data-glb` to `<canvas id="ckw-yard-canvas">` in `base/index.html`. Without that attribute the page never requests the file, so no 404 appears in the console.
