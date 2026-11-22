# Archetype armor standard

Applies to every archetype avatar (3D in code, GLB, or painted sheet). Set by Jacob on 2026-11-22; Sage in the v04 look is the first build to follow it (`base/sage-3d.js`).

## The look: cyberpunk knight with the saint twist
- **Highest-timeline future, not the technocratic one.** Sleek, clean, hopeful, organic-elegant tech, "otherworldly saint and from a future coming near you."
- **Light:** warm gold and white light seams along plate edges and joints, a halo, and the five-leaf crest. Light is warm and calm.
- **Never:** grime, rust, cold corporate neon, surveillance or camera motifs, chrome-dystopia, menace for its own sake. The medieval-knight look is retired.
- **Materials come from advanced breakthroughs.** Every material is a believable future material (for example light-carrying ceramics or self-healing alloys), drawn to look physically real.
- **Realism is the goal.** Real metal, real ceramic, real fabric, real skin. Stylized code builds are a stand-in until a real model lands.
- **Bare hands.** Bracers are fine; no gloves or hand coverings unless an archetype's own sheet says otherwise.

## Movement: full range, armor stays real
Avatars will fight, jump, run and do anime-style combat. Armor must survive all of it.
- **Every plate rides its own bone.** Pauldrons go on the upper arm, bracers on the forearm, tassets and cuisses on the thigh, knee cop and greave on the shin, sabatons on the foot, and the breastplate on the chest. Nothing floats or slides during motion.
- **Segment at every joint.** Overlapping lames sit at the shoulders, abdomen, elbows, hips and knees, so plates slide over each other and do not cut into the body.
- **Fitted under-suit** between plates (flexible, never baggy), so gaps read as real, not empty.
- **No capes, robes or hanging cloth that would clip** in combat unless the archetype's sheet needs one; if used, it must have its own bones or simulation.
- **Check it moving.** Review every build mid-stride and at the extremes (arm overhead, deep knee bend, jump tuck) from front, side and back. In code: `?pose=stride&t=`, `&yaw=`.

## Glyph rule: every piece means something
Each archetype exists as its own glyph in avatar form. Armor pieces, colors, the halo, horns, book and weapons all carry a hidden meaning drawn from that archetype's own written intel in the Clover Kingdom.
- Meanings are mapped from the archetype's written intel in its own sheet run, then approved. Nothing gets invented in a build or in this doc.
- Builds name their parts so a later "glyph meanings" panel can attach the approved meaning to each one (Sage: `GLYPH_MEANINGS` and `glyphParts` in `base/sage-3d.js`).
- No piece is decoration only. If a piece has no meaning yet, it waits for the mapping.

## Rights
- Original designs only: no likeness of a real person or a copyrighted or trademarked character.
- Rights check first for any generator or paid 3D tool, and Jacob's yes on the exact price before any spend.
