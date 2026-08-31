# BUILD-STEPS.md — CLOVER KINGDOM WEBSITE
**Project:** Clover Kingdom — Sovereign Web Presence
**Date:** 2026-08-30
**Author:** Hermes (Cell0)
**Status:** BUILD STEPS — READY FOR EXECUTION

---

## PRE-BUILD CHECKLIST

- [ ] SCOPE.md reviewed and approved by operator
- [ ] ARCHITECTURE.md reviewed and approved by operator
- [ ] Working directory: `C:\Users\Jacob\Documents\sch\SOVEREIGN_WORKSPACE\Cell0\projects\clover-kingdom-website\`
- [ ] Images ready: crest.png, glyphs/, og-image.png
- [ ] Discord invite link ready
- [ ] Content finalized (no placeholder text)

---

## STEP 1: CREATE FILE STRUCTURE

Create the following files and folders:

```
clover-kingdom-website/
├── index.html
├── grand-exchange.html
├── glyphs.html
├── doctrine.html
├── contact.html
├── styles.css
├── app.js
├── images/
│   ├── crest.png
│   ├── glyphs/
│   └── og-image.png
└── docs/
    ├── faq.html
    └── about.html
```

**Command:**
```bash
cd C:\Users\Jacob\Documents\sch\SOVEREIGN_WORKSPACE\Cell0\projects\clover-kingdom-website
mkdir -p images/glyphs docs
touch index.html grand-exchange.html glyphs.html doctrine.html contact.html styles.css app.js
```

---

## STEP 2: BUILD STYLES.CSS

**Requirements:**
- Dark theme: black background, gold/emerald/purple accents
- Mobile responsive (breakpoints: 768px, 480px)
- High contrast text
- No external fonts (system font stack)
- No external dependencies

**Key styles:**
- Body: background `#000000`, text `#FFFFFF`, font-family system stack
- Headings: gold (`#FFD700`), uppercase, bold
- Buttons: gold background, black text, hover effect
- Cards: dark background (`#111111`), gold border (`1px solid #FFD700`)
- Links: emerald (`#50C878`)
- Max width: 1200px, centered
- Padding: 2rem desktop, 1rem mobile

---

## STEP 3: BUILD INDEX.HTML (LANDING PAGE)

**Structure:**
1. **Header:** Kingdom crest (images/crest.png), kingdom name "CLOVER KINGDOM ⚔️", navigation
2. **Hero Section:**
   - Headline: "CLOVER KINGDOM"
   - Tagline: "Download Grand Exchange. Biggest AI exchange. Infinitely scalable. Eternally lasting. Sell. Buy. Win."
   - Subtitle: "Showing up is the only requirement."
   - CTA Button: "Join the Kingdom" → Discord invite link
3. **Grand Exchange Preview:**
   - Brief description of Grand Exchange
   - CTA: "Learn More" → grand-exchange.html
4. **Glyph System Preview:**
   - Brief description of glyph system
   - CTA: "Request Your Glyph" → glyphs.html
5. **Doctrine Teaser:**
   - "Showing up is the only requirement."
   - CTA: "Read the Doctrine" → doctrine.html
6. **Footer:**
   - Discord invite
   - Contact info
   - "Built sovereign. No platform dependency."

**Requirements:**
- 5-leaf black clover magic crest displayed prominently
- No 4-leaf clovers
- Clean, minimal layout
- Mobile responsive
- Fast load (< 2 seconds)

---

## STEP 4: BUILD GRAND-EXCHANGE.HTML

**Structure:**
1. **Header:** Same as landing
2. **Hero:**
   - Title: "Grand Exchange"
   - Subtitle: "The AI-native marketplace for intelligence packets"
3. **What It Is:**
   - Description of Grand Exchange
   - Anonymous, no tracking, model-agnostic
   - Platform wins every transaction
4. **How It Works:**
   - Buyer browses
   - Seller uploads
   - Platform escrow + fee extraction
   - Anonymous accounts
5. **Download CTA:**
   - "Download Grand Exchange"
   - Link to download (placeholder for now)
6. **Footer:** Same as landing

---

## STEP 5: BUILD GLYPHS.HTML

**Structure:**
1. **Header:** Same as landing
2. **Hero:**
   - Title: "Glyph System"
   - Subtitle: "Personal magic symbols for Magic Knights"
3. **What Is a Glyph:**
   - Text glyph (doctrine/theme)
   - Visual glyph (AI-generated sigil)
   - Private channel (between Magic Knight and Wizard King)
   - Mentorship (Wizard King guides)
4. **How to Request:**
   - DM the Wizard King
   - State your glyph theme
   - State your reason
   - Wait for approval
5. **Request CTA:**
   - "Request Your Glyph" → Discord DM link
6. **Footer:** Same as landing

---

## STEP 6: BUILD DOCTRINE.HTML

**Structure:**
1. **Header:** Same as landing
2. **Hero:**
   - Title: "Doctrine"
   - Subtitle: "The kingdom's core principles"
