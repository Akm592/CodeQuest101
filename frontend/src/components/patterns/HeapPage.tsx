// Interview Patterns · Heap / Priority Queue (the ninth NeetCode 150 category).

import * as React from "react";
import { Link } from "react-router-dom";

import { HEAP } from "../../lib/patterns/heap";
import { C } from "../ml/colors";
import { SectionTitle } from "../ml/mathBlocks";
import { Art, Arrowhead, ConceptFigures, type ConceptFigure } from "../ml/shared";
import { Surface } from "../ui/surface";
import PatternPage from "./PatternPage";

const R = 10;
const N: React.FC<{ x: number; y: number; t: string; tone?: string }> = ({ x, y, t, tone }) => (
  <g>
    <circle cx={x} cy={y} r={R} fill={tone ?? C.card} fillOpacity={tone ? 0.3 : 1} stroke={tone ?? C.grid} />
    <text x={x} y={y + 3.5} textAnchor="middle" fontSize={10} fill={C.fg}>{t}</text>
  </g>
);
const E: React.FC<{ a: [number, number]; b: [number, number]; tone?: string }> = ({ a, b, tone }) => {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const l = Math.hypot(dx, dy);
  return <line x1={a[0] + (dx / l) * R} y1={a[1] + (dy / l) * R} x2={b[0] - (dx / l) * R} y2={b[1] - (dy / l) * R} stroke={tone ?? C.grid} strokeWidth={tone ? 2 : 1.3} />;
};
const Cell: React.FC<{ x: number; y: number; t: string; i: number; tone?: string }> = ({ x, y, t, i, tone }) => (
  <g>
    <rect x={x} y={y} width={22} height={20} rx={4} fill={tone ?? C.card} fillOpacity={tone ? 0.3 : 1} stroke={tone ?? C.grid} />
    <text x={x + 11} y={y + 14} textAnchor="middle" fontSize={10} fill={C.fg}>{t}</text>
    <text x={x + 11} y={y + 31} textAnchor="middle" fontSize={8} fill={C.muted}>{i}</text>
  </g>
);

// A min-heap [1, 3, 2, 7, 4, 5] drawn as a tree.
const T: [number, number][] = [
  [120, 18],
  [75, 54],
  [165, 54],
  [52, 90],
  [98, 90],
  [142, 90],
];
const V = ["1", "3", "2", "7", "4", "5"];
// Index 0 (the min) in green; index 1 and its children 3 and 4 in blue.
const tone1 = (i: number) => (i === 0 ? C.green : i === 1 || i === 3 || i === 4 ? C.sky : undefined);

