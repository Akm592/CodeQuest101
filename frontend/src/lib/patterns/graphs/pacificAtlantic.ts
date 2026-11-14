// Pacific Atlantic Water Flow (NeetCode 150 · Graphs).

import py from "../../guides/python/neetcode/pacific_atlantic.py?raw";
import { rngFor } from "../helpers";
import type { PatternProblem, PatternStep } from "../types";
import { around, cells, key } from "./grid";

type Input = number[][];

const showCells = (cs: [number, number][]) => `[${cs.map(([r, c]) => `[${r},${c}]`).join(", ")}]`;

function run(h: Input): PatternStep[] {
  const R = h.length;
  const C = h[0].length;
  const steps: PatternStep[] = [];
  const pac = new Set<string>();
  const atl = new Set<string>();
  let cur: [number, number] | null = null;
  let ops = 0;
  let phase: "pac" | "atl" | "both" = "pac";
  const snap = (stage: string, explanation: string, extra: Partial<PatternStep> = {}) =>
    steps.push({
      stage,
      explanation,
      rows: [],
      grid: {
        title: "heights (Pacific: top and left edges; Atlantic: bottom and right)",
        cells: cells(
          h,
          (v) => String(v),
          (r, c) => {
            const k = key(r, c);
            if (cur && cur[0] === r && cur[1] === c) return "current";
            if (pac.has(k) && atl.has(k)) return phase === "both" || phase === "atl" ? "found" : "pointer";
            if (pac.has(k)) return "pointer";
            if (atl.has(k)) return "visited";
            return undefined;
          },
          (r, c) => (pac.has(key(r, c)) && atl.has(key(r, c)) ? "PA" : pac.has(key(r, c)) ? "P" : atl.has(key(r, c)) ? "A" : undefined),
        ),
      },
      vars: [
        { name: "reach the Pacific", value: String(pac.size) },
        { name: "reach the Atlantic", value: String(atl.size) },
        { name: "reach both", value: String([...pac].filter((k) => atl.has(k)).length), tone: "found" },
      ],
      ops,
      ...extra,
    });
  snap("start", "Water flows from a cell to a neighbour that's no higher. Instead of testing every cell, work backwards from each ocean: start at the cells touching it and climb to neighbours that are at least as high. Everything you reach can drain into that ocean.");
  const dfs = (r: number, c: number, seen: Set<string>, prev: number, ocean: string) => {
    ops++;
    if (r < 0 || c < 0 || r >= R || c >= C || seen.has(key(r, c)) || h[r][c] < prev) return;
    seen.add(key(r, c));
    cur = [r, c];
    snap(ocean === "Pacific" ? "pacific" : "atlantic", prev < 0 ? `(${r},${c}) touches the ${ocean}: water here drains straight into it.` : `Climb to (${r},${c}), height ${h[r][c]} ≥ ${prev}: water here can flow down the way we came and reach the ${ocean}.`);
    for (const [y, x] of around(r, c, R, C)) dfs(y, x, seen, h[r][c], ocean);
  };
  for (let c = 0; c < C; c++) dfs(0, c, pac, -1, "Pacific");
  for (let r = 0; r < R; r++) dfs(r, 0, pac, -1, "Pacific");
  cur = null;
  phase = "atl";
  snap("switch", `Every cell that can reach the Pacific is marked P (${pac.size} cells). Now do the same from the Atlantic edges.`);
  for (let c = 0; c < C; c++) dfs(R - 1, c, atl, -1, "Atlantic");
  for (let r = 0; r < R; r++) dfs(r, C - 1, atl, -1, "Atlantic");
  cur = null;
  phase = "both";
  const both: [number, number][] = [];
  for (let r = 0; r < R; r++) for (let c = 0; c < C; c++) if (pac.has(key(r, c)) && atl.has(key(r, c))) both.push([r, c]);
  snap("done", `Cells marked both P and A drain into both oceans: ${both.length} of them.`, { done: true, answer: showCells(both) });
  return steps;
}

