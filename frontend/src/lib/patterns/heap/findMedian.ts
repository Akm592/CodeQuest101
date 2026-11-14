// Find Median from Data Stream (NeetCode 150 · Heap / Priority Queue).

import py from "../../guides/python/neetcode/find_median.py?raw";
import type { VizTone } from "../../guides/types";
import { row, rngFor, show } from "../helpers";
import type { PatternProblem, PatternStep } from "../types";
import { Heap, heapNodes, heapRow, pathEdge, pathTone } from "./heap";

/** Calls like "add 5" and "median". */
type Input = { calls: string[] };

const fmt = (x: number) => (Number.isInteger(x) ? String(x) : x.toFixed(1));
type ToneFn = (i: number) => VizTone | undefined;
const none: ToneFn = () => undefined;

function run({ calls }: Input): PatternStep[] {
  const steps: PatternStep[] = [];
  const small = new Heap("max"); // the lower half
  const large = new Heap("min"); // the upper half
  const out: string[] = [];
  let k = -1;
  const snap = (stage: string, explanation: string, ts: ToneFn = none, tl: ToneFn = none, es: ToneFn = ts, el: ToneFn = tl, extra: Partial<PatternStep> = {}) => {
    const dx = Math.max(small.size, 3) + 1;
    steps.push({
      stage,
      explanation,
      rows: [
        row("calls", calls, Object.fromEntries(calls.map((_, j) => [j, j < k ? "idle" : j === k ? "current" : undefined]))),
        heapRow("small: max-heap (the lower half)", small, ts),
        heapRow("large: min-heap (the upper half)", large, tl),
      ],
      tree: {
        title: "the two halves: small's top and large's top sit on either side of the middle",
        nodes: [...heapNodes(small, { prefix: "s", tone: ts, edge: es }), ...heapNodes(large, { prefix: "l", dx, tone: tl, edge: el })],
        labels: [
          { x: 0, text: "small (max)" },
          { x: dx, text: "large (min)" },
        ],
      },
      vars: [
        { name: "sizes (small, large)", value: `${small.size}, ${large.size}` },
        { name: "medians returned", value: out.length ? show(out) : "–", tone: "found" },
      ],
      ops: small.ops + large.ops,
      ...extra,
    });
  };
  snap("start", "Split the numbers into two halves. small is a max-heap holding the lower half, so its top is the largest low number. large is a min-heap holding the upper half, so its top is the smallest high number. The median is one of those tops, or their average.");
  calls.forEach((call, j) => {
    k = j;
    const [op, a] = call.split(" ");
    if (op === "median") {
      const m = small.size > large.size ? small.peek()!.key : large.size > small.size ? large.peek()!.key : (small.peek()!.key + large.peek()!.key) / 2;
      out.push(fmt(m));
      const top: ToneFn = (i) => (i === 0 ? "found" : undefined);
      snap(
        "median",
        small.size === large.size ? `Even count: the median is the average of the two tops, (${small.peek()!.key} + ${large.peek()!.key}) / 2 = ${fmt(m)}.` : `Odd count: the bigger half's top is the median, ${fmt(m)}.`,
        small.size >= large.size ? top : none,
        large.size >= small.size ? top : none,
        none,
        none,
      );
      return;
    }
    const v = Number(a);
    const p = small.push({ key: v });
    snap("add", `add ${v}: push it into small first.`, pathTone(p), none, pathEdge(p), none);
    if (large.size && small.peek()!.key > large.peek()!.key) {
      const before = large.peek()!.key;
      const { top, path } = small.pop();
      const up = large.push(top);
      snap("order", `small's top (${top.key}) is bigger than large's top (${before}), so the halves are out of order. Move ${top.key} over to large.`, pathTone(path), pathTone(up), pathEdge(path), pathEdge(up));
    }
    if (small.size > large.size + 1) {
      const { top, path } = small.pop();
      const up = large.push(top);
      snap("balance", `small has ${small.size + 1} numbers and large ${large.size - 1}: too uneven. Move small's top (${top.key}) to large.`, pathTone(path), pathTone(up), pathEdge(path), pathEdge(up));
    } else if (large.size > small.size + 1) {
      const { top, path } = large.pop();
      const up = small.push(top);
      snap("balance", `large has ${large.size + 1} numbers and small ${small.size - 1}: too uneven. Move large's top (${top.key}) to small.`, pathTone(up), pathTone(path), pathEdge(up), pathEdge(path));
    }
  });
  k = calls.length;
  snap("done", `All calls done. The medians were ${show(out)}.`, none, none, none, none, { done: true, answer: show(out) });
  return steps;
}

