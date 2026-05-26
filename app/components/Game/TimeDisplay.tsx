'use client';

interface TimeDisplayProps {
  date: string;
  timezone: string;
}

const TimeDisplay = ({ date, timezone }: TimeDisplayProps) => {
  const formatDate = (dateString: string, venueTimezone: string) => {
    const date = new Date(dateString);
    const gameTimezone = venueTimezone || 'America/New_York';

    const browserTime = date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });

    const stadiumTimeOnly = date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      timeZone: gameTimezone,
    });

    if (browserTime === stadiumTimeOnly) {
      return browserTime;
    }

    return `${browserTime} (${stadiumTimeOnly} local)`;
  };

  return <div>{formatDate(date, timezone)}</div>;
};

export default TimeDisplay;
