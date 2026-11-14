// The two-string table problems of the NeetCode 150 (2-D Dynamic Programming):
// Longest Common Subsequence, Edit Distance, Distinct Subsequences,
// Interleaving String and Regular Expression Matching. Each fills a table
// indexed by positions in the two strings, from the ends back to the start.

import distinctPy from "../../guides/python/neetcode/distinct_subsequences.py?raw";
import editPy from "../../guides/python/neetcode/edit_distance_nc.py?raw";
import interleavePy from "../../guides/python/neetcode/interleaving_string.py?raw";
import lcsPy from "../../guides/python/neetcode/lcs.py?raw";
import regexPy from "../../guides/python/neetcode/regex_matching.py?raw";
import { row, rngFor } from "../helpers";
import type { PatternProblem, PatternStep } from "../types";
import { type Cell, type V, blank, counted, table } from "./table";

type Two = { a: string; b: string };

/** A step builder for a (len a + 1) × (len b + 1) table with the letters along the edges. */
function stepper(a: string, b: string, title: string, dp: V[][], extraRows: () => PatternStep["rows"] = () => []) {
  const steps: PatternStep[] = [];
  let ops = 0;
  return {
    steps,
    tick: () => ops++,
    snap: (stage: string, explanation: string, cur: Cell | null, reads: Cell[] = [], extra: Partial<PatternStep> = {}) =>
      steps.push({
        stage,
        explanation,
        rows: extraRows(),
        grid: table(title, dp, { rowHead: [...a, "∅"], colHead: [...b, "∅"], cur, reads, good: extra.done ? [[0, 0]] : [] }),
        vars: [],
        ops,
        ...extra,
      }),
  };
}

const randStr = (g: ReturnType<typeof rngFor>, lo: number, hi: number, alpha = "abc") => Array.from({ length: g.int(lo, hi) }, () => g.pick([...alpha])).join("");

// ---------------------------------------------------------------- LCS

function lcsRun({ a, b }: Two): PatternStep[] {
  const dp = blank<number>(a.length + 1, b.length + 1);
  for (let i = 0; i <= a.length; i++) dp[i][b.length] = 0;
  for (let j = 0; j <= b.length; j++) dp[a.length][j] = 0;
  const S = stepper(a, b, "lcs[i][j] = LCS of a[i:] and b[j:] (rows: a, columns: b)", dp);
  S.snap("start", "lcs[i][j] is the longest common subsequence of the rest of a from i and the rest of b from j. The last row and column (an empty rest) are 0. Fill from the bottom-right: if the letters match, take 1 + the diagonal; otherwise the better of skipping a letter from either string.", null);
  for (let i = a.length - 1; i >= 0; i--)
    for (let j = b.length - 1; j >= 0; j--) {
      S.tick();
      if (a[i] === b[j]) {
        dp[i][j] = 1 + (dp[i + 1][j + 1] as number);
        S.snap("match", `a[${i}] = b[${j}] = “${a[i]}”: use it. lcs = 1 + lcs[${i + 1}][${j + 1}] = ${dp[i][j]}.`, [i, j], [[i + 1, j + 1]]);
      } else {
        dp[i][j] = Math.max(dp[i + 1][j] as number, dp[i][j + 1] as number);
        S.snap("skip", `“${a[i]}” ≠ “${b[j]}”: skip a letter of a (${dp[i + 1][j]}) or of b (${dp[i][j + 1]}). lcs = ${dp[i][j]}.`, [i, j], [[i + 1, j], [i, j + 1]]);
      }
    }
  S.snap("done", `The longest common subsequence of “${a}” and “${b}” has length ${dp[0][0]}.`, null, [], { done: true, answer: String(dp[0][0]) });
  return S.steps;
}
const lcsSlow = counted((self: (a: string, b: string, i: number, j: number) => number, a: string, b: string, i: number, j: number): number =>
  i === a.length || j === b.length ? 0 : a[i] === b[j] ? 1 + self(a, b, i + 1, j + 1) : Math.max(self(a, b, i + 1, j), self(a, b, i, j + 1)),
);

