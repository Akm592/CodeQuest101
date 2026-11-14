// Bit Manipulation (NeetCode 150): Single Number, Number of 1 Bits, Counting
// Bits, Reverse Bits, Missing Number, Sum of Two Integers, Reverse Integer.
// Numbers are shown as rows of bits (8 for small numbers; 32-bit values as a
// 4 × 8 grid, most significant byte first).

import countingPy from "../../guides/python/neetcode/counting_bits.py?raw";
import missingPy from "../../guides/python/neetcode/missing_number.py?raw";
import onesPy from "../../guides/python/neetcode/number_of_1_bits.py?raw";
import reverseBitsPy from "../../guides/python/neetcode/reverse_bits.py?raw";
import reverseIntPy from "../../guides/python/neetcode/reverse_integer.py?raw";
import singlePy from "../../guides/python/neetcode/single_number.py?raw";
import sumPy from "../../guides/python/neetcode/sum_two_integers.py?raw";
import type { VizTone } from "../../guides/types";
import { row, rngFor, show } from "../helpers";
import type { PCell, PatternProblem, PatternStep } from "../types";

/** The low `w` bits of n, most significant first. */
export const bitsOf = (n: number, w = 8) => Array.from({ length: w }, (_, i) => ((n >>> (w - 1 - i)) & 1) as 0 | 1);
const bitRow = (label: string, n: number, w = 8, tone?: (i: number) => VizTone | undefined) =>
  row(label, bitsOf(n, w), Object.fromEntries(bitsOf(n, w).map((b, i) => [i, tone?.(i) ?? (b ? "pointer" : undefined)])), Object.fromEntries(bitsOf(n, w).map((_, i) => [i, String(w - 1 - i)])));
/** A 32-bit value as 4 rows of 8 bits. */
const bitGrid = (title: string, n: number, tone?: (bit: number) => VizTone | undefined) => ({
  title,
  cells: Array.from({ length: 4 }, (_, r) =>
    Array.from({ length: 8 }, (_, c): PCell => {
      const bit = 31 - (r * 8 + c);
      const v = (n >>> bit) & 1;
      return { v: String(v), tone: tone?.(bit) ?? (v ? "pointer" : undefined) };
    }),
  ),
});

// ---------------------------------------------------------------- Single number

function singleRun(nums: number[]): PatternStep[] {
  const steps: PatternStep[] = [];
  let res = 0;
  let at = -1;
  let ops = 0;
  const snap = (stage: string, explanation: string, extra: Partial<PatternStep> = {}) =>
    steps.push({
      stage,
      explanation,
      rows: [row("nums", nums, Object.fromEntries(nums.map((_, i) => [i, i === at ? "current" : i < at ? "idle" : undefined]))), ...(at >= 0 ? [bitRow(`${nums[at]} in binary`, nums[at])] : []), bitRow("res (XOR so far)", res)],
      vars: [{ name: "res", value: String(res), tone: "found" }],
      ops,
      ...extra,
    });
  snap("start", "XOR has two useful rules: x ^ x = 0 and x ^ 0 = x, and the order doesn't matter. So XOR-ing every number cancels each pair, leaving the one that appears once.");
  nums.forEach((v, i) => {
    ops++;
    at = i;
    const before = res;
    res ^= v;
    snap("xor", `${before} ^ ${v} = ${res}: bits that differ become 1, bits that match become 0.`);
  });
  at = -1;
  snap("done", `Every pair cancelled out; ${res} is left.`, { done: true, answer: String(res) });
  return steps;
}
function singleSlow(nums: number[]) {
  let ops = 0;
  for (const v of nums) {
    let c = 0;
    for (const w of nums) {
      ops++;
      if (w === v) c++;
    }
    if (c === 1) return { answer: v, ops };
  }
  return { answer: NaN, ops };
}

