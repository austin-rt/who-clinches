import { ConferenceThemes } from '@/types/frontend';

export const conferenceThemes: ConferenceThemes = {
  '8': {
    defaultTheme: 'sec',
    name: 'SEC',
  },
};

export const getDefaultThemeForConference = (conferenceId: string): string => {
  return conferenceThemes[conferenceId]?.defaultTheme || 'sec';
};
