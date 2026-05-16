'use client';

import { useState, useRef, useCallback } from 'react';
import { IoSendOutline } from 'react-icons/io5';

interface ChatSearchBarProps {
  geoTeamName: string | null;
  fallbackTeamName: string | null;
  onOpen: () => void;
  onSubmit: (message: string) => void;
}

const ChatSearchBar = ({ geoTeamName, fallbackTeamName, onOpen, onSubmit }: ChatSearchBarProps) => {
  const [value, setValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const teamName = geoTeamName ?? fallbackTeamName ?? 'your team';
  const placeholder = `How does ${teamName} make the title?`;

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
