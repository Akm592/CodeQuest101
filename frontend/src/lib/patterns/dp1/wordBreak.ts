// Word Break (NeetCode 150 · 1-D Dynamic Programming).

import py from "../../guides/python/neetcode/word_break.py?raw";
import { row, rngFor } from "../helpers";
import type { PatternProblem, PatternStep } from "../types";
import { dpRow } from "./dp";

type Input = { s: string; words: string[] };

function run({ s, words }: Input): PatternStep[] {
  const n = s.length;
  const steps: PatternStep[] = [];
  const dp: (string | null)[] = Array(n + 1).fill(null);
  let span: [number, number] = [-1, -1];
  let ops = 0;
  const snap = (stage: string, explanation: string, cur?: number, reads: number[] = [], extra: Partial<PatternStep> = {}) =>
    steps.push({
      stage,
      explanation,
      rows: [
        row("s", [...s], Object.fromEntries([...s].map((_, i) => [i, i >= span[0] && i < span[1] ? "current" : undefined]))),
        dpRow("ok[i] = can s[i:] be split into words?", dp, { cur, reads, tone: (i) => (i === cur ? "current" : reads.includes(i) ? "compare" : dp[i] === "T" ? "found" : dp[i] === "F" ? "idle" : undefined), tag: (i) => (i === n ? "end" : String(i)) }),
      ],
      vars: [{ name: "words", value: words.join(", ") }],
      ops,
      ...extra,
    });
  snap("start", "Work from the end. ok[i] is true when the rest of the string from i can be split into dictionary words: some word matches at i, and ok is true just after it.");
  dp[n] = "T";
  snap("base", "ok[end] = true: an empty rest needs no words.", n);
  for (let i = n - 1; i >= 0; i--) {
    let hit: string | null = null;
    for (const w of words) {
      ops += w.length;
      if (s.startsWith(w, i) && dp[i + w.length] === "T") {
        hit = w;
        break;
      }
    }
    dp[i] = hit ? "T" : "F";
    span = hit ? [i, i + hit.length] : [-1, -1];
    snap(
      "fill",
      hit ? `At ${i}, “${hit}” matches s[${i}:${i + hit.length}] and ok[${i + hit.length}] is true: ok[${i}] = true.` : `At ${i}, no word both matches here and leads to a true ok: ok[${i}] = false.`,
      i,
      hit ? [i + hit.length] : [],
    );
  }
  span = [-1, -1];
  snap("done", dp[0] === "T" ? `ok[0] is true: “${s}” can be split into dictionary words.` : `ok[0] is false: “${s}” can't be split into dictionary words.`, undefined, [], { done: true, answer: String(dp[0] === "T") });
  return steps;
}

/** The slow way: recursion with no memory, trying every word at every position. */
function slow({ s, words }: Input) {
  let ops = 0;
  const go = (i: number): boolean => {
    if (i === s.length) return true;
    for (const w of words) {
      ops += w.length;
      if (s.startsWith(w, i) && go(i + w.length)) return true;
    }
    return false;
  };
  return { answer: go(0), ops };
}

export const wordBreak: PatternProblem<Input> = {
  id: "word-break",
  title: "Word Break",
  difficulty: "Medium",
  blind75: true,
  slug: "word-break",
  video: "Sx9NNgInc3A",
  statement: "Return true if s can be split into a sequence of one or more dictionary words (each word may be used more than once).",
  examples: [
    { label: "LeetCode's example 2", input: { s: "applepenapple", words: ["apple", "pen"] } },
    { label: "LeetCode's example 3 (false)", input: { s: "catsandog", words: ["cats", "dog", "sand", "and", "cat"] } },
    { label: "“leetcode”", input: { s: "leetcode", words: ["leet", "code"] } },
  ],
  random: (seed) => {
    const g = rngFor(seed);
    const words = [...new Set(Array.from({ length: g.int(1, 3) }, () => Array.from({ length: g.int(1, 3) }, () => g.pick([..."ab"])).join("")))];
    const s = g.r() < 0.6 ? Array.from({ length: g.int(1, 4) }, () => g.pick(words)).join("") : Array.from({ length: g.int(1, 7) }, () => g.pick([..."ab"])).join("");
    return { s, words };
  },
  big: { label: "20 a's then a b, words a, aa, aaa", input: () => ({ s: "a".repeat(20) + "b", words: ["a", "aa", "aaa"] }) },
  describe: ({ s, words }) => `s = "${s}", wordDict = [${words.join(", ")}]`,
  run,
  solve: (input) => slow(input).answer,
  brute: slow,
  bruteIdea: "Recursion with no memory: try every word that matches at the current position and recurse on the rest. On “aaaa…ab” every split of the a's is tried before failing: exponential.",
  guide: {
    title: "Word Break",
    idea: [
      "ok[i] asks: can s[i:] be split into words? It's true when some word w matches at position i and ok[i + len(w)] is true. ok[n] = true.",
      "Fill it from the end, so the later answers are ready when needed. Each position tries each word once, instead of re-solving the same suffix again and again.",
    ],
    whenToUse: ["“Can the string be split into valid pieces?”: a boolean DP over positions.", "Memoised recursion on the start index is the same thing top-down."],
    stages: [
      { id: "start", title: "Fill from the end", detail: "", pseudo: "dp = [False] * (len(s) + 1)" },
      { id: "base", title: "Empty rest: true", detail: "", pseudo: "dp[len(s)] = True" },
      { id: "fill", title: "Some word fits here and ok after it?", detail: "", pseudo: "for w in wordDict: if s[i:i+len(w)] == w and dp[i + len(w)]: dp[i] = True; break" },
      { id: "done", title: "ok[0]", detail: "", pseudo: "return dp[0]" },
    ],
    legend: [
      { tone: "current", label: "Position being filled / the word that fits" },
      { tone: "compare", label: "The later entry it relies on" },
      { tone: "found", label: "True" },
      { tone: "idle", label: "False" },
    ],
    complexity: { time: "O(n × m × k)", space: "O(n)", why: "n positions, m words, comparing up to k letters each." },
    pitfalls: ["A word matching isn't enough: the rest after it must also be breakable.", "Words can be reused."],
    tryThis: ["In example 3, “cats” and “cat” both match at 0, but neither leaves a breakable rest.", "Example 2 reuses “apple”."],
    python: py,
  },
};
