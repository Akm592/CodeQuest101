// Clone Graph (NeetCode 150 · Graphs).

import py from "../../guides/python/neetcode/clone_graph.py?raw";
import { rngFor } from "../helpers";
import type { GEdge, GNode, PEntry, PatternProblem, PatternStep } from "../types";
import { randomEdges } from "./graph";

/** LeetCode's format: adj[i] lists the neighbours of node i + 1. */
type Input = number[][];

const showAdj = (adj: number[][]) => `[${adj.map((l) => `[${l.join(",")}]`).join(", ")}]`;

function run(adj: Input): PatternStep[] {
  const n = adj.length;
  const steps: PatternStep[] = [];
  const copies = new Map<number, number[]>(); // old node → its copy's neighbour list so far
  const stack: number[] = [];
  let cur: number | null = null;
  let ops = 0;
  const circle = (i: number, dx: number) => {
    const r = Math.max(1, n / 3.2);
    const a = -Math.PI / 2 + (2 * Math.PI * (i - 1)) / Math.max(1, n);
    return { x: dx + r + r * Math.cos(a), y: r + r * Math.sin(a) };
  };
  const shift = 2 * Math.max(1, n / 3.2) + 1.6;
  const snap = (stage: string, explanation: string, extra: Partial<PatternStep> = {}) => {
    const nodes: GNode[] = [];
    const edges: GEdge[] = [];
    for (let i = 1; i <= n; i++) {
      nodes.push({ id: `o${i}`, v: String(i), ...circle(i, 0), tone: i === cur ? "current" : stack.includes(i) ? "pointer" : copies.has(i) ? "visited" : undefined });
      adj[i - 1].forEach((j) => i < j && edges.push({ a: `o${i}`, b: `o${j}` }));
    }
    const wired = new Set<string>();
    for (const [i, nb] of copies) {
      nodes.push({ id: `c${i}`, v: `${i}′`, ...circle(i, shift), tone: i === cur ? "current" : "found" });
      // A copied edge shows as soon as either end has been wired up.
      for (const j of nb) {
        const k = i < j ? `${i}-${j}` : `${j}-${i}`;
        if (copies.has(j) && !wired.has(k)) {
          wired.add(k);
          edges.push({ a: `c${i}`, b: `c${j}`, tone: "found" });
        }
      }
    }
    steps.push({
      stage,
      explanation,
      rows: [],
      graph: { title: "original (left) and the copy being built (right, ′)", nodes, edges },
      map: { title: "old node → its copy", entries: [...copies.keys()].sort((a, b) => a - b).map((i): PEntry => ({ k: String(i), v: `${i}′ [${copies.get(i)!.map((j) => `${j}′`).join(", ")}]`, tone: i === cur ? "current" : undefined })) },
      vars: [{ name: "copies made", value: `${copies.size} of ${n}` }],
      ops,
      ...extra,
    });
  };
  if (!n) {
    snap("start", "The graph is empty: return None.");
    snap("done", "Nothing to copy.", { done: true, answer: "[]" });
    return steps;
  }
  snap("start", "Walk the graph with DFS from node 1, keeping a hash map from each old node to its copy. The map does two jobs: it finds a node's copy when wiring up neighbours, and it stops the walk from going round a cycle forever.");
  const dfs = (i: number): void => {
    ops++;
    copies.set(i, []);
    stack.push(i);
    cur = i;
    snap("copy", `Node ${i} has no copy yet: make ${i}′ and put old → new in the map. ${adj[i - 1].length ? `Then copy its neighbour${adj[i - 1].length === 1 ? "" : "s"} ${adj[i - 1].join(", ")}.` : "It has no neighbours."}`);
    for (const j of adj[i - 1]) {
      ops++;
      const fresh = !copies.has(j);
      if (fresh) dfs(j);
      copies.get(i)!.push(j);
      cur = i;
      snap("link", fresh ? `Back at ${i}: dfs(${j}) returned the new copy ${j}′. Add it to ${i}′'s neighbours.` : `${i}'s neighbour ${j} was copied already: the map gives ${j}′ straight away. Add it to ${i}′'s neighbours.`);
    }
    stack.pop();
  };
  dfs(1);
  cur = null;
  const out = Array.from({ length: n }, (_, i) => copies.get(i + 1) ?? []);
  snap("done", `Every node and edge is copied. The copy has the same shape as the original: ${showAdj(out)}.`, { done: true, answer: showAdj(out) });
  return steps;
}

