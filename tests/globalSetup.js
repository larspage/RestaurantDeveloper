const { exec } = require('child_process');
const util = require('util');
const path = require('path');
const execPromise = util.promisify(exec);

const backendDir = path.resolve(__dirname, '../backend');

module.exports = async () => {
  console.log('\n\n[Global Setup] Preparing test database...');
  
  // Check if we're running backend tests by looking at the test command
  const isBackendTest = process.argv.some(arg => arg.includes('backend'));
  
  if (isBackendTest) {
    try {
      // Only clear the database for backend tests
      const { connect } = require('../backend/db/mongo');
      const { clearTestDB } = require('../backend/tests/testUtils');
      
      await connect();
      await clearTestDB();
      
      console.log('[Global Setup] Test database cleared for backend tests.');
    } catch (error) {
      console.error('[Global Setup] Failed to prepare test database:', error);
      // Don't exit on setup failure for now
    }
  } else {
    console.log('[Global Setup] Test database preparation skipped for frontend tests.');
  }
}; 