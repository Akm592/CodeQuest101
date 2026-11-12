// Draws one PatternStep: array rows, a hash map, an optional grid, and the
// variables. Every pattern page uses this, so problems only produce data.

import * as React from "react";

import type { VizTone } from "../../lib/guides/types";
import type { PCell, PatternStep } from "../../lib/patterns/types";
import { cn } from "../../lib/utils";
import { C } from "../ml/colors";
import { Surface } from "../ui/surface";
import LinkView from "./LinkView";
import TreeView from "./TreeView";

// Literal class names so Tailwind sees them.
const CELL: Record<VizTone, string> = {
  current: "border-viz-current bg-viz-current/25 text-foreground",
  compare: "border-viz-compare/70 bg-viz-compare/15 text-foreground",
  swap: "border-viz-swap bg-viz-swap/30 text-foreground",
  visited: "border-viz-visited/70 bg-viz-visited/20 text-foreground",
  found: "border-viz-found bg-viz-found/25 text-foreground",
  pointer: "border-viz-pointer bg-viz-pointer/20 text-foreground",
  idle: "border-white/5 bg-transparent text-muted-foreground opacity-40",
};
const TEXT: Record<VizTone, string> = {
  current: "text-viz-current",
  compare: "text-viz-compare",
  swap: "text-destructive-bright",
  visited: "text-viz-visited",
  found: "text-viz-found",
  pointer: "text-viz-pointer",
  idle: "text-muted-foreground",
};

const FILL: Record<VizTone, string> = {
  current: C.teal,
  compare: C.amber,
  swap: C.red,
  visited: C.violet,
  found: C.green,
  pointer: C.sky,
  idle: C.idle,
};

/** Bar heights with optional water on top and a container box, for wall/water problems. */
const Bars: React.FC<{ bars: NonNullable<PatternStep["bars"]> }> = ({ bars }) => {
  const { tones = {}, tags = {}, water, box, rect, floor = 0 } = bars;
  const labels = bars.values;
  const values = labels.map((v) => v - floor);
  const n = values.length;
  const slot = 34;
  const top = Math.max(1, ...values.map((v, i) => v + (water?.[i] ?? 0)), box?.level ?? 0);
  const H = 150;
  const unit = (H - 20) / top;
  const W = n * slot + 8;
  const y = (v: number) => H - v * unit;
  return (
    <div className="overflow-x-auto pb-1">
      <svg viewBox={`0 0 ${W} ${H + 30}`} style={{ width: Math.max(W, 240), maxWidth: "100%" }} className="block h-auto min-w-[240px]" role="img" aria-label={`Bars with heights ${labels.join(", ")}`}>
        {box && (
          <rect
            x={4 + box.l * slot + slot / 2}
            y={y(box.level)}
            width={(box.r - box.l) * slot}
            height={box.level * unit}
            fill={C.sky}
            fillOpacity={0.18}
            stroke={C.sky}
            strokeOpacity={0.6}
            strokeDasharray="4 3"
          />
        )}
        {rect && rect.h > 0 && (
          <rect
            x={4 + rect.l * slot + 1}
            y={y(rect.h)}
            width={(rect.r - rect.l + 1) * slot - 2}
            height={rect.h * unit}
            fill={FILL[rect.tone ?? "pointer"]}
            fillOpacity={0.14}
            stroke={FILL[rect.tone ?? "pointer"]}
            strokeDasharray="4 3"
          />
        )}
        {values.map((v, i) => {
          const x = 4 + i * slot + 4;
          const w = slot - 8;
          const tone = tones[i];
          return (
            <g key={i}>
              {water && water[i] > 0 && <rect x={x} y={y(v + water[i])} width={w} height={water[i] * unit} fill={C.sky} fillOpacity={0.7} />}
              <rect x={x} y={y(v)} width={w} height={Math.max(0.5, v * unit)} rx={3} fill={tone ? FILL[tone] : C.idle} fillOpacity={tone ? 0.85 : 0.55} />
              <text x={x + w / 2} y={H + 13} textAnchor="middle" fontSize={11} fill={C.fg}>{labels[i]}</text>
              <text x={x + w / 2} y={H + 26} textAnchor="middle" fontSize={10} fill={C.muted}>{tags[i] ?? ""}</text>
            </g>
          );
        })}
        <line x1={2} x2={W - 2} y1={H} y2={H} stroke={C.grid} />
      </svg>
    </div>
  );
};

