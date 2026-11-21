// The building blocks of the Evaluation Metrics page: the score strip, the
// confusion matrix and the metric tiles.

import * as React from "react";

import { type Confusion, type Metrics, type Outcome, outcomeOf, type Scored } from "../../../lib/ml/metrics";
import { cn } from "../../../lib/utils";
import { C } from "../colors";
import { METRIC_INFO, type MetricKey, pct } from "./metricInfo";
import { OUTCOME_COLOR, OUTCOME_SHORT, OUTCOME_TEXT } from "./outcomeColors";


// ---------------------------------------------------------------------------

interface StripProps {
  items: readonly Scored[];
  threshold: number;
  /** Emails judged so far, in order; undefined shows every outcome at once. */
  judged?: number;
  /** The email judged in this step, ringed. */
  current?: number;
  /** Click the strip to move the threshold there. */
  onPick?: (t: number) => void;
  compact?: boolean;
  label: string;
}

/**
 * Every email placed by its score: spam on the top row, normal email below.
 * The shaded side of the dashed line is what gets flagged. Colour is the
 * outcome, once an email has been judged.
 */
export const ScoreStrip: React.FC<StripProps> = ({ items, threshold, judged, current, onPick, compact = false, label }) => {
  // Drawn at its real on-screen width (1 unit = 1 px), so labels stay readable
  // on a phone instead of shrinking with the whole picture.
  const box = React.useRef<HTMLDivElement>(null);
  const [measured, setMeasured] = React.useState(640);
  React.useEffect(() => {
    const el = box.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(([entry]) => setMeasured(Math.max(280, Math.round(entry.contentRect.width))));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const W = measured;
  const narrow = W < 520;
  const H = compact ? 118 : 172;
  const L = narrow ? 62 : 96;
  const R = 12;
  const x = (s: number) => L + s * (W - L - R);
  const rowY = compact ? [34, 76] : [52, 112];
  // Keep neighbouring scores 0.03 apart from overlapping.
  const r = Math.min(compact ? 6 : 7.5, (0.03 * (W - L - R)) / 2 - 0.5);
  const ref = React.useRef<SVGSVGElement>(null);
  const axisY = H - 26;

  const pick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!onPick || !ref.current) return;
    const ctm = ref.current.getScreenCTM();
    if (!ctm) return;
    const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(ctm.inverse());
    const t = (p.x - L) / (W - L - R);
    if (t >= 0 && t <= 1) onPick(Math.round(t * 100) / 100);
  };

  return (
    <div ref={box} className="w-full">
    <svg ref={ref} viewBox={`0 0 ${W} ${H}`} className={cn("block h-auto w-full select-none", onPick && "cursor-crosshair")} role="img" aria-label={label} onClick={pick}>
      <rect x={x(threshold)} y={8} width={Math.max(0, x(1) - x(threshold))} height={axisY - 8} fill={C.amber} opacity={0.07} />
      {(narrow ? ["spam", "normal"] : ["really spam", "really normal"]).map((t, i) => (
        <g key={t}>
          <line x1={L} x2={W - R} y1={rowY[i]} y2={rowY[i]} stroke={C.grid} strokeWidth={0.6} />
          <text x={L - 12} y={rowY[i] + 4} textAnchor="end" fontSize={compact ? 11 : 12} fill={C.muted}>
            {t}
          </text>
        </g>
      ))}
      <line x1={L} x2={W - R} y1={axisY} y2={axisY} stroke={C.grid} />
      {[0, 0.25, 0.5, 0.75, 1].map((t) => (
        <text key={t} x={x(t)} y={axisY + 16} textAnchor="middle" fontSize={11} fill={C.muted}>
          {t}
        </text>
      ))}
      <text x={L - 12} y={axisY + 16} textAnchor="end" fontSize={11} fill={C.muted}>
        score
      </text>
      {items.map((e, i) => {
        const o: Outcome = outcomeOf(e, threshold);
        const shown = judged === undefined || i < judged;
        const cy = rowY[e.spam ? 0 : 1];
        return (
          <g key={e.id}>
            {i === current && <circle cx={x(e.score)} cy={cy} r={r + 5} fill="none" stroke={C.fg} strokeWidth={2} />}
            <circle
              cx={x(e.score)}
              cy={cy}
              r={r}
              fill={shown ? OUTCOME_COLOR[o] : C.card}
              fillOpacity={shown ? 0.9 : 1}
              stroke={shown ? "hsl(var(--background))" : C.muted}
              strokeWidth={shown ? 1.5 : 1}
            >
              <title>{`${e.subject}: score ${e.score.toFixed(2)}${shown ? `, ${OUTCOME_SHORT[o]}` : ""}`}</title>
            </circle>
          </g>
        );
      })}
      <line x1={x(threshold)} x2={x(threshold)} y1={8} y2={axisY} stroke={C.amber} strokeWidth={2} strokeDasharray="5 4" />
      <text x={Math.min(x(threshold) + 6, W - R - 2)} y={18} textAnchor={x(threshold) > W - 150 ? "end" : "start"} fontSize={11} fill={C.amber}>
        {x(threshold) > W - 150 ? `threshold ${threshold.toFixed(2)} ` : `threshold ${threshold.toFixed(2)} → flagged`}
      </text>
    </svg>
    </div>
  );
};

