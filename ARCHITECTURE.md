# ARCHITECTURE.md — CLOVER KINGDOM WEBSITE
**Project:** Clover Kingdom — Sovereign Web Presence
**Date:** 2026-08-30
**Author:** Hermes (Cell0)
**Status:** ARCHITECTURE — READY FOR BUILD

---

## SYSTEM OVERVIEW

### What It Is
A static website that serves as the kingdom's sovereign web presence. No database. No backend. No platform dependency. Pure HTML/CSS/JS that can be hosted anywhere.

### How It Works
1. User visits the website
2. They see the kingdom's mission, doctrine, and offerings
3. They can join the Discord, learn about Grand Exchange, or request a glyph
4. Everything is static. Everything is fast. Everything is sovereign.

---

## COMPONENT MAP

### Pages

| Page | Path | Purpose |
|------|------|---------|
| **Landing** | `/index.html` | Kingdom introduction, doctrine, CTAs |
| **Grand Exchange** | `/grand-exchange.html` | Marketplace overview, download |
| **Glyphs** | `/glyphs.html` | Glyph system explanation, request |
| **Doctrine** | `/doctrine.html` | Kingdom doctrine, showing up is the only requirement |
| **Contact** | `/contact.html` | Contact information, Discord invite |

### Shared Components
- **Header** — Kingdom crest, navigation
- **Footer** — Discord invite, contact, doctrine reminder
- **CTA Buttons** — Join Kingdom, Download Grand Exchange, Request Glyph

---

## DATA FLOW

```
User visits website
    ↓
Static HTML/CSS/JS loads
    ↓
No database calls
    No API calls
  No tracking
    ↓
User clicks CTA
    ↓
Discord invite link (external)
OR
Mailto link (external)
OR
Anchor link (internal page)
```

**Zero backend dependency. Zero platform dependency. Zero tracking.**

---

## FILE STRUCTURE

```
clover-kingdom-website/
├── index.html              # Landing page
├── grand-exchange.html     # Grand Exchange page
├── glyphs.html             # Glyph system page
├── doctrine.html           # Doctrine page
├── contact.html            # Contact page
├── styles.css              # Global styles
├── app.js                  # Shared JavaScript
├── images/
│   ├── crest.png           # 5-leaf black clover magic crest
│   ├── glyphs/             # Glyph images
│   └── og-image.png        # Open Graph image for social sharing
├── docs/                   # Additional documentation
│   ├── faq.html
│   └── about.html
└── ARCHITECTURE.md         # This file
```

---

## DESIGN SYSTEM

### Colors
| Color | Hex | Usage |
|-------|-----|-------|
| **Black** | `#000000` | Background, primary |
| **Gold** | `#FFD700` | Accents, highlights, CTAs |
| **Emerald** | `#50C878` | Secondary accent, glyphs |
| **Purple** | `#4B0082` | Deep background, gradients |
| **White** | `#FFFFFF` | Text, contrast |
| **Gray** | `#888888` | Secondary text |

### Typography
- **Primary font:** System font stack (no external fonts)
- **Headings:** Bold, uppercase, gold accent
- **Body:** Clean, readable, high contrast
- **Code:** Monospace (if needed)

### Layout
- **Max width:** 1200px
- **Padding:** 2rem desktop, 1rem mobile
- **Breakpoints:** 768px (tablet), 480px (mobile)

### Components
- **CTA Buttons:** Gold background, black text, hover effect
- **Cards:** Dark background, gold border, emerald accent
- **Navigation:** Minimal, top or side
- **Footer:** Simple, doctrine reminder, Discord invite

---

## TECHNOLOGY CHOICES

### Option A: Pure HTML/CSS/JS (RECOMMENDED)
- **Pros:** Maximum sovereignty, no build step, no dependencies
- **Cons:** Manual organization, no component reuse
- **Verdict:** Best for kingdom sovereignty

### Option B: Vite + Vanilla
- **Pros:** Fast dev server, easy organization, static output
- **Cons:** Build step required, Node.js dependency
- **Verdict:** Good for development, output is still static

### Option C: Astro
- **Pros:** Modern, fast, component-based, static output
- **Cons:** Newer tool, learning curve
- **Verdict:** Good if you want component architecture

**Recommendation:** Start with Option A (pure HTML/CSS/JS) for maximum sovereignty. Migrate to Option B or C if the project grows.

---

## HOSTING OPTIONS

| Option | Cost | Sovereignty | Ease |
|--------|------|-------------|------|
| **GitHub Pages** | Free | High | Easy |
| **VPS** | $5-20/month | Maximum | Medium |
| **Netlify** | Free tier | Medium | Easy |
| **Vercel** | Free tier | Medium | Easy |
| **Self-hosted** | Varies | Maximum | Hard |

**Recommendation:** GitHub Pages for launch. VPS for production sovereignty.

---

## PERFORMANCE REQUIREMENTS

- **Load time:** < 2 seconds on 3G
- **Page size:** < 500KB total
- **Images:** Optimized, compressed
- **No external dependencies** (CDN-free)
- **No tracking scripts**
- **No analytics that compromise sovereignty**

---

## SECURITY

- **No user data collection**
- **No cookies (unless essential)**
- **No third-party scripts**
- **HTTPS only** (enforced by host)
- **No login system** (no credentials to steal)
- **Static only** (no attack surface)

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

---

## BUILD INSTRUCTIONS FOR AI

### Step 1: Create File Structure
Create the folder structure listed above.

### Step 2: Build index.html
- Landing page with kingdom introduction
- 5-leaf black clover magic crest
- Grand Exchange tagline
- Discord CTA
- Glyph system preview

### Step 3: Build Styles
- Dark theme (black/gold/green/purple)
- Mobile responsive
- High contrast
- No external fonts

### Step 4: Build Remaining Pages
- grand-exchange.html
- glyphs.html
- doctrine.html
- contact.html

### Step 5: Optimize
- Compress images
- Minify CSS/JS
- Test load times
- Verify mobile responsiveness

### Step 6: Deploy
- Push to GitHub Pages
- OR upload to VPS
- Test live site

---

## THE KINGDOM'S STANDARD

> "The website is the kingdom's first sovereign territory. It must be clean, fast, and uncompromising. No bloat. No tracking. No platform dependency. Just the kingdom, in its purest form."

---

*Architecture: Clover Kingdom website. Static HTML/CSS/JS. GitHub Pages or VPS. Dark theme. 5-leaf black clover magic crest. No dependencies. No tracking. No platform lock-in. Ready for Grok Build CLI.*
