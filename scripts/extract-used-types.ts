/**
 * Extract only the types for fields we actually use from generated ESPN types
 * This creates a minimal snapshot of only relevant type information
 *
 * Automatically extracts field paths from reshape functions to detect:
 * 1. When ESPN source types change (e.g., string → number)
 * 2. When we add/remove usage of fields
 */

import * as fs from 'fs';
import * as path from 'path';

interface TypeSnapshot {
  [fieldPath: string]: string; // field path -> type string
}

interface SnapshotData {
  scoreboard: TypeSnapshot;
  team: TypeSnapshot;
  teamRecords: TypeSnapshot;
  // Metadata about when fields were extracted
  extractedAt: string;
  fieldCount: {
    scoreboard: number;
    team: number;
    teamRecords: number;
  };
}

/**
 * Extract field paths from reshape functions by parsing the source code
 */
function extractFieldPathsFromReshapeFunctions(): {
  scoreboard: string[];
  team: string[];
  teamRecords: string[];
} {
  const reshapeGamesPath = path.join(process.cwd(), 'lib/reshape-games.ts');
  const reshapeTeamsPath = path.join(process.cwd(), 'lib/reshape-teams.ts');

  const fields = {
    scoreboard: [] as string[],
    team: [] as string[],
    teamRecords: [] as string[],
  };

  // Extract from reshape-games.ts
  if (fs.existsSync(reshapeGamesPath)) {
    const content = fs.readFileSync(reshapeGamesPath, 'utf-8');

    // Pattern: event.id, event.competitions[0], competition.date, etc.
    // Look for patterns like: event.id, competition.date, awayTeam.score, etc.
    const patterns = [
      // Event fields
      { pattern: /event\.id/g, path: 'Event.id' },
      { pattern: /event\.competitions/g, path: 'Event.competitions' },
      { pattern: /espnResponse\.events/g, path: 'EspnScoreboardGenerated.events' },
      { pattern: /espnResponse\.week\?\.number/g, path: 'EspnScoreboardGenerated.week.number' },
      { pattern: /espnResponse\.season\?\.year/g, path: 'EspnScoreboardGenerated.season.year' },

      // Competition fields
      { pattern: /competition\.date/g, path: 'Competition.date' },
      { pattern: /competition\.competitors/g, path: 'Competition.competitors' },
      { pattern: /competition\.odds/g, path: 'Competition.odds' },
      { pattern: /competition\.status\.type\.state/g, path: 'Competition.status.type.state' },
      {
        pattern: /competition\.status\.type\.completed/g,
        path: 'Competition.status.type.completed',
      },
      { pattern: /competition\.conferenceCompetition/g, path: 'Competition.conferenceCompetition' },
      { pattern: /competition\.neutralSite/g, path: 'Competition.neutralSite' },
      { pattern: /competition\.week\?\.number/g, path: 'Competition.week.number' },
      { pattern: /competition\.season\?\.year/g, path: 'Competition.season.year' },

      // Competitor fields
      { pattern: /(homeTeam|awayTeam)\.homeAway/g, path: 'Competitor.homeAway' },
      { pattern: /(homeTeam|awayTeam)\.score/g, path: 'Competitor.score' },
      {
        pattern: /(homeTeam|awayTeam)\.curatedRank\?\.current/g,
        path: 'Competitor.curatedRank.current',
      },
      { pattern: /(homeTeam|awayTeam)\.team\.id/g, path: 'Competitor.team.id' },
      { pattern: /(homeTeam|awayTeam)\.team\.abbreviation/g, path: 'Competitor.team.abbreviation' },
      { pattern: /(homeTeam|awayTeam)\.team\.displayName/g, path: 'Competitor.team.displayName' },
      { pattern: /(homeTeam|awayTeam)\.team\.logo/g, path: 'Competitor.team.logo' },
      { pattern: /(homeTeam|awayTeam)\.team\.color/g, path: 'Competitor.team.color' },

      // Odds fields
      { pattern: /odds\.overUnder/g, path: 'Odd.overUnder' },
      { pattern: /odds\.spread/g, path: 'Odd.spread' },
      { pattern: /odds\.awayTeamOdds\?\.favorite/g, path: 'Odd.awayTeamOdds.favorite' },
      { pattern: /odds\.homeTeamOdds\?\.favorite/g, path: 'Odd.homeTeamOdds.favorite' },
    ];

    for (const { pattern, path: fieldPath } of patterns) {
      if (pattern.test(content) && !fields.scoreboard.includes(fieldPath)) {
        fields.scoreboard.push(fieldPath);
      }
    }
  }

  // Extract from reshape-teams.ts
  if (fs.existsSync(reshapeTeamsPath)) {
    const content = fs.readFileSync(reshapeTeamsPath, 'utf-8');

    const patterns = [
      // Team fields
      { pattern: /team\.id/g, path: 'Team.id' },
      { pattern: /team\.name/g, path: 'Team.name' },
      { pattern: /team\.displayName/g, path: 'Team.displayName' },
      { pattern: /team\.abbreviation/g, path: 'Team.abbreviation' },
      { pattern: /team\.color/g, path: 'Team.color' },
      { pattern: /team\.alternateColor/g, path: 'Team.alternateColor' },
      { pattern: /team\.rank/g, path: 'Team.rank' },
      { pattern: /team\.standingSummary/g, path: 'Team.standingSummary' },
      { pattern: /team\.groups\?\.parent\?\.id/g, path: 'Team.groups.parent.id' },
      { pattern: /team\.logos/g, path: 'Team.logos' },
      { pattern: /team\.record\?\.items/g, path: 'Team.record.items' },

      // Logo fields
      { pattern: /logo\?\.href/g, path: 'Logo.href' },
      { pattern: /logo\?\.width/g, path: 'Logo.width' },

      // Record Item fields (from team.record.items)
      { pattern: /recordItem\.type/g, path: 'Item.type' },
      { pattern: /recordItem\.summary/g, path: 'Item.summary' },
      { pattern: /recordItem\.stats/g, path: 'Item.stats' },

      // Stats fields
      { pattern: /stats\.find\(/g, path: 'Stat.name' }, // We use stats.find, so we need name
      { pattern: /\.value/g, path: 'Stat.value' }, // We access .value on stats

      // NextEvent fields
      { pattern: /nextEvent\?\.\[0\]\?\.id/g, path: 'NextEvent.id' },
      { pattern: /espnTeamResponse\.nextEvent/g, path: 'NextEvent.id' },
    ];

    for (const { pattern, path: fieldPath } of patterns) {
      if (pattern.test(content) && !fields.team.includes(fieldPath)) {
        fields.team.push(fieldPath);
      }
    }

    // Team Records (from coreRecordResponse)
    const teamRecordsPatterns = [
      { pattern: /coreRecordResponse\?\.items/g, path: 'Item[]' },
      { pattern: /items\.find\(.*item\.name/g, path: 'Item.name' },
      { pattern: /items\.find\(.*item\.type/g, path: 'Item.type' },
      { pattern: /overallRecord\?\.summary/g, path: 'Item.summary' },
      { pattern: /overallRecord\?\.stats/g, path: 'Item.stats' },
      { pattern: /stats\.find\(.*s\.name/g, path: 'Stat.name' },
      { pattern: /stats\.find\(.*\.value/g, path: 'Stat.value' },
    ];

    for (const { pattern, path: fieldPath } of teamRecordsPatterns) {
      if (pattern.test(content) && !fields.teamRecords.includes(fieldPath)) {
        fields.teamRecords.push(fieldPath);
      }
    }
  }

  return fields;
}

function extractTypeFromGeneratedTypes(
  generatedTypesDir: string,
  typeSet: 'scoreboard' | 'team' | 'teamRecords',
  fieldPaths: string[]
): TypeSnapshot {
  const snapshot: TypeSnapshot = {};

  let fileName: string;
  if (typeSet === 'scoreboard') {
    fileName = 'espn-scoreboard-generated.ts';
  } else if (typeSet === 'team') {
    fileName = 'espn-team-generated.ts';
  } else {
    fileName = 'espn-team-records-generated.ts';
  }

  const filePath = path.join(generatedTypesDir, fileName);
  if (!fs.existsSync(filePath)) {
    return snapshot;
  }

  // Read the generated types file
  // Note: This file may contain manual overrides (e.g., GameState replacement)
  // but for type tracking purposes, we use the generated file directly
  const content = fs.readFileSync(filePath, 'utf-8');

  // Extract types for each field path
  for (const fieldPath of fieldPaths) {
    const parts = fieldPath.split('.');
    const interfaceName = parts[0];
    const fieldName = parts[parts.length - 1];

    // Find the interface
    const interfaceMatch = content.match(
      new RegExp(`export interface ${interfaceName}\\s*\\{([\\s\\S]*?)\\n\\}`, 'm')
    );

    if (!interfaceMatch) {
      continue;
    }

    // Simple case: direct field in interface
    if (parts.length === 2) {
      const fieldMatch = interfaceMatch[1].match(
        new RegExp(`\\s+${fieldName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*:\\s*([^;|]+)`, 'm')
      );

      if (fieldMatch) {
        snapshot[fieldPath] = fieldMatch[1].trim();
        continue;
      }
    }

    // Nested case: navigate through nested types
    let currentContent = interfaceMatch[1];
    let found = false;

    for (let i = 1; i < parts.length; i++) {
      const part = parts[i];
      const isLast = i === parts.length - 1;
      const propName = part;

      // Find property in current content
      const propMatch = currentContent.match(
        new RegExp(`\\s+${propName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*:\\s*([^;|]+)`, 'm')
      );

      if (!propMatch) {
        break;
      }

      const typeRef = propMatch[1].trim().replace(/\[\]$/, '').replace(/\?$/, '');

      if (isLast) {
        // Last part - this is the type we want
        snapshot[fieldPath] = typeRef;
        found = true;
        break;
      }

      // Look up the referenced interface
      const refInterfaceMatch = content.match(
        new RegExp(`export interface ${typeRef}\\s*\\{([\\s\\S]*?)\\n\\}`, 'm')
      );

      if (refInterfaceMatch) {
        currentContent = refInterfaceMatch[1];
      } else {
        // Try with array syntax removed
        const arrayRemoved = typeRef.replace(/\[\]$/, '');
        const refInterfaceMatch2 = content.match(
          new RegExp(`export interface ${arrayRemoved}\\s*\\{([\\s\\S]*?)\\n\\}`, 'm')
        );
        if (refInterfaceMatch2) {
          currentContent = refInterfaceMatch2[1];
        } else {
          break;
        }
      }
    }

    if (!found) {
      // Try alternative: maybe the field path uses different naming
      // For example, "Competitor.team.color" might need to look in CompetitorTeam
      if (fieldPath.includes('.team.')) {
        // Try finding team-related fields
        const teamFieldMatch = content.match(
          new RegExp(`export interface CompetitorTeam\\s*\\{([\\s\\S]*?)\\n\\}`, 'm')
        );
        if (teamFieldMatch) {
          const teamFieldName = parts[parts.length - 1];
          const teamFieldMatch2 = teamFieldMatch[1].match(
            new RegExp(
              `\\s+${teamFieldName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*:\\s*([^;|]+)`,
              'm'
            )
          );
          if (teamFieldMatch2) {
            snapshot[fieldPath] = teamFieldMatch2[1].trim();
          }
        }
      }
    }
  }

  return snapshot;
}

function createTypeSnapshot(): SnapshotData {
  const generatedTypesDir = path.join(process.cwd(), 'lib/espn');
  const snapshotDir = path.join(process.cwd(), 'temp/type-snapshots');

  if (!fs.existsSync(snapshotDir)) {
    fs.mkdirSync(snapshotDir, { recursive: true });
  }

  // Automatically extract field paths from reshape functions
  const fieldPaths = extractFieldPathsFromReshapeFunctions();

  const snapshots: SnapshotData = {
    scoreboard: extractTypeFromGeneratedTypes(
      generatedTypesDir,
      'scoreboard',
      fieldPaths.scoreboard
    ),
    team: extractTypeFromGeneratedTypes(generatedTypesDir, 'team', fieldPaths.team),
    teamRecords: extractTypeFromGeneratedTypes(
      generatedTypesDir,
      'teamRecords',
      fieldPaths.teamRecords
    ),
    extractedAt: new Date().toISOString(),
    fieldCount: {
      scoreboard: fieldPaths.scoreboard.length,
      team: fieldPaths.team.length,
      teamRecords: fieldPaths.teamRecords.length,
    },
  };

  // Save snapshot
  const snapshotPath = path.join(snapshotDir, 'used-types-snapshot.json');
  fs.writeFileSync(snapshotPath, JSON.stringify(snapshots, null, 2));

  process.stdout.write(`Type snapshot saved to ${snapshotPath}\n`);
  process.stdout.write(
    `Fields tracked: ${fieldPaths.scoreboard.length + fieldPaths.team.length + fieldPaths.teamRecords.length}\n`
  );

  return snapshots;
}

function compareSnapshots(
  oldPath: string,
  newPath: string
): { changed: boolean; diff: string; summary: string } {
  if (!fs.existsSync(oldPath)) {
    return {
      changed: false, // First run - no PR needed, just create snapshot
      diff: 'No previous snapshot found - this is the first run. Snapshot created for future comparisons.',
      summary: 'First snapshot created',
    };
  }

  const oldSnapshot: SnapshotData = JSON.parse(fs.readFileSync(oldPath, 'utf-8'));
  const newSnapshot: SnapshotData = JSON.parse(fs.readFileSync(newPath, 'utf-8'));

  const espnTypeChanges: string[] = [];
  const usageChanges: string[] = [];

  // Compare each type set
  for (const typeSet of ['scoreboard', 'team', 'teamRecords'] as const) {
    const old = oldSnapshot[typeSet] || {};
    const new_ = newSnapshot[typeSet] || {};

    // Only compare fields that exist in BOTH old and new
    // This means we're comparing ESPN types for fields we currently use
    for (const fieldPath of Object.keys(new_)) {
      if (fieldPath in old) {
        // Field exists in both - compare ESPN types
        if (old[fieldPath] !== new_[fieldPath]) {
          // ESPN changed the type
          espnTypeChanges.push(`~ ${typeSet}.${fieldPath}: ${old[fieldPath]} → ${new_[fieldPath]}`);
        }
      } else {
        // Field added (we started using it) - no PR, just track it
        usageChanges.push(`+ ${typeSet}.${fieldPath}: ${new_[fieldPath]} (newly tracked, no PR)`);
      }
    }

    // Fields removed (we stopped using them) - no PR, just stop tracking
    for (const fieldPath of Object.keys(old)) {
      if (!(fieldPath in new_)) {
        usageChanges.push(
          `- ${typeSet}.${fieldPath}: ${old[fieldPath]} (no longer tracked, no PR)`
        );
      }
    }
  }

  // Only trigger PR if ESPN types changed
  const hasEspnChanges = espnTypeChanges.length > 0;

  // Build summary
  let summary: string;
  if (hasEspnChanges) {
    summary = `${espnTypeChanges.length} ESPN type change(s) detected`;
  } else if (usageChanges.length > 0) {
    summary = `No ESPN type changes. ${usageChanges.length} usage change(s) (tracking updated silently)`;
  } else {
    summary = 'No changes detected';
  }

  // Build diff - only show ESPN changes (these trigger PRs)
  let diff: string;
  if (hasEspnChanges) {
    diff = '=== ESPN TYPE CHANGES (triggers PR) ===\n' + espnTypeChanges.join('\n');
  } else {
    diff = 'No ESPN type changes in fields we currently use.\n';
    if (usageChanges.length > 0) {
      diff += `\nUsage changes (tracking updated, no PR):\n${usageChanges.join('\n')}`;
    }
  }

  return {
    changed: hasEspnChanges, // Only true if ESPN types changed
    diff,
    summary,
  };
}

// Main execution
const command = process.argv[2];

if (command === 'create') {
  createTypeSnapshot();
} else if (command === 'compare') {
  const oldPath =
    process.argv[3] || path.join(process.cwd(), 'temp/type-snapshots/used-types-snapshot.json');
  const newPath =
    process.argv[4] || path.join(process.cwd(), 'temp/type-snapshots/used-types-snapshot.json');

  // Create new snapshot first
  createTypeSnapshot();

  const result = compareSnapshots(oldPath, newPath);
  process.stdout.write(`\n${result.summary}\n\n`);
  process.stdout.write(result.diff);
  process.stdout.write('\n');

  if (result.changed) {
    // ESPN type changed - trigger PR
    process.exit(1);
  } else {
    // No ESPN type changes - snapshot updated silently if usage changed
    process.exit(0);
  }
} else {
  process.stdout.write(
    'Usage: npx tsx scripts/extract-used-types.ts [create|compare] [old-snapshot-path] [new-snapshot-path]\n'
  );
  process.exit(1);
}
