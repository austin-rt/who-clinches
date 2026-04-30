import { createHash } from 'crypto';
import stringify from 'fast-json-stable-stringify';

export const hashPayload = (
  sport: string,
  conf: string,
  body: unknown
): string => {
  const canonical = stringify({ body, conf, sport });
  return createHash('sha256').update(canonical).digest('hex');
};
