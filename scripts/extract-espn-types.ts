/**
 * Generate TypeScript Types from ESPN API Responses
 *
 * Extracts all ESPN API responses from test database and uses quicktype
 * to generate TypeScript types. Analyzes all records to capture all
 * possible field variations and string literal unions.
 *
 * Usage:
 *   npx tsx scripts/extract-espn-types.ts
 */

// Load environment variables FIRST, before any other imports
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';
import { execSync } from 'child_process';

const envPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
}

const OUTPUT_DIR = path.join(process.cwd(), 'lib', 'espn');
const TEMP_DIR = path.join(process.cwd(), 'temp', 'espn-responses');

interface TypeGenerationResult {
  success: boolean;
  filePath?: string;
  error?: string;
}

/**
 * Generate types using quicktype from JSON samples
 * Passes all samples to quicktype so it can infer unions for string literals
 */
function generateTypesWithQuicktype(
  jsonSamples: unknown[],
  outputName: string
): TypeGenerationResult {
  if (jsonSamples.length === 0) {
    return { success: false, error: 'No JSON samples provided' };
  }

  // Create temp directory
  if (!fs.existsSync(TEMP_DIR)) {
    fs.mkdirSync(TEMP_DIR, { recursive: true });
  }

  // Save all samples as separate files for quicktype to analyze
  const sampleFiles: string[] = [];
  jsonSamples.forEach((sample, index) => {
    const samplePath = path.join(TEMP_DIR, `${outputName}-sample-${index}.json`);
    fs.writeFileSync(samplePath, JSON.stringify(sample, null, 2));
    sampleFiles.push(samplePath);
  });

  // Generate types using quicktype
  // quicktype analyzes all samples and infers unions for string literals
  const outputPath = path.join(OUTPUT_DIR, `${outputName}-generated.ts`);

  try {
    // Use quicktype with all sample files
    // --src flag accepts multiple files
    const quicktypeArgs = [
      'quicktype',
      ...sampleFiles,
      '--lang',
      'typescript',
      '--just-types',
      '--no-enums', // Use string unions instead of enums
      '--prefer-unions', // Prefer unions for string literals
      '--acronym-style',
      'original', // Keep original field names
      '-o',
      outputPath,
    ];

    execSync(quicktypeArgs.join(' '), { stdio: 'inherit' });

    // Clean up sample files
    sampleFiles.forEach((file) => {
      if (fs.existsSync(file)) {
        fs.unlinkSync(file);
      }
    });

    // Post-process: Replace state: string with GameState type in StatusType interface
    if (fs.existsSync(outputPath)) {
      let content = fs.readFileSync(outputPath, 'utf-8');

      // Add import for GameState at the top
      const gameStateImport = "import { GameState } from '@/lib/types';\n";
      if (!content.includes('import { GameState }')) {
        // Find the first import or add at the top
        const importMatch = content.match(/^import .+$/m);
        if (importMatch) {
          content = content.replace(/^(import .+)$/m, `${gameStateImport}$1`);
        } else {
          content = gameStateImport + content;
        }
      }

      // Replace state: string with state: GameState only in StatusType interface
      // Match StatusType interface block and replace state field within the interface block only
      // Use a more precise match that stops at the closing brace
      const statusTypeMatch = content.match(/export interface StatusType\s*\{[\s\S]*?\n\}/);
      if (statusTypeMatch) {
        const statusTypeBlock = statusTypeMatch[0];
        const updatedBlock = statusTypeBlock.replace(
          /(\s+state\s*:\s*)string(\s*[;|,])/,
          '$1GameState$2'
        );
        content = content.replace(statusTypeMatch[0], updatedBlock);
      }

      fs.writeFileSync(outputPath, content);
    }

    return { success: true, filePath: outputPath };
  } catch (error) {
    // Clean up sample files on error
    sampleFiles.forEach((file) => {
      if (fs.existsSync(file)) {
        fs.unlinkSync(file);
      }
    });

    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

async function generateESPNTypes() {
  try {
    // Dynamic imports after environment variables are loaded
    const { default: dbConnectTest } = await import('../lib/mongodb-test');
    const { default: getESPNScoreboardTestData } = await import(
      '../lib/models/test/ESPNScoreboardTestData'
    );
    const { default: getESPNTeamTestData } = await import('../lib/models/test/ESPNTeamTestData');
    const { default: getESPNGameSummaryTestData } = await import(
      '../lib/models/test/ESPNGameSummaryTestData'
    );
    const { default: getESPNTeamRecordsTestData } = await import(
      '../lib/models/test/ESPNTeamRecordsTestData'
    );

    await dbConnectTest();

    // Create output directory
    if (!fs.existsSync(OUTPUT_DIR)) {
      fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }

    const results: Array<{ type: string; result: TypeGenerationResult }> = [];

    // 1. Generate Scoreboard Types - analyze ALL documents
    const ScoreboardModel = await getESPNScoreboardTestData();
    const scoreboardDocs = await ScoreboardModel.find().lean();
    const scoreboardSamples = scoreboardDocs
      .map((doc) => (doc as { response?: unknown }).response)
      .filter((response): response is unknown => response !== undefined);

    if (scoreboardSamples.length > 0) {
      const result = generateTypesWithQuicktype(scoreboardSamples, 'espn-scoreboard');
      results.push({ type: 'scoreboard', result });
    } else {
      results.push({
        type: 'scoreboard',
        result: { success: false, error: 'No scoreboard data found' },
      });
    }

    // 2. Generate Team Types - analyze ALL documents
    const TeamModel = await getESPNTeamTestData();
    const teamDocs = await TeamModel.find().lean();
    const teamSamples = teamDocs
      .map((doc) => (doc as { response?: unknown }).response)
      .filter((response): response is unknown => response !== undefined);

    if (teamSamples.length > 0) {
      const result = generateTypesWithQuicktype(teamSamples, 'espn-team');
      results.push({ type: 'team', result });
    } else {
      results.push({
        type: 'team',
        result: { success: false, error: 'No team data found' },
      });
    }

    // 3. Generate Game Summary Types - analyze ALL documents
    const GameSummaryModel = await getESPNGameSummaryTestData();
    const gameSummaryDocs = await GameSummaryModel.find().lean();
    const gameSummarySamples = gameSummaryDocs
      .map((doc) => (doc as { response?: unknown }).response)
      .filter((response): response is unknown => response !== undefined);

    if (gameSummarySamples.length > 0) {
      const result = generateTypesWithQuicktype(gameSummarySamples, 'espn-game-summary');
      results.push({ type: 'gameSummary', result });
    } else {
      results.push({
        type: 'gameSummary',
        result: { success: false, error: 'No game summary data found' },
      });
    }

    // 4. Generate Team Records Types - analyze ALL documents
    const TeamRecordsModel = await getESPNTeamRecordsTestData();
    const teamRecordsDocs = await TeamRecordsModel.find().lean();
    const teamRecordsSamples = teamRecordsDocs
      .map((doc) => (doc as { response?: unknown }).response)
      .filter((response): response is unknown => response !== undefined);

    if (teamRecordsSamples.length > 0) {
      const result = generateTypesWithQuicktype(teamRecordsSamples, 'espn-team-records');
      results.push({ type: 'teamRecords', result });
    } else {
      results.push({
        type: 'teamRecords',
        result: { success: false, error: 'No team records data found' },
      });
    }

    // Report results
    const successCount = results.filter((r) => r.result.success).length;
    const failureCount = results.length - successCount;

    if (failureCount > 0) {
      process.exit(1);
    }

    process.exit(0);
  } catch {
    process.exit(1);
  }
}

void generateESPNTypes();
