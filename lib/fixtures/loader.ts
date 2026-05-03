import { readFile } from 'fs/promises';
import { join } from 'path';
import { logError } from '../errorLogger';

export const loadFixture = async <T = unknown>(path: string): Promise<T> => {
  const fixturePath = join(process.cwd(), '__fixtures__', path);

  try {
    const data = await readFile(fixturePath, 'utf-8');
    return JSON.parse(data) as T;
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
      const fixtureError = new Error(
        `Fixture not found: ${path}\n` +
          `Expected location: ${fixturePath}\n` +
          `When FIXTURE_YEAR is set, fixtures are required. Run 'npm run capture-fixtures' to generate fixtures.`
      );
      await logError(fixtureError, {
        action: 'load-fixture',
        path,
        fixturePath,
      });
      throw fixtureError;
    }
    await logError(error, {
      action: 'load-fixture',
      path,
      fixturePath,
    });
    throw error;
  }
};
