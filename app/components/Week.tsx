'use client';

import { GameLean } from '@/lib/types';
import WeekAccordion from './WeekAccordion';

interface WeekProps {
  weekNumber: number;
  games: GameLean[];
}

const Week = ({ weekNumber, games }: WeekProps) => {
  return <WeekAccordion weekNumber={weekNumber} games={games} />;
};

export default Week;
