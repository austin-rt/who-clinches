'use client';

import { useAppDispatch } from '../store/hooks';
import { setView } from '../store/uiSlice';
import { useUIState } from '@/app/store/useUI';

const ViewModeButton = () => {
  const dispatch = useAppDispatch();
  const { view } = useUIState();

  return (
    <div className="inline-flex rounded-lg bg-base-300 p-0.5 text-xs font-medium">
      <button
        type="button"
        onClick={() => dispatch(setView('picks'))}
        className={`rounded-md px-3 py-1.5 transition-colors ${
          view === 'picks'
            ? 'bg-base-100 text-base-content shadow-sm'
            : 'text-base-content/60 hover:text-base-content'
        }`}
      >
        Picks
      </button>
      <button
        type="button"
        onClick={() => dispatch(setView('scores'))}
        className={`rounded-md px-3 py-1.5 transition-colors ${
          view === 'scores'
            ? 'bg-base-100 text-base-content shadow-sm'
            : 'text-base-content/60 hover:text-base-content'
        }`}
      >
        Scores
      </button>
    </div>
  );
};

export default ViewModeButton;
