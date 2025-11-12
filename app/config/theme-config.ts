import { ConferenceThemes } from '@/types/frontend';

/**
 * Conference theme configuration
 * Maps conference IDs to their default themes
 * Enables multi-conference support without code changes
 */
export const conferenceThemes: ConferenceThemes = {
  '8': {
    defaultTheme: 'sec',
    name: 'SEC',
  },
  // Add more conferences as they're implemented
  // '25': { defaultTheme: 'acc', name: 'ACC' },
  // '12': { defaultTheme: 'big12', name: 'Big 12' },
};

/**
 * Get default theme for a conference
 */
export const getDefaultThemeForConference = (conferenceId: string): string => {
  return conferenceThemes[conferenceId]?.defaultTheme || 'sec';
};
