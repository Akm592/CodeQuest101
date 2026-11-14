// Interview Patterns · Backtracking (the tenth NeetCode 150 category).

import * as React from "react";
import { Link } from "react-router-dom";

import { BACKTRACKING } from "../../lib/patterns/backtracking";
import { C } from "../ml/colors";
import { SectionTitle } from "../ml/mathBlocks";
import { Art, ConceptFigures, type ConceptFigure } from "../ml/shared";
import { Surface } from "../ui/surface";
import PatternPage from "./PatternPage";

const R = 10;
const N: React.FC<{ x: number; y: number; t: string; tone?: string }> = ({ x, y, t, tone }) => (
  <g>
    <circle cx={x} cy={y} r={R} fill={tone ?? C.card} fillOpacity={tone ? 0.3 : 1} stroke={tone ?? C.grid} />
    <text x={x} y={y + 3.5} textAnchor="middle" fontSize={9} fill={C.fg}>{t}</text>
  </g>
);
const E: React.FC<{ a: [number, number]; b: [number, number]; tone?: string }> = ({ a, b, tone }) => {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const l = Math.hypot(dx, dy);
  return <line x1={a[0] + (dx / l) * R} y1={a[1] + (dy / l) * R} x2={b[0] - (dx / l) * R} y2={b[1] - (dy / l) * R} stroke={tone ?? C.grid} strokeWidth={tone ? 2 : 1.3} />;
};

// Subsets of [1, 2]: a two-level include/exclude tree.
const sub: [number, number, string, string?][] = [
  [120, 16, "·"],
  [70, 56, "+1", C.sky],
  [170, 56, "−1"],
  [45, 96, "+2", C.sky],
  [95, 96, "−2"],
  [145, 96, "+2"],
  [195, 96, "−2"],
];
const leaves = ["[1,2]", "[1]", "[2]", "[ ]"];

const figures: ConceptFigure[] = [
  {
    title: "A tree of choices",
    caption: "Every backtracking problem is a walk through a tree: each level is one decision, each branch one option. Here: include 1 or not, then include 2 or not. Each leaf is one answer.",
    art: (
      <Art label="An include/exclude tree for [1, 2] with four leaves: [1,2], [1], [2] and the empty set">
        {sub.slice(1).map(([x, y], i) => (
          <E key={i} a={[sub[i < 2 ? 0 : i < 4 ? 1 : 2][0], sub[i < 2 ? 0 : i < 4 ? 1 : 2][1]]} b={[x, y]} tone={i === 0 || i === 2 ? C.sky : undefined} />
        ))}
        {sub.map(([x, y, t, tone], i) => (
          <N key={i} x={x} y={y} t={t} tone={tone} />
        ))}
        {leaves.map((l, i) => (
          <text key={l} x={45 + i * 50} y={124} textAnchor="middle" fontSize={9.5} fill={i === 0 ? C.green : C.muted}>{l}</text>
        ))}
        <text x={4} y={146} fontSize={9.5} fill={C.sky}>blue: the path is the current choice list</text>
      </Art>
    ),
  },
  {
    title: "Choose, explore, un-choose",
    caption: "Keep one list for the current path. Append a choice, recurse, then pop it before trying the next choice. The pop is the “back” in backtracking: the list is ready for the sibling branch.",
    art: (
      <Art label="Three boxes: append, recurse, pop, in a loop">
        {[
          ["append(x)", C.sky],
          ["dfs(…)", C.teal],
          ["pop()", C.amber],
        ].map(([t, col], i) => (
          <g key={t}>
            <rect x={14 + i * 76} y={50} width={62} height={30} rx={8} fill={col} fillOpacity={0.2} stroke={col} />
            <text x={45 + i * 76} y={69} textAnchor="middle" fontSize={10} fontFamily="ui-monospace, monospace" fill={C.fg}>{t}</text>
            {i < 2 && <text x={83 + i * 76} y={70} textAnchor="middle" fontSize={12} fill={C.muted}>→</text>}
          </g>
        ))}
        <path d="M197,82 C190,118 60,118 45,84" fill="none" stroke={C.muted} strokeDasharray="4 3" />
        <text x={120} y={130} textAnchor="middle" fontSize={9.5} fill={C.muted}>then the next choice</text>
        <text x={120} y={30} textAnchor="middle" fontSize={9.5} fill={C.muted}>for each choice at this level:</text>
      </Art>
    ),
  },
  {
    title: "Prune early",
    caption: "The trees are exponential, so the speed comes from cutting branches as soon as they can't work: a sum past the target, a letter that doesn't match, a queen under attack. Red marks a branch that was cut.",
    art: (
      <Art label="A tree where two branches are cut off in red early, and one path reaches a green answer">
        <N x={120} y={18} t="·" />
        <E a={[120, 18]} b={[60, 60]} tone={C.red} />
        <E a={[120, 18]} b={[120, 60]} tone={C.teal} />
        <E a={[120, 18]} b={[180, 60]} />
        <N x={60} y={60} t="✗" tone={C.red} />
        <N x={120} y={60} t="" tone={C.teal} />
        <N x={180} y={60} t="" />
        <E a={[120, 60]} b={[95, 102]} tone={C.red} />
        <E a={[120, 60]} b={[145, 102]} tone={C.green} />
        <E a={[180, 60]} b={[180, 102]} tone={C.red} />
        <N x={95} y={102} t="✗" tone={C.red} />
        <N x={145} y={102} t="✓" tone={C.green} />
        <N x={180} y={102} t="✗" tone={C.red} />
        <text x={60} y={136} textAnchor="middle" fontSize={9.5} fill={C.red}>no subtree below ✗</text>
        <text x={160} y={136} textAnchor="middle" fontSize={9.5} fill={C.green}>an answer</text>
      </Art>
    ),
  },
];

