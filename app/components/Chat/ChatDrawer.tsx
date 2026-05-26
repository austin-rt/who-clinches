'use client';

import { useRef, useEffect, useCallback } from 'react';
import ChatHeader from './ChatHeader';
import ChatMessageList from './ChatMessageList';
import ChatFooter from './ChatFooter';
import ChatInput from './ChatInput';
import { useChatSessions } from './hooks/useChatSessions';
import { useChatStream } from './hooks/useChatStream';
import { useChatAuth } from './hooks/useChatAuth';
import { useDrawerBehavior } from './hooks/useDrawerBehavior';
import { useCountdown } from './hooks/useCountdown';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  pending?: boolean;
}

export interface ChatSession {
  id: string;
  messages: ChatMessage[];
  conf?: string;
  label: string;
  lastActiveAt?: number;
}

export const MAX_SESSIONS = 5;

interface ChatDrawerProps {
  open: boolean;
  onClose: () => void;
  conferenceHint?: string;
  teamId?: string;
  initialMessage?: string | null;
  onInitialMessageSent?: () => void;
  onMessageSent?: () => void;
  forceNewChat?: boolean;
}

const ChatDrawer = ({
  open,
  onClose,
  conferenceHint,
  teamId,
  initialMessage,
  onInitialMessageSent,
  onMessageSent,
  forceNewChat,
}: ChatDrawerProps) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const tabsRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const initialMessageSentRef = useRef(false);

  const {
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
  } = useChatSessions(conferenceHint);

  const {
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
  } = useChatStream({
    messages,
    setMessages,
    conferenceHint,
    teamId,
    sessionId,
    onMessageSent,
  });

  const {
    email,
    usage,
    authEmail,
    setAuthEmail,
    authSending,
    authSent,
    devVerifyUrl,
    authToast,
    handleSendMagicLink,
  } = useChatAuth();

  const { visible, drawerRef } = useDrawerBehavior(open, onClose, inputRef, abortRef);

  const resetsAt = windowResetsAt ?? usage?.windowResetsAt ?? null;
  const countdown = useCountdown(resetsAt, clearWindowReset);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, showTyping]);

  useEffect(() => {
    prepareForceNewChat(open, !!forceNewChat);
    if (!open) initialMessageSentRef.current = false;
  }, [open, forceNewChat, prepareForceNewChat]);

  useEffect(() => {
    if (!open || !initialMessage || initialMessageSentRef.current || isStreaming) return;
    if (forceNewChat && !newChatReady) return;
    if (forceNewChat && messages.length > 0) return;
    initialMessageSentRef.current = true;
    void sendMessage(initialMessage);
    onInitialMessageSent?.();
  }, [
    open,
    initialMessage,
    isStreaming,
    forceNewChat,
    newChatReady,
    messages.length,
    onInitialMessageSent,
    sendMessage,
  ]);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
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
      setInput('');
      if (inputRef.current) inputRef.current.style.height = 'auto';
      void sendMessage(text);
    },
    [input, isStreaming, pendingRef, setMessages, setInput, sendMessage]
  );

  const inputDisabled = !!windowResetsAt || providerLimit;

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
        data-testid="chat-backdrop"
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
        data-testid="chat-drawer"
      >
        <ChatHeader
          sessionId={sessionId}
          sessions={sessions}
          activeIndex={activeIndex}
          isStreaming={isStreaming}
          history={history}
          historyOpen={historyOpen}
          tabsRef={tabsRef}
          onClose={onClose}
          onSwitchSession={(i) => handleSwitchSession(i, isStreaming)}
          onCloseSession={(i) => handleCloseSession(i, isStreaming)}
          onNewChat={() => handleNewChat(isStreaming)}
          onRestoreFromHistory={(id) => handleRestoreFromHistory(id, isStreaming)}
          onToggleHistory={setHistoryOpen}
        />

        <ChatMessageList
          messages={messages}
          showTyping={showTyping}
          retryAfter={retryAfter}
          messagesEndRef={messagesEndRef}
        />

        <ChatFooter
          authToast={authToast}
          providerLimit={providerLimit}
          windowResetsAt={windowResetsAt}
          countdown={countdown}
          email={email}
          authEmail={authEmail}
          authSending={authSending}
          authSent={authSent}
          devVerifyUrl={devVerifyUrl}
          isMaintainer={isMaintainer}
          usage={usage}
          onAuthEmailChange={setAuthEmail}
          onSendMagicLink={handleSendMagicLink}
        />

        <ChatInput
          input={input}
          isStreaming={isStreaming}
          disabled={inputDisabled}
          inputRef={inputRef}
          onInputChange={setInput}
          onSubmit={handleSubmit}
          onAbort={() => abortRef.current?.abort()}
        />
      </div>
    </>
  );
};

export default ChatDrawer;
