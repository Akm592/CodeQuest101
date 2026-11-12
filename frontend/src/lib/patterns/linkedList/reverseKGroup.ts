// Reverse Nodes in K-Group (NeetCode 150 · Linked List).

import py from "../../guides/python/neetcode/reverse_k_group.py?raw";
import { rngFor, show } from "../helpers";
import type { LNode, PatternProblem, PatternStep } from "../types";
import { edgesOf, tagsOf, walk } from "./draw";

type Input = { vals: number[]; k: number };

export function kGroupSolve({ vals, k }: Input): number[] {
  const out: number[] = [];
  for (let i = 0; i < vals.length; i += k) {
    const g = vals.slice(i, i + k);
    out.push(...(g.length === k ? g.reverse() : g));
  }
  return out;
}

function run({ vals, k }: Input): PatternStep[] {
  const steps: PatternStep[] = [];
  const n = vals.length;
  const id = (i: number) => `n${i}`;
  const v = (s: string | null) => (s && s.startsWith("n") ? String(vals[Number(s.slice(1))]) : "None");
  const next: Record<string, string | null> = { d: id(0), nul: null };
  vals.forEach((_, i) => (next[id(i)] = i + 1 < n ? id(i + 1) : "nul"));
  const done = new Set<string>();
  let group = new Set<string>();
  let ptrs: [string, string | null][] = [];
  let ops = 0;
  const snap = (stage: string, explanation: string, extra: Partial<PatternStep> = {}) => {
    const tags = tagsOf(ptrs);
    const nodes: LNode[] = [
      { id: "d", v: "·", row: 0, col: 0, tone: "pointer", tag: tags.d ?? "dummy" },
      ...vals.map((x, i): LNode => ({ id: id(i), v: String(x), row: 0, col: i + 1, tone: done.has(id(i)) ? "found" : group.has(id(i)) ? "compare" : undefined, tag: tags[id(i)] })),
      { id: "nul", v: "∅", row: 0, col: n + 1, tag: tags.nul },
    ];
    steps.push({
      stage,
      explanation,
      rows: [],
      links: { nodes, edges: edgesOf(next, (f) => (done.has(f) ? "found" : group.has(f) ? "compare" : undefined)) },
      vars: [
        { name: "k", value: String(k) },
        { name: "list from dummy.next", value: show(walk(next, next.d).filter((s) => s !== "nul").map((s) => vals[Number(s.slice(1))])) },
      ],
      ops,
      ...extra,
    });
  };
  let groupPrev = "d";
  ptrs = [["groupPrev", groupPrev]];
  snap("start", `Reverse the list ${k} nodes at a time. groupPrev is the node just before the current group (a dummy at first). A group shorter than ${k} at the end stays as it is.`);
  for (;;) {
    let kth: string | null = groupPrev;
    for (let c = 0; c < k && kth; c++) {
      kth = next[kth];
      if (kth === "nul") kth = null;
      ops++;
    }
    if (!kth) {
      group = new Set();
      for (const s of walk(next, next[groupPrev])) if (s !== "nul") done.add(s);
      ptrs = [["groupPrev", groupPrev]];
      snap("end", next[groupPrev] === "nul" ? "No nodes left after groupPrev. Done." : `Fewer than ${k} nodes are left, so they stay in their original order.`);
      break;
    }
    const groupNext = next[kth];
    group = new Set(walk(next, next[groupPrev]).slice(0, k));
    ptrs = [["groupPrev", groupPrev], ["kth", kth], ["groupNext", groupNext === "nul" ? null : groupNext]];
    snap("find", `The next ${k} nodes (${[...group].map(v).join(", ")}) form a full group. Remember groupNext (${v(groupNext)}), the node after it.`);
    let prev: string | null = groupNext;
    let curr: string | null = next[groupPrev];
    while (curr !== groupNext) {
      const nxt: string | null = next[curr!];
      next[curr!] = prev;
      ops++;
      prev = curr;
      curr = nxt;
      ptrs = [["groupPrev", groupPrev], ["prev", prev], ["curr", curr === "nul" ? null : curr]];
      snap("flip", `Point ${v(prev)} at ${v(next[prev!])}. Inside the group this is Reverse Linked List, except prev starts at groupNext, so the group's new last node already links to what follows.`);
    }
    const first = next[groupPrev]!;
    next[groupPrev] = kth;
    for (const s of group) done.add(s);
    group = new Set();
    ops++;
    ptrs = [["groupPrev", first]];
    snap("link", `Link groupPrev to ${v(kth)}, the group's new first node. The old first node (${v(first)}) is now the group's last, so it becomes groupPrev for the next group.`);
    groupPrev = first;
  }
  ptrs = [];
  const out = kGroupSolve({ vals, k });
  snap("done", `Return dummy.next: ${show(out)}.`, { done: true, answer: show(out) });
  return steps;
}

