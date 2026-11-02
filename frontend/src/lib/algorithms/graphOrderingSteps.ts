// Topological sort (Kahn's) and union-find, step by step.
//
// Both are missing from the app: the existing graph route covers BFS, DFS,
// Dijkstra and A*, which are all traversals or pathfinding. Neither of these is
// either — one produces an ordering, one merges disjoint sets — which is why
// they get their own route with their own renderers rather than two more
// entries in that route's selector.
//
// Kahn's is chosen over DFS post-order because its state is visible: in-degree
// counts you can watch fall to zero, and a ready-queue draining into the
// output. Cycle detection then falls out for free ("output shorter than V"),
// which is the beat that makes the algorithm memorable.
//
// Pure functions: no React, no timers. Tested in graphOrderingSteps.test.ts.

import type { Graph, NodeId, WeightedEdge } from "../../components/Graphs/Types";
import { type BaseStep, type GeneratorOptions, StepBuilder } from "./types";

// ---------------------------------------------------------------------------
// Topological sort — Kahn's algorithm
// ---------------------------------------------------------------------------

export type TopoAction = "init" | "enqueue" | "emit" | "decrement" | "cycle" | "done";

export interface TopoStep extends BaseStep {
  action: TopoAction;
  /** Node being emitted or enqueued. */
  node: NodeId | null;
  /** Edge being relaxed, when the step is a decrement. */
  edge?: [NodeId, NodeId];
  /** Snapshot of every node's remaining in-degree. */
  inDegree: Record<NodeId, number>;
  /** The ready queue, in order. */
  queue: NodeId[];
  /** The ordering produced so far. */
  order: NodeId[];
  /** Set when the graph turns out to have a cycle. */
  cycleNodes?: NodeId[];
}

export interface TopoResult {
  steps: TopoStep[];
  /** A valid topological order, or null when the graph has a cycle. */
  order: NodeId[] | null;
  hasCycle: boolean;
}

/** Outgoing adjacency. Topological order is only defined for directed graphs. */
function outgoing(graph: Graph): Map<NodeId, NodeId[]> {
  const adj = new Map<NodeId, NodeId[]>();
  for (const n of graph.nodes) adj.set(n, []);
  for (const [from, to] of graph.edges) {
    adj.get(from)?.push(to);
  }
  return adj;
}

export function buildTopoSortSteps(graph: Graph, options: GeneratorOptions = {}): TopoResult {
  const builder = new StepBuilder<TopoStep>(options);
  const adj = outgoing(graph);

  const inDegree: Record<NodeId, number> = {};
  for (const n of graph.nodes) inDegree[n] = 0;
  for (const [, to] of graph.edges) inDegree[to] = (inDegree[to] ?? 0) + 1;

  const queue: NodeId[] = graph.nodes.filter((n) => inDegree[n] === 0);
  const order: NodeId[] = [];

  const snap = (
    action: TopoAction,
    node: NodeId | null,
    explanation: string,
    extra: Partial<TopoStep> = {},
  ): boolean =>
    builder.push({
      action,
      node,
      inDegree: { ...inDegree },
      queue: [...queue],
      order: [...order],
      explanation,
      ...extra,
    });

  snap(
    "init",
    null,
    queue.length
      ? `Count incoming edges for every node. ${queue.length} node${queue.length === 1 ? " has" : "s have"} none, so ${queue.length === 1 ? "it is" : "they are"} ready: ${queue.join(", ")}.`
      : "Every node has an incoming edge, so nothing is ready to start — that already means a cycle.",
  );

  while (queue.length > 0 && !builder.isFull) {
    const node = queue.shift() as NodeId;
    order.push(node);
    snap("emit", node, `${node} has no remaining dependencies — add it to the ordering (position ${order.length}).`);

    for (const next of adj.get(node) ?? []) {
      if (builder.isFull) break;
      inDegree[next] -= 1;
      if (inDegree[next] === 0) {
        queue.push(next);
        snap("enqueue", next, `${next} has no dependencies left — it joins the ready queue.`, {
          edge: [node, next],
        });
      } else {
        snap("decrement", next, `${next} still waits on ${inDegree[next]} more node${inDegree[next] === 1 ? "" : "s"}.`, {
          edge: [node, next],
        });
      }
    }
  }

  const hasCycle = order.length !== graph.nodes.length;
  const cycleNodes = hasCycle ? graph.nodes.filter((n) => !order.includes(n)) : undefined;

  const steps = builder.finish({
    action: hasCycle ? "cycle" : "done",
    node: null,
    inDegree: { ...inDegree },
    queue: [],
    order: [...order],
    cycleNodes,
    done: true,
    explanation: hasCycle
      ? `Only ${order.length} of ${graph.nodes.length} nodes were emitted. The rest (${cycleNodes?.join(", ")}) still have incoming edges, which can only happen in a cycle — so no topological order exists.`
      : `All ${graph.nodes.length} nodes ordered: ${order.join(" → ")}.`,
  });

  return { steps, order: hasCycle ? null : order, hasCycle };
}

