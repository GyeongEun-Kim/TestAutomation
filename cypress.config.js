require('dotenv').config();

const { defineConfig } = require('cypress');

module.exports = defineConfig({
  e2e: {
    baseUrl: process.env.BASE_URL || 'https://your-service.com',
    specPattern: 'cypress/e2e/**/*.cy.js',
    screenshotOnRunFailure: true,
    video: true,
    reporter: 'json',
    reporterOptions: {
      output: 'cypress/results/results.json',
    },
    setupNodeEvents(on, config) {
      config.env.LOGIN_ID = process.env.LOGIN_ID;
      config.env.LOGIN_PW = process.env.LOGIN_PW;
      return config;
    },
  },
});
