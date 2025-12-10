import { readFile } from 'fs/promises';
import { join } from 'path';

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