// ---------------------------------------------------------------------------
// Union-Find, with Kruskal's MST on top
// ---------------------------------------------------------------------------

export type UnionFindAction = "init" | "consider" | "union" | "reject" | "done";

export interface UnionFindStep extends BaseStep {
  action: UnionFindAction;
  /** Edge under consideration. */
  edge?: WeightedEdge;
  /** parent[node] — the forest, snapshotted. */
  parent: Record<NodeId, NodeId>;
  /** Members of each set, keyed by representative. */
  sets: Record<NodeId, NodeId[]>;
  /** Edges accepted into the spanning tree so far. */
  tree: WeightedEdge[];
  totalWeight: number;
}

export interface UnionFindResult {
  steps: UnionFindStep[];
  tree: WeightedEdge[];
  totalWeight: number;
  /** True when the result spans every node (the graph was connected). */
  spanning: boolean;
}

export function buildUnionFindSteps(
  graph: Graph,
  options: GeneratorOptions = {},
): UnionFindResult {
  const builder = new StepBuilder<UnionFindStep>(options);

  const parent = new Map<NodeId, NodeId>();
  const rank = new Map<NodeId, number>();
  for (const n of graph.nodes) {
    parent.set(n, n);
    rank.set(n, 0);
  }

  // Path compression. It never changes which set a node belongs to, only how
  // fast the answer comes back — asserted in the tests.
  const find = (x: NodeId): NodeId => {
    let root = x;
    while (parent.get(root) !== root) root = parent.get(root) as NodeId;
    let walk = x;
    while (parent.get(walk) !== root) {
      const next = parent.get(walk) as NodeId;
      parent.set(walk, root);
      walk = next;
    }
    return root;
  };

  const setsSnapshot = (): Record<NodeId, NodeId[]> => {
    const out: Record<NodeId, NodeId[]> = {};
    for (const n of graph.nodes) {
      const root = find(n);
      (out[root] ??= []).push(n);
    }
    return out;
  };

  const tree: WeightedEdge[] = [];
  let totalWeight = 0;

  const snap = (
    action: UnionFindAction,
    explanation: string,
    edge?: WeightedEdge,
  ): boolean =>
    builder.push({
      action,
      edge,
      parent: Object.fromEntries(parent),
      sets: setsSnapshot(),
      tree: tree.map((e) => [...e] as WeightedEdge),
      totalWeight,
      explanation,
    });

  snap("init", `Every node starts in its own set — ${graph.nodes.length} sets for ${graph.nodes.length} nodes.`);

  const sorted = [...graph.edges].sort((a, b) => a[2] - b[2]);

  for (const edge of sorted) {
    if (builder.isFull) break;
    const [from, to, weight] = edge;

    snap("consider", `Consider ${from}–${to} (weight ${weight}), the cheapest edge left.`, edge);
    if (builder.isFull) break;

    const rootA = find(from);
    const rootB = find(to);

    if (rootA === rootB) {
      snap("reject", `${from} and ${to} are already in the same set — taking this edge would close a cycle, so skip it.`, edge);
      continue;
    }

    // Union by rank, so the forest stays shallow.
    const rankA = rank.get(rootA) ?? 0;
    const rankB = rank.get(rootB) ?? 0;
    if (rankA < rankB) parent.set(rootA, rootB);
    else if (rankA > rankB) parent.set(rootB, rootA);
    else {
      parent.set(rootB, rootA);
      rank.set(rootA, rankA + 1);
    }

    tree.push([...edge] as WeightedEdge);
    totalWeight += weight;
    snap("union", `${from} and ${to} were in different sets — merge them and keep the edge. Tree weight is now ${totalWeight}.`, edge);
  }

  const roots = new Set(graph.nodes.map((n) => find(n)));
  const spanning = roots.size === 1;

  const steps = builder.finish({
    action: "done",
    parent: Object.fromEntries(parent),
    sets: setsSnapshot(),
    tree: tree.map((e) => [...e] as WeightedEdge),
    totalWeight,
    done: true,
    explanation: spanning
      ? `Minimum spanning tree complete: ${tree.length} edges, total weight ${totalWeight}.`
      : `The graph is not connected — ${roots.size} separate components, so this is a spanning forest of weight ${totalWeight}.`,
  });

  return { steps, tree, totalWeight, spanning };
}
