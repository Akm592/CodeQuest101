// Interview Patterns · Two Pointers (the second NeetCode 150 category).

import * as React from "react";
import { Link } from "react-router-dom";

import { TWO_POINTERS } from "../../lib/patterns/twoPointers";
import { C } from "../ml/colors";
import { SectionTitle } from "../ml/mathBlocks";
import { Art, Arrowhead, ConceptFigures, type ConceptFigure } from "../ml/shared";
import { Surface } from "../ui/surface";
import PatternPage from "./PatternPage";

const Box: React.FC<{ x: number; y: number; t: string; tone?: string; faded?: boolean }> = ({ x, y, t, tone, faded }) => (
  <g opacity={faded ? 0.35 : 1}>
    <rect x={x} y={y} width={24} height={22} rx={5} fill={tone ?? C.card} fillOpacity={tone ? 0.25 : 1} stroke={tone ?? C.grid} />
    <text x={x + 12} y={y + 15} textAnchor="middle" fontSize={11} fill={C.fg}>{t}</text>
    {faded && <line x1={x + 3} x2={x + 21} y1={y + 19} y2={y + 3} stroke={C.red} strokeWidth={1.5} />}
  </g>
);

const SORTED = [1, 3, 4, 5, 7, 10, 11];

const figures: ConceptFigure[] = [
  {
    title: "Start at both ends",
    caption: "One pointer at the smallest value, one at the largest. Each step moves one of them inwards, so the whole thing takes at most n steps.",
    art: (
      <Art label="A sorted row of numbers with L at the left end and R at the right end, arrows pointing inwards">
        <Arrowhead id="tp-in" color={C.teal} />
        {SORTED.map((v, i) => (
          <Box key={i} x={22 + i * 29} y={60} t={String(v)} tone={i === 0 || i === SORTED.length - 1 ? C.teal : undefined} />
        ))}
        <text x={34} y={104} textAnchor="middle" fontSize={11} fill={C.teal}>L</text>
        <text x={208} y={104} textAnchor="middle" fontSize={11} fill={C.teal}>R</text>
        <path d="M34,48 C60,30 90,30 110,40" fill="none" stroke={C.teal} strokeWidth={1.5} markerEnd="url(#tp-in)" />
        <path d="M208,48 C182,30 152,30 132,40" fill="none" stroke={C.teal} strokeWidth={1.5} markerEnd="url(#tp-in)" />
        <text x={120} y={132} textAnchor="middle" fontSize={11} fill={C.fg}>walk towards each other</text>
      </Art>
    ),
  },
  {
    title: "Every move rules one out",
    caption: "Target 9: 1 + 11 = 12 is too big. 11 is too big even with the smallest number, so it can't be in any answer: cross it out and move R.",
    art: (
      <Art label="The same row with 11 crossed out because 1 plus 11 is already too big">
        {SORTED.map((v, i) => (
          <Box key={i} x={22 + i * 29} y={50} t={String(v)} tone={i === 0 ? C.teal : i === 5 ? C.teal : undefined} faded={i === 6} />
        ))}
        <text x={34} y={94} textAnchor="middle" fontSize={11} fill={C.teal}>L</text>
        <text x={179} y={94} textAnchor="middle" fontSize={11} fill={C.teal}>R</text>
        <text x={120} y={30} textAnchor="middle" fontSize={11} fill={C.redText}>1 + 11 = 12 &gt; 9</text>
        <text x={120} y={124} textAnchor="middle" fontSize={11} fill={C.fg}>sum too big → R moves left</text>
        <text x={120} y={140} textAnchor="middle" fontSize={11} fill={C.fg}>sum too small → L moves right</text>
      </Art>
    ),
  },
  {
    title: "Move the side that limits you",
    caption: "For walls and water, the shorter wall caps the level. Keeping it while the width shrinks can't help, so the shorter side is the one to move.",
    art: (
      <Art label="Two walls of different heights with water between them up to the shorter wall; an arrow moves the shorter wall inwards">
        <Arrowhead id="tp-wall" color={C.amber} />
        <rect x={40} y={118 - 50} width={14} height={50} rx={2} fill={C.amber} opacity={0.85} />
        <rect x={190} y={118 - 90} width={14} height={90} rx={2} fill={C.teal} opacity={0.85} />
        <rect x={54} y={118 - 50} width={136} height={50} fill={C.sky} fillOpacity={0.25} />
        <line x1={20} x2={222} y1={118} y2={118} stroke={C.grid} />
        <path d="M50,58 C64,40 84,40 96,52" fill="none" stroke={C.amber} strokeWidth={1.5} markerEnd="url(#tp-wall)" />
        <text x={122} y={100} textAnchor="middle" fontSize={11} fill={C.fg}>level = shorter wall</text>
        <text x={120} y={140} textAnchor="middle" fontSize={11} fill={C.amber}>move the shorter wall</text>
      </Art>
    ),
  },
];

const Intro: React.FC = () => (
  <section aria-labelledby="tp-pattern-title" className="space-y-4">
    <SectionTitle id="tp-pattern-title" kicker="The pattern" title="Two Pointers: two indices that close in on the answer">
      <p>
        Instead of trying every pair (O(n²)), keep two indices and move them based on what you see. The trick is always the same argument: one of the
        two values can't be part of any better answer, so it's safe to step past it for good. That turns n² pairs into n steps.
      </p>
    </SectionTitle>
    <ConceptFigures figures={figures} />
    <div className="grid gap-3 md:grid-cols-2">
      <Surface variant="card" radius="2xl" className="space-y-2 p-4">
        <h3 className="font-semibold text-foreground">How to spot it</h3>
        <ul className="list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-muted-foreground marker:text-primary">
          <li>The input is sorted (or sorting it is allowed) and you need a pair or triplet with some sum.</li>
          <li>“Palindrome”, “reverse”, “mirror”: compare from both ends.</li>
          <li>Maximise something that depends on the distance between two positions and the smaller of their values.</li>
          <li>“In place, O(1) extra memory”: two indices instead of a hash map.</li>
        </ul>
      </Surface>
      <Surface variant="card" radius="2xl" className="space-y-2 p-4">
        <h3 className="font-semibold text-foreground">Three shapes of two pointers</h3>
        <ul className="list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-muted-foreground marker:text-primary">
          <li>
            <span className="text-foreground">Opposite ends, moving inwards</span>: every problem on this page.
          </li>
          <li>
            <span className="text-foreground">Fast and slow</span>: one moves twice as fast, as in{" "}
            <Link className="text-primary underline-offset-2 hover:underline" to="/visualize/hareTortoise">
              Floyd's cycle detection
            </Link>
            .
          </li>
          <li>
            <span className="text-foreground">Both from the left, as a window</span>: that's the Sliding Window pattern, NeetCode's next category.
          </li>
        </ul>
      </Surface>
    </div>
  </section>
);

const TwoPointersPage: React.FC = () => <PatternPage category="Two Pointers" intro={<Intro />} problems={TWO_POINTERS} />;

export default TwoPointersPage;
