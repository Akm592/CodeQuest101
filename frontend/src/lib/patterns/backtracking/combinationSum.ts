// Combination Sum (NeetCode 150 · Backtracking).

import py from "../../guides/python/neetcode/combination_sum.py?raw";
import { row, rngFor, show } from "../helpers";
import type { PatternProblem, PatternStep } from "../types";
import { type Frame, RecTree, at, finish } from "./rtree";
import { canonLists, showList, showLists } from "./util";

type Input = { candidates: number[]; target: number };

function run({ candidates, target }: Input): PatternStep[] {
  const t = new RecTree();
  const frames: Frame[] = [];
  const res: number[][] = [];
  const cur: number[] = [];
  const path: string[] = [];
  let ops = 0;
  let i = -1;
  let total = 0;
  const push = (stage: string, explanation: string, node?: string, extra: Partial<PatternStep> = {}) =>
    frames.push({
      stage,
      explanation,
      rows: [
        row("candidates (each can be reused)", candidates, i >= 0 && i < candidates.length ? { [i]: "current" } : {}, Object.fromEntries(candidates.map((_, j) => [j, `i=${j}`]))),
        row("combination so far", cur),
        row("combinations found", res.map(showList), Object.fromEntries(res.map((_, j) => [j, j === res.length - 1 && stage === "found" ? "found" : undefined]))),
      ],
      vars: [
        { name: "sum so far", value: String(total), tone: total > target ? "swap" : total === target ? "found" : undefined },
        { name: "target", value: String(target) },
      ],
      ops,
      ...at(t, node, path),
      ...extra,
    });
  const root = t.add("·", undefined, "Σ0");
  path.push(root);
  push("start", `Build combinations that add up to ${target}. At each call, with candidate i, choose: use candidates[i] (again: it can repeat), or move on to i + 1 and never use it again. Moving on is what stops the same combination appearing in two orders.`, root);
  const dfs = (k: number, node: string) => {
    ops++;
    i = k;
    if (total === target) {
      res.push([...cur]);
      t.found.push(node);
      push("found", `The sum is exactly ${target}: record ${showList(cur)}.`, node);
      return;
    }
    if (k >= candidates.length || total > target) {
      t.dead.push(node);
      push("dead", total > target ? `The sum is ${total}, past ${target}. Adding more can only make it bigger, so this branch is dead.` : `No candidates left to try and the sum is ${total}, short of ${target}. Dead end.`, node);
      return;
    }
    const c = candidates[k];
    cur.push(c);
    total += c;
    const a = t.add(`+${c}`, node, `Σ${total}`);
    path.push(a);
    push("take", `Use ${c} (candidate ${k}). The combination is ${showList(cur)}, sum ${total}. Stay on candidate ${k}: it can be used again.`, a);
    dfs(k, a);
    path.pop();
    cur.pop();
    total -= c;
    const b = t.add(`−${c}`, node, `Σ${total}`);
    path.push(b);
    i = k;
    push("skip", `Undo the ${c}, and take the other branch: no more ${c}s in this combination. Move on to candidate ${k + 1}.`, b);
    dfs(k + 1, b);
    path.pop();
  };
  dfs(0, root);
  path.length = 0;
  i = -1;
  push("done", `The tree is fully explored. ${res.length ? `${res.length} combination${res.length === 1 ? "" : "s"} add up to ${target}.` : `No combination adds up to ${target}.`}`, undefined, { done: true, answer: showLists(canonLists(res, true)) });
  return finish(t, frames, "decision tree: +x uses x again, −x moves on to the next candidate");
}

