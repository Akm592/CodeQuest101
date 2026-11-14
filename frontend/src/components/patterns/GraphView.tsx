// Draws small graphs: round nodes at given positions (or evenly round a
// circle), undirected lines or directed arrows between them, optional edge
// labels (weights), and a pointer tag under / a note beside each node.

import * as React from "react";

import type { VizTone } from "../../lib/guides/types";
import type { GNode, PatternStep } from "../../lib/patterns/types";
import { C } from "../ml/colors";

const FILL: Record<VizTone, string> = {
  current: C.teal,
  compare: C.amber,
  swap: C.red,
  visited: C.violet,
  found: C.green,
  pointer: C.sky,
  idle: C.idle,
};

const UNIT = 64; // pixels per layout unit
const R = 16;
const PAD = 34;
const HALO = { stroke: "hsl(var(--card))", strokeWidth: 4, paintOrder: "stroke" as const, strokeLinejoin: "round" as const };

/** Positions in layout units: the node's own x/y, or a circle when none are given. */
function placeNodes(nodes: GNode[]): Map<string, { x: number; y: number }> {
  const out = new Map<string, { x: number; y: number }>();
  const free = nodes.filter((n) => n.x === undefined || n.y === undefined);
  const r = Math.max(1, free.length / 3.2);
  free.forEach((n, i) => {
    const a = -Math.PI / 2 + (2 * Math.PI * i) / free.length;
    out.set(n.id, { x: r + r * Math.cos(a), y: r + r * Math.sin(a) });
  });
  for (const n of nodes) if (n.x !== undefined && n.y !== undefined) out.set(n.id, { x: n.x, y: n.y });
  return out;
}

const GraphView: React.FC<{ graph: NonNullable<PatternStep["graph"]> }> = ({ graph }) => {
  const uid = React.useId().replace(/:/g, "");
  const { nodes, edges, directed } = graph;
  const pos = placeNodes(nodes);
  const xs = [...pos.values()].map((p) => p.x);
  const ys = [...pos.values()].map((p) => p.y);
  const minX = Math.min(0, ...xs);
  const minY = Math.min(0, ...ys);
  const width = PAD * 2 + (Math.max(0, ...xs) - minX) * UNIT + 40; // extra room for notes on the right
  const height = PAD * 2 + (Math.max(0, ...ys) - minY) * UNIT + 12;
  const px = (id: string) => PAD + (pos.get(id)!.x - minX) * UNIT;
  const py = (id: string) => PAD + (pos.get(id)!.y - minY) * UNIT;
  const pairs = new Set(edges.map((e) => `${e.a}>${e.b}`));
  const tones = [...new Set(edges.map((e) => e.tone ?? "idle"))] as VizTone[];

  return (
    <div className="min-w-0">
      {graph.title && <p className="mb-1.5 font-mono text-xs text-muted-foreground">{graph.title}</p>}
      <div className="overflow-x-auto pb-1">
        {nodes.length === 0 ? (
          <p className="text-sm text-muted-foreground">(empty graph)</p>
        ) : (
          <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="block" role="img" aria-label={graph.title ?? "Graph"}>
            {directed && (
              <defs>
                {tones.map((t) => (
                  <marker key={t} id={`${uid}-${t}`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                    <path d="M0,0 L10,5 L0,10 z" fill={t === "idle" ? C.muted : FILL[t]} />
                  </marker>
                ))}
              </defs>
            )}
            {edges.map((e, i) => {
              if (!pos.has(e.a) || !pos.has(e.b)) return null;
              let ax = px(e.a);
              let ay = py(e.a);
              let bx = px(e.b);
              let by = py(e.b);
              const dx = bx - ax;
              const dy = by - ay;
              const len = Math.hypot(dx, dy) || 1;
              // Two arrows between the same pair: nudge each to its own side.
              const nudge = directed && pairs.has(`${e.b}>${e.a}`) ? 5 : 0;
              const nx = (-dy / len) * nudge;
              const ny = (dx / len) * nudge;
              ax += (dx / len) * R + nx;
              ay += (dy / len) * R + ny;
              bx -= (dx / len) * (R + (directed ? 2 : 0)) - nx;
              by -= (dy / len) * (R + (directed ? 2 : 0)) - ny;
              // Plain edges use the muted text colour: the border colour is too faint for thin lines.
              const col = e.tone && e.tone !== "idle" ? FILL[e.tone] : C.muted;
              return (
                <g key={i} opacity={e.tone === "idle" ? 0.35 : e.tone ? 1 : 0.6}>
                  <line
                    x1={ax}
                    y1={ay}
                    x2={bx}
                    y2={by}
                    stroke={col}
                    strokeWidth={e.tone && e.tone !== "idle" ? 2.4 : 1.4}
                    strokeDasharray={e.dashed ? "5 4" : undefined}
                    markerEnd={directed ? `url(#${uid}-${e.tone ?? "idle"})` : undefined}
                  />
                  {e.label && (
                    <text x={(ax + bx) / 2 + nx * 2} y={(ay + by) / 2 + ny * 2 + 4} textAnchor="middle" fontSize={11} fontFamily="ui-monospace, monospace" fill={e.tone && e.tone !== "idle" ? FILL[e.tone] : C.muted} {...HALO}>
                      {e.label}
                    </text>
                  )}
                </g>
              );
            })}
            {nodes.map((n) => {
              const x = px(n.id);
              const y = py(n.id);
              return (
                <g key={n.id} opacity={n.tone === "idle" ? 0.4 : 1}>
                  <circle cx={x} cy={y} r={R} fill={n.tone ? FILL[n.tone] : C.card} fillOpacity={n.tone && n.tone !== "idle" ? 0.3 : 1} stroke={n.tone ? FILL[n.tone] : C.grid} strokeWidth={1.5} />
                  <text x={x} y={y + 4.5} textAnchor="middle" fontSize={n.v.length > 3 ? 10 : 12.5} fontFamily="ui-monospace, monospace" fill={C.fg}>
                    {n.v}
                  </text>
                  {n.tag && (
                    <text x={x} y={y + R + 13} textAnchor="middle" fontSize={10.5} fontFamily="ui-monospace, monospace" fill={C.amber} {...HALO}>
                      {n.tag}
                    </text>
                  )}
                  {n.note && (
                    <text x={x + R + 3} y={y - R + 4} fontSize={10.5} fontFamily="ui-monospace, monospace" fill={C.sky} {...HALO}>
                      {n.note}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>
        )}
      </div>
    </div>
  );
};

export default GraphView;
