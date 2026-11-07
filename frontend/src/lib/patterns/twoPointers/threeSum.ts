// 3Sum (NeetCode 150 · Two Pointers).

import py from "../../guides/python/neetcode/three_sum.py?raw";
import { row, rngFor, show } from "../helpers";
import type { PatternProblem, PatternStep } from "../types";

type Input = number[];

export function threeSumSolve(input: number[]): number[][] {
  const nums = [...input].sort((a, b) => a - b);
  const out: number[][] = [];
  for (let i = 0; i < nums.length; i++) {
    if (i > 0 && nums[i] === nums[i - 1]) continue;
    let l = i + 1;
    let r = nums.length - 1;
    while (l < r) {
      const t = nums[i] + nums[l] + nums[r];
      if (t < 0) l++;
      else if (t > 0) r--;
      else {
        out.push([nums[i], nums[l], nums[r]]);
        l++;
        while (l < r && nums[l] === nums[l - 1]) l++;
      }
    }
  }
  return out;
}

function run(input: Input): PatternStep[] {
  const steps: PatternStep[] = [];
  const nums = [...input].sort((a, b) => a - b);
  const found: number[][] = [];
  let ops = Math.ceil(nums.length * Math.log2(Math.max(2, nums.length)));
  const map = () => ({ title: "triplets found", entries: found.map((t, k) => ({ k: `#${k + 1}`, v: show(t), tone: k === found.length - 1 ? ("found" as const) : undefined })) });
  const snap = (stage: string, i: number, l: number | null, r: number | null, explanation: string, extra: Partial<PatternStep> = {}) => {
    const tones: Record<number, "current" | "pointer" | "found" | "compare" | undefined> = { [i]: "compare" };
    const tags: Record<number, string> = { [i]: "i" };
    if (l !== null) {
      tones[l] = stage === "hit" ? "found" : "current";
      tags[l] = "L";
    }
    if (r !== null) {
      tones[r] = stage === "hit" ? "found" : "current";
      tags[r] = l === r ? "L R" : "R";
    }
    if (stage === "hit") tones[i] = "found";
    steps.push({
      stage,
      explanation,
      rows: [row("sorted nums", nums, tones, tags)],
      map: map(),
      vars: l !== null && r !== null ? [{ name: "nums[i] + nums[L] + nums[R]", value: `${nums[i]} + ${nums[l]} + ${nums[r]} = ${nums[i] + nums[l] + nums[r]}`, tone: "pointer" }] : [{ name: "nums[i]", value: String(nums[i]) }],
      ops,
      ...extra,
    });
  };
  steps.push({ stage: "sort", explanation: `Sort first: ${show(nums)}. Sorting lets two pointers work and puts duplicates next to each other.`, rows: [row("sorted nums", nums)], map: map(), vars: [], ops });
  for (let i = 0; i < nums.length - 2; i++) {
    if (i > 0 && nums[i] === nums[i - 1]) {
      ops++;
      snap("skipDup", i, null, null, `nums[i] = ${nums[i]} is the same as the previous first number. It would find the same triplets again, so skip it.`);
      continue;
    }
    let l = i + 1;
    let r = nums.length - 1;
    snap("fix", i, l, r, `Fix ${nums[i]} as the first number. Now find two more that add to ${-nums[i]}: that's Two Sum II on the rest, with L and R.`);
    while (l < r) {
      const t = nums[i] + nums[l] + nums[r];
      ops++;
      if (t < 0) {
        snap("move", i, l, r, `Sum ${t} is below 0: move L right for a bigger number.`);
        l++;
      } else if (t > 0) {
        snap("move", i, l, r, `Sum ${t} is above 0: move R left for a smaller number.`);
        r--;
      } else {
        found.push([nums[i], nums[l], nums[r]]);
        snap("hit", i, l, r, `${nums[i]} + ${nums[l]} + ${nums[r]} = 0. Record it, then move L past any copies of ${nums[l]} so this triplet isn't recorded twice.`);
        l++;
        while (l < r && nums[l] === nums[l - 1]) {
          l++;
          ops++;
        }
      }
    }
  }
  steps.push({ stage: "done", explanation: found.length ? `Done: ${found.length} unique triplet${found.length === 1 ? "" : "s"}.` : "Done: no three numbers add up to 0.", rows: [row("sorted nums", nums)], map: map(), vars: [], ops, done: true, answer: found.length ? found.map((t) => show(t)).join(" ") : "[]" });
  return steps;
}

