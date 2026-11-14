// Reconstruct Itinerary (NeetCode 150 · Advanced Graphs).

import py from "../../guides/python/neetcode/reconstruct_itinerary.py?raw";
import { row, rngFor } from "../helpers";
import type { GEdge, GNode, PatternProblem, PatternStep } from "../types";

type Input = [string, string][];

const showTrip = (t: string[]) => `[${t.join(", ")}]`;

function run(tickets: Input): PatternStep[] {
  const steps: PatternStep[] = [];
  // Sorted tickets, so the first full itinerary found is the smallest in lexical order.
  const order = tickets.map((t, i) => [t, i] as const).sort(([a], [b]) => (a[0] + a[1] < b[0] + b[1] ? -1 : a[0] + a[1] > b[0] + b[1] ? 1 : 0));
  const adj = new Map<string, number[]>(); // airport → ticket indexes, in sorted order
  for (const [[a], i] of order) {
    if (!adj.has(a)) adj.set(a, []);
    adj.get(a)!.push(i);
  }
  const airports = [...new Set(tickets.flat())].sort();
  const used = new Set<number>();
  const res = ["JFK"];
  let hot = -1;
  let dead = -1;
  let ops = 0;
  const snap = (stage: string, explanation: string, extra: Partial<PatternStep> = {}) => {
    const here = res.at(-1);
    const nodes: GNode[] = airports.map((a) => ({ id: a, v: a, tone: a === here ? "current" : res.includes(a) ? "pointer" : undefined, tag: a === "JFK" ? "start" : undefined }));
    const edges: GEdge[] = tickets.map(([a, b], i) => ({ a, b, tone: i === dead ? "swap" : i === hot ? "compare" : used.has(i) ? "found" : undefined, dashed: !used.has(i) && i !== hot && i !== dead }));
    steps.push({
      stage,
      explanation,
      rows: [row("itinerary so far", res, Object.fromEntries(res.map((_, i) => [i, i === res.length - 1 ? "current" : "pointer"])))],
      graph: { title: "tickets (dashed: not used yet)", nodes, edges, directed: true },
      vars: [{ name: "tickets used", value: `${used.size} of ${tickets.length}`, tone: "found" }],
      ops,
      ...extra,
    });
  };
  snap("start", "Use every ticket exactly once, starting at JFK, and if several itineraries work, return the one that's smallest in lexical order. Sort the tickets and DFS: from each airport, try its unused tickets in alphabetical order. If a choice leads to a dead end before all tickets are used, undo it and try the next.");
  const dfs = (src: string): boolean => {
    ops++;
    if (res.length === tickets.length + 1) return true;
    const list = adj.get(src) ?? [];
    for (const i of list) {
      ops++;
      if (used.has(i)) continue;
      used.add(i);
      res.push(tickets[i][1]);
      hot = i;
      dead = -1;
      snap("fly", `From ${src}, the alphabetically first unused ticket goes to ${tickets[i][1]}. Use it.`);
      if (dfs(tickets[i][1])) return true;
      used.delete(i);
      res.pop();
      hot = -1;
      dead = i;
      snap("undo", `Flying ${src} → ${tickets[i][1]} here strands us with tickets left over. Undo it and try ${src}'s next ticket.`);
      dead = -1;
    }
    if (res.length < tickets.length + 1) {
      hot = -1;
      snap("stuck", `No unused ticket leaves ${src}, but ${tickets.length - used.size} ticket${tickets.length - used.size === 1 ? " is" : "s are"} still unused: a dead end.`);
    }
    return false;
  };
  dfs("JFK");
  hot = -1;
  snap("done", `All ${tickets.length} tickets are used: ${showTrip(res)}.`, { done: true, answer: showTrip(res) });
  return steps;
}

/** Cross-check: Hierholzer's algorithm (an Eulerian path), O(E log E). */
function hierholzer(tickets: Input): string {
  const adj = new Map<string, string[]>();
  for (const [a, b] of tickets) {
    if (!adj.has(a)) adj.set(a, []);
    adj.get(a)!.push(b);
  }
  for (const l of adj.values()) l.sort().reverse(); // pop() takes the smallest
  const out: string[] = [];
  const visit = (a: string) => {
    const l = adj.get(a) ?? [];
    while (l.length) visit(l.pop()!);
    out.push(a);
  };
  visit("JFK");
  return showTrip(out.reverse());
}

