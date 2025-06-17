const { setupTestDB, clearTestDB, closeTestDB } = require('./testUtils');

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.MONGODB_URI = 'mongodb://localhost:27017/restaurant_developer_test';

// Global setup - runs once before all tests
beforeAll(async () => {
  await setupTestDB();
});

// Global teardown - runs once after all tests
afterAll(async () => {
  await closeTestDB();
});

// Reset database before each test
beforeEach(async () => {
  await clearTestDB();
});

// Increase timeout for all tests
jest.setTimeout(10000);

// Silence console logs during tests
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}; 