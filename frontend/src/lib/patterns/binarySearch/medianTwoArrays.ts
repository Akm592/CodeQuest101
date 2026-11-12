// Median of Two Sorted Arrays (NeetCode 150 · Binary Search).

import py from "../../guides/python/neetcode/median_two_arrays.py?raw";
import type { VizTone } from "../../guides/types";
import { row, rngFor, show } from "../helpers";
import type { PatternProblem, PatternStep } from "../types";

type Input = { a: number[]; b: number[] };
const fmt = (x: number) => (x === Infinity ? "+∞" : x === -Infinity ? "−∞" : String(x));

function run(input: Input): PatternStep[] {
  const steps: PatternStep[] = [];
  const swap = input.a.length > input.b.length;
  const [A, B] = swap ? [input.b, input.a] : [input.a, input.b];
  const total = A.length + B.length;
  const half = (total + 1) >> 1;
  let l = 0;
  let r = A.length;
  let ops = 0;
  const split = (xs: number[], cut: number, ok: boolean | null, name: string): PatternStep["rows"][number] => {
    const tones: Record<number, VizTone> = {};
    const tags: Record<number, string> = {};
    xs.forEach((_, k) => (tones[k] = k < cut ? "pointer" : "visited"));
    if (cut > 0) {
      tones[cut - 1] = ok === null ? "pointer" : ok ? "found" : "compare";
      tags[cut - 1] = `${name}left`;
    }
    if (cut < xs.length) {
      tones[cut] = ok === null ? "visited" : ok ? "found" : "compare";
      tags[cut] = `${name}right`;
    }
    return row("", xs, tones, tags);
  };
  const snap = (stage: string, i: number | null, explanation: string, ok: boolean | null, extra: Partial<PatternStep> = {}) => {
    const j = i === null ? null : half - i;
    const rows = i === null || j === null
      ? [{ ...row("", A), label: `A${swap ? " (the shorter list)" : ""}` }, { ...row("", B), label: "B" }]
      : [{ ...split(A, i, ok, "A"), label: `A${swap ? " (the shorter list)" : ""}: ${i} on the left` }, { ...split(B, j, ok, "B"), label: `B: ${j} on the left` }];
    steps.push({
      stage,
      explanation,
      rows,
      vars: [
        { name: "left half size = (m + n + 1) // 2", value: String(half) },
        { name: "range for i (taken from A)", value: `${l}..${r}` },
        ...(i !== null && j !== null
          ? [
              { name: "Aleft ≤ Bright?", value: `${fmt(i > 0 ? A[i - 1] : -Infinity)} ≤ ${fmt(j < B.length ? B[j] : Infinity)}` },
              { name: "Bleft ≤ Aright?", value: `${fmt(j > 0 ? B[j - 1] : -Infinity)} ≤ ${fmt(i < A.length ? A[i] : Infinity)}` },
            ]
          : []),
      ],
      ops,
      ...extra,
    });
  };
  snap("start", null, `Split all ${total} numbers into a left half of ${half} and a right half, with everything on the left ≤ everything on the right. Then the median sits at the boundary. Choose how many come from A (i); the other ${half} − i come from B. Binary search i over 0..${A.length}${swap ? " (searching the shorter list)" : ""}.`, null);
  for (;;) {
    const i = (l + r) >> 1;
    const j = half - i;
    ops++;
    const aL = i > 0 ? A[i - 1] : -Infinity;
    const aR = i < A.length ? A[i] : Infinity;
    const bL = j > 0 ? B[j - 1] : -Infinity;
    const bR = j < B.length ? B[j] : Infinity;
    if (aL <= bR && bL <= aR) {
      const ans = total % 2 ? Math.max(aL, bL) : (Math.max(aL, bL) + Math.min(aR, bR)) / 2;
      snap(
        "found",
        i,
        `Take ${i} from A and ${j} from B. ${fmt(aL)} ≤ ${fmt(bR)} and ${fmt(bL)} ≤ ${fmt(aR)}, so every left value is ≤ every right value: a valid split. ${total % 2 ? `The total is odd, so the median is the biggest left value: max(${fmt(aL)}, ${fmt(bL)}) = ${ans}.` : `The total is even, so the median is the average of the biggest left value and the smallest right value: (${Math.max(aL, bL)} + ${Math.min(aR, bR)}) ÷ 2 = ${ans}.`}`,
        true,
        { done: true, answer: String(ans) },
      );
      return steps;
    }
    if (aL > bR) {
      snap("fewer", i, `Take ${i} from A and ${j} from B. A's left end (${fmt(aL)}) is bigger than B's right start (${fmt(bR)}): too many from A. Take fewer: range for i becomes ${l}..${i - 1}.`, false);
      r = i - 1;
    } else {
      snap("more", i, `Take ${i} from A and ${j} from B. B's left end (${fmt(bL)}) is bigger than A's right start (${fmt(aR)}): too few from A. Take more: range for i becomes ${i + 1}..${r}.`, false);
      l = i + 1;
    }
  }
}

