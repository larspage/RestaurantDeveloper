const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from .env file specifically for the test environment
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Import test mocks
require('./testMocks'); 