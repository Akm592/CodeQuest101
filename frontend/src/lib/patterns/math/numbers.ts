// The number problems of Math & Geometry (NeetCode 150): Happy Number, Plus
// One, Pow(x, n), Multiply Strings and Detect Squares.

import squaresPy from "../../guides/python/neetcode/detect_squares.py?raw";
import happyPy from "../../guides/python/neetcode/happy_number.py?raw";
import multiplyPy from "../../guides/python/neetcode/multiply_strings.py?raw";
import plusPy from "../../guides/python/neetcode/plus_one.py?raw";
import powPy from "../../guides/python/neetcode/pow_x_n.py?raw";
import { row, rngFor, show } from "../helpers";
import type { PEntry, PatternProblem, PatternStep } from "../types";

const sumSq = (n: number) => [...String(n)].reduce((s, d) => s + Number(d) ** 2, 0);

// ---------------------------------------------------------------- Happy number

function happyRun(n: number): PatternStep[] {
  const steps: PatternStep[] = [];
  const seq = [n];
  const seen = new Set<number>([n]);
  let ops = 0;
  const snap = (stage: string, explanation: string, extra: Partial<PatternStep> = {}) =>
    steps.push({
      stage,
      explanation,
      rows: [row("the sequence", seq, Object.fromEntries(seq.map((v, i) => [i, i === seq.length - 1 ? (v === 1 ? "found" : seen.has(v) && seq.indexOf(v) !== i ? "swap" : "current") : v === seq.at(-1) ? "swap" : undefined])))],
      vars: [{ name: "numbers seen", value: String(seen.size) }],
      ops,
      ...extra,
    });
  snap("start", `Repeatedly replace the number by the sum of the squares of its digits. Either you reach 1 (happy), or the numbers repeat forever. A set of numbers seen so far catches the repeat.`);
  let x = n;
  while (x !== 1) {
    ops++;
    const next = sumSq(x);
    const digits = [...String(x)].map((d) => `${d}²`).join(" + ");
    seq.push(next);
    if (seen.has(next)) {
      snap("loop", `${digits} = ${next}, which was seen before: the sequence is stuck in a loop and will never reach 1.`);
      snap("done", `${n} is not a happy number.`, { done: true, answer: "false" });
      return steps;
    }
    seen.add(next);
    x = next;
    snap(next === 1 ? "one" : "next", `${digits} = ${next}.${next === 1 ? " That's 1!" : ""}`);
  }
  snap("done", `${n} is a happy number.`, { done: true, answer: "true" });
  return steps;
}
function happySlow(n: number) {
  // Run a fixed, generous number of rounds instead of detecting the loop.
  let x = n;
  let ops = 0;
  for (let i = 0; i < 1000 && x !== 1; i++) {
    ops++;
    x = sumSq(x);
  }
  return { answer: x === 1, ops };
}

