// src/utils/auth.ts
export type UserRole = 'admin' | 'client';

const TOKEN_KEY = 'auth_token';
const ROLE_KEY = 'auth_role';

export function saveAuth(token: string, role: UserRole) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(ROLE_KEY, role);
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function getRole(): UserRole | null {
  const v = localStorage.getItem(ROLE_KEY);
  return v === 'admin' || v === 'client' ? v : null;
}

export function clearAuth() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(ROLE_KEY);
}