import type { ChatMessage } from './ChatDrawer';

interface ChatMessageListProps {
  messages: ChatMessage[];
  showTyping: boolean;
  retryAfter: number | null;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
}

const TypingIndicator = () => (
  <div className="chat chat-start">
    <div
      className="chat-bubble-received flex items-center justify-center gap-1.5 py-3"
      data-testid="typing-indicator"
    >
      <span className="block h-2 w-2 shrink-0 animate-[typing-pulse_1.4s_ease-in-out_infinite] rounded-full bg-base-content" />
      <span className="block h-2 w-2 shrink-0 animate-[typing-pulse_1.4s_ease-in-out_infinite_0.2s] rounded-full bg-base-content" />
      <span className="block h-2 w-2 shrink-0 animate-[typing-pulse_1.4s_ease-in-out_infinite_0.4s] rounded-full bg-base-content" />
    </div>
  </div>
);

const ChatMessageList = ({
  messages,
  showTyping,
  retryAfter,
  messagesEndRef,
}: ChatMessageListProps) => (
  <div className="flex-1 overflow-y-auto px-4 py-4" data-testid="chat-message-list">
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
);

export default ChatMessageList;
