'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { useAppSelector } from '../store/hooks';
import { FaXTwitter, FaThreads } from 'react-icons/fa6';
import { IoSendOutline, IoCopyOutline, IoCheckmarkOutline, IoOpenOutline } from 'react-icons/io5';
import IconButton from './IconButton';
import {
  isValidSport,
  isValidConference,
  type SportSlug,
  type CFBConferenceAbbreviation,
} from '@/lib/constants';
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
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
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
          tieFlowGraphs: simulateResponse.tieFlowGraphs,
          games: games ?? [],
        },
      }),
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.url) setShareUrl(data.url);
      })
      .catch(() => {});
  }, [simulateResponse, sport, conf, season, gamePicks, games]);

  if (!shareUrl || !conf || !season) return null;

  const text = `My ${conf.toUpperCase()} ${season} simulation`;
  const tweetURL = `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(text)}`;
  const threadsURL = `https://www.threads.net/intent/post?text=${encodeURIComponent(`${text} ${shareUrl}`)}`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      await navigator.share({ title: text, url: shareUrl });
    }
  };

  return (
    <div className="mx-auto flex w-fit flex-col items-center gap-3 rounded-lg bg-base-300 px-6 py-4">
      <div className="text-sm font-semibold">Share Your Results</div>
      <div className="flex items-center gap-1 rounded-lg bg-base-200 px-2">
        <input
          type="text"
          readOnly
          value={shareUrl}
          className="w-48 bg-transparent py-2 text-xs outline-none sm:w-64"
        />
        <IconButton onClick={handleCopy} title={copied ? 'Copied!' : 'Copy'} showLabel={false}>
          {copied ? <IoCheckmarkOutline size={18} /> : <IoCopyOutline size={18} />}
        </IconButton>
        <IconButton href={shareUrl} title="Open" showLabel={false}>
          <IoOpenOutline size={18} />
        </IconButton>
      </div>
      <div className="flex items-center gap-3">
        <IconButton href={tweetURL} title="X" showLabel={false}>
          <FaXTwitter size={18} />
        </IconButton>
        <IconButton href={threadsURL} title="Threads" showLabel={false}>
          <FaThreads size={18} />
        </IconButton>
        {typeof navigator !== 'undefined' && 'share' in navigator && (
          <IconButton onClick={handleNativeShare} title="Share" showLabel={false}>
            <IoSendOutline size={18} className="-rotate-45" />
          </IconButton>
        )}
      </div>
    </div>
  );
};

export default ShareButton;
