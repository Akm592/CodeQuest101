// Redundant Connection (NeetCode 150 · Graphs).

import py from "../../guides/python/neetcode/redundant_connection.py?raw";
import { row, rngFor } from "../helpers";
import type { GEdge, GNode, PatternProblem, PatternStep } from "../types";
import { DSU, adjacency, showPairs } from "./graph";

/** Edges of a tree on nodes 1..n, plus one extra edge. */
type Input = [number, number][];

function run(edges: Input): PatternStep[] {
  const n = edges.length;
  const steps: PatternStep[] = [];
  const dsu = new DSU(n + 1);
  let k = -1;
  let hot: number[] = [];
  let bad = -1;
  let added = 0;
  const snap = (stage: string, explanation: string, extra: Partial<PatternStep> = {}) => {
    const nodes: GNode[] = Array.from({ length: n }, (_, i) => ({ id: `v${i + 1}`, v: String(i + 1), tone: hot.includes(i + 1) ? (bad >= 0 ? "swap" : "current") : undefined, tag: dsu.parent[i + 1] === i + 1 ? "root" : undefined }));
    const gEdges: GEdge[] = edges.map(([a, b], i) => ({ a: `v${a}`, b: `v${b}`, tone: i === bad ? "swap" : i === k ? "current" : i < k ? "found" : "idle", dashed: i > k }));
    steps.push({
      stage,
      explanation,
      rows: [
        row("edges in order", edges.map(([a, b]) => `${a}–${b}`), Object.fromEntries(edges.map((_, i) => [i, i === bad ? "swap" : i === k ? "current" : i < k ? "found" : undefined]))),
        row("parent[] (union-find)", dsu.parent.slice(1), Object.fromEntries(dsu.parent.slice(1).map((p, i) => [i, hot.includes(i + 1) ? "current" : p === i + 1 ? "pointer" : undefined])), Object.fromEntries(dsu.parent.slice(1).map((_, i) => [i, `node ${i + 1}`]))),
      ],
      graph: { title: "edges added so far (dashed: not yet)", nodes, edges: gEdges },
      vars: [{ name: "edges added", value: String(added) }],
      ops: dsu.ops,
      ...extra,
    });
  };
  snap("start", `Add the edges one at a time and keep track of which nodes are already connected, with union-find: each node points towards a root, and two nodes are connected exactly when they have the same root. The first edge whose two ends are already connected closes a cycle: that's the redundant one.`);
  for (k = 0; k < n; k++) {
    const [a, b] = edges[k];
    const u = dsu.union(a, b);
    hot = [a, b];
    if (u.joined) added++;
    if (!u.joined) {
      bad = k;
      snap("cycle", `Edge ${a}–${b}: find(${a}) = ${u.ra} and find(${b}) = ${u.rb}, the same root. ${a} and ${b} are already connected, so this edge would close a cycle. Return [${a}, ${b}].`);
      snap("done", `The redundant edge is [${a}, ${b}]. Removing it leaves a tree.`, { done: true, answer: `[${a},${b}]` });
      return steps;
    }
    snap("union", `Edge ${a}–${b}: find(${a}) = ${u.ra} (path ${u.pa.join(" → ")}) and find(${b}) = ${u.rb} (path ${u.pb.join(" → ")}). Different roots, so they weren't connected yet. Join them: ${u.newRoot === u.ra ? u.rb : u.ra} now points to ${u.newRoot}.`);
  }
  snap("done", "No edge closed a cycle.", { done: true, answer: "[]" });
  return steps;
}

/** The slow way: try removing each edge, last first, and check whether what's left is a connected tree. */
function slow(edges: Input) {
  const n = edges.length;
  let ops = 0;
  for (let skip = n - 1; skip >= 0; skip--) {
    const adj = adjacency(n, edges.filter((_, i) => i !== skip), 1);
    const seen = new Set([1]);
    const stack = [1];
    while (stack.length) {
      const v = stack.pop()!;
      for (const w of adj[v]) {
        ops++;
        if (!seen.has(w)) {
          seen.add(w);
          stack.push(w);
        }
      }
    }
    if (seen.size === n) return { answer: `[${edges[skip].join(",")}]`, ops };
  }
  return { answer: "[]", ops };
}

