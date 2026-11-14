// N-Queens (NeetCode 150 · Backtracking).

import py from "../../guides/python/neetcode/n_queens.py?raw";
import type { PCell, PatternProblem, PatternStep } from "../types";
import { type Frame, RecTree, at, finish } from "./rtree";

type Input = number;

const boardOf = (n: number, cols: number[]) => cols.map((c) => ".".repeat(c) + "Q" + ".".repeat(n - c - 1));
const showBoards = (bs: string[][]) => `[${bs.map((b) => `[${b.join(", ")}]`).join(", ")}]`;

function run(n: Input): PatternStep[] {
  const t = new RecTree();
  const frames: Frame[] = [];
  const cols: number[] = []; // cols[r] = column of the queen in row r
  const res: number[][] = [];
  const path: string[] = [];
  let ops = 0;
  let probe: [number, number] | null = null;
  let hits: [number, number][] = [];
  const colSet = new Set<number>();
  const pos = new Set<number>(); // r + c
  const neg = new Set<number>(); // r − c
  const push = (stage: string, explanation: string, node?: string, extra: Partial<PatternStep> = {}) => {
    const cells: PCell[][] = Array.from({ length: n }, (_, r) =>
      Array.from({ length: n }, (_, c): PCell => {
        const queen = cols[r] === c;
        const isProbe = probe && probe[0] === r && probe[1] === c;
        const hit = hits.some(([y, x]) => y === r && x === c);
        return { v: queen ? "♛" : isProbe ? "?" : "", tone: queen ? (stage === "solution" || stage === "done" ? "found" : hit ? "swap" : "pointer") : isProbe ? (hits.length ? "swap" : "current") : undefined };
      }),
    );
    frames.push({
      stage,
      explanation,
      rows: [],
      grid: { title: `${n}×${n} board`, cells },
      vars: [
        { name: "queens placed", value: `${cols.length} of ${n}` },
        { name: "solutions found", value: String(res.length), tone: "found" },
      ],
      ops,
      ...at(t, node, path),
      ...extra,
    });
  };
  const root = t.add("·", undefined, "row 0");
  path.push(root);
  push("start", `Place one queen per row, top to bottom. In each row, try the columns left to right and keep a queen only if no earlier queen shares its column or either diagonal. Sets of used columns, r + c values (one diagonal) and r − c values (the other) make that check O(1).`, root);
  const dfs = (r: number, node: string) => {
    if (r === n) {
      res.push([...cols]);
      t.found.push(node);
      push("solution", `All ${n} queens are placed and none attack each other: solution ${res.length}.`, node);
      return;
    }
    let placed = false;
    for (let c = 0; c < n; c++) {
      ops++;
      probe = [r, c];
      if (colSet.has(c) || pos.has(r + c) || neg.has(r - c)) {
        hits = cols.map((x, y): [number, number] => [y, x]).filter(([y, x]) => x === c || y + x === r + c || y - x === r - c);
        const why = hits.map(([y, x]) => `row ${y} (${x === c ? "same column" : y + x === r + c ? "same r + c diagonal" : "same r − c diagonal"})`);
        push("attacked", `Row ${r}, column ${c}: attacked by the queen in ${why.join(" and the queen in ")}. Skip it.`, node);
        hits = [];
        continue;
      }
      probe = null;
      placed = true;
      cols.push(c);
      colSet.add(c);
      pos.add(r + c);
      neg.add(r - c);
      const a = t.add(`c${c}`, node, `row ${r}`);
      path.push(a);
      push("place", `Row ${r}, column ${c} is safe: place a queen and move on to row ${r + 1}.`, a);
      dfs(r + 1, a);
      path.pop();
      cols.pop();
      colSet.delete(c);
      pos.delete(r + c);
      neg.delete(r - c);
      push("remove", `Back in row ${r}: take the queen off column ${c}${c + 1 < n ? " and try the next column" : ". That was the last column in this row"}.`, node);
    }
    probe = null;
    if (!placed && r > 0) {
      t.dead.push(node);
      push("dead", `Every column in row ${r} is attacked. This arrangement can't be finished: back up to row ${r - 1}.`, node);
    }
  };
  dfs(0, root);
  path.length = 0;
  if (res.length) cols.push(...res[res.length - 1]); // show the last solution on the final step
  push("done", `Every arrangement has been tried: ${res.length} solution${res.length === 1 ? "" : "s"} for n = ${n}.${res.length ? " The board shows the last one found." : ""}`, undefined, { done: true, answer: showBoards(res.map((c) => boardOf(n, c)).sort((a, b) => (a.join() < b.join() ? -1 : 1))) });
  return finish(t, frames, "one level per row; each branch is a safe column");
}

