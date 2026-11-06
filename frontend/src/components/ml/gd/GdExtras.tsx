// Learning-rate schedules, common problems, and which optimizer to use.

import * as React from "react";

import { SCHEDULES, type ScheduleKey } from "../../../lib/ml/optimizers";
import { Surface } from "../../ui/surface";
import { C } from "../colors";
import { SectionTitle } from "../mathBlocks";

const SCHEDULE_COLORS: Record<ScheduleKey, string> = { constant: C.muted, step: C.teal, exponential: C.amber, inverse: C.violet };

export const Schedules: React.FC = () => {
  const W = 480;
  const H = 220;
  const pad = { l: 40, r: 12, t: 12, b: 28 };
  const T = 40;
  const lr0 = 0.1;
  const x = (t: number) => pad.l + (t / T) * (W - pad.l - pad.r);
  const y = (v: number) => pad.t + (1 - v / lr0) * (H - pad.t - pad.b);
  return (
    <section aria-labelledby="gd-sched-title" className="space-y-4">
      <SectionTitle id="gd-sched-title" kicker="Changing the step size over time" title="Learning rate schedules">
        <p>
          Big steps help early, when you're far from the bottom. Near the bottom they make you overshoot, and with mini-batches the noise keeps
          you jittering. A schedule starts with a larger learning rate and lowers it as training goes on. Three common ones:
        </p>
      </SectionTitle>
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_19rem]">
        <Surface variant="card" radius="2xl" className="min-w-0 p-4">
          <svg viewBox={`0 0 ${W} ${H}`} className="block h-auto w-full" role="img" aria-label="Four learning rate schedules over 40 epochs">
            {[0, 0.025, 0.05, 0.075, 0.1].map((v) => (
              <g key={v}>
                <line x1={pad.l} x2={W - pad.r} y1={y(v)} y2={y(v)} stroke={C.grid} strokeWidth={0.6} />
                <text x={pad.l - 6} y={y(v) + 3} textAnchor="end" fontSize={10} fill={C.muted}>
                  {v}
                </text>
              </g>
            ))}
            {[0, 10, 20, 30, 40].map((t) => (
              <text key={t} x={x(t)} y={H - 10} textAnchor="middle" fontSize={10} fill={C.muted}>
                {t}
              </text>
            ))}
            <text x={W - pad.r} y={H - 10} textAnchor="end" fontSize={10} fill={C.muted} dy={-12}>
              epoch →
            </text>
            {(Object.keys(SCHEDULES) as ScheduleKey[]).map((k) => {
              // Sampled finely so step decay drops straight down instead of slanting.
              const d = Array.from({ length: T * 20 + 1 }, (_, i) => i / 20).map((t, i) => `${i ? "L" : "M"}${x(t).toFixed(1)},${y(SCHEDULES[k].lr(lr0, t)).toFixed(1)}`).join(" ");
              return <path key={k} d={d} fill="none" stroke={SCHEDULE_COLORS[k]} strokeWidth={2.2} strokeDasharray={k === "constant" ? "5 4" : undefined} />;
            })}
          </svg>
        </Surface>
        <Surface variant="card" radius="2xl" className="space-y-3 p-4">
          {(Object.keys(SCHEDULES) as ScheduleKey[]).map((k) => (
            <div key={k}>
              <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: SCHEDULE_COLORS[k] }} />
                {SCHEDULES[k].label}
              </p>
              <p className="font-mono text-xs text-muted-foreground">{SCHEDULES[k].rule}</p>
            </div>
          ))}
          <p className="text-xs leading-relaxed text-muted-foreground">
            Starting from 0.1. Step decay is the simplest and a common choice, for example halving the rate every few epochs or dividing it by 10
            every 20. An epoch is one full pass through the training data.
          </p>
        </Surface>
      </div>
    </section>
  );
};

const PROBLEMS: { title: string; body: string; tryIt: string }[] = [
  {
    title: "Local minima",
    body: "A dip that isn't the lowest point. Plain descent stops in whichever dip it reaches first, because every direction there is uphill.",
    tryIt: "Map view, “Two valleys”: plain descent at learning rate 0.05 stops in the shallower valley; with momentum it rolls on into the deeper one.",
  },
  {
    title: "Saddle points",
    body: "Flat in the middle, downhill one way and uphill the other, like a horse saddle. The slope is almost 0, so steps become tiny. In big networks, research suggests saddle points slow training down more often than local minima.",
    tryIt: "Race, “Saddle point”: plain descent hangs around the middle for about 40 steps; Adam and AdaGrad hardly pause.",
  },
  {
    title: "Narrow valleys",
    body: "Steep across and gentle along. The steep side limits how big the step can be, and with that small step the gentle side takes forever. This often happens when inputs have very different scales.",
    tryIt: "Map view, “Narrow valley”, or the race: compare Plain with Momentum and Adam.",
  },
  {
    title: "Feature scaling",
    body: "If one input is in the thousands and another is between 0 and 1, the error surface becomes a narrow valley. Rescaling inputs to similar ranges (for example, subtracting the mean and dividing by the standard deviation) makes it rounder, so plain descent works much better.",
    tryIt: "The Linear Regression page does exactly this before fitting.",
  },
];

export const Problems: React.FC = () => (
  <section aria-labelledby="gd-problems-title" className="space-y-4">
    <SectionTitle id="gd-problems-title" kicker="When it goes wrong" title="Common problems, and what helps" />
    <div className="grid gap-3 md:grid-cols-2">
      {PROBLEMS.map((p) => (
        <Surface key={p.title} variant="card" radius="2xl" className="space-y-2 p-4">
          <h3 className="font-semibold text-foreground">{p.title}</h3>
          <p className="text-sm leading-relaxed text-muted-foreground">{p.body}</p>
          <p className="text-xs leading-relaxed text-primary">Try it: {p.tryIt}</p>
        </Surface>
      ))}
    </div>
  </section>
);

export const WhichToUse: React.FC = () => (
  <section aria-labelledby="gd-which-title" className="space-y-4">
    <SectionTitle id="gd-which-title" kicker="In practice" title="Which one should I use?" />
    <Surface variant="card" radius="2xl" className="space-y-3 p-4 sm:p-5">
      <ul className="list-disc space-y-2 pl-5 text-sm leading-relaxed text-muted-foreground marker:text-primary">
        <li>
          <span className="font-medium text-foreground">Start with Adam</span> (or AdamW) at its default settings. Stanford's CS231n course
          recommends it as the default, and it needs the least tuning.
        </li>
        <li>
          <span className="font-medium text-foreground">Try SGD with momentum or Nesterov</span> as the alternative. With a well-tuned learning
          rate and a schedule, it's the other widely used choice.
        </li>
        <li>
          <span className="font-medium text-foreground">Use mini-batches</span> (commonly 50 to 256 examples), and shuffle the data each
          epoch.
        </li>
        <li>
          <span className="font-medium text-foreground">Tune the learning rate first.</span> It's the setting that makes the biggest difference
          on every page here: if the loss goes up or jumps around, it's too big; if it barely moves, it's too small.
        </li>
      </ul>
    </Surface>
  </section>
);
