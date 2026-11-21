// The charts on the Evaluation Metrics page: precision and recall against the
// threshold, the ROC curve, and the 1,000-person grid for the accuracy trap.

import * as React from "react";

import { type Confusion, type RocPoint, sweep, type Scored } from "../../../lib/ml/metrics";
import { C } from "../colors";
import { Plot, type Scale } from "../shared";
import { OUTCOME_COLOR } from "./outcomeColors";

/** A line through points, broken wherever the value is missing (null). */
function brokenPath(s: Scale, pts: { x: number; y: number | null }[]): string {
  let d = "";
  let pen = false;
  for (const p of pts) {
    if (p.y === null) {
      pen = false;
      continue;
    }
    d += `${pen ? "L" : "M"}${s.x(p.x).toFixed(1)},${s.y(p.y).toFixed(1)} `;
    pen = true;
  }
  return d;
}

export const TradeoffChart: React.FC<{ items: readonly Scored[]; threshold: number; onPick: (t: number) => void }> = ({ items, threshold, onPick }) => {
  const rows = React.useMemo(() => sweep(items), [items]);
  return (
    <Plot
      xDomain={[0, 1]}
      yDomain={[0, 1]}
      width={560}
      height={300}
      ticks={[0, 0.25, 0.5, 0.75, 1]}
      label="Precision, recall and F1 at every threshold from 0 to 1"
      onPick={(p) => onPick(Math.round(p.x * 100) / 100)}
    >
      {(s) => (
        <>
          <path d={brokenPath(s, rows.map((r) => ({ x: r.threshold, y: r.f1 })))} fill="none" stroke={C.fg} strokeOpacity={0.5} strokeWidth={1.6} strokeDasharray="5 4" />
          <path d={brokenPath(s, rows.map((r) => ({ x: r.threshold, y: r.recall })))} fill="none" stroke={C.violet} strokeWidth={2.6} />
          <path d={brokenPath(s, rows.map((r) => ({ x: r.threshold, y: r.precision })))} fill="none" stroke={C.sky} strokeWidth={2.6} />
          <line x1={s.x(threshold)} x2={s.x(threshold)} y1={s.y(0)} y2={s.y(1)} stroke={C.amber} strokeWidth={1.6} strokeDasharray="4 3" />
        </>
      )}
    </Plot>
  );
};

export const RocChart: React.FC<{ roc: RocPoint[]; here: { fpr: number; tpr: number } }> = ({ roc, here }) => (
  <Plot xDomain={[0, 1]} yDomain={[0, 1]} width={420} height={400} ticks={[0, 0.25, 0.5, 0.75, 1]} label="ROC curve: true positive rate against false positive rate">
    {(s) => {
      const line = roc.map((p, i) => `${i ? "L" : "M"}${s.x(p.fpr).toFixed(1)},${s.y(p.tpr).toFixed(1)}`).join(" ");
      return (
        <>
          <path d={`${line} L${s.x(1)},${s.y(0)} L${s.x(0)},${s.y(0)} Z`} fill={C.teal} opacity={0.14} />
          <line x1={s.x(0)} y1={s.y(0)} x2={s.x(1)} y2={s.y(1)} stroke={C.muted} strokeDasharray="5 4" />
          <text x={s.x(0.62)} y={s.y(0.55)} fontSize={11} fill={C.muted} transform={`rotate(-40 ${s.x(0.62)} ${s.y(0.55)})`}>
            coin flip
          </text>
          <path d={line} fill="none" stroke={C.teal} strokeWidth={2.6} strokeLinejoin="round" />
          <circle cx={s.x(here.fpr)} cy={s.y(here.tpr)} r={7} fill={C.amber} stroke="hsl(var(--background))" strokeWidth={2} />
          <text x={s.x(0.5)} y={s.y(0) - 8} textAnchor="middle" fontSize={11} fill={C.muted}>
            false positive rate →
          </text>
          <text x={s.x(0) + 8} y={s.y(1) + 16} fontSize={11} fill={C.muted}>
            ↑ true positive rate (recall)
          </text>
        </>
      );
    }}
  </Plot>
);

/**
 * 1,000 people as 1,000 squares, 50 across. The sick come first (caught, then
 * missed), then the healthy who were flagged, then everyone else, so the rare
 * cases are visible at a glance instead of lost in the crowd.
 */
export const PeopleGrid: React.FC<{ counts: Confusion }> = ({ counts }) => {
  const order: (keyof Confusion)[] = ["tp", "fn", "fp", "tn"];
  const cells = order.flatMap((o) => Array.from({ length: counts[o] }, () => o));
  const cols = 50;
  const size = 10;
  const gap = 2;
  const rows = Math.ceil(cells.length / cols);
  return (
    <svg viewBox={`0 0 ${cols * (size + gap)} ${rows * (size + gap)}`} className="block h-auto w-full" role="img" aria-label={`${counts.tp} sick and caught, ${counts.fn} sick and missed, ${counts.fp} healthy but flagged, ${counts.tn} healthy and cleared`}>
      {cells.map((o, i) => (
        <rect
          key={i}
          x={(i % cols) * (size + gap)}
          y={Math.floor(i / cols) * (size + gap)}
          width={size}
          height={size}
          rx={2}
          fill={OUTCOME_COLOR[o]}
          opacity={o === "tn" ? 0.35 : 0.95}
        />
      ))}
    </svg>
  );
};
