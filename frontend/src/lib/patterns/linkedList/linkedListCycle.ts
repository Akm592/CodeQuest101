// Linked List Cycle (NeetCode 150 · Linked List).

import py from "../../guides/python/neetcode/linked_list_cycle.py?raw";
import { rngFor } from "../helpers";
import type { LNode, PatternProblem, PatternStep } from "../types";
import { edgesOf, tagsOf } from "./draw";

type Input = { vals: number[]; pos: number };

function run({ vals, pos }: Input): PatternStep[] {
  const steps: PatternStep[] = [];
  const n = vals.length;
  const id = (i: number) => `n${i}`;
  const next: Record<string, string | null> = { nul: null };
  vals.forEach((_, i) => (next[id(i)] = i + 1 < n ? id(i + 1) : pos >= 0 ? id(pos) : "nul"));
  let slow: string | null = id(0);
  let fast: string | null = id(0);
  let ops = 0;
  const snap = (stage: string, explanation: string, extra: Partial<PatternStep> = {}) => {
    const tags = tagsOf([["slow", slow], ["fast", fast]]);
    const nodes: LNode[] = [
      ...vals.map((v, i): LNode => ({ id: id(i), v: String(v), row: 0, col: i, tone: stage === "meet" && id(i) === slow ? "found" : id(i) === slow ? "current" : id(i) === fast ? "compare" : undefined, tag: tags[id(i)] })),
      ...(pos < 0 ? [{ id: "nul", v: "∅", row: 0, col: n, tag: tags.nul } as LNode] : []),
    ];
    steps.push({
      stage,
      explanation,
      rows: [],
      links: { title: pos >= 0 ? "the last node points back into the list" : "the list ends at None", nodes, edges: edgesOf(next, (f) => (pos >= 0 && f === id(n - 1) ? "visited" : undefined)) },
      vars: [{ name: "moves", value: String(ops) }],
      ops,
      ...extra,
    });
  };
  snap("start", "Floyd's tortoise and hare: slow moves 1 node per turn, fast moves 2. If the list ends, fast reaches the end. If there's a loop, fast can't escape it and catches up with slow from behind.");
  while (fast !== "nul" && fast && next[fast] !== "nul") {
    slow = next[slow!];
    fast = next[next[fast]!];
    ops++;
    if (slow === fast) {
      snap("meet", `slow and fast are both on ${vals[Number(slow!.slice(1))]}. Fast lapped slow, which can only happen inside a loop: there's a cycle.`, { done: true, answer: "true" });
      return steps;
    }
    snap("move", `slow moves 1 to ${vals[Number(slow!.slice(1))]}, fast moves 2 to ${fast === "nul" ? "None" : vals[Number(fast!.slice(1))]}.${pos >= 0 ? " Inside the loop, fast gains one node on slow every turn." : ""}`);
  }
  snap("end", "fast reached the end of the list, so there's no cycle.", { done: true, answer: "false" });
  return steps;
}

export const linkedListCycle: PatternProblem<Input> = {
  id: "linked-list-cycle",
  title: "Linked List Cycle",
  difficulty: "Easy",
  blind75: true,
  slug: "linked-list-cycle",
  video: "gBTe7lFR3vc",
  statement: "Return true if the linked list has a cycle: some node's next pointer leads back to an earlier node. Use O(1) memory if you can.",
  examples: [
    { label: "3→2→0→−4, back to 2", input: { vals: [3, 2, 0, -4], pos: 1 } },
    { label: "1→2, no cycle", input: { vals: [1, 2], pos: -1 } },
    { label: "6 nodes, back to 1st", input: { vals: [1, 2, 3, 4, 5, 6], pos: 0 } },
  ],
  random: (seed) => {
    const g = rngFor(seed);
    const n = g.int(1, 7);
    return { vals: Array.from({ length: n }, () => g.int(0, 9)), pos: g.r() < 0.6 ? g.int(0, n - 1) : -1 };
  },
  describe: ({ vals, pos }) => `head = ${vals.join(" → ")}${pos >= 0 ? `, tail → node ${pos}` : ""}`,
  run,
  solve: ({ pos }) => pos >= 0,
  brute: null,
  bruteIdea: "Store every visited node in a hash set and stop at the first repeat: O(n) time but O(n) memory. Floyd's two pointers need O(1).",
  guide: {
    title: "Linked List Cycle",
    idea: [
      "Send two pointers along the list, one twice as fast as the other. Without a loop, the fast one reaches the end. With a loop, both end up circling it, and since fast gains one node on slow each turn, it must land on slow eventually.",
      "No memory beyond two pointers. The same trick finds the middle of a list, and with a second phase, where a loop starts (see Find the Duplicate Number).",
    ],
    whenToUse: ["“Is there a cycle?” or “where does it start?” in a list or in any “next” function.", "“Find the middle” in one pass."],
    stages: [
      { id: "start", title: "slow = fast = head", detail: "", pseudo: "slow = fast = head" },
      { id: "move", title: "slow +1, fast +2", detail: "", pseudo: "slow, fast = slow.next, fast.next.next" },
      { id: "meet", title: "They meet → cycle", detail: "", pseudo: "if slow is fast: return True" },
      { id: "end", title: "fast hits the end → no cycle", detail: "", pseudo: "return False" },
    ],
    legend: [
      { tone: "current", label: "slow" },
      { tone: "compare", label: "fast" },
      { tone: "found", label: "Where they meet" },
      { tone: "visited", label: "The arrow back into the list" },
    ],
    complexity: { time: "O(n)", space: "O(1)", why: "Before fast is in the loop, it's at most n steps; inside, the gap shrinks by one per turn." },
    pitfalls: ["Check fast and fast.next before moving fast two steps.", "Compare nodes, not values: two different nodes can hold the same value."],
    tryThis: ["Pick “6 nodes, back to 1st”: count the turns until they meet.", "See the full story of the algorithm on CodeQuest's Floyd's cycle page."],
    python: py,
  },
};
