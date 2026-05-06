const DAY_MAP: Record<string, number> = {
  Sunday: 0,
  Monday: 1,
  Tuesday: 2,
  Wednesday: 3,
  Thursday: 4,
  Friday: 5,
  Saturday: 6,
};

/**
 * Calculates seconds until the next occurrence of a given weekday at a
 * specified hour in a specified timezone. If it IS the target day but before
 * the target hour, returns seconds until later today. Otherwise returns
 * seconds until the same hour on the next occurrence of that day.
 *
 * @param targetDay - 0 (Sun) through 6 (Sat)
 * @param hour - 0-23 in the target timezone
 * @param timezone - IANA timezone string
 * @returns Seconds until target (minimum 1, maximum 8 days)
 */
export const calculateNextWeekdayRevalidate = (
  targetDay: number,
  hour: number = 5,
  timezone: string = 'America/New_York'
): number => {
  const now = new Date();

  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    hour: 'numeric',
    hour12: false,
    weekday: 'long',
  });

  const parts = formatter.formatToParts(now);
  const getPart = (type: string) => parts.find((p) => p.type === type)?.value;

  const currentDayOfWeek = DAY_MAP[getPart('weekday') || 'Sunday'];
  const currentHour = parseInt(getPart('hour') || '0', 10);

  let daysUntil: number;
  if (currentDayOfWeek === targetDay && currentHour < hour) {
    daysUntil = 0;
  } else {
    daysUntil = (targetDay - currentDayOfWeek + 7) % 7 || 7;
  }

  const targetDate = new Date(now);
  targetDate.setDate(now.getDate() + daysUntil);

  const dateFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });

  const dateParts = dateFormatter.formatToParts(targetDate);
  const getDatePart = (type: string) => dateParts.find((p) => p.type === type)?.value;
  const year = parseInt(getDatePart('year') || '2025', 10);
  const month = parseInt(getDatePart('month') || '1', 10);
  const day = parseInt(getDatePart('day') || '1', 10);

  const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T${String(hour).padStart(2, '0')}:00:00`;
  const localDate = new Date(dateStr);

  const utcDate = new Date(localDate.toLocaleString('en-US', { timeZone: 'UTC' }));
  const tzDate = new Date(localDate.toLocaleString('en-US', { timeZone: timezone }));
  const offset = utcDate.getTime() - tzDate.getTime();

  const targetInUtc = new Date(localDate.getTime() - offset);
  const secondsUntil = Math.floor((targetInUtc.getTime() - now.getTime()) / 1000);

  return Math.max(1, Math.min(secondsUntil, 8 * 24 * 60 * 60));
};

/** Seconds until next Saturday at 11 AM ET. */
export const calculateNextSaturdayRevalidate = (): number =>
  calculateNextWeekdayRevalidate(6, 11, 'America/New_York');

/** Seconds until next Sunday at 2 PM ET (AP poll releases ~2 PM ET). */
export const calculateNextSundayRevalidate = (): number =>
  calculateNextWeekdayRevalidate(0, 14, 'America/New_York');
