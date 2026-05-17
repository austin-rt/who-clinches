'use client';

import { useState, useRef, useCallback } from 'react';
import { IoSendOutline } from 'react-icons/io5';

interface ChatSearchBarProps {
  geoTeamName: string | null;
  fallbackTeamName: string | null;
  hasConversation: boolean;
  onOpen: () => void;
  onSubmit: (message: string) => void;
}

const ChatSearchBar = ({
  geoTeamName,
  fallbackTeamName,
  hasConversation,
  onOpen,
  onSubmit,
}: ChatSearchBarProps) => {
  const [value, setValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const teamName = geoTeamName ?? fallbackTeamName ?? 'your team';
  const placeholder = hasConversation
    ? 'Continue chatting...'
    : `How does ${teamName} make the title?`;

  const handleSubmit = useCallback(() => {
    const text = value.trim();
    if (text) {
      onSubmit(text);
      setValue('');
    } else {
      onOpen();
    }
  }, [value, onOpen, onSubmit]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  };

  if (hasConversation) {
    return (
      <div className="mx-auto w-full max-w-md">
        <button
          type="button"
          onClick={onOpen}
          className="chat-search-bar w-full cursor-pointer"
          data-testid="chat-trigger"
        >
          <span className="chat-search-input text-left opacity-50">{placeholder}</span>
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-md">
      <div className="chat-search-bar" role="presentation">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          maxLength={500}
          className="chat-search-input"
          data-testid="chat-trigger"
        />
        <button type="button" onClick={handleSubmit} className="chat-search-send" aria-label="Send">
          <IoSendOutline className="h-4 w-4 -rotate-45" />
        </button>
      </div>
    </div>
  );
};

export default ChatSearchBar;
