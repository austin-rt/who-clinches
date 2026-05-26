'use client';

import { IoSendOutline, IoStopOutline } from 'react-icons/io5';

interface ChatInputProps {
  input: string;
  isStreaming: boolean;
  disabled: boolean;
  inputRef: React.RefObject<HTMLTextAreaElement | null>;
  onInputChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onAbort: () => void;
}

const ChatInput = ({
  input,
  isStreaming,
  disabled,
  inputRef,
  onInputChange,
  onSubmit,
  onAbort,
}: ChatInputProps) => (
  <form
    onSubmit={onSubmit}
    className={`flex items-stretch border-t border-base-300 px-4 py-3${disabled ? 'pointer-events-none opacity-50' : ''}`}
  >
    <textarea
      ref={inputRef}
      value={input}
      onChange={(e) => {
        onInputChange(e.target.value);
        e.target.style.height = 'auto';
        e.target.style.height = `${e.target.scrollHeight}px`;
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          onSubmit(e);
        }
      }}
      maxLength={500}
      rows={1}
      disabled={disabled}
      className="chat-input"
      data-testid="chat-input"
    />
    {isStreaming ? (
      <button
        type="button"
        className="chat-send-btn"
        aria-label="Stop"
        data-testid="chat-stop-btn"
        onClick={onAbort}
      >
        <IoStopOutline className="h-4 w-4" />
      </button>
    ) : (
      <button type="submit" className="chat-send-btn" aria-label="Send" data-testid="chat-send-btn">
        <IoSendOutline className="h-4 w-4 -rotate-45" />
      </button>
    )}
  </form>
);

export default ChatInput;
