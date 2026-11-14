// Maximum Product Subarray (NeetCode 150 · 1-D Dynamic Programming).

import py from "../../guides/python/neetcode/max_product.py?raw";
import { row, rngFor, show } from "../helpers";
import type { PatternProblem, PatternStep } from "../types";

type Input = number[];

function run(nums: Input): PatternStep[] {
  const steps: PatternStep[] = [];
  const hi: (number | null)[] = Array(nums.length).fill(null);
  const lo: (number | null)[] = Array(nums.length).fill(null);
  let res = nums[0];
  let bestAt = 0;
  let ops = 0;
  const snap = (stage: string, explanation: string, i?: number, extra: Partial<PatternStep> = {}) =>
    steps.push({
      stage,
      explanation,
      rows: [
        row("nums", nums, Object.fromEntries(nums.map((_, j) => [j, j === i ? "current" : undefined]))),
        row("largest product ending here", hi.map((v) => (v === null ? "" : v)), Object.fromEntries(hi.map((v, j) => [j, j === i ? "current" : j === bestAt && v !== null ? "found" : v !== null ? "pointer" : undefined]))),
        row("smallest product ending here", lo.map((v) => (v === null ? "" : v)), Object.fromEntries(lo.map((v, j) => [j, j === i ? "compare" : v !== null ? "visited" : undefined]))),
      ],
      vars: [{ name: "best product", value: String(res), tone: "found" }],
      ops,
      ...extra,
    });
  snap("start", "A negative number turns the smallest product into the largest. So for each position, track both the largest and the smallest product of a subarray ending there. The next number either extends one of them or starts fresh.");
  for (let i = 0; i < nums.length; i++) {
    ops++;
    const n = nums[i];
    if (i === 0) {
      hi[0] = lo[0] = n;
      res = n;
      bestAt = 0;
      snap("fill", `Start: the only subarray ending at 0 is [${n}], so both are ${n}.`, 0);
      continue;
    }
    const a = n * hi[i - 1]!;
    const b = n * lo[i - 1]!;
    hi[i] = Math.max(n, a, b);
    lo[i] = Math.min(n, a, b);
    const better = hi[i]! > res;
    if (better) {
      res = hi[i]!;
      bestAt = i;
    }
    snap(
      "fill",
      `${n} alone, ${n} × ${hi[i - 1]} = ${a}, or ${n} × ${lo[i - 1]} = ${b}. Largest: ${hi[i]}, smallest: ${lo[i]}.${n < 0 && b === hi[i] && b !== n ? ` The negative ${n} turned the smallest into the largest.` : ""}${better ? ` New best: ${res}.` : ""}`,
      i,
    );
  }
  snap("done", `The largest product of any subarray is ${res}.`, undefined, { done: true, answer: String(res) });
  return steps;
}

/** The slow way: the product of every subarray. */
function slow(nums: Input) {
  let ops = 0;
  let best = -Infinity;
  for (let i = 0; i < nums.length; i++) {
    let p = 1;
    for (let j = i; j < nums.length; j++) {
      ops++;
      p *= nums[j];
      best = Math.max(best, p);
    }
  }
  return { answer: best, ops };
}

export const maxProduct: PatternProblem<Input> = {
  id: "max-product",
  title: "Maximum Product Subarray",
  difficulty: "Medium",
  blind75: true,
  slug: "maximum-product-subarray",
  video: "lXVy6YWFcRM",
  statement: "Return the largest product of a non-empty contiguous subarray of nums.",
  examples: [
    { label: "LeetCode's example 1", input: [2, 3, -2, 4] },
    { label: "two negatives", input: [-2, 3, -4] },
    { label: "a zero in the middle", input: [-2, 0, -1] },
  ],
  random: (seed) => {
    const g = rngFor(seed);
    return Array.from({ length: g.int(1, 7) }, () => g.int(-4, 4));
  },
  big: { label: "200 numbers", input: () => Array.from({ length: 200 }, (_, i) => [2, -1, 1, -2, 1, 3, -1, 1][i % 8]) },
  describe: (nums) => `nums = ${show(nums)}`,
  run,
  solve: (nums) => slow(nums).answer,
  brute: slow,
  bruteIdea: "Multiply out every subarray: n²/2 of them, O(n²) even when each product is built from the one before.",
  guide: {
    title: "Maximum Product Subarray",
    idea: [
      "Unlike sums, products flip sign: a very negative product times a negative number becomes very positive. So keep two values for the subarray ending at each position: the largest product and the smallest.",
      "For the next number n, the candidates are n on its own, n × largest and n × smallest. The new largest and smallest are the max and min of those three. The answer is the best largest seen. A zero resets both (n alone wins).",
    ],
    whenToUse: ["Best subarray product (or anything where a sign can flip the order): track both the max and the min.", "Kadane's algorithm, extended."],
    stages: [
      { id: "start", title: "Track the largest and smallest", detail: "", pseudo: "res = nums[0]; cur_min, cur_max = 1, 1" },
      { id: "fill", title: "Max / min of n, n × max, n × min", detail: "", pseudo: "tmp = n * cur_max; cur_max = max(n * cur_max, n * cur_min, n); cur_min = min(tmp, n * cur_min, n); res = max(res, cur_max)" },
      { id: "done", title: "The best largest", detail: "", pseudo: "return res" },
    ],
    legend: [
      { tone: "current", label: "Position being filled" },
      { tone: "found", label: "Best product so far" },
      { tone: "compare", label: "Smallest product (could flip)" },
    ],
    complexity: { time: "O(n)", space: "O(1)", why: "One pass, keeping two numbers." },
    pitfalls: ["Save the old max before updating, or the min uses the new one.", "The answer can be negative (a single negative number)."],
    tryThis: ["In “two negatives”, −2 × 3 × −4 = 24: the smallest (−6) times −4.", "In “a zero in the middle”, the zero splits the array: the answer is 0."],
    python: py,
  },
};
