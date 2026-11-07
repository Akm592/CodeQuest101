// Longest Repeating Character Replacement (NeetCode 150 · Sliding Window).

import py from "../../guides/python/neetcode/character_replacement.py?raw";
import { quote, rngFor } from "../helpers";
import type { PatternProblem, PatternStep } from "../types";
import { windowRow } from "./window";

type Input = { s: string; k: number };

function run({ s, k }: Input): PatternStep[] {
  const steps: PatternStep[] = [];
  const chars = [...s];
  const count = new Map<string, number>();
  let l = 0;
  let maxf = 0;
  let best = 0;
  let bestAt: [number, number] = [0, -1];
  let ops = 0;
  const realMax = () => Math.max(0, ...count.values());
  const snap = (stage: string, r: number, explanation: string, extra: Partial<PatternStep> = {}) => {
    const len = Math.max(0, r - l + 1);
    const done = stage === "done";
    steps.push({
      stage,
      explanation,
      rows: [done ? windowRow("s", chars, bestAt[0], bestAt[1], Object.fromEntries(chars.map((_, i) => [i, i >= bestAt[0] && i <= bestAt[1] ? "found" : undefined]))) : windowRow("s", chars, l, r, stage === "shrink" ? { [l]: "swap" } : {})],
      map: { title: "Letter counts in the window", entries: [...count.entries()].filter(([, n]) => n > 0).sort().map(([c, n]) => ({ k: c, v: String(n), tone: n === realMax() ? "found" : undefined })) },
      vars: [
        { name: "window length", value: String(len) },
        { name: "maxf (highest count seen)", value: String(maxf) },
        { name: "to change = length − maxf", value: String(Math.max(0, len - maxf)), tone: len - maxf > k ? "swap" : "pointer" },
        { name: "k", value: String(k) },
        { name: "best", value: String(best), tone: "found" },
      ],
      ops,
      ...extra,
    });
  };
  snap("start", -1, `Keep a window where every letter can be made the same with at most k = ${k} changes. The cheapest choice is to keep the most common letter and change the rest, so changes needed = length − maxf.`);
  for (let r = 0; r < s.length; r++) {
    const c = s[r];
    count.set(c, (count.get(c) ?? 0) + 1);
    maxf = Math.max(maxf, count.get(c)!);
    ops += 2;
    if (r - l + 1 - maxf > k) {
      snap("shrink", r, `Adding “${c}” makes the window “${s.slice(l, r + 1)}” need ${r - l + 1 - realMax()} changes, more than k = ${k}. Drop “${s[l]}” from the left.`);
      count.set(s[l], count.get(s[l])! - 1);
      l++;
      ops++;
    }
    const len = r - l + 1;
    const improved = len > best;
    if (improved) {
      best = len;
      bestAt = [l, r];
    }
    const real = realMax();
    snap(
      "grow",
      r,
      real < maxf
        ? `Window “${s.slice(l, r + 1)}”, length ${len}. Its top letter count is really ${real}, but maxf stays ${maxf} from an earlier window. That's safe: to beat best = ${best}, a window needs a letter more than ${maxf} times, so a smaller count can't change the answer. The window just slides along at length ${len}.`
        : `Window “${s.slice(l, r + 1)}”: length ${len}, the most common letter appears ${maxf} times, so ${len - maxf} change${len - maxf === 1 ? "" : "s"} ≤ k.${improved ? " New best!" : ""}`,
    );
  }
  const win = s.slice(bestAt[0], bestAt[1] + 1);
  const most = mostCommon(win);
  const changes = [...win].filter((c) => c !== most).length;
  snap("done", s.length - 1, `Done. The longest window is “${win}”, length ${best}: change ${changes === 1 ? "1 letter" : `${changes} letters`} to “${most}” and it's all one letter.`, { done: true, answer: String(best) });
  return steps;
}

function mostCommon(w: string): string {
  let most = "";
  let n = 0;
  for (const c of new Set(w)) {
    const m = [...w].filter((d) => d === c).length;
    if (m > n) [most, n] = [c, m];
  }
  return most;
}

export function replacementSolve({ s, k }: Input): number {
  let best = 0;
  for (let i = 0; i < s.length; i++)
    for (let j = i; j < s.length; j++) {
      const sub = s.slice(i, j + 1);
      const most = Math.max(...[...new Set(sub)].map((c) => [...sub].filter((d) => d === c).length));
      if (sub.length - most <= k) best = Math.max(best, sub.length);
    }
  return best;
}