function randomInput(seed: number): Input {
  const g = rngFor(seed);
  const n = g.int(3, 7);
  const edges: [number, number][] = [];
  for (let v = 2; v <= n; v++) edges.push([g.int(1, v - 1), v]);
  for (;;) {
    const a = g.int(1, n);
    const b = g.int(1, n);
    if (a === b || edges.some(([x, y]) => (x === a && y === b) || (x === b && y === a))) continue;
    edges.push([Math.min(a, b), Math.max(a, b)]);
    break;
  }
  return g.shuffle(edges);
}

export const redundantConnection: PatternProblem<Input> = {
  id: "redundant-connection",
  title: "Redundant Connection",
  difficulty: "Medium",
  blind75: false,
  slug: "redundant-connection",
  video: "FXWRE67PLL0",
  statement: "A tree on nodes 1..n had one extra edge added. Given the n edges, return an edge whose removal leaves a tree; if there are several, return the one that appears last.",
  examples: [
    { label: "LeetCode's example 2", input: [[1, 2], [2, 3], [3, 4], [1, 4], [1, 5]] },
    { label: "LeetCode's example 1", input: [[1, 2], [1, 3], [2, 3]] },
  ],
  random: randomInput,
  big: { label: "200 nodes; the loop closes at the third edge", input: () => [[1, 2], [2, 3], [1, 3], ...Array.from({ length: 197 }, (_, i): [number, number] => [i + 3, i + 4])] },
  describe: (edges) => `edges = ${showPairs(edges)}`,
  run,
  solve: (edges) => slow(edges).answer,
  brute: slow,
  bruteIdea: "Try removing each edge (last first) and run a DFS to see whether the rest is still connected: O(E × (V + E)).",
  guide: {
    title: "Redundant Connection",
    idea: [
      "Add the edges in order. An edge is redundant when its two ends are already connected by earlier edges: adding it would make a cycle. Because the input is a tree plus one edge, the first such edge is also the last one that could be removed.",
      "Union-find answers “already connected?” in nearly O(1): every node has a parent pointer leading to its set's root. find follows the pointers (flattening the path as it goes); union points one root at the other (the bigger set's root wins).",
    ],
    whenToUse: ["Edges arriving one at a time and the question “are these already connected?”: union-find.", "Detecting the edge that closes a cycle in an undirected graph; counting components (see the next problem)."],
    stages: [
      { id: "start", title: "Every node is its own root", detail: "", pseudo: "par = list(range(n + 1)); rank = [1] * (n + 1)" },
      { id: "union", title: "Different roots → join them", detail: "", pseudo: "p1, p2 = find(n1), find(n2); par[p2] = p1" },
      { id: "cycle", title: "Same root → this edge closes a cycle", detail: "", pseudo: "if p1 == p2: return [n1, n2]" },
      { id: "done", title: "The redundant edge", detail: "", pseudo: "" },
    ],
    legend: [
      { tone: "found", label: "Edges added" },
      { tone: "current", label: "Edge being added / its ends" },
      { tone: "swap", label: "The redundant edge" },
      { tone: "pointer", label: "A root (parent[x] = x)" },
    ],
    complexity: { time: "O(n · α(n))", space: "O(n)", why: "n unions and finds; with path compression and union by rank each is nearly constant (α is the inverse Ackermann function)." },
    pitfalls: ["Compare roots, not the nodes' direct parents.", "Nodes are numbered from 1: make the parent array n + 1 long."],
    tryThis: ["In example 2, edge 1–4 closes the loop 1–2–3–4.", "Watch parent[] change: a whole set joins another by changing a single root."],
    python: py,
  },
};
