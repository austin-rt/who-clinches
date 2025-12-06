import { GameLean } from '../../../types';
import { getTeamRecord } from './core-helpers';

export const calculateTeamRatingScore = (
  teamId: string,
  games: GameLean[],
  allTeams: string[],
  tiedTeams: string[]
): number => {
  const record = getTeamRecord(teamId, games);
  const winPct = record.winPct;

  const teamGames = games.filter(
    (g) => g.home.teamId === teamId || g.away.teamId === teamId
  );

  let pointsFor = 0;
  let pointsAgainst = 0;
  let gamesPlayed = 0;

  for (const game of teamGames) {
    if (game.home.score === null || game.away.score === null) continue;

    const isHome = game.home.teamId === teamId;
    const teamScore = isHome ? game.home.score : game.away.score;
    const oppScore = isHome ? game.away.score : game.home.score;

    pointsFor += teamScore;
    pointsAgainst += oppScore;
    gamesPlayed++;
  }

  const pointDifferentialPerGame =
    gamesPlayed === 0 ? 0 : (pointsFor - pointsAgainst) / gamesPlayed;

  const tiedTeamDifferentials = tiedTeams.map((tid) => {
    const tidGames = games.filter(
      (g) => g.home.teamId === tid || g.away.teamId === tid
    );
    let tidPointsFor = 0;
    let tidPointsAgainst = 0;
    let tidGamesPlayed = 0;

    for (const game of tidGames) {
      if (game.home.score === null || game.away.score === null) continue;

      const isHome = game.home.teamId === tid;
      const tidTeamScore = isHome ? game.home.score : game.away.score;
      const tidOppScore = isHome ? game.away.score : game.home.score;

      tidPointsFor += tidTeamScore;
      tidPointsAgainst += tidOppScore;
      tidGamesPlayed++;
    }

    return tidGamesPlayed === 0 ? 0 : (tidPointsFor - tidPointsAgainst) / tidGamesPlayed;
  });

  const minDiff = Math.min(...tiedTeamDifferentials);
  const maxDiff = Math.max(...tiedTeamDifferentials);
  const range = maxDiff - minDiff;

  let normalizedPointDiff: number;
  if (range === 0) {
    normalizedPointDiff = 0.5;
  } else {
    normalizedPointDiff = (pointDifferentialPerGame - minDiff) / range;
  }

  const teamGamesForOppWinPct = games.filter(
    (g) => g.home.teamId === teamId || g.away.teamId === teamId
  );

  const opponents = teamGamesForOppWinPct.map((g) =>
    g.home.teamId === teamId ? g.away.teamId : g.home.teamId
  );

  let totalWins = 0;
  let totalGames = 0;

  for (const oppId of opponents) {
    const oppRecord = getTeamRecord(oppId, games);
    totalWins += oppRecord.wins;
    totalGames += oppRecord.wins + oppRecord.losses;
  }

  const oppWinPct = totalGames === 0 ? 0 : totalWins / totalGames;

  const teamRating = winPct * 0.33 + normalizedPointDiff * 0.33 + oppWinPct * 0.33;

  return teamRating;
};

