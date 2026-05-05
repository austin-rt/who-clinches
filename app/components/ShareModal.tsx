'use client';

import { useState } from 'react';
import { FaXTwitter, FaThreads } from 'react-icons/fa6';
import { IoSendOutline, IoCopyOutline, IoCheckmarkOutline } from 'react-icons/io5';
import IconButton from './IconButton';
import { Button } from './Button';
import { useUIState } from '../store/useUI';

interface ShareModalProps {
  url: string;
  conf: string;
  season: number;
  open: boolean;
  onClose: () => void;
}

const ShareModal = ({ url, conf, season, open, onClose }: ShareModalProps) => {
  const [copied, setCopied] = useState(false);
  const { mode } = useUIState();

  const handleNativeShare = async () => {
    if (navigator.share) {
      await navigator.share({ title: `My ${conf.toUpperCase()} ${season} simulation`, url });
    }
  };

  const text = `My ${conf.toUpperCase()} ${season} simulation`;

  const tweetURL = `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`;
  const threadsURL = `https://www.threads.net/intent/post?text=${encodeURIComponent(`${text} ${url}`)}`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!open) return null;

  return (
    <dialog className="modal modal-open" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-bold">Share Results</h3>

        <div className="mt-4 flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={url}
              className="input-bordered input flex-1 text-sm"
            />
            <IconButton
              onClick={handleCopy}
              title={copied ? 'Copied!' : 'Copy URL'}
              showLabel={false}
            >
              {copied ? <IoCheckmarkOutline size={20} /> : <IoCopyOutline size={20} />}
            </IconButton>
          </div>

          <div className="flex justify-center gap-3">
            <IconButton href={tweetURL} title="Share on X" showLabel={false}>
              <FaXTwitter size={20} />
            </IconButton>
            <IconButton href={threadsURL} title="Share on Threads" showLabel={false}>
              <FaThreads size={20} />
            </IconButton>
            {typeof navigator !== 'undefined' && 'share' in navigator && (
              <IconButton onClick={handleNativeShare} title="Share" showLabel={false}>
                <IoSendOutline size={20} className="-rotate-45" />
              </IconButton>
            )}
          </div>
        </div>

        <div className="modal-action">
          <Button.Stroked
            size="sm"
            onClick={onClose}
            className={mode === 'dark' ? 'border-white text-white hover:bg-white/10' : ''}
          >
            Close
          </Button.Stroked>
        </div>
      </div>
    </dialog>
  );
};

export default ShareModal;
