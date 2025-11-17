/**
 * Analyze Test Database Content
 *
 * Analyzes what data is stored in the test database collections
 */

import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

const envPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
}

async function analyzeTestData() {
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

    // Analyze Scoreboard Data
    const ScoreboardModel = await getESPNScoreboardTestData();
    const scoreboardDocs = await ScoreboardModel.find().lean();

    const scoreboardWeeks = scoreboardDocs.map((doc) => ({
      season: (doc as { season?: number }).season,
      week: (doc as { week?: number }).week,
      eventCount: (doc as { response?: { events?: unknown[] } }).response?.events?.length || 0,
    }));

    // Analyze Game Summary Data
    const GameSummaryModel = await getESPNGameSummaryTestData();
    const gameSummaryDocs = await GameSummaryModel.find().lean();

    const gameSummarySeasons = gameSummaryDocs.map((doc) => ({
      season: (doc as { season?: number }).season,
      gameId: (doc as { gameId?: string }).gameId,
    }));

    // Analyze Team Data
    const TeamModel = await getESPNTeamTestData();
    const teamDocs = await TeamModel.find().lean();

    const teamSeasons = teamDocs.map((doc) => ({
      season: (doc as { season?: number }).season,
      teamId: (doc as { teamId?: string }).teamId,
      teamAbbrev: (doc as { teamAbbrev?: string }).teamAbbrev,
    }));

    // Analyze Team Records Data
    const TeamRecordsModel = await getESPNTeamRecordsTestData();
    const teamRecordsDocs = await TeamRecordsModel.find().lean();

    const teamRecordsSeasons = teamRecordsDocs.map((doc) => ({
      season: (doc as { season?: number }).season,
      teamId: (doc as { teamId?: string }).teamId,
      teamAbbrev: (doc as { teamAbbrev?: string }).teamAbbrev,
    }));

    // Extract state values and date formats from scoreboard events
    const allStates: string[] = [];
    const dateFormats: Array<{ date: string; startDate: string; venue: string }> = [];
    scoreboardDocs.forEach((doc) => {
      const events =
        (
          doc as {
            response?: {
              events?: Array<{
                competitions?: Array<{
                  status?: { type?: { state?: string } };
                  date?: string;
                  startDate?: string;
                  venue?: { address?: { city?: string; state?: string } };
                }>;
              }>;
            };
          }
        ).response?.events || [];
      events.forEach((event) => {
        event.competitions?.forEach((comp) => {
          const state = comp.status?.type?.state;
          if (state) {
            allStates.push(state);
          }
          // Collect date format samples
          if (comp.date || comp.startDate) {
            dateFormats.push({
              date: comp.date || '',
              startDate: comp.startDate || '',
              venue: `${comp.venue?.address?.city || ''}, ${comp.venue?.address?.state || ''}`,
            });
          }
        });
      });
    });

    // Output results
    process.stdout.write('=== Scoreboard Test Data ===\n');
    process.stdout.write(`Total documents: ${scoreboardDocs.length}\n`);
    scoreboardWeeks.forEach((w) => {
      process.stdout.write(`  Season ${w.season}, Week ${w.week}: ${w.eventCount} events\n`);
    });

    process.stdout.write('\n=== Game Summary Test Data ===\n');
    process.stdout.write(`Total documents: ${gameSummaryDocs.length}\n`);
    const uniqueGameSeasons = [...new Set(gameSummarySeasons.map((g) => g.season))];
    uniqueGameSeasons.forEach((season) => {
      const count = gameSummarySeasons.filter((g) => g.season === season).length;
      process.stdout.write(`  Season ${season}: ${count} game(s)\n`);
    });

    process.stdout.write('\n=== Team Test Data ===\n');
    process.stdout.write(`Total documents: ${teamDocs.length}\n`);
    const uniqueTeamSeasons = [...new Set(teamSeasons.map((t) => t.season))];
    uniqueTeamSeasons.forEach((season) => {
      const teams = teamSeasons.filter((t) => t.season === season);
      process.stdout.write(`  Season ${season}: ${teams.length} team(s)\n`);
      teams.slice(0, 3).forEach((t) => {
        process.stdout.write(`    - ${t.teamAbbrev} (${t.teamId})\n`);
      });
      if (teams.length > 3) {
        process.stdout.write(`    ... and ${teams.length - 3} more\n`);
      }
    });

    process.stdout.write('\n=== Team Records Test Data ===\n');
    process.stdout.write(`Total documents: ${teamRecordsDocs.length}\n`);
    const uniqueRecordsSeasons = [...new Set(teamRecordsSeasons.map((t) => t.season))];
    uniqueRecordsSeasons.forEach((season) => {
      const count = teamRecordsSeasons.filter((t) => t.season === season).length;
      process.stdout.write(`  Season ${season}: ${count} team record(s)\n`);
    });

    process.stdout.write('\n=== Game States Found ===\n');
    const uniqueStates = [...new Set(allStates)];
    process.stdout.write(`Unique states: ${uniqueStates.join(', ')}\n`);
    process.stdout.write(`Total game states analyzed: ${allStates.length}\n`);
    uniqueStates.forEach((state) => {
      const count = allStates.filter((s) => s === state).length;
      process.stdout.write(`  "${state}": ${count} occurrence(s)\n`);
    });

    process.stdout.write('\n=== Date Format Analysis ===\n');
    if (dateFormats.length > 0) {
      process.stdout.write(`Total date samples: ${dateFormats.length}\n`);
      process.stdout.write('\nSample date formats:\n');
      dateFormats.slice(0, 5).forEach((df, i) => {
        process.stdout.write(`  Sample ${i + 1} (${df.venue}):\n`);
        process.stdout.write(`    date: "${df.date}"\n`);
        process.stdout.write(`    startDate: "${df.startDate}"\n`);
        process.stdout.write(
          `    Has timezone in date: ${df.date.match(/[+-]\d{2}:?\d{2}|Z$/) ? 'YES' : 'NO'}\n`
        );
        process.stdout.write(
          `    Has timezone in startDate: ${df.startDate.match(/[+-]\d{2}:?\d{2}|Z$/) ? 'YES' : 'NO'}\n`
        );
        process.stdout.write('\n');
      });
    } else {
      process.stdout.write('No date samples found\n');
    }

    process.exit(0);
  } catch (error) {
    process.stderr.write(`Error: ${error instanceof Error ? error.message : String(error)}\n`);
    process.exit(1);
  }
}

void analyzeTestData();
