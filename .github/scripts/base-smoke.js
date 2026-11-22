// Smoke test for https://cloverkingdom.net/base/ (or a URL passed as argv[2]).
// Fails on: non-200, any console/page error (except the expected signed-out 401
// from auth /api/me), the Sage sprite/courtyard missing, the floating book missing,
// no opener after tapping the book, or Sage not replying.
// Since the book redesign the chat is closed until the visitor taps #sage-book, so the test opens it first.
const { chromium } = require("playwright-core");
const url = process.argv[2] || "https://cloverkingdom.net/base/";
const chrome = process.env.CHROME_PATH || "/usr/bin/google-chrome";

(async () => {
  const browser = await chromium.launch({ executablePath: chrome, args: ["--no-sandbox"] });
  const page = await browser.newPage({ viewport: { width: 1366, height: 800 } });
  const errors = [];
  let meWas401 = false;
  page.on("response", (r) => { if (r.status() === 401 && /\/api\/me$/.test(new URL(r.url()).pathname)) meWas401 = true; });
  page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
  page.on("pageerror", (e) => errors.push("pageerror: " + e.message));
  const fail = [];
  const res = await page.goto(url + (url.includes("?") ? "&" : "?") + "smoke=" + Date.now(), { waitUntil: "networkidle" });
  if (!res || res.status() !== 200) fail.push("status " + (res && res.status()));
  if (!(await page.$(".ss svg, #ckw-yard-canvas"))) fail.push("Sage sprite missing"); // 2D sprite or 3D courtyard canvas
  if (!(await page.$("#login-btn, #logout-btn"))) fail.push("login bar missing");
  const privacy = await page.$eval(".ck-privacy-corner, #privacy, .sage-privacy, .privacy", (el) => ((el.textContent || "") + " " + (el.getAttribute("aria-label") || "")).trim()).catch(() => "");
  if (!/privacy|essence tracks|stored/i.test(privacy)) fail.push("privacy line missing");
  // Open the chat: tap the floating book (hidden until the page script shows it).
  try {
    await page.waitForSelector("#sage-book:not([hidden])", { state: "visible", timeout: 10000 });
    await page.click("#sage-book");
    await page.waitForSelector("#sage-scroll:not([hidden]) #sage-input", { state: "visible", timeout: 5000 });
  } catch { fail.push("floating book missing or did not open the chat"); }
  try {
    await page.waitForFunction(() => {
      const n = document.querySelector(".msg-sage");
      return n && (n.textContent || "").trim().length > 10;
    }, { timeout: 5000 });
  } catch { fail.push("opener missing after tapping the book"); }
  const before = await page.$$eval(".msg-sage", (n) => n.length);
  try {
    await page.fill("#sage-input", "how do I get started");
    await page.click("#sage-form button[type=submit]");
  } catch { fail.push("could not type to Sage"); }
  try { await page.waitForFunction((b) => document.querySelectorAll(".msg-sage").length > b, before, { timeout: 15000 }); }
  catch { fail.push("Sage did not reply"); }
  await page.waitForTimeout(3000);
  const local = /^http:\/\/(127\.0\.0\.1|localhost)/.test(url); // local runs: auth CORS is expected to fail
  const real = errors.filter((t) => !(meWas401 && /status of 401/.test(t)) && !(local && /CORS policy|ERR_FAILED/.test(t)));
  if (real.length) fail.push("console errors: " + JSON.stringify(real));
  await browser.close();
  if (fail.length) { console.error("FAIL: " + fail.join(" | ")); process.exit(1); }
  console.log("OK: " + url);
})().catch((e) => { console.error("FAIL: " + e.message); process.exit(1); });
