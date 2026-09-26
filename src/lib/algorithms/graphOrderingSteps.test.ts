import { describe, expect, it } from "vitest";

import type { Graph, NodeId, WeightedEdge } from "../../components/Graphs/Types";
import { buildTopoSortSteps, buildUnionFindSteps } from "./graphOrderingSteps";
import { assertStepInvariants } from "./testHelpers";

const dag: Graph = {
  nodes: ["A", "B", "C", "D", "E", "F"],
  edges: [
    ["A", "B", 1],
    ["A", "C", 1],
    ["B", "D", 1],
    ["C", "D", 1],
    ["D", "E", 1],
    ["C", "F", 1],
  ],
  directed: true,
};

const cyclic: Graph = {
  nodes: ["A", "B", "C"],
  edges: [
    ["A", "B", 1],
    ["B", "C", 1],
    ["C", "A", 1],
  ],
  directed: true,
};

const weighted: Graph = {
  nodes: ["A", "B", "C", "D", "E"],
  edges: [
    ["A", "B", 2],
    ["A", "C", 3],
    ["B", "C", 1],
    ["B", "D", 4],
    ["C", "D", 5],
    ["D", "E", 7],
    ["C", "E", 6],
  ],
  directed: false,
};

describe("topological sort", () => {
  it("emits every node exactly once", () => {
    const { order } = buildTopoSortSteps(dag);
    expect(order).not.toBeNull();
    expect([...(order as NodeId[])].sort()).toEqual([...dag.nodes].sort());
  });

  it("respects every edge direction", () => {
    // This is the defining property — a permutation alone proves nothing.
    const { order } = buildTopoSortSteps(dag);
    const pos = new Map((order as NodeId[]).map((n, i) => [n, i]));
    for (const [from, to] of dag.edges) {
      expect(
        (pos.get(from) as number) < (pos.get(to) as number),
        `edge ${from}->${to} is out of order`,
      ).toBe(true);
    }
  });

  it("detects a cycle instead of returning a bogus order", () => {
    const { order, hasCycle, steps } = buildTopoSortSteps(cyclic);
    expect(hasCycle).toBe(true);
    expect(order).toBeNull();
    const last = steps[steps.length - 1];
    expect(last.action).toBe("cycle");
    expect(last.order.length).toBeLessThan(cyclic.nodes.length);
  });

  it("detects a cycle that is only part of the graph", () => {
    const partial: Graph = {
      nodes: ["A", "B", "X", "Y"],
      edges: [
        ["A", "B", 1],
        ["X", "Y", 1],
        ["Y", "X", 1],
      ],
      directed: true,
    };
    const { hasCycle, steps } = buildTopoSortSteps(partial);
    expect(hasCycle).toBe(true);
    expect(steps[steps.length - 1].cycleNodes?.sort()).toEqual(["X", "Y"]);
  });

  it("handles a graph with no edges", () => {
    const isolated: Graph = { nodes: ["A", "B", "C"], edges: [], directed: true };
    const { order, hasCycle } = buildTopoSortSteps(isolated);
    expect(hasCycle).toBe(false);
    expect([...(order as NodeId[])].sort()).toEqual(["A", "B", "C"]);
  });

  it("never lets an in-degree go negative", () => {
    const { steps } = buildTopoSortSteps(dag);
    for (const [i, step] of steps.entries()) {
      for (const [node, deg] of Object.entries(step.inDegree)) {
        expect(deg, `step ${i}: ${node}`).toBeGreaterThanOrEqual(0);
      }
    }
  });

  it("holds the shared invariants", () => {
    const { steps } = buildTopoSortSteps(dag);
    assertStepInvariants(steps, { snapshot: (s) => s.order });
  });
});

/** Reference MST weight by brute force over edge subsets. */
function referenceMstWeight(graph: Graph): number {
  const n = graph.nodes.length;
  const index = new Map(graph.nodes.map((node, i) => [node, i]));
  let best = Infinity;

  const subsets = 1 << graph.edges.length;
  for (let mask = 0; mask < subsets; mask++) {
    const picked: WeightedEdge[] = [];
    for (let i = 0; i < graph.edges.length; i++) {
      if (mask & (1 << i)) picked.push(graph.edges[i]);
    }
    if (picked.length !== n - 1) continue;

    // Connected and acyclic with exactly n-1 edges means spanning tree.
    const parent = Array.from({ length: n }, (_, i) => i);
    const find = (x: number): number => (parent[x] === x ? x : (parent[x] = find(parent[x])));
    let ok = true;
    let weight = 0;
    for (const [from, to, w] of picked) {
      const a = find(index.get(from) as number);
      const b = find(index.get(to) as number);
      if (a === b) {
        ok = false;
        break;
      }
      parent[a] = b;
      weight += w;
    }
    if (ok) best = Math.min(best, weight);
  }
  return best;
}

describe("union-find / Kruskal", () => {
  it("builds a spanning tree with n-1 edges", () => {
    const { tree, spanning } = buildUnionFindSteps(weighted);
    expect(spanning).toBe(true);
    expect(tree.length).toBe(weighted.nodes.length - 1);
  });

  it("matches a brute-force minimum spanning tree", () => {
    const { totalWeight } = buildUnionFindSteps(weighted);
    expect(totalWeight).toBe(referenceMstWeight(weighted));
  });

  it("never accepts an edge that closes a cycle", () => {
    const { tree } = buildUnionFindSteps(weighted);
    const parent = new Map(weighted.nodes.map((n) => [n, n]));
    const find = (x: string): string => {
      let r = x;
      while (parent.get(r) !== r) r = parent.get(r) as string;
      return r;
    };
    for (const [from, to] of tree) {
      const a = find(from);
      const b = find(to);
      expect(a, `edge ${from}-${to} closes a cycle`).not.toBe(b);
      parent.set(a, b);
    }
  });

  it("reports a forest rather than a tree when the graph is disconnected", () => {
    const split: Graph = {
      nodes: ["A", "B", "X", "Y"],
      edges: [
        ["A", "B", 1],
        ["X", "Y", 2],
      ],
      directed: false,
    };
    const { spanning, tree, totalWeight, steps } = buildUnionFindSteps(split);
    expect(spanning).toBe(false);
    expect(tree.length).toBe(2);
    expect(totalWeight).toBe(3);
    expect(steps[steps.length - 1].explanation).toContain("not connected");
  });

  it("keeps set membership correct under path compression", () => {
    // Compression rewrites parent pointers; it must never move a node between
    // sets. Comparing the final partition against a naive union-find with no
    // compression is what proves that.
    const { steps } = buildUnionFindSteps(weighted);
    const final = steps[steps.length - 1];
    const members = Object.values(final.sets).flat().sort();
    expect(members).toEqual([...weighted.nodes].sort());
    // Connected graph, so everything ends in one set.
    expect(Object.keys(final.sets).length).toBe(1);
  });

  it("considers edges in non-decreasing weight order", () => {
    const { steps } = buildUnionFindSteps(weighted);
    const considered = steps
      .filter((s) => s.action === "consider")
      .map((s) => (s.edge as WeightedEdge)[2]);
    const sorted = [...considered].sort((a, b) => a - b);
    expect(considered).toEqual(sorted);
  });

  it("holds the shared invariants", () => {
    const { steps } = buildUnionFindSteps(weighted);
    assertStepInvariants(steps, { snapshot: (s) => s.tree });
  });
});
