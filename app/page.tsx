'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { HiChevronDown } from 'react-icons/hi2';
import { IoChatbubblesOutline } from 'react-icons/io5';
import ChatDrawer from '@/app/components/Chat/ChatDrawer';
import ChatSearchBar from '@/app/components/Chat/ChatSearchBar';
import { useAppSelector } from '@/app/store/hooks';
import {
  CFB_AVAILABLE_CONFERENCES,
  CFB_CONFERENCE_METADATA,
  type CFBConferenceAbbreviation,
} from '@/lib/cfb/constants';

const CONFERENCE_LOGOS: Record<string, string> = {
  sec: '/logos/conferences/sec.svg',
  acc: '/logos/conferences/acc.svg',
  b1g: '/logos/conferences/b1g.svg',
  big12: '/logos/conferences/b12.svg',
  pac: '/logos/conferences/pac.svg',
  aac: '/logos/conferences/aac.svg',
  mac: '/logos/conferences/mac.svg',
  cusa: '/logos/conferences/cusa.svg',
  mwc: '/logos/conferences/mwc.svg',
  sunbelt: '/logos/conferences/sbc.svg',
};

const Home = () => {
  const [chatOpen, setChatOpen] = useState(false);
  const [initialMessage, setInitialMessage] = useState<string | null>(null);
  const [cfbOpen, setCfbOpen] = useState(true);
  const persistedSessions = useAppSelector((s) => s.chat.sessions);
  const chatHistory = useAppSelector((s) => s.chat.history ?? []);
  const hasConversation =
    persistedSessions.some((s) => s.messages.length > 0) || chatHistory.length > 0;

  return (
    <>
      <div className="container mx-auto flex min-h-full flex-col items-center gap-12 px-4 py-12">
        <div className="flex flex-col items-center gap-3">
          <h1 data-testid="home-heading" className="text-3xl font-bold text-base-content">
            Who Clinches
          </h1>
          <p className="text-base-content/60 text-center text-sm">
            Simulate outcomes and ask the AI analyst anything about the season
          </p>
        </div>

        <ChatSearchBar
          onOpen={() => setChatOpen(true)}
          onSubmit={(msg) => {
            setInitialMessage(msg);
            setChatOpen(true);
          }}
        />

        <div className="w-full max-w-4xl rounded-xl border border-stroke bg-base-200 shadow-md">
          <button
            type="button"
            onClick={() => setCfbOpen(!cfbOpen)}
            className="flex w-full items-center justify-between px-5 py-4 text-left"
          >
            <div>
              <span className="text-lg font-semibold text-base-content">College Football</span>
              <p className="text-base-content/50 text-xs">Tiebreaker simulator</p>
            </div>
            <HiChevronDown
              className={`text-base-content/50 h-5 w-5 transition-transform ${cfbOpen ? 'rotate-180' : ''}`}
            />
          </button>

          {cfbOpen && (
            <div
              data-testid="conference-grid"
              className="grid grid-cols-2 gap-4 px-5 pb-5 sm:grid-cols-3 md:grid-cols-5"
            >
              {CFB_AVAILABLE_CONFERENCES.map((conf) => {
                const meta = CFB_CONFERENCE_METADATA[conf as CFBConferenceAbbreviation];
                const logo = CONFERENCE_LOGOS[conf];
                return (
                  <Link
                    key={conf}
                    href={`/cfb/${conf}`}
                    data-testid={`conf-card-${conf}`}
                    className="group flex flex-col items-center gap-2 rounded-xl border border-black/5 bg-gradient-to-b from-white to-black/[0.02] p-3 backdrop-blur-sm transition-all hover:from-black/[0.02] hover:to-black/[0.05] dark:border-white/10 dark:from-white/20 dark:to-white/15 dark:hover:from-white/25 dark:hover:to-white/20"
                  >
                    {logo ? (
                      <div className="flex h-24 w-full items-center justify-center">
                        <Image
                          src={logo}
                          alt={meta.name}
                          width={120}
                          height={120}
                          unoptimized
                          className="h-auto max-h-full w-auto max-w-full object-contain"
                        />
                      </div>
                    ) : (
                      <div className="text-base-content/50 flex aspect-square w-full items-center justify-center rounded-full bg-base-200 text-xs font-bold">
                        {meta.cfbdId}
                      </div>
                    )}
                    <span className="text-base-content/70 text-sm font-medium group-hover:text-base-content">
                      {meta.name}
                    </span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {hasConversation && !chatOpen && (
        <button
          onClick={() => setChatOpen(true)}
          className="chat-tab fixed right-0 top-1/2 z-30 flex -translate-y-1/2 flex-col items-center justify-center rounded-l-xl px-2.5 py-10 shadow-lg transition-opacity hover:opacity-90"
          aria-label="Reopen chat"
        >
          <IoChatbubblesOutline className="h-4 w-4" />
        </button>
      )}

      <ChatDrawer
        open={chatOpen}
        onClose={() => {
          setChatOpen(false);
          setInitialMessage(null);
        }}
        initialMessage={initialMessage}
        onInitialMessageSent={() => setInitialMessage(null)}
      />
    </>
  );
};

export default Home;
