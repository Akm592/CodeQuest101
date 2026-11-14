// Letter Combinations of a Phone Number (NeetCode 150 · Backtracking).

import py from "../../guides/python/neetcode/letter_combinations.py?raw";
import { row, rngFor } from "../helpers";
import type { PEntry, PatternProblem, PatternStep } from "../types";
import { type Frame, RecTree, at, finish } from "./rtree";

type Input = string;

export const KEYS: Record<string, string> = { "2": "abc", "3": "def", "4": "ghi", "5": "jkl", "6": "mno", "7": "pqrs", "8": "tuv", "9": "wxyz" };
const showWords = (ws: string[]) => `[${ws.join(", ")}]`;

function run(digits: Input): PatternStep[] {
  const t = new RecTree();
  const frames: Frame[] = [];
  const res: string[] = [];
  let cur = "";
  const path: string[] = [];
  let ops = 0;
  const push = (stage: string, explanation: string, node?: string, extra: Partial<PatternStep> = {}) =>
    frames.push({
      stage,
      explanation,
      rows: [
        row("digits", [...digits], Object.fromEntries([...digits].map((_, j) => [j, j === cur.length - 1 ? "current" : j < cur.length ? "pointer" : undefined]))),
        row("letters so far", [...cur]),
        row("combinations found", res, Object.fromEntries(res.map((_, j) => [j, j === res.length - 1 && stage === "leaf" ? "found" : undefined]))),
      ],
      map: { title: "phone keypad", entries: [...new Set(digits)].map((d): PEntry => ({ k: d, v: KEYS[d], tone: d === digits[cur.length - 1] ? "current" : undefined })) },
      vars: [{ name: "found", value: String(res.length), tone: "found" }],
      ops,
      ...at(t, node, path),
      ...extra,
    });
  if (!digits) {
    push("start", "No digits, so there are no combinations: return an empty list (not a list with one empty string).", undefined);
    push("done", "Done: [].", undefined, { done: true, answer: "[]" });
    return finish(t, frames, "one level per digit, one branch per letter");
  }
  const root = t.add("·", undefined, '""');
  path.push(root);
  push("start", `Each digit maps to 3 or 4 letters. Build strings one digit at a time: the tree has one level per digit and one branch per letter, so ${[...digits].map((d) => KEYS[d].length).join(" × ")} = ${[...digits].reduce((a, d) => a * KEYS[d].length, 1)} leaves.`, root);
  const dfs = (node: string) => {
    ops++;
    if (cur.length === digits.length) {
      res.push(cur);
      t.found.push(node);
      push("leaf", `One letter for every digit: record “${cur}”.`, node);
      return;
    }
    const d = digits[cur.length];
    for (const ch of KEYS[d]) {
      cur += ch;
      const a = t.add(ch, node, `"${cur}"`);
      path.push(a);
      push("letter", `Digit ${d} → try “${ch}”: the string is “${cur}”.`, a);
      dfs(a);
      path.pop();
      cur = cur.slice(0, -1);
    }
  };
  dfs(root);
  path.length = 0;
  cur = "";
  push("done", `All ${res.length} combinations found.`, undefined, { done: true, answer: showWords([...res].sort()) });
  return finish(t, frames, "one level per digit, one branch per letter");
}

export const letterCombinations: PatternProblem<Input> = {
  id: "letter-combinations",
  title: "Letter Combinations of a Phone Number",
  difficulty: "Medium",
  blind75: false,
  slug: "letter-combinations-of-a-phone-number",
  video: "0snEunUacZY",
  statement: "Given a string of digits 2–9, return every string of letters they could spell on a phone keypad (2 = abc, 3 = def, …), in any order.",
  examples: [
    { label: "“23”", input: "23" },
    { label: "“7”", input: "7" },
    { label: "empty", input: "" },
  ],
  random: (seed) => {
    const g = rngFor(seed);
    return Array.from({ length: g.int(0, 2) }, () => g.pick([..."23456789"])).join("");
  },
  describe: (d) => `digits = "${d}"`,
  run,
  solve: (digits) => {
    if (!digits) return "[]";
    let out = [""];
    for (const d of digits) out = out.flatMap((s) => [...KEYS[d]].map((c) => s + c));
    return showWords(out.sort());
  },
  brute: null,
  bruteIdea: "Nothing is faster: the answer has up to 4^n strings of length n, so O(n · 4^n) is the least any method can do. Building them level by level (a loop instead of recursion) is the same work.",
  guide: {
    title: "Letter Combinations of a Phone Number",
    idea: [
      "Each digit is a level of the tree; its letters are the branches. Walk the tree depth first, adding one letter per level, and record the string when it has one letter for every digit.",
      "There's no pruning: every path is an answer. Backtracking here is just a clean way to write “for each letter of digit 1, for each letter of digit 2, …” for any number of digits.",
    ],
    whenToUse: ["“Every combination of one choice per slot”, where the number of slots is only known at run time.", "A warm-up for backtracking with pruning (N-Queens, Word Search)."],
    stages: [
      { id: "start", title: "Empty string", detail: "", pseudo: "backtrack(0, \"\")" },
      { id: "letter", title: "Add one of this digit's letters", detail: "", pseudo: "for c in keys[digits[i]]: backtrack(i + 1, cur + c)" },
      { id: "leaf", title: "One letter per digit → record", detail: "", pseudo: "if len(cur) == len(digits): res.append(cur)" },
      { id: "done", title: "All branches tried", detail: "", pseudo: "return res" },
    ],
    legend: [
      { tone: "current", label: "Digit being expanded / current call" },
      { tone: "pointer", label: "Letters so far" },
      { tone: "found", label: "Combination recorded" },
    ],
    complexity: { time: "O(n · 4^n)", space: "O(n)", why: "Up to 4 branches per digit (7 and 9 have four letters) and n letters per answer." },
    pitfalls: ["Empty input returns [], not [\"\"].", "7 and 9 have four letters; don't assume three."],
    tryThis: ["“23” gives 3 × 3 = 9 strings.", "Press “Random” until you get a 7 or 9 and count the branches."],
    python: py,
  },
};
