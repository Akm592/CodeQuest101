// Swim in Rising Water (NeetCode 150 · Advanced Graphs).

import py from "../../guides/python/neetcode/swim_rising_water.py?raw";
import { row, rngFor } from "../helpers";
import { Heap } from "../heap/heap";
import { around, cells, key } from "../graphs/grid";
import type { PatternProblem, PatternStep } from "../types";

type Input = number[][];

function run(grid: Input): PatternStep[] {
  const N = grid.length;
  const steps: PatternStep[] = [];
  const heap = new Heap("min");
  const visit = new Set<string>([key(0, 0)]);
  const done = new Set<string>();
  const from = new Map<string, string>();
  let path = new Set<string>();
  let cur: [number, number] | null = null;
  let t = 0;
  let ops = 0;
  const snap = (stage: string, explanation: string, extra: Partial<PatternStep> = {}) => {
    const pq = [...heap.a].sort((a, b) => a.key - b.key).slice(0, 8);
    steps.push({
      stage,
      explanation,
      rows: [row("min-heap: (water level needed, cell), smallest first", pq.map((it) => `(${it.key}, ${it.label})`), pq.length ? { 0: "current" } : {})],
      grid: {
        title: "elevations; you can swim to a cell once the water level is at least its height",
        cells: cells(
          grid,
          (v) => String(v),
          (r, c) => (cur && cur[0] === r && cur[1] === c ? "current" : path.has(key(r, c)) ? "found" : done.has(key(r, c)) ? "visited" : visit.has(key(r, c)) ? "pointer" : grid[r][c] > t ? undefined : "idle"),
        ),
      },
      vars: [{ name: "water level needed so far", value: String(t), tone: "found" }],
      ops: ops + heap.ops,
      ...extra,
    });
  };
  heap.push({ key: grid[0][0], label: "(0,0)", data: [0, 0] });
  snap("start", "The time to cross is the highest cell on the route, so we want the route whose highest cell is lowest. Dijkstra with a twist: the heap holds (the highest cell so far on the way to this cell, cell), and we always expand the lowest.");
  for (;;) {
    const { top } = heap.pop();
    const [r, c] = top.data as [number, number];
    ops++;
    t = top.key;
    cur = [r, c];
    done.add(key(r, c));
    if (r === N - 1 && c === N - 1) {
      for (let k: string | undefined = key(r, c); k; k = from.get(k)) path.add(k);
      cur = null;
      snap("reach", `Pop (${t}, (${r},${c})): the bottom-right corner. The lowest possible highest point on a route is ${t}; the green route gets there.`);
      break;
    }
    const added: string[] = [];
    for (const [y, x] of around(r, c, N, N)) {
      ops++;
      if (visit.has(key(y, x))) continue;
      visit.add(key(y, x));
      from.set(key(y, x), key(r, c));
      const need = Math.max(t, grid[y][x]);
      heap.push({ key: need, label: `(${y},${x})`, data: [y, x] });
      added.push(`(${y},${x}) needs ${need}`);
    }
    snap("expand", `Pop (${t}, (${r},${c})): the lowest water level that reaches a new cell. ${added.length ? `Push its neighbours: ${added.join(", ")} (the higher of ${t} and their height).` : "No unvisited neighbours."}`);
  }
  snap("done", `The answer is ${t}: at time ${t}, the water is high enough to swim the green route.`, { done: true, answer: String(t) });
  path = new Set(path);
  return steps;
}

/** The slow way: try t = 0, 1, 2, … and flood-fill each time to see if the corner is reachable. */
function slow(grid: Input) {
  const N = grid.length;
  let ops = 0;
  for (let t = 0; ; t++) {
    if (grid[0][0] > t) continue;
    const seen = new Set([key(0, 0)]);
    const stack: [number, number][] = [[0, 0]];
    while (stack.length) {
      const [r, c] = stack.pop()!;
      for (const [y, x] of around(r, c, N, N)) {
        ops++;
        if (!seen.has(key(y, x)) && grid[y][x] <= t) {
          seen.add(key(y, x));
          stack.push([y, x]);
        }
      }
    }
    if (seen.has(key(N - 1, N - 1))) return { answer: t, ops };
  }
}

