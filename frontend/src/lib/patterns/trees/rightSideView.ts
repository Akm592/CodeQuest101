// Binary Tree Right Side View (NeetCode 150 · Trees).

import py from "../../guides/python/neetcode/right_side_view.py?raw";
import { row, rngFor, show } from "../helpers";
import type { PatternProblem, PatternStep } from "../types";
import { bfs } from "./levelOrder";
import { type Level, type T, fromLevel, layout, randomTree, showLevel } from "./tree";

type Input = Level;

function run(arr: Input): PatternStep[] {
  const steps: PatternStep[] = [];
  const root = fromLevel(arr);
  const seen = new Set<string>();
  const done = new Set<string>();
  let cur = new Set<string>();
  let queue: T[] = root ? [root] : [];
  const out: number[] = [];
  let ops = 0;
  const snap = (stage: string, explanation: string, extra: Partial<PatternStep> = {}) =>
    steps.push({
      stage,
      explanation,
      rows: [row("queue (front → back)", queue.map((t) => t.val), Object.fromEntries(queue.map((_, i) => [i, "pointer"])))],
      tree: { nodes: layout(root, { tone: (t) => (seen.has(t.id) ? "found" : cur.has(t.id) ? "current" : done.has(t.id) ? "idle" : undefined), tag: (t) => (seen.has(t.id) ? "seen" : undefined) }) },
      vars: [{ name: "right side view", value: show(out), tone: "found" }],
      ops,
      ...extra,
    });
  snap("start", "Standing to the right of the tree, you see one node per level: the rightmost one. So do a level-by-level BFS and keep the last node of each level.");
  bfs(arr, (level, next) => {
    cur = new Set(level.map((t) => t.id));
    const last = level[level.length - 1];
    seen.add(last.id);
    out.push(last.val);
    ops += level.length;
    queue = next;
    snap("level", `This level is ${level.map((t) => t.val).join(", ")}. The last one, ${last.val}, is what you see from the right.${level.length > 1 ? " The others are hidden behind it." : ""}`);
    for (const t of level) done.add(t.id);
  });
  cur = new Set();
  snap("done", `From the right you see ${show(out)}.`, { done: true, answer: show(out) });
  return steps;
}

export const rightSideView: PatternProblem<Input> = {
  id: "right-side-view",
  title: "Binary Tree Right Side View",
  difficulty: "Medium",
  blind75: false,
  slug: "binary-tree-right-side-view",
  video: "d4zLyf32e3I",
  statement: "Imagine standing to the right of the tree. Return the values you can see, from top to bottom.",
  examples: [
    { label: "[1,2,3,null,5,null,4]", input: [1, 2, 3, null, 5, null, 4] },
    { label: "a left node shows", input: [1, 2, 3, 4] },
    { label: "zigzag", input: [1, 2, 3, null, 4, null, null, 5] },
  ],
  random: (seed) => {
    const g = rngFor(seed);
    return randomTree(g, g.int(1, 10), 1, 9);
  },
  describe: (arr) => `root = ${showLevel(arr)}`,
  run,
  solve: (arr) => {
    // DFS visiting right before left: the first node seen at each depth is visible.
    const out: number[] = [];
    const go = (t: T | null, d: number) => {
      if (!t) return;
      if (out.length === d) out.push(t.val);
      go(t.right, d + 1);
      go(t.left, d + 1);
    };
    go(fromLevel(arr), 0);
    return show(out);
  },
  brute: null,
  bruteIdea: "A DFS that visits right children first and records the first node at each depth also works in O(n). Every node may matter, so O(n) is the best possible.",
  guide: {
    title: "Binary Tree Right Side View",
    idea: [
      "“What you see from the right” is the last node of each level, so this is Level Order Traversal keeping only each level's last value.",
      "The catch: the visible node isn't always a right child. If a level's only node is on the left side of the tree, that's the one you see (“a left node shows”).",
    ],
    whenToUse: ["“First/last per level”, “nodes visible from one side”: BFS by levels.", "Left side view is the same with the first node instead."],
    stages: [
      { id: "start", title: "Queue = [root]", detail: "", pseudo: "queue = deque([root])" },
      { id: "level", title: "Take a level, keep its last node", detail: "", pseudo: "for _ in range(len(queue)): node = queue.popleft() ...; out.append(node.val)" },
      { id: "done", title: "Queue empty → done", detail: "", pseudo: "return out" },
    ],
    legend: [
      { tone: "current", label: "Level being taken" },
      { tone: "found", label: "Visible from the right" },
      { tone: "pointer", label: "In the queue" },
    ],
    complexity: { time: "O(n)", space: "O(w)", why: "Every node is visited once; the queue holds one level." },
    pitfalls: ["Following only right children misses levels where the deepest nodes are on the left.", "Take the last node of the level, after the whole level is processed."],
    tryThis: ["Pick “a left node shows”: 4 is a left child but still visible.", "Pick “zigzag”."],
    python: py,
  },
};
