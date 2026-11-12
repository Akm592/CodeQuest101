// Diameter of Binary Tree (NeetCode 150 · Trees).

import py from "../../guides/python/neetcode/diameter_tree.py?raw";
import { rngFor } from "../helpers";
import type { PatternProblem, PatternStep } from "../types";
import { type Level, type T, deepTree, fromLevel, height, layout, preorder, randomTree, showLevel } from "./tree";

type Input = Level;

function run(arr: Input): PatternStep[] {
  const steps: PatternStep[] = [];
  const root = fromLevel(arr);
  const h = new Map<string, number>();
  let best = 0;
  let bestAt: T | null = null;
  let at: string | null = null;
  let path = new Set<string>();
  let ops = 0;
  const snap = (stage: string, explanation: string, extra: Partial<PatternStep> = {}) =>
    steps.push({
      stage,
      explanation,
      rows: [],
      tree: {
        title: "beside each node: its height (nodes on the longest path down)",
        nodes: layout(root, {
          tone: (t) => (path.has(t.id) ? "found" : t.id === at ? "current" : h.has(t.id) ? "visited" : undefined),
          note: (t) => (h.has(t.id) ? `h=${h.get(t.id)}` : undefined),
          edgeTone: (t) => (path.has(t.id) && t.id.length > 1 && path.has(t.id.slice(0, -1)) ? "found" : undefined),
        }),
      },
      vars: [{ name: "best diameter (edges)", value: String(best), tone: "found" }],
      ops,
      ...extra,
    });
  const deepest = (t: T | null): string[] => {
    if (!t) return [];
    const l = h.get(t.left?.id ?? "") ?? 0;
    const r = h.get(t.right?.id ?? "") ?? 0;
    return [t.id, ...deepest(l >= r ? t.left : t.right)];
  };
  snap("start", "The longest path bends at some node: down that node's left subtree, and down its right one. Its length (in edges) is height(left) + height(right). So compute every height once, bottom-up, and check that sum at each node.");
  const go = (t: T | null): number => {
    if (!t) return 0;
    const l = go(t.left);
    const r = go(t.right);
    ops++;
    h.set(t.id, 1 + Math.max(l, r));
    at = t.id;
    const through = l + r;
    const improved = through > best;
    if (improved) {
      best = through;
      bestAt = t;
    }
    if (improved) path = new Set([t.id, ...deepest(t.left), ...deepest(t.right)]);
    snap("return", `${t.val}: left height ${l}, right height ${r}. The longest path bending here has ${l} + ${r} = ${through} edges.${improved ? " New best (green)." : ` Not better than ${best}.`} Return height ${1 + Math.max(l, r)} to the parent.`);
    return 1 + Math.max(l, r);
  };
  go(root);
  at = null;
  const b = bestAt as T | null;
  path = b ? new Set([b.id, ...deepest(b.left), ...deepest(b.right)]) : new Set();
  snap("done", `The diameter is ${best} edge${best === 1 ? "" : "s"}${b ? `, along the green path, which bends at ${b.val}` : ""}. It doesn't have to pass through the root.`, { done: true, answer: String(best) });
  return steps;
}

export const diameterTree: PatternProblem<Input> = {
  id: "diameter-tree",
  title: "Diameter of Binary Tree",
  difficulty: "Easy",
  blind75: false,
  slug: "diameter-of-binary-tree",
  video: "bkxqA8Rfv04",
  statement: "Return the number of edges on the longest path between any two nodes. The path doesn't have to pass through the root.",
  examples: [
    { label: "[1,2,3,4,5]", input: [1, 2, 3, 4, 5] },
    { label: "not through the root", input: [1, 2, null, 3, 4, 5, null, null, 6, 7, null, null, 8] },
    { label: "[1,2]", input: [1, 2] },
  ],
  random: (seed) => {
    const g = rngFor(seed);
    return randomTree(g, g.int(1, 10), 1, 9);
  },
  big: { label: "a deep tree of 200 nodes", input: () => deepTree(200) },
  describe: (arr) => `root = ${showLevel(arr)}`,
  run,
  solve: (arr) => Math.max(0, ...preorder(fromLevel(arr)).map((t) => height(t.left) + height(t.right))),
  brute: (arr) => {
    // Recompute both subtree heights from scratch at every node.
    let ops = 0;
    const hgt = (t: T | null): number => (t ? (ops++, 1 + Math.max(hgt(t.left), hgt(t.right))) : 0);
    const best = Math.max(0, ...preorder(fromLevel(arr)).map((t) => hgt(t.left) + hgt(t.right)));
    return { answer: best, ops };
  },
  bruteIdea: "At every node, measure the heights of both subtrees with a fresh DFS. Nodes deep in the tree get measured again and again: O(n²) for a long, thin tree.",
  guide: {
    title: "Diameter of Binary Tree",
    idea: [
      "Any path has one highest node where it bends. Through that node, the longest path goes as deep as possible on the left and on the right: height(left) + height(right) edges.",
      "Heights come bottom-up from the same DFS as Maximum Depth. While each node returns its height, also check left + right against the best so far. One pass, O(n).",
    ],
    whenToUse: ["The answer is about a path that can bend anywhere: return one thing up (a height) but record another (the best bend) along the way.", "Binary Tree Maximum Path Sum is the same idea with sums instead of lengths."],
    stages: [
      { id: "start", title: "DFS to the leaves", detail: "", pseudo: "def height(node): if not node: return 0" },
      { id: "return", title: "Check left + right, return 1 + max", detail: "", pseudo: "best = max(best, left + right); return 1 + max(left, right)" },
      { id: "done", title: "best is the diameter", detail: "", pseudo: "return best" },
    ],
    legend: [
      { tone: "current", label: "Node answering" },
      { tone: "visited", label: "Height known" },
      { tone: "found", label: "Longest path so far" },
    ],
    complexity: { time: "O(n)", space: "O(h)", why: "Each height is computed once." },
    pitfalls: ["The diameter counts edges, not nodes.", "Don't assume the path goes through the root: “not through the root” shows why."],
    tryThis: ["Pick “not through the root”: the best bend is at 2, not 1.", "Compare the brute force on the deep tree: re-measuring heights costs far more."],
    python: py,
  },
};