export const characterReplacement: PatternProblem<Input> = {
  id: "character-replacement",
  title: "Longest Repeating Character Replacement",
  difficulty: "Medium",
  blind75: true,
  slug: "longest-repeating-character-replacement",
  video: "gqXU1UyA8pk",
  statement: "Given an uppercase string s and a number k, you may change up to k characters to any other letter. Return the length of the longest substring that can be made all one letter.",
  examples: [
    { label: "ABAB, k=2", input: { s: "ABAB", k: 2 } },
    { label: "AABABBA, k=1", input: { s: "AABABBA", k: 1 } },
    { label: "ABBCBBAB, k=2", input: { s: "ABBCBBAB", k: 2 } },
  ],
  random: (seed) => {
    const g = rngFor(seed);
    return { s: Array.from({ length: g.int(4, 12) }, () => g.pick([..."ABC"])).join(""), k: g.int(0, 2) };
  },
  big: { label: "200 letters, k = 3", input: () => ({ s: Array.from({ length: 200 }, (_, i) => "ABCD"[(i * i + 3 * i) % 7 % 4]).join(""), k: 3 }) },
  describe: ({ s, k }) => `s = ${quote(s)}, k = ${k}`,
  run,
  solve: replacementSolve,
  brute: ({ s, k }) => {
    let ops = 0;
    let best = 0;
    for (let i = 0; i < s.length; i++) {
      const count = new Map<string, number>();
      let most = 0;
      for (let j = i; j < s.length; j++) {
        ops++;
        count.set(s[j], (count.get(s[j]) ?? 0) + 1);
        most = Math.max(most, count.get(s[j])!);
        if (j - i + 1 - most <= k) best = Math.max(best, j - i + 1);
      }
    }
    return { answer: best, ops };
  },
  bruteIdea: "Check every substring: count its letters and see if length − most common ≤ k. Even counting incrementally, that's about n²/2 substrings.",
  guide: {
    title: "Longest Repeating Character Replacement",
    idea: [
      "In any window, the fewest changes needed is length − (count of its most common letter): keep that letter, change everything else. The window is fine while that's ≤ k.",
      "Grow the window with R. When it needs more than k changes, drop one letter from the left. NeetCode's trick: maxf never has to go down. A window only beats the best if its most common letter is more frequent than before, so a stale maxf can't produce a wrong answer, just a window that slides instead of shrinking.",
    ],
    whenToUse: ["“Longest substring where at most k things are wrong”: count inside the window, shrink when the budget is broken.", "A window that only ever grows or slides (never shrinks below the best) is enough when you want the longest."],
    stages: [
      { id: "start", title: "Empty window", detail: "Counts are all zero.", pseudo: "count = {}; l = maxf = best = 0" },
      { id: "grow", title: "Add s[R], record the length", detail: "Changes needed = length − maxf ≤ k: valid.", pseudo: "count[c] += 1; maxf = max(maxf, count[c])" },
      { id: "shrink", title: "Too many changes → drop s[L]", detail: "length − maxf > k: remove the leftmost letter.", pseudo: "while (r - l + 1) - maxf > k: count[s[l]] -= 1; l += 1" },
      { id: "done", title: "R reached the end → best length", detail: "The longest valid window seen.", pseudo: "return best" },
    ],
    legend: [
      { tone: "current", label: "Window ends L and R" },
      { tone: "pointer", label: "Inside the window" },
      { tone: "swap", label: "Letter being dropped" },
      { tone: "found", label: "Longest window / most common letter" },
    ],
    complexity: { time: "O(n)", space: "O(26)", why: "Each letter enters and leaves the window at most once, and the counts hold at most 26 letters." },
    pitfalls: [
      "Changes needed is length − maxf, not the number of letters different from s[L].",
      "Recomputing max(count.values()) each step is also fine (26 letters), and easier to explain. The stale-maxf version is a small speed-up.",
    ],
    tryThis: ["Pick “AABABBA, k=1”: the window slides rather than shrinks once it's at its best length.", "Change nothing, press “Random” a few times and watch when the drop step happens."],
    python: py,
  },
};
