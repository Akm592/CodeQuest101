// Construct Binary Tree from Preorder and Inorder Traversal (NeetCode 150 · Trees).

import py from "../../guides/python/neetcode/build_tree.py?raw";
import type { VizTone } from "../../guides/types";
import { row, rngFor, show } from "../helpers";
import type { PatternProblem, PatternStep } from "../types";
import { type T, fromLevel, layout, preorder, randomTree, showLevel, toLevel } from "./tree";

type Input = { pre: number[]; ino: number[] };

function inorderOf(t: T | null): number[] {
  return t ? [...inorderOf(t.left), t.val, ...inorderOf(t.right)] : [];
}

/** The slow way: find each root in inorder by scanning. */
function slowBuild({ pre, ino }: Input, count: () => void): T | null {
  let i = 0;
  const go = (lo: number, hi: number): T | null => {
    if (lo >= hi) return null;
    const v = pre[i++];
    let mid = lo;
    while (ino[mid] !== v) {
      count();
      mid++;
    }
    count();
    const t: T = { id: "", val: v, left: null, right: null };
    t.left = go(lo, mid);
    t.right = go(mid + 1, hi);
    return t;
  };
  return go(0, ino.length);
}

function run({ pre, ino }: Input): PatternStep[] {
  const steps: PatternStep[] = [];
  const index = new Map(ino.map((v, i) => [v, i]));
  let root: T | null = null;
  let ops = ino.length;
  let preAt = -1;
  let range: [number, number] = [0, ino.length];
  let mid = -1;
  let cur: T | null = null;
  const snap = (stage: string, explanation: string, extra: Partial<PatternStep> = {}) => {
    const inoTone: Record<number, VizTone> = {};
    ino.forEach((_, i) => {
      if (i < range[0] || i >= range[1]) inoTone[i] = "idle";
      else if (i < mid) inoTone[i] = "pointer";
      else if (i > mid) inoTone[i] = "visited";
    });
    if (mid >= 0) inoTone[mid] = "current";
    steps.push({
      stage,
      explanation,
      rows: [
        row("preorder (root first)", pre, Object.fromEntries(pre.map((_, i) => [i, i < preAt ? "idle" : i === preAt ? "current" : undefined]))),
        row("inorder (left subtree, root, right subtree)", ino, mid >= 0 ? inoTone : {}),
      ],
      tree: { title: "built so far", nodes: layout(root, { tone: (t) => (t === cur ? "current" : "found") }) },
      vars: [{ name: "nodes built", value: `${preAt + 1} / ${pre.length}` }],
      ops,
      ...extra,
    });
  };
  snap("start", "Preorder lists a root before its subtrees, so the next unused preorder value is always the root of the subtree being built. Its position in inorder splits that subtree: everything left of it is its left subtree, everything right is its right subtree.");
  let i = 0;
  const go = (lo: number, hi: number, attach: (t: T) => void, depthId: string): void => {
    if (lo >= hi) return;
    const v = pre[i++];
    const m = index.get(v)!;
    ops += 2;
    const t: T = { id: depthId, val: v, left: null, right: null };
    attach(t);
    preAt = i - 1;
    range = [lo, hi];
    mid = m;
    cur = t;
    snap("root", `Next preorder value: ${v}, the root of this part. In inorder it's at position ${m} (one map lookup), with ${m - lo} value${m - lo === 1 ? "" : "s"} on its left (blue: its left subtree) and ${hi - m - 1} on its right (purple).`);
    go(lo, m, (c) => (t.left = c), `${depthId}l`);
    go(m + 1, hi, (c) => (t.right = c), `${depthId}r`);
  };
  go(0, ino.length, (t) => (root = t), "r");
  cur = null;
  mid = -1;
  range = [0, ino.length];
  const ans = showLevel(toLevel(root));
  snap("done", `Every value is placed. The tree is ${ans}.`, { done: true, answer: ans });
  return steps;
}

export const buildTree: PatternProblem<Input> = {
  id: "build-tree",
  title: "Construct Binary Tree from Preorder and Inorder",
  difficulty: "Medium",
  blind75: true,
  slug: "construct-binary-tree-from-preorder-and-inorder-traversal",
  video: "ihj4IQGZ2zc",
  statement: "Given the preorder and inorder traversals of a binary tree with distinct values, rebuild the tree.",
  examples: [
    { label: "[3,9,20,15,7] / [9,3,15,20,7]", input: { pre: [3, 9, 20, 15, 7], ino: [9, 3, 15, 20, 7] } },
    { label: "7 nodes", input: { pre: [1, 2, 4, 5, 3, 6, 7], ino: [4, 2, 5, 1, 6, 3, 7] } },
    { label: "left-leaning", input: { pre: [4, 3, 1, 2], ino: [1, 3, 2, 4] } },
  ],
  random: (seed) => {
    const g = rngFor(seed);
    const t = fromLevel(randomTree(g, g.int(1, 8), 1, 20, true));
    return { pre: preorder(t).map((x) => x.val), ino: inorderOf(t) };
  },
  big: { label: "a left chain of 200", input: () => ({ pre: Array.from({ length: 200 }, (_, i) => i + 1), ino: Array.from({ length: 200 }, (_, i) => 200 - i) }) },
  describe: ({ pre, ino }) => `preorder = ${show(pre)}, inorder = ${show(ino)}`,
  run,
  solve: (input) => showLevel(toLevel(slowBuild(input, () => {}))),
  brute: (input) => {
    let ops = 0;
    const t = slowBuild(input, () => ops++);
    return { answer: showLevel(toLevel(t)), ops };
  },
  bruteIdea: "The same recursion, but finding each root in inorder by scanning the list. For a long chain every scan is long: O(n²). A hash map from value to inorder position makes each lookup O(1).",
  guide: {
    title: "Construct Binary Tree from Preorder and Inorder",
    idea: [
      "Preorder is root, left subtree, right subtree; inorder is left subtree, root, right subtree. The first preorder value is the root; finding it in inorder tells you how many values belong to the left subtree.",
      "Recurse: build the left subtree from the inorder values left of the root, then the right subtree from those to its right, taking roots from preorder in order. A map value → inorder index makes it O(n).",
    ],
    whenToUse: ["Rebuilding a tree from two traversals (postorder + inorder works the same way).", "“Split a range at a pivot and recurse”: the divide-and-conquer shape of quicksort."],
    stages: [
      { id: "start", title: "Map value → inorder index", detail: "", pseudo: "index = {v: i for i, v in enumerate(inorder)}" },
      { id: "root", title: "Next preorder value is the root; split inorder there", detail: "Left part → left subtree, right part → right subtree.", pseudo: "root = TreeNode(next(pre)); mid = index[root.val]" },
      { id: "done", title: "All values placed", detail: "", pseudo: "return go(0, len(inorder))" },
    ],
    legend: [
      { tone: "current", label: "Root being placed" },
      { tone: "pointer", label: "Its left subtree (inorder)" },
      { tone: "visited", label: "Its right subtree (inorder)" },
      { tone: "idle", label: "Outside this part" },
    ],
    complexity: { time: "O(n)", space: "O(n)", why: "Each value is placed once with an O(1) map lookup; the map and recursion use O(n)." },
    pitfalls: ["Build the left subtree before the right one, because that's the order preorder lists them in.", "This needs distinct values; with duplicates the root's inorder position is ambiguous."],
    tryThis: ["Pick “7 nodes” and watch the inorder row split around each root.", "Compare the at-scale counts: the scan costs far more on a chain."],
    python: py,
  },
};
