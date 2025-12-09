import { ConferenceThemes } from '@/types/frontend';

export const conferenceThemes: ConferenceThemes = {
  '8': {
    defaultTheme: 'sec',
    name: 'SEC',
  },
  sec: {
    defaultTheme: 'sec',
    name: 'SEC',
  },
  mac: {
    defaultTheme: 'mac',
    name: 'MAC',
  },
  acc: {
    defaultTheme: 'acc',
    name: 'ACC',
  },
  b1g: {
    defaultTheme: 'sec',
    name: 'Big Ten',
  },
};

export const getDefaultThemeForConference = (conferenceId: string): string => {
  return conferenceThemes[conferenceId]?.defaultTheme || 'sec';
};