export const singleNumber: PatternProblem<number[]> = {
  id: "single-number",
  title: "Single Number",
  difficulty: "Easy",
  blind75: false,
  slug: "single-number",
  video: "qMPX1AOa83k",
  statement: "Every number appears twice except one. Find that one, in linear time and constant extra space.",
  examples: [
    { label: "[4,1,2,1,2]", input: [4, 1, 2, 1, 2] },
    { label: "[2,2,1]", input: [2, 2, 1] },
    { label: "[7,3,5,3,7]", input: [7, 3, 5, 3, 7] },
  ],
  random: (seed) => {
    const g = rngFor(seed);
    const vals = g.shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]).slice(0, g.int(1, 4));
    return g.shuffle([...vals.slice(1), ...vals.slice(1), vals[0]]);
  },
  big: { label: "201 numbers", input: () => [...Array.from({ length: 100 }, (_, i) => i + 1), ...Array.from({ length: 100 }, (_, i) => 100 - i), 777] },
  describe: (n) => `nums = ${show(n)}`,
  run: singleRun,
  solve: (n) => singleSlow(n).answer,
  brute: singleSlow,
  bruteIdea: "For each number, count how many times it appears by scanning the whole list: O(n²). (A hash map is O(n) but uses O(n) memory.)",
  guide: {
    title: "Single Number",
    idea: ["x ^ x = 0, x ^ 0 = x, and XOR is commutative and associative. XOR everything: each pair cancels to 0, and 0 ^ single = single.", "One pass, one variable: O(n) time and O(1) memory."],
    whenToUse: ["“Every element appears twice except …”: XOR.", "Cancelling pairs without storing them."],
    stages: [
      { id: "start", title: "res = 0", detail: "", pseudo: "res = 0" },
      { id: "xor", title: "XOR in the next number", detail: "", pseudo: "for n in nums: res = n ^ res" },
      { id: "done", title: "The single one", detail: "", pseudo: "return res" },
    ],
    legend: [
      { tone: "current", label: "Number being XOR-ed" },
      { tone: "pointer", label: "A 1 bit" },
    ],
    complexity: { time: "O(n)", space: "O(1)", why: "One pass, one integer." },
    pitfalls: ["Only works when the others appear an even number of times.", "Start from 0, not from nums[0] twice."],
    tryThis: ["[4,1,2,1,2]: the 1s and 2s cancel, leaving 4.", "Watch res jump around before settling."],
    python: singlePy,
  },
};

// ---------------------------------------------------------------- Number of 1 bits

function onesRun(n: number): PatternStep[] {
  const steps: PatternStep[] = [];
  let x = n >>> 0;
  let count = 0;
  let ops = 0;
  const snap = (stage: string, explanation: string, extra: Partial<PatternStep> = {}) =>
    steps.push({ stage, explanation, rows: [], grid: bitGrid("n's 32 bits (row 1: bits 31–24 … row 4: bits 7–0)", x, (b) => (x >>> b) & 1 && b === Math.log2((x & -x) >>> 0) ? "current" : undefined), vars: [{ name: "n", value: String(x) }, { name: "1 bits counted", value: String(count), tone: "found" }], ops, ...extra });
  snap("start", "n & (n − 1) clears the lowest 1 bit of n: subtracting 1 flips that bit and every 0 below it, and the AND keeps only what's unchanged. Repeat until n is 0, counting the steps. It takes one step per 1 bit.");
  while (x) {
    ops++;
    const low = Math.log2((x & -x) >>> 0);
    x = (x & (x - 1)) >>> 0;
    count++;
    snap("clear", `Clear the lowest 1 bit (bit ${low}): n & (n − 1) = ${x}. Count: ${count}.`);
  }
  snap("done", `n is 0: it had ${count} bit${count === 1 ? "" : "s"} set.`, { done: true, answer: String(count) });
  return steps;
}
function onesSlow(n: number) {
  let c = 0;
  for (let i = 0; i < 32; i++) c += (n >>> i) & 1;
  return { answer: c, ops: 32 };
}

