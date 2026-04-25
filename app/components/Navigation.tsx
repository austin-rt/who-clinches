'use client';

import { useRouter, useParams } from 'next/navigation';
import { HiCheck } from 'react-icons/hi2';
import { useCallback, useEffect } from 'react';
import {
  CFB_CONFERENCE_METADATA,
  CFB_AVAILABLE_CONFERENCES,
  type CFBConferenceAbbreviation,
  isValidConference,
} from '@/lib/constants';
import { cn } from '@/lib/utils';
import { useUIState } from '@/app/store/useUI';

const Navigation = () => {
  const router = useRouter();
  const params = useParams();
  const currentConf = params.conf as string;
  const { setTheme } = useUIState();

  useEffect(() => {
    if (currentConf && isValidConference(currentConf)) {
      const theme = CFB_CONFERENCE_METADATA[currentConf]?.theme || 'sec';
      setTheme(theme);
    }
  }, [currentConf, setTheme]);

  const handleConferenceSelect = useCallback(
    (conf: CFBConferenceAbbreviation) => {
      router.push(`/cfb/${conf}`);
    },
    [router]
  );

  return (
    <div className="dropdown dropdown-hover dropdown-end">
      <label tabIndex={0} className="btn btn-ghost btn-sm font-semibold uppercase">
        College Football
      </label>
      <ul className="dropdown-content menu z-[1] w-52 rounded-lg border-2 border-primary bg-base-100 p-2 shadow-lg dark:border-accent">
        {CFB_AVAILABLE_CONFERENCES.map((key) => {
          const metadata = CFB_CONFERENCE_METADATA[key];
          return (
            <li key={key}>
              <a
                onClick={(e) => {
                  e.preventDefault();
                  handleConferenceSelect(key);
                }}
                className={cn(
                  'dropdown-close flex items-center gap-2 rounded-md py-2 pl-[calc(0.75rem+1rem+0.5rem)] pr-3 font-semibold uppercase',
                  key === currentConf && 'bg-base-200 text-primary dark:text-accent'
                )}
              >
                {key === currentConf ? (
                  <HiCheck className="absolute left-3 h-4 w-4 flex-shrink-0 text-primary dark:text-accent" />
                ) : (
                  <span className="absolute left-3 h-4 w-4" />
                )}
                <span>{metadata.name}</span>
              </a>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default Navigation;
