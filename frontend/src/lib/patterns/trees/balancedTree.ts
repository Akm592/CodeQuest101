// Balanced Binary Tree (NeetCode 150 · Trees).

import py from "../../guides/python/neetcode/balanced_tree.py?raw";
import { rngFor } from "../helpers";
import type { PatternProblem, PatternStep } from "../types";
import { type Level, type T, completeTree, fromLevel, height, layout, preorder, randomTree, showLevel } from "./tree";

type Input = Level;

function run(arr: Input): PatternStep[] {
  const steps: PatternStep[] = [];
  const root = fromLevel(arr);
  const h = new Map<string, number>();
  let at: string | null = null;
  let bad: string | null = null;
  let ops = 0;
  const snap = (stage: string, explanation: string, extra: Partial<PatternStep> = {}) =>
    steps.push({
      stage,
      explanation,
      rows: [],
      tree: { title: "beside each node: its height", nodes: layout(root, { tone: (t) => (t.id === bad ? "swap" : t.id === at ? "current" : h.has(t.id) ? "found" : undefined), note: (t) => (h.has(t.id) ? `h=${h.get(t.id)}` : undefined) }) },
      vars: [{ name: "nodes checked", value: String(h.size) }],
      ops,
      ...extra,
    });
  snap("start", "Balanced means: at every node, the two subtrees' heights differ by at most 1. Work bottom-up so each height is computed once, and stop at the first node that breaks the rule.");
  let ok = true;
  const go = (t: T | null): number => {
    if (!t || !ok) return 0;
    const l = go(t.left);
    if (!ok) return 0;
    const r = go(t.right);
    if (!ok) return 0;
    ops++;
    at = t.id;
    h.set(t.id, 1 + Math.max(l, r));
    if (Math.abs(l - r) > 1) {
      ok = false;
      bad = t.id;
      snap("unbalanced", `${t.val}: left height ${l}, right height ${r}. They differ by ${Math.abs(l - r)}, more than 1, so the tree isn't balanced. No need to check the rest.`, { done: true, answer: "false" });
      return 0;
    }
    snap("return", `${t.val}: left height ${l}, right height ${r}, a difference of ${Math.abs(l - r)} (fine). Return height ${1 + Math.max(l, r)}.`);
    return 1 + Math.max(l, r);
  };
  go(root);
  if (!ok) return steps;
  at = null;
  snap("done", "Every node passed: the tree is balanced.", { done: true, answer: "true" });
  return steps;
}

export const balancedTree: PatternProblem<Input> = {
  id: "balanced-tree",
  title: "Balanced Binary Tree",
  difficulty: "Easy",
  blind75: false,
  slug: "balanced-binary-tree",
  video: "QfJsau0ItOY",
  statement: "Return true if, at every node, the heights of the left and right subtrees differ by at most 1.",
  examples: [
    { label: "[3,9,20,null,null,15,7]", input: [3, 9, 20, null, null, 15, 7] },
    { label: "[1,2,2,3,3,null,null,4,4]", input: [1, 2, 2, 3, 3, null, null, 4, 4] },
    { label: "unbalanced deep down", input: [1, 2, 3, 4, null, null, 5, 6] },
  ],
  random: (seed) => {
    const g = rngFor(seed);
    return g.r() < 0.4 ? completeTree(g.int(1, 9), () => g.int(1, 9)) : randomTree(g, g.int(2, 9), 1, 9);
  },
  big: { label: "a complete tree of 200 nodes", input: () => completeTree(200) },
  describe: (arr) => `root = ${showLevel(arr)}`,
  run,
  solve: (arr) => preorder(fromLevel(arr)).every((t) => Math.abs(height(t.left) - height(t.right)) <= 1),
  brute: (arr) => {
    // Top-down: at each node measure both heights from scratch, then check the children.
    let ops = 0;
    const hgt = (t: T | null): number => (t ? (ops++, 1 + Math.max(hgt(t.left), hgt(t.right))) : 0);
    const bal = (t: T | null): boolean => !t || (Math.abs(hgt(t.left) - hgt(t.right)) <= 1 && bal(t.left) && bal(t.right));
    return { answer: bal(fromLevel(arr)), ops };
  },
  bruteIdea: "Top-down: at each node, measure both subtrees' heights with a fresh DFS, then check the children the same way. Every node is re-measured once per ancestor: O(n log n) for a balanced tree, O(n²) for a thin one.",
  guide: {
    title: "Balanced Binary Tree",
    idea: [
      "Checking each node needs its children's heights. Measuring them separately at every node repeats work, so go bottom-up instead: each call returns its height (and whether its subtree was fine), and the parent checks |left − right| ≤ 1.",
      "Every height is computed exactly once, so the whole check is O(n). NeetCode returns a pair [balanced, height]; stopping at the first failure is the same thing.",
    ],
    whenToUse: ["A property that must hold at every node and depends on subtree sizes or heights: compute bottom-up, return both the value and the verdict.", "Top-down checks that recompute subtree data are the usual trap."],
    stages: [
      { id: "start", title: "DFS to the leaves", detail: "", pseudo: "def dfs(node): if not node: return True, 0" },
      { id: "return", title: "Heights differ by ≤ 1 → return the height", detail: "", pseudo: "return lb and rb and abs(lh - rh) <= 1, 1 + max(lh, rh)" },
      { id: "unbalanced", title: "Differ by more → false", detail: "", pseudo: "return False" },
      { id: "done", title: "Every node passed → true", detail: "", pseudo: "" },
    ],
    legend: [
      { tone: "current", label: "Node checking" },
      { tone: "found", label: "Checked (h = height)" },
      { tone: "swap", label: "Breaks the rule" },
    ],
    complexity: { time: "O(n)", space: "O(h)", why: "Each node returns its height once." },
    pitfalls: ["Checking only the root isn't enough: [1,2,2,3,3,null,null,4,4] is fine at the root's children but not further down.", "Balanced doesn't mean complete or full."],
    tryThis: ["Pick “unbalanced deep down”: the root looks fine, but 2 isn't.", "Press “Random” and guess before stepping."],
    python: py,
  },
};
