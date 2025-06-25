import { configureStore } from '@reduxjs/toolkit';
import courseReducer from './courseSlice';

export const store = configureStore({
  reducer: {
    courses: courseReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST'],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch; 