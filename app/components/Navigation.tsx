'use client';

import { useRouter, usePathname } from 'next/navigation';
import Image from 'next/image';
import { useCallback, useEffect, useSyncExternalStore } from 'react';
import {
  CFB_CONFERENCE_METADATA,
  CFB_AVAILABLE_CONFERENCES,
  type CFBConferenceAbbreviation,
} from '@/lib/cfb/constants';
import { NFL_CONFERENCES, getTeamsInDivision, type NflDivisionId } from '@/lib/nfl/constants';
import { cn } from '@/lib/utils';
import { useUIState } from '@/app/store/useUI';

const NFL_DIVISION_NAMES = ['North', 'South', 'East', 'West'] as const;

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

const useHoverable = () =>
  useSyncExternalStore(
    (cb) => {
      const mq = window.matchMedia('(hover: hover) and (pointer: fine)');
      mq.addEventListener('change', cb);
      return () => mq.removeEventListener('change', cb);
    },
    () => window.matchMedia('(hover: hover) and (pointer: fine)').matches,
    () => false
  );

const NflDropdown = ({ isNonProd }: { isNonProd: boolean }) => {
  const router = useRouter();
  const pathname = usePathname();
  const isNfl = pathname.startsWith('/nfl');
  const hoverable = useHoverable();

  const go = useCallback(
    (e: React.MouseEvent, path: string) => {
      e.preventDefault();
      router.push(path);
    },
    [router]
  );

  return (
    <div className={cn('dropdown dropdown-end', hoverable && 'dropdown-hover')}>
      <label
        tabIndex={0}
        className={cn(
          'btn btn-ghost btn-sm font-semibold uppercase',
          isNonProd ? 'text-white hover:bg-white/20' : 'text-base-content',
          isNfl && 'underline underline-offset-4'
        )}
      >
        NFL
      </label>
      <ul
        tabIndex={0}
        className="dropdown-content menu z-[1] w-80 rounded-lg border-2 border-stroke bg-base-100 p-2 shadow-lg"
      >
        <li>
          <a
            onClick={(e) => go(e, '/nfl')}
            className={cn(
              'dropdown-close flex items-center gap-2 font-semibold',
              pathname === '/nfl' && 'bg-base-200 text-primary dark:text-accent'
            )}
          >
            <Image
              src="https://a.espncdn.com/i/teamlogos/leagues/500/nfl.png"
              alt="NFL"
              width={20}
              height={20}
              className="h-5 w-5 object-contain"
              unoptimized
            />
            Full League
          </a>
        </li>
        <div className="divider my-0" />
        <div className="grid grid-cols-2">
          {NFL_CONFERENCES.map((conf) => (
            <div key={conf}>
              <li>
                <a
                  onClick={(e) => go(e, `/nfl/${conf.toLowerCase()}`)}
                  className={cn(
                    'dropdown-close flex items-center gap-2 font-semibold',
                    pathname === `/nfl/${conf.toLowerCase()}` &&
                      'bg-base-200 text-primary dark:text-accent'
                  )}
                >
                  <Image
                    src={`https://a.espncdn.com/i/teamlogos/nfl/500/${conf.toLowerCase()}.png`}
                    alt={conf}
                    width={20}
                    height={20}
                    className="h-5 w-5 object-contain"
                    unoptimized
                  />
                  {conf}
                </a>
              </li>
              <div className="divider my-0" />
              {NFL_DIVISION_NAMES.map((div, i) => {
                const divPath = `/nfl/${conf.toLowerCase()}/${div.toLowerCase()}`;
                const divId = `${conf} ${div}` as NflDivisionId;
                const teams = getTeamsInDivision(divId);
                return (
                  <div key={div}>
                    {i > 0 && <div className="divider my-0" />}
                    <li>
                      <a
                        onClick={(e) => go(e, divPath)}
                        className={cn(
                          'dropdown-close text-xs font-bold uppercase tracking-wide',
                          pathname === divPath && 'bg-base-200 text-primary dark:text-accent'
                        )}
                      >
                        {div}
                      </a>
                    </li>
                    {teams.map((t) => {
                      const teamPath = `${divPath}/${t.abbrev.toLowerCase()}`;
                      return (
                        <li key={t.espnId}>
                          <a
                            onClick={(e) => go(e, teamPath)}
                            className={cn(
                              'dropdown-close flex items-center gap-2 py-1 text-sm',
                              pathname === teamPath && 'bg-base-200 text-primary dark:text-accent'
                            )}
                          >
                            <Image
                              src={nflTeamLogo(t.abbrev)}
                              alt={t.abbrev}
                              width={16}
                              height={16}
                              className="h-4 w-4 object-contain"
                              unoptimized
                            />
                            {t.abbrev}
                          </a>
                        </li>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </ul>
    </div>
  );
};

const CfbDropdown = ({ isNonProd }: { isNonProd: boolean }) => {
  const router = useRouter();
  const pathname = usePathname();
  const currentConf = pathname.startsWith('/cfb/') ? pathname.split('/')[2] : undefined;
  const { setTheme } = useUIState();
  const hoverable = useHoverable();

  useEffect(() => {
    if (currentConf && currentConf in CFB_CONFERENCE_METADATA) {
      setTheme(CFB_CONFERENCE_METADATA[currentConf as CFBConferenceAbbreviation]?.theme || 'sec');
    }
  }, [currentConf, setTheme]);

  const go = useCallback(
    (e: React.MouseEvent, path: string) => {
      e.preventDefault();
      router.push(path);
    },
    [router]
  );

  return (
    <div className={cn('dropdown dropdown-end', hoverable && 'dropdown-hover')}>
      <label
        tabIndex={0}
        className={cn(
          'btn btn-ghost btn-sm font-semibold uppercase',
          isNonProd ? 'text-white hover:bg-white/20' : 'text-base-content',
          currentConf && 'underline underline-offset-4'
        )}
      >
        CFB
      </label>
      <ul
        tabIndex={0}
        className="dropdown-content menu z-[1] w-52 rounded-lg border-2 border-stroke bg-base-100 p-2 shadow-lg"
      >
        {CFB_AVAILABLE_CONFERENCES.map((key) => {
          const metadata = CFB_CONFERENCE_METADATA[key];
          const logo = CFB_CONFERENCE_LOGOS[key];
          return (
            <li key={key}>
              <a
                onClick={(e) => go(e, `/cfb/${key}`)}
                className={cn(
                  'dropdown-close flex items-center gap-2 font-semibold',
                  key === currentConf && 'bg-base-200 text-primary dark:text-accent'
                )}
              >
                {logo && (
                  <Image
                    src={logo}
                    alt={metadata.name}
                    width={20}
                    height={20}
                    className="h-5 w-5 object-contain"
                    unoptimized
                  />
                )}
                {metadata.name}
              </a>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

const Navigation = ({ isNonProd }: { isNonProd: boolean }) => (
  <div className="flex items-center gap-1">
    <NflDropdown isNonProd={isNonProd} />
    <CfbDropdown isNonProd={isNonProd} />
  </div>
);

export default Navigation;
