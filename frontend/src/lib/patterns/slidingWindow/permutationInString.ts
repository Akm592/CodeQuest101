// Permutation in String (NeetCode 150 · Sliding Window).

import py from "../../guides/python/neetcode/permutation_in_string.py?raw";
import { quote, rngFor } from "../helpers";
import type { PatternProblem, PatternStep } from "../types";
import { windowRow } from "./window";

type Input = { s1: string; s2: string };

function run({ s1, s2 }: Input): PatternStep[] {
  const steps: PatternStep[] = [];
  const m = s1.length;
  const need = new Map<string, number>();
  const have = new Map<string, number>();
  for (const c of s1) need.set(c, (need.get(c) ?? 0) + 1);
  let ops = m;
  // Letters whose count in the window differs from s1.
  const off = () => new Set([...need.keys(), ...have.keys()].filter((c) => (need.get(c) ?? 0) !== (have.get(c) ?? 0))).size;
  const snap = (stage: string, l: number, explanation: string, extra: Partial<PatternStep> = {}) => {
    const r = Math.min(l + m - 1, s2.length - 1);
    const hit = stage === "found";
    const letters = [...new Set([...need.keys(), ...have.keys()])].sort();
    steps.push({
      stage,
      explanation,
      rows: [
        windowRow("s2", [...s2], l, r, hit ? Object.fromEntries([...s2].map((_, i) => [i, i >= l && i <= r ? "found" : undefined])) : {}),
        { label: "s1", cells: [...s1].map((v) => ({ v })) },
      ],
      map: {
        title: "Letter: window count / s1 count",
        entries: letters
          .filter((c) => (need.get(c) ?? 0) + (have.get(c) ?? 0) > 0)
          .map((c) => {
            const a = have.get(c) ?? 0;
            const b = need.get(c) ?? 0;
            return { k: c, v: `${a} / ${b}`, tone: a === b ? "found" : "swap" };
          }),
      },
      vars: [
        { name: "window", value: quote(s2.slice(l, r + 1)) },
        { name: "letters that don't match", value: String(off()), tone: off() === 0 ? "found" : "swap" },
      ],
      ops,
      ...extra,
    });
  };
  if (m > s2.length) {
    snap("fill", 0, `s1 has ${m} letters but s2 only has ${s2.length}: no window of s2 is long enough.`);
    snap("none", 0, "So the answer is false.", { done: true, answer: "false" });
    return steps;
  }
  for (let i = 0; i < m; i++) have.set(s2[i], (have.get(s2[i]) ?? 0) + 1);
  ops += m;
  snap("fill", 0, `A rearrangement of s1 has exactly s1's letters, so look at every window of length ${m} in s2. Count the first window's letters and compare them with s1's counts.`);
  for (let l = 0; ; l++) {
    ops++;
    if (off() === 0) {
      snap("found", l, `Every letter count matches: “${s2.slice(l, l + m)}” is a rearrangement of “${s1}”.`, { done: true, answer: "true" });
      return steps;
    }
    if (l + m >= s2.length) break;
    const out = s2[l];
    const inc = s2[l + m];
    have.set(out, have.get(out)! - 1);
    have.set(inc, (have.get(inc) ?? 0) + 1);
    ops += 2;
    snap("slide", l + 1, `Counts differ. Slide the window one step: “${out}” leaves on the left, “${inc}” comes in on the right. Only those two counts change, so there's no need to recount.`);
  }
  snap("none", s2.length - m, `The window reached the end of s2 and never matched, so the answer is false.`, { done: true, answer: "false" });
  return steps;
}

const sortStr = (s: string) => [...s].sort().join("");