/** A random connected graph in LeetCode's format. */
function randomGraph(seed: number): Input {
  const g = rngFor(seed);
  const n = g.int(1, 5);
  const edges: [number, number][] = [];
  for (let i = 1; i < n; i++) edges.push([g.int(0, i - 1), i]); // a spanning tree keeps it connected
  for (const [a, b] of randomEdges(seed + 99, n, g.int(0, 2))) if (!edges.some(([x, y]) => x === a && y === b)) edges.push([a, b]);
  const adj = Array.from({ length: n }, () => [] as number[]);
  for (const [a, b] of edges) {
    adj[a].push(b + 1);
    adj[b].push(a + 1);
  }
  return adj.map((l) => l.sort((x, y) => x - y));
}

export const cloneGraph: PatternProblem<Input> = {
  id: "clone-graph",
  title: "Clone Graph",
  difficulty: "Medium",
  blind75: true,
  slug: "clone-graph",
  video: "mQeF6bN8hMk",
  statement: "Given a node of a connected undirected graph, return a deep copy: new nodes with the same values and the same connections.",
  examples: [
    { label: "LeetCode's example (a square)", input: [[2, 4], [1, 3], [2, 4], [1, 3]] },
    { label: "a triangle with a tail", input: [[2, 3], [1, 3], [1, 2, 4], [3]] },
    { label: "one node", input: [[]] },
  ],
  random: randomGraph,
  describe: (adj) => `adjList = ${showAdj(adj)}`,
  run,
  solve: (adj) => showAdj(adj),
  brute: null,
  bruteIdea: "Every node and edge has to be copied, so O(V + E) is the least possible. The answer must have the same shape as the input, which is what the check compares.",
  guide: {
    title: "Clone Graph",
    idea: [
      "Keep a map from each original node to its copy. dfs(node): if it's already in the map, return its copy. Otherwise make a copy, store it in the map first, then for each neighbour append dfs(neighbour) to the copy's neighbours.",
      "Storing the copy before recursing is what makes cycles safe: when the walk comes back round to a node, the map already has its copy.",
    ],
    whenToUse: ["Copying any structure with shared or cyclic references (graphs, lists with random pointers): a map from old to new.", "DFS or BFS both work; the map is the key."],
    stages: [
      { id: "start", title: "Empty map, start at node 1", detail: "", pseudo: "old_to_new = {}; return dfs(node)" },
      { id: "copy", title: "No copy yet → make one, store it", detail: "", pseudo: "copy = Node(node.val); old_to_new[node] = copy" },
      { id: "link", title: "Add the neighbour's copy", detail: "", pseudo: "for nei in node.neighbors: copy.neighbors.append(dfs(nei))" },
      { id: "done", title: "Return the copy of the start node", detail: "", pseudo: "return copy" },
    ],
    legend: [
      { tone: "current", label: "Node being copied" },
      { tone: "pointer", label: "On the DFS stack" },
      { tone: "visited", label: "Original already copied" },
      { tone: "found", label: "Copy" },
    ],
    complexity: { time: "O(V + E)", space: "O(V)", why: "Each node is copied once and each edge followed once from each end." },
    pitfalls: ["Put the copy in the map before visiting neighbours, or a cycle recurses forever.", "Return the existing copy when a node is seen again; don't make a second one."],
    tryThis: ["In the square, the walk goes 1 → 2 → 3 → 4, and 4's neighbour 1 is already in the map.", "Compare the left and right pictures: same shape, all new nodes."],
    python: py,
  },
};