export const numberOf1Bits: PatternProblem<number> = {
  id: "number-of-1-bits",
  title: "Number of 1 Bits",
  difficulty: "Easy",
  blind75: true,
  slug: "number-of-1-bits",
  video: "5Km3utixwZs",
  statement: "Return how many bits are 1 in the binary representation of a 32-bit unsigned integer (its Hamming weight).",
  examples: [
    { label: "11 (1011)", input: 11 },
    { label: "128", input: 128 },
    { label: "2147483645", input: 2147483645 },
  ],
  random: (seed) => rngFor(seed).int(0, 4095),
  big: { label: "n = 2³¹ (one bit, at the top)", input: () => 2 ** 31 },
  describe: (n) => `n = ${n}`,
  run: onesRun,
  solve: (n) => onesSlow(n).answer,
  brute: onesSlow,
  bruteIdea: "Check all 32 bits one by one (n & 1, then shift). n & (n − 1) skips the zeros and takes one step per 1 bit.",
  guide: {
    title: "Number of 1 Bits",
    idea: ["Subtracting 1 turns the lowest 1 bit into 0 and every 0 below it into 1. ANDing with n then clears exactly that lowest 1 bit.", "Count how many times you can do that before n is 0. (Checking n & 1 and shifting right 32 times also works.)"],
    whenToUse: ["Counting or iterating over set bits: n & (n − 1).", "Checking a power of two: n > 0 and n & (n − 1) == 0."],
    stages: [
      { id: "start", title: "Count the 1 bits", detail: "", pseudo: "res = 0" },
      { id: "clear", title: "Clear the lowest 1 bit", detail: "", pseudo: "n &= n - 1; res += 1" },
      { id: "done", title: "n is 0", detail: "", pseudo: "return res" },
    ],
    legend: [
      { tone: "current", label: "The lowest 1 bit (cleared next)" },
      { tone: "pointer", label: "A 1 bit" },
    ],
    complexity: { time: "O(number of 1 bits)", space: "O(1)", why: "One step per set bit, at most 32." },
    pitfalls: ["In languages with signed integers, use an unsigned shift.", "n & (n − 1), not n & (n + 1)."],
    tryThis: ["11 = 1011: three steps.", "2³¹ takes one step instead of 32."],
    python: onesPy,
  },
};

// ---------------------------------------------------------------- Counting bits

function countingRun(n: number): PatternStep[] {
  const steps: PatternStep[] = [];
  const dp: (number | string)[] = Array(n + 1).fill("");
  let offset = 1;
  let ops = 0;
  let cur = -1;
  let from = -1;
  const snap = (stage: string, explanation: string, extra: Partial<PatternStep> = {}) =>
    steps.push({
      stage,
      explanation,
      rows: [
        row("bits[i] = number of 1 bits in i", dp, Object.fromEntries(dp.map((_, i) => [i, i === cur ? "current" : i === from ? "compare" : dp[i] !== "" ? "found" : undefined])), Object.fromEntries(dp.map((_, i) => [i, String(i)]))),
        ...(cur >= 0 ? [bitRow(`${cur} in binary`, cur, 8, (i) => (7 - i === Math.log2(offset) ? "current" : undefined))] : []),
      ],
      vars: [{ name: "offset (largest power of 2 ≤ i)", value: String(offset) }],
      ops,
      ...extra,
    });
  dp[0] = 0;
  snap("start", "Reuse earlier answers. A number i whose highest power of two is offset equals offset plus a smaller number, i − offset, which has already been counted. So bits[i] = 1 + bits[i − offset].");
  for (let i = 1; i <= n; i++) {
    ops++;
    if (offset * 2 === i) offset = i;
    cur = i;
    from = i - offset;
    dp[i] = 1 + (dp[i - offset] as number);
    snap("fill", `${i} = ${offset} + ${i - offset}: the top bit (worth ${offset}) plus the bits of ${i - offset}. bits[${i}] = 1 + bits[${i - offset}] = ${dp[i]}.`);
  }
  cur = from = -1;
  snap("done", `bits for 0..${n}: ${show(dp)}.`, { done: true, answer: show(dp) });
  return steps;
}
function countingSlow(n: number) {
  let ops = 0;
  const out = Array.from({ length: n + 1 }, (_, i) => {
    let c = 0;
    for (let x = i; x; x >>>= 1) {
      ops++;
      c += x & 1;
    }
    return c;
  });
  return { answer: show(out), ops };
}

