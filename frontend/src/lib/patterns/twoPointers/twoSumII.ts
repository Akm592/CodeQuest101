// Two Sum II - Input Array Is Sorted (NeetCode 150 · Two Pointers).

import py from "../../guides/python/neetcode/two_sum_ii.py?raw";
import { row, rngFor, show } from "../helpers";
import type { PatternProblem, PatternStep } from "../types";

interface Input {
  numbers: number[];
  target: number;
}

function run({ numbers, target }: Input): PatternStep[] {
  const steps: PatternStep[] = [];
  let ops = 0;
  let l = 0;
  let r = numbers.length - 1;
  const ruledOut = new Set<number>();
  const snap = (stage: string, explanation: string, extra: Partial<PatternStep> = {}) =>
    steps.push({
      stage,
      explanation,
      rows: [row("numbers", numbers, { ...Object.fromEntries([...ruledOut].map((i) => [i, "idle"])), [l]: stage === "found" ? "found" : "current", [r]: stage === "found" ? "found" : "current" }, { [l]: "L", [r]: "R" })],
      vars: [
        { name: "target", value: String(target) },
        { name: "numbers[L] + numbers[R]", value: `${numbers[l]} + ${numbers[r]} = ${numbers[l] + numbers[r]}`, tone: "pointer" },
      ],
      ops,
      ...extra,
    });
  snap("start", `L starts at the smallest number (${numbers[l]}) and R at the largest (${numbers[r]}).`);
  while (l < r) {
    const total = numbers[l] + numbers[r];
    ops++;
    if (total < target) {
      snap("tooSmall", `${total} is less than ${target}. Any pair with ${numbers[l]} would be at most ${total} (R is already the biggest), so ${numbers[l]} is ruled out: move L right.`);
      ruledOut.add(l);
      l++;
    } else if (total > target) {
      snap("tooBig", `${total} is more than ${target}. Any pair with ${numbers[r]} would be at least ${total} (L is already the smallest), so ${numbers[r]} is ruled out: move R left.`);
      ruledOut.add(r);
      r--;
    } else {
      snap("found", `${numbers[l]} + ${numbers[r]} = ${target}. The answer is their 1-based positions: [${l + 1}, ${r + 1}].`, { done: true, answer: show([l + 1, r + 1]) });
      return steps;
    }
  }
  snap("found", "The pointers met: no pair adds up to the target.", { done: true, answer: "[]" });
  return steps;
}

export const twoSumII: PatternProblem<Input> = {
  id: "two-sum-ii",
  title: "Two Sum II (sorted input)",
  difficulty: "Medium",
  blind75: false,
  slug: "two-sum-ii-input-array-is-sorted",
  video: "cQ1Oz4ckceM",
  statement: "Given a list sorted from smallest to largest and a target, return the 1-based positions of the two numbers that add up to the target. There's exactly one answer, and you must use only O(1) extra memory.",
  examples: [
    { label: "[2,7,11,15], 9", input: { numbers: [2, 7, 11, 15], target: 9 } },
    { label: "[1,3,4,5,7,10,11], 9", input: { numbers: [1, 3, 4, 5, 7, 10, 11], target: 9 } },
    { label: "[-3,-1,0,2,6,8,12], 20", input: { numbers: [-3, -1, 0, 2, 6, 8, 12], target: 20 } },
  ],
  random: (seed) => {
    const g = rngFor(seed);
    for (;;) {
      const n = g.int(4, 9);
      const numbers = g.shuffle(Array.from({ length: 30 }, (_, i) => i - 8)).slice(0, n).sort((a, b) => a - b);
      const i = g.int(0, n - 2);
      const j = g.int(i + 1, n - 1);
      const target = numbers[i] + numbers[j];
      let pairs = 0;
      for (let a = 0; a < n; a++) for (let b = a + 1; b < n; b++) if (numbers[a] + numbers[b] === target) pairs++;
      if (pairs === 1) return { numbers, target };
    }
  },
  big: { label: "200 sorted numbers, pair in the middle", input: () => ({ numbers: Array.from({ length: 200 }, (_, i) => i * 3), target: 99 * 3 + 100 * 3 }) },
  describe: ({ numbers, target }) => `numbers = ${show(numbers)}, target = ${target}`,
  run,
  solve: ({ numbers, target }) => {
    for (let i = 0; i < numbers.length; i++) for (let j = i + 1; j < numbers.length; j++) if (numbers[i] + numbers[j] === target) return [i + 1, j + 1];
    return [];
  },
  brute: ({ numbers, target }) => {
    let ops = 0;
    for (let i = 0; i < numbers.length; i++)
      for (let j = i + 1; j < numbers.length; j++) {
        ops++;
        if (numbers[i] + numbers[j] === target) return { answer: [i + 1, j + 1], ops };
      }
    return { answer: [], ops };
  },
  bruteIdea: "Try every pair: about n²/2. (A hash map like Two Sum is O(n) but uses O(n) memory, which this problem forbids.)",
  guide: {
    title: "Two Sum II",
    idea: [
      "The list is sorted, and that's the whole trick. Start with the smallest number (L) and the largest (R).",
      "If their sum is too small, the smallest number can't be in the answer: even paired with the largest it falls short. So move L right. If the sum is too big, the largest can't be in it, so move R left. Every step throws away one number for good, so it takes at most n steps.",
    ],
    whenToUse: ["Sorted input and a question about pairs: two pointers from both ends.", "If it isn't sorted, either sort first (O(n log n), loses the original indices) or use a hash map (Two Sum)."],
    stages: [
      { id: "start", title: "Pointers at both ends", detail: "L on the smallest number, R on the largest.", pseudo: "l, r = 0, len(numbers) - 1" },
      { id: "tooSmall", title: "Sum too small → move L right", detail: "The smallest number can't reach the target with anything, so drop it.", pseudo: "if total < target: l += 1" },
      { id: "tooBig", title: "Sum too big → move R left", detail: "The largest number overshoots with anything, so drop it.", pseudo: "elif total > target: r -= 1" },
      { id: "found", title: "Exact → answer", detail: "Return the 1-based positions.", pseudo: "return [l + 1, r + 1]" },
    ],
    legend: [
      { tone: "current", label: "L and R" },
      { tone: "idle", label: "Ruled out for good" },
      { tone: "found", label: "The pair" },
    ],
    complexity: { time: "O(n)", space: "O(1)", why: "Each step rules out one number, so at most n − 1 steps, and only two indices are stored." },
    pitfalls: ["The answer is 1-based here (LeetCode's rule), unlike Two Sum.", "This only works because the list is sorted. On unsorted input the “ruled out” reasoning breaks."],
    tryThis: ["Pick “[1,3,4,5,7,10,11], 9” and read why each number is ruled out.", "Notice the very first step can be either “too small” or “too big”: it depends on the data."],
    python: py,
  },
};
