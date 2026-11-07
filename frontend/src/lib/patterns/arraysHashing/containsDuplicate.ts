// Contains Duplicate (NeetCode 150 · Arrays & Hashing).

import py from "../../guides/python/neetcode/contains_duplicate.py?raw";
import { row, rngFor, show } from "../helpers";
import type { PatternProblem, PatternStep } from "../types";

type Input = number[];

function run(nums: Input): PatternStep[] {
  const steps: PatternStep[] = [];
  const seen: number[] = [];
  let ops = 0;
  const snap = (stage: string, i: number, explanation: string, extra: Partial<PatternStep> = {}) =>
    steps.push({
      stage,
      explanation,
      rows: [row("nums", nums, { [i]: extra.done ? (stage === "found" ? "swap" : "found") : "current" }, { [i]: "i" })],
      map: { title: "seen (hash set)", entries: seen.map((v) => ({ k: String(v), v: "✓", tone: stage === "found" && v === nums[i] ? "swap" : undefined })) },
      vars: [{ name: "i", value: String(i) }],
      ops,
      ...extra,
    });

  for (let i = 0; i < nums.length; i++) {
    ops++;
    if (seen.includes(nums[i])) {
      snap("found", i, `${nums[i]} is already in the set: we've seen it before. Duplicate found.`, { done: true, answer: "true" });
      return steps;
    }
    snap("look", i, `Is ${nums[i]} in the set? No, this is its first time.`);
    seen.push(nums[i]);
    ops++;
    snap("add", i, `Add ${nums[i]} to the set so a later copy will be spotted in one lookup.`);
  }
  steps.push({
    stage: "unique",
    explanation: `Reached the end without a repeat: every value is different.`,
    rows: [row("nums", nums, Object.fromEntries(nums.map((_, j) => [j, "found"])))],
    map: { title: "seen (hash set)", entries: seen.map((v) => ({ k: String(v), v: "✓" })) },
    vars: [],
    ops,
    done: true,
    answer: "false",
  });
  return steps;
}

export const containsDuplicate: PatternProblem<Input> = {
  id: "contains-duplicate",
  title: "Contains Duplicate",
  difficulty: "Easy",
  blind75: true,
  slug: "contains-duplicate",
  video: "3OamzN90kPg",
  statement: "Given a list of numbers, return true if any number appears more than once, and false if every number is different.",
  examples: [
    { label: "[1, 2, 3, 1]", input: [1, 2, 3, 1] },
    { label: "[1, 2, 3, 4]", input: [1, 2, 3, 4] },
    { label: "[1,1,1,3,3,4,3,2,4,2]", input: [1, 1, 1, 3, 3, 4, 3, 2, 4, 2] },
  ],
  random: (seed) => {
    const g = rngFor(seed);
    const n = g.int(4, 9);
    const vals = g.shuffle(Array.from({ length: 20 }, (_, i) => i + 1)).slice(0, n);
    if (g.r() < 0.5) vals[g.int(1, n - 1)] = vals[g.int(0, n - 2)];
    return vals;
  },
  big: { label: "200 different numbers", input: () => Array.from({ length: 200 }, (_, i) => i * 7) },
  describe: (nums) => `nums = ${show(nums)}`,
  run,
  solve: (nums) => new Set(nums).size !== nums.length,
  brute: (nums) => {
    let ops = 0;
    for (let i = 0; i < nums.length; i++)
      for (let j = i + 1; j < nums.length; j++) {
        ops++;
        if (nums[i] === nums[j]) return { answer: true, ops };
      }
    return { answer: false, ops };
  },
  bruteIdea: "Compare every pair of numbers: about n²/2 comparisons.",
  guide: {
    title: "Contains Duplicate",
    idea: [
      "Checking every pair works, but it's slow: 10,000 numbers means about 50 million comparisons.",
      "A hash set answers “have I seen this before?” in about one step. Walk through the list once: if the number is already in the set, it's a duplicate; if not, add it.",
    ],
    whenToUse: ["“Has this appeared before?”, “any repeats?”, “first repeated value”: reach for a hash set.", "Trading memory (the set) for speed is the most common move in this whole category."],
    stages: [
      { id: "look", title: "Look it up", detail: "Check whether the current number is already in the set.", pseudo: "if n in seen" },
      { id: "add", title: "Remember it", detail: "Not there yet, so add it and move on.", pseudo: "seen.add(n)" },
      { id: "found", title: "Already there → duplicate", detail: "A lookup hit means we saw this number earlier.", pseudo: "return True" },
      { id: "unique", title: "End of list → all different", detail: "No lookup ever hit, so no value repeats.", pseudo: "return False" },
    ],
    legend: [
      { tone: "current", label: "Number being checked" },
      { tone: "swap", label: "The duplicate" },
      { tone: "found", label: "Checked, all different" },
    ],
    complexity: { time: "O(n)", space: "O(n)", why: "One pass, and each set lookup or insert takes constant time on average. The set can hold up to n numbers." },
    pitfalls: [
      "Sorting first and comparing neighbours also works in O(n log n) time and O(1) extra space. Mention it as the trade-off if memory is tight.",
      "In Python, len(set(nums)) != len(nums) is a fine one-liner, but it always scans everything; the loop can stop at the first repeat.",
    ],
    tryThis: ["Pick “[1, 2, 3, 4]” and compare the two operation counts.", "Press “Random” a few times: the set version stops early when a repeat comes soon."],
    python: py,
  },
};
