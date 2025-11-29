'use client';

const LiveBadge = () => {
  return (
    <div className="flex items-center gap-2">
      <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-red-500"></span>
      <span className="text-xs font-bold text-red-500">LIVE</span>
    </div>
  );
};

export default LiveBadge;

