'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { useAppSelector } from '../store/hooks';
import { Button } from './Button';
import ShareModal from './ShareModal';
import {
  isValidSport,
  isValidConference,
  type SportSlug,
  type CFBConferenceAbbreviation,
} from '@/lib/constants';
import { useUIState } from '../store/useUI';
import type { SimulateResponse } from '../store/api';
import type { GameLean } from '@/lib/types';

interface ShareButtonProps {
  simulateResponse: SimulateResponse | null;
  games: GameLean[] | undefined;
}

const ShareButton = ({ simulateResponse, games }: ShareButtonProps) => {
  const params = useParams();
  const sportParam = params.sport as string;
  const confParam = params.conf as string;
  const season = useAppSelector((state) => state.app.season);
  const gamePicks = useAppSelector((state) => state.gamePicks.picks);
  const { mode } = useUIState();
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const fetchedHashRef = useRef<string | null>(null);

  const isValid = isValidSport(sportParam) && isValidConference(confParam);
  const sport = isValid ? (sportParam as SportSlug) : null;
  const conf = isValid ? (confParam as CFBConferenceAbbreviation) : null;

  useEffect(() => {
    if (!simulateResponse || !sport || !conf || !season) return;

    const overrides: Record<string, { homeScore: number; awayScore: number }> = {};
    Object.entries(gamePicks).forEach(([gameId, pick]) => {
      overrides[gameId] = {
        homeScore: (pick as { homeScore: number; awayScore: number }).homeScore,
        awayScore: (pick as { homeScore: number; awayScore: number }).awayScore,
      };
    });

    const hash = JSON.stringify({ season, overrides });
    if (fetchedHashRef.current === hash) return;
    fetchedHashRef.current = hash;

    const controller = new AbortController();
    let active = true;

    void fetch(`/api/share/${sport}/${conf}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        season,
        overrides,
        results: {
          standings: simulateResponse.standings,
          championship: simulateResponse.championship,
          tieLogs: simulateResponse.tieLogs,
          games: games ?? [],
        },
      }),
      signal: controller.signal,
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (active && data?.url) setShareUrl(data.url);
      })
      .catch(() => {});

    return () => {
      active = false;
      controller.abort();
    };
  }, [simulateResponse, sport, conf, season, gamePicks, games]);

  if (!simulateResponse || !conf || !season) return null;

  return (
    <>
      <Button
        size="md"
        color={mode === 'dark' ? 'accent' : 'primary'}
        onClick={() => setModalOpen(true)}
        loading={!shareUrl}
        disabled={!shareUrl}
        className="w-1/2 text-xs sm:w-fit"
      >
        Share Results
      </Button>
      {shareUrl && modalOpen && (
        <ShareModal
          url={shareUrl}
          conf={conf}
          season={season}
          open={modalOpen}
          onClose={() => setModalOpen(false)}
        />
      )}
    </>
  );
};

export default ShareButton;
