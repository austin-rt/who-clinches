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

    // Format in browser's local timezone (user's time)
    const userTime = date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });

    // Get user's timezone abbreviation
    const userTimeWithTz = date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      timeZoneName: 'short',
    });
    const userTzAbbr = userTimeWithTz.split(' ').pop() || '';

    // Format game's local time (time only, no date)
    const gameTimeOnly = date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      timeZone: gameTimezone,
    });

    // Get game's timezone abbreviation
    const gameTzAbbr =
      date
        .toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          timeZoneName: 'short',
          timeZone: gameTimezone,
        })
        .split(' ')
        .pop() || '';

    // Format game's local time with date for comparison
    const gameTimeWithDate = date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      timeZone: gameTimezone,
    });

    // If user timezone matches game timezone, just show once
    if (userTime === gameTimeWithDate && userTzAbbr === gameTzAbbr) {
      return `${userTime} ${userTzAbbr}`;
    }

    // Otherwise show user time with game time (time only) in parentheses
    return `${userTime} ${userTzAbbr} (${gameTimeOnly} ${gameTzAbbr})`;
  };

  return <div className="text-base-content/60 text-base">{formatDate(date, timezone)}</div>;
};

export default TimeDisplay;
