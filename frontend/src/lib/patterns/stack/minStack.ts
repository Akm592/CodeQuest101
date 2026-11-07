// Min Stack (NeetCode 150 · Stack).

import py from "../../guides/python/neetcode/min_stack.py?raw";
import { row, rngFor, show } from "../helpers";
import type { PatternProblem, PatternStep } from "../types";

/** A list of calls like "push 3", "pop", "top", "getMin". */
type Input = string[];

function run(calls: Input): PatternStep[] {
  const steps: PatternStep[] = [];
  const stack: number[] = [];
  const mins: number[] = [];
  const out: string[] = [];
  let ops = 0;
  const snap = (stage: string, k: number, explanation: string, hl: "top" | "min" | "both" | null, extra: Partial<PatternStep> = {}) => {
    const t = stack.length - 1;
    steps.push({
      stage,
      explanation,
      rows: [
        row("calls", calls.map((c) => c.replace("getMin", "min")), Object.fromEntries(calls.map((_, j) => [j, j < k ? "idle" : j === k ? "current" : undefined]))),
        row("stack (bottom → top)", stack, t >= 0 && (hl === "top" || hl === "both") ? { [t]: "pointer" } : {}, t >= 0 ? { [t]: "top" } : {}),
        row("mins: min of this level and below", mins, t >= 0 && (hl === "min" || hl === "both") ? { [t]: "found" } : {}, t >= 0 ? { [t]: "top" } : {}),
      ],
      vars: [{ name: "returned so far", value: out.length ? out.join(", ") : "–", tone: "found" }],
      ops,
      ...extra,
    });
  };
  snap("start", -1, "Two stacks side by side. The second one stores, for each level, the smallest value at or below it. Then the minimum is always on top.", null);
  calls.forEach((call, k) => {
    const [op, arg] = call.split(" ");
    ops++;
    if (op === "push") {
      const v = Number(arg);
      const m = mins.length ? Math.min(v, mins[mins.length - 1]) : v;
      stack.push(v);
      mins.push(m);
      snap("push", k, mins.length > 1 ? `push ${v}: the min at this level is min(${v}, ${mins[mins.length - 2]}) = ${m}. Store it next to ${v}.` : `push ${v}: it's the only value, so the min is ${v}.`, "both");
    } else if (op === "pop") {
      const v = stack.pop()!;
      mins.pop();
      snap("pop", k, `pop removes ${v}, and its min goes with it. The min below${mins.length ? ` (${mins[mins.length - 1]})` : ""} was already stored, so nothing needs recomputing.`, "both");
    } else if (op === "top") {
      out.push(String(stack[stack.length - 1]));
      snap("top", k, `top returns ${stack[stack.length - 1]}, the last value pushed.`, "top");
    } else {
      out.push(String(mins[mins.length - 1]));
      snap("getMin", k, `getMin returns ${mins[mins.length - 1]}: just read the top of the mins stack, no searching.`, "min");
    }
  });
  snap("done", calls.length, `All calls done. They returned ${show(out)}.`, null, { done: true, answer: show(out) });
  return steps;
}

function slow(calls: Input) {
  const stack: number[] = [];
  const out: string[] = [];
  let ops = 0;
  for (const call of calls) {
    const [op, arg] = call.split(" ");
    ops++;
    if (op === "push") stack.push(Number(arg));
    else if (op === "pop") stack.pop();
    else if (op === "top") out.push(String(stack[stack.length - 1]));
    else {
      let m = Infinity;
      for (const v of stack) {
        ops++;
        m = Math.min(m, v);
      }
      out.push(String(m));
    }
  }
  return { answer: show(out), ops };
}

export const minStack: PatternProblem<Input> = {
  id: "min-stack",
  title: "Min Stack",
  difficulty: "Medium",
  blind75: false,
  slug: "min-stack",
  video: "qkLl7nAwDPo",
  statement: "Design a stack with push, pop, top and getMin, where every one of them runs in O(1) time. getMin returns the smallest value currently in the stack.",
  examples: [
    { label: "LeetCode's example", input: ["push -2", "push 0", "push -3", "getMin", "pop", "top", "getMin"] },
    { label: "min changes back", input: ["push 5", "push 3", "push 7", "push 1", "getMin", "pop", "getMin", "pop", "pop", "getMin"] },
  ],
  random: (seed) => {
    const g = rngFor(seed);
    const calls: string[] = [];
    let size = 0;
    const n = g.int(6, 10);
    while (calls.length < n) {
      const op = size === 0 ? "push" : g.pick(["push", "push", "pop", "top", "getMin", "getMin"]);
      if (op === "push") {
        calls.push(`push ${g.int(-5, 9)}`);
        size++;
      } else {
        calls.push(op);
        if (op === "pop") size--;
      }
    }
    return calls;
  },
  big: { label: "100 pushes, each followed by getMin", input: () => Array.from({ length: 100 }, (_, i) => [`push ${(i * 37) % 50}`, "getMin"]).flat() },
  describe: (calls) => calls.join(", "),
  run,
  solve: (calls) => slow(calls).answer,
  brute: slow,
  bruteIdea: "A plain stack can answer getMin by scanning every value: O(n) per call. Saving the running minimum at each level makes it O(1).",
  guide: {
    title: "Min Stack",
    idea: [
      "Keeping one variable for the minimum isn't enough: when the minimum is popped, you'd need to know the next smallest, which means searching.",
      "Instead, store the minimum for every level. When you push v, the new level's min is min(v, the min below). Popping removes a level and its min together, and the one below is already correct.",
    ],
    whenToUse: ["“O(1) max/min while things are added and removed from one end”: store the answer alongside each item.", "The same idea gives running maxima, or prefix minima in an array."],
    stages: [
      { id: "start", title: "Two empty stacks", detail: "values and mins.", pseudo: "self.stack, self.mins = [], []" },
      { id: "push", title: "push v: store v and min(v, min below)", detail: "Each level remembers the min at or below it.", pseudo: "mins.append(min(v, mins[-1]) if mins else v)" },
      { id: "pop", title: "pop: remove both tops", detail: "The level below already has its min.", pseudo: "stack.pop(); mins.pop()" },
      { id: "top", title: "top: read the values stack", detail: "O(1).", pseudo: "return stack[-1]" },
      { id: "getMin", title: "getMin: read the mins stack", detail: "O(1): no search.", pseudo: "return mins[-1]" },
      { id: "done", title: "All calls answered", detail: "Every call was O(1).", pseudo: "" },
    ],
    legend: [
      { tone: "current", label: "Current call" },
      { tone: "pointer", label: "Top value" },
      { tone: "found", label: "Current min" },
    ],
    complexity: { time: "O(1) per call", space: "O(n)", why: "Each call touches only the tops of the two stacks; the mins stack doubles the memory." },
    pitfalls: [
      "A single “current min” variable breaks on pop: you can't recover the previous minimum.",
      "Push the min even when it doesn't change, so the two stacks always have the same height.",
    ],
    tryThis: ["Pick “min changes back”: the min goes 1 → 3 → 5 as values are popped, with no searching.", "Press “Random” and predict each getMin."],
    python: py,
  },
};
