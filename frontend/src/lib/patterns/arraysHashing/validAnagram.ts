// Valid Anagram (NeetCode 150 · Arrays & Hashing).

import py from "../../guides/python/neetcode/valid_anagram.py?raw";
import { row, rngFor, quote } from "../helpers";
import type { PatternProblem, PatternStep } from "../types";

interface Input {
  s: string;
  t: string;
}

function run({ s, t }: Input): PatternStep[] {
  const steps: PatternStep[] = [];
  const count = new Map<string, number>();
  let ops = 1;
  const entries = (hi?: string, bad = false) =>
    [...count.entries()]
      .sort(([a], [b]) => (a < b ? -1 : 1))
      .map(([k, v]) => ({ k, v: String(v), tone: k === hi ? (bad ? ("swap" as const) : ("current" as const)) : v === 0 ? ("found" as const) : undefined }));
  const push = (stage: string, explanation: string, si: number | null, ti: number | null, hi?: string, extra: Partial<PatternStep> = {}) =>
    steps.push({
      stage,
      explanation,
      rows: [
        row("s", [...s], si === null ? {} : { [si]: "current" }, si === null ? {} : { [si]: "↑" }),
        row("t", [...t], ti === null ? {} : { [ti]: extra.answer === "false" ? "swap" : "current" }, ti === null ? {} : { [ti]: "↑" }),
      ],
      map: { title: "count (letter → how many)", entries: entries(hi, extra.answer === "false") },
      vars: [
        { name: "len(s)", value: String(s.length) },
        { name: "len(t)", value: String(t.length) },
      ],
      ops,
      ...extra,
    });

  if (s.length !== t.length) {
    push("length", `The lengths differ (${s.length} vs ${t.length}), so they can't use the same letters.`, null, null);
    push("no", "Not an anagram.", null, null, undefined, { done: true, answer: "false" });
    return steps;
  }
  push("length", `Both have ${s.length} letters, so they might be anagrams. Now count.`, null, null);
  for (let i = 0; i < s.length; i++) {
    count.set(s[i], (count.get(s[i]) ?? 0) + 1);
    ops++;
    push("countS", `Add one for “${s[i]}” from s.`, i, null, s[i]);
  }
  for (let i = 0; i < t.length; i++) {
    const c = (count.get(t[i]) ?? 0) - 1;
    count.set(t[i], c);
    ops++;
    if (c < 0) {
      push("no", `t has more “${t[i]}” than s (the count went below zero). Not an anagram.`, null, i, t[i], { done: true, answer: "false" });
      return steps;
    }
    push("countT", `Take one away for “${t[i]}” from t.`, null, i, t[i]);
  }
  push("yes", "Every count is back to 0: same letters, same amounts. It's an anagram.", null, null, undefined, { done: true, answer: "true" });
  return steps;
}

const WORDS = ["listen", "silent", "anagram", "nagaram", "rat", "car", "earth", "heart", "night", "thing", "below", "elbow", "state", "taste"];

export const validAnagram: PatternProblem<Input> = {
  id: "valid-anagram",
  title: "Valid Anagram",
  difficulty: "Easy",
  blind75: true,
  slug: "valid-anagram",
  video: "9UtInBqnCgA",
  statement: "Given two strings s and t, return true if t is an anagram of s: the same letters, each used the same number of times, possibly in a different order.",
  examples: [
    { label: "anagram / nagaram", input: { s: "anagram", t: "nagaram" } },
    { label: "rat / car", input: { s: "rat", t: "car" } },
    { label: "aacc / ccac", input: { s: "aacc", t: "ccac" } },
  ],
  random: (seed) => {
    const g = rngFor(seed);
    const s = g.pick(WORDS);
    if (g.r() < 0.5) return { s, t: g.shuffle([...s]).join("") };
    const t = [...g.shuffle([...s])];
    t[g.int(0, t.length - 1)] = g.pick([..."abcdefghij"]);
    return { s, t: t.join("") };
  },
  big: {
    label: "two 200-letter anagrams",
    input: () => {
      const g = rngFor(99);
      const s = Array.from({ length: 200 }, () => g.pick([..."abcdefghijklmnopqrstuvwxyz"])).join("");
      return { s, t: g.shuffle([...s]).join("") };
    },
  },
  describe: ({ s, t }) => `s = ${quote(s)}, t = ${quote(t)}`,
  run,
  solve: ({ s, t }) => [...s].sort().join("") === [...t].sort().join(""),
  brute: ({ s, t }) => {
    let ops = 0;
    if (s.length !== t.length) return { answer: false, ops: 1 };
    const rest = [...t];
    for (const c of s) {
      let hit = -1;
      for (let j = 0; j < rest.length; j++) {
        ops++;
        if (rest[j] === c) {
          hit = j;
          break;
        }
      }
      if (hit < 0) return { answer: false, ops };
      rest.splice(hit, 1);
    }
    return { answer: true, ops };
  },
  bruteIdea: "For each letter of s, search t for a matching letter and cross it out: about n² comparisons.",
  guide: {
    title: "Valid Anagram",
    idea: [
      "Two words are anagrams when they have the same letters in the same amounts. Order doesn't matter, so don't compare positions: count.",
      "Count up for every letter in s and down for every letter in t. If they're anagrams, every count ends at exactly 0. If a count ever drops below 0, t has a letter s doesn't have enough of.",
    ],
    whenToUse: ["“Same characters, any order”, “can one be rearranged into the other?”: compare letter counts.", "The same counting trick powers Group Anagrams and Permutation in String."],
    stages: [
      { id: "length", title: "Compare lengths", detail: "Different lengths can't be anagrams, so stop early.", pseudo: "if len(s) != len(t): return False" },
      { id: "countS", title: "Count up for s", detail: "Each letter of s adds one to its count.", pseudo: "count[c] += 1" },
      { id: "countT", title: "Count down for t", detail: "Each letter of t takes one away.", pseudo: "count[c] -= 1" },
      { id: "no", title: "Mismatch → not an anagram", detail: "A count below zero (or a length difference) proves the letters differ.", pseudo: "return False" },
      { id: "yes", title: "All counts zero → anagram", detail: "Every letter balanced out exactly.", pseudo: "return True" },
    ],
    legend: [
      { tone: "current", label: "Letter being counted" },
      { tone: "found", label: "Count balanced at 0" },
      { tone: "swap", label: "Count went negative" },
    ],
    complexity: { time: "O(n)", space: "O(1)", why: "Two passes over the strings. The count table has at most one entry per letter of the alphabet (26 for lowercase English), so its size doesn't grow with n." },
    pitfalls: [
      "Sorting both strings and comparing also works: O(n log n) time. Simple and fine to mention, but counting is faster.",
      "Forgetting the length check: “ab” vs “abc” would otherwise pass the count-down loop.",
    ],
    tryThis: ["Pick “rat / car” and watch where the count goes negative.", "Pick “aacc / ccac”: same letters, wrong amounts."],
    python: py,
  },
};