export const lcs: PatternProblem<Two> = {
  id: "lcs",
  title: "Longest Common Subsequence",
  difficulty: "Medium",
  blind75: true,
  slug: "longest-common-subsequence",
  video: "Ua0GhsJSlWM",
  statement: "Return the length of the longest subsequence (letters in order, not necessarily next to each other) that two strings share.",
  examples: [
    { label: "abcde / ace", input: { a: "abcde", b: "ace" } },
    { label: "abc / def (none)", input: { a: "abc", b: "def" } },
    { label: "stone / longest", input: { a: "stone", b: "longest" } },
  ],
  random: (seed) => {
    const g = rngFor(seed);
    return { a: randStr(g, 1, 5), b: randStr(g, 1, 5) };
  },
  big: { label: "two 11-letter strings with no letters in common", input: () => ({ a: "abcdefghijk", b: "lmnopqrstuv" }) },
  describe: ({ a, b }) => `text1 = "${a}", text2 = "${b}"`,
  run: lcsRun,
  solve: ({ a, b }) => lcsSlow(a, b, 0, 0).answer,
  brute: ({ a, b }) => lcsSlow(a, b, 0, 0),
  bruteIdea: "Recursion with no memory: on a mismatch, try skipping a letter from each string. With no letters in common, every way of interleaving the skips is tried: about C(22, 11) ≈ 700,000 paths.",
  guide: {
    title: "Longest Common Subsequence",
    idea: [
      "Compare the first letters of the two rests. If they match, they can both be used: 1 + the answer for the rest of both. If not, one of them isn't in the common subsequence: try skipping a letter of a, and skipping a letter of b, and keep the better.",
      "Those subproblems are pairs (i, j), so a table of (len a + 1) × (len b + 1) holds every answer. Fill it from the bottom-right; the answer is lcs[0][0].",
    ],
    whenToUse: ["Comparing two sequences (diff tools, DNA alignment): a 2-D table over positions in each.", "Match → diagonal; mismatch → the better of the two neighbours."],
    stages: [
      { id: "start", title: "Empty rests are 0", detail: "", pseudo: "dp = [[0] * (len(b) + 1) for _ in range(len(a) + 1)]" },
      { id: "match", title: "Letters match → 1 + diagonal", detail: "", pseudo: "if a[i] == b[j]: dp[i][j] = 1 + dp[i + 1][j + 1]" },
      { id: "skip", title: "No match → best of skipping either", detail: "", pseudo: "else: dp[i][j] = max(dp[i][j + 1], dp[i + 1][j])" },
      { id: "done", title: "lcs[0][0]", detail: "", pseudo: "return dp[0][0]" },
    ],
    legend: [
      { tone: "current", label: "Cell being filled" },
      { tone: "compare", label: "Cells it uses" },
      { tone: "pointer", label: "The letters" },
    ],
    complexity: { time: "O(m × n)", space: "O(m × n)", why: "One cell per pair of positions, each filled in O(1)." },
    pitfalls: ["A subsequence keeps order but can skip letters; a substring can't skip.", "Size the table one bigger in each direction for the empty rests."],
    tryThis: ["abcde / ace: a, c and e line up, so 3.", "“stone / longest”: “one” is common, length 3."],
    python: lcsPy,
  },
};

// ---------------------------------------------------------------- Edit distance