export const countingBits: PatternProblem<number> = {
  id: "counting-bits",
  title: "Counting Bits",
  difficulty: "Easy",
  blind75: true,
  slug: "counting-bits",
  video: "RyBM56RIWrM",
  statement: "For every i from 0 to n, return how many 1 bits i has.",
  examples: [
    { label: "n = 8", input: 8 },
    { label: "n = 5 (LeetCode)", input: 5 },
  ],
  random: (seed) => rngFor(seed).int(0, 16),
  big: { label: "n = 1000", input: () => 1000 },
  describe: (n) => `n = ${n}`,
  run: countingRun,
  solve: (n) => countingSlow(n).answer,
  brute: countingSlow,
  bruteIdea: "Count each number's bits separately by shifting: about log₂(i) steps per number, O(n log n) in total.",
  guide: {
    title: "Counting Bits",
    idea: ["Every i ≥ 1 is its highest power of two plus a smaller remainder, and the remainder's count is already known. So bits[i] = 1 + bits[i − offset], where offset doubles each time i reaches the next power of two.", "That's DP over the numbers: O(n), one addition each. (bits[i] = bits[i >> 1] + (i & 1) works too.)"],
    whenToUse: ["Bit counts (or other per-number properties) for a whole range: reuse smaller numbers' answers.", "Powers of two split numbers into blocks that repeat earlier blocks."],
    stages: [
      { id: "start", title: "bits[0] = 0", detail: "", pseudo: "dp = [0] * (n + 1); offset = 1" },
      { id: "fill", title: "1 + bits[i − offset]", detail: "", pseudo: "if offset * 2 == i: offset = i; dp[i] = 1 + dp[i - offset]" },
      { id: "done", title: "The whole table", detail: "", pseudo: "return dp" },
    ],
    legend: [
      { tone: "current", label: "Number being filled / its top bit" },
      { tone: "compare", label: "The smaller number it reuses" },
      { tone: "found", label: "Filled" },
    ],
    complexity: { time: "O(n)", space: "O(n)", why: "One addition per number." },
    pitfalls: ["Update offset exactly when i reaches the next power of two.", "Return n + 1 values (0 to n)."],
    tryThis: ["n = 8: the block 4..7 repeats 0..3 with one more bit.", "bits[8] = 1 + bits[0] = 1."],
    python: countingPy,
  },
};

// ---------------------------------------------------------------- Reverse bits

function reverseBitsRun(n: number): PatternStep[] {
  const steps: PatternStep[] = [];
  const x = n >>> 0;
  let res = 0;
  let i = -1;
  let ops = 0;
  const snap = (stage: string, explanation: string, extra: Partial<PatternStep> = {}) =>
    steps.push({
      stage,
      explanation,
      rows: [],
      grid: bitGrid("result so far (the bit just placed is teal)", res >>> 0, (b) => (i >= 0 && b === 31 - i ? "current" : undefined)),
      vars: [
        { name: "n", value: String(x) },
        { name: "result", value: String(res >>> 0), tone: "found" },
      ],
      ops,
      ...extra,
    });
  snap("start", "Read n's bits from the lowest (bit 0) to the highest, and write each one into the mirrored position of the result: bit i goes to bit 31 − i.");
  for (i = 0; i < 32; i++) {
    ops++;
    const bit = (x >>> i) & 1;
    res = (res | (bit << (31 - i))) >>> 0;
    if (bit || i === 31) snap("bit", bit ? `Bit ${i} of n is 1, so set bit ${31 - i} of the result.` : `Bit ${i} of n is 0, so bit ${31 - i} stays 0. (Zero bits are skipped in the picture.)`);
  }
  i = -1;
  snap("done", `All 32 bits are mirrored: ${res >>> 0}.`, { done: true, answer: String(res >>> 0) });
  return steps;
}

