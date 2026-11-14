// Longest Palindromic Substring and Palindromic Substrings (NeetCode 150 · 1-D DP).
// Both expand around every centre; they share the walk.

import longPy from "../../guides/python/neetcode/longest_palindrome.py?raw";
import countPy from "../../guides/python/neetcode/palindromic_substrings.py?raw";
import { row, rngFor } from "../helpers";
import type { PatternProblem, PatternStep } from "../types";

type Input = string;

function walk(s: string, mode: "longest" | "count"): PatternStep[] {
  const steps: PatternStep[] = [];
  let best: [number, number] = [0, -1];
  let count = 0;
  let ops = 0;
  const snap = (stage: string, explanation: string, l: number, r: number, ok: boolean | null, extra: Partial<PatternStep> = {}) =>
    steps.push({
      stage,
      explanation,
      rows: [
        row(
          "s",
          [...s],
          Object.fromEntries([...s].map((_, i) => [i, i === l || i === r ? (ok === false ? "swap" : "current") : i > l && i < r ? "pointer" : mode === "longest" && i >= best[0] && i <= best[1] ? "found" : undefined])),
          Object.fromEntries([...s].map((_, i) => [i, i === l && i === r ? "L R" : i === l ? "L" : i === r ? "R" : undefined])),
        ),
      ],
      vars:
        mode === "longest"
          ? [{ name: "longest so far", value: best[1] >= best[0] ? `“${s.slice(best[0], best[1] + 1)}” (${best[1] - best[0] + 1})` : "–", tone: "found" }]
          : [{ name: "palindromes counted", value: String(count), tone: "found" }],
      ops,
      ...extra,
    });
  snap(
    "start",
    mode === "longest"
      ? `Every palindrome has a centre: a letter (odd length) or the gap between two letters (even length). From each of the ${2 * s.length - 1} centres, expand outwards while the two ends match. Keep the longest seen.`
      : `Every palindrome has a centre: a letter (odd length) or the gap between two letters (even length). From each centre, expand outwards while the ends match; every successful expansion is one more palindromic substring.`,
    -1,
    -1,
    null,
  );
  const expand = (l: number, r: number, kind: string) => {
    while (l >= 0 && r < s.length && s[l] === s[r]) {
      ops++;
      count++;
      const len = r - l + 1;
      const better = len > best[1] - best[0] + 1;
      if (better) best = [l, r];
      snap(
        "match",
        mode === "longest"
          ? `${kind}: s[${l}] = s[${r}] = “${s[l]}”, so “${s.slice(l, r + 1)}” is a palindrome (length ${len}).${better ? " New longest!" : ""} Expand one more on each side.`
          : `${kind}: s[${l}] = s[${r}], so “${s.slice(l, r + 1)}” is a palindrome. That's ${count}. Expand one more on each side.`,
        l,
        r,
        true,
      );
      l--;
      r++;
    }
    ops++;
    if (l >= 0 && r < s.length) snap("stop", `${kind}: s[${l}] = “${s[l]}” and s[${r}] = “${s[r]}” differ, so no longer palindrome has this centre. Move to the next centre.`, l, r, false);
  };
  for (let i = 0; i < s.length; i++) {
    expand(i, i, `Centre on letter ${i}`);
    expand(i, i + 1, `Centre between ${i} and ${i + 1}`);
  }
  const ans = mode === "longest" ? `"${s.slice(best[0], best[1] + 1)}"` : String(count);
  snap("done", mode === "longest" ? `Every centre has been tried. The longest palindrome is “${s.slice(best[0], best[1] + 1)}”.` : `Every centre has been tried: ${count} palindromic substrings.`, -1, -1, null, { done: true, answer: ans });
  return steps;
}

const isPal = (t: string) => t === [...t].reverse().join("");

/** The slow way: check every substring. */
function slowAll(s: string) {
  let ops = 0;
  let best = "";
  let count = 0;
  for (let i = 0; i < s.length; i++)
    for (let j = i; j < s.length; j++) {
      const t = s.slice(i, j + 1);
      ops += t.length;
      if (isPal(t)) {
        count++;
        if (t.length > best.length) best = t;
      }
    }
  return { best, count, ops };
}

const randomS = (seed: number) => {
  const g = rngFor(seed);
  return Array.from({ length: g.int(1, 8) }, () => g.pick([..."aba"])).join("");
};
const bigS = () => Array.from({ length: 60 }, (_, i) => "abcab"[(i * 3) % 5]).join("");

