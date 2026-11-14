// Helpers for the 2-D Dynamic Programming page: a dp table drawn on the grid
// view, with optional header cells along the top and left, the cell being
// filled in teal and the cells it reads in amber.

import type { VizTone } from "../../guides/types";
import type { PCell, PatternStep } from "../types";

export type Cell = [number, number];
export type V = number | string | boolean | null | undefined;

export interface TableOpts {
  /** Labels shown above each column and left of each row (e.g. the letters of two strings). */
  colHead?: string[];
  rowHead?: string[];
  cur?: Cell | null;
  reads?: Cell[];
  /** Cells to show in green (e.g. the answer, or a path). */
  good?: Cell[];
  /** Cells to show faded. */
  dim?: (r: number, c: number) => boolean;
  show?: (v: V) => string;
}

const fmt = (v: V) => (v === null || v === undefined ? "" : v === true ? "T" : v === false ? "F" : v === Infinity ? "∞" : String(v));
const has = (cs: Cell[] | undefined, r: number, c: number) => !!cs?.some(([y, x]) => y === r && x === c);

export function table(title: string, dp: V[][], o: TableOpts = {}): NonNullable<PatternStep["grid"]> {
  const show = o.show ?? fmt;
  const tone = (r: number, c: number): VizTone | undefined =>
    o.cur && o.cur[0] === r && o.cur[1] === c ? "current" : has(o.reads, r, c) ? "compare" : has(o.good, r, c) ? "found" : o.dim?.(r, c) ? "idle" : undefined;
  const body: PCell[][] = dp.map((line, r) => line.map((v, c) => ({ v: show(v), tone: tone(r, c) })));
  if (!o.colHead && !o.rowHead) return { title, cells: body };
  const head = (t: string): PCell => ({ v: t, tone: "pointer" });
  const rows: PCell[][] = [];
  if (o.colHead) rows.push([...(o.rowHead ? [{ v: "" }] : []), ...o.colHead.map(head)]);
  body.forEach((line, r) => rows.push([...(o.rowHead ? [head(o.rowHead[r] ?? "")] : []), ...line]));
  return { title, cells: rows };
}

/** A plain recursion that counts its own calls (the brute force for most DP problems). */
export function counted<A extends unknown[], R>(f: (self: (...a: A) => R, ...a: A) => R) {
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

export const blank = <T>(R: number, C: number, v: T | null = null): (T | null)[][] => Array.from({ length: R }, () => Array<T | null>(C).fill(v));