function editRun({ a, b }: Two): PatternStep[] {
  const m = a.length;
  const n = b.length;
  const dp = blank<number>(m + 1, n + 1);
  for (let j = 0; j <= n; j++) dp[m][j] = n - j;
  for (let i = 0; i <= m; i++) dp[i][n] = m - i;
  const S = stepper(a, b, "ops[i][j] = edits to turn a[i:] into b[j:] (rows: a, columns: b)", dp);
  S.snap("start", "ops[i][j] is the fewest edits to turn the rest of a from i into the rest of b from j. If one rest is empty, you insert or delete the other's letters, so the last row and column count down. Fill from the bottom-right.", null);
  for (let i = m - 1; i >= 0; i--)
    for (let j = n - 1; j >= 0; j--) {
      S.tick();
      if (a[i] === b[j]) {
        dp[i][j] = dp[i + 1][j + 1];
        S.snap("match", `a[${i}] = b[${j}] = “${a[i]}”: nothing to do, ops = ops[${i + 1}][${j + 1}] = ${dp[i][j]}.`, [i, j], [[i + 1, j + 1]]);
      } else {
        const del = dp[i + 1][j]!;
        const ins = dp[i][j + 1]!;
        const rep = dp[i + 1][j + 1]!;
        dp[i][j] = 1 + Math.min(del, ins, rep);
        const which = rep <= del && rep <= ins ? "replace" : del <= ins ? "delete" : "insert";
        S.snap("edit", `“${a[i]}” ≠ “${b[j]}”: delete it (1 + ${del}), insert “${b[j]}” (1 + ${ins}) or replace it (1 + ${rep}). Cheapest: ${which}, ${dp[i][j]}.`, [i, j], [[i + 1, j], [i, j + 1], [i + 1, j + 1]]);
      }
    }
  S.snap("done", `Turning “${a}” into “${b}” takes ${dp[0][0]} edit${dp[0][0] === 1 ? "" : "s"}.`, null, [], { done: true, answer: String(dp[0][0]) });
  return S.steps;
}
const editSlow = counted((self: (a: string, b: string, i: number, j: number) => number, a: string, b: string, i: number, j: number): number => {
  if (i === a.length) return b.length - j;
  if (j === b.length) return a.length - i;
  if (a[i] === b[j]) return self(a, b, i + 1, j + 1);
  return 1 + Math.min(self(a, b, i + 1, j), self(a, b, i, j + 1), self(a, b, i + 1, j + 1));
});

export const editDistance: PatternProblem<Two> = {
  id: "edit-distance",
  title: "Edit Distance",
  difficulty: "Medium",
  blind75: false,
  slug: "edit-distance",
  video: "XYi2-LPrwm4",
  statement: "Return the fewest single-letter edits (insert, delete or replace) that turn word1 into word2.",
  examples: [
    { label: "horse → ros", input: { a: "horse", b: "ros" } },
    { label: "intention → execution", input: { a: "intention", b: "execution" } },
    { label: "abc → abc", input: { a: "abc", b: "abc" } },
  ],
  random: (seed) => {
    const g = rngFor(seed);
    return { a: randStr(g, 0, 4), b: randStr(g, 0, 4) };
  },
  big: { label: "8 letters vs 8 different letters", input: () => ({ a: "abcdefgh", b: "ijklmnop" }) },
  describe: ({ a, b }) => `word1 = "${a}", word2 = "${b}"`,
  run: editRun,
  solve: ({ a, b }) => editSlow(a, b, 0, 0).answer,
  brute: ({ a, b }) => editSlow(a, b, 0, 0),
  bruteIdea: "Recursion with no memory: on each mismatch, try all three edits. With no letters in common that's three branches at every step: hundreds of thousands of calls for 8 letters.",
  guide: {
    title: "Edit Distance",
    idea: [
      "Compare the first letters of what's left. If they match, no edit is needed: move both on. If not, one edit fixes this position: delete a's letter (a moves on), insert b's letter (b moves on) or replace (both move on). Take the cheapest plus 1.",
      "Those subproblems are pairs (i, j), so fill a table from the bottom-right. Base cases: turning an empty rest into a string of k letters (or back) costs k.",
    ],
    whenToUse: ["“Fewest changes to turn one sequence into another” (spell check, diff): a 2-D table, min over the edits.", "Each edit moves one or both pointers."],
    stages: [
      { id: "start", title: "Empty rests cost their length", detail: "", pseudo: "dp[len(a)][j] = len(b) - j; dp[i][len(b)] = len(a) - i" },
      { id: "match", title: "Letters match → diagonal", detail: "", pseudo: "if a[i] == b[j]: dp[i][j] = dp[i + 1][j + 1]" },
      { id: "edit", title: "1 + cheapest of delete, insert, replace", detail: "", pseudo: "else: dp[i][j] = 1 + min(dp[i + 1][j], dp[i][j + 1], dp[i + 1][j + 1])" },
      { id: "done", title: "ops[0][0]", detail: "", pseudo: "return dp[0][0]" },
    ],
    legend: [
      { tone: "current", label: "Cell being filled" },
      { tone: "compare", label: "Cells it uses" },
      { tone: "pointer", label: "The letters" },
    ],
    complexity: { time: "O(m × n)", space: "O(m × n)", why: "One cell per pair of positions." },
    pitfalls: ["Delete moves down (a's pointer), insert moves right (b's pointer), replace moves diagonally.", "Don't forget the base row and column."],
    tryThis: ["horse → ros: 3 (replace h with r, delete r, delete e).", "intention → execution: 5."],
    python: editPy,
  },
};

