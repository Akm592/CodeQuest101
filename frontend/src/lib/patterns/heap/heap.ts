// A binary heap for the Heap / Priority Queue page. It records the path each
// push or pop takes, so a step can show where the value travelled, and counts
// comparisons and swaps as ops.

import type { VizTone } from "../../guides/types";
import { row } from "../helpers";
import type { PRow, TNode } from "../types";

export interface HItem {
  /** What the heap orders by. */
  key: number;
  /** What the picture shows; defaults to the key. */
  label?: string;
  /** Extra data a problem needs (a point, a task, a tweet). */
  data?: unknown;
}

export class Heap {
  a: HItem[] = [];
  ops = 0;
  constructor(readonly kind: "min" | "max") {}

  get size() {
    return this.a.length;
  }
  peek(): HItem | undefined {
    return this.a[0];
  }
  /** True if x should sit above y. */
  private above(x: HItem, y: HItem) {
    this.ops++;
    return this.kind === "min" ? x.key < y.key : x.key > y.key;
  }
  private swap(i: number, j: number) {
    [this.a[i], this.a[j]] = [this.a[j], this.a[i]];
    this.ops++;
  }
  /** Adds an item; returns the indexes it passed through, bottom first. */
  push(it: HItem): number[] {
    this.a.push(it);
    let i = this.a.length - 1;
    const path = [i];
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (!this.above(this.a[i], this.a[p])) break;
      this.swap(i, p);
      i = p;
      path.push(i);
    }
    return path;
  }
  /** Removes the top; returns it and the indexes the moved-up last item passed through. */
  pop(): { top: HItem; path: number[] } {
    const top = this.a[0];
    const last = this.a.pop()!;
    if (!this.a.length) return { top, path: [] };
    this.a[0] = last;
    let i = 0;
    const path = [0];
    for (;;) {
      const l = 2 * i + 1;
      const r = l + 1;
      let best = i;
      if (l < this.a.length && this.above(this.a[l], this.a[best])) best = l;
      if (r < this.a.length && this.above(this.a[r], this.a[best])) best = r;
      if (best === i) break;
      this.swap(i, best);
      i = best;
      path.push(i);
    }
    return { top, path };
  }
}

const label = (it: HItem) => it.label ?? String(it.key);

/** In-order position of each index of a complete binary tree with n nodes. */
function inorder(n: number): number[] {
  const x = Array<number>(n);
  let next = 0;
  const go = (i: number) => {
    if (i >= n) return;
    go(2 * i + 1);
    x[i] = next++;
    go(2 * i + 2);
  };
  go(0);
  return x;
}

export interface HeapDrawOpts {
  /** Id prefix, so two heaps in one picture don't clash. */
  prefix?: string;
  /** Shift every node right by this many columns. */
  dx?: number;
  tone?: (i: number) => VizTone | undefined;
  tag?: (i: number) => string | undefined;
  note?: (i: number) => string | undefined;
  /** Colour of the edge from i's parent down to i. */
  edge?: (i: number) => VizTone | undefined;
}

/** Tree nodes for TreeView: index i's children are 2i+1 and 2i+2. */
export function heapNodes(h: Heap, o: HeapDrawOpts = {}): TNode[] {
  const pre = o.prefix ?? "h";
  const xs = inorder(h.size);
  return h.a.map((it, i) => ({
    id: `${pre}${i}`,
    v: label(it),
    x: xs[i] + (o.dx ?? 0),
    depth: Math.floor(Math.log2(i + 1)),
    parent: i ? `${pre}${(i - 1) >> 1}` : undefined,
    tone: o.tone?.(i),
    tag: o.tag?.(i),
    note: o.note?.(i),
    edgeTone: i ? o.edge?.(i) : undefined,
  }));
}

/** The array behind the heap, with each index as a tag. */
export function heapRow(name: string, h: Heap, tone?: (i: number) => VizTone | undefined): PRow {
  return row(
    name,
    h.a.map(label),
    Object.fromEntries(h.a.map((_, i) => [i, tone?.(i)])),
    Object.fromEntries(h.a.map((_, i) => [i, String(i)])),
  );
}

/** Tones for a step that moved a value along `path`: where it ended is current, the rest of the path is swap. */
export function pathTone(path: number[], end?: number): (i: number) => VizTone | undefined {
  const on = new Set(path);
  const stop = end ?? path.at(-1);
  return (i) => (i === stop ? "current" : on.has(i) ? "swap" : undefined);
}

/** Edge tones for the same path: an edge is coloured when both its ends are on it. */
export function pathEdge(path: number[]): (i: number) => VizTone | undefined {
  const on = new Set(path);
  return (i) => (on.has(i) && on.has((i - 1) >> 1) ? "swap" : undefined);
}
