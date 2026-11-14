// Surrounded Regions (NeetCode 150 · Graphs).

import py from "../../guides/python/neetcode/surrounded_regions.py?raw";
import { rngFor } from "../helpers";
import type { PatternProblem, PatternStep } from "../types";
import { around, cells, chars, key } from "./grid";

type Input = string[];

function run(rows: Input): PatternStep[] {
  const g = chars(rows);
  const R = g.length;
  const C = g[0].length;
  const steps: PatternStep[] = [];
  let cur: [number, number] | null = null;
  let ops = 0;
  let flipped = new Set<string>();
  const snap = (stage: string, explanation: string, extra: Partial<PatternStep> = {}) =>
    steps.push({
      stage,
      explanation,
      rows: [],
      grid: {
        title: "board (T = an O that touches the border, so it's safe)",
        cells: cells(
          g,
          (v) => v,
          (r, c) => (cur && cur[0] === r && cur[1] === c ? "current" : g[r][c] === "T" ? "pointer" : flipped.has(key(r, c)) ? "swap" : g[r][c] === "O" ? "compare" : undefined),
        ),
      },
      vars: [
        { name: "safe Os (T)", value: String(g.flat().filter((v) => v === "T").length), tone: "pointer" },
        { name: "captured", value: String(flipped.size), tone: "swap" },
      ],
      ops,
      ...extra,
    });
  snap("start", "An O region is captured unless it touches the border. So find the safe ones first: from every O on the border, flood its region and mark it T. Then every O that's left is surrounded.");
  const dfs = (r: number, c: number) => {
    ops++;
    if (r < 0 || c < 0 || r >= R || c >= C || g[r][c] !== "O") return;
    g[r][c] = "T";
    cur = [r, c];
    snap("safe", r === 0 || c === 0 || r === R - 1 || c === C - 1 ? `(${r},${c}) is an O on the border: it can't be surrounded. Mark it T and flood its region.` : `(${r},${c}) is an O joined to a border O: it's safe too. Mark it T.`);
    for (const [y, x] of around(r, c, R, C)) dfs(y, x);
  };
  for (let r = 0; r < R; r++)
    for (let c = 0; c < C; c++) {
      ops++;
      if (r === 0 || c === 0 || r === R - 1 || c === C - 1) dfs(r, c);
    }
  cur = null;
  snap("scan", "Every safe O is marked T. Now one pass over the board: an O still left is surrounded, so it becomes X; a T goes back to O.");
  const caught: string[] = [];
  for (let r = 0; r < R; r++)
    for (let c = 0; c < C; c++) {
      ops++;
      if (g[r][c] === "O") {
        g[r][c] = "X";
        flipped.add(key(r, c));
        caught.push(`(${r},${c})`);
      }
    }
  snap("capture", caught.length ? `Captured: ${caught.join(", ")} become X.` : "No O was left: nothing is surrounded.");
  for (let r = 0; r < R; r++) for (let c = 0; c < C; c++) if (g[r][c] === "T") g[r][c] = "O";
  flipped = new Set(flipped);
  snap("done", "The Ts are turned back into Os. That's the final board.", { done: true, answer: `[${g.map((l) => l.join("")).join(", ")}]` });
  return steps;
}

/** The slow way: for each O, search its region to see whether it reaches the border. */
function slow(rows: Input) {
  const R = rows.length;
  const C = rows[0].length;
  let ops = 0;
  const out = chars(rows);
  for (let r = 0; r < R; r++)
    for (let c = 0; c < C; c++) {
      if (rows[r][c] !== "O") continue;
      const seen = new Set([key(r, c)]);
      const stack: [number, number][] = [[r, c]];
      let edge = false;
      while (stack.length) {
        const [y, x] = stack.pop()!;
        ops++;
        if (y === 0 || x === 0 || y === R - 1 || x === C - 1) edge = true;
        for (const [ny, nx] of around(y, x, R, C))
          if (rows[ny][nx] === "O" && !seen.has(key(ny, nx))) {
            seen.add(key(ny, nx));
            stack.push([ny, nx]);
          }
      }
      if (!edge) out[r][c] = "X";
    }
  return { answer: `[${out.map((l) => l.join("")).join(", ")}]`, ops };
}

export const surroundedRegions: PatternProblem<Input> = {
  id: "surrounded-regions",
  title: "Surrounded Regions",
  difficulty: "Medium",
  blind75: false,
  slug: "surrounded-regions",
  video: "9z2BunfoZ5Y",
  statement: "Given a board of X and O, capture every region of Os that is completely surrounded by Xs (turn it into Xs). A region touching the border is never captured.",
  examples: [
    { label: "LeetCode's example", input: ["XXXX", "XOOX", "XXOX", "XOXX"] },
    { label: "two regions", input: ["XXXXX", "XOOXX", "XXXOO", "XOXXX"] },
  ],
  random: (seed) => {
    const g = rngFor(seed);
    const R = g.int(3, 4);
    const C = g.int(3, 5);
    return Array.from({ length: R }, () => Array.from({ length: C }, () => (g.r() < 0.45 ? "O" : "X")).join(""));
  },
  big: { label: "a 14×14 board of O blocks", input: () => Array.from({ length: 14 }, (_, r) => Array.from({ length: 14 }, (_, c) => (r % 5 === 0 || c % 5 === 0 ? "X" : "O")).join("")) },
  describe: (rows) => `board = [${rows.join(", ")}]`,
  run,
  solve: (rows) => slow(rows).answer,
  brute: slow,
  bruteIdea: "For each O, search its whole region to see if it reaches the border. Every O in a big region repeats the same search: O((rows × cols)²).",
  guide: {
    title: "Surrounded Regions",
    idea: [
      "Turn the question around: a region survives exactly when it touches the border. So start from every border O and flood its region, marking those cells T (temporary: safe).",
      "Then sweep the board once: any O still there wasn't reached from the border, so it's surrounded and becomes X. Finally turn the Ts back into Os.",
    ],
    whenToUse: ["“Regions not connected to the border”: flood from the border first, then everything unmarked is enclosed.", "Mark cells in place with a temporary value instead of a separate visited set."],
    stages: [
      { id: "start", title: "Look along the border", detail: "", pseudo: "for r, c on the border: if board[r][c] == 'O': capture(r, c)" },
      { id: "safe", title: "Flood border regions, mark T", detail: "", pseudo: "board[r][c] = 'T'; capture(r ± 1, c ± 1)" },
      { id: "scan", title: "Remaining Os are surrounded", detail: "", pseudo: "" },
      { id: "capture", title: "O → X", detail: "", pseudo: "if board[r][c] == 'O': board[r][c] = 'X'" },
      { id: "done", title: "T → O", detail: "", pseudo: "if board[r][c] == 'T': board[r][c] = 'O'" },
    ],
    legend: [
      { tone: "current", label: "Cell being marked" },
      { tone: "pointer", label: "Safe (touches the border)" },
      { tone: "compare", label: "O not reached (yet)" },
      { tone: "swap", label: "Captured" },
    ],
    complexity: { time: "O(rows × cols)", space: "O(rows × cols)", why: "Each cell is flooded at most once and swept twice." },
    pitfalls: ["Don't flip Os while you're still flooding: mark first, flip afterwards.", "Remember to turn the Ts back into Os."],
    tryThis: ["In LeetCode's example, the O at the bottom touches the border and survives; the three in the middle are captured.", "In “two regions”, the pair of Os at the top is captured; the pair on the right and the O on the bottom row touch the border and survive."],
    python: py,
  },
};
