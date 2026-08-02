import {
  graphqlQueriesEnabled,
  graphqlSubscriptionsEnabled,
} from '@/lib/cfb/helpers/graphql-flags';
import { getRuntimeConfig } from '@/lib/admin/runtime-config';

jest.mock('@/lib/admin/runtime-config', () => ({
  getRuntimeConfig: jest.fn(),
}));

const mockGetRuntimeConfig = jest.mocked(getRuntimeConfig);

describe('graphql flags', () => {
  const originalVercelEnv = process.env.VERCEL_ENV;

  beforeEach(() => {
    jest.clearAllMocks();
    delete process.env.CFBD_GRAPHQL_QUERIES;
    delete process.env.CFBD_GRAPHQL_SUBSCRIPTIONS;
  });

  afterEach(() => {
    if (originalVercelEnv === undefined) {
      delete process.env.VERCEL_ENV;
    } else {
      process.env.VERCEL_ENV = originalVercelEnv;
    }
  });

  describe('in production', () => {
    beforeEach(() => {
      process.env.VERCEL_ENV = 'production';
    });

    it('keeps queries off when the env var is unset', async () => {
      await expect(graphqlQueriesEnabled()).resolves.toBe(false);
    });

    it('keeps subscriptions off when the env var is unset', async () => {
      await expect(graphqlSubscriptionsEnabled()).resolves.toBe(false);
    });

    it('enables queries only for the exact string "true"', async () => {
      process.env.CFBD_GRAPHQL_QUERIES = 'true';
      await expect(graphqlQueriesEnabled()).resolves.toBe(true);

      process.env.CFBD_GRAPHQL_QUERIES = '1';
      await expect(graphqlQueriesEnabled()).resolves.toBe(false);
    });

    it('gates queries and subscriptions independently', async () => {
      process.env.CFBD_GRAPHQL_SUBSCRIPTIONS = 'true';

      await expect(graphqlQueriesEnabled()).resolves.toBe(false);
      await expect(graphqlSubscriptionsEnabled()).resolves.toBe(true);
    });

    it('never consults runtime config', async () => {
      process.env.CFBD_GRAPHQL_QUERIES = 'true';

      await graphqlQueriesEnabled();
      await graphqlSubscriptionsEnabled();

      expect(mockGetRuntimeConfig).not.toHaveBeenCalled();
    });
  });

  describe('outside production', () => {
    beforeEach(() => {
      process.env.VERCEL_ENV = 'preview';
    });

    it('defers to runtime config and ignores the production env var', async () => {
      process.env.CFBD_GRAPHQL_QUERIES = 'true';
      mockGetRuntimeConfig.mockResolvedValue({ graphqlOn: false } as Awaited<
        ReturnType<typeof getRuntimeConfig>
      >);

      await expect(graphqlQueriesEnabled()).resolves.toBe(false);
    });

    it('enables both paths when runtime config turns graphql on', async () => {
      mockGetRuntimeConfig.mockResolvedValue({ graphqlOn: true } as Awaited<
        ReturnType<typeof getRuntimeConfig>
      >);

      await expect(graphqlQueriesEnabled()).resolves.toBe(true);
      await expect(graphqlSubscriptionsEnabled()).resolves.toBe(true);
    });
  });
});
