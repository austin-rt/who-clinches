import { execSync } from 'child_process';
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync, unlinkSync } from 'fs';
import { join } from 'path';

const FIXTURES_DIR = join(process.cwd(), '__fixtures__', 'espn', 'nfl');
const OUTPUT_DIR = join(process.cwd(), 'lib', 'espn', 'nfl');
const TEMP_DIR = join(process.cwd(), 'temp', 'espn-nfl-responses');

const QUICKTYPE_FLAGS = [
  '--lang',
  'typescript',
  '--just-types',
  '--no-enums',
  '--prefer-unions',
  '--acronym-style',
  'original',
];

const collectSamples = (dir: string, maxSamples = 5): unknown[] => {
  const files = readdirSync(dir)
    .filter((f) => f.endsWith('.json'))
    .slice(0, maxSamples);
  return files.map((f) => JSON.parse(readFileSync(join(dir, f), 'utf-8')) as unknown);
};

const generateTypes = (samples: unknown[], outputName: string): boolean => {
  if (samples.length === 0) {
    console.error(`No samples for ${outputName}`);
    return false;
  }

  if (!existsSync(TEMP_DIR)) mkdirSync(TEMP_DIR, { recursive: true });

  const sampleFiles: string[] = [];
  samples.forEach((sample, i) => {
    const path = join(TEMP_DIR, `${outputName}-${i}.json`);
    writeFileSync(path, JSON.stringify(sample, null, 2));
    sampleFiles.push(path);
  });

  const outputPath = join(OUTPUT_DIR, `${outputName}-generated.ts`);

  try {
    const cmd = ['npx', 'quicktype', ...sampleFiles, ...QUICKTYPE_FLAGS, '-o', outputPath].join(
      ' '
    );
    execSync(cmd, { stdio: 'pipe' });
    console.log(`Generated: ${outputPath}`);
    return true;
  } catch (err) {
    console.error(`Failed to generate ${outputName}:`, err);
    return false;
  } finally {
    sampleFiles.forEach((f) => existsSync(f) && unlinkSync(f));
  }
};

const main = () => {
  if (!existsSync(OUTPUT_DIR)) mkdirSync(OUTPUT_DIR, { recursive: true });

  const results: { name: string; ok: boolean }[] = [];

  const scoreboardDir = join(FIXTURES_DIR, 'scoreboard', '2024');
  if (existsSync(scoreboardDir)) {
    const samples = collectSamples(scoreboardDir);
    results.push({ name: 'scoreboard', ok: generateTypes(samples, 'espn-scoreboard') });
  }

  const teamsFile = join(FIXTURES_DIR, 'teams.json');
  if (existsSync(teamsFile)) {
    const sample = JSON.parse(readFileSync(teamsFile, 'utf-8')) as unknown;
    results.push({ name: 'teams', ok: generateTypes([sample], 'espn-teams') });
  }

  const statsDir = join(FIXTURES_DIR, 'team-statistics', '2024');
  if (existsSync(statsDir)) {
    const samples = collectSamples(statsDir);
    results.push({
      name: 'team-statistics',
      ok: generateTypes(samples, 'espn-team-statistics'),
    });
  }

  const failed = results.filter((r) => !r.ok);
  if (failed.length > 0) {
    console.error(`\nFailed: ${failed.map((f) => f.name).join(', ')}`);
    process.exit(1);
  }

  console.log(`\nAll ${results.length} type files generated successfully`);
};

main();
