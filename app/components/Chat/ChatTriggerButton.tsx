'use client';

import { IoChatbubblesOutline } from 'react-icons/io5';
import { Button } from '@/app/components/Button';

interface ChatTriggerButtonProps {
  onClick: () => void;
  className?: string;
}

const ChatTriggerButton = ({ onClick, className }: ChatTriggerButtonProps) => (
  <Button.Stroked
    color="primary"
    onClick={onClick}
    className={className}
    data-testid="chat-trigger"
  >
    <div className="flex items-center gap-2">
      <IoChatbubblesOutline className="h-4 w-4" />
      <span className="text-xs font-semibold">Path to the Title</span>
    </div>
  </Button.Stroked>
);

export default ChatTriggerButton;
