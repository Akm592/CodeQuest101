// The other 2-D DP problems of the NeetCode 150: Best Time to Buy and Sell
// Stock with Cooldown, Coin Change II, Target Sum, Longest Increasing Path in
// a Matrix and Burst Balloons.

import burstPy from "../../guides/python/neetcode/burst_balloons.py?raw";
import coin2Py from "../../guides/python/neetcode/coin_change_ii.py?raw";
import lipPy from "../../guides/python/neetcode/longest_increasing_path.py?raw";
import stockPy from "../../guides/python/neetcode/stock_cooldown.py?raw";
import targetPy from "../../guides/python/neetcode/target_sum.py?raw";
import { around } from "../graphs/grid";
import { row, rngFor, show } from "../helpers";
import type { PatternProblem, PatternStep } from "../types";
import { type Cell, blank, counted, table } from "./table";

// ---------------------------------------------------------------- Stock with cooldown

function stockRun(prices: number[]): PatternStep[] {
  const n = prices.length;
  const steps: PatternStep[] = [];
  // dp[0][i]: best from day i on when free to buy; dp[1][i]: best from day i on while holding.
  const dp = blank<number>(2, n + 2, null);
  dp[0][n] = dp[1][n] = dp[0][n + 1] = dp[1][n + 1] = 0;
  let ops = 0;
  const snap = (stage: string, explanation: string, cur: Cell | null, reads: Cell[] = [], extra: Partial<PatternStep> = {}) =>
    steps.push({
      stage,
      explanation,
      rows: [row("prices", prices, cur && cur[1] < n ? { [cur[1]]: "current" } : {})],
      grid: table("best profit from day i on (rows: free to buy / holding; past the end = 0)", dp, { rowHead: ["buy", "hold"], colHead: [...prices.map((_, i) => `d${i}`), "end", "end+1"], cur, reads, good: extra.done ? [[0, 0]] : [] }),
      vars: [],
      ops,
      ...extra,
    });
  snap("start", "Two states each day: free to buy, or holding a share. Work backwards from the last day. Free: buy today (pay the price, then you're holding tomorrow) or wait. Holding: sell today (get the price, but tomorrow is a cooldown, so you're free again the day after) or wait.", null);
  for (let i = n - 1; i >= 0; i--) {
    ops++;
    const buy = -prices[i] + dp[1][i + 1]!;
    const waitFree = dp[0][i + 1]!;
    dp[0][i] = Math.max(buy, waitFree);
    snap("buy", `Day ${i}, free: buy at ${prices[i]} (−${prices[i]} + holding on day ${i + 1}: ${dp[1][i + 1]}) = ${buy}, or wait (${waitFree}). Best ${dp[0][i]}.`, [0, i], [[1, i + 1], [0, i + 1]]);
    ops++;
    const sell = prices[i] + dp[0][i + 2]!;
    const waitHold = dp[1][i + 1]!;
    dp[1][i] = Math.max(sell, waitHold);
    snap("sell", `Day ${i}, holding: sell at ${prices[i]} (+${prices[i]}, cooldown tomorrow, free again on day ${i + 2}: ${dp[0][i + 2]}) = ${sell}, or keep holding (${waitHold}). Best ${dp[1][i]}.`, [1, i], [[0, i + 2], [1, i + 1]]);
  }
  snap("done", `You start on day 0 free to buy: the best total profit is ${dp[0][0]}.`, null, [], { done: true, answer: String(dp[0][0]) });
  return steps;
}
const stockSlow = counted((self: (p: number[], i: number, buying: boolean) => number, p: number[], i: number, buying: boolean): number => {
  if (i >= p.length) return 0;
  const wait = self(p, i + 1, buying);
  return buying ? Math.max(wait, -p[i] + self(p, i + 1, false)) : Math.max(wait, p[i] + self(p, i + 2, true));
});

