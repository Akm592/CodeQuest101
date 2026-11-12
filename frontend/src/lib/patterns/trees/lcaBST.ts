// Lowest Common Ancestor of a Binary Search Tree (NeetCode 150 · Trees).

import py from "../../guides/python/neetcode/lca_bst.py?raw";
import { rngFor } from "../helpers";
import type { PatternProblem, PatternStep } from "../types";
import { type Level, type T, fromLevel, insertAll, layout, preorder, randomBST, showLevel, toLevel } from "./tree";

type Input = { tree: Level; p: number; q: number };

function run({ tree, p, q }: Input): PatternStep[] {
  const steps: PatternStep[] = [];
  const root = fromLevel(tree);
  const path = new Set<string>();
  let at: T | null = root;
  let ops = 0;
  const snap = (stage: string, explanation: string, extra: Partial<PatternStep> = {}) =>
    steps.push({
      stage,
      explanation,
      rows: [],
      tree: {
        title: "a binary search tree: smaller values to the left, bigger to the right",
        nodes: layout(root, {
          tone: (t) => (stage === "split" && t === at ? "found" : t === at ? "current" : t.val === p || t.val === q ? "compare" : path.has(t.id) ? "visited" : undefined),
          tag: (t) => [t === at ? "node" : "", t.val === p ? "p" : "", t.val === q ? "q" : ""].filter(Boolean).join(" ") || undefined,
          edgeTone: (t) => (path.has(t.id) && (t === at || path.has(t.id)) && t !== root ? "visited" : undefined),
        }),
      },
      vars: [
        { name: "p, q", value: `${p}, ${q}` },
        { name: "node", value: at ? String(at.val) : "None", tone: "current" },
      ],
      ops,
      ...extra,
    });
  snap("start", `The lowest common ancestor is the deepest node with both ${p} and ${q} below it (a node counts as below itself). In a BST, the values tell you which way they are, so start at the root and walk down.`);
  while (at) {
    ops++;
    path.add(at.id);
    if (p < at.val && q < at.val) {
      snap("left", `${p} and ${q} are both smaller than ${at.val}, so both are in its left subtree. Go left.`);
      at = at.left;
    } else if (p > at.val && q > at.val) {
      snap("right", `${p} and ${q} are both bigger than ${at.val}, so both are in its right subtree. Go right.`);
      at = at.right;
    } else {
      const v = at.val;
      snap("split", v === p || v === q ? `${v} is ${v === p ? "p" : "q"} itself, and the other is below it. So ${v} is the lowest common ancestor.` : `${Math.min(p, q)} < ${v} < ${Math.max(p, q)}: they split here, one on each side. Going down either way would lose one of them, so ${v} is the lowest common ancestor.`, { done: true, answer: String(v) });
      return steps;
    }
  }
  return steps;
}

/** Generic LCA for any binary tree: find both root-to-node paths and compare them. */
function lcaByPaths(tree: Level, p: number, q: number, count: () => void): number {
  const root = fromLevel(tree);
  const pathTo = (t: T | null, v: number, acc: T[]): T[] | null => {
    if (!t) return null;
    count();
    acc.push(t);
    if (t.val === v) return [...acc];
    const found = pathTo(t.left, v, acc) ?? pathTo(t.right, v, acc);
    acc.pop();
    return found;
  };
  const a = pathTo(root, p, [])!;
  const b = pathTo(root, q, [])!;
  let i = 0;
  while (i < a.length && i < b.length && a[i] === b[i]) i++;
  return a[i - 1].val;
}

export const lcaBST: PatternProblem<Input> = {
  id: "lca-bst",
  title: "Lowest Common Ancestor of a BST",
  difficulty: "Medium",
  blind75: true,
  slug: "lowest-common-ancestor-of-a-binary-search-tree",
  video: "gs2LMfuOR9k",
  statement: "Given a binary search tree and two of its values p and q, return the lowest node that has both p and q in its subtree (a node is in its own subtree).",
  examples: [
    { label: "p=2, q=8", input: { tree: [6, 2, 8, 0, 4, 7, 9, null, null, 3, 5], p: 2, q: 8 } },
    { label: "p=2, q=4", input: { tree: [6, 2, 8, 0, 4, 7, 9, null, null, 3, 5], p: 2, q: 4 } },
    { label: "p=3, q=5", input: { tree: [6, 2, 8, 0, 4, 7, 9, null, null, 3, 5], p: 3, q: 5 } },
  ],
  random: (seed) => {
    const g = rngFor(seed);
    const tree = randomBST(g, g.int(3, 10), 1, 20);
    const vals = preorder(fromLevel(tree)).map((t) => t.val);
    const [p, q] = g.shuffle(vals).slice(0, 2);
    return { tree, p, q };
  },
  big: {
    label: "a BST of 200 nodes",
    input: () => {
      const vals = Array.from({ length: 200 }, (_, i) => ((i * 89) % 200) + 1);
      return { tree: toLevel(insertAll(vals)), p: 200, q: 199 };
    },
  },
  describe: ({ tree, p, q }) => `root = ${showLevel(tree)}, p = ${p}, q = ${q}`,
  run,
  solve: ({ tree, p, q }) => lcaByPaths(tree, p, q, () => {}),
  brute: ({ tree, p, q }) => {
    let ops = 0;
    const answer = lcaByPaths(tree, p, q, () => ops++);
    return { answer, ops };
  },
  bruteIdea: "Ignore the BST order: search the whole tree for the path to p and the path to q, then take the last node they share. That's O(n). Using the order, you only walk one path down: O(height).",
  guide: {
    title: "Lowest Common Ancestor of a BST",
    idea: [
      "In a BST, everything left of a node is smaller and everything right is bigger. So comparing p and q with the current node says exactly where they are.",
      "If both are smaller, their common ancestor is in the left subtree; both bigger, the right. Otherwise they split here (or the node is one of them), and this node is the lowest common ancestor. One path from the root: O(h).",
    ],
    whenToUse: ["Any BST question: compare with the node to choose one side, like binary search.", "For a general binary tree (LeetCode 236) you need a full DFS instead."],
    stages: [
      { id: "start", title: "Start at the root", detail: "", pseudo: "node = root" },
      { id: "left", title: "Both smaller → go left", detail: "", pseudo: "if p < node.val and q < node.val: node = node.left" },
      { id: "right", title: "Both bigger → go right", detail: "", pseudo: "elif p > node.val and q > node.val: node = node.right" },
      { id: "split", title: "They split (or one is here) → answer", detail: "", pseudo: "else: return node" },
    ],
    legend: [
      { tone: "current", label: "Current node" },
      { tone: "compare", label: "p and q" },
      { tone: "visited", label: "Path walked" },
      { tone: "found", label: "Lowest common ancestor" },
    ],
    complexity: { time: "O(h)", space: "O(1)", why: "One step down per level, no recursion needed." },
    pitfalls: ["When p (or q) is the current node, that node is the answer: don't keep going.", "This relies on the BST order; it's wrong for a general tree."],
    tryThis: ["Compare “p=2, q=8” (split at the root) with “p=2, q=4” (2 is an ancestor of 4).", "On the big tree, the pattern walks one path while the brute force searches everywhere."],
    python: py,
  },
};
