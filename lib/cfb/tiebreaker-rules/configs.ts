import { ConferenceTiebreakerConfig } from './core/types';
import { SEC_TIEBREAKER_CONFIG } from './sec/config';
import { MAC_TIEBREAKER_CONFIG } from './mac/config';

export const CONFERENCE_CONFIGS: Record<string, ConferenceTiebreakerConfig> = {
  SEC: SEC_TIEBREAKER_CONFIG,
  MAC: MAC_TIEBREAKER_CONFIG,
};
