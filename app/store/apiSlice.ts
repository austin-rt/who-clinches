import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { GamesResponse, SimulateRequest, SimulateResponse } from '@/lib/api-types';

export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({ baseUrl: '/api' }),
  tagTypes: ['Games', 'Standings', 'Teams'],
  endpoints: (builder) => ({
    getSeasonGameData: builder.query<
      GamesResponse,
      {
        sport: string;
        conf: string;
        season: number;
        week?: string | number;
      }
    >({
      queryFn: async ({ sport, conf, season, week }) => {
        const params = new URLSearchParams();
        params.set('season', season.toString());
        if (week) {
          params.set('week', week.toString());
        }
        const queryString = params.toString();
        try {
          const response = await fetch(`/api/games/${sport}/${conf}?${queryString}`);
          const data = await response.json();
          return { data };
        } catch (error) {
          return { error: { status: 'FETCH_ERROR', error: String(error) } };
        }
      },
      providesTags: ['Games'],
    }),
    simulate: builder.mutation<
      SimulateResponse,
      { sport: string; conf: string; season: number } & SimulateRequest
    >({
      queryFn: async ({ sport, conf, season, ...request }) => {
        try {
          const response = await fetch(`/api/simulate/${sport}/${conf}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              season,
              ...request,
            }),
          });
          const data = await response.json();
          return { data };
        } catch (error) {
          return { error: { status: 'FETCH_ERROR', error: String(error) } };
        }
      },
      invalidatesTags: ['Standings'],
    }),
  }),
});

export const {
  useGetSeasonGameDataQuery,
  useLazyGetSeasonGameDataQuery,
  useSimulateMutation,
} = apiSlice;
