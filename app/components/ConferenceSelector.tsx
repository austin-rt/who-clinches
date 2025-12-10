'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { HiChevronDown, HiCheck } from 'react-icons/hi2';
import { Button } from './Button';
import {
  CFB_CONFERENCE_METADATA,
  CFB_CONFERENCE_CONFIGS,
  CFB_AVAILABLE_CONFERENCES,
  type CFBConferenceAbbreviation,
  isValidConference,
} from '@/lib/constants';
import { cn } from '@/lib/utils';
import { useUIState } from '@/app/store/useUI';

const ConferenceSelector = () => {
  const router = useRouter();
  const params = useParams();
  const currentConf = params.conf as string;
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { setTheme } = useUIState();

  const currentConference =
    isValidConference(currentConf) &&
    CFB_CONFERENCE_METADATA[currentConf].cfbdId in CFB_CONFERENCE_CONFIGS
      ? CFB_CONFERENCE_METADATA[currentConf]
      : null;

  const handleConferenceSelect = (conf: CFBConferenceAbbreviation) => {
    const theme = CFB_CONFERENCE_METADATA[conf]?.theme || 'sec';
    setTheme(theme);
    router.push(`/cfb/${conf}`);
    setIsOpen(false);
  };

  const prevConfRef = useRef<string | null>(null);
  useEffect(() => {
    if (currentConf && isValidConference(currentConf)) {
      const theme = CFB_CONFERENCE_METADATA[currentConf]?.theme || 'sec';
      setTheme(theme);
    }
    if (prevConfRef.current !== null && prevConfRef.current !== currentConf) {
      requestAnimationFrame(() => {
        setIsOpen(false);
      });
    }
    prevConfRef.current = currentConf;
  }, [currentConf, setTheme]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="relative" ref={dropdownRef}>
      <Button.Stroked size="sm" color="primary" onClick={() => setIsOpen(!isOpen)} className="w-48">
        <span className="flex w-full items-center justify-between">
          <span className="truncate text-left">
            {currentConference ? currentConference.name : 'Select Conference'}
          </span>
          <HiChevronDown
            className={cn(
              'ml-2 h-4 w-4 flex-shrink-0 transition-transform',
              isOpen && 'rotate-180'
            )}
          />
        </span>
      </Button.Stroked>
      {isOpen && (
        <div className="dropdown-menu absolute left-0 top-full z-50 mt-1 w-48 rounded-lg border-2 border-primary bg-base-100 shadow-lg">
          <div className="relative p-2">
            <div className="px-3 py-2 text-xs font-semibold uppercase text-base-content opacity-60 dark:opacity-80">
              College Football
            </div>
            {CFB_AVAILABLE_CONFERENCES.map((key) => {
              const metadata = CFB_CONFERENCE_METADATA[key];
              return (
                <button
                  key={key}
                  onClick={() => handleConferenceSelect(key)}
                  className={cn(
                    'flex w-full items-center gap-2 rounded-md py-2 pl-[calc(0.75rem+1rem+0.5rem)] pr-3 text-left text-sm font-semibold uppercase transition-all',
                    'bg-base-100 text-base-content hover:bg-base-200',
                    key === currentConf && 'bg-base-200 text-primary dark:text-accent'
                  )}
                >
                  {key === currentConf ? (
                    <HiCheck className="absolute left-3 h-4 w-4 flex-shrink-0 text-primary dark:text-accent" />
                  ) : (
                    <span className="absolute left-3 h-4 w-4" />
                  )}
                  <span>{metadata.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default ConferenceSelector;
