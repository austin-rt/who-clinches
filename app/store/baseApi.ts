import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { RootState } from './store';

export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: '/api',
    prepareHeaders: (headers, { getState }) => {
      const { anonymousId, sessionRecordingURL } = (getState() as RootState).app;
      if (anonymousId) headers.set('X-Anonymous-ID', anonymousId);
      if (sessionRecordingURL) headers.set('X-Session-Recording-URL', sessionRecordingURL);
      return headers;
    },
  }),
  tagTypes: ['Games', 'Standings', 'Teams', 'Stats'],
  endpoints: () => ({}),
});
