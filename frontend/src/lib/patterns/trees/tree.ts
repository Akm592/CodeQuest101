// Binary-tree helpers for the Trees pages: LeetCode's level-order format,
// layout for TreeView, and random and large test trees.

import type { VizTone } from "../../guides/types";
import { rngFor } from "../helpers";
import type { TNode } from "../types";

export interface T {
  id: string;
  val: number;
  left: T | null;
  right: T | null;
}

export type Level = (number | null)[];

/** Builds a tree from LeetCode's level order, e.g. [3,9,20,null,null,15,7]. Ids are paths: r, rl, rr, … */
export function fromLevel(arr: Level, prefix = "r"): T | null {
  if (!arr.length || arr[0] === null) return null;
  const root: T = { id: prefix, val: arr[0], left: null, right: null };
  const queue: T[] = [root];
  let i = 1;
  while (queue.length && i < arr.length) {
    const t = queue.shift()!;
    const l = arr[i++];
    if (l !== null && l !== undefined) queue.push((t.left = { id: `${t.id}l`, val: l, left: null, right: null }));
    if (i >= arr.length) break;
    const r = arr[i++];
    if (r !== null && r !== undefined) queue.push((t.right = { id: `${t.id}r`, val: r, left: null, right: null }));
  }
  return root;
}

/** The tree in LeetCode's level order, with trailing nulls removed. */
export function toLevel(root: T | null): Level {
  const out: Level = [];
  const queue: (T | null)[] = [root];
  while (queue.length) {
    const t = queue.shift()!;
    out.push(t ? t.val : null);
    if (t) queue.push(t.left, t.right);
  }
  while (out.length && out[out.length - 1] === null) out.pop();
  return out;
}

export const showLevel = (arr: Level) => `[${arr.map((v) => (v === null ? "null" : v)).join(",")}]`;

/** Nodes in preorder. */
export function preorder(root: T | null): T[] {
  return root ? [root, ...preorder(root.left), ...preorder(root.right)] : [];
}

export function size(root: T | null): number {
  return root ? 1 + size(root.left) + size(root.right) : 0;
}

export function height(root: T | null): number {
  return root ? 1 + Math.max(height(root.left), height(root.right)) : 0;
}

export interface LayoutOpts {
  dx?: number;
  tone?: (t: T) => VizTone | undefined;
  tag?: (t: T) => string | undefined;
  note?: (t: T) => string | undefined;
  edgeTone?: (t: T) => VizTone | undefined;
}

/** Places each node at its in-order position (column) and depth (row). */
export function layout(root: T | null, o: LayoutOpts = {}): TNode[] {
  const out: TNode[] = [];
  let x = o.dx ?? 0;
  const go = (t: T | null, depth: number, parent?: string) => {
    if (!t) return;
    go(t.left, depth + 1, t.id);
    out.push({ id: t.id, v: String(t.val), x: x++, depth, parent, tone: o.tone?.(t), tag: o.tag?.(t), note: o.note?.(t), edgeTone: o.edgeTone?.(t) });
    go(t.right, depth + 1, t.id);
  };
  go(root, 0);
  return out;
}

type Rng = ReturnType<typeof rngFor>;

/** A random tree of n nodes (each new node fills a random empty slot), as level order. */
export function randomTree(g: Rng, n: number, lo: number, hi: number, unique = false): Level {
  if (n === 0) return [];
  const used = new Set<number>();
  const val = () => {
    for (;;) {
      const v = g.int(lo, hi);
      if (!unique || !used.has(v)) {
        used.add(v);
        return v;
      }
    }
  };
  const root: T = { id: "r", val: val(), left: null, right: null };
  const all = [root];
  while (all.length < n) {
    const t = g.pick(all);
    const side = g.r() < 0.5 ? "left" : "right";
    if (t[side]) continue;
    const c: T = { id: `${t.id}${side[0]}`, val: val(), left: null, right: null };
    t[side] = c;
    all.push(c);
  }
  return toLevel(root);
}

/** A binary search tree from inserting n distinct random values, as level order. */
export function randomBST(g: Rng, n: number, lo: number, hi: number): Level {
  const vals = g.shuffle(Array.from({ length: hi - lo + 1 }, (_, i) => lo + i)).slice(0, n);
  return toLevel(insertAll(vals));
}

export function insertAll(vals: number[]): T | null {
  let root: T | null = null;
  for (const v of vals) {
    const node: T = { id: "", val: v, left: null, right: null };
    if (!root) {
      root = node;
      continue;
    }
    let t: T = root;
    for (;;) {
      const side = v < t.val ? "left" : "right";
      if (!t[side]) {
        t[side] = node;
        break;
      }
      t = t[side]!;
    }
  }
  return root;
}

/** A complete tree of n nodes (filled level by level), as level order. */
export const completeTree = (n: number, val: (i: number) => number = (i) => i + 1): Level => Array.from({ length: n }, (_, i) => val(i));

/** A deep tree: a long left spine, each spine node also having a right leaf. n nodes in all. */
export function deepTree(n: number, val: (i: number) => number = (i) => (i % 9) + 1): Level {
  let i = 0;
  const root: T = { id: "r", val: val(i++), left: null, right: null };
  let t = root;
  while (i < n) {
    t.right = { id: "", val: val(i++), left: null, right: null };
    if (i >= n) break;
    t.left = { id: "", val: val(i++), left: null, right: null };
    t = t.left;
  }
  return toLevel(root);
}
