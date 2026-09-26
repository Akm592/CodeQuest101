// Topological sort and union-find — the two graph algorithms the app was
// missing. The existing graph route already covers BFS, DFS, Dijkstra and A*,
// which are all traversal or pathfinding; neither of these is either.
//
// They get their own renderers because a circular node layout, which suits
// pathfinding, makes an ordering unreadable. Topological sort is drawn as
// left-to-right layers by longest-path depth, so the ordering is the geometry.
// Union-find is drawn as the forest it is, with each set boxed.

import * as React from "react";

import type { Graph, NodeId } from "./Graphs/Types";
import {
  buildTopoSortSteps,
  buildUnionFindSteps,
  type TopoStep,
  type UnionFindStep,
} from "../lib/algorithms/graphOrderingSteps";
import { useAlgorithmPlayer } from "../hooks/useAlgorithmPlayer";
import { cn } from "../lib/utils";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Surface } from "./ui/surface";
import VisualizerControls from "./Visualizer/VisualizerControls";

type Mode = "topo" | "unionFind";

/** A small course-prerequisite DAG: familiar shape, unambiguous ordering. */
const BASE_DAG: Graph = {
  nodes: ["intro", "data", "algos", "discrete", "os", "compilers"],
  edges: [
    ["intro", "data", 1],
    ["intro", "discrete", 1],
    ["data", "algos", 1],
    ["discrete", "algos", 1],
    ["data", "os", 1],
    ["algos", "compilers", 1],
  ],
  directed: true,
};

/** The same graph with one edge reversed, so Kahn's has nothing to start on. */
const CYCLIC_EDGE: [NodeId, NodeId, number] = ["compilers", "intro", 1];

const WEIGHTED: Graph = {
  nodes: ["A", "B", "C", "D", "E", "F"],
  edges: [
    ["A", "B", 2],
    ["A", "C", 3],
    ["B", "C", 1],
    ["B", "D", 4],
    ["C", "E", 6],
    ["D", "E", 5],
    ["D", "F", 7],
    ["E", "F", 2],
  ],
  directed: false,
};

const NODE_W = 104;
const NODE_H = 40;
const LAYER_X = 168;
const ROW_Y = 64;

/** Longest-path depth: a node sits one layer right of its deepest prerequisite. */
function layerOf(graph: Graph): Map<NodeId, number> {
  const depth = new Map<NodeId, number>(graph.nodes.map((n) => [n, 0]));
  // Relax |V| times; enough for a DAG, and terminates on a cycle too.
  for (let pass = 0; pass < graph.nodes.length; pass++) {
    for (const [from, to] of graph.edges) {
      const candidate = (depth.get(from) ?? 0) + 1;
      if (candidate > (depth.get(to) ?? 0)) depth.set(to, candidate);
    }
  }
  return depth;
}

