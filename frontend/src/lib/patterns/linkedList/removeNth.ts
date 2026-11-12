// Remove Nth Node From End of List (NeetCode 150 · Linked List).

import py from "../../guides/python/neetcode/remove_nth_from_end.py?raw";
import { rngFor, show } from "../helpers";
import type { LNode, PatternProblem, PatternStep } from "../types";
import { edgesOf, tagsOf, walk } from "./draw";

type Input = { vals: number[]; n: number };

function run({ vals, n }: Input): PatternStep[] {
  const steps: PatternStep[] = [];
  const len = vals.length;
  const id = (i: number) => `n${i}`;
  const next: Record<string, string | null> = { d: id(0), nul: null };
  vals.forEach((_, i) => (next[id(i)] = i + 1 < len ? id(i + 1) : "nul"));
  let left = "d";
  let right: string = id(0);
  let removed: string | null = null;
  let ops = 0;
  const target = id(len - n);
  const snap = (stage: string, explanation: string, extra: Partial<PatternStep> = {}) => {
    const tags = tagsOf(stage === "done" ? [] : [["left", left], ["right", right]]);
    const nodes: LNode[] = [
      { id: "d", v: "·", row: 0, col: 0, tone: "pointer", tag: tags.d ?? "dummy" },
      ...vals.map((v, i): LNode => ({ id: id(i), v: String(v), row: 0, col: i + 1, tone: id(i) === removed ? "swap" : id(i) === left || id(i) === right ? "current" : undefined, tag: tags[id(i)] })),
      { id: "nul", v: "∅", row: 0, col: len + 1, tag: tags.nul },
    ];
    const gap = walk(next, left).indexOf(right);
    steps.push({
      stage,
      explanation,
      rows: [],
      links: { nodes, edges: edgesOf(next, (f) => (f === removed ? "idle" : removed && f === left ? "found" : undefined)) },
      vars: [
        { name: "n", value: String(n) },
        ...(gap > 0 && stage !== "done" ? [{ name: "nodes from left to right", value: String(gap), tone: "pointer" as const }] : []),
      ],
      ops,
      ...extra,
    });
  };
  snap("start", `Remove the ${n === 1 ? "last node" : `${n}th node from the end`} in one pass. Put a dummy node before the head, left on the dummy and right on the head.`);
  for (let k = 0; k < n; k++) {
    right = next[right]!;
    ops++;
    snap("gap", `Move right forward (${k + 1} of ${n}). Once right is n nodes ahead, left and right stay that far apart.`);
  }
  while (right !== "nul") {
    left = next[left]!;
    right = next[right]!;
    ops++;
    snap("walk", `Move both one step. ${right === "nul" ? "right fell off the end, so left is just before the node to remove." : ""}`);
  }
  removed = next[left];
  next[left] = next[removed!];
  ops++;
  snap("remove", `left.next = left.next.next: the arrow skips ${vals[len - n]}, which is now out of the list.${left === "d" ? " It was the head, which is why the dummy node helps." : ""}`);
  const out = vals.filter((_, i) => id(i) !== target);
  snap("done", `Return dummy.next: ${show(out)}.`, { done: true, answer: show(out) });
  return steps;
}

export const removeNth: PatternProblem<Input> = {
  id: "remove-nth",
  title: "Remove Nth Node From End of List",
  difficulty: "Medium",
  blind75: true,
  slug: "remove-nth-node-from-end-of-list",
  video: "XVuQxVej6y8",
  statement: "Remove the n-th node from the end of a linked list and return its head. (n = 1 is the last node.)",
  examples: [
    { label: "1→2→3→4→5, n=2", input: { vals: [1, 2, 3, 4, 5], n: 2 } },
    { label: "1→2, n=2 (the head)", input: { vals: [1, 2], n: 2 } },
    { label: "1→2→3, n=1", input: { vals: [1, 2, 3], n: 1 } },
  ],
  random: (seed) => {
    const g = rngFor(seed);
    const vals = Array.from({ length: g.int(1, 6) }, (_, i) => i + 1);
    return { vals, n: g.int(1, vals.length) };
  },
  describe: ({ vals, n }) => `head = ${vals.join(" → ")}, n = ${n}`,
  run,
  solve: ({ vals, n }) => show(vals.filter((_, i) => i !== vals.length - n)),
  brute: null,
  bruteIdea: "Two passes: count the length L, then walk L − n nodes and remove the next one. Also O(n); the gap trick does it in one pass.",
  guide: {
    title: "Remove Nth Node From End of List",
    idea: [
      "You can't count from the end of a singly linked list, but you can use a gap. Put right n nodes ahead of left; then move both together. When right falls off the end, left is exactly one node before the n-th from the end.",
      "Starting left on a dummy node before the head means removing the head itself needs no special case.",
    ],
    whenToUse: ["“k-th from the end” in one pass: two pointers a fixed distance apart.", "Use a dummy node whenever the head might be removed or replaced."],
    stages: [
      { id: "start", title: "left = dummy, right = head", detail: "", pseudo: "dummy = ListNode(0, head); left, right = dummy, head" },
      { id: "gap", title: "Move right n steps ahead", detail: "", pseudo: "for _ in range(n): right = right.next" },
      { id: "walk", title: "Move both until right is None", detail: "", pseudo: "while right: left, right = left.next, right.next" },
      { id: "remove", title: "Skip the node after left", detail: "", pseudo: "left.next = left.next.next" },
      { id: "done", title: "Return dummy.next", detail: "", pseudo: "return dummy.next" },
    ],
    legend: [
      { tone: "current", label: "left and right" },
      { tone: "found", label: "The new skip arrow" },
      { tone: "swap", label: "Removed node" },
    ],
    complexity: { time: "O(n)", space: "O(1)", why: "right walks the list once; left follows behind." },
    pitfalls: ["Without a dummy node, removing the head needs a special case.", "Start left one node behind right's start (on the dummy), or you'll stop on the node to remove instead of the one before it."],
    tryThis: ["Pick “1→2, n=2 (the head)”: left never leaves the dummy.", "Press “Random” and point at the node that will go."],
    python: py,
  },
};
