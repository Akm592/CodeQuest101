// Small helpers shared by the pattern step generators.

import type { VizTone } from "../guides/types";
import { seededRng } from "../ml/random";
import type { PCell, PRow } from "./types";

/** A row of cells from values, with optional tones and tags by index. */
export function row(
  label: string,
  values: readonly (string | number)[],
  tones: Record<number, VizTone | undefined> = {},
  tags: Record<number, string | undefined> = {},
): PRow {
  return {
    label,
    cells: values.map((v, i): PCell => ({ v: String(v), tone: tones[i], tag: tags[i] })),
  };
}

export const show = (xs: readonly (string | number)[]) => `[${xs.join(", ")}]`;
export const quote = (s: string) => `"${s}"`;

export function rngFor(seed: number) {
  const r = seededRng(seed * 2654435761);
  const int = (lo: number, hi: number) => lo + Math.floor(r() * (hi - lo + 1));
  const pick = <T>(xs: readonly T[]) => xs[Math.floor(r() * xs.length)];
  const shuffle = <T>(xs: readonly T[]) => {
    const a = [...xs];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(r() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };
  return { r, int, pick, shuffle };
}

/** Count of each character, as a sorted "a1 e1 t1" label. */
export function countLabel(counts: Map<string, number>): string {
  return [...counts.entries()]
    .filter(([, n]) => n !== 0)
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([c, n]) => `${c}${n}`)
    .join(" ");
}
