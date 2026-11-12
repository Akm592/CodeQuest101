// LRU Cache (NeetCode 150 · Linked List).

import py from "../../guides/python/neetcode/lru_cache.py?raw";
import { row, rngFor, show } from "../helpers";
import type { LEdge, LNode, PEntry, PatternProblem, PatternStep } from "../types";

/** Capacity and calls like "put 1 10" and "get 1". */
type Input = { cap: number; calls: string[] };

function run({ cap, calls }: Input): PatternStep[] {
  const steps: PatternStep[] = [];
  const order: number[] = []; // keys, least recent first
  const val = new Map<number, number>();
  const out: number[] = [];
  let ops = 0;
  const snap = (stage: string, k: number, explanation: string, hot: number | null, gone: number | null = null, extra: Partial<PatternStep> = {}) => {
    const nodes: LNode[] = [
      { id: "L", v: "LRU", row: 0, col: 0, tone: "idle" },
      ...order.map((key, i): LNode => ({ id: `k${key}`, v: `${key}:${val.get(key)}`, row: 0, col: i + 1, tone: key === hot ? "found" : undefined })),
      { id: "R", v: "MRU", row: 0, col: order.length + 1, tone: "idle" },
    ];
    const ids = ["L", ...order.map((key) => `k${key}`), "R"];
    const edges: LEdge[] = ids.slice(1).map((to, i) => ({ from: ids[i], to }));
    steps.push({
      stage,
      explanation,
      rows: [row("calls", calls, Object.fromEntries(calls.map((_, j) => [j, j < k ? "idle" : j === k ? "current" : undefined])))],
      links: { title: "usage order, least recent → most recent (each node also points back)", nodes, edges },
      map: {
        title: `hash map: key → node (capacity ${cap})`,
        entries: [
          ...[...order].sort((x, y) => x - y).map((key): PEntry => ({ k: String(key), v: `node ${key}:${val.get(key)}`, tone: key === hot ? "found" : undefined })),
          ...(gone !== null ? [{ k: String(gone), v: "evicted", tone: "swap" } as PEntry] : []),
        ],
      },
      vars: [{ name: "get results", value: out.length ? show(out) : "–", tone: "found" }],
      ops,
      ...extra,
    });
  };
  const touch = (key: number) => {
    order.splice(order.indexOf(key), 1);
    order.push(key);
  };
  snap("start", -1, `A hash map finds any key's node in O(1). A doubly linked list keeps the keys in order of use, least recent on the left. Moving a node to the right end is O(1) because each node knows both neighbours.`, null);
  calls.forEach((call, k) => {
    const [op, a, b] = call.split(" ");
    const key = Number(a);
    ops++;
    if (op === "get") {
      if (!val.has(key)) {
        out.push(-1);
        snap("get", k, `get ${key}: not in the map, return −1.`, null);
      } else {
        touch(key);
        out.push(val.get(key)!);
        snap("get", k, `get ${key}: the map finds its node. Return ${val.get(key)}, and move the node to the right end: it's now the most recently used.`, key);
      }
      return;
    }
    if (val.has(key)) {
      val.set(key, Number(b));
      touch(key);
      snap("put", k, `put ${key}: already there, so update the value to ${b} and move it to the right end.`, key);
      return;
    }
    val.set(key, Number(b));
    order.push(key);
    if (order.length > cap) {
      const lru = order.shift()!;
      val.delete(lru);
      snap("evict", k, `put ${key}: add a node at the right end. That makes ${order.length + 1} keys, over the capacity of ${cap}, so remove the leftmost node (key ${lru}, the least recently used) and delete it from the map.`, key, lru);
      return;
    }
    snap("put", k, `put ${key}: add a new node at the right end and put it in the map.`, key);
  });
  snap("done", calls.length, `All calls done. The gets returned ${show(out)}.`, null, null, { done: true, answer: show(out) });
  return steps;
}

