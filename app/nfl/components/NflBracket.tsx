'use client';

import { useState } from 'react';
import Image from 'next/image';
import { HiChevronDown } from 'react-icons/hi2';
import type { NflConference } from '@/lib/nfl/constants';
import type { NflSimulateResponse, NflStandingEntry } from '@/lib/nfl/types';
import type { FilterScope } from '../types';
import { nflTeamLogo } from '../utils';

const textColor = (hex: string): string => {
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? '#000000' : '#ffffff';
};

const TeamRow = ({ entry, side }: { entry: NflStandingEntry; side: 'left' | 'right' }) => {
  const bg = `#${entry.color}`;
  const fg = textColor(entry.color);

  return (
    <div
      className={`flex h-10 items-center gap-2 px-3 ${side === 'left' ? 'flex-row' : 'flex-row-reverse'}`}
      style={{ backgroundColor: bg, color: fg }}
    >
      <span className="w-5 text-center text-xs font-bold opacity-70">{entry.seed}</span>
      <Image
        src={entry.logo || nflTeamLogo(entry.abbrev)}
        alt={entry.displayName}
        width={24}
        height={24}
        className="h-6 w-6 object-contain"
        unoptimized
      />
      <span className={`flex-1 text-sm font-semibold ${side === 'right' ? 'text-right' : ''}`}>
        {entry.abbrev}
      </span>
      <span className="text-xs opacity-80">
        {entry.record.wins}-{entry.record.losses}
        {entry.record.ties > 0 ? `-${entry.record.ties}` : ''}
      </span>
    </div>
  );
};

const MatchupCard = ({
  higher,
  lower,
  side,
}: {
  higher: NflStandingEntry;
  lower: NflStandingEntry;
  side: 'left' | 'right';
}) => (
  <div className="overflow-hidden rounded-lg border border-stroke shadow-sm">
    <TeamRow entry={higher} side={side} />
    <div className="border-t border-black/20" />
    <TeamRow entry={lower} side={side} />
  </div>
);

const ByeCard = ({ entry, side }: { entry: NflStandingEntry; side: 'left' | 'right' }) => {
  const bg = `#${entry.color}`;
  const fg = textColor(entry.color);

  return (
    <div className="overflow-hidden rounded-lg border border-stroke shadow-sm">
      <div
        className={`flex h-10 items-center gap-2 px-3 ${side === 'left' ? 'flex-row' : 'flex-row-reverse'}`}
        style={{ backgroundColor: bg, color: fg }}
      >
        <span className="w-5 text-center text-xs font-bold opacity-70">1</span>
        <Image
          src={entry.logo || nflTeamLogo(entry.abbrev)}
          alt={entry.displayName}
          width={24}
          height={24}
          className="h-6 w-6 object-contain"
          unoptimized
        />
        <span className="flex-1 text-sm font-semibold">{entry.abbrev}</span>
        <span className="text-xs opacity-80">
          {entry.record.wins}-{entry.record.losses}
          {entry.record.ties > 0 ? `-${entry.record.ties}` : ''}
        </span>
      </div>
      <div
        className="flex h-10 items-center justify-center border-t border-black/20 px-3 text-xs font-medium uppercase tracking-wide"
        style={{ backgroundColor: `${bg}22`, color: fg, opacity: 0.7 }}
      >
        First-round bye
      </div>
    </div>
  );
};

const ConferenceBracket = ({
  conf,
  seeds,
  side,
}: {
  conf: string;
  seeds: NflStandingEntry[];
  side: 'left' | 'right';
}) => {
  const seed1 = seeds.find((s) => s.seed === 1);
  const matchups: [number, number][] = [
    [2, 7],
    [3, 6],
    [4, 5],
  ];

  return (
    <div className="flex flex-col gap-3">
      <h3
        className={`text-base-content/60 text-sm font-bold uppercase tracking-wide ${side === 'right' ? 'text-right' : ''}`}
      >
        {conf}
      </h3>
      {seed1 && <ByeCard entry={seed1} side={side} />}
      {matchups.map(([hi, lo]) => {
        const higher = seeds.find((s) => s.seed === hi);
        const lower = seeds.find((s) => s.seed === lo);
        if (!higher || !lower) return null;
        return <MatchupCard key={`${hi}-${lo}`} higher={higher} lower={lower} side={side} />;
      })}
    </div>
  );
};

const NflBracket = ({ result, scope }: { result: NflSimulateResponse; scope: FilterScope }) => {
  const [open, setOpen] = useState(true);
  const conferences =
    scope.level === 'conference' ? [scope.conference] : (['AFC', 'NFC'] as NflConference[]);

  const singleConf = conferences.length === 1;

  return (
    <div className="rounded-xl border border-stroke bg-base-200 shadow-md">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-5 py-4 text-left"
      >
        <span className="text-lg font-semibold text-base-content">Wild Card Round</span>
        <HiChevronDown
          className={`text-base-content/50 h-5 w-5 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open && (
        <div
          className={`grid gap-6 px-5 pb-5 ${singleConf ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2'}`}
        >
          {conferences.map((conf) => {
            const seeds = result.bracket[conf.toLowerCase() as 'afc' | 'nfc'];
            if (!seeds || seeds.length === 0) return null;
            return (
              <ConferenceBracket
                key={conf}
                conf={conf}
                seeds={seeds}
                side={singleConf || conf === 'AFC' ? 'left' : 'right'}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};

export default NflBracket;
