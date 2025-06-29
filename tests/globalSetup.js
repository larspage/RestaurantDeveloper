const { exec } = require('child_process');
const util = require('util');
const path = require('path');
const execPromise = util.promisify(exec);

const backendDir = path.resolve(__dirname, '../backend');

module.exports = async () => {
  console.log('\n\n[Global Setup] Seeding database...');
  try {
    const { stdout, stderr } = await execPromise('npm run seed', { cwd: backendDir });
    console.log(stdout);
    if (stderr) {
      console.error(stderr);
    }
    console.log('[Global Setup] Database seeded successfully.');
  } catch (error) {
    console.error('[Global Setup] Failed to seed database:', error);
    process.exit(1); // Exit if seeding fails
  }
}; 