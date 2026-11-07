// Trapping Rain Water (NeetCode 150 · Two Pointers).

import py from "../../guides/python/neetcode/trapping_rain_water.py?raw";
import { rngFor, show } from "../helpers";
import type { PatternProblem, PatternStep } from "../types";

type Input = number[];

export function trapSolve(h: number[]): number {
  let total = 0;
  for (let i = 0; i < h.length; i++) {
    const lm = Math.max(...h.slice(0, i + 1));
    const rm = Math.max(...h.slice(i));
    total += Math.min(lm, rm) - h[i];
  }
  return total;
}

function run(h: Input): PatternStep[] {
  const steps: PatternStep[] = [];
  const water = h.map(() => 0);
  let l = 0;
  let r = h.length - 1;
  let leftMax = h[l];
  let rightMax = h[r];
  let total = 0;
  let ops = 2;
  const snap = (stage: string, explanation: string, hi: number | null, extra: Partial<PatternStep> = {}) =>
    steps.push({
      stage,
      explanation,
      rows: [],
      bars: { values: h, water: [...water], tones: stage === "done" ? {} : { [l]: "current", [r]: "current", ...(hi !== null ? { [hi]: "compare" as const } : {}) }, tags: stage === "done" ? {} : { [l]: l === r ? "L R" : "L", [r]: l === r ? "L R" : "R" } },
      vars: [
        { name: "leftMax", value: String(leftMax) },
        { name: "rightMax", value: String(rightMax) },
        { name: "water", value: String(total), tone: "pointer" },
      ],
      ops,
      ...extra,
    });
  snap("start", `L and R start at the two ends. leftMax = ${leftMax}, rightMax = ${rightMax}: the tallest wall seen from each side so far.`, null);
  while (l < r) {
    ops++;
    if (leftMax < rightMax) {
      l++;
      leftMax = Math.max(leftMax, h[l]);
      water[l] = leftMax - h[l];
      total += water[l];
      snap("left", `leftMax (${leftMax === h[l] ? "now " : ""}${leftMax}) is the lower side, so position ${l}'s water level is decided by it: there's a wall at least as tall on the right. Water here = ${leftMax} − ${h[l]} = ${water[l]}.`, l);
    } else {
      r--;
      rightMax = Math.max(rightMax, h[r]);
      water[r] = rightMax - h[r];
      total += water[r];
      snap("right", `rightMax (${rightMax}) is the lower or equal side, so position ${r}'s level is decided by it: there's a wall at least as tall on the left. Water here = ${rightMax} − ${h[r]} = ${water[r]}.`, r);
    }
  }
  snap("done", `The pointers met. Total water trapped: ${total}.`, null, { done: true, answer: String(total) });
  return steps;
}

export const trappingRain: PatternProblem<Input> = {
  id: "trapping-rain",
  title: "Trapping Rain Water",
  difficulty: "Hard",
  blind75: false,
  slug: "trapping-rain-water",
  video: "ZI2z5pq0TqA",
  statement: "Each number is the height of a bar, 1 wide. After it rains, how much water is trapped between the bars?",
  examples: [
    { label: "[0,1,0,2,1,0,1,3,2,1,2,1]", input: [0, 1, 0, 2, 1, 0, 1, 3, 2, 1, 2, 1] },
    { label: "[4,2,0,3,2,5]", input: [4, 2, 0, 3, 2, 5] },
    { label: "[3,0,2,0,4]", input: [3, 0, 2, 0, 4] },
  ],
  random: (seed) => {
    const g = rngFor(seed);
    return Array.from({ length: g.int(5, 12) }, () => g.int(0, 5));
  },
  big: { label: "200 bars", input: () => Array.from({ length: 200 }, (_, i) => ((i * 31) % 17) % 9) },
  describe: (h) => `height = ${show(h)}`,
  run,
  solve: trapSolve,
  brute: (h) => {
    let ops = 0;
    let total = 0;
    for (let i = 0; i < h.length; i++) {
      let lm = 0;
      let rm = 0;
      for (let j = 0; j <= i; j++) {
        ops++;
        lm = Math.max(lm, h[j]);
      }
      for (let j = i; j < h.length; j++) {
        ops++;
        rm = Math.max(rm, h[j]);
      }
      total += Math.min(lm, rm) - h[i];
    }
    return { answer: total, ops };
  },
  bruteIdea: "For each bar, scan left for the tallest wall and right for the tallest wall; the water is min(both) − height. That's n scans of n: O(n²).",
  guide: {
    title: "Trapping Rain Water",
    idea: [
      "Water above bar i fills up to min(tallest wall on its left, tallest wall on its right), minus the bar's own height.",
      "Two pointers avoid computing both maxima for every bar. Keep leftMax and rightMax. If leftMax is the smaller one, then for the next bar on the left we already know its level: leftMax is the limit, because somewhere on the right there's a wall at least as tall as rightMax > leftMax. So fill it and move L. Otherwise do the same from the right.",
    ],
    whenToUse: ["“Water”, “trapped”, “between bars”: each position depends on the best on its left and right; two pointers or prefix/suffix max arrays.", "The prefix/suffix max version (two arrays) is O(n) time and O(n) space and easier to explain first; two pointers brings space to O(1)."],
    stages: [
      { id: "start", title: "Pointers and maxima at both ends", detail: "leftMax = h[0], rightMax = h[n − 1].", pseudo: "l, r = 0, n - 1; left_max, right_max = h[l], h[r]" },
      { id: "left", title: "Left side is lower → fill from the left", detail: "Move L in; its water = leftMax − h[L].", pseudo: "l += 1; left_max = max(left_max, h[l]); water += left_max - h[l]" },
      { id: "right", title: "Right side is lower → fill from the right", detail: "Move R in; its water = rightMax − h[R].", pseudo: "r -= 1; right_max = max(right_max, h[r]); water += right_max - h[r]" },
      { id: "done", title: "Pointers met → total", detail: "Every inner bar has been filled exactly once.", pseudo: "return water" },
    ],
    legend: [
      { tone: "current", label: "L and R" },
      { tone: "compare", label: "Bar just filled (blue above it is its water)" },
    ],
    complexity: { time: "O(n)", space: "O(1)", why: "Each bar is visited once by one pointer, and only four numbers are stored." },
    pitfalls: [
      "Water can't go negative: leftMax is updated before subtracting, so a new taller bar gets 0.",
      "Use the lower of the two maxima to choose the side. Choosing by the bar heights themselves gives wrong answers.",
    ],
    tryThis: ["Pick “[0,1,0,2,1,0,1,3,2,1,2,1]” and watch the 6 units fill in.", "Pick “[3,0,2,0,4]”: the right side is taller, so everything fills from the left."],
    python: py,
  },
};
