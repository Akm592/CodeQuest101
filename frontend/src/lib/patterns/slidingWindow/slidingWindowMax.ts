// Sliding Window Maximum (NeetCode 150 · Sliding Window).

import py from "../../guides/python/neetcode/sliding_window_max.py?raw";
import { row, rngFor, show } from "../helpers";
import type { PatternProblem, PatternStep } from "../types";
import { windowRow } from "./window";

type Input = { nums: number[]; k: number };

function run({ nums, k }: Input): PatternStep[] {
  const steps: PatternStep[] = [];
  const q: number[] = []; // indices, values decreasing
  const out: number[] = [];
  let ops = 0;
  const snap = (stage: string, r: number, explanation: string, over: Record<number, "swap" | "found" | undefined> = {}, extra: Partial<PatternStep> = {}) => {
    const l = Math.max(0, r - k + 1);
    steps.push({
      stage,
      explanation,
      rows: [
        stage === "done" ? row("nums", nums) : windowRow("nums", nums, l, r, over),
        row("deque (front → back)", q.map((i) => nums[i]), q.length ? { 0: "found" } : {}, Object.fromEntries(q.map((i, j) => [j, `i=${i}`]))),
        row("output", out, stage === "record" || stage === "done" ? { [out.length - 1]: "found" } : {}),
      ],
      vars: [
        { name: "k", value: String(k) },
        { name: "window max = nums[deque front]", value: q.length ? String(nums[q[0]]) : "–", tone: "found" },
      ],
      ops,
      ...extra,
    });
  };
  snap("start", -1, `Slide a window of ${k} over nums. The deque keeps candidates for the max, biggest at the front. A number is dropped once a bigger, newer number arrives: it can never be the max again.`);
  for (let r = 0; r < nums.length; r++) {
    const x = nums[r];
    const popped: number[] = [];
    while (q.length && nums[q[q.length - 1]] < x) {
      popped.push(nums[q.pop()!]);
      ops++;
    }
    q.push(r);
    ops++;
    snap(
      "push",
      r,
      popped.length
        ? `${x} arrives. Remove ${popped.join(", ")} from the back: ${popped.length === 1 ? "it's" : "they're"} smaller than ${x} and older, so ${popped.length === 1 ? "it" : "they"} will leave the window first and can never be its max. Then push ${x}.`
        : `${x} arrives. ${q.length > 1 ? `Nothing behind it is smaller, so just push it to the back: it may become the max after the bigger ones leave.` : "The deque was empty, so push it."}`,
    );
    if (q[0] <= r - k) {
      const gone = q.shift()!;
      ops++;
      snap("expire", r, `The front, ${nums[gone]} at index ${gone}, has slid out of the window (it starts at ${r - k + 1} now). Remove it from the front.`);
    }
    if (r >= k - 1) {
      out.push(nums[q[0]]);
      ops++;
      snap("record", r, `The window [${r - k + 1}..${r}] is full. Its max is the deque's front: ${nums[q[0]]}.`, { [q[0]]: "found" });
    }
  }
  snap("done", nums.length - 1, `Done: the max of every window is ${show(out)}.`, {}, { done: true, answer: show(out) });
  return steps;
}

export const slidingWindowMax: PatternProblem<Input> = {
  id: "sliding-window-max",
  title: "Sliding Window Maximum",
  difficulty: "Hard",
  blind75: false,
  slug: "sliding-window-maximum",
  video: "DfljaUwZsOk",
  statement: "Given nums and a window size k, slide the window from the left end to the right end one step at a time, and return the maximum of each window.",
  examples: [
    { label: "[1,3,-1,-3,5,3,6,7], k=3", input: { nums: [1, 3, -1, -3, 5, 3, 6, 7], k: 3 } },
    { label: "[9,8,7,6,5,4], k=3", input: { nums: [9, 8, 7, 6, 5, 4], k: 3 } },
    { label: "[2,1,5,3,4,1,6], k=4", input: { nums: [2, 1, 5, 3, 4, 1, 6], k: 4 } },
  ],
  random: (seed) => {
    const g = rngFor(seed);
    const nums = Array.from({ length: g.int(4, 10) }, () => g.int(-5, 9));
    return { nums, k: g.int(1, Math.min(4, nums.length)) };
  },
  big: { label: "n = 200, k = 40", input: () => ({ nums: Array.from({ length: 200 }, (_, i) => (i * 37) % 101), k: 40 }) },
  describe: ({ nums, k }) => `nums = ${show(nums)}, k = ${k}`,
  run,
  solve: ({ nums, k }) => {
    const out: number[] = [];
    for (let i = 0; i + k <= nums.length; i++) out.push(Math.max(...nums.slice(i, i + k)));
    return out;
  },
  brute: ({ nums, k }) => {
    let ops = 0;
    const out: number[] = [];
    for (let i = 0; i + k <= nums.length; i++) {
      let m = -Infinity;
      for (let j = i; j < i + k; j++) {
        ops++;
        m = Math.max(m, nums[j]);
      }
      out.push(m);
    }
    return { answer: out, ops };
  },
  bruteIdea: "Scan each window to find its max: k reads for each of the n − k + 1 windows, about n·k in total.",
  guide: {
    title: "Sliding Window Maximum",
    idea: [
      "When a big number arrives, every smaller number before it is useless: they leave the window sooner and are smaller, so they can never be the max again. Throw them away.",
      "What's left, kept in a deque (a queue you can pop from both ends), is decreasing from front to back. So the front is always the current max. When the front slides out of the window, pop it from the front. Each index is pushed and popped at most once: O(n).",
    ],
    whenToUse: ["“Max or min of every window”: a monotonic deque.", "The same “drop what can never win” idea gives the monotonic stack in NeetCode's next category."],
    stages: [
      { id: "start", title: "Empty deque", detail: "It will hold indices, with values decreasing front to back.", pseudo: "q = deque(); out = []" },
      { id: "push", title: "New number → drop smaller ones from the back, push", detail: "Smaller, older numbers can never be a window's max again.", pseudo: "while q and nums[q[-1]] < x: q.pop()\nq.append(r)" },
      { id: "expire", title: "Front left the window → pop it", detail: "Its index is before the window's start.", pseudo: "if q[0] <= r - k: q.popleft()" },
      { id: "record", title: "Window full → its max is the front", detail: "Append nums[q[0]] to the output.", pseudo: "if r >= k - 1: out.append(nums[q[0]])" },
      { id: "done", title: "Every window done", detail: "n − k + 1 maxima.", pseudo: "return out" },
    ],
    legend: [
      { tone: "current", label: "Window ends" },
      { tone: "pointer", label: "Inside the window" },
      { tone: "found", label: "The window's max (deque front)" },
    ],
    complexity: { time: "O(n)", space: "O(k)", why: "Each index enters and leaves the deque once; the deque never holds more than k indices." },
    pitfalls: [
      "Store indices in the deque, not values: you need the index to know when the front has left the window.",
      "Pop while the back is strictly smaller. Keeping equal values is fine and handles duplicates correctly.",
    ],
    tryThis: ["Pick “[9,8,7,6,5,4], k=3”: nothing is ever popped from the back, so the front keeps expiring.", "Pick “[1,3,-1,-3,5,3,6,7], k=3”: 5 arriving clears the whole deque."],
    python: py,
  },
};
