'use client';

interface TimeDisplayProps {
  date: string;
  timezone: string;
  completed?: boolean;
}

const TimeDisplay = ({ date, timezone, completed }: TimeDisplayProps) => {
  const d = new Date(date);
  const isMidnightUTC = d.getUTCHours() === 0 && d.getUTCMinutes() === 0;

  if (isMidnightUTC && !completed) return <div>TBD</div>;

  const gameTimezone = timezone || 'America/New_York';

  const browserTime = d.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });

  const stadiumTime = d.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    timeZone: gameTimezone,
  });

  if (browserTime === stadiumTime) return <div>{browserTime}</div>;

  return (
    <div>
      {browserTime} ({stadiumTime} local)
    </div>
  );
};

export default TimeDisplay;
