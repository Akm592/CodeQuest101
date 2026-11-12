// Random rotated sorted lists of distinct numbers, shared by the two rotated problems.

import { rngFor } from "../helpers";

export function randomRotated(seed: number): number[] {
  const g = rngFor(seed);
  const sorted = [...new Set(Array.from({ length: g.int(3, 11) }, () => g.int(0, 30)))].sort((a, b) => a - b);
  const k = g.int(0, sorted.length - 1);
  return [...sorted.slice(k), ...sorted.slice(0, k)];
}

/** 200 distinct numbers, rotated so the minimum is near the end. */
export const bigRotated = () => {
  const sorted = Array.from({ length: 200 }, (_, i) => i * 3);
  return [...sorted.slice(170), ...sorted.slice(0, 170)];
};
