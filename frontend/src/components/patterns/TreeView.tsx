// Draws binary trees: each node at its column (in-order position) and depth,
// with lines to its children, pointer labels under it and a note (such as the
// value it returns) beside it.

import * as React from "react";

import type { VizTone } from "../../lib/guides/types";
import type { PatternStep, TNode } from "../../lib/patterns/types";
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

const SLOT = 40;
const ROW = 64;
const R = 15;
const PAD_X = 24;
const PAD_TOP = 34;
const HALO = { stroke: "hsl(var(--card))", strokeWidth: 4, paintOrder: "stroke" as const, strokeLinejoin: "round" as const };

const TreeView: React.FC<{ tree: NonNullable<PatternStep["tree"]> }> = ({ tree }) => {
  const { nodes, labels = [] } = tree;
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const maxX = Math.max(0, ...nodes.map((n) => n.x), ...labels.map((l) => l.x));
  const maxD = Math.max(0, ...nodes.map((n) => n.depth));
  // Extra room on the right for the notes beside the last column.
  const width = PAD_X * 2 + (maxX + 1) * SLOT + 44;
  const height = PAD_TOP + maxD * ROW + R * 2 + 30;
  const px = (n: TNode) => PAD_X + n.x * SLOT + SLOT / 2;
  const py = (n: TNode) => PAD_TOP + n.depth * ROW + R;

  return (
    <div className="min-w-0">
      {tree.title && <p className="mb-1.5 font-mono text-xs text-muted-foreground">{tree.title}</p>}
      <div className="overflow-x-auto pb-1">
        {nodes.length === 0 ? (
          <p className="text-sm text-muted-foreground">(empty tree)</p>
        ) : (
          <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="block" role="img" aria-label={tree.title ?? "Binary tree"}>
            {labels.map((l, i) => (
              <text key={i} x={PAD_X + l.x * SLOT} y={14} fontSize={11} fill={C.muted}>
                {l.text}
              </text>
            ))}
            {nodes.map((n) => {
              const p = n.parent ? byId.get(n.parent) : undefined;
              if (!p) return null;
              const dx = px(n) - px(p);
              const dy = py(n) - py(p);
              const len = Math.hypot(dx, dy) || 1;
              const tone = n.edgeTone;
              return (
                <line
                  key={`e-${n.id}`}
                  x1={px(p) + (dx / len) * R}
                  y1={py(p) + (dy / len) * R}
                  x2={px(n) - (dx / len) * R}
                  y2={py(n) - (dy / len) * R}
                  stroke={tone ? FILL[tone] : C.grid}
                  strokeWidth={tone ? 2.4 : 1.4}
                  opacity={n.tone === "idle" ? 0.4 : 1}
                />
              );
            })}
            {nodes.map((n) => {
              const fill = n.tone ? FILL[n.tone] : C.card;
              return (
                <g key={n.id} opacity={n.tone === "idle" ? 0.4 : 1}>
                  <circle cx={px(n)} cy={py(n)} r={R} fill={fill} fillOpacity={n.tone && n.tone !== "idle" ? 0.3 : 1} stroke={n.tone ? FILL[n.tone] : C.grid} strokeWidth={1.5} />
                  <text x={px(n)} y={py(n) + 4.5} textAnchor="middle" fontSize={12.5} fontFamily="ui-monospace, monospace" fill={C.fg}>
                    {n.v}
                  </text>
                  {n.tag && (
                    <text x={px(n)} y={py(n) + R + 13} textAnchor="middle" fontSize={10.5} fontFamily="ui-monospace, monospace" fill={C.amber} {...HALO}>
                      {n.tag}
                    </text>
                  )}
                  {n.note && (
                    <text x={px(n) + R + 3} y={py(n) - R + 4} fontSize={10.5} fontFamily="ui-monospace, monospace" fill={C.sky} {...HALO}>
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

export default TreeView;
