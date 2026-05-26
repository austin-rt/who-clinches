import Image from 'next/image';
import type { NflConference } from '@/lib/nfl/constants';
import type { NflSimulateResponse, NflStandingEntry } from '@/lib/nfl/types';
import type { FilterScope } from '../types';
import { nflTeamLogo } from '../utils';

const SeedBadge = ({ seed, isDivWinner }: { seed: number; isDivWinner: boolean }) => (
  <span
    className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${isDivWinner ? 'bg-primary/20 text-primary' : 'text-base-content/60 bg-base-300'}`}
  >
    {seed}
  </span>
);

const StandingRow = ({ entry }: { entry: NflStandingEntry }) => (
  <div className="flex items-center gap-3 rounded-lg px-3 py-2">
    <SeedBadge seed={entry.seed} isDivWinner={entry.isDivisionWinner} />
    <Image
      src={entry.logo || nflTeamLogo(entry.abbrev)}
      alt={entry.displayName}
      width={28}
      height={28}
      className="h-7 w-7 object-contain"
      unoptimized
    />
    <div className="flex flex-1 items-center justify-between">
      <div>
        <span className="text-sm font-semibold text-base-content">{entry.abbrev}</span>
        {entry.isDivisionWinner && (
          <span className="ml-1.5 text-[10px] font-medium uppercase text-primary">DIV</span>
        )}
      </div>
      <div className="text-right">
        <span className="text-base-content/70 text-xs">
          {entry.record.wins}-{entry.record.losses}
          {entry.record.ties > 0 ? `-${entry.record.ties}` : ''}
        </span>
        {entry.explainPosition && (
          <p className="text-base-content/40 max-w-[200px] text-[10px] leading-tight">
            {entry.explainPosition}
          </p>
        )}
      </div>
    </div>
  </div>
);

const NflBracket = ({ result, scope }: { result: NflSimulateResponse; scope: FilterScope }) => {
  const conferences =
    scope.level === 'conference' ? [scope.conference] : (['AFC', 'NFC'] as NflConference[]);

  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-center text-lg font-bold text-base-content">Playoff Picture</h2>
      <div
        className={`grid gap-4 ${conferences.length === 2 ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'}`}
      >
        {conferences.map((conf) => {
          const seeds = result.bracket[conf.toLowerCase() as 'afc' | 'nfc'];
          if (!seeds || seeds.length === 0) return null;
          return (
            <div key={conf} className="rounded-xl border border-stroke bg-base-200 p-4">
              <h3 className="text-base-content/60 mb-3 text-sm font-bold uppercase tracking-wide">
                {conf} Seeds
              </h3>
              <div className="divide-base-content/5 flex flex-col divide-y">
                {seeds.map((entry) => (
                  <StandingRow key={entry.teamId} entry={entry} />
                ))}
              </div>
              <div className="border-base-content/10 text-base-content/40 mt-2 border-t border-dashed pt-2 text-center text-[10px]">
                Seed 1 gets first-round bye
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default NflBracket;
