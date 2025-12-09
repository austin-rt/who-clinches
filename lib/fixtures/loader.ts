import { readFile } from 'fs/promises';
import { join } from 'path';

/**
 * Load a fixture file from the __fixtures__ directory
 * @param path - Relative path from __fixtures__ directory (e.g., 'api/games/cfb-SEC-2025.json')
 * @returns Parsed JSON data
 * @throws Error if fixture file is not found (when USE_FIXTURES=true, this prevents API calls)
 */
export const loadFixture = async <T = unknown>(path: string): Promise<T> => {
  const fixturePath = join(process.cwd(), '__fixtures__', path);
  
  try {
    const data = await readFile(fixturePath, 'utf-8');
    return JSON.parse(data) as T;
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
      throw new Error(
        `Fixture not found: ${path}\n` +
        `Expected location: ${fixturePath}\n` +
        `When USE_FIXTURES=true, fixtures are required. Run 'npm run capture-fixtures' to generate fixtures.`
      );
    }
    throw error;
  }
};

/**
 * Check if fixtures should be used based on environment variable
 */
export const shouldUseFixtures = (): boolean => {
  return process.env.USE_FIXTURES === 'true' || process.env.NODE_ENV === 'test';
};

