'use client';

import { useEffect, useRef, useCallback } from 'react';
import Script from 'next/script';
import { useAppSelector } from '@/app/store/hooks';

declare global {
  interface Window {
    hj?: (method: string, ...args: unknown[]) => void;
  }
}

const HotjarInit = () => {
  const anonymousId = useAppSelector((s) => s.app.anonymousId);
  const sessionRecordingURL = useAppSelector((s) => s.app.sessionRecordingURL);
  const scriptLoaded = useRef(false);

  const identify = useCallback(() => {
    if (!window.hj) return;
    window.hj('identify', anonymousId, {
      sessionRecordingURL: sessionRecordingURL ?? '',
    });
  }, [anonymousId, sessionRecordingURL]);

  useEffect(() => {
    if (scriptLoaded.current) identify();
  }, [identify]);

  return (
    <Script
      src="https://t.contentsquare.net/uxa/f80d849c7db5f.js"
      strategy="afterInteractive"
      onReady={() => {
        scriptLoaded.current = true;
        identify();
      }}
    />
  );
};

export default HotjarInit;
