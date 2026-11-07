// Interview Patterns · Sliding Window (the third NeetCode 150 category).

import * as React from "react";
import { Link } from "react-router-dom";

import { SLIDING_WINDOW } from "../../lib/patterns/slidingWindow";
import { C } from "../ml/colors";
import { SectionTitle } from "../ml/mathBlocks";
import { Art, Arrowhead, ConceptFigures, type ConceptFigure } from "../ml/shared";
import { Surface } from "../ui/surface";
import PatternPage from "./PatternPage";

const Box: React.FC<{ x: number; y: number; t: string; tone?: string; faded?: boolean }> = ({ x, y, t, tone, faded }) => (
  <g opacity={faded ? 0.4 : 1}>
    <rect x={x} y={y} width={24} height={22} rx={5} fill={tone ?? C.card} fillOpacity={tone ? 0.25 : 1} stroke={tone ?? C.grid} />
    <text x={x + 12} y={y + 15} textAnchor="middle" fontSize={11} fill={C.fg}>{t}</text>
  </g>
);

const ROW = [2, 7, 1, 8, 2, 8, 4];
const x0 = (i: number) => 22 + i * 29;

const figures: ConceptFigure[] = [
  {
    title: "Slide, don't recount",
    caption: "Moving a window of 3 one step changes just two things: one number leaves on the left, one arrives on the right. Update the sum or counts for those two instead of starting again.",
    art: (
      <Art label="A row of seven numbers with a window of three; the window moves one step, the left number leaves and a new one enters">
        {ROW.map((v, i) => (
          <Box key={i} x={x0(i)} y={52} t={String(v)} tone={i === 1 ? C.red : i === 4 ? C.green : i >= 2 && i <= 3 ? C.sky : undefined} />
        ))}
        <rect x={x0(1) - 3} y={46} width={29 * 3 + 1} height={34} rx={7} fill="none" stroke={C.muted} strokeDasharray="4 3" />
        <rect x={x0(2) - 3} y={46} width={29 * 3 + 1} height={34} rx={7} fill="none" stroke={C.teal} strokeWidth={1.5} />
        <text x={x0(1) + 12} y={34} textAnchor="middle" fontSize={11} fill={C.redText}>− 7</text>
        <text x={x0(4) + 12} y={34} textAnchor="middle" fontSize={11} fill={C.green}>+ 2</text>
        <text x={120} y={110} textAnchor="middle" fontSize={11} fill={C.fg}>sum 16 → 16 − 7 + 2 = 11</text>
        <text x={120} y={130} textAnchor="middle" fontSize={11} fill={C.muted}>2 updates, not 3 additions</text>
      </Art>
    ),
  },
  {
    title: "Grow until it breaks, then shrink",
    caption: "For “longest” or “shortest” windows, R adds one item at a time. When the window breaks the rule, L drops items from the left until it's fine again. Both only move right, so it's O(n).",
    art: (
      <Art label="A string a b c a with a repeat; R adds the second a, then L drops the first a">
        <Arrowhead id="sw-r" color={C.teal} />
        <Arrowhead id="sw-l" color={C.amber} />
        {[..."xabca"].map((c, i) => (
          <Box key={i} x={x0(i) + 14} y={56} t={c} tone={i === 1 || i === 4 ? C.red : i >= 2 ? C.sky : undefined} faded={i === 0} />
        ))}
        <path d={`M${x0(3) + 26},44 C${x0(3) + 40},28 ${x0(4) + 20},28 ${x0(4) + 26},40`} fill="none" stroke={C.teal} strokeWidth={1.5} markerEnd="url(#sw-r)" />
        <text x={x0(4) + 30} y={26} textAnchor="middle" fontSize={11} fill={C.teal}>R adds</text>
        <path d={`M${x0(1) + 26},92 C${x0(1) + 36},106 ${x0(2) + 18},106 ${x0(2) + 24},94`} fill="none" stroke={C.amber} strokeWidth={1.5} markerEnd="url(#sw-l)" />
        <text x={x0(1) + 30} y={122} textAnchor="middle" fontSize={11} fill={C.amber}>L drops</text>
        <text x={150} y={140} textAnchor="middle" fontSize={11} fill={C.redText}>two a's: broken</text>
      </Art>
    ),
  },
  {
    title: "Keep only what can still win",
    caption: "For the max of every window, a number is useless once a bigger number arrives after it. Throw those away and the survivors are in decreasing order, so the max is always at the front.",
    art: (
      <Art label="Bars 3, 1, 2 are crossed out when 5 arrives; the deque keeps 5 only">
        {[3, 1, 2, 5].map((v, i) => (
          <g key={i}>
            <rect x={44 + i * 42} y={110 - v * 14} width={26} height={v * 14} rx={3} fill={i === 3 ? C.green : C.idle} opacity={i === 3 ? 0.85 : 0.6} />
            <text x={57 + i * 42} y={124} textAnchor="middle" fontSize={11} fill={C.fg}>{v}</text>
            {i < 3 && <line x1={46 + i * 42} x2={68 + i * 42} y1={104} y2={110 - v * 14 + 4} stroke={C.red} strokeWidth={1.5} />}
          </g>
        ))}
        <line x1={30} x2={220} y1={110} y2={110} stroke={C.grid} />
        <text x={120} y={24} textAnchor="middle" fontSize={11} fill={C.fg}>5 arrives: 3, 1, 2 can never be the max</text>
        <text x={120} y={142} textAnchor="middle" fontSize={11} fill={C.green}>deque: [5]</text>
      </Art>
    ),
  },
];

