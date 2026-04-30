import { fetchWithTimeout } from '../fetch-with-timeout';
import { createClient, Client } from 'graphql-ws';
import { logError } from '../errorLogger';
import { getActiveApiKey } from './cfbd-rest-client';

const REQUEST_TIMEOUT_MS = 60000;
const GRAPHQL_ENDPOINT = 'https://graphqldocs.collegefootballdata.com/v1/graphql';
const GRAPHQL_WS_ENDPOINT = 'wss://graphql.collegefootballdata.com/v1/graphql';

const getAuthHeaders = () => {
  const apiKey = getActiveApiKey();
  if (!apiKey) {
    const error = new Error('No CFBD API key configured');
    void logError(error, {
      action: 'get-auth-headers',
    });
    throw error;
  }
  return {
    Authorization: `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
  };
};

export interface GraphQLResponse<T> {
  data?: T;
  errors?: Array<{ message: string; path?: string[] }>;
}

export interface GameAggregateResult {
  gameAggregate: {
    nodes: Array<{
      id: number;
      season: number;
      week: number;
      seasonType: string;
      startDate: string;
      completed: boolean;
      neutralSite: boolean;
      conferenceGame: boolean;
      homeId: number;
      homeTeam: string;
      homePoints?: number;
      awayId: number;
      awayTeam: string;
      awayPoints?: number;
      venue?: string;
      spread?: number;
      overUnder?: number;
      favoriteId?: number;
    }>;
  };
}

export interface CurrentTeamsResult {
  currentTeams: {
    nodes: Array<{
      id: number;
      school: string;
      abbreviation: string;
      conference?: string;
      color?: string;
      altColor?: string;
      logos?: string[];
    }>;
  };
}

export interface GameSubscriptionResult {
  game: Array<{
    id: number;
    year: number;
    week: number;
    seasonType: string;
    startDate: string;
    completed: boolean;
    neutralSite: boolean;
    conferenceGame: boolean;
    homeId: number;
    homeTeam: string;
    homePoints?: number;
    awayId: number;
    awayTeam: string;
    awayPoints?: number;
    venue?: string;
    spread?: number;
    overUnder?: number;
    favoriteId?: number;
  }>;
}

export class CFBDGraphQLClient {
  private wsClient: Client | null = null;

  private getWsClient(): Client {
    if (!this.wsClient) {
      const apiKey = getActiveApiKey();
      if (!apiKey) {
        const error = new Error('No CFBD API key configured');
        void logError(error, {
          action: 'get-ws-client',
        });
        throw error;
      }

      this.wsClient = createClient({
        url: GRAPHQL_WS_ENDPOINT,
        connectionParams: {
          headers: {
            Authorization: `Bearer ${apiKey}`,
          },
        },
      });
    }
    return this.wsClient;
  }

  private async query<T>(query: string, variables?: Record<string, unknown>): Promise<T> {
    const response = await fetchWithTimeout(
      GRAPHQL_ENDPOINT,
      {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          query,
          variables,
        }),
      },
      REQUEST_TIMEOUT_MS
    );

    if (!response.ok) {
      if (response.status === 404) {
        const error = new Error(
          `CFBD GraphQL API not available (404). This may indicate you need to upgrade your API tier or the season has ended. Use REST API instead.`
        );
        await logError(error, {
          action: 'graphql-query',
          status: response.status,
        });
        throw error;
      }
      const error = new Error(`CFBD GraphQL API error: ${response.status} ${response.statusText}`);
      await logError(error, {
        action: 'graphql-query',
        status: response.status,
        statusText: response.statusText,
      });
      throw error;
    }

    const result: GraphQLResponse<T> = await response.json();

    if (result.errors && result.errors.length > 0) {
      const error = new Error(
        `CFBD GraphQL errors: ${result.errors.map((e) => e.message).join(', ')}`
      );
      await logError(error, {
        action: 'graphql-query',
        errors: result.errors,
      });
      throw error;
    }

    if (!result.data) {
      const error = new Error('CFBD GraphQL response missing data');
      await logError(error, {
        action: 'graphql-query',
      });
      throw error;
    }

    return result.data;
  }

  getGameAggregate(params: {
    season?: number;
    week?: number;
    conference?: string;
  }): Promise<GameAggregateResult> {
    const whereClause: string[] = [];
    if (params.season) {
      whereClause.push(`year: {_eq: ${params.season}}`);
    }
    if (params.week !== undefined) {
      whereClause.push(`week: {_eq: ${params.week}}`);
    }
    if (params.conference) {
      whereClause.push(`conference: {_eq: "${params.conference}"}`);
    }

    const query = `
      query GetGameAggregate {
        gameAggregate(
          where: {${whereClause.join(', ')}}
        ) {
          nodes {
            id
            season: year
            week
            seasonType
            startDate
            completed
            neutralSite
            conferenceGame
            homeId
            homeTeam
            homePoints
            awayId
            awayTeam
            awayPoints
            venue
            spread
            overUnder
            favoriteId
          }
        }
      }
    `;

    return this.query<GameAggregateResult>(query);
  }

  getCurrentTeams(params?: { conference?: string }): Promise<CurrentTeamsResult> {
    const whereClause: string[] = [];
    if (params?.conference) {
      whereClause.push(`conference: {_eq: "${params.conference}"}`);
    }

    const query = `
      query GetCurrentTeams {
        currentTeams(
          where: {${whereClause.length > 0 ? whereClause.join(', ') : ''}}
        ) {
          nodes {
            id
            school
            abbreviation
            conference
            color
            altColor
            logos
          }
        }
      }
    `;

    return this.query<CurrentTeamsResult>(query);
  }

  subscribeToGames(params: {
    season?: number;
    week?: number;
    conference?: string;
    onUpdate: (data: GameSubscriptionResult) => void;
    onError?: (error: Error) => void;
  }): () => void {
    const whereClause: string[] = [];
    if (params.season) {
      whereClause.push(`year: {_eq: ${params.season}}`);
    }
    if (params.week !== undefined) {
      whereClause.push(`week: {_eq: ${params.week}}`);
    }
    if (params.conference) {
      whereClause.push(`conference: {_eq: "${params.conference}"}`);
    }

    const subscription = `
      subscription GameSubscription {
        game(
          where: {${whereClause.length > 0 ? whereClause.join(', ') : ''}}
        ) {
          id
          year
          week
          seasonType
          startDate
          completed
          neutralSite
          conferenceGame
          homeId
          homeTeam
          homePoints
          awayId
          awayTeam
          awayPoints
          venue
          spread
          overUnder
          favoriteId
        }
      }
    `;

    const client = this.getWsClient();
    let unsubscribe: (() => void) | null = null;

    unsubscribe = client.subscribe<GameSubscriptionResult>(
      {
        query: subscription,
      },
      {
        next: (data: { data?: GameSubscriptionResult }) => {
          if (data.data) {
            params.onUpdate(data.data);
          }
        },
        error: (err: unknown) => {
          const error = err instanceof Error ? err : new Error(String(err));
          if (params.onError) {
            params.onError(error);
          }
        },
        complete: () => {},
      }
    );

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }

  dispose(): void {
    if (this.wsClient) {
      void this.wsClient.dispose();
      this.wsClient = null;
    }
  }
}

export const cfbdGraphQLClient = new CFBDGraphQLClient();
