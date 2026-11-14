// Number of Islands (NeetCode 150 · Graphs).

import py from "../../guides/python/neetcode/num_islands.py?raw";
import { row } from "../helpers";
import type { PatternProblem, PatternStep } from "../types";
import { around, cells, chars, key, randomLand } from "./grid";

type Input = string[];

/** Flood-fills every island with BFS, one step per cell taken from the queue. */
function run(rows: Input): PatternStep[] {
  const g = chars(rows);
  const R = g.length;
  const C = g[0].length;
  const steps: PatternStep[] = [];
  const island = new Map<string, number>(); // cell → island number
  let queue: [number, number][] = [];
  let cur: [number, number] | null = null;
  let count = 0;
  let ops = 0;
  const snap = (stage: string, explanation: string, extra: Partial<PatternStep> = {}) =>
    steps.push({
      stage,
      explanation,
      rows: [row("BFS queue", queue.map(([r, c]) => `(${r},${c})`))],
      grid: {
        title: "grid: 1 = land, 0 = water",
        cells: cells(
          g,
          (v) => v,
          (r, c) => {
            if (cur && cur[0] === r && cur[1] === c) return "current";
            if (queue.some(([y, x]) => y === r && x === c)) return "pointer";
            const k = island.get(key(r, c));
            return k === undefined ? (g[r][c] === "0" ? "idle" : undefined) : k === count ? "visited" : "found";
          },
          (r, c) => (island.has(key(r, c)) ? `#${island.get(key(r, c))}` : undefined),
        ),
      },
      vars: [{ name: "islands", value: String(count), tone: "found" }],
      ops,
      ...extra,
    });
  snap("start", "Scan the grid cell by cell. Land that no island has claimed yet starts a new island: flood it with BFS, claiming every land cell joined to it up, down, left or right, so it's never counted again.");
  for (let r = 0; r < R; r++)
    for (let c = 0; c < C; c++) {
      ops++;
      if (g[r][c] !== "1" || island.has(key(r, c))) continue;
      count++;
      island.set(key(r, c), count);
      queue = [[r, c]];
      cur = null;
      snap("new", `(${r},${c}) is land that isn't part of any island yet: island #${count}. Put it in the queue and flood outwards from it.`);
      while (queue.length) {
        const [y, x] = queue.shift()!;
        cur = [y, x];
        const added: string[] = [];
        for (const [ny, nx] of around(y, x, R, C)) {
          ops++;
          if (g[ny][nx] === "1" && !island.has(key(ny, nx))) {
            island.set(key(ny, nx), count);
            queue.push([ny, nx]);
            added.push(`(${ny},${nx})`);
          }
        }
        snap("flood", added.length ? `Take (${y},${x}) from the queue. Its unclaimed land neighbours ${added.join(", ")} join island #${count} and go in the queue.` : `Take (${y},${x}) from the queue. No new land next to it.`);
      }
      cur = null;
      snap("island", `The queue is empty: island #${count} is complete. Keep scanning for land that no island has claimed.`);
    }
  snap("done", `The scan is finished: ${count} island${count === 1 ? "" : "s"}.`, { done: true, answer: String(count) });
  return steps;
}

/** Counting with union-find instead, as a cross-check. */
function islandsUF(rows: Input): number {
  const R = rows.length;
  const C = rows[0].length;
  const parent = Array.from({ length: R * C }, (_, i) => i);
  const find = (x: number): number => (parent[x] === x ? x : (parent[x] = find(parent[x])));
  let n = 0;
  for (let r = 0; r < R; r++)
    for (let c = 0; c < C; c++) {
      if (rows[r][c] !== "1") continue;
      n++;
      for (const [y, x] of [[r - 1, c], [r, c - 1]])
        if (y >= 0 && x >= 0 && rows[y][x] === "1") {
          const a = find(r * C + c);
          const b = find(y * C + x);
          if (a !== b) {
            parent[a] = b;
            n--;
          }
        }
    }
  return n;
}

export const numIslands: PatternProblem<Input> = {
  id: "num-islands",
  title: "Number of Islands",
  difficulty: "Medium",
  blind75: true,
  slug: "number-of-islands",
  video: "pV2kpPD66nE",
  statement: "Given a grid of '1' (land) and '0' (water), count the islands. An island is land joined up, down, left or right; the grid's edges are water.",
  examples: [
    { label: "LeetCode's example 2", input: ["11000", "11000", "00100", "00011"] },
    { label: "LeetCode's example 1", input: ["11110", "11010", "11000", "00000"] },
    { label: "checkerboard", input: ["101", "010", "101"] },
  ],
  random: (seed) => randomLand(seed),
  describe: (rows) => `grid = [${rows.join(", ")}]`,
  run,
  solve: islandsUF,
  brute: null,
  bruteIdea: "Every cell has to be looked at, so O(rows × cols) is already the best possible. (The answer is cross-checked with union-find, a different method.)",
  guide: {
    title: "Number of Islands",
    idea: [
      "A grid is a graph: each land cell is a node, joined to the land cells beside it. Counting islands is counting connected components.",
      "Scan every cell. When you meet land that hasn't been visited, that's a new island: add 1, then flood it with BFS (or DFS), marking every land cell it reaches as visited, so the rest of that island is never counted again.",
    ],
    whenToUse: ["“Count regions / groups / components” on a grid: scan, and flood-fill from each unvisited start.", "BFS uses a queue; DFS (recursion) works just as well here."],
    stages: [
      { id: "start", title: "Scan every cell", detail: "", pseudo: "for r in range(rows): for c in range(cols):" },
      { id: "new", title: "Unvisited land → a new island", detail: "", pseudo: "if grid[r][c] == '1' and (r, c) not in visit: bfs(r, c); islands += 1" },
      { id: "flood", title: "BFS: claim the land neighbours", detail: "", pseudo: "row, col = q.popleft(); for dr, dc in directions: if land and not visited: q.append(...); visit.add(...)" },
      { id: "island", title: "Queue empty: island complete", detail: "", pseudo: "" },
      { id: "done", title: "Scan finished", detail: "", pseudo: "return islands" },
    ],
    legend: [
      { tone: "current", label: "Cell taken from the queue" },
      { tone: "pointer", label: "Waiting in the queue" },
      { tone: "visited", label: "Island being flooded" },
      { tone: "found", label: "Islands already counted" },
      { tone: "idle", label: "Water" },
    ],
    complexity: { time: "O(rows × cols)", space: "O(rows × cols)", why: "Each cell is scanned once and enters the queue at most once." },
    pitfalls: ["Mark a cell visited when you add it to the queue, not when you take it out, or it can be queued twice.", "Diagonal cells aren't neighbours."],
    tryThis: ["In the checkerboard every 1 is its own island: diagonals don't join.", "LeetCode's example 1 is a single flood, however it twists."],
    python: py,
  },
};
