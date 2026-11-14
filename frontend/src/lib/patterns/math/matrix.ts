// The matrix problems of Math & Geometry (NeetCode 150): Rotate Image,
// Spiral Matrix and Set Matrix Zeroes, drawn on the grid view.

import rotatePy from "../../guides/python/neetcode/rotate_image.py?raw";
import spiralPy from "../../guides/python/neetcode/spiral_matrix.py?raw";
import zeroesPy from "../../guides/python/neetcode/set_matrix_zeroes.py?raw";
import type { VizTone } from "../../guides/types";
import { row, rngFor, show } from "../helpers";
import type { PCell, PatternProblem, PatternStep } from "../types";

type M = number[][];
const showM = (m: M) => `[${m.map((r) => `[${r.join(",")}]`).join(", ")}]`;
const grid = (title: string, m: M, tone: (r: number, c: number) => VizTone | undefined, tag?: (r: number, c: number) => string | undefined) => ({
  title,
  cells: m.map((line, r) => line.map((v, c): PCell => ({ v: String(v), tone: tone(r, c), tag: tag?.(r, c) }))),
});
const has = (cs: [number, number][], r: number, c: number) => cs.some(([y, x]) => y === r && x === c);

// ---------------------------------------------------------------- Rotate image

function rotateRun(input: M): PatternStep[] {
  const m = input.map((r) => [...r]);
  const n = m.length;
  const steps: PatternStep[] = [];
  let hot: [number, number][] = [];
  let layer = -1;
  let ops = 0;
  const snap = (stage: string, explanation: string, extra: Partial<PatternStep> = {}) =>
    steps.push({
      stage,
      explanation,
      rows: [],
      grid: grid("the matrix, rotated in place", m, (r, c) => (has(hot, r, c) ? "current" : layer >= 0 && Math.min(r, c, n - 1 - r, n - 1 - c) === layer ? "pointer" : undefined), (r, c) => (has(hot, r, c) ? "TRBL"[hot.findIndex(([y, x]) => y === r && x === c)] : undefined)),
      vars: [{ name: "layer", value: layer < 0 ? "–" : `${layer} (rows/cols ${layer}..${n - 1 - layer})` }],
      ops,
      ...extra,
    });
  snap("start", "Rotate the square ring by ring, from the outside in. In each ring, cells move in groups of four: top → right → bottom → left → top. Saving one of the four in a temporary variable lets you move all four with no extra matrix.");
  let l = 0;
  let r = n - 1;
  while (l < r) {
    layer = l;
    for (let i = 0; i < r - l; i++) {
      ops += 4;
      const top = l;
      const bottom = r;
      const tl = m[top][l + i];
      m[top][l + i] = m[bottom - i][l];
      m[bottom - i][l] = m[bottom][r - i];
      m[bottom][r - i] = m[top + i][r];
      m[top + i][r] = tl;
      hot = [
        [top, l + i],
        [top + i, r],
        [bottom, r - i],
        [bottom - i, l],
      ];
      snap("rotate", `Ring ${l}, offset ${i}: the four cells T, R, B, L swap round. T's old value (${tl}) is saved, L moves into T, B into L, R into B, and the saved value into R.`);
    }
    l++;
    r--;
  }
  hot = [];
  layer = -1;
  snap("done", `Every ring is rotated: ${showM(m)}.`, { done: true, answer: showM(m) });
  return steps;
}
const rotateCopy = (m: M) => m.map((_, r) => m.map((line) => line[r]).reverse());

