// Coin Change (NeetCode 150 · 1-D Dynamic Programming).

import py from "../../guides/python/neetcode/coin_change.py?raw";
import { row, rngFor, show } from "../helpers";
import type { PatternProblem, PatternStep } from "../types";
import { countCalls, dpRow } from "./dp";

type Input = { coins: number[]; amount: number };

function run({ coins, amount }: Input): PatternStep[] {
  const steps: PatternStep[] = [];
  const dp: (number | null)[] = Array(amount + 1).fill(null);
  let ops = 0;
  const snap = (stage: string, explanation: string, cur?: number, reads: number[] = [], extra: Partial<PatternStep> = {}) =>
    steps.push({
      stage,
      explanation,
      rows: [row("coins", coins), dpRow("fewest[a] = fewest coins that make a", dp, { cur, reads, filled: (i) => dp[i] !== null })],
      vars: [{ name: "amount", value: String(amount) }],
      ops,
      ...extra,
    });
  snap("start", `Build up from 0 to ${amount}. For amount a, the last coin used is some coin c, so fewest[a] = 1 + fewest[a − c] for the best c. Smaller amounts are always filled first.`);
  dp[0] = 0;
  snap("base", "fewest[0] = 0: no coins make 0.", 0);
  for (let a = 1; a <= amount; a++) {
    let best = Infinity;
    let by: number[] = [];
    const tries: string[] = [];
    for (const c of coins) {
      ops++;
      if (c > a) continue;
      const v = dp[a - c]!;
      tries.push(`${c} → 1 + fewest[${a - c}] = ${v === Infinity ? "∞" : v + 1}`);
      if (v + 1 < best) {
        best = v + 1;
        by = [a - c];
      }
    }
    dp[a] = best;
    snap("fill", tries.length ? `Amount ${a}: ${tries.join("; ")}. ${best === Infinity ? `None works, so fewest[${a}] = ∞ (impossible).` : `Best: fewest[${a}] = ${best}.`}` : `Amount ${a}: every coin is bigger than ${a}, so it can't be made: ∞.`, a, by);
  }
  const ans = dp[amount] === Infinity ? -1 : dp[amount]!;
  snap("done", ans < 0 ? `fewest[${amount}] is ∞: ${amount} can't be made from these coins. Return −1.` : `${amount} needs at least ${ans} coin${ans === 1 ? "" : "s"}.`, amount, [], { done: true, answer: String(ans) });
  return steps;
}

/** The slow way: try every coin at every step, with no memory. */
const slowRec = countCalls((self: (c: number[], a: number) => number, c: number[], a: number): number => {
  if (a === 0) return 0;
  let best = Infinity;
  for (const x of c) if (x <= a) best = Math.min(best, 1 + self(c, a - x));
  return best;
});
const slow = ({ coins, amount }: Input) => {
  const r = slowRec(coins, amount);
  return { answer: r.answer === Infinity ? -1 : r.answer, ops: r.ops };
};

export const coinChange: PatternProblem<Input> = {
  id: "coin-change",
  title: "Coin Change",
  difficulty: "Medium",
  blind75: true,
  slug: "coin-change",
  video: "H9bfqozjoqs",
  statement: "Given coin values (as many of each as you like) and an amount, return the fewest coins that add up to the amount, or −1 if it can't be made.",
  examples: [
    { label: "LeetCode's example 1", input: { coins: [1, 2, 5], amount: 11 } },
    { label: "greedy fails", input: { coins: [1, 3, 4], amount: 6 } },
    { label: "impossible", input: { coins: [2], amount: 3 } },
  ],
  random: (seed) => {
    const g = rngFor(seed);
    return { coins: g.shuffle([1, 2, 3, 4, 5, 6, 7]).slice(0, g.int(1, 3)).sort((a, b) => a - b), amount: g.int(0, 12) };
  },
  big: { label: "coins [1, 3, 4], amount 24", input: () => ({ coins: [1, 3, 4], amount: 24 }) },
  describe: ({ coins, amount }) => `coins = ${show(coins)}, amount = ${amount}`,
  run,
  solve: (input) => slow(input).answer,
  brute: slow,
  bruteIdea: "Recursion with no memory: for each amount, try every coin and recurse on what's left. The same amounts are recomputed many times: exponential.",
  guide: {
    title: "Coin Change",
    idea: [
      "Greedy (biggest coin first) can fail: with coins 1, 3, 4 and amount 6, greedy takes 4 + 1 + 1 but 3 + 3 is better. So try every coin as the last one.",
      "fewest[a] = 1 + min over coins c ≤ a of fewest[a − c], with fewest[0] = 0 and ∞ for amounts that can't be made. Fill it from 0 up to the amount.",
    ],
    whenToUse: ["“Fewest items to reach a total”, items reusable: unbounded knapsack DP over the total.", "Whenever greedy might fail, try every last choice."],
    stages: [
      { id: "start", title: "Fill from 0 up", detail: "", pseudo: "dp = [amount + 1] * (amount + 1)" },
      { id: "base", title: "0 needs no coins", detail: "", pseudo: "dp[0] = 0" },
      { id: "fill", title: "Try every coin as the last one", detail: "", pseudo: "for c in coins: if a - c >= 0: dp[a] = min(dp[a], 1 + dp[a - c])" },
      { id: "done", title: "fewest[amount], or −1", detail: "", pseudo: "return dp[amount] if dp[amount] != amount + 1 else -1" },
    ],
    legend: [
      { tone: "current", label: "Amount being filled" },
      { tone: "compare", label: "The amount its best coin came from" },
      { tone: "found", label: "Filled" },
    ],
    complexity: { time: "O(amount × coins)", space: "O(amount)", why: "Each amount tries every coin once." },
    pitfalls: ["Greedy isn't correct in general.", "Use ∞ (or amount + 1) for impossible amounts, and return −1 at the end."],
    tryThis: ["In “greedy fails”, fewest[6] = 2 (3 + 3), not 3 (4 + 1 + 1).", "LeetCode's example 1: 11 = 5 + 5 + 1, 3 coins."],
    python: py,
  },
};
