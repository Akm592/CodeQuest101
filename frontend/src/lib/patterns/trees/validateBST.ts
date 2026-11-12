// Validate Binary Search Tree (NeetCode 150 · Trees).

import py from "../../guides/python/neetcode/validate_bst.py?raw";
import { rngFor } from "../helpers";
import type { PatternProblem, PatternStep } from "../types";
import { type Level, type T, fromLevel, insertAll, layout, preorder, randomBST, showLevel, toLevel } from "./tree";

type Input = Level;
const fmt = (x: number) => (x === Infinity ? "∞" : x === -Infinity ? "−∞" : String(x));

function run(arr: Input): PatternStep[] {
  const steps: PatternStep[] = [];
  const root = fromLevel(arr);
  const bounds = new Map<string, [number, number]>();
  const ok = new Set<string>();
  let at: string | null = null;
  let bad: string | null = null;
  let ops = 0;
  const snap = (stage: string, explanation: string, extra: Partial<PatternStep> = {}) =>
    steps.push({
      stage,
      explanation,
      rows: [],
      tree: {
        title: "beside each node: the range its value must be inside",
        nodes: layout(root, { tone: (t) => (t.id === bad ? "swap" : t.id === at ? "current" : ok.has(t.id) ? "found" : undefined), note: (t) => (bounds.has(t.id) ? `(${fmt(bounds.get(t.id)![0])}, ${fmt(bounds.get(t.id)![1])})` : undefined) }),
      },
      vars: [{ name: "nodes checked", value: String(ok.size) }],
      ops,
      ...extra,
    });
  snap("start", "Checking each node only against its parent isn't enough: every node must be bigger than every ancestor it's to the right of, and smaller than every ancestor it's to the left of. Carry those limits down as a range (low, high).");
  const go = (t: T | null, lo: number, hi: number): boolean => {
    if (!t) return true;
    ops++;
    at = t.id;
    bounds.set(t.id, [lo, hi]);
    if (!(lo < t.val && t.val < hi)) {
      bad = t.id;
      snap("bad", `${t.val} must be between ${fmt(lo)} and ${fmt(hi)}, but it isn't. Not a valid BST.`, { done: true, answer: "false" });
      return false;
    }
    ok.add(t.id);
    snap("ok", `${fmt(lo)} < ${t.val} < ${fmt(hi)}: fine. Its left child must be in (${fmt(lo)}, ${t.val}) and its right child in (${t.val}, ${fmt(hi)}).`);
    return go(t.left, lo, t.val) && go(t.right, t.val, hi);
  };
  if (go(root, -Infinity, Infinity)) {
    at = null;
    snap("valid", "Every node is inside its range: a valid BST.", { done: true, answer: "true" });
  }
  return steps;
}

/** For each node, check every value in its left subtree is smaller and every value in its right is bigger. */
function bySubtrees(arr: Level, count: () => void): boolean {
  const all = (t: T | null): number[] => (t ? [t.val, ...all(t.left), ...all(t.right)] : []);
  return preorder(fromLevel(arr)).every((t) => all(t.left).every((v) => (count(), v < t.val)) && all(t.right).every((v) => (count(), v > t.val)));
}

export const validateBST: PatternProblem<Input> = {
  id: "validate-bst",
  title: "Validate Binary Search Tree",
  difficulty: "Medium",
  blind75: true,
  slug: "validate-binary-search-tree",
  video: "s6ATEkipzow",
  statement: "Return true if the tree is a valid binary search tree: for every node, all values in its left subtree are smaller and all values in its right subtree are bigger.",
  examples: [
    { label: "[2,1,3]", input: [2, 1, 3] },
    { label: "[5,1,4,null,null,3,6]", input: [5, 1, 4, null, null, 3, 6] },
    { label: "the sneaky one", input: [5, 4, 6, null, null, 3, 7] },
  ],
  random: (seed) => {
    const g = rngFor(seed);
    const arr = randomBST(g, g.int(2, 9), 1, 20);
    if (g.r() < 0.5) {
      // Break it: swap two values.
      const idx = arr.map((v, i) => (v === null ? -1 : i)).filter((i) => i >= 0);
      const [a, b] = g.shuffle(idx).slice(0, 2);
      [arr[a], arr[b]] = [arr[b], arr[a]];
    }
    return arr;
  },
  big: { label: "a deep valid BST of 200 nodes", input: () => toLevel(insertAll(Array.from({ length: 200 }, (_, i) => 200 - i))) },
  describe: (arr) => `root = ${showLevel(arr)}`,
  run,
  solve: (arr) => bySubtrees(arr, () => {}),
  brute: (arr) => {
    let ops = 0;
    const answer = bySubtrees(arr, () => ops++);
    return { answer, ops };
  },
  bruteIdea: "For every node, compare it with every value in both of its subtrees. Correct, but each value is checked once per ancestor: O(n²) for a deep tree.",
  guide: {
    title: "Validate Binary Search Tree",
    idea: [
      "The rule is about whole subtrees, not just children. In “the sneaky one”, 3 is a fine left child of 6, but it's in 5's right subtree, so it must be bigger than 5.",
      "Pass a range down: the root can be anything (−∞, ∞). Going left, the node's value becomes the new upper limit; going right, it becomes the new lower limit. Each node checks itself against its range once: O(n).",
    ],
    whenToUse: ["Constraints that come from all ancestors: pass bounds down the recursion.", "An in-order traversal must be strictly increasing; checking that is another O(n) way."],
    stages: [
      { id: "start", title: "Root range (−∞, ∞)", detail: "", pseudo: "valid(root, -inf, inf)" },
      { id: "ok", title: "Inside the range → narrow it for the children", detail: "left: (low, val), right: (val, high).", pseudo: "valid(node.left, low, node.val) and valid(node.right, node.val, high)" },
      { id: "bad", title: "Outside the range → false", detail: "", pseudo: "if not low < node.val < high: return False" },
      { id: "valid", title: "Every node fits → true", detail: "", pseudo: "" },
    ],
    legend: [
      { tone: "current", label: "Node being checked" },
      { tone: "found", label: "Inside its range" },
      { tone: "swap", label: "Outside its range" },
    ],
    complexity: { time: "O(n)", space: "O(h)", why: "Each node is checked once against two numbers." },
    pitfalls: ["Comparing only with the parent passes “the sneaky one”, which is wrong.", "Use strict < (no duplicates), and ±∞ rather than the smallest/largest integers, which could be real values."],
    tryThis: ["Pick “the sneaky one”: 3's range is (5, 6), so it fails.", "Press “Random”: half the trees have two values swapped."],
    python: py,
  },
};
