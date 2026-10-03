import { defineConfig } from '@playwright/test'

// The three ports are overridable so several checkouts (git worktrees, parallel
// agents) can run the suite at once. With any of them set, a run never reuses
// a server already listening there — it could be another checkout's, serving
// other code — and starts its own on the ports given.
const webPort = Number(process.env.E2E_WEB_PORT ?? 5173)
const serverPort = Number(process.env.E2E_SERVER_PORT ?? 4000)
const controlPort = Number(process.env.E2E_CONTROL_PORT ?? 4099)
const isolated =
  process.env.E2E_WEB_PORT !== undefined ||
  process.env.E2E_SERVER_PORT !== undefined ||
  process.env.E2E_CONTROL_PORT !== undefined
const reuseExistingServer = !process.env.CI && !isolated

export default defineConfig({
  testDir: './e2e',
  workers: 1,
  forbidOnly: !!process.env.CI,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    browserName: 'chromium',
    baseURL: `http://127.0.0.1:${webPort}`,
    viewport: { width: 1366, height: 768 },
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  webServer: [
    {
      command: 'npm run dev-rooms -w server',
      cwd: '..',
      url: `http://127.0.0.1:${controlPort}`,
      env: { ...process.env, PORT: String(serverPort), CONTROL_PORT: String(controlPort) } as Record<string, string>,
      reuseExistingServer,
      timeout: 60_000,
    },
    {
      command: `npm run dev -- --host 127.0.0.1 --port ${webPort} --strictPort`,
      url: `http://127.0.0.1:${webPort}`,
      env: { ...process.env, VITE_SERVER_URL: `ws://127.0.0.1:${serverPort}` } as Record<string, string>,
      reuseExistingServer,
      timeout: 60_000,
    },
  ],
})
