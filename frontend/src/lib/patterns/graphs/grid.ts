// Grid helpers for the Graphs page: a grid is a graph whose nodes are cells
// and whose edges join side-by-side cells.

import type { VizTone } from "../../guides/types";
import { rngFor } from "../helpers";
import type { PCell } from "../types";

export const DIRS = [
  [-1, 0],
  [0, 1],
  [1, 0],
  [0, -1],
] as const;

/** The in-bounds neighbours of (r, c): up, right, down, left. */
export function around(r: number, c: number, R: number, C: number): [number, number][] {
  return DIRS.map(([dr, dc]): [number, number] => [r + dr, c + dc]).filter(([y, x]) => y >= 0 && x >= 0 && y < R && x < C);
}

export const key = (r: number, c: number) => `${r},${c}`;

/** Cells for the grid view. */
export function cells<T>(g: readonly (readonly T[])[], show: (v: T, r: number, c: number) => string, tone: (r: number, c: number) => VizTone | undefined, tag?: (r: number, c: number) => string | undefined): PCell[][] {
  return g.map((line, r) => line.map((v, c) => ({ v: show(v, r, c), tone: tone(r, c), tag: tag?.(r, c) })));
}

/** A random grid of "1"/"0" (land and water) rows. */
export function randomLand(seed: number, minR = 2, maxR = 4, minC = 3, maxC = 5, p = 0.5): string[] {
  const g = rngFor(seed);
  const R = g.int(minR, maxR);
  const C = g.int(minC, maxC);
  return Array.from({ length: R }, () => Array.from({ length: C }, () => (g.r() < p ? "1" : "0")).join(""));
}

/** Rows of a string grid as arrays of characters. */
export const chars = (rows: readonly string[]) => rows.map((r) => [...r]);
