// Min Cost to Connect All Points (NeetCode 150 · Advanced Graphs).

import py from "../../guides/python/neetcode/min_cost_connect.py?raw";
import { row, rngFor } from "../helpers";
import { Heap } from "../heap/heap";
import type { GEdge, GNode, PatternProblem, PatternStep } from "../types";

type P = [number, number];
type Input = P[];

const dist = (a: P, b: P) => Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]);
const showPts = (ps: P[]) => `[${ps.map(([x, y]) => `[${x},${y}]`).join(", ")}]`;

function run(points: Input): PatternStep[] {
  const n = points.length;
  const steps: PatternStep[] = [];
  const heap = new Heap("min");
  const inTree = new Set<number>();
  const treeEdges: [number, number][] = [];
  let total = 0;
  let cur: number | null = null;
  let ops = 0;
  // Fit the points into about 4 layout units, keeping their shape.
  const xs = points.map((p) => p[0]);
  const ys = points.map((p) => p[1]);
  const span = Math.max(1, Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys));
  const sc = 4 / span;
  const drawn = n <= 12;
  const snap = (stage: string, explanation: string, extra: Partial<PatternStep> = {}) => {
    const pq = [...heap.a].sort((a, b) => a.key - b.key).slice(0, 8);
    const nodes: GNode[] = points.map((p, i) => ({ id: `p${i}`, v: String(i), x: (p[0] - Math.min(...xs)) * sc, y: (Math.max(...ys) - p[1]) * sc, tone: i === cur ? "current" : inTree.has(i) ? "found" : heap.a.some((it) => it.data === i) ? "pointer" : undefined, tag: `(${p[0]},${p[1]})` }));
    const edges: GEdge[] = treeEdges.map(([a, b]) => ({ a: `p${a}`, b: `p${b}`, tone: "found", label: String(dist(points[a], points[b])) }));
    steps.push({
      stage,
      explanation,
      rows: [row(`min-heap: (cost, point), smallest first${heap.size > 8 ? ` (8 of ${heap.size})` : ""}`, pq.map((it) => `(${it.key}, ${it.data})`), pq.length ? { 0: "current" } : {})],
      graph: drawn ? { title: "points at their coordinates; green edges are in the tree, labelled with their cost", nodes, edges } : undefined,
      vars: [
        { name: "points connected", value: `${inTree.size} of ${n}` },
        { name: "total cost", value: String(total), tone: "found" },
      ],
      ops: ops + heap.ops,
      ...extra,
    });
  };
  heap.push({ key: 0, data: 0 });
  snap("start", `Prim's algorithm: grow one tree from point 0. A min-heap holds (cost, point) for every point the tree could add next; the cost is the Manhattan distance |x1 − x2| + |y1 − y2|. Always add the cheapest.`);
  while (inTree.size < n) {
    const { top } = heap.pop();
    const i = top.data as number;
    ops++;
    cur = i;
    if (inTree.has(i)) {
      snap("stale", `Pop (${top.key}, ${i}): point ${i} is already in the tree. Skip this entry.`);
      continue;
    }
    inTree.add(i);
    total += top.key;
    if (top.label) treeEdges.push([Number(top.label), i]);
    let pushed = 0;
    for (let j = 0; j < n; j++) {
      if (inTree.has(j)) continue;
      ops++;
      heap.push({ key: dist(points[i], points[j]), data: j, label: String(i) });
      pushed++;
    }
    snap("add", `${top.label ? `Pop (${top.key}, ${i}): the cheapest way to grow the tree is the edge ${top.label}–${i}, cost ${top.key}. ` : "Point 0 starts the tree. "}Total ${total}. ${pushed === 0 ? "No points are left outside the tree." : pushed === 1 ? `Push the cost from ${i} to the one point not yet connected.` : `Push the cost from ${i} to each of the ${pushed} points not yet connected.`}`);
  }
  cur = null;
  snap("done", `All ${n} points are connected by ${n - 1} edge${n === 2 ? "" : "s"}, with total cost ${total}. That's a minimum spanning tree.`, { done: true, answer: String(total) });
  return steps;
}

