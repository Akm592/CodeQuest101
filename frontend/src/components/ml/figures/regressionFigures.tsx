// Illustrations for Gradient Descent and Linear Regression.
// Hand-drawn SVG on a shared 240×150 canvas, coloured from the theme tokens.

import { C } from "../colors";
import { Art, Arrowhead, type ConceptFigure } from "../shared";

// A valley curve used by the gradient descent figures, in figure pixels.
const valleyY = (x: number) => 28 + 0.0085 * (x - 128) ** 2;
const valleyPath = (x0 = 20, x1 = 230) =>
  Array.from({ length: 43 }, (_, i) => {
    const x = x0 + ((x1 - x0) * i) / 42;
    return `${i ? "L" : "M"}${x.toFixed(1)},${(150 - valleyY(x)).toFixed(1)}`;
  }).join(" ");

export const gradientDescentFigures: ConceptFigure[] = [
  {
    title: "Error is a landscape",
    caption: "Each spot is one choice of weights; its height is how wrong the model is there. Training means finding the lowest point.",
    art: (
      <Art label="A U-shaped curve of error against weights, with a ball high on the left and the lowest point marked">
        <line x1={18} y1={130} x2={232} y2={130} stroke={C.grid} />
        <line x1={18} y1={130} x2={18} y2={14} stroke={C.grid} />
        <text x={228} y={143} textAnchor="end" fontSize={10} fill={C.muted}>weights →</text>
        <text x={24} y={14} fontSize={10} fill={C.muted}>error ↑</text>
        <path d={valleyPath()} fill="none" stroke={C.fg} strokeWidth={2} />
        <circle cx={128} cy={150 - valleyY(128)} r={4} fill={C.green} />
        <text x={128} y={150 - valleyY(128) + 16} textAnchor="middle" fontSize={10} fill={C.green}>lowest error</text>
        <circle cx={48} cy={150 - valleyY(48) - 7} r={7} fill={C.teal} />
        <text x={62} y={150 - valleyY(48) - 14} fontSize={10} fill={C.fg}>you start here</text>
      </Art>
    ),
  },
  {
    title: "The slope points uphill, so step the other way",
    caption: "The gradient is the slope under your feet. Moving against it is the fastest way down from where you stand.",
    art: (
      <Art label="The valley curve with a tangent line at the ball and an arrow pointing downhill">
        <Arrowhead id="gd-down" color={C.teal} />
        <path d={valleyPath()} fill="none" stroke={C.muted} strokeWidth={1.5} />
        {(() => {
          const x = 60;
          const y = 150 - valleyY(x);
          const slope = -2 * 0.0085 * (x - 128); // screen-space slope (y down)
          return (
            <>
              <line x1={x - 34} y1={y - slope * 34} x2={x + 34} y2={y + slope * 34} stroke={C.amber} strokeWidth={2} strokeDasharray="4 3" />
              <text x={x - 32} y={y - slope * 34 - 6} fontSize={10} fill={C.amber}>slope (gradient)</text>
              <line x1={x} y1={y} x2={x + 30} y2={y + slope * 30} stroke={C.teal} strokeWidth={2.5} markerEnd="url(#gd-down)" />
              <text x={x + 14} y={y - 12} fontSize={10} fill={C.teal}>step = −lr × slope</text>
              <circle cx={x} cy={y} r={6} fill={C.teal} />
            </>
          );
        })()}
      </Art>
    ),
  },
  {
    title: "Step size (learning rate) matters",
    caption: "Too small crawls. Just right walks straight down. Too big jumps past the bottom and climbs out the other side.",
    art: (
      <Art label="Three small valleys: tiny steps, good steps, and steps that bounce out">
        {[
          { x0: 6, label: "too small", color: C.muted, xs: [14, 18, 22, 26, 30, 34] },
          { x0: 86, label: "just right", color: C.green, xs: [12, 28, 35, 38, 39] },
          { x0: 166, label: "too big", color: C.red, xs: [16, 62, 8, 72] },
        ].map((p) => {
          const vy = (x: number) => 30 + 0.05 * (x - 39) ** 2;
          const d = Array.from({ length: 21 }, (_, i) => {
            const x = 4 + (70 * i) / 20;
            return `${i ? "L" : "M"}${(p.x0 + x).toFixed(1)},${(150 - vy(x)).toFixed(1)}`;
          }).join(" ");
          const pts = p.xs.map((x) => [p.x0 + x, 150 - vy(x)] as const);
          return (
            <g key={p.label}>
              <path d={d} fill="none" stroke={C.grid} strokeWidth={1.5} />
              <polyline points={pts.map(([x, y]) => `${x},${y}`).join(" ")} fill="none" stroke={p.color} strokeWidth={1.4} />
              {pts.map(([x, y], i) => (
                <circle key={i} cx={x} cy={y} r={2.6} fill={p.color} />
              ))}
              <text x={p.x0 + 39} y={18} textAnchor="middle" fontSize={10} fill={p.color}>{p.label}</text>
            </g>
          );
        })}
      </Art>
    ),
  },
];

