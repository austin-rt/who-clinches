'use client';

import { useAppSelector } from '@/app/store/hooks';

const LastUpdated = () => {
  const lastUpdated = useAppSelector((state) => state.ui.lastUpdated);

  if (!lastUpdated) {
    return null;
  }

  return (
    <div className="text-base-content/50 text-right text-base">
      <div>Scores last updated</div>
      <div>
        {new Date(lastUpdated).toLocaleString('en-US', {
          month: 'numeric',
          day: 'numeric',
          year: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
        })}
      </div>
    </div>
  );
};

export default LastUpdated;
