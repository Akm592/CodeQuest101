// Illustrations for Self-Attention and Next-Token Sampling.

import type { FC } from "react";

import { C } from "../colors";
import { Art, Arrowhead, type ConceptFigure } from "../shared";

const Chip: FC<{ x: number; y: number; w: number; text: string; color?: string; strong?: boolean }> = ({ x, y, w, text, color = C.grid, strong }) => (
  <g>
    <rect x={x} y={y} width={w} height={20} rx={6} fill={strong ? color : C.card} fillOpacity={strong ? 0.22 : 1} stroke={color} />
    <text x={x + w / 2} y={y + 14} textAnchor="middle" fontSize={11} fill={C.fg}>{text}</text>
  </g>
);

// "the cat sat on the mat because it was tired", condensed to fit.
const WORDS = [
  { t: "cat", x: 8, w: 34 },
  { t: "sat", x: 46, w: 34 },
  { t: "on", x: 84, w: 26 },
  { t: "mat", x: 114, w: 34 },
  { t: "…", x: 152, w: 22 },
  { t: "it", x: 178, w: 26 },
  { t: "tired", x: 208, w: 28 },
];

export const attentionFigures: ConceptFigure[] = [
  {
    title: "Every word asks and offers",
    caption: "Each word makes a query (what am I looking for?) and a key (what can I be found by?). “it” is looking for a thing, ideally a living one.",
    art: (
      <Art label="The word it with a query bubble, and cat and mat with key tags underneath">
        <rect x={120} y={10} width={112} height={34} rx={10} fill={C.card} stroke={C.violet} />
        <text x={176} y={24} textAnchor="middle" fontSize={10} fill={C.violet}>query of “it”</text>
        <text x={176} y={37} textAnchor="middle" fontSize={10} fill={C.fg}>a thing? alive?</text>
        <path d="M188,44 L190,62" stroke={C.violet} strokeWidth={1.5} />
        {WORDS.map((w) => (
          <Chip key={w.t} x={w.x} y={64} w={w.w} text={w.t} color={w.t === "it" ? C.teal : C.grid} strong={w.t === "it"} />
        ))}
        {[
          { x: 25, t1: "key:", t2: "thing, animal" },
          { x: 131, t1: "key:", t2: "thing" },
        ].map((k) => (
          <g key={k.x}>
            <path d={`M${k.x},86 L${Math.max(k.x, 44)},100`} stroke={C.sky} strokeWidth={1.5} />
            <rect x={Math.max(k.x, 44) - 38} y={100} width={76} height={34} rx={8} fill={C.card} stroke={C.sky} />
            <text x={Math.max(k.x, 44)} y={114} textAnchor="middle" fontSize={10} fill={C.sky}>{k.t1}</text>
            <text x={Math.max(k.x, 44)} y={127} textAnchor="middle" fontSize={10} fill={C.fg}>{k.t2}</text>
          </g>
        ))}
      </Art>
    ),
  },
  {
    title: "Score each word, then softmax",
    caption: "Query · key gives a score per word. Softmax turns the scores into shares that add up to 100%. Thicker arcs here mean more attention.",
    art: (
      <Art label="Arcs from the word it to the other words, thickest to cat">
        {WORDS.map((w) => (
          <Chip key={w.t} x={w.x} y={110} w={w.w} text={w.t} color={w.t === "it" ? C.teal : C.grid} strong={w.t === "it"} />
        ))}
        {[
          { to: 25, share: 0.49, label: "49%" },
          { to: 131, share: 0.16, label: "16%" },
          { to: 63, share: 0.06, label: "" },
          { to: 97, share: 0.06, label: "" },
          { to: 222, share: 0.06, label: "" },
        ].map((a) => {
          const from = 191;
          const mid = (from + a.to) / 2;
          const h = Math.abs(from - a.to) * 0.55 + 10;
          return (
            <g key={a.to}>
              <path d={`M${from},108 Q${mid},${108 - h} ${a.to},108`} fill="none" stroke={C.green} strokeWidth={1 + a.share * 14} strokeOpacity={0.35 + a.share} strokeLinecap="round" />
              {a.label && (
                <text x={mid} y={108 - h / 2 - 6} textAnchor="middle" fontSize={11} fill={C.green}>{a.label}</text>
              )}
            </g>
          );
        })}
      </Art>
    ),
  },
  {
    title: "Blend the values into new meaning",
    caption: "Mix every word's value by its share. The new “it” is mostly “cat”, so it now carries “animal”: the model knows what “it” refers to.",
    art: (
      <Art label="A bar split into shares from cat, mat and others, flowing into a new vector for it with animal lit up">
        <Arrowhead id="att-blend" color={C.muted} />
        {(() => {
          const parts = [
            { w: 0.49, c: C.teal, t: "cat" },
            { w: 0.16, c: C.sky, t: "mat" },
            { w: 0.35, c: C.idle, t: "others" },
          ];
          let x = 14;
          return parts.map((p) => {
            const w = p.w * 212;
            const el = (
              <g key={p.t}>
                <rect x={x} y={22} width={w - 2} height={24} rx={4} fill={p.c} opacity={0.75} />
                <text x={x + w / 2} y={38} textAnchor="middle" fontSize={10} fill={C.fg}>{p.t}</text>
              </g>
            );
            x += w;
            return el;
          });
        })()}
        <line x1={120} y1={52} x2={120} y2={72} stroke={C.muted} strokeWidth={1.5} markerEnd="url(#att-blend)" />
        {["thing", "animal", "person", "refers", "action"].map((f, i) => {
          const v = [0.65, 0.49, 0, 0.07, 0.07][i];
          return (
            <g key={f}>
              <rect x={14 + i * 43} y={80} width={39} height={30} rx={6} fill={C.green} fillOpacity={0.08 + v * 0.7} stroke={C.grid} />
              <text x={33 + i * 43} y={99} textAnchor="middle" fontSize={10} fill={C.fg}>{v.toFixed(2)}</text>
              <text x={33 + i * 43} y={124} textAnchor="middle" fontSize={9} fill={C.muted}>{f}</text>
            </g>
          );
        })}
        <text x={120} y={142} textAnchor="middle" fontSize={10} fill={C.teal}>new “it”</text>
      </Art>
    ),
  },
];

