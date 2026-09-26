// Dynamic programming tables, step by step.
//
// The whole difficulty of DP is seeing where a cell's value came from, which a
// code listing hides and a filling table shows. So every step names the cells
// it read (`from`) and the one it took (`chosen`), and every run ends with a
// traceback that walks back from the answer cell and spells out the actual
// result — the edit script, the subsequence, the chosen items — rather than
// just the number in the corner.
//
// Pure functions: no React, no timers. Tested in dpSteps.test.ts against known
// answers and against a plain reference recurrence.

import {
  type BaseStep,
  type Cell,
  type GeneratorOptions,
  StepBuilder,
} from "./types";

export type DpPhase = "init" | "fill" | "traceback" | "done";

export interface DpStep extends BaseStep {
  phase: DpPhase;
  /** The cell being written, or the traceback's current position. -1 during init. */
  row: number;
  col: number;
  value: number;
  /** Cells this one read. */
  from: Cell[];
  /** The one it took its value from. */
  chosen?: Cell;
  /** Immutable snapshot — a fresh copy per step, never a shared reference. */
  grid: number[][];
  /** Traceback path so far, answer cell first. */
  path?: Cell[];
}

export type DpProblemKey = "editDistance" | "lcs" | "knapsack";

export interface KnapsackItem {
  weight: number;
  value: number;
  label: string;
}

const copy = (grid: number[][]): number[][] => grid.map((row) => [...row]);

/** Column/row headers a renderer shows around the table. */
export interface DpTableLabels {
  rowHeader: string[];
  colHeader: string[];
  rowTitle: string;
  colTitle: string;
}

export interface DpResult {
  steps: DpStep[];
  labels: DpTableLabels;
  /** The answer, already formatted for display. */
  answer: string;
}

// ---------------------------------------------------------------------------
// Edit distance (Levenshtein)
// ---------------------------------------------------------------------------

/**
 * Each cell depends on exactly three neighbours, and the arrow you draw IS the
 * edit operation — which is why this is the clearest DP table to watch.
 */
export function buildEditDistanceSteps(
  a: string,
  b: string,
  options: GeneratorOptions = {},
): DpResult {
  const m = a.length;
  const n = b.length;
  const builder = new StepBuilder<DpStep>(options);

  const grid: number[][] = Array.from({ length: m + 1 }, () => new Array<number>(n + 1).fill(0));
  for (let i = 0; i <= m; i++) grid[i][0] = i;
  for (let j = 0; j <= n; j++) grid[0][j] = j;

  builder.push({
    phase: "init",
    row: -1,
    col: -1,
    value: 0,
    from: [],
    grid: copy(grid),
    explanation:
      `Row 0 is the cost of inserting each of "${b}" from nothing; column 0 is the cost of deleting each of "${a}".`,
  });

  for (let i = 1; i <= m && !builder.isFull; i++) {
    for (let j = 1; j <= n && !builder.isFull; j++) {
      const diag: Cell = { row: i - 1, col: j - 1 };
      const up: Cell = { row: i - 1, col: j };
      const left: Cell = { row: i, col: j - 1 };
      const match = a[i - 1] === b[j - 1];

      let chosen: Cell;
      let explanation: string;

      if (match) {
        grid[i][j] = grid[i - 1][j - 1];
        chosen = diag;
        explanation = `'${a[i - 1]}' matches '${b[j - 1]}' — no edit needed, carry the diagonal (${grid[i][j]}).`;
      } else {
        const replace = grid[i - 1][j - 1];
        const del = grid[i - 1][j];
        const ins = grid[i][j - 1];
        const best = Math.min(replace, del, ins);
        grid[i][j] = best + 1;
        chosen = best === replace ? diag : best === del ? up : left;
        const op = best === replace ? "replace" : best === del ? "delete" : "insert";
        explanation = `'${a[i - 1]}' ≠ '${b[j - 1]}' — cheapest of replace ${replace}, delete ${del}, insert ${ins} is ${op}, so ${best} + 1 = ${grid[i][j]}.`;
      }

      builder.push({
        phase: "fill",
        row: i,
        col: j,
        value: grid[i][j],
        from: match ? [diag] : [diag, up, left],
        chosen,
        grid: copy(grid),
        explanation,
      });
    }
  }

  // Traceback: read the edit script back out of the table.
  const path: Cell[] = [];
  const script: string[] = [];
  let i = m;
  let j = n;
  path.push({ row: i, col: j });

  while ((i > 0 || j > 0) && !builder.isFull) {
    let from: Cell;
    let note: string;

    if (i > 0 && j > 0 && a[i - 1] === b[j - 1] && grid[i][j] === grid[i - 1][j - 1]) {
      from = { row: i - 1, col: j - 1 };
      note = `keep '${a[i - 1]}'`;
      i--;
      j--;
    } else if (i > 0 && j > 0 && grid[i][j] === grid[i - 1][j - 1] + 1) {
      from = { row: i - 1, col: j - 1 };
      note = `replace '${a[i - 1]}' with '${b[j - 1]}'`;
      script.unshift(note);
      i--;
      j--;
    } else if (i > 0 && grid[i][j] === grid[i - 1][j] + 1) {
      from = { row: i - 1, col: j };
      note = `delete '${a[i - 1]}'`;
      script.unshift(note);
      i--;
    } else {
      from = { row: i, col: j - 1 };
      note = `insert '${b[j - 1]}'`;
      script.unshift(note);
      j--;
    }

    path.push(from);
    builder.push({
      phase: "traceback",
      row: from.row,
      col: from.col,
      value: grid[from.row][from.col],
      from: [],
      grid: copy(grid),
      path: [...path],
      explanation: `Trace back: ${note}.`,
    });
  }

  const steps = builder.finish({
    phase: "done",
    row: m,
    col: n,
    value: grid[m][n],
    from: [],
    grid: copy(grid),
    path: [...path],
    done: true,
    explanation:
      script.length > 0
        ? `Distance ${grid[m][n]}: ${script.join(", ")}.`
        : `Distance 0 — the strings are already identical.`,
  });

  return {
    steps,
    labels: {
      rowHeader: ["ø", ...a.split("")],
      colHeader: ["ø", ...b.split("")],
      rowTitle: a,
      colTitle: b,
    },
    answer: `${grid[m][n]} edit${grid[m][n] === 1 ? "" : "s"}`,
  };
}

