import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export type ToastState = {
  open: boolean;
  message: string;
};

const initialState: ToastState = {
  open: false,
  message: '',
};

const toastSlice = createSlice({
  name: 'toast',
  initialState,
  reducers: {
    showToast(state, action: PayloadAction<string>) {
      state.open = true;
      state.message = action.payload;
    },
    hideToast(state) {
      state.open = false;
      state.message = '';
    },
  },
});

export const { showToast, hideToast } = toastSlice.actions;
export default toastSlice.reducer;
