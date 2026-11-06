// Rotate an n×n matrix 90° clockwise: transpose, then reverse each row.
// Pure functions, tested in rotateImageSteps.test.ts.

export type Matrix = number[][];

export interface RotationStep {
  phase: "transpose" | "reverse";
  a: [number, number];
  b: [number, number];
  /** The matrix after this swap. */
  grid: Matrix;
}

export const DEFAULT_MATRIX: Matrix = [
  [1, 2, 3],
  [4, 5, 6],
  [7, 8, 9],
];

export function buildRotateSteps(input: Matrix): RotationStep[] {
  const grid = input.map((row) => [...row]);
  const n = grid.length;
  const steps: RotationStep[] = [];
  const swap = (phase: RotationStep["phase"], a: [number, number], b: [number, number]) => {
    [grid[a[0]][a[1]], grid[b[0]][b[1]]] = [grid[b[0]][b[1]], grid[a[0]][a[1]]];
    steps.push({ phase, a, b, grid: grid.map((row) => [...row]) });
  };

  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) swap("transpose", [i, j], [j, i]);
  }
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < Math.floor(n / 2); j++) swap("reverse", [i, j], [i, n - 1 - j]);
  }
  return steps;
}

export function parseMatrix(text: string): Matrix | string {
  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch {
    return "That isn't valid JSON. Try [[1,2],[3,4]].";
  }
  if (!Array.isArray(value) || value.length === 0) return "Enter a non-empty list of rows.";
  const n = value.length;
  if (n > 6) return "Use at most 6 rows so the grid fits on screen.";
  for (const row of value) {
    if (!Array.isArray(row) || row.length !== n) return `The matrix must be square: ${n} rows of ${n} numbers.`;
    if (!row.every((x) => typeof x === "number" && Number.isFinite(x))) return "Every cell must be a number.";
  }
  return value as Matrix;
}
