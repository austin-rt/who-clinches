'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { NFL_CONFERENCES, NFL_DIVISIONS, NFL_TEAMS } from '@/lib/nfl/constants';
import type { FilterScope } from '../types';
import { nflTeamLogo, nflConfLogo } from '../utils';

type FilterSuggestion = {
  label: string;
  secondaryLabel?: string;
  category: 'Conference' | 'Division' | 'Team';
  href: string;
  logo?: string;
};

const buildSuggestions = (): FilterSuggestion[] => {
  const suggestions: FilterSuggestion[] = [];
  for (const conf of NFL_CONFERENCES) {
    suggestions.push({
      label: conf,
      category: 'Conference',
      href: `/nfl/${conf.toLowerCase()}`,
      logo: nflConfLogo(conf),
    });
  }
  for (const divId of NFL_DIVISIONS) {
    const [conf, div] = divId.split(' ');
    suggestions.push({
      label: divId,
      secondaryLabel: conf,
      category: 'Division',
      href: `/nfl/${conf.toLowerCase()}/${div.toLowerCase()}`,
      logo: nflConfLogo(conf),
    });
  }
  for (const team of NFL_TEAMS) {
    const [conf, div] = team.divisionId.split(' ');
    suggestions.push({
      label: team.displayName,
      secondaryLabel: `${team.abbrev} · ${team.divisionId}`,
      category: 'Team',
      href: `/nfl/${conf.toLowerCase()}/${div.toLowerCase()}/${team.abbrev.toLowerCase()}`,
      logo: nflTeamLogo(team.abbrev),
    });
  }
  return suggestions;
};

const ALL_SUGGESTIONS = buildSuggestions();

const getContextualSuggestions = (scope: FilterScope): FilterSuggestion[] => {
  if (scope.level === 'league') return ALL_SUGGESTIONS;
  if (scope.level === 'conference') {
    return ALL_SUGGESTIONS.filter((s) => {
      if (s.category === 'Conference') return false;
      if (s.category === 'Division')
        return s.href.startsWith(`/nfl/${scope.conference.toLowerCase()}/`);
      return s.href.startsWith(`/nfl/${scope.conference.toLowerCase()}/`);
    });
  }
  if (scope.level === 'division') {
    const prefix = `/nfl/${scope.conference.toLowerCase()}/${scope.division}/`;
    return ALL_SUGGESTIONS.filter((s) => s.category === 'Team' && s.href.startsWith(prefix));
  }
  return [];
};

