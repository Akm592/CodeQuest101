// Longest Increasing Subsequence (NeetCode 150 · 1-D Dynamic Programming).

import py from "../../guides/python/neetcode/lis.py?raw";
import { row, rngFor, show } from "../helpers";
import type { PatternProblem, PatternStep } from "../types";
import { dpRow } from "./dp";

type Input = number[];

function run(nums: Input): PatternStep[] {
  const n = nums.length;
  const steps: PatternStep[] = [];
  const dp: (number | null)[] = Array(n).fill(null);
  let ops = 0;
  const snap = (stage: string, explanation: string, cur?: number, reads: number[] = [], extra: Partial<PatternStep> = {}) =>
    steps.push({
      stage,
      explanation,
      rows: [
        row("nums", nums, Object.fromEntries(nums.map((_, j) => [j, j === cur ? "current" : reads.includes(j) ? "compare" : undefined]))),
        dpRow("lis[i] = longest increasing subsequence starting at i", dp, { cur, reads, filled: (i) => dp[i] !== null }),
      ],
      vars: [{ name: "longest so far", value: String(Math.max(0, ...dp.map((v) => v ?? 0))), tone: "found" }],
      ops,
      ...extra,
    });
  snap("start", "Work from the right. lis[i] is the longest increasing subsequence that starts with nums[i]: just nums[i] (length 1), or nums[i] followed by the best subsequence starting at a later, bigger number.");
  for (let i = n - 1; i >= 0; i--) {
    let best = 1;
    let from: number[] = [];
    for (let j = i + 1; j < n; j++) {
      ops++;
      if (nums[i] < nums[j] && 1 + dp[j]! > best) {
        best = 1 + dp[j]!;
        from = [j];
      }
    }
    dp[i] = best;
    snap("fill", from.length ? `nums[${i}] = ${nums[i]}: the best later number bigger than it is nums[${from[0]}] = ${nums[from[0]]}, with lis ${dp[from[0]]}. So lis[${i}] = 1 + ${dp[from[0]]} = ${best}.` : `nums[${i}] = ${nums[i]}: no later number is bigger, so lis[${i}] = 1.`, i, from);
  }
  const ans = Math.max(0, ...dp.map((v) => v ?? 0));
  snap("done", `The longest increasing subsequence has length ${ans}: the largest lis[i].`, undefined, [], { done: true, answer: String(ans) });
  return steps;
}

/** The slow way: try every subsequence (2^n) and keep the longest increasing one. */
function slow(nums: Input) {
  let ops = 0;
  let best = 0;
  const go = (i: number, last: number, len: number) => {
    ops++;
    if (i === nums.length) {
      best = Math.max(best, len);
      return;
    }
    if (nums[i] > last) go(i + 1, nums[i], len + 1);
    go(i + 1, last, len);
  };
  go(0, -Infinity, 0);
  return { answer: best, ops };
}

export const lis: PatternProblem<Input> = {
  id: "lis",
  title: "Longest Increasing Subsequence",
  difficulty: "Medium",
  blind75: true,
  slug: "longest-increasing-subsequence",
  video: "cjWnW0hdF1Y",
  statement: "Return the length of the longest strictly increasing subsequence of nums (the elements in order, not necessarily next to each other).",
  examples: [
    { label: "LeetCode's example 1", input: [10, 9, 2, 5, 3, 7, 101, 18] },
    { label: "LeetCode's example 2", input: [0, 1, 0, 3, 2, 3] },
    { label: "all equal", input: [7, 7, 7, 7] },
  ],
  random: (seed) => {
    const g = rngFor(seed);
    return Array.from({ length: g.int(1, 8) }, () => g.int(0, 9));
  },
  big: { label: "22 numbers", input: () => Array.from({ length: 22 }, (_, i) => (i * 7) % 23) },
  describe: (nums) => `nums = ${show(nums)}`,
  run,
  solve: (nums) => slow(nums).answer,
  brute: slow,
  bruteIdea: "Try every subsequence: each element is in or out, 2^n choices, and keep the longest one that's increasing.",
  guide: {
    title: "Longest Increasing Subsequence",
    idea: [
      "Let lis[i] be the longest increasing subsequence that starts at i. It's 1 (just nums[i]) or 1 + lis[j] for any later j with nums[j] > nums[i]. Fill it from the right, so every lis[j] is ready.",
      "The answer is the largest lis[i]. That's O(n²). (A cleverer O(n log n) method keeps the smallest possible tail for each length and binary-searches into it.)",
    ],
    whenToUse: ["Best subsequence where each element depends on a chosen earlier (or later) one: O(n²) DP over pairs.", "“Longest chain” problems: envelopes, boxes, pairs."],
    stages: [
      { id: "start", title: "Fill from the right", detail: "", pseudo: "LIS = [1] * len(nums)" },
      { id: "fill", title: "1 + the best later, bigger start", detail: "", pseudo: "for j in range(i + 1, len(nums)): if nums[i] < nums[j]: LIS[i] = max(LIS[i], 1 + LIS[j])" },
      { id: "done", title: "The largest lis[i]", detail: "", pseudo: "return max(LIS)" },
    ],
    legend: [
      { tone: "current", label: "Entry being filled" },
      { tone: "compare", label: "The later entry it extends" },
      { tone: "found", label: "Filled" },
    ],
    complexity: { time: "O(n²)", space: "O(n)", why: "Each entry looks at every later one." },
    pitfalls: ["Strictly increasing: equal numbers don't extend it.", "The answer is max(lis), not lis[0]."],
    tryThis: ["In example 1, 2 → 5 → 7 → 101 (or 2 → 3 → 7 → 18) has length 4.", "“All equal” has length 1."],
    python: py,
  },
};
