// Interview Patterns · 1-D Dynamic Programming (the thirteenth NeetCode 150 category).

import * as React from "react";
import { Link } from "react-router-dom";

import { DP1 } from "../../lib/patterns/dp1";
import { C } from "../ml/colors";
import { SectionTitle } from "../ml/mathBlocks";
import { Art, Arrowhead, ConceptFigures, type ConceptFigure } from "../ml/shared";
import { Surface } from "../ui/surface";
import PatternPage from "./PatternPage";

const Box: React.FC<{ x: number; y: number; t: string; tone?: string; w?: number }> = ({ x, y, t, tone, w = 28 }) => (
  <g>
    <rect x={x} y={y} width={w} height={24} rx={5} fill={tone ?? C.card} fillOpacity={tone ? 0.3 : 1} stroke={tone ?? C.grid} />
    <text x={x + w / 2} y={y + 16} textAnchor="middle" fontSize={10.5} fill={C.fg}>{t}</text>
  </g>
);

// The recursion tree of f(5), with repeated subproblems in amber.
const fib: [number, number, string][] = [
  [120, 14, "f5"],
  [70, 46, "f4"],
  [170, 46, "f3"],
  [45, 78, "f3"],
  [95, 78, "f2"],
  [150, 78, "f2"],
  [190, 78, "f1"],
  [30, 110, "f2"],
  [60, 110, "f1"],
];
const parent = [-1, 0, 0, 1, 1, 2, 2, 3, 3];

const figures: ConceptFigure[] = [
  {
    title: "The same question, asked again and again",
    caption: "Plain recursion for climbing stairs solves f(3) twice and f(2) three times, and it gets exponentially worse. Dynamic programming answers each smaller question once and remembers it.",
    art: (
      <Art label="A recursion tree for f(5) with the repeated calls f(3) and f(2) highlighted">
        {fib.slice(1).map(([x, y], i) => {
          const [px, py] = fib[parent[i + 1]];
          return <line key={i} x1={px} y1={py + 9} x2={x} y2={y - 9} stroke={C.grid} />;
        })}
        {fib.map(([x, y, t], i) => {
          const rep = t === "f3" || t === "f2";
          return (
            <g key={i}>
              <rect x={x - 14} y={y - 9} width={28} height={18} rx={5} fill={rep ? C.amber : C.card} fillOpacity={rep ? 0.3 : 1} stroke={rep ? C.amber : C.grid} />
              <text x={x} y={y + 4} textAnchor="middle" fontSize={10} fill={C.fg}>{t}</text>
            </g>
          );
        })}
        <text x={120} y={140} textAnchor="middle" fontSize={9.5} fill={C.amber}>amber: already solved elsewhere</text>
      </Art>
    ),
  },
  {
    title: "Fill a table in order",
    caption: "Write the answer for each smaller input in an array, in an order where everything an entry needs is already filled. Then each entry is a line of arithmetic on earlier ones.",
    art: (
      <Art label="An array 1, 1, 2, 3, 5, 8 where the last entry is built from the two before it with arrows">
        <Arrowhead id="dp1-a" color={C.amber} />
        {["1", "1", "2", "3", "5", "?"].map((v, i) => (
          <Box key={i} x={22 + i * 34} y={62} t={v === "?" ? "8" : v} tone={i === 5 ? C.teal : i >= 3 ? C.amber : C.green} />
        ))}
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <text key={i} x={36 + i * 34} y={100} textAnchor="middle" fontSize={9} fill={C.muted}>{i}</text>
        ))}
        <path d="M138,60 C148,26 190,26 200,58" fill="none" stroke={C.amber} markerEnd="url(#dp1-a)" />
        <path d="M172,60 C178,44 204,44 212,58" fill="none" stroke={C.amber} markerEnd="url(#dp1-a)" />
        <text x={120} y={128} textAnchor="middle" fontSize={10} fill={C.fg}>f(5) = f(4) + f(3) = 5 + 3</text>
      </Art>
    ),
  },
  {
    title: "Find the last decision",
    caption: "Most recurrences come from the last choice: the last step taken, rob this house or skip it, the last coin used. Each option points to a smaller problem you've already solved.",
    art: (
      <Art label="A house with two arrows: rob it and add best two back, or skip it and keep best one back">
        <Box x={40} y={30} t="best[i−2]" w={60} tone={C.sky} />
        <Box x={140} y={30} t="best[i−1]" w={60} tone={C.violet} />
        <Box x={90} y={96} t="best[i]" w={60} tone={C.teal} />
        <line x1={70} y1={56} x2={110} y2={94} stroke={C.sky} />
        <line x1={170} y1={56} x2={130} y2={94} stroke={C.violet} />
        <text x={14} y={80} fontSize={9.5} fill={C.sky}>rob:</text>
        <text x={14} y={92} fontSize={9.5} fill={C.sky}>+ nums[i]</text>
        <text x={156} y={84} fontSize={9.5} fill={C.violet}>skip</text>
        <text x={120} y={140} textAnchor="middle" fontSize={9.5} fill={C.fg}>take the max</text>
      </Art>
    ),
  },
];

const linkCls = "text-primary underline-offset-2 hover:underline";

const Intro: React.FC = () => (
  <section aria-labelledby="dp1-pattern-title" className="space-y-4">
    <SectionTitle id="dp1-pattern-title" kicker="The pattern" title="1-D Dynamic Programming: solve each smaller problem once">
      <p>
        Dynamic programming is recursion that remembers. When the answer for a big input is built from answers for smaller ones, and the same
        smaller ones keep coming up, store each answer in a table the first time. In these problems the table is a single row, indexed by
        position, amount or length.
      </p>
    </SectionTitle>
    <ConceptFigures figures={figures} />
    <div className="grid gap-3 md:grid-cols-2">
      <Surface variant="card" radius="2xl" className="min-w-0 space-y-2 p-4">
        <h3 className="font-semibold text-foreground">How to build the recurrence</h3>
        <ul className="list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-muted-foreground marker:text-primary">
          <li><span className="text-foreground">Define dp[i]</span> in words first: “the most money from the first i houses”, “ways to decode s[i:]”.</li>
          <li><span className="text-foreground">Look at the last choice</span> and write dp[i] from smaller entries (sum for counting, min or max for optimising).</li>
          <li><span className="text-foreground">Base cases</span> and a fill order where every entry's needs are ready.</li>
          <li><span className="text-foreground">Shrink the memory</span> if an entry only needs the last one or two.</li>
        </ul>
      </Surface>
      <Surface variant="card" radius="2xl" className="min-w-0 space-y-2 p-4">
        <h3 className="font-semibold text-foreground">Reading the pictures</h3>
        <ul className="list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-muted-foreground marker:text-primary">
          <li>The table is the bottom row. Teal is the entry being filled; amber are the entries it's built from; green are filled.</li>
          <li>The brute force on the right is the plain recursion: watch how many calls it needs compared with the table.</li>
          <li>
            For more DP with a grid, see the <Link className={linkCls} to="/visualize/dynamicProgramming">Dynamic Programming</Link> visualizer.
          </li>
        </ul>
      </Surface>
    </div>
  </section>
);

const Dp1Page: React.FC = () => <PatternPage category="1-D Dynamic Programming" intro={<Intro />} problems={DP1} />;

export default Dp1Page;
