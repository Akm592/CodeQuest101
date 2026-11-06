// Batch vs stochastic vs mini-batch gradient descent on the same line-fitting
// problem, drawn as three paths across the same error map.

import * as React from "react";

import { useAlgorithmPlayer } from "../../../hooks/useAlgorithmPlayer";
import { BATCH_INFO, BATCH_KINDS, buildBatchFrames, lineData, mseOf, runBatchKind, type BatchKind } from "../../../lib/ml/batchTypes";
import type { LossSurface } from "../../../lib/ml/gradientDescent";
import { Surface } from "../../ui/surface";
import VisualizerControls from "../../Visualizer/VisualizerControls";
import { C } from "../colors";
import { SectionTitle } from "../mathBlocks";
import { mapScale, MAP_W, useContourCanvas } from "./mapCanvas";

const STEPS = 60;
const LR = 0.15;
const START: [number, number] = [-0.5, -0.8];
// The map is centred on (CX, CY) so the shared contour painter can be reused.
const CX = 1.5;
const CY = 0.5;
const COLORS: Record<BatchKind, string> = { batch: C.teal, stochastic: C.red, minibatch: C.amber };

const BatchCompare: React.FC = () => {
  const data = React.useMemo(() => lineData(), []);
  const surface = React.useMemo<LossSurface>(
    () => ({
      key: "bowl",
      label: "Line fit",
      blurb: "",
      f: (x, y) => mseOf(data, x + CX, y + CY),
      grad: () => [0, 0],
      xr: 2.5,
      yr: 1.6,
      start: [0, 0],
      safeLr: 1,
      lrNote: "",
      minima: [],
    }),
    [data],
  );
  const runs = React.useMemo(
    () => Object.fromEntries(BATCH_KINDS.map((k) => [k, runBatchKind(k, data, START, LR, STEPS)])) as Record<BatchKind, ReturnType<typeof runBatchKind>>,
    [data],
  );
  const frames = React.useMemo(() => buildBatchFrames(runs, STEPS), [runs]);
  const player = useAlgorithmPlayer(frames, { initialDelayMs: 200 });
  const k = player.current?.step ?? 0;

  const { H, sx, sy } = mapScale(surface);
  const canvasRef = useContourCanvas(surface, H);
  const X = (w: number) => sx(w - CX);
  const Y = (b: number) => sy(b - CY);

  return (
    <section aria-labelledby="gd-batch-title" className="space-y-4">
      <SectionTitle id="gd-batch-title" kicker="How much data per step" title="Batch, stochastic and mini-batch">
        <p>
          To measure the slope exactly, you'd check every example in your data, which is slow when there are millions. The three versions of
          gradient descent differ only in how many examples they look at before each step. Here all three fit a line to the same 40 points, from
          the same start, with the same learning rate ({LR}).
        </p>
      </SectionTitle>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_19rem]">
        <Surface variant="card" radius="2xl" className="min-w-0 p-3 sm:p-4">
          <div className="relative overflow-hidden rounded-xl" style={{ aspectRatio: `${MAP_W} / ${H}` }}>
            <canvas ref={canvasRef} width={MAP_W} height={H} className="absolute inset-0 h-full w-full" aria-hidden="true" />
            <svg viewBox={`0 0 ${MAP_W} ${H}`} className="absolute inset-0 h-full w-full" role="img" aria-label="Three descent paths across the line-fitting error map">
              {BATCH_KINDS.map((kind) => {
                const pts = runs[kind].path.slice(0, k + 1);
                return (
                  <g key={kind}>
                    <polyline points={pts.map(([w, b]) => `${X(w).toFixed(1)},${Y(b).toFixed(1)}`).join(" ")} fill="none" stroke={COLORS[kind]} strokeWidth={1.8} strokeLinejoin="round" opacity={0.9} />
                    <circle cx={X(pts.at(-1)![0])} cy={Y(pts.at(-1)![1])} r={6} fill={COLORS[kind]} stroke="hsl(var(--background))" strokeWidth={2} />
                  </g>
                );
              })}
              <text x={X(START[0]) + 10} y={Y(START[1]) + 4} fontSize={11} fill={C.fg}>
                start
              </text>
              <text x={8} y={14} fontSize={10} fill={C.muted}>
                across: slope w of the line · up: where it crosses, b
              </text>
            </svg>
          </div>
        </Surface>

        <Surface variant="card" radius="2xl" className="flex min-w-0 flex-col gap-3 p-4">
          {BATCH_KINDS.map((kind) => (
            <div key={kind} className="rounded-xl border border-white/[0.06] bg-black/20 p-3">
              <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: COLORS[kind] }} />
                {BATCH_INFO[kind].label}
              </p>
              <dl className="mt-2 grid grid-cols-2 gap-x-3 text-xs">
                <dt className="text-muted-foreground">Points per step</dt>
                <dd className="text-right font-mono text-foreground">{BATCH_INFO[kind].size(data.length)}</dd>
                <dt className="text-muted-foreground">Points looked at</dt>
                <dd className="text-right font-mono text-foreground">{runs[kind].seen[k]}</dd>
                <dt className="text-muted-foreground">Error now</dt>
                <dd className="text-right font-mono text-foreground">{runs[kind].losses[k].toFixed(3)}</dd>
              </dl>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{BATCH_INFO[kind].blurb}</p>
            </div>
          ))}
        </Surface>
      </div>

      <Surface variant="card" radius="2xl" className="space-y-4 p-4 sm:p-6">
        <VisualizerControls
          status={player.status}
          onPlay={player.play}
          onPause={player.pause}
          onReset={player.reset}
          onStepForward={player.stepForward}
          onStepBack={player.stepBack}
          delayMs={player.delayMs}
          onDelayChange={player.setDelayMs}
          minDelayMs={40}
          maxDelayMs={1200}
          stepIndex={player.index}
          stepCount={player.stepCount}
        />
        <p className="min-h-[2.5rem] text-sm text-foreground" aria-live="polite">
          {player.current ? player.current.explanation : "Press Start: the teal path walks smoothly, the red one wobbles, the amber one is in between."}
        </p>
        <p className="text-xs leading-relaxed text-muted-foreground">
          In practice almost everyone uses mini-batches: they're nearly as cheap as single examples, the noise is small, and computers process a
          group of examples at once very efficiently. Common batch sizes are between about 50 and 256. People often say “SGD” when they actually
          mean mini-batch. Because the stochastic versions never see the exact slope, they keep jittering near the bottom unless the learning rate
          is lowered over time (see schedules below).
        </p>
      </Surface>
    </section>
  );
};

export default BatchCompare;
