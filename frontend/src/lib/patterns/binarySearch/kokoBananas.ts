// Koko Eating Bananas (NeetCode 150 · Binary Search).

import py from "../../guides/python/neetcode/koko_bananas.py?raw";
import { row, rngFor, show } from "../helpers";
import type { PatternProblem, PatternStep } from "../types";
import { rangeRow } from "./range";

type Input = { piles: number[]; h: number };
const hoursAt = (piles: number[], k: number) => piles.reduce((s, p) => s + Math.ceil(p / k), 0);

function run({ piles, h }: Input): PatternStep[] {
  const steps: PatternStep[] = [];
  const max = Math.max(...piles);
  const speeds = Array.from({ length: max }, (_, i) => i + 1);
  let l = 1;
  let r = max;
  let best = max;
  let ops = 0;
  const known = new Map<number, boolean>(); // speed -> fast enough?
  const snap = (stage: string, k: number | null, explanation: string, extra: Partial<PatternStep> = {}) => {
    // Highlight the best speed found so far (only once one has been found).
    const over: Record<number, "found"> = known.get(best) || stage === "done" ? { [best - 1]: "found" } : {};
    steps.push({
      stage,
      explanation,
      rows: [
        rangeRow("speed k (bananas per hour)", speeds, l - 1, r - 1, k === null ? null : k - 1, over),
        row("piles", piles),
        ...(k !== null ? [row(`hours for each pile at k = ${k}`, piles.map((p) => Math.ceil(p / k)))] : []),
      ],
      vars: [
        { name: "h (hours available)", value: String(h) },
        ...(k !== null ? [{ name: `hours needed at k = ${k}`, value: String(hoursAt(piles, k)), tone: hoursAt(piles, k) <= h ? ("found" as const) : ("swap" as const) }] : []),
        { name: "best so far", value: String(best), tone: "found" },
      ],
      ops,
      ...extra,
    });
  };
  snap("start", null, `Koko eats one pile at a time, at most k bananas an hour. The answer is between 1 and the biggest pile (${max}): at ${max} she finishes any pile in an hour. Faster always works if slower does, so binary search the speed.`);
  while (l <= r) {
    const k = (l + r) >> 1;
    const hrs = hoursAt(piles, k);
    ops += piles.length;
    if (hrs <= h) {
      best = k;
      known.set(k, true);
      snap("fast", k, `At k = ${k}, the piles take ${piles.map((p) => Math.ceil(p / k)).join(" + ")} = ${hrs} hours ≤ ${h}. Fast enough, so ${k} is a candidate. Every faster speed works too, so try slower: R = ${k - 1}.`);
      r = k - 1;
    } else {
      known.set(k, false);
      snap("slow", k, `At k = ${k}, the piles take ${hrs} hours > ${h}. Too slow, and every slower speed is slower still: L = ${k + 1}.`);
      l = k + 1;
    }
  }
  snap("done", null, `L passed R. The slowest speed that's fast enough is ${best}.`, { done: true, answer: String(best) });
  return steps;
}

export const kokoBananas: PatternProblem<Input> = {
  id: "koko-bananas",
  title: "Koko Eating Bananas",
  difficulty: "Medium",
  blind75: false,
  slug: "koko-eating-bananas",
  video: "U2SozAs9RzA",
  statement: "There are piles of bananas and h hours. Each hour Koko picks one pile and eats up to k bananas from it (if the pile has fewer, she finishes it and waits). Return the smallest whole number k that lets her finish every pile within h hours.",
  examples: [
    { label: "[3,6,7,11], h=8", input: { piles: [3, 6, 7, 11], h: 8 } },
    { label: "[30,11,23,4,20], h=6", input: { piles: [30, 11, 23, 4, 20], h: 6 } },
    { label: "[30,11,23,4,20], h=5", input: { piles: [30, 11, 23, 4, 20], h: 5 } },
  ],
  random: (seed) => {
    const g = rngFor(seed);
    const piles = Array.from({ length: g.int(3, 6) }, () => g.int(1, 14));
    return { piles, h: g.int(piles.length, piles.length * 3) };
  },
  big: { label: "200 piles of up to 1,000, h = 200", input: () => ({ piles: Array.from({ length: 200 }, (_, i) => i === 7 ? 1000 : ((i * 37) % 900) + 1), h: 200 }) },
  describe: ({ piles, h }) => `piles = ${show(piles)}, h = ${h}`,
  run,
  solve: ({ piles, h }) => {
    for (let k = 1; ; k++) if (hoursAt(piles, k) <= h) return k;
  },
  brute: ({ piles, h }) => {
    let ops = 0;
    for (let k = 1; ; k++) {
      ops += piles.length;
      if (hoursAt(piles, k) <= h) return { answer: k, ops };
    }
  },
  bruteIdea: "Try k = 1, 2, 3, … until one is fast enough. Each try sums over every pile, and the answer can be as big as the largest pile.",
  guide: {
    title: "Koko Eating Bananas",
    idea: [
      "There's no sorted list here, but there is a yes/no question with a single switch-over: “is speed k fast enough?” Every speed below the answer says no, every speed from the answer up says yes.",
      "So binary search the speed between 1 and the biggest pile. For each middle speed, add up ceil(pile ÷ k) hours. Fast enough: record it and try slower. Too slow: go faster. This is “binary search on the answer”.",
    ],
    whenToUse: ["“Find the minimum (or maximum) value such that some condition holds”, where the condition flips only once as the value grows.", "Capacity to ship packages in D days and splitting an array to minimise the largest sum use the same idea."],
    stages: [
      { id: "start", title: "Speeds 1 … max(piles)", detail: "The answer is somewhere in this range.", pseudo: "l, r = 1, max(piles)" },
      { id: "fast", title: "Fast enough → record, try slower", detail: "hours ≤ h: k works; so does anything faster.", pseudo: "if hours <= h: best = k; r = k - 1" },
      { id: "slow", title: "Too slow → go faster", detail: "hours > h: k fails; so does anything slower.", pseudo: "else: l = k + 1" },
      { id: "done", title: "L > R → best", detail: "The smallest speed that worked.", pseudo: "return best" },
    ],
    legend: [
      { tone: "compare", label: "Speed being tried" },
      { tone: "idle", label: "Ruled out" },
      { tone: "found", label: "Best speed so far" },
    ],
    complexity: { time: "O(n log m)", space: "O(1)", why: "log₂(max pile) speeds are tried, and each check sums over n piles." },
    pitfalls: [
      "Round up: a pile of 7 at speed 3 takes ceil(7/3) = 3 hours, not 2.",
      "The upper bound is the largest pile, not the total: she can never eat from two piles in the same hour.",
    ],
    tryThis: ["Compare h = 6 and h = 5 for the same piles: one fewer hour pushes the answer from 23 to 30.", "Press “Random” and guess the answer from the piles before stepping."],
    python: py,
  },
};
