// Binary Tree Maximum Path Sum (NeetCode 150 · Trees).

import py from "../../guides/python/neetcode/max_path_sum.py?raw";
import { rngFor } from "../helpers";
import type { PatternProblem, PatternStep } from "../types";
import { type Level, type T, deepTree, fromLevel, layout, preorder, randomTree, showLevel } from "./tree";

type Input = Level;

function run(arr: Input): PatternStep[] {
  const steps: PatternStep[] = [];
  const root = fromLevel(arr)!;
  const gain = new Map<string, number>();
  let best = root.val;
  let bestAt: T = root;
  let at: string | null = null;
  let path = new Set<string>();
  let ops = 0;
  const g = (t: T | null) => (t ? Math.max(0, gain.get(t.id) ?? 0) : 0);
  const down = (t: T | null): string[] => {
    if (!t || (gain.get(t.id) ?? 0) <= 0) return [];
    const l = g(t.left);
    const r = g(t.right);
    return [t.id, ...(l === 0 && r === 0 ? [] : down(l >= r ? t.left : t.right))];
  };
  const bendPath = (t: T) => new Set([t.id, ...down(t.left), ...down(t.right)]);
  const snap = (stage: string, explanation: string, extra: Partial<PatternStep> = {}) =>
    steps.push({
      stage,
      explanation,
      rows: [],
      tree: {
        title: "beside each node: the best sum it offers its parent (a path going down from it)",
        nodes: layout(root, {
          tone: (t) => (path.has(t.id) ? "found" : t.id === at ? "current" : gain.has(t.id) ? "visited" : undefined),
          note: (t) => (gain.has(t.id) ? `↑${gain.get(t.id)}` : undefined),
          edgeTone: (t) => (path.has(t.id) && t.id.length > 1 && path.has(t.id.slice(0, -1)) ? "found" : undefined),
        }),
      },
      vars: [{ name: "best path sum", value: String(best), tone: "found" }],
      ops,
      ...extra,
    });
  snap("start", "Every path has a highest node where it bends. A path bending at a node is: node + the best path down its left + the best path down its right (skipping a side if it would lower the sum). Each node passes up only one side, because a path can't fork.");
  const go = (t: T | null): number => {
    if (!t) return 0;
    const l = Math.max(go(t.left), 0);
    const r = Math.max(go(t.right), 0);
    ops++;
    const through = t.val + l + r;
    const up = t.val + Math.max(l, r);
    gain.set(t.id, up);
    at = t.id;
    const improved = through > best;
    if (improved) {
      best = through;
      bestAt = t;
    }
    if (improved) path = bendPath(t);
    snap("return", `${t.val}: best from the left ${l}, from the right ${r}${t.left || t.right ? " (negative sides count as 0: just leave them out)" : ""}. A path bending here sums to ${t.val} + ${l} + ${r} = ${through}.${improved ? " New best (green)." : ""} Pass up ${t.val} + max(${l}, ${r}) = ${up}.`);
    return up;
  };
  go(root);
  at = null;
  path = bendPath(bestAt);
  snap("done", `The largest path sum is ${best}, along the green path bending at ${bestAt.val}.`, { done: true, answer: String(best) });
  return steps;
}

/** For each node as the bend, measure the best downward sums with fresh DFS calls. */
function byBends(arr: Level, count: () => void): number {
  const down = (t: T | null): number => (t ? (count(), t.val + Math.max(0, down(t.left), down(t.right))) : 0);
  return Math.max(...preorder(fromLevel(arr)).map((t) => t.val + Math.max(0, down(t.left)) + Math.max(0, down(t.right))));
}

export const maxPathSum: PatternProblem<Input> = {
  id: "max-path-sum",
  title: "Binary Tree Maximum Path Sum",
  difficulty: "Hard",
  blind75: true,
  slug: "binary-tree-maximum-path-sum",
  video: "Hr5cWUld4vU",
  statement: "A path is any chain of connected nodes, used at most once each; it doesn't have to pass through the root. Values can be negative. Return the largest sum of any non-empty path.",
  examples: [
    { label: "[1,2,3]", input: [1, 2, 3] },
    { label: "[-10,9,20,null,null,15,7]", input: [-10, 9, 20, null, null, 15, 7] },
    { label: "bigger tree", input: [5, 4, 8, 11, null, 13, 4, 7, 2, null, null, null, 1] },
  ],
  random: (seed) => {
    const g = rngFor(seed);
    return randomTree(g, g.int(1, 9), -6, 9);
  },
  big: { label: "a deep tree of 200 nodes", input: () => deepTree(200, (i) => ((i * 7) % 13) - 4) },
  describe: (arr) => `root = ${showLevel(arr)}`,
  run,
  solve: (arr) => byBends(arr, () => {}),
  brute: (arr) => {
    let ops = 0;
    const answer = byBends(arr, () => ops++);
    return { answer, ops };
  },
  bruteIdea: "Try every node as the bend and measure the best downward paths with fresh DFS calls each time: O(n²) for a deep tree. One bottom-up pass computes all of them once.",
  guide: {
    title: "Binary Tree Maximum Path Sum",
    idea: [
      "Look at each path from its highest node, where it bends. The best path bending at a node is node + best downward path on the left + best on the right, where a negative side is replaced by 0 (leave it out).",
      "But a node can only give its parent one side: node + max(left, right), because a path can't split in two. So the DFS returns that, while recording node + left + right as a candidate answer. Same shape as Diameter of Binary Tree, with sums.",
    ],
    whenToUse: ["“Best path anywhere in the tree”: return the best one-sided path up, record the best two-sided path at each node.", "Negative numbers: clamp contributions at 0 when a part is optional."],
    stages: [
      { id: "start", title: "best = root.val", detail: "Paths can't be empty, so start from a real node.", pseudo: "best = root.val" },
      { id: "return", title: "Record node + left + right, return node + max", detail: "left and right are clamped at 0.", pseudo: "best = max(best, node.val + l + r); return node.val + max(l, r)" },
      { id: "done", title: "best is the answer", detail: "", pseudo: "return best" },
    ],
    legend: [
      { tone: "current", label: "Node answering" },
      { tone: "visited", label: "Answered (↑ what it offers)" },
      { tone: "found", label: "Best path so far" },
    ],
    complexity: { time: "O(n)", space: "O(h)", why: "One post-order pass." },
    pitfalls: ["Don't start best at 0: if every value is negative, the answer is the largest single value.", "Return one side only. Returning node + left + right lets a parent use a forked path."],
    tryThis: ["Pick “[-10,9,20,null,null,15,7]”: the best path skips the root.", "Press “Random”: some trees are mostly negative."],
    python: py,
  },
};
