export const API_BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:8000";

// The session cookie set during the OAuth redirect (localhost:5173 <-> localhost:8000)
// is not reliably kept by every browser across that redirect chain. Auth is carried
// as a bearer token instead: issued once as a `?token=` query param on OAuth
// success, then stored and sent as `Authorization: Bearer <token>` on every request.
let authToken: string | null = localStorage.getItem("authToken");

(function consumeTokenFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const token = params.get("token");
  if (!token) return;
  authToken = token;
  localStorage.setItem("authToken", token);
  const url = new URL(window.location.href);
  url.searchParams.delete("token");
  window.history.replaceState({}, "", url.toString());
})();

export function clearAuthToken() {
  authToken = null;
  localStorage.removeItem("authToken");
}

function authHeaders(): Record<string, string> {
  return authToken ? { Authorization: `Bearer ${authToken}` } : {};
}

export async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...authHeaders(), ...options?.headers },
    ...options
  });
  if (!response.ok) throw new Error(`${path} failed: ${response.status}`);
  if (response.status === 204) return undefined as T;
  return response.json();
}

export async function optionalRequest<T>(path: string): Promise<T | null> {
  try {
    const response = await fetch(`${API_BASE}${path}`, { headers: authHeaders() });
    if (response.status === 204) return null;
    if (!response.ok) return null;
    return await response.json();
  } catch (networkError) {
    console.warn(`[optionalRequest] ${path} failed at the network level, treating as unauthenticated/unavailable`, networkError);
    return null;
  }
}
