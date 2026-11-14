// Cheapest Flights Within K Stops (NeetCode 150 · Advanced Graphs).

import py from "../../guides/python/neetcode/cheapest_flights.py?raw";
import { row, rngFor } from "../helpers";
import type { GEdge, GNode, PatternProblem, PatternStep } from "../types";

/** flights[i] = [from, to, price]; cities are 0..n−1. */
type Input = { n: number; flights: [number, number, number][]; src: number; dst: number; k: number };

const showF = (f: number[][]) => `[${f.map((e) => `[${e.join(",")}]`).join(", ")}]`;
const money = (x: number) => (x === Infinity ? "∞" : String(x));

function run({ n, flights, src, dst, k }: Input): PatternStep[] {
  const steps: PatternStep[] = [];
  let prices = Array<number>(n).fill(Infinity);
  prices[src] = 0;
  let round = 0;
  let tmp: number[] | null = null;
  let hot = -1;
  let changed = new Set<number>();
  let ops = 0;
  const snap = (stage: string, explanation: string, extra: Partial<PatternStep> = {}) => {
    const shown = tmp ?? prices;
    const nodes: GNode[] = Array.from({ length: n }, (_, c) => ({ id: `c${c}`, v: String(c), tone: changed.has(c) ? "compare" : c === dst && shown[c] < Infinity ? "found" : shown[c] < Infinity ? "pointer" : undefined, note: money(shown[c]), tag: c === src ? "src" : c === dst ? "dst" : undefined }));
    const edges: GEdge[] = flights.map(([a, b, p], i) => ({ a: `c${a}`, b: `c${b}`, label: String(p), tone: i === hot ? "compare" : undefined }));
    steps.push({
      stage,
      explanation,
      rows: [
        row(`prices after ${round} flight${round === 1 ? "" : "s"}`, prices.map(money), Object.fromEntries(prices.map((p, c) => [c, c === dst && p < Infinity ? "found" : undefined])), Object.fromEntries(prices.map((_, c) => [c, `city ${c}`]))),
        ...(tmp ? [row(`this round's copy (≤ ${round + 1} flight${round === 0 ? "" : "s"})`, tmp.map(money), Object.fromEntries(tmp.map((_, c) => [c, changed.has(c) ? "compare" : undefined])))] : []),
      ],
      graph: { title: "flights with prices; the note is the cheapest price found so far", nodes, edges, directed: true },
      vars: [
        { name: "flights allowed", value: `${k + 1} (k = ${k} stop${k === 1 ? "" : "s"})` },
        { name: "round", value: `${round} of ${k + 1}` },
      ],
      ops,
      ...extra,
    });
  };
  snap("start", `At most k = ${k} stop${k === 1 ? "" : "s"} means at most ${k + 1} flight${k === 0 ? "" : "s"}. Bellman-Ford, limited to ${k + 1} rounds: after round r, prices[c] is the cheapest way to reach c with at most r flights.`);
  for (let r = 0; r < k + 1; r++) {
    tmp = [...prices];
    changed = new Set();
    for (const [i, [a, b, p]] of flights.entries()) {
      ops++;
      if (prices[a] === Infinity) continue;
      if (prices[a] + p < tmp[b]) {
        tmp[b] = prices[a] + p;
        changed.add(b);
        hot = i;
      }
    }
    hot = -1;
    snap(
      "round",
      changed.size
        ? `Round ${r + 1}: try every flight from a city reached in round ${r}. Cheaper prices: ${[...changed].map((c) => `city ${c} → ${tmp![c]}`).join(", ")}. The updates go into a copy, so a single round can't chain two flights together.`
        : `Round ${r + 1}: no flight makes anything cheaper.`,
    );
    prices = tmp;
    tmp = null;
    round = r + 1;
    changed = new Set();
  }
  const ans = prices[dst] === Infinity ? -1 : prices[dst];
  snap("done", ans < 0 ? `City ${dst} can't be reached within ${k + 1} flights. Return −1.` : `The cheapest way to city ${dst} with at most ${k} stop${k === 1 ? "" : "s"} costs ${ans}.`, { done: true, answer: String(ans) });
  return steps;
}

/** The slow way: try every route of up to k + 1 flights. */
function slow({ n, flights, src, dst, k }: Input) {
  const out = Array.from({ length: n }, () => [] as [number, number][]);
  for (const [a, b, p] of flights) out[a].push([b, p]);
  let best = Infinity;
  let ops = 0;
  const go = (c: number, cost: number, left: number) => {
    ops++;
    if (c === dst) best = Math.min(best, cost);
    if (!left) return;
    for (const [b, p] of out[c]) go(b, cost + p, left - 1);
  };
  go(src, 0, k + 1);
  return { answer: best === Infinity ? -1 : best, ops };
}

