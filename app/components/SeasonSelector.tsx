'use client';

import { useState, useRef, useEffect } from 'react';
import { HiChevronDown, HiCheck } from 'react-icons/hi2';
import { Button } from './Button';
import { useAppDispatch, useAppSelector } from '@/app/store/hooks';
import { setSeason } from '@/app/store/appSlice';
import { cn } from '@/lib/utils';

const CFBD_DATA_START_YEAR = 2014;

const SeasonSelector = () => {
  const dispatch = useAppDispatch();
  const selectedSeason = useAppSelector((state) => state.app.season);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Generate list of available years from CFBD_DATA_START_YEAR to current year
  const currentYear = new Date().getFullYear();
  const availableYears = Array.from(
    { length: currentYear - CFBD_DATA_START_YEAR + 1 },
    (_, i) => currentYear - i
  ).sort((a, b) => b - a); // Descending order (newest first)

  const handleSeasonSelect = (year: number) => {
    dispatch(setSeason(year));
    setIsOpen(false);
  };

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
      <Button.Stroked size="sm" color="primary" onClick={() => setIsOpen(!isOpen)} className="w-32">
        <span className="flex w-full items-center justify-between">
          <span className="truncate text-left">
            {selectedSeason ? `${selectedSeason}` : 'Select Season'}
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
        <div className="dropdown-menu absolute left-0 top-full z-50 mt-1 max-h-64 w-32 overflow-y-auto rounded-lg border-2 border-primary bg-base-100 shadow-lg">
          <div className="relative p-2">
            <div className="px-3 py-2 text-xs font-semibold uppercase text-base-content opacity-60 dark:opacity-80">
              Season
            </div>
            {availableYears.map((year) => (
              <button
                key={year}
                onClick={() => handleSeasonSelect(year)}
                className={cn(
                  'flex w-full items-center gap-2 rounded-md py-2 pl-[calc(0.75rem+1rem+0.5rem)] pr-3 text-left text-sm font-semibold transition-all',
                  'bg-base-100 text-base-content hover:bg-base-200',
                  year === selectedSeason && 'bg-base-200 text-primary dark:text-accent'
                )}
              >
                {year === selectedSeason ? (
                  <HiCheck className="absolute left-3 h-4 w-4 flex-shrink-0 text-primary dark:text-accent" />
                ) : (
                  <span className="absolute left-3 h-4 w-4" />
                )}
                <span>{year}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SeasonSelector;
