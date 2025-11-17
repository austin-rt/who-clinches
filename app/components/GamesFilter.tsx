'use client';

interface GamesFilterProps {
  showCompleted: boolean;
  onToggle: (show: boolean) => void;
}

const GamesFilter = ({ showCompleted, onToggle }: GamesFilterProps) => {
  const handleClick = () => {
    onToggle(!showCompleted);
  };

  return (
    <div className="mb-4">
      <button
        type="button"
        className="hover:bg-primary/50 btn bg-primary text-primary-content"
        onClick={handleClick}
      >
        {showCompleted ? 'Hide Completed Games' : 'Show Completed Games'}
      </button>
    </div>
  );
};

export default GamesFilter;