const FilterNav = ({ scope }: { scope: FilterScope }) => {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const activeChips: { label: string; removeHref: string }[] = useMemo(() => {
    const chips: { label: string; removeHref: string }[] = [];
    if (scope.level === 'conference' || scope.level === 'division' || scope.level === 'team') {
      chips.push({ label: scope.conference, removeHref: '/nfl' });
    }
    if (scope.level === 'division' || scope.level === 'team') {
      chips.push({
        label: scope.divisionId.replace(`${scope.conference} `, ''),
        removeHref: `/nfl/${scope.conference.toLowerCase()}`,
      });
    }
    if (scope.level === 'team') {
      chips.push({
        label: scope.team.abbrev,
        removeHref: `/nfl/${scope.conference.toLowerCase()}/${scope.division}`,
      });
    }
    return chips;
  }, [scope]);

  const suggestions = useMemo(() => {
    const contextual = getContextualSuggestions(scope);
    if (!query.trim()) return contextual;
    const q = query.toLowerCase();
    return contextual.filter(
      (s) =>
        s.label.toLowerCase().includes(q) ||
        (s.secondaryLabel && s.secondaryLabel.toLowerCase().includes(q))
    );
  }, [query, scope]);

  const flatItems = useMemo(() => {
    return suggestions;
  }, [suggestions]);

  const selectSuggestion = useCallback(
    (suggestion: FilterSuggestion) => {
      setQuery('');
      setOpen(false);
      setHighlightIndex(-1);
      router.push(suggestion.href);
    },
    [router]
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setOpen(false);
      setQuery('');
      inputRef.current?.blur();
      return;
    }
    if (e.key === 'Backspace' && query === '' && activeChips.length > 0) {
      router.push(activeChips[activeChips.length - 1].removeHref);
      return;
    }
    if (!open || flatItems.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightIndex((prev) => (prev < flatItems.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightIndex((prev) => (prev > 0 ? prev - 1 : flatItems.length - 1));
    } else if (e.key === 'Enter' && highlightIndex >= 0) {
      e.preventDefault();
      selectSuggestion(flatItems[highlightIndex]);
    }
  };

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const grouped = useMemo(() => {
    const groups: { category: FilterSuggestion['category']; items: FilterSuggestion[] }[] = [];
    const order: FilterSuggestion['category'][] = ['Conference', 'Division', 'Team'];
    for (const cat of order) {
      const items = suggestions.filter((s) => s.category === cat);
      if (items.length > 0) groups.push({ category: cat, items });
    }
    return groups;
  }, [suggestions]);

  const getPlaceholder = (s: FilterScope): string => {
    if (s.level === 'league') return 'Search conferences, divisions, or teams...';
    if (s.level === 'conference') return `Search ${s.conference} divisions or teams...`;
    if (s.level === 'division') return `Search ${s.divisionId} teams...`;
    return '';
  };
  const placeholder = getPlaceholder(scope);

  return (
    <div className="relative" ref={containerRef} data-testid="nfl-filter-nav">
      <div
        className={`flex min-h-[44px] flex-wrap items-center gap-1.5 rounded-xl border bg-base-100 px-3 py-2 transition-all ${
          open
            ? 'border-primary/40 ring-primary/10 ring-2'
            : 'border-base-content/10 hover:border-base-content/20'
        }`}
        onClick={() => inputRef.current?.focus()}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          className="text-base-content/30 h-4 w-4 shrink-0"
        >
          <path
            fillRule="evenodd"
            d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z"
            clipRule="evenodd"
          />
        </svg>

        {activeChips.map((chip) => (
          <Link
            key={chip.label}
            href={chip.removeHref}
            className="border-primary/20 bg-primary/10 hover:border-primary/40 hover:bg-primary/20 group flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-medium text-primary transition-colors"
          >
            {chip.label}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 16 16"
              fill="currentColor"
              className="h-3 w-3 opacity-50 group-hover:opacity-100"
            >
              <path d="M5.28 4.22a.75.75 0 00-1.06 1.06L6.94 8l-2.72 2.72a.75.75 0 101.06 1.06L8 9.06l2.72 2.72a.75.75 0 101.06-1.06L9.06 8l2.72-2.72a.75.75 0 00-1.06-1.06L8 6.94 5.28 4.22z" />
            </svg>
          </Link>
        ))}

        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            setHighlightIndex(-1);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="placeholder:text-base-content/40 min-w-[140px] flex-1 bg-transparent text-sm text-base-content outline-none"
          role="combobox"
          aria-expanded={open}
          aria-activedescendant={
            highlightIndex >= 0 ? `filter-option-${highlightIndex}` : undefined
          }
          aria-autocomplete="list"
          aria-controls="filter-listbox"
        />

        {activeChips.length > 0 && (
          <Link
            href="/nfl"
            className="text-base-content/40 hover:bg-base-content/5 hover:text-base-content/70 shrink-0 rounded-md px-1.5 py-0.5 text-[11px] font-medium transition-colors"
          >
            Clear all
          </Link>
        )}
      </div>

      {open && (
        <div
          id="filter-listbox"
          role="listbox"
          className={`border-base-content/10 absolute left-0 right-0 top-full z-50 mt-1.5 overflow-hidden rounded-xl border bg-base-100 shadow-xl shadow-black/10 transition-all duration-100 dark:shadow-black/30 ${
            flatItems.length > 0 ? 'max-h-[360px] opacity-100' : 'max-h-[80px] opacity-100'
          }`}
        >
          {flatItems.length > 0 ? (
            <div className="max-h-[360px] overflow-y-auto overscroll-contain py-1">
              {grouped.map((group) => (
                <div key={group.category}>
                  <div className="bg-base-100/95 text-base-content/40 sticky top-0 z-10 px-3 pb-1 pt-2.5 text-[10px] font-bold uppercase tracking-widest backdrop-blur-sm">
                    {
                      (
                        { Conference: 'Conferences', Division: 'Divisions', Team: 'Teams' } as const
                      )[group.category]
                    }
                  </div>
                  {group.items.map((suggestion) => {
                    const idx = flatItems.indexOf(suggestion);
                    const isHighlighted = idx === highlightIndex;
                    return (
                      <button
                        key={suggestion.href}
                        id={`filter-option-${idx}`}
                        role="option"
                        aria-selected={isHighlighted}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          selectSuggestion(suggestion);
                        }}
                        onMouseEnter={() => setHighlightIndex(idx)}
                        className={`flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm transition-colors duration-75 ${
                          isHighlighted
                            ? 'bg-primary/10 text-primary'
                            : 'hover:bg-base-content/[0.03] text-base-content'
                        }`}
                      >
                        {suggestion.logo ? (
                          <Image
                            src={suggestion.logo}
                            alt=""
                            width={22}
                            height={22}
                            className="h-[22px] w-[22px] shrink-0 object-contain"
                            unoptimized
                          />
                        ) : (
                          <span className="bg-base-content/5 text-base-content/40 flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-md text-[10px] font-bold">
                            {suggestion.category === 'Conference'
                              ? suggestion.label[0]
                              : suggestion.label
                                  .split(' ')
                                  .map((w) => w[0])
                                  .join('')}
                          </span>
                        )}
                        <span className="flex flex-col">
                          <span className={`font-medium ${isHighlighted ? '' : ''}`}>
                            {suggestion.label}
                          </span>
                          {suggestion.secondaryLabel && (
                            <span className="text-base-content/40 text-[11px]">
                              {suggestion.secondaryLabel}
                            </span>
                          )}
                        </span>
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-base-content/40 flex items-center justify-center py-6 text-sm">
              {query.trim() ? `No results for "${query}"` : 'No more filters available'}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FilterNav;