const Bars: FC<{ x: number; y: number; h: number; values: number[]; labels?: string[]; colors?: string[]; bw?: number; gap?: number }> = ({
  x,
  y,
  h,
  values,
  labels,
  colors,
  bw = 22,
  gap = 6,
}) => {
  const max = Math.max(...values);
  return (
    <g>
      {values.map((v, i) => {
        const bh = (v / max) * h;
        return (
          <g key={i}>
            <rect x={x + i * (bw + gap)} y={y + h - bh} width={bw} height={bh} rx={3} fill={colors?.[i] ?? C.teal} />
            {labels && (
              <text x={x + i * (bw + gap) + bw / 2} y={y + h + 12} textAnchor="middle" fontSize={9} fill={C.muted}>{labels[i]}</text>
            )}
          </g>
        );
      })}
    </g>
  );
};

export const samplingFigures: ConceptFigure[] = [
  {
    title: "The model scores every next word",
    caption: "It doesn't know the next word. It ranks every possible one, and softmax turns those scores into probabilities.",
    art: (
      <Art label="The prompt 'The capital of France is' and a bar chart of candidate next words">
        <text x={12} y={22} fontSize={12} fill={C.fg}>The capital of France is</text>
        <rect x={168} y={10} width={58} height={18} rx={5} fill="none" stroke={C.teal} strokeDasharray="3 3" />
        <text x={197} y={23} textAnchor="middle" fontSize={11} fill={C.teal}>?</text>
        <Bars x={12} y={42} h={78} values={[0.86, 0.05, 0.03, 0.025, 0.015, 0.01]} labels={["Paris", "a", "located", "the", "Lyon", "…"]} bw={28} gap={9} />
      </Art>
    ),
  },
  {
    title: "Temperature: focused or adventurous",
    caption: "Low temperature makes the favourite even more likely. High temperature flattens the odds, so rarer words get picked more.",
    art: (
      <Art label="Two bar charts: a sharp one at low temperature and a flat one at high temperature">
        <text x={60} y={18} textAnchor="middle" fontSize={11} fill={C.sky}>T = 0.5 (focused)</text>
        <Bars x={14} y={30} h={90} values={[0.95, 0.03, 0.01, 0.006, 0.004]} bw={14} gap={6} colors={Array(5).fill(C.sky)} />
        <text x={180} y={18} textAnchor="middle" fontSize={11} fill={C.amber}>T = 1.6 (adventurous)</text>
        <Bars x={134} y={30} h={90} values={[0.34, 0.2, 0.17, 0.16, 0.13]} bw={14} gap={6} colors={Array(5).fill(C.amber)} />
        <line x1={120} y1={26} x2={120} y2={128} stroke={C.grid} />
        <text x={60} y={140} textAnchor="middle" fontSize={9} fill={C.muted}>most likely → least</text>
        <text x={180} y={140} textAnchor="middle" fontSize={9} fill={C.muted}>most likely → least</text>
      </Art>
    ),
  },
  {
    title: "Cut the tail, then roll the dice",
    caption: "Top-p keeps the likeliest words until they cover, say, 90%. The rest are dropped, then one word is picked at random by its share.",
    art: (
      <Art label="Bars with a cut-off line; bars past it are grey; a die picks from the rest">
        <Bars
          x={14}
          y={28}
          h={86}
          values={[0.42, 0.24, 0.14, 0.1, 0.05, 0.03, 0.02]}
          bw={16}
          gap={5}
          colors={[C.teal, C.teal, C.teal, C.teal, C.idle, C.idle, C.idle]}
        />
        <line x1={96} y1={18} x2={96} y2={120} stroke={C.red} strokeWidth={1.5} strokeDasharray="4 3" />
        <text x={91} y={14} textAnchor="end" fontSize={10} fill={C.teal}>kept: 90%</text>
        <text x={101} y={14} fontSize={10} fill={C.muted}>dropped</text>
        <g transform="translate(206 68) rotate(-12)">
          <rect x={-20} y={-20} width={40} height={40} rx={8} fill={C.card} stroke={C.fg} strokeWidth={1.5} />
          {[
            [-9, -9],
            [9, 9],
            [0, 0],
            [9, -9],
            [-9, 9],
          ].map(([dx, dy], i) => (
            <circle key={i} cx={dx} cy={dy} r={3} fill={C.fg} />
          ))}
        </g>
        <text x={206} y={112} textAnchor="middle" fontSize={10} fill={C.green}>pick one</text>
      </Art>
    ),
  },
];