export const stockCooldown: PatternProblem<number[]> = {
  id: "stock-cooldown",
  title: "Best Time to Buy and Sell Stock with Cooldown",
  difficulty: "Medium",
  blind75: false,
  slug: "best-time-to-buy-and-sell-stock-with-cooldown",
  video: "I7j0F7AHpb8",
  statement: "Given daily prices, find the most profit from as many buy/sell trades as you like, holding at most one share at a time, with a one-day cooldown after each sale (no buying the next day).",
  examples: [
    { label: "LeetCode's example 1", input: [1, 2, 3, 0, 2] },
    { label: "cooldown matters", input: [1, 4, 2, 7] },
    { label: "one day", input: [1] },
  ],
  random: (seed) => {
    const g = rngFor(seed);
    return Array.from({ length: g.int(1, 7) }, () => g.int(0, 9));
  },
  big: { label: "20 days", input: () => Array.from({ length: 20 }, (_, i) => (i * 7) % 11) },
  describe: (p) => `prices = ${show(p)}`,
  run: stockRun,
  solve: (p) => stockSlow(p, 0, true).answer,
  brute: (p) => stockSlow(p, 0, true),
  bruteIdea: "Recursion with no memory over (day, holding or not): each day branches into “act” and “wait”, so the same days are re-solved again and again.",
  guide: {
    title: "Best Time to Buy and Sell Stock with Cooldown",
    idea: [
      "The state is the day and whether you hold a share. Free to buy: buy (−price, holding tomorrow) or wait. Holding: sell (+price, and because of the cooldown you're free to buy only the day after tomorrow) or wait.",
      "That's a 2 × n table filled from the last day back; the answer is “free to buy on day 0”. NeetCode writes it as a memoised dfs(i, buying).",
    ],
    whenToUse: ["Stock problems with rules (cooldowns, fees, a limit on trades): a state machine, one dp row per state.", "Each action moves you to a state on a later day."],
    stages: [
      { id: "start", title: "States: free to buy, holding", detail: "", pseudo: "dp = {}  # (i, buying) -> max profit" },
      { id: "buy", title: "Free: buy or wait", detail: "", pseudo: "buy = dfs(i + 1, not buying) - prices[i]; cooldown = dfs(i + 1, buying)" },
      { id: "sell", title: "Holding: sell (skip a day) or wait", detail: "", pseudo: "sell = dfs(i + 2, not buying) + prices[i]" },
      { id: "done", title: "Free on day 0", detail: "", pseudo: "return dfs(0, True)" },
    ],
    legend: [
      { tone: "current", label: "State being filled" },
      { tone: "compare", label: "States it chooses between" },
      { tone: "pointer", label: "Days and states" },
    ],
    complexity: { time: "O(n)", space: "O(n)", why: "Two states per day, each O(1)." },
    pitfalls: ["After selling on day i you can buy again on day i + 2, not i + 1.", "Past the last day, every state is worth 0."],
    tryThis: ["LeetCode's example 1: buy, sell, cooldown, buy, sell = 3.", "In “cooldown matters”, selling at 4 forces skipping 2, so buying at 1 and selling at 7 (6) wins."],
    python: stockPy,
  },
};

// ---------------------------------------------------------------- Coin change II

type Coins = { coins: number[]; amount: number };

