import { defineConfig, devices } from '@playwright/test';

const deployedUrl = process.env.PLAYWRIGHT_BASE_URL;
export default defineConfig({
  testDir: './tests/e2e',
  timeout: 180000,
  expect: { timeout: 10000 },
  fullyParallel: false,
  workers: 2,
  reporter: [['list'], ['json', { outputFile: 'output/playwright/results.json' }]],
  use: { baseURL: deployedUrl || 'http://127.0.0.1:4173/tci/', trace: 'retain-on-failure', screenshot: 'only-on-failure', reducedMotion: 'reduce' },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 1000 } } },
    { name: 'mobile', use: { ...devices['Pixel 7'], viewport: { width: 390, height: 844 } } },
  ],
  webServer: deployedUrl ? undefined : { command: 'npm run dev', url: 'http://127.0.0.1:4173/tci/', reuseExistingServer: true },
});
