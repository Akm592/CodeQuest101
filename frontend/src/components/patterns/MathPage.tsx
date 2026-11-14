// Interview Patterns · Math & Geometry (the seventeenth NeetCode 150 category).

import * as React from "react";
import { Link } from "react-router-dom";

import { MATH } from "../../lib/patterns/math";
import { C } from "../ml/colors";
import { SectionTitle } from "../ml/mathBlocks";
import { Art, Arrowhead, ConceptFigures, type ConceptFigure } from "../ml/shared";
import { Surface } from "../ui/surface";
import PatternPage from "./PatternPage";

const S = 26;
const Cell: React.FC<{ x: number; y: number; t: string; tone?: string }> = ({ x, y, t, tone }) => (
  <g>
    <rect x={x} y={y} width={S - 3} height={S - 3} rx={4} fill={tone ?? C.card} fillOpacity={tone ? 0.3 : 1} stroke={tone ?? C.grid} />
    <text x={x + (S - 3) / 2} y={y + 15} textAnchor="middle" fontSize={10} fill={C.fg}>{t}</text>
  </g>
);

const figures: ConceptFigure[] = [
  {
    title: "Cells move in cycles",
    caption: "Rotating a square moves each corner to the next one: top → right → bottom → left. Four cells form a cycle, so one saved value is enough to rotate them in place.",
    art: (
      <Art label="A 3 by 3 grid with the four corners highlighted and arrows going clockwise between them">
        <Arrowhead id="mg-a" color={C.amber} />
        {[0, 1, 2].map((r) => [0, 1, 2].map((c) => <Cell key={`${r}${c}`} x={82 + c * S} y={34 + r * S} t={String(r * 3 + c + 1)} tone={(r === 0 || r === 2) && (c === 0 || c === 2) ? C.amber : undefined} />))}
        <path d="M108,30 C130,14 150,14 160,30" fill="none" stroke={C.amber} markerEnd="url(#mg-a)" />
        <path d="M168,96 C178,104 176,108 166,112" fill="none" stroke={C.amber} markerEnd="url(#mg-a)" />
        <path d="M152,118 C130,130 106,130 96,116" fill="none" stroke={C.amber} markerEnd="url(#mg-a)" />
        <path d="M78,56 C68,48 70,40 80,36" fill="none" stroke={C.amber} markerEnd="url(#mg-a)" />
      </Art>
    ),
  },
  {
    title: "Halve the work",
    caption: "x^10 = (x^5)², and x^5 = (x^2)² × x. Squaring halves the exponent each time, so a power takes O(log n) multiplications instead of n.",
    art: (
      <Art label="A chain 10, 5, 2, 1, 0 with arrows labelled squared">
        {["10", "5", "2", "1", "0"].map((t, i) => (
          <g key={t}>
            <circle cx={36 + i * 42} cy={64} r={15} fill={C.teal} fillOpacity={0.25} stroke={C.teal} />
            <text x={36 + i * 42} y={68} textAnchor="middle" fontSize={11} fill={C.fg}>{t}</text>
            {i < 4 && <text x={57 + i * 42} y={50} textAnchor="middle" fontSize={9} fill={C.muted}>÷2</text>}
          </g>
        ))}
        <text x={120} y={112} textAnchor="middle" fontSize={10} fill={C.fg}>4 squarings instead of 10 multiplications</text>
      </Art>
    ),
  },
  {
    title: "Arithmetic by hand, digit by digit",
    caption: "Numbers too long for the machine are lists of digits. Add or multiply them the way you would on paper, carrying from right to left.",
    art: (
      <Art label="Long multiplication of 12 by 34 laid out on paper with a carry">
        <text x={150} y={34} textAnchor="end" fontSize={14} fontFamily="ui-monospace, monospace" fill={C.fg}>12</text>
        <text x={150} y={54} textAnchor="end" fontSize={14} fontFamily="ui-monospace, monospace" fill={C.fg}>× 34</text>
        <line x1={96} x2={154} y1={62} y2={62} stroke={C.muted} />
        <text x={150} y={82} textAnchor="end" fontSize={14} fontFamily="ui-monospace, monospace" fill={C.muted}>48</text>
        <text x={140} y={100} textAnchor="end" fontSize={14} fontFamily="ui-monospace, monospace" fill={C.muted}>36</text>
        <line x1={96} x2={154} y1={108} y2={108} stroke={C.muted} />
        <text x={150} y={128} textAnchor="end" fontSize={14} fontFamily="ui-monospace, monospace" fill={C.green}>408</text>
      </Art>
    ),
  },
];

const linkCls = "text-primary underline-offset-2 hover:underline";

const Intro: React.FC = () => (
  <section aria-labelledby="mg-pattern-title" className="space-y-4">
    <SectionTitle id="mg-pattern-title" kicker="The pattern" title="Math & Geometry: a little insight, then careful bookkeeping">
      <p>
        These problems don't share one algorithm. Each has a small mathematical idea (cells move in cycles of four, squaring halves an
        exponent, a square is fixed by its diagonal) and then needs careful index bookkeeping. The pictures show the bookkeeping step by step.
      </p>
    </SectionTitle>
    <ConceptFigures figures={figures} />
    <div className="grid gap-3 md:grid-cols-2">
      <Surface variant="card" radius="2xl" className="min-w-0 space-y-2 p-4">
        <h3 className="font-semibold text-foreground">Ideas worth remembering</h3>
        <ul className="list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-muted-foreground marker:text-primary">
          <li><span className="text-foreground">Matrix walks</span>: four shrinking bounds (spiral) or rings from the outside in (rotation).</li>
          <li><span className="text-foreground">In place</span>: record first, change second (set zeroes), or rotate cycles with one saved value.</li>
          <li><span className="text-foreground">Repeated operations</span>: square-and-multiply for powers; a visited set or fast/slow pointers for sequences that might loop.</li>
          <li><span className="text-foreground">Big numbers</span>: digit lists and carries.</li>
        </ul>
      </Surface>
      <Surface variant="card" radius="2xl" className="min-w-0 space-y-2 p-4">
        <h3 className="font-semibold text-foreground">Reading the pictures</h3>
        <ul className="list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-muted-foreground marker:text-primary">
          <li>Teal cells are being changed now; green ones are done; amber ones were just written to.</li>
          <li>
            Bigger interactive versions: <Link className={linkCls} to="/visualize/rotateImage">Rotate Image</Link> and{" "}
            <Link className={linkCls} to="/visualize/spiralMatrix">Spiral Matrix</Link>.
          </li>
        </ul>
      </Surface>
    </div>
  </section>
);

const MathPage: React.FC = () => <PatternPage category="Math & Geometry" intro={<Intro />} problems={MATH} />;

export default MathPage;
