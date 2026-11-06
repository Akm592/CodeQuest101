// Illustrations for K-Means and the neural network.

import type { FC } from "react";

import { C } from "../colors";
import { Art, Arrowhead, type ConceptFigure } from "../shared";

// Three loose groups, in figure pixels.
const GROUPS: [number, number][][] = [
  [[40, 40], [52, 30], [34, 56], [58, 50], [46, 62], [66, 38]],
  [[170, 46], [186, 36], [196, 56], [178, 60], [204, 42], [164, 64]],
  [[104, 112], [120, 104], [96, 128], [130, 122], [114, 132], [138, 108]],
];
const COLORS = [C.teal, C.violet, C.amber];
const mean = (g: [number, number][]) => [g.reduce((a, p) => a + p[0], 0) / g.length, g.reduce((a, p) => a + p[1], 0) / g.length] as const;
const START: [number, number][] = [[92, 44], [140, 70], [70, 100]];

const Cross: FC<{ x: number; y: number; color: string; dim?: boolean }> = ({ x, y, color, dim }) => (
  <g opacity={dim ? 0.45 : 1}>
    <circle cx={x} cy={y} r={8} fill="hsl(var(--background))" stroke={color} strokeWidth={2} />
    <path d={`M${x - 4},${y - 4} L${x + 4},${y + 4} M${x + 4},${y - 4} L${x - 4},${y + 4}`} stroke={color} strokeWidth={2} />
  </g>
);

export const kMeansFigures: ConceptFigure[] = [
  {
    title: "Drop k centres anywhere",
    caption: "Nothing is labelled. Pick how many groups you want (k = 3 here) and place that many centres, at random or spread out with k-means++.",
    art: (
      <Art label="Grey unlabelled points in three loose groups and three centre markers">
        {GROUPS.flat().map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r={4} fill={C.idle} />
        ))}
        {START.map(([x, y], i) => (
          <Cross key={i} x={x} y={y} color={COLORS[i]} />
        ))}
      </Art>
    ),
  },
  {
    title: "Every point joins its nearest centre",
    caption: "Colour each point by the closest centre. The first pass is rough: a few points land with the wrong group, and the next steps fix that.",
    art: (
      <Art label="Points coloured by their nearest centre">
        {GROUPS.flat().map(([x, y], i) => {
          const d = START.map(([cx, cy]) => (cx - x) ** 2 + (cy - y) ** 2);
          return <circle key={i} cx={x} cy={y} r={4} fill={COLORS[d.indexOf(Math.min(...d))]} />;
        })}
        {START.map(([x, y], i) => (
          <Cross key={i} x={x} y={y} color={COLORS[i]} />
        ))}
      </Art>
    ),
  },
  {
    title: "Move each centre to the middle, then repeat",
    caption: "Each centre jumps to the average of its points. Some points are now closer to a different centre, so assign again. Stop when nothing changes.",
    art: (
      <Art label="Arrows from each old centre position to the middle of its group">
        {COLORS.map((c, i) => (
          <Arrowhead key={i} id={`km-move-${i}`} color={c} />
        ))}
        {GROUPS.map((g, gi) => g.map(([x, y], i) => <circle key={`${gi}-${i}`} cx={x} cy={y} r={4} fill={COLORS[gi]} opacity={0.85} />))}
        {[0, 1, 2].map((i) => {
          // Centre i ends in the group it captured most of: 0 → left, 1 → right, 2 → bottom.
          const [tx, ty] = mean(GROUPS[i]);
          const [sx, sy] = START[i];
          return (
            <g key={i}>
              <Cross x={sx} y={sy} color={COLORS[i]} dim />
              <line x1={sx} y1={sy} x2={tx + (sx - tx) * 0.22} y2={ty + (sy - ty) * 0.22} stroke={COLORS[i]} strokeWidth={2} markerEnd={`url(#km-move-${i})`} />
              <Cross x={tx} y={ty} color={COLORS[i]} />
            </g>
          );
        })}
      </Art>
    ),
  },
];

