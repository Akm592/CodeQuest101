// Illustrations for the Naive Bayes page, on the shared 240×150 canvas.

import type { FC } from "react";

import { C } from "../colors";
import { Art, Arrowhead, type ConceptFigure } from "../shared";

const Bar: FC<{ x: number; y: number; w: number; frac: number; color: string; label: string }> = ({ x, y, w, frac, color, label }) => (
  <g>
    <rect x={x} y={y} width={w} height={14} rx={4} fill={C.card} stroke={C.grid} />
    <rect x={x} y={y} width={w * frac} height={14} rx={4} fill={color} opacity={0.8} />
    <text x={x + w + 6} y={y + 11} fontSize={10} fill={C.fg}>
      {label}
    </text>
  </g>
);

const Chip: FC<{ x: number; y: number; text: string; color: string }> = ({ x, y, text, color }) => (
  <g>
    <rect x={x} y={y} width={text.length * 7 + 14} height={20} rx={6} fill={C.card} stroke={color} />
    <text x={x + 7} y={y + 14} fontSize={11} fill={C.fg}>
      {text}
    </text>
  </g>
);

export const bayesFigures: ConceptFigure[] = [
  {
    title: "Start with a guess, then update it",
    caption: "Before reading an email, the only clue is how common spam is. Each word you read is evidence that moves the guess up or down. That's Bayes' rule.",
    art: (
      <Art label="Spam chance starting at 50 percent, rising to 74 percent after the word free and 91 percent after cash">
        <Arrowhead id="bf-a" color={C.muted} />
        <text x={12} y={20} fontSize={10} fill={C.muted}>chance it's spam</text>
        <Bar x={12} y={30} w={150} frac={0.5} color={C.red} label="50%  before reading" />
        <Bar x={12} y={66} w={150} frac={0.74} color={C.red} label="74%  after “free”" />
        <Bar x={12} y={102} w={150} frac={0.91} color={C.red} label="91%  after “cash”" />
        <line x1={20} y1={48} x2={20} y2={62} stroke={C.muted} markerEnd="url(#bf-a)" />
        <line x1={20} y1={84} x2={20} y2={98} stroke={C.muted} markerEnd="url(#bf-a)" />
      </Art>
    ),
  },
  {
    title: "Naive: every word counts on its own",
    caption: "The model pretends words are unrelated, as if “free” and “money” never travel together. That's not true, but it makes the counting simple, and it still works surprisingly well.",
    art: (
      <Art label="Three word chips, each with its own separate arrow of evidence into the verdict">
        <Arrowhead id="bf-b" color={C.red} />
        <Chip x={12} y={18} text="free" color={C.red} />
        <Chip x={12} y={62} text="money" color={C.red} />
        <Chip x={12} y={106} text="meeting" color={C.teal} />
        <line x1={60} y1={28} x2={150} y2={68} stroke={C.red} strokeWidth={2} markerEnd="url(#bf-b)" />
        <line x1={70} y1={72} x2={150} y2={74} stroke={C.red} strokeWidth={2} markerEnd="url(#bf-b)" />
        <line x1={78} y1={116} x2={150} y2={80} stroke={C.teal} strokeWidth={2} />
        <rect x={156} y={56} width={74} height={36} rx={10} fill={C.card} stroke={C.fg} />
        <text x={193} y={78} textAnchor="middle" fontSize={11} fill={C.fg}>verdict</text>
        <text x={100} y={145} textAnchor="middle" fontSize={9} fill={C.muted}>no arrows between the words</text>
      </Art>
    ),
  },
  {
    title: "Multiply, compare, pick the bigger",
    caption: "For each class, multiply how common the class is by the chance of each word in it. The class with the bigger result wins.",
    art: (
      <Art label="Two rows of multiplications for spam and not spam, the spam total is bigger and wins">
        <text x={10} y={30} fontSize={11} fill={C.red}>spam</text>
        <text x={56} y={30} fontSize={11} fill={C.fg}>0.5 × 0.082 × 0.049</text>
        <text x={180} y={30} fontSize={11} fill={C.red}>= 0.0020</text>
        <text x={10} y={68} fontSize={11} fill={C.teal}>not spam</text>
        <text x={56} y={68} fontSize={11} fill={C.fg}>0.5 × 0.029 × 0.014</text>
        <text x={180} y={68} fontSize={11} fill={C.teal}>= 0.0002</text>
        <text x={56} y={46} fontSize={9} fill={C.muted}>prior × P(free) × P(cash), from this page’s emails</text>
        <rect x={60} y={96} width={120} height={30} rx={10} fill={C.red} fillOpacity={0.15} stroke={C.red} />
        <text x={120} y={115} textAnchor="middle" fontSize={11} fill={C.fg}>bigger → spam</text>
      </Art>
    ),
  },
];
