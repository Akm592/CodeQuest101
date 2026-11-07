// Generate Parentheses (NeetCode 150 · Stack).

import py from "../../guides/python/neetcode/generate_parentheses.py?raw";
import { row, rngFor, show } from "../helpers";
import type { PatternProblem, PatternStep } from "../types";

type Input = number;

function run(n: Input): PatternStep[] {
  const steps: PatternStep[] = [];
  const stack: string[] = [];
  const out: string[] = [];
  let ops = 0;
  let opened = 0;
  let closed = 0;
  const snap = (stage: string, explanation: string, extra: Partial<PatternStep> = {}) =>
    steps.push({
      stage,
      explanation,
      rows: [row("building (a stack of characters)", stack, stack.length && stage !== "backtrack" ? { [stack.length - 1]: stage === "record" ? "found" : "current" } : {})],
      map: { title: `Found so far (${out.length})`, entries: out.map((s, i) => ({ k: String(i + 1), v: s, tone: stage === "record" && i === out.length - 1 ? "found" : undefined })) },
      vars: [
        { name: "n", value: String(n) },
        { name: "opened", value: String(opened) },
        { name: "closed", value: String(closed) },
      ],
      ops,
      ...extra,
    });
  snap("start", `Build the string one character at a time. Two rules keep it valid: add “(” while fewer than ${n} are open, and add “)” only when it closes one (closed < opened). After trying a choice, undo it and try the other.`);
  const go = () => {
    if (opened === n && closed === n) {
      out.push(stack.join(""));
      snap("record", `${n} opened and ${n} closed: “${stack.join("")}” is complete. Record it.`);
      return;
    }
    if (opened < n) {
      stack.push("(");
      opened++;
      ops++;
      snap("open", `opened = ${opened - 1} < ${n}, so “(” is allowed. Add it: “${stack.join("")}”.`);
      go();
      stack.pop();
      opened--;
      snap("backtrack", `Undo that “(” to try the other choice here: back to “${stack.join("")}”.`);
    }
    if (closed < opened) {
      stack.push(")");
      closed++;
      ops++;
      snap("close", `closed = ${closed - 1} < opened = ${opened}, so “)” closes something. Add it: “${stack.join("")}”.`);
      go();
      stack.pop();
      closed--;
      snap("backtrack", `Undo that “)”: back to “${stack.join("")}”.`);
    }
  };
  go();
  // Drop the trailing undo steps that just unwind to the empty string.
  while (steps.length > 1 && steps[steps.length - 1].stage === "backtrack" && steps[steps.length - 1].rows[0].cells.length === 0) steps.pop();
  snap("done", `Every choice was tried. There are ${out.length} valid strings with ${n} pair${n === 1 ? "" : "s"}.`, { done: true, answer: show(out) });
  return steps;
}

const valid = (s: string) => {
  let d = 0;
  for (const c of s) {
    d += c === "(" ? 1 : -1;
    if (d < 0) return false;
  }
  return d === 0;
};

export const generateParentheses: PatternProblem<Input> = {
  id: "generate-parentheses",
  title: "Generate Parentheses",
  difficulty: "Medium",
  blind75: false,
  slug: "generate-parentheses",
  video: "s9fokUqJ76A",
  statement: "Given n, list every string of n pairs of round brackets that is well formed (every “(” is closed by a later “)”).",
  examples: [
    { label: "n = 2", input: 2 },
    { label: "n = 3", input: 3 },
    { label: "n = 1", input: 1 },
  ],
  random: (seed) => rngFor(seed).int(1, 3),
  big: { label: "n = 6", input: () => 6 },
  describe: (n) => `n = ${n}`,
  run,
  solve: (n) => {
    const out: string[] = [];
    for (let m = 0; m < 1 << (2 * n); m++) {
      const s = Array.from({ length: 2 * n }, (_, i) => (m >> (2 * n - 1 - i)) & 1 ? ")" : "(").join("");
      if (valid(s)) out.push(s);
    }
    return out;
  },
  brute: (n) => {
    let ops = 0;
    const out: string[] = [];
    for (let m = 0; m < 1 << (2 * n); m++) {
      const s = Array.from({ length: 2 * n }, (_, i) => (m >> (2 * n - 1 - i)) & 1 ? ")" : "(").join("");
      ops += 2 * n;
      if (valid(s)) out.push(s);
    }
    return { answer: out, ops };
  },
  canon: (a) => [...(a as string[])].sort(),
  bruteIdea: "Write out all 2²ⁿ strings of ( and ), then keep the valid ones. For n = 6 that's 4,096 strings, and only 132 are valid.",
  guide: {
    title: "Generate Parentheses",
    idea: [
      "Build the answer character by character, and never make a choice that can't lead to a valid string: add “(” only while fewer than n are open, and “)” only when there's an open one to close.",
      "Every string that reaches 2n characters is then valid. After exploring a choice, pop it off (backtrack) and try the other. The string being built is a stack: you only ever change its end.",
    ],
    whenToUse: ["“Generate all …” with rules about what can come next: backtracking, building on a stack.", "Pruning early (never adding a bad character) is what makes it fast. The Backtracking category later goes much deeper."],
    stages: [
      { id: "start", title: "Empty string", detail: "opened = closed = 0.", pseudo: "backtrack(0, 0)" },
      { id: "open", title: "opened < n → add “(”", detail: "There are still brackets to open.", pseudo: "if opened < n: stack.append('('); backtrack(opened + 1, closed)" },
      { id: "close", title: "closed < opened → add “)”", detail: "It closes an open bracket.", pseudo: "if closed < opened: stack.append(')'); backtrack(opened, closed + 1)" },
      { id: "record", title: "2n characters → record it", detail: "The rules guarantee it's valid.", pseudo: "if opened == closed == n: out.append(''.join(stack))" },
      { id: "backtrack", title: "Undo the last character", detail: "Pop it to try the other choice.", pseudo: "stack.pop()" },
      { id: "done", title: "Every branch tried", detail: "The answer list is complete.", pseudo: "return out" },
    ],
    legend: [
      { tone: "current", label: "Just added" },
      { tone: "found", label: "Complete string" },
    ],
    complexity: { time: "O(4ⁿ / √n)", space: "O(n)", why: "The answer count is the n-th Catalan number, about 4ⁿ / n^1.5, and each takes O(n) to build. The stack is at most 2n deep." },
    pitfalls: [
      "Checking validity only at the end works but wastes time on hopeless prefixes like “)…”.",
      "Remember to pop after the recursive call, or the next branch starts from the wrong string.",
    ],
    tryThis: ["Pick “n = 2”: the tree has just two leaves, “(())” and “()()”.", "Pick “n = 3” and count the undo steps between each answer."],
    python: py,
  },
};
