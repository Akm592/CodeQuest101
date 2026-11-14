// Interview Patterns · Advanced Graphs (the twelfth NeetCode 150 category).

import * as React from "react";
import { Link } from "react-router-dom";

import { ADVANCED_GRAPHS } from "../../lib/patterns/advancedGraphs";
import { C } from "../ml/colors";
import { SectionTitle } from "../ml/mathBlocks";
import { Art, ConceptFigures, type ConceptFigure } from "../ml/shared";
import { Surface } from "../ui/surface";
import PatternPage from "./PatternPage";

const R = 11;
const N: React.FC<{ x: number; y: number; t: string; tone?: string; note?: string }> = ({ x, y, t, tone, note }) => (
  <g>
    <circle cx={x} cy={y} r={R} fill={tone ?? C.card} fillOpacity={tone ? 0.3 : 1} stroke={tone ?? C.grid} />
    <text x={x} y={y + 3.5} textAnchor="middle" fontSize={10} fill={C.fg}>{t}</text>
    {note && (
      <text x={x} y={y - R - 4} textAnchor="middle" fontSize={9.5} fill={C.sky} stroke="hsl(var(--card))" strokeWidth={3} paintOrder="stroke">{note}</text>
    )}
  </g>
);
const E: React.FC<{ a: [number, number]; b: [number, number]; w: string; tone?: string }> = ({ a, b, w, tone }) => {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const l = Math.hypot(dx, dy);
  return (
    <g>
      <line x1={a[0] + (dx / l) * R} y1={a[1] + (dy / l) * R} x2={b[0] - (dx / l) * R} y2={b[1] - (dy / l) * R} stroke={tone ?? C.muted} strokeOpacity={tone ? 1 : 0.6} strokeWidth={tone ? 2 : 1.3} />
      <text x={(a[0] + b[0]) / 2} y={(a[1] + b[1]) / 2 - 3} textAnchor="middle" fontSize={9.5} fill={tone ?? C.muted} stroke="hsl(var(--card))" strokeWidth={3} paintOrder="stroke">{w}</text>
    </g>
  );
};

// A small weighted graph shared by the first two figures.
const P: Record<string, [number, number]> = { A: [30, 75], B: [100, 30], C: [100, 120], D: [175, 75], E: [215, 125] };

const figures: ConceptFigure[] = [
  {
    title: "Dijkstra: the closest is final",
    caption: "With non-negative weights, the closest node not yet finished can't be reached any faster another way. A min-heap hands it over; then its neighbours get a chance at a shorter distance.",
    art: (
      <Art label="A weighted graph from A: A, C and D are final at 0, 1 and 3; B and E have best-so-far distances 4 and 6">
        <E a={P.A} b={P.B} w="4" />
        <E a={P.A} b={P.C} w="1" tone={C.green} />
        <E a={P.C} b={P.B} w="5" />
        <E a={P.C} b={P.D} w="2" tone={C.green} />
        <E a={P.B} b={P.D} w="1" />
        <E a={P.D} b={P.E} w="3" tone={C.green} />
        <N x={P.A[0]} y={P.A[1]} t="A" tone={C.green} note="d=0" />
        <N x={P.B[0]} y={P.B[1]} t="B" note="d≤4" />
        <N x={P.C[0]} y={P.C[1]} t="C" tone={C.green} note="d=1" />
        <N x={P.D[0]} y={P.D[1]} t="D" tone={C.teal} note="d=3" />
        <N x={P.E[0]} y={P.E[1]} t="E" note="d≤6" />
      </Art>
    ),
  },
  {
    title: "Prim: grow the cheapest tree",
    caption: "To connect everything at the least total cost (a minimum spanning tree), grow one tree and always add the cheapest edge from the tree to a node outside it.",
    art: (
      <Art label="The same graph with the minimum spanning tree edges A–C, C–D, D–B and D–E in green, total 7">
        <E a={P.A} b={P.B} w="4" />
        <E a={P.A} b={P.C} w="1" tone={C.green} />
        <E a={P.C} b={P.B} w="5" />
        <E a={P.C} b={P.D} w="2" tone={C.green} />
        <E a={P.B} b={P.D} w="1" tone={C.green} />
        <E a={P.D} b={P.E} w="3" tone={C.green} />
        {Object.entries(P).map(([k, [x, y]]) => (
          <N key={k} x={x} y={y} t={k} tone={C.green} />
        ))}
        <text x={30} y={145} fontSize={9.5} fill={C.green}>total 1 + 2 + 1 + 3 = 7</text>
      </Art>
    ),
  },
  {
    title: "Bellman-Ford: one more edge per round",
    caption: "Relax every edge, round after round. After round r, each distance is the best using at most r edges, which is exactly what a “within k stops” limit needs.",
    art: (
      <Art label="Three rows of distances for rounds 0, 1 and 2, each row filling in further nodes">
        {[
          ["0", "∞", "∞", "∞"],
          ["0", "4", "1", "∞"],
          ["0", "4", "1", "3"],
        ].map((line, r) =>
          line.map((v, c) => (
            <g key={`${r}${c}`}>
              <rect x={70 + c * 38} y={22 + r * 38} width={32} height={26} rx={6} fill={v === "∞" ? C.card : C.sky} fillOpacity={v === "∞" ? 1 : 0.25} stroke={v === "∞" ? C.grid : C.sky} />
              <text x={86 + c * 38} y={39 + r * 38} textAnchor="middle" fontSize={11} fill={C.fg}>{v}</text>
            </g>
          )),
        )}
        {["round 0", "round 1", "round 2"].map((t, r) => (
          <text key={t} x={62} y={39 + r * 38} textAnchor="end" fontSize={9.5} fill={C.muted}>{t}</text>
        ))}
        {["A", "B", "C", "D"].map((t, c) => (
          <text key={t} x={86 + c * 38} y={14} textAnchor="middle" fontSize={9.5} fill={C.muted}>{t}</text>
        ))}
      </Art>
    ),
  },
];

