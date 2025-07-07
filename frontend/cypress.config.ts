const { defineConfig } = require('cypress');
const path = require('path');
const mongoose = require('mongoose');

module.exports = defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3560',
    /**
     * @param {Cypress.PluginEvents} on
     * @param {Cypress.PluginConfigOptions} config
     */
    setupNodeEvents(on: Cypress.PluginEvents, config: Cypress.PluginConfigOptions) {
      // The MONGODB_URI_TEST is now set via cross-env in the package.json script
      config.env.MONGODB_URI_TEST = process.env.MONGODB_URI_TEST;

      // Dynamically require the models needed for tasks
      const Menu = require(path.join(config.projectRoot, '..', 'backend', 'models', 'Menu'));

      on('task', {
        seedDatabase() {
          console.log('Running seedDatabase task...');
          const seedScriptPath = path.join(config.projectRoot, '..', 'backend', 'scripts', 'seedE2ETestData.js');
          const seed = require(seedScriptPath);
          // Use the URI from the Cypress config env
          return seed(config.env.MONGODB_URI_TEST);
        },
        queryDatabase({ model, query }: { model: string, query: any }) {
          console.log(`Querying test database for model: ${model}`);
          return new Promise((resolve, reject) => {
            mongoose.connect(config.env.MONGODB_URI_TEST)
              .then(async () => {
                let foundItems;
                if (model === 'Menu') {
                  foundItems = await Menu.find(query || {}).lean();
                } else {
                  // Handle other models if necessary in the future
                  return reject(new Error(`Model ${model} not supported in queryDatabase task.`));
                }
                await mongoose.disconnect();
                console.log(`Found ${foundItems.length} items.`);
                resolve(foundItems);
              })
              .catch((err: any) => {
                console.error('DB query task failed:', err);
                mongoose.disconnect();
                reject(err);
              });
          });
        },
      });
      
      return config;
    },
    supportFile: 'cypress/support/e2e.ts',
  },
}); 