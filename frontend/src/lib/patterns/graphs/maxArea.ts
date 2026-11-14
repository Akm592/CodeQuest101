// Max Area of Island (NeetCode 150 · Graphs).

import py from "../../guides/python/neetcode/max_area_island.py?raw";
import { row } from "../helpers";
import type { PatternProblem, PatternStep } from "../types";
import { around, cells, chars, key, randomLand } from "./grid";

type Input = string[];

function run(rows: Input): PatternStep[] {
  const g = chars(rows);
  const R = g.length;
  const C = g[0].length;
  const steps: PatternStep[] = [];
  const seen = new Set<string>();
  const now = new Set<string>(); // cells of the island being measured
  const bestCells = new Set<string>();
  let stack: string[] = [];
  let cur: [number, number] | null = null;
  let area = 0;
  let best = 0;
  let ops = 0;
  const snap = (stage: string, explanation: string, extra: Partial<PatternStep> = {}) =>
    steps.push({
      stage,
      explanation,
      rows: [row("DFS call stack", stack)],
      grid: {
        title: "grid: 1 = land, 0 = water",
        cells: cells(
          g,
          (v) => v,
          (r, c) => (cur && cur[0] === r && cur[1] === c ? "current" : now.has(key(r, c)) ? "visited" : bestCells.has(key(r, c)) ? "found" : seen.has(key(r, c)) ? "idle" : g[r][c] === "0" ? "idle" : undefined),
        ),
      },
      vars: [
        { name: "area of this island", value: String(area) },
        { name: "largest so far", value: String(best), tone: "found" },
      ],
      ops,
      ...extra,
    });
  snap("start", "Scan for land not visited yet. From each such cell, a DFS returns the island's area: 1 for the cell itself plus the areas found from its four neighbours. Keep the largest.");
  const dfs = (r: number, c: number): number => {
    ops++;
    if (r < 0 || c < 0 || r >= R || c >= C || g[r][c] === "0" || seen.has(key(r, c))) return 0;
    seen.add(key(r, c));
    now.add(key(r, c));
    stack.push(`(${r},${c})`);
    area++;
    cur = [r, c];
    snap("visit", `Visit (${r},${c}): land, not seen before. Count it: this island's area so far is ${area}. Now try its four neighbours.`);
    let a = 1;
    for (const [y, x] of around(r, c, R, C)) a += dfs(y, x);
    stack.pop();
    return a;
  };
  for (let r = 0; r < R; r++)
    for (let c = 0; c < C; c++) {
      ops++;
      if (g[r][c] !== "1" || seen.has(key(r, c))) continue;
      area = 0;
      now.clear();
      stack = [];
      const a = dfs(r, c);
      cur = null;
      const better = a > best;
      if (better) {
        best = a;
        bestCells.clear();
        for (const k of now) bestCells.add(k);
      }
      snap("island", `The DFS from (${r},${c}) is finished: this island's area is ${a}.${better ? ` That's the largest so far.` : ` Not bigger than ${best}.`}`);
      now.clear();
    }
  snap("done", `Scan finished. The largest island has area ${best}.`, { done: true, answer: String(best) });
  return steps;
}

/** Cross-check: sizes from union-find. */
function areaUF(rows: Input): number {
  const R = rows.length;
  const C = rows[0].length;
  const parent = Array.from({ length: R * C }, (_, i) => i);
  const find = (x: number): number => (parent[x] === x ? x : (parent[x] = find(parent[x])));
  for (let r = 0; r < R; r++)
    for (let c = 0; c < C; c++) {
      if (rows[r][c] !== "1") continue;
      if (r && rows[r - 1][c] === "1") parent[find(r * C + c)] = find((r - 1) * C + c);
      if (c && rows[r][c - 1] === "1") parent[find(r * C + c)] = find(r * C + c - 1);
    }
  const size = new Map<number, number>();
  for (let r = 0; r < R; r++) for (let c = 0; c < C; c++) if (rows[r][c] === "1") size.set(find(r * C + c), (size.get(find(r * C + c)) ?? 0) + 1);
  return Math.max(0, ...size.values());
}

export const maxArea: PatternProblem<Input> = {
  id: "max-area-island",
  title: "Max Area of Island",
  difficulty: "Medium",
  blind75: false,
  slug: "max-area-of-island",
  video: "iJGr1OtmH0c",
  statement: "Given a grid of 1s (land) and 0s (water), return the area (number of cells) of the largest island, or 0 if there is no land.",
  examples: [
    { label: "three islands", input: ["11000", "11011", "00010", "10011"] },
    { label: "no land", input: ["000", "000"] },
    { label: "a ring", input: ["1111", "1001", "1111"] },
  ],
  random: (seed) => randomLand(seed, 2, 4, 3, 5, 0.55),
  describe: (rows) => `grid = [${rows.join(", ")}]`,
  run,
  solve: areaUF,
  brute: null,
  bruteIdea: "Every cell has to be looked at, so O(rows × cols) is already the best possible. (The answer is cross-checked with union-find.)",
  guide: {
    title: "Max Area of Island",
    idea: [
      "Same scan as Number of Islands, but the flood fill returns a number. dfs(r, c) is 0 for water, off-grid or already-visited cells; otherwise mark the cell visited and return 1 + the four neighbours' areas.",
      "Each island is measured by exactly one DFS, started from its first cell in the scan. Track the maximum.",
    ],
    whenToUse: ["“Size of the largest region”: flood fill that returns a count.", "Recursion that adds up results from neighbours, with a visited set so nothing is counted twice."],
    stages: [
      { id: "start", title: "Scan for unvisited land", detail: "", pseudo: "for r, c in cells: area = max(area, dfs(r, c))" },
      { id: "visit", title: "Land, not visited: count it, try the neighbours", detail: "", pseudo: "visit.add((r, c)); return 1 + dfs(r+1, c) + dfs(r-1, c) + dfs(r, c+1) + dfs(r, c-1)" },
      { id: "island", title: "The DFS returns the island's area", detail: "", pseudo: "area = max(area, dfs(r, c))" },
      { id: "done", title: "Largest area", detail: "", pseudo: "return area" },
    ],
    legend: [
      { tone: "current", label: "Cell being visited" },
      { tone: "visited", label: "This island so far" },
      { tone: "found", label: "Largest island so far" },
      { tone: "idle", label: "Water / already measured" },
    ],
    complexity: { time: "O(rows × cols)", space: "O(rows × cols)", why: "Each cell is visited once; the recursion can go as deep as the biggest island." },
    pitfalls: ["Mark a cell visited before recursing into its neighbours, or two neighbours can count each other forever.", "Return 0 for water and off-grid cells, not nothing."],
    tryThis: ["In “three islands”, the top-left island has area 4, then the one on the right beats it with 5; the lone cell at the bottom has 1.", "“A ring” is one island of area 10, with water in the middle."],
    python: py,
  },
};
