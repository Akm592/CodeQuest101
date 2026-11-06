// Gradient descent with one weight: the simplest view, shown first.

import * as React from "react";

import { useAlgorithmPlayer } from "../../../hooks/useAlgorithmPlayer";
import { buildGd1dSteps, error1d, shrinkFactor, TARGET, type Gd1dStep } from "../../../lib/ml/gd1d";
import { Surface } from "../../ui/surface";
import VisualizerControls from "../../Visualizer/VisualizerControls";
import { C } from "../colors";
import { SectionTitle } from "../mathBlocks";
import { Arrowhead, Plot, Segmented } from "../shared";

const LRS = [0.1, 0.3, 0.5, 0.8, 1, 1.05];
const STARTS = [-2, 0, 8];

/** What this learning rate will do, in words. */
function lrVerdict(lr: number): string {
  const k = shrinkFactor(lr);
  if (lr === 0.5) return "Lands exactly on the answer in one step.";
  if (Math.abs(k) < 1 && k > 0) return `Creeps closer each step: the gap shrinks to ${(k * 100).toFixed(0)}% every time.`;
  if (Math.abs(k) < 1) return `Overshoots and bounces from side to side, but the gap still shrinks to ${(Math.abs(k) * 100).toFixed(0)}% each time.`;
  if (Math.abs(k) === 1) return "Jumps to the mirror point every step: it bounces forever.";
  return `Overshoots further every time (the gap grows to ${(Math.abs(k) * 100).toFixed(0)}%): it blows up.`;
}

