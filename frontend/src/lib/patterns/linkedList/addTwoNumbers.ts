// Add Two Numbers (NeetCode 150 · Linked List).

import py from "../../guides/python/neetcode/add_two_numbers.py?raw";
import { rngFor, show } from "../helpers";
import type { LEdge, LNode, PatternProblem, PatternStep } from "../types";

type Input = { a: number[]; b: number[] };
const asNumber = (ds: number[]) => [...ds].reverse().join("");

export function addSolve({ a, b }: Input): number[] {
  const out: number[] = [];
  let carry = 0;
  for (let i = 0; i < Math.max(a.length, b.length) || carry; i++) {
    const s = (a[i] ?? 0) + (b[i] ?? 0) + carry;
    out.push(s % 10);
    carry = Math.floor(s / 10);
  }
  return out;
}

function run({ a, b }: Input): PatternStep[] {
  const steps: PatternStep[] = [];
  const out: number[] = [];
  let carry = 0;
  let at = -1;
  let ops = 0;
  const snap = (stage: string, explanation: string, extra: Partial<PatternStep> = {}) => {
    const chain = (xs: number[], p: string, row: number, tone: (i: number) => LNode["tone"]) => xs.map((v, i): LNode => ({ id: `${p}${i}`, v: String(v), row, col: i, tone: tone(i), tag: i === at && row < 2 ? (row === 0 ? "l1" : "l2") : undefined }));
    const nodes: LNode[] = [...chain(a, "a", 0, (i) => (i === at ? "current" : i < at ? "idle" : undefined)), ...chain(b, "b", 1, (i) => (i === at ? "current" : i < at ? "idle" : undefined)), ...chain(out, "r", 2, (i) => (i === out.length - 1 && stage !== "done" ? "compare" : "found"))];
    const edges: LEdge[] = [];
    const link = (xs: number[], p: string, tone?: LEdge["tone"]) => xs.forEach((_, i) => i + 1 < xs.length && edges.push({ from: `${p}${i}`, to: `${p}${i + 1}`, tone }));
    link(a, "a");
    link(b, "b");
    link(out, "r", "found");
    steps.push({
      stage,
      explanation,
      rows: [],
      links: { title: "digits in reverse: the ones digit comes first", nodes, edges, rowLabels: { 0: `l1 = ${asNumber(a)}`, 1: `l2 = ${asNumber(b)}`, 2: `result${out.length ? ` = ${asNumber(out)}` : ""}` } },
      vars: [{ name: "carry", value: String(carry), tone: carry ? "compare" : undefined }],
      ops,
      ...extra,
    });
  };
  snap("start", `Add ${asNumber(a)} + ${asNumber(b)} the way you would on paper: ones digits first, carrying 1 when a column reaches 10. The lists already start at the ones digit, which makes this easy.`);
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    at = i;
    const x = a[i] ?? 0;
    const y = b[i] ?? 0;
    const s = x + y + carry;
    const c0 = carry;
    carry = Math.floor(s / 10);
    out.push(s % 10);
    ops++;
    snap("add", `${x} + ${y}${c0 ? " + carry 1" : ""} = ${s}${i >= a.length || i >= b.length ? ` (the shorter list counts as 0 here)` : ""}. Write ${s % 10}${carry ? " and carry 1" : ""}.`);
  }
  at = -1;
  if (carry) {
    out.push(carry);
    carry = 0;
    ops++;
    snap("carry", "Both lists are used up, but there's still a carry of 1: it becomes one more digit.");
  }
  snap("done", `${asNumber(a)} + ${asNumber(b)} = ${asNumber(out)}, stored as ${show(out)}.`, { done: true, answer: show(out) });
  return steps;
}

export const addTwoNumbers: PatternProblem<Input> = {
  id: "add-two-numbers",
  title: "Add Two Numbers",
  difficulty: "Medium",
  blind75: false,
  slug: "add-two-numbers",
  video: "wgFPrzTjm7s",
  statement: "Two non-negative numbers are stored as linked lists of digits, ones digit first (342 is 2→4→3). Return their sum as a list in the same form.",
  examples: [
    { label: "342 + 465", input: { a: [2, 4, 3], b: [5, 6, 4] } },
    { label: "9999 + 999", input: { a: [9, 9, 9, 9], b: [9, 9, 9] } },
    { label: "0 + 0", input: { a: [0], b: [0] } },
  ],
  random: (seed) => {
    const g = rngFor(seed);
    const make = () => {
      const n = g.int(1, 5);
      const ds = Array.from({ length: n }, () => g.int(0, 9));
      if (n > 1 && ds[n - 1] === 0) ds[n - 1] = g.int(1, 9);
      return ds;
    };
    return { a: make(), b: make() };
  },
  describe: ({ a, b }) => `l1 = ${a.join(" → ")}, l2 = ${b.join(" → ")}`,
  run,
  solve: (input) => show(addSolve(input)),
  brute: null,
  bruteIdea: "Turning both lists into numbers, adding and splitting the result back into digits fails once the numbers outgrow a 64-bit integer (lists can be 100 digits long). Digit-by-digit addition never overflows.",
  guide: {
    title: "Add Two Numbers",
    idea: [
      "This is primary-school column addition. Because the lists store the ones digit first, walking them from the head goes from the rightmost column leftwards, exactly the order addition needs.",
      "At each position add the two digits (0 if a list has run out) plus the carry. Write sum % 10 as a new node and carry sum // 10. If a carry is left at the end, it becomes one more digit.",
    ],
    whenToUse: ["Big-number arithmetic stored digit by digit.", "Loop while either list or the carry remains, so the three cases share one loop."],
    stages: [
      { id: "start", title: "carry = 0", detail: "", pseudo: "dummy = tail = ListNode(); carry = 0" },
      { id: "add", title: "Add one column", detail: "digit = (x + y + carry) % 10; carry = … // 10.", pseudo: "carry, digit = divmod(x + y + carry, 10)" },
      { id: "carry", title: "Leftover carry → one more digit", detail: "e.g. 9 + 1 = 10 needs a new 1.", pseudo: "while … or carry" },
      { id: "done", title: "Return dummy.next", detail: "", pseudo: "return dummy.next" },
    ],
    legend: [
      { tone: "current", label: "Digits being added" },
      { tone: "compare", label: "Digit just written" },
      { tone: "found", label: "Result" },
    ],
    complexity: { time: "O(max(m, n))", space: "O(1) extra", why: "One node per column; the output list itself isn't counted." },
    pitfalls: ["Forgetting the final carry (5 + 5 = 10 needs two digits).", "Lists of different lengths: treat the missing digits as 0."],
    tryThis: ["Pick “9999 + 999”: the carry ripples all the way and adds a fifth digit.", "Press “Random” and add the numbers in your head first."],
    python: py,
  },
};
