import { apiSlice as api } from './baseApi';
export const addTagTypes = ['Games', 'Simulation', 'Status', 'Monitoring', 'Stats'] as const;
const injectedRtkApi = api
  .enhanceEndpoints({
    addTagTypes,
  })
  .injectEndpoints({
    endpoints: (build) => ({
      getSeasonGameData: build.query<GetSeasonGameDataApiResponse, GetSeasonGameDataApiArg>({
        query: (queryArg) => ({
          url: `/games/${queryArg.sport}/${queryArg.conf}`,
          params: {
            season: queryArg.season,
            week: queryArg.week,
          },
        }),
        providesTags: ['Games'],
      }),
      simulate: build.mutation<SimulateApiResponse, SimulateApiArg>({
        query: (queryArg) => ({
          url: `/simulate/${queryArg.sport}/${queryArg.conf}`,
          method: 'POST',
          body: queryArg.simulateRequestBody,
        }),
        invalidatesTags: ['Simulation'],
      }),
      getSeasonStatus: build.query<GetSeasonStatusApiResponse, GetSeasonStatusApiArg>({
        query: () => ({ url: `/season-status` }),
        providesTags: ['Status'],
      }),
      getCfbdMonitor: build.query<GetCfbdMonitorApiResponse, GetCfbdMonitorApiArg>({
        query: () => ({ url: `/cfbd-monitor` }),
        providesTags: ['Monitoring'],
      }),
      postCfbdAlertHandler: build.mutation<
        PostCfbdAlertHandlerApiResponse,
        PostCfbdAlertHandlerApiArg
      >({
        query: (queryArg) => ({
          url: `/cfbd-alert-handler`,
          method: 'POST',
          body: queryArg.cfbdAlertRequest,
        }),
        invalidatesTags: ['Monitoring'],
      }),
      getRankings: build.query<GetRankingsApiResponse, GetRankingsApiArg>({
        query: (queryArg) => ({
          url: `/stats/rankings`,
          params: {
            season: queryArg.season,
            week: queryArg.week,
            seasonType: queryArg.seasonType,
          },
        }),
        providesTags: ['Stats'],
      }),
      getAdvancedStats: build.query<GetAdvancedStatsApiResponse, GetAdvancedStatsApiArg>({
        query: (queryArg) => ({
          url: `/stats/advanced`,
          params: {
            season: queryArg.season,
            conference: queryArg.conference,
          },
        }),
        providesTags: ['Stats'],
      }),
    }),
    overrideExisting: false,
  });
export { injectedRtkApi as api };
export type GetSeasonGameDataApiResponse = /** status 200 Successful response */ GamesResponse;
export type GetSeasonGameDataApiArg = {
  /** Sport identifier */
  sport: string;
  /** Conference abbreviation */
  conf: string;
  /** Season year (defaults to current season) */
  season?: number;
  /** Week number (requires season parameter) */
  week?: number | string;
};
export type SimulateApiResponse = /** status 200 Successful response */ SimulateResponse;
export type SimulateApiArg = {
  /** Sport identifier */
  sport: string;
  /** Conference abbreviation */
  conf: string;
  simulateRequestBody: SimulateRequestBody;
};
export type GetSeasonStatusApiResponse = /** status 200 Successful response */ SeasonStatusResponse;
export type GetSeasonStatusApiArg = void;
export type GetCfbdMonitorApiResponse = /** status 200 Successful response */ CfbdMonitorResponse;
export type GetCfbdMonitorApiArg = void;
export type PostCfbdAlertHandlerApiResponse =
  /** status 200 Successful response */ CfbdAlertResponse;
export type PostCfbdAlertHandlerApiArg = {
  cfbdAlertRequest: CfbdAlertRequest;
};
export type GetRankingsApiResponse = /** status 200 Successful response */ RankingsResponse;
export type GetRankingsApiArg = {
  /** Season year */
  season: number;
  /** Week number (optional, defaults to latest) */
  week?: number;
  /** Season type (regular, postseason, etc.) */
  seasonType?: string;
};
export type GetAdvancedStatsApiResponse =
  /** status 200 Successful response */ AdvancedStatsResponse;
