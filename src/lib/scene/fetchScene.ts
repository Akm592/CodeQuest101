// Fetch the scene for a clicked suggestion.
//
// Generation takes several seconds and costs a model call, so a scene is kept
// for the rest of the visit: closing the player and reopening the same chip is
// instant. The backend caches too; this saves the round trip.

import { api } from "../api";
import type { Scene, TraceRequest } from "./types";
import { parseScene } from "./validate";

const cache = new Map<string, Promise<Scene>>();
const MAX_CONTEXT_CHARS = 12000;

export class SceneError extends Error {}

export function fetchScene(trace: TraceRequest, context: string): Promise<Scene> {
  const body = { trace, context: context.slice(0, MAX_CONTEXT_CHARS) };
  const key = JSON.stringify(body);
  const hit = cache.get(key);
  if (hit) return hit;

  const request = api
    .post("/chat/visualize", body, { timeout: 90_000 })
    .then((res) => {
      const parsed = parseScene(res.data?.scene);
      if (!parsed.ok) throw new SceneError(parsed.error);
      return parsed.value;
    })
    .catch((error: unknown) => {
      cache.delete(key); // a failure must stay retryable
      if (error instanceof SceneError) throw error;
      const detail = (error as { response?: { data?: { detail?: unknown }; status?: number } }).response;
      if (detail?.status === 429) throw new SceneError("Too many requests. Wait a moment and try again.");
      if (typeof detail?.data?.detail === "string") throw new SceneError(detail.data.detail);
      throw new SceneError("Couldn't reach the visualization service. Check your connection and try again.");
    });

  cache.set(key, request);
  return request;
}