/** The slow way: from every cell, search downhill to see which oceans it reaches. */
function slow(h: Input) {
  const R = h.length;
  const C = h[0].length;
  let ops = 0;
  const out: [number, number][] = [];
  for (let r = 0; r < R; r++)
    for (let c = 0; c < C; c++) {
      const seen = new Set<string>([key(r, c)]);
      const stack: [number, number][] = [[r, c]];
      let p = false;
      let a = false;
      while (stack.length) {
        const [y, x] = stack.pop()!;
        ops++;
        if (y === 0 || x === 0) p = true;
        if (y === R - 1 || x === C - 1) a = true;
        for (const [ny, nx] of around(y, x, R, C))
          if (!seen.has(key(ny, nx)) && h[ny][nx] <= h[y][x]) {
            seen.add(key(ny, nx));
            stack.push([ny, nx]);
          }
      }
      if (p && a) out.push([r, c]);
    }
  return { answer: showCells(out), ops };
}

export const pacificAtlantic: PatternProblem<Input> = {
  id: "pacific-atlantic",
  title: "Pacific Atlantic Water Flow",
  difficulty: "Medium",
  blind75: true,
  slug: "pacific-atlantic-water-flow",
  video: "s-VkcjHqkGI",
  statement: "An island's heights are given as a grid. The Pacific touches the top and left edges, the Atlantic the bottom and right. Rain flows to a neighbour of equal or lower height. Return every cell from which water can reach both oceans.",
  examples: [
    { label: "LeetCode's example", input: [[1, 2, 2, 3, 5], [3, 2, 3, 4, 4], [2, 4, 5, 3, 1], [6, 7, 1, 4, 5], [5, 1, 1, 2, 4]] },
    { label: "a ridge", input: [[1, 2, 1], [2, 3, 2], [1, 2, 1]] },
  ],
  random: (seed) => {
    const g = rngFor(seed);
    const R = g.int(2, 4);
    const C = g.int(2, 4);
    return Array.from({ length: R }, () => Array.from({ length: C }, () => g.int(1, 5)));
  },
  big: { label: "12×12 heights", input: () => Array.from({ length: 12 }, (_, r) => Array.from({ length: 12 }, (_, c) => ((r * 7 + c * 5 + r * c) % 9) + 1)) },
  describe: (h) => `heights = [${h.map((r) => `[${r.join(",")}]`).join(", ")}]`,
  run,
  solve: (h) => slow(h).answer,
  brute: slow,
  bruteIdea: "From every cell, search downhill to see which oceans its water reaches: one search per cell, so O((rows × cols)²).",
  guide: {
    title: "Pacific Atlantic Water Flow",
    idea: [
      "Asking “where does this cell's water go?” for every cell repeats the same searches. Flip it: start at the ocean and ask “which cells can drain here?”. Going backwards, water can come from a neighbour that's at least as high.",
      "Run a DFS from every Pacific edge cell, climbing to neighbours with height ≥ the current one; mark them. Do the same from the Atlantic edges. Cells marked by both searches are the answer. Each search visits a cell at most once.",
    ],
    whenToUse: ["“Which cells can reach the border / a target?”: search backwards from the target instead of forwards from every cell.", "Multi-source search: start from many cells at once."],
    stages: [
      { id: "start", title: "Search back from each ocean", detail: "", pseudo: "pac, atl = set(), set()" },
      { id: "pacific", title: "From the Pacific edges, climb", detail: "Neighbours at least as high.", pseudo: "for c in range(cols): dfs(0, c, pac, heights[0][c])" },
      { id: "switch", title: "Now from the Atlantic edges", detail: "", pseudo: "for c in range(cols): dfs(rows - 1, c, atl, ...)" },
      { id: "atlantic", title: "From the Atlantic edges, climb", detail: "", pseudo: "if (r, c) in visit or heights[r][c] < prev: return" },
      { id: "done", title: "Cells in both sets", detail: "", pseudo: "return [[r, c] for (r, c) in pac & atl]" },
    ],
    legend: [
      { tone: "current", label: "Cell just reached" },
      { tone: "pointer", label: "P: drains to the Pacific" },
      { tone: "visited", label: "A: drains to the Atlantic" },
      { tone: "found", label: "PA: both" },
    ],
    complexity: { time: "O(rows × cols)", space: "O(rows × cols)", why: "Two searches, each visiting every cell at most once." },
    pitfalls: ["Going backwards the rule flips: move to a neighbour that is higher or equal, not lower.", "Corner cells touch both oceans (top-right and bottom-left)."],
    tryThis: ["In “a ridge”, the middle 3 drains both ways, so it's in the answer; the corners (0,0) and (2,2) only reach one ocean each.", "In LeetCode's example, (2,2) with height 5 is in the middle but reaches both."],
    python: py,
  },
};
