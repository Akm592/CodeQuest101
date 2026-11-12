// Maximum Depth of Binary Tree (NeetCode 150 · Trees).

import py from "../../guides/python/neetcode/max_depth.py?raw";
import { rngFor } from "../helpers";
import type { PatternProblem, PatternStep } from "../types";
import { type Level, type T, fromLevel, layout, randomTree, showLevel } from "./tree";

type Input = Level;

function run(arr: Input): PatternStep[] {
  const steps: PatternStep[] = [];
  const root = fromLevel(arr);
  const ret = new Map<string, number>();
  let at: string | null = null;
  let ops = 0;
  const snap = (stage: string, explanation: string, extra: Partial<PatternStep> = {}) =>
    steps.push({
      stage,
      explanation,
      rows: [],
      tree: { title: "the number beside a node is what it returns: its depth", nodes: layout(root, { tone: (t) => (t.id === at ? "current" : ret.has(t.id) ? "found" : undefined), note: (t) => (ret.has(t.id) ? `↑${ret.get(t.id)}` : undefined) }) },
      vars: [{ name: "nodes finished", value: String(ret.size) }],
      ops,
      ...extra,
    });
  snap("start", "A tree's depth is 1 (the root) plus the depth of its deeper subtree. An empty tree has depth 0. Each node asks its children first, then answers.");
  const go = (t: T | null): number => {
    if (!t) return 0;
    const l = go(t.left);
    const r = go(t.right);
    const d = 1 + Math.max(l, r);
    ret.set(t.id, d);
    at = t.id;
    ops++;
    snap("return", t.left || t.right ? `${t.val}: left subtree depth ${l}, right ${r}. Return 1 + max(${l}, ${r}) = ${d}.` : `${t.val} is a leaf: both children are empty (depth 0), so it returns 1.`);
    return d;
  };
  const d = go(root);
  at = null;
  snap("done", root ? `The root returns ${d}: the tree is ${d} level${d === 1 ? "" : "s"} deep.` : "The tree is empty: depth 0.", { done: true, answer: String(d) });
  return steps;
}

export const maxDepth: PatternProblem<Input> = {
  id: "max-depth",
  title: "Maximum Depth of Binary Tree",
  difficulty: "Easy",
  blind75: true,
  slug: "maximum-depth-of-binary-tree",
  video: "hTM3phVI6YQ",
  statement: "Return the number of nodes on the longest path from the root down to a leaf.",
  examples: [
    { label: "[3,9,20,null,null,15,7]", input: [3, 9, 20, null, null, 15, 7] },
    { label: "[1,null,2]", input: [1, null, 2] },
    { label: "deeper on the left", input: [1, 2, 3, 4, null, null, null, 5, 6] },
  ],
  random: (seed) => {
    const g = rngFor(seed);
    return randomTree(g, g.int(1, 9), 1, 9);
  },
  describe: (arr) => `root = ${showLevel(arr)}`,
  run,
  solve: (arr) => {
    // Count levels with a breadth-first pass over the level-order form.
    const root = fromLevel(arr);
    let level = root ? [root] : [];
    let d = 0;
    while (level.length) {
      d++;
      level = level.flatMap((t) => [t.left, t.right].filter((c): c is T => !!c));
    }
    return d;
  },
  brute: null,
  bruteIdea: "Listing every root-to-leaf path and taking the longest also works, but the recursion already visits each node once: O(n) is the best possible.",
  guide: {
    title: "Maximum Depth of Binary Tree",
    idea: [
      "Ask the question of a smaller tree. The depth of a tree is 1 for its root plus the bigger of its two subtrees' depths, and an empty tree has depth 0.",
      "That's a post-order DFS: a node can only answer after both children have. The numbers flow up from the leaves to the root. Counting levels with BFS gives the same answer.",
    ],
    whenToUse: ["“Combine the answers of the two subtrees”: return a value from each recursive call (bottom-up).", "Diameter and Balanced Binary Tree reuse this exact height function."],
    stages: [
      { id: "start", title: "Recurse to the leaves", detail: "Empty subtree → 0.", pseudo: "if not root: return 0" },
      { id: "return", title: "Return 1 + max(left, right)", detail: "After both children have answered.", pseudo: "return 1 + max(depth(root.left), depth(root.right))" },
      { id: "done", title: "The root's answer", detail: "", pseudo: "" },
    ],
    legend: [
      { tone: "current", label: "Node answering" },
      { tone: "found", label: "Answered (↑ depth)" },
    ],
    complexity: { time: "O(n)", space: "O(h)", why: "One visit per node; recursion as deep as the tree." },
    pitfalls: ["Depth counts nodes here (a single node has depth 1), not edges.", "A very deep tree can overflow the recursion stack; BFS avoids that."],
    tryThis: ["Watch the numbers appear from the bottom up.", "Pick “deeper on the left”: the right child 3 answers 1, but its parent takes the bigger side."],
    python: py,
  },
};
