// Rotting Oranges (NeetCode 150 · Graphs).

import py from "../../guides/python/neetcode/rotting_oranges.py?raw";
import { row, rngFor } from "../helpers";
import type { PatternProblem, PatternStep } from "../types";
import { around, cells, key } from "./grid";

/** 0 = empty, 1 = fresh, 2 = rotten. */
type Input = number[][];

const SHOW = ["", "🍊", "🟫"];

function run(input: Input): PatternStep[] {
  const g = input.map((r) => [...r]);
  const R = g.length;
  const C = g[0].length;
  const steps: PatternStep[] = [];
  let q: [number, number][] = [];
  let justRotted = new Set<string>();
  let minute = 0;
  let fresh = 0;
  let ops = 0;
  for (let r = 0; r < R; r++)
    for (let c = 0; c < C; c++) {
      if (g[r][c] === 1) fresh++;
      if (g[r][c] === 2) q.push([r, c]);
    }
  const snap = (stage: string, explanation: string, extra: Partial<PatternStep> = {}) =>
    steps.push({
      stage,
      explanation,
      rows: [row("queue: rotten oranges that spread next minute", q.map(([r, c]) => `(${r},${c})`))],
      grid: {
        title: "🍊 fresh, 🟫 rotten",
        cells: cells(
          g,
          (v) => SHOW[v],
          (r, c) => (justRotted.has(key(r, c)) ? "swap" : q.some(([y, x]) => y === r && x === c) ? "compare" : g[r][c] === 0 ? "idle" : undefined),
        ),
      },
      vars: [
        { name: "minute", value: String(minute), tone: "found" },
        { name: "fresh left", value: String(fresh) },
      ],
      ops,
      ...extra,
    });
  snap("start", `Every rotten orange spreads at the same time, so start a BFS from all of them at once (${q.length} in the queue). Each round of the BFS is one minute. ${fresh} fresh orange${fresh === 1 ? "" : "s"} to go.`);
  while (q.length && fresh > 0) {
    const next: [number, number][] = [];
    justRotted = new Set();
    for (const [r, c] of q)
      for (const [y, x] of around(r, c, R, C)) {
        ops++;
        if (g[y][x] !== 1) continue;
        g[y][x] = 2;
        fresh--;
        next.push([y, x]);
        justRotted.add(key(y, x));
      }
    minute++;
    q = next;
    snap("minute", `Minute ${minute}: every orange in the queue rots its fresh neighbours. ${next.length} orange${next.length === 1 ? "" : "s"} turn rotten and will spread next minute. Fresh left: ${fresh}.`);
  }
  justRotted = new Set();
  const ans = fresh === 0 ? minute : -1;
  snap("done", fresh === 0 ? `No fresh oranges are left after ${minute} minute${minute === 1 ? "" : "s"}.` : `The rot can't spread any further, but ${fresh} fresh orange${fresh === 1 ? " is" : "s are"} out of reach. Return −1.`, { done: true, answer: String(ans) });
  return steps;
}

/** The slow way: each minute, scan the whole grid for fresh oranges next to rotten ones. */
function slow(input: Input) {
  const g = input.map((r) => [...r]);
  const R = g.length;
  const C = g[0].length;
  let ops = 0;
  let minute = 0;
  for (;;) {
    const rot: [number, number][] = [];
    for (let r = 0; r < R; r++)
      for (let c = 0; c < C; c++) {
        ops++;
        if (g[r][c] === 1 && around(r, c, R, C).some(([y, x]) => g[y][x] === 2)) rot.push([r, c]);
      }
    if (!rot.length) break;
    for (const [r, c] of rot) g[r][c] = 2;
    minute++;
  }
  return { answer: g.flat().includes(1) ? -1 : minute, ops };
}

export const rottingOranges: PatternProblem<Input> = {
  id: "rotting-oranges",
  title: "Rotting Oranges",
  difficulty: "Medium",
  blind75: false,
  slug: "rotting-oranges",
  video: "y704fEOx0s0",
  statement: "In a grid, 0 is empty, 1 a fresh orange and 2 a rotten one. Every minute, fresh oranges next to a rotten one (up, down, left, right) rot. Return the minutes until none are fresh, or −1 if some never rot.",
  examples: [
    { label: "LeetCode's example 1", input: [[2, 1, 1], [1, 1, 0], [0, 1, 1]] },
    { label: "LeetCode's example 2 (−1)", input: [[2, 1, 1], [0, 1, 1], [1, 0, 1]] },
    { label: "two sources", input: [[2, 1, 1, 1, 2], [1, 0, 1, 0, 1]] },
  ],
  random: (seed) => {
    const g = rngFor(seed);
    const R = g.int(2, 4);
    const C = g.int(2, 5);
    return Array.from({ length: R }, () => Array.from({ length: C }, () => g.pick([0, 1, 1, 1, 2])));
  },
  big: { label: "a 20×20 orchard rotting from one corner", input: () => Array.from({ length: 20 }, (_, r) => Array.from({ length: 20 }, (_, c) => (r === 0 && c === 0 ? 2 : 1))) },
  describe: (g) => `grid = [${g.map((r) => `[${r.join(",")}]`).join(", ")}]`,
  run,
  solve: (g) => slow(g).answer,
  brute: slow,
  bruteIdea: "Simulate minute by minute, scanning the whole grid each minute for fresh oranges beside rotten ones: O(rows × cols) per minute, and it can take O(rows × cols) minutes.",
  guide: {
    title: "Rotting Oranges",
    idea: [
      "All rotten oranges spread at once, so put all of them in the queue at the start: a multi-source BFS. Process the queue one level at a time; each level is one minute.",
      "Count the fresh oranges first and decrease the count as they rot. When the queue runs dry, either the count is 0 (return the minutes) or some oranges were never reachable (return −1).",
    ],
    whenToUse: ["“How long until everything is reached” from several starting points: multi-source BFS, level by level.", "Shortest distance from the nearest of many sources (see Walls and Gates)."],
    stages: [
      { id: "start", title: "Queue every rotten orange; count the fresh", detail: "", pseudo: "q = deque(all rotten); fresh = count of 1s" },
      { id: "minute", title: "One BFS level = one minute", detail: "", pseudo: "for _ in range(len(q)): r, c = q.popleft(); rot fresh neighbours; q.append(...)" },
      { id: "done", title: "No fresh left, or stuck", detail: "", pseudo: "return time if fresh == 0 else -1" },
    ],
    legend: [
      { tone: "compare", label: "In the queue: spreads next" },
      { tone: "swap", label: "Rotted this minute" },
      { tone: "idle", label: "Empty cell" },
    ],
    complexity: { time: "O(rows × cols)", space: "O(rows × cols)", why: "Each orange enters the queue at most once." },
    pitfalls: ["Starting a BFS from each rotten orange separately gets the timing wrong: they spread simultaneously.", "No fresh oranges at the start means the answer is 0, even with no rotten ones."],
    tryThis: ["In “two sources”, the rot spreads from both ends and meets in the middle.", "In example 2, the orange at the bottom-left is cut off by empty cells."],
    python: py,
  },
};