export const happyNumber: PatternProblem<number> = {
  id: "happy-number",
  title: "Happy Number",
  difficulty: "Easy",
  blind75: false,
  slug: "happy-number",
  video: "ljz85bxOYJ0",
  statement: "Replace n by the sum of the squares of its digits, again and again. n is happy if this reaches 1. Return whether n is happy.",
  examples: [
    { label: "19 (happy)", input: 19 },
    { label: "2 (loops)", input: 2 },
    { label: "7 (happy)", input: 7 },
  ],
  random: (seed) => rngFor(seed).int(1, 99),
  big: { label: "n = 4 (the 8-number loop)", input: () => 4 },
  describe: (n) => `n = ${n}`,
  run: happyRun,
  solve: (n) => happySlow(n).answer,
  brute: happySlow,
  bruteIdea: "Without loop detection you'd just keep going for some large number of rounds and hope: 1,000 rounds here. The set stops at the first repeat.",
  guide: {
    title: "Happy Number",
    idea: [
      "The sequence either reaches 1 or falls into a cycle (the numbers can't grow forever: a number with d digits maps to at most 81·d). So detect the cycle: keep a set of numbers seen and stop at the first repeat.",
      "Floyd's fast and slow pointers (as in Linked List Cycle) do the same with O(1) memory.",
    ],
    whenToUse: ["Iterating a function until it repeats: a visited set, or fast/slow pointers.", "The same trick as cycle detection in a linked list."],
    stages: [
      { id: "start", title: "Start with n", detail: "", pseudo: "visit = set()" },
      { id: "next", title: "Sum of squared digits", detail: "", pseudo: "visit.add(n); n = sum_of_squares(n)" },
      { id: "one", title: "Reached 1 → happy", detail: "", pseudo: "if n == 1: return True" },
      { id: "loop", title: "Seen before → loop", detail: "", pseudo: "while n not in visit: ...; return False" },
      { id: "done", title: "Answer", detail: "", pseudo: "" },
    ],
    legend: [
      { tone: "current", label: "Latest number" },
      { tone: "found", label: "Reached 1" },
      { tone: "swap", label: "The repeat" },
    ],
    complexity: { time: "O(log n) per step", space: "O(number of steps)", why: "Numbers quickly shrink below 243; after that the sequence repeats within a few dozen steps." },
    pitfalls: ["Without a stopping rule, an unhappy number loops forever.", "Check for 1 before checking the set."],
    tryThis: ["19 → 82 → 68 → 100 → 1.", "2 falls into the loop 4 → 16 → 37 → 58 → 89 → 145 → 42 → 20 → 4."],
    python: happyPy,
  },
};

// ---------------------------------------------------------------- Plus one

function plusRun(digits: number[]): PatternStep[] {
  const steps: PatternStep[] = [];
  const d = [...digits];
  let at = d.length - 1;
  let carry = 1;
  let ops = 0;
  const snap = (stage: string, explanation: string, extra: Partial<PatternStep> = {}) =>
    steps.push({
      stage,
      explanation,
      rows: [row("digits", d, Object.fromEntries(d.map((_, i) => [i, i === at ? "current" : i > at ? "found" : undefined])))],
      vars: [{ name: "carry", value: String(carry), tone: carry ? "compare" : undefined }],
      ops,
      ...extra,
    });
  snap("start", "Add 1 at the last digit, like on paper. A 9 becomes 0 and carries 1 to the left; any other digit just goes up by one and the carry stops.");
  while (at >= 0 && carry) {
    ops++;
    if (d[at] === 9) {
      d[at] = 0;
      snap("carry", `Digit ${at} is 9: 9 + 1 = 10, so write 0 and carry 1 to the left.`);
      at--;
    } else {
      d[at]++;
      carry = 0;
      snap("stop", `Digit ${at} becomes ${d[at]}. No carry left: done.`);
    }
  }
  if (carry) {
    d.unshift(1);
    at = 0;
    snap("grow", "The carry went past the first digit (all 9s): put a new 1 in front.");
  }
  at = -1;
  snap("done", `Result: ${show(d)}.`, { done: true, answer: show(d) });
  return steps;
}

