import { describe, expect, it } from "vitest";

import { buildNQueensSteps } from "./nQueensSteps";
import { assertStepInvariants } from "./testHelpers";

/** Independent conflict check — deliberately not the generator's own. */
function isValidSolution(queens: number[]): boolean {
  for (let i = 0; i < queens.length; i++) {
    for (let j = i + 1; j < queens.length; j++) {
      if (queens[i] === queens[j]) return false;
      if (Math.abs(queens[i] - queens[j]) === Math.abs(i - j)) return false;
    }
  }
  return true;
}

describe("n-queens", () => {
  // The known counts. If the search is subtly wrong these are what catch it —
  // a board that merely *looks* plausible will not hit 92.
  it.each([
    [1, 1],
    [2, 0],
    [3, 0],
    [4, 2],
    [5, 10],
    [6, 4],
    [7, 40],
    [8, 92],
  ])("finds the known number of solutions for n=%i", (n, expected) => {
    const { solutions } = buildNQueensSteps(n, { maxSteps: 200_000 });
    expect(solutions.length).toBe(expected);
  });

  it("returns only conflict-free boards", () => {
    const { solutions } = buildNQueensSteps(6);
    expect(solutions.length).toBeGreaterThan(0);
    for (const s of solutions) {
      expect(s.length).toBe(6);
      expect(isValidSolution(s), `invalid solution ${JSON.stringify(s)}`).toBe(true);
    }
  });

  it("returns distinct solutions", () => {
    const { solutions } = buildNQueensSteps(6);
    const unique = new Set(solutions.map((s) => s.join(",")));
    expect(unique.size).toBe(solutions.length);
  });

  it("balances every place against an undo", () => {
    // Simulating the stack over the whole step list is what proves the undo
    // steps correspond to real unwinding rather than being cosmetic.
    const { steps } = buildNQueensSteps(6);
    let depth = 0;
    for (const step of steps) {
      if (step.action === "place") depth++;
      if (step.action === "undo") depth--;
      expect(depth, "stack went negative — an undo without a matching place").toBeGreaterThanOrEqual(0);
    }
    expect(depth, "stack did not unwind to empty").toBe(0);
  });

  it("keeps depth consistent with the board at every step", () => {
    const { steps } = buildNQueensSteps(6);
    for (const [i, step] of steps.entries()) {
      expect(step.depth, `step ${i}`).toBe(step.queens.length);
    }
  });

  it("never reports a partial board that already conflicts", () => {
    const { steps } = buildNQueensSteps(6);
    for (const [i, step] of steps.entries()) {
      expect(isValidSolution(step.queens), `step ${i} has a conflicting board`).toBe(true);
    }
  });

  it("names a real blocker on every conflict", () => {
    const { steps } = buildNQueensSteps(6);
    const conflicts = steps.filter((s) => s.action === "conflict");
    expect(conflicts.length).toBeGreaterThan(0);
    for (const step of conflicts) {
      expect(step.conflictWith).toBeTypeOf("number");
      const blocker = step.conflictWith as number;
      expect(blocker).toBeLessThan(step.queens.length);
      const col = step.queens[blocker];
      const sameCol = col === step.col;
      const sameDiagonal = Math.abs(col - step.col) === Math.abs(blocker - step.row);
      expect(sameCol || sameDiagonal, "named blocker does not actually attack the square").toBe(true);
    }
  });

  it("stops at the first solution when asked", () => {
    const { solutions, steps } = buildNQueensSteps(8, { firstOnly: true });
    expect(solutions.length).toBe(1);
    expect(isValidSolution(solutions[0])).toBe(true);
    expect(steps.filter((s) => s.action === "solution").length).toBe(1);
  });

  it("holds the shared invariants", () => {
    const { steps } = buildNQueensSteps(6);
    assertStepInvariants(steps, { snapshot: (s) => s.queens });
  });

  it("stops at the cap instead of hanging", () => {
    const { steps } = buildNQueensSteps(12, { maxSteps: 100 });
    expect(steps.length).toBeLessThanOrEqual(100);
    expect(steps[steps.length - 1].truncated).toBe(true);
  });
});