// ---------------------------------------------------------------------------
// Longest common subsequence
// ---------------------------------------------------------------------------

/**
 * The same table shape as edit distance with a two-branch recurrence, which is
 * the point: one table serves many problems.
 */
export function buildLcsSteps(
  a: string,
  b: string,
  options: GeneratorOptions = {},
): DpResult {
  const m = a.length;
  const n = b.length;
  const builder = new StepBuilder<DpStep>(options);

  const grid: number[][] = Array.from({ length: m + 1 }, () => new Array<number>(n + 1).fill(0));

  builder.push({
    phase: "init",
    row: -1,
    col: -1,
    value: 0,
    from: [],
    grid: copy(grid),
    explanation: "Row 0 and column 0 are zero: an empty string shares nothing with anything.",
  });

  for (let i = 1; i <= m && !builder.isFull; i++) {
    for (let j = 1; j <= n && !builder.isFull; j++) {
      const diag: Cell = { row: i - 1, col: j - 1 };
      const up: Cell = { row: i - 1, col: j };
      const left: Cell = { row: i, col: j - 1 };
      const match = a[i - 1] === b[j - 1];

      let chosen: Cell;
      let explanation: string;

      if (match) {
        grid[i][j] = grid[i - 1][j - 1] + 1;
        chosen = diag;
        explanation = `'${a[i - 1]}' matches — extend the diagonal run to ${grid[i][j]}.`;
      } else {
        const fromUp = grid[i - 1][j];
        const fromLeft = grid[i][j - 1];
        grid[i][j] = Math.max(fromUp, fromLeft);
        chosen = fromUp >= fromLeft ? up : left;
        explanation = `'${a[i - 1]}' ≠ '${b[j - 1]}' — keep the better of above (${fromUp}) and left (${fromLeft}).`;
      }

      builder.push({
        phase: "fill",
        row: i,
        col: j,
        value: grid[i][j],
        from: match ? [diag] : [up, left],
        chosen,
        grid: copy(grid),
        explanation,
      });
    }
  }

  const path: Cell[] = [];
  let sequence = "";
  let i = m;
  let j = n;
  path.push({ row: i, col: j });

  while (i > 0 && j > 0 && !builder.isFull) {
    let from: Cell;
    let note: string;

    if (a[i - 1] === b[j - 1]) {
      sequence = a[i - 1] + sequence;
      from = { row: i - 1, col: j - 1 };
      note = `'${a[i - 1]}' is in the subsequence`;
      i--;
      j--;
    } else if (grid[i - 1][j] >= grid[i][j - 1]) {
      from = { row: i - 1, col: j };
      note = `skip '${a[i - 1]}'`;
      i--;
    } else {
      from = { row: i, col: j - 1 };
      note = `skip '${b[j - 1]}'`;
      j--;
    }

    path.push(from);
    builder.push({
      phase: "traceback",
      row: from.row,
      col: from.col,
      value: grid[from.row][from.col],
      from: [],
      grid: copy(grid),
      path: [...path],
      explanation: `Trace back: ${note}.`,
    });
  }

  const steps = builder.finish({
    phase: "done",
    row: m,
    col: n,
    value: grid[m][n],
    from: [],
    grid: copy(grid),
    path: [...path],
    done: true,
    explanation: `Longest common subsequence is "${sequence}", length ${grid[m][n]}.`,
  });

  return {
    steps,
    labels: {
      rowHeader: ["ø", ...a.split("")],
      colHeader: ["ø", ...b.split("")],
      rowTitle: a,
      colTitle: b,
    },
    answer: sequence ? `"${sequence}" (length ${grid[m][n]})` : "no common subsequence",
  };
}