export const reverseKGroup: PatternProblem<Input> = {
  id: "reverse-k-group",
  title: "Reverse Nodes in K-Group",
  difficulty: "Hard",
  blind75: false,
  slug: "reverse-nodes-in-k-group",
  video: "1UOPsfP85V4",
  statement: "Reverse the nodes of a linked list k at a time. If the number of nodes left at the end is less than k, leave them as they are. Change links, not values, using O(1) extra memory.",
  examples: [
    { label: "1→…→5, k=2", input: { vals: [1, 2, 3, 4, 5], k: 2 } },
    { label: "1→…→5, k=3", input: { vals: [1, 2, 3, 4, 5], k: 3 } },
    { label: "1→…→6, k=3", input: { vals: [1, 2, 3, 4, 5, 6], k: 3 } },
  ],
  random: (seed) => {
    const g = rngFor(seed);
    const n = g.int(1, 7);
    return { vals: Array.from({ length: n }, (_, i) => i + 1), k: g.int(1, Math.min(4, n)) };
  },
  describe: ({ vals, k }) => `head = ${vals.join(" → ")}, k = ${k}`,
  run,
  solve: (input) => show(kGroupSolve(input)),
  brute: null,
  bruteIdea: "Copy the values into an array, reverse each block of k there and write them back: O(n) time but O(n) memory, and it changes values, which the problem forbids.",
  guide: {
    title: "Reverse Nodes in K-Group",
    idea: [
      "Handle one group at a time. First check there are k nodes ahead (find the k-th one); if not, stop. Then reverse the group exactly like Reverse Linked List.",
      "The fiddly part is joining groups. Start the reversal with prev = groupNext, so the group's old first node (its new last) points onward automatically. Then point groupPrev at the old k-th node (the new first), and move groupPrev to the old first node, which sits just before the next group.",
    ],
    whenToUse: ["Reversing part of a list: Reverse Linked List II, swapping pairs (k = 2).", "A dummy node plus a “node before the section” pointer makes partial re-linking safe."],
    stages: [
      { id: "start", title: "groupPrev = dummy", detail: "", pseudo: "dummy = ListNode(0, head); group_prev = dummy" },
      { id: "find", title: "Find the k-th node", detail: "Stop if there aren't k nodes left.", pseudo: "kth = get_kth(group_prev, k)" },
      { id: "flip", title: "Reverse the group", detail: "prev starts at groupNext.", pseudo: "curr.next = prev; prev, curr = curr, nxt" },
      { id: "link", title: "Join the group back in", detail: "groupPrev → kth; groupPrev = old first.", pseudo: "group_prev.next = kth; group_prev = first" },
      { id: "end", title: "Fewer than k left", detail: "Leave them.", pseudo: "return dummy.next" },
      { id: "done", title: "Return dummy.next", detail: "", pseudo: "" },
    ],
    legend: [
      { tone: "compare", label: "Current group" },
      { tone: "found", label: "Finished" },
      { tone: "pointer", label: "Dummy node" },
    ],
    complexity: { time: "O(n)", space: "O(1)", why: "Each node is visited twice (finding the k-th, then reversing)." },
    pitfalls: ["Check for k nodes before reversing, or the short last group gets reversed too.", "Save the group's first node before linking groupPrev; it becomes the next groupPrev."],
    tryThis: ["Compare k = 3 on 5 and on 6 nodes: the last group is left alone or reversed.", "Watch the arcs: groupPrev's arrow jumps to the far end of the group."],
    python: py,
  },
};