const merged = ({ a, b }: Input) => [...a, ...b].sort((x, y) => x - y);

export const medianTwoArrays: PatternProblem<Input> = {
  id: "median-two-arrays",
  title: "Median of Two Sorted Arrays",
  difficulty: "Hard",
  blind75: false,
  slug: "median-of-two-sorted-arrays",
  video: "q6IEA26hvXc",
  statement: "Given two sorted lists, return the median of all their numbers together (the middle value, or the average of the two middle values) in O(log(m + n)) time.",
  examples: [
    { label: "[1,3] and [2]", input: { a: [1, 3], b: [2] } },
    { label: "[1,2] and [3,4]", input: { a: [1, 2], b: [3, 4] } },
    { label: "[1,3,8,9,15] and [7,11,18,19,21,25]", input: { a: [1, 3, 8, 9, 15], b: [7, 11, 18, 19, 21, 25] } },
  ],
  random: (seed) => {
    const g = rngFor(seed);
    const make = (n: number) => Array.from({ length: n }, () => g.int(0, 20)).sort((x, y) => x - y);
    const a = make(g.int(0, 5));
    const b = make(g.int(a.length ? 0 : 1, 6));
    return { a, b };
  },
  big: { label: "100 + 100 numbers", input: () => ({ a: Array.from({ length: 100 }, (_, i) => i * 3), b: Array.from({ length: 100 }, (_, i) => i * 2 + 1) }) },
  describe: ({ a, b }) => `A = ${show(a)}, B = ${show(b)}`,
  run,
  solve: (input) => {
    const all = merged(input);
    const n = all.length;
    return n % 2 ? all[(n - 1) / 2] : (all[n / 2 - 1] + all[n / 2]) / 2;
  },
  brute: ({ a, b }) => {
    // Merge like merge sort, counting every step.
    let ops = 0;
    const all: number[] = [];
    let i = 0;
    let j = 0;
    while (i < a.length || j < b.length) {
      ops++;
      if (j >= b.length || (i < a.length && a[i] <= b[j])) all.push(a[i++]);
      else all.push(b[j++]);
    }
    const n = all.length;
    return { answer: n % 2 ? all[(n - 1) / 2] : (all[n / 2 - 1] + all[n / 2]) / 2, ops };
  },
  bruteIdea: "Merge the two lists (like merge sort) and pick the middle: O(m + n). That's often fine in practice, but the problem asks for O(log(m + n)).",
  guide: {
    title: "Median of Two Sorted Arrays",
    idea: [
      "The median splits all the numbers into a left half and a right half, where everything on the left is ≤ everything on the right. If we take i numbers from the front of A, the left half needs exactly half − i from the front of B, so choosing i decides the whole split.",
      "A split is right when A's last left value ≤ B's first right value and B's last left value ≤ A's first right value. If A's left end is too big, take fewer from A; if B's left end is too big, take more. That's a binary search on i, done over the shorter list. Missing ends count as −∞ and +∞.",
    ],
    whenToUse: ["“k-th smallest / median of two sorted lists” without merging.", "Binary searching a split point, not a value, is the hardest form of binary search in the NeetCode 150."],
    stages: [
      { id: "start", title: "Search i in 0..len(A)", detail: "A is the shorter list; j = half − i.", pseudo: "l, r = 0, len(a)" },
      { id: "fewer", title: "A's left end too big → fewer from A", detail: "a_left > b_right.", pseudo: "r = i - 1" },
      { id: "more", title: "B's left end too big → more from A", detail: "b_left > a_right.", pseudo: "l = i + 1" },
      { id: "found", title: "Valid split → median", detail: "Odd: max of the left ends. Even: average with the min of the right starts.", pseudo: "return max(a_left, b_left) or (... + min(a_right, b_right)) / 2" },
    ],
    legend: [
      { tone: "pointer", label: "In the left half" },
      { tone: "visited", label: "In the right half" },
      { tone: "compare", label: "Ends that don't fit" },
      { tone: "found", label: "Ends of a valid split" },
    ],
    complexity: { time: "O(log(min(m, n)))", space: "O(1)", why: "The binary search runs over the shorter list's possible split points." },
    pitfalls: [
      "Search the shorter list, or j = half − i can go negative or past the end of B.",
      "Use −∞ and +∞ when a side of the split is empty (i = 0, i = len(A), and the same for j).",
      "Use (m + n + 1) // 2 for the left half's size so the odd case needs only the left side.",
    ],
    tryThis: ["Pick the third example: taking 2 from A fails (19 > 8), so i moves up to 4, where 9 ≤ 18 and 11 ≤ 15 both hold.", "Press “Random”: some inputs have an empty list, so the −∞ / +∞ ends appear."],
    python: py,
  },
};
