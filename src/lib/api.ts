// Backend API access.
//
// Both call paths — the axios instance and the raw fetch used for SSE streaming —
// must attach the same Supabase access token, which is what tells the backend the
// caller is signed in. Previously neither did, so every request was treated as a
// guest and nothing was ever persisted: signed-in users saw an empty chat history.
//
// The auth service is treated as something that can fail. It is not on the
// critical path for chatting: a guest never needs a token, and a signed-in user
// would rather keep talking than stare at a spinner while a token refresh times
// out. So the token is read from an in-memory cache kept current by
// onAuthStateChange, consulting Supabase only near expiry and then under a
// timeout, with a breaker that stops hammering an endpoint that is clearly down.

import axios, { AxiosInstance } from "axios";

import { supabase } from "./supabaseClient";

export const API_BASE_URL: string =
  import.meta.env.VITE_API_URL || "http://localhost:8000";

// Refresh slightly early so a long-idle tab does not fire a request with a token
// that expires in transit.
const REFRESH_MARGIN_SECONDS = 60;

// How long to wait on Supabase before giving up and proceeding as a guest.
const AUTH_TIMEOUT_MS = 3000;

// After a network failure, stop asking for this long. Without it every keystroke
// that triggers a request pays the full timeout again.
const BREAKER_COOLDOWN_MS = 30_000;

interface CachedToken {
  token: string;
  /** Unix seconds, as Supabase reports it. */
  expiresAt: number | null;
}

let cachedToken: CachedToken | null = null;
let breakerOpenUntil = 0;

type DegradedListener = (degraded: boolean) => void;
const degradedListeners = new Set<DegradedListener>();

/** Whether the auth service is currently considered unreachable. */
export function isAuthDegraded(): boolean {
  return Date.now() < breakerOpenUntil;
}

/**
 * Record that a call to the auth service failed.
 *
 * Exported so session bootstrap can report a failure too. Without that, the
 * breaker only opens once the user tries to send something — meaning the first
 * message still pays the full timeout and the banner appears late.
 */
export function reportAuthFailure(error: unknown): void {
  if (isNetworkFailure(error)) setDegraded(true);
}

/** Subscribe to auth-availability changes. Returns an unsubscribe function. */
export function onAuthDegradedChange(listener: DegradedListener): () => void {
  degradedListeners.add(listener);
  return () => degradedListeners.delete(listener);
}

function setDegraded(degraded: boolean) {
  const was = isAuthDegraded();
  breakerOpenUntil = degraded ? Date.now() + BREAKER_COOLDOWN_MS : 0;
  if (was !== degraded) degradedListeners.forEach((l) => l(degraded));
}

/**
 * True for failures that mean "the service is unreachable" rather than "your
 * credentials are bad". Only the former should open the breaker — a genuine
 * rejection is not something retrying will fix.
 */
function isNetworkFailure(error: unknown): boolean {
  if (!error) return false;
  const name = (error as { name?: string }).name ?? "";
  const message = (error as { message?: string }).message ?? "";
  return (
    name === "AuthRetryableFetchError" ||
    name === "TypeError" ||
    /failed to fetch|networkerror|load failed|timeout/i.test(message)
  );
}

function withTimeout<T>(promise: PromiseLike<T>, ms: number): Promise<T | null> {
  return new Promise((resolve) => {
    const timer = setTimeout(() => resolve(null), ms);
    Promise.resolve(promise).then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        if (isNetworkFailure(error)) setDegraded(true);
        resolve(null);
      },
    );
  });
}

function cacheFromSession(session: { access_token?: string; expires_at?: number } | null) {
  cachedToken = session?.access_token
    ? { token: session.access_token, expiresAt: session.expires_at ?? null }
    : null;
}

/** The cached token if it is still comfortably valid, else null. */
function freshToken(): string | null {
  const entry = cachedToken;
  if (!entry) return null;
  if (entry.expiresAt === null) return entry.token;
  const secondsLeft = entry.expiresAt - Date.now() / 1000;
  return secondsLeft > REFRESH_MARGIN_SECONDS ? entry.token : null;
}

/** Whatever token we hold, fresh or not. The backend is the judge of validity. */
function anyCachedToken(): string | null {
  return cachedToken?.token ?? null;
}

// Supabase emits this on sign-in, sign-out and every successful auto-refresh,
// which is what keeps the cache current without polling.
supabase.auth.onAuthStateChange((_event, session) => {
  cacheFromSession(session);
  if (session) setDegraded(false);
});

/**
 * Read the stored session at startup, under the same timeout and breaker.
 *
 * Returns null both for "signed out" and for "auth unreachable"; callers check
 * isAuthDegraded() to tell them apart.
 */
export async function loadInitialSession() {
  const result = await withTimeout(supabase.auth.getSession(), AUTH_TIMEOUT_MS);
  if (result === null) {
    setDegraded(true);
    return null;
  }
  if (result.error) {
    reportAuthFailure(result.error);
    return null;
  }
  const session = result.data?.session ?? null;
  cacheFromSession(session);
  return session;
}

/**
 * The current access token, or null when nobody is signed in — or when the auth
 * service cannot be reached, in which case the caller proceeds as a guest.
 */
export async function getAccessToken(): Promise<string | null> {
  // The common path: no await, no network, no Supabase call at all.
  const fresh = freshToken();
  if (fresh) return fresh;

  // Known-bad auth: do not spend a timeout per request confirming it.
  if (isAuthDegraded()) return anyCachedToken();

  const result = await withTimeout(supabase.auth.getSession(), AUTH_TIMEOUT_MS);
  if (result === null) {
    // Timed out or failed. A stale token beats none; the backend judges it.
    setDegraded(true);
    return anyCachedToken();
  }

  const session = result.data?.session ?? null;
  cacheFromSession(session);
  if (!session) return null;

  const stillFresh = freshToken();
  if (stillFresh) return stillFresh;

  const refreshed = await withTimeout(supabase.auth.refreshSession(), AUTH_TIMEOUT_MS);
  if (refreshed === null) {
    setDegraded(true);
    return session.access_token ?? null;
  }
  cacheFromSession(refreshed.data?.session ?? null);
  return anyCachedToken() ?? session.access_token ?? null;
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
//
// 503 is deliberately not retried here: the backend uses it to say the auth
// service is down, which retrying cannot fix.
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error.response?.status;
    if (status === 503) {
      setDegraded(true);
      return Promise.reject(error);
    }

    const config = error.config as (typeof error.config & { _retried?: boolean });
    if (status === 401 && config && !config._retried && !isAuthDegraded()) {
      config._retried = true;
      const refreshed = await withTimeout(supabase.auth.refreshSession(), AUTH_TIMEOUT_MS);
      const token = refreshed?.data?.session?.access_token;
      if (token) {
        cacheFromSession(refreshed.data.session);
        config.headers.Authorization = `Bearer ${token}`;
        return api.request(config);
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
 * The caller supplies the AbortSignal; the retry reuses it, so a caller that
 * aborted mid-flight stays aborted.
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

  if (response.status === 503) {
    setDegraded(true);
    return response;
  }

  if (response.status === 401 && !isAuthDegraded()) {
    const refreshed = await withTimeout(supabase.auth.refreshSession(), AUTH_TIMEOUT_MS);
    if (refreshed?.data?.session) {
      cacheFromSession(refreshed.data.session);
      response = await send();
    }
  }
  return response;
}