function coin2Run({ coins, amount }: Coins): PatternStep[] {
  const steps: PatternStep[] = [];
  const k = coins.length;
  // dp[i][a] = ways to make a using coins[i:] (row k: no coins left).
  const dp = blank<number>(k + 1, amount + 1);
  let ops = 0;
  const snap = (stage: string, explanation: string, cur: Cell | null, reads: Cell[] = [], extra: Partial<PatternStep> = {}) =>
    steps.push({
      stage,
      explanation,
      rows: [],
      grid: table("ways[i][a] = ways to make amount a using coins i and after", dp, { rowHead: [...coins.map(String), "none"], colHead: Array.from({ length: amount + 1 }, (_, a) => String(a)), cur, reads, good: extra.done ? [[0, amount]] : [] }),
      vars: [],
      ops,
      ...extra,
    });
  for (let a = 0; a <= amount; a++) dp[k][a] = a === 0 ? 1 : 0;
  snap("start", "Count combinations, not orders: decide coin by coin. ways[i][a] uses only coins i, i + 1, …: either skip coin i entirely (the row below), or use it once more and stay on it (a − coins[i] in the same row). With no coins left, only amount 0 can be made.", null);
  for (let i = k - 1; i >= 0; i--)
    for (let a = 0; a <= amount; a++) {
      ops++;
      const skip = dp[i + 1][a]!;
      const use = a >= coins[i] ? dp[i][a - coins[i]]! : 0;
      dp[i][a] = skip + use;
      snap("fill", a >= coins[i] ? `Amount ${a} with coins from ${coins[i]} on: skip ${coins[i]} (${skip}) + use one ${coins[i]} and make ${a - coins[i]} (${use}) = ${dp[i][a]}.` : `Amount ${a} is less than ${coins[i]}: only skipping works, ${skip}.`, [i, a], a >= coins[i] ? [[i + 1, a], [i, a - coins[i]]] : [[i + 1, a]]);
    }
  snap("done", `There ${dp[0][amount] === 1 ? "is 1 way" : `are ${dp[0][amount]} ways`} to make ${amount}.`, null, [], { done: true, answer: String(dp[0][amount]) });
  return steps;
}
const coin2Slow = counted((self: (c: number[], i: number, a: number) => number, c: number[], i: number, a: number): number => {
  if (a === 0) return 1;
  if (i === c.length || a < 0) return 0;
  return self(c, i + 1, a) + self(c, i, a - c[i]);
});

export const coinChange2: PatternProblem<Coins> = {
  id: "coin-change-ii",
  title: "Coin Change II",
  difficulty: "Medium",
  blind75: false,
  slug: "coin-change-ii",
  video: "Mjy4hd2xgrs",
  statement: "Given coin values (unlimited of each) and an amount, return how many different combinations of coins make the amount. Order doesn't matter.",
  examples: [
    { label: "LeetCode's example 1", input: { coins: [1, 2, 5], amount: 5 } },
    { label: "impossible", input: { coins: [2], amount: 3 } },
    { label: "[2, 3], amount 7", input: { coins: [2, 3], amount: 7 } },
  ],
  random: (seed) => {
    const g = rngFor(seed);
    return { coins: g.shuffle([1, 2, 3, 4, 5]).slice(0, g.int(1, 3)).sort((a, b) => a - b), amount: g.int(0, 8) };
  },
  big: { label: "coins [1, 2, 3], amount 40", input: () => ({ coins: [1, 2, 3], amount: 40 }) },
  describe: ({ coins, amount }) => `amount = ${amount}, coins = ${show(coins)}`,
  run: coin2Run,
  solve: ({ coins, amount }) => coin2Slow(coins, 0, amount).answer,
  brute: ({ coins, amount }) => coin2Slow(coins, 0, amount),
  bruteIdea: "Recursion with no memory: use the current coin again or move to the next. It visits every combination one by one, plus every dead end.",
  guide: {
    title: "Coin Change II",
    idea: [
      "To count combinations (not orders), fix an order on the coins and decide them one at a time. With coins i, i + 1, … available: either never use coin i (move to i + 1) or use it once more (stay at i, amount goes down).",
      "ways[i][a] = ways[i + 1][a] + ways[i][a − coins[i]]. The bottom row (no coins) is 1 for amount 0 and 0 elsewhere. NeetCode also shows the one-row version.",
    ],
    whenToUse: ["Counting combinations with unlimited items: unbounded knapsack, items in a fixed order so each combination is counted once.", "If order mattered (sequences), loop over amounts outside and coins inside instead."],
    stages: [
      { id: "start", title: "No coins: only amount 0", detail: "", pseudo: "dp[len(coins)][0] = 1" },
      { id: "fill", title: "Skip this coin + use it once more", detail: "", pseudo: "dp[i][a] = dp[i + 1][a] + (dp[i][a - coins[i]] if a >= coins[i] else 0)" },
      { id: "done", title: "ways[0][amount]", detail: "", pseudo: "return dp[0][amount]" },
    ],
    legend: [
      { tone: "current", label: "Cell being filled" },
      { tone: "compare", label: "Cells it adds" },
      { tone: "found", label: "The answer" },
    ],
    complexity: { time: "O(coins × amount)", space: "O(coins × amount)", why: "One cell per (coin, amount); the one-row version uses O(amount)." },
    pitfalls: ["Looping amounts outside and coins inside counts orders (1+2 and 2+1 twice).", "Amount 0 has exactly 1 way: use no coins."],
    tryThis: ["LeetCode's example 1: 5 = 5 = 2+2+1 = 2+1+1+1 = 1+1+1+1+1: 4 ways.", "[2, 3] makes 7 one way: 2 + 2 + 3."],
    python: coin2Py,
  },
};

