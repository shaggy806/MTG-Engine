import { defineConfig } from '@playwright/test'

// Smoke tests of the real client against `npm run dev-rooms -w server`, the
// room server preloaded with known board states (server/scripts/dev-scenarios.mjs).
// Both servers are started here, or reused if they're already running locally.
// Build engine, protocol and server first: dev-rooms imports their dist/.
//
// @playwright/test is pinned to the version whose Chromium build the cloud
// sessions' image ships (/opt/pw-browsers/chromium-1194), so it runs there
// without a download. Elsewhere run `npx playwright install chromium` once.
export default defineConfig({
  testDir: './e2e',
  // dev-rooms' `reset` drops every open connection, not just that room's, so
  // tests that reset rooms can't overlap.
  workers: 1,
  forbidOnly: !!process.env.CI,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    browserName: 'chromium',
    baseURL: 'http://127.0.0.1:5173',
    // The short screen the layout rules are written against (CLAUDE.md).
    viewport: { width: 1366, height: 768 },
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  webServer: [
    {
      command: 'npm run dev-rooms -w server',
      cwd: '..',
      // The command port answers a bare GET with the room list.
      url: 'http://127.0.0.1:4099',
      reuseExistingServer: !process.env.CI,
      timeout: 60_000,
    },
    {
      command: 'npm run dev -- --host 127.0.0.1 --port 5173 --strictPort',
      url: 'http://127.0.0.1:5173',
      reuseExistingServer: !process.env.CI,
      timeout: 60_000,
    },
  ],
})
