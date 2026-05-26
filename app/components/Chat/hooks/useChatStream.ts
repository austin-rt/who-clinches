'use client';

import { useState, useCallback, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '@/app/store/hooks';
import { setUsage as setReduxUsage } from '@/app/store/chatSlice';
import { type ChatMessage } from '../ChatDrawer';

interface UseChatStreamOptions {
  messages: ChatMessage[];
  setMessages: (updater: ChatMessage[] | ((prev: ChatMessage[]) => ChatMessage[])) => void;
  conferenceHint?: string;
  teamId?: string;
  sessionId: string;
  onMessageSent?: () => void;
}

export const useChatStream = ({
  messages,
  setMessages,
  conferenceHint,
  teamId,
  sessionId,
  onMessageSent,
}: UseChatStreamOptions) => {
  const dispatch = useAppDispatch();
  const appSeason = useAppSelector((s) => s.app.season);

  const [isStreaming, setIsStreaming] = useState(false);
  const [showTyping, setShowTyping] = useState(false);
  const [retryAfter, setRetryAfter] = useState<number | null>(null);
  const [windowResetsAt, setWindowResetsAt] = useState<number | null>(null);
  const [providerLimit, setProviderLimit] = useState(false);
  const [isMaintainer, setIsMaintainer] = useState(false);

  const abortRef = useRef<AbortController | null>(null);
  const pendingRef = useRef<string[]>([]);

  const sendMessage = useCallback(
    async (text: string, opts?: { skipBubble?: boolean }) => {
      if (!opts?.skipBubble) {
        setMessages((prev) => [...prev, { id: `user-${Date.now()}`, role: 'user', content: text }]);
      }
      setIsStreaming(true);
      onMessageSent?.();
      setShowTyping(true);

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
            season: appSeason ?? undefined,
          }),
          signal: controller.signal,
        });

        if (res.status === 503) {
          const body = await res.json().catch(() => ({}));
          if (body.error === 'provider_limit') {
            setProviderLimit(true);
            setShowTyping(false);
            throw new Error('__provider_limit__');
          }
        }

        if (res.status === 429) {
          const body = await res.json().catch(() => ({}));
          if (body.error === 'window_limit') {
            setWindowResetsAt(Date.now() + (body.windowResetsIn ?? 0));
            dispatch(
              setReduxUsage({
                freeRemaining: body.freeRemaining ?? 0,
                creditsRemaining: body.creditsRemaining ?? 0,
                source: null,
              })
            );
            setShowTyping(false);
            throw new Error('__window_limit__');
          }
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

        setShowTyping(false);
        setMessages((prev) => [...prev, { id: assistantId, role: 'assistant', content: '' }]);

        const reader = res.body?.getReader();
        if (!reader) throw new Error('No response stream');

        const decoder = new TextDecoder();
        let buffer = '';
        let needsNewBubble = false;

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
              setShowTyping(true);
            } else if (data.type === 'done') {
              if (data.maintainer) setIsMaintainer(true);
              if (data.usage) {
                const { windowResetsIn, ...rest } = data.usage;
                dispatch(
                  setReduxUsage({
                    ...rest,
                    windowResetsAt: windowResetsIn ? Date.now() + windowResetsIn : undefined,
                  })
                );
              }
            } else if (data.type === 'error') {
              throw new Error(data.error);
            }
          }
        }
      };

      try {
        await doFetch();
      } catch (err) {
        setShowTyping(false);
        const errMsg = (err as Error).message;
        if (
          (err as Error).name !== 'AbortError' &&
          errMsg !== '__window_limit__' &&
          errMsg !== '__provider_limit__'
        ) {
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
    [messages, conferenceHint, teamId, sessionId, appSeason, onMessageSent, setMessages, dispatch]
  );

  const clearWindowReset = useCallback(() => setWindowResetsAt(null), []);

  return {
    isStreaming,
    showTyping,
    retryAfter,
    windowResetsAt,
    providerLimit,
    isMaintainer,
    abortRef,
    pendingRef,
    sendMessage,
    clearWindowReset,
  };
};
