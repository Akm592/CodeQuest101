// Last Stone Weight (NeetCode 150 · Heap / Priority Queue).

import py from "../../guides/python/neetcode/last_stone_weight.py?raw";
import { rngFor, show } from "../helpers";
import type { PatternProblem, PatternStep } from "../types";
import { Heap, heapNodes, heapRow, pathEdge, pathTone } from "./heap";

type Input = number[];

function run(stones: Input): PatternStep[] {
  const steps: PatternStep[] = [];
  const h = new Heap("max");
  const smashed: string[] = [];
  let ops = 0;
  const snap = (stage: string, explanation: string, tone: (i: number) => ReturnType<ReturnType<typeof pathTone>> = () => undefined, edge = tone, extra: Partial<PatternStep> = {}) =>
    steps.push({
      stage,
      explanation,
      rows: [heapRow("max-heap array", h, tone)],
      tree: { title: "the max-heap: the heaviest stone is on top", nodes: heapNodes(h, { tone, edge }) },
      vars: [
        { name: "stones left", value: String(h.size) },
        { name: "smashes", value: smashed.length ? smashed.join(", ") : "–" },
      ],
      ops: h.ops + ops,
      ...extra,
    });
  for (const s of stones) h.push({ key: s });
  snap("start", `Put all ${stones.length} stones in a max-heap, so the two heaviest are always the top and one of its children. Each turn smashes those two.`, (i) => (i === 0 ? "found" : undefined));
  while (h.size > 1) {
    const { top: a, path: p1 } = h.pop();
    const { top: b, path: p2 } = h.pop();
    ops++;
    const left = a.key - b.key;
    smashed.push(`${a.key}−${b.key}`);
    const on = [...new Set([...p1, ...p2])];
    if (left > 0) {
      const up = h.push({ key: left });
      snap("smash", `Pop the two heaviest, ${a.key} and ${b.key}, and smash them. They differ, so a stone of ${a.key} − ${b.key} = ${left} goes back in and swaps up to its place.`, pathTone(up), pathEdge(up));
    } else snap("gone", `Pop the two heaviest, ${a.key} and ${b.key}. They weigh the same, so both are destroyed; nothing goes back.`, pathTone(on, -1), pathEdge(on));
  }
  const ans = h.size ? h.peek()!.key : 0;
  snap("done", h.size ? `One stone is left, weighing ${ans}.` : "No stones are left, so the answer is 0.", (i) => (i === 0 ? "found" : undefined), () => undefined, { done: true, answer: String(ans) });
  return steps;
}

/** The slow way: scan the list for the two heaviest every turn. */
function slow(stones: Input) {
  const s = [...stones];
  let ops = 0;
  const takeMax = () => {
    let m = 0;
    for (let i = 1; i < s.length; i++) {
      ops++;
      if (s[i] > s[m]) m = i;
    }
    return s.splice(m, 1)[0];
  };
  while (s.length > 1) {
    const a = takeMax();
    const b = takeMax();
    if (a !== b) s.push(a - b);
  }
  return { answer: s[0] ?? 0, ops };
}

export const lastStoneWeight: PatternProblem<Input> = {
  id: "last-stone-weight",
  title: "Last Stone Weight",
  difficulty: "Easy",
  blind75: false,
  slug: "last-stone-weight",
  video: "B-QCq79-Vfw",
  statement: "Each turn, smash the two heaviest stones. Equal stones are both destroyed; otherwise the lighter is destroyed and the heavier loses that much weight. Return the weight of the last stone, or 0 if none are left.",
  examples: [
    { label: "LeetCode's example", input: [2, 7, 4, 1, 8, 1] },
    { label: "all destroyed", input: [3, 5, 5, 3, 6, 6] },
    { label: "one stone", input: [9] },
  ],
  random: (seed) => {
    const g = rngFor(seed);
    return Array.from({ length: g.int(1, 8) }, () => g.int(1, 12));
  },
  big: { label: "200 stones", input: () => Array.from({ length: 200 }, (_, i) => ((i * 7919) % 997) + 1) },
  describe: (s) => `stones = ${show(s)}`,
  run,
  solve: (s) => slow(s).answer,
  brute: slow,
  bruteIdea: "Scan the whole list for the heaviest stone, twice, every turn: O(n) per turn and up to n turns, so O(n²).",
  guide: {
    title: "Last Stone Weight",
    idea: [
      "Every turn needs the two heaviest stones, and the leftover stone goes back into the pile. A max-heap gives the heaviest in O(log n) and takes the leftover back in O(log n).",
      "Python's heapq is a min-heap, so store negated weights: the most negative is the heaviest.",
    ],
    whenToUse: ["Repeatedly take the largest (or smallest) items and put results back: a heap.", "Simulations where the “best” item changes after each move."],
    stages: [
      { id: "start", title: "Heapify every stone", detail: "", pseudo: "stones = [-s for s in stones]; heapify(stones)" },
      { id: "smash", title: "Pop two, push the difference", detail: "", pseudo: "heappush(stones, -(first - second))" },
      { id: "gone", title: "Equal stones: push nothing", detail: "", pseudo: "if first == second: continue" },
      { id: "done", title: "One stone or none left", detail: "", pseudo: "return -stones[0] if stones else 0" },
    ],
    legend: [
      { tone: "found", label: "Heaviest stone" },
      { tone: "current", label: "Where the leftover stone settled" },
      { tone: "swap", label: "Path it moved along" },
    ],
    complexity: { time: "O(n log n)", space: "O(n)", why: "Up to n turns, each with a few O(log n) heap operations." },
    pitfalls: ["Remember to negate the leftover too when pushing it back.", "Return 0 when the heap ends up empty."],
    tryThis: ["In “all destroyed”, every pair is equal and the heap empties.", "In LeetCode's example, count the turns: 8−7, 4−2, 2−1, 1−1."],
    python: py,
  },
};