export const cheapestFlights: PatternProblem<Input> = {
  id: "cheapest-flights",
  title: "Cheapest Flights Within K Stops",
  difficulty: "Medium",
  blind75: false,
  slug: "cheapest-flights-within-k-stops",
  video: "5eIK3zUdYmE",
  statement: "There are n cities and one-way flights [from, to, price]. Return the cheapest price from src to dst using at most k stops (k + 1 flights), or −1 if there's no such route.",
  examples: [
    { label: "LeetCode's example 1 (k = 1)", input: { n: 4, flights: [[0, 1, 100], [1, 2, 100], [2, 0, 100], [1, 3, 600], [2, 3, 200]], src: 0, dst: 3, k: 1 } },
    { label: "cheaper with more stops (k = 1)", input: { n: 3, flights: [[0, 1, 100], [1, 2, 100], [0, 2, 500]], src: 0, dst: 2, k: 1 } },
    { label: "same, but k = 0", input: { n: 3, flights: [[0, 1, 100], [1, 2, 100], [0, 2, 500]], src: 0, dst: 2, k: 0 } },
  ],
  random: (seed) => {
    const g = rngFor(seed);
    const n = g.int(3, 5);
    const flights: [number, number, number][] = [];
    const seen = new Set<string>();
    for (let i = 0; i < g.int(2, 2 * n); i++) {
      const a = g.int(0, n - 1);
      const b = g.int(0, n - 1);
      if (a === b || seen.has(`${a},${b}`)) continue;
      seen.add(`${a},${b}`);
      flights.push([a, b, g.int(1, 9) * 10]);
    }
    const src = g.int(0, n - 1);
    let dst = g.int(0, n - 1);
    if (dst === src) dst = (src + 1) % n;
    return { n, flights, src, dst, k: g.int(0, 2) };
  },
  big: {
    label: "10 cities, every pair connected, k = 4",
    input: () => {
      const flights: [number, number, number][] = [];
      for (let a = 0; a < 10; a++) for (let b = 0; b < 10; b++) if (a !== b) flights.push([a, b, ((a * 7 + b * 13) % 50) + 10]);
      return { n: 10, flights, src: 0, dst: 9, k: 4 };
    },
  },
  describe: ({ n, flights, src, dst, k }) => `n = ${n}, flights = ${showF(flights)}, src = ${src}, dst = ${dst}, k = ${k}`,
  run,
  solve: (input) => slow(input).answer,
  brute: slow,
  bruteIdea: "Try every route of up to k + 1 flights from src. The number of routes grows like (number of flights out of a city)^(k + 1).",
  guide: {
    title: "Cheapest Flights Within K Stops",
    idea: [
      "Plain Dijkstra ignores the number of stops, and the cheapest route may use too many. Bellman-Ford fits naturally: after r rounds of relaxing every edge, prices[c] is the cheapest cost to c using at most r edges. So run exactly k + 1 rounds.",
      "Each round writes into a copy of the prices and reads from the previous round's. Otherwise one round could chain two flights and break the limit.",
    ],
    whenToUse: ["Shortest paths with a cap on the number of edges: Bellman-Ford limited to that many rounds.", "Negative weights (without negative cycles): Bellman-Ford instead of Dijkstra."],
    stages: [
      { id: "start", title: "prices[src] = 0, the rest ∞", detail: "", pseudo: "prices = [float('inf')] * n; prices[src] = 0" },
      { id: "round", title: "One round: relax every flight into a copy", detail: "", pseudo: "tmp = prices.copy(); for s, d, p in flights: if prices[s] + p < tmp[d]: tmp[d] = prices[s] + p; prices = tmp" },
      { id: "done", title: "prices[dst] after k + 1 rounds", detail: "", pseudo: "return -1 if prices[dst] == float('inf') else prices[dst]" },
    ],
    legend: [
      { tone: "compare", label: "Got cheaper this round" },
      { tone: "pointer", label: "Reachable" },
      { tone: "found", label: "Destination reached" },
    ],
    complexity: { time: "O(k × E)", space: "O(n)", why: "k + 1 rounds, each looking at every flight once." },
    pitfalls: ["Read from the previous round's prices, write to the copy.", "k stops means k + 1 flights."],
    tryThis: ["Compare the last two examples: the same flights, but k = 0 forces the 500 direct flight.", "In LeetCode's example 1, 0 → 1 → 2 → 3 costs 400 but uses two stops."],
    python: py,
  },
};
