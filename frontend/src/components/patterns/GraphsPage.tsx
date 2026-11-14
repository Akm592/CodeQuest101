// Interview Patterns · Graphs (the eleventh NeetCode 150 category).

import * as React from "react";
import { Link } from "react-router-dom";

import { GRAPHS } from "../../lib/patterns/graphs";
import { C } from "../ml/colors";
import { SectionTitle } from "../ml/mathBlocks";
import { Art, Arrowhead, ConceptFigures, type ConceptFigure } from "../ml/shared";
import { Surface } from "../ui/surface";
import PatternPage from "./PatternPage";

const R = 11;
const N: React.FC<{ x: number; y: number; t: string; tone?: string }> = ({ x, y, t, tone }) => (
  <g>
    <circle cx={x} cy={y} r={R} fill={tone ?? C.card} fillOpacity={tone ? 0.3 : 1} stroke={tone ?? C.grid} />
    <text x={x} y={y + 3.5} textAnchor="middle" fontSize={10} fill={C.fg}>{t}</text>
  </g>
);
const E: React.FC<{ a: [number, number]; b: [number, number]; tone?: string; arrow?: string }> = ({ a, b, tone, arrow }) => {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const l = Math.hypot(dx, dy);
  return (
    <line
      x1={a[0] + (dx / l) * R}
      y1={a[1] + (dy / l) * R}
      x2={b[0] - (dx / l) * (R + (arrow ? 2 : 0))}
      y2={b[1] - (dy / l) * (R + (arrow ? 2 : 0))}
      stroke={tone ?? C.grid}
      strokeWidth={tone ? 2 : 1.3}
      markerEnd={arrow ? `url(#${arrow})` : undefined}
    />
  );
};

const land = ["110", "100", "011"];

const figures: ConceptFigure[] = [
  {
    title: "A grid is a graph",
    caption: "Each cell is a node, joined to the cells beside it (up, down, left, right). Islands, oranges, gates and oceans are all graph searches on that hidden graph.",
    art: (
      <Art label="A 3 by 3 grid of land and water, and the same land cells drawn as nodes joined to their neighbours">
        {land.map((line, r) =>
          [...line].map((v, c) => (
            <rect key={`${r}${c}`} x={14 + c * 30} y={30 + r * 30} width={26} height={26} rx={5} fill={v === "1" ? C.teal : C.card} fillOpacity={v === "1" ? 0.35 : 1} stroke={v === "1" ? C.teal : C.grid} />
          )),
        )}
        <text x={116} y={78} fontSize={14} fill={C.muted}>=</text>
        <E a={[150, 43]} b={[180, 43]} tone={C.teal} />
        <E a={[150, 43]} b={[150, 73]} tone={C.teal} />
        <E a={[180, 103]} b={[210, 103]} tone={C.violet} />
        <N x={150} y={43} t="" tone={C.teal} />
        <N x={180} y={43} t="" tone={C.teal} />
        <N x={150} y={73} t="" tone={C.teal} />
        <N x={180} y={103} t="" tone={C.violet} />
        <N x={210} y={103} t="" tone={C.violet} />
        <text x={120} y={140} textAnchor="middle" fontSize={9.5} fill={C.muted}>2 islands = 2 components</text>
      </Art>
    ),
  },
  {
    title: "BFS goes in rings",
    caption: "BFS (a queue) reaches everything 1 step away, then 2, then 3. So it finds shortest paths when every step costs the same, and starting it from many sources at once gives each cell its nearest source.",
    art: (
      <Art label="Rings of cells around a source, numbered 1, 2 and 3 outward">
        {[3, 2, 1].map((d) => {
          const hw = 22 + d * 30;
          const hh = 16 + d * 18;
          const col = [C.sky, C.violet, C.amber][d - 1];
          return (
            <g key={d}>
              <rect x={120 - hw} y={75 - hh} width={hw * 2} height={hh * 2} rx={10} fill="none" stroke={col} strokeDasharray="4 3" />
              <text x={120 + hw - 6} y={75 - hh + 13} textAnchor="end" fontSize={10} fill={col}>{d}</text>
            </g>
          );
        })}
        <N x={120} y={75} t="0" tone={C.green} />
      </Art>
    ),
  },
  {
    title: "Arrows and cycles",
    caption: "Dependencies are arrows: take b before a. A valid order exists exactly when there's no cycle. DFS finds one by meeting a node that's still on its current path.",
    art: (
      <Art label="Three nodes in a directed cycle drawn in red, next to a chain of three nodes in green">
        <Arrowhead id="gr-red" color={C.red} />
        <Arrowhead id="gr-green" color={C.green} />
        <E a={[50, 40]} b={[90, 100]} tone={C.red} arrow="gr-red" />
        <E a={[90, 100]} b={[20, 100]} tone={C.red} arrow="gr-red" />
        <E a={[20, 100]} b={[50, 40]} tone={C.red} arrow="gr-red" />
        <N x={50} y={40} t="0" tone={C.red} />
        <N x={90} y={100} t="1" tone={C.red} />
        <N x={20} y={100} t="2" tone={C.red} />
        <E a={[150, 40]} b={[150, 80]} tone={C.green} arrow="gr-green" />
        <E a={[150, 80]} b={[150, 120]} tone={C.green} arrow="gr-green" />
        <N x={150} y={40} t="0" tone={C.green} />
        <N x={150} y={80} t="1" tone={C.green} />
        <N x={150} y={120} t="2" tone={C.green} />
        <text x={55} y={140} textAnchor="middle" fontSize={9.5} fill={C.redText}>cycle: impossible</text>
        <text x={190} y={84} fontSize={9.5} fill={C.green}>order:</text>
        <text x={190} y={98} fontSize={9.5} fill={C.green}>0, 1, 2</text>
      </Art>
    ),
  },
];

