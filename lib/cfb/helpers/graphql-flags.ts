import { getRuntimeConfig } from '@/lib/admin/runtime-config';

const isEnabledInProduction = (value: string | undefined): boolean => value === 'true';

export const graphqlQueriesEnabled = async (): Promise<boolean> => {
  if (process.env.VERCEL_ENV === 'production') {
    return isEnabledInProduction(process.env.CFBD_GRAPHQL_QUERIES);
  }
  const config = await getRuntimeConfig();
  return config.graphqlOn;
};

export const graphqlSubscriptionsEnabled = async (): Promise<boolean> => {
  if (process.env.VERCEL_ENV === 'production') {
    return isEnabledInProduction(process.env.CFBD_GRAPHQL_SUBSCRIPTIONS);
  }
  const config = await getRuntimeConfig();
  return config.graphqlOn;
};
