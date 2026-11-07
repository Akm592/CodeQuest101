// Evaluate Reverse Polish Notation (NeetCode 150 · Stack).

import py from "../../guides/python/neetcode/eval_rpn.py?raw";
import { row, rngFor } from "../helpers";
import type { PatternProblem, PatternStep } from "../types";

type Input = string[];
const isOp = (t: string) => t === "+" || t === "-" || t === "*" || t === "/";
const apply = (a: number, op: string, b: number) => (op === "+" ? a + b : op === "-" ? a - b : op === "*" ? a * b : Math.trunc(a / b));
const sym = (op: string) => (op === "*" ? "×" : op === "/" ? "÷" : op === "-" ? "−" : op);

function run(tokens: Input): PatternStep[] {
  const steps: PatternStep[] = [];
  const stack: number[] = [];
  let ops = 0;
  const snap = (stage: string, k: number, explanation: string, topTone: "pointer" | "found" | null, extra: Partial<PatternStep> = {}) =>
    steps.push({
      stage,
      explanation,
      rows: [
        row("tokens", tokens.map(sym), Object.fromEntries(tokens.map((_, j) => [j, j < k ? "idle" : j === k ? "current" : undefined]))),
        row("stack (bottom → top)", stack, topTone && stack.length ? { [stack.length - 1]: topTone } : {}, stack.length ? { [stack.length - 1]: "top" } : {}),
      ],
      vars: [{ name: "values waiting", value: String(stack.length) }],
      ops,
      ...extra,
    });
  snap("start", -1, "Read the tokens left to right. Numbers wait on the stack; an operator always uses the two most recent numbers, which are on top.", null);
  tokens.forEach((t, k) => {
    ops++;
    if (!isOp(t)) {
      stack.push(Number(t));
      snap("number", k, `${t} is a number: push it. It waits until an operator needs it.`, "pointer");
      return;
    }
    const b = stack.pop()!;
    const a = stack.pop()!;
    const v = apply(a, t, b);
    stack.push(v);
    ops += 2;
    snap("operator", k, `${sym(t)} pops the top two: ${b} (on top) and ${a} under it. The one underneath goes first: ${a} ${sym(t)} ${b} = ${v}${t === "/" && a % b !== 0 ? " (rounded towards zero)" : ""}. Push the result.`, "found");
  });
  snap("done", tokens.length, `No tokens left. The single value on the stack, ${stack[0]}, is the answer.`, "found", { done: true, answer: String(stack[0]) });
  return steps;
}

export function rpnSolve(tokens: Input): number {
  // Build the expression back into a tree and evaluate it recursively.
  let i = tokens.length - 1;
  const eval_ = (): number => {
    const t = tokens[i--];
    if (!isOp(t)) return Number(t);
    const b = eval_();
    const a = eval_();
    return apply(a, t, b);
  };
  return eval_();
}

function randomTokens(g: ReturnType<typeof rngFor>, depth: number): { tokens: string[]; value: number } {
  if (depth === 0 || g.r() < 0.3) {
    const v = g.int(1, 9);
    return { tokens: [String(v)], value: v };
  }
  const left = randomTokens(g, depth - 1);
  const right = randomTokens(g, depth - 1);
  let op = g.pick(["+", "-", "*", "/"]);
  if (op === "/" && right.value === 0) op = "+";
  if (op === "*" && Math.abs(left.value * right.value) > 200) op = "-";
  return { tokens: [...left.tokens, ...right.tokens, op], value: apply(left.value, op, right.value) };
}

export const evalRpn: PatternProblem<Input> = {
  id: "eval-rpn",
  title: "Evaluate Reverse Polish Notation",
  difficulty: "Medium",
  blind75: false,
  slug: "evaluate-reverse-polish-notation",
  video: "iu0082c4HDE",
  statement: "In Reverse Polish Notation the operator comes after its two operands: “2 1 + 3 *” means (2 + 1) × 3. Evaluate such a list of tokens. Division rounds towards zero.",
  examples: [
    { label: "2 1 + 3 *", input: ["2", "1", "+", "3", "*"] },
    { label: "4 13 5 / +", input: ["4", "13", "5", "/", "+"] },
    { label: "longer", input: ["10", "6", "9", "3", "+", "-11", "*", "/", "*", "17", "+", "5", "+"] },
  ],
  random: (seed) => {
    const g = rngFor(seed);
    for (;;) {
      const { tokens } = randomTokens(g, 3);
      if (tokens.length >= 3) return tokens;
    }
  },
  big: { label: "201 tokens, deeply nested", input: () => [...Array.from({ length: 101 }, (_, i) => String((i % 9) + 1)), ...Array.from({ length: 100 }, (_, i) => (i % 2 ? "+" : "-"))] },
  describe: (t) => `tokens = ${t.join(" ")}`,
  run,
  solve: rpnSolve,
  brute: (tokens) => {
    let ops = 0;
    const t: (string | number)[] = [...tokens];
    while (t.length > 1) {
      let k = 0;
      while (!(typeof t[k] === "string" && isOp(t[k] as string))) {
        ops++;
        k++;
      }
      ops++;
      const v = apply(Number(t[k - 2]), t[k] as string, Number(t[k - 1]));
      t.splice(k - 2, 3, v);
    }
    return { answer: Number(t[0]), ops };
  },
  bruteIdea: "Without a stack: scan from the left for the first operator, replace it and its two numbers with the result, and start the scan again. Deep expressions make every scan long: O(n²).",
  guide: {
    title: "Evaluate Reverse Polish Notation",
    idea: [
      "In RPN, an operator always applies to the two values just before it, where a value is either a number or the result of an earlier operator. “The most recent values” is a stack.",
      "Push numbers. On an operator, pop two, combine them and push the result. Order matters for − and ÷: the first one popped is the right-hand side.",
    ],
    whenToUse: ["Evaluating postfix expressions, calculators, and any “combine the last two things” process.", "Compilers and some calculators turn normal expressions into RPN because a stack evaluates it in one pass."],
    stages: [
      { id: "start", title: "Empty stack", detail: "Nothing read yet.", pseudo: "stack = []" },
      { id: "number", title: "Number → push", detail: "It waits for an operator.", pseudo: "stack.append(int(t))" },
      { id: "operator", title: "Operator → pop two, push the result", detail: "b = pop(), a = pop(), push a op b.", pseudo: "b, a = stack.pop(), stack.pop(); stack.append(a op b)" },
      { id: "done", title: "One value left → the answer", detail: "A valid expression leaves exactly one value.", pseudo: "return stack[0]" },
    ],
    legend: [
      { tone: "current", label: "Current token" },
      { tone: "pointer", label: "Just pushed" },
      { tone: "found", label: "Result of an operator" },
    ],
    complexity: { time: "O(n)", space: "O(n)", why: "Each token is pushed or popped a constant number of times." },
    pitfalls: [
      "Pop order: for “a b −” the stack top is b. Doing b − a gives the wrong sign.",
      "Python's // rounds down (−7 // 2 = −4) but the problem wants rounding towards zero (−3). Use int(a / b).",
    ],
    tryThis: ["Pick “longer”: watch the stack grow to five values, then collapse.", "Rewrite “2 1 + 3 *” as normal maths. Where would the brackets go?"],
    python: py,
  },
};
