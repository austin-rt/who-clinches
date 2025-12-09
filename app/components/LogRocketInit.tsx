'use client';

import { useEffect } from 'react';
import LogRocket from 'logrocket';

const LogRocketInit = () => {
  useEffect(() => {
    if (process.env.NODE_ENV === 'production') {
      LogRocket.init('z1ekqu/who-clinches');
    }
  }, []);

  return null;
};

export default LogRocketInit;
