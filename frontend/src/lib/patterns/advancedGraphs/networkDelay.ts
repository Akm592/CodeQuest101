// Network Delay Time (NeetCode 150 · Advanced Graphs).

import py from "../../guides/python/neetcode/network_delay.py?raw";
import { row, rngFor } from "../helpers";
import { Heap } from "../heap/heap";
import type { GEdge, GNode, PatternProblem, PatternStep } from "../types";

/** times[i] = [u, v, w]: a signal from u reaches v after w. Nodes are 1..n. */
type Input = { times: [number, number, number][]; n: number; k: number };

const showTimes = (t: number[][]) => `[${t.map((e) => `[${e.join(",")}]`).join(", ")}]`;

function run({ times, n, k }: Input): PatternStep[] {
  const steps: PatternStep[] = [];
  const adj = new Map<number, [number, number, number][]>(); // u → [v, w, edge index]
  times.forEach(([u, v, w], i) => {
    if (!adj.has(u)) adj.set(u, []);
    adj.get(u)!.push([v, w, i]);
  });
  const heap = new Heap("min");
  const dist = new Map<number, number>(); // final times
  const best = new Map<number, number>([[k, 0]]); // best time pushed so far
  const via = new Map<number, number>(); // index of the edge that gave a node its best time
  let cur: number | null = null;
  let hot: number[] = [];
  let ops = 0;
  const snap = (stage: string, explanation: string, extra: Partial<PatternStep> = {}) => {
    const tree = new Set(via.values());
    const nodes: GNode[] = Array.from({ length: n }, (_, i) => {
      const v = i + 1;
      return { id: `v${v}`, v: String(v), tone: v === cur ? "current" : dist.has(v) ? "found" : best.has(v) ? "pointer" : undefined, note: dist.has(v) ? `t=${dist.get(v)}` : best.has(v) ? `≤${best.get(v)}` : undefined, tag: v === k ? "start" : undefined };
    });
    const edges: GEdge[] = times.map(([u, v, w], i) => ({ a: `v${u}`, b: `v${v}`, label: String(w), tone: hot.includes(i) ? "compare" : tree.has(i) ? "found" : undefined }));
    const pq = [...heap.a].sort((a, b) => a.key - b.key || Number(a.label) - Number(b.label));
    steps.push({
      stage,
      explanation,
      rows: [row("min-heap: (time, node), smallest first", pq.map((it) => `(${it.key}, ${it.data})`), pq.length ? { 0: "current" } : {})],
      graph: { title: "signal times: t = final, ≤ = best found so far", nodes, edges, directed: true },
      vars: [{ name: "nodes reached", value: `${dist.size} of ${n}`, tone: "found" }],
      ops: ops + heap.ops,
      ...extra,
    });
  };
  heap.push({ key: 0, label: String(k), data: k });
  snap("start", `Dijkstra's algorithm from node ${k}. A min-heap holds (time, node) pairs; the smallest time is always final, because every other route is already slower and edges only add time.`);
  while (heap.size) {
    const { top } = heap.pop();
    const u = top.data as number;
    ops++;
    hot = [];
    if (dist.has(u)) {
      cur = u;
      snap("stale", `Pop (${top.key}, ${u}): node ${u} already has its final time ${dist.get(u)}, so this older, slower entry is skipped.`);
      continue;
    }
    dist.set(u, top.key);
    cur = u;
    const relaxed: string[] = [];
    for (const [v, w, i] of adj.get(u) ?? []) {
      ops++;
      hot.push(i);
      if (dist.has(v)) continue;
      const t = top.key + w;
      if (!best.has(v) || t < best.get(v)!) {
        best.set(v, t);
        via.set(v, i);
        heap.push({ key: t, label: String(v), data: v });
        relaxed.push(`${v} at ${top.key} + ${w} = ${t}`);
      }
    }
    snap("pop", `Pop (${top.key}, ${u}): the signal reaches node ${u} at time ${top.key}, and that's final.${relaxed.length ? ` Push its neighbours: ${relaxed.join("; ")}.` : (adj.get(u) ?? []).length ? " None of its neighbours gets a faster time from here." : " It has no outgoing edges."}`);
  }
  cur = null;
  hot = [];
  const ans = dist.size === n ? Math.max(...dist.values()) : -1;
  snap("done", dist.size === n ? `Every node has its time. The last one to hear the signal hears it at ${ans}.` : `Only ${dist.size} of ${n} nodes can be reached, so not every node gets the signal. Return −1.`, { done: true, answer: String(ans) });
  return steps;
}