export const reverseBits: PatternProblem<number> = {
  id: "reverse-bits",
  title: "Reverse Bits",
  difficulty: "Easy",
  blind75: true,
  slug: "reverse-bits",
  video: "UcoN6UjAI64",
  statement: "Reverse the bits of a 32-bit unsigned integer.",
  examples: [
    { label: "43261596 (LeetCode)", input: 43261596 },
    { label: "1", input: 1 },
    { label: "6", input: 6 },
  ],
  random: (seed) => rngFor(seed).int(0, 1000),
  describe: (n) => `n = ${n}`,
  run: reverseBitsRun,
  solve: (n) => String(parseInt([...(n >>> 0).toString(2).padStart(32, "0")].reverse().join(""), 2)),
  brute: null,
  bruteIdea: "All 32 bits have to be looked at, so 32 steps is already the least. (The answer is cross-checked by reversing the binary string.)",
  guide: {
    title: "Reverse Bits",
    idea: ["Take bit i of n with (n >> i) & 1 and place it at position 31 − i of the result with OR and a left shift.", "32 fixed steps. (Swapping halves, then quarters, … with masks does it in 5 steps.)"],
    whenToUse: ["Moving individual bits: extract with shift and AND, place with shift and OR.", "Reading and writing bits at mirrored positions."],
    stages: [
      { id: "start", title: "res = 0", detail: "", pseudo: "res = 0" },
      { id: "bit", title: "Copy bit i to bit 31 − i", detail: "", pseudo: "bit = (n >> i) & 1; res = res | (bit << (31 - i))" },
      { id: "done", title: "All 32 bits", detail: "", pseudo: "return res" },
    ],
    legend: [{ tone: "current", label: "The bit just placed" }, { tone: "pointer", label: "A 1 bit" }],
    complexity: { time: "O(32)", space: "O(1)", why: "Exactly 32 iterations." },
    pitfalls: ["Use unsigned shifts in languages with signed 32-bit ints.", "Leading zeros matter: 1 reverses to 2³¹."],
    tryThis: ["1 becomes 2147483648 (2³¹).", "6 = 110 becomes 011 followed by 29 zeros."],
    python: reverseBitsPy,
  },
};

// ---------------------------------------------------------------- Missing number

function missingRun(nums: number[]): PatternStep[] {
  const steps: PatternStep[] = [];
  const n = nums.length;
  let res = n;
  let at = -1;
  let ops = 0;
  const snap = (stage: string, explanation: string, extra: Partial<PatternStep> = {}) =>
    steps.push({ stage, explanation, rows: [row("nums", nums, Object.fromEntries(nums.map((_, i) => [i, i === at ? "current" : i < at ? "idle" : undefined])), Object.fromEntries(nums.map((_, i) => [i, `i=${i}`])))], vars: [{ name: "res", value: String(res), tone: "found" }], ops, ...extra });
  snap("start", `The numbers 0..${n} add up to more than the list does, by exactly the missing number. Start with res = ${n}, then add each index i and subtract each nums[i]: what's left is (0 + 1 + … + ${n}) − sum(nums).`);
  nums.forEach((v, i) => {
    ops++;
    at = i;
    res += i - v;
    snap("step", `Add index ${i} and subtract nums[${i}] = ${v}: res = ${res}.`);
  });
  at = -1;
  snap("done", `${res} is missing.`, { done: true, answer: String(res) });
  return steps;
}
function missingSlow(nums: number[]) {
  let ops = 0;
  for (let k = 0; k <= nums.length; k++) {
    let found = false;
    for (const v of nums) {
      ops++;
      if (v === k) {
        found = true;
        break;
      }
    }
    if (!found) return { answer: k, ops };
  }
  return { answer: -1, ops };
}

