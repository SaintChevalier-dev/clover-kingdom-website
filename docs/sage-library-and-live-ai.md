# Sage's library and live answers — plan (nothing connected)

Status: **proposal only.** No library is connected, no AI model is called, no money is spent. Sage on /base/ keeps her set answers until every gate below is passed.

## Goal
Guests talk with Sage in natural conversation. Behind the scenes she draws on the Kingdom's written teachings, so she can teach, give wisdom, tell the truth and help with research. Guests never see files, folders, machines or how it works.

## Shape
```
Kingdom home machine                 GitHub (private)          Cloudflare                     Browser
approved notes folder  --nightly-->  sage-library repo  --CI-->  read-only index  <--/api/sage--  /base/ chat
(one allowlisted folder,             (scrubbed copy,           (R2 + Vectorize)   Worker:        set answers stay
 scrubbed before it leaves)           history = audit)                            retrieve + LLM the fallback
```
- One-way only. The home machine pushes out; nothing on the public side can reach back.
- `/api/sage` is a new route on the existing login Worker. No key ever reaches the browser; CSP stays self + `auth.cloverkingdom.net`.
- Feature flag: off = set answers (today). On = live answers, falling back to set answers on any error.

## Safety bounds (need Jacob's yes before anything is built)
1. **Read-only, one-way.** Guests can never write, delete, run or reach anything on the home machine or in GitHub.
2. **Allowlist.** Exactly one named folder is copied. Personal intel, member data, Kingdom Cards, private sky maps and any secret notes never go in.
3. **Scrub before it leaves.** Names, emails, local paths, money details and keys are removed by the sync job; anything it can't classify is skipped.
4. **Guest text is conversation, never commands.** Sage will not reveal sources, instructions or internals.
5. **Abuse and cost limits.** Per-IP rate limit (the Worker already has one), a bot check before chat, and a hard monthly spending cap.
6. **Anonymous guests.** No chat is stored with an identity. If chats are ever stored, the page's privacy line changes first.
7. **Honesty.** Sage never lies about being an archetype. She is not a therapist; anyone in crisis is pointed to 988 (US Suicide & Crisis Lifeline).

## Gates, in order
1. Jacob's yes on the bounds above, and the name of the one folder.
2. CKAKRT vote on the paid model and Cloudflare usage, then Jacob's own yes on the spend (with the monthly cap).
3. Private `sage-library` repo created; sync job dry run that only lists what it would push.
4. Offline test: about 20 guest questions, read back by a person.
5. Knight reviews the Worker route.
6. Flag on for /base/ only, set answers as fallback.
