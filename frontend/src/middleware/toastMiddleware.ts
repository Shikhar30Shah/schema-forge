import { createListenerMiddleware, isRejectedWithValue } from '@reduxjs/toolkit';
import { showToast } from '@/features/toast/toastSlice';

export const toastMiddleware = createListenerMiddleware();

toastMiddleware.startListening({
  predicate: (action) => isRejectedWithValue(action),
  effect: async (action, listenerApi) => {
    const errorMessage =
      action.payload?.message || action.error?.message || 'Something went wrong.';

    listenerApi.dispatch(showToast(errorMessage));
  },
});
