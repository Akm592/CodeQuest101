// Subtree of Another Tree (NeetCode 150 · Trees).

import py from "../../guides/python/neetcode/subtree.py?raw";
import { rngFor } from "../helpers";
import type { PatternProblem, PatternStep } from "../types";
import { type Level, type T, fromLevel, layout, preorder, randomTree, showLevel, size, toLevel } from "./tree";

type Input = { root: Level; sub: Level };

function run({ root, sub }: Input): PatternStep[] {
  const steps: PatternStep[] = [];
  const R = fromLevel(root, "a");
  const S = fromLevel(sub, "b");
  const tried = new Set<string>();
  let cmp = new Map<string, "found" | "swap">();
  let at: string | null = null;
  let ops = 0;
  const snap = (stage: string, explanation: string, extra: Partial<PatternStep> = {}) => {
    const gap = Math.max(1, size(R));
    steps.push({
      stage,
      explanation,
      rows: [],
      tree: {
        nodes: [
          ...layout(R, { tone: (t) => cmp.get(t.id) ?? (t.id === at ? "current" : tried.has(t.id) ? "idle" : undefined), tag: (t) => (t.id === at ? "try" : undefined) }),
          ...layout(S, { dx: gap + 1, tone: (t) => cmp.get(t.id) }),
        ],
        labels: [{ x: 0, text: "root" }, { x: gap + 1, text: "subRoot" }],
      },
      vars: [{ name: "starting points tried", value: String(tried.size) }],
      ops,
      ...extra,
    });
  };
  // Same Tree, recording which pairs matched and where it failed.
  const same = (a: T | null, b: T | null): boolean => {
    ops++;
    if (!a && !b) return true;
    if (!a || !b || a.val !== b.val) {
      for (const t of [a, b]) if (t) cmp.set(t.id, "swap");
      return false;
    }
    cmp.set(a.id, "found").set(b.id, "found");
    return same(a.left, b.left) && same(a.right, b.right);
  };
  snap("start", "Try every node of root as a starting point, and run Same Tree from there against subRoot. If any start matches completely, subRoot is a subtree.");
  for (const t of preorder(R)) {
    at = t.id;
    cmp = new Map();
    const ok = same(t, S);
    if (ok) {
      snap("found", `Starting at ${t.val}, every node matches subRoot (green). Found it.`, { done: true, answer: "true" });
      return steps;
    }
    snap("try", `Start at ${t.val}: ${[...cmp.values()].includes("found") ? "some nodes match (green), but then a difference appears (red)." : t.val !== S?.val ? `${t.val} isn't ${S?.val}, so it fails straight away.` : "the shapes differ."} Try the next node.`);
    tried.add(t.id);
  }
  at = null;
  cmp = new Map();
  snap("none", "No starting point matched, so subRoot isn't a subtree of root.", { done: true, answer: "false" });
  return steps;
}

export const subtree: PatternProblem<Input> = {
  id: "subtree",
  title: "Subtree of Another Tree",
  difficulty: "Easy",
  blind75: true,
  slug: "subtree-of-another-tree",
  video: "E36O5SWp-LE",
  statement: "Return true if some node of root has a subtree (that node and everything below it) exactly equal to subRoot.",
  examples: [
    { label: "yes", input: { root: [3, 4, 5, 1, 2], sub: [4, 1, 2] } },
    { label: "almost (extra node)", input: { root: [3, 4, 5, 1, 2, null, null, null, null, 0], sub: [4, 1, 2] } },
    { label: "deeper match", input: { root: [1, 2, 3, null, null, 4, 5, 6], sub: [4, 6] } },
  ],
  random: (seed) => {
    const g = rngFor(seed);
    const root = randomTree(g, g.int(2, 8), 1, 4);
    if (g.r() < 0.5) {
      const nodes = preorder(fromLevel(root));
      return { root, sub: toLevel(g.pick(nodes)) };
    }
    return { root, sub: randomTree(g, g.int(1, 3), 1, 4) };
  },
  describe: ({ root, sub }) => `root = ${showLevel(root)}, subRoot = ${showLevel(sub)}`,
  run,
  solve: ({ root, sub }) => preorder(fromLevel(root)).some((t) => showLevel(toLevel(t)) === showLevel(sub)),
  brute: null,
  bruteIdea: "This is already the straightforward way: O(m·n) in the worst case. A faster method writes both trees out as strings and searches with KMP or hashing in O(m + n), but it's rarely expected in interviews.",
  guide: {
    title: "Subtree of Another Tree",
    idea: [
      "Break it into a problem you've solved: “is the subtree starting here the same as subRoot?” is Same Tree. Ask it at every node of root.",
      "Recursively: isSubtree(root) = sameTree(root, sub) or isSubtree(root.left) or isSubtree(root.right). Most starts fail at the first comparison, so it's usually fast.",
    ],
    whenToUse: ["“Does a pattern tree appear anywhere?”: run a matcher from every node.", "Reusing a smaller solution as a helper is a common move in tree problems."],
    stages: [
      { id: "start", title: "Try each node of root", detail: "", pseudo: "def is_subtree(root, sub):" },
      { id: "try", title: "Same Tree from here fails → next node", detail: "", pseudo: "is_same_tree(root, sub) or is_subtree(root.left, sub) or ..." },
      { id: "found", title: "A full match → true", detail: "", pseudo: "return True" },
      { id: "none", title: "No start matched → false", detail: "", pseudo: "return False" },
    ],
    legend: [
      { tone: "current", label: "Starting point being tried" },
      { tone: "found", label: "Matched this try" },
      { tone: "swap", label: "Where this try failed" },
      { tone: "idle", label: "Already tried" },
    ],
    complexity: { time: "O(m·n)", space: "O(h)", why: "Up to m starting points, each comparing up to n nodes." },
    pitfalls: ["The match must be the whole subtree: “almost (extra node)” fails because 2 has a child 0 that subRoot doesn't have.", "An empty subRoot is a subtree of anything."],
    tryThis: ["Pick “almost (extra node)”: the try at 4 gets far, then fails.", "Pick “deeper match”."],
    python: py,
  },
};
