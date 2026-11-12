// Reverse Linked List (NeetCode 150 · Linked List).

import py from "../../guides/python/neetcode/reverse_list.py?raw";
import { rngFor, show } from "../helpers";
import type { LNode, PatternProblem, PatternStep } from "../types";
import { edgesOf, tagsOf } from "./draw";

type Input = number[];

function run(xs: Input): PatternStep[] {
  const steps: PatternStep[] = [];
  const n = xs.length;
  const id = (i: number) => `n${i}`;
  const next: Record<string, string | null> = { nl: null, nr: null };
  xs.forEach((_, i) => (next[id(i)] = i + 1 < n ? id(i + 1) : "nr"));
  const flipped = new Set<string>();
  let prev: string | null = null;
  let curr: string | null = n ? id(0) : null;
  let ops = 0;
  const snap = (stage: string, explanation: string, extra: Partial<PatternStep> = {}) => {
    const tags = tagsOf([["prev", prev], ["curr", curr]]);
    const nodes: LNode[] = [
      { id: "nl", v: "∅", row: 0, col: 0, tag: prev === null && stage !== "done" ? "prev" : undefined },
      ...xs.map((v, i): LNode => ({ id: id(i), v: String(v), row: 0, col: i + 1, tone: id(i) === curr ? "current" : flipped.has(id(i)) ? "found" : undefined, tag: tags[id(i)] })),
      { id: "nr", v: "∅", row: 0, col: n + 1, tone: flipped.size === n ? "idle" : undefined, tag: curr === null && stage !== "done" ? "curr" : undefined },
    ];
    steps.push({
      stage,
      explanation,
      rows: [],
      links: { title: "the list (arrows are next pointers)", nodes, edges: edgesOf(next, (f) => (flipped.has(f) ? "found" : undefined)) },
      vars: [
        { name: "prev", value: prev ? xs[Number(prev.slice(1))].toString() : "None" },
        { name: "curr", value: curr && curr !== "nr" ? xs[Number(curr.slice(1))].toString() : "None", tone: "current" },
      ],
      ops,
      ...extra,
    });
  };
  snap("start", "Walk along the list with two pointers: prev (starting at None) and curr (starting at the head). At each node, flip its arrow to point back at prev.");
  while (curr) {
    const i = Number(curr.slice(1));
    const nxt = i + 1 < n ? id(i + 1) : null;
    next[curr] = prev ?? "nl";
    flipped.add(curr);
    ops++;
    prev = curr;
    curr = nxt;
    snap("flip", `Save next (${nxt ? xs[i + 1] : "None"}), then point ${xs[i]} back at ${i === 0 ? "None" : xs[i - 1]}. Move prev to ${xs[i]} and curr to ${nxt ? xs[i + 1] : "None"}.`);
  }
  curr = null;
  const out = [...xs].reverse();
  snap("done", `curr is None, so every arrow is flipped. prev (${prev ? xs[n - 1] : "None"}) is the new head: ${show(out)}.`, { done: true, answer: show(out) });
  return steps;
}

export const reverseList: PatternProblem<Input> = {
  id: "reverse-list",
  title: "Reverse Linked List",
  difficulty: "Easy",
  blind75: true,
  slug: "reverse-linked-list",
  video: "G0_I-ZF0S38",
  statement: "Given the head of a singly linked list, reverse it and return the new head.",
  examples: [
    { label: "1→2→3→4→5", input: [1, 2, 3, 4, 5] },
    { label: "1→2", input: [1, 2] },
    { label: "7", input: [7] },
  ],
  random: (seed) => {
    const g = rngFor(seed);
    return Array.from({ length: g.int(1, 6) }, () => g.int(0, 9));
  },
  describe: (xs) => `head = ${xs.join(" → ")}`,
  run,
  solve: (xs) => show([...xs].reverse()),
  brute: null,
  bruteIdea: "Copying the values into an array and writing them back reversed also takes O(n), but needs O(n) extra memory, and it changes values rather than links. Flipping the arrows needs only two pointers.",
  guide: {
    title: "Reverse Linked List",
    idea: [
      "Each node only knows the node after it. To reverse the list, every arrow must point the other way, so visit each node once and flip its arrow to point at the node before it.",
      "The catch: once you flip curr.next, you've lost the way forward. So save next first, then flip, then step prev and curr forward. When curr runs off the end, prev is the old tail, which is the new head.",
    ],
    whenToUse: ["Any time part of a list must be reversed: it's a building block for Reorder List, Palindrome List and Reverse Nodes in k-Group.", "The recursive version is shorter but uses O(n) call stack."],
    stages: [
      { id: "start", title: "prev = None, curr = head", detail: "Nothing is flipped yet.", pseudo: "prev, curr = None, head" },
      { id: "flip", title: "Save next, flip, step forward", detail: "curr.next = prev, then prev = curr, curr = next.", pseudo: "nxt = curr.next; curr.next = prev; prev, curr = curr, nxt" },
      { id: "done", title: "curr is None → return prev", detail: "prev is the new head.", pseudo: "return prev" },
    ],
    legend: [
      { tone: "current", label: "curr" },
      { tone: "found", label: "Arrow already flipped" },
    ],
    complexity: { time: "O(n)", space: "O(1)", why: "One visit per node, and only three pointers." },
    pitfalls: ["Flip before saving next and the rest of the list is lost.", "Return prev, not curr: curr is None at the end."],
    tryThis: ["Step through “1→2→3→4→5” and watch the green arrows grow from the left.", "Pick “7”: a one-node list just points at None."],
    python: py,
  },
};