export const neuralNetworkFigures: ConceptFigure[] = [
  {
    title: "One neuron: weigh, add, squash",
    caption: "Multiply each input by a weight, add them up with a bias, then pass the total through an S-shaped activation (tanh).",
    art: (
      <Art label="Two inputs with weights feeding a sum node, then a tanh curve, then the output">
        <Arrowhead id="nn-a" color={C.muted} />
        {[
          { y: 44, t: "x" },
          { y: 106, t: "y" },
        ].map((n, i) => (
          <g key={n.t}>
            <circle cx={26} cy={n.y} r={14} fill={C.card} stroke={C.sky} strokeWidth={1.5} />
            <text x={26} y={n.y + 4} textAnchor="middle" fontSize={12} fill={C.fg}>{n.t}</text>
            <line x1={42} y1={n.y} x2={96} y2={75 + (i ? 8 : -8)} stroke={C.muted} strokeWidth={1.5} markerEnd="url(#nn-a)" />
            <text x={60} y={n.y + (i ? 16 : -8)} fontSize={10} fill={C.amber}>{i ? "× w₂" : "× w₁"}</text>
          </g>
        ))}
        <circle cx={112} cy={75} r={16} fill={C.card} stroke={C.fg} strokeWidth={1.5} />
        <text x={112} y={80} textAnchor="middle" fontSize={15} fill={C.fg}>Σ</text>
        <text x={112} y={108} textAnchor="middle" fontSize={10} fill={C.muted}>+ b</text>
        <line x1={130} y1={75} x2={150} y2={75} stroke={C.muted} strokeWidth={1.5} markerEnd="url(#nn-a)" />
        <rect x={152} y={55} width={40} height={40} rx={8} fill={C.card} stroke={C.teal} />
        <path d="M156,88 C170,88 172,62 188,62" fill="none" stroke={C.teal} strokeWidth={2} />
        <text x={172} y={110} textAnchor="middle" fontSize={10} fill={C.teal}>tanh</text>
        <line x1={194} y1={75} x2={214} y2={75} stroke={C.muted} strokeWidth={1.5} markerEnd="url(#nn-a)" />
        <text x={226} y={79} textAnchor="middle" fontSize={11} fill={C.fg}>out</text>
      </Art>
    ),
  },
  {
    title: "One line can't, a layer can",
    caption: "In XOR, opposite corners match. No single straight line separates the colours, but a hidden layer combines several lines into a curved boundary.",
    art: (
      <Art label="Left: XOR corners with a straight line that fails. Right: a curved region that separates them">
        {[0, 1].map((panel) => {
          const ox = panel * 122 + 8;
          const pts = [
            [ox + 22, 30, C.teal],
            [ox + 84, 120, C.teal],
            [ox + 22, 120, C.violet],
            [ox + 84, 30, C.violet],
          ] as const;
          return (
            <g key={panel}>
              <rect x={ox} y={12} width={106} height={126} rx={10} fill="none" stroke={C.grid} />
              {panel === 0 ? (
                <>
                  <line x1={ox + 6} y1={128} x2={ox + 100} y2={22} stroke={C.red} strokeWidth={2} strokeDasharray="5 4" />
                  <text x={ox + 53} y={146} textAnchor="middle" fontSize={10} fill={C.red}>one line: stuck</text>
                </>
              ) : (
                <>
                  <path
                    d={`M${ox},${12} L${ox + 53},${12} C${ox + 53},${60} ${ox + 53},${75} ${ox},${75} Z M${ox + 106},${138} L${ox + 53},${138} C${ox + 53},${90} ${ox + 53},${75} ${ox + 106},${75} Z`}
                    fill={C.teal}
                    opacity={0.16}
                  />
                  <text x={ox + 53} y={146} textAnchor="middle" fontSize={10} fill={C.green}>hidden layer: solved</text>
                </>
              )}
              {pts.map(([x, y, c], i) => (
                <circle key={i} cx={x} cy={y} r={7} fill={c} />
              ))}
            </g>
          );
        })}
      </Art>
    ),
  },
  {
    title: "Learn by passing blame backwards",
    caption: "Forward: data flows in, a prediction comes out. Backward: the error flows back, and each weight learns how much it was to blame, then nudges.",
    art: (
      <Art label="A small network with forward arrows in teal and backward arrows in amber">
        <Arrowhead id="nn-f" color={C.teal} />
        <Arrowhead id="nn-b" color={C.amber} />
        {(() => {
          const layers = [
            [50, 100],
            [36, 75, 114],
            [75],
          ];
          const xs = [40, 120, 200];
          return (
            <>
              {layers.slice(0, -1).map((l, li) =>
                l.map((y1) =>
                  layers[li + 1].map((y2) => (
                    <line key={`${li}-${y1}-${y2}`} x1={xs[li]} y1={y1} x2={xs[li + 1]} y2={y2} stroke={C.grid} strokeWidth={1.2} />
                  )),
                ),
              )}
              {layers.map((l, li) =>
                l.map((y) => <circle key={`${li}-${y}`} cx={xs[li]} cy={y} r={10} fill={C.card} stroke={li === 2 ? C.teal : C.fg} strokeWidth={1.5} />),
              )}
              <line x1={40} y1={16} x2={196} y2={16} stroke={C.teal} strokeWidth={2} markerEnd="url(#nn-f)" />
              <text x={118} y={11} textAnchor="middle" fontSize={10} fill={C.teal}>forward: predict</text>
              <line x1={200} y1={136} x2={44} y2={136} stroke={C.amber} strokeWidth={2} markerEnd="url(#nn-b)" />
              <text x={122} y={148} textAnchor="middle" fontSize={10} fill={C.amber}>backward: share the blame</text>
              <text x={214} y={79} fontSize={10} fill={C.fg}>error</text>
            </>
          );
        })()}
      </Art>
    ),
  },
];
