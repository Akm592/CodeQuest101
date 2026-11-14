// Kth Largest Element in a Stream (NeetCode 150 · Heap / Priority Queue).

import py from "../../guides/python/neetcode/kth_largest_stream.py?raw";
import { row, rngFor, show } from "../helpers";
import type { PatternProblem, PatternStep } from "../types";
import { Heap, heapNodes, heapRow, pathEdge, pathTone } from "./heap";

type Input = { k: number; nums: number[]; adds: number[] };

function run({ k, nums, adds }: Input): PatternStep[] {
  const steps: PatternStep[] = [];
  const h = new Heap("min");
  const out: number[] = [];
  let at = -1; // index into adds, −1 while building
  let built = 0;
  const snap = (stage: string, explanation: string, tone: (i: number) => ReturnType<ReturnType<typeof pathTone>> = () => undefined, edge = tone, extra: Partial<PatternStep> = {}) =>
    steps.push({
      stage,
      explanation,
      rows: [
        row("nums (the starting list)", nums, Object.fromEntries(nums.map((_, i) => [i, i < built ? "idle" : undefined]))),
        row("add(val) calls", adds, Object.fromEntries(adds.map((_, i) => [i, i < at ? "idle" : i === at ? "current" : undefined]))),
        heapRow(`min-heap array (size ≤ k = ${k})`, h, tone),
      ],
      tree: { title: "the min-heap: the smallest of the k largest sits on top", nodes: heapNodes(h, { tone, edge, tag: (i) => (i === 0 ? "kth" : undefined) }) },
      vars: [
        { name: "k", value: String(k) },
        { name: "returned so far", value: out.length ? show(out) : "–", tone: "found" },
      ],
      ops: h.ops,
      ...extra,
    });
  snap("start", `Keep only the k = ${k} largest values seen, in a min-heap. Its top is the smallest of them, which is exactly the kth largest. A new value only matters if it beats that top.`);
  const add = (v: number, returning: boolean) => {
    const path = pushPath(h, v);
    const ret = returning ? ` Return the top: ${h.peek()!.key}.` : "";
    if (h.size > k) {
      snap("push", `Push ${v}: it goes in at the bottom and swaps upward while it's smaller than its parent${path.length > 1 ? ` (${path.length - 1} swap${path.length === 2 ? "" : "s"})` : ""}. Now there are ${h.size} values, one too many.`, pathTone(path), pathEdge(path));
      const { top, path: down } = h.pop();
      if (returning) out.push(h.peek()!.key);
      snap("trim", `Pop the top (${top.key}): it's the smallest, so it can't be among the ${k} largest. The last value moves to the top and sinks to its place.${returning ? ` Return the top: ${h.peek()!.key}.` : ""}`, (i) => (i === 0 ? "found" : pathTone(down)(i)), pathEdge(down));
    } else {
      if (returning) out.push(h.peek()!.key);
      snap("push", `Push ${v}: it goes in at the bottom and swaps upward while it's smaller than its parent. The heap has ${h.size} of ${k} values.${ret}`, pathTone(path), pathEdge(path));
    }
  };
  for (const v of nums) {
    add(v, false);
    built++;
  }
  adds.forEach((v, i) => {
    at = i;
    add(v, true);
  });
  at = adds.length;
  snap("done", `All adds done. They returned ${show(out)}.`, (i) => (i === 0 ? "found" : undefined), () => undefined, { done: true, answer: show(out) });
  return steps;
}

const pushPath = (h: Heap, v: number) => h.push({ key: v });

/** The slow way: a sorted list, largest first; each add slides the value into place. */
function slow({ k, nums, adds }: Input) {
  const sorted: number[] = [];
  let ops = 0;
  const insert = (v: number) => {
    let i = 0;
    while (i < sorted.length && sorted[i] > v) {
      i++;
      ops++;
    }
    sorted.splice(i, 0, v);
    ops += sorted.length - i; // shifting the rest along
  };
  nums.forEach(insert);
  const out = adds.map((v) => {
    insert(v);
    ops++;
    return sorted[k - 1];
  });
  return { answer: show(out), ops };
}

export const kthLargestStream: PatternProblem<Input> = {
  id: "kth-largest-stream",
  title: "Kth Largest Element in a Stream",
  difficulty: "Easy",
  blind75: false,
  slug: "kth-largest-element-in-a-stream",
  video: "hOjcdrqMoQ8",
  statement: "Design a class that starts with k and a list nums. Each add(val) adds a number to the stream and returns the kth largest number seen so far.",
  examples: [
    { label: "LeetCode's example (k = 3)", input: { k: 3, nums: [4, 5, 8, 2], adds: [3, 5, 10, 9, 4] } },
    { label: "k = 2, one to start", input: { k: 2, nums: [5], adds: [7, 3, 9, 1, 8] } },
  ],
  random: (seed) => {
    const g = rngFor(seed);
    const k = g.int(1, 4);
    // LeetCode guarantees at least k values once the first add returns.
    const nums = Array.from({ length: g.int(Math.max(0, k - 1), 6) }, () => g.int(1, 20));
    return { k, nums, adds: Array.from({ length: g.int(3, 6) }, () => g.int(1, 20)) };
  },
  big: { label: "k = 5, 200 values, then 200 adds", input: () => ({ k: 5, nums: Array.from({ length: 200 }, (_, i) => (i * 37) % 211), adds: Array.from({ length: 200 }, (_, i) => (i * 53) % 223) }) },
  describe: ({ k, nums, adds }) => `k = ${k}, nums = ${show(nums)}, adds = ${show(adds)}`,
  run,
  solve: (input) => slow(input).answer,
  brute: slow,
  bruteIdea: "Keep every value in a sorted list and read position k − 1. Each add has to find its place and shift the values after it: O(n) per add, and the list keeps growing.",
  guide: {
    title: "Kth Largest Element in a Stream",
    idea: [
      "Only the k largest values ever matter. Keep exactly those in a min-heap: its top is the smallest of the k largest, which is the kth largest overall.",
      "add(val): push it; if the heap now holds k + 1 values, pop the top (the smallest, which can't be in the top k any more). Then the top is the answer. Each add is O(log k), and the heap never grows past k.",
    ],
    whenToUse: ["“kth largest” or “top k” over a stream: a min-heap of size k.", "For the kth smallest, flip it: a max-heap of size k."],
    stages: [
      { id: "start", title: "A min-heap of at most k values", detail: "", pseudo: "self.heap, self.k = nums, k; heapify(self.heap)" },
      { id: "push", title: "Push the new value", detail: "It swaps up while smaller than its parent.", pseudo: "heappush(self.heap, val)" },
      { id: "trim", title: "Too many → pop the smallest", detail: "", pseudo: "while len(self.heap) > self.k: heappop(self.heap)" },
      { id: "done", title: "The top is the kth largest", detail: "", pseudo: "return self.heap[0]" },
    ],
    legend: [
      { tone: "current", label: "Where the moved value ended" },
      { tone: "swap", label: "Path it swapped along" },
      { tone: "found", label: "The top: kth largest" },
    ],
    complexity: { time: "O(log k) per add", space: "O(k)", why: "The heap never holds more than k + 1 values, and push and pop walk one root-to-leaf path." },
    pitfalls: ["Use a min-heap, not a max-heap: you want quick access to the smallest of the top k.", "Trim the starting list down to k too, not just the values added later."],
    tryThis: ["In LeetCode's example, add(3) is pushed and then popped straight back off: it's too small to matter.", "Watch the heap array under the tree: index i's children are at 2i + 1 and 2i + 2."],
    python: py,
  },
};
