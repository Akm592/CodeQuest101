// Merge Two Sorted Lists (NeetCode 150 · Linked List).

import py from "../../guides/python/neetcode/merge_two_lists.py?raw";
import { rngFor, show } from "../helpers";
import type { LNode, PatternProblem, PatternStep } from "../types";
import { edgesOf, tagsOf, walk } from "./draw";

type Input = { a: number[]; b: number[] };

function run({ a, b }: Input): PatternStep[] {
  const steps: PatternStep[] = [];
  const A = (i: number) => `a${i}`;
  const B = (j: number) => `b${j}`;
  const val: Record<string, number> = {};
  const next: Record<string, string | null> = { d: null };
  a.forEach((v, i) => ((val[A(i)] = v), (next[A(i)] = i + 1 < a.length ? A(i + 1) : null)));
  b.forEach((v, j) => ((val[B(j)] = v), (next[B(j)] = j + 1 < b.length ? B(j + 1) : null)));
  const merged = new Set<string>();
  let i = 0;
  let j = 0;
  let tail = "d";
  let ops = 0;
  const snap = (stage: string, explanation: string, extra: Partial<PatternStep> = {}) => {
    const l1 = i < a.length ? A(i) : null;
    const l2 = j < b.length ? B(j) : null;
    const tags = tagsOf(stage === "done" ? [["dummy", "d"]] : [["l1", l1], ["l2", l2], ["tail", tail]]);
    const tone = (nid: string) => (merged.has(nid) ? ("found" as const) : nid === l1 || nid === l2 ? ("compare" as const) : undefined);
    const nodes: LNode[] = [
      { id: "d", v: "·", row: 1, col: 0, tone: "pointer", tag: tags.d },
      ...a.map((v, k): LNode => ({ id: A(k), v: String(v), row: 0, col: k + 1, tone: tone(A(k)), tag: tags[A(k)] })),
      ...b.map((v, k): LNode => ({ id: B(k), v: String(v), row: 2, col: k + 1, tone: tone(B(k)), tag: tags[B(k)] })),
    ];
    steps.push({
      stage,
      explanation,
      rows: [],
      links: { nodes, edges: edgesOf(next, (f) => (f === "d" || merged.has(f) ? "found" : undefined)), rowLabels: { 0: "list1", 1: "dummy", 2: "list2" } },
      vars: [{ name: "merged so far", value: show(walk(next, next.d).map((x) => val[x])), tone: "found" }],
      ops,
      ...extra,
    });
  };
  snap("start", "Start from a dummy node, so the first pick works like every other. tail is the end of the merged list; l1 and l2 point at the smallest unused node of each list.");
  while (i < a.length && j < b.length) {
    ops++;
    const takeA = a[i] <= b[j];
    const pick = takeA ? A(i) : B(j);
    next[tail] = pick;
    merged.add(pick);
    const msg = takeA ? `${a[i]} ≤ ${b[j]}: link tail to list1's ${a[i]} and move l1 on.` : `${b[j]} < ${a[i]}: link tail to list2's ${b[j]} and move l2 on.`;
    tail = pick;
    if (takeA) i++;
    else j++;
    snap("pick", `${msg} No values are copied: only one arrow changes.`);
  }
  const rest = i < a.length ? A(i) : j < b.length ? B(j) : null;
  next[tail] = rest;
  for (const x of walk(next, rest)) merged.add(x);
  ops++;
  snap("rest", rest ? `${i < a.length ? "list2" : "list1"} is used up. The rest of ${i < a.length ? "list1" : "list2"} is already sorted, so attach it in one step.` : "Both lists are used up.");
  const out = walk(next, next.d).map((x) => val[x]);
  snap("done", `Return dummy.next: ${show(out)}.`, { done: true, answer: show(out) });
  return steps;
}

export const mergeTwoLists: PatternProblem<Input> = {
  id: "merge-two-lists",
  title: "Merge Two Sorted Lists",
  difficulty: "Easy",
  blind75: true,
  slug: "merge-two-sorted-lists",
  video: "XIdigk956u0",
  statement: "Given the heads of two sorted linked lists, splice their nodes together into one sorted list and return its head.",
  examples: [
    { label: "1→2→4 and 1→3→4", input: { a: [1, 2, 4], b: [1, 3, 4] } },
    { label: "2→5→9 and 1→3", input: { a: [2, 5, 9], b: [1, 3] } },
    { label: "empty and 0", input: { a: [], b: [0] } },
  ],
  random: (seed) => {
    const g = rngFor(seed);
    const make = (n: number) => Array.from({ length: n }, () => g.int(0, 9)).sort((x, y) => x - y);
    const a = make(g.int(0, 5));
    return { a, b: make(g.int(a.length ? 0 : 1, 5)) };
  },
  big: { label: "100 + 100 nodes", input: () => ({ a: Array.from({ length: 100 }, (_, i) => i * 2), b: Array.from({ length: 100 }, (_, i) => i * 2 + 1) }) },
  describe: ({ a, b }) => `list1 = ${show(a)}, list2 = ${show(b)}`,
  run,
  solve: ({ a, b }) => show([...a, ...b].sort((x, y) => x - y)),
  brute: ({ a, b }) => {
    // Collect every value and sort: about N log N comparisons.
    const all = [...a, ...b];
    const n = all.length;
    return { answer: show(all.sort((x, y) => x - y)), ops: Math.max(1, Math.ceil(n * Math.log2(Math.max(2, n)))) };
  },
  bruteIdea: "Collect every value, sort them and build a new list: O(N log N) time and O(N) extra memory. Merging uses the fact that both lists are already sorted: O(N), re-using the nodes.",
  guide: {
    title: "Merge Two Sorted Lists",
    idea: [
      "The smallest remaining value is always at the front of one of the two lists. Compare the two fronts, link the smaller one onto the merged list, and move that list's pointer on.",
      "A dummy node in front of the result means you never need a special case for the first node. When one list runs out, the other's remaining nodes are already sorted: attach them all at once.",
    ],
    whenToUse: ["The merge step of merge sort, on linked lists.", "A dummy (sentinel) head node removes “is the result empty yet?” checks in almost every list-building problem."],
    stages: [
      { id: "start", title: "Dummy node, tail = dummy", detail: "", pseudo: "dummy = tail = ListNode()" },
      { id: "pick", title: "Link the smaller front", detail: "tail.next = the smaller of l1, l2; advance that one.", pseudo: "if l1.val <= l2.val: tail.next = l1; l1 = l1.next ..." },
      { id: "rest", title: "One list empty → attach the other", detail: "It's already sorted.", pseudo: "tail.next = l1 or l2" },
      { id: "done", title: "Return dummy.next", detail: "", pseudo: "return dummy.next" },
    ],
    legend: [
      { tone: "compare", label: "Fronts being compared (l1, l2)" },
      { tone: "found", label: "In the merged list" },
      { tone: "pointer", label: "Dummy node" },
    ],
    complexity: { time: "O(m + n)", space: "O(1)", why: "Each node is linked once, and the nodes are re-used rather than copied." },
    pitfalls: ["Forgetting the leftover nodes when one list runs out.", "Use ≤ so equal values keep their original order (a stable merge)."],
    tryThis: ["Pick “2→5→9 and 1→3”: list2 runs out first, and 5→9 is attached in one step.", "Pick “empty and 0”."],
    python: py,
  },
};
