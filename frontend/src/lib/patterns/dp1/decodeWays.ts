// Decode Ways (NeetCode 150 · 1-D Dynamic Programming).

import py from "../../guides/python/neetcode/decode_ways.py?raw";
import { row, rngFor } from "../helpers";
import type { PatternProblem, PatternStep } from "../types";
import { countCalls, dpRow } from "./dp";

type Input = string;

const letter = (d: string) => String.fromCharCode(64 + Number(d));

function run(s: Input): PatternStep[] {
  const n = s.length;
  const steps: PatternStep[] = [];
  const dp: (number | null)[] = Array(n + 1).fill(null);
  let ops = 0;
  const snap = (stage: string, explanation: string, cur?: number, reads: number[] = [], extra: Partial<PatternStep> = {}) =>
    steps.push({
      stage,
      explanation,
      rows: [
        row("s", [...s], cur !== undefined && cur < n ? Object.fromEntries([cur, ...reads.filter((r) => r === cur + 2).map(() => cur + 1)].map((i) => [i, "current"])) : {}),
        dpRow("ways[i] = ways to decode s[i:]", dp, { cur, reads, filled: (i) => dp[i] !== null, tag: (i) => (i === n ? "end" : String(i)) }),
      ],
      vars: [],
      ops,
      ...extra,
    });
  snap("start", "Read the string from the end. ways[i] counts the decodings of s[i:]. A single digit 1–9 is a letter, so add ways[i + 1]; a two-digit number 10–26 is also a letter, so add ways[i + 2]. A 0 can't start a letter.");
  dp[n] = 1;
  snap("base", "ways[end] = 1: the empty rest of the string decodes exactly one way (nothing left to do).", n);
  for (let i = n - 1; i >= 0; i--) {
    ops++;
    if (s[i] === "0") {
      dp[i] = 0;
      snap("zero", `s[${i}] is 0: no letter starts with 0, so ways[${i}] = 0.`, i);
      continue;
    }
    const one = dp[i + 1]!;
    const two = i + 1 < n && Number(s.slice(i, i + 2)) <= 26 ? dp[i + 2]! : null;
    dp[i] = one + (two ?? 0);
    snap(
      "fill",
      `s[${i}] = ${s[i]} is “${letter(s[i])}”: ways[${i + 1}] = ${one}.${two !== null ? ` And ${s.slice(i, i + 2)} ≤ 26 is “${letter(s.slice(i, i + 2))}”: + ways[${i + 2}] = ${two}.` : i + 1 < n ? ` ${s.slice(i, i + 2)} is over 26, so it can't be one letter.` : ""} ways[${i}] = ${dp[i]}.`,
      i,
      two !== null ? [i + 1, i + 2] : [i + 1],
    );
  }
  snap("done", `There ${dp[0] === 1 ? "is 1 way" : `are ${dp[0]} ways`} to decode “${s}”.`, undefined, [], { done: true, answer: String(dp[0]) });
  return steps;
}

const slowRec = countCalls((self: (s: string, i: number) => number, s: string, i: number): number => {
  if (i === s.length) return 1;
  if (s[i] === "0") return 0;
  return self(s, i + 1) + (i + 1 < s.length && Number(s.slice(i, i + 2)) <= 26 ? self(s, i + 2) : 0);
});
const slow = (s: string) => slowRec(s, 0);

export const decodeWays: PatternProblem<Input> = {
  id: "decode-ways",
  title: "Decode Ways",
  difficulty: "Medium",
  blind75: true,
  slug: "decode-ways",
  video: "6aEyTjOwlJU",
  statement: "Letters are encoded as numbers: A = 1, B = 2, …, Z = 26. Given a string of digits, return how many ways it can be decoded back into letters.",
  examples: [
    { label: "“226”", input: "226" },
    { label: "“11106”", input: "11106" },
    { label: "“06”", input: "06" },
  ],
  random: (seed) => {
    const g = rngFor(seed);
    return Array.from({ length: g.int(1, 7) }, () => g.pick([..."0112223456"])).join("");
  },
  big: { label: "28 ones", input: () => "1".repeat(28) },
  describe: (s) => `s = "${s}"`,
  run,
  solve: (s) => slow(s).answer,
  brute: slow,
  bruteIdea: "Recursion with no memory: at each position try one digit and two digits. The same suffixes are decoded again and again, about 1.6^n calls on a string of 1s.",
  guide: {
    title: "Decode Ways",
    idea: [
      "Decide the first letter: it's either one digit (1–9) or two digits (10–26). So ways(i) = ways(i + 1) if s[i] isn't 0, plus ways(i + 2) if s[i..i+1] is between 10 and 26.",
      "Fill it from the end, with ways(n) = 1. Like Climbing Stairs, but some steps are forbidden.",
    ],
    whenToUse: ["Counting ways to split a string into valid pieces of length 1 or 2: a Fibonacci-like DP with conditions.", "Zeros make the edge cases: test them early."],
    stages: [
      { id: "start", title: "Fill from the end", detail: "", pseudo: "dp = {len(s): 1}" },
      { id: "base", title: "Nothing left: 1 way", detail: "", pseudo: "" },
      { id: "zero", title: "A 0 can't start a letter", detail: "", pseudo: "if s[i] == '0': dp[i] = 0" },
      { id: "fill", title: "One digit, plus two digits if ≤ 26", detail: "", pseudo: "dp[i] = dp[i + 1]; if two digits in 10..26: dp[i] += dp[i + 2]" },
      { id: "done", title: "ways[0]", detail: "", pseudo: "return dp[0]" },
    ],
    legend: [
      { tone: "current", label: "Position being filled" },
      { tone: "compare", label: "Entries it adds up" },
      { tone: "found", label: "Filled" },
    ],
    complexity: { time: "O(n)", space: "O(1)", why: "One pass from the end; only two later values are needed." },
    pitfalls: ["“06” has 0 decodings: 06 isn't a valid letter and neither is 0.", "“10” and “20” are single letters, but “30” isn't."],
    tryThis: ["“226” → BZ, VF, BBF: 3 ways.", "“11106” has only 2: the 0 must pair with the 1 before it."],
    python: py,
  },
};