export const swimRisingWater: PatternProblem<Input> = {
  id: "swim-rising-water",
  title: "Swim in Rising Water",
  difficulty: "Hard",
  blind75: false,
  slug: "swim-in-rising-water",
  video: "amvrKlMLuGY",
  statement: "An n×n grid holds distinct elevations 0 … n² − 1. At time t the water is at level t, and you can swim between side-by-side cells whose elevations are both ≤ t. Return the least time to get from the top-left to the bottom-right.",
  examples: [
    { label: "LeetCode's example 2", input: [[0, 1, 2, 3, 4], [24, 23, 22, 21, 5], [12, 13, 14, 15, 16], [11, 17, 18, 19, 20], [10, 9, 8, 7, 6]] },
    { label: "LeetCode's example 1", input: [[0, 2], [1, 3]] },
    { label: "a 3×3 with a wall", input: [[0, 7, 2], [1, 8, 3], [4, 5, 6]] },
  ],
  random: (seed) => {
    const g = rngFor(seed);
    const N = g.int(2, 4);
    const vals = g.shuffle(Array.from({ length: N * N }, (_, i) => i));
    return Array.from({ length: N }, (_, r) => vals.slice(r * N, r * N + N));
  },
  // Heights rise along a snake through the rows, so the water has to rise a long way.
  big: { label: "a 12×12 snake of rising heights", input: () => Array.from({ length: 12 }, (_, r) => Array.from({ length: 12 }, (_, c) => r * 12 + (r % 2 ? 11 - c : c))) },
  describe: (g) => `grid = [${g.map((r) => `[${r.join(",")}]`).join(", ")}]`,
  run,
  solve: (g) => slow(g).answer,
  brute: slow,
  bruteIdea: "Try t = 0, 1, 2, … and flood-fill the cells ≤ t each time, until the corner is reachable: up to n² floods of n² cells each, O(n⁴).",
  guide: {
    title: "Swim in Rising Water",
    idea: [
      "A route's cost is its highest cell, not the sum of its cells. Dijkstra still works with that rule: the heap holds (the highest cell on the best route so far, cell), and popping the smallest always gives a final answer for that cell.",
      "Start with (grid[0][0], top-left). Pop the lowest; push each unvisited neighbour with max(current level, its height). The first time the bottom-right corner is popped, its level is the answer.",
    ],
    whenToUse: ["“Minimise the largest step on a path” (a bottleneck path): Dijkstra with max instead of +.", "Binary search on the answer plus a flood fill also works: O(n² log n)."],
    stages: [
      { id: "start", title: "Heap holds (grid[0][0], top-left)", detail: "", pseudo: "min_h = [[grid[0][0], 0, 0]]; visit = {(0, 0)}" },
      { id: "expand", title: "Pop the lowest; push neighbours with max(t, height)", detail: "", pseudo: "t, r, c = heappop(min_h); heappush(min_h, [max(t, grid[nr][nc]), nr, nc])" },
      { id: "reach", title: "Popped the bottom-right corner", detail: "", pseudo: "if r == N - 1 and c == N - 1: return t" },
      { id: "done", title: "Answer", detail: "", pseudo: "" },
    ],
    legend: [
      { tone: "current", label: "Cell just popped" },
      { tone: "visited", label: "Popped (final)" },
      { tone: "pointer", label: "In the heap" },
      { tone: "found", label: "The route" },
      { tone: "idle", label: "Already under water, not reached" },
    ],
    complexity: { time: "O(n² log n)", space: "O(n²)", why: "n² cells, each pushed and popped once on a heap of up to n² entries." },
    pitfalls: ["Use max, not +: waiting longer doesn't add up along the route.", "The start cell counts too: you can't leave before t = grid[0][0]."],
    tryThis: ["In LeetCode's example 2, the route has to spiral round the outside: the answer is 16.", "In “a 3×3 with a wall”, the route goes down the left side, so the 7 and 8 never matter."],
    python: py,
  },
};