export const plusOne: PatternProblem<number[]> = {
  id: "plus-one",
  title: "Plus One",
  difficulty: "Easy",
  blind75: false,
  slug: "plus-one",
  video: "jIaA8boiG1s",
  statement: "A large number is given as a list of its digits. Add one to it and return the new list of digits.",
  examples: [
    { label: "[1,2,3]", input: [1, 2, 3] },
    { label: "[1,2,9,9]", input: [1, 2, 9, 9] },
    { label: "[9,9,9]", input: [9, 9, 9] },
  ],
  random: (seed) => {
    const g = rngFor(seed);
    return Array.from({ length: g.int(1, 6) }, (_, i) => (i === 0 ? g.int(1, 9) : g.pick([9, 9, 9, 0, 1, 5])));
  },
  describe: (d) => `digits = ${show(d)}`,
  run: plusRun,
  solve: (d) => show([...String(BigInt(d.join("")) + 1n)].map(Number)),
  brute: null,
  bruteIdea: "Nothing slower is worth comparing: the carry stops at the first digit that isn't 9. The answer is cross-checked with big-integer arithmetic.",
  guide: {
    title: "Plus One",
    idea: ["Start at the last digit with a carry of 1. A 9 plus the carry is 10: write 0 and keep carrying. Any other digit absorbs the carry and you're done.", "If the carry survives past the first digit, the number was all 9s: prepend a 1."],
    whenToUse: ["Arithmetic on numbers stored as digit lists (too big for a machine integer).", "Most of the time the loop stops after one digit."],
    stages: [
      { id: "start", title: "Carry 1 from the end", detail: "", pseudo: "digits = digits[::-1]; one, i = 1, 0" },
      { id: "carry", title: "9 → 0, keep carrying", detail: "", pseudo: "if digits[i] == 9: digits[i] = 0" },
      { id: "stop", title: "Other digit → +1, stop", detail: "", pseudo: "else: digits[i] += 1; one = 0" },
      { id: "grow", title: "All 9s → prepend 1", detail: "", pseudo: "digits.append(1)" },
      { id: "done", title: "Result", detail: "", pseudo: "return digits[::-1]" },
    ],
    legend: [
      { tone: "current", label: "Digit being changed" },
      { tone: "found", label: "Already handled" },
    ],
    complexity: { time: "O(n)", space: "O(1)", why: "At most one pass from the end." },
    pitfalls: ["All 9s needs one extra digit.", "Don't convert to a number: the input can be longer than any integer type."],
    tryThis: ["[1,2,9,9] → [1,3,0,0].", "[9,9,9] → [1,0,0,0]."],
    python: plusPy,
  },
};

// ---------------------------------------------------------------- Pow(x, n)

type Pow = { x: number; n: number };
const fmt = (v: number) => (Number.isInteger(v) ? String(v) : Number(v.toPrecision(12)).toString());

function powRun({ x, n }: Pow): PatternStep[] {
  const steps: PatternStep[] = [];
  const calls: string[] = [];
  let ops = 0;
  const snap = (stage: string, explanation: string, extra: Partial<PatternStep> = {}) =>
    steps.push({ stage, explanation, rows: [row("call stack: helper(x, n)", calls, calls.length ? { [calls.length - 1]: "current" } : {})], vars: [{ name: "x", value: fmt(x) }, { name: "n", value: String(n) }], ops, ...extra });
  snap("start", `x^n by halving: x^n = (x^(n/2))², times one more x if n is odd. That needs about log₂(${Math.abs(n) || 1}) ≈ ${Math.max(1, Math.ceil(Math.log2(Math.abs(n) + 1)))} steps instead of ${Math.abs(n)} multiplications. A negative n means 1 / x^|n|.`);
  const helper = (b: number, e: number): number => {
    calls.push(`(${fmt(b)}, ${e})`);
    if (e === 0) {
      snap("base", `helper(${fmt(b)}, 0) = 1: anything to the power 0 is 1.`);
      calls.pop();
      return 1;
    }
    snap("halve", `helper(${fmt(b)}, ${e}): first compute ${fmt(b)}^${Math.floor(e / 2)}.`);
    const half = helper(b, Math.floor(e / 2));
    ops++;
    const res = e % 2 ? b * half * half : half * half;
    calls.pop();
    calls.push(`(${fmt(b)}, ${e})`);
    snap("combine", `${fmt(b)}^${e} = (${fmt(b)}^${Math.floor(e / 2)})²${e % 2 ? ` × ${fmt(b)}` : ""} = ${fmt(half)}²${e % 2 ? ` × ${fmt(b)}` : ""} = ${fmt(res)}.`);
    calls.pop();
    return res;
  };
  const r = helper(x, Math.abs(n));
  const ans = n >= 0 ? r : 1 / r;
  snap("done", n >= 0 ? `${fmt(x)}^${n} = ${fmt(ans)}.` : `n is negative: 1 / ${fmt(r)} = ${fmt(ans)}.`, { done: true, answer: fmt(ans) });
  return steps;
}
function powSlow({ x, n }: Pow) {
  let r = 1;
  let ops = 0;
  for (let i = 0; i < Math.abs(n); i++) {
    ops++;
    r *= x;
  }
  return { answer: fmt(n >= 0 ? r : 1 / r), ops };
}

