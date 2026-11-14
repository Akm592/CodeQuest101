// Combination Sum II (NeetCode 150 · Backtracking).

import py from "../../guides/python/neetcode/combination_sum_ii.py?raw";
import { row, rngFor, show } from "../helpers";
import type { PatternProblem, PatternStep } from "../types";
import { type Frame, RecTree, at, finish } from "./rtree";
import { canonLists, showList, showLists } from "./util";

type Input = { candidates: number[]; target: number };

function run(input: Input): PatternStep[] {
  const c = [...input.candidates].sort((a, b) => a - b);
  const { target } = input;
  const t = new RecTree();
  const frames: Frame[] = [];
  const res: number[][] = [];
  const cur: number[] = [];
  const path: string[] = [];
  let ops = 0;
  let total = 0;
  let hi: Record<number, "current" | "compare" | "idle" | undefined> = {};
  const push = (stage: string, explanation: string, node?: string, extra: Partial<PatternStep> = {}) =>
    frames.push({
      stage,
      explanation,
      rows: [
        row("candidates, sorted (each used at most once)", c, hi, Object.fromEntries(c.map((_, j) => [j, `i=${j}`]))),
        row("combination so far", cur),
        row("combinations found", res.map(showList), Object.fromEntries(res.map((_, j) => [j, j === res.length - 1 && stage === "found" ? "found" : undefined]))),
      ],
      vars: [
        { name: "sum so far", value: String(total), tone: total === target ? "found" : undefined },
        { name: "target", value: String(target) },
      ],
      ops,
      ...at(t, node, path),
      ...extra,
    });
  const root = t.add("·", undefined, "Σ0");
  path.push(root);
  push("start", `Sort the candidates: ${show(c)}. Each call picks the next number to add from position i onwards. Two rules prune the tree: at one level, never start with the same value twice (that would repeat a combination), and stop as soon as a number would push the sum past ${target} (the rest are bigger).`, root);
  const dfs = (start: number, node: string) => {
    ops++;
    if (total === target) {
      res.push([...cur]);
      t.found.push(node);
      hi = {};
      push("found", `The sum is exactly ${target}: record ${showList(cur)}.`, node);
      return;
    }
    let prev: number | null = null;
    for (let j = start; j < c.length; j++) {
      ops++;
      if (c[j] === prev) {
        hi = { [j]: "idle" };
        push("dup", `Skip ${c[j]} at index ${j}: this call has already tried adding a ${c[j]} here, so trying another copy would only repeat the combinations found then.`, node);
        continue;
      }
      if (total + c[j] > target) {
        hi = { [j]: "compare" };
        const d = t.add(`+${c[j]}`, node, `Σ${total + c[j]}`);
        t.dead.push(d);
        push("stop", `${total} + ${c[j]} = ${total + c[j]} is past ${target}. The numbers after it are at least as big, so stop this whole level.`, d);
        return;
      }
      cur.push(c[j]);
      total += c[j];
      hi = { [j]: "current" };
      const a = t.add(`+${c[j]}`, node, `Σ${total}`);
      path.push(a);
      push("take", `Add ${c[j]} (index ${j}): ${showList(cur)}, sum ${total}. The next number must come after index ${j}.`, a);
      dfs(j + 1, a);
      path.pop();
      cur.pop();
      total -= c[j];
      prev = c[j];
    }
    // Nothing left to add and the sum is short: a dead end (shown red from now on).
    if (node !== root && !t.nodes.find((n) => n.id === node)!.kids.length) t.dead.push(node);
  };
  dfs(0, root);
  path.length = 0;
  hi = {};
  push("done", `Done. ${res.length ? `${res.length} combination${res.length === 1 ? "" : "s"} add up to ${target}, each listed once.` : `No combination adds up to ${target}.`}`, undefined, { done: true, answer: showLists(canonLists(res, true)) });
  return finish(t, frames, "each level picks the next number; red: past the target");
}

