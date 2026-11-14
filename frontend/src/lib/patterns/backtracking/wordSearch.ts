// Word Search (NeetCode 150 · Backtracking).

import py from "../../guides/python/neetcode/word_search.py?raw";
import { row, rngFor } from "../helpers";
import type { PCell, PatternProblem, PatternStep } from "../types";

type Input = { board: string[]; word: string };

const DIRS = [
  [-1, 0],
  [0, 1],
  [1, 0],
  [0, -1],
] as const;

function run({ board, word }: Input): PatternStep[] {
  const steps: PatternStep[] = [];
  const R = board.length;
  const C = board[0].length;
  const path: [number, number][] = [];
  let probe: [number, number] | null = null;
  let probeBad = false;
  let ops = 0;
  let starts = 0;
  let won = false;
  const snap = (stage: string, explanation: string, extra: Partial<PatternStep> = {}) => {
    const on = new Map(path.map(([r, c], i) => [`${r},${c}`, i]));
    const cells: PCell[][] = board.map((line, r) =>
      [...line].map((v, c): PCell => {
        const i = on.get(`${r},${c}`);
        const isProbe = probe && probe[0] === r && probe[1] === c;
        return {
          v,
          tone: won && i !== undefined ? "found" : isProbe ? (probeBad ? "swap" : "current") : i === undefined ? undefined : i === path.length - 1 ? "current" : "pointer",
          tag: i !== undefined ? String(i + 1) : undefined,
        };
      }),
    );
    steps.push({
      stage,
      explanation,
      rows: [row("word", [...word], Object.fromEntries([...word].map((_, i) => [i, i < path.length ? (won ? "found" : "pointer") : i === path.length && probe ? (probeBad ? "swap" : "current") : undefined])))],
      grid: { title: "board (numbers: the path so far)", cells },
      vars: [
        { name: "matched", value: `${path.length} of ${word.length}`, tone: won ? "found" : undefined },
        { name: "start cells tried", value: String(starts) },
      ],
      ops,
      ...extra,
    });
  };
  snap("start", `Try every cell as the start of “${word}”. From a matching cell, step to a neighbour (up, down, left, right) that matches the next letter and isn't already on the path. If no neighbour works, step back and try another way.`);
  const dfs = (r: number, c: number, i: number): boolean => {
    ops++;
    if (r < 0 || c < 0 || r >= R || c >= C || path.some(([y, x]) => y === r && x === c)) return false;
    if (board[r][c] !== word[i]) {
      probe = [r, c];
      probeBad = true;
      // Only show mismatches next to an existing path; a wrong start letter is skipped silently.
      if (i > 0) snap("mismatch", `Next to “${word.slice(0, i)}”: “${board[r][c]}” at (${r},${c}) isn't “${word[i]}”. Not this way.`);
      probe = null;
      probeBad = false;
      return false;
    }
    path.push([r, c]);
    if (i === 0) starts++;
    if (i === word.length - 1) {
      won = true;
      snap("found", `The last letter matches: “${word}” is on the board.`);
      return true;
    }
    snap(i === 0 ? "begin" : "match", i === 0 ? `Start at (${r},${c}): “${board[r][c]}” matches the first letter.` : `(${r},${c}) is “${board[r][c]}”, the next letter: the path spells “${word.slice(0, i + 1)}”.`);
    for (const [dr, dc] of DIRS) if (dfs(r + dr, c + dc, i + 1)) return true;
    path.pop();
    snap("back", `No neighbour of (${r},${c}) continues “${word.slice(0, i + 1)}”. Remove it from the path and back up.`);
    return false;
  };
  let ok = false;
  outer: for (let r = 0; r < R; r++)
    for (let c = 0; c < C; c++)
      if (dfs(r, c, 0)) {
        ok = true;
        break outer;
      }
  if (!ok) snap("done", `Every start cell has been tried and no path spells “${word}”. Return false.`, { done: true, answer: "false" });
  else steps.push({ ...steps[steps.length - 1], stage: "done", explanation: `Return true: the path ${path.map(([r, c]) => `(${r},${c})`).join(" → ")} spells “${word}”.`, done: true, answer: "true" });
  return steps;
}

