// Valid Sudoku (NeetCode 150 · Arrays & Hashing).

import py from "../../guides/python/neetcode/valid_sudoku.py?raw";
import { rngFor } from "../helpers";
import type { PCell, PatternProblem, PatternStep } from "../types";

type Board = string[][];

const parse = (rows: string[]): Board => rows.map((r) => [...r]);
const boxOf = (r: number, c: number) => Math.floor(r / 3) * 3 + Math.floor(c / 3);

const VALID = parse([
  "53..7....",
  "6..195...",
  ".98....6.",
  "8...6...3",
  "4..8.3..1",
  "7...2...6",
  ".6....28.",
  "...419..5",
  "....8..79",
]);
// A 9 in the bottom-left corner repeats the 9 at the end of the same row.
const INVALID = VALID.map((r, i) => (i === 8 ? ["9", ...r.slice(1)] : [...r]));

function run(board: Board): PatternStep[] {
  const steps: PatternStep[] = [];
  const rows = Array.from({ length: 9 }, () => new Set<string>());
  const cols = Array.from({ length: 9 }, () => new Set<string>());
  const boxes = Array.from({ length: 9 }, () => new Set<string>());
  let ops = 0;
  const grid = (r: number, c: number, clash?: [number, number]): PCell[][] =>
    board.map((line, i) =>
      line.map((d, j): PCell => {
        const v = d === "." ? "" : d;
        if (i === r && j === c) return { v, tone: clash ? "swap" : "current" };
        if (clash && i === clash[0] && j === clash[1]) return { v, tone: "swap" };
        if (i === r || j === c || boxOf(i, j) === boxOf(r, c)) return { v, tone: "compare" };
        return { v };
      }),
    );
  const map = (r: number, c: number) => ({
    title: "sets for this cell",
    entries: [
      { k: `row ${r}`, v: [...rows[r]].sort().join(" ") || "–" },
      { k: `col ${c}`, v: [...cols[c]].sort().join(" ") || "–" },
      { k: `box ${boxOf(r, c)}`, v: [...boxes[boxOf(r, c)]].sort().join(" ") || "–" },
    ],
  });
  const findClash = (r: number, c: number, d: string): [number, number] => {
    for (let j = 0; j < c; j++) if (board[r][j] === d) return [r, j];
    for (let i = 0; i < r; i++) if (board[i][c] === d) return [i, c];
    for (let i = 0; i < 9; i++) for (let j = 0; j < 9; j++) if ((i < r || (i === r && j < c)) && boxOf(i, j) === boxOf(r, c) && board[i][j] === d) return [i, j];
    return [r, c];
  };
  for (let r = 0; r < 9; r++)
    for (let c = 0; c < 9; c++) {
      const d = board[r][c];
      if (d === ".") continue;
      const b = boxOf(r, c);
      ops += 3;
      const where = rows[r].has(d) ? `row ${r}` : cols[c].has(d) ? `column ${c}` : boxes[b].has(d) ? `box ${b}` : null;
      if (where) {
        steps.push({ stage: "invalid", explanation: `${d} is already in ${where}'s set. That's a repeat, so the board is invalid.`, rows: [], grid: { title: "board", blocks: 3, cells: grid(r, c, findClash(r, c, d)) }, map: map(r, c), vars: [{ name: "cell", value: `(${r}, ${c}) = ${d}` }, { name: "box", value: `(${r}//3)·3 + ${c}//3 = ${b}` }], ops, done: true, answer: "false" });
        return steps;
      }
      steps.push({ stage: "check", explanation: `Cell (${r}, ${c}) holds ${d}. Not in row ${r}, column ${c} or box ${b} yet: fine.`, rows: [], grid: { title: "board", blocks: 3, cells: grid(r, c) }, map: map(r, c), vars: [{ name: "cell", value: `(${r}, ${c}) = ${d}` }, { name: "box", value: `(${r}//3)·3 + ${c}//3 = ${b}` }], ops });
      rows[r].add(d);
      cols[c].add(d);
      boxes[b].add(d);
      ops += 3;
      steps.push({ stage: "add", explanation: `Record ${d} in all three sets.`, rows: [], grid: { title: "board", blocks: 3, cells: grid(r, c) }, map: map(r, c), vars: [{ name: "cell", value: `(${r}, ${c}) = ${d}` }, { name: "box", value: `(${r}//3)·3 + ${c}//3 = ${b}` }], ops });
    }
  steps.push({ stage: "valid", explanation: "Every filled cell checked: no row, column or box repeats a digit. Valid (it may still be unsolvable, but that's not asked).", rows: [], grid: { title: "board", blocks: 3, cells: board.map((line) => line.map((d) => ({ v: d === "." ? "" : d, tone: d === "." ? undefined : ("found" as const) }))) }, vars: [], ops, done: true, answer: "true" });
  return steps;
}

