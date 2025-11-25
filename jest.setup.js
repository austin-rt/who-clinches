// Learn more: https://github.com/testing-library/jest-dom
console.log('[Jest Setup] ===== SETUP FILES AFTER ENV START =====');
console.log('[Jest Setup] Importing @testing-library/jest-dom...');
import '@testing-library/jest-dom';
console.log('[Jest Setup] @testing-library/jest-dom imported');

// Load environment variables from .env.local
console.log('[Jest Setup] Loading environment variables from .env.local...');
import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(__dirname, '.env.local') });
console.log('[Jest Setup] Environment variables loaded');

// Don't suppress console output - we want to see logs for debugging
// If you need to suppress specific logs, do it in individual test files
// global.console = {
//   ...console,
//   warn: jest.fn(),
//   error: jest.fn(),
// };

// Set NODE_ENV to test for Jest process
console.log('[Jest Setup] Setting NODE_ENV to test...');
process.env.NODE_ENV = 'test';
console.log('[Jest Setup] NODE_ENV set to test');

// Mock environment variables for tests
console.log('[Jest Setup] Setting mock environment variables...');
process.env.BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
process.env.MONGODB_DB = process.env.MONGODB_DB || 'test';
console.log(`[Jest Setup] BASE_URL: ${process.env.BASE_URL}`);
console.log(`[Jest Setup] MONGODB_DB: ${process.env.MONGODB_DB}`);

// Mock ESPN client to use test data snapshots instead of real API calls
console.log('[Jest Setup] Setting up ESPN client mock...');
jest.mock('@/lib/cfb/espn-client', () => {
  console.log('[Jest Setup] ESPN client mock factory called');
  const { createMockESPNClient } = require('./__tests__/mocks/espn-client.mock');
  console.log('[Jest Setup] createMockESPNClient imported');
  const result = {
    createESPNClient: createMockESPNClient,
    espnClient: createMockESPNClient('football', 'college-football'),
  };
  console.log('[Jest Setup] ESPN client mock created');
  return result;
});
console.log('[Jest Setup] ESPN client mock configured');
console.log('[Jest Setup] ===== SETUP FILES AFTER ENV COMPLETE =====');