export const threeSum: PatternProblem<Input> = {
  id: "3sum",
  title: "3Sum",
  difficulty: "Medium",
  blind75: true,
  slug: "3sum",
  video: "jzZsG8n2R9A",
  statement: "Given a list of numbers, return every different triplet of numbers (from different positions) that adds up to 0. No triplet may appear twice in the answer.",
  examples: [
    { label: "[-1,0,1,2,-1,-4]", input: [-1, 0, 1, 2, -1, -4] },
    { label: "[0,0,0,0]", input: [0, 0, 0, 0] },
    { label: "[-2,0,1,1,2,-1,3]", input: [-2, 0, 1, 1, 2, -1, 3] },
  ],
  random: (seed) => {
    const g = rngFor(seed);
    return Array.from({ length: g.int(5, 8) }, () => g.int(-4, 4));
  },
  big: { label: "200 numbers from −20 to 20", input: () => Array.from({ length: 200 }, (_, i) => ((i * 37) % 41) - 20) },
  describe: (nums) => `nums = ${show(nums)}`,
  run,
  solve: threeSumSolve,
  brute: (nums) => {
    let ops = 0;
    const seen = new Set<string>();
    const out: number[][] = [];
    for (let a = 0; a < nums.length; a++)
      for (let b = a + 1; b < nums.length; b++)
        for (let c = b + 1; c < nums.length; c++) {
          ops++;
          if (nums[a] + nums[b] + nums[c] === 0) {
            const t = [nums[a], nums[b], nums[c]].sort((x, y) => x - y);
            if (!seen.has(t.join())) {
              seen.add(t.join());
              out.push(t);
            }
          }
        }
    return { answer: out, ops };
  },
  bruteIdea: "Try every triple of positions: about n³/6 checks, plus a set to remove repeated triplets.",
  canon: (a) => (a as number[][]).map((t) => [...t].sort((x, y) => x - y).join()).sort(),
  guide: {
    title: "3Sum",
    idea: [
      "Sort the list. Then fix the first number nums[i], and the job becomes “find two numbers after it that add to −nums[i]”, which is exactly Two Sum II with L and R.",
      "Repeats are handled by sorting too: equal numbers sit next to each other, so skip a first number equal to the one before it, and after a hit move L past copies of the same value.",
    ],
    whenToUse: ["“Find k numbers that add to a target”: sort, fix all but two, then two pointers on the last two. 3Sum is O(n²), 4Sum O(n³).", "“No duplicate answers”: sort and skip equal neighbours."],
    stages: [
      { id: "sort", title: "Sort", detail: "Makes two pointers possible and groups duplicates.", pseudo: "nums.sort()" },
      { id: "skipDup", title: "Same first number → skip", detail: "It would produce the same triplets again.", pseudo: "if i > 0 and nums[i] == nums[i-1]: continue" },
      { id: "fix", title: "Fix nums[i], then two pointers", detail: "L just after i, R at the end.", pseudo: "l, r = i + 1, len(nums) - 1" },
      { id: "move", title: "Too small → L right; too big → R left", detail: "Same logic as Two Sum II.", pseudo: "if total < 0: l += 1 else: r -= 1" },
      { id: "hit", title: "Sum is 0 → record, skip copies", detail: "Save the triplet and move L past equal values.", pseudo: "result.append(...); l += 1; while nums[l] == nums[l-1]: l += 1" },
      { id: "done", title: "All first numbers tried", detail: "The list holds every unique triplet.", pseudo: "return result" },
    ],
    legend: [
      { tone: "compare", label: "Fixed first number (i)" },
      { tone: "current", label: "L and R" },
      { tone: "found", label: "A triplet that adds to 0" },
    ],
    complexity: { time: "O(n²)", space: "O(1) extra (besides sorting and the output)", why: "Sorting is O(n log n); then for each of n first numbers the two pointers make one O(n) sweep." },
    pitfalls: [
      "Forgetting to skip duplicates gives repeated triplets like [-1, 0, 1] twice.",
      "Only one of the two pointers needs its duplicate-skip after a hit; the next comparison moves the other one.",
      "An early exit when nums[i] > 0 is a nice speed-up: three positive numbers can't add to 0.",
    ],
    tryThis: ["Pick “[-1,0,1,2,-1,-4]” and watch the second −1 get skipped.", "Pick “[0,0,0,0]”: one triplet, not four."],
    python: py,
  },
};