// Points for the regression figures, in figure pixels.
const PTS: [number, number][] = [
  [40, 108], [58, 96], [74, 101], [92, 84], [110, 80], [126, 70], [146, 64], [160, 52], [180, 50], [200, 36],
];
const lineY = (x: number) => 120 - 0.4 * x; // a good fit: y = 120 - 0.4x in pixels

export const linearRegressionFigures: ConceptFigure[] = [
  {
    title: "A line is a guess: y = w·x + b",
    caption: "w is the slope: how much y rises for each step in x. b is where the line crosses the y-axis.",
    art: (
      <Art label="A straight line with its intercept b and a slope triangle marked w">
        <line x1={24} y1={132} x2={230} y2={132} stroke={C.grid} />
        <line x1={24} y1={132} x2={24} y2={12} stroke={C.grid} />
        <line x1={24} y1={lineY(24)} x2={226} y2={lineY(226)} stroke={C.teal} strokeWidth={2.5} />
        <circle cx={24} cy={lineY(24)} r={4} fill={C.amber} />
        <text x={30} y={lineY(24) + 16} fontSize={11} fill={C.amber}>b (intercept)</text>
        <path d={`M120,${lineY(120)} L170,${lineY(120)} L170,${lineY(170)}`} fill="none" stroke={C.fg} strokeDasharray="3 3" />
        <text x={145} y={lineY(120) + 13} textAnchor="middle" fontSize={10} fill={C.muted}>1 step in x</text>
        <text x={176} y={(lineY(120) + lineY(170)) / 2 + 4} fontSize={11} fill={C.fg}>rises w</text>
        <text x={226} y={145} textAnchor="end" fontSize={10} fill={C.muted}>x →</text>
      </Art>
    ),
  },
  {
    title: "The errors are the vertical gaps",
    caption: "For each point, measure how far the line misses it. Square each gap and average them: the mean squared error.",
    art: (
      <Art label="Points around a line, with red vertical lines showing each miss and squares showing squared error">
        {(() => {
          const bad = (x: number) => 96 - 0.12 * x;
          return (
            <>
              <line x1={20} y1={bad(20)} x2={226} y2={bad(226)} stroke={C.idle} strokeWidth={2} />
              {PTS.map(([x, y], i) => {
                const ly = bad(x);
                const gap = Math.abs(ly - y);
                return (
                  <g key={i}>
                    {i === 2 || i === 8 ? (
                      <rect x={x} y={Math.min(ly, y)} width={gap} height={gap} fill={C.red} opacity={0.18} />
                    ) : null}
                    <line x1={x} y1={ly} x2={x} y2={y} stroke={C.red} strokeWidth={1.6} />
                    <circle cx={x} cy={y} r={3.5} fill={C.fg} />
                  </g>
                );
              })}
              <text x={226} y={144} textAnchor="end" fontSize={10} fill={C.red}>gap² = squared error</text>
            </>
          );
        })()}
      </Art>
    ),
  },
  {
    title: "Nudge w and b to shrink the total",
    caption: "Gradient descent tilts and lifts the line a little each step, in whichever direction lowers the error, until it can't do better.",
    art: (
      <Art label="A poor grey line rotating into a well-fitting teal line, with the error falling">
        <Arrowhead id="lr-nudge" color={C.amber} />
        <line x1={20} y1={96 - 0.12 * 20} x2={226} y2={96 - 0.12 * 226} stroke={C.idle} strokeWidth={2} strokeDasharray="5 4" />
        <line x1={20} y1={lineY(20)} x2={226} y2={lineY(226)} stroke={C.teal} strokeWidth={2.5} />
        {PTS.map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r={3.5} fill={C.fg} />
        ))}
        <path d="M206,74 Q216,54 206,40" fill="none" stroke={C.amber} strokeWidth={1.8} markerEnd="url(#lr-nudge)" />
        <text x={24} y={22} fontSize={11} fill={C.muted}>error 8.1</text>
        <text x={24} y={36} fontSize={11} fill={C.teal}>→ 0.6</text>
      </Art>
    ),
  },
];
