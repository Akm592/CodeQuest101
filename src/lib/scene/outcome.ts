// The response of POST /chat/visualize, as the player needs it. Separate from
// fetchScene so it can be tested without the network client.

import type { SceneOutcome } from "./types";
import { parseScene } from "./validate";

export class SceneError extends Error {}

/** Turn the endpoint's JSON into an outcome, or throw a readable SceneError. */
export function toOutcome(data: unknown): SceneOutcome {
  const body = (typeof data === "object" && data !== null ? data : {}) as Record<string, unknown>;
  // The model judged this can't be traced faithfully, and said why. Not an error.
  if (body.feasible === false) {
    const reason = typeof body.reason === "string" && body.reason.trim() ? body.reason : "";
    return { feasible: false, reason: reason || "This one doesn't break down into clear steps on a small example." };
  }
  const parsed = parseScene(body.scene);
  if (!parsed.ok) throw new SceneError(parsed.error);
  return { feasible: true, scene: parsed.value };
}
