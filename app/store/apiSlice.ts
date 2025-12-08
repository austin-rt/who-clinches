import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

// Base API slice - endpoints will be injected by codegen
export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({ baseUrl: '/api' }),
  tagTypes: ['Games', 'Standings', 'Teams'],
  endpoints: () => ({}),
});

// Export generated API and hooks
export * from './generated-api';
