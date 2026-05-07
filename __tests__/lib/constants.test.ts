import { isValidSport, isValidConference, getConferenceMetadata } from '@/lib/constants';

describe('isValidSport', () => {
  it('returns true for cfb, false for unknown', () => {
    expect(isValidSport('cfb')).toBe(true);
    expect(isValidSport('nfl')).toBe(false);
    expect(isValidSport('')).toBe(false);
  });
});

describe('isValidConference / getConferenceMetadata', () => {
  it('returns metadata for valid conference, null for invalid', () => {
    expect(isValidConference('sec')).toBe(true);
    const meta = getConferenceMetadata('sec');
    expect(meta).not.toBeNull();
    expect(meta!.cfbdId).toBe('SEC');
    expect(meta!.name).toBe('SEC');

    expect(isValidConference('xyz')).toBe(false);
    expect(getConferenceMetadata('xyz')).toBeNull();
  });
});
