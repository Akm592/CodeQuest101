// Helpers for the 1-D Dynamic Programming page: a dp array drawn as a row,
// with the cell being filled and the cells it's built from highlighted.

import type { VizTone } from "../../guides/types";
import type { PRow } from "../types";

export interface DpRowOpts {
  /** The cell being filled now. */
  cur?: number;
  /** Cells the current one is built from. */
  reads?: number[];
  /** Cells already filled (shown green); default: none. */
  filled?: (i: number) => boolean;
  /** Small label under each cell; default: the index. */
  tag?: (i: number) => string | undefined;
  /** Override a cell's tone. */
  tone?: (i: number) => VizTone | undefined;
}

export const showVal = (v: number | string | null | undefined) => (v === null || v === undefined ? "" : v === Infinity ? "∞" : String(v));

export function dpRow(label: string, vals: readonly (number | string | null | undefined)[], o: DpRowOpts = {}): PRow {
  const reads = new Set(o.reads ?? []);
  return {
    label,
    cells: vals.map((v, i) => ({
      v: showVal(v),
      tone: o.tone?.(i) ?? (i === o.cur ? "current" : reads.has(i) ? "compare" : o.filled?.(i) ? "found" : undefined),
      tag: o.tag ? o.tag(i) : String(i),
    })),
  };
}

/** Counts calls of a plain recursive function (the brute force for most DP problems). */
export function countCalls<A extends unknown[], R>(f: (self: (...a: A) => R, ...a: A) => R): (...a: A) => { answer: R; ops: number } {
  return (...args: A) => {
    let ops = 0;
    const self = (...a: A): R => {
      ops++;
      return f(self, ...a);
    };
    const answer = self(...args);
    return { answer, ops };
  };
}
