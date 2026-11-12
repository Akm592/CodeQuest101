// Draws nodes and arrows for linked-list problems. Nodes sit on a grid of
// rows and columns; arrows to the next column are straight, longer ones arc
// (forward arcs above the row, backward ones below), and arrows between rows
// are straight lines. Dashed arrows are for extra pointers like `random`.

import * as React from "react";

import type { VizTone } from "../../lib/guides/types";
import type { LEdge, LNode, PatternStep } from "../../lib/patterns/types";
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

const SLOT = 72; // column width
const ROW = 92; // row height
const W = 42; // node width
const H = 30; // node height
const PAD_X = 16;
const PAD_TOP = 64; // room for arcs above the first row
const PAD_BOTTOM = 70; // room for tags and arcs below the last row

/** Where the line from (cx, cy) towards (tx, ty) leaves the node's box. */
function clip(cx: number, cy: number, tx: number, ty: number, pad = 2) {
  const dx = tx - cx;
  const dy = ty - cy;
  if (dx === 0 && dy === 0) return { x: cx, y: cy };
  const t = Math.min(dx ? (W / 2 + pad) / Math.abs(dx) : Infinity, dy ? (H / 2 + pad) / Math.abs(dy) : Infinity);
  return { x: cx + dx * t, y: cy + dy * t };
}

const LinkView: React.FC<{ links: NonNullable<PatternStep["links"]> }> = ({ links }) => {
  const uid = React.useId().replace(/:/g, "");
  const { nodes, edges, rowLabels = {} } = links;
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const maxCol = Math.max(0, ...nodes.map((n) => n.col));
  const maxRow = Math.max(0, ...nodes.map((n) => n.row));
  const width = PAD_X * 2 + (maxCol + 1) * SLOT;
  const height = PAD_TOP + maxRow * ROW + H + PAD_BOTTOM;
  const cx = (n: LNode) => PAD_X + n.col * SLOT + SLOT / 2;
  const cy = (n: LNode) => PAD_TOP + n.row * ROW + H / 2;
  const pairs = new Set(edges.map((e) => `${e.from}>${e.to}`));
  const tones = [...new Set(edges.map((e) => e.tone ?? "idle"))] as VizTone[];

  const path = (e: LEdge): string | null => {
    const a = byId.get(e.from);
    const b = byId.get(e.to);
    if (!a || !b) return null;
    const ax = cx(a);
    const ay = cy(a);
    const bx = cx(b);
    const by = cy(b);
    if (a.id === b.id) {
      // A pointer to itself: a small loop above the node.
      return `M${ax - 8},${ay - H / 2} C${ax - 26},${ay - H / 2 - 34} ${ax + 26},${ay - H / 2 - 34} ${ax + 8},${ay - H / 2 - 2}`;
    }
    const dc = b.col - a.col;
    if (a.row === b.row && Math.abs(dc) >= 2) {
      const span = Math.min(52, 14 + 9 * Math.abs(dc));
      if (dc > 0) {
        const y = ay - H / 2;
        return `M${ax + 6},${y - 1} C${ax + 14},${y - span} ${bx - 14},${y - span} ${bx - 6},${y - 3}`;
      }
      const y = ay + H / 2;
      return `M${ax - 6},${y + 1} C${ax - 14},${y + 18 + span} ${bx + 14},${y + 18 + span} ${bx + 6},${y + 3}`;
    }
    // Straight: next column, or a different row. Two arrows between the same
    // pair of nodes are nudged apart.
    const nudge = pairs.has(`${e.to}>${e.from}`) ? (a.col < b.col || a.row < b.row ? -5 : 5) : 0;
    const s = clip(ax, ay + nudge, bx, by + nudge);
    const t = clip(bx, by + nudge, ax, ay + nudge, 5);
    return `M${s.x},${s.y} L${t.x},${t.y}`;
  };

  return (
    <div className="min-w-0">
      {links.title && <p className="mb-1.5 font-mono text-xs text-muted-foreground">{links.title}</p>}
      <div className="overflow-x-auto pb-1">
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="block" role="img" aria-label={links.title ?? "Linked list"}>
          <defs>
            {tones.map((t) => (
              <marker key={t} id={`${uid}-${t}`} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                <path d="M0,0 L10,5 L0,10 z" fill={FILL[t]} />
              </marker>
            ))}
          </defs>
          {Object.entries(rowLabels).map(([r, label]) => (
            <text key={r} x={PAD_X} y={PAD_TOP + Number(r) * ROW - 8} fontSize={11} fill={C.muted}>
              {label}
            </text>
          ))}
          {edges.map((e, i) => {
            const d = path(e);
            const tone = e.tone ?? "idle";
            return d ? (
              <path
                key={i}
                d={d}
                fill="none"
                stroke={FILL[tone]}
                strokeOpacity={tone === "idle" ? 0.7 : 0.95}
                strokeWidth={1.6}
                strokeDasharray={e.dashed ? "5 4" : undefined}
                markerEnd={`url(#${uid}-${tone})`}
              />
            ) : null;
          })}
          {nodes.map((n) => {
            const x = cx(n) - W / 2;
            const y = cy(n) - H / 2;
            const fill = n.tone ? FILL[n.tone] : C.card;
            const isNull = n.v === "∅";
            return (
              <g key={n.id} opacity={n.tone === "idle" ? 0.45 : 1}>
                {isNull ? (
                  <text x={cx(n)} y={cy(n) + 5} textAnchor="middle" fontSize={15} fill={C.muted}>
                    ∅
                  </text>
                ) : (
                  <>
                    <rect x={x} y={y} width={W} height={H} rx={8} fill={fill} fillOpacity={n.tone && n.tone !== "idle" ? 0.28 : 1} stroke={n.tone ? FILL[n.tone] : C.grid} strokeWidth={1.4} />
                    <text x={cx(n)} y={cy(n) + 4.5} textAnchor="middle" fontSize={13} fontFamily="ui-monospace, monospace" fill={C.fg}>
                      {n.v}
                    </text>
                  </>
                )}
                {n.tag && (
                  <text x={cx(n)} y={y + H + 14} textAnchor="middle" fontSize={10.5} fontFamily="ui-monospace, monospace" fill={C.amber} stroke="hsl(var(--card))" strokeWidth={4} paintOrder="stroke" strokeLinejoin="round">
                    {n.tag}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
};

export default LinkView;
