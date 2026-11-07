// Draws a window [l, r] over a row: cells before it are greyed out, cells in
// it are shaded, and the two ends are marked L and R.

import type { VizTone } from "../../guides/types";
import { row } from "../helpers";
import type { PRow } from "../types";

export function windowRow(
  label: string,
  values: readonly (string | number)[],
  l: number,
  r: number,
  over: Record<number, VizTone | undefined> = {},
): PRow {
  const tones: Record<number, VizTone | undefined> = {};
  const tags: Record<number, string | undefined> = {};
  values.forEach((_, i) => {
    if (i < l) tones[i] = "idle";
    else if (i <= r) tones[i] = "pointer";
  });
  if (r >= l && r >= 0) {
    tones[l] = "current";
    tones[r] = "current";
    tags[l] = "L";
    tags[r] = l === r ? "L R" : "R";
  } else if (l < values.length) {
    tags[l] = "L";
  }
  return row(label, values, { ...tones, ...over }, tags);
}

export const shownChar = (c: string) => (c === " " ? "␣" : c);