const TopologicalSortVisualizer: React.FC = () => {
  const [mode, setMode] = React.useState<Mode>("topo");
  const [withCycle, setWithCycle] = React.useState(false);

  const dag: Graph = React.useMemo(
    () =>
      withCycle
        ? { ...BASE_DAG, edges: [...BASE_DAG.edges, CYCLIC_EDGE] }
        : BASE_DAG,
    [withCycle],
  );

  const topo = React.useMemo(() => buildTopoSortSteps(dag), [dag]);
  const uf = React.useMemo(() => buildUnionFindSteps(WEIGHTED), []);

  // Widened explicitly: TypeScript infers the player's step type from the first
  // arm otherwise, and the two shapes are deliberately different. Both source
  // arrays are memoised, so the identity is stable and the player only rewinds
  // when the mode or the graph actually changes.
  const steps: (TopoStep | UnionFindStep)[] = mode === "topo" ? topo.steps : uf.steps;
  const player = useAlgorithmPlayer(steps, { initialDelayMs: 700 });

  // Layout for the DAG view.
  const depths = React.useMemo(() => layerOf(dag), [dag]);
  const positions = React.useMemo(() => {
    const byLayer = new Map<number, NodeId[]>();
    for (const node of dag.nodes) {
      const d = depths.get(node) ?? 0;
      byLayer.set(d, [...(byLayer.get(d) ?? []), node]);
    }
    const out = new Map<NodeId, { x: number; y: number }>();
    for (const [layer, members] of byLayer) {
      members.forEach((node, i) => out.set(node, { x: layer * LAYER_X, y: i * ROW_Y }));
    }
    return out;
  }, [dag, depths]);

  const canvasW = (Math.max(...[...depths.values()], 0) + 1) * LAYER_X;
  const canvasH =
    (Math.max(...[...positions.values()].map((p) => p.y / ROW_Y), 0) + 1) * ROW_Y;

  const topoStep = mode === "topo" ? (player.current as TopoStep | null) : null;
  const ufStep = mode === "unionFind" ? (player.current as UnionFindStep | null) : null;

  const nodeClass = (node: NodeId): string => {
    if (!topoStep) return "border-border bg-viz-idle/10 text-muted-foreground";
    if (topoStep.order.includes(node)) return "border-viz-found bg-viz-found/20 text-foreground";
    if (topoStep.cycleNodes?.includes(node)) return "border-viz-swap bg-viz-swap/25 text-foreground";
    if (topoStep.node === node) return "border-viz-current bg-viz-current/25 text-foreground";
    if (topoStep.queue.includes(node)) return "border-viz-pointer bg-viz-pointer/20 text-foreground";
    return "border-border bg-viz-idle/10 text-muted-foreground";
  };

  return (
    <div className="flex w-full flex-col gap-6">
      <Surface variant="card" radius="2xl" className="p-4 sm:p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="go-mode" className="mb-1 text-xs text-muted-foreground">Algorithm</Label>
            <Select value={mode} onValueChange={(v) => setMode(v as Mode)}>
              <SelectTrigger id="go-mode"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="topo">Topological sort (Kahn's)</SelectItem>
                <SelectItem value="unionFind">Union-Find (Kruskal's MST)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {mode === "topo" && (
            <div className="flex items-end">
              <Button variant="outline" onClick={() => setWithCycle((v) => !v)}>
                {withCycle ? "Remove the cycle" : "Add a cycle"}
              </Button>
            </div>
          )}
        </div>
        <p className="mt-4 text-sm text-muted-foreground">
          {mode === "topo"
            ? "Kahn's algorithm counts incoming edges, then repeatedly emits a node that has none left. If the output ends up shorter than the node count, the leftovers form a cycle — which is how topological sort doubles as cycle detection."
            : "Kruskal's takes edges cheapest-first and keeps one only when its endpoints are in different sets. Union-Find answers 'same set?' in near-constant time, so the cycle check is the cheap part."}
        </p>
      </Surface>

      {mode === "topo" ? (
        <>
          <Surface variant="well" radius="2xl" className="overflow-x-auto p-4 sm:p-6">
            <div className="relative mx-auto" style={{ width: canvasW, height: canvasH }}>
              <svg className="absolute inset-0" width={canvasW} height={canvasH} aria-hidden="true">
                {dag.edges.map(([from, to], i) => {
                  const a = positions.get(from);
                  const b = positions.get(to);
                  if (!a || !b) return null;
                  const active =
                    topoStep?.edge && topoStep.edge[0] === from && topoStep.edge[1] === to;
                  return (
                    <line
                      key={i}
                      x1={a.x + NODE_W}
                      y1={a.y + NODE_H / 2}
                      x2={b.x}
                      y2={b.y + NODE_H / 2}
                      stroke={active ? "hsl(var(--viz-compare))" : "hsl(var(--viz-idle))"}
                      strokeWidth={active ? 2.5 : 1.5}
                      opacity={active ? 1 : 0.5}
                    />
                  );
                })}
              </svg>

              {dag.nodes.map((node) => {
                const p = positions.get(node);
                if (!p) return null;
                return (
                  <div
                    key={node}
                    className={cn(
                      "absolute flex items-center justify-between rounded-lg border px-2 font-mono text-xs transition-colors duration-200",
                      nodeClass(node),
                    )}
                    style={{ left: p.x, top: p.y, width: NODE_W, height: NODE_H }}
                  >
                    <span className="truncate">{node}</span>
                    <span className="ml-1 shrink-0 rounded bg-black/30 px-1 text-[10px] text-viz-pointer">
                      {topoStep?.inDegree[node] ?? 0}
                    </span>
                  </div>
                );
              })}
            </div>
          </Surface>

          <div className="grid gap-4 sm:grid-cols-2">
            <Surface variant="card" radius="xl" className="p-4">
              <h2 className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Ready queue
              </h2>
              <p className="font-mono text-sm text-viz-pointer">
                {topoStep?.queue.length ? topoStep.queue.join(" · ") : "—"}
              </p>
            </Surface>
            <Surface variant="card" radius="xl" className="p-4">
              <h2 className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Ordering
              </h2>
              <p className="font-mono text-sm text-viz-found">
                {topoStep?.order.length ? topoStep.order.join(" → ") : "—"}
              </p>
            </Surface>
          </div>
        </>
      ) : (
        <>
          <Surface variant="well" radius="2xl" className="p-4 sm:p-6">
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Disjoint sets
            </h2>
            <div className="flex flex-wrap gap-3">
              {Object.entries(ufStep?.sets ?? {}).map(([root, members]) => (
                <div
                  key={root}
                  className="rounded-lg border border-viz-visited/40 bg-viz-visited/10 px-3 py-2 font-mono text-sm text-foreground"
                >
                  {members.join(" · ")}
                </div>
              ))}
              {!ufStep && <p className="text-sm text-muted-foreground">Press Start.</p>}
            </div>
          </Surface>

          <Surface variant="card" radius="2xl" className="p-4 sm:p-6">
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Edges, cheapest first
            </h2>
            <div className="flex flex-col gap-1.5">
              {[...WEIGHTED.edges]
                .sort((a, b) => a[2] - b[2])
                .map(([from, to, w], i) => {
                  const inTree = ufStep?.tree.some((e) => e[0] === from && e[1] === to);
                  const isCurrent =
                    ufStep?.edge && ufStep.edge[0] === from && ufStep.edge[1] === to;
                  const rejected = isCurrent && ufStep?.action === "reject";
                  return (
                    <div
                      key={i}
                      className={cn(
                        "flex items-center justify-between rounded-md border px-3 py-1.5 font-mono text-xs transition-colors",
                        rejected
                          ? "border-viz-swap bg-viz-swap/20 text-foreground"
                          : inTree
                            ? "border-viz-found bg-viz-found/15 text-foreground"
                            : isCurrent
                              ? "border-viz-current bg-viz-current/20 text-foreground"
                              : "border-border text-muted-foreground",
                      )}
                    >
                      <span>{from} — {to}</span>
                      <span>weight {w}</span>
                    </div>
                  );
                })}
            </div>
            <p className="mt-3 font-mono text-sm text-viz-found">
              Tree weight: {ufStep?.totalWeight ?? 0}
            </p>
          </Surface>
        </>
      )}

      <Surface variant="card" radius="2xl" className="p-4 sm:p-6">
        <VisualizerControls
          status={player.status}
          onPlay={player.play}
          onPause={player.pause}
          onReset={player.reset}
          onStepForward={player.stepForward}
          onStepBack={player.stepBack}
          delayMs={player.delayMs}
          onDelayChange={player.setDelayMs}
          stepIndex={player.index}
          stepCount={player.stepCount}
        />
        <p className="mt-4 min-h-[3rem] text-sm text-foreground" aria-live="polite">
          {player.current?.explanation ?? "Press Start."}
        </p>
      </Surface>
    </div>
  );
};

export default TopologicalSortVisualizer;
