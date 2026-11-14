// K Closest Points to Origin (NeetCode 150 · Heap / Priority Queue).

import py from "../../guides/python/neetcode/k_closest.py?raw";
import { row, rngFor } from "../helpers";
import type { PatternProblem, PatternStep } from "../types";
import { Heap, heapNodes, heapRow, pathEdge, pathTone } from "./heap";

type P = [number, number];
type Input = { points: P[]; k: number };

const d2 = ([x, y]: P) => x * x + y * y;
const pt = ([x, y]: P) => `(${x},${y})`;
const showPts = (ps: P[]) => `[${ps.map(pt).join(", ")}]`;
/** Points in a fixed order, so any valid answer prints the same. */
const sortPts = (ps: P[]) => [...ps].sort((a, b) => d2(a) - d2(b) || a[0] - b[0] || a[1] - b[1]);

function run({ points, k }: Input): PatternStep[] {
  const steps: PatternStep[] = [];
  const h = new Heap("max");
  let at = -1;
  const dropped = new Set<number>();
  const snap = (stage: string, explanation: string, tone: (i: number) => ReturnType<ReturnType<typeof pathTone>> = () => undefined, edge = tone, extra: Partial<PatternStep> = {}) =>
    steps.push({
      stage,
      explanation,
      rows: [
        row("points", points.map(pt), Object.fromEntries(points.map((_, i) => [i, i === at ? "current" : dropped.has(i) ? "idle" : i < at ? "pointer" : undefined])), Object.fromEntries(points.map((p, i) => [i, `d²=${d2(p)}`]))),
        heapRow(`max-heap by distance² (size ≤ k = ${k})`, h, tone),
      ],
      tree: { title: "the max-heap: the farthest of the k closest is on top", nodes: heapNodes(h, { tone, edge, note: (i) => pt((h.a[i].data as { p: P }).p) }) },
      vars: [{ name: "k", value: String(k) }],
      ops: h.ops,
      ...extra,
    });
  snap("start", `Compare points by squared distance x² + y² (no square root needed). Keep the k = ${k} closest seen so far in a max-heap, so the farthest of them is on top, ready to be thrown out.`);
  points.forEach((p, i) => {
    at = i;
    const path = h.push({ key: d2(p), data: { p, i } });
    if (h.size <= k) {
      snap("push", `Push ${pt(p)} with distance² ${d2(p)}. The heap holds ${h.size} of ${k}.`, pathTone(path), pathEdge(path));
      return;
    }
    const { top, path: down } = h.pop();
    const out = top.data as { p: P; i: number };
    dropped.add(out.i);
    snap(
      "evict",
      out.i === i
        ? `Push ${pt(p)} (distance² ${d2(p)}) and pop the top: it's ${pt(out.p)} itself, farther than all ${k} kept points, so it's thrown straight back out.`
        : `Push ${pt(p)} (distance² ${d2(p)}). That makes ${k + 1}, so pop the top: ${pt(out.p)} with distance² ${top.key} is the farthest and is thrown out.`,
      pathTone(down),
      pathEdge(down),
    );
  });
  at = points.length;
  const ans = showPts(sortPts(h.a.map((it) => (it.data as { p: P }).p)));
  snap("done", `Every point has been seen. The ${k} left in the heap are the closest: ${ans}.`, () => "found", () => undefined, { done: true, answer: ans });
  return steps;
}

export const kClosest: PatternProblem<Input> = {
  id: "k-closest",
  title: "K Closest Points to Origin",
  difficulty: "Medium",
  blind75: false,
  slug: "k-closest-points-to-origin",
  video: "rI2EBUEMfTk",
  statement: "Given points on a plane and a number k, return the k points closest to the origin (0, 0), in any order.",
  examples: [
    { label: "LeetCode's example 2 (k = 2)", input: { points: [[3, 3], [5, -1], [-2, 4]], k: 2 } },
    { label: "six points, k = 3", input: { points: [[1, 3], [-2, 2], [4, 0], [0, 1], [3, -3], [-1, -1]], k: 3 } },
  ],
  random: (seed) => {
    const g = rngFor(seed);
    // Distinct distances, so the answer is unique.
    const seen = new Set<number>();
    const points: P[] = [];
    while (points.length < g.int(3, 7)) {
      const p: P = [g.int(-5, 5), g.int(-5, 5)];
      if (seen.has(d2(p))) continue;
      seen.add(d2(p));
      points.push(p);
    }
    return { points, k: g.int(1, points.length) };
  },
  big: { label: "1,000 points, k = 3", input: () => ({ points: Array.from({ length: 1000 }, (_, i): P => [((i * 37) % 101) - 50, ((i * 61) % 103) - 51]), k: 3 }) },
  describe: ({ points, k }) => `points = ${showPts(points)}, k = ${k}`,
  run,
  solve: ({ points, k }) => showPts(sortPts(sortPts(points).slice(0, k))),
  brute: ({ points, k }) => {
    // Sorting all n points (merge sort): about n·log₂n comparisons plus as many moves.
    const n = points.length;
    return { answer: showPts(sortPts(sortPts(points).slice(0, k))), ops: 2 * Math.ceil(n * Math.log2(Math.max(2, n))) };
  },
  bruteIdea: "Sort every point by distance and take the first k: O(n log n), even when k is tiny. (Its ops are estimated as n·log₂n comparisons plus n·log₂n moves, like the heap’s comparisons plus swaps.)",
  guide: {
    title: "K Closest Points to Origin",
    idea: [
      "You only need to remember k points at a time. Keep them in a max-heap keyed by distance, so the farthest kept point is on top. Push each new point; if the heap grows past k, pop the top. Whatever is left at the end is the k closest.",
      "That's O(n log k). NeetCode's video also shows the other heap approach: heapify all n points by distance in a min-heap (O(n)) and pop k times (O(k log n)). Both beat sorting when k is small.",
    ],
    whenToUse: ["“k smallest / closest / most frequent”: a heap of size k ordered the opposite way, so the worst kept item is on top.", "Compare squared distances to avoid square roots."],
    stages: [
      { id: "start", title: "An empty max-heap", detail: "Python: push −distance into heapq.", pseudo: "heap = []" },
      { id: "push", title: "Push the point", detail: "", pseudo: "heappush(heap, (-(x*x + y*y), x, y))" },
      { id: "evict", title: "More than k → pop the farthest", detail: "", pseudo: "if len(heap) > k: heappop(heap)" },
      { id: "done", title: "The heap holds the k closest", detail: "", pseudo: "return [[x, y] for _, x, y in heap]" },
    ],
    legend: [
      { tone: "current", label: "Point being added / where a value settled" },
      { tone: "swap", label: "Path a value moved along" },
      { tone: "idle", label: "Thrown out" },
      { tone: "found", label: "The k closest" },
    ],
    complexity: { time: "O(n log k)", space: "O(k)", why: "n pushes and pops on a heap that never holds more than k + 1 points." },
    pitfalls: ["A min-heap of size k would throw out the closest point, not the farthest. Use a max-heap (negate in Python).", "No square roots: comparing x² + y² gives the same order."],
    tryThis: ["In “six points, k = 3”, watch (4,0) get pushed and then thrown out.", "Press “Random” with k = 1: the heap is a single point, the closest so far."],
    python: py,
  },
};