export const powXN: PatternProblem<Pow> = {
  id: "pow-x-n",
  title: "Pow(x, n)",
  difficulty: "Medium",
  blind75: false,
  slug: "powx-n",
  video: "g9YQyYi4IQQ",
  statement: "Compute x raised to the integer power n (which may be negative) without a built-in power function.",
  examples: [
    { label: "2^10", input: { x: 2, n: 10 } },
    { label: "2^−2", input: { x: 2, n: -2 } },
    { label: "3^13", input: { x: 3, n: 13 } },
  ],
  random: (seed) => {
    const g = rngFor(seed);
    return { x: g.pick([2, 3, -2, 0.5, 1.5]), n: g.int(-6, 12) };
  },
  big: { label: "1.0001^5000", input: () => ({ x: 1.0001, n: 5000 }) },
  describe: ({ x, n }) => `x = ${x}, n = ${n}`,
  run: powRun,
  solve: (i) => powSlow(i).answer,
  brute: powSlow,
  bruteIdea: "Multiply x by itself |n| times: O(n). Halving needs only O(log n) multiplications.",
  canon: (a) => Number(Number(a).toPrecision(9)),
  guide: {
    title: "Pow(x, n)",
    idea: ["x^n = x^(n/2) · x^(n/2), with an extra x when n is odd. Compute x^(n/2) once and square it: each step halves n, so it takes O(log n) multiplications.", "For negative n, compute x^|n| and take its reciprocal."],
    whenToUse: ["Repeated multiplication (powers, matrix powers, modular exponentiation): square-and-multiply.", "Any problem where a step can be applied “twice as much” by squaring."],
    stages: [
      { id: "start", title: "Halve the exponent", detail: "", pseudo: "res = helper(x, abs(n))" },
      { id: "halve", title: "Recurse on n // 2", detail: "", pseudo: "res = helper(x, n // 2)" },
      { id: "base", title: "n = 0 → 1", detail: "", pseudo: "if n == 0: return 1" },
      { id: "combine", title: "Square it (× x if n is odd)", detail: "", pseudo: "res = res * res; return x * res if n % 2 else res" },
      { id: "done", title: "Reciprocal if n < 0", detail: "", pseudo: "return res if n >= 0 else 1 / res" },
    ],
    legend: [{ tone: "current", label: "Current call" }],
    complexity: { time: "O(log n)", space: "O(log n)", why: "Each call halves n; the recursion is that deep." },
    pitfalls: ["Use |n|, then take the reciprocal; don't recurse on negative n.", "x = 0 with negative n has no answer (LeetCode avoids it)."],
    tryThis: ["2^10: 10 → 5 → 2 → 1 → 0, four multiplications instead of ten.", "3^13: 13 is odd at the top, so there's an extra × 3."],
    python: powPy,
  },
};

// ---------------------------------------------------------------- Multiply strings

type Two = { a: string; b: string };

