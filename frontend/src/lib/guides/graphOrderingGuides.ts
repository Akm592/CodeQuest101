import type { TopoStep, UnionFindStep } from "../algorithms/graphOrderingSteps";
import kruskalPy from "./python/kruskal_union_find.py?raw";
import topoPy from "./python/topological_sort.py?raw";
import type { AlgorithmGuide } from "./types";

// ---------------------------------------------------------------------------
// Topological sort — Kahn's algorithm
// ---------------------------------------------------------------------------

export const topoSortGuide: AlgorithmGuide = {
  title: "Topological Sort (Kahn's algorithm)",
  idea: [
    "A topological order lists the nodes of a directed graph so that every edge points forward: each task comes after everything it depends on. It exists exactly when the graph has no cycle.",
    "Kahn's algorithm keeps a count of each node's unmet prerequisites (its in-degree). Any node at zero can go now. Output one, remove its outgoing edges, and some other nodes drop to zero and become ready in turn. Repeat until nothing is ready.",
    "Cycle detection comes for free. Nodes on a cycle wait on each other forever, their counts never reach zero, and the output ends up shorter than the number of nodes.",
  ],
  whenToUse: [
    "“Course schedule”, “build order”, “task dependencies”, or “alien dictionary” (ordering letters from sorted words).",
    "“Can all of these be finished?” That's the same as asking whether the graph is acyclic.",
    "Any “X must happen before Y” rules that you need to turn into a sequence.",
  ],
  stages: [
    {
      id: "count",
      title: "Count each node's incoming edges",
      detail: "One pass over the edges gives every node's in-degree. Nodes at 0 have no prerequisites and start in the ready queue.",
      pseudo: "for (u, v) in edges: indeg[v] += 1;  ready = [v with indeg 0]",
    },
    {
      id: "emit",
      title: "Output a ready node",
      detail: "Take a node from the ready queue and append it to the order. Everything it depends on is already in the output.",
      pseudo: "u = ready.popleft(); order.append(u)",
    },
    {
      id: "decrement",
      title: "Remove its edges → counts drop",
      detail: "Each outgoing edge was one prerequisite of its target, and that prerequisite is now met. Lower the target's count.",
      pseudo: "for v in out[u]: indeg[v] -= 1",
    },
    {
      id: "ready",
      title: "Count hits 0 → node is ready",
      detail: "A node whose last prerequisite was just met joins the ready queue.",
      pseudo: "if indeg[v] == 0: ready.append(v)",
    },
    {
      id: "done",
      title: "Queue empty → order complete",
      detail: "Every node was output, so the order respects every edge.",
      pseudo: "return order  # len(order) == n",
    },
    {
      id: "cycle",
      title: "Nodes left over → there's a cycle",
      detail: "The queue ran dry with nodes still waiting. They depend on each other in a loop, so no valid order exists.",
      pseudo: "if len(order) < n: return None  # cycle",
    },
  ],
  legend: [
    { tone: "current", label: "Node being output" },
    { tone: "pointer", label: "Ready queue (in-degree 0)" },
    { tone: "found", label: "Already in the order" },
    { tone: "swap", label: "Stuck on a cycle" },
  ],
  complexity: {
    time: "O(V + E)",
    space: "O(V + E)",
    why: "Every node enters and leaves the queue once, and every edge is followed once to decrement a count. That's linear in the graph's size. The adjacency list and the counts take O(V + E).",
  },
  pitfalls: [
    "Forgetting the cycle check. Kahn's loop just stops early on a cycle, so compare len(order) with the node count yourself.",
    "Counting outgoing edges instead of incoming ones. A node is ready when nothing points into it.",
    "Leaving isolated nodes out of the count table. A node with no edges at all still needs to appear in the order.",
    "Expecting one unique answer. When several nodes are ready at once, any of them can go first, and all of those orders are correct.",
  ],
  tryThis: [
    "Press “Add a cycle”. The new edge makes intro depend on compilers, so nothing can start and the cycle is reported immediately.",
    "Watch algos. It needs both data and discrete, so its count drops twice before it's ready.",
    "Notice that data and discrete are ready at the same time. Either could come first, and both orders are valid.",
  ],
  python: topoPy,
};

