// Kth Largest Element in an Array (NeetCode 150 · Heap / Priority Queue).

import py from "../../guides/python/neetcode/kth_largest_array.py?raw";
import { row, rngFor, show } from "../helpers";
import type { PatternProblem, PatternStep } from "../types";
import { Heap, heapNodes, heapRow, pathEdge, pathTone } from "./heap";

type Input = { nums: number[]; k: number };

function run({ nums, k }: Input): PatternStep[] {
  const steps: PatternStep[] = [];
  const h = new Heap("min");
  let at = -1;
  const snap = (stage: string, explanation: string, tone: (i: number) => ReturnType<ReturnType<typeof pathTone>> = () => undefined, edge = tone, extra: Partial<PatternStep> = {}) =>
    steps.push({
      stage,
      explanation,
      rows: [row("nums", nums, Object.fromEntries(nums.map((_, i) => [i, i === at ? "current" : i < at ? "idle" : undefined]))), heapRow(`min-heap array (size ≤ k = ${k})`, h, tone)],
      tree: { title: "the min-heap of the k largest so far", nodes: heapNodes(h, { tone, edge, tag: (i) => (i === 0 ? "kth" : undefined) }) },
      vars: [{ name: "k", value: String(k) }],
      ops: h.ops,
      ...extra,
    });
  snap("start", `No need to sort everything. Walk the array keeping the k = ${k} largest values in a min-heap. At the end its top, the smallest of them, is the kth largest.`);
  nums.forEach((v, i) => {
    at = i;
    const path = h.push({ key: v });
    if (h.size <= k) {
      snap("push", `Push ${v}. The heap holds ${h.size} of ${k}.`, pathTone(path), pathEdge(path));
      return;
    }
    const { top, path: down } = h.pop();
    snap(
      "trim",
      top.key === v ? `Push ${v} and pop the top: it's ${v} itself, no bigger than the ${k} kept values, so it's out at once.` : `Push ${v}. That's ${k + 1} values, so pop the smallest, ${top.key}: it can't be among the ${k} largest any more.`,
      pathTone(down),
      pathEdge(down),
    );
  });
  at = nums.length;
  const ans = h.peek()!.key;
  snap("done", `The heap holds the ${k} largest values; its top, ${ans}, is the kth largest.`, (i) => (i === 0 ? "found" : undefined), () => undefined, { done: true, answer: String(ans) });
  return steps;
}

export const kthLargestArray: PatternProblem<Input> = {
  id: "kth-largest-array",
  title: "Kth Largest Element in an Array",
  difficulty: "Medium",
  blind75: false,
  slug: "kth-largest-element-in-an-array",
  video: "XEmy13g1Qxc",
  statement: "Return the kth largest element of an unsorted array (counting duplicates, so in [3, 3, 2] the 2nd largest is 3), ideally without sorting it.",
  examples: [
    { label: "LeetCode's example 1 (k = 2)", input: { nums: [3, 2, 1, 5, 6, 4], k: 2 } },
    { label: "LeetCode's example 2 (k = 4)", input: { nums: [3, 2, 3, 1, 2, 4, 5, 5, 6], k: 4 } },
  ],
  random: (seed) => {
    const g = rngFor(seed);
    const nums = Array.from({ length: g.int(1, 9) }, () => g.int(-5, 15));
    return { nums, k: g.int(1, nums.length) };
  },
  big: { label: "1,000 numbers, k = 3", input: () => ({ nums: Array.from({ length: 1000 }, (_, i) => (i * 7919) % 10007), k: 3 }) },
  describe: ({ nums, k }) => `nums = ${show(nums)}, k = ${k}`,
  run,
  solve: ({ nums, k }) => [...nums].sort((a, b) => b - a)[k - 1],
  brute: ({ nums, k }) => {
    const n = nums.length;
    return { answer: [...nums].sort((a, b) => b - a)[k - 1], ops: 2 * Math.ceil(n * Math.log2(Math.max(2, n))) };
  },
  bruteIdea: "Sort and index: O(n log n). Its ops are estimated as n·log₂n comparisons plus n·log₂n moves, like the heap’s comparisons plus swaps.",
  guide: {
    title: "Kth Largest Element in an Array",
    idea: [
      "Keep a min-heap of the k largest values seen so far. Push each number; when the heap holds k + 1, pop its smallest. After the last number, the top is the kth largest. That's O(n log k).",
      "NeetCode's video goes further with QuickSelect: partition around a pivot like quicksort, then recurse only into the side that holds position n − k. It's O(n) on average (O(n²) in the worst case). The Python tab has both.",
    ],
    whenToUse: ["“kth largest / smallest” in a fixed array: a size-k heap (simple, O(n log k)) or QuickSelect (O(n) average).", "When k is close to n, flip it: the kth largest is the (n − k + 1)th smallest."],
    stages: [
      { id: "start", title: "An empty min-heap", detail: "", pseudo: "heap = []" },
      { id: "push", title: "Push the number", detail: "", pseudo: "heappush(heap, n)" },
      { id: "trim", title: "More than k → pop the smallest", detail: "", pseudo: "if len(heap) > k: heappop(heap)" },
      { id: "done", title: "The top is the answer", detail: "", pseudo: "return heap[0]" },
    ],
    legend: [
      { tone: "current", label: "Number being added / where a value settled" },
      { tone: "swap", label: "Path a value moved along" },
      { tone: "found", label: "The kth largest" },
    ],
    complexity: { time: "O(n log k)", space: "O(k)", why: "n pushes and pops on a heap of at most k + 1 values." },
    pitfalls: ["Duplicates count: in example 2 the 4th largest is 4, after 6, 5 and 5.", "A min-heap, not a max-heap: you throw away the smallest of the kept values."],
    tryThis: ["In example 2, watch the two 5s both stay in the heap.", "Press “Random” with k = 1: the heap is just the largest value so far."],
    python: py,
  },
};
