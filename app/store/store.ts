import { configureStore } from '@reduxjs/toolkit';
import uiReducer from './uiSlice';
import gamePicksReducer from './gamePicksSlice';
import { apiSlice } from './apiSlice';

export const store = configureStore({
  reducer: {
    ui: uiReducer,
    gamePicks: gamePicksReducer,
    [apiSlice.reducerPath]: apiSlice.reducer,
  },
  middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(apiSlice.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
