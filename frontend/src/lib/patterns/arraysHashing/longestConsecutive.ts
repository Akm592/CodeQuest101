// Longest Consecutive Sequence (NeetCode 150 · Arrays & Hashing).

import py from "../../guides/python/neetcode/longest_consecutive.py?raw";
import { row, rngFor, show } from "../helpers";
import type { PatternProblem, PatternStep } from "../types";

type Input = number[];

function run(nums: Input): PatternStep[] {
  const steps: PatternStep[] = [];
  const present = new Set(nums);
  const values = [...present];
  let ops = nums.length;
  let best = 0;
  let bestRun: number[] = [];
  // A number line from min to max, so runs are visible as neighbours.
  const lo = Math.min(...values);
  const hi = Math.max(...values);
  const span = hi - lo <= 24 ? Array.from({ length: hi - lo + 1 }, (_, i) => lo + i) : [...values].sort((a, b) => a - b);
  const line = (runVals: number[], tone: "current" | "found", skip?: number) =>
    row(
      "number line",
      span.map((v) => (present.has(v) ? v : "·")),
      Object.fromEntries(span.map((v, i) => [i, v === skip ? "compare" : runVals.includes(v) ? tone : bestRun.includes(v) ? "visited" : undefined])),
    );
  const vars = (extra: { name: string; value: string }[] = []) => [...extra, { name: "best", value: String(best), tone: "found" as const }];

  steps.push({ stage: "build", explanation: `Put all ${nums.length} numbers in a set (${present.size} distinct) so “is x here?” takes one step.`, rows: [row("nums", nums), line([], "current")], vars: vars(), ops });
  for (const n of values) {
    ops++;
    if (present.has(n - 1)) {
      steps.push({ stage: "skip", explanation: `${n - 1} is in the set, so ${n} isn't the start of a run. Skip it; the run will be counted from its start.`, rows: [row("nums", nums), line([n], "current", n - 1)], vars: vars([{ name: "n", value: String(n) }]), ops });
      continue;
    }
    const runVals = [n];
    while (present.has(n + runVals.length)) {
      ops++;
      runVals.push(n + runVals.length);
    }
    ops++;
    if (runVals.length > best) {
      best = runVals.length;
      bestRun = runVals;
    }
    steps.push({ stage: "extend", explanation: `${n - 1} isn't in the set, so ${n} starts a run. Count up while the next number exists: ${runVals.join(", ")} (length ${runVals.length}).`, rows: [row("nums", nums), line(runVals, "current")], vars: vars([{ name: "n", value: String(n) }, { name: "length", value: String(runVals.length) }]), ops });
  }
  steps.push({ stage: "done", explanation: `The longest run is ${bestRun.join(", ")}: length ${best}.`, rows: [row("nums", nums), line(bestRun, "found")], vars: vars(), ops, done: true, answer: String(best) });
  return steps;
}

export const longestConsecutive: PatternProblem<Input> = {
  id: "longest-consecutive",
  title: "Longest Consecutive Sequence",
  difficulty: "Medium",
  blind75: true,
  slug: "longest-consecutive-sequence",
  video: "P6RZZMu_maU",
  statement: "Given an unsorted list of integers, return the length of the longest run of consecutive values (like 1, 2, 3, 4) that can be made from them. It must run in O(n) time.",
  examples: [
    { label: "[100,4,200,1,3,2]", input: [100, 4, 200, 1, 3, 2] },
    { label: "[0,3,7,2,5,8,4,6,0,1]", input: [0, 3, 7, 2, 5, 8, 4, 6, 0, 1] },
    { label: "[9,1,4,7,3,2,6,8]", input: [9, 1, 4, 7, 3, 2, 6, 8] },
  ],
  random: (seed) => {
    const g = rngFor(seed);
    return Array.from({ length: g.int(5, 9) }, () => g.int(0, 15));
  },
  big: { label: "0…199 shuffled", input: () => rngFor(3).shuffle(Array.from({ length: 200 }, (_, i) => i)) },
  describe: (nums) => `nums = ${show(nums)}`,
  run,
  solve: (nums) => {
    const s = new Set(nums);
    let best = 0;
    for (const n of s) {
      if (s.has(n - 1)) continue;
      let l = 1;
      while (s.has(n + l)) l++;
      best = Math.max(best, l);
    }
    return best;
  },
  brute: (nums) => {
    let ops = 0;
    let best = 0;
    const has = (x: number) => {
      for (const v of nums) {
        ops++;
        if (v === x) return true;
      }
      return false;
    };
    for (const n of nums) {
      let l = 1;
      while (has(n + l)) l++;
      best = Math.max(best, l);
    }
    return { answer: best, ops };
  },
  bruteIdea: "From every number, count upwards, searching the whole list each time for the next value: O(n²) or worse.",
  guide: {
    title: "Longest Consecutive Sequence",
    idea: [
      "Sorting would make runs obvious, but it costs O(n log n) and the problem asks for O(n).",
      "Put everything in a set. A number n starts a run only if n − 1 is missing. From each start, count up n + 1, n + 2, … while they're in the set. Because counting only begins at starts, every number is visited at most twice in total, so it's O(n).",
    ],
    whenToUse: ["“Consecutive”, “runs”, “streaks” in unsorted data with an O(n) requirement: a set plus “only start from the beginning of a run”.", "The skip rule (start only where n − 1 is missing) is what turns an O(n²) idea into O(n)."],
    stages: [
      { id: "build", title: "Build a set", detail: "Constant-time membership checks.", pseudo: "present = set(nums)" },
      { id: "skip", title: "n − 1 exists → not a start", detail: "Skip it; its run is counted from the true start.", pseudo: "if n - 1 in present: continue" },
      { id: "extend", title: "A start → count up", detail: "Extend while the next number is present.", pseudo: "while n + length in present: length += 1" },
      { id: "done", title: "Longest run found", detail: "The best length over all starts.", pseudo: "return best" },
    ],
    legend: [
      { tone: "current", label: "Run being counted" },
      { tone: "compare", label: "n − 1 is present, so skip" },
      { tone: "visited", label: "Best run so far" },
      { tone: "found", label: "Longest run" },
    ],
    complexity: { time: "O(n)", space: "O(n)", why: "Building the set is O(n), and each number is part of exactly one counted run, so all the counting together is O(n)." },
    pitfalls: [
      "Without the n − 1 check, counting from every number is O(n²) on a long run.",
      "Iterate over the set, not the list, so duplicates (like the two 0s in example 2) aren't processed twice.",
    ],
    tryThis: ["Pick “[100,4,200,1,3,2]”: 4, 3 and 2 are skipped, and the run is counted once from 1.", "Pick “[0,3,7,2,5,8,4,6,0,1]”: one run of 9."],
    python: py,
  },
};