function multiplyRun({ a, b }: Two): PatternStep[] {
  const steps: PatternStep[] = [];
  const res = Array<number>(a.length + b.length).fill(0);
  let hot: [number, number] = [-1, -1];
  let pos: number[] = [];
  let ops = 0;
  const snap = (stage: string, explanation: string, extra: Partial<PatternStep> = {}) =>
    steps.push({
      stage,
      explanation,
      rows: [
        row("num1", [...a], { [hot[0]]: "current" }),
        row("num2", [...b], { [hot[1]]: "current" }),
        row("result digits (most significant first)", res, Object.fromEntries(pos.map((p) => [p, "compare"]))),
      ],
      vars: [],
      ops,
      ...extra,
    });
  if (a === "0" || b === "0") {
    snap("start", "One of the numbers is 0, so the product is 0.");
    snap("done", "Result: “0”.", { done: true, answer: '"0"' });
    return steps;
  }
  snap("start", `Grade-school multiplication. Digit i of num1 times digit j of num2 lands in result position i + j + 1, and its carry in i + j. A result of ${a.length} + ${b.length} = ${res.length} digits is always long enough.`);
  for (let i = a.length - 1; i >= 0; i--)
    for (let j = b.length - 1; j >= 0; j--) {
      ops++;
      const p = Number(a[i]) * Number(b[j]) + res[i + j + 1];
      res[i + j + 1] = p % 10;
      res[i + j] += Math.floor(p / 10);
      hot = [i, j];
      pos = [i + j, i + j + 1];
      snap("digit", `${a[i]} × ${b[j]} = ${Number(a[i]) * Number(b[j])}, plus the ${p - Number(a[i]) * Number(b[j])} already at position ${i + j + 1}, is ${p}: keep ${p % 10} there and carry ${Math.floor(p / 10)} to position ${i + j}.`);
    }
  hot = [-1, -1];
  pos = [];
  const s = res.join("").replace(/^0+/, "");
  snap("done", `Drop any leading zeros: “${s}”.`, { done: true, answer: `"${s}"` });
  return steps;
}

export const multiplyStrings: PatternProblem<Two> = {
  id: "multiply-strings",
  title: "Multiply Strings",
  difficulty: "Medium",
  blind75: false,
  slug: "multiply-strings",
  video: "1vZswirL8Y8",
  statement: "Multiply two non-negative integers given as strings and return the product as a string, without converting them to numbers directly.",
  examples: [
    { label: "123 × 456", input: { a: "123", b: "456" } },
    { label: "99 × 99", input: { a: "99", b: "99" } },
    { label: "times 0", input: { a: "12", b: "0" } },
  ],
  random: (seed) => {
    const g = rngFor(seed);
    const num = () => (g.r() < 0.1 ? "0" : String(g.int(1, 9)) + Array.from({ length: g.int(0, 2) }, () => g.int(0, 9)).join(""));
    return { a: num(), b: num() };
  },
  describe: ({ a, b }) => `num1 = "${a}", num2 = "${b}"`,
  run: multiplyRun,
  solve: ({ a, b }) => `"${BigInt(a) * BigInt(b)}"`,
  brute: null,
  bruteIdea: "Adding num1 to itself num2 times would be hopelessly slow; grade-school multiplication's O(m × n) digit products is the standard. The answer is cross-checked with big-integer arithmetic.",
  guide: {
    title: "Multiply Strings",
    idea: [
      "Multiply digit by digit like on paper. The product of num1[i] and num2[j] belongs at position i + j + 1 of the result (counting from the left), and its tens digit carries into position i + j.",
      "Use an array of len1 + len2 digits, add each product into it, then strip leading zeros.",
    ],
    whenToUse: ["Arithmetic on numbers too big for built-in types: digit arrays and carries.", "The position rule i + j + 1 avoids building and adding separate rows."],
    stages: [
      { id: "start", title: "A zero-filled result of len1 + len2 digits", detail: "", pseudo: "res = [0] * (len(num1) + len(num2))" },
      { id: "digit", title: "Add one digit product, carry", detail: "", pseudo: "digit = int(num1[i]) * int(num2[j]); res[i + j] += digit; res[i + j + 1] += res[i + j] // 10; res[i + j] %= 10" },
      { id: "done", title: "Strip leading zeros", detail: "", pseudo: "return ''.join(map(str, res[beg:]))" },
    ],
    legend: [
      { tone: "current", label: "Digits being multiplied" },
      { tone: "compare", label: "Result positions updated" },
    ],
    complexity: { time: "O(m × n)", space: "O(m + n)", why: "One product per pair of digits." },
    pitfalls: ["Handle “0” separately, or the result is all zeros stripped to an empty string.", "NeetCode reverses the strings so index 0 is the ones digit; this version keeps them in order."],
    tryThis: ["123 × 456 = 56088.", "99 × 99 = 9801 needs carries at every step."],
    python: multiplyPy,
  },
};