export function topoGuideStepFor(step: TopoStep): string {
  switch (step.action) {
    case "init":
      return "count";
    case "emit":
      return "emit";
    case "decrement":
      return "decrement";
    case "enqueue":
      return "ready";
    case "cycle":
      return "cycle";
    default:
      return "done";
  }
}

// ---------------------------------------------------------------------------
// Union-Find, driving Kruskal's minimum spanning tree
// ---------------------------------------------------------------------------

export const unionFindGuide: AlgorithmGuide = {
  title: "Union-Find & Kruskal's MST",
  idea: [
    "A minimum spanning tree connects every node of a weighted graph using the cheapest possible set of edges, with no cycles. Kruskal's algorithm is greedy: sort the edges by weight, and keep each one unless it would close a cycle.",
    "“Would this edge close a cycle?” is the same as asking whether its two endpoints are already connected. Union-Find answers that quickly. It keeps the nodes in disjoint sets, each identified by a root. find(x) returns x's root, and union(a, b) merges two sets.",
    "Two optimisations make Union-Find nearly constant time per operation. Path compression points nodes straight at their root as find walks up, and union by rank hangs the shorter tree under the taller one.",
  ],
  whenToUse: [
    "“Minimum cost to connect all points, cities or computers.”",
    "“Number of connected components”, “are these two in the same group?”, “redundant connection”, or “accounts merge”.",
    "Any problem where groups only ever merge, never split, and you keep asking whether two things are in the same group.",
  ],
  stages: [
    {
      id: "init",
      title: "Every node starts in its own set",
      detail: "Before any edge is kept, nothing is connected. Each node is the root of a set containing only itself.",
      pseudo: "parent[x] = x for every node",
    },
    {
      id: "consider",
      title: "Take the cheapest remaining edge",
      detail: "Edges are processed in order of weight. Choosing the cheapest safe edge every time is what makes the tree minimal.",
      pseudo: "for (u, v, w) in sorted(edges, key=weight):",
    },
    {
      id: "reject",
      title: "Same set → skip (it would close a cycle)",
      detail: "find(u) == find(v) means u and v are already connected through kept edges, so this edge would only add a loop.",
      pseudo: "if find(u) == find(v): continue",
    },
    {
      id: "union",
      title: "Different sets → keep the edge and merge",
      detail: "The edge joins two separate pieces, so it can't make a cycle. Keep it and union the two sets into one.",
      pseudo: "union(u, v); tree.append((u, v, w))",
    },
    {
      id: "done",
      title: "One set left → tree complete",
      detail: "After V − 1 kept edges every node is in one set, and those edges form the minimum spanning tree. If several sets remain, the graph is disconnected and you get a spanning forest.",
      pseudo: "return tree  # V - 1 edges",
    },
  ],
  legend: [
    { tone: "current", label: "Edge being considered" },
    { tone: "found", label: "Kept in the tree" },
    { tone: "swap", label: "Rejected: would close a cycle" },
    { tone: "visited", label: "A disjoint set" },
  ],
  complexity: {
    time: "O(E log E)",
    space: "O(V)",
    why: "Sorting the edges dominates. Each find or union is O(α(V)) with path compression and union by rank, and α is the inverse Ackermann function, at most 4 for any graph that fits in memory. Union-Find itself needs only the parent and rank tables.",
  },
  pitfalls: [
    "Comparing u and v directly instead of find(u) and find(v). Two nodes can be connected without being neighbours.",
    "Skipping path compression and union by rank. Without them a long chain makes each find O(V).",
    "Not stopping, or not checking, for V − 1 edges. Fewer kept edges at the end means the graph is disconnected.",
    "Sorting by node name instead of by weight. The greedy choice only works cheapest-first.",
  ],
  tryThis: [
    "Watch A — C (weight 3). A and C are already connected through B by then, so it's rejected.",
    "Count the kept edges: 5 for 6 nodes, which is always V − 1 for a connected graph.",
    "Compare the total weight with the sum of every edge. The tree drops the expensive redundant ones.",
  ],
  python: kruskalPy,
};

export function unionFindGuideStepFor(step: UnionFindStep): string {
  switch (step.action) {
    case "init":
      return "init";
    case "consider":
      return "consider";
    case "reject":
      return "reject";
    case "union":
      return "union";
    default:
      return "done";
  }
}
