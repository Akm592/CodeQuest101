// Unique Paths (NeetCode 150 · 2-D Dynamic Programming).

import py from "../../guides/python/neetcode/unique_paths.py?raw";
import { rngFor } from "../helpers";
import type { PatternProblem, PatternStep } from "../types";
import { type Cell, blank, counted, table } from "./table";

type Input = { m: number; n: number };

function run({ m, n }: Input): PatternStep[] {
  const steps: PatternStep[] = [];
  const dp = blank<number>(m, n);
  let ops = 0;
  const snap = (stage: string, explanation: string, cur: Cell | null, reads: Cell[] = [], extra: Partial<PatternStep> = {}) =>
    steps.push({
      stage,
      explanation,
      rows: [],
      grid: table("paths[r][c] = ways from this cell to the bottom-right corner", dp, { cur, reads, good: stage === "done" ? [[0, 0]] : [] }),
      vars: [{ name: "grid", value: `${m} × ${n}` }],
      ops,
      ...extra,
    });
  snap("start", "The robot moves only right or down. From any cell, the paths to the corner are the paths after a step right plus the paths after a step down. Fill the table from the bottom-right corner back to the top-left.", null);
  for (let r = m - 1; r >= 0; r--)
    for (let c = n - 1; c >= 0; c--) {
      ops++;
      if (r === m - 1 || c === n - 1) {
        dp[r][c] = 1;
        snap("edge", r === m - 1 && c === n - 1 ? "The corner itself: 1 path (stay put)." : r === m - 1 ? `Bottom row: the only way is straight right, so 1 path.` : `Right column: the only way is straight down, so 1 path.`, [r, c]);
        continue;
      }
      dp[r][c] = dp[r + 1][c]! + dp[r][c + 1]!;
      snap("fill", `(${r},${c}): right gives ${dp[r][c + 1]}, down gives ${dp[r + 1][c]}, so ${dp[r][c + 1]} + ${dp[r + 1][c]} = ${dp[r][c]} paths.`, [r, c], [[r + 1, c], [r, c + 1]]);
    }
  snap("done", `From the top-left corner there are ${dp[0][0]} paths.`, null, [], { done: true, answer: String(dp[0][0]) });
  return steps;
}

const slowRec = counted((self: (r: number, c: number, m: number, n: number) => number, r: number, c: number, m: number, n: number): number => (r === m - 1 || c === n - 1 ? 1 : self(r + 1, c, m, n) + self(r, c + 1, m, n)));
const slow = ({ m, n }: Input) => slowRec(0, 0, m, n);

export const uniquePaths: PatternProblem<Input> = {
  id: "unique-paths",
  title: "Unique Paths",
  difficulty: "Medium",
  blind75: true,
  slug: "unique-paths",
  video: "IlEsdxuD4lY",
  statement: "A robot starts at the top-left of an m × n grid and moves only right or down. How many different paths reach the bottom-right corner?",
  examples: [
    { label: "3 × 7 (LeetCode)", input: { m: 3, n: 7 } },
    { label: "3 × 2 (LeetCode)", input: { m: 3, n: 2 } },
    { label: "4 × 4", input: { m: 4, n: 4 } },
  ],
  random: (seed) => {
    const g = rngFor(seed);
    return { m: g.int(1, 5), n: g.int(1, 6) };
  },
  big: { label: "10 × 10", input: () => ({ m: 10, n: 10 }) },
  describe: ({ m, n }) => `m = ${m}, n = ${n}`,
  run,
  solve: (input) => slow(input).answer,
  brute: slow,
  bruteIdea: "Recursion with no memory: from each cell, try right and try down. It walks every path one by one, and there are tens of thousands of them on a 10 × 10 grid.",
  guide: {
    title: "Unique Paths",
    idea: [
      "The last move into the corner came from the left or from above, or equally: the first move from a cell goes right or down. So paths(r, c) = paths(r + 1, c) + paths(r, c + 1).",
      "The bottom row and right column have exactly one path each (straight to the corner). Fill the rest from the bottom-right. NeetCode keeps just one row at a time, updating it in place.",
    ],
    whenToUse: ["Counting paths on a grid with moves in two directions: each cell adds its two neighbours.", "The model for most 2-D DP: a table whose entries depend on their neighbours."],
    stages: [
      { id: "start", title: "Fill from the bottom-right", detail: "", pseudo: "row = [1] * n" },
      { id: "edge", title: "Last row / column: 1 path", detail: "", pseudo: "" },
      { id: "fill", title: "Right + down", detail: "", pseudo: "new_row[j] = new_row[j + 1] + row[j]" },
      { id: "done", title: "paths(0, 0)", detail: "", pseudo: "return row[0]" },
    ],
    legend: [
      { tone: "current", label: "Cell being filled" },
      { tone: "compare", label: "The two cells it adds" },
      { tone: "found", label: "The answer" },
    ],
    complexity: { time: "O(m × n)", space: "O(n)", why: "Each cell is one addition; only one row is kept." },
    pitfalls: ["A 1 × n or m × 1 grid has exactly 1 path.", "Counting moves (m − 1 downs, n − 1 rights) gives the same answer as a binomial coefficient."],
    tryThis: ["3 × 7 gives 28.", "Notice the numbers are Pascal's triangle turned on its side."],
    python: py,
  },
};
