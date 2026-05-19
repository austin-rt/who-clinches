'use client';

import { useState, useRef, useCallback } from 'react';
import { IoSendOutline } from 'react-icons/io5';
import { HiSparkles } from 'react-icons/hi2';

const SCENARIO_PLACEHOLDERS = [
  'What if all home teams win?',
  'What if there are no upsets all season?',
  'What if the whole season plays out chalk?',
  'What if every road team pulls the upset?',
  'What if we flip every result so far?',
  'Who has the hardest path to the title?',
  'Who has the easiest remaining schedule?',
  'Which teams are already eliminated?',
];

interface ChatSearchBarProps {
  geoTeamName?: string | null;
  fallbackTeamName?: string | null;
  onOpen: () => void;
  onSubmit: (message: string) => void;
}

const ChatSearchBar = ({ geoTeamName, fallbackTeamName, onOpen, onSubmit }: ChatSearchBarProps) => {
  const [value, setValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const teamName = geoTeamName ?? fallbackTeamName;
  const [placeholderIndex] = useState(
    () => Date.now() % (SCENARIO_PLACEHOLDERS.length + (teamName ? 1 : 0))
  );
  const placeholder =
    teamName && placeholderIndex === 0
      ? `How does ${teamName} make the title?`
      : SCENARIO_PLACEHOLDERS[teamName ? placeholderIndex - 1 : placeholderIndex];

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
        <HiSparkles className="h-4 w-4 shrink-0 text-primary dark:text-accent" />
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
      <p className="text-base-content/40 mt-1.5 text-center text-xs">
        AI-powered scenario analysis
      </p>
    </div>
  );
};

export default ChatSearchBar;
