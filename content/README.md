# content/: the text Sage may edit

Pages that opt in (today: `/seats/` and `/tek-tribe/party-painting/`) keep their editable text here as JSON.
`/content/ck-content.js` renders it with plain text only (no HTML; links only `https://` or a same-site `/path`).
If the JSON can't load, the page's static text stays.

## What Sage can change (enforced by the ck-sage-live Worker, not by this file)
- Files: `content/seats.json`, `content/party-painting.json`. Nothing else in the repo.
- Text fields: `title`, `intro`, `sections.N.heading`, `sections.N.kicker`, `sections.N.paragraphs.M`,
  `sections.N.items.M` (or its `title` / `text`), `sections.N.links.M.label`, `sections.N.links.M.href`.
- Add: a paragraph, item or link to a section, or a new section (caps: 12 sections, 8 paragraphs, 16 items, 6 links).
- Remove: Jacob's admin session only.
- Never: HTML, scripts, CSS, CSP, the Worker, auth, the privacy page, the SI door files, `id` / `list` / layout keys,
  or a seat's name on the seats page (admin only).

## How a change happens
1. Someone talks to Sage in her floating book. `edit login` (Jacob) or the SI toggle with a seat key (verified seats).
2. `edit: <what to change>`: Sage drafts a structured diff (file, field, old, new) and a plain summary.
3. The Knight reviews it: injection and rule rewrites, clashes with the trusted digest, private info (emails, keys, paths,
   phone numbers, private Kingdom names), invented acronyms or name meanings, prices or claims not in the notes,
   impersonation, size limits. Blocked proposals are logged with the reason.
4. Preview in the book with Approve / Discard.
5. Approve: the Worker opens a pull request from a `sage-edits-<id>` branch. Jacob's session merges it; a seat's PR waits
   for Jacob. Guests can only suggest; their words go to the untrusted holding pen.
6. Every step is in the Worker's audit log (who, when, diff, Knight verdict, PR link). Kill switch: `SAGE_EDITS`.
