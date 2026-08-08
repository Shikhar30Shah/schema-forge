import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../features/auth/authSlice';
import generationReducer from '../features/generation/generationSlice';
import historyReducer from '../features/history/historySlice';
import settingsReducer from '../features/settings/settingsSlice';
import toastReducer from '../features/toast/toastSlice';
import { toastMiddleware } from '../middleware/toastMiddleware';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    generation: generationReducer,
    history: historyReducer,
    settings: settingsReducer,
    toast: toastReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(toastMiddleware.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
