'use client';

import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { HiXMark } from 'react-icons/hi2';
import IconButton from './IconButton';

interface FlowChartLightboxProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

const FlowChartLightbox = ({ isOpen, onClose, title, children }: FlowChartLightboxProps) => {
  const scrollYRef = useRef(0);

  useEffect(() => {
    if (!isOpen) return;
    scrollYRef.current = window.scrollY;
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollYRef.current}px`;
    document.body.style.width = '100%';
    return () => {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      window.scrollTo(0, scrollYRef.current);
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className="fixed inset-0 z-50 flex items-center justify-center"
    >
      {/* Backdrop — desktop only */}
      <div className="absolute inset-0 hidden bg-black/60 lg:block" onClick={onClose} />

      {/* Mobile: fullscreen / Desktop: centered card */}
      <div className="relative z-10 flex h-full w-full flex-col bg-base-100 lg:h-[85vh] lg:max-h-[85vh] lg:w-[1200px] lg:max-w-[90vw] lg:rounded-2xl lg:shadow-2xl">
        <div className="flex items-center justify-between border-b border-base-300 px-4 py-3">
          <span className="truncate text-sm font-semibold">{title}</span>
          <IconButton onClick={onClose} title="Close" showLabel={false}>
            <HiXMark size={20} />
          </IconButton>
        </div>
        <div className="relative flex-1 overflow-hidden lg:rounded-b-2xl">{children}</div>
      </div>
    </div>,
    document.body
  );
};

export default FlowChartLightbox;