function slow({ cap, calls }: Input) {
  // A plain array in usage order: every lookup scans it.
  let ops = 0;
  const order: [number, number][] = [];
  const out: number[] = [];
  for (const call of calls) {
    const [op, a, b] = call.split(" ");
    const key = Number(a);
    let at = -1;
    for (let i = 0; i < order.length; i++) {
      ops++;
      if (order[i][0] === key) {
        at = i;
        break;
      }
    }
    ops++;
    if (op === "get") {
      if (at < 0) out.push(-1);
      else {
        const [e] = order.splice(at, 1);
        order.push(e);
        out.push(e[1]);
      }
    } else {
      if (at >= 0) order.splice(at, 1);
      order.push([key, Number(b)]);
      if (order.length > cap) order.shift();
    }
  }
  return { answer: show(out), ops };
}

export const lruCache: PatternProblem<Input> = {
  id: "lru-cache",
  title: "LRU Cache",
  difficulty: "Medium",
  blind75: false,
  slug: "lru-cache",
  video: "7ABFKPK2hD4",
  statement: "Design a cache with a fixed capacity. get(key) returns the value or −1; put(key, value) adds or updates. When it's full, put removes the least recently used key. Both must be O(1).",
  examples: [
    { label: "LeetCode's example (capacity 2)", input: { cap: 2, calls: ["put 1 1", "put 2 2", "get 1", "put 3 3", "get 2", "put 4 4", "get 1", "get 3", "get 4"] } },
    { label: "capacity 3", input: { cap: 3, calls: ["put 1 10", "put 2 20", "put 3 30", "get 1", "put 4 40", "get 2", "put 3 33", "get 3", "put 5 50", "get 1"] } },
  ],
  random: (seed) => {
    const g = rngFor(seed);
    const calls = Array.from({ length: g.int(6, 10) }, (_, i) => (i < 2 || g.r() < 0.55 ? `put ${g.int(1, 4)} ${g.int(1, 9)}` : `get ${g.int(1, 4)}`));
    return { cap: g.int(2, 3), calls };
  },
  big: { label: "capacity 100, 300 calls", input: () => ({ cap: 100, calls: [...Array.from({ length: 100 }, (_, i) => `put ${i} ${i}`), ...Array.from({ length: 200 }, (_, i) => `get ${99 - (i % 100)}`)] }) },
  describe: ({ cap, calls }) => `capacity ${cap}: ${calls.join(", ")}`,
  run,
  solve: (input) => slow(input).answer,
  brute: slow,
  bruteIdea: "Keep the keys in a plain array in order of use: every get and put scans it to find the key, O(n) per call.",
  guide: {
    title: "LRU Cache",
    idea: [
      "Two needs, two structures. Finding a key fast needs a hash map. Knowing which key was used least recently, and moving a key to “most recent”, needs an ordered list where you can unlink a node from the middle in O(1). That's a doubly linked list.",
      "The map stores key → node. get: look up the node, unlink it, re-insert it at the right end. put: add or update the node at the right end; if over capacity, remove the leftmost node and its map entry. Two sentinel nodes (left and right) mean the list is never empty, so there are no edge cases.",
    ],
    whenToUse: ["Any cache with eviction by recency (browser caches, database buffers).", "“O(1) lookup and O(1) reorder”: hash map + doubly linked list. Python's OrderedDict is exactly this."],
    stages: [
      { id: "start", title: "Empty map, two sentinels", detail: "left.next = right, right.prev = left.", pseudo: "self.left, self.right = Node(), Node()" },
      { id: "get", title: "get: look up, move to the right end", detail: "−1 if missing.", pseudo: "remove(node); insert(node); return node.val" },
      { id: "put", title: "put: insert or update at the right end", detail: "", pseudo: "insert(Node(key, value))" },
      { id: "evict", title: "Over capacity → remove the leftmost", detail: "The least recently used.", pseudo: "lru = self.left.next; remove(lru); del cache[lru.key]" },
      { id: "done", title: "All calls answered", detail: "", pseudo: "" },
    ],
    legend: [
      { tone: "current", label: "Current call" },
      { tone: "found", label: "Node just used" },
      { tone: "swap", label: "Evicted" },
    ],
    complexity: { time: "O(1) per call", space: "O(capacity)", why: "Map lookups and linking or unlinking a node are all constant time." },
    pitfalls: ["A singly linked list can't unlink a node in O(1): you'd need its predecessor. That's why it's doubly linked.", "Store the key in each node, so eviction can delete the map entry."],
    tryThis: ["In LeetCode's example, get 1 saves key 1 from being evicted by put 3.", "Press “Random” and predict which key is evicted."],
    python: py,
  },
};
