export const isAdminAllowed = (): boolean => {
  return process.env.VERCEL_ENV !== 'production';
};

export const getEnvironmentLabel = (): 'local' | 'preview' | 'production' => {
  const vercelEnv = process.env.VERCEL_ENV;
  if (vercelEnv === 'preview') return 'preview';
  if (vercelEnv === 'production') return 'production';
  return 'local';
};
