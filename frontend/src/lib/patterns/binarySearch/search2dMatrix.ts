// Search a 2D Matrix (NeetCode 150 · Binary Search).

import py from "../../guides/python/neetcode/search_2d_matrix.py?raw";
import type { VizTone } from "../../guides/types";
import { rngFor } from "../helpers";
import type { PCell, PatternProblem, PatternStep } from "../types";

type Input = { matrix: number[][]; target: number };

function run({ matrix, target }: Input): PatternStep[] {
  const steps: PatternStep[] = [];
  const rows = matrix.length;
  const cols = matrix[0].length;
  let ops = 0;
  let top = 0;
  let bot = rows - 1;
  const grid = (tone: (r: number, c: number) => VizTone | undefined, tags: Record<string, string> = {}): PCell[][] =>
    matrix.map((line, r) => line.map((v, c) => ({ v: String(v), tone: tone(r, c), tag: tags[`${r},${c}`] })));
  const snap = (stage: string, explanation: string, cells: PCell[][], vars: PatternStep["vars"], extra: Partial<PatternStep> = {}) =>
    steps.push({ stage, explanation, rows: [], grid: { title: "matrix (each row sorted, rows in order)", cells }, vars: [{ name: "target", value: String(target) }, ...vars], ops, ...extra });

  snap("start", `Read row by row, the whole matrix is one sorted list. First binary search for the row that could hold ${target}, then binary search inside that row.`, grid(() => undefined), [{ name: "rows in range", value: `${top}..${bot}` }]);
  let row = -1;
  while (top <= bot) {
    const m = (top + bot) >> 1;
    ops++;
    const first = matrix[m][0];
    const last = matrix[m][cols - 1];
    const tone = (r: number, c: number): VizTone | undefined => (r < top || r > bot ? "idle" : r === m && (c === 0 || c === cols - 1) ? "compare" : r === m ? "pointer" : undefined);
    if (target > last) {
      snap("row", `Middle row ${m} runs from ${first} to ${last}. ${target} is bigger than its last value, so it can only be in a lower row: top = ${m + 1}.`, grid(tone), [{ name: "rows in range", value: `${top}..${bot}` }, { name: "middle row", value: String(m), tone: "compare" }]);
      top = m + 1;
    } else if (target < first) {
      snap("row", `Middle row ${m} runs from ${first} to ${last}. ${target} is smaller than its first value, so it can only be in a higher row: bottom = ${m - 1}.`, grid(tone), [{ name: "rows in range", value: `${top}..${bot}` }, { name: "middle row", value: String(m), tone: "compare" }]);
      bot = m - 1;
    } else {
      row = m;
      snap("row", `Row ${m} runs from ${first} to ${last}, and ${target} is in that range. If it's anywhere, it's in this row.`, grid(tone), [{ name: "row", value: String(m), tone: "pointer" }]);
      break;
    }
  }
  if (row < 0) {
    snap("missing", `No row's range contains ${target}, so it isn't in the matrix.`, grid(() => "idle"), [], { done: true, answer: "false" });
    return steps;
  }
  let l = 0;
  let r = cols - 1;
  while (l <= r) {
    const m = (l + r) >> 1;
    ops++;
    const v = matrix[row][m];
    const tags: Record<string, string> = {};
    for (const [c, t] of [[l, "L"], [m, "M"], [r, "R"]] as const) tags[`${row},${c}`] = (tags[`${row},${c}`] ?? "") + t;
    const tone = (rr: number, c: number): VizTone | undefined => (rr !== row || c < l || c > r ? "idle" : c === m ? (v === target ? "found" : "compare") : "pointer");
    if (v === target) {
      snap("found", `matrix[${row}][${m}] = ${target}. Found it.`, grid(tone, tags), [{ name: "cell", value: `(${row}, ${m})`, tone: "found" }], { done: true, answer: "true" });
      return steps;
    }
    snap("col", `In row ${row}, the middle value is ${v}: ${v < target ? `too small, so look right (L = ${m + 1})` : `too big, so look left (R = ${m - 1})`}.`, grid(tone, tags), [{ name: "row", value: String(row) }, { name: "L..R", value: `${l}..${r}` }, { name: "M", value: String(m), tone: "compare" }]);
    if (v < target) l = m + 1;
    else r = m - 1;
  }
  snap("missing", `Row ${row}'s range is empty: ${target} isn't in it, so it isn't in the matrix.`, grid(() => "idle"), [], { done: true, answer: "false" });
  return steps;
}

