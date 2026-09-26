// N-Queens, showing the try / fail / undo loop that makes it backtracking.
//
// The board alone is not enough: queens appearing and vanishing looks like
// flickering rather than like a search. So each step also carries the recursion
// depth and, on a conflict, *which* placed queen blocked the square — a
// conflict is a relationship between two squares, so the renderer can draw an
// edge rather than just colouring one of them.
//
// Pure functions: no React, no timers. Tested against the known solution counts
// (2, 10, 4, 40, 92 for n = 4..8) in nQueensSteps.test.ts.

import {
  type BaseStep,
  type Cell,
  type GeneratorOptions,
  StepBuilder,
} from "./types";

export type QueenAction = "try" | "conflict" | "place" | "undo" | "solution" | "exhausted";

export interface NQueensStep extends BaseStep {
  action: QueenAction;
  /** The square under consideration. */
  row: number;
  col: number;
  /** queens[r] is the column of the queen in row r; length is the depth placed. */
  queens: number[];
  /** Squares attacked by the currently placed queens. */
  attacked: Cell[];
  /** On a conflict, the row of the queen that blocks this square. */
  conflictWith?: number;
  depth: number;
  solutionCount: number;
}

export interface NQueensResult {
  steps: NQueensStep[];
  /** Every distinct solution found, as column-per-row arrays. */
  solutions: number[][];
}

export interface NQueensOptions extends GeneratorOptions {
  /** Stop at the first solution instead of enumerating all of them. */
  firstOnly?: boolean;
}

/**
 * Which placed queen attacks (row, col), or null if the square is free.
 *
 * Scans from the deepest row up, so a square is blamed on the nearest queen.
 * Several queens may attack the same square and any of them is a correct
 * answer, but the line drawn to the one immediately above is far easier to read
 * than a long diagonal to row 0.
 */
function blockedBy(queens: number[], row: number, col: number): number | null {
  for (let r = queens.length - 1; r >= 0; r--) {
    const c = queens[r];
    if (c === col) return r;
    if (Math.abs(c - col) === Math.abs(r - row)) return r;
  }
  return null;
}

/** Every square the placed queens attack, for the board's "why not here" wash. */
function attackedSquares(queens: number[], n: number): Cell[] {
  const cells: Cell[] = [];
  for (let row = 0; row < n; row++) {
    for (let col = 0; col < n; col++) {
      if (row < queens.length && queens[row] === col) continue;
      if (blockedBy(queens, row, col) !== null) cells.push({ row, col });
    }
  }
  return cells;
}

export function buildNQueensSteps(n: number, options: NQueensOptions = {}): NQueensResult {
  const { firstOnly = false } = options;
  const builder = new StepBuilder<NQueensStep>(options);
  const solutions: number[][] = [];

  // `queens` is mutated as the search runs; every step copies it, or all the
  // frames would show the final board.
  const queens: number[] = [];

  const snapshot = (
    action: QueenAction,
    row: number,
    col: number,
    explanation: string,
    conflictWith?: number,
  ): boolean =>
    builder.push({
      action,
      row,
      col,
      queens: [...queens],
      attacked: attackedSquares(queens, n),
      conflictWith,
      depth: queens.length,
      solutionCount: solutions.length,
      explanation,
    });

  let stopped = false;

  const search = (row: number): void => {
    if (stopped || builder.isFull) return;

    if (row === n) {
      solutions.push([...queens]);
      snapshot(
        "solution",
        row - 1,
        queens[row - 1],
        `Solution ${solutions.length}: all ${n} queens placed with no two attacking each other.`,
      );
      if (firstOnly) stopped = true;
      return;
    }

    for (let col = 0; col < n; col++) {
      if (stopped || builder.isFull) return;

      snapshot("try", row, col, `Row ${row}: try column ${col}.`);

      const blocker = blockedBy(queens, row, col);
      if (blocker !== null) {
        snapshot(
          "conflict",
          row,
          col,
          `Column ${col} is attacked by the queen in row ${blocker} — rejected.`,
          blocker,
        );
        continue;
      }

      queens.push(col);
      snapshot("place", row, col, `Place a queen at row ${row}, column ${col}. Recurse to row ${row + 1}.`);

      search(row + 1);

      if (stopped || builder.isFull) return;

      queens.pop();
      snapshot(
        "undo",
        row,
        col,
        `Row ${row + 1} ran out of options, so undo the queen at row ${row}, column ${col} and keep looking.`,
      );
    }
  };

  search(0);

  const steps = builder.finish({
    action: "exhausted",
    row: -1,
    col: -1,
    queens: solutions.length && firstOnly ? [...solutions[0]] : [],
    attacked: solutions.length && firstOnly ? attackedSquares(solutions[0], n) : [],
    depth: 0,
    solutionCount: solutions.length,
    done: true,
    explanation:
      solutions.length === 0
        ? `No arrangement of ${n} queens works on a ${n}×${n} board.`
        : firstOnly
          ? `Found a solution for ${n} queens.`
          : `Search complete: ${solutions.length} distinct solution${solutions.length === 1 ? "" : "s"} for ${n} queens.`,
  });

  return { steps, solutions };
}
