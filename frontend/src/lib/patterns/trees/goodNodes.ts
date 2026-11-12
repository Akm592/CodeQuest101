// Count Good Nodes in Binary Tree (NeetCode 150 · Trees).

import py from "../../guides/python/neetcode/good_nodes.py?raw";
import { rngFor } from "../helpers";
import type { PatternProblem, PatternStep } from "../types";
import { type Level, type T, deepTree, fromLevel, layout, randomTree, showLevel } from "./tree";

type Input = Level;

function run(arr: Input): PatternStep[] {
  const steps: PatternStep[] = [];
  const root = fromLevel(arr);
  const verdict = new Map<string, boolean>();
  const maxAt = new Map<string, number>();
  let at: string | null = null;
  let count = 0;
  let ops = 0;
  const snap = (stage: string, explanation: string, extra: Partial<PatternStep> = {}) =>
    steps.push({
      stage,
      explanation,
      rows: [],
      tree: { title: "beside each node: the biggest value on the path above it", nodes: layout(root, { tone: (t) => (t.id === at ? "current" : verdict.has(t.id) ? (verdict.get(t.id) ? "found" : "idle") : undefined), note: (t) => (maxAt.has(t.id) ? `max ${maxAt.get(t.id)}` : undefined) }) },
      vars: [{ name: "good nodes", value: String(count), tone: "found" }],
      ops,
      ...extra,
    });
  snap("start", "A node is good if nothing on the path from the root down to it is bigger than it. Carry the biggest value seen so far down the tree; each node just compares itself with it.");
  const go = (t: T | null, best: number) => {
    if (!t) return;
    ops++;
    at = t.id;
    maxAt.set(t.id, best);
    const good = t.val >= best;
    verdict.set(t.id, good);
    if (good) count++;
    snap(good ? "good" : "bad", good ? `${t.val} ≥ ${best === -Infinity ? "anything" : best} (the biggest above it), so it's good. Pass max ${Math.max(best, t.val)} down.` : `${t.val} < ${best}, which is above it, so it's not good. Keep passing ${best} down.`);
    go(t.left, Math.max(best, t.val));
    go(t.right, Math.max(best, t.val));
  };
  if (root) go(root, root.val);
  at = null;
  snap("done", `${count} good node${count === 1 ? "" : "s"} (green).`, { done: true, answer: String(count) });
  return steps;
}

/** For each node, walk the path from the root again to check it. */
function byPaths(arr: Level, count: () => void): number {
  const root = fromLevel(arr);
  let good = 0;
  const go = (t: T | null, path: number[]) => {
    if (!t) return;
    let ok = true;
    for (const v of path) {
      count();
      if (v > t.val) ok = false;
    }
    if (ok) good++;
    go(t.left, [...path, t.val]);
    go(t.right, [...path, t.val]);
  };
  go(root, []);
  return good;
}

export const goodNodes: PatternProblem<Input> = {
  id: "good-nodes",
  title: "Count Good Nodes in Binary Tree",
  difficulty: "Medium",
  blind75: false,
  slug: "count-good-nodes-in-binary-tree",
  video: "7cp5imvDzl4",
  statement: "A node is good if no node on the path from the root to it has a bigger value. Return the number of good nodes.",
  examples: [
    { label: "[3,1,4,3,null,1,5]", input: [3, 1, 4, 3, null, 1, 5] },
    { label: "[3,3,null,4,2]", input: [3, 3, null, 4, 2] },
    { label: "rising and falling", input: [2, 5, 1, 4, 7, 3, null, 6] },
  ],
  random: (seed) => {
    const g = rngFor(seed);
    return randomTree(g, g.int(1, 10), 1, 9);
  },
  big: { label: "a deep tree of 200 nodes", input: () => deepTree(200) },
  describe: (arr) => `root = ${showLevel(arr)}`,
  run,
  solve: (arr) => byPaths(arr, () => {}),
  brute: (arr) => {
    let ops = 0;
    const answer = byPaths(arr, () => ops++);
    return { answer, ops };
  },
  bruteIdea: "For each node, look back over the whole path from the root to check nothing is bigger: O(n·h), which is O(n²) for a deep tree.",
  guide: {
    title: "Count Good Nodes in Binary Tree",
    idea: [
      "Whether a node is good depends only on the biggest value above it. So instead of looking back up the path, carry that maximum down: a pre-order DFS passing max_so_far to each child.",
      "At each node: good if val ≥ max_so_far; then pass max(max_so_far, val) to both children. One visit per node.",
    ],
    whenToUse: ["“Depends on the path from the root”: pass the needed summary (max, sum, depth) down as a parameter (top-down).", "Compare Maximum Depth, where answers flow up instead."],
    stages: [
      { id: "start", title: "DFS from the root with max = root.val", detail: "", pseudo: "dfs(root, root.val)" },
      { id: "good", title: "val ≥ max → good", detail: "", pseudo: "good = 1 if node.val >= best else 0" },
      { id: "bad", title: "val < max → not good", detail: "", pseudo: "" },
      { id: "done", title: "Total good nodes", detail: "", pseudo: "return good + dfs(left, best) + dfs(right, best)" },
    ],
    legend: [
      { tone: "current", label: "Node being checked" },
      { tone: "found", label: "Good" },
      { tone: "idle", label: "Not good" },
    ],
    complexity: { time: "O(n)", space: "O(h)", why: "One visit per node; the max travels as an argument." },
    pitfalls: ["Use ≥, not >: a node equal to the maximum above it is still good.", "The root is always good."],
    tryThis: ["Pick “[3,3,null,4,2]”: the second 3 is good (equal counts).", "On the deep tree, the brute force re-reads long paths."],
    python: py,
  },
};
