import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { persistReducer, persistStore } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import uiReducer from './uiSlice';
import appReducer from './appSlice';
import gamePicksReducer from './gamePicksSlice';
import { api } from './api';

const uiPersistConfig = {
  key: 'ui',
  storage,
  blacklist: ['standingsOpen'],
};

const appPersistConfig = {
  key: 'app',
  storage,
  blacklist: ['isInSeason', 'season', 'sessionRecordingURL'],
};

const persistedUiReducer = persistReducer(uiPersistConfig, uiReducer);
const persistedAppReducer = persistReducer(appPersistConfig, appReducer);

const rootReducer = combineReducers({
  ui: persistedUiReducer,
  app: persistedAppReducer,
  gamePicks: gamePicksReducer,
  [api.reducerPath]: api.reducer,
});

export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE', 'persist/PURGE'],
      },
    }).concat(api.middleware),
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
