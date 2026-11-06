// Illustrations for the Decision Tree page, on the shared 240×150 canvas.

import type { FC } from "react";

import { C } from "../colors";
import { Art, Arrowhead, type ConceptFigure } from "../shared";

const Q: FC<{ x: number; y: number; w: number; text: string }> = ({ x, y, w, text }) => (
  <g>
    <rect x={x - w / 2} y={y - 11} width={w} height={22} rx={7} fill={C.card} stroke={C.amber} />
    <text x={x} y={y + 4} textAnchor="middle" fontSize={10} fill={C.fg}>
      {text}
    </text>
  </g>
);
const Leaf: FC<{ x: number; y: number; text: string; color: string }> = ({ x, y, text, color }) => (
  <g>
    <rect x={x - 24} y={y - 10} width={48} height={20} rx={10} fill={color} fillOpacity={0.25} stroke={color} />
    <text x={x} y={y + 4} textAnchor="middle" fontSize={10} fill={C.fg}>
      {text}
    </text>
  </g>
);

export const treeFigures: ConceptFigure[] = [
  {
    title: "A game of 20 questions",
    caption: "Each question checks one thing and has a yes or no answer. Follow the answers down until you reach a leaf: that's the prediction.",
    art: (
      <Art label="A small tree: is weight at most 150 grams, then is the diameter at most 3 cm, ending in cherry, apple or orange">
        <Arrowhead id="tf-a" color={C.muted} />
        <Q x={120} y={22} w={124} text="Weight ≤ 150 g?" />
        <line x1={96} y1={33} x2={66} y2={62} stroke={C.muted} markerEnd="url(#tf-a)" />
        <line x1={144} y1={33} x2={186} y2={62} stroke={C.muted} markerEnd="url(#tf-a)" />
        <text x={72} y={46} fontSize={9} fill={C.green}>yes</text>
        <text x={166} y={46} fontSize={9} fill={C.red}>no</text>
        <Q x={60} y={76} w={104} text="Diameter ≤ 3 cm?" />
        <Leaf x={190} y={76} text="orange" color={C.amber} />
        <line x1={44} y1={87} x2={32} y2={112} stroke={C.muted} markerEnd="url(#tf-a)" />
        <line x1={76} y1={87} x2={96} y2={112} stroke={C.muted} markerEnd="url(#tf-a)" />
        <text x={24} y={102} fontSize={9} fill={C.green}>yes</text>
        <text x={92} y={102} fontSize={9} fill={C.red}>no</text>
        <Leaf x={30} y={126} text="cherry" color={C.red} />
        <Leaf x={102} y={126} text="apple" color={C.teal} />
      </Art>
    ),
  },
  {
    title: "Each question cuts the plot in two",
    caption: "A question looks at one feature, so each cut is straight across or straight up. Together the cuts carve the space into boxes, one answer per box.",
    art: (
      <Art label="A square of points divided by one vertical and one horizontal cut into three boxes">
        <rect x={20} y={14} width={200} height={124} fill="none" stroke={C.grid} />
        <rect x={20} y={14} width={90} height={124} fill={C.teal} opacity={0.12} />
        <rect x={110} y={14} width={110} height={56} fill={C.violet} opacity={0.14} />
        <rect x={110} y={70} width={110} height={68} fill={C.amber} opacity={0.12} />
        <line x1={110} y1={14} x2={110} y2={138} stroke={C.fg} strokeWidth={2} />
        <line x1={110} y1={70} x2={220} y2={70} stroke={C.fg} strokeWidth={2} strokeDasharray="5 3" />
        {[
          [40, 40, C.teal], [60, 90, C.teal], [80, 60, C.teal], [50, 118, C.teal],
          [140, 34, C.violet], [180, 46, C.violet], [200, 28, C.violet],
          [150, 100, C.amber], [190, 116, C.amber], [130, 124, C.amber],
        ].map(([x, y, c], i) => (
          <circle key={i} cx={x as number} cy={y as number} r={4.5} fill={c as string} />
        ))}
        <text x={113} y={148} fontSize={9} fill={C.fg}>1st cut</text>
        <text x={168} y={66} fontSize={9} fill={C.fg}>2nd cut</text>
      </Art>
    ),
  },
  {
    title: "Pick the question that sorts best",
    caption: "Gini impurity measures how mixed a group is: 0 when every point is the same class, 0.5 for a 50/50 mix of two. The best question leaves both sides as unmixed as possible.",
    art: (
      <Art label="A mixed group with Gini 0.5 split two ways: a poor split that stays mixed and a good split into nearly pure groups">
        <Arrowhead id="tf-b" color={C.muted} />
        {(() => {
          const dots = (cx: number, cy: number, cols: string[]) =>
            cols.map((c, i) => <circle key={i} cx={cx + (i % 4) * 9 - 13} cy={cy + Math.floor(i / 4) * 9 - 4} r={3.5} fill={c} />);
          const T = C.teal;
          const V = C.violet;
          return (
            <>
              {dots(120, 18, [T, V, T, V, V, T, V, T])}
              <text x={120} y={44} textAnchor="middle" fontSize={9} fill={C.muted}>Gini 0.5</text>
              <line x1={104} y1={48} x2={64} y2={68} stroke={C.muted} markerEnd="url(#tf-b)" />
              <line x1={136} y1={48} x2={176} y2={68} stroke={C.muted} markerEnd="url(#tf-b)" />
              <text x={58} y={62} textAnchor="middle" fontSize={9} fill={C.red}>poor question</text>
              <text x={184} y={62} textAnchor="middle" fontSize={9} fill={C.green}>good question</text>
              {dots(40, 86, [T, V, T, V])}
              {dots(84, 86, [V, T, V, T])}
              <text x={62} y={110} textAnchor="middle" fontSize={9} fill={C.red}>still 0.5 and 0.5</text>
              {dots(160, 86, [T, T, T, V])}
              {dots(206, 86, [V, V, V, T])}
              <text x={183} y={110} textAnchor="middle" fontSize={9} fill={C.green}>0.375 and 0.375</text>
              <text x={120} y={136} textAnchor="middle" fontSize={10} fill={C.fg}>lower = purer = better question</text>
            </>
          );
        })()}
      </Art>
    ),
  },
];
