import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

// Base API slice - endpoints will be injected by codegen into api.ts
// This is the manual configuration file; api.ts is the generated entry point
export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({ baseUrl: '/api' }),
  tagTypes: ['Games', 'Standings', 'Teams', 'Stats'],
  endpoints: () => ({}),
});