export const permutationInString: PatternProblem<Input> = {
  id: "permutation-in-string",
  title: "Permutation in String",
  difficulty: "Medium",
  blind75: false,
  slug: "permutation-in-string",
  video: "UbyhOgBN834",
  statement: "Given two lowercase strings s1 and s2, return true if some rearrangement of s1 appears in s2 as a run of consecutive letters.",
  examples: [
    { label: "ab in eidbaooo", input: { s1: "ab", s2: "eidbaooo" } },
    { label: "ab in eidboaoo", input: { s1: "ab", s2: "eidboaoo" } },
    { label: "abc in ccbbcab", input: { s1: "abc", s2: "ccbbcab" } },
  ],
  random: (seed) => {
    const g = rngFor(seed);
    const word = (n: number) => Array.from({ length: n }, () => g.pick([..."abcd"])).join("");
    const s1 = word(g.int(2, 3));
    let s2 = word(g.int(4, 10));
    if (g.r() < 0.4) {
      const at = g.int(0, s2.length);
      s2 = s2.slice(0, at) + g.shuffle([...s1]).join("") + s2.slice(at);
    }
    return { s1, s2 };
  },
  big: { label: "s1 of 20, s2 of 200", input: () => ({ s1: "abcde".repeat(4), s2: Array.from({ length: 200 }, (_, i) => "abcdf"[(i * 3) % 5]).join("") }) },
  describe: ({ s1, s2 }) => `s1 = ${quote(s1)}, s2 = ${quote(s2)}`,
  run,
  solve: ({ s1, s2 }) => {
    for (let i = 0; i + s1.length <= s2.length; i++) if (sortStr(s2.slice(i, i + s1.length)) === sortStr(s1)) return true;
    return false;
  },
  brute: ({ s1, s2 }) => {
    let ops = 0;
    const need = new Map<string, number>();
    for (const c of s1) need.set(c, (need.get(c) ?? 0) + 1);
    for (let i = 0; i + s1.length <= s2.length; i++) {
      const have = new Map<string, number>();
      for (let j = i; j < i + s1.length; j++) {
        ops++;
        have.set(s2[j], (have.get(s2[j]) ?? 0) + 1);
      }
      ops += need.size;
      if ([...need].every(([c, n]) => have.get(c) === n)) return { answer: true, ops };
    }
    return { answer: false, ops };
  },
  bruteIdea: "Recount the letters of every window from scratch: about len(s1) work for each of the len(s2) windows. (Trying every rearrangement of s1 is far worse: len(s1)! of them.)",
  guide: {
    title: "Permutation in String",
    idea: [
      "Two strings are rearrangements of each other exactly when their letter counts match. So we want a window of s2, len(s1) long, with the same counts as s1.",
      "The window has a fixed size. Sliding it one step changes just two counts: the letter that leaves and the one that arrives. NeetCode also keeps a running count of how many of the 26 letters match, so each check is O(1) too.",
    ],
    whenToUse: ["“Does any window of size k satisfy …?”: a fixed-size window. Update for the letter in and the letter out instead of recounting.", "“Anagram / permutation of a pattern inside a text”: compare counts."],
    stages: [
      { id: "fill", title: "Count s1 and the first window", detail: "Both are len(s1) letters.", pseudo: "need = count(s1); have = count(s2[:m])" },
      { id: "slide", title: "Counts differ → slide one step", detail: "One letter leaves on the left, one arrives on the right.", pseudo: "have[s2[l]] -= 1; have[s2[l + m]] += 1" },
      { id: "found", title: "All counts match → true", detail: "This window is a rearrangement of s1.", pseudo: "if matches == 26: return True" },
      { id: "none", title: "Reached the end → false", detail: "No window matched.", pseudo: "return False" },
    ],
    legend: [
      { tone: "current", label: "Window ends" },
      { tone: "pointer", label: "Inside the window" },
      { tone: "found", label: "Counts match" },
      { tone: "swap", label: "Counts differ" },
    ],
    complexity: { time: "O(n)", space: "O(26)", why: "Each slide changes two counts and updates the number of matching letters in O(1)." },
    pitfalls: [
      "If s1 is longer than s2, return false straight away.",
      "Check the last window too: the loop that slides must still compare after the final slide.",
    ],
    tryThis: ["Compare “ab in eidbaooo” with “ab in eidboaoo”: one letter moved and the answer flips.", "Press “Random”: about half the random inputs hide a rearrangement of s1 inside s2."],
    python: py,
  },
};
