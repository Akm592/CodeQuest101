// Draws intervals on a shared number line: one bar per lane, with the lane's
// label on the left, optional point marks (like query positions) and ticks
// along the axis.

import * as React from "react";

import type { VizTone } from "../../lib/guides/types";
import type { PatternStep } from "../../lib/patterns/types";
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

const LANE = 26;
const LABEL_W = 76;
const PAD_TOP = 26;
const UNIT_MIN = 18;
const HALO = { stroke: "hsl(var(--card))", strokeWidth: 3, paintOrder: "stroke" as const };

const TimelineView: React.FC<{ timeline: NonNullable<PatternStep["timeline"]> }> = ({ timeline }) => {
  const { bars, marks = [], lanes } = timeline;
  const lo = Math.min(timeline.min ?? Infinity, ...bars.map((b) => b.start), ...marks.map((m) => m.x));
  const hi = Math.max(timeline.max ?? -Infinity, ...bars.map((b) => b.end), ...marks.map((m) => m.x));
  const span = Math.max(1, hi - lo);
  const unit = Math.max(UNIT_MIN, Math.min(40, 480 / span));
  const laneCount = Math.max(lanes?.length ?? 0, ...bars.map((b) => b.lane + 1), 1);
  const width = LABEL_W + span * unit + 30;
  const height = PAD_TOP + laneCount * LANE + 16;
  const X = (v: number) => LABEL_W + (v - lo) * unit;
  const step = span <= 20 ? 1 : span <= 50 ? 5 : 10;
  const ticks: number[] = [];
  for (let v = Math.ceil(lo / step) * step; v <= hi; v += step) ticks.push(v);

  return (
    <div className="min-w-0">
      {timeline.title && <p className="mb-1.5 font-mono text-xs text-muted-foreground">{timeline.title}</p>}
      <div className="overflow-x-auto pb-1">
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="block" role="img" aria-label={timeline.title ?? "Timeline"}>
          {ticks.map((v) => (
            <g key={v}>
              <line x1={X(v)} x2={X(v)} y1={PAD_TOP - 6} y2={height - 10} stroke={C.grid} strokeOpacity={0.5} strokeDasharray="2 3" />
              <text x={X(v)} y={PAD_TOP - 10} textAnchor="middle" fontSize={10} fontFamily="ui-monospace, monospace" fill={C.muted}>
                {v}
              </text>
            </g>
          ))}
          {(lanes ?? []).map((l, i) => (
            <text key={i} x={LABEL_W - 8} y={PAD_TOP + i * LANE + LANE / 2 + 4} textAnchor="end" fontSize={10.5} fontFamily="ui-monospace, monospace" fill={C.muted}>
              {l}
            </text>
          ))}
          {bars.map((b, i) => {
            const col = b.tone ? FILL[b.tone] : C.muted;
            const y = PAD_TOP + b.lane * LANE + 5;
            const w = Math.max(4, (b.end - b.start) * unit);
            return (
              <g key={i} opacity={b.tone === "idle" ? 0.45 : 1}>
                <rect x={X(b.start)} y={y} width={w} height={LANE - 10} rx={5} fill={col} fillOpacity={b.tone && b.tone !== "idle" ? 0.35 : 0.18} stroke={col} strokeWidth={1.4} strokeDasharray={b.dashed ? "4 3" : undefined} />
                {b.text && (
                  <text x={X(b.start) + w / 2} y={y + (LANE - 10) / 2 + 4} textAnchor="middle" fontSize={10} fontFamily="ui-monospace, monospace" fill={C.fg} {...HALO}>
                    {b.text}
                  </text>
                )}
              </g>
            );
          })}
          {marks.map((m, i) => (
            <g key={i}>
              <line x1={X(m.x)} x2={X(m.x)} y1={PAD_TOP - 4} y2={height - 10} stroke={m.tone ? FILL[m.tone] : C.amber} strokeWidth={2} />
              {m.label && (
                <text x={X(m.x) + 4} y={height - 2} fontSize={10} fontFamily="ui-monospace, monospace" fill={m.tone ? FILL[m.tone] : C.amber} {...HALO}>
                  {m.label}
                </text>
              )}
            </g>
          ))}
        </svg>
      </div>
    </div>
  );
};

export default TimelineView;
