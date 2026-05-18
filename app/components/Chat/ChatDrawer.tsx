'use client';

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { HiXMark, HiPlus } from 'react-icons/hi2';
import { IoSendOutline } from 'react-icons/io5';
import { useAppDispatch, useAppSelector } from '@/app/store/hooks';
import {
  setSessions as setReduxSessions,
  setActiveSessionIndex as setReduxActiveIndex,
} from '@/app/store/chatSlice';
import type { CFBConferenceAbbreviation } from '@/lib/cfb/constants';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  pending?: boolean;
}

interface ChatSession {
  id: string;
  messages: ChatMessage[];
  label: string;
}

const MAX_SESSIONS = 3;

interface ChatDrawerProps {
  open: boolean;
  onClose: () => void;
  conferenceHint?: CFBConferenceAbbreviation;
  teamId?: string;
  initialMessage?: string | null;
  onInitialMessageSent?: () => void;
  onMessageSent?: () => void;
}

const TypingIndicator = () => (
  <div className="chat chat-start">
    <div className="chat-bubble-received flex items-center justify-center gap-1.5 py-3">
      <span className="block h-2 w-2 shrink-0 animate-[typing-pulse_1.4s_ease-in-out_infinite] rounded-full bg-base-content" />
      <span className="block h-2 w-2 shrink-0 animate-[typing-pulse_1.4s_ease-in-out_infinite_0.2s] rounded-full bg-base-content" />
      <span className="block h-2 w-2 shrink-0 animate-[typing-pulse_1.4s_ease-in-out_infinite_0.4s] rounded-full bg-base-content" />
    </div>
  </div>
);

const TYPING_SHOW_DELAY_MIN = 300;
const TYPING_SHOW_DELAY_MAX = 500;
const TYPING_MIN_VISIBLE = 1500;

const makeSession = (label: string): ChatSession => ({
  id: crypto.randomUUID(),
  messages: [],
  label,
});

const deriveLabel = (messages: ChatMessage[]): string => {
  const first = messages.find((m) => m.role === 'user');
  if (!first) return 'New chat';
  const text = first.content.trim();
  return text.length > 24 ? text.slice(0, 24) + '...' : text;
};

