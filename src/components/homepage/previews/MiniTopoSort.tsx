// Kahn's algorithm on the five-task preview graph. Each node carries its
// remaining in-degree; edges out of an emitted node fade, because removing them
// is what makes the next nodes ready. The output order builds along the bottom.

import type { TopoStep } from "../../../lib/algorithms/graphOrderingSteps";
import { TOPO_PREVIEW_GRAPH } from "../../../lib/algorithms/previewStages";

const R = 13;

// Fixed, layered by dependency depth: the left-to-right position is the order.
const POS: Record<string, { x: number; y: number }> = {
  A: { x: 28, y: 24 },
  B: { x: 28, y: 80 },
  C: { x: 112, y: 24 },
  D: { x: 112, y: 80 },
  E: { x: 196, y: 52 },
};

const W = 224;
const H = 132;

export function MiniTopoSort({ step }: { step: TopoStep }) {
  const emitted = new Set(step.order);
  const queued = new Set(step.queue);

  const nodeFill = (id: string): string => {
    if (step.node === id && (step.action === "emit" || step.action === "enqueue"))
      return "hsl(var(--viz-current) / 0.35)";
    if (emitted.has(id)) return "hsl(var(--viz-found) / 0.25)";
    if (queued.has(id)) return "hsl(var(--viz-pointer) / 0.25)";
    return "hsl(var(--viz-idle) / 0.15)";
  };

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-full w-full" aria-hidden="true">
      <defs>
        <marker id="mini-topo-arrow" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="6" markerHeight="6" orient="auto">
          <path d="M0,0 L8,4 L0,8 z" fill="hsl(var(--viz-idle))" />
        </marker>
        <marker id="mini-topo-arrow-hot" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="6" markerHeight="6" orient="auto">
          <path d="M0,0 L8,4 L0,8 z" fill="hsl(var(--viz-compare))" />
        </marker>
      </defs>

      {TOPO_PREVIEW_GRAPH.edges.map(([from, to]) => {
        const a = POS[from];
        const b = POS[to];
        const len = Math.hypot(b.x - a.x, b.y - a.y);
        const ux = (b.x - a.x) / len;
        const uy = (b.y - a.y) / len;
        const hot = step.edge?.[0] === from && step.edge?.[1] === to;
        const removed = emitted.has(from) && !hot;
        return (
          <line
            key={`${from}-${to}`}
            x1={a.x + ux * R}
            y1={a.y + uy * R}
            x2={b.x - ux * (R + 2)}
            y2={b.y - uy * (R + 2)}
            stroke={hot ? "hsl(var(--viz-compare))" : "hsl(var(--viz-idle))"}
            strokeWidth={hot ? 2 : 1.25}
            opacity={removed ? 0.2 : 0.9}
            markerEnd={`url(#${hot ? "mini-topo-arrow-hot" : "mini-topo-arrow"})`}
            className="transition-opacity duration-300"
          />
        );
      })}

      {TOPO_PREVIEW_GRAPH.nodes.map((id) => {
        const p = POS[id];
        const deg = step.inDegree[id] ?? 0;
        return (
          <g key={id}>
            <circle
              cx={p.x}
              cy={p.y}
              r={R}
              fill={nodeFill(id)}
              stroke={step.node === id ? "hsl(var(--viz-current))" : "hsl(var(--border))"}
              strokeWidth={step.node === id ? 2 : 1}
              className="transition-[fill] duration-300"
            />
            <text x={p.x} y={p.y + 4} textAnchor="middle" className="font-mono text-[11px] font-semibold" fill="hsl(var(--foreground))">
              {id}
            </text>
            {/* Remaining in-degree: the number Kahn's algorithm watches fall to 0. */}
            {!emitted.has(id) && (
              <g>
                <circle cx={p.x + R - 1} cy={p.y - R + 1} r={7} fill="hsl(var(--background))" stroke="hsl(var(--viz-compare) / 0.7)" />
                <text x={p.x + R - 1} y={p.y - R + 4.5} textAnchor="middle" className="font-mono text-[9px] font-bold" fill="hsl(var(--viz-compare))">
                  {deg}
                </text>
              </g>
            )}
          </g>
        );
      })}

      {/* One string, so the font spaces the arrows instead of fixed offsets. */}
      <text x={4} y={H - 8} className="font-mono text-[11px]">
        <tspan fill="hsl(var(--muted-foreground))">order: </tspan>
        <tspan className="font-semibold" fill="hsl(var(--viz-found))">
          {step.order.join(" → ")}
        </tspan>
      </text>
    </svg>
  );
}