// ---------------------------------------------------------------- Detect squares

type Calls = { calls: string[] };

function squaresRun({ calls }: Calls): PatternStep[] {
  const steps: PatternStep[] = [];
  const count = new Map<string, number>();
  const pts: [number, number][] = [];
  const out: number[] = [];
  let k = -1;
  let hot: string[] = [];
  let ops = 0;
  const snap = (stage: string, explanation: string, extra: Partial<PatternStep> = {}) =>
    steps.push({
      stage,
      explanation,
      rows: [row("calls", calls, Object.fromEntries(calls.map((_, j) => [j, j < k ? "idle" : j === k ? "current" : undefined]))), row("count results", out)],
      map: { title: "point → how many times it was added", entries: [...count.entries()].map(([p, c]): PEntry => ({ k: `(${p})`, v: String(c), tone: hot.includes(p) ? "found" : undefined })) },
      vars: [],
      ops,
      ...extra,
    });
  snap("start", "Store how many times each point was added. To count squares with a corner at the query point q, try every stored point p that is diagonal to q (|px − qx| = |py − qy| ≠ 0). The other two corners are then fixed: (px, qy) and (qx, py). Multiply their counts.");
  calls.forEach((call, j) => {
    k = j;
    const [op, xs, ys] = call.split(" ");
    const x = Number(xs);
    const y = Number(ys);
    ops++;
    if (op === "add") {
      const key = `${x},${y}`;
      if (!count.has(key)) pts.push([x, y]);
      count.set(key, (count.get(key) ?? 0) + 1);
      hot = [key];
      snap("add", `add (${x},${y}): it's now been added ${count.get(key)} time${count.get(key) === 1 ? "" : "s"}.`);
      return;
    }
    let total = 0;
    const found: string[] = [];
    hot = [];
    for (const [px, py] of pts) {
      ops++;
      if (Math.abs(px - x) !== Math.abs(py - y) || px === x) continue;
      const c = (count.get(`${px},${py}`) ?? 0) * (count.get(`${px},${y}`) ?? 0) * (count.get(`${x},${py}`) ?? 0);
      if (c) {
        total += c;
        found.push(`diagonal (${px},${py}) with (${px},${y}) and (${x},${py}): ${c}`);
        hot.push(`${px},${py}`, `${px},${y}`, `${x},${py}`);
      }
    }
    out.push(total);
    snap("count", found.length ? `count (${x},${y}): ${found.join("; ")}. Total ${total}.` : `count (${x},${y}): no diagonal point has both other corners. 0 squares.`);
  });
  k = calls.length;
  hot = [];
  snap("done", `The counts were ${show(out)}.`, { done: true, answer: show(out) });
  return steps;
}
function squaresSlow({ calls }: Calls) {
  // For each query, try every triple of stored points (with repeats).
  const pts: [number, number][] = [];
  const out: number[] = [];
  let ops = 0;
  for (const call of calls) {
    const [op, xs, ys] = call.split(" ");
    const x = Number(xs);
    const y = Number(ys);
    if (op === "add") {
      pts.push([x, y]);
      continue;
    }
    let total = 0;
    for (let a = 0; a < pts.length; a++)
      for (let b = 0; b < pts.length; b++)
        for (let c = 0; c < pts.length; c++) {
          ops++;
          const [p, q, r] = [pts[a], pts[b], pts[c]];
          // p is the diagonal corner; q shares p's x and the query's y; r shares the query's x and p's y.
          if (p[0] !== x && Math.abs(p[0] - x) === Math.abs(p[1] - y) && q[0] === p[0] && q[1] === y && r[0] === x && r[1] === p[1]) total++;
        }
    out.push(total);
  }
  return { answer: show(out), ops };
}

