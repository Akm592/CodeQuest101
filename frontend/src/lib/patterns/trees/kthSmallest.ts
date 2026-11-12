// Kth Smallest Element in a BST (NeetCode 150 · Trees).

import py from "../../guides/python/neetcode/kth_smallest.py?raw";
import { row, rngFor } from "../helpers";
import type { PatternProblem, PatternStep } from "../types";
import { type Level, type T, fromLevel, insertAll, layout, preorder, randomBST, showLevel, toLevel } from "./tree";

type Input = { tree: Level; k: number };

function run({ tree, k }: Input): PatternStep[] {
  const steps: PatternStep[] = [];
  const root = fromLevel(tree);
  const stack: T[] = [];
  const visited: T[] = [];
  let at: T | null = null;
  let ops = 0;
  const snap = (stage: string, explanation: string, extra: Partial<PatternStep> = {}) =>
    steps.push({
      stage,
      explanation,
      rows: [
        row("stack (bottom → top)", stack.map((t) => t.val), stack.length ? { [stack.length - 1]: "pointer" } : {}),
        row("visited in order", visited.map((t) => t.val), visited.length ? { [visited.length - 1]: visited.length === k ? "found" : "current" } : {}),
      ],
      tree: { nodes: layout(root, { tone: (t) => (visited.length === k && t === visited[k - 1] ? "found" : t === at ? "current" : visited.includes(t) ? "idle" : stack.includes(t) ? "pointer" : undefined), note: (t) => (visited.includes(t) ? `#${visited.indexOf(t) + 1}` : undefined) }) },
      vars: [
        { name: "k", value: String(k) },
        { name: "visited so far", value: String(visited.length) },
      ],
      ops,
      ...extra,
    });
  snap("start", `An in-order traversal (left, node, right) visits a BST from smallest to largest. So do one, iteratively with a stack, and stop at the ${k}${k === 1 ? "st" : k === 2 ? "nd" : k === 3 ? "rd" : "th"} visit.`);
  let node: T | null = root;
  while (stack.length || node) {
    const pushed: number[] = [];
    while (node) {
      stack.push(node);
      pushed.push(node.val);
      ops++;
      node = node.left;
    }
    if (pushed.length) snap("push", `Go as far left as possible, pushing ${pushed.join(", ")}. Everything on the stack is waiting for its left side to be finished.`);
    at = stack.pop()!;
    visited.push(at);
    ops++;
    if (visited.length === k) {
      snap("found", `Pop ${at.val}: visit #${k}. It's the ${k}${k === 1 ? "st" : k === 2 ? "nd" : k === 3 ? "rd" : "th"} smallest, so stop here without visiting the rest.`, { done: true, answer: String(at.val) });
      return steps;
    }
    snap("pop", `Pop ${at.val}: nothing smaller is left unvisited, so it's visit #${visited.length}. Then move to its right subtree${at.right ? ` (${at.right.val})` : " (empty)"}.`);
    node = at.right;
  }
  return steps;
}

export const kthSmallest: PatternProblem<Input> = {
  id: "kth-smallest",
  title: "Kth Smallest Element in a BST",
  difficulty: "Medium",
  blind75: true,
  slug: "kth-smallest-element-in-a-bst",
  video: "5LUXSvjmGCw",
  statement: "Given a binary search tree and a number k, return the k-th smallest value in it (k = 1 is the smallest).",
  examples: [
    { label: "[3,1,4,null,2], k=1", input: { tree: [3, 1, 4, null, 2], k: 1 } },
    { label: "[5,3,6,2,4,null,null,1], k=3", input: { tree: [5, 3, 6, 2, 4, null, null, 1], k: 3 } },
    { label: "k = 5 of 7", input: { tree: [8, 4, 12, 2, 6, 10, 14], k: 5 } },
  ],
  random: (seed) => {
    const g = rngFor(seed);
    const n = g.int(2, 9);
    return { tree: randomBST(g, n, 1, 20), k: g.int(1, n) };
  },
  big: { label: "a BST of 200 nodes, k = 3", input: () => ({ tree: toLevel(insertAll(Array.from({ length: 200 }, (_, i) => ((i * 89) % 200) + 1))), k: 3 }) },
  describe: ({ tree, k }) => `root = ${showLevel(tree)}, k = ${k}`,
  run,
  solve: ({ tree, k }) => preorder(fromLevel(tree)).map((t) => t.val).sort((a, b) => a - b)[k - 1],
  brute: ({ tree, k }) => {
    // Collect every value, sort, and index.
    const vals = preorder(fromLevel(tree)).map((t) => t.val);
    const n = vals.length;
    return { answer: vals.sort((a, b) => a - b)[k - 1], ops: n + Math.ceil(n * Math.log2(Math.max(2, n))) };
  },
  bruteIdea: "Collect every value, sort them and pick the k-th: O(n log n), and it ignores that the tree is already ordered. The in-order walk stops after about h + k nodes.",
  guide: {
    title: "Kth Smallest Element in a BST",
    idea: [
      "In a BST, an in-order traversal (left subtree, node, right subtree) produces the values in sorted order. So the k-th node it visits is the answer.",
      "Doing it iteratively lets you stop early: push nodes while going left; pop one to visit it; then go to its right child. Count the visits and stop at k.",
    ],
    whenToUse: ["Any “sorted order” question on a BST: in-order traversal.", "The iterative version with a stack is worth knowing because it can stop part-way (BST iterators use it)."],
    stages: [
      { id: "start", title: "Empty stack, node = root", detail: "", pseudo: "stack, node = [], root" },
      { id: "push", title: "Go left, pushing every node", detail: "", pseudo: "while node: stack.append(node); node = node.left" },
      { id: "pop", title: "Pop and visit, then go right", detail: "", pseudo: "node = stack.pop(); k -= 1; node = node.right" },
      { id: "found", title: "k-th visit → answer", detail: "", pseudo: "if k == 0: return node.val" },
    ],
    legend: [
      { tone: "pointer", label: "On the stack" },
      { tone: "current", label: "Just visited" },
      { tone: "idle", label: "Visited earlier" },
      { tone: "found", label: "The k-th smallest" },
    ],
    complexity: { time: "O(h + k)", space: "O(h)", why: "It goes down one path (h) and then visits k nodes; the stack holds at most one path." },
    pitfalls: ["k is 1-based: k = 1 is the smallest.", "After visiting a node, move to its right child, not back to its parent."],
    tryThis: ["Pick “k = 5 of 7”: count the #numbers as they appear.", "On the big tree with k = 3, only a handful of nodes are touched."],
    python: py,
  },
};
