import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import {
  GamesResponse,
  SimulateRequest,
  SimulateResponse,
} from '@/lib/api-types';
import { setLastUpdated } from './uiSlice';

export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({ baseUrl: '/api' }),
  tagTypes: ['Games', 'Standings'],
  endpoints: (builder) => ({
    getGames: builder.query<
      GamesResponse,
      { sport: string; conf: string; season?: string; week?: string; state?: string; from?: string; to?: string }
    >({
      query: ({ sport, conf, season, week, state, from, to }) => {
        const searchParams = new URLSearchParams();
        if (season) searchParams.set('season', season);
        if (week) searchParams.set('week', week);
        if (state) searchParams.set('state', state);
        if (from) searchParams.set('from', from);
        if (to) searchParams.set('to', to);

        const queryString = searchParams.toString();
        return `games/${sport}/${conf}${queryString ? `?${queryString}` : ''}`;
      },
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          if (data?.lastUpdated) {
            dispatch(setLastUpdated(data.lastUpdated));
          }
        } catch {
        }
      },
      providesTags: ['Games'],
    }),
    simulate: builder.mutation<
      SimulateResponse,
      SimulateRequest & { sport: string; conf: string }
    >({
      query: ({ sport, conf, ...request }) => {
        return {
          url: `simulate/${sport}/${conf}`,
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: request,
        };
      },
      invalidatesTags: ['Standings'],
    }),
  }),
});

export const { useGetGamesQuery, useSimulateMutation } = apiSlice;