// ---------------------------------------------------------------- Distinct subsequences

function distinctRun({ a, b }: Two): PatternStep[] {
  const m = a.length;
  const n = b.length;
  const dp = blank<number>(m + 1, n + 1);
  for (let i = 0; i <= m; i++) dp[i][n] = 1;
  for (let j = 0; j < n; j++) dp[m][j] = 0;
  const S = stepper(a, b, "ways[i][j] = ways s[i:] contains t[j:] as a subsequence (rows: s, columns: t)", dp);
  S.snap("start", "ways[i][j] counts how many ways the rest of s from i contains the rest of t from j as a subsequence. An empty t is contained exactly once (last column 1); a non-empty t in an empty s, never (last row 0).", null);
  for (let i = m - 1; i >= 0; i--)
    for (let j = n - 1; j >= 0; j--) {
      S.tick();
      if (a[i] === b[j]) {
        dp[i][j] = dp[i + 1][j]! + dp[i + 1][j + 1]!;
        S.snap("match", `s[${i}] = t[${j}] = “${a[i]}”: use this letter (${dp[i + 1][j + 1]} ways) or skip it and find “${b[j]}” later (${dp[i + 1][j]}). Total ${dp[i][j]}.`, [i, j], [[i + 1, j], [i + 1, j + 1]]);
      } else {
        dp[i][j] = dp[i + 1][j];
        S.snap("skip", `s[${i}] = “${a[i]}” isn't t[${j}] = “${b[j]}”: it can't be used here, so skip it: ${dp[i][j]}.`, [i, j], [[i + 1, j]]);
      }
    }
  S.snap("done", `“${b}” appears in “${a}” as a subsequence ${dp[0][0]} way${dp[0][0] === 1 ? "" : "s"}.`, null, [], { done: true, answer: String(dp[0][0]) });
  return S.steps;
}
const distinctSlow = counted((self: (a: string, b: string, i: number, j: number) => number, a: string, b: string, i: number, j: number): number => {
  if (j === b.length) return 1;
  if (i === a.length) return 0;
  return self(a, b, i + 1, j) + (a[i] === b[j] ? self(a, b, i + 1, j + 1) : 0);
});

