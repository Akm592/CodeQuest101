// Interview Patterns · Linked List (the sixth NeetCode 150 category).

import * as React from "react";
import { Link } from "react-router-dom";

import { LINKED_LIST } from "../../lib/patterns/linkedList";
import { C } from "../ml/colors";
import { SectionTitle } from "../ml/mathBlocks";
import { Art, Arrowhead, ConceptFigures, type ConceptFigure } from "../ml/shared";
import { Surface } from "../ui/surface";
import PatternPage from "./PatternPage";

const Node: React.FC<{ x: number; y: number; t: string; tone?: string }> = ({ x, y, t, tone }) => (
  <g>
    <rect x={x} y={y} width={30} height={24} rx={6} fill={tone ?? C.card} fillOpacity={tone ? 0.25 : 1} stroke={tone ?? C.grid} />
    <text x={x + 15} y={y + 16} textAnchor="middle" fontSize={11} fill={C.fg}>{t}</text>
  </g>
);

const figures: ConceptFigure[] = [
  {
    title: "Arrows, not positions",
    caption: "Each node only knows the next one. To insert 9 between 2 and 5, change two arrows; nothing shifts. But there's no jumping to the middle: you have to walk there.",
    art: (
      <Art label="Nodes 1, 2, 5 with arrows; a new node 9 is inserted between 2 and 5 by changing two arrows">
        <Arrowhead id="ll-a" color={C.muted} />
        <Arrowhead id="ll-g" color={C.green} />
        <Node x={16} y={40} t="1" />
        <Node x={76} y={40} t="2" />
        <Node x={196} y={40} t="5" />
        <Node x={136} y={96} t="9" tone={C.green} />
        <path d="M46,52 L72,52" stroke={C.muted} markerEnd="url(#ll-a)" />
        <path d="M106,52 L192,52" stroke={C.muted} strokeDasharray="4 3" opacity={0.5} />
        <path d="M100,64 L136,96" stroke={C.green} markerEnd="url(#ll-g)" />
        <path d="M166,104 L198,66" stroke={C.green} markerEnd="url(#ll-g)" />
        <text x={120} y={24} textAnchor="middle" fontSize={11} fill={C.fg}>insert = change 2 arrows</text>
        <text x={60} y={124} textAnchor="middle" fontSize={10} fill={C.muted}>old arrow dropped</text>
      </Art>
    ),
  },
  {
    title: "Flip arrows one at a time",
    caption: "Reversing walks the list with prev and curr. Save curr.next, point curr back at prev, then step both forward. Reorder List and Reverse Nodes in K-Group build on this.",
    art: (
      <Art label="Nodes 1, 2, 3, 4: the first two arrows point left (flipped), the rest point right; prev on 2, curr on 3">
        <Arrowhead id="ll-f" color={C.green} />
        <Arrowhead id="ll-b" color={C.muted} />
        {["1", "2", "3", "4"].map((t, i) => (
          <Node key={t} x={22 + i * 54} y={56} t={t} tone={i < 2 ? C.green : i === 2 ? C.teal : undefined} />
        ))}
        <path d="M74,68 L56,68" stroke={C.green} markerEnd="url(#ll-f)" />
        <path d="M22,68 L8,68" stroke={C.green} markerEnd="url(#ll-f)" />
        <path d="M160,68 L180,68" stroke={C.muted} markerEnd="url(#ll-b)" />
        <text x={91} y={100} textAnchor="middle" fontSize={10.5} fill={C.amber}>prev</text>
        <text x={145} y={100} textAnchor="middle" fontSize={10.5} fill={C.amber}>curr</text>
        <text x={120} y={30} textAnchor="middle" fontSize={11} fill={C.fg}>curr.next = prev</text>
        <text x={120} y={128} textAnchor="middle" fontSize={10} fill={C.muted}>then step both forward</text>
      </Art>
    ),
  },
  {
    title: "Fast and slow pointers",
    caption: "Move one pointer 1 step and another 2 steps. When fast reaches the end, slow is in the middle. If there's a loop, fast laps slow and they meet.",
    art: (
      <Art label="A list of five nodes looping back to the second; slow on node 3 and fast on node 5">
        <Arrowhead id="ll-c" color={C.muted} />
        <Arrowhead id="ll-v" color={C.violet} />
        {["1", "2", "3", "4", "5"].map((t, i) => (
          <Node key={t} x={14 + i * 46} y={48} t={t} tone={i === 2 ? C.teal : i === 4 ? C.amber : undefined} />
        ))}
        {[0, 1, 2, 3].map((i) => (
          <path key={i} d={`M${44 + i * 46},60 L${58 + i * 46},60`} stroke={C.muted} markerEnd="url(#ll-c)" />
        ))}
        <path d="M213,72 C200,118 90,118 76,76" fill="none" stroke={C.violet} markerEnd="url(#ll-v)" />
        <text x={121} y={40} textAnchor="middle" fontSize={10.5} fill={C.teal}>slow</text>
        <text x={213} y={40} textAnchor="middle" fontSize={10.5} fill={C.amber}>fast</text>
        <text x={140} y={132} textAnchor="middle" fontSize={10} fill={C.violet}>a loop: fast will catch slow</text>
      </Art>
    ),
  },
];

