'use client';

import { useEffect } from 'react';
import LogRocket from 'logrocket';
import { useAppSelector, useAppDispatch } from '@/app/store/hooks';
import { setSessionRecordingURL } from '@/app/store/appSlice';

const LogRocketInit = () => {
  const anonymousId = useAppSelector((s) => s.app.anonymousId);
  const dispatch = useAppDispatch();

  useEffect(() => {
    LogRocket.init('z1ekqu/who-clinches');
    LogRocket.identify(anonymousId);
    LogRocket.getSessionURL((url) => {
      dispatch(setSessionRecordingURL(url));
    });
  }, [anonymousId, dispatch]);

  return null;
};

export default LogRocketInit;
