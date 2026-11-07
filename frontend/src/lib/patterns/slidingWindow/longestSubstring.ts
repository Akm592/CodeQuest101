// Longest Substring Without Repeating Characters (NeetCode 150 · Sliding Window).

import py from "../../guides/python/neetcode/longest_substring.py?raw";
import { quote, rngFor } from "../helpers";
import type { PatternProblem, PatternStep } from "../types";
import { shownChar, windowRow } from "./window";

type Input = string;

function run(s: Input): PatternStep[] {
  const steps: PatternStep[] = [];
  const chars = [...s].map(shownChar);
  const seen = new Set<string>();
  let l = 0;
  let best = 0;
  let bestAt: [number, number] = [0, -1];
  let ops = 0;
  const snap = (stage: string, r: number, explanation: string, over: Record<number, "swap" | "found" | undefined> = {}, extra: Partial<PatternStep> = {}) =>
    steps.push({
      stage,
      explanation,
      rows: [stage === "done" ? windowRow("s", chars, bestAt[0], bestAt[1], Object.fromEntries(chars.map((_, i) => [i, i >= bestAt[0] && i <= bestAt[1] ? "found" : undefined]))) : windowRow("s", chars, l, r, over)],
      map: { title: "In the window (a set)", entries: [...seen].sort().map((c) => ({ k: shownChar(c), v: "✓" })) },
      vars: [
        { name: "window length", value: String(Math.max(0, r - l + 1)) },
        { name: "best", value: String(best), tone: "found" },
      ],
      ops,
      ...extra,
    });
  snap("start", -1, "The window s[L..R] will never contain a repeated character. It starts empty; R adds one character at a time.");
  for (let r = 0; r < s.length; r++) {
    const c = s[r];
    ops++;
    while (seen.has(c)) {
      snap("shrink", r - 1, `“${shownChar(c)}” is already in the window, so adding it would make a repeat. Drop “${shownChar(s[l])}” from the left and check again.`, { [r]: "swap", ...(s[l] === c ? { [l]: "swap" } : {}) });
      seen.delete(s[l]);
      l++;
      ops += 2;
    }
    seen.add(c);
    ops++;
    const len = r - l + 1;
    const improved = len > best;
    if (improved) {
      best = len;
      bestAt = [l, r];
    }
    snap("grow", r, `Add “${shownChar(c)}”. The window “${s.slice(l, r + 1)}” has no repeats, length ${len}.${improved ? " New best!" : ""}`);
  }
  snap("done", s.length - 1, best ? `Done. The longest substring without repeats is “${s.slice(bestAt[0], bestAt[1] + 1)}”, length ${best}.` : "The string is empty, so the answer is 0.", {}, { done: true, answer: String(best) });
  return steps;
}

export const longestSubstring: PatternProblem<Input> = {
  id: "longest-substring",
  title: "Longest Substring Without Repeating Characters",
  difficulty: "Medium",
  blind75: true,
  slug: "longest-substring-without-repeating-characters",
  video: "wiGpQwVHdE0",
  statement: "Given a string, return the length of the longest substring (a run of consecutive characters) in which no character appears twice.",
  examples: [
    { label: "abcabcbb", input: "abcabcbb" },
    { label: "bbbbb", input: "bbbbb" },
    { label: "pwwkew", input: "pwwkew" },
  ],
  random: (seed) => {
    const g = rngFor(seed);
    return Array.from({ length: g.int(5, 12) }, () => g.pick([..."abcde"])).join("");
  },
  big: { label: "200 characters", input: () => Array.from({ length: 200 }, (_, i) => "abcdefghijklmnopqrstuvwxyz"[(i * 7 + (i >> 4)) % 26]).join("") },
  describe: (s) => `s = ${quote(s)}`,
  run,
  solve: (s) => {
    let best = 0;
    for (let i = 0; i < s.length; i++)
      for (let j = i; j < s.length; j++) if (new Set(s.slice(i, j + 1)).size === j - i + 1) best = Math.max(best, j - i + 1);
    return best;
  },
  brute: (s) => {
    let ops = 0;
    let best = 0;
    for (let i = 0; i < s.length; i++) {
      const seen = new Set<string>();
      for (let j = i; j < s.length; j++) {
        ops++;
        if (seen.has(s[j])) break;
        seen.add(s[j]);
        best = Math.max(best, j - i + 1);
      }
    }
    return { answer: best, ops };
  },
  bruteIdea: "From every starting position, extend to the right until a character repeats. Each start re-reads characters the previous start already checked. With only 26 letters a run can't be longer than 26, which keeps the brute force from being fully n², so the gap here is smaller than on the other problems; with a bigger alphabet it grows.",
  guide: {
    title: "Longest Substring Without Repeating Characters",
    idea: [
      "Keep a window s[L..R] that has no repeats, and a set of the characters inside it. R moves right one character at a time.",
      "If the new character is already in the set, the window can't simply grow. Shrink it from the left, dropping characters, until the old copy is gone. L and R each only move right, so every character is added once and removed at most once: O(n).",
    ],
    whenToUse: ["“Longest / shortest substring or subarray such that …” where the condition can break and be repaired by dropping from the left.", "The window always stays valid; the answer is the best length seen."],
    stages: [
      { id: "start", title: "Empty window", detail: "L = 0, nothing added yet.", pseudo: "seen = set(); l = best = 0" },
      { id: "grow", title: "Add s[R]", detail: "The window is valid: record its length.", pseudo: "seen.add(c); best = max(best, r - l + 1)" },
      { id: "shrink", title: "Repeat → drop from the left", detail: "Remove s[L] and move L right until s[R] is no longer in the window.", pseudo: "while c in seen: seen.remove(s[l]); l += 1" },
      { id: "done", title: "R reached the end → best length", detail: "Every valid window ending at each R was considered.", pseudo: "return best" },
    ],
    legend: [
      { tone: "current", label: "Window ends L and R" },
      { tone: "pointer", label: "Inside the window" },
      { tone: "swap", label: "The repeat" },
      { tone: "found", label: "Longest window" },
    ],
    complexity: { time: "O(n)", space: "O(k)", why: "L and R each move right at most n times; the set holds at most k distinct characters." },
    pitfalls: [
      "Don't reset the window to empty on a repeat: you'd throw away characters after the old copy that are still fine.",
      "A faster version stores each character's last index in a map and jumps L straight past it. Make sure L never moves backwards when you do.",
    ],
    tryThis: ["Pick “pwwkew”: the second w forces L past the first w.", "Press “Random” and predict the answer before stepping."],
    python: py,
  },
};