export const rotateImage: PatternProblem<M> = {
  id: "rotate-image",
  title: "Rotate Image",
  difficulty: "Medium",
  blind75: true,
  slug: "rotate-image",
  video: "fMSJSS7eO1w",
  statement: "Rotate an n × n matrix 90° clockwise, in place (without a second matrix).",
  examples: [
    { label: "3 × 3 (LeetCode)", input: [[1, 2, 3], [4, 5, 6], [7, 8, 9]] },
    { label: "4 × 4 (LeetCode)", input: [[5, 1, 9, 11], [2, 4, 8, 10], [13, 3, 6, 7], [15, 14, 12, 16]] },
  ],
  random: (seed) => {
    const g = rngFor(seed);
    const n = g.int(1, 4);
    return Array.from({ length: n }, () => Array.from({ length: n }, () => g.int(1, 9)));
  },
  describe: showM,
  run: rotateRun,
  solve: (m) => showM(rotateCopy(m)),
  brute: null,
  bruteIdea: "Every cell has to move, so O(n²) is the best possible. Building a rotated copy (row r of the result is column r read bottom-up) is the easy way; the challenge is doing it in place. The answer is cross-checked against that copy.",
  guide: {
    title: "Rotate Image",
    idea: [
      "A 90° clockwise turn moves each cell of a ring to the next side: top → right → bottom → left → top. Four cells form a cycle, so you can move them with one temporary variable.",
      "Walk the rings from the outside in (left and right pointers moving towards each other); in each ring, rotate the groups of four. (Another way: transpose the matrix, then reverse each row.)",
    ],
    whenToUse: ["In-place matrix transforms: find the cycles cells move along and rotate each cycle.", "Layer-by-layer processing of a square (also Spiral Matrix)."],
    stages: [
      { id: "start", title: "Rings from the outside in", detail: "", pseudo: "l, r = 0, len(matrix) - 1" },
      { id: "rotate", title: "Rotate four cells", detail: "", pseudo: "top_left = matrix[top][l + i]; matrix[top][l + i] = matrix[bottom - i][l]; …; matrix[top + i][r] = top_left" },
      { id: "done", title: "All rings rotated", detail: "", pseudo: "" },
    ],
    legend: [
      { tone: "current", label: "The four cells being rotated" },
      { tone: "pointer", label: "Current ring" },
    ],
    complexity: { time: "O(n²)", space: "O(1)", why: "Each cell is moved once, using one temporary value." },
    pitfalls: ["Save one value before overwriting the cycle.", "Offsets: the right side goes down while the bottom goes left."],
    tryThis: ["3 × 3: the outer ring takes two groups of four; the centre doesn't move.", "Transpose + reverse each row gives the same result."],
    python: rotatePy,
  },
};

// ---------------------------------------------------------------- Spiral matrix

function spiralRun(m: M): PatternStep[] {
  const steps: PatternStep[] = [];
  const out: number[] = [];
  const seen: [number, number][] = [];
  let cur: [number, number] | null = null;
  let left = 0;
  let right = m[0].length;
  let top = 0;
  let bottom = m.length;
  let ops = 0;
  const snap = (stage: string, explanation: string, extra: Partial<PatternStep> = {}) =>
    steps.push({
      stage,
      explanation,
      rows: [row("spiral order so far", out)],
      grid: grid("the matrix; green cells are already in the spiral", m, (r, c) => (cur && cur[0] === r && cur[1] === c ? "current" : has(seen, r, c) ? "found" : undefined)),
      vars: [{ name: "bounds", value: `top ${top}, bottom ${bottom - 1}, left ${left}, right ${right - 1}` }],
      ops,
      ...extra,
    });
  snap("start", "Keep four bounds around the part not visited yet. Go right along the top row, down the right column, left along the bottom row, up the left column, shrinking the matching bound after each side, until the bounds cross.");
  const take = (r: number, c: number, stage: string, why: string) => {
    ops++;
    out.push(m[r][c]);
    seen.push([r, c]);
    cur = [r, c];
    snap(stage, why);
  };
  while (left < right && top < bottom) {
    for (let c = left; c < right; c++) take(top, c, "right", `Top row ${top}, going right: ${m[top][c]}.`);
    top++;
    for (let r = top; r < bottom; r++) take(r, right - 1, "down", `Right column ${right - 1}, going down: ${m[r][right - 1]}.`);
    right--;
    if (!(left < right && top < bottom)) break;
    for (let c = right - 1; c >= left; c--) take(bottom - 1, c, "left", `Bottom row ${bottom - 1}, going left: ${m[bottom - 1][c]}.`);
    bottom--;
    for (let r = bottom - 1; r >= top; r--) take(r, left, "up", `Left column ${left}, going up: ${m[r][left]}.`);
    left++;
  }
  cur = null;
  snap("done", `The bounds have crossed: every cell is in the spiral, ${show(out)}.`, { done: true, answer: show(out) });
  return steps;
}
function spiralSlow(m: M): string {
  // Walk with a direction and a visited set, turning right when blocked.
  const R = m.length;
  const C = m[0].length;
  const seen = new Set<string>();
  const out: number[] = [];
  const dirs = [
    [0, 1],
    [1, 0],
    [0, -1],
    [-1, 0],
  ];
  let [r, c, d] = [0, 0, 0];
  for (let k = 0; k < R * C; k++) {
    out.push(m[r][c]);
    seen.add(`${r},${c}`);
    const [nr, nc] = [r + dirs[d][0], c + dirs[d][1]];
    if (nr < 0 || nc < 0 || nr >= R || nc >= C || seen.has(`${nr},${nc}`)) d = (d + 1) % 4;
    r += dirs[d][0];
    c += dirs[d][1];
  }
  return show(out);
}