export const distinctSubsequences: PatternProblem<Two> = {
  id: "distinct-subsequences",
  title: "Distinct Subsequences",
  difficulty: "Hard",
  blind75: false,
  slug: "distinct-subsequences",
  video: "-RDzMJ33nx8",
  statement: "Count the ways to pick letters of s, in order, that spell t (the number of distinct subsequences of s equal to t).",
  examples: [
    { label: "rabbbit / rabbit", input: { a: "rabbbit", b: "rabbit" } },
    { label: "babgbag / bag", input: { a: "babgbag", b: "bag" } },
    { label: "abc / d (none)", input: { a: "abc", b: "d" } },
  ],
  random: (seed) => {
    const g = rngFor(seed);
    return { a: randStr(g, 1, 6, "ab"), b: randStr(g, 1, 3, "ab") };
  },
  big: { label: "22 a's, looking for “aaaaab”", input: () => ({ a: "a".repeat(22), b: "aaaaab" }) },
  describe: ({ a, b }) => `s = "${a}", t = "${b}"`,
  run: distinctRun,
  solve: ({ a, b }) => distinctSlow(a, b, 0, 0).answer,
  brute: ({ a, b }) => distinctSlow(a, b, 0, 0),
  bruteIdea: "Recursion with no memory: at each letter of s, try using it and skipping it. On a long run of the same letter, the same (i, j) pairs are reached in huge numbers of ways.",
  guide: {
    title: "Distinct Subsequences",
    idea: [
      "Walk through s. Each letter can be skipped; if it equals the next letter of t, it can also be used. So ways(i, j) = ways(i + 1, j), plus ways(i + 1, j + 1) when s[i] = t[j].",
      "Base cases: t used up → 1 way; s used up with t left → 0. Fill the table from the bottom-right.",
    ],
    whenToUse: ["Counting the ways one sequence embeds in another: skip-or-use, summed.", "Like LCS, but adding counts instead of taking a max."],
    stages: [
      { id: "start", title: "Base cases", detail: "", pseudo: "if j == len(t): return 1; if i == len(s): return 0" },
      { id: "match", title: "Same letter: use it + skip it", detail: "", pseudo: "if s[i] == t[j]: res = dfs(i + 1, j + 1) + dfs(i + 1, j)" },
      { id: "skip", title: "Different: skip it", detail: "", pseudo: "else: res = dfs(i + 1, j)" },
      { id: "done", title: "ways[0][0]", detail: "", pseudo: "return dfs(0, 0)" },
    ],
    legend: [
      { tone: "current", label: "Cell being filled" },
      { tone: "compare", label: "Cells it adds" },
      { tone: "pointer", label: "The letters" },
    ],
    complexity: { time: "O(m × n)", space: "O(m × n)", why: "One cell per pair of positions." },
    pitfalls: ["When the letters match, you still add the skip option.", "Counts can be large; LeetCode's answer fits in 32 bits."],
    tryThis: ["rabbbit / rabbit: 3, one per b that's left out.", "babgbag / bag: 5."],
    python: distinctPy,
  },
};

// ---------------------------------------------------------------- Interleaving string

type Three = { a: string; b: string; c: string };

