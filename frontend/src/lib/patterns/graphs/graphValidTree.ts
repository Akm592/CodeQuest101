// Graph Valid Tree (NeetCode 150 · Graphs).

import py from "../../guides/python/neetcode/graph_valid_tree.py?raw";
import { row, rngFor } from "../helpers";
import type { GEdge, GNode, PatternProblem, PatternStep } from "../types";
import { adjacency, randomEdges, showPairs } from "./graph";

type Input = { n: number; edges: [number, number][] };

function run({ n, edges }: Input): PatternStep[] {
  const steps: PatternStep[] = [];
  const adj = adjacency(n, edges);
  const visit = new Set<number>();
  const stack: number[] = [];
  const used = new Set<string>(); // edges walked by the DFS
  let cur: number | null = null;
  let loop: [number, number] | null = null;
  let ops = 0;
  const ek = (a: number, b: number) => (a < b ? `${a}-${b}` : `${b}-${a}`);
  const snap = (stage: string, explanation: string, extra: Partial<PatternStep> = {}) => {
    const nodes: GNode[] = Array.from({ length: n }, (_, i) => ({ id: `v${i}`, v: String(i), tone: loop && loop.includes(i) ? "swap" : i === cur ? "current" : stack.includes(i) ? "pointer" : visit.has(i) ? "found" : undefined }));
    const gEdges: GEdge[] = edges.map(([a, b]) => ({ a: `v${a}`, b: `v${b}`, tone: loop && ek(...loop) === ek(a, b) ? "swap" : used.has(ek(a, b)) ? "found" : undefined }));
    steps.push({
      stage,
      explanation,
      rows: [row("DFS stack", stack)],
      graph: { title: "the graph", nodes, edges: gEdges },
      vars: [
        { name: "visited", value: `${visit.size} of ${n}`, tone: "found" },
        { name: "edges", value: `${edges.length} (a tree needs ${n - 1})` },
      ],
      ops,
      ...extra,
    });
  };
  snap("start", `A tree is connected and has no cycle. DFS from node 0, remembering which node each step came from. Seeing an already-visited node by any other route than straight back to the parent means a cycle. At the end, every node must have been visited.`);
  const dfs = (v: number, prev: number): boolean => {
    ops++;
    visit.add(v);
    stack.push(v);
    cur = v;
    snap("visit", prev < 0 ? `Start at node ${v}.` : `Go ${prev} → ${v}. Its neighbours: ${adj[v].join(", ") || "none"}.`);
    for (const w of adj[v]) {
      ops++;
      if (w === prev) continue;
      if (visit.has(w)) {
        loop = [v, w];
        cur = v;
        snap("cycle", `Node ${v} leads to ${w}, which is already visited and isn't the node we came from. There are two routes between them: a cycle. Not a tree.`);
        return false;
      }
      used.add(ek(v, w));
      if (!dfs(w, v)) return false;
      cur = v;
    }
    stack.pop();
    return true;
  };
  if (n === 0) {
    snap("done", "No nodes: an empty graph counts as a tree here.", { done: true, answer: "true" });
    return steps;
  }
  if (!dfs(0, -1)) {
    snap("done", "There's a cycle, so the graph is not a tree. Return false.", { done: true, answer: "false" });
    return steps;
  }
  cur = null;
  const ok = visit.size === n;
  snap(
    ok ? "connected" : "disconnected",
    ok ? `No cycle, and the DFS reached all ${n} nodes: connected.` : `No cycle, but the DFS only reached ${visit.size} of ${n} nodes: the graph is in more than one piece.`,
  );
  snap("done", ok ? "Connected with no cycle: a valid tree. Return true." : "Not connected, so not a tree. Return false.", { done: true, answer: String(ok) });
  return steps;
}