function randomTickets(seed: number): Input {
  const g = rngFor(seed);
  const names = ["JFK", "ATL", "SFO", "LHR", "MUC"].slice(0, g.int(2, 4));
  // A random walk from JFK, so a valid itinerary always exists.
  const t: Input = [];
  let at = "JFK";
  for (let i = 0; i < g.int(2, 6); i++) {
    const to = g.pick(names.filter((n) => n !== at));
    t.push([at, to]);
    at = to;
  }
  return g.shuffle(t);
}

export const reconstructItinerary: PatternProblem<Input> = {
  id: "reconstruct-itinerary",
  title: "Reconstruct Itinerary",
  difficulty: "Hard",
  blind75: false,
  slug: "reconstruct-itinerary",
  video: "ZyB_gQ8vqGA",
  statement: "Given airline tickets [from, to], build the itinerary that starts at JFK and uses every ticket exactly once. If several are possible, return the one that's smallest in lexical order.",
  examples: [
    { label: "LeetCode's example 2", input: [["JFK", "SFO"], ["JFK", "ATL"], ["SFO", "ATL"], ["ATL", "JFK"], ["ATL", "SFO"]] },
    { label: "a dead end to undo", input: [["JFK", "KUL"], ["JFK", "NRT"], ["NRT", "JFK"]] },
    { label: "LeetCode's example 1", input: [["MUC", "LHR"], ["JFK", "MUC"], ["SFO", "SJC"], ["LHR", "SFO"]] },
  ],
  random: randomTickets,
  describe: (t) => `tickets = [${t.map(([a, b]) => `[${a},${b}]`).join(", ")}]`,
  run,
  solve: hierholzer,
  brute: null,
  bruteIdea: "Trying every order of the tickets is E! orders. NeetCode's backtracking tries tickets in sorted order and backs up only at dead ends; Hierholzer's algorithm, used here to cross-check the answer, is O(E log E).",
  guide: {
    title: "Reconstruct Itinerary",
    idea: [
      "Using every ticket once is a path through every edge of a directed graph (an Eulerian path). Sort each airport's tickets, so trying them in order finds the lexically smallest itinerary first.",
      "NeetCode's approach is backtracking: from the current airport, take the first unused ticket and recurse. If that leaves you stuck with tickets unused, put the ticket back and try the next one. The first time all tickets are used, that's the answer.",
    ],
    whenToUse: ["“Use every edge exactly once”: an Eulerian path (Hierholzer's algorithm), or backtracking for small inputs.", "Lexically smallest answer: try choices in sorted order and stop at the first complete one."],
    stages: [
      { id: "start", title: "Sort tickets, start at JFK", detail: "", pseudo: "tickets.sort(); res = ['JFK']" },
      { id: "fly", title: "Use the first unused ticket from here", detail: "", pseudo: "adj[src].pop(i); res.append(v); if dfs(v): return True" },
      { id: "undo", title: "Dead end: put the ticket back", detail: "", pseudo: "adj[src].insert(i, v); res.pop()" },
      { id: "stuck", title: "No tickets out, some unused", detail: "", pseudo: "if src not in adj: return False" },
      { id: "done", title: "All tickets used", detail: "", pseudo: "if len(res) == len(tickets) + 1: return True" },
    ],
    legend: [
      { tone: "current", label: "Current airport / ticket just used" },
      { tone: "found", label: "Tickets used" },
      { tone: "compare", label: "Ticket just taken" },
      { tone: "swap", label: "Ticket that led to a dead end" },
    ],
    complexity: { time: "O(E²) typically; exponential in the worst case", space: "O(E)", why: "Backtracking can undo choices, but sorted order makes dead ends rare. Hierholzer's algorithm is O(E log E)." },
    pitfalls: ["Smallest lexically isn't always completable: KUL comes before NRT, but flying to KUL first strands the NRT tickets.", "Remove a used ticket so it can't be used twice, and put it back when you undo."],
    tryThis: ["In “a dead end to undo”, JFK → KUL is tried first and undone.", "In LeetCode's example 2, ATL is chosen before SFO wherever both are possible."],
    python: py,
  },
};
