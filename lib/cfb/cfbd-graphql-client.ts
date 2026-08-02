import { fetchWithTimeout } from '../fetch-with-timeout';
import { createClient, Client } from 'graphql-ws';
import { logError } from '../errorLogger';
import { getActiveApiKey } from './cfbd-rest-client';
import { CONFERENCE_GAMES, CONFERENCE_TEAMS, GAME_UPDATES } from './graphql/documents';
import { buildGameWhere, buildTeamWhere, type GameFilter } from './graphql/where';
import type { GqlGameNode, GqlTeamNode } from './graphql/map-to-cfbd';

const REQUEST_TIMEOUT_MS = 30000;
export const GRAPHQL_ENDPOINT = 'https://graphql.collegefootballdata.com/v1/graphql';
export const GRAPHQL_WS_ENDPOINT = 'wss://graphql.collegefootballdata.com/v1/graphql';

export const MAX_GAMES = 2000;
export const MAX_TEAMS = 500;

const getAuthHeaders = () => {
  const apiKey = getActiveApiKey();
  if (!apiKey) {
    const error = new Error('No CFBD API key configured');
    void logError(error, { action: 'get-auth-headers' });
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

export class CFBDGraphQLClient {
  private wsClient: Client | null = null;

  private getWsClient(): Client {
    if (!this.wsClient) {
      const apiKey = getActiveApiKey();
      if (!apiKey) {
        const error = new Error('No CFBD API key configured');
        void logError(error, { action: 'get-ws-client' });
        throw error;
      }

      this.wsClient = createClient({
        url: GRAPHQL_WS_ENDPOINT,
        connectionParams: {
          headers: { Authorization: `Bearer ${apiKey}` },
        },
      });
    }
    return this.wsClient;
  }

  private async query<T>(query: string, variables: Record<string, unknown>): Promise<T> {
    const response = await fetchWithTimeout(
      GRAPHQL_ENDPOINT,
      {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ query, variables }),
      },
      REQUEST_TIMEOUT_MS
    );

    if (!response.ok) {
      const error = new Error(
        `CFBD GraphQL ${response.status} ${response.statusText} from ${GRAPHQL_ENDPOINT}`
      );
      await logError(error, { action: 'graphql-query', status: response.status });
      throw error;
    }

    const result: GraphQLResponse<T> = await response.json();

    if (result.errors && result.errors.length > 0) {
      const error = new Error(
        `CFBD GraphQL errors: ${result.errors.map((e) => e.message).join(', ')}`
      );
      await logError(error, { action: 'graphql-query', errors: result.errors });
      throw error;
    }

    if (!result.data) {
      const error = new Error('CFBD GraphQL response missing data');
      await logError(error, { action: 'graphql-query' });
      throw error;
    }

    return result.data;
  }

  async getConferenceGames(filter: GameFilter): Promise<GqlGameNode[]> {
    const result = await this.query<{ game: GqlGameNode[] }>(CONFERENCE_GAMES, {
      where: buildGameWhere(filter),
      limit: MAX_GAMES,
    });
    return result.game;
  }

  async getConferenceTeams(
    season: number,
    filter: { conference?: string; classification?: string } = {}
  ): Promise<GqlTeamNode[]> {
    const result = await this.query<{ historicalTeam: GqlTeamNode[] }>(CONFERENCE_TEAMS, {
      where: buildTeamWhere(season, filter),
      limit: MAX_TEAMS,
    });
    return result.historicalTeam;
  }

  subscribeToGames(params: {
    filter: GameFilter;
    onUpdate: (games: GqlGameNode[]) => void;
    onError?: (error: Error) => void;
  }): () => void {
    const client = this.getWsClient();

    const unsubscribe = client.subscribe<{ game: GqlGameNode[] }>(
      {
        query: GAME_UPDATES,
        variables: { where: buildGameWhere(params.filter) },
      },
      {
        next: (data) => {
          if (data.data?.game) {
            params.onUpdate(data.data.game);
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
      unsubscribe();
    };
  }
}

export const cfbdGraphQLClient = new CFBDGraphQLClient();
