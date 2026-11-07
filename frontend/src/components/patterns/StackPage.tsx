// Interview Patterns · Stack (the fourth NeetCode 150 category).

import * as React from "react";
import { Link } from "react-router-dom";

import { STACK } from "../../lib/patterns/stack";
import { C } from "../ml/colors";
import { SectionTitle } from "../ml/mathBlocks";
import { Art, Arrowhead, ConceptFigures, type ConceptFigure } from "../ml/shared";
import { Surface } from "../ui/surface";
import PatternPage from "./PatternPage";

const Box: React.FC<{ x: number; y: number; t: string; tone?: string; w?: number }> = ({ x, y, t, tone, w = 24 }) => (
  <g>
    <rect x={x} y={y} width={w} height={22} rx={5} fill={tone ?? C.card} fillOpacity={tone ? 0.25 : 1} stroke={tone ?? C.grid} />
    <text x={x + w / 2} y={y + 15} textAnchor="middle" fontSize={11} fill={C.fg}>{t}</text>
  </g>
);

/** A vertical stack of boxes, bottom first. */
const Pile: React.FC<{ x: number; items: string[]; top?: string; w?: number }> = ({ x, items, top, w = 30 }) => (
  <g>
    {items.map((t, i) => (
      <Box key={i} x={x} y={112 - i * 25} t={t} w={w} tone={i === items.length - 1 ? top : undefined} />
    ))}
    <path d={`M${x - 4},${112 - (items.length - 1) * 25 - 4} L${x - 4},138 L${x + w + 4},138 L${x + w + 4},${112 - (items.length - 1) * 25 - 4}`} fill="none" stroke={C.muted} />
  </g>
);

const figures: ConceptFigure[] = [
  {
    title: "Last in, first out",
    caption: "In “{ [ ( ) ] }” the bracket that closes next is always the one opened most recently. A stack keeps exactly that order: push when something opens, and the top is what must close first.",
    art: (
      <Art label="The string { [ ( with a stack holding {, [ and ( from bottom to top; the closing ) matches the top (">
        <Arrowhead id="st-pop" color={C.green} />
        {["{", "[", "(", ")", "]", "}"].map((c, i) => (
          <Box key={i} x={16 + i * 22} y={20} t={c} w={20} tone={i === 2 || i === 3 ? C.green : undefined} />
        ))}
        <text x={16} y={62} fontSize={10} fill={C.muted}>reading “)”</text>
        <Pile x={176} items={["{", "[", "("]} top={C.green} />
        <path d="M92,44 C120,70 150,64 170,64" fill="none" stroke={C.green} strokeWidth={1.5} markerEnd="url(#st-pop)" />
        <text x={70} y={110} textAnchor="middle" fontSize={11} fill={C.green}>matches the top:</text>
        <text x={70} y={126} textAnchor="middle" fontSize={11} fill={C.green}>pop it</text>
      </Art>
    ),
  },
  {
    title: "The stack remembers unfinished work",
    caption: "In “3 4 + 2 ×”, numbers wait on the stack until an operator needs them. The operator takes the two most recent values and pushes its result back, ready for the next operator.",
    art: (
      <Art label="Tokens 3 4 + 2 times; the stack goes from 3, 4 to 7 to 7, 2 to 14">
        {["3", "4", "+", "2", "×"].map((c, i) => (
          <Box key={i} x={50 + i * 28} y={14} t={c} tone={i === 2 ? C.amber : undefined} />
        ))}
        <Pile x={24} items={["3", "4"]} />
        <text x={88} y={110} textAnchor="middle" fontSize={14} fill={C.amber}>+</text>
        <text x={88} y={128} textAnchor="middle" fontSize={10} fill={C.muted}>→</text>
        <Pile x={118} items={["7"]} top={C.amber} />
        <text x={176} y={120} textAnchor="middle" fontSize={10} fill={C.muted}>…</text>
        <Pile x={192} items={["14"]} top={C.green} />
        <text x={120} y={62} textAnchor="middle" fontSize={10} fill={C.muted}>3 + 4 = 7, then 7 × 2 = 14</text>
      </Art>
    ),
  },
  {
    title: "Monotonic stack: one item answers many",
    caption: "Cool days wait on a stack, warmest at the bottom. When a warmer day arrives it answers every cooler day on top at once, then waits itself. Each day is pushed and popped once: O(n).",
    art: (
      <Art label="Bars 70, 68, 65 waiting; a bar of 72 arrives and answers all three">
        <Arrowhead id="st-mono" color={C.green} />
        {[70, 68, 65, 72].map((v, i) => (
          <g key={i}>
            <rect x={36 + i * 46} y={118 - (v - 58) * 6} width={28} height={(v - 58) * 6} rx={3} fill={i === 3 ? C.teal : C.green} opacity={0.75} />
            <text x={50 + i * 46} y={132} textAnchor="middle" fontSize={11} fill={C.fg}>{v}</text>
          </g>
        ))}
        <line x1={24} x2={226} y1={118} y2={118} stroke={C.grid} />
        <path d="M172,30 C150,14 110,14 98,30" fill="none" stroke={C.green} strokeWidth={1.5} markerEnd="url(#st-mono)" />
        <text x={130} y={12} textAnchor="middle" fontSize={10} fill={C.green}>72 answers all three</text>
        <text x={120} y={146} textAnchor="middle" fontSize={10} fill={C.muted}>waits: 3, 2, 1 days</text>
      </Art>
    ),
  },
];

