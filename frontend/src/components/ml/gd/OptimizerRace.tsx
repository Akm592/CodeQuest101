// The optimizers side by side: same surface, same start, one path each.

import * as React from "react";

import { useAlgorithmPlayer } from "../../../hooks/useAlgorithmPlayer";
import type { BaseStep } from "../../../lib/algorithms/types";
import { SURFACES, type SurfaceKey } from "../../../lib/ml/gradientDescent";
import { OPT_INFO, OPT_ORDER, runOptimizer, type OptKey } from "../../../lib/ml/optimizers";
import { cn } from "../../../lib/utils";
import { Surface } from "../../ui/surface";
import VisualizerControls from "../../Visualizer/VisualizerControls";
import { C } from "../colors";
import { SectionTitle } from "../mathBlocks";
import { Segmented } from "../shared";
import { mapScale, MAP_W, useContourCanvas } from "./mapCanvas";
import { MinimaMarks } from "./MapView";

const ITERS = 150;
/** One learning rate per method: adaptive methods work on a different scale. */
const BASE_LR: Record<OptKey, number> = { plain: 0.1, momentum: 0.05, nesterov: 0.05, adagrad: 0.5, rmsprop: 0.05, adam: 0.1 };
/** On the narrow valley plain descent gets 0.15, where it visibly zigzags (at 0.1 the steep side settles in one step). */
const raceLr = (surface: SurfaceKey, key: OptKey) => (surface === "valley" && key === "plain" ? 0.15 : BASE_LR[key]);
const COLORS: Record<OptKey, string> = { plain: C.fg, momentum: C.teal, nesterov: C.sky, adagrad: C.amber, rmsprop: C.violet, adam: C.green };
const RACE_SURFACES: SurfaceKey[] = ["valley", "saddle", "twoMinima", "bowl"];