const linkCls = "text-primary underline-offset-2 hover:underline";

const Intro: React.FC = () => (
  <section aria-labelledby="bt-pattern-title" className="space-y-4">
    <SectionTitle id="bt-pattern-title" kicker="The pattern" title="Backtracking: try a choice, explore, undo it">
      <p>
        Backtracking builds answers one choice at a time and explores every option, depth first. When a path is finished it records an answer;
        when a path can't possibly work it gives up on it at once and backs up to try the next option. It's how you list all subsets,
        combinations, arrangements and placements.
      </p>
    </SectionTitle>
    <ConceptFigures figures={figures} />
    <div className="grid gap-3 md:grid-cols-2">
      <Surface variant="card" radius="2xl" className="min-w-0 space-y-2 p-4">
        <h3 className="font-semibold text-foreground">How to spot it</h3>
        <ul className="list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-muted-foreground marker:text-primary">
          <li><span className="text-foreground">“Return all …”</span> subsets, combinations, permutations, partitions: the answer is exponential, so walk the tree.</li>
          <li><span className="text-foreground">Each item in or out</span>: two branches per level. <span className="text-foreground">Pick the next item</span>: one branch per remaining option.</li>
          <li><span className="text-foreground">Duplicates in the input</span>: sort, then skip equal neighbours at the same level.</li>
          <li><span className="text-foreground">Placement with rules</span> (queens, paths on a grid): check the rule before recursing.</li>
        </ul>
      </Surface>
      <Surface variant="card" radius="2xl" className="min-w-0 space-y-2 p-4">
        <h3 className="font-semibold text-foreground">Reading the pictures</h3>
        <ul className="list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-muted-foreground marker:text-primary">
          <li>The recursion tree grows as the search runs. Each node is one call; its label is the choice that led to it (+x include, −x skip).</li>
          <li>Blue is the current path, green a recorded answer, red a branch that was cut off. The note beside the current node is its state.</li>
          <li>
            For a bigger board with queens, see the <Link className={linkCls} to="/visualize/nQueens">N-Queens</Link> visualizer.
          </li>
        </ul>
      </Surface>
    </div>
  </section>
);

const BacktrackingPage: React.FC = () => <PatternPage category="Backtracking" intro={<Intro />} problems={BACKTRACKING} />;

export default BacktrackingPage;
