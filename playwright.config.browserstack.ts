import { defineConfig } from "@playwright/test";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.browserstack" });

const BS_USER = process.env.BROWSERSTACK_USERNAME;
const BS_KEY  = process.env.BROWSERSTACK_ACCESS_KEY;

if (!BS_USER || !BS_KEY) {
  throw new Error(
    "Set BROWSERSTACK_USERNAME and BROWSERSTACK_ACCESS_KEY before running.\n" +
    "Copy .env.browserstack values into your environment."
  );
}

// BrowserStack CDP requires Playwright-specific browser names:
//   chrome, edge, playwright-chromium, playwright-firefox, playwright-webkit
const BS_BROWSER: Record<string, string> = {
  chrome:  "chrome",
  edge:    "edge",
  firefox: "playwright-firefox",
  safari:  "playwright-webkit",
};

function bsDesktop(browser: string, os: string, osVersion: string) {
  const caps = {
    browser: BS_BROWSER[browser] ?? browser,
    browser_version: "latest",
    os,
    os_version: osVersion,
    name: "Clear Build USA — E2E",
    build: process.env.BUILD_NAME || "local",
    "browserstack.username": BS_USER,
    "browserstack.accessKey": BS_KEY,
    "browserstack.local": "false",
  };
  return `wss://cdp.browserstack.com/playwright?caps=${encodeURIComponent(JSON.stringify(caps))}`;
}

function bsMobile(deviceName: string, osVersion: string, browserName: string) {
  const caps = {
    deviceName,
    osVersion,
    browserName: BS_BROWSER[browserName] ?? browserName,
    name: "Clear Build USA — E2E",
    build: process.env.BUILD_NAME || "local",
    "browserstack.username": BS_USER,
    "browserstack.accessKey": BS_KEY,
    "browserstack.local": "false",
  };
  return `wss://cdp.browserstack.com/playwright?caps=${encodeURIComponent(JSON.stringify(caps))}`;
}

export default defineConfig({
  testDir: "./tests",
  timeout: 90_000,        // remote browsers need more time
  expect: { timeout: 20_000 },
  fullyParallel: true,
  retries: 1,
  reporter: [
    ["html", { open: "never", outputFolder: "playwright-report-bs" }],
    ["line"],
  ],

  use: {
    // All tests run against the live production site
    baseURL: "https://clearbuildusa.com",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "on-first-retry",
    navigationTimeout: 45_000,
    actionTimeout:     20_000,
  },

  projects: [
    // ── Auth setup runs once locally against clearbuildusa.com ──────────────
    // Saves the session cookie to playwright/.auth.json which is then used
    // by every remote BrowserStack session as their starting auth state.
    {
      name: "setup",
      testMatch: /auth\.setup\.ts/,
      timeout: 90_000,
    },

    // ── Desktop browsers ────────────────────────────────────────────────────
    {
      name: "Chrome — Windows 11",
      use: {
        connectOptions: { wsEndpoint: bsDesktop("chrome", "Windows", "11") },
        storageState: "playwright/.auth.json",
      },
      dependencies: ["setup"],
    },
    {
      name: "Firefox — Windows 11",
      use: {
        connectOptions: { wsEndpoint: bsDesktop("firefox", "Windows", "11") },
        storageState: "playwright/.auth.json",
      },
      dependencies: ["setup"],
    },
    {
      name: "Edge — Windows 11",
      use: {
        connectOptions: { wsEndpoint: bsDesktop("edge", "Windows", "11") },
        storageState: "playwright/.auth.json",
      },
      dependencies: ["setup"],
    },
    {
      name: "Safari — macOS Sequoia",
      use: {
        connectOptions: { wsEndpoint: bsDesktop("safari", "OS X", "Sequoia") },
        storageState: "playwright/.auth.json",
      },
      dependencies: ["setup"],
    },

    // Mobile devices are excluded: BrowserStack's real-device CDP sessions
    // reject pre-loaded storageState cookies, requiring a full UI login flow
    // on every test. Add mobile projects back once a page-level cookie fixture
    // is wired up. Run mobile checks manually via the QA tracker instead.
  ],
});
