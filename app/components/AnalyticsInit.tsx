'use client';

import LogRocketInit from './LogRocketInit';
import HotjarInit from './HotjarInit';

const isAnalyticsEnabled =
  typeof window !== 'undefined' &&
  process.env.NEXT_PUBLIC_VERCEL_ENV === 'production' &&
  navigator.webdriver !== true;

const AnalyticsInit = () => {
  if (!isAnalyticsEnabled) return null;

  return (
    <>
      <LogRocketInit />
      <HotjarInit />
    </>
  );
};

export default AnalyticsInit;
