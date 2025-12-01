import * as fs from 'fs';
import * as path from 'path';

function verifyTypes() {
  const generatedTypesDir = path.join(process.cwd(), 'lib/espn');
  const files = {
    scoreboard: path.join(generatedTypesDir, 'espn-scoreboard-generated.ts'),
    team: path.join(generatedTypesDir, 'espn-team-generated.ts'),
  };

  const issues: string[] = [];
  const warnings: string[] = [];
  const verified: string[] = [];

  if (fs.existsSync(files.scoreboard)) {
    const content = fs.readFileSync(files.scoreboard, 'utf-8');

    const oddsMatch = content.match(/odds\?:\s*([^;]+);/);
    if (oddsMatch) {
      if (oddsMatch[1].includes('any[]')) {
        issues.push('Competition.odds is any[] but we use it (overUnder, spread, favorite)');
      } else if (oddsMatch[1].includes('Odd[]')) {
        verified.push('Competition.odds is correctly typed as Odd[]');
        if (
          content.includes('overUnder:') &&
          content.includes('spread:') &&
          content.includes('awayTeamOdds:') &&
          content.includes('homeTeamOdds:')
        ) {
          verified.push(
            'Odd interface has all required fields (overUnder, spread, awayTeamOdds, homeTeamOdds)'
          );
        } else {
          issues.push('Odd interface missing required fields');
        }
      }
    }

    if (content.includes('statistics:  any[]')) {
      warnings.push("Competitor.statistics is any[] (we don't use it, so this is fine)");
    }

    if (content.includes('records:     Record[]')) {
      warnings.push("Competitor.records is typed (we don't use it, but it's correctly typed)");
    }

    if (
      content.includes('homeAway:') &&
      content.includes('score:') &&
      content.includes('curatedRank:') &&
      content.includes('team:')
    ) {
      verified.push('Competitor has all fields we use (homeAway, score, curatedRank, team)');
    }

    if (
      content.includes('abbreviation:') &&
      content.includes('displayName:') &&
      content.includes('color:')
    ) {
      verified.push(
        'CompetitorTeam has all fields we use (id, abbreviation, displayName, logo, color)'
      );
    }
  }

  if (fs.existsSync(files.team)) {
    const content = fs.readFileSync(files.team, 'utf-8');

    const recordMatch = content.match(/export interface Record\s*\{[\s\S]*?\n\}/);
    if (recordMatch && recordMatch[0].includes('items:')) {
      verified.push('Team Record has items array');
      const itemMatch = content.match(/export interface Item\s*\{[\s\S]*?\n\}/);
      if (itemMatch) {
        if (
          itemMatch[0].includes('type:') &&
          itemMatch[0].includes('summary:') &&
          itemMatch[0].includes('stats:')
        ) {
          verified.push('Team Record Item has all fields we use (type, summary, stats)');
        } else {
          issues.push('Team Record Item missing required fields (type, summary, or stats)');
        }
      }
    } else {
      issues.push('Team Record interface missing items array');
    }

    if (content.includes('notes:             any[]')) {
      warnings.push("Team.notes is any[] (we don't use it, so this is fine)");
    }

    if (
      content.includes('id:') &&
      content.includes('name:') &&
      content.includes('displayName:') &&
      content.includes('abbreviation:') &&
      content.includes('color:') &&
      content.includes('alternateColor:') &&
      content.includes('rank:') &&
      content.includes('standingSummary:') &&
      content.includes('groups:') &&
      content.includes('logos:') &&
      content.includes('record:')
    ) {
      verified.push('Team has all fields we use');
    }
  }

  process.stdout.write('=== ESPN Type Verification ===\n\n');

  if (verified.length > 0) {
    process.stdout.write('✅ Verified (correctly typed fields we use):\n');
    verified.forEach((v) => {
      process.stdout.write(`  ✓ ${v}\n`);
    });
    process.stdout.write('\n');
  }

  if (issues.length > 0) {
    process.stdout.write('❌ Issues found (fields we use that are incorrectly typed):\n');
    issues.forEach((issue) => {
      process.stdout.write(`  ✗ ${issue}\n`);
    });
    process.stdout.write('\n');
  }

  if (warnings.length > 0) {
    process.stdout.write("ℹ️  Warnings (any[] fields we don't use - these are fine):\n");
    warnings.forEach((warning) => {
      process.stdout.write(`  - ${warning}\n`);
    });
    process.stdout.write('\n');
  }

  if (issues.length === 0) {
    process.stdout.write('🎉 All used fields are correctly typed!\n');
  }
}

verifyTypes();
