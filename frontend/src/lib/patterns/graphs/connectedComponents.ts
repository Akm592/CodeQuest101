// Number of Connected Components in an Undirected Graph (NeetCode 150 · Graphs).

import py from "../../guides/python/neetcode/count_components.py?raw";
import { row, rngFor } from "../helpers";
import type { GEdge, GNode, PatternProblem, PatternStep } from "../types";
import { DSU, adjacency, randomEdges, showPairs } from "./graph";

type Input = { n: number; edges: [number, number][] };

function run({ n, edges }: Input): PatternStep[] {
  const steps: PatternStep[] = [];
  const dsu = new DSU(n);
  let count = n;
  let k = -1;
  let hot: number[] = [];
  let same = false;
  const snap = (stage: string, explanation: string, extra: Partial<PatternStep> = {}) => {
    const nodes: GNode[] = Array.from({ length: n }, (_, i) => ({ id: `v${i}`, v: String(i), tone: hot.includes(i) ? "current" : dsu.parent[i] === i ? "pointer" : undefined, tag: dsu.parent[i] === i ? "root" : undefined }));
    const gEdges: GEdge[] = edges.map(([a, b], i) => ({ a: `v${a}`, b: `v${b}`, tone: i === k ? (same ? "compare" : "current") : i < k ? "found" : "idle", dashed: i > k }));
    steps.push({
      stage,
      explanation,
      rows: [row("parent[]", dsu.parent, Object.fromEntries(dsu.parent.map((p, i) => [i, hot.includes(i) ? "current" : p === i ? "pointer" : undefined])), Object.fromEntries(dsu.parent.map((_, i) => [i, `node ${i}`])))],
      graph: { title: "edges added so far (dashed: not yet)", nodes, edges: gEdges },
      vars: [{ name: "components", value: String(count), tone: "found" }],
      ops: dsu.ops,
      ...extra,
    });
  };
  snap("start", `Start with every node on its own: ${n} components. Each edge that joins two different components merges them into one, so the count drops by 1. An edge inside a component changes nothing.`);
  for (k = 0; k < edges.length; k++) {
    const [a, b] = edges[k];
    const u = dsu.union(a, b);
    hot = [a, b];
    same = !u.joined;
    if (u.joined) {
      count--;
      snap("merge", `Edge ${a}–${b}: roots ${u.ra} and ${u.rb} differ, so two components merge (root ${u.newRoot} wins). Components: ${count}.`);
    } else snap("same", `Edge ${a}–${b}: both already have root ${u.ra}. They're in the same component; the count stays ${count}.`);
  }
  k = edges.length;
  hot = [];
  snap("done", `All edges added: ${count} component${count === 1 ? "" : "s"}. That's the number of roots left.`, { done: true, answer: String(count) });
  return steps;
}

/** Cross-check: count the DFS starts needed to visit everything. */
function byDFS({ n, edges }: Input): number {
  const adj = adjacency(n, edges);
  const seen = new Set<number>();
  let c = 0;
  for (let s = 0; s < n; s++) {
    if (seen.has(s)) continue;
    c++;
    const stack = [s];
    seen.add(s);
    while (stack.length)
    for (const w of adj[stack.pop()!])
      if (!seen.has(w)) {
        seen.add(w);
        stack.push(w);
      }
  }
  return c;
}

export const connectedComponents: PatternProblem<Input> = {
  id: "connected-components",
  title: "Number of Connected Components in an Undirected Graph",
  difficulty: "Medium",
  blind75: true,
  slug: "number-of-connected-components-in-an-undirected-graph",
  video: "8f1XPm4WOUc",
  statement: "Given n nodes (0 to n − 1) and a list of undirected edges, return the number of connected components.",
  examples: [
    { label: "LeetCode's example 1", input: { n: 5, edges: [[0, 1], [1, 2], [3, 4]] } },
    { label: "an edge inside a component", input: { n: 5, edges: [[0, 1], [1, 2], [2, 0], [3, 4]] } },
    { label: "no edges", input: { n: 3, edges: [] } },
  ],
  random: (seed) => {
    const g = rngFor(seed);
    const n = g.int(2, 7);
    return { n, edges: randomEdges(seed, n, g.int(0, n)) };
  },
  describe: ({ n, edges }) => `n = ${n}, edges = ${showPairs(edges)}`,
  run,
  solve: byDFS,
  brute: null,
  bruteIdea: "DFS from every unvisited node, counting the starts, is also O(V + E): there's nothing slower worth comparing. The answer is cross-checked with that DFS.",
  guide: {
    title: "Number of Connected Components in an Undirected Graph",
    idea: [
      "Start with n components, one per node. Go through the edges with union-find: if the two ends have different roots, merge them and subtract 1; if they share a root, the edge is inside a component and changes nothing.",
      "The count left at the end is the number of roots. A DFS that counts how many times it has to start afresh works just as well.",
    ],
    whenToUse: ["Counting groups when you're given connections (friends, networks, islands as edges).", "Union-find shines when edges arrive one at a time and you need the count after each."],
    stages: [
      { id: "start", title: "n components, each node its own root", detail: "", pseudo: "par = list(range(n)); res = n" },
      { id: "merge", title: "Different roots → merge, count − 1", detail: "", pseudo: "res -= union(n1, n2)" },
      { id: "same", title: "Same root → nothing changes", detail: "", pseudo: "if p1 == p2: return 0" },
      { id: "done", title: "Components left", detail: "", pseudo: "return res" },
    ],
    legend: [
      { tone: "current", label: "Edge being added / its ends" },
      { tone: "compare", label: "Edge inside a component" },
      { tone: "found", label: "Edges added" },
      { tone: "pointer", label: "Root" },
    ],
    complexity: { time: "O(V + E · α(V))", space: "O(V)", why: "One union per edge, each nearly constant time." },
    pitfalls: ["Only subtract when the union actually merges two different sets.", "Nodes with no edges are components too."],
    tryThis: ["In “an edge inside a component”, edge 2–0 doesn't change the count.", "With no edges, every node is its own component."],
    python: py,
  },
};
