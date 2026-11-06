// Building blocks shared by the Machine Learning & AI pages.

import * as React from "react";

import { cn } from "../../lib/utils";
import { Surface } from "../ui/surface";
import { C } from "./colors";


// ---------------------------------------------------------------------------
// The illustrated "idea in pictures" strip that opens every ML page.

export interface ConceptFigure {
  title: string;
  caption: string;
  art: React.ReactNode;
}

export const ConceptFigures: React.FC<{ figures: ConceptFigure[]; className?: string }> = ({ figures, className }) => (
  <section aria-label="The idea in pictures" className={cn("grid gap-3 md:grid-cols-3", className)}>
    {figures.map((f, i) => (
      <Surface key={f.title} as="figure" variant="card" radius="2xl" className="m-0 flex min-w-0 flex-col gap-3 p-4">
        <div className="overflow-hidden rounded-xl border border-white/[0.06] bg-black/25">{f.art}</div>
        <figcaption className="space-y-1">
          <p className="flex items-baseline gap-2 text-sm font-semibold text-foreground">
            <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-white/10 font-mono text-[11px] text-muted-foreground">
              {i + 1}
            </span>
            {f.title}
          </p>
          <p className="text-[13px] leading-relaxed text-muted-foreground">{f.caption}</p>
        </figcaption>
      </Surface>
    ))}
  </section>
);

/** Every figure uses the same canvas so the row lines up. */
export const Art: React.FC<{ children: React.ReactNode; label: string }> = ({ children, label }) => (
  <svg viewBox="0 0 240 150" className="block h-auto w-full" role="img" aria-label={label}>
    {children}
  </svg>
);

/** A small arrowhead marker; give each figure its own id. */
export const Arrowhead: React.FC<{ id: string; color: string }> = ({ id, color }) => (
  <defs>
    <marker id={id} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M0,0 L10,5 L0,10 z" fill={color} />
    </marker>
  </defs>
);

// ---------------------------------------------------------------------------
// A 2D plot with data coordinates, used by regression, k-means and the network.

export interface Scale {
  x: (v: number) => number;
  y: (v: number) => number;
  invert: (px: number, py: number) => { x: number; y: number };
  width: number;
  height: number;
}

interface PlotProps {
  xDomain: [number, number];
  yDomain: [number, number];
  width?: number;
  height?: number;
  label: string;
  /** Called with data coordinates when the plot is clicked. */
  onPick?: (p: { x: number; y: number }) => void;
  children: (s: Scale) => React.ReactNode;
  /** Drawn under the grid, e.g. a decision-boundary image. */
  background?: (s: Scale) => React.ReactNode;
  ticks?: number[];
  className?: string;
}

export const Plot: React.FC<PlotProps> = ({
  xDomain,
  yDomain,
  width = 480,
  height = 360,
  label,
  onPick,
  children,
  background,
  ticks,
  className,
}) => {
  const ref = React.useRef<SVGSVGElement>(null);
  const clipId = React.useId();
  const pad = 28;
  const s: Scale = {
    width,
    height,
    x: (v) => pad + ((v - xDomain[0]) / (xDomain[1] - xDomain[0])) * (width - pad - 10),
    y: (v) => height - pad - ((v - yDomain[0]) / (yDomain[1] - yDomain[0])) * (height - pad - 10),
    invert: (px, py) => ({
      x: xDomain[0] + ((px - pad) / (width - pad - 10)) * (xDomain[1] - xDomain[0]),
      y: yDomain[0] + ((height - pad - py) / (height - pad - 10)) * (yDomain[1] - yDomain[0]),
    }),
  };

  const click = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!onPick || !ref.current) return;
    const ctm = ref.current.getScreenCTM();
    if (!ctm) return;
    const pt = new DOMPoint(e.clientX, e.clientY).matrixTransform(ctm.inverse());
    const d = s.invert(pt.x, pt.y);
    if (d.x < xDomain[0] || d.x > xDomain[1] || d.y < yDomain[0] || d.y > yDomain[1]) return;
    onPick(d);
  };

  const tickValues = ticks ?? [];
  return (
    <svg
      ref={ref}
      viewBox={`0 0 ${width} ${height}`}
      className={cn("block h-auto w-full select-none", onPick && "cursor-crosshair", className)}
      role="img"
      aria-label={label}
      onClick={click}
    >
      {background?.(s)}
      {tickValues.map((t) => (
        <g key={`t${t}`}>
          <line x1={s.x(t)} x2={s.x(t)} y1={s.y(yDomain[0])} y2={s.y(yDomain[1])} stroke={C.grid} strokeWidth={0.6} />
          <line x1={s.x(xDomain[0])} x2={s.x(xDomain[1])} y1={s.y(t)} y2={s.y(t)} stroke={C.grid} strokeWidth={0.6} />
          <text x={s.x(t)} y={height - 10} textAnchor="middle" fontSize={10} fill={C.muted}>
            {t}
          </text>
          <text x={pad - 6} y={s.y(t) + 3} textAnchor="end" fontSize={10} fill={C.muted}>
            {t}
          </text>
        </g>
      ))}
      <rect
        x={s.x(xDomain[0])}
        y={s.y(yDomain[1])}
        width={s.x(xDomain[1]) - s.x(xDomain[0])}
        height={s.y(yDomain[0]) - s.y(yDomain[1])}
        fill="none"
        stroke={C.grid}
      />
      <clipPath id={clipId}>
        <rect
          x={s.x(xDomain[0])}
          y={s.y(yDomain[1])}
          width={s.x(xDomain[1]) - s.x(xDomain[0])}
          height={s.y(yDomain[0]) - s.y(yDomain[1])}
        />
      </clipPath>
      {/* Lines that run past the edges (a steep or diverging fit) are cut at the frame. */}
      <g clipPath={`url(#${clipId})`}>{children(s)}</g>
    </svg>
  );
};

