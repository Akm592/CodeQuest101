// Small-graph helpers for the Graphs page: adjacency lists, union-find with a
// record of what each call did, and random graphs.

import { rngFor } from "../helpers";

/** Undirected adjacency lists for nodes 0..n−1 (or 1..n with base 1). */
export function adjacency(n: number, edges: readonly (readonly [number, number])[], base = 0): number[][] {
  const adj = Array.from({ length: n + base }, () => [] as number[]);
  for (const [a, b] of edges) {
    adj[a].push(b);
    adj[b].push(a);
  }
  return adj;
}

/** Union-find with path compression and union by rank; counts every parent hop as an op. */
export class DSU {
  parent: number[];
  rank: number[];
  ops = 0;
  constructor(n: number) {
    this.parent = Array.from({ length: n }, (_, i) => i);
    this.rank = Array<number>(n).fill(1);
  }
  /** The root of x, and the nodes passed on the way (before compression). */
  find(x: number): { root: number; path: number[] } {
    const path = [x];
    let r = x;
    while (this.parent[r] !== r) {
      this.ops++;
      r = this.parent[r];
      path.push(r);
    }
    for (const p of path) this.parent[p] = r; // path compression
    this.ops++;
    return { root: r, path };
  }
  /** Joins the sets of a and b; false if they were already one set. */
  union(a: number, b: number): { joined: boolean; ra: number; rb: number; pa: number[]; pb: number[]; newRoot: number } {
    const { root: ra, path: pa } = this.find(a);
    const { root: rb, path: pb } = this.find(b);
    if (ra === rb) return { joined: false, ra, rb, pa, pb, newRoot: ra };
    let big = ra;
    let small = rb;
    if (this.rank[rb] > this.rank[ra]) [big, small] = [rb, ra];
    this.parent[small] = big;
    this.rank[big] += this.rank[small];
    this.ops++;
    return { joined: true, ra, rb, pa, pb, newRoot: big };
  }
}

/** A random simple undirected graph on n nodes with m edges. */
export function randomEdges(seed: number, n: number, m: number): [number, number][] {
  const g = rngFor(seed);
  const all: [number, number][] = [];
  for (let a = 0; a < n; a++) for (let b = a + 1; b < n; b++) all.push([a, b]);
  return g.shuffle(all).slice(0, Math.min(m, all.length));
}

export const showPairs = (es: readonly (readonly number[])[]) => `[${es.map((e) => `[${e.join(",")}]`).join(", ")}]`;
