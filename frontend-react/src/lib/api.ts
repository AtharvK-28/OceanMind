const API_OVERRIDE_KEY = "oceanmind_api_url";

/**
 * Where the backend lives, resolved at request time rather than baked in at
 * build time. Order of precedence:
 *   1. ?api=<url> in the URL (remembered afterwards) — lets a phone or a
 *      tunnelled origin point at any backend without a rebuild.
 *   2. NEXT_PUBLIC_API_URL — used by the Capacitor/native build.
 *   3. Same host on port 8000 — covers localhost and a phone on the LAN.
 */
function resolveApiBase(): string {
  if (typeof window === "undefined") {
    return process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
  }
  try {
    const q = new URLSearchParams(window.location.search).get("api");
    if (q) localStorage.setItem(API_OVERRIDE_KEY, q.replace(/\/+$/, ""));
    const stored = localStorage.getItem(API_OVERRIDE_KEY);
    if (stored) return stored;
  } catch {
    // localStorage can throw in private mode — fall through to the defaults.
  }
  if (process.env.NEXT_PUBLIC_API_URL) return process.env.NEXT_PUBLIC_API_URL;
  const { protocol, hostname } = window.location;
  return `${protocol}//${hostname}:8000`;
}

/** Clear a stored ?api= override (handy when switching back to local). */
export function clearApiOverride() {
  try { localStorage.removeItem(API_OVERRIDE_KEY); } catch {}
}

export function apiBase(): string {
  return resolveApiBase();
}

export async function apiGet<T>(path: string, params?: Record<string, string>): Promise<T> {
  const url = new URL(path, resolveApiBase());
  if (params) Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`API ${res.status}: ${res.statusText}`);
  return res.json();
}

export async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${resolveApiBase()}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`API ${res.status}: ${res.statusText}`);
  return res.json();
}

export const fetcher = <T>(path: string) => apiGet<T>(path);
