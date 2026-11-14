// House Robber (NeetCode 150 · 1-D Dynamic Programming).

import py from "../../guides/python/neetcode/house_robber.py?raw";
import { row, rngFor, show } from "../helpers";
import type { PatternProblem, PatternStep } from "../types";
import { countCalls, dpRow } from "./dp";

type Input = number[];

/** The table for robbing houses lo..hi; shared with House Robber II. */
export function robSteps(nums: number[], label: string, intro: string, firstStage: string, startOps = 0, extraRows: (best: (number | null)[], i: number) => ReturnType<typeof row>[] = () => []) {
  const steps: PatternStep[] = [];
  const best: (number | null)[] = Array(nums.length).fill(null);
  let ops = startOps;
  const snap = (stage: string, explanation: string, cur?: number, reads: number[] = [], extra: Partial<PatternStep> = {}) =>
    steps.push({
      stage,
      explanation,
      rows: [...extraRows(best, cur ?? -1), row(`houses (${label})`, nums, cur !== undefined ? { [cur]: "current" } : {}), dpRow("best[i] = most money from the houses up to i", best, { cur, reads, filled: (i) => best[i] !== null })],
      vars: [],
      ops,
      ...extra,
    });
  snap(firstStage, intro);
  for (let i = 0; i < nums.length; i++) {
    ops++;
    const skip = i >= 1 ? best[i - 1]! : 0;
    const take = nums[i] + (i >= 2 ? best[i - 2]! : 0);
    best[i] = Math.max(skip, take);
    snap(
      "fill",
      `House ${i} (${nums[i]}): rob it${i >= 2 ? ` and add best[${i - 2}] (${best[i - 2]})` : ""} for ${take}, or skip it and keep ${i >= 1 ? `best[${i - 1}] (${skip})` : "nothing (0)"}. ${take > skip ? `Rob it: ${take}.` : take === skip ? `Same either way: ${skip}.` : `Skip it: ${skip}.`}`,
      i,
      [i - 1, i - 2].filter((j) => j >= 0),
    );
  }
  return { steps, best, ops, snap };
}

function run(nums: Input): PatternStep[] {
  const { steps, best, snap } = robSteps(nums, "money in each", "You can't rob two houses next to each other. At each house, either rob it (and add the best from two houses back) or skip it (and keep the best so far): best[i] = max(best[i − 1], nums[i] + best[i − 2]).", "start");
  const ans = best.length ? best[best.length - 1]! : 0;
  snap("done", `The most money without robbing two neighbours: ${ans}.`, undefined, [], { done: true, answer: String(ans) });
  return steps;
}

/** The slow way: for each house, recurse on robbing it or skipping it, with no memory. */
const slowRec = countCalls((self: (n: number[], i: number) => number, n: number[], i: number): number => (i >= n.length ? 0 : Math.max(self(n, i + 1), n[i] + self(n, i + 2))));
export const robSlow = (nums: number[]) => slowRec(nums, 0);

export const houseRobber: PatternProblem<Input> = {
  id: "house-robber",
  title: "House Robber",
  difficulty: "Medium",
  blind75: true,
  slug: "house-robber",
  video: "73r3KWiEvyk",
  statement: "Houses in a row hold some money. You can't rob two houses that are next to each other. Return the most money you can rob.",
  examples: [
    { label: "LeetCode's example 2", input: [2, 7, 9, 3, 1] },
    { label: "skip two in a row", input: [2, 1, 1, 9] },
    { label: "LeetCode's example 1", input: [1, 2, 3, 1] },
  ],
  random: (seed) => {
    const g = rngFor(seed);
    return Array.from({ length: g.int(1, 8) }, () => g.int(0, 12));
  },
  big: { label: "26 houses", input: () => Array.from({ length: 26 }, (_, i) => (i * 13) % 17) },
  describe: (nums) => `nums = ${show(nums)}`,
  run,
  solve: (nums) => robSlow(nums).answer,
  brute: robSlow,
  bruteIdea: "Recursion with no memory: at each house, try robbing it and skipping it. That explores every allowed set of houses, about 1.6^n calls.",
  guide: {
    title: "House Robber",
    idea: [
      "At house i there are two choices. Rob it: you can't have robbed house i − 1, so add nums[i] to the best up to i − 2. Skip it: keep the best up to i − 1. best[i] = max(best[i − 1], nums[i] + best[i − 2]).",
      "Only the last two values are needed, so NeetCode keeps rob1 and rob2 instead of a whole table.",
    ],
    whenToUse: ["“Pick items with no two adjacent, maximise the total”: take-or-skip DP.", "Any DP where each choice rules out a neighbour."],
    stages: [
      { id: "start", title: "best[i] = max(skip, rob)", detail: "", pseudo: "rob1, rob2 = 0, 0" },
      { id: "fill", title: "Rob house i or skip it", detail: "", pseudo: "for n in nums: rob1, rob2 = rob2, max(n + rob1, rob2)" },
      { id: "done", title: "Best for all the houses", detail: "", pseudo: "return rob2" },
    ],
    legend: [
      { tone: "current", label: "House being decided" },
      { tone: "compare", label: "The two earlier answers it uses" },
      { tone: "found", label: "Filled" },
    ],
    complexity: { time: "O(n)", space: "O(1)", why: "One pass, keeping only the last two answers." },
    pitfalls: ["Robbing every other house isn't always best: in “skip two in a row”, 2 + 9 = 11 skips two houses.", "Empty input or a single house: handle both."],
    tryThis: ["In example 2, rob houses 0, 2 and 4: 2 + 9 + 1 = 12.", "Press “Random” and predict each max before stepping."],
    python: py,
  },
};