/** The slow way: try all n! ways to put one queen in each row and column, and check the diagonals afterwards. */
function slow(n: Input) {
  let ops = 0;
  const out: number[][] = [];
  const perm: number[] = [];
  const used = new Set<number>();
  const go = () => {
    if (perm.length === n) {
      ops += n;
      const ok = perm.every((c, r) => perm.every((d, s) => s === r || Math.abs(c - d) !== Math.abs(r - s)));
      if (ok) out.push([...perm]);
      return;
    }
    for (let c = 0; c < n; c++)
      if (!used.has(c)) {
        used.add(c);
        perm.push(c);
        go();
        perm.pop();
        used.delete(c);
      }
  };
  go();
  return { answer: showBoards(out.map((c) => boardOf(n, c)).sort((a, b) => (a.join() < b.join() ? -1 : 1))), ops };
}

export const nQueens: PatternProblem<Input> = {
  id: "n-queens",
  title: "N-Queens",
  difficulty: "Hard",
  blind75: false,
  slug: "n-queens",
  video: "Ph95IHmRp5M",
  statement: "Place n queens on an n×n chessboard so that no two attack each other (no shared row, column or diagonal). Return every solution, each as a list of rows like “.Q..”.",
  examples: [
    { label: "n = 4", input: 4 },
    { label: "n = 1", input: 1 },
    { label: "n = 3 (none)", input: 3 },
  ],
  random: (seed) => [1, 2, 3, 4, 5][seed % 5],
  big: { label: "n = 8", input: () => 8 },
  describe: (n) => `n = ${n}`,
  run,
  solve: (n) => slow(n).answer,
  brute: slow,
  bruteIdea: "Try all n! placements with one queen per row and column, then check the diagonals of each finished board. Backtracking checks every queen as it's placed and abandons a board as soon as one is attacked.",
  guide: {
    title: "N-Queens",
    idea: [
      "Each row gets exactly one queen, so decide row by row: in row r, try each column, and place a queen only if it's safe. Then solve row r + 1. If no column is safe, back up and move the previous queen.",
      "Safe means: the column is free, and so are both diagonals. Cells on one diagonal share r + c; on the other they share r − c. Three sets make the check O(1).",
    ],
    whenToUse: ["Placing items under “no two may conflict” rules: place one at a time and check only against those already placed.", "Constraint problems like Sudoku use the same skeleton."],
    stages: [
      { id: "start", title: "Empty board, row 0", detail: "", pseudo: "backtrack(0)" },
      { id: "attacked", title: "Column or diagonal taken → skip", detail: "", pseudo: "if c in cols or (r + c) in pos_diag or (r - c) in neg_diag: continue" },
      { id: "place", title: "Safe → place, go to the next row", detail: "", pseudo: "cols.add(c); pos_diag.add(r + c); neg_diag.add(r - c); board[r][c] = 'Q'; backtrack(r + 1)" },
      { id: "remove", title: "Back up: remove the queen", detail: "", pseudo: "cols.remove(c); pos_diag.remove(r + c); neg_diag.remove(r - c); board[r][c] = '.'" },
      { id: "dead", title: "No safe column in this row", detail: "", pseudo: "" },
      { id: "solution", title: "All rows filled → record", detail: "", pseudo: "if r == n: res.append(copy of board)" },
      { id: "done", title: "All arrangements tried", detail: "", pseudo: "return res" },
    ],
    legend: [
      { tone: "current", label: "Square being tried / call" },
      { tone: "pointer", label: "Queens placed" },
      { tone: "swap", label: "Attacked, and the queen attacking it" },
      { tone: "found", label: "A solution" },
    ],
    complexity: { time: "O(n!)", space: "O(n)", why: "Row r has at most n − r safe columns; the diagonal checks prune far more." },
    pitfalls: ["Diagonals: r + c for one direction, r − c for the other. Both are needed.", "Undo all three sets when removing a queen."],
    tryThis: ["n = 4 has two solutions, mirror images of each other.", "n = 3 has none: every branch of the tree ends red."],
    python: py,
  },
};
