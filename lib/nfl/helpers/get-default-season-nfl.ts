import { getDefaultSeason } from '@/lib/helpers/get-default-season';

export const getDefaultNflSeason = (): Promise<number> => getDefaultSeason();
