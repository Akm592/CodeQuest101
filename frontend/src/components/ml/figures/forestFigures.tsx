// Illustrations for the Random Forest page, on the shared 240×150 canvas.

import type { FC } from "react";

import { C } from "../colors";
import { Art, Arrowhead, type ConceptFigure } from "../shared";

const MiniTree: FC<{ x: number; y: number; color: string }> = ({ x, y, color }) => (
  <g>
    <line x1={x} y1={y} x2={x - 10} y2={y + 14} stroke={C.muted} />
    <line x1={x} y1={y} x2={x + 10} y2={y + 14} stroke={C.muted} />
    <circle cx={x} cy={y} r={4} fill={C.card} stroke={C.amber} />
    <circle cx={x - 10} cy={y + 16} r={3.5} fill={color} />
    <circle cx={x + 10} cy={y + 16} r={3.5} fill={color === C.teal ? C.violet : C.teal} />
  </g>
);

export const forestFigures: ConceptFigure[] = [
  {
    title: "Ask a crowd, not one person",
    caption: "One tree makes jumpy mistakes. Many different trees make different mistakes, and averaging their answers cancels much of them out.",
    art: (
      <Art label="Five small trees each voting teal or violet, combined into one answer">
        <Arrowhead id="ff-a" color={C.muted} />
        {[20, 62, 104, 146, 188].map((x, i) => (
          <g key={x}>
            <MiniTree x={x + 16} y={16} color={i === 3 ? C.violet : C.teal} />
            <text x={x + 16} y={56} textAnchor="middle" fontSize={9} fill={i === 3 ? C.violet : C.teal}>
              {i === 3 ? "violet" : "teal"}
            </text>
            <line x1={x + 16} y1={62} x2={120} y2={98} stroke={C.grid} markerEnd="url(#ff-a)" />
          </g>
        ))}
        <rect x={74} y={102} width={92} height={28} rx={10} fill={C.teal} fillOpacity={0.2} stroke={C.teal} />
        <text x={120} y={120} textAnchor="middle" fontSize={11} fill={C.fg}>
          average: teal
        </text>
        <text x={120} y={145} textAnchor="middle" fontSize={9} fill={C.muted}>4 of 5 agree, so one wrong tree doesn't matter</text>
      </Art>
    ),
  },
  {
    title: "Each tree gets a random sample",
    caption: "Pick rows at random, putting each one back after picking (a bootstrap sample). Some rows come up twice and about a third are never picked: those are that tree's “out-of-bag” rows.",
    art: (
      <Art label="Ten numbered rows, a bootstrap sample with repeats, and the rows that were left out">
        <text x={10} y={20} fontSize={10} fill={C.muted}>the data</text>
        {Array.from({ length: 10 }, (_, i) => (
          <g key={i}>
            <rect x={10 + i * 22} y={26} width={18} height={18} rx={4} fill={C.card} stroke={C.grid} />
            <text x={19 + i * 22} y={39} textAnchor="middle" fontSize={10} fill={C.fg}>{i + 1}</text>
          </g>
        ))}
        <text x={10} y={66} fontSize={10} fill={C.muted}>one tree's sample (10 picks)</text>
        {[3, 7, 1, 3, 9, 10, 7, 2, 5, 3].map((v, i) => (
          <g key={i}>
            <rect x={10 + i * 22} y={72} width={18} height={18} rx={4} fill={C.teal} fillOpacity={0.2} stroke={C.teal} />
            <text x={19 + i * 22} y={85} textAnchor="middle" fontSize={10} fill={C.fg}>{v}</text>
          </g>
        ))}
        <text x={10} y={112} fontSize={10} fill={C.muted}>never picked (out-of-bag)</text>
        {[4, 6, 8].map((v, i) => (
          <g key={v}>
            <rect x={10 + i * 22} y={118} width={18} height={18} rx={4} fill="none" stroke={C.amber} strokeDasharray="3 2" />
            <text x={19 + i * 22} y={131} textAnchor="middle" fontSize={10} fill={C.amber}>{v}</text>
          </g>
        ))}
        <text x={84} y={131} fontSize={10} fill={C.fg}>3 of 10 left out</text>
      </Art>
    ),
  },
  {
    title: "Each question looks at only some features",
    caption: "At every split, a tree may only choose from a random few of the features. That stops every tree from asking the same first question, so the trees really are different.",
    art: (
      <Art label="Two trees: one only allowed to ask about x at the top, the other only about y, giving different first cuts">
        {[0, 1].map((k) => {
          const ox = 10 + k * 120;
          return (
            <g key={k}>
              <rect x={ox} y={20} width={100} height={92} fill="none" stroke={C.grid} />
              {k === 0 ? (
                <line x1={ox + 46} y1={20} x2={ox + 46} y2={112} stroke={C.fg} strokeWidth={2} />
              ) : (
                <line x1={ox} y1={60} x2={ox + 100} y2={60} stroke={C.fg} strokeWidth={2} />
              )}
              {[
                [18, 32, C.teal], [30, 80, C.teal], [38, 50, C.teal], [62, 30, C.violet], [80, 70, C.violet], [70, 96, C.violet], [24, 100, C.violet], [84, 40, C.teal],
              ].map(([x, y, c], i) => (
                <circle key={i} cx={ox + (x as number)} cy={y as number} r={4} fill={c as string} />
              ))}
              <text x={ox + 50} y={128} textAnchor="middle" fontSize={10} fill={C.fg}>
                tree {k + 1}: may ask about {k === 0 ? "x" : "y"}
              </text>
            </g>
          );
        })}
      </Art>
    ),
  },
];