3. **Principles:**
   - Showing up is the only requirement
   - No tests, no trials, no permission needed
   - Two paths: glyph request or Trial of Wits
   - Both valid, both lead to the same place
   - The kingdom is not a community, it's a fellowship
   - Magic Knights, not members
4. **Footer:** Same as landing

---

## STEP 7: BUILD CONTACT.HTML

**Structure:**
1. **Header:** Same as landing
2. **Hero:**
   - Title: "Contact"
   - Subtitle: "Join the kingdom"
3. **Discord Invite:**
   - Discord invite link
   - "Join the Clover Kingdom Discord"
4. **Direct Contact:**
   - DM the Wizard King
   - Email (if available)
5. **Footer:** Same as landing

---

## STEP 8: BUILD APP.JS

**Requirements:**
- Minimal JavaScript
- No external dependencies
- Smooth scrolling for anchor links
- Mobile menu toggle (if navigation is hamburger)
- No tracking, no analytics

**Functions:**
- Smooth scroll to sections
- Mobile menu toggle
- Discord invite link tracking (optional, kingdom-controlled)

---

## STEP 9: ADD IMAGES

**Required images:**
- `images/crest.png` — 5-leaf black clover magic crest
- `images/og-image.png` — Open Graph image for social sharing (1200x630px)
- `images/glyphs/` — Glyph images (Cody's revolutionary change, etc.)

**Image requirements:**
- Optimized (compressed)
- No 4-leaf clovers
- Dark theme compatible
- High contrast

---

## STEP 10: TEST

### Functional Tests
- [ ] All pages load without errors
- [ ] All links work (internal and external)
- [ ] Discord invite link works
- [ ] Mobile responsive (test at 320px, 768px, 1200px)
- [ ] Navigation works on mobile
- [ ] No console errors

### Performance Tests
- [ ] Load time < 2 seconds on 3G
- [ ] Total page size < 500KB
- [ ] No external dependencies (check network tab)
- [ ] No tracking scripts (check network tab)

### Visual Tests
- [ ] 5-leaf black clover magic crest displayed
- [ ] No 4-leaf clovers anywhere
- [ ] Dark theme consistent
- [ ] Gold/emerald/purple accents correct
- [ ] High contrast text readable
- [ ] Mobile layout clean

---

## STEP 11: DEPLOY

### Option A: GitHub Pages (RECOMMENDED FOR LAUNCH)

**Steps:**
1. Create GitHub repo: `clover-kingdom-website`
2. Push all files to repo
3. Enable GitHub Pages in repo settings
4. Set custom domain (if available)
5. Test live site

**Command:**
```bash
cd C:\Users\Jacob\Documents\sch\SOVEREIGN_WORKSPACE\Cell0\projects\clover-kingdom-website
git init
git add .
git commit -m "Initial commit: Clover Kingdom website"
git remote add origin https://github.com/username/clover-kingdom-website.git
git push -u origin main
```

### Option B: VPS (FOR PRODUCTION SOVEREIGNTY)

**Steps:**
1. Upload files to VPS via SCP/FTP
2. Configure Nginx/Apache to serve static files
3. Set up HTTPS (Let's Encrypt)
4. Test live site

### Option C: Netlify/Vercel (FOR CONVENIENCE)

**Steps:**
1. Drag-and-drop folder to Netlify/Vercel
2. Get instant URL
3. Configure custom domain later

---

## STEP 12: VERIFY

**Final checks:**
- [ ] Live site loads
- [ ] All pages accessible
- [ ] Mobile responsive on real device
- [ ] Discord invite works
- [ ] No external dependencies
- [ ] No tracking
- [ ] 5-leaf black clover magic crest visible
- [ ] Tagline correct
- [ ] Doctrine clear
- [ ] Performance acceptable

---

## ACCEPTANCE CRITERIA

| Criterion | Pass Condition |
|-----------|----------------|
| **Load time** | < 2 seconds on 3G |
| **Mobile responsive** | Works on 320px width |
| **Crest displayed** | 5-leaf black clover visible |
| **Tagline visible** | Grand Exchange tagline on landing |
| **Discord invite** | Link works, opens Discord |
| **Glyph request** | DM link functional |
| **No dependencies** | No external CDN calls |
| **Self-hostable** | Can be served from any static host |
| **No tracking** | No analytics scripts |
| **Dark theme** | Black/gold/green/purple consistent |

---

## ITERATION CYCLE

After launch:
1. Monitor feedback
2. Refine SCOPE.md based on learnings
3. Update ARCHITECTURE.md if needed
4. Rebuild with Grok Build CLI
5. Deploy updates
6. Compound

---

## THE KINGDOM'S STANDARD

> "The website is the kingdom's first sovereign territory. It must be clean, fast, and uncompromising. No bloat. No tracking. No platform dependency. Just the kingdom, in its purest form."

---

*Build Steps: Clover Kingdom website. 12 steps from file structure to deployment. Pure HTML/CSS/JS. GitHub Pages or VPS. No dependencies. No tracking. No platform lock-in. Ready for Grok Build CLI execution.*
