type TimeInput = string | number | Date;

const toMs = (input: TimeInput): number => {
  if (input instanceof Date) return input.getTime();
  if (typeof input === 'number') return input;
  return new Date(input).getTime();
};

const UNITS: [number, string][] = [
  [525960, 'y'],
  [43830, 'mo'],
  [1440, 'd'],
  [60, 'h'],
  [1, 'm'],
];

const buildParts = (totalMinutes: number): string[] => {
  const parts: string[] = [];
  let remaining = totalMinutes;
  for (const [size, label] of UNITS) {
    if (remaining >= size) {
      const count = Math.floor(remaining / size);
      parts.push(`${count}${label}`);
      remaining -= count * size;
    }
  }
  return parts;
};

export const timeAgo = (input: TimeInput): string => {
  const totalMinutes = Math.floor((Date.now() - toMs(input)) / 60000);
  if (totalMinutes < 1) return 'just now';
  return `${buildParts(totalMinutes).join(' ')} ago`;
};

export const timeLeft = (input: TimeInput): string => {
  const diff = toMs(input) - Date.now();
  if (diff <= 0) return 'expired';
  const totalMinutes = Math.floor(diff / 60000);
  if (totalMinutes < 1) return '< 1m';
  return buildParts(totalMinutes).join(' ');
};

export const ttlLeft = (seconds: number): string => {
  if (seconds < 0) return 'never';
  return timeLeft(Date.now() + seconds * 1000);
};

export const shortDateTime = (input: TimeInput): string => {
  const d = new Date(toMs(input));
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};