// ---------------------------------------------------------------- Target sum

type Target = { nums: number[]; target: number };

function targetRun({ nums, target }: Target): PatternStep[] {
  const steps: PatternStep[] = [];
  const n = nums.length;
  const S = nums.reduce((a, b) => a + b, 0);
  const sums = Array.from({ length: 2 * S + 1 }, (_, k) => k - S);
  // dp[i][s] = ways to reach total s using the first i numbers.
  const dp = blank<number>(n + 1, 2 * S + 1);
  dp[0][S] = 1;
  let ops = 0;
  const snap = (stage: string, explanation: string, cur: Cell | null, reads: Cell[] = [], extra: Partial<PatternStep> = {}) =>
    steps.push({
      stage,
      explanation,
      rows: [row("nums", nums, cur && cur[0] >= 1 ? { [cur[0] - 1]: "current" } : {})],
      grid: table("ways[i][s] = ways to reach total s with the first i numbers (blank = 0)", dp, { rowHead: ["none", ...nums.map((v) => `±${v}`)], colHead: sums.map(String), cur, reads, good: extra.done && Math.abs(target) <= S ? [[n, target + S]] : [], show: (v) => (v ? String(v) : "") }),
      vars: [{ name: "target", value: String(target), tone: "found" }],
      ops,
      ...extra,
    });
  snap("start", `Each number gets a + or a −. Track, after each number, how many sign choices reach each possible total (from −${S} to ${S}). Start with total 0 reached one way.`, [0, S]);
  for (let i = 1; i <= n; i++) {
    const v = nums[i - 1];
    for (let k = 0; k < 2 * S + 1; k++) {
      ops++;
      const from = dp[i - 1][k];
      if (!from) continue;
      for (const k2 of [k + v, k - v]) dp[i][k2] = (dp[i][k2] ?? 0) + from;
    }
    const hit: Cell[] = [];
    for (let k = 0; k < 2 * S + 1; k++) if (dp[i][k]) hit.push([i, k]);
    snap("fill", `Number ${i} of ${n} (${v}): every total reached so far goes ${v} up (+${v}) and ${v} down (−${v}). Now ${hit.length} total${hit.length === 1 ? " is" : "s are"} reachable.`, null, hit);
  }
  const ans = Math.abs(target) <= S ? dp[n][target + S] ?? 0 : 0;
  snap("done", `${ans} sign choice${ans === 1 ? "" : "s"} make${ans === 1 ? "s" : ""} ${target}.`, null, [], { done: true, answer: String(ans) });
  return steps;
}
const targetSlow = counted((self: (n: number[], i: number, t: number) => number, n: number[], i: number, t: number): number => (i === n.length ? (t === 0 ? 1 : 0) : self(n, i + 1, t - n[i]) + self(n, i + 1, t + n[i])));

