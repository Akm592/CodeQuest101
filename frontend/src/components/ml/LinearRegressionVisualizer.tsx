import { Shuffle, Trash2 } from "lucide-react";
import * as React from "react";

import { useAlgorithmPlayer } from "../../hooks/useAlgorithmPlayer";
import { linearRegressionGuide, lrGuideStepFor } from "../../lib/guides/mlGuides";
import { LR_DEFAULT } from "../../lib/ml/demos";
import { buildLrSteps, leastSquares, samplePoints } from "../../lib/ml/linearRegression";
import type { Point } from "../../lib/ml/random";
import { Button } from "../ui/button";
import { Surface } from "../ui/surface";
import AlgorithmGuidePanel from "../Visualizer/AlgorithmGuide";
import VisualizerControls from "../Visualizer/VisualizerControls";
import { linearRegressionFigures } from "./figures/regressionFigures";
import { C } from "./colors";
import { ConceptFigures, LossChart, Plot, Segmented, Stat } from "./shared";

const LR_OPTIONS = [0.02, 0.1, 0.5, 1.05];
const TICKS = [0, 2, 4, 6, 8, 10];

const LinearRegressionVisualizer: React.FC = () => {
  const [seed, setSeed] = React.useState(LR_DEFAULT.seed);
  const [points, setPoints] = React.useState<Point[]>(() => samplePoints(LR_DEFAULT.seed));
  const [lr, setLr] = React.useState(LR_DEFAULT.lr);

  const steps = React.useMemo(() => buildLrSteps(points, lr), [points, lr]);
  const exact = React.useMemo(() => leastSquares(points), [points]);
  const player = useAlgorithmPlayer(steps, { initialDelayMs: 250 });
  const step = player.current ?? steps[0];
  const locked = player.status === "running";
  const showErrors = player.current !== null && step.phase !== "predict";

  // Keep coordinates finite when a fit diverges; the plot clips the rest.
  const clampY = (v: number) => Math.max(-1000, Math.min(1000, v));

  return (
    <div className="space-y-6">
      <ConceptFigures figures={linearRegressionFigures} />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_17rem]">
        <Surface variant="card" radius="2xl" className="min-w-0 p-3 sm:p-4">
          <Plot
            xDomain={[0, 10]}
            yDomain={[0, 10]}
            ticks={TICKS}
            label="Scatter plot of the points with the current fitted line"
            onPick={locked ? undefined : (p) => setPoints((ps) => [...ps, { x: +p.x.toFixed(2), y: +p.y.toFixed(2) }])}
          >
            {(s) => (
              <>
                {exact && (
                  <line
                    x1={s.x(0)}
                    y1={s.y(clampY(exact.intercept))}
                    x2={s.x(10)}
                    y2={s.y(clampY(exact.slope * 10 + exact.intercept))}
                    stroke={C.idle}
                    strokeWidth={1.5}
                    strokeDasharray="6 5"
                  />
                )}
                {showErrors &&
                  points.map((p, i) => (
                    <line
                      key={`e${i}`}
                      x1={s.x(p.x)}
                      x2={s.x(p.x)}
                      y1={s.y(p.y)}
                      y2={s.y(clampY(step.slope * p.x + step.intercept))}
                      stroke={C.red}
                      strokeWidth={1.4}
                      opacity={0.8}
                    />
                  ))}
                <line
                  x1={s.x(0)}
                  y1={s.y(clampY(step.intercept))}
                  x2={s.x(10)}
                  y2={s.y(clampY(step.slope * 10 + step.intercept))}
                  stroke={C.teal}
                  strokeWidth={2.5}
                  style={{ transition: "all 120ms linear" }}
                />
                {points.map((p, i) => (
                  <circle key={i} cx={s.x(p.x)} cy={s.y(p.y)} r={5} fill={C.fg} stroke="hsl(var(--background))" strokeWidth={1.5} />
                ))}
                <text x={s.x(0.2)} y={s.y(9.6)} fontSize={9} fill={C.muted}>
                  Click to add a point
                </text>
              </>
            )}
          </Plot>
        </Surface>

        <Surface variant="card" radius="2xl" className="flex flex-col gap-3 p-4">
          <div className="rounded-xl border border-white/[0.06] bg-black/20 px-3 py-3 text-center font-mono text-base text-foreground">
            y = <span style={{ color: C.teal }}>{step.slope.toFixed(2)}</span>x +{" "}
            <span style={{ color: C.amber }}>{step.intercept.toFixed(2)}</span>
          </div>
          <dl className="grid grid-cols-2 gap-2">
            <Stat label="Step" value={step.iter} />
            <Stat label="Error (MSE)" value={step.mse < 1e5 ? step.mse.toFixed(3) : "huge"} />
            <Stat label="Best possible" value={exact ? `y = ${exact.slope.toFixed(2)}x + ${exact.intercept.toFixed(2)}` : "–"} />
            <Stat label="Points" value={points.length} />
          </dl>
          <LossChart values={step.mses} total={Math.max(steps.at(-1)!.mses.length, 2)} log label="Error after each step (log scale)" />
        </Surface>
      </div>

      <Surface variant="card" radius="2xl" className="space-y-5 p-4 sm:p-6">
        <div className="flex flex-wrap items-end gap-x-6 gap-y-4">
          <Segmented
            label="Learning rate"
            value={lr}
            onChange={setLr}
            disabled={locked}
            options={LR_OPTIONS.map((v) => ({ value: v, label: String(v) }))}
          />
          <div className="flex gap-2">
            <Button
              variant="outline"
              disabled={locked}
              onClick={() => {
                const next = seed + 1;
                setSeed(next);
                setPoints(samplePoints(next));
              }}
            >
              <Shuffle /> New points
            </Button>
            <Button variant="outline" disabled={locked || points.length === 0} onClick={() => setPoints([])}>
              <Trash2 /> Clear
            </Button>
          </div>
        </div>

        <VisualizerControls
          status={player.status}
          onPlay={player.play}
          onPause={player.pause}
          onReset={player.reset}
          onStepForward={player.stepForward}
          onStepBack={player.stepBack}
          delayMs={player.delayMs}
          onDelayChange={player.setDelayMs}
          minDelayMs={30}
          maxDelayMs={1200}
          stepIndex={player.index}
          stepCount={player.stepCount}
        />
        <p className="min-h-[2.5rem] text-sm text-foreground" aria-live="polite">
          {player.current ? step.explanation : "Press Start to fit the line, or Step through the first few moves slowly."}
        </p>
      </Surface>

      <AlgorithmGuidePanel guide={linearRegressionGuide} activeStageId={player.current ? lrGuideStepFor(player.current) : null} />
    </div>
  );
};

export default LinearRegressionVisualizer;