export const longestPalindrome: PatternProblem<Input> = {
  id: "longest-palindrome",
  title: "Longest Palindromic Substring",
  difficulty: "Medium",
  blind75: true,
  slug: "longest-palindromic-substring",
  video: "XYQecbcd6_c",
  statement: "Return the longest substring of s that reads the same forwards and backwards. (If several are equally long, the first one found from the left is shown.)",
  examples: [
    { label: "“babad”", input: "babad" },
    { label: "“cbbd” (even length)", input: "cbbd" },
    { label: "“forgeeksskeegfor”", input: "forgeeksskeegfor" },
  ],
  random: randomS,
  big: { label: "60 letters", input: bigS },
  describe: (s) => `s = "${s}"`,
  run: (s) => walk(s, "longest"),
  solve: (s) => `"${slowAll(s).best}"`,
  brute: (s) => {
    const r = slowAll(s);
    return { answer: `"${r.best}"`, ops: r.ops };
  },
  bruteIdea: "Check every substring (about n²/2 of them) letter by letter: O(n³).",
  guide: {
    title: "Longest Palindromic Substring",
    idea: [
      "A palindrome mirrors around its centre, so grow palindromes from the middle out. There are 2n − 1 centres: each letter (odd lengths) and each gap between letters (even lengths).",
      "From a centre, move L left and R right while s[L] = s[R]. Each match is a palindrome s[L..R]; keep the longest. Each centre costs at most O(n), so O(n²) in total with O(1) memory.",
    ],
    whenToUse: ["Palindromic substrings: expand around centres (simpler than a 2-D DP table).", "Remember both odd and even centres."],
    stages: [
      { id: "start", title: "Try every centre", detail: "", pseudo: "for i in range(len(s)): expand(i, i); expand(i, i + 1)" },
      { id: "match", title: "Ends match: a palindrome; expand", detail: "", pseudo: "while l >= 0 and r < len(s) and s[l] == s[r]: if r - l + 1 > res_len: res = s[l:r+1]; l -= 1; r += 1" },
      { id: "stop", title: "Ends differ: next centre", detail: "", pseudo: "" },
      { id: "done", title: "The longest found", detail: "", pseudo: "return res" },
    ],
    legend: [
      { tone: "current", label: "L and R" },
      { tone: "pointer", label: "Inside the palindrome" },
      { tone: "swap", label: "Ends that don't match" },
      { tone: "found", label: "Longest so far" },
    ],
    complexity: { time: "O(n²)", space: "O(1)", why: "2n − 1 centres, each expanding at most n/2 times." },
    pitfalls: ["Forgetting even-length centres misses “bb” in “cbbd”.", "Check bounds before comparing letters."],
    tryThis: ["In “babad”, “bab” is found first; “aba” is just as long but not longer.", "In “forgeeksskeegfor”, the answer “geeksskeeg” has an even-length centre."],
    python: longPy,
  },
};

export const palindromicSubstrings: PatternProblem<Input> = {
  id: "palindromic-substrings",
  title: "Palindromic Substrings",
  difficulty: "Medium",
  blind75: true,
  slug: "palindromic-substrings",
  video: "4RACzI5-du8",
  statement: "Count the substrings of s that are palindromes. Substrings at different positions count separately, even if they're the same letters.",
  examples: [
    { label: "“aaa”", input: "aaa" },
    { label: "“abc”", input: "abc" },
    { label: "“abba”", input: "abba" },
  ],
  random: randomS,
  big: { label: "60 letters", input: bigS },
  describe: (s) => `s = "${s}"`,
  run: (s) => walk(s, "count"),
  solve: (s) => slowAll(s).count,
  brute: (s) => {
    const r = slowAll(s);
    return { answer: r.count, ops: r.ops };
  },
  bruteIdea: "Check every substring (about n²/2 of them) letter by letter: O(n³).",
  guide: {
    title: "Palindromic Substrings",
    idea: [
      "The same walk as Longest Palindromic Substring, counting instead of keeping the longest. Each successful expansion from a centre is exactly one palindromic substring, and every palindrome is found from its own centre exactly once.",
      "So the count is the total number of matching expansions over all 2n − 1 centres.",
    ],
    whenToUse: ["Counting palindromic substrings: expand around centres.", "A 2-D DP table (is s[i..j] a palindrome?) also works, with O(n²) memory."],
    stages: [
      { id: "start", title: "Try every centre", detail: "", pseudo: "for i in range(len(s)): res += count(i, i) + count(i, i + 1)" },
      { id: "match", title: "Ends match: one more palindrome; expand", detail: "", pseudo: "while l >= 0 and r < len(s) and s[l] == s[r]: res += 1; l -= 1; r += 1" },
      { id: "stop", title: "Ends differ: next centre", detail: "", pseudo: "" },
      { id: "done", title: "The count", detail: "", pseudo: "return res" },
    ],
    legend: [
      { tone: "current", label: "L and R" },
      { tone: "pointer", label: "Inside the palindrome" },
      { tone: "swap", label: "Ends that don't match" },
    ],
    complexity: { time: "O(n²)", space: "O(1)", why: "2n − 1 centres, each expanding at most n/2 times." },
    pitfalls: ["Every single letter counts: “abc” has 3.", "Count palindromes at different positions separately: “aaa” has 6."],
    tryThis: ["“aaa”: a, a, a, aa, aa, aaa = 6.", "“abba”: a, b, b, a, bb, abba = 6."],
    python: countPy,
  },
};
