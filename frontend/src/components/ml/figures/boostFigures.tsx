// Illustrations for the Gradient Boosting page, on the shared 240×150 canvas.

import { C } from "../colors";
import { Art, Arrowhead, type ConceptFigure } from "../shared";

const PTS: [number, number][] = [
  [20, 100], [45, 80], [70, 60], [95, 70], [120, 40], [145, 50], [170, 30], [195, 45], [220, 25],
];

export const boostFigures: ConceptFigure[] = [
  {
    title: "A team that fixes each other's mistakes",
    caption: "A forest's trees work side by side. Boosting's trees work in a line: each one looks at what the team still gets wrong and fixes a bit of it.",
    art: (
      <Art label="Three trees in a row, each passing what's left to fix to the next">
        <Arrowhead id="bo-a" color={C.muted} />
        {[0, 1, 2].map((i) => {
          const x = 30 + i * 80;
          return (
            <g key={i}>
              <line x1={x} y1={40} x2={x - 14} y2={64} stroke={C.muted} />
              <line x1={x} y1={40} x2={x + 14} y2={64} stroke={C.muted} />
              <circle cx={x} cy={40} r={7} fill={C.card} stroke={C.amber} />
              <circle cx={x - 14} cy={66} r={5} fill={C.teal} />
              <circle cx={x + 14} cy={66} r={5} fill={C.teal} />
              <text x={x} y={96} textAnchor="middle" fontSize={10} fill={C.fg}>tree {i + 1}</text>
              <text x={x} y={112} textAnchor="middle" fontSize={9} fill={C.red}>
                {["big errors", "smaller", "smaller still"][i]}
              </text>
              {i < 2 && <line x1={x + 24} y1={52} x2={x + 52} y2={52} stroke={C.muted} strokeWidth={1.5} markerEnd="url(#bo-a)" />}
            </g>
          );
        })}
        <text x={120} y={140} textAnchor="middle" fontSize={10} fill={C.muted}>each tree gets what's left over</text>
      </Art>
    ),
  },
  {
    title: "Fit the leftovers, not the data",
    caption: "Start with a flat guess. The gaps between the guess and the points (residuals, in red) are what's still wrong. The next tree is trained on those gaps.",
    art: (
      <Art label="Points around a rising curve, a flat guess line, and red residual bars from the line to each point">
        <line x1={10} y1={62} x2={232} y2={62} stroke={C.teal} strokeWidth={2.5} />
        <text x={10} y={18} fontSize={10} fill={C.teal}>teal line: first guess, the average</text>
        {PTS.map(([x, y], i) => (
          <g key={i}>
            <line x1={x} y1={62} x2={x} y2={y} stroke={C.red} strokeWidth={2} />
            <circle cx={x} cy={y} r={4} fill={C.fg} />
          </g>
        ))}
        <text x={120} y={140} textAnchor="middle" fontSize={10} fill={C.red}>residual = point − guess</text>
      </Art>
    ),
  },
  {
    title: "Small steps beat big jumps",
    caption: "Each tree is added at only a fraction of its size (the learning rate). Small steps need more trees but follow the real pattern instead of the noise.",
    art: (
      <Art label="Two paths towards a target: one jumping and overshooting, one approaching in small steps">
        <Arrowhead id="bo-b" color={C.green} />
        <Arrowhead id="bo-c" color={C.red} />
        <circle cx={200} cy={75} r={10} fill="none" stroke={C.fg} strokeWidth={2} />
        <circle cx={200} cy={75} r={3} fill={C.fg} />
        <text x={200} y={100} textAnchor="middle" fontSize={9} fill={C.muted}>the pattern</text>
        <path d="M20,46 L228,92 L176,52 L214,86" fill="none" stroke={C.red} strokeWidth={2} strokeDasharray="5 3" markerEnd="url(#bo-c)" />
        <text x={20} y={34} fontSize={10} fill={C.red}>learning rate 1: big jumps, overshooting</text>
        {[20, 50, 80, 110, 135, 155, 170, 182, 190].map((x, i, a) => (i < a.length - 1 ? <line key={x} x1={x} y1={110 - i * 4} x2={a[i + 1]} y2={110 - (i + 1) * 4} stroke={C.green} strokeWidth={2} markerEnd={i === a.length - 2 ? "url(#bo-b)" : undefined} /> : null))}
        {[20, 50, 80, 110, 135, 155, 170, 182].map((x, i) => (
          <circle key={x} cx={x} cy={110 - i * 4} r={2.5} fill={C.green} />
        ))}
        <text x={80} y={130} textAnchor="middle" fontSize={10} fill={C.green}>learning rate 0.1: small steps</text>
      </Art>
    ),
  },
];