function interleaveRun({ a, b, c }: Three): PatternStep[] {
  const m = a.length;
  const n = b.length;
  const dp = blank<boolean>(m + 1, n + 1);
  let at = -1;
  const S = stepper(a, b, "ok[i][j] = can s3[i+j:] be made from s1[i:] and s2[j:]? (rows: s1, columns: s2)", dp, () => [row("s3", [...c], at >= 0 ? { [at]: "current" } : {})]);
  if (m + n !== c.length) {
    S.snap("start", `s1 and s2 have ${m + n} letters between them, but s3 has ${c.length}: it can't be an interleaving. Return false.`, null);
    S.snap("done", "The lengths don't add up: false.", null, [], { done: true, answer: "false" });
    return S.steps;
  }
  dp[m][n] = true;
  S.snap("start", "ok[i][j] asks whether the rest of s3 (from i + j) can be built by taking letters from the rest of s1 (from i) and s2 (from j), keeping each one's order. Both used up: true. Fill from the bottom-right.", [m, n]);
  for (let i = m; i >= 0; i--)
    for (let j = n; j >= 0; j--) {
      if (i === m && j === n) continue;
      S.tick();
      at = i + j;
      const fromA = i < m && a[i] === c[i + j] && dp[i + 1][j] === true;
      const fromB = j < n && b[j] === c[i + j] && dp[i][j + 1] === true;
      dp[i][j] = fromA || fromB;
      const reads: Cell[] = [...(i < m ? [[i + 1, j] as Cell] : []), ...(j < n ? [[i, j + 1] as Cell] : [])];
      S.snap(
        "fill",
        fromA
          ? `s3[${i + j}] = “${c[i + j]}” can come from s1[${i}], and ok[${i + 1}][${j}] is true: ok[${i}][${j}] = true.`
          : fromB
            ? `s3[${i + j}] = “${c[i + j]}” can come from s2[${j}], and ok[${i}][${j + 1}] is true: ok[${i}][${j}] = true.`
            : `s3[${i + j}] = “${c[i + j]}” can't come from s1${i < m ? ` (“${a[i]}”)` : ""} or s2${j < n ? ` (“${b[j]}”)` : ""} in a way that works out: false.`,
        [i, j],
        reads,
      );
    }
  at = -1;
  S.snap("done", dp[0][0] ? `ok[0][0] is true: s3 is an interleaving of s1 and s2.` : `ok[0][0] is false: s3 isn't an interleaving of s1 and s2.`, null, [], { done: true, answer: String(dp[0][0]) });
  return S.steps;
}
const interleaveSlow = counted((self: (t: Three, i: number, j: number) => boolean, t: Three, i: number, j: number): boolean => {
  if (i === t.a.length && j === t.b.length) return true;
  return (i < t.a.length && t.a[i] === t.c[i + j] && self(t, i + 1, j)) || (j < t.b.length && t.b[j] === t.c[i + j] && self(t, i, j + 1));
});

export const interleavingString: PatternProblem<Three> = {
  id: "interleaving-string",
  title: "Interleaving String",
  difficulty: "Medium",
  blind75: false,
  slug: "interleaving-string",
  video: "3Rw3p9LrgvE",
  statement: "Return true if s3 can be formed by interleaving s1 and s2: using all their letters, each string's letters kept in their own order.",
  examples: [
    { label: "LeetCode's example 1", input: { a: "aabcc", b: "dbbca", c: "aadbbcbcac" } },
    { label: "LeetCode's example 2 (false)", input: { a: "aabcc", b: "dbbca", c: "aadbbbaccc" } },
    { label: "ab + cd = acbd", input: { a: "ab", b: "cd", c: "acbd" } },
  ],
  random: (seed) => {
    const g = rngFor(seed);
    const a = randStr(g, 0, 3, "ab");
    const b = randStr(g, 0, 3, "ab");
    // Usually a real interleaving, sometimes shuffled or one letter off.
    let i = 0;
    let j = 0;
    let c = "";
    while (i < a.length || j < b.length) c += (j >= b.length || (i < a.length && g.r() < 0.5) ? a[i++] : b[j++]);
    if (g.r() < 0.35 && c.length) c = g.shuffle([...c]).join("");
    return { a, b, c };
  },
  big: { label: "ten a's + nine a's and a b, s3 = twenty a's", input: () => ({ a: "a".repeat(10), b: "a".repeat(9) + "b", c: "a".repeat(20) }) },
  describe: ({ a, b, c }) => `s1 = "${a}", s2 = "${b}", s3 = "${c}"`,
  run: interleaveRun,
  solve: (t) => (t.a.length + t.b.length === t.c.length ? interleaveSlow(t, 0, 0).answer : false),
  brute: (t) => (t.a.length + t.b.length === t.c.length ? interleaveSlow(t, 0, 0) : { answer: false, ops: 1 }),
  bruteIdea: "Recursion with no memory: whenever both strings could supply the next letter, try both. With long runs of the same letter, the same (i, j) pairs are re-explored over and over.",
  guide: {
    title: "Interleaving String",
    idea: [
      "The state is (i, j): how much of s1 and s2 has been used. Then s3's next letter is s3[i + j], and it must come from s1[i] or s2[j]. ok(i, j) is true if either choice matches and leads to a true state.",
      "Fill the table from the bottom-right, with ok(len1, len2) = true. Check first that the lengths add up.",
    ],
    whenToUse: ["Merging two sequences while keeping each one's order: a table over how much of each is used.", "Boolean DP: OR over the choices."],
    stages: [
      { id: "start", title: "Both used up → true", detail: "", pseudo: "if len(s1) + len(s2) != len(s3): return False; dp[len(s1)][len(s2)] = True" },
      { id: "fill", title: "s3's next letter from s1 or s2?", detail: "", pseudo: "dp[i][j] = (s1[i] == s3[i+j] and dp[i+1][j]) or (s2[j] == s3[i+j] and dp[i][j+1])" },
      { id: "done", title: "ok[0][0]", detail: "", pseudo: "return dp[0][0]" },
    ],
    legend: [
      { tone: "current", label: "Cell being filled / s3's letter" },
      { tone: "compare", label: "Cells it uses" },
      { tone: "pointer", label: "The letters" },
    ],
    complexity: { time: "O(m × n)", space: "O(m × n)", why: "One cell per (i, j)." },
    pitfalls: ["Greedy (take from s1 whenever it matches) fails when both match.", "Check the total length first."],
    tryThis: ["In example 1, s3 = aa·dbbc·bc·a·c works.", "“ab + cd = acbd”: a, c, b, d alternate."],
    python: interleavePy,
  },
};

