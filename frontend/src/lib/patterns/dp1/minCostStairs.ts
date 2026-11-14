// Min Cost Climbing Stairs (NeetCode 150 · 1-D Dynamic Programming).

import py from "../../guides/python/neetcode/min_cost_stairs.py?raw";
import { row, rngFor, show } from "../helpers";
import type { PatternProblem, PatternStep } from "../types";
import { countCalls, dpRow } from "./dp";

type Input = number[];

function run(cost: Input): PatternStep[] {
  const n = cost.length;
  const steps: PatternStep[] = [];
  // best[i] = cheapest total to reach the top starting on step i (best[n] = 0: already at the top).
  const best: (number | null)[] = Array(n + 1).fill(null);
  let ops = 0;
  const snap = (stage: string, explanation: string, cur?: number, reads: number[] = [], extra: Partial<PatternStep> = {}) =>
    steps.push({
      stage,
      explanation,
      rows: [
        row("cost of stepping on each step", cost, cur !== undefined && cur < n ? { [cur]: "current" } : {}),
        dpRow("best[i] = cheapest way from step i to the top", best, { cur, reads, filled: (i) => best[i] !== null, tag: (i) => (i === n ? "top" : String(i)) }),
      ],
      vars: [],
      ops,
      ...extra,
    });
  snap("start", "Work backwards from the top. From step i you pay cost[i], then climb 1 or 2, so best[i] = cost[i] + min(best[i + 1], best[i + 2]). You may start on step 0 or step 1.");
  best[n] = 0;
  snap("base", "Standing on the top costs nothing more: best[top] = 0.", n);
  best[n - 1] = cost[n - 1];
  ops++;
  snap("base", `From the last step (${n - 1}), pay ${cost[n - 1]} and climb 1 to the top: best[${n - 1}] = ${cost[n - 1]}.`, n - 1, [n]);
  for (let i = n - 2; i >= 0; i--) {
    best[i] = cost[i] + Math.min(best[i + 1]!, best[i + 2]!);
    ops++;
    snap("fill", `best[${i}] = cost[${i}] + min(best[${i + 1}], best[${i + 2}]) = ${cost[i]} + min(${best[i + 1]}, ${best[i + 2]}) = ${best[i]}.`, i, [i + 1, i + 2]);
  }
  const ans = Math.min(best[0]!, best[1]!);
  snap("done", `You can start on step 0 or step 1: min(${best[0]}, ${best[1]}) = ${ans}.`, undefined, [0, 1], { done: true, answer: String(ans) });
  return steps;
}

export const minCostStairs: PatternProblem<Input> = {
  id: "min-cost-stairs",
  title: "Min Cost Climbing Stairs",
  difficulty: "Easy",
  blind75: false,
  slug: "min-cost-climbing-stairs",
  video: "ktmzAZWkEZ0",
  statement: "cost[i] is the price of stepping on step i. You can start on step 0 or 1, and climb 1 or 2 steps at a time. Return the cheapest way to reach the top (just past the last step).",
  examples: [
    { label: "LeetCode's example 1", input: [10, 15, 20] },
    { label: "LeetCode's example 2", input: [1, 100, 1, 1, 1, 100, 1, 1, 100, 1] },
  ],
  random: (seed) => {
    const g = rngFor(seed);
    return Array.from({ length: g.int(2, 8) }, () => g.int(0, 20));
  },
  big: { label: "24 steps", input: () => Array.from({ length: 24 }, (_, i) => (i * 7) % 11) },
  describe: (c) => `cost = ${show(c)}`,
  run,
  solve: (c) => slow(c).answer,
  brute: (c) => slow(c),
  bruteIdea: "Recursion with no memory: from each step, try climbing 1 and climbing 2. The same steps are solved again and again, about 1.6^n calls.",
  guide: {
    title: "Min Cost Climbing Stairs",
    idea: [
      "Let best[i] be the cheapest way to finish starting on step i. You pay cost[i] and then take the cheaper of the next two options: best[i] = cost[i] + min(best[i + 1], best[i + 2]).",
      "Fill it from the top down to step 0. The answer is min(best[0], best[1]), since you may start on either. NeetCode does it in place on the cost array.",
    ],
    whenToUse: ["“Cheapest way to the end with a few choices per step”: dp over positions, min over the choices.", "Going backwards from the goal often makes the recurrence simplest."],
    stages: [
      { id: "start", title: "best[i] = cost[i] + min(best[i + 1], best[i + 2])", detail: "", pseudo: "cost.append(0)" },
      { id: "base", title: "The top costs 0", detail: "", pseudo: "" },
      { id: "fill", title: "Fill from the top down", detail: "", pseudo: "for i in range(len(cost) - 3, -1, -1): cost[i] += min(cost[i + 1], cost[i + 2])" },
      { id: "done", title: "Start on step 0 or 1", detail: "", pseudo: "return min(cost[0], cost[1])" },
    ],
    legend: [
      { tone: "current", label: "Entry being filled" },
      { tone: "compare", label: "The two options it chooses from" },
      { tone: "found", label: "Filled" },
    ],
    complexity: { time: "O(n)", space: "O(1)", why: "One pass, updating the cost array in place." },
    pitfalls: ["The top is past the last step: it isn't step n − 1.", "You can start on step 1 for free, so the answer is min(best[0], best[1])."],
    tryThis: ["In example 1, start on step 1 and jump straight to the top: 15.", "Example 2 skips every 100: the answer is 6."],
    python: py,
  },
};

/** The slow way: recursion from each step, no memory. */
const slowRec = countCalls((self: (c: number[], i: number) => number, c: number[], i: number): number => (i >= c.length ? 0 : c[i] + Math.min(self(c, i + 1), self(c, i + 2))));
function slow(c: Input) {
  const a = slowRec(c, 0);
  const b = slowRec(c, 1);
  return { answer: Math.min(a.answer, b.answer), ops: a.ops + b.ops };
}