const linkCls = "text-primary underline-offset-2 hover:underline";

const Intro: React.FC = () => (
  <section aria-labelledby="ag-pattern-title" className="space-y-4">
    <SectionTitle id="ag-pattern-title" kicker="The pattern" title="Advanced Graphs: weights, trees and orders">
      <p>
        These problems add costs to the edges. The classic algorithms each answer one question: Dijkstra (cheapest path from one node, with a
        heap), Bellman-Ford (cheapest path with a limit on edges), Prim or Kruskal (cheapest way to connect everything), and topological sort
        (an order that respects every rule).
      </p>
    </SectionTitle>
    <ConceptFigures figures={figures} />
    <div className="grid gap-3 md:grid-cols-2">
      <Surface variant="card" radius="2xl" className="min-w-0 space-y-2 p-4">
        <h3 className="font-semibold text-foreground">How to spot which algorithm</h3>
        <ul className="list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-muted-foreground marker:text-primary">
          <li><span className="text-foreground">Cheapest / fastest from one source, weights ≥ 0</span>: Dijkstra. If a route's cost is its worst step, use max instead of +.</li>
          <li><span className="text-foreground">“At most k stops” or negative weights</span>: Bellman-Ford, k + 1 rounds.</li>
          <li><span className="text-foreground">Connect everything as cheaply as possible</span>: minimum spanning tree (Prim or Kruskal).</li>
          <li><span className="text-foreground">Recover an order from rules</span>: topological sort. <span className="text-foreground">Use every edge once</span>: an Eulerian path.</li>
        </ul>
      </Surface>
      <Surface variant="card" radius="2xl" className="min-w-0 space-y-2 p-4">
        <h3 className="font-semibold text-foreground">Reading the pictures</h3>
        <ul className="list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-muted-foreground marker:text-primary">
          <li>Edge labels are weights. The blue note beside a node is its best distance so far (≤) or its final one (t =).</li>
          <li>The heap is shown above the picture as a row, smallest first.</li>
          <li>
            For plain BFS and DFS, see the <Link className={linkCls} to="/visualize/graphsPattern">Graphs</Link> patterns page; for Kahn's
            algorithm, see <Link className={linkCls} to="/visualize/topologicalSort">Topological Sort</Link>.
          </li>
        </ul>
      </Surface>
    </div>
  </section>
);

const AdvancedGraphsPage: React.FC = () => <PatternPage category="Advanced Graphs" intro={<Intro />} problems={ADVANCED_GRAPHS} />;

export default AdvancedGraphsPage;
