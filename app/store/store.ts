import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { persistReducer, persistStore } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import uiReducer from './uiSlice';
import gamePicksReducer from './gamePicksSlice';
import { apiSlice } from './apiSlice';

// Persist config for ui slice - exclude lastUpdated (server data, not user preference)
const uiPersistConfig = {
  key: 'ui',
  storage,
  blacklist: ['lastUpdated'],
};

// Persist config for gamePicks slice
const gamePicksPersistConfig = {
  key: 'gamePicks',
  storage,
};

// Create persisted reducers
const persistedUiReducer = persistReducer(uiPersistConfig, uiReducer);
const persistedGamePicksReducer = persistReducer(gamePicksPersistConfig, gamePicksReducer);

// Combine reducers (API slice is not persisted)
const rootReducer = combineReducers({
  ui: persistedUiReducer,
  gamePicks: persistedGamePicksReducer,
  [apiSlice.reducerPath]: apiSlice.reducer,
});

// Configure store with persisted reducer
// Thunk is included by default in getDefaultMiddleware
export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore redux-persist actions
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE', 'persist/PURGE'],
      },
    }).concat(apiSlice.middleware),
});

// Create persistor for PersistGate
export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
