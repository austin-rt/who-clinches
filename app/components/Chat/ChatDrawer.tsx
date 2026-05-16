'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { HiXMark } from 'react-icons/hi2';
import { IoSendOutline } from 'react-icons/io5';
import type { CFBConferenceAbbreviation } from '@/lib/cfb/constants';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  pending?: boolean;
}

interface ChatDrawerProps {
  open: boolean;
  onClose: () => void;
  conferenceHint?: CFBConferenceAbbreviation;
  teamId?: string;
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

const TYPING_SHOW_DELAY_MIN = 400;
const TYPING_SHOW_DELAY_MAX = 900;
const TYPING_MIN_VISIBLE = 600;

const ChatDrawer = ({ open, onClose, conferenceHint, teamId }: ChatDrawerProps) => {
  const [visible, setVisible] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [showTyping, setShowTyping] = useState(false);
  const [retryAfter, setRetryAfter] = useState<number | null>(null);
  const sessionIdRef = useRef<string>(crypto.randomUUID());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const drawerRef = useRef<HTMLDivElement>(null);
  const pendingRef = useRef<string[]>([]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, showTyping, scrollToBottom]);

  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setVisible(true);
          setTimeout(() => inputRef.current?.focus(), 100);
        });
      });
    } else {
      setVisible(false);
      if (abortRef.current) abortRef.current.abort();
    }
  }, [open]);

  const sendMessage = useCallback(
    async (text: string, opts?: { skipBubble?: boolean }) => {
      if (!opts?.skipBubble) {
        setMessages((prev) => [...prev, { id: `user-${Date.now()}`, role: 'user', content: text }]);
      }
      setInput('');
      setIsStreaming(true);

      const typingDelay =
        TYPING_SHOW_DELAY_MIN + Math.random() * (TYPING_SHOW_DELAY_MAX - TYPING_SHOW_DELAY_MIN);
      const typingTimer = setTimeout(() => setShowTyping(true), typingDelay);
      const typingShownAt = Date.now() + typingDelay;

      const assistantId = `assistant-${Date.now()}`;

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
            sessionId: sessionIdRef.current,
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
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantId ? { ...m, content: m.content + data.text } : m
                )
              );
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
    [messages, conferenceHint, teamId]
  );

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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
  };

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
        onKeyDown={handleKeyDown}
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
        <div className="flex items-center justify-end border-b border-base-300 px-4 py-3">
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-base-content transition-colors hover:bg-base-300"
            aria-label="Close"
          >
            <HiXMark className="h-5 w-5" />
          </button>
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
          className="flex items-center border-t border-base-300 px-4 py-3"
        >
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="How does Alabama make it?"
            maxLength={500}
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
