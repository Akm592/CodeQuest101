// Palindrome Partitioning (NeetCode 150 · Backtracking).

import py from "../../guides/python/neetcode/palindrome_partitioning.py?raw";
import { row, rngFor } from "../helpers";
import type { PatternProblem, PatternStep } from "../types";
import { type Frame, RecTree, at, finish } from "./rtree";
import { canonLists, showLists } from "./util";

type Input = string;

const showParts = (p: string[]) => `[${p.join(", ")}]`;

function run(s: Input): PatternStep[] {
  const t = new RecTree();
  const frames: Frame[] = [];
  const res: string[][] = [];
  const parts: string[] = [];
  const path: string[] = [];
  let ops = 0;
  let span: [number, number] = [-1, -1];
  let bad = false;
  const push = (stage: string, explanation: string, node?: string, extra: Partial<PatternStep> = {}) => {
    const done = parts.join("").length;
    frames.push({
      stage,
      explanation,
      rows: [
        row("s", [...s], Object.fromEntries([...s].map((_, j) => [j, j >= span[0] && j <= span[1] ? (bad ? "swap" : "current") : j < done ? "pointer" : undefined])), Object.fromEntries([...s].map((_, j) => [j, String(j)]))),
        row("pieces so far", parts),
        row("partitions found", res.map(showParts), Object.fromEntries(res.map((_, j) => [j, j === res.length - 1 && stage === "leaf" ? "found" : undefined]))),
      ],
      vars: [{ name: "partitions found", value: String(res.length), tone: "found" }],
      ops,
      ...at(t, node, path),
      ...extra,
    });
  };
  const isPal = (a: number, b: number) => {
    while (a < b) {
      ops++;
      if (s[a++] !== s[b--]) return false;
    }
    ops++;
    return true;
  };
  const root = t.add("·", undefined, "[]");
  path.push(root);
  push("start", `Cut “${s}” into pieces that are all palindromes. Each call starts at position i and tries every possible first piece s[i..j]. Only a palindrome is worth recursing on; anything else is cut off at once.`, root);
  const dfs = (i: number, node: string) => {
    ops++;
    if (i === s.length) {
      res.push([...parts]);
      t.found.push(node);
      span = [-1, -1];
      push("leaf", `The whole string is used up and every piece is a palindrome: record ${showParts(parts)}.`, node);
      return;
    }
    for (let j = i; j < s.length; j++) {
      const piece = s.slice(i, j + 1);
      span = [i, j];
      if (!isPal(i, j)) {
        bad = true;
        const d = t.add(piece, node);
        t.dead.push(d);
        push("prune", `Try “${piece}” as the next piece: it isn't a palindrome, so don't go further down this branch.`, d);
        bad = false;
        continue;
      }
      parts.push(piece);
      const a = t.add(piece, node, showParts(parts));
      path.push(a);
      push("cut", `Try “${piece}” as the next piece: it reads the same backwards, so keep it and partition the rest${j + 1 < s.length ? `, “${s.slice(j + 1)}”` : ""}.`, a);
      dfs(j + 1, a);
      path.pop();
      parts.pop();
    }
  };
  dfs(0, root);
  path.length = 0;
  span = [-1, -1];
  push("done", `Every way to cut “${s}” has been tried: ${res.length} partition${res.length === 1 ? "" : "s"}.`, undefined, { done: true, answer: showLists(canonLists(res, false)) });
  return finish(t, frames, "each level picks the next piece; red pieces aren't palindromes");
}

/** The slow way: try every one of the 2^(n−1) ways to cut, then check each piece. */
function slow(s: Input) {
  const n = s.length;
  let ops = 0;
  const out: string[][] = [];
  for (let m = 0; m < 1 << Math.max(0, n - 1); m++) {
    const pieces: string[] = [];
    let start = 0;
    for (let j = 0; j < n; j++)
      if (j === n - 1 || m & (1 << j)) {
        pieces.push(s.slice(start, j + 1));
        start = j + 1;
      }
    ops += n;
    if (pieces.every((p) => p === [...p].reverse().join(""))) out.push(pieces);
  }
  return { answer: showLists(canonLists(out, false)), ops };
}

export const palindromePartition: PatternProblem<Input> = {
  id: "palindrome-partitioning",
  title: "Palindrome Partitioning",
  difficulty: "Medium",
  blind75: false,
  slug: "palindrome-partitioning",
  video: "3jvWodd7ht0",
  statement: "Split a string into pieces so that every piece is a palindrome. Return every way to do it.",
  examples: [
    { label: "“aab”", input: "aab" },
    { label: "“abba”", input: "abba" },
    { label: "“a”", input: "a" },
  ],
  random: (seed) => {
    const g = rngFor(seed);
    return Array.from({ length: g.int(1, 5) }, () => g.pick([..."ab"])).join("");
  },
  big: { label: "“abcdefghijklmnop” (no repeats)", input: () => "abcdefghijklmnop" },
  describe: (s) => `s = "${s}"`,
  run,
  solve: (s) => slow(s).answer,
  brute: slow,
  bruteIdea: "Try all 2^(n−1) ways to place cuts and check every piece afterwards. Backtracking checks each first piece as it goes and drops a branch the moment a piece isn't a palindrome.",
  guide: {
    title: "Palindrome Partitioning",
    idea: [
      "Choose the first piece, then partition the rest the same way. At position i, try every end j: if s[i..j] is a palindrome, add it and recurse from j + 1; if not, skip it. When i reaches the end, the pieces so far are one answer.",
      "Checking a piece is a two-pointer palindrome test. (A table of which s[i..j] are palindromes, filled in by dynamic programming, avoids re-checking the same piece in different branches.)",
    ],
    whenToUse: ["“All ways to split a string so every piece satisfies …”: loop over the next cut, recurse on the rest.", "Prune with the piece test before recursing, not after the whole split is built."],
    stages: [
      { id: "start", title: "Start at position 0", detail: "", pseudo: "dfs(0)" },
      { id: "cut", title: "s[i..j] is a palindrome → keep it, recurse", detail: "", pseudo: "if is_pali(s, i, j): part.append(s[i:j+1]); dfs(j + 1); part.pop()" },
      { id: "prune", title: "Not a palindrome → skip", detail: "", pseudo: "" },
      { id: "leaf", title: "Reached the end → record", detail: "", pseudo: "if i >= len(s): res.append(part.copy())" },
      { id: "done", title: "All cuts tried", detail: "", pseudo: "return res" },
    ],
    legend: [
      { tone: "current", label: "Piece being tested / current call" },
      { tone: "pointer", label: "Already split / choices so far" },
      { tone: "swap", label: "Not a palindrome" },
      { tone: "found", label: "Partition recorded" },
    ],
    complexity: { time: "O(n · 2^n)", space: "O(n)", why: "Up to 2^(n−1) partitions, each built and checked in O(n)." },
    pitfalls: ["Single letters are always palindromes, so there is always at least one partition.", "Pop the piece after the recursive call."],
    tryThis: ["“aab” has two partitions: [a, a, b] and [aa, b]. The “aab” branch is red.", "“abba” has three; [abba] is found on the root's last branch."],
    python: py,
  },
};
