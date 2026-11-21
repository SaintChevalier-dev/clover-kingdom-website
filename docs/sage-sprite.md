# Sage sprite (2D) and the free-will protocol

`base/sage-sprite.js` draws Sage as an inline, articulated SVG: no images, no libraries.

## Look
From her 2026-10-28 turnaround: long wavy blonde hair, two short curved gold horns, gold halo, gold plate over a black bodysuit, silver belt, charcoal tabard and cloak with gold trim, gold greaves and boots, crystal staff (twisted silver shaft, prism top, glowing orb), and two white feathered wings built from individual feathers in four layers (primaries, secondaries, greater and lesser coverts).

Her face is a simple **original** stylized face (blue eye, brow, small smile, rainbow cheek glint). It is not based on any existing character. Sage's portrait face is not rights-cleared, so no portrait or photo face is used anywhere on the site.

## Body rig
Separate groups for each leg (hip → knee → foot), body, cloak, tabard, both wings, head and staff arm. `sagePose()` sets joint angles. The walk cycle swings the hips, bends the knee in the swing phase, keeps the planted foot flat, drops the body as the legs spread, and sways the cloak, tabard, wings and staff arm.

## Free-will protocol
A weighted-random state machine. Each state has a weight, a random duration and a cooldown:

| State | What she does |
|---|---|
| walk | Picks a free spot at least 260 px away (desktop) and walks there at 80 px/s, facing her direction |
| idle | Stands and breathes |
| read | A small glowing book floats in front of her; she looks down |
| stretch / flutter | Opens her wings wide / quick wing beats |
| glance | Turns toward the visitor's cursor |
| perch | Walks to the side of the chat card and sits |
| wave | Raises the staff arm and waves (also on click) |

Chat interrupts: when a guest sends a message she walks back beside the chat (if far), listens (halo brightens), then gives a soft speaking glow while Sage's reply appears, then resumes.

## Bounds (public page)
- Never stands on the login bar or the chat card; every walk path is checked.
- Never blocks clicks; only her painted shapes take a click (to wave).
- No sound, no popups, never posts chat messages of her own.
- Pauses when the tab is hidden; animation frames run only while she moves.
- `prefers-reduced-motion`: she stays in place and only idles, reads or glances.
- Phones: she walks sideways in her own strip above the chat.
