/**
 * Calculates seconds until next Monday at specified hour in specified timezone.
 * Used for Next.js unstable_cache revalidation to invalidate on Monday mornings.
 * 
 * @param hour - Hour of day (0-23) in the specified timezone, default 5 (5 AM)
 * @param timezone - IANA timezone string, default 'America/New_York'
 * @returns Seconds until next Monday at specified hour (minimum 1 second)
 */
export const calculateNextMondayRevalidate = (
  hour: number = 5,
  timezone: string = 'America/New_York'
): number => {
  const now = new Date();
  
  // Get current time in the target timezone
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    hour: 'numeric',
    hour12: false,
    weekday: 'long',
  });
  
  const parts = formatter.formatToParts(now);
  const getPart = (type: string) => parts.find(p => p.type === type)?.value;
  
  const currentDay = getPart('weekday');
  const currentHour = parseInt(getPart('hour') || '0', 10);
  
  // Map day name to day of week (0 = Sunday, 1 = Monday, etc.)
  const dayMap: Record<string, number> = {
    'Sunday': 0,
    'Monday': 1,
    'Tuesday': 2,
    'Wednesday': 3,
    'Thursday': 4,
    'Friday': 5,
    'Saturday': 6,
  };
  
  const currentDayOfWeek = dayMap[currentDay || 'Sunday'];
  
  // Calculate days until next Monday
  let daysUntilMonday: number;
  if (currentDayOfWeek === 1 && currentHour < hour) {
    // It's Monday and before the specified hour, revalidate today
    daysUntilMonday = 0;
  } else {
    // Calculate days until next Monday
    // Monday is day 1, so: (8 - currentDayOfWeek) % 7 gives us days until next Monday
    daysUntilMonday = (8 - currentDayOfWeek) % 7 || 7;
  }
  
  // Find next Monday by iterating days
  const targetDate = new Date(now);
  targetDate.setDate(now.getDate() + daysUntilMonday);
  
  // Get date components in target timezone
  const dateFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  
  const dateParts = dateFormatter.formatToParts(targetDate);
  const getDatePart = (type: string) => dateParts.find(p => p.type === type)?.value;
  const year = parseInt(getDatePart('year') || '2025', 10);
  const month = parseInt(getDatePart('month') || '1', 10);
  const day = parseInt(getDatePart('day') || '1', 10);
  
  // Create date string for Monday at specified hour (in timezone)
  const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T${String(hour).padStart(2, '0')}:00:00`;
  
  // Create date object - this will be interpreted as local time
  // We need to convert from timezone to UTC
  // Simple approach: create date, then adjust for timezone offset
  const localDate = new Date(dateStr);
  
  // Get the timezone offset for this date
  // Create a date in UTC and compare with timezone representation
  const utcDate = new Date(localDate.toLocaleString('en-US', { timeZone: 'UTC' }));
  const tzDate = new Date(localDate.toLocaleString('en-US', { timeZone: timezone }));
  const offset = utcDate.getTime() - tzDate.getTime();
  
  // Target time in UTC
  const targetInUtc = new Date(localDate.getTime() - offset);
  
  // Calculate seconds until target
  const secondsUntil = Math.floor((targetInUtc.getTime() - now.getTime()) / 1000);
  
  // Ensure minimum 1 second and maximum 8 days (safety check)
  return Math.max(1, Math.min(secondsUntil, 8 * 24 * 60 * 60));
};