/** The slow way: list every path of word-length cells (no cell twice), and only then compare it with the word. */
function slow({ board, word }: Input) {
  const R = board.length;
  const C = board[0].length;
  let ops = 0;
  const used = new Set<string>();
  let found = false;
  const go = (r: number, c: number, s: string) => {
    ops++;
    if (s.length === word.length) {
      if (s === word) found = true;
      return;
    }
    for (const [dr, dc] of DIRS) {
      const y = r + dr;
      const x = c + dc;
      if (y < 0 || x < 0 || y >= R || x >= C || used.has(`${y},${x}`)) continue;
      used.add(`${y},${x}`);
      go(y, x, s + board[y][x]);
      used.delete(`${y},${x}`);
    }
  };
  for (let r = 0; r < R; r++)
    for (let c = 0; c < C; c++) {
      used.add(`${r},${c}`);
      go(r, c, board[r][c]);
      used.delete(`${r},${c}`);
    }
  return { answer: found, ops };
}

export const wordSearch: PatternProblem<Input> = {
  id: "word-search",
  title: "Word Search",
  difficulty: "Medium",
  blind75: true,
  slug: "word-search",
  video: "pfiQ_PS1g8E",
  statement: "Given a board of letters and a word, return true if the word can be spelled by a path of side-by-side cells (up, down, left, right), using each cell at most once.",
  examples: [
    { label: "LeetCode: ABCCED", input: { board: ["ABCE", "SFCS", "ADEE"], word: "ABCCED" } },
    { label: "LeetCode: SEE", input: { board: ["ABCE", "SFCS", "ADEE"], word: "SEE" } },
    { label: "LeetCode: ABCB (false)", input: { board: ["ABCE", "SFCS", "ADEE"], word: "ABCB" } },
  ],
  random: (seed) => {
    const g = rngFor(seed);
    const R = g.int(2, 3);
    const C = g.int(2, 4);
    const board = Array.from({ length: R }, () => Array.from({ length: C }, () => g.pick([..."ABC"])).join(""));
    return { board, word: Array.from({ length: g.int(2, 4) }, () => g.pick([..."ABC"])).join("") };
  },
  big: { label: "4×5 board, a 6-letter word that isn't there", input: () => ({ board: ["ABCDE", "FGHIJ", "KLMNO", "PQRST"], word: "ABGLQZ" }) },
  describe: ({ board, word }) => `board = [${board.join(", ")}], word = "${word}"`,
  run,
  solve: (input) => slow(input).answer,
  brute: slow,
  bruteIdea: "List every path of word-length cells on the board and compare each with the word. Backtracking compares as it goes and abandons a path at its first wrong letter.",
  guide: {
    title: "Word Search",
    idea: [
      "DFS from every cell. dfs(r, c, i) asks: can word[i:] be spelled starting at (r, c)? It fails if the cell is off the board, already on the path, or the wrong letter. Otherwise add the cell to the path and try the four neighbours with i + 1.",
      "If none of them works, remove the cell from the path (so other paths may use it) and return false. Reaching the last letter returns true all the way up.",
    ],
    whenToUse: ["Paths on a grid where a cell can't be reused: DFS with a visited set that you undo on the way back.", "Stop exploring the moment a prefix can't match."],
    stages: [
      { id: "start", title: "Try every start cell", detail: "", pseudo: "for r, c in cells: if dfs(r, c, 0): return True" },
      { id: "begin", title: "First letter matches: start a path", detail: "", pseudo: "path.add((r, c))" },
      { id: "match", title: "Next letter matches: extend the path", detail: "", pseudo: "res = dfs(r+1, c, i+1) or dfs(r-1, c, i+1) or dfs(r, c+1, i+1) or dfs(r, c-1, i+1)" },
      { id: "mismatch", title: "Wrong letter, used cell or off the board", detail: "", pseudo: "if out of bounds or word[i] != board[r][c] or (r, c) in path: return False" },
      { id: "back", title: "Dead end: remove the cell, back up", detail: "", pseudo: "path.remove((r, c)); return res" },
      { id: "found", title: "Last letter matched", detail: "", pseudo: "if i == len(word): return True" },
      { id: "done", title: "Answer", detail: "", pseudo: "return False" },
    ],
    legend: [
      { tone: "current", label: "Cell being tried" },
      { tone: "pointer", label: "Path so far" },
      { tone: "swap", label: "Wrong letter" },
      { tone: "found", label: "The word" },
    ],
    complexity: { time: "O(R · C · 4^L)", space: "O(L)", why: "From each of R·C start cells, a path of up to L letters with up to 4 choices per step (3 after the first)." },
    pitfalls: ["Remove the cell from the path when backing up, or it stays blocked for other paths.", "The path can't reuse a cell: ABCB is false on LeetCode's board even though B is next to C."],
    tryThis: ["In “ABCCED”, the path turns down at the second C.", "In “ABCB”, watch the search back up from C when the only B nearby is already used."],
    python: py,
  },
};