export const targetSum: PatternProblem<Target> = {
  id: "target-sum",
  title: "Target Sum",
  difficulty: "Medium",
  blind75: false,
  slug: "target-sum",
  video: "g0npyaQtAQM",
  statement: "Put a + or − in front of every number in nums. In how many ways does the expression equal target?",
  examples: [
    { label: "LeetCode's example 1", input: { nums: [1, 1, 1, 1, 1], target: 3 } },
    { label: "[2, 1, 1], target 2", input: { nums: [2, 1, 1], target: 2 } },
    { label: "target out of reach", input: { nums: [1, 2], target: 4 } },
  ],
  random: (seed) => {
    const g = rngFor(seed);
    const nums = Array.from({ length: g.int(1, 4) }, () => g.int(0, 3));
    return { nums, target: g.int(-3, 3) };
  },
  big: { label: "eighteen 1s, target 2", input: () => ({ nums: Array(18).fill(1), target: 2 }) },
  describe: ({ nums, target }) => `nums = ${show(nums)}, target = ${target}`,
  run: targetRun,
  solve: ({ nums, target }) => targetSlow(nums, 0, target).answer,
  brute: ({ nums, target }) => targetSlow(nums, 0, target),
  bruteIdea: "Try every assignment of signs: 2^n of them.",
  guide: {
    title: "Target Sum",
    idea: [
      "Many sign choices reach the same running total, and from then on they behave the same. So instead of tracking choices, track totals: for each prefix of nums, how many ways reach each total.",
      "Each number moves every reachable total up and down by its value. After the last number, read off the count at the target. NeetCode writes it as a memoised dfs(i, total); the table is the same states.",
    ],
    whenToUse: ["Counting sign or choice assignments that hit a sum: DP over (index, running total).", "Equivalently a subset-sum count: the + numbers must add up to (total + target) / 2."],
    stages: [
      { id: "start", title: "Total 0, reached once", detail: "", pseudo: "dp = defaultdict(int); dp[0] = 1" },
      { id: "fill", title: "Each total goes up and down by nums[i]", detail: "", pseudo: "for t, c in dp.items(): next_dp[t + n] += c; next_dp[t - n] += c" },
      { id: "done", title: "Count at the target", detail: "", pseudo: "return dp[target]" },
    ],
    legend: [
      { tone: "compare", label: "Totals reachable after this number" },
      { tone: "current", label: "Start" },
      { tone: "found", label: "The target" },
      { tone: "pointer", label: "Numbers and totals" },
    ],
    complexity: { time: "O(n × sum)", space: "O(sum)", why: "At most 2 × sum + 1 totals per row." },
    pitfalls: ["A 0 in nums doubles the count: +0 and −0 are different choices.", "If |target| > sum, the answer is 0."],
    tryThis: ["LeetCode's example 1: 5 ways (pick which single 1 gets a minus).", "[2, 1, 1], target 2: +2+1−1 and +2−1+1."],
    python: targetPy,
  },
};

// ---------------------------------------------------------------- Longest increasing path

