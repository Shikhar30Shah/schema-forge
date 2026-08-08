import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { fetchGeneratedCode, fetchGeneratedCodeFromImage, type GenerateResponse, type HistoryEntry } from '../../lib/api';

export type GenerationStatus = 'ready' | 'loading' | 'error' | 'copied';

const DEFAULT_MODELS = `// Mongoose Model
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  id: { type: Number, unique: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema);`;

const DEFAULT_ROUTES = `// Express Routes
const express = require('express');
const router = express.Router();
const User = require('../models/User');

router.get('/users', async (req, res) => {
  const users = await User.find();
  res.json(users);
});

router.post('/users', async (req, res) => {
  const user = new User(req.body);
  await user.save();
  res.json(user);
});

module.exports = router;`;

const DEFAULT_VALIDATORS = `// Joi Validators
const Joi = require('joi');

const userSchema = Joi.object({
  name: Joi.string().min(2).max(50).required(),
  email: Joi.string().email().required(),
  id: Joi.number().unique().required()
});

const validateUser = (data) => userSchema.validate(data);

module.exports = { validateUser, userSchema };`;

export type GenerationState = {
  source: string;
  models: string;
  routes: string;
  validators: string;
  services: string;
  status: GenerationStatus;
  inputError: string | null;
  pendingEntry: HistoryEntry | null;
};

const initialState: GenerationState = {
  source: '',
  models: DEFAULT_MODELS,
  routes: DEFAULT_ROUTES,
  validators: DEFAULT_VALIDATORS,
  services: '',
  status: 'ready',
  inputError: null,
  pendingEntry: null,
};

export const generateCode = createAsyncThunk<
  GenerateResponse,
  { source: string; token?: string | null },
  { rejectValue: string }
>('generation/generateCode', async ({ source, token }, thunkAPI) => {
  try {
    return await fetchGeneratedCode(source, token);
  } catch (error) {
    return thunkAPI.rejectWithValue((error as Error).message);
  }
});

export const generateFromImage = createAsyncThunk<
  GenerateResponse,
  { image: string; mimeType: string; token?: string | null },
  { rejectValue: string }
>('generation/generateFromImage', async ({ image, mimeType, token }, thunkAPI) => {
  try {
    return await fetchGeneratedCodeFromImage(image, mimeType, token);
  } catch (error) {
    return thunkAPI.rejectWithValue((error as Error).message);
  }
});

const generationSlice = createSlice({
  name: 'generation',
  initialState,
  reducers: {
    setSource(state, action: PayloadAction<string>) {
      state.source = action.payload;
    },
    setStatus(state, action: PayloadAction<GenerationStatus>) {
      state.status = action.payload;
    },
    setPendingEntry(state, action: PayloadAction<HistoryEntry>) {
      state.pendingEntry = action.payload;
    },
    clearPendingEntry(state) {
      state.pendingEntry = null;
    },
    setInputError(state, action: PayloadAction<string | null>) {
      state.inputError = action.payload;
    },
    applyEntry(state, action: PayloadAction<HistoryEntry>) {
      state.source = action.payload.source || '';
      state.models = action.payload.models || '';
      state.routes = action.payload.routes || '';
      state.validators = action.payload.validators || '';
      state.services = action.payload.services || '';
      state.status = 'ready';
      state.inputError = null;
    },
    clearOutput(state) {
      state.models = '';
      state.routes = '';
      state.validators = '';
      state.services = '';
      state.status = 'ready';
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(generateCode.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(generateCode.fulfilled, (state, action) => {
        state.models = action.payload.models;
        state.routes = action.payload.routes;
        state.validators = action.payload.validators;
        state.services = action.payload.services;
        state.status = 'ready';
      })
      .addCase(generateCode.rejected, (state) => {
        state.status = 'error';
      })
      .addCase(generateFromImage.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(generateFromImage.fulfilled, (state, action) => {
        state.models = action.payload.models;
        state.routes = action.payload.routes;
        state.validators = action.payload.validators;
        if (action.payload.source) {
          state.source = action.payload.source;
        }
        state.status = 'ready';
        state.pendingEntry = null;
      })
      .addCase(generateFromImage.rejected, (state) => {
        state.status = 'error';
      });
  },
});

export const { setSource, setStatus, setInputError, setPendingEntry, clearPendingEntry, applyEntry, clearOutput } = generationSlice.actions;
export default generationSlice.reducer;
