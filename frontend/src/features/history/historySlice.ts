import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { getHistory, type HistoryEntry } from '../../lib/api';

export type HistoryState = {
  entries: HistoryEntry[];
  loading: boolean;
  error: string | null;
};

const initialState: HistoryState = {
  entries: [],
  loading: false,
  error: null,
};

export const loadHistory = createAsyncThunk<
  HistoryEntry[],
  { token: string | null },
  { rejectValue: string }
>('history/loadHistory', async ({ token }, thunkAPI) => {
  if (!token) {
    return [];
  }
  try {
    return await getHistory(token);
  } catch (error) {
    return thunkAPI.rejectWithValue((error as Error).message);
  }
});

const historySlice = createSlice({
  name: 'history',
  initialState,
  reducers: {
    setEntries(state, action: PayloadAction<HistoryEntry[]>) {
      state.entries = action.payload;
    },
    clearHistory(state) {
      state.entries = [];
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadHistory.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loadHistory.fulfilled, (state, action) => {
        state.loading = false;
        state.entries = action.payload;
      })
      .addCase(loadHistory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Unable to load history.';
      });
  },
});

export const { setEntries, clearHistory } = historySlice.actions;
export default historySlice.reducer;
