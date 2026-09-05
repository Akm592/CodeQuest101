// Backend API access.
//
// Both call paths — the axios instance and the raw fetch used for SSE streaming —
// must attach the same Supabase access token, which is what tells the backend the
// caller is signed in. Previously neither did, so every request was treated as a
// guest and nothing was ever persisted: signed-in users saw an empty chat history.

import axios, { AxiosInstance } from "axios";

import { supabase } from "./supabaseClient";

export const API_BASE_URL: string =
  import.meta.env.VITE_API_URL || "http://localhost:8000";

// Refresh slightly early so a long-idle tab does not fire a request with a token
// that expires in transit.
const REFRESH_MARGIN_SECONDS = 60;

/** The current access token, or null when nobody is signed in. */
export async function getAccessToken(): Promise<string | null> {
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error || !data.session) return null;

    const { session } = data;
    const expiresAt = session.expires_at;
    if (expiresAt && expiresAt - Date.now() / 1000 < REFRESH_MARGIN_SECONDS) {
      const refreshed = await supabase.auth.refreshSession();
      return refreshed.data.session?.access_token ?? session.access_token ?? null;
    }
    return session.access_token ?? null;
  } catch {
    // Never let an auth hiccup break guest mode.
    return null;
  }
}

/**
 * Build request headers, adding Authorization only when there is a real token.
 *
 * The header is omitted entirely for guests rather than sent with an empty or
 * "null" value: the backend treats a present-but-invalid token as a 401, so a
 * placeholder here would lock signed-out visitors out of the product.
 */
export async function authHeaders(
  extra: Record<string, string> = {},
): Promise<Record<string, string>> {
  const headers: Record<string, string> = { ...extra };
  const token = await getAccessToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

export const api: AxiosInstance = axios.create({ baseURL: API_BASE_URL });

api.interceptors.request.use(async (config) => {
  const token = await getAccessToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// One retry on 401 with a freshly refreshed token, then give up. Without the
// retry, a token that expired while the tab sat idle would surface as a hard
// error the moment the user typed something.
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config as (typeof error.config & { _retried?: boolean });
    if (error.response?.status === 401 && config && !config._retried) {
      config._retried = true;
      try {
        const refreshed = await supabase.auth.refreshSession();
        const token = refreshed.data.session?.access_token;
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
          return api.request(config);
        }
      } catch {
        // fall through to the rejection below
      }
    }
    return Promise.reject(error);
  },
);

export interface PendingContext {
  kind: "awaiting_language";
  slug: string;
  visualize: boolean;
}

export interface ChatStreamBody {
  user_input: string;
  preferred_language?: string | null;
  pending?: PendingContext | null;
}

/**
 * POST a chat message and return the streaming response.
 *
 * Retries once on 401 with a refreshed token, mirroring the axios interceptor.
 * A fresh AbortSignal must be supplied by the caller for the retry, since an
 * aborted signal stays aborted.
 */
export async function postChatStream(
  sessionId: string,
  body: ChatStreamBody,
  signal?: AbortSignal,
): Promise<Response> {
  const send = async () => {
    const headers = await authHeaders({
      "Content-Type": "application/json",
      "X-Session-ID": sessionId,
    });
    return fetch(`${API_BASE_URL}/chat`, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
      signal,
    });
  };

  let response = await send();
  if (response.status === 401) {
    try {
      await supabase.auth.refreshSession();
      response = await send();
    } catch {
      // Return the original 401 for the caller to report.
    }
  }
  return response;
}
