// Container With Most Water (NeetCode 150 · Two Pointers).

import py from "../../guides/python/neetcode/container_most_water.py?raw";
import { rngFor, show } from "../helpers";
import type { PatternProblem, PatternStep } from "../types";

type Input = number[];

function run(h: Input): PatternStep[] {
  const steps: PatternStep[] = [];
  let l = 0;
  let r = h.length - 1;
  let best = 0;
  let bestPair: [number, number] = [0, r];
  let ops = 0;
  const snap = (stage: string, explanation: string, extra: Partial<PatternStep> = {}) => {
    const level = Math.min(h[l], h[r]);
    steps.push({
      stage,
      explanation,
      rows: [],
      bars: {
        values: h,
        tones: stage === "done" ? { [bestPair[0]]: "found", [bestPair[1]]: "found" } : { [l]: "current", [r]: "current", [bestPair[0]]: bestPair[0] === l ? "current" : "visited", [bestPair[1]]: bestPair[1] === r ? "current" : "visited" },
        tags: stage === "done" ? {} : { [l]: "L", [r]: "R" },
        box: stage === "done" ? { l: bestPair[0], r: bestPair[1], level: Math.min(h[bestPair[0]], h[bestPair[1]]) } : { l, r, level },
      },
      vars: stage === "done" ? [{ name: "best", value: String(best), tone: "found" }] : [
        { name: "width = R − L", value: String(r - l) },
        { name: "height = min(h[L], h[R])", value: String(level) },
        { name: "area", value: String(level * (r - l)), tone: "pointer" },
        { name: "best", value: String(best), tone: "found" },
      ],
      ops,
      ...extra,
    });
  };
  while (l < r) {
    const area = Math.min(h[l], h[r]) * (r - l);
    ops++;
    const improved = area > best;
    if (improved) {
      best = area;
      bestPair = [l, r];
    }
    const which = h[l] < h[r] ? "L" : "R";
    snap(
      "measure",
      `Walls ${h[l]} and ${h[r]}, ${r - l} apart: the water is only as high as the shorter wall, so area = ${Math.min(h[l], h[r])} × ${r - l} = ${area}.${improved ? " New best!" : ""} Move ${which}, the shorter wall: keeping it can never give more, because the width only shrinks.`,
    );
    if (h[l] < h[r]) l++;
    else r--;
  }
  snap("done", `The pointers met. The most water is ${best}, between positions ${bestPair[0]} and ${bestPair[1]}.`, { done: true, answer: String(best) });
  return steps;
}

export const containerWater: PatternProblem<Input> = {
  id: "container-water",
  title: "Container With Most Water",
  difficulty: "Medium",
  blind75: true,
  slug: "container-with-most-water",
  video: "UuiTKBwPgAo",
  statement: "Each number is the height of a vertical wall. Pick two walls that, with the ground, hold the most water, and return that amount (the shorter wall's height × the distance between them).",
  examples: [
    { label: "[1,8,6,2,5,4,8,3,7]", input: [1, 8, 6, 2, 5, 4, 8, 3, 7] },
    { label: "[1,1]", input: [1, 1] },
    { label: "[4,3,2,1,4]", input: [4, 3, 2, 1, 4] },
  ],
  random: (seed) => {
    const g = rngFor(seed);
    return Array.from({ length: g.int(5, 10) }, () => g.int(1, 9));
  },
  big: { label: "200 walls", input: () => Array.from({ length: 200 }, (_, i) => ((i * 53) % 97) + 1) },
  describe: (h) => `height = ${show(h)}`,
  run,
  solve: (h) => {
    let best = 0;
    for (let i = 0; i < h.length; i++) for (let j = i + 1; j < h.length; j++) best = Math.max(best, Math.min(h[i], h[j]) * (j - i));
    return best;
  },
  brute: (h) => {
    let ops = 0;
    let best = 0;
    for (let i = 0; i < h.length; i++)
      for (let j = i + 1; j < h.length; j++) {
        ops++;
        best = Math.max(best, Math.min(h[i], h[j]) * (j - i));
      }
    return { answer: best, ops };
  },
  bruteIdea: "Measure every pair of walls: about n²/2 areas.",
  guide: {
    title: "Container With Most Water",
    idea: [
      "Start with the widest container: the first and last walls. The water level is set by the shorter of the two.",
      "Now move one wall inwards. Moving the taller wall can't help: the width shrinks and the level is still capped by the same short wall. So the short wall can never be part of anything better, and we drop it. Each step drops one wall, so it's O(n).",
    ],
    whenToUse: ["“Pick two positions to maximise something that depends on the distance between them and the smaller value”: start wide, move the limiting side.", "The key move in many two-pointer problems is a proof that one side can be thrown away."],
    stages: [
      { id: "measure", title: "Measure, then move the shorter wall", detail: "area = min(h[L], h[R]) × (R − L); the shorter wall can't do better, so drop it.", pseudo: "best = max(best, area); move the shorter side" },
      { id: "done", title: "Pointers met → best area", detail: "Every wall that could matter was considered.", pseudo: "return best" },
    ],
    legend: [
      { tone: "current", label: "L and R walls" },
      { tone: "visited", label: "Best pair so far" },
      { tone: "found", label: "Best container" },
    ],
    complexity: { time: "O(n)", space: "O(1)", why: "One wall is dropped per step, so at most n − 1 steps." },
    pitfalls: [
      "Moving the taller wall is the classic wrong move. It can only make things worse or the same.",
      "When the two walls are equal, moving either one is fine.",
    ],
    tryThis: ["Pick “[1,8,6,2,5,4,8,3,7]” and see the 49 found between 8 and 7.", "Press “Random” and guess the best pair before stepping."],
    python: py,
  },
};
