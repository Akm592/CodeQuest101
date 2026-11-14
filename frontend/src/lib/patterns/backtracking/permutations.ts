// Permutations (NeetCode 150 · Backtracking).

import py from "../../guides/python/neetcode/permutations.py?raw";
import { row, rngFor, show } from "../helpers";
import type { PatternProblem, PatternStep } from "../types";
import { type Frame, RecTree, at, finish } from "./rtree";
import { canonLists, showList, showLists } from "./util";

type Input = number[];

function run(nums: Input): PatternStep[] {
  const t = new RecTree();
  const frames: Frame[] = [];
  const res: number[][] = [];
  const cur: number[] = [];
  const used = new Set<number>();
  const path: string[] = [];
  let ops = 0;
  let trying = -1;
  const push = (stage: string, explanation: string, node?: string, extra: Partial<PatternStep> = {}) =>
    frames.push({
      stage,
      explanation,
      rows: [
        row("nums", nums, Object.fromEntries(nums.map((_, j) => [j, j === trying ? "current" : used.has(j) ? "idle" : undefined])), Object.fromEntries(nums.map((_, j) => [j, used.has(j) ? "used" : undefined]))),
        row("permutation so far", cur),
        row("permutations found", res.map(showList), Object.fromEntries(res.map((_, j) => [j, j === res.length - 1 && stage === "leaf" ? "found" : undefined]))),
      ],
      vars: [{ name: "found", value: `${res.length}`, tone: "found" }],
      ops,
      ...at(t, node, path),
      ...extra,
    });
  const root = t.add("·", undefined, "[]");
  path.push(root);
  push("start", `Build each permutation one position at a time. For the next position, try every number not used yet; after the recursive call returns, mark it unused again so the next branch can use it. ${nums.length} numbers give ${[...Array(nums.length).keys()].reduce((a, k) => a * (k + 1), 1)} leaves.`, root);
  const dfs = (node: string) => {
    ops++;
    if (cur.length === nums.length) {
      res.push([...cur]);
      t.found.push(node);
      trying = -1;
      push("leaf", `Every number is placed: record ${showList(cur)}.`, node);
      return;
    }
    nums.forEach((v, j) => {
      ops++;
      if (used.has(j)) return;
      used.add(j);
      cur.push(v);
      trying = j;
      const a = t.add(String(v), node, showList(cur));
      path.push(a);
      push("choose", `Position ${cur.length}: try ${v}, which isn't used yet. The permutation is ${showList(cur)}.`, a);
      dfs(a);
      path.pop();
      cur.pop();
      used.delete(j);
      trying = j;
      push("undo", `Back from the ${v} branch: remove ${v} and mark it unused, so a later branch can put it in this position or a later one.`, node);
    });
  };
  dfs(root);
  path.length = 0;
  trying = -1;
  push("done", `All ${res.length} permutations found.`, undefined, { done: true, answer: showLists(canonLists(res, false)) });
  return finish(t, frames, "each level fills the next position with an unused number");
}

function perms(xs: number[]): number[][] {
  if (!xs.length) return [[]];
  return xs.flatMap((x, i) => perms([...xs.slice(0, i), ...xs.slice(i + 1)]).map((p) => [x, ...p]));
}

export const permutations: PatternProblem<Input> = {
  id: "permutations",
  title: "Permutations",
  difficulty: "Medium",
  blind75: false,
  slug: "permutations",
  video: "s7AvT7cGdSo",
  statement: "Given distinct numbers, return every possible ordering of them, in any order.",
  examples: [
    { label: "[1,2,3]", input: [1, 2, 3] },
    { label: "[0,1]", input: [0, 1] },
    { label: "[1]", input: [1] },
  ],
  random: (seed) => {
    const g = rngFor(seed);
    return g.shuffle([1, 2, 3, 4, 5, 6]).slice(0, g.int(1, 3));
  },
  describe: (nums) => `nums = ${show(nums)}`,
  run,
  solve: (nums) => showLists(canonLists(perms(nums), false)),
  brute: null,
  bruteIdea: "Nothing is faster: there are n! permutations to output, so any method is at least O(n · n!).",
  guide: {
    title: "Permutations",
    idea: [
      "Fill the positions left to right. At each level, loop over every number that isn't used yet: place it, recurse, then remove it and mark it unused (the backtracking step) before trying the next one.",
      "NeetCode's video builds them another way: take the permutations of the rest of the list, and insert the first number into every gap of each. The Python tab has both; the tree here is the first.",
    ],
    whenToUse: ["“All orderings” or “all arrangements”: a tree whose levels are positions and whose branches are the unused items.", "The same skeleton solves N-Queens, with an extra safety check per branch."],
    stages: [
      { id: "start", title: "Nothing placed", detail: "", pseudo: "dfs([], used=set())" },
      { id: "choose", title: "Place an unused number, recurse", detail: "", pseudo: "for i in range(n): if i not in used: perm.append(nums[i]); used.add(i); dfs()" },
      { id: "undo", title: "Back up: remove it, mark it unused", detail: "", pseudo: "perm.pop(); used.remove(i)" },
      { id: "leaf", title: "All placed → record", detail: "", pseudo: "if len(perm) == n: res.append(perm.copy())" },
      { id: "done", title: "All branches tried", detail: "", pseudo: "return res" },
    ],
    legend: [
      { tone: "current", label: "Number being placed / call" },
      { tone: "idle", label: "Already used on this path" },
      { tone: "pointer", label: "Choices so far" },
      { tone: "found", label: "Permutation recorded" },
    ],
    complexity: { time: "O(n · n!)", space: "O(n)", why: "n! leaves, each copied in O(n)." },
    pitfalls: ["Unmark the number after the recursive call, or later branches can't use it.", "Copy the permutation when you record it."],
    tryThis: ["[1,2,3] has 3 · 2 · 1 = 6 leaves: 3 choices, then 2, then 1.", "Watch the “used” labels under nums come and go as the search backs up."],
    python: py,
  },
};
