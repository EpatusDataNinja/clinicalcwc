import { useCaseStore } from './store';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export interface AuthUser {
  id: string;
  email: string;
  name?: string | null;
}

export interface AuthResponse {
  token: string;
  user: AuthUser;
}

async function authRequest(path: string, body: Record<string, unknown>): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE}/api/auth/${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'Authentication request failed');
  }

  return data as AuthResponse;
}

export async function login(email: string, password: string): Promise<AuthResponse> {
  const result = await authRequest('login', { email, password });
  useCaseStore.getState().setAuthToken(result.token);
  useCaseStore.getState().setUserId(result.user.id);
  useCaseStore.getState().setUserName(result.user.name || null);
  useCaseStore.getState().setUserEmail(result.user.email);
  return result;
}

export async function registerAccount(input: {
  email: string;
  password: string;
  name?: string;
}): Promise<AuthResponse> {
  const result = await authRequest('register', input);
  useCaseStore.getState().setAuthToken(result.token);
  useCaseStore.getState().setUserId(result.user.id);
  useCaseStore.getState().setUserName(result.user.name || null);
  useCaseStore.getState().setUserEmail(result.user.email);
  useCaseStore.getState().setEncryptionPasscode(input.password);
  return result;
}

export async function updateProfile(input: {
  name?: string;
  email?: string;
  currentPassword?: string;
  newPassword?: string;
}): Promise<{ user: AuthUser }> {
  const token = useCaseStore.getState().authToken;
  if (!token) throw new Error('Not authenticated');

  const res = await fetch(`${API_BASE}/api/auth/profile`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(input),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'Profile update failed');
  }

  if (data.user) {
    if (data.user.name) useCaseStore.getState().setUserName(data.user.name);
    if (data.user.email) useCaseStore.getState().setUserEmail(data.user.email);
  }

  return data;
}

export function logout(): void {
  const store = useCaseStore.getState();
  store.setAuthToken(null);
  store.setUserId(null);
  store.setUserName(null);
  store.setUserEmail(null);
}
