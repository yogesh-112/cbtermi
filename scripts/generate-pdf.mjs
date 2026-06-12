/**
 * Clear Build USA — PDF Generator
 * Renders HTML → PDF using Playwright Chromium (already installed)
 * Usage: node scripts/generate-pdf.mjs
 */
import path from "path";
import { fileURLToPath } from "url";
import { existsSync, statSync } from "fs";
import { chromium } from "@playwright/test";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const HTML_FILE = path.join(__dirname, "..", "public", "docs", "clearbuild-complete.html");
const PDF_FILE  = path.join(__dirname, "..", "public", "docs", "clearbuild-document.pdf");

if (!existsSync(HTML_FILE)) { console.error("HTML not found:", HTML_FILE); process.exit(1); }

// Windows-safe file:// URL
const fileUrl = "file:///" + HTML_FILE.replace(/\\/g, "/");

console.log("Launching Chromium…");
const browser = await chromium.launch({ headless: true });
const context  = await browser.newContext({ viewport: { width: 1400, height: 900 } });
const page     = await context.newPage();

console.log("Loading document…");
await page.goto(fileUrl, { waitUntil: "networkidle", timeout: 60000 });
await page.waitForTimeout(2500); // allow fonts & CSS to settle

// Hide the floating PDF button before capture
await page.evaluate(() => {
  const btn = document.querySelector(".float-btn");
  if (btn) btn.style.display = "none";
});

console.log("Generating A4 PDF…");
await page.pdf({
  path: PDF_FILE,
  format: "A4",
  printBackground: true,
  scale: 0.72,                       // 0.72 fits 1400px → A4 (~210mm)
  margin: { top: "0", right: "0", bottom: "0", left: "0" },
});

await browser.close();
const kb = Math.round(statSync(PDF_FILE).size / 1024);
console.log(`\nDone! PDF saved to: ${PDF_FILE}`);
console.log(`File size: ${kb} KB`);