export const validSudoku: PatternProblem<Board> = {
  id: "valid-sudoku",
  title: "Valid Sudoku",
  difficulty: "Medium",
  blind75: false,
  slug: "valid-sudoku",
  video: "TjFXEUCMqI8",
  statement: "Given a partly filled 9×9 Sudoku board, return true if no row, no column and no 3×3 box contains the same digit twice. Empty cells are ignored, and the board doesn't need to be solvable.",
  examples: [
    { label: "Valid board", input: VALID },
    { label: "Repeat in a row", input: INVALID },
  ],
  random: (seed) => {
    const g = rngFor(seed);
    const digits = g.shuffle(["1", "2", "3", "4", "5", "6", "7", "8", "9"]);
    const solved = Array.from({ length: 9 }, (_, r) => Array.from({ length: 9 }, (_, c) => digits[(r * 3 + Math.floor(r / 3) + c) % 9]));
    const board = solved.map((line) => line.map((d) => (g.r() < 0.3 ? d : ".")));
    if (g.r() < 0.5) {
      const r = g.int(0, 8);
      const c = g.int(0, 8);
      const r2 = g.r() < 0.5 ? r : g.int(0, 8);
      const c2 = r2 === r ? (c + g.int(1, 8)) % 9 : c;
      board[r][c] = solved[r2][c2] === solved[r][c] ? board[r][c] : solved[r2][c2];
      board[r2][c2] = solved[r2][c2];
    }
    return board;
  },
  big: {
    label: "a full 81-cell valid board",
    input: () => {
      const d = ["1", "2", "3", "4", "5", "6", "7", "8", "9"];
      return Array.from({ length: 9 }, (_, r) => Array.from({ length: 9 }, (_, c) => d[(r * 3 + Math.floor(r / 3) + c) % 9]));
    },
  },
  describe: (board) => `${board.flat().filter((d) => d !== ".").length} filled cells`,
  run,
  solve: (board) => {
    const seen = new Set<string>();
    for (let r = 0; r < 9; r++)
      for (let c = 0; c < 9; c++) {
        const d = board[r][c];
        if (d === ".") continue;
        for (const k of [`r${r}${d}`, `c${c}${d}`, `b${boxOf(r, c)}${d}`]) {
          if (seen.has(k)) return false;
          seen.add(k);
        }
      }
    return true;
  },
  brute: (board) => {
    let ops = 0;
    for (let r = 0; r < 9; r++)
      for (let c = 0; c < 9; c++) {
        const d = board[r][c];
        if (d === ".") continue;
        for (let i = 0; i < 9; i++)
          for (let j = 0; j < 9; j++) {
            if (i === r && j === c) continue;
            if (i !== r && j !== c && boxOf(i, j) !== boxOf(r, c)) continue;
            ops++;
            if (board[i][j] === d) return { answer: false, ops };
          }
      }
    return { answer: true, ops };
  },
  bruteIdea: "For every filled cell, re-scan its row, column and box (20 other cells) looking for the same digit.",
  guide: {
    title: "Valid Sudoku",
    idea: [
      "Three rules, so keep three kinds of sets: one per row, one per column, one per 3×3 box. Each set remembers which digits that row/column/box has.",
      "The only trick is naming the box: box = (row // 3) × 3 + (col // 3) numbers the nine boxes 0 to 8. Then one pass over the board, with three lookups per filled cell.",
    ],
    whenToUse: ["“No repeats within each group” where a cell belongs to several groups: one hash set per group.", "Grid problems often need an index formula like row // 3 to map a cell to its block."],
    stages: [
      { id: "check", title: "Check the three sets", detail: "Is this digit already in its row's, column's or box's set?", pseudo: "if d in rows[r] or d in cols[c] or d in boxes[b]" },
      { id: "add", title: "Record the digit", detail: "Add it to all three sets.", pseudo: "rows[r].add(d); cols[c].add(d); boxes[b].add(d)" },
      { id: "invalid", title: "Repeat found → invalid", detail: "The digit already appeared in one of its groups.", pseudo: "return False" },
      { id: "valid", title: "No repeats → valid", detail: "Every filled cell passed.", pseudo: "return True" },
    ],
    legend: [
      { tone: "current", label: "Cell being checked" },
      { tone: "compare", label: "Its row, column and box" },
      { tone: "swap", label: "The clash" },
    ],
    complexity: { time: "O(81) = O(1)", space: "O(81) = O(1)", why: "The board is always 9×9, so the work is fixed. For an n×n board it would be O(n²)." },
    pitfalls: [
      "The box index: (r // 3) * 3 + c // 3, not r // 3 + c // 3 (that gives only 0–4).",
      "Valid isn't the same as solvable. This problem only checks for repeats.",
    ],
    tryThis: ["Pick “Repeat in a row” and see which two 9s clash.", "Press “Random” for new boards; about half contain a planted repeat."],
    python: py,
  },
};
