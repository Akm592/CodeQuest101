// Subsets (NeetCode 150 · Backtracking).

import py from "../../guides/python/neetcode/subsets.py?raw";
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
  const path: string[] = [];
  let ops = 0;
  let i = -1;
  const push = (stage: string, explanation: string, node?: string, extra: Partial<PatternStep> = {}) =>
    frames.push({
      stage,
      explanation,
      rows: [row("nums", nums, i >= 0 && i < nums.length ? { [i]: "current" } : {}, Object.fromEntries(nums.map((_, j) => [j, `i=${j}`]))), row("subset so far (the path)", cur), row("subsets found", res.map(showList), Object.fromEntries(res.map((_, j) => [j, j === res.length - 1 && stage === "leaf" ? "found" : undefined])))],
      vars: [{ name: "subsets found", value: String(res.length), tone: "found" }],
      ops,
      ...at(t, node, path),
      ...extra,
    });
  const root = t.add("·", undefined, "[]");
  path.push(root);
  push("start", `Every subset makes one yes/no decision per number: put it in, or leave it out. That's a binary decision tree with ${nums.length} levels and 2^${nums.length} = ${2 ** nums.length} leaves, one per subset. Walk it depth first, keeping the current subset as the path.`, root);
  const dfs = (k: number, node: string) => {
    ops++;
    if (k === nums.length) {
      res.push([...cur]);
      t.found.push(node);
      i = -1;
      push("leaf", `A decision has been made for every number: record ${showList(cur)}. That's subset ${res.length} of ${2 ** nums.length}.`, node);
      return;
    }
    i = k;
    cur.push(nums[k]);
    const a = t.add(`+${nums[k]}`, node, showList(cur));
    path.push(a);
    push("take", `Decision for ${nums[k]}: put it in. The subset is now ${showList(cur)}.`, a);
    dfs(k + 1, a);
    path.pop();
    cur.pop();
    i = k;
    const b = t.add(`−${nums[k]}`, node, showList(cur));
    path.push(b);
    push("skip", `Back up and undo: take ${nums[k]} out again, and try the other branch, leaving it out. The subset is ${showList(cur)}.`, b);
    dfs(k + 1, b);
    path.pop();
  };
  dfs(0, root);
  path.length = 0;
  const ans = showLists(canonLists(res, true));
  push("done", `All ${res.length} leaves visited, so all ${res.length} subsets are found.`, undefined, { done: true, answer: ans });
  return finish(t, frames, "decision tree: +x puts x in, −x leaves it out");
}

export const subsets: PatternProblem<Input> = {
  id: "subsets",
  title: "Subsets",
  difficulty: "Medium",
  blind75: false,
  slug: "subsets",
  video: "REOH22Xwdkk",
  statement: "Given distinct numbers, return every possible subset (the power set), including the empty one, in any order.",
  examples: [
    { label: "[1,2,3]", input: [1, 2, 3] },
    { label: "[0]", input: [0] },
    { label: "[4,5]", input: [4, 5] },
  ],
  random: (seed) => {
    const g = rngFor(seed);
    return g.shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]).slice(0, g.int(1, 3));
  },
  describe: (nums) => `nums = ${show(nums)}`,
  run,
  solve: (nums) => {
    const all: number[][] = [];
    for (let m = 0; m < 1 << nums.length; m++) all.push(nums.filter((_, j) => m & (1 << j)));
    return showLists(canonLists(all, true));
  },
  brute: null,
  bruteIdea: "There's no shortcut: the answer itself has 2^n subsets, so any method takes O(n · 2^n). Counting through the bitmasks 0 … 2^n − 1 is the iterative version of the same tree.",
  guide: {
    title: "Subsets",
    idea: [
      "Make one decision per number, in order: include it or don't. Those decisions form a binary tree; each root-to-leaf path is one subset.",
      "Backtracking walks that tree with a single list: append the number, recurse, then pop it (undo the choice) and recurse again without it. At depth n, copy the list into the results.",
    ],
    whenToUse: ["“All subsets / combinations / arrangements”: the answer is exponential, so walk the decision tree.", "Each element is a yes/no choice: two branches per level."],
    stages: [
      { id: "start", title: "Start with an empty subset", detail: "", pseudo: "res, subset = [], []" },
      { id: "take", title: "Include nums[i], recurse", detail: "", pseudo: "subset.append(nums[i]); dfs(i + 1)" },
      { id: "skip", title: "Undo, then leave nums[i] out", detail: "", pseudo: "subset.pop(); dfs(i + 1)" },
      { id: "leaf", title: "Past the last number → record", detail: "", pseudo: "if i >= len(nums): res.append(subset.copy())" },
      { id: "done", title: "Every leaf visited", detail: "", pseudo: "return res" },
    ],
    legend: [
      { tone: "current", label: "Current call" },
      { tone: "pointer", label: "Path from the root: the choices so far" },
      { tone: "found", label: "A subset recorded" },
    ],
    complexity: { time: "O(n · 2^n)", space: "O(n) besides the output", why: "2^n leaves, and copying each subset costs up to n." },
    pitfalls: ["Append a copy (subset.copy()), not the list itself, or every result changes as you backtrack.", "Pop after the first recursive call, so the second branch really leaves the number out."],
    tryThis: ["Step through [1,2,3] and read the leaves left to right: [1,2,3], [1,2], [1,3], [1], …", "Count the nodes: 1 + 2 + 4 + 8 = 15 calls for 3 numbers."],
    python: py,
  },
};
