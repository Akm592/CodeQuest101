// Batch vs stochastic vs mini-batch gradient descent, on a real problem:
// fitting a line y = w·x + b to 40 noisy points by mean squared error.
//
// All three use the same rule, w ← w − lr · slope. They differ only in how
// many points the slope is measured on before each step (Ruder's overview):
//   batch       all 40 points: the true slope, a smooth path, slow per step
//   stochastic  1 point:       a noisy guess at the slope, very cheap per step
//   mini-batch  8 points:      in between, the usual choice in practice
// The points are shuffled at the start of every pass (epoch).

import type { BaseStep } from "../algorithms/types";
import { gaussian, seededRng, type Point } from "./random";

export type BatchKind = "batch" | "stochastic" | "minibatch";
export const BATCH_KINDS: BatchKind[] = ["batch", "stochastic", "minibatch"];
export const MINIBATCH_SIZE = 8;

export const BATCH_INFO: Record<BatchKind, { label: string; size: (n: number) => number; blurb: string }> = {
  batch: { label: "Batch", size: (n) => n, blurb: "Every step looks at all the data. The direction is exact, so the path is smooth, but each step is expensive." },
  stochastic: { label: "Stochastic (SGD)", size: () => 1, blurb: "Every step looks at one random point. Steps are cheap but noisy, so the path wobbles." },
  minibatch: { label: `Mini-batch (${MINIBATCH_SIZE})`, size: () => MINIBATCH_SIZE, blurb: "Every step looks at a small random group. Less noisy than SGD, much cheaper than batch." },
};

/** 40 points around y = 2x + 1, with x between −1 and 1. */
export function lineData(seed = 3, n = 40): Point[] {
  const rng = seededRng(seed);
  return Array.from({ length: n }, () => {
    const x = rng() * 2 - 1;
    return { x, y: 2 * x + 1 + gaussian(rng) * 0.35 };
  });
}

export function mseOf(data: Point[], w: number, b: number): number {
  return data.reduce((s, p) => s + (w * p.x + b - p.y) ** 2, 0) / data.length;
}

/** Slope of the MSE over a set of points: (∂/∂w, ∂/∂b). */
export function gradOn(points: Point[], w: number, b: number): [number, number] {
  let gw = 0;
  let gb = 0;
  for (const p of points) {
    const err = w * p.x + b - p.y;
    gw += (2 / points.length) * err * p.x;
    gb += (2 / points.length) * err;
  }
  return [gw, gb];
}

export interface BatchRun {
  path: [number, number][];
  /** Full-data MSE after each step. */
  losses: number[];
  /** Points looked at so far, after each step. */
  seen: number[];
}

export function runBatchKind(kind: BatchKind, data: Point[], start: [number, number], lr: number, steps: number, seed = 7): BatchRun {
  const rng = seededRng(seed);
  const size = BATCH_INFO[kind].size(data.length);
  let [w, b] = start;
  let order: number[] = [];
  let cursor = 0;
  const shuffle = () => {
    order = [...data.keys()];
    for (let i = order.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [order[i], order[j]] = [order[j], order[i]];
    }
    cursor = 0;
  };
  shuffle();
  const path: [number, number][] = [[w, b]];
  const losses = [mseOf(data, w, b)];
  const seen = [0];
  for (let t = 1; t <= steps; t++) {
    let batch: Point[];
    if (size >= data.length) batch = data;
    else {
      if (cursor + size > order.length) shuffle();
      batch = order.slice(cursor, cursor + size).map((i) => data[i]);
      cursor += size;
    }
    const [gw, gb] = gradOn(batch, w, b);
    w -= lr * gw;
    b -= lr * gb;
    path.push([w, b]);
    losses.push(mseOf(data, w, b));
    seen.push(seen[seen.length - 1] + batch.length);
  }
  return { path, losses, seen };
}

export interface BatchStep extends BaseStep {
  step: number;
}

export function buildBatchFrames(runs: Record<BatchKind, BatchRun>, steps: number): BatchStep[] {
  const frames: BatchStep[] = [];
  for (let k = 0; k <= steps; k++) {
    const s = runs.stochastic.seen[k];
    frames.push({
      step: k,
      explanation:
        k === 0
          ? "All three start from the same guess. Press Step to take one update each."
          : `After ${k} update${k === 1 ? "" : "s"}: batch has looked at ${runs.batch.seen[k]} points, mini-batch at ${runs.minibatch.seen[k]}, stochastic at ${s}.`,
      done: k === steps,
    });
  }
  return frames;
}
