// Partition Equal Subset Sum (NeetCode 150 · 1-D Dynamic Programming).

import py from "../../guides/python/neetcode/partition_subset.py?raw";
import { row, rngFor, show } from "../helpers";
import type { PatternProblem, PatternStep } from "../types";

type Input = number[];

function run(nums: Input): PatternStep[] {
  const steps: PatternStep[] = [];
  const total = nums.reduce((a, b) => a + b, 0);
  const target = total / 2;
  let sums = new Set<number>([0]);
  let fresh = new Set<number>();
  let ops = 0;
  const snap = (stage: string, explanation: string, i?: number, extra: Partial<PatternStep> = {}) => {
    const shown = [...sums].sort((a, b) => a - b);
    steps.push({
      stage,
      explanation,
      rows: [
        row("nums", nums, i !== undefined ? { [i]: "current" } : {}),
        row(
          "sums some subset can make so far",
          shown,
          Object.fromEntries(shown.map((v, j) => [j, v === target ? "found" : fresh.has(v) ? "compare" : undefined])),
        ),
      ],
      vars: [
        { name: "total", value: String(total) },
        { name: "target (half)", value: Number.isInteger(target) ? String(target) : "–", tone: "found" },
      ],
      ops,
      ...extra,
    });
  };
  snap("start", `Splitting into two equal halves means finding a subset that adds up to half the total. Keep the set of sums some subset of the numbers so far can make, starting with {0} (the empty subset). Each number adds itself to every sum in the set.`);
  if (total % 2) {
    snap("odd", `The total ${total} is odd, so it can't split into two equal whole halves. Return false.`);
    snap("done", "No equal split is possible.", undefined, { done: true, answer: "false" });
    return steps;
  }
  for (let i = 0; i < nums.length; i++) {
    const next = new Set(sums);
    fresh = new Set();
    for (const s of sums) {
      ops++;
      const t = s + nums[i];
      if (t <= target && !next.has(t)) {
        next.add(t);
        fresh.add(t);
      }
    }
    sums = next;
    if (sums.has(target)) {
      snap("found", `Adding ${nums[i]} to the sums so far reaches ${target}, half of ${total}: a subset with that sum exists, and the rest of the numbers make the other half. Return true.`, i);
      snap("done", `Yes: the numbers can be split into two halves of ${target}.`, undefined, { done: true, answer: "true" });
      return steps;
    }
    snap("add", fresh.size ? `Add ${nums[i]} to every sum in the set: new sums ${[...fresh].sort((a, b) => a - b).join(", ")} (anything past ${target} is useless and dropped).` : `Adding ${nums[i]} gives no new sum up to ${target}.`, i);
  }
  fresh = new Set();
  snap("done", `Every number has been added and ${target} was never reached. Return false.`, undefined, { done: true, answer: "false" });
  return steps;
}

/** The slow way: try every subset. */
function slow(nums: Input) {
  const total = nums.reduce((a, b) => a + b, 0);
  let ops = 0;
  if (total % 2) return { answer: false, ops: 1 };
  for (let m = 0; m < 1 << nums.length; m++) {
    let s = 0;
    for (let j = 0; j < nums.length; j++) if (m & (1 << j)) s += nums[j];
    ops += nums.length;
    if (s * 2 === total) return { answer: true, ops };
  }
  return { answer: false, ops };
}

export const partitionSubset: PatternProblem<Input> = {
  id: "partition-subset",
  title: "Partition Equal Subset Sum",
  difficulty: "Medium",
  blind75: false,
  slug: "partition-equal-subset-sum",
  video: "IsvocB5BJhw",
  statement: "Return true if nums can be split into two groups with equal sums.",
  examples: [
    { label: "LeetCode's example 1", input: [1, 5, 11, 5] },
    { label: "LeetCode's example 2 (false)", input: [1, 2, 3, 5] },
    { label: "odd total", input: [2, 4, 7] },
  ],
  random: (seed) => {
    const g = rngFor(seed);
    return Array.from({ length: g.int(1, 7) }, () => g.int(1, 9));
  },
  // Every sum of even numbers is even, but half of 306 is 153: the target is never reached, so nothing stops early.
  big: { label: "2, 4, …, 34 (half the total is odd)", input: () => Array.from({ length: 17 }, (_, i) => 2 * (i + 1)) },
  describe: (nums) => `nums = ${show(nums)}`,
  run,
  solve: (nums) => slow(nums).answer,
  brute: slow,
  bruteIdea: "Try every subset (2^n) and check whether it adds up to half the total.",
  guide: {
    title: "Partition Equal Subset Sum",
    idea: [
      "Two equal halves exist exactly when some subset adds up to total / 2 (and the total is even). That's a subset-sum question.",
      "Keep the set of every sum a subset of the numbers seen so far can make, starting with {0}. For each number, add it to every sum in the set. Sums above the target can be dropped. If the target appears, return true. The set never holds more than target + 1 values, so this is O(n × target).",
    ],
    whenToUse: ["“Can some subset reach exactly T”: a set (or boolean array) of reachable sums, updated per item.", "0/1 knapsack: each item used at most once."],
    stages: [
      { id: "start", title: "Reachable sums = {0}", detail: "", pseudo: "dp = set(); dp.add(0); target = sum(nums) // 2" },
      { id: "odd", title: "Odd total → false", detail: "", pseudo: "if sum(nums) % 2: return False" },
      { id: "add", title: "Add the number to every reachable sum", detail: "", pseudo: "next_dp = set(dp); for t in dp: next_dp.add(t + nums[i]); dp = next_dp" },
      { id: "found", title: "Reached half the total", detail: "", pseudo: "if target in dp: return True" },
      { id: "done", title: "Answer", detail: "", pseudo: "return False" },
    ],
    legend: [
      { tone: "current", label: "Number being added" },
      { tone: "compare", label: "New sums this round" },
      { tone: "found", label: "Half the total" },
    ],
    complexity: { time: "O(n × target)", space: "O(target)", why: "At most target + 1 sums are kept, and each number updates them once." },
    pitfalls: ["Build the new set from the old one; updating while iterating would use a number twice.", "Check the odd total first."],
    tryThis: ["LeetCode's example 1: 11 = 11, so [1, 5, 5] and [11] work.", "Example 2 totals 11, which is odd: false immediately."],
    python: py,
  },
};