function lipRun(m: number[][]): PatternStep[] {
  const R = m.length;
  const C = m[0].length;
  const steps: PatternStep[] = [];
  const memo = blank<number>(R, C);
  const stack: Cell[] = [];
  let ops = 0;
  const snap = (stage: string, explanation: string, cur: Cell | null, reads: Cell[] = [], extra: Partial<PatternStep> = {}) =>
    steps.push({
      stage,
      explanation,
      rows: [row("DFS stack", stack.map(([r, c]) => `(${r},${c})`))],
      grid: table("matrix (top) and the longest path starting at each cell (bottom)", [...m, ...memo.map((l) => l.map((v) => v))], {
        cur: cur ? [cur[0] + R, cur[1]] : null,
        reads: [...reads.map(([r, c]): Cell => [r + R, c]), ...(cur ? [cur] : [])],
        dim: (r, c) => r < R && !stack.some(([y, x]) => y === r && x === c) && !(cur && cur[0] === r && cur[1] === c),
      }),
      vars: [{ name: "longest so far", value: String(Math.max(0, ...memo.flat().map((v) => v ?? 0))), tone: "found" }],
      ops,
      ...extra,
    });
  snap("start", "From each cell, the longest increasing path is 1 plus the longest path from any bigger neighbour. Compute it by DFS and cache it: each cell's answer never changes, so it's computed once and reused by every neighbour that needs it.", null);
  const dfs = (r: number, c: number): number => {
    ops++;
    if (memo[r][c] !== null) return memo[r][c]!;
    stack.push([r, c]);
    let best = 1;
    const bigger: Cell[] = [];
    for (const [y, x] of around(r, c, R, C)) {
      ops++;
      if (m[y][x] > m[r][c]) {
        bigger.push([y, x]);
        best = Math.max(best, 1 + dfs(y, x));
      }
    }
    stack.pop();
    memo[r][c] = best;
    snap("cache", bigger.length ? `(${r},${c}) = ${m[r][c]}: its bigger neighbours ${bigger.map(([y, x]) => m[y][x]).join(", ")} have paths ${bigger.map(([y, x]) => memo[y][x]).join(", ")}. So 1 + ${best - 1} = ${best}. Cache it.` : `(${r},${c}) = ${m[r][c]}: no bigger neighbour, so the path is just this cell: 1.`, [r, c], bigger);
    return best;
  };
  for (let r = 0; r < R; r++) for (let c = 0; c < C; c++) dfs(r, c);
  const ans = Math.max(...memo.flat().map((v) => v!));
  snap("done", `Every cell is cached. The longest increasing path has ${ans} cells.`, null, [], { done: true, answer: String(ans) });
  return steps;
}
function lipSlow(m: number[][]) {
  const R = m.length;
  const C = m[0].length;
  let ops = 0;
  const go = (r: number, c: number): number => {
    ops++;
    let best = 1;
    for (const [y, x] of around(r, c, R, C)) if (m[y][x] > m[r][c]) best = Math.max(best, 1 + go(y, x));
    return best;
  };
  let ans = 0;
  for (let r = 0; r < R; r++) for (let c = 0; c < C; c++) ans = Math.max(ans, go(r, c));
  return { answer: ans, ops };
}

export const longestIncreasingPath: PatternProblem<number[][]> = {
  id: "longest-increasing-path",
  title: "Longest Increasing Path in a Matrix",
  difficulty: "Hard",
  blind75: false,
  slug: "longest-increasing-path-in-a-matrix",
  video: "wCc_nd-GiEc",
  statement: "Return the length of the longest path in a matrix that moves up, down, left or right and only ever steps to a strictly bigger number.",
  examples: [
    { label: "LeetCode's example 1", input: [[9, 9, 4], [6, 6, 8], [2, 1, 1]] },
    { label: "LeetCode's example 2", input: [[3, 4, 5], [3, 2, 6], [2, 2, 1]] },
    { label: "a spiral", input: [[1, 2, 3], [8, 9, 4], [7, 6, 5]] },
  ],
  random: (seed) => {
    const g = rngFor(seed);
    const R = g.int(1, 3);
    const C = g.int(1, 4);
    return Array.from({ length: R }, () => Array.from({ length: C }, () => g.int(0, 9)));
  },
  big: { label: "a 6×6 grid of rising diagonals", input: () => Array.from({ length: 6 }, (_, r) => Array.from({ length: 6 }, (_, c) => r + c)) },
  describe: (m) => `matrix = [${m.map((r) => `[${r.join(",")}]`).join(", ")}]`,
  run: lipRun,
  solve: (m) => lipSlow(m).answer,
  brute: lipSlow,
  bruteIdea: "DFS from every cell with no cache: on a grid that rises along diagonals, the number of increasing paths explodes, and each is walked separately.",
  guide: {
    title: "Longest Increasing Path in a Matrix",
    idea: [
      "Strictly increasing steps can never loop back, so the longest path from a cell depends only on its bigger neighbours: lip(cell) = 1 + max lip(bigger neighbour), or 1 if there are none.",
      "DFS from every cell with a cache. Each cell's value is computed once; later DFS calls that reach it return the cached value straight away. That's O(rows × cols).",
    ],
    whenToUse: ["Longest path in a grid or DAG: DFS + memo (no visited set needed when moves can't cycle).", "Any recursion on a grid whose answer depends only on the cell."],
    stages: [
      { id: "start", title: "DFS from every cell, with a cache", detail: "", pseudo: "dp = {}  # (r, c) -> LIP" },
      { id: "cache", title: "1 + best bigger neighbour; cache it", detail: "", pseudo: "res = 1; for each bigger neighbour: res = max(res, 1 + dfs(nr, nc)); dp[(r, c)] = res" },
      { id: "done", title: "The largest cached value", detail: "", pseudo: "return max(dp.values())" },
    ],
    legend: [
      { tone: "current", label: "Cell just finished" },
      { tone: "compare", label: "Bigger neighbours it used" },
      { tone: "idle", label: "Matrix cells not on the DFS stack" },
    ],
    complexity: { time: "O(rows × cols)", space: "O(rows × cols)", why: "Each cell is computed once and looks at 4 neighbours." },
    pitfalls: ["Strictly bigger: equal neighbours don't extend the path.", "No visited set is needed: an increasing path can't revisit a cell."],
    tryThis: ["LeetCode's example 1: 1 → 2 → 6 → 9, length 4.", "“A spiral” climbs all 9 cells."],
    python: lipPy,
  },
};

