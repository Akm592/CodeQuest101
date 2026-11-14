// Walls and Gates (NeetCode 150 · Graphs).

import py from "../../guides/python/neetcode/walls_and_gates.py?raw";
import { row, rngFor } from "../helpers";
import type { PatternProblem, PatternStep } from "../types";
import { around, cells, key } from "./grid";

/** -1 = wall, 0 = gate, INF = empty room. */
type Input = number[][];

export const INF = 2147483647;
const show = (v: number) => (v === -1 ? "▇" : v === INF ? "∞" : String(v));
const showGrid = (g: number[][]) => `[${g.map((r) => `[${r.map((v) => (v === INF ? "INF" : String(v))).join(",")}]`).join(", ")}]`;

function run(input: Input): PatternStep[] {
  const g = input.map((r) => [...r]);
  const R = g.length;
  const C = g[0].length;
  const steps: PatternStep[] = [];
  let q: [number, number][] = [];
  let fresh = new Set<string>();
  let dist = 0;
  let ops = 0;
  for (let r = 0; r < R; r++) for (let c = 0; c < C; c++) if (g[r][c] === 0) q.push([r, c]);
  const snap = (stage: string, explanation: string, extra: Partial<PatternStep> = {}) =>
    steps.push({
      stage,
      explanation,
      rows: [row("queue: cells whose neighbours are filled next", q.map(([r, c]) => `(${r},${c})`))],
      grid: {
        title: "▇ wall, 0 gate, ∞ empty room; numbers: steps to the nearest gate",
        cells: cells(
          g,
          show,
          (r, c) => (fresh.has(key(r, c)) ? "found" : q.some(([y, x]) => y === r && x === c) ? "compare" : g[r][c] === -1 ? "idle" : g[r][c] === 0 ? "pointer" : undefined),
        ),
      },
      vars: [{ name: "distance being filled", value: String(dist), tone: "found" }],
      ops,
      ...extra,
    });
  snap("start", `Fill each room with the distance to its nearest gate. Start a BFS from all ${q.length} gate${q.length === 1 ? "" : "s"} at once: the first time the BFS reaches a room is along the shortest route from the closest gate.`);
  while (q.length) {
    dist++;
    const next: [number, number][] = [];
    fresh = new Set();
    for (const [r, c] of q)
      for (const [y, x] of around(r, c, R, C)) {
        ops++;
        if (g[y][x] !== INF) continue;
        g[y][x] = dist;
        next.push([y, x]);
        fresh.add(key(y, x));
      }
    q = next;
    if (next.length) snap("fill", `Distance ${dist}: the unfilled rooms next to the queue get ${dist}. ${next.length} room${next.length === 1 ? "" : "s"} filled; they go in the queue for distance ${dist + 1}.`);
  }
  fresh = new Set();
  const left = g.flat().filter((v) => v === INF).length;
  snap("done", `The queue is empty. Every room a gate can reach has its distance${left ? `; ${left} room${left === 1 ? " is" : "s are"} walled off and stay${left === 1 ? "s" : ""} ∞` : ""}.`, { done: true, answer: showGrid(g) });
  return steps;
}

/** The slow way: a separate BFS from every gate, keeping the smallest distance. */
function slow(input: Input) {
  const g = input.map((r) => [...r]);
  const R = g.length;
  const C = g[0].length;
  let ops = 0;
  for (let r = 0; r < R; r++)
    for (let c = 0; c < C; c++) {
      if (input[r][c] !== 0) continue;
      const d = new Map([[key(r, c), 0]]);
      const q: [number, number][] = [[r, c]];
      while (q.length) {
        const [y, x] = q.shift()!;
        for (const [ny, nx] of around(y, x, R, C)) {
          ops++;
          if (input[ny][nx] !== INF || d.has(key(ny, nx))) continue;
          const v = d.get(key(y, x))! + 1;
          d.set(key(ny, nx), v);
          g[ny][nx] = Math.min(g[ny][nx], v);
          q.push([ny, nx]);
        }
      }
    }
  return { answer: showGrid(g), ops };
}

export const wallsAndGates: PatternProblem<Input> = {
  id: "walls-and-gates",
  title: "Walls and Gates",
  difficulty: "Medium",
  blind75: false,
  slug: "walls-and-gates",
  video: "e69C6xhiSQE",
  statement: "In a grid, −1 is a wall, 0 a gate and INF (2147483647) an empty room. Fill each room with the number of steps to its nearest gate; rooms no gate can reach stay INF.",
  examples: [
    {
      label: "LeetCode's example",
      input: [
        [INF, -1, 0, INF],
        [INF, INF, INF, -1],
        [INF, -1, INF, -1],
        [0, -1, INF, INF],
      ],
    },
    { label: "a walled-off room", input: [[0, INF, -1, INF], [INF, INF, -1, INF]] },
  ],
  random: (seed) => {
    const g = rngFor(seed);
    const R = g.int(2, 4);
    const C = g.int(2, 5);
    return Array.from({ length: R }, () => Array.from({ length: C }, () => g.pick([INF, INF, INF, -1, 0])));
  },
  big: { label: "a 15×15 hall with 12 gates", input: () => Array.from({ length: 15 }, (_, r) => Array.from({ length: 15 }, (_, c) => ((r * 15 + c) % 19 === 0 ? 0 : (r * 3 + c * 7) % 11 === 0 ? -1 : INF))) },
  describe: (g) => `rooms = [${g.map((r) => `[${r.map(show).join(",")}]`).join(", ")}]`,
  run,
  solve: (g) => slow(g).answer,
  brute: slow,
  bruteIdea: "Run a separate BFS from every gate and keep each room's smallest distance: O(gates × rows × cols).",
  guide: {
    title: "Walls and Gates",
    idea: [
      "Put every gate in the queue at the start and run one BFS. BFS reaches cells in order of distance, and with all gates starting together, the first time a room is reached is from its nearest gate.",
      "So a room only needs filling once: when a neighbour of the current queue level is still INF, set it to the distance and queue it. Walls are never entered.",
    ],
    whenToUse: ["Distance to the nearest of many sources: one multi-source BFS, not one BFS per source.", "Grid shortest paths where every step costs the same."],
    stages: [
      { id: "start", title: "Queue every gate", detail: "", pseudo: "q = deque((r, c) for every gate)" },
      { id: "fill", title: "Next level: fill rooms with the distance", detail: "", pseudo: "if rooms[r][c] == INF: rooms[r][c] = dist; q.append((r, c))" },
      { id: "done", title: "Queue empty", detail: "", pseudo: "" },
    ],
    legend: [
      { tone: "pointer", label: "Gate" },
      { tone: "compare", label: "In the queue" },
      { tone: "found", label: "Just filled" },
      { tone: "idle", label: "Wall" },
    ],
    complexity: { time: "O(rows × cols)", space: "O(rows × cols)", why: "Every room is filled and queued at most once." },
    pitfalls: ["Only fill rooms that are still INF: a room filled earlier is already at its smallest distance.", "BFS, not DFS: DFS reaches rooms by long routes first."],
    tryThis: ["In LeetCode's example, the room at the top-left is 3 steps from the bottom-left gate.", "In “a walled-off room”, the right column stays ∞."],
    python: py,
  },
};