/** Cross-check: Kruskal's algorithm (sort every edge, join with union-find). */
function kruskal(points: Input): number {
  const n = points.length;
  const es: [number, number, number][] = [];
  for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) es.push([dist(points[i], points[j]), i, j]);
  es.sort((a, b) => a[0] - b[0]);
  const par = Array.from({ length: n }, (_, i) => i);
  const find = (x: number): number => (par[x] === x ? x : (par[x] = find(par[x])));
  let total = 0;
  for (const [d, a, b] of es) {
    const ra = find(a);
    const rb = find(b);
    if (ra !== rb) {
      par[ra] = rb;
      total += d;
    }
  }
  return total;
}

export const minCostConnect: PatternProblem<Input> = {
  id: "min-cost-connect",
  title: "Min Cost to Connect All Points",
  difficulty: "Medium",
  blind75: false,
  slug: "min-cost-to-connect-all-points",
  video: "f7JOBJIC-NA",
  statement: "Given points on a plane, connecting two costs their Manhattan distance |x1 − x2| + |y1 − y2|. Return the minimum total cost to connect all the points (so every pair is joined by some path).",
  examples: [
    { label: "LeetCode's example 1", input: [[0, 0], [2, 2], [3, 10], [5, 2], [7, 0]] },
    { label: "a square and a far point", input: [[0, 0], [0, 2], [2, 0], [2, 2], [8, 1]] },
    { label: "one point", input: [[3, 3]] },
  ],
  random: (seed) => {
    const g = rngFor(seed);
    const seen = new Set<string>();
    const pts: P[] = [];
    const n = g.int(1, 6);
    while (pts.length < n) {
      const p: P = [g.int(0, 8), g.int(0, 8)];
      if (seen.has(p.join())) continue;
      seen.add(p.join());
      pts.push(p);
    }
    return pts;
  },
  describe: (pts) => `points = ${showPts(pts)}`,
  run,
  solve: kruskal,
  brute: null,
  bruteIdea: "Every pair of points is a possible edge, so any method looks at all n² of them. Trying every spanning tree is hopeless (there are n^(n−2)). The answer is cross-checked with Kruskal's algorithm.",
  guide: {
    title: "Min Cost to Connect All Points",
    idea: [
      "Connecting everything as cheaply as possible is a minimum spanning tree (MST). Every pair of points is an edge, weighted by Manhattan distance.",
      "Prim's algorithm grows one tree: start anywhere; a min-heap holds the cost of reaching each outside point from the tree. Pop the cheapest; if that point is new, add the edge and push the costs from it to every point still outside. Stale entries for points already in the tree are skipped.",
    ],
    whenToUse: ["“Connect everything at minimum total cost”: an MST, by Prim (grow from a node with a heap) or Kruskal (sort edges, join with union-find).", "Dense graphs where every pair is an edge favour Prim."],
    stages: [
      { id: "start", title: "Heap holds (0, point 0)", detail: "", pseudo: "min_heap = [[0, 0]]; visit = set()" },
      { id: "add", title: "Pop the cheapest new point, push its edges", detail: "", pseudo: "cost, i = heappop(min_heap); res += cost; visit.add(i); for nei_cost, nei in adj[i]: heappush(...)" },
      { id: "stale", title: "Already in the tree → skip", detail: "", pseudo: "if i in visit: continue" },
      { id: "done", title: "All points connected", detail: "", pseudo: "return res" },
    ],
    legend: [
      { tone: "current", label: "Point just popped" },
      { tone: "found", label: "In the tree" },
      { tone: "pointer", label: "Reachable from the tree (in the heap)" },
    ],
    complexity: { time: "O(n² log n)", space: "O(n²)", why: "Every pair of points is pushed once; each push or pop is O(log n²) = O(log n)." },
    pitfalls: ["Skip a popped point that's already in the tree, or you'll count an edge twice.", "Manhattan distance, not Euclidean: no square roots."],
    tryThis: ["In “a square and a far point”, the far point joins last, by the cheapest of the square's corners to it.", "LeetCode's example 1 costs 20."],
    python: py,
  },
};
