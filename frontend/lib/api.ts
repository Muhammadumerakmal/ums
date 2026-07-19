/**
 * Tiny fetch wrapper for the backend API.
 * - Prefixes the backend origin + `/api`.
 * - Sends the HttpOnly session cookie cross-origin (`credentials: "include"`).
 * - Defaults the JSON content-type.
 *
 * Pass paths relative to `/api`, e.g. `api("/auth/login", { method: "POST", body })`.
 */
const BASE = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000") + "/api";

export async function api(path: string, init?: RequestInit): Promise<Response> {
  return fetch(BASE + path, {
    ...init,
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
}
