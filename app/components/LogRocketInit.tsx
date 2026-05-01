'use client';

import { useEffect } from 'react';
import LogRocket from 'logrocket';

const LogRocketInit = () => {
  useEffect(() => {
    if (process.env.NEXT_PUBLIC_VERCEL_ENV === 'production') {
      LogRocket.init('z1ekqu/who-clinches');
    }
  }, []);

  return null;
};

export default LogRocketInit;
