'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '@/app/store/hooks';
import {
  setSessions as setReduxSessions,
  setActiveSessionIndex as setReduxActiveIndex,
  addToHistory,
  removeFromHistory,
  pruneExpiredSessions,
} from '@/app/store/chatSlice';
import { type ChatMessage, type ChatSession, MAX_SESSIONS } from '../ChatDrawer';

const makeSession = (label: string, conf?: string): ChatSession => ({
  id: crypto.randomUUID(),
  messages: [],
  label,
  conf,
  lastActiveAt: Date.now(),
});

const deriveLabel = (messages: ChatMessage[]): string => {
  const first = messages.find((m) => m.role === 'user');
  if (!first) return 'New chat';
  const text = first.content.trim();
  return text.length > 24 ? text.slice(0, 24) + '...' : text;
};

export const useChatSessions = (conferenceHint?: string) => {
  const dispatch = useAppDispatch();
  const persistedSessions = useAppSelector((s) => s.chat.sessions);
  const persistedActiveIndex = useAppSelector((s) => s.chat.activeSessionIndex);
  const history = useAppSelector((s) => s.chat.history ?? []);

  const [sessions, setSessions] = useState<ChatSession[]>(() =>
    persistedSessions.length > 0 ? persistedSessions : [makeSession('New chat', conferenceHint)]
  );
  const [activeIndex, setActiveIndex] = useState(() => {
    if (conferenceHint) {
      const confIdx = (persistedSessions.length > 0 ? persistedSessions : []).findIndex(
        (s) => s.conf === conferenceHint
      );
      if (confIdx !== -1) return confIdx;
    }
    return persistedActiveIndex;
  });
  const [input, setInput] = useState('');
  const [historyOpen, setHistoryOpen] = useState(false);

  const activeSession = sessions[activeIndex];
  const messages = useMemo(() => activeSession?.messages ?? [], [activeSession]);
  const sessionId = activeSession?.id ?? '';

  const setMessages = useCallback(
    (updater: ChatMessage[] | ((prev: ChatMessage[]) => ChatMessage[])) => {
      setSessions((prev) =>
        prev.map((s) => {
          if (s.id !== sessionId) return s;
          const newMessages = typeof updater === 'function' ? updater(s.messages) : updater;
          return {
            ...s,
            messages: newMessages,
            label: deriveLabel(newMessages) || s.label,
            conf: s.conf || conferenceHint,
            lastActiveAt: Date.now(),
          };
        })
      );
    },
    [sessionId, conferenceHint]
  );

  useEffect(() => {
    dispatch(pruneExpiredSessions());
  }, [dispatch]);

  const [prevConferenceHint, setPrevConferenceHint] = useState(conferenceHint);
  if (conferenceHint && conferenceHint !== prevConferenceHint) {
    setPrevConferenceHint(conferenceHint);
    const existingIdx = sessions.findIndex((s) => s.conf === conferenceHint);
    if (existingIdx !== -1) {
      setActiveIndex(existingIdx);
    } else {
      setSessions([...sessions, makeSession('New chat', conferenceHint)]);
      setActiveIndex(sessions.length);
    }
  }

  useEffect(() => {
    const nonEmpty = sessions.filter((s) => s.messages.length > 0);
    if (nonEmpty.length > 0) {
      dispatch(setReduxSessions(nonEmpty));
      dispatch(setReduxActiveIndex(activeIndex));
    } else {
      dispatch(setReduxSessions([]));
      dispatch(setReduxActiveIndex(0));
    }
  }, [sessions, activeIndex, dispatch]);

  useEffect(() => {
    if (!historyOpen) return;
    const close = () => setHistoryOpen(false);
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, [historyOpen]);

  const handleNewChat = useCallback(
    (isStreaming: boolean) => {
      if (isStreaming) return;
      if (sessions.length >= MAX_SESSIONS) {
        setSessions((prev) => {
          const updated = [...prev.slice(1), makeSession('New chat', conferenceHint)];
          return updated;
        });
        setActiveIndex(sessions.length - 1);
      } else {
        setSessions((prev) => [...prev, makeSession('New chat', conferenceHint)]);
        setActiveIndex(sessions.length);
      }
      setInput('');
    },
    [sessions.length, conferenceHint]
  );

  const handleSwitchSession = useCallback(
    (index: number, isStreaming: boolean) => {
      if (isStreaming || index === activeIndex) return;
      setActiveIndex(index);
      setInput('');
    },
    [activeIndex]
  );

  const handleCloseSession = useCallback(
    (index: number, isStreaming: boolean) => {
      if (isStreaming) return;
      const session = sessions[index];
      if (session && session.messages.length > 0) {
        dispatch(addToHistory(session));
      }
      if (sessions.length === 1) {
        setSessions([makeSession('New chat', conferenceHint)]);
        setActiveIndex(0);
        setInput('');
        return;
      }
      setSessions((prev) => prev.filter((_, i) => i !== index));
      if (index < activeIndex) {
        setActiveIndex(activeIndex - 1);
      } else if (index === activeIndex) {
        setActiveIndex(Math.min(index, sessions.length - 2));
      }
      setInput('');
    },
    [sessions, activeIndex, conferenceHint, dispatch]
  );

  const handleRestoreFromHistory = useCallback(
    (id: string, isStreaming: boolean) => {
      if (isStreaming) return;
      const restored = history.find((s) => s.id === id);
      if (!restored) return;
      dispatch(removeFromHistory(id));
      setSessions((prev) => {
        const withTimestamp = { ...restored, lastActiveAt: Date.now() };
        if (prev.length >= MAX_SESSIONS) {
          const evicted = prev[0];
          if (evicted.messages.length > 0) dispatch(addToHistory(evicted));
          const updated = [...prev.slice(1), withTimestamp];
          setActiveIndex(updated.length - 1);
          return updated;
        }
        setActiveIndex(prev.length);
        return [...prev, withTimestamp];
      });
      setHistoryOpen(false);
      setInput('');
    },
    [history, dispatch]
  );

  const forceNewChatRef = useRef(false);
  const [newChatReady, setNewChatReady] = useState(false);

  const prepareForceNewChat = useCallback(
    (open: boolean, forceNewChat: boolean) => {
      if (open && forceNewChat && !newChatReady) {
        setSessions((prev) => {
          if (prev.length >= MAX_SESSIONS) {
            const updated = [...prev.slice(1), makeSession('New chat', conferenceHint)];
            setActiveIndex(updated.length - 1);
            return updated;
          }
          setActiveIndex(prev.length);
          return [...prev, makeSession('New chat', conferenceHint)];
        });
        setInput('');
        setNewChatReady(true);
      }
      if (!open) {
        setNewChatReady(false);
        forceNewChatRef.current = false;
      }
    },
    [conferenceHint, newChatReady]
  );

  return {
    sessions,
    activeIndex,
    messages,
    sessionId,
    input,
    setInput,
    setMessages,
    history,
    historyOpen,
    setHistoryOpen,
    newChatReady,
    handleNewChat,
    handleSwitchSession,
    handleCloseSession,
    handleRestoreFromHistory,
    prepareForceNewChat,
  };
};
