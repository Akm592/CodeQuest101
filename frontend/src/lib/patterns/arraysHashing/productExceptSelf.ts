// Product of Array Except Self (NeetCode 150 · Arrays & Hashing).

import py from "../../guides/python/neetcode/product_except_self.py?raw";
import { row, rngFor, show } from "../helpers";
import type { PatternProblem, PatternStep } from "../types";

type Input = number[];
const z = (v: number) => (Object.is(v, -0) ? 0 : v);

function run(nums: Input): PatternStep[] {
  const steps: PatternStep[] = [];
  const n = nums.length;
  const answer: (number | null)[] = Array(n).fill(null);
  let ops = 0;
  const ansRow = (i: number, tone: "current" | "found") => row("answer", answer.map((v) => (v === null ? "·" : z(v))), { [i]: tone });
  let prefix = 1;
  for (let i = 0; i < n; i++) {
    answer[i] = prefix;
    ops++;
    steps.push({
      stage: "prefix",
      explanation: `Left pass: answer[${i}] = product of everything left of index ${i} = ${z(prefix)}. Then fold in nums[${i}] = ${nums[i]}.`,
      rows: [row("nums", nums, { ...Object.fromEntries(Array.from({ length: i }, (_, j) => [j, "visited"])), [i]: "current" }, { [i]: "i" }), ansRow(i, "current")],
      vars: [{ name: "prefix (before)", value: String(z(prefix)), tone: "pointer" }],
      ops,
    });
    prefix *= nums[i];
  }
  let suffix = 1;
  for (let i = n - 1; i >= 0; i--) {
    answer[i] = (answer[i] as number) * suffix;
    ops++;
    steps.push({
      stage: "suffix",
      explanation: `Right pass: multiply answer[${i}] by the product of everything right of index ${i} (${z(suffix)}). It's now left × right = ${z(answer[i] as number)}.`,
      rows: [row("nums", nums, { ...Object.fromEntries(Array.from({ length: n - 1 - i }, (_, j) => [n - 1 - j, "visited"])), [i]: "current" }, { [i]: "i" }), ansRow(i, "found")],
      vars: [{ name: "suffix (before)", value: String(z(suffix)), tone: "pointer" }],
      ops,
    });
    suffix *= nums[i];
  }
  steps.push({ stage: "done", explanation: "Every slot is (product of the left side) × (product of the right side). No division needed.", rows: [row("nums", nums), row("answer", answer.map((v) => z(v as number)), Object.fromEntries(answer.map((_, j) => [j, "found"])))], vars: [], ops, done: true, answer: show(answer.map((v) => z(v as number))) });
  return steps;
}

export const productExceptSelf: PatternProblem<Input> = {
  id: "product-except-self",
  title: "Product of Array Except Self",
  difficulty: "Medium",
  blind75: true,
  slug: "product-of-array-except-self",
  video: "bNvIQI2wAjk",
  statement: "Given a list of numbers, return a list where each position holds the product of all the other numbers. Do it in O(n) time without using division.",
  examples: [
    { label: "[1, 2, 3, 4]", input: [1, 2, 3, 4] },
    { label: "[-1, 1, 0, -3, 3]", input: [-1, 1, 0, -3, 3] },
    { label: "[2, 3, 5]", input: [2, 3, 5] },
  ],
  random: (seed) => {
    const g = rngFor(seed);
    return Array.from({ length: g.int(3, 6) }, () => g.int(-3, 5));
  },
  big: { label: "200 numbers", input: () => Array.from({ length: 200 }, (_, i) => (i % 7 === 0 ? -1 : 1)) },
  describe: (nums) => `nums = ${show(nums)}`,
  run,
  solve: (nums) => nums.map((_, i) => z(nums.reduce((p, v, j) => (j === i ? p : p * v), 1))),
  brute: (nums) => {
    let ops = 0;
    const out = nums.map((_, i) => {
      let p = 1;
      for (let j = 0; j < nums.length; j++) {
        if (j === i) continue;
        ops++;
        p *= nums[j];
      }
      return z(p);
    });
    return { answer: out, ops };
  },
  bruteIdea: "For each position, multiply all the other numbers: n × (n − 1) multiplications.",
  canon: (a) => (a as number[]).map(z),
  guide: {
    title: "Product of Array Except Self",
    idea: [
      "The product of everything except nums[i] is (everything to its left) × (everything to its right).",
      "So make two passes. Going left to right, carry a running “prefix” product and store it in answer[i]. Going right to left, carry a running “suffix” product and multiply it in. Each slot ends as left × right.",
    ],
    whenToUse: ["“Something about everything except i”, or range products and sums: think prefix and suffix passes.", "Prefix sums are the additive cousin: sum of a range = prefix[r] − prefix[l]."],
    stages: [
      { id: "prefix", title: "Left pass: products to the left", detail: "answer[i] gets the running product of nums[0..i−1].", pseudo: "answer[i] = prefix; prefix *= nums[i]" },
      { id: "suffix", title: "Right pass: times products to the right", detail: "Multiply in the running product of nums[i+1..].", pseudo: "answer[i] *= suffix; suffix *= nums[i]" },
      { id: "done", title: "Each slot = left × right", detail: "No division, so zeros are handled correctly.", pseudo: "return answer" },
    ],
    legend: [
      { tone: "current", label: "Index being filled" },
      { tone: "visited", label: "Already folded into the running product" },
      { tone: "found", label: "Final value" },
    ],
    complexity: { time: "O(n)", space: "O(1) extra", why: "Two passes. Apart from the answer list, only two numbers (prefix and suffix) are stored." },
    pitfalls: [
      "Dividing the total product by nums[i] is banned, and it breaks when a number is 0.",
      "Store the running product before multiplying in nums[i], or each slot would include itself.",
    ],
    tryThis: ["Pick “[-1, 1, 0, -3, 3]”: only the slot of the 0 isn't 0.", "Step back and forth to see the left pass and right pass meet."],
    python: py,
  },
};