export const detectSquares: PatternProblem<Calls> = {
  id: "detect-squares",
  title: "Detect Squares",
  difficulty: "Medium",
  blind75: false,
  slug: "detect-squares",
  video: "bahebearrDc",
  statement: "Design a structure with add(point), which may add the same point more than once, and count(point), which returns how many axis-aligned squares (positive area) have the query point as one corner and stored points as the other three.",
  examples: [
    { label: "LeetCode's example", input: { calls: ["add 3 10", "add 11 2", "add 3 2", "count 11 10", "count 14 8", "add 11 2", "count 11 10"] } },
    { label: "two squares", input: { calls: ["add 0 0", "add 0 2", "add 2 0", "add 0 4", "add 4 0", "count 2 2", "count 4 4"] } },
  ],
  random: (seed) => {
    const g = rngFor(seed);
    return { calls: Array.from({ length: g.int(4, 9) }, (_, i) => `${i < 3 || g.r() < 0.65 ? "add" : "count"} ${g.int(0, 3)} ${g.int(0, 3)}`).concat(`count ${g.int(0, 3)} ${g.int(0, 3)}`) };
  },
  big: {
    label: "40 points, 10 counts",
    input: () => ({ calls: [...Array.from({ length: 40 }, (_, i) => `add ${i % 7} ${(i * 3) % 7}`), ...Array.from({ length: 10 }, (_, i) => `count ${i % 7} ${(i * 2) % 7}`)] }),
  },
  describe: ({ calls }) => calls.join(", "),
  run: squaresRun,
  solve: (i) => squaresSlow(i).answer,
  brute: squaresSlow,
  bruteIdea: "For each count, try every triple of stored points as the other three corners: O(n³) per query.",
  guide: {
    title: "Detect Squares",
    idea: [
      "A square with corner q is fixed by its opposite (diagonal) corner p: the other two corners must be (px, qy) and (qx, py). So for a count, loop over the distinct stored points p that are diagonal to q (equal |dx| and |dy|, not zero).",
      "Since points can repeat, multiply the counts: count[p] × count[(px, qy)] × count[(qx, py)] squares for that diagonal. Add over all diagonals.",
    ],
    whenToUse: ["Counting shapes through a point: fix one defining point (the diagonal) and look the rest up in a hash map.", "Multiplicities: multiply counts instead of listing combinations."],
    stages: [
      { id: "start", title: "Count each point", detail: "", pseudo: "self.pts_count = defaultdict(int); self.pts = []" },
      { id: "add", title: "add: one more of this point", detail: "", pseudo: "self.pts_count[tuple(point)] += 1; self.pts.append(point)" },
      { id: "count", title: "count: each diagonal × the two other corners", detail: "", pseudo: "if abs(py - y) != abs(px - x) or x == px or y == py: continue; res += self.pts_count[(x, py)] * self.pts_count[(px, y)]" },
      { id: "done", title: "All calls answered", detail: "", pseudo: "" },
    ],
    legend: [
      { tone: "current", label: "Current call" },
      { tone: "found", label: "Corners of the squares found" },
    ],
    complexity: { time: "O(n) per count", space: "O(n)", why: "One pass over the stored points per query; lookups are O(1)." },
    pitfalls: ["Skip diagonals with zero size (px = qx).", "Duplicates multiply: two copies of a corner double the squares."],
    tryThis: ["LeetCode's example: after the second add (11, 2), the same query finds 2 squares.", "“Two squares”: (2,2) completes the 2 × 2 square, (4,4) the 4 × 4 one."],
    python: squaresPy,
  },
};
