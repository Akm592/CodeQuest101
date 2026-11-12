// Binary Tree Level Order Traversal (NeetCode 150 · Trees).

import py from "../../guides/python/neetcode/level_order.py?raw";
import { row, rngFor } from "../helpers";
import type { PatternProblem, PatternStep } from "../types";
import { type Level, type T, fromLevel, layout, randomTree, showLevel } from "./tree";

type Input = Level;
const showLevels = (ls: number[][]) => `[${ls.map((l) => `[${l.join(", ")}]`).join(", ")}]`;

export function bfs(arr: Level, onLevel?: (level: T[], queueAfter: T[]) => void): number[][] {
  const root = fromLevel(arr);
  const out: number[][] = [];
  let queue: T[] = root ? [root] : [];
  while (queue.length) {
    const level = queue;
    queue = level.flatMap((t) => [t.left, t.right].filter((c): c is T => !!c));
    out.push(level.map((t) => t.val));
    onLevel?.(level, queue);
  }
  return out;
}

function run(arr: Input): PatternStep[] {
  const steps: PatternStep[] = [];
  const root = fromLevel(arr);
  const done = new Set<string>();
  let cur = new Set<string>();
  let queue: T[] = root ? [root] : [];
  const out: number[][] = [];
  let ops = 0;
  const snap = (stage: string, explanation: string, extra: Partial<PatternStep> = {}) =>
    steps.push({
      stage,
      explanation,
      rows: [row("queue (front → back)", queue.map((t) => t.val), Object.fromEntries(queue.map((_, i) => [i, "pointer"])))],
      tree: { nodes: layout(root, { tone: (t) => (cur.has(t.id) ? "current" : done.has(t.id) ? "found" : queue.some((x) => x.id === t.id) ? "pointer" : undefined) }) },
      vars: [{ name: "result", value: showLevels(out), tone: "found" }],
      ops,
      ...extra,
    });
  snap("start", "Breadth-first search: a queue holds the nodes of the next level, in left-to-right order. It starts with just the root.");
  bfs(arr, (level, next) => {
    cur = new Set(level.map((t) => t.id));
    out.push(level.map((t) => t.val));
    ops += level.length;
    queue = next;
    snap("level", `The queue held ${level.length} node${level.length === 1 ? "" : "s"}: that's one whole level. Take them all (${level.map((t) => t.val).join(", ")}) as the next list, and add their children to the queue.`);
    for (const t of level) done.add(t.id);
  });
  cur = new Set();
  snap("done", `The queue is empty. Levels: ${showLevels(out)}.`, { done: true, answer: showLevels(out) });
  return steps;
}

export const levelOrder: PatternProblem<Input> = {
  id: "level-order",
  title: "Binary Tree Level Order Traversal",
  difficulty: "Medium",
  blind75: true,
  slug: "binary-tree-level-order-traversal",
  video: "6ZnyEApgFYg",
  statement: "Return the node values level by level: a list for the root's level, then the next level left to right, and so on.",
  examples: [
    { label: "[3,9,20,null,null,15,7]", input: [3, 9, 20, null, null, 15, 7] },
    { label: "4 levels", input: [1, 2, 3, 4, null, 5, 6, null, 7] },
    { label: "[1]", input: [1] },
  ],
  random: (seed) => {
    const g = rngFor(seed);
    return randomTree(g, g.int(1, 10), 1, 9);
  },
  describe: (arr) => `root = ${showLevel(arr)}`,
  run,
  solve: (arr) => {
    // DFS, adding each value to the list for its depth.
    const out: number[][] = [];
    const go = (t: T | null, d: number) => {
      if (!t) return;
      (out[d] ??= []).push(t.val);
      go(t.left, d + 1);
      go(t.right, d + 1);
    };
    go(fromLevel(arr), 0);
    return showLevels(out);
  },
  brute: null,
  bruteIdea: "A DFS that files each value under its depth gives the same lists, also in O(n). BFS is the natural fit because it already visits the tree level by level.",
  guide: {
    title: "Binary Tree Level Order Traversal",
    idea: [
      "Breadth-first search visits nodes in order of distance from the root, using a queue: take from the front, add children to the back.",
      "To split the output into levels, note the queue's length at the start of a round: exactly that many nodes are on the current level. Take that many, collect their values, and their children form the next level.",
    ],
    whenToUse: ["Anything “by level” or “nearest first”: BFS with a queue.", "Right Side View, zigzag order and minimum depth are small changes to this loop."],
    stages: [
      { id: "start", title: "Queue = [root]", detail: "", pseudo: "queue = deque([root])" },
      { id: "level", title: "Take one whole level, queue its children", detail: "for _ in range(len(queue)).", pseudo: "level = [queue.popleft() for _ in range(len(queue))]" },
      { id: "done", title: "Queue empty → done", detail: "", pseudo: "return out" },
    ],
    legend: [
      { tone: "current", label: "Level being taken" },
      { tone: "pointer", label: "In the queue (next level)" },
      { tone: "found", label: "Done" },
    ],
    complexity: { time: "O(n)", space: "O(w)", why: "Each node enters and leaves the queue once; the queue holds at most one level (w = widest level)." },
    pitfalls: ["Read len(queue) once at the start of the level; it changes as children are added.", "An empty tree gives an empty list."],
    tryThis: ["Pick “4 levels”: the queue shows the next level while the current one is taken.", "Compare with the DFS version in solve: same lists, different order of visiting."],
    python: py,
  },
};
