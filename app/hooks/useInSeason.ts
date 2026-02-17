import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/app/store/hooks';
import { setIsInSeason, setSeason } from '@/app/store/appSlice';

export const useInSeason = () => {
  const dispatch = useAppDispatch();
  const isInSeason = useAppSelector((state) => state.app.isInSeason);
  const season = useAppSelector((state) => state.app.season);

  useEffect(() => {
    if (isInSeason === null || season === null) {
      void fetch('/api/season-status')
        .then((res) => res.json())
        .then((data: { inSeason?: boolean; season?: number }) => {
          if (data.inSeason !== undefined) {
            dispatch(setIsInSeason(data.inSeason));
          }
          if (data.season !== undefined && season === null) {
            dispatch(setSeason(data.season));
          }
        })
        .catch(() => {
          dispatch(setIsInSeason(false));
        });
    }
  }, [dispatch, isInSeason, season]);

  return isInSeason;
};

