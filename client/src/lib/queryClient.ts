import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2,
      retry: 1,
    },
  },
});

// __PORT_5000__ is replaced at deploy time with the proxy base URL.
// In local dev it remains empty string, so /api/... routes work via relative paths.
const API_BASE = "__PORT_5000__";

export async function apiRequest(
  method: string,
  path: string,
  body?: unknown,
  token?: string | null
): Promise<Response> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  return res;
}
