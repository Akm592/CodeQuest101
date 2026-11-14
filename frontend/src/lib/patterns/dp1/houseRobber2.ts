// House Robber II (NeetCode 150 · 1-D Dynamic Programming).

import py from "../../guides/python/neetcode/house_robber_ii.py?raw";
import { row, rngFor, show } from "../helpers";
import type { PatternProblem, PatternStep } from "../types";
import { robSlow, robSteps } from "./houseRobber";

type Input = number[];

function run(nums: Input): PatternStep[] {
  const n = nums.length;
  const ring = (skip: number) => row("the circle (the first and last house are neighbours)", nums, Object.fromEntries(nums.map((_, i) => [i, i === skip ? "idle" : undefined])), Object.fromEntries(nums.map((_, i) => [i, i === skip ? "left out" : String(i)])));
  if (n === 1) {
    const steps: PatternStep[] = [];
    steps.push({ stage: "start", explanation: "A single house has no neighbours: rob it.", rows: [ring(-1)], vars: [], ops: 1 });
    steps.push({ stage: "done", explanation: `The answer is ${nums[0]}.`, rows: [ring(-1)], vars: [], ops: 1, done: true, answer: String(nums[0]) });
    return steps;
  }
  const a = robSteps(nums.slice(1), "without the first", `The houses form a circle, so the first and last are neighbours and can't both be robbed. Every answer leaves out the first house or the last one. So solve House Robber twice: once without the first house…`, "start", 0, () => [ring(0)]);
  const ra = a.best[a.best.length - 1] ?? 0;
  const b = robSteps(nums.slice(0, -1), "without the last", `…and once without the last house. Without the first house the best was ${ra}.`, "second", a.ops, () => [ring(n - 1)]);
  const rb = b.best[b.best.length - 1] ?? 0;
  const ans = Math.max(ra, rb);
  b.snap("done", `Without the first house: ${ra}. Without the last: ${rb}. The answer is the larger, ${ans}.`, undefined, [], { done: true, answer: String(ans) });
  return [...a.steps, ...b.steps];
}

export const houseRobber2: PatternProblem<Input> = {
  id: "house-robber-ii",
  title: "House Robber II",
  difficulty: "Medium",
  blind75: true,
  slug: "house-robber-ii",
  video: "rWAJCfYYOvM",
  statement: "Like House Robber, but the houses are in a circle: the first and last house are neighbours. Return the most money you can rob without robbing two neighbours.",
  examples: [
    { label: "LeetCode's example 2", input: [1, 2, 3, 1] },
    { label: "the ends are the prize", input: [5, 1, 2, 6] },
    { label: "LeetCode's example 1", input: [2, 3, 2] },
  ],
  random: (seed) => {
    const g = rngFor(seed);
    return Array.from({ length: g.int(1, 8) }, () => g.int(0, 12));
  },
  big: { label: "26 houses", input: () => Array.from({ length: 26 }, (_, i) => (i * 13) % 17) },
  describe: (nums) => `nums = ${show(nums)}`,
  run,
  solve: (nums) => slow(nums).answer,
  brute: (nums) => slow(nums),
  bruteIdea: "Recursion with no memory, twice (without the first house, and without the last): about 2 × 1.6^n calls.",
  guide: {
    title: "House Robber II",
    idea: [
      "In a circle, house 0 and house n − 1 are neighbours, so no answer robs both. That means every answer fits in one of two straight rows: houses 1..n − 1, or houses 0..n − 2.",
      "Run plain House Robber on each row and take the larger. (With a single house, just rob it.)",
    ],
    whenToUse: ["A circular version of a line problem: break the circle by solving “without the first” and “without the last”.", "Reuse a solved subproblem instead of a new recurrence."],
    stages: [
      { id: "start", title: "House Robber without the first house", detail: "", pseudo: "helper(nums[1:])" },
      { id: "fill", title: "Rob house i or skip it", detail: "", pseudo: "rob1, rob2 = rob2, max(n + rob1, rob2)" },
      { id: "second", title: "House Robber without the last house", detail: "", pseudo: "helper(nums[:-1])" },
      { id: "done", title: "The larger of the two", detail: "", pseudo: "return max(nums[0], helper(nums[1:]), helper(nums[:-1]))" },
    ],
    legend: [
      { tone: "current", label: "House being decided" },
      { tone: "compare", label: "The two earlier answers it uses" },
      { tone: "found", label: "Filled" },
      { tone: "idle", label: "Left out this pass" },
    ],
    complexity: { time: "O(n)", space: "O(1)", why: "Two linear passes." },
    pitfalls: ["A single house: both slices are empty, so return nums[0].", "Don't drop both ends at once: then you'd miss answers that use one of them."],
    tryThis: ["In “the ends are the prize”, 5 and 6 are neighbours round the circle: the best is 5 + 2 = 7 or 1 + 6 = 7.", "LeetCode's example 1: 2 and 2 are neighbours, so the answer is 3."],
    python: py,
  },
};

function slow(nums: Input) {
  if (nums.length === 1) return { answer: nums[0], ops: 1 };
  const a = robSlow(nums.slice(1));
  const b = robSlow(nums.slice(0, -1));
  return { answer: Math.max(a.answer, b.answer), ops: a.ops + b.ops };
}
