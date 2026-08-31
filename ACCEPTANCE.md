# ACCEPTANCE.md — CLOVER KINGDOM WEBSITE
**Project:** Clover Kingdom — Sovereign Web Presence
**Date:** 2026-08-30
**Author:** Hermes (Cell0)
**Status:** ACCEPTANCE CRITERIA — FINAL GATE

---

## HOW TO VERIFY THE BUILD SUCCEEDED

### Functional Tests

| Test | How to Verify | Pass Condition |
|------|---------------|----------------|
| **Landing page loads** | Open index.html in browser | Page renders without errors |
| **Load time** | Chrome DevTools → Network → reload | < 2 seconds on 3G simulation |
| **Mobile responsive** | Chrome DevTools → Device Toolbar | Works at 320px, 768px, 1200px |
| **All pages load** | Click every navigation link | No 404s, no errors |
| **Discord invite works** | Click "Join the Kingdom" button | Opens Discord invite in new tab |
| **Glyph request works** | Click "Request Your Glyph" | Opens Discord DM or mailto |
| **Navigation works** | Click every nav link on mobile | Menu opens, links work |
| **No console errors** | Chrome DevTools → Console | Zero errors |

### Visual Tests

| Test | How to Verify | Pass Condition |
|------|---------------|----------------|
| **5-leaf black clover visible** | View landing page | Crest displays, no 4-leaf clovers |
| **Dark theme** | View any page | Black background, gold/green/purple accents |
| **Tagline visible** | View landing page | Grand Exchange tagline displayed |
| **High contrast** | View any page | Text readable, no low-contrast elements |
| **Mobile layout** | View on 320px width | Layout clean, no overflow |
| **No external dependencies** | Chrome DevTools → Network | No CDN calls, no external fonts |
| **No tracking** | Chrome DevTools → Network | No analytics scripts, no tracking pixels |

### Content Tests

| Test | How to Verify | Pass Condition |
|------|---------------|----------------|
| **Kingdom mission clear** | Read landing page | Understand kingdom in first scroll |
| **Grand Exchange explained** | Read grand-exchange.html | Understand what it is, how it works |
| **Glyph system explained** | Read glyphs.html | Understand how to request, what you get |
| **Doctrine clear** | Read doctrine.html | Understand showing up is the only requirement |
| **Discord invite prominent** | View any page | Invite link visible and accessible |
| **Contact available** | View contact.html | Contact info present |

### Sovereignty Tests

| Test | How to Verify | Pass Condition |
|------|---------------|----------------|
| **No login required** | Visit all pages | No login prompts, no accounts |
| **No database** | Check file structure | No database files, no backend code |
| **No platform lock-in** | Check dependencies | No platform-specific code |
| **Self-hostable** | Serve from local file server | Works on any static host |
| **No tracking** | Check network tab | No analytics, no tracking scripts |

---

## THE GATE

**The build is NOT complete until ALL acceptance criteria pass.**

**If any criterion fails:**
1. Document the failure
2. Fix the issue
3. Re-test
4. Repeat until all pass

**The kingdom's standard is uncompromising.**

---

## THE VERIFICATION COMMAND

After Grok Build CLI completes the build, run these checks:

```bash
# 1. Check file structure
ls -la C:\Users\Jacob\Documents\sch\SOVEREIGN_WORKSPACE\Cell0\projects\clover-kingdom-website\

# 2. Serve locally
cd C:\Users\Jacob\Documents\sch\SOVEREIGN_WORKSPACE\Cell0\projects\clover-kingdom-website
python -m http.server 8080

# 3. Open in browser
start http://localhost:8080

# 4. Run manual tests from ACCEPTANCE.md
# 5. Verify all criteria pass
```

---

## THE SIGN-OFF

**When all criteria pass:**
- [ ] SCOPE.md — complete
- [ ] ARCHITECTURE.md — complete
- [ ] BUILD-STEPS.md — complete
- [ ] ACCEPTANCE.md — complete
- [ ] All tests pass
- [ ] Operator approves
- [ ] Deploy to production

**Only then is the website live.**

---

*Acceptance: Clover Kingdom website. 4 categories of tests: functional, visual, content, sovereignty. 20+ individual criteria. All must pass. No exceptions. The kingdom's standard is uncompromising. Ready for Grok Build CLI execution.*
