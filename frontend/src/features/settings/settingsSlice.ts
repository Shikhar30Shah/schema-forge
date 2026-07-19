import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export type NamingConvention = 'PascalCase' | 'camelCase';
export type OutputStructure = 'flat' | 'directory';

export interface SettingsState {
  namingConvention: NamingConvention;
  outputStructure: OutputStructure;
  apiPrefix: string;
  authMiddleware: boolean;
}

const STORAGE_KEY = 'schemaforge_settings';

const DEFAULT_STATE: SettingsState = {
  namingConvention: 'PascalCase',
  outputStructure: 'flat',
  apiPrefix: '/api',
  authMiddleware: false,
};

function loadSettings(): SettingsState {
  if (typeof window === 'undefined') {
    return DEFAULT_STATE;
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return { ...DEFAULT_STATE, ...JSON.parse(raw) };
    }
  } catch {
    /* ignore corrupt storage */
  }
  return DEFAULT_STATE;
}

const settingsSlice = createSlice({
  name: 'settings',
  initialState: loadSettings(),
  reducers: {
    setNamingConvention(state, action: PayloadAction<NamingConvention>) {
      state.namingConvention = action.payload;
    },
    setOutputStructure(state, action: PayloadAction<OutputStructure>) {
      state.outputStructure = action.payload;
    },
    setApiPrefix(state, action: PayloadAction<string>) {
      state.apiPrefix = action.payload;
    },
    setAuthMiddleware(state, action: PayloadAction<boolean>) {
      state.authMiddleware = action.payload;
    },
    resetSettings() {
      return DEFAULT_STATE;
    },
  },
});

export const {
  setNamingConvention,
  setOutputStructure,
  setApiPrefix,
  setAuthMiddleware,
  resetSettings,
} = settingsSlice.actions;

export default settingsSlice.reducer;