const figures: ConceptFigure[] = [
  {
    title: "A tree stored in an array",
    caption: "A heap is a complete binary tree kept in a plain array: index i's children are at 2i + 1 and 2i + 2. In a min-heap every parent is ≤ its children, so the smallest value is always at index 0.",
    art: (
      <Art label="A min-heap 1, 3, 2, 7, 4, 5 drawn as a tree above the same values in an array with indexes 0 to 5">
        {T.slice(1).map((p, i) => (
          <E key={i} a={T[i >> 1]} b={p} tone={i + 1 === 3 || i + 1 === 4 ? C.sky : undefined} />
        ))}
        {T.map(([x, y], i) => (
          <N key={i} x={x} y={y} t={V[i]} tone={tone1(i)} />
        ))}
        {V.map((v, i) => (
          <Cell key={i} x={54 + i * 23} y={108} t={v} i={i} tone={tone1(i)} />
        ))}
        <text x={140} y={22} fontSize={9.5} fill={C.green}>min on top</text>
        <text x={4} y={64} fontSize={9} fill={C.sky}>index 1 → 3, 4</text>
      </Art>
    ),
  },
  {
    title: "Push swaps up, pop sinks down",
    caption: "Push: add at the end, then swap with the parent while it's smaller. Pop: take the top, move the last value to the top, then swap it with its smaller child until it fits. Both walk one path: O(log n).",
    art: (
      <Art label="A new value 0 added at the bottom swaps up two levels to the root">
        <Arrowhead id="hp-up" color={C.red} />
        {T.slice(1).map((p, i) => (
          <E key={i} a={T[i >> 1]} b={p} tone={i + 1 === 2 ? C.red : undefined} />
        ))}
        <E a={T[2]} b={[188, 90]} tone={C.red} />
        {T.map(([x, y], i) => (
          <N key={i} x={x} y={y} t={V[i]} tone={i === 0 || i === 2 ? C.red : undefined} />
        ))}
        <N x={188} y={90} t="0" tone={C.teal} />
        <path d="M200,80 C215,60 205,40 185,30 L140,20" fill="none" stroke={C.red} strokeDasharray="4 3" markerEnd="url(#hp-up)" />
        <text x={30} y={130} fontSize={9.5} fill={C.muted}>push 0: it swaps past 2, then past 1</text>
      </Art>
    ),
  },
  {
    title: "Keep only what you need",
    caption: "For the k largest, keep a min-heap of size k: its top is the weakest of them, the one to throw out. For a running median, two heaps face each other: a max-heap of the lower half and a min-heap of the upper half.",
    art: (
      <Art label="Left: a small max-heap of low numbers. Right: a small min-heap of high numbers. Their tops meet in the middle">
        <N x={70} y={30} t="5" tone={C.sky} />
        <E a={[70, 30]} b={[45, 70]} />
        <E a={[70, 30]} b={[95, 70]} />
        <N x={45} y={70} t="3" />
        <N x={95} y={70} t="1" />
        <N x={170} y={30} t="7" tone={C.violet} />
        <E a={[170, 30]} b={[145, 70]} />
        <E a={[170, 30]} b={[195, 70]} />
        <N x={145} y={70} t="9" />
        <N x={195} y={70} t="8" />
        <text x={70} y={102} textAnchor="middle" fontSize={9.5} fill={C.sky}>lower half (max)</text>
        <text x={170} y={102} textAnchor="middle" fontSize={9.5} fill={C.violet}>upper half (min)</text>
        <text x={120} y={34} textAnchor="middle" fontSize={10} fill={C.green}>5 | 7</text>
        <text x={120} y={132} textAnchor="middle" fontSize={9.5} fill={C.green}>median = (5 + 7) / 2 = 6</text>
      </Art>
    ),
  },
];

const linkCls = "text-primary underline-offset-2 hover:underline";

const Intro: React.FC = () => (
  <section aria-labelledby="hp-pattern-title" className="space-y-4">
    <SectionTitle id="hp-pattern-title" kicker="The pattern" title="Heaps: the best item on top, in O(log n)">
      <p>
        A heap (priority queue) keeps the smallest, or largest, item on top. Reading it is O(1), and adding an item or removing the top is
        O(log n). Use one whenever a problem keeps asking “what's the biggest (or smallest, or newest) right now?” while items come and go.
      </p>
    </SectionTitle>
    <ConceptFigures figures={figures} />
    <div className="grid gap-3 md:grid-cols-2">
      <Surface variant="card" radius="2xl" className="min-w-0 space-y-2 p-4">
        <h3 className="font-semibold text-foreground">How to spot it</h3>
        <ul className="list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-muted-foreground marker:text-primary">
          <li><span className="text-foreground">“kth largest”, “top k”, “k closest”</span>: a heap of size k, ordered the opposite way, so the item to throw out is on top.</li>
          <li><span className="text-foreground">Repeatedly take the best item</span> and put something back (stones, tasks): a heap of everything.</li>
          <li><span className="text-foreground">Merging sorted lists</span> or “the newest across many lists”: a heap seeded with each list's head.</li>
          <li><span className="text-foreground">A running median</span>: two heaps, one per half.</li>
        </ul>
      </Surface>
      <Surface variant="card" radius="2xl" className="min-w-0 space-y-2 p-4">
        <h3 className="font-semibold text-foreground">Reading the pictures</h3>
        <ul className="list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-muted-foreground marker:text-primary">
          <li>The tree and the row under it are the same heap. The small number under each array cell is its index.</li>
          <li>Red marks the path a value just swapped along; teal is where it settled.</li>
          <li>
            Python's <code className="font-mono text-foreground">heapq</code> is a min-heap; for a max-heap, push negated values. To play with a heap
            yourself, see the <Link className={linkCls} to="/visualize/heap">Heap</Link> page.
          </li>
        </ul>
      </Surface>
    </div>
  </section>
);

const HeapPage: React.FC = () => <PatternPage category="Heap / Priority Queue" intro={<Intro />} problems={HEAP} />;

export default HeapPage;
