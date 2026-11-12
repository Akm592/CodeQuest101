// Find Minimum in Rotated Sorted Array (NeetCode 150 · Binary Search).

import py from "../../guides/python/neetcode/find_min_rotated.py?raw";
import { show } from "../helpers";
import type { PatternProblem, PatternStep } from "../types";
import { rangeRow } from "./range";
import { bigRotated, randomRotated } from "./rotated";

type Input = number[];

function run(nums: Input): PatternStep[] {
  const steps: PatternStep[] = [];
  let l = 0;
  let r = nums.length - 1;
  let res = nums[0];
  let ops = 0;
  const snap = (stage: string, m: number | null, explanation: string, extra: Partial<PatternStep> = {}) =>
    steps.push({
      stage,
      explanation,
      rows: [stage === "done" ? rangeRow("nums", nums, 0, nums.length - 1, null, { [nums.indexOf(res)]: "found" }) : rangeRow("nums (rotated)", nums, l, r, m)],
      vars: [
        { name: "L, R", value: `${l}, ${r}` },
        ...(m !== null ? [{ name: "M", value: String(m), tone: "compare" as const }] : []),
        { name: "smallest seen", value: String(res), tone: "found" },
      ],
      ops,
      ...extra,
    });
  snap("start", null, "A sorted list was cut in two and the halves swapped, e.g. [3,4,5,1,2]. The minimum is where the order breaks. Keep the smallest value seen while binary searching for that break.");
  while (l <= r) {
    ops++;
    if (nums[l] < nums[r]) {
      res = Math.min(res, nums[l]);
      snap("sorted", null, `nums[L] = ${nums[l]} < nums[R] = ${nums[r]}: this part is in order with no break, so its smallest value is its first, ${nums[l]}. Stop.`);
      break;
    }
    const m = (l + r) >> 1;
    res = Math.min(res, nums[m]);
    ops++;
    if (nums[m] >= nums[l]) {
      snap("right", m, `nums[M] = ${nums[m]} ≥ nums[L] = ${nums[l]}: L to M is in order, so the break (and the minimum) is to the right of M. L = M + 1.`);
      l = m + 1;
    } else {
      snap("left", m, `nums[M] = ${nums[m]} < nums[L] = ${nums[l]}: the order breaks somewhere between L and M, so the minimum is M or left of it. M is already counted: R = M − 1.`);
      r = m - 1;
    }
  }
  snap("done", null, `The minimum is ${res}.`, { done: true, answer: String(res) });
  return steps;
}

export const findMinRotated: PatternProblem<Input> = {
  id: "find-min-rotated",
  title: "Find Minimum in Rotated Sorted Array",
  difficulty: "Medium",
  blind75: true,
  slug: "find-minimum-in-rotated-sorted-array",
  video: "nIVW4P8b1VA",
  statement: "A sorted list of distinct numbers has been rotated: some front part was moved to the end, like [0,1,2,4,5,6,7] → [4,5,6,7,0,1,2]. Return the smallest number in O(log n) time.",
  examples: [
    { label: "[3,4,5,1,2]", input: [3, 4, 5, 1, 2] },
    { label: "[4,5,6,7,0,1,2]", input: [4, 5, 6, 7, 0, 1, 2] },
    { label: "[11,13,15,17] (not rotated)", input: [11, 13, 15, 17] },
  ],
  random: randomRotated,
  big: { label: "200 numbers", input: bigRotated },
  describe: (nums) => `nums = ${show(nums)}`,
  run,
  solve: (nums) => Math.min(...nums),
  brute: (nums) => {
    let ops = 0;
    let m = Infinity;
    for (const x of nums) {
      ops++;
      m = Math.min(m, x);
    }
    return { answer: m, ops };
  },
  bruteIdea: "Scan every number for the smallest: O(n). The rotation keeps two sorted runs, which binary search can use.",
  guide: {
    title: "Find Minimum in Rotated Sorted Array",
    idea: [
      "A rotated list is two sorted runs: a left run of bigger numbers, then a right run of smaller ones. The minimum is the first value of the right run.",
      "Compare the middle with the left end. If nums[M] ≥ nums[L], M is still in the left run, so the minimum is further right. Otherwise M is in the right run, so the minimum is at M or to its left. And once nums[L] < nums[R], the range is plain sorted and its first value is the answer.",
    ],
    whenToUse: ["Sorted data with one “break” in it: binary search for the break.", "The trick is always: which half is in order? That tells you which half holds the thing you want."],
    stages: [
      { id: "start", title: "Whole list in range", detail: "res = nums[0] so far.", pseudo: "res = nums[0]; l, r = 0, len(nums) - 1" },
      { id: "sorted", title: "nums[L] < nums[R] → no break here", detail: "The range is in order: its min is nums[L].", pseudo: "res = min(res, nums[l]); break" },
      { id: "right", title: "nums[M] ≥ nums[L] → break is right of M", detail: "L..M is in order.", pseudo: "l = m + 1" },
      { id: "left", title: "nums[M] < nums[L] → break is at or left of M", detail: "M is counted in res.", pseudo: "r = m - 1" },
      { id: "done", title: "Smallest value", detail: "", pseudo: "return res" },
    ],
    legend: [
      { tone: "compare", label: "Middle M" },
      { tone: "idle", label: "Ruled out" },
      { tone: "found", label: "Minimum" },
    ],
    complexity: { time: "O(log n)", space: "O(1)", why: "Each step rules out half the range." },
    pitfalls: [
      "Use ≥ in nums[M] ≥ nums[L]: when M = L they're the same element, and that half still counts as in order.",
      "This needs distinct values. With duplicates (LeetCode 154), the worst case is O(n).",
    ],
    tryThis: ["Pick “[11,13,15,17] (not rotated)”: the first check stops straight away.", "Press “Random” and point at the break before stepping."],
    python: py,
  },
};
