'use client';

import { useState, useRef, useEffect } from 'react';
import { HiUser } from 'react-icons/hi2';
import { useAppDispatch, useAppSelector } from '@/app/store/hooks';
import { setEmail as setReduxEmail } from '@/app/store/chatSlice';

const UserMenu = ({ isNonProd }: { isNonProd: boolean }) => {
  const dispatch = useAppDispatch();
  const email = useAppSelector((s) => s.chat.email);
  const [open, setOpen] = useState(false);
  const [authEmail, setAuthEmail] = useState('');
  const [authSending, setAuthSending] = useState(false);
  const [authSent, setAuthSent] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  const handleSendLink = async () => {
    if (!authEmail || authSending) return;
    setAuthSending(true);
    try {
      const res = await fetch('/api/chat/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: authEmail }),
      });
      if (res.ok) {
        setAuthSent(true);
        dispatch(setReduxEmail(authEmail.toLowerCase().trim()));
      }
    } catch {
      // ignore
    } finally {
      setAuthSending(false);
    }
  };

  const handleSignOut = async () => {
    await fetch('/api/chat/auth', { method: 'DELETE' });
    dispatch(setReduxEmail(null));
    setOpen(false);
    setAuthSent(false);
    setAuthEmail('');
  };

  if (email) {
    return (
      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setOpen((p) => !p)}
          className={`flex h-8 w-8 items-center justify-center rounded-full transition-colors ${
            isNonProd
              ? 'bg-white/20 text-white hover:bg-white/30'
              : 'hover:bg-base-content/20 bg-base-300 text-base-content'
          }`}
          aria-label="User menu"
        >
          <HiUser className="h-4 w-4" />
        </button>
        {open && (
          <div className="absolute right-0 top-full z-50 mt-2 w-56 rounded-lg border border-base-300 bg-base-100 py-2 shadow-lg">
            <p className="text-base-content/50 truncate px-3 py-1 text-xs">{email}</p>
            <div className="my-1 border-t border-base-300" />
            <button
              onClick={() => void handleSignOut()}
              className="w-full px-3 py-1.5 text-left text-sm text-base-content hover:bg-base-200"
            >
              Sign out
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setOpen((p) => !p)}
        className={`flex h-8 w-8 items-center justify-center rounded-full transition-colors ${
          isNonProd
            ? 'bg-white/20 text-white hover:bg-white/30'
            : 'text-base-content/50 hover:bg-base-content/20 bg-base-300'
        }`}
        aria-label="Sign in"
      >
        <HiUser className="h-4 w-4" />
      </button>
      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-64 rounded-lg border border-base-300 bg-base-100 p-3 shadow-lg">
          {authSent ? (
            <p className="text-center text-xs text-success">Check your email for a sign-in link.</p>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void handleSendLink();
              }}
              className="flex items-stretch"
            >
              <input
                type="email"
                value={authEmail}
                onChange={(e) => setAuthEmail(e.target.value)}
                placeholder="Sign in with email"
                className="min-w-0 flex-1 rounded-l-md border border-r-0 border-base-300 bg-base-100 px-3 py-1.5 text-sm outline-none focus:border-primary"
              />
              <button
                type="submit"
                disabled={authSending || !authEmail}
                className="btn btn-primary btn-sm whitespace-nowrap rounded-l-none rounded-r-md"
              >
                {authSending ? '...' : 'Sign in'}
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
};

export default UserMenu;
