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
import {
  NFL_CONFERENCES,
  getTeamsInDivision,
  type NflConference,
  type NflDivisionId,
} from '@/lib/nfl/constants';

const CFB_CONFERENCE_LOGOS: Record<string, string> = {
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

const nflTeamLogo = (abbrev: string) =>
  `https://a.espncdn.com/i/teamlogos/nfl/500/${abbrev.toLowerCase()}.png`;

const NFL_DIVISION_ORDER = ['North', 'South', 'East', 'West'] as const;

const NflDivisionRow = ({ conf, divName }: { conf: NflConference; divName: string }) => {
  const [open, setOpen] = useState(true);
  const divId = `${conf} ${divName}` as NflDivisionId;
  const teams = getTeamsInDivision(divId);

  return (
    <div className="rounded-lg border border-black/5 dark:border-white/10">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-3 py-2"
      >
        <Link
          href={`/nfl/${conf.toLowerCase()}/${divName.toLowerCase()}`}
          onClick={(e) => e.stopPropagation()}
          className="text-base-content/70 text-xs font-bold uppercase tracking-wide hover:text-base-content"
        >
          {divName}
        </Link>
        <HiChevronDown
          className={`text-base-content/40 h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open && (
        <div className="grid grid-cols-4 gap-1.5 px-3 pb-3">
          {teams.map((t) => (
            <Link
              key={t.espnId}
              href={`/nfl/${conf.toLowerCase()}/${divName.toLowerCase()}/${t.abbrev.toLowerCase()}`}
              className="group flex flex-col items-center gap-1 rounded-lg border border-black/5 bg-gradient-to-b from-white to-black/[0.02] p-2 transition-all hover:from-black/[0.02] hover:to-black/[0.05] dark:border-white/10 dark:from-white/20 dark:to-white/15 dark:hover:from-white/25 dark:hover:to-white/20"
            >
              <Image
                src={nflTeamLogo(t.abbrev)}
                alt={t.displayName}
                width={32}
                height={32}
                className="h-8 w-8 object-contain"
              />
              <span className="text-base-content/70 text-[10px] font-medium group-hover:text-base-content">
                {t.abbrev}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

const NflConferenceSection = ({ conf }: { conf: NflConference }) => {
  return (
    <div className="flex flex-col gap-2 rounded-lg border border-black/5 p-3 dark:border-white/10">
      <Link
        href={`/nfl/${conf.toLowerCase()}`}
        className="group flex flex-col items-center gap-1.5 rounded-xl border border-black/5 bg-gradient-to-b from-white to-black/[0.02] px-4 py-3 transition-all hover:from-black/[0.02] hover:to-black/[0.05] dark:border-white/10 dark:from-white/20 dark:to-white/15 dark:hover:from-white/25 dark:hover:to-white/20"
      >
        <Image
          src={`https://a.espncdn.com/i/teamlogos/nfl/500/${conf.toLowerCase()}.png`}
          alt={conf}
          width={48}
          height={48}
          className="h-12 w-12 object-contain"
          unoptimized
        />
        <span className="text-base-content/80 text-sm font-semibold group-hover:text-base-content">
          {conf}
        </span>
      </Link>
      {NFL_DIVISION_ORDER.map((divName) => (
        <NflDivisionRow key={divName} conf={conf} divName={divName} />
      ))}
    </div>
  );
};

const Home = () => {
  const [chatOpen, setChatOpen] = useState(false);
  const [initialMessage, setInitialMessage] = useState<string | null>(null);
  const [forceNewChat, setForceNewChat] = useState(false);
  const [cfbOpen, setCfbOpen] = useState(true);
  const [nflOpen, setNflOpen] = useState(true);
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
          onOpen={() => {
            setForceNewChat(true);
            setChatOpen(true);
          }}
          onSubmit={(msg) => {
            setForceNewChat(true);
            setInitialMessage(msg);
            setChatOpen(true);
          }}
        />

        <div className="flex w-full max-w-4xl flex-col gap-4">
          <div className="rounded-xl border border-stroke bg-base-200 shadow-md">
            <button
              type="button"
              onClick={() => setCfbOpen(!cfbOpen)}
              className="flex w-full items-center justify-between px-5 py-4 text-left"
            >
              <span className="text-lg font-semibold text-base-content">
                College Football Conference Championship Simulator
              </span>
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
                  const logo = CFB_CONFERENCE_LOGOS[conf];
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

          <div className="rounded-xl border border-stroke bg-base-200 shadow-md">
            <button
              type="button"
              onClick={() => setNflOpen(!nflOpen)}
              className="flex w-full items-center justify-between px-5 py-4 text-left"
            >
              <span className="text-lg font-semibold text-base-content">NFL Playoff Simulator</span>
              <HiChevronDown
                className={`text-base-content/50 h-5 w-5 transition-transform ${nflOpen ? 'rotate-180' : ''}`}
              />
            </button>

            {nflOpen && (
              <div className="flex flex-col gap-3 px-5 pb-5">
                <Link
                  href="/nfl"
                  className="group flex flex-col items-center gap-2 rounded-xl border border-black/5 bg-gradient-to-b from-white to-black/[0.02] px-4 py-4 transition-all hover:from-black/[0.02] hover:to-black/[0.05] dark:border-white/10 dark:from-white/20 dark:to-white/15 dark:hover:from-white/25 dark:hover:to-white/20"
                >
                  <Image
                    src="https://a.espncdn.com/i/teamlogos/leagues/500/nfl.png"
                    alt="NFL"
                    width={72}
                    height={72}
                    className="h-[72px] w-[72px] object-contain"
                    unoptimized
                  />
                  <span className="text-base-content/80 text-sm font-semibold group-hover:text-base-content">
                    Full League
                  </span>
                </Link>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {NFL_CONFERENCES.map((conf) => (
                    <NflConferenceSection key={conf} conf={conf} />
                  ))}
                </div>
              </div>
            )}
          </div>
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
          setForceNewChat(false);
        }}
        initialMessage={initialMessage}
        onInitialMessageSent={() => setInitialMessage(null)}
        forceNewChat={forceNewChat}
      />
    </>
  );
};

export default Home;
