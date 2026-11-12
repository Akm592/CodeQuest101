// Draws a binary-search range over a row: everything outside [l, r] has been
// ruled out (greyed), and L, M, R are tagged.

import type { VizTone } from "../../guides/types";
import { row } from "../helpers";
import type { PRow } from "../types";

export function rangeRow(
  label: string,
  values: readonly (string | number)[],
  l: number,
  r: number,
  m: number | null,
  over: Record<number, VizTone | undefined> = {},
): PRow {
  const tones: Record<number, VizTone | undefined> = {};
  const tags: Record<number, string[]> = {};
  const tag = (i: number, t: string) => {
    if (i >= 0 && i < values.length) (tags[i] ??= []).push(t);
  };
  values.forEach((_, i) => {
    if (i < l || i > r) tones[i] = "idle";
  });
  if (l <= r) {
    tag(l, "L");
    if (m !== null) tag(m, "M");
    tag(r, "R");
  }
  if (m !== null && m >= 0 && m < values.length) tones[m] = "compare";
  const flat = Object.fromEntries(Object.entries(tags).map(([i, ts]) => [i, ts.join(" ")]));
  return row(label, values, { ...tones, ...over }, flat);
}