// ---------------------------------------------------------------- Regular expression matching

function regexRun({ a: s, b: p }: Two): PatternStep[] {
  const m = s.length;
  const n = p.length;
  const dp = blank<boolean>(m + 1, n + 1);
  dp[m][n] = true;
  for (let i = 0; i < m; i++) dp[i][n] = false;
  const S = stepper(s, p, "match[i][j] = does s[i:] match p[j:]? (rows: s, columns: p)", dp);
  S.snap("start", "match[i][j] asks whether the rest of s from i matches the rest of the pattern from j. Both empty: true; pattern empty but s isn't: false. “.” matches any letter; “x*” matches zero or more x's. Fill from the bottom-right, column by column.", [m, n]);
  for (let j = n - 1; j >= 0; j--)
    for (let i = m; i >= 0; i--) {
      S.tick();
      if (p[j] === "*") {
        dp[i][j] = null;
        continue; // a star is handled together with the letter before it
      }
      const first = i < m && (p[j] === s[i] || p[j] === ".");
      if (j + 1 < n && p[j + 1] === "*") {
        const zero = dp[i][j + 2] === true;
        const more = first && dp[i + 1][j] === true;
        dp[i][j] = zero || more;
        S.snap("star", `“${p[j]}*”: use it zero times (match[${i}][${j + 2}] = ${zero ? "T" : "F"})${i < m ? `, or, since “${s[i]}” ${first ? "matches" : "doesn't match"} “${p[j]}”, use it once more (match[${i + 1}][${j}] = ${first ? (dp[i + 1][j] ? "T" : "F") : "no"})` : ""}. ${dp[i][j] ? "True" : "False"}.`, [i, j], [[i, j + 2], ...(i < m ? [[i + 1, j] as Cell] : [])]);
      } else {
        dp[i][j] = first && dp[i + 1][j + 1] === true;
        S.snap("single", i < m ? `“${s[i]}” ${first ? "matches" : "doesn't match"} “${p[j]}”${first ? `, so take the diagonal match[${i + 1}][${j + 1}]` : ""}: ${dp[i][j] ? "true" : "false"}.` : `s is used up, but “${p[j]}” still needs a letter: false.`, [i, j], i < m ? [[i + 1, j + 1]] : []);
      }
    }
  S.snap("done", dp[0][0] ? `match[0][0] is true: “${s}” matches “${p}”.` : `match[0][0] is false: “${s}” doesn't match “${p}”.`, null, [], { done: true, answer: String(dp[0][0]) });
  return S.steps;
}
const regexSlow = counted((self: (s: string, p: string, i: number, j: number) => boolean, s: string, p: string, i: number, j: number): boolean => {
  if (j === p.length) return i === s.length;
  const first = i < s.length && (p[j] === s[i] || p[j] === ".");
  if (j + 1 < p.length && p[j + 1] === "*") return self(s, p, i, j + 2) || (first && self(s, p, i + 1, j));
  return first && self(s, p, i + 1, j + 1);
});

