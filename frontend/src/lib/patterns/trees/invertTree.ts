// Invert Binary Tree (NeetCode 150 · Trees).

import py from "../../guides/python/neetcode/invert_tree.py?raw";
import { rngFor } from "../helpers";
import type { PatternProblem, PatternStep } from "../types";
import { type Level, type T, fromLevel, layout, randomTree, showLevel, toLevel } from "./tree";

type Input = Level;

function run(arr: Input): PatternStep[] {
  const steps: PatternStep[] = [];
  const root = fromLevel(arr);
  const swapped = new Set<string>();
  let at: string | null = null;
  let ops = 0;
  const snap = (stage: string, explanation: string, extra: Partial<PatternStep> = {}) =>
    steps.push({
      stage,
      explanation,
      rows: [],
      tree: { nodes: layout(root, { tone: (t) => (t.id === at ? "current" : swapped.has(t.id) ? "found" : undefined), tag: (t) => (t.id === at ? "node" : undefined) }) },
      vars: [{ name: "nodes swapped", value: String(swapped.size) }],
      ops,
      ...extra,
    });
  snap("start", "Inverting means mirroring: every node's left and right children swap places. Visit each node once and swap its two children; the recursion takes care of the rest.");
  const go = (t: T | null) => {
    if (!t) return;
    const l = t.left?.val ?? "None";
    const r = t.right?.val ?? "None";
    [t.left, t.right] = [t.right, t.left];
    swapped.add(t.id);
    at = t.id;
    ops++;
    snap("swap", `At ${t.val}: swap its children (${l} and ${r}). Then do the same inside each child's subtree.`);
    go(t.left);
    go(t.right);
  };
  go(root);
  at = null;
  snap("done", `Every node's children are swapped: the tree is mirrored. ${showLevel(toLevel(root))}`, { done: true, answer: showLevel(toLevel(root)) });
  return steps;
}

const mirror = (t: T | null): T | null => (t ? { ...t, left: mirror(t.right), right: mirror(t.left) } : null);

export const invertTree: PatternProblem<Input> = {
  id: "invert-tree",
  title: "Invert Binary Tree",
  difficulty: "Easy",
  blind75: true,
  slug: "invert-binary-tree",
  video: "OnSn2XEQ4MY",
  statement: "Mirror a binary tree: swap the left and right child of every node, and return the root.",
  examples: [
    { label: "[4,2,7,1,3,6,9]", input: [4, 2, 7, 1, 3, 6, 9] },
    { label: "[2,1,3]", input: [2, 1, 3] },
    { label: "lopsided", input: [1, 2, null, 3, 4, null, 5] },
  ],
  random: (seed) => {
    const g = rngFor(seed);
    return randomTree(g, g.int(1, 9), 1, 9);
  },
  describe: (arr) => `root = ${showLevel(arr)}`,
  run,
  solve: (arr) => showLevel(toLevel(mirror(fromLevel(arr)))),
  brute: null,
  bruteIdea: "There's nothing slower worth trying: every node has to be visited once to swap its children, so O(n) is the best possible.",
  guide: {
    title: "Invert Binary Tree",
    idea: [
      "A tree is a node plus two smaller trees. To mirror it, swap the node's two children, then mirror each child's subtree the same way.",
      "That's the recursive pattern behind almost every tree problem: decide what to do at one node, and trust the recursion for the subtrees. BFS with a queue works just as well.",
    ],
    whenToUse: ["“Do something to every node” where each node's work only needs the node itself: any traversal order works.", "The warm-up for thinking recursively about trees."],
    stages: [
      { id: "start", title: "Start at the root", detail: "", pseudo: "def invert(root):" },
      { id: "swap", title: "Swap the children, recurse", detail: "", pseudo: "root.left, root.right = root.right, root.left; invert(root.left); invert(root.right)" },
      { id: "done", title: "Return the root", detail: "", pseudo: "return root" },
    ],
    legend: [
      { tone: "current", label: "Node being swapped" },
      { tone: "found", label: "Already swapped" },
    ],
    complexity: { time: "O(n)", space: "O(h)", why: "One visit per node; the recursion stack is as deep as the tree (h)." },
    pitfalls: ["Swap with a tuple (or a temporary): writing root.left = root.right first loses the old left child.", "Remember the base case: an empty subtree returns None."],
    tryThis: ["Step through “[4,2,7,1,3,6,9]” and watch the tree flip level by level.", "Invert the result again in your head: you get the original back."],
    python: py,
  },
};
