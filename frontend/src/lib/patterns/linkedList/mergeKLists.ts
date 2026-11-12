// Merge K Sorted Lists (NeetCode 150 · Linked List).

import py from "../../guides/python/neetcode/merge_k_lists.py?raw";
import { row, rngFor, show } from "../helpers";
import type { PatternProblem, PatternStep } from "../types";

type Input = number[][];

function mergeTwo(a: number[], b: number[], count: () => void): number[] {
  const out: number[] = [];
  let i = 0;
  let j = 0;
  while (i < a.length && j < b.length) {
    count();
    out.push(a[i] <= b[j] ? a[i++] : b[j++]);
  }
  for (; i < a.length; i++, count()) out.push(a[i]);
  for (; j < b.length; j++, count()) out.push(b[j]);
  return out;
}

function run(input: Input): PatternStep[] {
  const steps: PatternStep[] = [];
  let lists = input.map((l) => [...l]);
  let ops = 0;
  let round = 0;
  const snap = (stage: string, explanation: string, rows: PatternStep["rows"], extra: Partial<PatternStep> = {}) =>
    steps.push({ stage, explanation, rows, vars: [{ name: "lists left", value: String(lists.length) }, { name: "round", value: String(round) }], ops, ...extra });
  snap("start", `${lists.length} sorted lists. Merge them in pairs: list 0 with list 1, list 2 with list 3, and so on. Each round halves the number of lists, like merge sort.`, lists.map((l, i) => row(`list ${i}`, l)));
  if (!lists.length) {
    snap("done", "No lists: the answer is an empty list.", [], { done: true, answer: "[]" });
    return steps;
  }
  while (lists.length > 1) {
    round++;
    const merged: number[][] = [];
    for (let i = 0; i < lists.length; i += 2) {
      const a = lists[i];
      const b = lists[i + 1] ?? [];
      const m = mergeTwo(a, b, () => ops++);
      merged.push(m);
      const rows = [
        ...merged.map((l, k) => row(`round ${round} result ${k}`, l, k === merged.length - 1 ? Object.fromEntries(l.map((_, x) => [x, "found"])) : {})),
        ...lists.slice(i).map((l, k) => row(`list ${i + k}${k < 2 && (k === 0 || i + 1 < lists.length) ? " (merged)" : ""}`, l, k < 2 && (k === 0 || i + 1 < lists.length) ? Object.fromEntries(l.map((_, x) => [x, "idle"])) : {})),
      ];
      snap("merge", i + 1 < lists.length ? `Round ${round}: merge list ${i} and list ${i + 1} into ${show(m)}, the same way as Merge Two Sorted Lists.` : `Round ${round}: list ${i} has no partner, so it moves on to the next round unchanged.`, rows);
    }
    lists = merged;
  }
  snap("done", `One list left after ${round} round${round === 1 ? "" : "s"}: ${show(lists[0])}.`, [row("merged", lists[0], Object.fromEntries(lists[0].map((_, x) => [x, "found"])))], { done: true, answer: show(lists[0]) });
  return steps;
}

export const mergeKLists: PatternProblem<Input> = {
  id: "merge-k-lists",
  title: "Merge K Sorted Lists",
  difficulty: "Hard",
  blind75: true,
  slug: "merge-k-sorted-lists",
  video: "q5a5OiGbT6Q",
  statement: "Given k sorted linked lists, merge them all into one sorted list and return it.",
  examples: [
    { label: "LeetCode's example (k = 3)", input: [[1, 4, 5], [1, 3, 4], [2, 6]] },
    { label: "k = 5", input: [[2, 9], [1, 5, 8], [3], [4, 6, 7], [0, 10]] },
    { label: "with empty lists", input: [[], [1], [], [0, 2]] },
  ],
  random: (seed) => {
    const g = rngFor(seed);
    return Array.from({ length: g.int(2, 5) }, () => Array.from({ length: g.int(0, 4) }, () => g.int(0, 9)).sort((a, b) => a - b));
  },
  big: { label: "40 lists of 5 (200 nodes)", input: () => Array.from({ length: 40 }, (_, i) => Array.from({ length: 5 }, (_, j) => j * 40 + i)) },
  describe: (lists) => lists.map((l) => show(l)).join(", "),
  run,
  solve: (lists) => show(lists.flat().sort((a, b) => a - b)),
  brute: (lists) => {
    // Merge them one at a time into a growing result.
    let ops = 0;
    let acc: number[] = [];
    for (const l of lists) acc = mergeTwo(acc, l, () => ops++);
    return { answer: show(acc), ops };
  },
  bruteIdea: "Merge the lists one at a time into a growing result. The result gets re-read on every merge: O(k·N). Merging in pairs re-reads each node only log₂ k times.",
  guide: {
    title: "Merge K Sorted Lists",
    idea: [
      "Merging two sorted lists is easy (the earlier problem). Merging k one at a time is slow, because the growing result is walked again for every new list.",
      "Merge them in pairs instead, round after round: k lists become k/2, then k/4, … until one is left. Every node takes part in one merge per round, and there are log₂ k rounds: O(N log k). A min-heap of the k list heads gives the same bound.",
    ],
    whenToUse: ["Combining many sorted sources (log files, database runs): pairwise merging or a min-heap.", "Divide and conquer: split the work so each level costs O(N), with log levels."],
    stages: [
      { id: "start", title: "k sorted lists", detail: "", pseudo: "while len(lists) > 1:" },
      { id: "merge", title: "Merge pairs, one round at a time", detail: "lists[i] with lists[i + 1].", pseudo: "merged.append(merge_two(lists[i], lists[i + 1]))" },
      { id: "done", title: "One list left", detail: "", pseudo: "return lists[0]" },
    ],
    legend: [
      { tone: "found", label: "Just merged" },
      { tone: "idle", label: "Already used this round" },
    ],
    complexity: { time: "O(N log k)", space: "O(1) extra", why: "log₂ k rounds, each touching all N nodes once (re-linking nodes, not copying)." },
    pitfalls: ["An odd list out has no partner: carry it to the next round.", "Empty lists (None heads) must be handled."],
    tryThis: ["Pick “k = 5”: 5 → 3 → 2 → 1 lists.", "Compare the brute-force count with the pattern on the big input."],
    python: py,
  },
};
