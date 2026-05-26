'use client';

import { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/app/store/hooks';
import { setEmail as setReduxEmail } from '@/app/store/chatSlice';

export const useChatAuth = () => {
  const dispatch = useAppDispatch();
  const email = useAppSelector((s) => s.chat.email);
  const usage = useAppSelector((s) => s.chat.usage);

  const [authEmail, setAuthEmail] = useState('');
  const [authSending, setAuthSending] = useState(false);
  const [authSent, setAuthSent] = useState(false);
  const [devVerifyUrl, setDevVerifyUrl] = useState<string | null>(null);
  const [authToast, setAuthToast] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const auth = params.get('auth');
    if (auth === 'success') {
      const credited = params.get('credited');
      setAuthToast(credited ? `Verified! ${credited} credits added.` : 'Email verified!');
      setTimeout(() => setAuthToast(null), 5000);
      params.delete('auth');
      params.delete('credited');
      const clean = params.toString();
      window.history.replaceState({}, '', `${window.location.pathname}${clean ? `?${clean}` : ''}`);
    }
  }, []);

  const handleSendMagicLink = async () => {
    if (!authEmail || authSending) return;
    setAuthSending(true);
    try {
      const res = await fetch('/api/chat/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: authEmail }),
      });
      if (res.ok) {
        const data = await res.json();
        setAuthSent(true);
        dispatch(setReduxEmail(authEmail.toLowerCase().trim()));
        if (data.verifyUrl) {
          setDevVerifyUrl(data.verifyUrl);
        }
      }
    } catch {
      // ignore
    } finally {
      setAuthSending(false);
    }
  };

  return {
    email,
    usage,
    authEmail,
    setAuthEmail,
    authSending,
    authSent,
    devVerifyUrl,
    authToast,
    handleSendMagicLink,
  };
};