const OneWeight: React.FC<{ onStep?: (step: Gd1dStep | null) => void }> = ({ onStep }) => {
  const [lr, setLr] = React.useState(0.1);
  const [start, setStart] = React.useState(0);
  const steps = React.useMemo(() => buildGd1dSteps(start, lr), [start, lr]);
  const player = useAlgorithmPlayer(steps, { initialDelayMs: 650 });
  const step = player.current ?? steps[0];
  const current = player.current;
  React.useEffect(() => onStep?.(current), [current, onStep]);
  const locked = player.status === "running";
  const history = step.history;
  const nextW = step.w - lr * step.slope;
  const inChart = (w: number) => w >= -4 && w <= 10;

  return (
    <section aria-labelledby="gd-one-title" className="space-y-4">
      <SectionTitle id="gd-one-title" kicker="Start simple" title="One weight, one curve">
        <p>
          Imagine a model with a single setting, a weight called <span className="font-mono text-foreground">w</span>. The curve shows how wrong
          the model is for every value of <span className="font-mono text-foreground">w</span>: here the error is{" "}
          <span className="font-mono text-foreground">(w − 3)²</span>, so the best answer is <span className="font-mono text-foreground">w = 3</span>.
          The model doesn't know that. All it can do is measure the slope where it stands and step downhill.
        </p>
      </SectionTitle>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_19rem]">
        <Surface variant="card" radius="2xl" className="min-w-0 p-3 sm:p-4">
          <Plot xDomain={[-4, 10]} yDomain={[0, 50]} width={520} height={320} ticks={[-4, -2, 0, 2, 4, 6, 8, 10]} yTicks={[0, 10, 20, 30, 40, 50]} label="The error curve (w − 3)² with the ball's steps">
            {(s) => {
              const curve = Array.from({ length: 141 }, (_, i) => {
                const w = -4 + (14 * i) / 140;
                return `${i ? "L" : "M"}${s.x(w).toFixed(1)},${s.y(error1d(w)).toFixed(1)}`;
              }).join(" ");
              const showSlope = step.phase === "slope" && inChart(step.w);
              return (
                <>
                  <Arrowhead id="gd1-step" color={C.amber} />
                  <line x1={s.x(TARGET)} x2={s.x(TARGET)} y1={s.y(0)} y2={s.y(50)} stroke={C.green} strokeDasharray="4 4" opacity={0.6} />
                  <text x={s.x(TARGET) + 6} y={s.y(46)} fontSize={11} fill={C.green}>
                    best: w = 3
                  </text>
                  <path d={curve} fill="none" stroke={C.fg} strokeWidth={2} />
                  {history.slice(0, -1).map((h, i) =>
                    inChart(h.w) ? <circle key={i} cx={s.x(h.w)} cy={s.y(h.error)} r={3.5} fill={C.violet} opacity={0.45 + (0.5 * i) / history.length} /> : null,
                  )}
                  {history.length > 1 && (
                    <polyline
                      points={history.filter((h) => inChart(h.w)).map((h) => `${s.x(h.w)},${s.y(h.error)}`).join(" ")}
                      fill="none"
                      stroke={C.violet}
                      strokeWidth={1.2}
                      opacity={0.5}
                    />
                  )}
                  {showSlope && (
                    <>
                      <line
                        x1={s.x(step.w - 1.6)}
                        y1={s.y(step.error - 1.6 * step.slope)}
                        x2={s.x(step.w + 1.6)}
                        y2={s.y(step.error + 1.6 * step.slope)}
                        stroke={C.amber}
                        strokeWidth={2}
                        strokeDasharray="6 4"
                      />
                      {inChart(nextW) && (
                        <line
                          x1={s.x(step.w)}
                          y1={s.y(step.error)}
                          x2={s.x(nextW)}
                          y2={s.y(error1d(nextW))}
                          stroke={C.amber}
                          strokeWidth={2.5}
                          markerEnd="url(#gd1-step)"
                        />
                      )}
                    </>
                  )}
                  {inChart(step.w) && <circle cx={s.x(step.w)} cy={s.y(step.error)} r={8} fill={C.teal} stroke="hsl(var(--background))" strokeWidth={2} />}
                  <text x={s.x(9.8)} y={s.y(2)} textAnchor="end" fontSize={10} fill={C.muted}>
                    w →
                  </text>
                  <text x={s.x(-3.8)} y={s.y(48)} fontSize={10} fill={C.muted}>
                    error ↑
                  </text>
                </>
              );
            }}
          </Plot>
          <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-viz-current" /> where we are</span>
            <span className="flex items-center gap-1.5"><span className="h-0.5 w-5 border-t-2 border-dashed border-viz-compare" /> slope here</span>
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-viz-visited" /> earlier steps</span>
          </div>
        </Surface>

        <Surface variant="card" radius="2xl" className="flex min-w-0 flex-col gap-3 p-4">
          <p className="text-xs text-muted-foreground">Every step so far</p>
          <div className="max-h-72 overflow-auto rounded-xl border border-white/[0.06] bg-black/20">
            <table className="w-full text-right font-mono text-xs tabular-nums">
              <thead className="sticky top-0 bg-card text-[11px] text-muted-foreground">
                <tr>
                  <th className="px-2 py-1.5 text-left font-medium">step</th>
                  <th className="px-2 py-1.5 font-medium">w</th>
                  <th className="px-2 py-1.5 font-medium">slope</th>
                  <th className="px-2 py-1.5 font-medium">error</th>
                </tr>
              </thead>
              <tbody>
                {history.map((h, i) => (
                  <tr key={i} className={i === history.length - 1 ? "text-primary" : "text-foreground/85"}>
                    <td className="px-2 py-1 text-left">{i}</td>
                    <td className="px-2 py-1">{Math.abs(h.w) > 999 ? h.w.toExponential(1) : h.w.toFixed(3)}</td>
                    <td className="px-2 py-1">{Math.abs(h.slope) > 999 ? h.slope.toExponential(1) : h.slope.toFixed(3)}</td>
                    <td className="px-2 py-1">{h.error > 9999 ? h.error.toExponential(1) : h.error.toFixed(3)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-3 text-xs leading-relaxed text-muted-foreground">
            <span className="font-medium text-foreground">Learning rate {lr}: </span>
            {lrVerdict(lr)}
          </p>
        </Surface>
      </div>

      <Surface variant="card" radius="2xl" className="space-y-5 p-4 sm:p-6">
        <div className="flex flex-wrap items-end gap-x-6 gap-y-4">
          <Segmented label="Learning rate (step size)" value={lr} onChange={setLr} disabled={locked} options={LRS.map((v) => ({ value: v, label: String(v) }))} />
          <Segmented label="Start at w =" value={start} onChange={setStart} disabled={locked} options={STARTS.map((v) => ({ value: v, label: String(v) }))} />
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
          minDelayMs={80}
          maxDelayMs={1500}
          stepIndex={player.index}
          stepCount={player.stepCount}
        />
        <p className="min-h-[2.5rem] text-sm text-foreground" aria-live="polite">
          {player.current ? step.explanation : "Press Step: first the slope is measured (dashed line), then the ball moves along the arrow."}
        </p>
      </Surface>
    </section>
  );
};

export default OneWeight;