/** Cross-check: a tree has exactly n − 1 edges and is connected. */
function check({ n, edges }: Input): boolean {
  if (edges.length !== n - 1) return false;
  const adj = adjacency(n, edges);
  const seen = new Set([0]);
  const stack = [0];
  while (stack.length)
    for (const w of adj[stack.pop()!])
      if (!seen.has(w)) {
        seen.add(w);
        stack.push(w);
      }
  return seen.size === n;
}

export const graphValidTree: PatternProblem<Input> = {
  id: "graph-valid-tree",
  title: "Graph Valid Tree",
  difficulty: "Medium",
  blind75: true,
  slug: "graph-valid-tree",
  video: "bXsUuownnoQ",
  statement: "Given n nodes (0 to n − 1) and a list of undirected edges, return true if the edges form a valid tree: connected, with no cycles.",
  examples: [
    { label: "LeetCode's example 1", input: { n: 5, edges: [[0, 1], [0, 2], [0, 3], [1, 4]] } },
    { label: "LeetCode's example 2 (cycle)", input: { n: 5, edges: [[0, 1], [1, 2], [2, 3], [1, 3], [1, 4]] } },
    { label: "two pieces", input: { n: 4, edges: [[0, 1], [2, 3]] } },
  ],
  random: (seed) => {
    const g = rngFor(seed);
    const n = g.int(2, 6);
    if (g.r() < 0.5) {
      // A random tree, so “true” comes up often.
      const edges: [number, number][] = [];
      for (let v = 1; v < n; v++) edges.push([g.int(0, v - 1), v]);
      return { n, edges: g.shuffle(edges) };
    }
    return { n, edges: randomEdges(seed, n, g.int(1, n)) };
  },
  describe: ({ n, edges }) => `n = ${n}, edges = ${showPairs(edges)}`,
  run,
  solve: check,
  brute: null,
  bruteIdea: "A single DFS (or union-find) is already O(V + E), and every edge has to be read. The answer is cross-checked a different way: exactly n − 1 edges, and connected.",
  guide: {
    title: "Graph Valid Tree",
    idea: [
      "A tree is a connected graph with no cycle. DFS from node 0 with a visited set. In an undirected graph each edge shows up from both ends, so skip the neighbour you just came from; any other visited neighbour means a second route, which is a cycle.",
      "If the DFS finishes without a cycle, check that it visited all n nodes. (A shortcut: a tree on n nodes has exactly n − 1 edges, so any other count is false straight away.)",
    ],
    whenToUse: ["Cycle detection in an undirected graph: DFS that ignores the edge back to the parent.", "“Is this a tree”: connected + acyclic, or connected + n − 1 edges."],
    stages: [
      { id: "start", title: "DFS from node 0", detail: "", pseudo: "visit = set(); dfs(0, -1)" },
      { id: "visit", title: "Visit a node, try its neighbours", detail: "", pseudo: "visit.add(i); for j in adj[i]: if j == prev: continue" },
      { id: "cycle", title: "A visited neighbour (not the parent) → cycle", detail: "", pseudo: "if i in visit: return False" },
      { id: "connected", title: "No cycle, every node visited", detail: "", pseudo: "return dfs(0, -1) and n == len(visit)" },
      { id: "disconnected", title: "No cycle, but some nodes unreached", detail: "", pseudo: "" },
      { id: "done", title: "Answer", detail: "", pseudo: "" },
    ],
    legend: [
      { tone: "current", label: "Node being visited" },
      { tone: "pointer", label: "On the DFS stack" },
      { tone: "found", label: "Visited / edge walked" },
      { tone: "swap", label: "Edge that closes a cycle" },
    ],
    complexity: { time: "O(V + E)", space: "O(V + E)", why: "Each node is visited once and each edge looked at from both ends." },
    pitfalls: ["Without skipping the parent, every undirected edge looks like a cycle.", "No cycle isn't enough: the graph must also be connected."],
    tryThis: ["In example 2, the DFS goes 0 → 1 → 2 → 3, and 3's neighbour 1 is visited but isn't its parent.", "“Two pieces” has no cycle but only reaches 2 of 4 nodes."],
    python: py,
  },
};
