// Illustrations for the Evaluation Metrics page, on the shared 240×150 canvas.

import { C } from "../colors";
import { OUTCOME_COLOR } from "../metrics/outcomeColors";
import { Art, type ConceptFigure } from "../shared";

// Score positions on a 0–1 axis drawn from x = 20 to x = 220.
const sx = (s: number) => 20 + s * 200;
const SPAM = [0.92, 0.8, 0.66, 0.38];
const NORMAL = [0.58, 0.3, 0.18, 0.08];

export const metricsFigures: ConceptFigure[] = [
  {
    title: "A score, then a cut",
    caption: "A classifier doesn't say yes or no. It gives each email a score. A threshold turns scores into decisions: everything to the right is flagged as spam.",
    art: (
      <Art label="Spam and normal emails placed along a score line from 0 to 1, with a threshold at 0.5 splitting them into flagged and inbox">
        <text x={20} y={22} fontSize={9} fill={C.muted}>really spam</text>
        {SPAM.map((s) => <circle key={s} cx={sx(s)} cy={40} r={6} fill={C.fg} />)}
        <text x={20} y={68} fontSize={9} fill={C.muted}>really normal</text>
        {NORMAL.map((s) => <circle key={s} cx={sx(s)} cy={86} r={6} fill="none" stroke={C.fg} strokeWidth={1.5} />)}
        <line x1={20} x2={220} y1={110} y2={110} stroke={C.grid} />
        {[0, 0.5, 1].map((t) => (
          <text key={t} x={sx(t)} y={122} textAnchor="middle" fontSize={9} fill={C.muted}>{t}</text>
        ))}
        <line x1={sx(0.5)} x2={sx(0.5)} y1={14} y2={112} stroke={C.amber} strokeWidth={1.5} strokeDasharray="4 3" />
        <text x={sx(0.5) - 6} y={140} textAnchor="end" fontSize={10} fill={C.fg}>← inbox</text>
        <text x={sx(0.5) + 6} y={140} fontSize={10} fill={C.fg}>flagged →</text>
      </Art>
    ),
  },
  {
    title: "Four kinds of answer",
    caption: "Compare each decision with the truth. Right answers are true positives and true negatives. The two mistakes are different: a false positive hides a real email; a false negative lets spam through.",
    art: (
      <Art label="A two by two confusion matrix: 6 true positives, 3 false positives, 2 false negatives, 9 true negatives">
        <text x={104} y={14} textAnchor="middle" fontSize={9} fill={C.muted}>flagged</text>
        <text x={178} y={14} textAnchor="middle" fontSize={9} fill={C.muted}>not flagged</text>
        <text x={62} y={52} textAnchor="end" fontSize={9} fill={C.muted}>really spam</text>
        <text x={62} y={110} textAnchor="end" fontSize={9} fill={C.muted}>really normal</text>
        {(
          [
            ["tp", 68, 22, "6", "true positive"],
            ["fn", 142, 22, "2", "false negative"],
            ["fp", 68, 80, "3", "false positive"],
            ["tn", 142, 80, "9", "true negative"],
          ] as const
        ).map(([o, x, y, n, label]) => (
          <g key={o}>
            <rect x={x} y={y} width={70} height={52} rx={8} fill={OUTCOME_COLOR[o]} fillOpacity={0.22} stroke={OUTCOME_COLOR[o]} />
            <text x={x + 35} y={y + 26} textAnchor="middle" fontSize={16} fontWeight={600} fill={C.fg}>{n}</text>
            <text x={x + 35} y={y + 42} textAnchor="middle" fontSize={8} fill={C.fg}>{label}</text>
          </g>
        ))}
      </Art>
    ),
  },
  {
    title: "A trade-off, not one number",
    caption: "Raise the threshold and the filter only flags what it's sure about: precise, but it misses spam. Lower it and it catches more spam, with more false alarms. You choose the point.",
    art: (
      <Art label="Precision rising and recall falling as the threshold moves from 0 to 1">
        <line x1={24} x2={224} y1={118} y2={118} stroke={C.grid} />
        <line x1={24} x2={24} y1={18} y2={118} stroke={C.grid} />
        <path d="M24,92 C80,84 130,58 224,24" fill="none" stroke={C.sky} strokeWidth={2.5} />
        <path d="M24,22 C110,24 160,50 224,110" fill="none" stroke={C.violet} strokeWidth={2.5} />
        <text x={220} y={18} textAnchor="end" fontSize={10} fill={C.sky}>precision</text>
        <text x={40} y={16} fontSize={10} fill={C.violet}>recall</text>
        <text x={24} y={132} fontSize={9} fill={C.muted}>low threshold</text>
        <text x={224} y={132} textAnchor="end" fontSize={9} fill={C.muted}>high threshold</text>
        <text x={30} y={146} fontSize={9} fill={C.muted}>catch more spam</text>
        <text x={224} y={146} textAnchor="end" fontSize={9} fill={C.muted}>fewer false alarms</text>
      </Art>
    ),
  },
];
