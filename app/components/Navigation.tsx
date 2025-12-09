'use client';

import { useRouter, useParams } from 'next/navigation';
import { HiCheck } from 'react-icons/hi2';
import { useMemo, useCallback, useEffect } from 'react';
import {
  CFB_CONFERENCE_METADATA,
  type ConferenceAbbreviation,
  isValidConference,
} from '@/lib/constants';
import { cn } from '@/lib/utils';
import { useUIState } from '@/app/store/useUI';
import { getDefaultThemeForConference } from '@/app/config/theme-config';

// Conferences that have tiebreaker rules implemented
const CONFERENCES_WITH_RULES: ConferenceAbbreviation[] = ['sec', 'mac'];

const Navigation = () => {
  const router = useRouter();
  const params = useParams();
  const currentConf = params.conf as string;
  const { setTheme } = useUIState();

  const availableConferences = useMemo(
    () =>
      CONFERENCES_WITH_RULES.map((key) => ({
        key,
        ...CFB_CONFERENCE_METADATA[key],
      })),
    []
  );

  // Set theme when conference changes
  useEffect(() => {
    if (currentConf && isValidConference(currentConf)) {
      const theme = getDefaultThemeForConference(currentConf);
      setTheme(theme);
    }
  }, [currentConf, setTheme]);

  const handleConferenceSelect = useCallback(
    (conf: ConferenceAbbreviation) => {
      router.push(`/cfb/${conf}`);
    },
    [router]
  );

  return (
    <div className="dropdown dropdown-hover dropdown-end">
      <label tabIndex={0} className="btn btn-ghost btn-sm font-semibold uppercase">
        College Football
      </label>
      <ul tabIndex={0} className="dropdown-content menu rounded-lg z-[1] w-52 border-2 border-primary bg-base-100 p-2 shadow-lg dark:border-accent-80">
        {availableConferences.map((conf) => (
          <li key={conf.key}>
            <a
              onClick={(e) => {
                e.preventDefault();
                handleConferenceSelect(conf.key);
              }}
              className={cn(
                'flex items-center gap-2 rounded-md py-2 pl-[calc(0.75rem+1rem+0.5rem)] pr-3 font-semibold uppercase',
                conf.key === currentConf && 'bg-base-200 text-primary dark:text-accent-80'
              )}
            >
              {conf.key === currentConf ? (
                <HiCheck className="absolute left-3 h-4 w-4 flex-shrink-0 text-primary dark:text-accent-80" />
              ) : (
                <span className="absolute left-3 h-4 w-4" />
              )}
              <span>{conf.name}</span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Navigation;
