// Two Sum (NeetCode 150 · Arrays & Hashing).

import py from "../../guides/python/neetcode/two_sum.py?raw";
import { row, rngFor, show } from "../helpers";
import type { PatternProblem, PatternStep } from "../types";

interface Input {
  nums: number[];
  target: number;
}

function run({ nums, target }: Input): PatternStep[] {
  const steps: PatternStep[] = [];
  const indexOf = new Map<number, number>();
  let ops = 0;
  const entries = (hi?: number) => [...indexOf.entries()].map(([k, v]) => ({ k: String(k), v: `index ${v}`, tone: k === hi ? ("found" as const) : undefined }));
  for (let i = 0; i < nums.length; i++) {
    const need = target - nums[i];
    ops++;
    const vars = [
      { name: "target", value: String(target) },
      { name: "nums[i]", value: String(nums[i]) },
      { name: "need = target − nums[i]", value: String(need), tone: "pointer" as const },
    ];
    if (indexOf.has(need)) {
      const j = indexOf.get(need)!;
      steps.push({
        stage: "found",
        explanation: `${need} is in the map at index ${j}. ${nums[j]} + ${nums[i]} = ${target}. Answer: [${j}, ${i}].`,
        rows: [row("nums", nums, { [j]: "found", [i]: "found" }, { [j]: "j", [i]: "i" })],
        map: { title: "value → index", entries: entries(need) },
        vars,
        ops,
        done: true,
        answer: show([j, i]),
      });
      return steps;
    }
    steps.push({
      stage: "look",
      explanation: `At ${nums[i]} we need ${need} to reach ${target}. Is ${need} in the map? Not yet.`,
      rows: [row("nums", nums, { [i]: "current" }, { [i]: "i" })],
      map: { title: "value → index", entries: entries() },
      vars,
      ops,
    });
    indexOf.set(nums[i], i);
    ops++;
    steps.push({
      stage: "store",
      explanation: `Remember ${nums[i]} is at index ${i}, in case a later number needs it.`,
      rows: [row("nums", nums, { [i]: "visited" }, { [i]: "i" })],
      map: { title: "value → index", entries: entries(nums[i]) },
      vars,
      ops,
    });
  }
  steps.push({ stage: "found", explanation: "No pair adds up to the target.", rows: [row("nums", nums)], vars: [], ops, done: true, answer: "[]" });
  return steps;
}

export const twoSum: PatternProblem<Input> = {
  id: "two-sum",
  title: "Two Sum",
  difficulty: "Easy",
  blind75: true,
  slug: "two-sum",
  video: "KLlXCFG5TnA",
  statement: "Given a list of numbers and a target, return the indices of the two numbers that add up to the target. There's exactly one answer, and you can't use the same element twice.",
  examples: [
    { label: "[2,7,11,15], 9", input: { nums: [2, 7, 11, 15], target: 9 } },
    { label: "[3,2,4], 6", input: { nums: [3, 2, 4], target: 6 } },
    { label: "[4,6,1,8,3,12], 15", input: { nums: [4, 6, 1, 8, 3, 12], target: 15 } },
  ],
  random: (seed) => {
    const g = rngFor(seed);
    for (;;) {
      const n = g.int(4, 8);
      const nums = g.shuffle(Array.from({ length: 19 }, (_, i) => i + 1)).slice(0, n);
      const i = g.int(0, n - 2);
      const j = g.int(i + 1, n - 1);
      const target = nums[i] + nums[j];
      let pairs = 0;
      for (let a = 0; a < n; a++) for (let b = a + 1; b < n; b++) if (nums[a] + nums[b] === target) pairs++;
      if (pairs === 1) return { nums, target };
    }
  },
  big: { label: "200 numbers, pair at the end", input: () => ({ nums: [...Array.from({ length: 198 }, (_, i) => (i + 1) * 10), 1, 2], target: 3 }) },
  describe: ({ nums, target }) => `nums = ${show(nums)}, target = ${target}`,
  run,
  solve: ({ nums, target }) => {
    const m = new Map<number, number>();
    for (let i = 0; i < nums.length; i++) {
      if (m.has(target - nums[i])) return [m.get(target - nums[i])!, i];
      m.set(nums[i], i);
    }
    return [];
  },
  brute: ({ nums, target }) => {
    let ops = 0;
    for (let i = 0; i < nums.length; i++)
      for (let j = i + 1; j < nums.length; j++) {
        ops++;
        if (nums[i] + nums[j] === target) return { answer: [i, j], ops };
      }
    return { answer: [], ops };
  },
  bruteIdea: "Try every pair and check its sum: about n²/2 pairs.",
  guide: {
    title: "Two Sum",
    idea: [
      "For each number x, the partner we need is target − x. Instead of searching the whole list for it, keep a hash map of every number seen so far and its index.",
      "So each step asks one question: “is target − x already in the map?” If yes, done. If not, add x and move on. One pass, no pairs.",
    ],
    whenToUse: ["“Find two items that combine to a target” in an unsorted list: hash map of complements.", "If the list is sorted, two pointers does it with no extra memory (Two Sum II, in the Two Pointers pattern)."],
    stages: [
      { id: "look", title: "Look for the partner", detail: "Compute need = target − x and check the map.", pseudo: "need = target - x; if need in index_of" },
      { id: "store", title: "Not there → remember x", detail: "Store x with its index for later numbers.", pseudo: "index_of[x] = i" },
      { id: "found", title: "Partner found → answer", detail: "Return the stored index and the current one.", pseudo: "return [index_of[need], i]" },
    ],
    legend: [
      { tone: "current", label: "Current number" },
      { tone: "visited", label: "Stored in the map" },
      { tone: "found", label: "The pair" },
    ],
    complexity: { time: "O(n)", space: "O(n)", why: "One pass with constant-time map lookups on average; the map can hold up to n numbers." },
    pitfalls: [
      "Check the map before inserting the current number, so a number never pairs with itself (target 6 with a single 3).",
      "Return indices, not values. Sorting would lose the original indices.",
    ],
    tryThis: ["Pick “[4,6,1,8,3,12], 15” and watch the map grow until 12 finds 3.", "Press “Random” and compare the operation counts."],
    python: py,
  },
};
