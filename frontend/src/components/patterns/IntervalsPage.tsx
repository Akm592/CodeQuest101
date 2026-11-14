// Interview Patterns · Intervals (the sixteenth NeetCode 150 category).

import * as React from "react";

import { INTERVALS } from "../../lib/patterns/intervals";
import { C } from "../ml/colors";
import { SectionTitle } from "../ml/mathBlocks";
import { Art, ConceptFigures, type ConceptFigure } from "../ml/shared";
import { Surface } from "../ui/surface";
import PatternPage from "./PatternPage";

const U = 14; // px per unit
const X0 = 24;
const Bar: React.FC<{ a: number; b: number; y: number; tone: string; label?: string }> = ({ a, b, y, tone, label }) => (
  <g>
    <rect x={X0 + a * U} y={y} width={(b - a) * U} height={14} rx={4} fill={tone} fillOpacity={0.3} stroke={tone} />
    {label && (
      <text x={X0 + ((a + b) / 2) * U} y={y + 11} textAnchor="middle" fontSize={9} fill={C.fg}>{label}</text>
    )}
  </g>
);

const figures: ConceptFigure[] = [
  {
    title: "Sort by start first",
    caption: "Once intervals are sorted by start, any overlap is between neighbours: an interval can only overlap the last one you kept. Almost every interval problem begins with this sort.",
    art: (
      <Art label="Four intervals sorted by start; two neighbouring pairs overlap and merge">
        <Bar a={1} b={3} y={20} tone={C.sky} label="1–3" />
        <Bar a={2} b={6} y={40} tone={C.sky} label="2–6" />
        <Bar a={8} b={10} y={60} tone={C.violet} label="8–10" />
        <Bar a={9} b={12} y={80} tone={C.violet} label="9–12" />
        <Bar a={1} b={6} y={112} tone={C.green} label="1–6" />
        <Bar a={8} b={12} y={112} tone={C.green} label="8–12" />
        <text x={X0} y={140} fontSize={9.5} fill={C.green}>merged</text>
      </Art>
    ),
  },
  {
    title: "Overlap means: each starts before the other ends",
    caption: "Two intervals [a, b] and [c, d] overlap exactly when a < d and c < b (or ≤, if touching counts). Check the problem: in some, [1,2] and [2,3] overlap; in others they don't.",
    art: (
      <Art label="Two overlapping bars and two touching bars">
        <Bar a={1} b={6} y={28} tone={C.amber} label="a … b" />
        <Bar a={4} b={10} y={48} tone={C.amber} label="c … d" />
        <text x={X0 + 11 * U} y={48} fontSize={9.5} fill={C.amber}>overlap</text>
        <Bar a={1} b={5} y={92} tone={C.sky} />
        <Bar a={5} b={9} y={112} tone={C.sky} />
        <text x={X0 + 10 * U} y={112} fontSize={9.5} fill={C.sky}>touching</text>
      </Art>
    ),
  },
  {
    title: "Sweep through events",
    caption: "For “how many at once”, only the moments intervals start and end matter. Sort those events and sweep: +1 at a start, −1 at an end. The peak is the number of rooms needed.",
    art: (
      <Art label="Three overlapping meetings with a vertical line where three are going on at once">
        <Bar a={1} b={8} y={22} tone={C.sky} />
        <Bar a={3} b={10} y={42} tone={C.sky} />
        <Bar a={5} b={12} y={62} tone={C.sky} />
        <Bar a={9} b={13} y={82} tone={C.sky} />
        <line x1={X0 + 6 * U} x2={X0 + 6 * U} y1={14} y2={104} stroke={C.amber} strokeWidth={2} />
        <text x={X0 + 6 * U} y={122} textAnchor="middle" fontSize={9.5} fill={C.amber}>3 at once here</text>
      </Art>
    ),
  },
];

const Intro: React.FC = () => (
  <section aria-labelledby="iv-pattern-title" className="space-y-4">
    <SectionTitle id="iv-pattern-title" kicker="The pattern" title="Intervals: sort them, then sweep">
      <p>
        Interval problems are about ranges on a line: meetings, bookings, segments. The trick is nearly always the same: sort (usually by start),
        then make one pass, comparing each interval only with the last one you kept, or sweeping through start and end events.
      </p>
    </SectionTitle>
    <ConceptFigures figures={figures} />
    <div className="grid gap-3 md:grid-cols-2">
      <Surface variant="card" radius="2xl" className="min-w-0 space-y-2 p-4">
        <h3 className="font-semibold text-foreground">How to spot which sweep</h3>
        <ul className="list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-muted-foreground marker:text-primary">
          <li><span className="text-foreground">Merge or insert</span>: sort by start, extend the last kept interval.</li>
          <li><span className="text-foreground">Fewest removals / most kept</span>: keep the interval that ends earliest.</li>
          <li><span className="text-foreground">How many at once</span>: sweep sorted start and end times (or a heap of end times).</li>
          <li><span className="text-foreground">Many queries</span>: sort the queries too and sweep both together.</li>
        </ul>
      </Surface>
      <Surface variant="card" radius="2xl" className="min-w-0 space-y-2 p-4">
        <h3 className="font-semibold text-foreground">Reading the pictures</h3>
        <ul className="list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-muted-foreground marker:text-primary">
          <li>Each interval is a bar on its own lane, against a shared number line along the top.</li>
          <li>Teal is the interval being read; green is in the result; red is removed or clashing; faded is absorbed or done.</li>
          <li>A vertical line marks the moment or query point being processed.</li>
        </ul>
      </Surface>
    </div>
  </section>
);

const IntervalsPage: React.FC = () => <PatternPage category="Intervals" intro={<Intro />} problems={INTERVALS} />;

export default IntervalsPage;
