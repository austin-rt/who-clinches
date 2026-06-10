'use client';

interface TimeDisplayProps {
  date: string;
  timezone: string;
  startTimeTBD?: boolean;
}

const TimeDisplay = ({ date, timezone, startTimeTBD }: TimeDisplayProps) => {
  if (startTimeTBD) return <div>TBD</div>;

  const d = new Date(date);
  const gameTimezone = timezone || 'America/New_York';

  const venueTime = d.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    timeZone: gameTimezone,
  });

  const localTime = d.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });

  if (venueTime === localTime) return <div>{venueTime}</div>;

  return (
    <div>
      {venueTime} ({localTime} local)
    </div>
  );
};

export default TimeDisplay;
