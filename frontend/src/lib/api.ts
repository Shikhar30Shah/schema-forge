export type GenerateResponse = {
  models: string;
  routes: string;
  validators: string;
  services: string;
  summary: string;
  sourceType: string;
  source?: string | null;
};

export type AuthUser = {
  id: string;
  name: string;
  email: string;
};

export type AuthResponse = {
  user: AuthUser;
  token: string;
};

export type HistoryEntry = {
  id: string;
  source: string;
  models: string;
  routes: string;
  validators: string;
  services: string;
  summary: string;
  sourceType: string;
  createdAt: string;
};

const API_BASE_URL = 'https://schemaforgee.vercel.app/schema';

function getStoredToken() {
  if (typeof window === 'undefined') {
    return null;
  }

  return window.localStorage.getItem('schemaforge_token');
}

function buildHeaders(token?: string | null, extraHeaders?: HeadersInit) {
  const headers = new Headers(extraHeaders || {});
  headers.set('Content-Type', 'application/json');
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  return headers;
}

async function request<T>(path: string, options: RequestInit = {}, token?: string | null): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: buildHeaders(token, options.headers),
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.error || payload.message || 'Request failed');
  }

  return response.json() as Promise<T>;
}

export async function fetchGeneratedCode(source: string, token?: string | null): Promise<GenerateResponse> {
  return request<GenerateResponse>('/generate', {
    method: 'POST',
    body: JSON.stringify({ source }),
  }, token || getStoredToken());
}

export async function fetchGeneratedCodeFromImage(
  image: string,
  mimeType: string,
  token?: string | null,
): Promise<GenerateResponse> {
  return request<GenerateResponse>('/generate/image', {
    method: 'POST',
    body: JSON.stringify({ image, mimeType }),
  }, token || getStoredToken());
}

export async function signIn(payload: { email: string; password: string }): Promise<AuthResponse> {
  return request<AuthResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function signUp(payload: { name: string; email: string; password: string }): Promise<AuthResponse> {
  return request<AuthResponse>('/auth/signup', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function signOut(token?: string | null): Promise<{ success: boolean }> {
  return request<{ success: boolean }>('/auth/logout', { method: 'POST' }, token || getStoredToken());
}

export async function getCurrentUser(token?: string | null): Promise<{ user: AuthUser }> {
  return request<{ user: AuthUser }>('/auth/me', { method: 'GET' }, token || getStoredToken());
}

export async function saveHistory(token: string, payload: Partial<HistoryEntry>): Promise<HistoryEntry> {
  return request<HistoryEntry>('/auth/history', {
    method: 'POST',
    body: JSON.stringify(payload),
  }, token);
}

export async function getHistory(token: string): Promise<HistoryEntry[]> {
  return request<HistoryEntry[]>('/auth/history', { method: 'GET' }, token);
}
