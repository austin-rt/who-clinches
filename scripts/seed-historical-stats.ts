delete process.env.FIXTURE_YEAR;

import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import {
  getSpFromCfbd,
  getFpiFromCfbd,
  getGamesFromCfbd,
  getRankingsFromCfbd,
} from '../lib/cfb/cfbd-rest-client';

const YEARS = [2020, 2021, 2022, 2023, 2024];
const OUTPUT_DIR = join(process.cwd(), 'docs', 'historical-stats');
const DELAY_MS = 2000;

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

const formatSp = (sp: Awaited<ReturnType<typeof getSpFromCfbd>>, year: number): string => {
  const lines: string[] = [`${year} SP+ Ratings (Bill Connelly's efficiency model)`, ''];
  const sorted = [...sp].sort((a, b) => (a.ranking ?? 999) - (b.ranking ?? 999));

  for (const team of sorted) {
    if (!team.conference) continue;
    const parts = [
      `${team.ranking ?? '?'}. ${team.team} (${team.conference})`,
      `  Overall: ${team.rating.toFixed(1)} | SOS: ${team.sos?.toFixed(1) ?? 'N/A'} | Second-Order Wins: ${team.secondOrderWins?.toFixed(1) ?? 'N/A'}`,
      `  Offense: ${team.offense.rating.toFixed(1)} (#${team.offense.ranking ?? '?'}) | Defense: ${team.defense.rating.toFixed(1)} (#${team.defense.ranking ?? '?'})`,
    ];
    lines.push(parts.join('\n'));
  }

  return lines.join('\n');
};

const formatFpi = (fpi: Awaited<ReturnType<typeof getFpiFromCfbd>>, year: number): string => {
  const lines: string[] = [
    `${year} FPI Ratings & Resume Rankings (ESPN's Football Power Index)`,
    '',
  ];
  const sorted = [...fpi].sort((a, b) => (a.resumeRanks?.fpi ?? 999) - (b.resumeRanks?.fpi ?? 999));

  for (const team of sorted) {
    if (!team.conference) continue;
    const parts = [
      `${team.resumeRanks?.fpi ?? '?'}. ${team.team} (${team.conference})`,
      `  FPI: ${team.fpi?.toFixed(1) ?? 'N/A'} | SOS Rank: ${team.resumeRanks?.strengthOfSchedule ?? 'N/A'} | SOR Rank: ${team.resumeRanks?.strengthOfRecord ?? 'N/A'}`,
      `  Offense Eff: ${team.efficiencies?.offense?.toFixed(1) ?? 'N/A'} | Defense Eff: ${team.efficiencies?.defense?.toFixed(1) ?? 'N/A'}`,
    ];
    lines.push(parts.join('\n'));
  }

  return lines.join('\n');
};

const formatChampionships = (
  games: Awaited<ReturnType<typeof getGamesFromCfbd>>,
  year: number
): string => {
  const champGames = games.filter((g) => g.notes && /championship/i.test(g.notes) && g.completed);

  if (champGames.length === 0) return '';

  const lines: string[] = [`${year} Conference Championship Games`, ''];

  for (const g of champGames) {
    const winner = (g.homePoints ?? 0) > (g.awayPoints ?? 0) ? g.homeTeam : g.awayTeam;
    const loser = winner === g.homeTeam ? g.awayTeam : g.homeTeam;
    const winScore = Math.max(g.homePoints ?? 0, g.awayPoints ?? 0);
    const loseScore = Math.min(g.homePoints ?? 0, g.awayPoints ?? 0);
    lines.push(`${g.notes ?? 'Championship'}: ${winner} ${winScore}, ${loser} ${loseScore}`);
  }

  return lines.join('\n');
};

const formatPreseasonRankings = (
  rankings: Awaited<ReturnType<typeof getRankingsFromCfbd>>,
  year: number
): string => {
  if (rankings.length === 0) return '';

  const lines: string[] = [`${year} Preseason Rankings`, ''];

  for (const week of rankings) {
    for (const poll of week.polls ?? []) {
      lines.push(`${poll.poll}:`);
      for (const rank of poll.ranks ?? []) {
        if (rank.rank === null || rank.rank === undefined) continue;
        const fvotes = rank.firstPlaceVotes ? ` (${rank.firstPlaceVotes} first-place votes)` : '';
        lines.push(`  ${rank.rank}. ${rank.school} (${rank.conference ?? '?'})${fvotes}`);
      }
      lines.push('');
    }
  }

  return lines.join('\n');
};

const run = async () => {
  mkdirSync(OUTPUT_DIR, { recursive: true });
  console.log(`Fetching historical stats for ${YEARS.join(', ')}...\n`);

  for (const year of YEARS) {
    console.log(`--- ${year} ---`);

    const sp = await getSpFromCfbd({ year });
    console.log(`  SP+: ${sp.length} teams`);
    await delay(DELAY_MS);

    const fpi = await getFpiFromCfbd({ year });
    console.log(`  FPI: ${fpi.length} teams`);
    await delay(DELAY_MS);

    const postseasonGames = await getGamesFromCfbd({ year, seasonType: 'postseason' });
    console.log(`  Postseason games: ${postseasonGames.length}`);
    await delay(DELAY_MS);

    const preseasonRankings = await getRankingsFromCfbd({ year, week: 1 });
    console.log(`  Preseason rankings: ${preseasonRankings.length} weeks`);
    await delay(DELAY_MS);

    if (sp.length > 0) {
      writeFileSync(join(OUTPUT_DIR, `${year}-sp-plus.txt`), formatSp(sp, year));
      console.log(`  Wrote ${year}-sp-plus.txt`);
    }

    if (fpi.length > 0) {
      writeFileSync(join(OUTPUT_DIR, `${year}-fpi.txt`), formatFpi(fpi, year));
      console.log(`  Wrote ${year}-fpi.txt`);
    }

    const champText = formatChampionships(postseasonGames, year);
    if (champText) {
      writeFileSync(join(OUTPUT_DIR, `${year}-championships.txt`), champText);
      console.log(`  Wrote ${year}-championships.txt`);
    }

    const rankingsText = formatPreseasonRankings(preseasonRankings, year);
    if (rankingsText) {
      writeFileSync(join(OUTPUT_DIR, `${year}-preseason-rankings.txt`), rankingsText);
      console.log(`  Wrote ${year}-preseason-rankings.txt`);
    }

    console.log('');
  }

  console.log('Done. Run ingest-knowledge.ts to embed these into the RAG database.');
};

run().catch((err) => {
  console.error('Failed:', err);
  process.exit(1);
});
