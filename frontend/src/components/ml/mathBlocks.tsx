// Shared building blocks for the "maths, step by step" sections.

import * as React from "react";

import { cn } from "../../lib/utils";
import { Surface } from "../ui/surface";
import { C } from "./colors";

/** A number to 4 decimals, with tiny values shown as 0. */
export const n4 = (v: number) => {
  const r = Math.abs(v) < 0.00005 ? 0 : v;
  return r.toFixed(4);
};

export const SectionTitle: React.FC<{ id: string; kicker: string; title: string; children?: React.ReactNode }> = ({ id, kicker, title, children }) => (
  <div className="space-y-2">
    <p className="text-xs font-semibold uppercase tracking-widest text-primary">{kicker}</p>
    <h2 id={id} className="scroll-mt-20 text-xl font-bold tracking-tight text-foreground sm:text-2xl">
      {title}
    </h2>
    {children && <div className="max-w-3xl text-sm leading-relaxed text-muted-foreground">{children}</div>}
  </div>
);

export const Step: React.FC<{ n: number; title: string; plain: React.ReactNode; children: React.ReactNode; tone?: "forward" | "backward" | "update" }> = ({
  n,
  title,
  plain,
  children,
  tone = "forward",
}) => (
  <Surface variant="card" radius="2xl" as="li" className="list-none space-y-3 p-4 sm:p-5">
    <div className="flex items-start gap-3">
      <span
        className={cn(
          "grid h-7 w-7 shrink-0 place-items-center rounded-full font-mono text-xs font-bold text-primary-foreground",
          tone === "forward" ? "bg-viz-current" : tone === "backward" ? "bg-viz-compare" : "bg-viz-found",
        )}
      >
        {n}
      </span>
      <div className="min-w-0 space-y-1">
        <h3 className="font-semibold text-foreground">{title}</h3>
        <div className="text-sm leading-relaxed text-muted-foreground">{plain}</div>
      </div>
    </div>
    <div className="space-y-1.5 overflow-x-auto rounded-xl border border-white/[0.06] bg-black/25 p-3 font-mono text-[13px] leading-relaxed text-foreground/90">
      {children}
    </div>
  </Surface>
);

/** One formula line: symbols, then the numbers plugged in, then the result. */

export const Eq: React.FC<{ lhs: React.ReactNode; rule?: React.ReactNode; nums?: string; result: number; accent?: string }> = ({ lhs, rule, nums, result, accent = C.teal }) => (
  <p className="whitespace-nowrap">
    <span className="text-foreground">{lhs}</span>
    {rule && <span className="text-muted-foreground"> = {rule}</span>}
    {nums && <span className="text-muted-foreground"> = {nums}</span>}
    <span> = </span>
    <span className="font-semibold" style={{ color: accent }}>
      {n4(result)}
    </span>
  </p>
);