const Intro: React.FC = () => (
  <section aria-labelledby="sw-pattern-title" className="space-y-4">
    <SectionTitle id="sw-pattern-title" kicker="The pattern" title="Sliding Window: a range that moves instead of restarting">
      <p>
        Many questions ask about substrings or subarrays: runs of consecutive items. There are about n²/2 of them, so checking each one is slow.
        A sliding window keeps one range [L, R] and moves its ends, updating what it knows about the range (a sum, letter counts, a set) as items
        enter on the right and leave on the left. Each item enters once and leaves at most once, so the whole scan is O(n).
      </p>
    </SectionTitle>
    <ConceptFigures figures={figures} />
    <div className="grid gap-3 md:grid-cols-2">
      <Surface variant="card" radius="2xl" className="min-w-0 space-y-2 p-4">
        <h3 className="font-semibold text-foreground">How to spot it</h3>
        <ul className="list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-muted-foreground marker:text-primary">
          <li>The question says “substring”, “subarray” or “consecutive”, not “subsequence” (those can skip items).</li>
          <li>“Longest / shortest … such that …”: a window that grows and shrinks.</li>
          <li>“Every window of size k”, “a permutation of p inside s”: a fixed-size window.</li>
          <li>“At most k changes / distinct / zeros”: count inside the window and shrink when the budget is broken.</li>
        </ul>
      </Surface>
      <Surface variant="card" radius="2xl" className="min-w-0 space-y-2 p-4">
        <h3 className="font-semibold text-foreground">The template (Python)</h3>
        <pre className="overflow-x-auto rounded-xl border border-white/10 bg-white/[0.03] p-3 font-mono text-[12.5px] leading-relaxed text-muted-foreground">
{`l = 0
for r in range(len(s)):
    add(s[r])              # grow on the right
    while window_is_broken():
        remove(s[l])       # shrink on the left
        l += 1
    best = max(best, r - l + 1)`}
        </pre>
        <p className="text-xs leading-relaxed text-muted-foreground">
          For “shortest”, flip it: shrink while the window is still valid, recording as you go. Another variable-size example on this site:{" "}
          <Link className="text-primary underline-offset-2 hover:underline" to="/visualize/longestSubarray">
            Longest Subarray with Sum K
          </Link>
          .
        </p>
      </Surface>
    </div>
  </section>
);

const SlidingWindowPage: React.FC = () => <PatternPage category="Sliding Window" intro={<Intro />} problems={SLIDING_WINDOW} />;

export default SlidingWindowPage;