/** The slow way: try every count of every candidate, up to target / candidate copies each, and keep the ones that add up. */
function slow({ candidates, target }: Input) {
  let ops = 0;
  const res: number[][] = [];
  const counts = Array<number>(candidates.length).fill(0);
  const go = (j: number) => {
    if (j === candidates.length) {
      ops++;
      if (counts.reduce((s, c, q) => s + c * candidates[q], 0) === target) res.push(candidates.flatMap((v, q) => Array<number>(counts[q]).fill(v)));
      return;
    }
    for (let c = 0; c * candidates[j] <= target; c++) {
      counts[j] = c;
      go(j + 1);
    }
    counts[j] = 0;
  };
  go(0);
  return { answer: showLists(canonLists(res, true)), ops };
}

export const combinationSum: PatternProblem<Input> = {
  id: "combination-sum",
  title: "Combination Sum",
  difficulty: "Medium",
  blind75: true,
  slug: "combination-sum",
  video: "GBKI9VSKdGg",
  statement: "Given distinct positive candidates and a target, return every combination of candidates that adds up to the target. A candidate may be used any number of times; combinations differing only in order count once.",
  examples: [
    { label: "LeetCode's example 1", input: { candidates: [2, 3, 6, 7], target: 7 } },
    { label: "[2,3,5], target 8", input: { candidates: [2, 3, 5], target: 8 } },
    { label: "none possible", input: { candidates: [2], target: 3 } },
  ],
  random: (seed) => {
    const g = rngFor(seed);
    return { candidates: g.shuffle([2, 3, 4, 5, 6, 7]).slice(0, g.int(1, 3)).sort((a, b) => a - b), target: g.int(2, 9) };
  },
  big: { label: "[3,4,5,7,11,13], target 30", input: () => ({ candidates: [3, 4, 5, 7, 11, 13], target: 30 }) },
  describe: ({ candidates, target }) => `candidates = ${show(candidates)}, target = ${target}`,
  run,
  solve: (input) => slow(input).answer,
  brute: slow,
  bruteIdea: "Try every possible count of every candidate (0 up to target ÷ candidate copies each) and check the sum. Most of those mixes overshoot long before the end; backtracking stops each branch as soon as the sum passes the target.",
  guide: {
    title: "Combination Sum",
    idea: [
      "Walk a decision tree with two branches per call: use candidates[i] again (stay at i), or skip it for good (move to i + 1). Because each branch only ever moves forward through the candidates, every combination is built in one order only, so there are no duplicates to remove.",
      "Stop a branch as soon as the sum reaches the target (record it) or passes it (dead end): positive numbers can only make it bigger.",
    ],
    whenToUse: ["“All combinations that add up to …” with reuse allowed.", "Avoid duplicate orderings by only moving forward through the choices."],
    stages: [
      { id: "start", title: "Empty combination, sum 0", detail: "", pseudo: "dfs(0, [], 0)" },
      { id: "take", title: "Use candidates[i], stay at i", detail: "", pseudo: "cur.append(candidates[i]); dfs(i, cur, total + candidates[i])" },
      { id: "skip", title: "Undo, move on to i + 1", detail: "", pseudo: "cur.pop(); dfs(i + 1, cur, total)" },
      { id: "found", title: "Sum equals target → record", detail: "", pseudo: "if total == target: res.append(cur.copy()); return" },
      { id: "dead", title: "Sum too big, or no candidates left", detail: "", pseudo: "if i >= len(candidates) or total > target: return" },
      { id: "done", title: "Tree explored", detail: "", pseudo: "return res" },
    ],
    legend: [
      { tone: "current", label: "Current call" },
      { tone: "pointer", label: "Choices so far" },
      { tone: "found", label: "Adds up to the target" },
      { tone: "swap", label: "Dead end" },
    ],
    complexity: { time: "O(2^(t/m))", space: "O(t/m)", why: "t is the target and m the smallest candidate: the tree is at most t/m levels deep with two branches per call." },
    pitfalls: ["Without the “move forward only” rule you'd get [2,2,3], [2,3,2] and [3,2,2] as three answers.", "Check total == target before total > target, and before running out of candidates."],
    tryThis: ["In LeetCode's example, the +7 branch finds [7] right away.", "In “none possible”, every branch ends red."],
    python: py,
  },
};