const linkCls = "text-primary underline-offset-2 hover:underline";

const Intro: React.FC = () => (
  <section aria-labelledby="st-pattern-title" className="space-y-4">
    <SectionTitle id="st-pattern-title" kicker="The pattern" title="Stack: the most recent unfinished thing comes first">
      <p>
        A stack only lets you touch its top: push onto it, pop off it. That sounds limiting, but many problems only ever need the latest item:
        the bracket opened last, the two values computed last, the days still waiting for an answer. Each push and pop is O(1), and an item
        is pushed and popped once, so most stack solutions are O(n).
      </p>
    </SectionTitle>
    <ConceptFigures figures={figures} />
    <div className="grid gap-3 md:grid-cols-2">
      <Surface variant="card" radius="2xl" className="min-w-0 space-y-2 p-4">
        <h3 className="font-semibold text-foreground">How to spot it</h3>
        <ul className="list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-muted-foreground marker:text-primary">
          <li>Nesting: brackets, tags, folders, function calls. The innermost finishes first.</li>
          <li>“Undo the last step”: backtracking builds a stack and pops after each try.</li>
          <li>“Next greater / smaller element”, “how far until something bigger”: a monotonic stack.</li>
          <li>Expressions and calculators: values wait until an operator uses them.</li>
        </ul>
      </Surface>
      <Surface variant="card" radius="2xl" className="min-w-0 space-y-2 p-4">
        <h3 className="font-semibold text-foreground">Plain stack vs monotonic stack</h3>
        <ul className="list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-muted-foreground marker:text-primary">
          <li>
            <span className="text-foreground">Plain</span>: Valid Parentheses, Min Stack, RPN, Generate Parentheses. New to stacks? See the{" "}
            <Link className={linkCls} to="/visualize/stack">Stack and Queue</Link> page first.
          </li>
          <li>
            <span className="text-foreground">Monotonic</span>: the stack is kept sorted by popping anything a new item makes useless. Daily
            Temperatures, Car Fleet and Largest Rectangle. It's the same “drop what can never win” idea as the deque in{" "}
            <Link className={linkCls} to="/visualize/slidingWindow">Sliding Window Maximum</Link>.
          </li>
        </ul>
        <p className="font-mono text-[13px] text-muted-foreground">
          Python: <span className="text-foreground">stack = []</span>, <span className="text-foreground">stack.append(x)</span>,{" "}
          <span className="text-foreground">stack.pop()</span>, <span className="text-foreground">stack[-1]</span> (top)
        </p>
      </Surface>
    </div>
  </section>
);

const StackPage: React.FC = () => <PatternPage category="Stack" intro={<Intro />} problems={STACK} />;

export default StackPage;