// ---------------------------------------------------------------------------

const CELLS: { o: Outcome; row: 0 | 1; col: 0 | 1; name: string; plain: string }[] = [
  { o: "tp", row: 0, col: 0, name: "True positive", plain: "spam, caught" },
  { o: "fn", row: 0, col: 1, name: "False negative", plain: "spam, missed" },
  { o: "fp", row: 1, col: 0, name: "False positive", plain: "normal, wrongly flagged" },
  { o: "tn", row: 1, col: 1, name: "True negative", plain: "normal, left alone" },
];

/** The 2 × 2 table with row and column totals. `active` lights one cell. */
export const ConfusionMatrix: React.FC<{ counts: Confusion; active?: Outcome; highlight?: Outcome[] }> = ({ counts, active, highlight }) => {
  const rowTotal = [counts.tp + counts.fn, counts.fp + counts.tn];
  const colTotal = [counts.tp + counts.fp, counts.fn + counts.tn];
  return (
    <div className="grid grid-cols-[auto_minmax(0,1fr)_minmax(0,1fr)_auto] gap-1.5 text-sm" role="table" aria-label="Confusion matrix">
      <div />
      <div className="px-1 text-center text-xs text-muted-foreground">flagged as spam</div>
      <div className="px-1 text-center text-xs text-muted-foreground">not flagged</div>
      <div />
      {[0, 1].map((row) => (
        <React.Fragment key={row}>
          <div className="flex items-center justify-end pr-1 text-right text-xs text-muted-foreground">{row === 0 ? "really spam" : "really normal"}</div>
          {CELLS.filter((c) => c.row === row).map((c) => {
            const lit = active === c.o || highlight?.includes(c.o);
            const dim = (active || highlight) && !lit;
            return (
              <div
                key={c.o}
                role="cell"
                className={cn("rounded-xl border px-2 py-2.5 text-center transition-all duration-300", lit && "scale-[1.03]", dim && "opacity-45")}
                style={{ borderColor: OUTCOME_COLOR[c.o], background: `color-mix(in srgb, ${OUTCOME_COLOR[c.o]} ${lit ? 34 : 16}%, transparent)` }}
              >
                <div className="font-mono text-2xl font-semibold tabular-nums text-foreground">{counts[c.o]}</div>
                <div className="text-xs font-medium" style={{ color: OUTCOME_TEXT[c.o] === C.muted ? undefined : OUTCOME_TEXT[c.o] }}>
                  {c.name} ({OUTCOME_SHORT[c.o]})
                </div>
                <div className="text-[11px] text-muted-foreground">{c.plain}</div>
              </div>
            );
          })}
          <div className="flex items-center pl-1 font-mono text-xs text-muted-foreground">{rowTotal[row]}</div>
        </React.Fragment>
      ))}
      <div />
      {colTotal.map((t, i) => (
        <div key={i} className="text-center font-mono text-xs text-muted-foreground">
          {t}
        </div>
      ))}
      <div />
    </div>
  );
};

// ---------------------------------------------------------------------------

export const MetricTiles: React.FC<{ metrics: Metrics; active?: MetricKey; onHover?: (k: MetricKey | null) => void; pending?: boolean }> = ({ metrics, active, onHover, pending }) => (
  <dl className="grid grid-cols-2 gap-2">
    {(Object.keys(METRIC_INFO) as MetricKey[]).map((k) => {
      const info = METRIC_INFO[k];
      return (
        <div
          key={k}
          onMouseEnter={() => onHover?.(k)}
          onMouseLeave={() => onHover?.(null)}
          className={cn(
            "rounded-xl border px-3 py-2 transition-all duration-300",
            active === k ? "border-foreground/60 bg-white/[0.08]" : "border-white/[0.06] bg-black/20",
          )}
        >
          <dt className="text-xs text-muted-foreground">
            <span className="font-semibold text-foreground">{info.label}</span> · {info.question}
          </dt>
          <dd className="mt-0.5">
            <span className="block font-mono text-lg font-semibold tabular-nums text-foreground">{pending ? "…" : pct(metrics[k])}</span>
            <span className="block whitespace-nowrap font-mono text-[11px] text-muted-foreground">{info.formula}</span>
          </dd>
        </div>
      );
    })}
  </dl>
);
