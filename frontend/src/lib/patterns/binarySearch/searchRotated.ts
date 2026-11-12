// Search in Rotated Sorted Array (NeetCode 150 · Binary Search).

import py from "../../guides/python/neetcode/search_rotated.py?raw";
import { rngFor, show } from "../helpers";
import type { PatternProblem, PatternStep } from "../types";
import { rangeRow } from "./range";
import { bigRotated, randomRotated } from "./rotated";

type Input = { nums: number[]; target: number };

function run({ nums, target }: Input): PatternStep[] {
  const steps: PatternStep[] = [];
  let l = 0;
  let r = nums.length - 1;
  let ops = 0;
  const snap = (stage: string, m: number | null, explanation: string, sortedPart: [number, number] | null = null, extra: Partial<PatternStep> = {}) => {
    const over: Record<number, "pointer" | "found" | undefined> = {};
    if (sortedPart) for (let i = sortedPart[0]; i <= sortedPart[1]; i++) if (i !== m) over[i] = "pointer";
    if (stage === "found" && m !== null) over[m] = "found";
    steps.push({
      stage,
      explanation,
      rows: [rangeRow("nums (rotated)", nums, l, r, m, over)],
      vars: [
        { name: "target", value: String(target) },
        { name: "L, R", value: `${l}, ${r}` },
        ...(m !== null ? [{ name: "M", value: String(m), tone: "compare" as const }] : []),
      ],
      ops,
      ...extra,
    });
  };
  snap("start", null, `Look for ${target}. Wherever M lands, one of its two sides is in sorted order. Check whether ${target} falls inside that sorted side; if not, it must be in the other side.`);
  while (l <= r) {
    const m = (l + r) >> 1;
    ops++;
    if (nums[m] === target) {
      snap("found", m, `nums[${m}] = ${target}. Found it at index ${m}.`, null, { done: true, answer: String(m) });
      return steps;
    }
    if (nums[l] <= nums[m]) {
      const inside = nums[l] <= target && target < nums[m];
      snap("left-sorted", m, `nums[L] = ${nums[l]} ≤ nums[M] = ${nums[m]}, so L..M is sorted (blue). ${target} ${inside ? `is between ${nums[l]} and ${nums[m]}, so it can only be there: R = M − 1.` : `is not between ${nums[l]} and ${nums[m]}, so it can only be right of M: L = M + 1.`}`, [l, m]);
      if (inside) r = m - 1;
      else l = m + 1;
    } else {
      const inside = nums[m] < target && target <= nums[r];
      snap("right-sorted", m, `nums[M] = ${nums[m]} < nums[L] = ${nums[l]}, so the break is left of M and M..R is sorted (blue). ${target} ${inside ? `is between ${nums[m]} and ${nums[r]}, so it can only be there: L = M + 1.` : `is not between ${nums[m]} and ${nums[r]}, so it can only be left of M: R = M − 1.`}`, [m, r]);
      if (inside) l = m + 1;
      else r = m - 1;
    }
  }
  snap("missing", null, `L passed R: ${target} isn't in the list. Return −1.`, null, { done: true, answer: "-1" });
  return steps;
}

export const searchRotated: PatternProblem<Input> = {
  id: "search-rotated",
  title: "Search in Rotated Sorted Array",
  difficulty: "Medium",
  blind75: true,
  slug: "search-in-rotated-sorted-array",
  video: "U8XENwh8Oy8",
  statement: "A sorted list of distinct numbers has been rotated at an unknown point, e.g. [4,5,6,7,0,1,2]. Return the index of target, or −1, in O(log n) time.",
  examples: [
    { label: "find 0", input: { nums: [4, 5, 6, 7, 0, 1, 2], target: 0 } },
    { label: "find 3 (missing)", input: { nums: [4, 5, 6, 7, 0, 1, 2], target: 3 } },
    { label: "find 5", input: { nums: [15, 18, 22, 27, 2, 5, 9, 12], target: 5 } },
  ],
  random: (seed) => {
    const nums = randomRotated(seed);
    const g = rngFor(seed + 7);
    return { nums, target: g.r() < 0.7 ? g.pick(nums) : g.int(0, 30) };
  },
  big: { label: "200 numbers, target missing", input: () => ({ nums: bigRotated(), target: 1 }) },
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
  bruteIdea: "Scan every number: O(n). Or find the rotation point first and then binary search one side, which is also O(log n) but takes two passes.",
  guide: {
    title: "Search in Rotated Sorted Array",
    idea: [
      "A normal binary search breaks because the list isn't fully sorted. But wherever M lands, at least one side of it is sorted: if nums[L] ≤ nums[M], the left side is; otherwise the right side is.",
      "For the sorted side, you can tell in one comparison whether target is in it (it's between that side's ends). If yes, search there; if not, search the other side. Either way, half is ruled out.",
    ],
    whenToUse: ["Binary search on data that's “almost” sorted: find which part you can trust, then decide.", "Pairs with Find Minimum: both ask “which half is in order?”"],
    stages: [
      { id: "start", title: "Whole list in range", detail: "", pseudo: "l, r = 0, len(nums) - 1" },
      { id: "found", title: "nums[M] = target → return M", detail: "", pseudo: "if nums[m] == target: return m" },
      { id: "left-sorted", title: "Left side sorted: is target in it?", detail: "nums[L] ≤ target < nums[M] → go left, else go right.", pseudo: "if nums[l] <= nums[m]: ..." },
      { id: "right-sorted", title: "Right side sorted: is target in it?", detail: "nums[M] < target ≤ nums[R] → go right, else go left.", pseudo: "else: ..." },
      { id: "missing", title: "L > R → −1", detail: "", pseudo: "return -1" },
    ],
    legend: [
      { tone: "compare", label: "Middle M" },
      { tone: "pointer", label: "The sorted side" },
      { tone: "idle", label: "Ruled out" },
      { tone: "found", label: "Found" },
    ],
    complexity: { time: "O(log n)", space: "O(1)", why: "Each comparison rules out one side." },
    pitfalls: [
      "Use nums[L] ≤ nums[M] (with ≤): when L = M the left side is a single element, which counts as sorted.",
      "Get the range checks' ends right: nums[L] ≤ target < nums[M] and nums[M] < target ≤ nums[R]. M itself was already checked.",
    ],
    tryThis: ["Pick “find 5”: the first M lands in the left run, but 5 is in the right one.", "Press “Random”: is the sorted side always the one with the target?"],
    python: py,
  },
};
