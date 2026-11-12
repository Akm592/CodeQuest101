// Interview Patterns · Binary Search (the fifth NeetCode 150 category).

import * as React from "react";
import { Link } from "react-router-dom";

import { BINARY_SEARCH } from "../../lib/patterns/binarySearch";
import { C } from "../ml/colors";
import { SectionTitle } from "../ml/mathBlocks";
import { Art, ConceptFigures, type ConceptFigure } from "../ml/shared";
import { Surface } from "../ui/surface";
import PatternPage from "./PatternPage";

const Box: React.FC<{ x: number; y: number; t: string; tone?: string; faded?: boolean; w?: number }> = ({ x, y, t, tone, faded, w = 22 }) => (
  <g opacity={faded ? 0.3 : 1}>
    <rect x={x} y={y} width={w} height={22} rx={5} fill={tone ?? C.card} fillOpacity={tone ? 0.25 : 1} stroke={tone ?? C.grid} />
    <text x={x + w / 2} y={y + 15} textAnchor="middle" fontSize={10.5} fill={C.fg}>{t}</text>
  </g>
);

const SORTED = [2, 5, 8, 12, 16, 23, 31, 37, 42];
const ROT = [15, 18, 22, 27, 2, 5, 9, 12];

const figures: ConceptFigure[] = [
  {
    title: "Halve what's left",
    caption: "Looking for 31 in a sorted list: the middle is 16, too small. Everything left of it is even smaller, so half the list is ruled out in one comparison. n numbers take about log₂ n steps.",
    art: (
      <Art label="A sorted row with the middle 16 marked; the left half including 16 is greyed out">
        {SORTED.map((v, i) => (
          <Box key={i} x={14 + i * 24.5} y={50} t={String(v)} tone={i === 4 ? C.amber : i === 6 ? C.green : undefined} faded={i < 4} />
        ))}
        <text x={14 + 4 * 24.5 + 11} y={40} textAnchor="middle" fontSize={10} fill={C.amber}>M</text>
        <text x={120} y={26} textAnchor="middle" fontSize={11} fill={C.fg}>find 31: 16 &lt; 31</text>
        <text x={120} y={100} textAnchor="middle" fontSize={11} fill={C.muted}>9 → 4 → 2 → 1 candidates</text>
        <text x={120} y={122} textAnchor="middle" fontSize={11} fill={C.green}>a million numbers: ~20 steps</text>
      </Art>
    ),
  },
  {
    title: "Binary search on the answer",
    caption: "There's no list in Koko Eating Bananas, but “is speed k fast enough?” is no for every small k and yes from the answer on. One switch-over is all binary search needs.",
    art: (
      <Art label="Speeds 1 to 9; speeds 1 to 3 are marked no, 4 to 9 are marked yes; the first yes is the answer">
        {Array.from({ length: 9 }, (_, i) => (
          <g key={i}>
            <Box x={14 + i * 24.5} y={48} t={String(i + 1)} tone={i < 3 ? C.red : i === 3 ? C.green : C.teal} />
            <text x={25 + i * 24.5} y={88} textAnchor="middle" fontSize={10} fill={i < 3 ? C.redText : C.green}>{i < 3 ? "no" : "yes"}</text>
          </g>
        ))}
        <text x={120} y={30} textAnchor="middle" fontSize={11} fill={C.fg}>fast enough at speed k?</text>
        <text x={25 + 3 * 24.5} y={112} textAnchor="middle" fontSize={11} fill={C.green}>↑ answer: the first yes</text>
      </Art>
    ),
  },
  {
    title: "Which half is sorted?",
    caption: "A rotated list isn't sorted, but wherever M lands, one side of it is. Check whether the target fits inside that sorted side; if not, it's on the other side.",
    art: (
      <Art label="A rotated list 15 18 22 27 2 5 9 12 with the middle 27; the left side 15 to 27 is sorted and highlighted">
        {ROT.map((v, i) => (
          <Box key={i} x={22 + i * 25} y={52} t={String(v)} tone={i === 3 ? C.amber : i < 3 ? C.sky : undefined} />
        ))}
        <text x={22 + 3 * 25 + 11} y={42} textAnchor="middle" fontSize={10} fill={C.amber}>M</text>
        <path d="M22,84 L119,84" stroke={C.sky} strokeWidth={1.5} />
        <text x={70} y={100} textAnchor="middle" fontSize={10} fill={C.sky}>sorted: 15..27</text>
        <text x={120} y={26} textAnchor="middle" fontSize={11} fill={C.fg}>find 5</text>
        <text x={120} y={126} textAnchor="middle" fontSize={11} fill={C.green}>5 isn't in 15..27 → go right</text>
      </Art>
    ),
  },
];

const linkCls = "text-primary underline-offset-2 hover:underline";

const Intro: React.FC = () => (
  <section aria-labelledby="bs-pattern-title" className="space-y-4">
    <SectionTitle id="bs-pattern-title" kicker="The pattern" title="Binary Search: rule out half with every question">
      <p>
        If one comparison can tell you which half the answer is in, you can throw the other half away. Repeat, and n candidates shrink to one in
        about log₂ n steps. The list doesn't even have to exist: any yes/no question whose answer switches once (all no, then all yes) can be
        binary searched.
      </p>
    </SectionTitle>
    <ConceptFigures figures={figures} />
    <div className="grid gap-3 md:grid-cols-2">
      <Surface variant="card" radius="2xl" className="min-w-0 space-y-2 p-4">
        <h3 className="font-semibold text-foreground">How to spot it</h3>
        <ul className="list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-muted-foreground marker:text-primary">
          <li>The input is sorted (or sorted with a twist, like a rotation) and you need to find something.</li>
          <li>The problem asks for O(log n).</li>
          <li>“Minimum speed / capacity / time such that …”: binary search on the answer.</li>
          <li>“Latest record at or before t”, “largest value ≤ x”: a search that remembers its last match.</li>
        </ul>
      </Surface>
      <Surface variant="card" radius="2xl" className="min-w-0 space-y-2 p-4">
        <h3 className="font-semibold text-foreground">The template (Python)</h3>
        <pre className="overflow-x-auto rounded-xl border border-white/10 bg-white/[0.03] p-3 font-mono text-[12.5px] leading-relaxed text-muted-foreground">
{`l, r = lo, hi
while l <= r:
    m = (l + r) // 2
    if ok(m):        # m works: remember it,
        best = m     # then look for a smaller one
        r = m - 1
    else:
        l = m + 1
return best`}
        </pre>
        <p className="text-xs leading-relaxed text-muted-foreground">
          This finds the first m that works (Koko). Exact searches add an early return when nums[m] is the target, and Time Map flips it to find the last m that works. For the basic search on its own, see the{" "}
          <Link className={linkCls} to="/visualize/binarySearch">
            Binary Search visualizer
          </Link>
          .
        </p>
      </Surface>
    </div>
  </section>
);

const BinarySearchPage: React.FC = () => <PatternPage category="Binary Search" intro={<Intro />} problems={BINARY_SEARCH} />;

export default BinarySearchPage;
