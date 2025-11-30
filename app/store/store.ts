import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { persistReducer, persistStore } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import expireReducer from 'redux-persist-expire';
import uiReducer from './uiSlice';
import gamePicksReducer from './gamePicksSlice';
import { apiSlice } from './apiSlice';

const uiPersistConfig = {
  key: 'ui',
  storage,
  blacklist: ['lastUpdated', 'standingsOpen'],
};

const gamePicksPersistConfig = {
  key: 'gamePicks',
  storage,
  transforms: [
    expireReducer('gamePicks', {
      expireSeconds: 3600, // 1 hour
      expiredState: { picks: {} }, // Clear all picks when expired
      autoExpire: true,
    }),
  ],
};

const persistedUiReducer = persistReducer(uiPersistConfig, uiReducer);
const persistedGamePicksReducer = persistReducer(gamePicksPersistConfig, gamePicksReducer);

const rootReducer = combineReducers({
  ui: persistedUiReducer,
  gamePicks: persistedGamePicksReducer,
  [apiSlice.reducerPath]: apiSlice.reducer,
});

export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE', 'persist/PURGE'],
      },
    }).concat(apiSlice.middleware),
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