// ---------------------------------------------------------------------------
// 0/1 knapsack
// ---------------------------------------------------------------------------

/**
 * Breaks the "two dimensions means two strings" assumption: rows are items,
 * columns are capacity, and the dependency is the cell above plus a
 * variable-distance back-reference at (i-1, c-w). That jump is the thing people
 * trip on, so it is worth drawing.
 */
export function buildKnapsackSteps(
  items: KnapsackItem[],
  capacity: number,
  options: GeneratorOptions = {},
): DpResult {
  const n = items.length;
  const builder = new StepBuilder<DpStep>(options);

  const grid: number[][] = Array.from({ length: n + 1 }, () => new Array<number>(capacity + 1).fill(0));

  builder.push({
    phase: "init",
    row: -1,
    col: -1,
    value: 0,
    from: [],
    grid: copy(grid),
    explanation: "Row 0 is zero everywhere: with no items available, every capacity is worth nothing.",
  });

  for (let i = 1; i <= n && !builder.isFull; i++) {
    const item = items[i - 1];
    for (let c = 0; c <= capacity && !builder.isFull; c++) {
      const skip: Cell = { row: i - 1, col: c };
      const without = grid[i - 1][c];

      let chosen: Cell = skip;
      const from: Cell[] = [skip];
      let explanation: string;

      if (item.weight > c) {
        grid[i][c] = without;
        explanation = `${item.label} weighs ${item.weight}, over capacity ${c} — carry ${without} down unchanged.`;
      } else {
        const take: Cell = { row: i - 1, col: c - item.weight };
        from.push(take);
        const withItem = grid[i - 1][c - item.weight] + item.value;
        if (withItem > without) {
          grid[i][c] = withItem;
          chosen = take;
          explanation = `Take ${item.label}: ${grid[i - 1][c - item.weight]} at capacity ${c - item.weight} + ${item.value} = ${withItem}, beating ${without}.`;
        } else {
          grid[i][c] = without;
          explanation = `Skip ${item.label}: taking it gives ${withItem}, no better than ${without}.`;
        }
      }

      builder.push({
        phase: "fill",
        row: i,
        col: c,
        value: grid[i][c],
        from,
        chosen,
        grid: copy(grid),
        explanation,
      });
    }
  }

  const path: Cell[] = [];
  const taken: string[] = [];
  let i = n;
  let c = capacity;
  path.push({ row: i, col: c });

  while (i > 0 && !builder.isFull) {
    const item = items[i - 1];
    let from: Cell;
    let note: string;

    if (grid[i][c] !== grid[i - 1][c]) {
      taken.unshift(item.label);
      from = { row: i - 1, col: c - item.weight };
      note = `${item.label} is in the bag (value ${item.value}, weight ${item.weight})`;
      c -= item.weight;
    } else {
      from = { row: i - 1, col: c };
      note = `${item.label} was left behind`;
    }
    i--;

    path.push(from);
    builder.push({
      phase: "traceback",
      row: from.row,
      col: from.col,
      value: grid[from.row][from.col],
      from: [],
      grid: copy(grid),
      path: [...path],
      explanation: `Trace back: ${note}.`,
    });
  }

  const best = grid[n][capacity];
  const steps = builder.finish({
    phase: "done",
    row: n,
    col: capacity,
    value: best,
    from: [],
    grid: copy(grid),
    path: [...path],
    done: true,
    explanation: taken.length
      ? `Best value ${best}, taking ${taken.join(" + ")}.`
      : `Nothing fits in capacity ${capacity}.`,
  });

  return {
    steps,
    labels: {
      rowHeader: ["ø", ...items.map((it) => it.label)],
      colHeader: Array.from({ length: capacity + 1 }, (_, k) => String(k)),
      rowTitle: "items",
      colTitle: "capacity",
    },
    answer: `value ${best}`,
  };
}

// Coin Change is deliberately absent. Its 1-D table has no dependency
// structure worth animating — every cell reads the same k coins — so it would
// add a fourth traceback for no extra teaching. Please don't helpfully add it.
