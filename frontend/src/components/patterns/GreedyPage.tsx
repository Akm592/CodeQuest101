// Interview Patterns · Greedy (the fifteenth NeetCode 150 category).

import * as React from "react";

import { GREEDY } from "../../lib/patterns/greedy";
import { C } from "../ml/colors";
import { SectionTitle } from "../ml/mathBlocks";
import { Art, Arrowhead, ConceptFigures, type ConceptFigure } from "../ml/shared";
import { Surface } from "../ui/surface";
import PatternPage from "./PatternPage";

const Box: React.FC<{ x: number; y: number; t: string; tone?: string }> = ({ x, y, t, tone }) => (
  <g>
    <rect x={x} y={y} width={24} height={24} rx={5} fill={tone ?? C.card} fillOpacity={tone ? 0.3 : 1} stroke={tone ?? C.grid} />
    <text x={x + 12} y={y + 16} textAnchor="middle" fontSize={10.5} fill={C.fg}>{t}</text>
  </g>
);

const kad = [-2, 1, -3, 4, -1, 2, 1];

const figures: ConceptFigure[] = [
  {
    title: "Make the locally best choice",
    caption: "A greedy algorithm commits to the choice that looks best right now and never revisits it. Kadane's algorithm drops the running sum the moment it turns negative: a negative start can only hurt.",
    art: (
      <Art label="An array where a negative prefix is dropped and the best subarray 4, -1, 2, 1 is highlighted">
        {kad.map((v, i) => (
          <Box key={i} x={26 + i * 27} y={52} t={String(v)} tone={i >= 3 ? C.green : C.idle} />
        ))}
        <text x={66} y={40} textAnchor="middle" fontSize={9.5} fill={C.muted}>dropped: sum went negative</text>
        <text x={160} y={100} textAnchor="middle" fontSize={9.5} fill={C.green}>best: 4 − 1 + 2 + 1 = 6</text>
      </Art>
    ),
  },
  {
    title: "Prove the choice is safe",
    caption: "Greedy is only correct when you can argue that some optimal answer agrees with your choice. In Jump Game, if an index can't reach the nearest good index, it can't reach a farther one either.",
    art: (
      <Art label="Indexes with a goal marker moving left as each index proves it can reach the goal">
        <Arrowhead id="gr-arr" color={C.green} />
        {[2, 3, 1, 1, 4].map((v, i) => (
          <Box key={i} x={40 + i * 34} y={60} t={String(v)} tone={i === 1 ? C.green : i > 1 ? C.idle : undefined} />
        ))}
        <path d="M188,56 C170,30 100,30 82,56" fill="none" stroke={C.green} strokeDasharray="4 3" markerEnd="url(#gr-arr)" />
        <text x={86} y={104} textAnchor="middle" fontSize={9.5} fill={C.green}>goal</text>
        <text x={120} y={128} textAnchor="middle" fontSize={9.5} fill={C.muted}>the goal moves left as indexes reach it</text>
      </Art>
    ),
  },
  {
    title: "When greedy fails, use DP",
    caption: "Greedy isn't always right: with coins 1, 3 and 4, the biggest-coin-first rule makes 6 as 4 + 1 + 1, but 3 + 3 is better. If you can't prove the greedy choice, try every choice with dynamic programming.",
    art: (
      <Art label="Two rows of coins: greedy 4, 1, 1 in red and the best 3, 3 in green">
        <text x={30} y={46} fontSize={9.5} fill={C.redText}>greedy</text>
        {["4", "1", "1"].map((v, i) => (
          <Box key={i} x={80 + i * 30} y={30} t={v} tone={C.red} />
        ))}
        <text x={30} y={96} fontSize={9.5} fill={C.green}>best</text>
        {["3", "3"].map((v, i) => (
          <Box key={i} x={80 + i * 30} y={80} t={v} tone={C.green} />
        ))}
        <text x={120} y={136} textAnchor="middle" fontSize={9.5} fill={C.muted}>amount 6 with coins 1, 3, 4</text>
      </Art>
    ),
  },
];

const Intro: React.FC = () => (
  <section aria-labelledby="gd-pattern-title" className="space-y-4">
    <SectionTitle id="gd-pattern-title" kicker="The pattern" title="Greedy: take the best step now, and never look back">
      <p>
        A greedy algorithm makes one locally best choice at a time and never undoes it. That makes it fast (usually one pass), but it's only
        correct when there's a reason the local choice can't hurt. Every problem here comes with that reason.
      </p>
    </SectionTitle>
    <ConceptFigures figures={figures} />
    <div className="grid gap-3 md:grid-cols-2">
      <Surface variant="card" radius="2xl" className="min-w-0 space-y-2 p-4">
        <h3 className="font-semibold text-foreground">How to spot it</h3>
        <ul className="list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-muted-foreground marker:text-primary">
          <li><span className="text-foreground">A running value with a reset rule</span>: best subarray, gas left in the tank.</li>
          <li><span className="text-foreground">A frontier</span>: the farthest reachable index, the nearest good index.</li>
          <li><span className="text-foreground">A forced choice</span>: the smallest card must start a group; a triplet that overshoots can never be used.</li>
          <li>If you can't explain why the choice is safe, it probably isn't: reach for DP.</li>
        </ul>
      </Surface>
      <Surface variant="card" radius="2xl" className="min-w-0 space-y-2 p-4">
        <h3 className="font-semibold text-foreground">Reading the pictures</h3>
        <ul className="list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-muted-foreground marker:text-primary">
          <li>Each problem is a row (or two) scanned once. Teal is the element being read; faded elements are done or ruled out.</li>
          <li>The variables card holds the running value the greedy rule updates.</li>
          <li>The brute force on the right tries every option, which is what the greedy argument lets you skip.</li>
        </ul>
      </Surface>
    </div>
  </section>
);

const GreedyPage: React.FC = () => <PatternPage category="Greedy" intro={<Intro />} problems={GREEDY} />;

export default GreedyPage;