// ---------------------------------------------------------------- Burst balloons

function burstRun(input: number[]): PatternStep[] {
  const a = [1, ...input, 1];
  const n = input.length;
  const steps: PatternStep[] = [];
  // dp[l][r] for 1 ≤ l ≤ r ≤ n: the most coins from bursting balloons l..r, with a[l − 1] and a[r + 1] still there.
  const dp = blank<number>(n, n);
  let ops = 0;
  let span: [number, number] = [-1, -1];
  const snap = (stage: string, explanation: string, cur: Cell | null, reads: Cell[] = [], extra: Partial<PatternStep> = {}) =>
    steps.push({
      stage,
      explanation,
      rows: [row("balloons, with a 1 added at each end", a, Object.fromEntries(a.map((_, i) => [i, i === 0 || i === n + 1 ? "idle" : i >= span[0] && i <= span[1] ? "current" : i === span[0] - 1 || i === span[1] + 1 ? "compare" : undefined])))],
      grid: table("best[l][r] = most coins from bursting balloons l..r (rows: l, columns: r)", dp, { rowHead: input.map((v, i) => `${i + 1}:${v}`), colHead: input.map((v, i) => `${i + 1}:${v}`), cur, reads, good: extra.done ? [[0, n - 1]] : [], dim: (r, c) => c < r }),
      vars: [],
      ops,
      ...extra,
    });
  snap("start", "Instead of the first balloon to burst, pick the last one in a range. If balloon k is last among l..r, its neighbours at that moment are the balloons just outside the range, a[l − 1] and a[r + 1], and the two sides were solved independently before it. Fill ranges from short to long.", null);
  for (let len = 1; len <= n; len++)
    for (let l = 1; l + len - 1 <= n; l++) {
      const r = l + len - 1;
      let best = -1;
      let bestK = l;
      for (let k = l; k <= r; k++) {
        ops++;
        const v = a[l - 1] * a[k] * a[r + 1] + (k > l ? dp[l - 1][k - 2]! : 0) + (k < r ? dp[k][r - 1]! : 0);
        if (v > best) {
          best = v;
          bestK = k;
        }
      }
      dp[l - 1][r - 1] = best;
      span = [l, r];
      const left = bestK > l ? dp[l - 1][bestK - 2]! : 0;
      const right = bestK < r ? dp[bestK][r - 1]! : 0;
      snap(
        "fill",
        `Balloons ${l}..${r}: the best one to burst last is ${bestK} (${a[bestK]}), earning ${a[l - 1]} × ${a[bestK]} × ${a[r + 1]} = ${a[l - 1] * a[bestK] * a[r + 1]}${bestK > l ? ` + left ${left}` : ""}${bestK < r ? ` + right ${right}` : ""} = ${best}.`,
        [l - 1, r - 1],
        [...(bestK > l ? [[l - 1, bestK - 2] as Cell] : []), ...(bestK < r ? [[bestK, r - 1] as Cell] : [])],
      );
    }
  span = [-1, -1];
  snap("done", `Bursting all ${n} balloons in the best order earns ${dp[0][n - 1]} coins.`, null, [], { done: true, answer: String(dp[0][n - 1]) });
  return steps;
}
function burstSlow(nums: number[]) {
  let ops = 0;
  const go = (b: number[]): number => {
    ops++;
    let best = 0;
    for (let i = 0; i < b.length; i++) best = Math.max(best, (b[i - 1] ?? 1) * b[i] * (b[i + 1] ?? 1) + go([...b.slice(0, i), ...b.slice(i + 1)]));
    return best;
  };
  return { answer: go(nums), ops };
}

