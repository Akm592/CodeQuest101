// Valid Parentheses (NeetCode 150 · Stack).

import py from "../../guides/python/neetcode/valid_parentheses.py?raw";
import { quote, row, rngFor } from "../helpers";
import type { PatternProblem, PatternStep } from "../types";

type Input = string;
const PAIR: Record<string, string> = { ")": "(", "]": "[", "}": "{" };

function run(s: Input): PatternStep[] {
  const steps: PatternStep[] = [];
  const stack: number[] = []; // indices of open brackets
  const matched = new Set<number>();
  let ops = 0;
  const snap = (stage: string, i: number, explanation: string, bad: number[] = [], extra: Partial<PatternStep> = {}) => {
    const tones: Record<number, "current" | "found" | "swap" | "pointer" | undefined> = {};
    for (const j of matched) tones[j] = "found";
    for (const j of stack) tones[j] = "pointer";
    if (i >= 0 && i < s.length) tones[i] = "current";
    for (const j of bad) tones[j] = "swap";
    steps.push({
      stage,
      explanation,
      rows: [
        row("s", [...s], tones, i >= 0 && i < s.length ? { [i]: "i" } : {}),
        row("stack (bottom → top)", stack.map((j) => s[j]), { ...(stack.length ? { [stack.length - 1]: bad.length ? "swap" : "pointer" } : {}) }, stack.length ? { [stack.length - 1]: "top" } : {}),
      ],
      vars: [{ name: "open, not yet closed", value: String(stack.length), tone: "pointer" }],
      ops,
      ...extra,
    });
  };
  snap("start", -1, "Read left to right. Opening brackets wait on a stack; a closing bracket must match the most recent one still open, which is the top of the stack.");
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    ops++;
    if (!(c in PAIR)) {
      stack.push(i);
      snap("push", i, `“${c}” opens a bracket. Push it: it has to be closed before anything opened earlier.`);
      continue;
    }
    if (!stack.length) {
      snap("mismatch", i, `“${c}” closes a bracket, but nothing is open. Not valid.`, [i], { done: true, answer: "false" });
      return steps;
    }
    const top = stack[stack.length - 1];
    if (s[top] !== PAIR[c]) {
      snap("mismatch", i, `“${c}” must close a “${PAIR[c]}”, but the most recent open bracket is “${s[top]}”. Not valid.`, [i, top], { done: true, answer: "false" });
      return steps;
    }
    stack.pop();
    matched.add(top);
    matched.add(i);
    snap("pop", i, `“${c}” closes the “${s[top]}” on top of the stack. Pop it: that pair is done.`);
  }
  if (stack.length) {
    snap("leftover", s.length, `The end of the string, but ${stack.length} bracket${stack.length === 1 ? " is" : "s are"} still open. Not valid.`, [...stack], { done: true, answer: "false" });
    return steps;
  }
  snap("valid", s.length, "The end of the string with an empty stack: every bracket was closed in the right order. Valid.", [], { done: true, answer: "true" });
  return steps;
}

export const validParentheses: PatternProblem<Input> = {
  id: "valid-parentheses",
  title: "Valid Parentheses",
  difficulty: "Easy",
  blind75: true,
  slug: "valid-parentheses",
  video: "WTzjTskDFMg",
  statement: "Given a string of the brackets ( ) [ ] { }, return true if every opening bracket is closed by the same kind of bracket, in the right order.",
  examples: [
    { label: "{[()]}()", input: "{[()]}()" },
    { label: "([)]", input: "([)]" },
    { label: "(()", input: "(()" },
  ],
  random: (seed) => {
    const g = rngFor(seed);
    // Build a valid string, then sometimes break it.
    const out: string[] = [];
    const open: string[] = [];
    const n = g.int(2, 6);
    let made = 0;
    while (made < n || open.length) {
      if (made < n && (open.length === 0 || g.r() < 0.55)) {
        const b = g.pick(["(", "[", "{"]);
        out.push(b);
        open.push(b);
        made++;
      } else out.push({ "(": ")", "[": "]", "{": "}" }[open.pop()!]!);
    }
    if (g.r() < 0.5) {
      const i = g.int(0, out.length - 1);
      out[i] = g.pick(["(", ")", "[", "]", "{", "}"]);
    }
    return out.join("");
  },
  big: { label: "200 brackets, nested", input: () => "(".repeat(100) + ")".repeat(100) },
  describe: (s) => `s = ${quote(s)}`,
  run,
  solve: (s) => {
    let t = s;
    for (;;) {
      const u = t.replace("()", "").replace("[]", "").replace("{}", "");
      if (u === t) return t === "";
      t = u;
    }
  },
  brute: (s) => {
    let ops = 0;
    let t = s;
    for (;;) {
      ops += t.length;
      const u = t.replace(/\(\)|\[\]|\{\}/g, "");
      if (u === t) return { answer: t === "", ops };
      t = u;
    }
  },
  bruteIdea: "Keep deleting adjacent pairs like “()” until none are left, then check the string is empty. Deeply nested input needs a pass for every level: O(n²).",
  guide: {
    title: "Valid Parentheses",
    idea: [
      "The bracket that must close next is always the one opened most recently. “Most recent first” is exactly what a stack gives you: push when a bracket opens, and when one closes, it must match the top.",
      "It's invalid if a closing bracket doesn't match the top, if the stack is empty when one closes, or if anything is still open at the end.",
    ],
    whenToUse: ["Nested structure: brackets, tags, function calls. The innermost thing finishes first.", "Whenever you need “the most recent unfinished item”, use a stack."],
    stages: [
      { id: "start", title: "Empty stack", detail: "Nothing is open yet.", pseudo: "stack = []" },
      { id: "push", title: "Opening bracket → push", detail: "It waits until its partner arrives.", pseudo: "stack.append(c)" },
      { id: "pop", title: "Closing bracket matches the top → pop", detail: "That pair is complete.", pseudo: "if stack and stack[-1] == pairs[c]: stack.pop()" },
      { id: "mismatch", title: "Wrong kind, or nothing open → false", detail: "The closing bracket has no partner.", pseudo: "return False" },
      { id: "leftover", title: "End with brackets still open → false", detail: "Some were never closed.", pseudo: "return not stack" },
      { id: "valid", title: "End with an empty stack → true", detail: "Every bracket was closed in order.", pseudo: "return not stack" },
    ],
    legend: [
      { tone: "current", label: "Current bracket" },
      { tone: "pointer", label: "Open, on the stack" },
      { tone: "found", label: "Matched pair" },
      { tone: "swap", label: "The problem" },
    ],
    complexity: { time: "O(n)", space: "O(n)", why: "Each bracket is pushed and popped at most once; in the worst case all of them are open at once." },
    pitfalls: [
      "Check the stack isn't empty before looking at its top: “)” on its own must return false, not crash.",
      "Don't just count brackets: “([)]” has the right counts but the wrong order.",
    ],
    tryThis: ["Pick “([)]”: the counts are fine, the order isn't.", "Pick “(()”: no error until the very end."],
    python: py,
  },
};