const linkCls = "text-primary underline-offset-2 hover:underline";

const Intro: React.FC = () => (
  <section aria-labelledby="ll-pattern-title" className="space-y-4">
    <SectionTitle id="ll-pattern-title" kicker="The pattern" title="Linked List: it's all about re-pointing arrows">
      <p>
        A linked list is a chain of nodes, each holding a value and a pointer to the next node. You can't index into it, so every problem is about
        walking it with a few well-placed pointers and changing arrows in the right order. Draw the arrows, decide which ones change, and save
        anything you're about to lose.
      </p>
    </SectionTitle>
    <ConceptFigures figures={figures} />
    <div className="grid gap-3 md:grid-cols-2">
      <Surface variant="card" radius="2xl" className="min-w-0 space-y-2 p-4">
        <h3 className="font-semibold text-foreground">How to spot it (and the four tricks)</h3>
        <ul className="list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-muted-foreground marker:text-primary">
          <li><span className="text-foreground">Dummy node</span> before the head, whenever the head might change (merge, remove, reverse in groups).</li>
          <li><span className="text-foreground">Fast and slow pointers</span> for the middle, a cycle, or “n-th from the end” (a fixed gap).</li>
          <li><span className="text-foreground">Reverse in place</span> with prev and curr, often just part of the list.</li>
          <li><span className="text-foreground">Hash map of nodes</span> for copying (old → new) or for O(1) lookup next to a list (LRU Cache).</li>
        </ul>
      </Surface>
      <Surface variant="card" radius="2xl" className="min-w-0 space-y-2 p-4">
        <h3 className="font-semibold text-foreground">Reading the pictures</h3>
        <ul className="list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-muted-foreground marker:text-primary">
          <li>Boxes are nodes and arrows are next pointers; ∅ is None. Orange labels under a node are the pointers on it (prev, curr, slow …).</li>
          <li>Arrows that skip over nodes curve above the row; arrows pointing backwards curve below. Dashed arrows are random pointers.</li>
          <li>
            New to linked lists? Try the <Link className={linkCls} to="/visualize/linkedList">Linked List visualizer</Link> first. Floyd's
            algorithm has its own page too: <Link className={linkCls} to="/visualize/hareTortoise">the tortoise and the hare</Link>.
          </li>
        </ul>
      </Surface>
    </div>
  </section>
);

const LinkedListPage: React.FC = () => <PatternPage category="Linked List" intro={<Intro />} problems={LINKED_LIST} />;

export default LinkedListPage;
