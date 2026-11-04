// Fetch the trace for a clicked "Visualize this" button.
//
// Nothing is generated until the click. Generation takes several seconds and
// costs a model call, so the result is kept for the rest of the visit:
// closing the player and reopening the same button is instant. The backend
// caches too; this saves the round trip.

import { api } from "../api";
import { SceneError, toOutcome } from "./outcome";
import type { SceneOutcome, TraceRequest } from "./types";

const cache = new Map<string, Promise<SceneOutcome>>();
const MAX_CONTEXT_CHARS = 12000;

export function fetchScene(context: string, trace?: TraceRequest): Promise<SceneOutcome> {
  const body = { context: context.slice(0, MAX_CONTEXT_CHARS), ...(trace && { trace }) };
  const key = JSON.stringify(body);
  const hit = cache.get(key);
  if (hit) return hit;

  const request = api
    .post("/chat/visualize", body, { timeout: 120_000 })
    .then((res) => toOutcome(res.data))
    .catch((error: unknown) => {
      cache.delete(key); // a failure must stay retryable
      if (error instanceof SceneError) throw error;
      const res = (error as { response?: { data?: { detail?: unknown }; status?: number } }).response;
      if (res?.status === 429) throw new SceneError("Too many requests. Wait a minute and try again.");
      if (typeof res?.data?.detail === "string") throw new SceneError(res.data.detail);
      if ((error as { code?: string }).code === "ECONNABORTED") {
        throw new SceneError("The visualization took too long to build. Try again.");
      }
      throw new SceneError("Couldn't reach the visualization service. Check your connection and try again.");
    });

  cache.set(key, request);
  return request;
}