export const spiralMatrix: PatternProblem<M> = {
  id: "spiral-matrix",
  title: "Spiral Matrix",
  difficulty: "Medium",
  blind75: true,
  slug: "spiral-matrix",
  video: "BJnMZNwUk1M",
  statement: "Return all the elements of an m × n matrix in spiral order: clockwise, starting at the top-left.",
  examples: [
    { label: "3 × 4 (LeetCode)", input: [[1, 2, 3, 4], [5, 6, 7, 8], [9, 10, 11, 12]] },
    { label: "3 × 3 (LeetCode)", input: [[1, 2, 3], [4, 5, 6], [7, 8, 9]] },
    { label: "one column", input: [[1], [2], [3]] },
  ],
  random: (seed) => {
    const g = rngFor(seed);
    const R = g.int(1, 4);
    const C = g.int(1, 4);
    let k = 1;
    return Array.from({ length: R }, () => Array.from({ length: C }, () => k++));
  },
  describe: showM,
  run: spiralRun,
  solve: spiralSlow,
  brute: null,
  bruteIdea: "Every cell is output once, so O(m × n) is the best possible. The answer is cross-checked with a different walk (turn right when blocked, using a visited set).",
  guide: {
    title: "Spiral Matrix",
    idea: [
      "Keep four bounds: the top and bottom rows and left and right columns not visited yet. Take the top row left to right, then the right column top to bottom, then the bottom row right to left, then the left column bottom to top, moving each bound inwards after its side.",
      "Stop when the bounds cross. Check again halfway round: a single remaining row or column must not be walked back over.",
    ],
    whenToUse: ["Walking a matrix in layers: four shrinking bounds.", "Generating a spiral (Spiral Matrix II) uses the same loop."],
    stages: [
      { id: "start", title: "Four bounds", detail: "", pseudo: "left, right = 0, len(matrix[0]); top, bottom = 0, len(matrix)" },
      { id: "right", title: "Top row, left to right", detail: "", pseudo: "for i in range(left, right): res.append(matrix[top][i]); top += 1" },
      { id: "down", title: "Right column, top to bottom", detail: "", pseudo: "for i in range(top, bottom): res.append(matrix[i][right - 1]); right -= 1" },
      { id: "left", title: "Bottom row, right to left", detail: "", pseudo: "for i in range(right - 1, left - 1, -1): res.append(matrix[bottom - 1][i]); bottom -= 1" },
      { id: "up", title: "Left column, bottom to top", detail: "", pseudo: "for i in range(bottom - 1, top - 1, -1): res.append(matrix[i][left]); left += 1" },
      { id: "done", title: "Bounds crossed", detail: "", pseudo: "return res" },
    ],
    legend: [
      { tone: "current", label: "Cell being taken" },
      { tone: "found", label: "Already in the spiral" },
    ],
    complexity: { time: "O(m × n)", space: "O(1) besides the output", why: "Each cell is visited once." },
    pitfalls: ["After the top row and right column, re-check the bounds: a single row or column has no bottom or left side left.", "Use half-open bounds consistently."],
    tryThis: ["“One column” goes straight down and stops.", "3 × 4: 1, 2, 3, 4, 8, 12, 11, 10, 9, 5, 6, 7."],
    python: spiralPy,
  },
};

// ---------------------------------------------------------------- Set matrix zeroes

