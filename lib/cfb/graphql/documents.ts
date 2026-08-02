export const GAME_FIELDS = `
  id
  season
  week
  seasonType
  startDate
  startTimeTbd
  status
  neutralSite
  conferenceGame
  notes
  venueId
  attendance
  excitement
  homeTeamId
  homeTeam
  homeConference
  homeClassification
  homePoints
  homeLineScores
  homeStartElo
  homeEndElo
  homePostgameWinProb
  awayTeamId
  awayTeam
  awayConference
  awayClassification
  awayPoints
  awayLineScores
  awayStartElo
  awayEndElo
  awayPostgameWinProb
  lines {
    linesProviderId
    provider {
      name
    }
    spread
    overUnder
  }
`;

export const CONFERENCE_GAMES = `
  query ConferenceGames($where: gameBoolExp!, $limit: Int!) {
    game(where: $where, limit: $limit) {
      ${GAME_FIELDS}
    }
  }
`;

export const CONFERENCE_TEAMS = `
  query ConferenceTeams($where: historicalTeamBoolExp!, $limit: Int!) {
    historicalTeam(where: $where, limit: $limit) {
      id
      school
      mascot
      abbreviation
      conference
      division
      classification
      color
      altColor
      images
      altName
      nickname
      shortDisplayName
    }
  }
`;

export const GAME_UPDATES = `
  subscription GameUpdates($where: gameBoolExp!) {
    game(where: $where) {
      ${GAME_FIELDS}
    }
  }
`;