export const missingNumber: PatternProblem<number[]> = {
  id: "missing-number",
  title: "Missing Number",
  difficulty: "Easy",
  blind75: true,
  slug: "missing-number",
  video: "WnPLSRLSANE",
  statement: "nums holds n distinct numbers from 0..n. Return the one that's missing.",
  examples: [
    { label: "[3,0,1]", input: [3, 0, 1] },
    { label: "[9,6,4,2,3,5,7,0,1]", input: [9, 6, 4, 2, 3, 5, 7, 0, 1] },
    { label: "[0,1] (n missing)", input: [0, 1] },
  ],
  random: (seed) => {
    const g = rngFor(seed);
    const n = g.int(1, 8);
    const gone = g.int(0, n);
    return g.shuffle(Array.from({ length: n + 1 }, (_, i) => i).filter((v) => v !== gone));
  },
  big: { label: "200 numbers, a high one missing", input: () => Array.from({ length: 201 }, (_, i) => i).filter((v) => v !== 190) },
  describe: (n) => `nums = ${show(n)}`,
  run: missingRun,
  solve: (n) => missingSlow(n).answer,
  brute: missingSlow,
  bruteIdea: "For each candidate 0, 1, 2, …, search the list for it: O(n²).",
  guide: {
    title: "Missing Number",
    idea: ["0 + 1 + … + n minus the sum of nums is the missing number. NeetCode folds both sums into one loop: start at n, add each index, subtract each value.", "XOR works the same way: XOR all indexes, n and all values; everything present cancels."],
    whenToUse: ["“Which one is missing from 0..n”: compare the expected total with the actual one (sum or XOR).", "O(1) memory instead of a set."],
    stages: [
      { id: "start", title: "res = n", detail: "", pseudo: "res = len(nums)" },
      { id: "step", title: "Add the index, subtract the value", detail: "", pseudo: "for i in range(len(nums)): res += i - nums[i]" },
      { id: "done", title: "What's left is missing", detail: "", pseudo: "return res" },
    ],
    legend: [{ tone: "current", label: "Element being used" }],
    complexity: { time: "O(n)", space: "O(1)", why: "One pass, one number." },
    pitfalls: ["Start at n: indexes only go up to n − 1.", "The missing number can be n itself."],
    tryThis: ["[3,0,1]: 3 + (0 − 3) + (1 − 0) + (2 − 1) = 2.", "[0,1]: nothing below 2 is missing, so 2."],
    python: missingPy,
  },
};

// ---------------------------------------------------------------- Sum of two integers

type Pair = { a: number; b: number };

function sumRun({ a, b }: Pair): PatternStep[] {
  const steps: PatternStep[] = [];
  let x = a | 0;
  let y = b | 0;
  let ops = 0;
  const snap = (stage: string, explanation: string, extra: Partial<PatternStep> = {}) =>
    steps.push({
      stage,
      explanation,
      rows: [bitRow(`a = ${x} (low 8 bits)`, x), bitRow(`b = ${y}: the carries still to add`, y, 8, (i) => ((y >>> (7 - i)) & 1 ? "compare" : undefined))],
      vars: [
        { name: "a", value: String(x) },
        { name: "b", value: String(y) },
      ],
      ops,
      ...extra,
    });
  snap("start", "Binary addition without +: a ^ b adds each bit column ignoring carries; (a & b) << 1 is the carries, moved one place left. Add those two the same way, and repeat until there's nothing left to carry.");
  while (y !== 0) {
    ops++;
    const sum = x ^ y;
    const carry = (x & y) << 1;
    snap("step", `a ^ b = ${sum} (sum without carries); (a & b) << 1 = ${carry} (the carries).${carry ? " Now add those." : " No carries, so the sum is complete."}`);
    x = sum;
    y = carry;
  }
  snap("done", `No carries left: the sum is ${x}.`, { done: true, answer: String(x) });
  return steps;
}
function sumSlow({ a, b }: Pair) {
  // Count up (or down) one at a time.
  let x = a;
  let ops = 0;
  for (let i = 0; i < Math.abs(b); i++) {
    ops++;
    x += Math.sign(b);
  }
  return { answer: x, ops };
}