const OptimizerRace: React.FC = () => {
  const [surfaceKey, setSurfaceKey] = React.useState<SurfaceKey>("valley");
  const [shown, setShown] = React.useState<Set<OptKey>>(() => new Set(OPT_ORDER));
  const surface = SURFACES[surfaceKey];
  const runs = React.useMemo(
    () => Object.fromEntries(OPT_ORDER.map((k) => [k, runOptimizer(k, surface, surface.start, { lr: raceLr(surfaceKey, k) }, ITERS)])) as Record<OptKey, ReturnType<typeof runOptimizer>>,
    [surface, surfaceKey],
  );
  const frames = React.useMemo<(BaseStep & { k: number })[]>(
    () =>
      Array.from({ length: ITERS + 1 }, (_, k) => ({
        k,
        explanation: k === 0 ? "Everyone starts at the same spot." : `Step ${k} for every method.`,
        done: k === ITERS,
      })),
    [],
  );
  const player = useAlgorithmPlayer(frames, { initialDelayMs: 90 });
  const k = player.current?.k ?? 0;
  const { H, sx, sy } = mapScale(surface);
  const canvasRef = useContourCanvas(surface, H);
  const best = Math.min(...surface.minima.map((m) => surface.f(m.x, m.y)));
  const reached = (key: OptKey) => runs[key].losses.findIndex((l) => l - best < 1e-3);

  const toggle = (key: OptKey) =>
    setShown((s) => {
      const n = new Set(s);
      if (n.has(key)) n.delete(key);
      else n.add(key);
      return n;
    });

  return (
    <section aria-labelledby="gd-opt-title" className="space-y-4">
      <SectionTitle id="gd-opt-title" kicker="Smarter steps" title="Momentum, Nesterov, AdaGrad, RMSProp and Adam">
        <p>
          Plain gradient descent has two weaknesses: in a narrow valley it zigzags across and crawls along, and it uses the same step size for
          every weight. Each method below fixes one or both. Pick a surface and watch them race from the same start.
        </p>
      </SectionTitle>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_19rem]">
        <Surface variant="card" radius="2xl" className="min-w-0 space-y-3 p-3 sm:p-4">
          <div className="relative overflow-hidden rounded-xl" style={{ aspectRatio: `${MAP_W} / ${H}` }}>
            <canvas ref={canvasRef} width={MAP_W} height={H} className="absolute inset-0 h-full w-full" aria-hidden="true" />
            <svg viewBox={`0 0 ${MAP_W} ${H}`} className="absolute inset-0 h-full w-full" role="img" aria-label={`Optimizer paths on the ${surface.label.toLowerCase()} surface`}>
              <MinimaMarks surface={surface} />
              {OPT_ORDER.filter((key) => shown.has(key)).map((key) => {
                const pts = runs[key].path.slice(0, k + 1);
                const last = pts.at(-1)!;
                return (
                  <g key={key}>
                    <polyline points={pts.map(([x, y]) => `${sx(x).toFixed(1)},${sy(y).toFixed(1)}`).join(" ")} fill="none" stroke={COLORS[key]} strokeWidth={1.8} strokeLinejoin="round" opacity={0.9} />
                    <circle cx={sx(last[0])} cy={sy(last[1])} r={5.5} fill={COLORS[key]} stroke="hsl(var(--background))" strokeWidth={1.5} />
                  </g>
                );
              })}
            </svg>
          </div>
          <Segmented label="Surface" value={surfaceKey} onChange={(s) => { setSurfaceKey(s); player.reset(); }} disabled={player.status === "running"} options={RACE_SURFACES.map((s) => ({ value: s, label: SURFACES[s].label }))} />
        </Surface>

        <Surface variant="card" radius="2xl" className="flex min-w-0 flex-col gap-2 p-4">
          <p className="text-xs text-muted-foreground">Tap a method to show or hide it. “Bottom” is the step where it first got within 0.001 of the lowest error.</p>
          {OPT_ORDER.map((key) => {
            const r = reached(key);
            return (
              <button
                key={key}
                type="button"
                onClick={() => toggle(key)}
                aria-pressed={shown.has(key)}
                className={cn(
                  "flex min-h-11 items-center gap-2 rounded-xl border px-3 py-2 text-left text-sm transition-colors",
                  shown.has(key) ? "border-white/15 bg-white/[0.06]" : "border-white/[0.04] opacity-50",
                )}
              >
                <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: COLORS[key] }} />
                <span className="min-w-0 flex-1">
                  <span className="block font-medium text-foreground">{OPT_INFO[key].short}</span>
                  <span className="block font-mono text-[11px] text-muted-foreground">lr {raceLr(surfaceKey, key)}</span>
                </span>
                <span className="text-right font-mono text-xs text-foreground">
                  {runs[key].diverged && k >= runs[key].path.length ? "blew up" : r >= 0 && r <= k ? `bottom @${r}` : "not yet"}
                </span>
              </button>
            );
          })}
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            Each method has its own learning rate, picked to suit it: adaptive methods (AdaGrad, RMSProp, Adam) scale their steps differently, so
            the same number would not be a fair comparison. Momentum and Nesterov use β = 0.9; Adam uses its defaults for β₁, β₂ and ε.
          </p>
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
          minDelayMs={20}
          maxDelayMs={800}
          stepMs={10}
          stepIndex={player.index}
          stepCount={player.stepCount}
        />
        <p className="text-sm text-muted-foreground">{surface.blurb}</p>
      </Surface>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {OPT_ORDER.map((key) => (
          <Surface key={key} variant="card" radius="2xl" className="space-y-3 p-4">
            <h3 className="flex items-center gap-2 font-semibold text-foreground">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: COLORS[key] }} />
              {OPT_INFO[key].label}
            </h3>
            <p className="text-sm leading-relaxed text-muted-foreground">{OPT_INFO[key].idea}</p>
            <div className="space-y-0.5 overflow-x-auto rounded-xl border border-white/[0.06] bg-black/25 p-3 font-mono text-[12px] text-foreground/90">
              {OPT_INFO[key].rule.map((line) => (
                <p key={line} className="whitespace-nowrap">
                  {line}
                </p>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">{OPT_INFO[key].defaults}</p>
          </Surface>
        ))}
        <Surface variant="card" radius="2xl" className="space-y-3 p-4">
          <h3 className="font-semibold text-foreground">AdamW</h3>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Adam plus weight decay, done properly. Weight decay gently shrinks every weight towards 0 each step, which helps a model not to
            overfit. Adam's built-in version adds the shrink to the slope, so it goes through Adam's averaging and per-weight rescaling like everything
            else. AdamW keeps it separate and applies it straight to the weights, which works more like true weight decay.
          </p>
          <div className="space-y-0.5 overflow-x-auto rounded-xl border border-white/[0.06] bg-black/25 p-3 font-mono text-[12px] text-foreground/90">
            <p className="whitespace-nowrap">x ← x − lr · λ · x   (shrink first)</p>
            <p className="whitespace-nowrap">then the usual Adam step</p>
          </div>
          <p className="text-xs text-muted-foreground">PyTorch's defaults: lr = 0.001, β₁ = 0.9, β₂ = 0.999, weight decay λ = 0.01. Not shown in the race because it would add regularisation, changing the objective beyond the displayed loss surface.</p>
        </Surface>
      </div>
      <p className="text-xs text-muted-foreground">
        Note on notation: this page writes momentum the way CS231n does (the learning rate inside the velocity). PyTorch writes it as v ← β·v + g,
        x ← x − lr·v. They are the same idea with the learning rate in a different place.
      </p>
    </section>
  );
};

export default OptimizerRace;