function zeroesRun(input: M): PatternStep[] {
  const m = input.map((r) => [...r]);
  const R = m.length;
  const C = m[0].length;
  const steps: PatternStep[] = [];
  const rows = new Set<number>();
  const cols = new Set<number>();
  let cur: [number, number] | null = null;
  let phase: "mark" | "zero" = "mark";
  let ops = 0;
  const snap = (stage: string, explanation: string, extra: Partial<PatternStep> = {}) =>
    steps.push({
      stage,
      explanation,
      rows: [row("rows to zero", [...rows].sort((a, b) => a - b)), row("columns to zero", [...cols].sort((a, b) => a - b))],
      grid: grid("the matrix", m, (r, c) => (cur && cur[0] === r && cur[1] === c ? "current" : phase === "zero" && (rows.has(r) || cols.has(c)) ? "swap" : input[r][c] === 0 ? "compare" : rows.has(r) || cols.has(c) ? "pointer" : undefined)),
      vars: [],
      ops,
      ...extra,
    });
  snap("start", "Zeroing cells while you scan would create new zeros that wipe out more rows than they should. So scan first and only record which rows and columns contain a 0; then zero them all in a second pass.");
  for (let r = 0; r < R; r++)
    for (let c = 0; c < C; c++) {
      ops++;
      if (m[r][c] === 0) {
        rows.add(r);
        cols.add(c);
        cur = [r, c];
        snap("mark", `(${r},${c}) is 0: row ${r} and column ${c} will be zeroed.`);
      }
    }
  cur = null;
  phase = "zero";
  for (let r = 0; r < R; r++) for (let c = 0; c < C; c++) if (rows.has(r) || cols.has(c)) m[r][c] = 0;
  ops += R * C;
  snap("zero", `Second pass: every cell in a marked row (${[...rows].join(", ") || "none"}) or column (${[...cols].join(", ") || "none"}) becomes 0.`);
  snap("done", `Result: ${showM(m)}. (NeetCode's video also stores the marks in the first row and column to use O(1) extra space.)`, { done: true, answer: showM(m) });
  return steps;
}
function zeroesSlow(input: M) {
  // For every original 0, zero its row and column in a copy.
  const out = input.map((r) => [...r]);
  let ops = 0;
  input.forEach((line, r) =>
    line.forEach((v, c) => {
      if (v !== 0) return;
      for (let j = 0; j < out[0].length; j++) {
        ops++;
        out[r][j] = 0;
      }
      for (let i = 0; i < out.length; i++) {
        ops++;
        out[i][c] = 0;
      }
    }),
  );
  ops += input.length * input[0].length;
  return { answer: showM(out), ops };
}

export const setMatrixZeroes: PatternProblem<M> = {
  id: "set-matrix-zeroes",
  title: "Set Matrix Zeroes",
  difficulty: "Medium",
  blind75: true,
  slug: "set-matrix-zeroes",
  video: "T41rL0L3Pnw",
  statement: "If a cell is 0, set its whole row and column to 0. Do it in place.",
  examples: [
    { label: "LeetCode's example 1", input: [[1, 1, 1], [1, 0, 1], [1, 1, 1]] },
    { label: "LeetCode's example 2", input: [[0, 1, 2, 0], [3, 4, 5, 2], [1, 3, 1, 5]] },
  ],
  random: (seed) => {
    const g = rngFor(seed);
    const R = g.int(1, 4);
    const C = g.int(1, 4);
    return Array.from({ length: R }, () => Array.from({ length: C }, () => (g.r() < 0.2 ? 0 : g.int(1, 9))));
  },
  big: { label: "a 30 × 30 matrix with many zeros", input: () => Array.from({ length: 30 }, (_, r) => Array.from({ length: 30 }, (_, c) => ((r * 7 + c * 3) % 5 === 0 ? 0 : 1))) },
  describe: showM,
  run: zeroesRun,
  solve: (m) => zeroesSlow(m).answer,
  brute: zeroesSlow,
  bruteIdea: "For every 0, wipe its row and column (in a copy, so new zeros don't spread): O(m × n × (m + n)) when there are many zeros.",
  guide: {
    title: "Set Matrix Zeroes",
    idea: [
      "Don't zero as you go: new zeros would wipe extra rows and columns. First record which rows and which columns contain a 0, then zero every cell in a recorded row or column.",
      "NeetCode's O(1)-space version stores those marks in the first row and first column themselves (with one extra flag for row 0).",
    ],
    whenToUse: ["“Change things based on the original values”: record first, change second.", "Reuse part of the input as scratch space when extra memory isn't allowed."],
    stages: [
      { id: "start", title: "Record, then change", detail: "", pseudo: "rows, cols = set(), set()" },
      { id: "mark", title: "A 0: mark its row and column", detail: "", pseudo: "if matrix[r][c] == 0: rows.add(r); cols.add(c)" },
      { id: "zero", title: "Zero the marked rows and columns", detail: "", pseudo: "if r in rows or c in cols: matrix[r][c] = 0" },
      { id: "done", title: "Done", detail: "", pseudo: "" },
    ],
    legend: [
      { tone: "current", label: "A 0 just found" },
      { tone: "compare", label: "Original zeros" },
      { tone: "pointer", label: "Will be zeroed" },
      { tone: "swap", label: "Zeroed" },
    ],
    complexity: { time: "O(m × n)", space: "O(m + n), or O(1) with the first-row trick", why: "Two passes over the matrix." },
    pitfalls: ["Zeroing during the scan spreads zeros that weren't there.", "In the O(1) version, handle row 0 separately (its marker cell is shared with column 0)."],
    tryThis: ["Example 2: the zeros in row 0 wipe columns 0 and 3.", "Press Random and predict which rows and columns survive."],
    python: zeroesPy,
  },
};
