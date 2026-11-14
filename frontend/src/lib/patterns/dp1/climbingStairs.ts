// Climbing Stairs (NeetCode 150 · 1-D Dynamic Programming).

import py from "../../guides/python/neetcode/climbing_stairs.py?raw";
import { rngFor } from "../helpers";
import type { PatternProblem, PatternStep } from "../types";
import { countCalls, dpRow } from "./dp";

type Input = number;

function run(n: Input): PatternStep[] {
  const steps: PatternStep[] = [];
  const dp: (number | null)[] = Array(n + 1).fill(null);
  let ops = 0;
  const snap = (stage: string, explanation: string, cur?: number, reads: number[] = [], extra: Partial<PatternStep> = {}) =>
    steps.push({
      stage,
      explanation,
      rows: [dpRow("ways[i] = number of ways to reach step i", dp, { cur, reads, filled: (i) => dp[i] !== null, tag: (i) => (i === n ? `top ${i}` : `step ${i}`) })],
      vars: [{ name: "n", value: String(n) }],
      ops,
      ...extra,
    });
  snap("start", `To stand on step i, your last move was 1 step from i − 1 or 2 steps from i − 2. So ways(i) = ways(i − 1) + ways(i − 2). Fill the table from the bottom; each entry needs only the two before it.`);
  dp[0] = 1;
  ops++;
  snap("base", "ways(0) = 1: standing at the bottom, there's exactly one way (do nothing).", 0);
  if (n >= 1) {
    dp[1] = 1;
    ops++;
    snap("base", "ways(1) = 1: a single 1-step.", 1);
  }
  for (let i = 2; i <= n; i++) {
    dp[i] = dp[i - 1]! + dp[i - 2]!;
    ops++;
    snap("fill", `ways(${i}) = ways(${i - 1}) + ways(${i - 2}) = ${dp[i - 1]} + ${dp[i - 2]} = ${dp[i]}.`, i, [i - 1, i - 2]);
  }
  snap("done", `There are ${dp[n]} ways to climb ${n} step${n === 1 ? "" : "s"}. (These are the Fibonacci numbers.)`, undefined, [], { done: true, answer: String(dp[n]) });
  return steps;
}

/** The slow way: plain recursion, which recomputes the same steps again and again. */
const slow = countCalls((self: (i: number) => number, i: number): number => (i <= 1 ? 1 : self(i - 1) + self(i - 2)));

export const climbingStairs: PatternProblem<Input> = {
  id: "climbing-stairs",
  title: "Climbing Stairs",
  difficulty: "Easy",
  blind75: true,
  slug: "climbing-stairs",
  video: "Y0lT9Fck7qI",
  statement: "You're climbing a staircase of n steps, taking 1 or 2 steps at a time. In how many distinct ways can you reach the top?",
  examples: [
    { label: "n = 5", input: 5 },
    { label: "n = 3", input: 3 },
    { label: "n = 1", input: 1 },
  ],
  random: (seed) => rngFor(seed).int(1, 10),
  big: { label: "n = 25", input: () => 25 },
  describe: (n) => `n = ${n}`,
  run,
  solve: (n) => slow(n).answer,
  brute: (n) => slow(n),
  bruteIdea: "Plain recursion, ways(n) = ways(n − 1) + ways(n − 2), with no memory: the same smaller cases are solved over and over, and the number of calls grows like 1.6^n.",
  guide: {
    title: "Climbing Stairs",
    idea: [
      "Look at the last move. To reach step i you came from i − 1 (one step) or i − 2 (two steps), so ways(i) = ways(i − 1) + ways(i − 2), with ways(0) = ways(1) = 1.",
      "Recursion repeats work; a table filled from the bottom computes each value once. Each entry only needs the previous two, so two variables are enough (NeetCode's one, two).",
    ],
    whenToUse: ["Count the ways to reach a state when each move comes from a few earlier states: add up their counts.", "The first DP problem: spot the recurrence from the last decision."],
    stages: [
      { id: "start", title: "ways(i) = ways(i − 1) + ways(i − 2)", detail: "", pseudo: "one, two = 1, 1" },
      { id: "base", title: "Base cases", detail: "", pseudo: "ways(0) = ways(1) = 1" },
      { id: "fill", title: "Fill the next entry from the two before", detail: "", pseudo: "for i in range(n - 1): one, two = one + two, one" },
      { id: "done", title: "ways(n)", detail: "", pseudo: "return one" },
    ],
    legend: [
      { tone: "current", label: "Entry being filled" },
      { tone: "compare", label: "Entries it's built from" },
      { tone: "found", label: "Filled" },
    ],
    complexity: { time: "O(n)", space: "O(1)", why: "One addition per step, keeping only the last two values." },
    pitfalls: ["Without memory the recursion is exponential.", "Base cases: ways(0) = 1 (one way to do nothing), not 0."],
    tryThis: ["n = 5 gives 8: 1, 1, 2, 3, 5, 8.", "Compare the op counts on the right: 25 additions vs about 240,000 calls."],
    python: py,
  },
};
