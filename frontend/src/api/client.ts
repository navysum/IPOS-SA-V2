/**
 * api/client.ts
 * Base fetch wrapper — all requests go to the Spring Boot backend.
 * Backend runs on http://localhost:8080 (Vite proxies /api → 8080).
 */

// In development the Vite proxy rewrites /api → localhost:8080.
// In production (Vercel) set VITE_API_BASE_URL to the Railway backend URL.
const BASE = (import.meta.env.VITE_API_BASE_URL ?? '') + '/api';

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`API ${method} ${path} → ${res.status}: ${text}`);
  }

  // 204 No Content
  if (res.status === 204) return undefined as T;

  return res.json() as Promise<T>;
}

export const api = {
  get:    <T>(path: string)              => request<T>('GET',    path),
  post:   <T>(path: string, body: unknown) => request<T>('POST',   path, body),
  put:    <T>(path: string, body?: unknown) => request<T>('PUT',    path, body),
  delete: <T>(path: string)              => request<T>('DELETE', path),
};