export const regexMatching: PatternProblem<Two> = {
  id: "regex-matching",
  title: "Regular Expression Matching",
  difficulty: "Hard",
  blind75: false,
  slug: "regular-expression-matching",
  video: "HAA8mgxlov8",
  statement: "Does the pattern p match the whole string s? “.” matches any single letter and “x*” matches zero or more of the letter x.",
  examples: [
    { label: "aab / c*a*b", input: { a: "aab", b: "c*a*b" } },
    { label: "ab / .*", input: { a: "ab", b: ".*" } },
    { label: "aa / a (false)", input: { a: "aa", b: "a" } },
  ],
  random: (seed) => {
    const g = rngFor(seed);
    const s = randStr(g, 0, 4, "ab");
    const p = Array.from({ length: g.int(1, 3) }, () => g.pick(["a", "b", ".", "a*", "b*", ".*"])).join("");
    return { a: s, b: p };
  },
  big: { label: "14 a's vs a*a*a*a*a*b", input: () => ({ a: "a".repeat(14), b: "a*a*a*a*a*b" }) },
  describe: ({ a, b }) => `s = "${a}", p = "${b}"`,
  run: regexRun,
  solve: ({ a, b }) => regexSlow(a, b, 0, 0).answer,
  brute: ({ a, b }) => regexSlow(a, b, 0, 0),
  bruteIdea: "Recursion with no memory: each “x*” tries matching zero letters and one more letter. Several stars in a row split the same letters in every possible way before failing.",
  guide: {
    title: "Regular Expression Matching",
    idea: [
      "Match from the front. If the next pattern piece is a plain letter or “.”, it must match s's next letter, and both move on. If it's “x*”, either skip it entirely (zero x's), or, if s's next letter matches x, eat that letter and stay on “x*” (one more).",
      "The states are pairs (i, j), so a table (or memo) makes each one O(1). NeetCode writes it top-down with a cache; the table here is the same thing filled bottom-up.",
    ],
    whenToUse: ["Pattern matching with wildcards and repetition: DP over (position in text, position in pattern).", "Wildcard Matching is the same idea with “?” and “*”."],
    stages: [
      { id: "start", title: "Both empty → true", detail: "", pseudo: "if j >= len(p): return i >= len(s)" },
      { id: "star", title: "x*: zero of them, or one more", detail: "", pseudo: "if j + 1 < len(p) and p[j + 1] == '*': return dfs(i, j + 2) or (match and dfs(i + 1, j))" },
      { id: "single", title: "A letter or “.”: match and move on", detail: "", pseudo: "return match and dfs(i + 1, j + 1)" },
      { id: "done", title: "match[0][0]", detail: "", pseudo: "return dfs(0, 0)" },
    ],
    legend: [
      { tone: "current", label: "Cell being filled" },
      { tone: "compare", label: "Cells it uses" },
      { tone: "pointer", label: "The letters / pattern" },
    ],
    complexity: { time: "O(m × n)", space: "O(m × n)", why: "One cell per pair of positions, each O(1)." },
    pitfalls: ["“*” always goes with the letter before it; the star's own column stays blank.", "The match must cover the whole string, not a prefix."],
    tryThis: ["aab / c*a*b: c* matches nothing, a* matches “aa”.", "ab / .*: “.*” matches anything."],
    python: regexPy,
  },
};
