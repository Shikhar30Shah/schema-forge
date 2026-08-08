import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { signIn, signOut, signUp, type AuthResponse, type AuthUser } from '../../lib/api';

function getStoredAuth() {
  try {
    const token = window.localStorage.getItem('schemaforge_token');
    const rawUser = window.localStorage.getItem('schemaforge_user');
    if (!token || !rawUser) return null;
    const user = JSON.parse(rawUser) as AuthUser;
    if (!user || !user.id || !user.email) return null;
    return { user, token };
  } catch {
    window.localStorage.removeItem('schemaforge_token');
    window.localStorage.removeItem('schemaforge_user');
    return null;
  }
}

export type AuthState = {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
};

const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  status: 'idle',
  error: null,
};

export const bootstrapAuth = createAsyncThunk<AuthResponse | null, void, { rejectValue: string }>(
  'auth/bootstrapAuth',
  async (_, thunkAPI) => {
    try {
      const stored = getStoredAuth();
      return stored || null;
    } catch (error) {
      window.localStorage.removeItem('schemaforge_token');
      window.localStorage.removeItem('schemaforge_user');
      return thunkAPI.rejectWithValue((error as Error).message);
    }
  }
);

export const loginUser = createAsyncThunk<AuthResponse, { email: string; password: string }, { rejectValue: string }>(
  'auth/loginUser',
  async (payload, thunkAPI) => {
    try {
      return await signIn(payload);
    } catch (error) {
      return thunkAPI.rejectWithValue((error as Error).message);
    }
  }
);

export const registerUser = createAsyncThunk<AuthResponse, { name: string; email: string; password: string }, { rejectValue: string }>(
  'auth/registerUser',
  async (payload, thunkAPI) => {
    try {
      return await signUp(payload);
    } catch (error) {
      return thunkAPI.rejectWithValue((error as Error).message);
    }
  }
);

export const logoutUser = createAsyncThunk<void, string | null, { rejectValue: string }>(
  'auth/logoutUser',
  async (token, thunkAPI) => {
    try {
      if (token) {
        await signOut(token);
      }
      window.localStorage.removeItem('schemaforge_token');
      window.localStorage.removeItem('schemaforge_user');
    } catch (error) {
      window.localStorage.removeItem('schemaforge_token');
      window.localStorage.removeItem('schemaforge_user');
      return thunkAPI.rejectWithValue((error as Error).message);
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setAuthUser(state, action: PayloadAction<{ user: AuthUser; token: string }>) {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.isAuthenticated = true;
      state.error = null;
    },
    clearAuthError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(bootstrapAuth.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(bootstrapAuth.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.user = action.payload?.user ?? null;
        state.token = action.payload?.token ?? null;
        state.isAuthenticated = Boolean(action.payload?.token);
        state.error = null;
      })
      .addCase(bootstrapAuth.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || 'Unable to restore session';
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
      })
      .addCase(loginUser.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || 'Unable to sign in';
      })
      .addCase(registerUser.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || 'Unable to create account';
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.status = 'idle';
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
        state.error = null;
      })
      .addCase(logoutUser.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || 'Unable to sign out';
      });
  },
});

export const { setAuthUser, clearAuthError } = authSlice.actions;
export default authSlice.reducer;
