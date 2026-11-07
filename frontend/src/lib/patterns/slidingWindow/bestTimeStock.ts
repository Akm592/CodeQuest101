// Best Time to Buy and Sell Stock (NeetCode 150 · Sliding Window).

import py from "../../guides/python/neetcode/best_time_stock.py?raw";
import { rngFor, show } from "../helpers";
import type { PatternProblem, PatternStep } from "../types";

type Input = number[];

function run(p: Input): PatternStep[] {
  const steps: PatternStep[] = [];
  let l = 0;
  let best = 0;
  let bestPair: [number, number] | null = null;
  let ops = 0;
  const snap = (stage: string, r: number, explanation: string, extra: Partial<PatternStep> = {}) => {
    const done = stage === "done";
    const tones: Record<number, "current" | "pointer" | "visited" | "found" | undefined> = {};
    if (bestPair) {
      tones[bestPair[0]] = done ? "found" : "visited";
      tones[bestPair[1]] = done ? "found" : "visited";
    }
    if (!done) {
      tones[l] = "current";
      if (r < p.length) tones[r] = "pointer";
    }
    const tags: Record<number, string | undefined> = done
      ? bestPair ? { [bestPair[0]]: "buy", [bestPair[1]]: "sell" } : {}
      : { [l]: "L buy", ...(r < p.length && r !== l ? { [r]: "R sell" } : {}) };
    steps.push({
      stage,
      explanation,
      rows: [],
      bars: { values: p, tones, tags },
      vars: [
        { name: "buy price p[L]", value: String(p[l]) },
        ...(done || r >= p.length ? [] : [{ name: "sell price p[R]", value: String(p[r]) }, { name: "profit", value: String(p[r] - p[l]), tone: "pointer" as const }]),
        { name: "best", value: String(best), tone: "found" },
      ],
      ops,
      ...extra,
    });
  };
  snap("start", 1, `L is the day we buy (start with day 0, price ${p[0]}). R walks forward through every later day as the day we'd sell.`);
  for (let r = 1; r < p.length; r++) {
    ops++;
    if (p[r] < p[l]) {
      const old = p[l];
      l = r;
      snap("cheaper", r, `Day ${r}'s price ${p[r]} is lower than our buy price ${old}. Any sale later on makes more if we buy here instead, so the window restarts: L jumps to R.`);
    } else {
      const profit = p[r] - p[l];
      const improved = profit > best;
      if (improved) {
        best = profit;
        bestPair = [l, r];
      }
      snap("sell", r, `Buy at ${p[l]}, sell at ${p[r]}: profit ${profit}.${improved ? " New best!" : ` Not better than ${best}.`}`);
    }
  }
  snap("done", p.length, bestPair ? `Done. The best trade buys at ${p[bestPair[0]]} on day ${bestPair[0]} and sells at ${p[bestPair[1]]} on day ${bestPair[1]}: profit ${best}.` : "Done. Prices never rose after a buy, so the best is not to trade: profit 0.", { done: true, answer: String(best) });
  return steps;
}

export const bestTimeStock: PatternProblem<Input> = {
  id: "best-time-stock",
  title: "Best Time to Buy and Sell Stock",
  difficulty: "Easy",
  blind75: true,
  slug: "best-time-to-buy-and-sell-stock",
  video: "1pkOgXD63yU",
  statement: "prices[i] is a stock's price on day i. Buy on one day and sell on a later day. Return the largest profit you can make, or 0 if no trade makes money.",
  examples: [
    { label: "[7,1,5,3,6,4]", input: [7, 1, 5, 3, 6, 4] },
    { label: "[7,6,4,3,1]", input: [7, 6, 4, 3, 1] },
    { label: "[3,8,2,9,1,4]", input: [3, 8, 2, 9, 1, 4] },
  ],
  random: (seed) => {
    const g = rngFor(seed);
    return Array.from({ length: g.int(4, 10) }, () => g.int(1, 9));
  },
  big: { label: "200 days", input: () => Array.from({ length: 200 }, (_, i) => ((i * 37) % 89) + 1) },
  describe: (p) => `prices = ${show(p)}`,
  run,
  solve: (p) => {
    let low = Infinity;
    let best = 0;
    for (const x of p) {
      low = Math.min(low, x);
      best = Math.max(best, x - low);
    }
    return best;
  },
  brute: (p) => {
    let ops = 0;
    let best = 0;
    for (let i = 0; i < p.length; i++)
      for (let j = i + 1; j < p.length; j++) {
        ops++;
        best = Math.max(best, p[j] - p[i]);
      }
    return { answer: best, ops };
  },
  bruteIdea: "Try every buy day with every later sell day: about n²/2 pairs.",
  guide: {
    title: "Best Time to Buy and Sell Stock",
    idea: [
      "The window runs from the buy day L to the sell day R. R moves forward one day at a time; for each R, the best buy day is simply the cheapest day so far.",
      "So whenever R finds a price lower than the buy price, the window restarts there: L jumps to R. Otherwise, check the profit and keep the best. One pass, O(n).",
    ],
    whenToUse: ["“Best pair where one comes before the other”: keep the best left end seen so far while the right end moves.", "The window here only restarts, never shrinks one by one. Later problems shrink it step by step."],
    stages: [
      { id: "start", title: "Buy on day 0", detail: "L = 0 is the buy day; R will try every later day.", pseudo: "l, best = 0, 0" },
      { id: "sell", title: "Price higher → check the profit", detail: "Profit if we sell today = p[R] − p[L]; keep the best.", pseudo: "best = max(best, p[r] - p[l])" },
      { id: "cheaper", title: "Price lower → buy here instead", detail: "A cheaper buy day beats the old one for every later sale.", pseudo: "if p[r] < p[l]: l = r" },
      { id: "done", title: "Every sell day tried → best profit", detail: "Each day was the sell day once.", pseudo: "return best" },
    ],
    legend: [
      { tone: "current", label: "Buy day L" },
      { tone: "pointer", label: "Sell day R" },
      { tone: "visited", label: "Best trade so far" },
      { tone: "found", label: "Best trade" },
    ],
    complexity: { time: "O(n)", space: "O(1)", why: "R visits each day once, and each visit is one comparison." },
    pitfalls: [
      "You can't sell before you buy, so the answer is not just max − min.",
      "If prices only fall, the answer is 0 (don't trade), not a negative number.",
    ],
    tryThis: ["Pick “[3,8,2,9,1,4]”: L jumps twice. Does the last jump (to 1) change the answer?", "Pick “[7,6,4,3,1]”: L jumps every day."],
    python: py,
  },
};