/** The slow way: keep every number in a sorted list; each add slides the number into place. */
function slow({ calls }: Input) {
  const s: number[] = [];
  const out: string[] = [];
  let ops = 0;
  for (const call of calls) {
    const [op, a] = call.split(" ");
    if (op === "median") {
      ops++;
      const n = s.length;
      out.push(fmt(n % 2 ? s[n >> 1] : (s[n / 2 - 1] + s[n / 2]) / 2));
      continue;
    }
    const v = Number(a);
    let i = 0;
    while (i < s.length && s[i] < v) {
      i++;
      ops++;
    }
    s.splice(i, 0, v);
    ops += s.length - i;
  }
  return { answer: show(out), ops };
}

export const findMedian: PatternProblem<Input> = {
  id: "find-median",
  title: "Find Median from Data Stream",
  difficulty: "Hard",
  blind75: true,
  slug: "find-median-from-data-stream",
  video: "itmhHWaHupI",
  statement: "Design a class with addNum(num), which adds a number from a stream, and findMedian(), which returns the median of all numbers added so far.",
  examples: [
    { label: "LeetCode's example", input: { calls: ["add 1", "add 2", "median", "add 3", "median"] } },
    { label: "out of order", input: { calls: ["add 5", "add 15", "add 1", "median", "add 3", "median", "add 8", "add 7", "median"] } },
  ],
  random: (seed) => {
    const g = rngFor(seed);
    const calls = Array.from({ length: g.int(4, 9) }, (_, i) => (i === 0 || g.r() < 0.65 ? `add ${g.int(-5, 20)}` : "median"));
    calls.push("median");
    return { calls };
  },
  big: { label: "300 numbers, a median after each", input: () => ({ calls: Array.from({ length: 300 }, (_, i) => [`add ${(i * 7919) % 1009}`, "median"]).flat() }) },
  describe: ({ calls }) => calls.join(", "),
  run,
  solve: (input) => slow(input).answer,
  brute: slow,
  bruteIdea: "Keep all the numbers in a sorted list and read the middle. Each add has to find its place and shift everything after it: O(n) per add.",
  guide: {
    title: "Find Median from Data Stream",
    idea: [
      "The median only needs the middle of the sorted order. Keep the lower half in a max-heap (small) and the upper half in a min-heap (large): their tops are the two numbers either side of the middle.",
      "addNum: push into small. If small's top is now bigger than large's top, move it to large (the halves must stay in order). If one heap has two more numbers than the other, move a top across to rebalance. findMedian: the top of the bigger heap, or the average of both tops when they're the same size.",
    ],
    whenToUse: ["A running median, or any “middle of a stream” question: two heaps facing each other.", "The same idea gives a sliding-window median (with lazy deletion)."],
    stages: [
      { id: "start", title: "Two empty heaps", detail: "", pseudo: "self.small, self.large = [], []  # max-heap (negated), min-heap" },
      { id: "add", title: "Push into small", detail: "", pseudo: "heappush(self.small, -num)" },
      { id: "order", title: "Out of order → move small's top to large", detail: "", pseudo: "if self.large and -self.small[0] > self.large[0]: heappush(self.large, -heappop(self.small))" },
      { id: "balance", title: "Sizes differ by 2 → move a top across", detail: "", pseudo: "if len(self.small) > len(self.large) + 1: heappush(self.large, -heappop(self.small))" },
      { id: "median", title: "Read the tops", detail: "", pseudo: "return (-self.small[0] + self.large[0]) / 2  # or the bigger heap's top" },
      { id: "done", title: "All calls answered", detail: "", pseudo: "" },
    ],
    legend: [
      { tone: "current", label: "Where a value settled" },
      { tone: "swap", label: "Path it moved along" },
      { tone: "found", label: "Tops used for the median" },
    ],
    complexity: { time: "O(log n) add, O(1) median", space: "O(n)", why: "Each add does a constant number of heap pushes and pops; the median only reads the tops." },
    pitfalls: ["Python's heapq is a min-heap: store negated values in small.", "Check both rules every time: order first (small's top ≤ large's top), then sizes."],
    tryThis: ["In “out of order”, 15 goes into small and then moves to large to even the sizes. Later, 8 is bigger than large’s top (5), so the order rule moves it across.", "Press “Random” and check that every number in small is ≤ every number in large."],
    python: py,
  },
};