export const burstBalloons: PatternProblem<number[]> = {
  id: "burst-balloons",
  title: "Burst Balloons",
  difficulty: "Hard",
  blind75: false,
  slug: "burst-balloons",
  video: "VFskby7lUbw",
  statement: "Bursting balloon i earns left × i × right coins, using the balloons currently next to it (or 1 past either end); then it's gone. Return the most coins from bursting them all.",
  examples: [
    { label: "LeetCode's example 1", input: [3, 1, 5, 8] },
    { label: "LeetCode's example 2", input: [1, 5] },
    { label: "[2, 4, 3]", input: [2, 4, 3] },
  ],
  random: (seed) => {
    const g = rngFor(seed);
    return Array.from({ length: g.int(1, 5) }, () => g.int(1, 9));
  },
  big: { label: "8 balloons", input: () => [3, 1, 5, 8, 2, 7, 4, 6] },
  describe: (b) => `nums = ${show(b)}`,
  run: burstRun,
  solve: (b) => burstSlow(b).answer,
  brute: burstSlow,
  bruteIdea: "Try every order of bursting: n! orders (8! = 40,320), recomputing every intermediate row of balloons.",
  guide: {
    title: "Burst Balloons",
    idea: [
      "Choosing which balloon to burst first is messy: its neighbours change afterwards. Choose the last one instead. If k is the last balloon burst in range l..r, then when it pops, its neighbours are the fixed balloons just outside the range, so it earns a[l − 1] × a[k] × a[r + 1].",
      "Before that, the left part l..k − 1 and right part k + 1..r were burst independently. best[l][r] = max over k of that sum. Pad the array with 1s and fill ranges by length.",
    ],
    whenToUse: ["Interval DP: “do something to a range, then it splits or merges”. Think about the last operation, not the first.", "Matrix chain multiplication and polygon triangulation use the same shape."],
    stages: [
      { id: "start", title: "Pad with 1s; fill short ranges first", detail: "", pseudo: "nums = [1] + nums + [1]" },
      { id: "fill", title: "Try each balloon as the last in l..r", detail: "", pseudo: "for i in range(l, r + 1): coins = nums[l-1] * nums[i] * nums[r+1] + dfs(l, i-1) + dfs(i+1, r)" },
      { id: "done", title: "best[1][n]", detail: "", pseudo: "return dfs(1, len(nums) - 2)" },
    ],
    legend: [
      { tone: "current", label: "Range being filled" },
      { tone: "compare", label: "Its two sides / outside neighbours" },
      { tone: "idle", label: "Not a range (l > r) / padding" },
    ],
    complexity: { time: "O(n³)", space: "O(n²)", why: "n² ranges, each trying up to n last balloons." },
    pitfalls: ["Thinking about the first balloon makes the sides depend on each other; the last one splits them cleanly.", "The padding 1s are never burst."],
    tryThis: ["LeetCode's example 1 earns 167: burst 1, 5, 3, 8 in that order.", "The top-right cell is the whole row of balloons: it's filled last."],
    python: burstPy,
  },
};