const linkCls = "text-primary underline-offset-2 hover:underline";

const Intro: React.FC = () => (
  <section aria-labelledby="gr-pattern-title" className="space-y-4">
    <SectionTitle id="gr-pattern-title" kicker="The pattern" title="Graphs: things and the connections between them">
      <p>
        A graph is nodes joined by edges. Most graph problems come down to a search: DFS (recursion or a stack) to explore everything reachable,
        BFS (a queue) when distance in steps matters, and union-find when connections arrive one at a time. The hard part is often spotting
        the graph: grid cells, courses, words.
      </p>
    </SectionTitle>
    <ConceptFigures figures={figures} />
    <div className="grid gap-3 md:grid-cols-2">
      <Surface variant="card" radius="2xl" className="min-w-0 space-y-2 p-4">
        <h3 className="font-semibold text-foreground">How to spot which tool</h3>
        <ul className="list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-muted-foreground marker:text-primary">
          <li><span className="text-foreground">Count or measure regions</span>: scan, and flood-fill (DFS or BFS) from each unvisited start.</li>
          <li><span className="text-foreground">Fewest steps / nearest source</span>: BFS, seeded with every source at once if there are several.</li>
          <li><span className="text-foreground">Dependencies, ordering</span>: a directed graph; DFS with an on-path set finds cycles and a topological order.</li>
          <li><span className="text-foreground">“Already connected?” as edges arrive</span>: union-find.</li>
        </ul>
      </Surface>
      <Surface variant="card" radius="2xl" className="min-w-0 space-y-2 p-4">
        <h3 className="font-semibold text-foreground">Reading the pictures</h3>
        <ul className="list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-muted-foreground marker:text-primary">
          <li>Grid problems colour the cells; the queue or DFS stack is shown as a row above.</li>
          <li>Other problems draw the graph: arrows for directed edges, dashed edges for ones not added yet, “root” under union-find roots.</li>
          <li>
            To build and search your own graph, see the <Link className={linkCls} to="/visualize/graph">Graph</Link> page; for Kahn's algorithm, see{" "}
            <Link className={linkCls} to="/visualize/topologicalSort">Topological Sort</Link>.
          </li>
        </ul>
      </Surface>
    </div>
  </section>
);

const GraphsPage: React.FC = () => <PatternPage category="Graphs" intro={<Intro />} problems={GRAPHS} />;

export default GraphsPage;
