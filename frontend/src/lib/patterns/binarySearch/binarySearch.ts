// Binary Search (NeetCode 150 · Binary Search).

import py from "../../guides/python/neetcode/binary_search.py?raw";
import { rngFor, show } from "../helpers";
import type { PatternProblem, PatternStep } from "../types";
import { rangeRow } from "./range";

type Input = { nums: number[]; target: number };

function run({ nums, target }: Input): PatternStep[] {
  const steps: PatternStep[] = [];
  let l = 0;
  let r = nums.length - 1;
  let ops = 0;
  const snap = (stage: string, m: number | null, explanation: string, over: Record<number, "found" | undefined> = {}, extra: Partial<PatternStep> = {}) =>
    steps.push({
      stage,
      explanation,
      rows: [rangeRow("nums (sorted)", nums, l, r, m, over)],
      vars: [
        { name: "target", value: String(target) },
        { name: "L", value: String(l) },
        { name: "R", value: String(r) },
        ...(m !== null ? [{ name: "M = (L + R) // 2", value: String(m), tone: "compare" as const }] : []),
        { name: "still possible", value: String(Math.max(0, r - l + 1)), tone: "pointer" },
      ],
      ops,
      ...extra,
    });
  snap("start", null, `The list is sorted, so one comparison in the middle tells us which half ${target} could be in. Start with the whole list: L = 0, R = ${nums.length - 1}.`);
  while (l <= r) {
    const m = (l + r) >> 1;
    ops++;
    if (nums[m] === target) {
      snap("found", m, `nums[${m}] = ${target}. Found it at index ${m}.`, { [m]: "found" }, { done: true, answer: String(m) });
      return steps;
    }
    if (nums[m] < target) {
      snap("right", m, `nums[${m}] = ${nums[m]} is less than ${target}. Everything at or left of M is even smaller, so rule it all out: L = M + 1.`);
      l = m + 1;
    } else {
      snap("left", m, `nums[${m}] = ${nums[m]} is more than ${target}. Everything at or right of M is even bigger, so rule it all out: R = M − 1.`);
      r = m - 1;
    }
  }
  snap("missing", null, `L passed R: nothing is left that could be ${target}, so it isn't in the list. Return −1.`, {}, { done: true, answer: "-1" });
  return steps;
}

export const binarySearchProblem: PatternProblem<Input> = {
  id: "binary-search",
  title: "Binary Search",
  difficulty: "Easy",
  blind75: false,
  slug: "binary-search",
  video: "s4DPM8ct1pI",
  statement: "Given a sorted list of distinct numbers and a target, return the target's index, or −1 if it isn't there. It must run in O(log n) time.",
  examples: [
    { label: "find 9", input: { nums: [-1, 0, 3, 5, 9, 12], target: 9 } },
    { label: "find 2 (missing)", input: { nums: [-1, 0, 3, 5, 9, 12], target: 2 } },
    { label: "15 numbers, find 56", input: { nums: [2, 5, 8, 12, 16, 23, 31, 37, 42, 50, 56, 61, 70, 78, 91], target: 56 } },
  ],
  random: (seed) => {
    const g = rngFor(seed);
    const nums = [...new Set(Array.from({ length: g.int(4, 14) }, () => g.int(-10, 40)))].sort((a, b) => a - b);
    return { nums, target: g.r() < 0.7 ? g.pick(nums) : g.int(-10, 40) };
  },
  big: { label: "200 numbers, target missing", input: () => ({ nums: Array.from({ length: 200 }, (_, i) => i * 2), target: 401 }) },
  describe: ({ nums, target }) => `nums = ${show(nums)}, target = ${target}`,
  run,
  solve: ({ nums, target }) => nums.indexOf(target),
  brute: ({ nums, target }) => {
    let ops = 0;
    for (let i = 0; i < nums.length; i++) {
      ops++;
      if (nums[i] === target) return { answer: i, ops };
    }
    return { answer: -1, ops };
  },
  bruteIdea: "Check every number from the left: up to n comparisons. Binary search needs about log₂ n, which is 8 for 200 numbers and 20 for a million.",
  guide: {
    title: "Binary Search",
    idea: [
      "Look at the middle value. If it's too small, the target can only be to its right, because the list is sorted, so the whole left half is ruled out in one comparison. If it's too big, rule out the right half.",
      "Each comparison halves what's left, so n numbers need only about log₂ n comparisons. Stop when you find it, or when L passes R and nothing is left.",
    ],
    whenToUse: ["The data is sorted, or you can ask a yes/no question whose answer flips once (all “no” then all “yes”).", "“O(log n)” in the problem statement almost always means binary search."],
    stages: [
      { id: "start", title: "Whole list in range", detail: "L = 0, R = n − 1.", pseudo: "l, r = 0, len(nums) - 1" },
      { id: "right", title: "Middle too small → go right", detail: "Rule out M and everything left of it.", pseudo: "if nums[m] < target: l = m + 1" },
      { id: "left", title: "Middle too big → go left", detail: "Rule out M and everything right of it.", pseudo: "elif nums[m] > target: r = m - 1" },
      { id: "found", title: "Middle equals target → return M", detail: "Found.", pseudo: "else: return m" },
      { id: "missing", title: "L > R → −1", detail: "The range is empty.", pseudo: "return -1" },
    ],
    legend: [
      { tone: "compare", label: "Middle M" },
      { tone: "idle", label: "Ruled out" },
      { tone: "found", label: "Found" },
    ],
    complexity: { time: "O(log n)", space: "O(1)", why: "The range halves on every comparison." },
    pitfalls: [
      "Use while l <= r, not l < r, or a one-element range is never checked.",
      "Move to m + 1 or m − 1, never to m itself, or the loop can get stuck.",
      "In languages with fixed-size integers, compute m = l + (r − l) // 2 so l + r can't overflow.",
    ],
    tryThis: ["Pick “15 numbers, find 56”: 4 comparisons instead of 11.", "Pick “find 2 (missing)” and watch L pass R."],
    python: py,
  },
};