export const sumTwoIntegers: PatternProblem<Pair> = {
  id: "sum-two-integers",
  title: "Sum of Two Integers",
  difficulty: "Medium",
  blind75: true,
  slug: "sum-of-two-integers",
  video: "gVUrDV4tZfY",
  statement: "Return a + b without using the + or − operators.",
  examples: [
    { label: "2 + 3", input: { a: 2, b: 3 } },
    { label: "7 + 9 (lots of carries)", input: { a: 7, b: 9 } },
    { label: "−2 + 3", input: { a: -2, b: 3 } },
  ],
  random: (seed) => {
    const g = rngFor(seed);
    return { a: g.int(-20, 20), b: g.int(-20, 20) };
  },
  big: { label: "1 + 500", input: () => ({ a: 1, b: 500 }) },
  describe: ({ a, b }) => `a = ${a}, b = ${b}`,
  run: sumRun,
  solve: (p) => sumSlow(p).answer,
  brute: sumSlow,
  bruteIdea: "Count up from a, one step at a time, b times: O(b). The bit method takes at most 32 rounds.",
  guide: {
    title: "Sum of Two Integers",
    idea: ["Adding one bit column: the sum bit is a XOR b, and a carry happens when both are 1 (a AND b), going one column left. So a + b = (a ^ b) + ((a & b) << 1).", "Repeat with those two numbers until the carry is 0. In 32-bit two's complement this also handles negative numbers. (Python needs a mask, since its integers have no fixed width.)"],
    whenToUse: ["Arithmetic from bit operations: XOR for the sum, AND + shift for the carry.", "Understanding how adders work in hardware."],
    stages: [
      { id: "start", title: "Split into sum and carry", detail: "", pseudo: "while b != 0:" },
      { id: "step", title: "a ^ b and (a & b) << 1", detail: "", pseudo: "tmp = (a & b) << 1; a = a ^ b; b = tmp" },
      { id: "done", title: "No carry → a is the sum", detail: "", pseudo: "return a" },
    ],
    legend: [{ tone: "pointer", label: "A 1 bit" }, { tone: "compare", label: "A carry still to add" }],
    complexity: { time: "O(32)", space: "O(1)", why: "Each round moves the carries at least one place left." },
    pitfalls: ["In Python, mask with 0xffffffff and convert back for negatives.", "Compute the carry from the old a and b before overwriting either."],
    tryThis: ["7 + 9: the carries ripple through several rounds.", "−2 + 3: two's complement makes it just work."],
    python: sumPy,
  },
};

// ---------------------------------------------------------------- Reverse integer

const MAX = 2 ** 31 - 1;
const MIN = -(2 ** 31);