const Box: React.FC<{ cell: PCell; small?: boolean }> = ({ cell, small }) => (
  <div className="flex flex-col items-center gap-0.5">
    <div
      className={cn(
        "grid place-items-center rounded-lg border font-mono tabular-nums transition-colors duration-200",
        small ? "h-8 w-8 text-sm" : "h-10 min-w-10 px-1.5 text-sm",
        cell.tone ? CELL[cell.tone] : "border-white/10 bg-white/[0.04] text-foreground",
      )}
    >
      {cell.v}
    </div>
    {!small && <span className="h-3.5 font-mono text-[10px] leading-none text-muted-foreground">{cell.tag ?? ""}</span>}
  </div>
);

/** A grid of cells, e.g. a Sudoku board or a sorted matrix. */
const Grid: React.FC<{ grid: NonNullable<PatternStep["grid"]> }> = ({ grid }) => {
  const rows = grid.cells.length;
  const cols = grid.cells[0]?.length ?? 0;
  const b = grid.blocks;
  return (
    <div className="min-w-0">
      {grid.title && <p className="mb-1.5 font-mono text-xs text-muted-foreground">{grid.title}</p>}
      <div className="overflow-x-auto">
        <div className="grid w-max gap-0.5 rounded-xl border border-white/10 p-1" style={{ gridTemplateColumns: `repeat(${cols}, auto)` }}>
          {grid.cells.flatMap((line, r) =>
            line.map((c, j) => (
              <div key={`${r}-${j}`} className={cn(b && j % b === b - 1 && j < cols - 1 && "mr-1", b && r % b === b - 1 && r < rows - 1 && "mb-1")}>
                <Box cell={c} small />
              </div>
            )),
          )}
        </div>
      </div>
    </div>
  );
};

const StepView: React.FC<{ step: PatternStep }> = ({ step }) => (
  <div className="space-y-4">
    {step.rows.map((r, i) => (
      <div key={`${r.label}-${i}`} className="min-w-0">
        <p className="mb-1.5 font-mono text-xs text-muted-foreground">{r.label}</p>
        <div className="overflow-x-auto pb-1">
          <div className="flex w-max gap-1">
            {r.cells.length ? r.cells.map((c, j) => <Box key={j} cell={c} />) : <span className="text-sm text-muted-foreground">(empty)</span>}
          </div>
        </div>
      </div>
    ))}

    {step.bars && <Bars bars={step.bars} />}

    {step.grid && <Grid grid={step.grid} />}

    {step.links && <LinkView links={step.links} />}

    {step.tree && <TreeView tree={step.tree} />}

    {(step.map || step.vars.length > 0) && (
      <div className="grid gap-3 sm:grid-cols-2">
        {step.map && (
          <Surface variant="card" radius="xl" className="min-w-0 p-3">
            <p className="mb-2 font-mono text-xs text-muted-foreground">{step.map.title}</p>
            {step.map.entries.length === 0 ? (
              <p className="text-sm text-muted-foreground">(empty)</p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {step.map.entries.map((e) => (
                  <span
                    key={e.k}
                    className={cn(
                      "inline-flex max-w-full items-center gap-1.5 rounded-lg border px-2 py-1 font-mono text-xs",
                      e.tone ? CELL[e.tone] : "border-white/10 bg-white/[0.04] text-foreground",
                    )}
                  >
                    <span className="font-semibold">{e.k}</span>
                    <span className="text-muted-foreground">→</span>
                    <span className="truncate">{e.v}</span>
                  </span>
                ))}
              </div>
            )}
          </Surface>
        )}
        {step.vars.length > 0 && (
          <Surface variant="card" radius="xl" className="min-w-0 p-3">
            <p className="mb-2 font-mono text-xs text-muted-foreground">variables</p>
            <dl className="space-y-1 font-mono text-sm">
              {step.vars.map((v) => (
                <div key={v.name} className="flex flex-wrap gap-x-2">
                  <dt className="text-muted-foreground">{v.name}</dt>
                  <dd className={cn("font-semibold", v.tone ? TEXT[v.tone] : "text-foreground")}>{v.value}</dd>
                </div>
              ))}
            </dl>
          </Surface>
        )}
      </div>
    )}
  </div>
);

export default StepView;
