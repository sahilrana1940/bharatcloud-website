import { chromium } from "playwright";
import { mkdir } from "fs/promises";

const out = "/opt/cursor/artifacts/screenshots";
await mkdir(out, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

const shots = [
  { url: "https://www.bharatcloud.store/", name: "landing-hero" },
  { url: "https://www.bharatcloud.store/login", name: "login" },
  { url: "https://www.bharatcloud.store/signup", name: "signup" },
];

for (const { url, name } of shots) {
  await page.goto(url, { waitUntil: "networkidle", timeout: 60000 });
  if (name === "landing-hero") {
    await page.screenshot({ path: `${out}/${name}.png` });
    await page.evaluate(() => window.scrollBy(0, 1200));
    await page.waitForTimeout(500);
    await page.screenshot({ path: `${out}/landing-light-section.png` });
  } else {
    await page.screenshot({ path: `${out}/${name}.png` });
  }
}

await browser.close();
console.log("Saved to", out);
