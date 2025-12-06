import '@testing-library/jest-dom';
import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(__dirname, '.env.local') });

process.env.NODE_ENV = 'test';
process.env.BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
