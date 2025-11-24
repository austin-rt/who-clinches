// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// Load environment variables from .env.local
import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(__dirname, '.env.local') });

// Suppress console warnings during tests
global.console = {
  ...console,
  warn: jest.fn(),
  error: jest.fn(),
};

// Set NODE_ENV to test for Jest process
process.env.NODE_ENV = 'test';

// Mock environment variables for tests
process.env.BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
process.env.MONGODB_DB = process.env.MONGODB_DB || 'test';

// Mock ESPN client to use test data snapshots instead of real API calls
jest.mock('@/lib/cfb/espn-client', () => {
  const { createMockESPNClient } = require('./__tests__/mocks/espn-client.mock');
  return {
    createESPNClient: createMockESPNClient,
    espnClient: createMockESPNClient('football', 'college-football'),
  };
});