const M1 = [[1, 3, 5, 7], [10, 11, 16, 20], [23, 30, 34, 60]];

export const search2dMatrix: PatternProblem<Input> = {
  id: "search-2d-matrix",
  title: "Search a 2D Matrix",
  difficulty: "Medium",
  blind75: false,
  slug: "search-a-2d-matrix",
  video: "Ber2pi2C0j0",
  statement: "Each row of the matrix is sorted, and each row starts with a bigger number than the previous row ends with. Return whether target is in the matrix, in O(log(m·n)) time.",
  examples: [
    { label: "find 16", input: { matrix: M1, target: 16 } },
    { label: "find 13 (missing)", input: { matrix: M1, target: 13 } },
    { label: "5 × 5, find 41", input: { matrix: [[2, 4, 7, 9, 12], [14, 17, 19, 22, 25], [28, 31, 33, 36, 38], [41, 43, 47, 50, 53], [55, 58, 61, 66, 70]], target: 41 } },
  ],
  random: (seed) => {
    const g = rngFor(seed);
    const rows = g.int(2, 5);
    const cols = g.int(2, 5);
    let v = g.int(0, 3);
    const matrix = Array.from({ length: rows }, () => Array.from({ length: cols }, () => (v += g.int(1, 4))));
    return { matrix, target: g.r() < 0.6 ? g.pick(matrix.flat()) : g.int(0, v + 2) };
  },
  big: { label: "20 × 10 matrix", input: () => ({ matrix: Array.from({ length: 20 }, (_, r) => Array.from({ length: 10 }, (_, c) => (r * 10 + c) * 3)), target: 599 }) },
  describe: ({ matrix, target }) => `matrix = ${matrix.length}×${matrix[0].length}, target = ${target}`,
  run,
  solve: ({ matrix, target }) => matrix.flat().includes(target),
  brute: ({ matrix, target }) => {
    let ops = 0;
    for (const line of matrix)
      for (const v of line) {
        ops++;
        if (v === target) return { answer: true, ops };
      }
    return { answer: false, ops };
  },
  bruteIdea: "Check every cell: m·n comparisons. Two binary searches need about log₂ m + log₂ n.",
  guide: {
    title: "Search a 2D Matrix",
    idea: [
      "Because each row starts after the previous one ends, the matrix is really one long sorted list folded into rows.",
      "NeetCode's way: binary search the rows first, comparing target with each middle row's first and last values. That finds the only row that could hold it. Then binary search that row. (You can also treat it as one list of m·n and turn index k into row k // n, column k % n.)",
    ],
    whenToUse: ["Sorted data in a grid where the order carries on from row to row.", "Any time a 2-D index can be turned into a 1-D one, a 1-D technique still works."],
    stages: [
      { id: "start", title: "All rows in range", detail: "top = 0, bottom = m − 1.", pseudo: "top, bot = 0, rows - 1" },
      { id: "row", title: "Find the row", detail: "Compare target with the middle row's first and last values.", pseudo: "if target > row[-1]: top = m + 1 ... elif target < row[0]: bot = m - 1" },
      { id: "col", title: "Binary search inside the row", detail: "Ordinary binary search on one row.", pseudo: "l, r = 0, cols - 1 ..." },
      { id: "found", title: "Found → true", detail: "", pseudo: "return True" },
      { id: "missing", title: "Range empty → false", detail: "No row, or no cell, could hold it.", pseudo: "return False" },
    ],
    legend: [
      { tone: "compare", label: "Being compared" },
      { tone: "pointer", label: "Still in range" },
      { tone: "idle", label: "Ruled out" },
      { tone: "found", label: "Found" },
    ],
    complexity: { time: "O(log m + log n)", space: "O(1)", why: "That's the same as O(log(m·n)): one binary search over the rows, one over the columns." },
    pitfalls: [
      "This only works because each row starts after the previous row ends. If only rows and columns are sorted separately (LeetCode 240), you need a different method.",
      "After the row search, check the range wasn't emptied before searching the row.",
    ],
    tryThis: ["Pick “find 13 (missing)”: 13 falls between 11 and 16 in row 1.", "Pick “5 × 5, find 41”: 41 is the first value of its row."],
    python: py,
  },
};
