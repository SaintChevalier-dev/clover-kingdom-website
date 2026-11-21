// Smoke test for https://cloverkingdom.net/base/ (or a URL passed as argv[2]).
// Fails on: non-200, any console/page error (except the expected signed-out 401
// from auth /api/me), the Sage sprite missing, or Sage not replying.
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
  if (!(await page.$(".ss svg"))) fail.push("Sage sprite missing");
  if (!(await page.$("#login-btn, #logout-btn"))) fail.push("login bar missing");
  const before = await page.$$eval(".msg-sage", (n) => n.length);
  await page.fill("#sage-input", "how do I get started");
  await page.click("#sage-form button[type=submit]");
  try { await page.waitForFunction((b) => document.querySelectorAll(".msg-sage").length > b, before, { timeout: 5000 }); }
  catch { fail.push("Sage did not reply"); }
  await page.waitForTimeout(3000);
  const real = errors.filter((t) => !(meWas401 && /status of 401/.test(t)));
  if (real.length) fail.push("console errors: " + JSON.stringify(real));
  await browser.close();
  if (fail.length) { console.error("FAIL: " + fail.join(" | ")); process.exit(1); }
  console.log("OK: " + url);
})().catch((e) => { console.error("FAIL: " + e.message); process.exit(1); });