/** The slow way: Bellman-Ford, relaxing every edge n − 1 times. */
function slow({ times, n, k }: Input) {
  const d = Array<number>(n + 1).fill(Infinity);
  d[k] = 0;
  let ops = 0;
  for (let r = 0; r < n - 1; r++)
    for (const [u, v, w] of times) {
      ops++;
      if (d[u] + w < d[v]) d[v] = d[u] + w;
    }
  const m = Math.max(...d.slice(1));
  return { answer: m === Infinity ? -1 : m, ops };
}

export const networkDelay: PatternProblem<Input> = {
  id: "network-delay",
  title: "Network Delay Time",
  difficulty: "Medium",
  blind75: false,
  slug: "network-delay-time",
  video: "EaphyqKU4PQ",
  statement: "A network has n nodes and directed edges times[i] = [u, v, w]: a signal from u takes w to reach v. A signal starts at node k. Return the time until every node has it, or −1 if some never do.",
  examples: [
    { label: "LeetCode's example 1", input: { times: [[2, 1, 1], [2, 3, 1], [3, 4, 1]], n: 4, k: 2 } },
    { label: "a slow direct edge", input: { times: [[1, 2, 9], [1, 3, 2], [3, 2, 3], [2, 4, 1], [3, 4, 7]], n: 4, k: 1 } },
    { label: "unreachable node", input: { times: [[1, 2, 1]], n: 3, k: 1 } },
  ],
  random: (seed) => {
    const g = rngFor(seed);
    const n = g.int(2, 5);
    const times: [number, number, number][] = [];
    const seen = new Set<string>();
    for (let i = 0; i < g.int(1, 2 * n); i++) {
      const u = g.int(1, n);
      const v = g.int(1, n);
      if (u === v || seen.has(`${u},${v}`)) continue;
      seen.add(`${u},${v}`);
      times.push([u, v, g.int(1, 9)]);
    }
    return { times, n, k: g.int(1, n) };
  },
  big: {
    label: "80 nodes, 240 edges",
    input: () => {
      const g = rngFor(11);
      const times: [number, number, number][] = [];
      for (let v = 2; v <= 80; v++) times.push([g.int(1, v - 1), v, g.int(1, 20)]);
      for (let i = 0; i < 161; i++) times.push([g.int(1, 80), g.int(1, 80), g.int(1, 20)]);
      return { times: times.filter(([u, v]) => u !== v), n: 80, k: 1 };
    },
  },
  describe: ({ times, n, k }) => `times = ${showTimes(times)}, n = ${n}, k = ${k}`,
  run,
  solve: (input) => slow(input).answer,
  brute: slow,
  bruteIdea: "Bellman-Ford: relax every edge, n − 1 times over, so the times have room to settle along any path: O(V × E). Dijkstra only expands each node once.",
  guide: {
    title: "Network Delay Time",
    idea: [
      "The time a node hears the signal is its shortest-path distance from k, and the answer is the largest of those. Edge weights are positive, so Dijkstra's algorithm works.",
      "Keep a min-heap of (time, node). Pop the smallest: if the node is already done, skip it; otherwise its time is final, and each neighbour gets pushed with time + edge weight. A node can sit in the heap several times; only its first pop counts.",
    ],
    whenToUse: ["Shortest paths with non-negative weights from one source: Dijkstra with a min-heap.", "“How long until everything is reached” on a weighted graph: the largest shortest-path distance."],
    stages: [
      { id: "start", title: "Heap holds (0, k)", detail: "", pseudo: "min_heap = [(0, k)]; visit = set()" },
      { id: "pop", title: "Pop the smallest: final; push neighbours", detail: "", pseudo: "w1, n1 = heappop(min_heap); visit.add(n1); t = w1; for n2, w2 in edges[n1]: heappush(min_heap, (w1 + w2, n2))" },
      { id: "stale", title: "Already final → skip", detail: "", pseudo: "if n1 in visit: continue" },
      { id: "done", title: "Largest time, or −1", detail: "", pseudo: "return t if len(visit) == n else -1" },
    ],
    legend: [
      { tone: "current", label: "Node just popped" },
      { tone: "found", label: "Final time / edge on a shortest path" },
      { tone: "pointer", label: "In the heap (best so far)" },
      { tone: "compare", label: "Edges being relaxed" },
    ],
    complexity: { time: "O(E log V)", space: "O(V + E)", why: "Each edge pushes at most one heap entry, and each push or pop is O(log E) = O(log V)." },
    pitfalls: ["Skip a node popped a second time: its first pop already had the smallest time.", "Dijkstra breaks with negative weights; use Bellman-Ford then."],
    tryThis: ["In “a slow direct edge”, node 2 is first pushed at 9, then reached at 2 + 3 = 5 through node 3.", "In “unreachable node”, nothing points to node 3."],
    python: py,
  },
};