/** The slow way: every subset of the candidates (2^n), keep those that add up, then remove repeats. */
function slow({ candidates, target }: Input) {
  const n = candidates.length;
  const seen = new Map<string, number[]>();
  let ops = 0;
  for (let m = 0; m < 1 << n; m++) {
    const s = candidates.filter((_, j) => m & (1 << j)).sort((a, b) => a - b);
    ops += n;
    if (s.reduce((x, y) => x + y, 0) === target) seen.set(s.join(","), s);
  }
  return { answer: showLists(canonLists([...seen.values()], true)), ops };
}

export const combinationSum2: PatternProblem<Input> = {
  id: "combination-sum-ii",
  title: "Combination Sum II",
  difficulty: "Medium",
  blind75: false,
  slug: "combination-sum-ii",
  video: "rSA3t6BDDwg",
  statement: "Given candidates (possibly with duplicates) and a target, return every combination that adds up to the target. Each candidate may be used once, and the answer must not contain the same combination twice.",
  examples: [
    { label: "LeetCode's example 2", input: { candidates: [2, 5, 2, 1, 2], target: 5 } },
    { label: "LeetCode's example 1", input: { candidates: [10, 1, 2, 7, 6, 1, 5], target: 8 } },
  ],
  random: (seed) => {
    const g = rngFor(seed);
    return { candidates: Array.from({ length: g.int(1, 6) }, () => g.int(1, 5)), target: g.int(2, 8) };
  },
  big: { label: "16 candidates with repeats, target 12", input: () => ({ candidates: [1, 1, 1, 2, 2, 2, 3, 3, 4, 5, 6, 7, 8, 9, 10, 11], target: 12 }) },
  describe: ({ candidates, target }) => `candidates = ${show(candidates)}, target = ${target}`,
  run,
  solve: (input) => slow(input).answer,
  brute: slow,
  bruteIdea: "Try all 2^n subsets of the candidates, keep those that add up to the target, and remove repeated combinations at the end.",
  guide: {
    title: "Combination Sum II",
    idea: [
      "Sort the candidates. Each call chooses the next number to add from position i onwards, then recurses from just after it, so every number is used at most once.",
      "Duplicates: within one call's loop, skip a value equal to the one tried just before. The first copy already explored every combination starting with that value. Pruning: once a value pushes the sum past the target, every later value will too (they're sorted), so break out of the loop.",
    ],
    whenToUse: ["Combinations from input with duplicates, each item used once: sort, loop over the next choice, skip equal neighbours.", "Sorted choices let you stop a whole loop early when a bound is passed."],
    stages: [
      { id: "start", title: "Sort, start empty", detail: "", pseudo: "candidates.sort(); dfs(0, [], 0)" },
      { id: "take", title: "Add candidates[j], recurse from j + 1", detail: "", pseudo: "cur.append(c[j]); dfs(j + 1, cur, total + c[j]); cur.pop()" },
      { id: "dup", title: "Same value as the last one tried → skip", detail: "", pseudo: "if c[j] == prev: continue" },
      { id: "stop", title: "Past the target → stop this level", detail: "", pseudo: "if total + c[j] > target: break" },
      { id: "found", title: "Sum equals target → record", detail: "", pseudo: "if total == target: res.append(cur.copy()); return" },
      { id: "done", title: "Tree explored", detail: "", pseudo: "return res" },
    ],
    legend: [
      { tone: "current", label: "Number being added" },
      { tone: "idle", label: "Skipped duplicate" },
      { tone: "compare", label: "Too big: stop here" },
      { tone: "found", label: "Adds up to the target" },
      { tone: "swap", label: "Dead end" },
    ],
    complexity: { time: "O(2^n)", space: "O(n)", why: "In the worst case every subset is a node of the tree; sorting and pruning cut most of them." },
    pitfalls: ["Skip duplicates by comparing with the previous value in the same loop, not with the value used one level up: [1,1,6] needs both 1s.", "break, not continue, when a value is too big: the list is sorted."],
    tryThis: ["In LeetCode's example 2, [1,2,2] appears once even though there are three 2s.", "In example 1, watch the second 1 at the top level get skipped."],
    python: py,
  },
};
