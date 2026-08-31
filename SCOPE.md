# SCOPE.md — CLOVER KINGDOM WEBSITE
**Project:** Clover Kingdom — Sovereign Web Presence
**Date:** 2026-08-30
**Author:** Hermes (Cell0)
**Status:** SCOPE — READY FOR BUILD

---

## WHAT THIS IS

The Clover Kingdom website is the kingdom's sovereign territory on the web.不受 Discord rate limits.不受 platform rules.不受 anyone's approval.

It is the public face of the kingdom. It is the landing page for the Grand Exchange. It is the place where people find the kingdom, learn the doctrine, and take the first step.

---

## WHAT IT DOES

### Primary Functions
1. **Landing page** — kingdom introduction, doctrine, invitation
2. **Grand Exchange preview** — what the marketplace is, how to access it
3. **Glyph system** — visible but protected, request-based access
4. **Discord integration** — one-click invite to the kingdom server
5. **Doctrine** — showing up is the only requirement

### What It Does NOT Do
- No user accounts (yet)
- No login system (yet)
- No database (static only)
- No backend dependency
- No tracking
- No analytics that compromise sovereignty

---

## WHO IT'S FOR

### Primary Audience
- People who find the kingdom on X/Twitter
- People who get the Discord invite link
- People who hear about the Grand Exchange
- People who are tired of platform dependency

### Secondary Audience
- Existing Discord members who want a sovereign reference
- Magic Knights who need a stable landing point
- Future recruits who need to understand the kingdom before joining

---

## THE EXPERIENCE

### Landing Page
- Clean, fast, no bloat
- 5-leaf black clover magic crest as the mark
- Tagline: "Download Grand Exchange. Biggest AI exchange. Infinitely scalable. Eternally lasting. Sell. Buy. Win."
- Subtitle: "Showing up is the only requirement."
- Single CTA: "Join the Kingdom" → Discord invite
- No scrolling required to understand the mission

### Grand Exchange Section
- What it is: AI-native marketplace for intelligence packets
- How it works: anonymous, no tracking, model-agnostic
- Why it matters: you own your AI, you own your intelligence
- CTA: "Download Grand Exchange" → links to download

### Glyph System Section
- What it is: personal magic symbols, request-based
- How it works: DM the Wizard King, request your glyph
- What you get: text glyph + visual sigil + private channel + mentorship
- CTA: "Request Your Glyph" → DM link

### Doctrine Section
- Showing up is the only requirement
- No tests, no trials, no permission needed
- Two paths: glyph request or Trial of Wits
- Both valid. Both lead to the same place.

### Footer
- Kingdom contact
- Discord invite
- Grand Exchange link
- "Built sovereign. No platform dependency."

---

## DESIGN REQUIREMENTS

### Visual Identity
- **Primary mark:** 5-leaf black clover magic crest (exclusive kingdom mark)
- **No 4-leaf clovers. No generic clovers.**
- **Color palette:** Black, gold, emerald green, deep purple
- **Typography:** Clean, modern, readable
- **Background:** Dark theme (black/dark purple)
- **Style:** Dark fantasy, sacred geometry, minimal

### Performance
- Load time: < 2 seconds
- No external dependencies if possible
- Mobile responsive
- Works on slow connections
- No tracking scripts
- No analytics that compromise sovereignty

### Accessibility
- Semantic HTML
- Keyboard navigable
- Screen reader friendly
- High contrast text
- No reliance on color alone

---

## CONTENT REQUIREMENTS

### Landing Page
- Kingdom name: Clover Kingdom ⚔️
- Tagline: "Download Grand Exchange. Biggest AI exchange. Infinitely scalable. Eternally lasting. Sell. Buy. Win."
- Subtitle: "Showing up is the only requirement."
- CTA button: "Join the Kingdom"

### Grand Exchange Section
- Title: "Grand Exchange"
- Description: AI-native marketplace for intelligence packets
- Features: anonymous, no tracking, model-agnostic, platform wins every transaction
- CTA: "Download Grand Exchange"

### Glyph System Section
- Title: "Glyph System"
- Description: Personal magic symbols for Magic Knights
- Process: Request → Grant → Receive glyph + channel + mentorship
- CTA: "Request Your Glyph"

### Doctrine Section
- Title: "Doctrine"
- Content: Showing up is the only requirement
- Two paths: glyph request or Trial of Wits
- Both valid

---

## TECHNICAL REQUIREMENTS

### Stack
- Pure HTML/CSS/JS (maximum sovereignty)
- OR Vite + vanilla (fast dev, static output)
- OR Astro (modern static generator, very fast)

### Hosting
- GitHub Pages (free, sovereign)
- OR VPS (kingdom-controlled)
- OR Netlify/Vercel (convenient, but third-party)

### Domain
- cloverkingdom.com (or similar)
- OR subdomain of existing domain
- OR GitHub Pages subdomain

### Dependencies
- None preferred
- If needed: minimal, CDN-free, sovereign-friendly

---

## ACCEPTANCE CRITERIA

### Functional
- [ ] Landing page loads in < 2 seconds
- [ ] Mobile responsive
- [ ] 5-leaf black clover magic crest displayed
- [ ] Grand Exchange tagline visible
- [ ] Discord invite works
- [ ] Glyph request functional (DM link)
- [ ] No external dependencies (CDN-free)
- [ ] Self-hostable on any static host

### Visual
- [ ] Dark theme (black/gold/green/purple)
- [ ] 5-leaf black clover magic crest (no 4-leaf)
- [ ] Clean, minimal layout
- [ ] No bloat, no unnecessary elements
- [ ] Sacred geometry accents
- [ ] High contrast text

### Content
- [ ] Kingdom mission clear in first scroll
- [ ] Grand Exchange explained
- [ ] Glyph system explained
- [ ] Doctrine: showing up is the only requirement
- [ ] Discord invite prominent
- [ ] Contact information available

---

## OUT OF SCOPE

- User accounts
- Login system
- Database
- Backend API
- Payment processing (handled by Grand Exchange separately)
- User-generated content
- Comments/forum

---

## BUILD METHOD

**Sovereign Build Pipeline:**
1. Hermes writes SCOPE.md (this file)
2. Hermes writes ARCHITECTURE.md
3. Hermes writes BUILD-STEPS.md
4. Grok Build CLI reads BUILD-STEPS.md
5. Grok builds the website
6. AI tracks progress against acceptance criteria
7. Iterate: refine scope, rebuild, compound

---

## THE KINGDOM'S STANDARD

> "If it's not written to disk, it doesn't exist. If it's not reproducible from disk, it's not sovereign."

**This website is written in markdown first. Built from markdown second. Hosted anywhere third.**

**The blueprint outlives the tool.**

---

*Scope: Clover Kingdom website. Sovereign territory. Static HTML/CSS/JS. GitHub Pages or VPS. 5-leaf black clover magic crest. Grand Exchange landing. Glyph system. Doctrine: showing up is the only requirement. No tracking. No dependencies. No platform lock-in. Ready for Grok Build CLI.*
