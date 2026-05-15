'use client';

import { BsTrophy } from 'react-icons/bs';
import { Button } from '@/app/components/Button';

interface ChatTriggerButtonProps {
  onClick: () => void;
  className?: string;
}

const ChatTriggerButton = ({ onClick, className }: ChatTriggerButtonProps) => (
  <Button.Stroked color="primary" onClick={onClick} className={className}>
    <div className="flex items-center gap-2">
      <BsTrophy className="h-4 w-4 fill-current" />
      <span className="text-xs font-semibold">Path to the Title</span>
    </div>
  </Button.Stroked>
);

export default ChatTriggerButton;
