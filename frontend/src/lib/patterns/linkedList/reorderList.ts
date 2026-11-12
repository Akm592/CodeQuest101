// Reorder List (NeetCode 150 · Linked List).

import py from "../../guides/python/neetcode/reorder_list.py?raw";
import type { VizTone } from "../../guides/types";
import { rngFor, show } from "../helpers";
import type { LNode, PatternProblem, PatternStep } from "../types";
import { edgesOf, tagsOf, walk } from "./draw";

type Input = number[];

export function reorderSolve(xs: number[]): number[] {
  const out: number[] = [];
  for (let l = 0, r = xs.length - 1; l <= r; l++, r--) {
    out.push(xs[l]);
    if (l !== r) out.push(xs[r]);
  }
  return out;
}

function run(xs: Input): PatternStep[] {
  const steps: PatternStep[] = [];
  const n = xs.length;
  const id = (i: number) => `n${i}`;
  const ix = (s: string | null) => (s ? Number(s.slice(1)) : -1);
  const next: Record<string, string | null> = {};
  xs.forEach((_, i) => (next[id(i)] = i + 1 < n ? id(i + 1) : "nul"));
  next.nul = null;
  let ops = 0;
  const half2 = new Set<string>();
  const woven = new Set<string>();
  let ptrs: [string, string | null][] = [];
  const snap = (stage: string, explanation: string, extra: Partial<PatternStep> = {}) => {
    const tags = tagsOf(ptrs);
    const tone = (s: string): VizTone | undefined => (woven.has(s) ? "found" : half2.has(s) ? "visited" : ptrs.some(([, p]) => p === s) ? "current" : undefined);
    const nodes: LNode[] = [...xs.map((v, i): LNode => ({ id: id(i), v: String(v), row: 0, col: i, tone: tone(id(i)), tag: tags[id(i)] })), { id: "nul", v: "∅", row: 0, col: n }];
    steps.push({
      stage,
      explanation,
      rows: [],
      links: { nodes, edges: edgesOf(next, (f) => (woven.has(f) ? "found" : half2.has(f) ? "visited" : undefined)) },
      vars: [{ name: "list from head", value: show(walk(next, id(0)).filter((s) => s !== "nul").map((s) => xs[ix(s)])) }],
      ops,
      ...extra,
    });
  };
  let slow = id(0);
  let fast = next[id(0)];
  ptrs = [["slow", slow], ["fast", fast === "nul" ? null : fast]];
  snap("start", "Three steps, all in place: find the middle, reverse the second half, then weave the two halves together, one node from each.");
  while (fast !== "nul" && fast && next[fast] !== "nul") {
    slow = next[slow]!;
    fast = next[next[fast]!];
    ops++;
    ptrs = [["slow", slow], ["fast", fast === "nul" ? null : fast]];
    snap("middle", `slow moves 1, fast moves 2. When fast can't move 2 more, slow is at the middle (${xs[ix(slow)]}).`);
  }
  let second: string | null = next[slow];
  next[slow] = "nul";
  for (const s of walk(next, second)) if (s !== "nul") half2.add(s);
  ops++;
  ptrs = [["slow", slow], ["second", second === "nul" ? null : second]];
  snap("cut", `Cut after the middle: ${xs[ix(slow)]} now points to None. The second half (purple) starts at ${second && second !== "nul" ? xs[ix(second)] : "None"}.`);
  let prev: string | null = null;
  while (second && second !== "nul") {
    const nxt: string | null = next[second];
    next[second] = prev ?? "nul";
    prev = second;
    second = nxt;
    ops++;
    ptrs = [["prev", prev], ["second", second === "nul" ? null : second]];
    snap("reverse", `Reverse the second half: point ${xs[ix(prev)]} back at ${next[prev] === "nul" ? "None" : xs[ix(next[prev])]}.`);
  }
  let first: string | null = id(0);
  let sec: string | null = prev;
  while (sec && sec !== "nul") {
    const t1: string | null = next[first!];
    const t2: string | null = next[sec];
    next[first!] = sec;
    next[sec] = t1;
    woven.add(first!);
    woven.add(sec);
    ops++;
    ptrs = [["first", t1 === "nul" ? null : t1], ["second", t2 === "nul" ? null : t2]];
    snap("weave", `Weave: ${xs[ix(first)]} → ${xs[ix(sec)]} → ${t1 && t1 !== "nul" ? xs[ix(t1)] : "None"}. Then move both pointers on.`);
    first = t1;
    sec = t2;
  }
  for (const s of walk(next, id(0))) if (s !== "nul") woven.add(s);
  ptrs = [];
  const out = reorderSolve(xs);
  snap("done", `Done, in place: ${show(out)}. Front and back alternate.`, { done: true, answer: show(out) });
  return steps;
}

export const reorderList: PatternProblem<Input> = {
  id: "reorder-list",
  title: "Reorder List",
  difficulty: "Medium",
  blind75: true,
  slug: "reorder-list",
  video: "S5bfdUTrKLM",
  statement: "Reorder the list L0 → L1 → … → Ln into L0 → Ln → L1 → Ln−1 → L2 → …, changing the links, not the values.",
  examples: [
    { label: "1→2→3→4→5", input: [1, 2, 3, 4, 5] },
    { label: "1→2→3→4", input: [1, 2, 3, 4] },
    { label: "1→…→7", input: [1, 2, 3, 4, 5, 6, 7] },
  ],
  random: (seed) => {
    const g = rngFor(seed);
    return Array.from({ length: g.int(2, 7) }, (_, i) => i + 1);
  },
  describe: (xs) => `head = ${xs.join(" → ")}`,
  run,
  solve: (xs) => show(reorderSolve(xs)),
  brute: null,
  bruteIdea: "Copy the nodes into an array, then link them from both ends with two indices: also O(n) time, but O(n) extra memory. The in-place way uses O(1).",
  guide: {
    title: "Reorder List",
    idea: [
      "The new order takes one node from the front, then one from the back. A singly linked list can't walk backwards, so make the back half walkable: reverse it.",
      "Three building blocks: fast and slow pointers find the middle; cut there and reverse the second half; then weave the two halves together, one node from each.",
    ],
    whenToUse: ["“Combine the front and back of a list”: middle + reverse + merge.", "Palindrome Linked List uses the same first two steps."],
    stages: [
      { id: "start", title: "slow = head, fast = head.next", detail: "", pseudo: "slow, fast = head, head.next" },
      { id: "middle", title: "Find the middle", detail: "slow moves 1, fast moves 2.", pseudo: "while fast and fast.next: slow, fast = slow.next, fast.next.next" },
      { id: "cut", title: "Cut after the middle", detail: "", pseudo: "second = slow.next; slow.next = None" },
      { id: "reverse", title: "Reverse the second half", detail: "Same as Reverse Linked List.", pseudo: "second.next = prev; ..." },
      { id: "weave", title: "Weave front and back", detail: "first → second → old first.next.", pseudo: "first.next = second; second.next = tmp1" },
      { id: "done", title: "Reordered in place", detail: "", pseudo: "" },
    ],
    legend: [
      { tone: "current", label: "Pointers" },
      { tone: "visited", label: "Second half" },
      { tone: "found", label: "Woven" },
    ],
    complexity: { time: "O(n)", space: "O(1)", why: "Three passes over at most n nodes, with a few pointers." },
    pitfalls: ["Forgetting to cut (slow.next = None) leaves a cycle after weaving.", "Save both next pointers before re-linking in the weave."],
    tryThis: ["Compare 4 and 5 nodes: where does the middle land?", "Watch the arcs in the weave: each one jumps from the front half to the back."],
    python: py,
  },
};
