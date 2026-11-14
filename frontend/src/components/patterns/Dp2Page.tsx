// Interview Patterns · 2-D Dynamic Programming (the fourteenth NeetCode 150 category).

import * as React from "react";
import { Link } from "react-router-dom";

import { DP2 } from "../../lib/patterns/dp2";
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

// Unique paths on a 3 × 4 grid, filled from the bottom-right.
const paths = [
  [10, 6, 3, 1],
  [4, 3, 2, 1],
  [1, 1, 1, 1],
];

const figures: ConceptFigure[] = [
  {
    title: "Two things change, so the table has two sides",
    caption: "When a subproblem is described by two numbers (a cell's row and column, a position in each of two strings), store the answers in a grid. Here each cell counts the paths from it to the corner.",
    art: (
      <Art label="A 3 by 4 grid of path counts, with the top-left cell 10 built from its right and lower neighbours">
        {paths.map((line, r) =>
          line.map((v, c) => <Cell key={`${r}${c}`} x={66 + c * S} y={22 + r * S} t={String(v)} tone={r === 0 && c === 0 ? C.teal : (r === 0 && c === 1) || (r === 1 && c === 0) ? C.amber : undefined} />),
        )}
        <text x={120} y={120} textAnchor="middle" fontSize={10} fill={C.fg}>10 = 6 (right) + 4 (down)</text>
      </Art>
    ),
  },
  {
    title: "Two strings: match or skip",
    caption: "For two strings, cell (i, j) answers the question for the rests from i and j. A matching pair of letters uses the diagonal; otherwise the cell takes the better of moving on in one string or the other.",
    art: (
      <Art label="A small table for two words with a diagonal arrow for a match and two arrows for a mismatch">
        <Arrowhead id="dp2-a" color={C.amber} />
        {["a", "c", "e"].map((t, c) => (
          <text key={t} x={66 + c * S + 11} y={18} textAnchor="middle" fontSize={10} fill={C.sky}>{t}</text>
        ))}
        {["a", "b", "c"].map((t, r) => (
          <text key={t} x={54} y={38 + r * S} textAnchor="middle" fontSize={10} fill={C.sky}>{t}</text>
        ))}
        {[
          [2, 1, 0],
          [1, 1, 0],
          [1, 1, 0],
        ].map((line, r) => line.map((v, c) => <Cell key={`${r}${c}`} x={66 + c * S} y={24 + r * S} t={String(v)} tone={r === 0 && c === 0 ? C.teal : r === 1 && c === 1 ? C.amber : undefined} />))}
        <path d="M89,46 L95,52" stroke={C.amber} markerEnd="url(#dp2-a)" />
        <text x={160} y={40} fontSize={9.5} fill={C.fg}>a = a:</text>
        <text x={160} y={54} fontSize={9.5} fill={C.fg}>1 + diagonal</text>
        <text x={160} y={84} fontSize={9.5} fill={C.muted}>b ≠ c:</text>
        <text x={160} y={98} fontSize={9.5} fill={C.muted}>max(right, down)</text>
      </Art>
    ),
  },
  {
    title: "Fill in an order that works",
    caption: "Each cell reads cells that must already be filled. Most of these tables fill from the bottom-right corner back to the top-left; interval problems like Burst Balloons fill short ranges before long ones.",
    art: (
      <Art label="A 4 by 4 grid with arrows sweeping from the bottom-right corner to the top-left">
        <Arrowhead id="dp2-b" color={C.teal} />
        {[0, 1, 2, 3].map((r) => [0, 1, 2, 3].map((c) => <Cell key={`${r}${c}`} x={70 + c * S} y={20 + r * S} t="" tone={r + c >= 5 ? C.green : undefined} />))}
        <path d="M180,118 C200,70 160,20 100,14" fill="none" stroke={C.teal} strokeDasharray="4 3" markerEnd="url(#dp2-b)" />
        <text x={120} y={140} textAnchor="middle" fontSize={9.5} fill={C.muted}>answer in the top-left, filled last</text>
      </Art>
    ),
  },
];

const linkCls = "text-primary underline-offset-2 hover:underline";

const Intro: React.FC = () => (
  <section aria-labelledby="dp2-pattern-title" className="space-y-4">
    <SectionTitle id="dp2-pattern-title" kicker="The pattern" title="2-D Dynamic Programming: a table of subproblems">
      <p>
        Same idea as 1-D DP, but each subproblem is described by two numbers: a cell of a grid, a position in each of two strings, a coin and an
        amount, or the ends of a range. The answers go in a 2-D table, filled in an order where every cell's inputs are ready.
      </p>
    </SectionTitle>
    <ConceptFigures figures={figures} />
    <div className="grid gap-3 md:grid-cols-2">
      <Surface variant="card" radius="2xl" className="min-w-0 space-y-2 p-4">
        <h3 className="font-semibold text-foreground">How to spot the table</h3>
        <ul className="list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-muted-foreground marker:text-primary">
          <li><span className="text-foreground">Two strings</span> (LCS, edit distance, regex): positions i and j.</li>
          <li><span className="text-foreground">A grid</span> (paths, increasing paths): the cell itself.</li>
          <li><span className="text-foreground">Items and a budget</span> (coins, target sums): which items are left and the amount.</li>
          <li><span className="text-foreground">A range that splits</span> (Burst Balloons): its two ends; think about the last operation.</li>
        </ul>
      </Surface>
      <Surface variant="card" radius="2xl" className="min-w-0 space-y-2 p-4">
        <h3 className="font-semibold text-foreground">Reading the pictures</h3>
        <ul className="list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-muted-foreground marker:text-primary">
          <li>The table is drawn as a grid; blue cells along the edges are the letters or values each row and column stands for (∅ is “nothing left”).</li>
          <li>Teal is the cell being filled, amber the cells it reads, green the answer.</li>
          <li>
            For an editable grid DP, see the <Link className={linkCls} to="/visualize/dynamicProgramming">Dynamic Programming</Link> visualizer.
          </li>
        </ul>
      </Surface>
    </div>
  </section>
);

const Dp2Page: React.FC = () => <PatternPage category="2-D Dynamic Programming" intro={<Intro />} problems={DP2} />;

export default Dp2Page;
