require('dotenv').config();

const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests',
  outputDir: './test-results',
  reporter: [
    ['json', { outputFile: 'test-results/results.json' }],
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
  ],
  use: {
    baseURL: process.env.BASE_URL || 'https://your-service.com',
    viewport: { width: 1920, height: 1080 },
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
