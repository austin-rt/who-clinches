import { HiXMark, HiPlus, HiClock } from 'react-icons/hi2';
import { MAX_SESSIONS, type ChatSession } from './ChatDrawer';

interface ChatHeaderProps {
  sessionId: string;
  sessions: ChatSession[];
  activeIndex: number;
  isStreaming: boolean;
  history: ChatSession[];
  historyOpen: boolean;
  tabsRef: React.RefObject<HTMLDivElement | null>;
  onClose: () => void;
  onSwitchSession: (index: number) => void;
  onCloseSession: (index: number) => void;
  onNewChat: () => void;
  onRestoreFromHistory: (id: string) => void;
  onToggleHistory: (open: boolean) => void;
}

const ChatHeader = ({
  sessionId,
  sessions,
  activeIndex,
  history,
  historyOpen,
  tabsRef,
  onClose,
  onSwitchSession,
  onCloseSession,
  onNewChat,
  onRestoreFromHistory,
  onToggleHistory,
}: ChatHeaderProps) => {
  const hasHistory = history.length > 0;

  return (
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
            data-testid="chat-close-btn"
          >
            <HiXMark className="h-5 w-5" />
          </button>
        </div>
      </div>
      <div className="flex items-center gap-1 px-4 pb-2">
        <div
          ref={tabsRef}
          className="scrollbar-none flex min-w-0 flex-1 items-center gap-1 overflow-x-auto"
        >
          {sessions.map((session, i) => (
            <div
              key={session.id}
              className={`group flex max-w-[8rem] shrink-0 items-center rounded-md text-xs transition-colors ${
                i === activeIndex
                  ? 'ring-base-content/20 bg-base-300 font-medium text-base-content ring-1'
                  : 'text-base-content/50 hover:bg-base-200 hover:text-base-content'
              }`}
            >
              <button
                onClick={() => onSwitchSession(i)}
                className="min-w-0 truncate py-1 pl-2 pr-1"
              >
                {session.label}
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onCloseSession(i);
                }}
                className="hover:bg-base-content/10 text-base-content/40 hover:text-base-content/70 flex h-4 w-4 shrink-0 items-center justify-center rounded transition-colors"
                aria-label={`Close ${session.label}`}
              >
                <HiXMark className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
        <button
          onClick={onNewChat}
          disabled={sessions.length >= MAX_SESSIONS}
          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md transition-colors ${
            sessions.length < MAX_SESSIONS
              ? 'text-base-content/50 hover:bg-base-300 hover:text-base-content'
              : 'text-base-content/20 cursor-default'
          }`}
          aria-label="New chat"
          data-testid="chat-new-btn"
        >
          <HiPlus className="h-3.5 w-3.5" />
        </button>
        {hasHistory && (
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleHistory(!historyOpen);
              }}
              className="text-base-content/50 flex h-6 w-6 shrink-0 items-center justify-center rounded-md transition-colors hover:bg-base-300 hover:text-base-content"
              aria-label="Chat history"
              data-testid="chat-history-btn"
            >
              <HiClock className="h-3.5 w-3.5" />
            </button>
            {historyOpen && (
              <div className="absolute right-0 top-full z-20 mt-1 max-h-48 w-56 overflow-y-auto rounded-lg border border-base-300 bg-base-100 py-1 shadow-lg">
                {history.map((s) => (
                  <button
                    key={s.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      onRestoreFromHistory(s.id);
                    }}
                    className="text-base-content/70 hover:bg-base-content/10 flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs transition-colors"
                  >
                    <span className="min-w-0 truncate">{s.label}</span>
                    {s.conf && (
                      <span className="text-base-content/40 shrink-0 text-[10px] uppercase">
                        {s.conf}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatHeader;