export type GetAdvancedStatsApiArg = {
  /** Season year */
  season: number;
  /** Conference abbreviation (optional, defaults to all teams) */
  conference?: string;
};
export type GameState = 'pre' | 'in' | 'post';
export type GameVenue = {
  fullName: string;
  city: string;
  state: string;
  timezone: string;
};
export type GameTeam = {
  teamId: string;
  abbrev: string;
  displayName: string;
  shortDisplayName: string;
  logo: string;
  color?: string | null;
  alternateColor?: string | null;
  score: number | null;
  rank: number | null;
};
export type GameOdds = {
  favoriteTeamId: string | null;
  spread: number | null;
  overUnder: number | null;
};
export type PredictedScore = {
  home: number;
  away: number;
};
export type GameType = {
  name: string;
  abbreviation: string;
};
export type GameLean = {
  _id: string;
  id: string;
  displayName: string;
  date: string;
  week: number | null;
  season: number;
  sport: string;
  league: string;
  state: GameState;
  completed: boolean;
  conferenceGame: boolean;
  neutralSite: boolean;
  venue: GameVenue;
  home: GameTeam;
  away: GameTeam;
  odds: GameOdds;
  predictedScore: PredictedScore;
  gameType?: GameType;
};
export type TeamFullRecord = {
  overall: string;
  conference: string;
  home: string;
  away: string;
  stats: {
    wins?: number;
    losses?: number;
    winPercent?: number;
    pointsFor?: number;
    pointsAgainst?: number;
    pointDifferential?: number;
    avgPointsFor?: number;
    avgPointsAgainst?: number;
  };
};
export type TeamMetadata = {
  id: string;
  abbrev: string;
  name: string;
  displayName: string;
  shortDisplayName: string;
  logo: string;
  color: string;
  alternateColor: string;
  conferenceId: string;
  conferenceStanding: string;
  conferenceRecord: string;
  record: TeamFullRecord;
  rank: number | null;
  division?: string | null;
  nationalRank?: number | null;
  spPlusRating?: number | null;
  sor?: number | null;
};
export type GamesResponse = {
  events: GameLean[];
  teams: TeamMetadata[];
  season?: number;
};
export type ApiErrorResponse = {
  error: string;
  code: string;
};
export type TeamRecord = {
  wins: number;
  losses: number;
};
export type StandingEntry = {
  rank: number;
  teamId: string;
  abbrev: string;
  displayName: string;
  logo: string;
  color: string;
  record: TeamRecord;
  confRecord: TeamRecord;
  explainPosition: string;
  division?: string | null;
  nationalRank?: number | null;
};
export type TieStep = {
  rule: string;
  detail: string;
  survivors: string[];
  tieBroken: boolean;
  label: 'Advances' | 'Remaining' | 'Ranked last';
};
export type TieLog = {
  teams: string[];
  steps: TieStep[];
};
export type TieFlowNode = {
  id: string;
  teamIds: string[];
  rule: string | null;
  detail: string;
  label: string;
  type: 'root' | 'rule' | 'result';
};
export type TieFlowEdge = {
  id: string;
  source: string;
  target: string;
  label: string;
  teamIds: string[];
};
export type TieFlowTeamMeta = {
  abbrev: string;
  logo: string;
  color: string;
  displayName: string;
};
export type TieFlowGraph = {
  nodes: TieFlowNode[];
  edges: TieFlowEdge[];
  teams: Record<string, TieFlowTeamMeta>;
  summary: string[];
};
export type SimulateResponse = {
  standings: StandingEntry[];
  championship: string[];
  tieLogs: TieLog[];
  tieFlowGraphs: TieFlowGraph[];
};
export type ErrorResponse = {
  error: string;
};
export type GameOverride = {
  homeScore: number;
  awayScore: number;
};
export type SimulateRequestBody = {
  season: number;
  games: GameLean[];
  teams: TeamMetadata[];
  overrides: {
    [key: string]: GameOverride;
  };
};
export type SeasonStatusResponse = {
  inSeason: boolean;
  error?: string | null;
};
export type CfbdMonitorResponse = {
  patronLevel: number;
  remainingCalls: number;
  threshold: number;
  isLow: boolean;
  timestamp: string;
  error?: string | null;
};
export type CfbdAlertResponse = {
  success: boolean;
  method?: string | null;
  emailId?: string | null;
  error?: string | null;
};
export type CfbdAlertRequest = {
  remainingCalls: number;
  patronLevel: number;
  threshold: number;
  message?: string | null;
  timestamp?: string | null;
};
export type PollRank = {
  rank?: number;
  teamId?: number;
  school?: string;
  conference?: string | null;
  firstPlaceVotes?: number | null;
  points?: number | null;
};
export type Poll = {
  poll?: string;
  ranks?: PollRank[];
};
export type PollWeek = {
  season?: number;
  seasonType?: string;
  week?: number | null;
  polls?: Poll[] | null;
};
export type RankingsResponse = {
  rankings: PollWeek[] | null;
};
export type AdvancedSeasonStat = {
  season?: number;
  team?: string;
  conference?: string | null;
  offense?: {
    ppa?: number;
    successRate?: number;
    [key: string]: unknown;
  };
  defense?: {
    ppa?: number;
    successRate?: number;
    [key: string]: unknown;
  };
};
export type AdvancedStatsResponse = {
  stats: AdvancedSeasonStat[];
};
export const {
  useGetSeasonGameDataQuery,
  useSimulateMutation,
  useGetSeasonStatusQuery,
  useGetCfbdMonitorQuery,
  usePostCfbdAlertHandlerMutation,
  useGetRankingsQuery,
  useGetAdvancedStatsQuery,
} = injectedRtkApi;
