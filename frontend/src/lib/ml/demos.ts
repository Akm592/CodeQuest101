// The inputs the ML pages open with, shared with the guide tests so the
// highlighted stages are proven on exactly what the pages show.

import { blobs, type Point } from "./random";
import type { DatasetKey } from "./mlp";
import type { SurfaceKey } from "./gradientDescent";

export const GD_DEFAULT_LR: Record<SurfaceKey, number> = { bowl: 0.1, valley: 0.15, twoMinima: 0.05, saddle: 0.1 };

export const LR_DEFAULT = { seed: 1, lr: 0.1 };

/** Data seed 2 with k-means++ start 12 takes five rounds to settle: enough to watch. */
export const KMEANS_DEFAULT = { seed: 2, startSeed: 12, k: 3 };

/** Three loose groups on a 0–10 plot, with a new seed for "New data". */
export function kMeansPoints(seed: number): Point[] {
  const centres = [
    { x: 2.5 + (seed % 3) * 0.3, y: 2.5 },
    { x: 7.5, y: 3 + (seed % 2) * 0.5 },
    { x: 5, y: 7.6 },
  ];
  return blobs(seed, centres, 14, 0.95).map((p) => ({
    x: Math.min(9.8, Math.max(0.2, p.x)),
    y: Math.min(9.8, Math.max(0.2, p.y)),
  }));
}

export const SAMPLING_DEFAULT = { temperature: 1, topK: 0, topP: 1 };

export const MLP_DEFAULT: { dataset: DatasetKey; hidden: number; lr: number; epochs: number; seed: number } = {
  dataset: "xor",
  hidden: 4,
  lr: 0.8,
  epochs: 600,
  seed: 1,
};
