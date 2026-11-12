// Same Tree (NeetCode 150 · Trees).

import py from "../../guides/python/neetcode/same_tree.py?raw";
import { rngFor } from "../helpers";
import type { PatternProblem, PatternStep } from "../types";
import { type Level, type T, fromLevel, layout, randomTree, showLevel, size, toLevel } from "./tree";

type Input = { p: Level; q: Level };

function run({ p, q }: Input): PatternStep[] {
  const steps: PatternStep[] = [];
  const P = fromLevel(p, "p");
  const Q = fromLevel(q, "q");
  const matched = new Set<string>();
  const bad = new Set<string>();
  const now = new Set<string>();
  let ops = 0;
  const snap = (stage: string, explanation: string, extra: Partial<PatternStep> = {}) => {
    const tone = (t: T) => (bad.has(t.id) ? ("swap" as const) : now.has(t.id) ? ("current" as const) : matched.has(t.id) ? ("found" as const) : undefined);
    const gap = Math.max(1, size(P));
    steps.push({
      stage,
      explanation,
      rows: [],
      tree: { nodes: [...layout(P, { tone }), ...layout(Q, { tone, dx: gap + 1 })], labels: [{ x: 0, text: "p" }, { x: gap + 1, text: "q" }] },
      vars: [{ name: "pairs matched", value: String(matched.size / 2) }],
      ops,
      ...extra,
    });
  };
  snap("start", "Walk both trees together, comparing nodes in the same position. Two empty spots match; one empty and one not, or different values, means the trees differ.");
  const go = (a: T | null, b: T | null): boolean => {
    ops++;
    if (!a && !b) return true;
    now.clear();
    if (!a || !b || a.val !== b.val) {
      for (const t of [a, b]) if (t) bad.add(t.id);
      snap("mismatch", !a || !b ? `${a ? `p has ${a.val}` : `q has ${b!.val}`} here, but the other tree has nothing in this position. Not the same.` : `p has ${a.val} but q has ${b.val} in the same position. Not the same.`, { done: true, answer: "false" });
      return false;
    }
    now.add(a.id).add(b.id);
    snap("match", `Both have ${a.val} here. Now compare their left subtrees, then their right subtrees.`);
    matched.add(a.id).add(b.id);
    return go(a.left, b.left) && go(a.right, b.right);
  };
  if (go(P, Q)) {
    now.clear();
    snap("same", "Every position matched: same shape, same values. The trees are the same.", { done: true, answer: "true" });
  }
  return steps;
}

export const sameTree: PatternProblem<Input> = {
  id: "same-tree",
  title: "Same Tree",
  difficulty: "Easy",
  blind75: true,
  slug: "same-tree",
  video: "vRbbcKXCxOw",
  statement: "Given two binary trees, return true if they have the same shape and the same value in every position.",
  examples: [
    { label: "same", input: { p: [1, 2, 3, 4], q: [1, 2, 3, 4] } },
    { label: "[1,2] vs [1,null,2]", input: { p: [1, 2], q: [1, null, 2] } },
    { label: "one value differs", input: { p: [5, 3, 8, 1, 4], q: [5, 3, 8, 1, 6] } },
  ],
  random: (seed) => {
    const g = rngFor(seed);
    const p = randomTree(g, g.int(1, 7), 1, 5);
    const r = g.r();
    if (r < 0.5) return { p, q: [...p] };
    if (r < 0.75) {
      const q = [...p];
      const i = g.pick(q.map((v, k) => (v === null ? -1 : k)).filter((k) => k >= 0));
      q[i] = (q[i]! % 5) + 1;
      return { p, q };
    }
    return { p, q: randomTree(g, g.int(1, 7), 1, 5) };
  },
  describe: ({ p, q }) => `p = ${showLevel(p)}, q = ${showLevel(q)}`,
  run,
  solve: ({ p, q }) => showLevel(toLevel(fromLevel(p))) === showLevel(toLevel(fromLevel(q))),
  brute: null,
  bruteIdea: "Writing both trees out (with markers for empty spots) and comparing the strings also works in O(n), but uses extra memory and doesn't stop at the first difference.",
  guide: {
    title: "Same Tree",
    idea: [
      "Two trees are the same when their roots match and their left subtrees are the same and their right subtrees are the same. That sentence is the code.",
      "The base cases do the work: both empty → same; only one empty, or different values → different. Stop at the first difference.",
    ],
    whenToUse: ["Comparing two trees position by position: recurse on both at once.", "It's the helper inside Subtree of Another Tree."],
    stages: [
      { id: "start", title: "Compare the roots", detail: "", pseudo: "def same(p, q):" },
      { id: "match", title: "Values match → compare children", detail: "", pseudo: "return same(p.left, q.left) and same(p.right, q.right)" },
      { id: "mismatch", title: "Shape or value differs → false", detail: "", pseudo: "if not p or not q or p.val != q.val: return False" },
      { id: "same", title: "Everything matched → true", detail: "", pseudo: "if not p and not q: return True" },
    ],
    legend: [
      { tone: "current", label: "Pair being compared" },
      { tone: "found", label: "Matched" },
      { tone: "swap", label: "The difference" },
    ],
    complexity: { time: "O(n)", space: "O(h)", why: "Each pair of nodes is compared at most once." },
    pitfalls: ["Check “both None” before “either None”.", "Same values in a different shape ([1,2] vs [1,null,2]) are different trees."],
    tryThis: ["Pick “[1,2] vs [1,null,2]”: same values, different shape.", "Pick “one value differs”."],
    python: py,
  },
};
