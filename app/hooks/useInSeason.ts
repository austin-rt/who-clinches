import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/app/store/hooks';
import { setIsInSeason } from '@/app/store/appSlice';

export const useInSeason = () => {
  const dispatch = useAppDispatch();
  const isInSeason = useAppSelector((state) => state.app.isInSeason);

  useEffect(() => {
    if (isInSeason === null) {
      void fetch('/api/season-status')
        .then((res) => res.json())
        .then((data) => {
          if (data.inSeason !== undefined) {
            dispatch(setIsInSeason(data.inSeason));
          }
        })
        .catch(() => {
          dispatch(setIsInSeason(false));
        });
    }
  }, [dispatch, isInSeason]);

  return isInSeason;
};

