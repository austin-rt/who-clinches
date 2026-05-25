import type { NflRuleResult } from '../types';

export const applyNetTDs = (tiedTeams: string[]): NflRuleResult => ({
  winners: [...tiedTeams],
  detail: 'Net touchdowns — unresolvable in simulation',
});
