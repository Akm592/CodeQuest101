// Copy List With Random Pointer (NeetCode 150 · Linked List).

import py from "../../guides/python/neetcode/copy_random_list.py?raw";
import { rngFor } from "../helpers";
import type { LEdge, LNode, PatternProblem, PatternStep } from "../types";

type Input = { vals: number[]; rand: (number | null)[] };
const ser = ({ vals, rand }: Input) => `[${vals.map((v, i) => `[${v}, ${rand[i] ?? "null"}]`).join(", ")}]`;

function run(input: Input): PatternStep[] {
  const { vals, rand } = input;
  const steps: PatternStep[] = [];
  const n = vals.length;
  const made = new Set<number>();
  const wired = new Set<number>();
  let at = -1;
  let ops = 0;
  const snap = (stage: string, explanation: string, extra: Partial<PatternStep> = {}) => {
    const nodes: LNode[] = [
      ...vals.map((v, i): LNode => ({ id: `o${i}`, v: String(v), row: 0, col: i, tone: i === at ? "current" : undefined, tag: i === at ? "node" : undefined })),
      ...[...made].map((i): LNode => ({ id: `c${i}`, v: `${vals[i]}′`, row: 1, col: i, tone: wired.has(i) ? "found" : "pointer" })),
    ];
    const edges: LEdge[] = [];
    vals.forEach((_, i) => {
      if (i + 1 < n) edges.push({ from: `o${i}`, to: `o${i + 1}` });
      if (rand[i] !== null) edges.push({ from: `o${i}`, to: `o${rand[i]}`, dashed: true, tone: "visited" });
    });
    for (const i of wired) {
      if (i + 1 < n) edges.push({ from: `c${i}`, to: `c${i + 1}`, tone: "found" });
      if (rand[i] !== null) edges.push({ from: `c${i}`, to: `c${rand[i]}`, dashed: true, tone: "found" });
    }
    steps.push({
      stage,
      explanation,
      rows: [],
      links: { title: "solid arrows: next · dashed arrows: random", nodes, edges, rowLabels: { 0: "original", 1: "copy" } },
      map: { title: "old node → its copy", entries: [...made].map((i) => ({ k: `${vals[i]} (#${i})`, v: `${vals[i]}′`, tone: i === at ? "current" : undefined })) },
      vars: [{ name: "copies made", value: `${made.size} / ${n}` }],
      ops,
      ...extra,
    });
  };
  snap("start", "A random pointer can point anywhere, even at a node that hasn't been copied yet. So do two passes: first make a copy of every node and remember old → copy in a hash map; then wire the copies' next and random pointers through the map.");
  for (let i = 0; i < n; i++) {
    at = i;
    made.add(i);
    ops++;
    snap("clone", `Pass 1: copy node ${vals[i]} (#${i}) and record old → copy. Its pointers stay empty for now.`);
  }
  for (let i = 0; i < n; i++) {
    at = i;
    wired.add(i);
    ops += 2;
    snap("wire", `Pass 2: copy(${vals[i]}).next = copy of its next (${i + 1 < n ? `${vals[i + 1]}′` : "None"}); copy(${vals[i]}).random = copy of its random (${rand[i] !== null ? `${vals[rand[i]!]}′` : "None"}). Both are one map lookup.`);
  }
  at = -1;
  snap("done", "Every copy is wired. The copy has the same shape but shares no nodes with the original.", { done: true, answer: ser(input) });
  return steps;
}

export const copyRandomList: PatternProblem<Input> = {
  id: "copy-random-list",
  title: "Copy List With Random Pointer",
  difficulty: "Medium",
  blind75: false,
  slug: "copy-list-with-random-pointer",
  video: "5Y2EiZST97Y",
  statement: "Each node has a next pointer and a random pointer that can point to any node or to None. Make a deep copy: new nodes with the same values, wired the same way, sharing nothing with the original.",
  examples: [
    { label: "LeetCode's example", input: { vals: [7, 13, 11, 10, 1], rand: [null, 0, 4, 2, 0] } },
    { label: "points at itself", input: { vals: [1, 2], rand: [1, 1] } },
    { label: "random points ahead", input: { vals: [3, 5, 8, 4], rand: [2, 3, null, 0] } },
  ],
  random: (seed) => {
    const g = rngFor(seed);
    const n = g.int(2, 5);
    return { vals: Array.from({ length: n }, () => g.int(1, 20)), rand: Array.from({ length: n }, () => (g.r() < 0.25 ? null : g.int(0, n - 1))) };
  },
  big: { label: "200 nodes", input: () => ({ vals: Array.from({ length: 200 }, (_, i) => i), rand: Array.from({ length: 200 }, (_, i) => (i * 7) % 200) }) },
  describe: ser,
  run,
  solve: ser,
  brute: (input) => {
    // Without a map: find where each random points by walking from the head to it.
    let ops = 0;
    for (const r of input.rand) ops += 1 + (r ?? 0);
    return { answer: ser(input), ops };
  },
  bruteIdea: "Without the map, copy the next chain first, then for each random pointer walk from the head to find its position and walk the copy the same distance: O(n²).",
  guide: {
    title: "Copy List With Random Pointer",
    idea: [
      "Copying next pointers is easy in one walk. The problem is random: it can point at a node you haven't copied yet, so you can't wire it on the first visit.",
      "So split the work. Pass 1 creates a copy of every node and stores old → copy in a hash map. Pass 2 sets copy.next = map[old.next] and copy.random = map[old.random]. Every target already exists, and each lookup is O(1).",
    ],
    whenToUse: ["Deep-copying any linked structure (lists with extra pointers, graphs): map old node → new node, then wire.", "Clone Graph in the Graphs category uses exactly this map."],
    stages: [
      { id: "start", title: "Empty map", detail: "", pseudo: "copy = {None: None}" },
      { id: "clone", title: "Pass 1: copy every node", detail: "Values only; record old → copy.", pseudo: "copy[node] = Node(node.val)" },
      { id: "wire", title: "Pass 2: wire next and random", detail: "Look both targets up in the map.", pseudo: "copy[node].next = copy[node.next]; copy[node].random = copy[node.random]" },
      { id: "done", title: "Return copy[head]", detail: "", pseudo: "return copy[head]" },
    ],
    legend: [
      { tone: "current", label: "Node being visited" },
      { tone: "pointer", label: "Copy made, not wired" },
      { tone: "found", label: "Copy wired" },
      { tone: "visited", label: "Original random pointers" },
    ],
    complexity: { time: "O(n)", space: "O(n)", why: "Two passes; the map holds one entry per node." },
    pitfalls: ["Put None → None in the map (or check for None) so nodes whose random is None work.", "Never point a copy at an original node: the copy must share nothing."],
    tryThis: ["Pick “random points ahead”: node 3's random points at 8, which isn't copied until later. That's why there are two passes.", "Pick “points at itself”."],
    python: py,
  },
};
