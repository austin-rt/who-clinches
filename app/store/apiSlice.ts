import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import {
  GamesResponse,
  GamesQueryParams,
  SimulateRequest,
  SimulateResponse,
} from '@/lib/api-types';
import { setLastUpdated } from './uiSlice';

export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({ baseUrl: '/api' }),
  tagTypes: ['Games', 'Standings'],
  endpoints: (builder) => ({
    getGames: builder.query<GamesResponse, GamesQueryParams>({
      query: (params) => {
        const searchParams = new URLSearchParams();
        if (params.conferenceId) searchParams.set('conferenceId', params.conferenceId);
        if (params.season) searchParams.set('season', params.season);
        if (params.week) searchParams.set('week', params.week);
        if (params.state) searchParams.set('state', params.state);
        if (params.from) searchParams.set('from', params.from);
        if (params.to) searchParams.set('to', params.to);
        if (params.sport) searchParams.set('sport', params.sport);
        if (params.league) searchParams.set('league', params.league);

        const queryString = searchParams.toString();
        return `games${queryString ? `?${queryString}` : ''}`;
      },
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          if (data?.lastUpdated) {
            dispatch(setLastUpdated(data.lastUpdated));
          }
        } catch {
          // Ignore errors - don't update lastUpdated if query fails
        }
      },
      providesTags: ['Games'],
    }),
    simulate: builder.mutation<SimulateResponse, SimulateRequest>({
      query: (body) => ({
        url: 'simulate',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
      }),
      invalidatesTags: ['Standings'],
    }),
  }),
});

export const { useGetGamesQuery, useSimulateMutation } = apiSlice;
