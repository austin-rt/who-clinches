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

function generateTypesWithQuicktype(
  jsonSamples: unknown[],
  outputName: string
): TypeGenerationResult {
  if (jsonSamples.length === 0) {
    return { success: false, error: 'No JSON samples provided' };
  }

  if (!fs.existsSync(TEMP_DIR)) {
    fs.mkdirSync(TEMP_DIR, { recursive: true });
  }

  const sampleFiles: string[] = [];
  jsonSamples.forEach((sample, index) => {
    const samplePath = path.join(TEMP_DIR, `${outputName}-sample-${index}.json`);
    fs.writeFileSync(samplePath, JSON.stringify(sample, null, 2));
    sampleFiles.push(samplePath);
  });

  const outputPath = path.join(OUTPUT_DIR, `${outputName}-generated.ts`);

  try {
    const quicktypeArgs = [
      'quicktype',
      ...sampleFiles,
      '--lang',
      'typescript',
      '--just-types',
      '--no-enums',
      '--prefer-unions',
      '--acronym-style',
      'original',
      '-o',
      outputPath,
    ];

    execSync(quicktypeArgs.join(' '), { stdio: 'inherit' });

    sampleFiles.forEach((file) => {
      if (fs.existsSync(file)) {
        fs.unlinkSync(file);
      }
    });

    if (fs.existsSync(outputPath)) {
      let content = fs.readFileSync(outputPath, 'utf-8');

      const statusTypeMatch = content.match(/export interface StatusType\s*\{[\s\S]*?\n\}/);
      if (statusTypeMatch) {
        const statusTypeBlock = statusTypeMatch[0];
        const updatedBlock = statusTypeBlock.replace(
          /(\s+state\s*:\s*)string(\s*[;|,])/,
          '$1GameState$2'
        );

        if (updatedBlock !== statusTypeBlock && !content.includes('import { GameState }')) {
          const gameStateImport = "import { GameState } from '@/lib/types';\n";
          const importMatch = content.match(/^import .+$/m);
          if (importMatch) {
            content = content.replace(/^(import .+)$/m, `${gameStateImport}$1`);
          } else {
            content = gameStateImport + content;
          }
        }

        content = content.replace(statusTypeMatch[0], updatedBlock);
      }

      if (outputName === 'espn-scoreboard') {
        if (!content.includes('export interface Odd {')) {
          const oddInterface = `
export interface Odd {
  provider: Provider;
  details: string;
  overUnder: number;
  spread: number;
  awayTeamOdds: TeamOdds;
  homeTeamOdds: TeamOdds;
  moneyline: Moneyline;
  pointSpread: PointSpread;
  total: Total;
  link: OddLink;
  header: Header;
}

export interface TeamOdds {
  favorite: boolean;
  underdog: boolean;
  team: AwayTeamOddsTeam;
  favoriteAtOpen: boolean;
}

export interface AwayTeamOddsTeam {
  id: string;
  uid: string;
  abbreviation: string;
  name: string;
  displayName: string;
  logo: string;
}

export interface Header {
  logo: HeaderLogo;
  text: string;
}

export interface HeaderLogo {
  dark: string;
  light: string;
  exclusivesLogoDark: string;
  exclusivesLogoLight: string;
}

export interface OddLink {
  language: string;
  rel: string[];
  href: string;
  text: string;
  shortText: string;
  isExternal: boolean;
  isPremium: boolean;
  tracking?: LinkTracking;
}

export interface LinkTracking {
  campaign: string;
  tags: Tags;
}

export interface Tags {
  league: string;
  sport: string;
  gameId: number;
  betSide: string;
  betType: string;
  betDetails?: string;
}

export interface Moneyline {
  displayName: string;
  shortDisplayName: string;
  home: MoneylineAway;
  away: MoneylineAway;
}

export interface MoneylineAway {
  close: PurpleClose;
  open: PurpleOpen;
}

export interface PurpleClose {
  odds: string;
  link?: OddLink;
}

export interface PurpleOpen {
  odds: string;
}

export interface PointSpread {
  displayName: string;
  shortDisplayName: string;
  home: OverClass;
  away: OverClass;
}

export interface OverClass {
  close: OverClose;
  open: OverOpen;
}

export interface OverClose {
  line: string;
  odds: string;
  link: OddLink;
}

export interface OverOpen {
  line: string;
  odds: string;
}

export interface Provider {
  id: string;
  name: string;
  priority: number;
  logos: any[];
}

export interface Total {
  displayName: string;
  shortDisplayName: string;
  over: OverClass;
  under: OverClass;
}
`;

          const statusTypeEnd = content.lastIndexOf('export interface StatusType');
          if (statusTypeEnd !== -1) {
            const afterStatusType = content.indexOf('\n}', statusTypeEnd);
            if (afterStatusType !== -1) {
              content =
                content.slice(0, afterStatusType + 2) +
                oddInterface +
                content.slice(afterStatusType + 2);
            } else {
              content = content.replace(/\n}$/, oddInterface + '\n}');
            }
          } else {
            content = content.replace(/\n}$/, oddInterface + '\n}');
          }
        }

        if (
          content.includes('export interface Competition {') &&
          !content.includes('odds?: Odd[]')
        ) {
          const competitionMatch = content.match(/export interface Competition\s*\{[\s\S]*?\n\}/);
          if (competitionMatch) {
            const competitionBlock = competitionMatch[0];
            const updatedCompetition = competitionBlock.replace(/(\n\})$/, '\n  odds?: Odd[]$1');
            content = content.replace(competitionMatch[0], updatedCompetition);
          }
        }
      }

      fs.writeFileSync(outputPath, content);
    }

    return { success: true, filePath: outputPath };
  } catch (error) {
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

    if (!fs.existsSync(OUTPUT_DIR)) {
      fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }

    const results: Array<{ type: string; result: TypeGenerationResult }> = [];

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
