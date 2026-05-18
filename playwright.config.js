require('dotenv').config();

const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests',
  outputDir: './test-results',
  preserveOutput: 'always',
  reporter: [
    ['json', { outputFile: 'test-results/results.json' }],
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
  ],
  use: {
    baseURL: process.env.BASE_URL,
    viewport: { width: 2560, height: 1271 },
    screenshot: 'only-on-failure',
    video: { mode: 'on', size: { width: 2560, height: 1271 } },
    launchOptions: {
      slowMo: 600,
    },
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 2560, height: 1271 },
      },
    },
  ],
});