const ChatDrawer = ({
  open,
  onClose,
  conferenceHint,
  teamId,
  initialMessage,
  onInitialMessageSent,
  onMessageSent,
}: ChatDrawerProps) => {
  const dispatch = useAppDispatch();
  const persistedSessions = useAppSelector((s) => s.chat.sessions);
  const persistedActiveIndex = useAppSelector((s) => s.chat.activeSessionIndex);

  const [visible, setVisible] = useState(false);
  const [sessions, setSessions] = useState<ChatSession[]>(() =>
    persistedSessions.length > 0 ? persistedSessions : [makeSession('New chat')]
  );
  const [activeIndex, setActiveIndex] = useState(persistedActiveIndex);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [showTyping, setShowTyping] = useState(false);
  const [retryAfter, setRetryAfter] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const drawerRef = useRef<HTMLDivElement>(null);
  const pendingRef = useRef<string[]>([]);

  const activeSession = sessions[activeIndex];
  const messages = useMemo(() => activeSession?.messages ?? [], [activeSession]);
  const sessionId = activeSession?.id ?? '';

  const setMessages = useCallback(
    (updater: ChatMessage[] | ((prev: ChatMessage[]) => ChatMessage[])) => {
      setSessions((prev) =>
        prev.map((s, i) => {
          if (i !== activeIndex) return s;
          const newMessages = typeof updater === 'function' ? updater(s.messages) : updater;
          return { ...s, messages: newMessages, label: deriveLabel(newMessages) || s.label };
        })
      );
    },
    [activeIndex]
  );

  useEffect(() => {
    const nonEmpty = sessions.filter((s) => s.messages.length > 0);
    if (nonEmpty.length > 0) {
      dispatch(setReduxSessions(nonEmpty));
      dispatch(setReduxActiveIndex(activeIndex));
    }
  }, [sessions, activeIndex, dispatch]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, showTyping, scrollToBottom]);

  const initialMessageSentRef = useRef(false);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setVisible(true);
          setTimeout(() => inputRef.current?.focus(), 100);
        });
      });
    } else {
      document.body.style.overflow = '';
      setVisible(false);
      if (abortRef.current) abortRef.current.abort();
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [open, onClose]);

  useEffect(() => {
    if (!visible) return;
    const drawer = drawerRef.current;
    if (!drawer) return;
    const focusable = drawer.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    if (focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const trap = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    drawer.addEventListener('keydown', trap);
    return () => drawer.removeEventListener('keydown', trap);
  }, [visible]);

  const sendMessage = useCallback(
    async (text: string, opts?: { skipBubble?: boolean }) => {
      if (!opts?.skipBubble) {
        setMessages((prev) => [...prev, { id: `user-${Date.now()}`, role: 'user', content: text }]);
      }
      setInput('');
      if (inputRef.current) inputRef.current.style.height = 'auto';
      setIsStreaming(true);
      onMessageSent?.();

      const typingDelay =
        TYPING_SHOW_DELAY_MIN + Math.random() * (TYPING_SHOW_DELAY_MAX - TYPING_SHOW_DELAY_MIN);
      const typingTimer = setTimeout(() => setShowTyping(true), typingDelay);
      const typingShownAt = Date.now() + typingDelay;

      let assistantId = `assistant-${Date.now()}`;

      const doFetch = async (): Promise<void> => {
        const controller = new AbortController();
        abortRef.current = controller;

        const history = messages.map((m) => ({ role: m.role, content: m.content }));

        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: text,
            history,
            conferenceHint,
            teamId,
            sessionId,
          }),
          signal: controller.signal,
        });

        if (res.status === 429) {
          const retrySeconds = parseInt(res.headers.get('Retry-After') ?? '60', 10);
          setRetryAfter(retrySeconds);
          await new Promise((r) => setTimeout(r, retrySeconds * 1000));
          setRetryAfter(null);
          return doFetch();
        }

        if (!res.ok) {
          const body = await res.json().catch(() => ({ error: 'Something went wrong' }));
          throw new Error(body.error ?? 'Something went wrong');
        }

        const now = Date.now();
        const elapsed = now - typingShownAt;
        if (elapsed < TYPING_MIN_VISIBLE && elapsed > 0) {
          await new Promise((r) => setTimeout(r, TYPING_MIN_VISIBLE - elapsed));
        }
        clearTimeout(typingTimer);
        setShowTyping(false);

        setMessages((prev) => [...prev, { id: assistantId, role: 'assistant', content: '' }]);

        const reader = res.body?.getReader();
        if (!reader) throw new Error('No response stream');

        const decoder = new TextDecoder();
        let buffer = '';
        let needsNewBubble = false;
        let breakShownAt = 0;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n\n');
          buffer = lines.pop() ?? '';

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            const data = JSON.parse(line.slice(6));

            if (data.type === 'delta') {
              if (needsNewBubble) {
                const dotsElapsed = Date.now() - breakShownAt;
                if (dotsElapsed < TYPING_MIN_VISIBLE) {
                  await new Promise((r) => setTimeout(r, TYPING_MIN_VISIBLE - dotsElapsed));
                }
                needsNewBubble = false;
                setShowTyping(false);
                assistantId = `assistant-${Date.now()}`;
                setMessages((prev) => [
                  ...prev,
                  { id: assistantId, role: 'assistant', content: data.text },
                ]);
              } else {
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantId ? { ...m, content: m.content + data.text } : m
                  )
                );
              }
            } else if (data.type === 'break') {
              needsNewBubble = true;
              breakShownAt = Date.now();
              setShowTyping(true);
            } else if (data.type === 'error') {
              throw new Error(data.error);
            }
          }
        }
      };

      try {
        await doFetch();
      } catch (err) {
        clearTimeout(typingTimer);
        setShowTyping(false);
        if ((err as Error).name !== 'AbortError') {
          setMessages((prev) => [
            ...prev,
            {
              id: `error-${Date.now()}`,
              role: 'assistant',
              content: 'Sorry, something went wrong. Try again.',
            },
          ]);
        }
      } finally {
        setIsStreaming(false);
        abortRef.current = null;
        const queued = pendingRef.current;
        if (queued.length > 0) {
          pendingRef.current = [];
          const combined = queued.join('\n');
          setMessages((prev) => prev.map((m) => (m.pending ? { ...m, pending: false } : m)));
          void sendMessage(combined, { skipBubble: true });
        }
      }
    },
    [messages, conferenceHint, teamId, sessionId, onMessageSent, setMessages]
  );

  useEffect(() => {
    if (open && initialMessage && !initialMessageSentRef.current && !isStreaming) {
      initialMessageSentRef.current = true;
      void sendMessage(initialMessage);
      onInitialMessageSent?.();
    }
    if (!open) {
      initialMessageSentRef.current = false;
    }
  }, [open, initialMessage, isStreaming, onInitialMessageSent, sendMessage]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text) return;
    if (isStreaming) {
      pendingRef.current.push(text);
      setMessages((prev) => [
        ...prev,
        { id: `pending-${Date.now()}`, role: 'user', content: text, pending: true },
      ]);
      setInput('');
      return;
    }
    void sendMessage(text);
  };

  const handleNewChat = () => {
    if (isStreaming) return;
    if (sessions.length >= MAX_SESSIONS) {
      setSessions((prev) => {
        const updated = [...prev.slice(1), makeSession('New chat')];
        return updated;
      });
      setActiveIndex(sessions.length - 1);
    } else {
      setSessions((prev) => [...prev, makeSession('New chat')]);
      setActiveIndex(sessions.length);
    }
    setInput('');
  };

  const handleSwitchSession = (index: number) => {
    if (isStreaming || index === activeIndex) return;
    setActiveIndex(index);
    setInput('');
  };

  const handleCloseSession = (index: number) => {
    if (isStreaming) return;
    if (sessions.length === 1) {
      setSessions([makeSession('New chat')]);
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
  };

  const showTabs = sessions.length > 1 || messages.length > 0;

  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-black/50 transition-opacity duration-300 ${
          visible ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        style={{
          visibility: visible ? 'visible' : 'hidden',
          transitionProperty: 'opacity, visibility',
          transitionDelay: visible ? '0ms' : '0ms, 300ms',
        }}
        onClick={onClose}
        role="button"
        tabIndex={-1}
        aria-label="Close chat"
      />

      <div
        ref={drawerRef}
        className={`fixed right-0 top-0 z-50 flex w-full flex-col bg-base-100 shadow-xl transition-transform duration-300 sm:w-96 ${
          visible ? 'translate-x-0' : 'translate-x-full'
        }`}
        style={{
          height: '100dvh',
          overscrollBehavior: 'contain',
          touchAction: 'pan-y',
          visibility: visible ? 'visible' : 'hidden',
          transitionProperty: 'transform, visibility',
          transitionDelay: visible ? '0ms' : '0ms, 300ms',
        }}
        role="dialog"
        aria-label="Chat"
        aria-hidden={!visible}
        inert={!visible ? true : undefined}
      >
        <div className="sticky top-0 z-10 border-b border-base-300 bg-base-100">
          <div className="flex items-center px-4 pb-1 pt-3">
            <div className="flex-1" />
            <p className="text-base-content/50 text-[10px]">
              Experimental — results may be inaccurate.{' '}
              <a
                href={`/feedback?session=${sessionId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-base-content/70 underline"
              >
                Report an issue
              </a>
            </p>
            <div className="flex flex-1 justify-end">
              <button
                onClick={onClose}
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-base-content transition-colors hover:bg-base-300"
                aria-label="Close"
              >
                <HiXMark className="h-5 w-5" />
              </button>
            </div>
          </div>
          {showTabs && (
            <div className="flex items-center gap-1 px-4 pb-2">
              {sessions.map((session, i) => (
                <div
                  key={session.id}
                  className={`group flex max-w-[8rem] items-center rounded-md text-xs transition-colors ${
                    i === activeIndex
                      ? 'bg-base-300 font-medium text-base-content'
                      : 'text-base-content/50 hover:text-base-content'
                  }`}
                >
                  <button
                    onClick={() => handleSwitchSession(i)}
                    className="min-w-0 truncate py-1 pl-2 pr-1"
                  >
                    {session.label}
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCloseSession(i);
                    }}
                    className="hover:bg-base-content/10 flex h-4 w-4 shrink-0 items-center justify-center rounded opacity-0 transition-opacity group-hover:opacity-100"
                    aria-label={`Close ${session.label}`}
                  >
                    <HiXMark className="h-3 w-3" />
                  </button>
                </div>
              ))}
              {sessions.length < MAX_SESSIONS && (
                <button
                  onClick={handleNewChat}
                  className="text-base-content/50 flex h-6 w-6 shrink-0 items-center justify-center rounded-md transition-colors hover:bg-base-300 hover:text-base-content"
                  aria-label="New chat"
                >
                  <HiPlus className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4">
          {messages.length === 0 && !showTyping && (
            <div className="flex h-full items-center justify-center">
              <p className="text-base-content/50 text-center text-sm">
                Ask about any team&apos;s path to the conference championship
              </p>
            </div>
          )}

          {messages.map((msg) => (
            <div key={msg.id} className={`chat ${msg.role === 'user' ? 'chat-end' : 'chat-start'}`}>
              <div
                className={`${msg.role === 'user' ? 'chat-bubble-sent' : 'chat-bubble-received'}${msg.pending ? 'opacity-50' : ''}`}
              >
                {msg.content}
              </div>
            </div>
          ))}

          {showTyping && <TypingIndicator />}

          {retryAfter !== null && (
            <div className="text-base-content/50 py-2 text-center text-xs">
              Waiting {retryAfter}s before retrying...
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex items-stretch border-t border-base-300 px-4 py-3"
        >
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              e.target.style.height = 'auto';
              e.target.style.height = `${e.target.scrollHeight}px`;
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
            maxLength={500}
            rows={1}
            className="chat-input"
          />
          <button type="submit" className="chat-send-btn" aria-label="Send">
            <IoSendOutline className="h-4 w-4 -rotate-45" />
          </button>
        </form>
      </div>
    </>
  );
};

export default ChatDrawer;
