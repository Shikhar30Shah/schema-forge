import { useMemo, useState } from 'react';
import { useDispatch } from 'react-redux';
import type { AppDispatch } from '../../store/store';
import { loginUser, registerUser } from '../../features/auth/authSlice';
import { Eye, EyeOff } from 'lucide-react';
import { customHooks } from '@/lib/customHooks';
import { fieldErrors, initialState, validation } from './form';

export type AuthPageProps = {
  onAuthenticated: (token: string, user: { id: string; name: string; email: string }) => void;
  initialMode?: 'signin' | 'signup';
};

export function AuthPage({ onAuthenticated, initialMode = 'signin' }: AuthPageProps) {
  const dispatch = useDispatch<AppDispatch>();
  const [mode, setMode] = useState<'signin' | 'signup'>(initialMode);
  const [loading, setLoading] = useState(false);

  const [viewPassword, setViewPassword] = useState(false);

  const { states, handleChange, handleBlur, errors, resetStates, resetErrors, updateError,
    isError, isEmpty} = customHooks(initialState, fieldErrors, validation);
  const { name, email, password } = states;

  const submitLabel = useMemo(() => (mode === 'signin' ? 'Sign in' : 'Create Account'), [mode]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    resetErrors();
    setLoading(true);

    try {
      const action = mode === 'signin'
        ? await dispatch(loginUser({ email, password }))
        : await dispatch(registerUser({ name, email, password }));

      if (loginUser.fulfilled.match(action) || registerUser.fulfilled.match(action)) {
        const response = action.payload;
        window.localStorage.setItem('schemaforge_token', response.token);
        window.localStorage.setItem('schemaforge_user', JSON.stringify(response.user));
        onAuthenticated(response.token, response.user);
        resetStates();
        return;
      }

      updateError('auth', 'Authentication failed.');
    } catch (err) {
      updateError('auth', err instanceof Error ? err.message : 'Authentication failed.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0b1326] text-[#dae2fd] flex items-center justify-center px-6 py-10">
      <div className="w-full max-w-md rounded-2xl border border-[#171f33] bg-[#131b2e] p-8 shadow-2xl">
        <div className="mb-8">
          <p className="text-sm uppercase tracking-[0.3em] text-[#c0c1ff]">SchemaForge</p>
          <h1 className="mt-3 text-3xl font-semibold text-white">{mode === 'signin' ? 'Welcome back' : 'Create your account'}</h1>
          <p className="mt-2 text-sm text-[#c7c4d7]">
            {mode === 'signin'
              ? 'Sign in to save generations and revisit your workflow history.'
              : 'Sign up to keep your schema runs and outputs organized.'}
          </p>
        </div>

        <div className="mb-6 flex rounded-lg border border-[#171f33] bg-[#171f33] p-1">
          <button
            type="button"
            onClick={() => {setMode('signin'); resetErrors(); resetStates();}}
            className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition ${mode === 'signin' ? 'bg-[#c0c1ff] text-[#1000a9]' : 'text-[#dae2fd]'}`}
          >
            Sign in
          </button>
          <button
            type="button"
            onClick={() => {setMode('signup'); resetErrors(); resetStates();}}
            className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition ${mode === 'signup' ? 'bg-[#c0c1ff] text-[#1000a9]' : 'text-[#dae2fd]'}`}
          >
            Sign up
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'signup' && (
            <div>
              <label className="mb-2 block text-sm text-[#c7c4d7]">Name</label>
              <input
                value={name}
                onChange={handleChange}
                onBlur={handleBlur}
                name="name"
                className="w-full rounded-md border border-[#222a3d] bg-[#0b1326] px-3 py-2 text-sm text-[#dae2fd] outline-none ring-0"
                placeholder="Alex Morgan"
                required
              />
              {errors.name && <p className="mt-1 text-sm text-red-400">{errors.name}</p>}
            </div>
          )}

          <div>
            <label className="mb-2 block text-sm text-[#c7c4d7]">Email</label>
            <input
              type="email"
              value={email}
              onChange={handleChange}
              onBlur={handleBlur}
              name="email"
              className="w-full rounded-md border border-[#222a3d] bg-[#0b1326] px-3 py-2 text-sm text-[#dae2fd] outline-none ring-0"
              placeholder="you@example.com"
              required
            />
            {errors.email && <p className="mt-1 text-sm text-red-400">{errors.email}</p>}
          </div>

          <div>
            <label className="mb-2 block text-sm text-[#c7c4d7]">Password</label>
            <div className="relative">
              <input
                type={viewPassword ? "text" : "password"}
                value={password}
                onChange={handleChange}
                onBlur={handleBlur}
                name="password"
                className="w-full rounded-md border border-[#222a3d] bg-[#0b1326] px-3 py-2 text-sm text-[#dae2fd] outline-none ring-0"
                placeholder="••••••••"
                required
              />
              {errors.password && <p className="mt-1 text-sm text-red-400">{errors.password}</p>}

              <button
                type="button"
                onClick={() => setViewPassword(!viewPassword)}
                className="absolute right-3 top-2.5 text-[#c7c4d7] hover:text-[#dae2fd] cursor-pointer transition"
              >
                {viewPassword ? <EyeOff /> : <Eye />}
              </button>
            </div>
          </div>

          {errors.auth ? <p className="rounded-md border border-red-400/40 bg-red-500/10 px-3 py-2 text-sm text-red-300">{errors.auth}</p> : null}

          <button
            type="submit"
            disabled={loading || isError() || (mode === 'signup' ? isEmpty() : !email || !password)}
            className="w-full rounded-md bg-[#c0c1ff] px-4 py-2.5 text-sm font-semibold text-[#1000a9] transition hover:bg-[#8083ff] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? 'Please wait…' : submitLabel}
          </button>
        </form>
      </div>
    </div>
  );
}
