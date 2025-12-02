import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { GamesResponse, SimulateRequest, SimulateResponse } from '@/lib/api-types';
import { setLastUpdated } from './uiSlice';

export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({ baseUrl: '/api' }),
  tagTypes: ['Games', 'Standings', 'Teams'],
  endpoints: (builder) => ({
    getSeasonGameDataFromCache: builder.query<
      GamesResponse,
      {
        sport: string;
        conf: string;
        season?: string | number;
        week?: string | number;
        state?: string;
        from?: string;
        to?: string;
      }
    >({
      query: ({ sport, conf, season, week, state, from, to }) => {
        const params = new URLSearchParams();
        if (season) params.set('season', season.toString());
        if (week) params.set('week', week.toString());
        if (state) params.set('state', state);
        if (from) params.set('from', from);
        if (to) params.set('to', to);
        const queryString = params.toString();
        return {
          url: `games/${sport}/${conf}${queryString ? `?${queryString}` : ''}`,
          method: 'GET',
        };
      },
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          if (data?.lastUpdated) {
            dispatch(setLastUpdated(data.lastUpdated));
          }
        } catch {}
      },
      providesTags: ['Games'],
    }),
    getSeasonGameData: builder.query<
      GamesResponse,
      {
        sport: string;
        conf: string;
        season?: string | number;
        week?: string | number;
        state?: string;
        from?: string;
        to?: string;
        force?: boolean;
      }
    >({
      query: ({ sport, conf, season, week, state, from, to, force }) => {
        return {
          url: `games/${sport}/${conf}`,
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: {
            season,
            week,
            state,
            from,
            to,
            force,
          },
        };
      },
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          if (data?.lastUpdated) {
            dispatch(setLastUpdated(data.lastUpdated));
          }
        } catch {}
      },
      providesTags: ['Games'],
    }),
    getLiveGameData: builder.query<
      GamesResponse,
      {
        sport: string;
        conf: string;
        season?: string | number;
        force?: boolean;
      }
    >({
      query: ({ sport, conf, season, force }) => {
        return {
          url: `games/${sport}/${conf}/live`,
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: {
            season,
            force,
          },
        };
      },
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          if (data?.lastUpdated) {
            dispatch(setLastUpdated(data.lastUpdated));
          }
        } catch {}
      },
      providesTags: ['Games'],
    }),
    getSpreadData: builder.query<
      GamesResponse,
      {
        sport: string;
        conf: string;
        season?: string | number;
        week?: string | number;
        force?: boolean;
      }
    >({
      query: ({ sport, conf, season, week, force }) => {
        return {
          url: `games/${sport}/${conf}/spreads`,
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: {
            season,
            week,
            force,
          },
        };
      },
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          if (data?.lastUpdated) {
            dispatch(setLastUpdated(data.lastUpdated));
          }
        } catch {}
      },
      providesTags: ['Games'],
    }),
    simulate: builder.mutation<SimulateResponse, SimulateRequest & { sport: string; conf: string }>(
      {
        query: ({ sport, conf, ...request }) => {
          return {
            url: `simulate/${sport}/${conf}`,
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: request,
          };
        },
        invalidatesTags: ['Standings'],
      }
    ),
  }),
});

export const {
  useGetSeasonGameDataFromCacheQuery,
  useGetSeasonGameDataQuery,
  useLazyGetSeasonGameDataQuery,
  useGetLiveGameDataQuery,
  useGetSpreadDataQuery,
  useSimulateMutation,
} = apiSlice;
