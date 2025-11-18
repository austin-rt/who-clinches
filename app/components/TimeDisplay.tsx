'use client';

interface TimeDisplayProps {
  date: string;
  timezone: string;
}

const TimeDisplay = ({ date, timezone }: TimeDisplayProps) => {
  const formatDate = (dateString: string, venueTimezone: string) => {
    // ESPN dates are in UTC (ending with "Z"), use stored timezone from database
    const date = new Date(dateString);
    const gameTimezone = venueTimezone || 'America/New_York'; // Fallback to ET

    // Format browser time (user's local time, time only): "12:00pm"
    const browserTime = date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });

    // Format stadium time (venue timezone, time only): "11:00am"
    const stadiumTimeOnly = date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      timeZone: gameTimezone,
    });

    // Combine: "12:00pm (11:00am local)"
    return `${browserTime} (${stadiumTimeOnly} local)`;
  };

  return (
    <div className="text-base-content/60 text-sm md:text-base">{formatDate(date, timezone)}</div>
  );
};

export default TimeDisplay;