// ---------------------------------------------------------------------------
// A small line chart for loss over time.

export const LossChart: React.FC<{
  values: number[];
  total?: number;
  label: string;
  /** Plot log10 of the values, for losses that fall by orders of magnitude. */
  log?: boolean;
  className?: string;
}> = ({ values, total, label, log = false, className }) => {
  const W = 240;
  const H = 110;
  const pad = { l: 8, r: 8, t: 10, b: 18 };
  const tr = (v: number) => (log ? Math.log10(Math.max(v, 1e-6)) : v);
  const vs = values.filter(Number.isFinite).map(tr);
  const n = Math.max(total ?? values.length, 2);
  const max = vs.length ? Math.max(...vs) : 1;
  const min = vs.length ? Math.min(...vs, log ? max - 1 : 0) : 0;
  const x = (i: number) => pad.l + (i / (n - 1)) * (W - pad.l - pad.r);
  const y = (v: number) => pad.t + (1 - (v - min) / (max - min || 1)) * (H - pad.t - pad.b);
  const d = vs.map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(" ");
  const last = vs.length - 1;
  return (
    <figure className={cn("m-0", className)}>
      <svg viewBox={`0 0 ${W} ${H}`} className="block h-auto w-full" role="img" aria-label={label}>
        <line x1={pad.l} x2={W - pad.r} y1={H - pad.b} y2={H - pad.b} stroke={C.grid} />
        {vs.length > 1 && (
          <>
            <path d={`${d} L${x(last)},${H - pad.b} L${x(0)},${H - pad.b} Z`} fill={C.teal} opacity={0.12} />
            <path d={d} fill="none" stroke={C.teal} strokeWidth={1.8} strokeLinejoin="round" />
          </>
        )}
        {vs.length > 0 && <circle cx={x(last)} cy={y(vs[last])} r={3} fill={C.teal} />}
        <text x={pad.l} y={H - 4} fontSize={9} fill={C.muted}>
          step 0
        </text>
        <text x={W - pad.r} y={H - 4} fontSize={9} fill={C.muted} textAnchor="end">
          {n - 1}
        </text>
      </svg>
      <figcaption className="mt-1 text-xs text-muted-foreground">{label}</figcaption>
    </figure>
  );
};

/** A label/value readout tile. */
export const Stat: React.FC<{ label: string; value: React.ReactNode; tone?: string }> = ({ label, value, tone }) => (
  <div className="rounded-xl border border-white/[0.06] bg-black/20 px-3 py-2">
    <dt className="text-[11px] text-muted-foreground">{label}</dt>
    <dd className="font-mono text-sm font-semibold tabular-nums text-foreground" style={tone ? { color: tone } : undefined}>
      {value}
    </dd>
  </div>
);

/** A row of segmented choice buttons (radio semantics). */
export function Segmented<T extends string | number>({
  label,
  value,
  options,
  onChange,
  disabled,
}: {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
  disabled?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <span className="block text-sm font-medium text-muted-foreground">{label}</span>
      <div role="radiogroup" aria-label={label} className="glass-pill inline-flex flex-wrap gap-1 !rounded-[1.4rem] p-1">
        {options.map((o) => (
          <button
            key={String(o.value)}
            type="button"
            role="radio"
            aria-checked={o.value === value}
            disabled={disabled}
            onClick={() => onChange(o.value)}
            className={cn(
              "min-h-9 rounded-full px-3.5 text-sm transition-colors disabled:opacity-50",
              o.value === value
                ? "bg-white/[0.14] font-medium text-foreground shadow-[inset_0_1px_0_hsl(0_0%_100%/0.15)]"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}