function reverseIntRun(x: number): PatternStep[] {
  const steps: PatternStep[] = [];
  let rest = x;
  let res = 0;
  const popped: number[] = [];
  let ops = 0;
  const snap = (stage: string, explanation: string, extra: Partial<PatternStep> = {}) =>
    steps.push({ stage, explanation, rows: [row("digits popped so far", popped)], vars: [{ name: "x (left)", value: String(rest) }, { name: "res", value: String(res), tone: "found" }], ops, ...extra });
  snap("start", "Pop the last digit of x (x % 10) and push it onto res (res × 10 + digit), until x is 0. The catch: without 64-bit numbers, check before each push that res × 10 + digit won't go past the 32-bit range, and return 0 if it would.");
  while (rest !== 0) {
    ops++;
    const d = Math.trunc(rest % 10);
    rest = Math.trunc(rest / 10);
    if (res > Math.trunc(MAX / 10) || (res === Math.trunc(MAX / 10) && d > MAX % 10)) {
      snap("overflow", `Pushing ${d} would make res bigger than 2³¹ − 1 = ${MAX}. Return 0.`);
      snap("done", "The reversed number doesn't fit in 32 bits: 0.", { done: true, answer: "0" });
      return steps;
    }
    if (res < Math.trunc(MIN / 10) || (res === Math.trunc(MIN / 10) && d < MIN % 10)) {
      snap("overflow", `Pushing ${d} would make res smaller than −2³¹ = ${MIN}. Return 0.`);
      snap("done", "The reversed number doesn't fit in 32 bits: 0.", { done: true, answer: "0" });
      return steps;
    }
    res = res * 10 + d;
    popped.push(d);
    snap("digit", `Pop ${d}: res = res × 10 + ${d} = ${res}.`);
  }
  snap("done", `x is used up: the reversed number is ${res}.`, { done: true, answer: String(res) });
  return steps;
}
const reverseIntCheck = (x: number) => {
  const r = Math.sign(x) * Number([...String(Math.abs(x))].reverse().join(""));
  return r > MAX || r < MIN ? 0 : r;
};

export const reverseInteger: PatternProblem<number> = {
  id: "reverse-integer",
  title: "Reverse Integer",
  difficulty: "Medium",
  blind75: false,
  slug: "reverse-integer",
  video: "HAgLH58IgJQ",
  statement: "Reverse the digits of a signed 32-bit integer. If the result would fall outside the 32-bit range, return 0. Assume 64-bit integers aren't available.",
  examples: [
    { label: "123", input: 123 },
    { label: "−120", input: -120 },
    { label: "1534236469 (overflows)", input: 1534236469 },
  ],
  random: (seed) => {
    const g = rngFor(seed);
    return g.r() < 0.15 ? g.pick([1534236469, -2147483648, 2147483647, 1463847412]) : g.int(-99999, 99999);
  },
  describe: (x) => `x = ${x}`,
  run: reverseIntRun,
  solve: (x) => reverseIntCheck(x),
  brute: null,
  bruteIdea: "Reversing the digit string is just as fast; the real problem is detecting overflow without bigger integers. The answer is cross-checked by reversing the string with full-size numbers.",
  guide: {
    title: "Reverse Integer",
    idea: ["Pop digits from the end with % 10 and push them onto the result with × 10 +. Use truncating division so negative numbers work digit by digit.", "Before each push, compare res with MAX // 10 (and the last digit with MAX % 10): if res × 10 + digit would overflow, return 0. The same on the negative side."],
    whenToUse: ["Digit-by-digit number building with a range limit: check before you multiply.", "Overflow-safe arithmetic in fixed-width integers."],
    stages: [
      { id: "start", title: "Pop and push digits", detail: "", pseudo: "res = 0" },
      { id: "digit", title: "res = res × 10 + digit", detail: "", pseudo: "digit = int(math.fmod(x, 10)); x = int(x / 10); res = res * 10 + digit" },
      { id: "overflow", title: "Would overflow → 0", detail: "", pseudo: "if res > MAX // 10 or (res == MAX // 10 and digit > MAX % 10): return 0" },
      { id: "done", title: "The reversed number", detail: "", pseudo: "return res" },
    ],
    legend: [],
    complexity: { time: "O(number of digits)", space: "O(1)", why: "At most 10 digits." },
    pitfalls: ["Check before multiplying, not after.", "Negative numbers: use truncating % and /, not floor."],
    tryThis: ["−120 → −21 (the trailing zero vanishes).", "1534236469 reversed is 9646324351, which doesn't fit: 0."],
    python: reverseIntPy,
  },
};
