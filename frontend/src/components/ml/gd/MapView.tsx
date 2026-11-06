// Two weights: the contour-map view of gradient descent.

import * as React from "react";

import { useAlgorithmPlayer } from "../../../hooks/useAlgorithmPlayer";
import { GD_DEFAULT_LR } from "../../../lib/ml/demos";
import { buildGdSteps, SURFACES, type LossSurface, type Optimizer, type SurfaceKey } from "../../../lib/ml/gradientDescent";
import { Slider } from "../../ui/slider";
import { Surface } from "../../ui/surface";
import VisualizerControls from "../../Visualizer/VisualizerControls";
import { C } from "../colors";
import { SectionTitle } from "../mathBlocks";
import { Arrowhead, LossChart, Segmented, Stat } from "../shared";
import { mapScale, MAP_W, useContourCanvas } from "./mapCanvas";

export const MinimaMarks: React.FC<{ surface: LossSurface }> = ({ surface }) => {
  const { sx, sy } = mapScale(surface);
  return (
    <>
      {surface.minima.map((m) => (
        <g key={`${m.x},${m.y}`}>
          <circle cx={sx(m.x)} cy={sy(m.y)} r={6} fill="none" stroke={C.green} strokeWidth={2} />
          <text x={sx(m.x)} y={sy(m.y) + 20} textAnchor="middle" fontSize={11} fill={C.green}>
            {surface.key === "twoMinima" ? (m.global ? "deepest" : "shallower") : "minimum"}
          </text>
        </g>
      ))}
      {surface.key === "saddle" && (
        <text x={sx(0)} y={sy(0) + 4} textAnchor="middle" fontSize={11} fill={C.amber}>
          saddle
        </text>
      )}
    </>
  );
};

const MapView: React.FC = () => {
  const [surfaceKey, setSurfaceKey] = React.useState<SurfaceKey>("bowl");
  const surface = SURFACES[surfaceKey];
  const [optimizer, setOptimizer] = React.useState<Optimizer>("plain");
  const [lr, setLr] = React.useState(GD_DEFAULT_LR.bowl);
  const [beta, setBeta] = React.useState(0.9);
  const [start, setStart] = React.useState<[number, number]>(surface.start);

  const { H, sx, sy } = mapScale(surface);
  const canvasRef = useContourCanvas(surface, H);
  const svgRef = React.useRef<SVGSVGElement>(null);

  const steps = React.useMemo(() => buildGdSteps(surface, { lr, optimizer, start, beta }), [surface, lr, optimizer, start, beta]);
  const player = useAlgorithmPlayer(steps, { initialDelayMs: 220 });
  const step = player.current ?? steps[0];
  const locked = player.status === "running";

  const chooseSurface = (k: SurfaceKey) => {
    setSurfaceKey(k);
    setLr(GD_DEFAULT_LR[k]);
    setStart(SURFACES[k].start);
  };

  const pick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (locked || !svgRef.current) return;
    const ctm = svgRef.current.getScreenCTM();
    if (!ctm) return;
    const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(ctm.inverse());
    setStart([+((p.x / MAP_W) * 2 * surface.xr - surface.xr).toFixed(2), +(surface.yr - (p.y / H) * 2 * surface.yr).toFixed(3)]);
  };

  const path = step.path.map(([x, y]) => `${sx(x).toFixed(1)},${sy(y).toFixed(1)}`).join(" ");
  const gnorm = Math.hypot(step.grad[0], step.grad[1]) || 1;
  const ax = sx(step.x) - (step.grad[0] / gnorm) * 44;
  const ay = sy(step.y) + (step.grad[1] / gnorm) * 44;
  const inView = Math.abs(step.x) <= surface.xr && Math.abs(step.y) <= surface.yr;

  return (
    <section aria-labelledby="gd-map-title" className="space-y-4">
      <SectionTitle id="gd-map-title" kicker="Two weights" title="The map view">
        <p>
          With two weights, the error becomes a landscape seen from above, like a hiking map: each ring is one height, and darker means lower
          error. The amber arrow is the downhill direction (against the gradient). Click anywhere on the map to drop the ball there.
        </p>
      </SectionTitle>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_17rem]">
        <Surface variant="card" radius="2xl" className="min-w-0 p-3 sm:p-4">
          <div className="relative overflow-hidden rounded-xl" style={{ aspectRatio: `${MAP_W} / ${H}` }}>
            <canvas ref={canvasRef} width={MAP_W} height={H} className="absolute inset-0 h-full w-full" aria-hidden="true" />
            <svg
              ref={svgRef}
              viewBox={`0 0 ${MAP_W} ${H}`}
              className="absolute inset-0 h-full w-full cursor-crosshair"
              role="img"
              aria-label={`Contour map of the ${surface.label.toLowerCase()} error surface with the descent path`}
              onClick={pick}
            >
              <Arrowhead id="gd-arrow" color={C.amber} />
              <MinimaMarks surface={surface} />
              <polyline points={path} fill="none" stroke={C.violet} strokeWidth={2} strokeLinejoin="round" />
              {step.path.map(([x, y], i) => (
                <circle key={i} cx={sx(x)} cy={sy(y)} r={2.2} fill={C.violet} />
              ))}
              {step.phase === "slope" && inView && (
                <line x1={sx(step.x)} y1={sy(step.y)} x2={ax} y2={ay} stroke={C.amber} strokeWidth={3} markerEnd="url(#gd-arrow)" />
              )}
              {inView && <circle cx={sx(step.x)} cy={sy(step.y)} r={7} fill={C.teal} stroke="hsl(var(--background))" strokeWidth={2} />}
              <text x={8} y={H - 8} fontSize={9} fill={C.fg} opacity={0.75}>
                Click anywhere to start from there
              </text>
            </svg>
          </div>
          {step.phase === "diverged" && (
            <p className="mt-2 text-sm text-destructive-bright" role="status">
              The ball flew off the map: the learning rate is too big for this surface.
            </p>
          )}
        </Surface>

        <Surface variant="card" radius="2xl" className="flex flex-col gap-3 p-4">
          <dl className="grid grid-cols-2 gap-2">
            <Stat label="Step" value={step.iter} />
            <Stat label="Error" value={Number.isFinite(step.loss) && step.loss < 1e4 ? step.loss.toFixed(3) : "∞"} />
            <Stat label="Position" value={`${step.x.toFixed(2)}, ${step.y.toFixed(2)}`} />
            <Stat label="Slope size" value={Math.hypot(...step.grad) < 1e4 ? Math.hypot(...step.grad).toFixed(3) : "huge"} />
          </dl>
          <LossChart values={step.losses} total={Math.max(steps.at(-1)!.losses.length, 2)} log label="Error after each step (log scale)" />
          <p className="text-xs leading-relaxed text-muted-foreground">{surface.blurb}</p>
        </Surface>
      </div>

      <Surface variant="card" radius="2xl" className="space-y-5 p-4 sm:p-6">
        <div className="flex flex-wrap gap-x-6 gap-y-4">
          <Segmented label="Surface" value={surfaceKey} onChange={chooseSurface} disabled={locked} options={Object.values(SURFACES).map((s) => ({ value: s.key, label: s.label }))} />
          <Segmented
            label="Method"
            value={optimizer}
            onChange={setOptimizer}
            disabled={locked}
            options={[
              { value: "plain", label: "Plain" },
              { value: "momentum", label: "Momentum" },
            ]}
          />
        </div>
        <div className="flex flex-wrap gap-x-6 gap-y-4">
          <div className="min-w-[14rem] flex-1 space-y-2">
            <div className="flex items-baseline justify-between gap-2">
              <label htmlFor="gd-lr" className="text-sm font-medium text-muted-foreground">
                Learning rate
              </label>
              <span className="font-mono text-sm text-foreground">{lr.toFixed(2)}</span>
            </div>
            <Slider id="gd-lr" value={[lr]} min={0.01} max={1.2} step={0.01} onValueChange={([v]) => setLr(v)} disabled={locked} aria-label="Learning rate" />
            <p className="text-xs text-muted-foreground">{surface.lrNote}</p>
          </div>
          {optimizer === "momentum" && (
            <div className="min-w-[14rem] flex-1 space-y-2">
              <div className="flex items-baseline justify-between gap-2">
                <label htmlFor="gd-beta" className="text-sm font-medium text-muted-foreground">
                  Momentum β (share of the last move kept)
                </label>
                <span className="font-mono text-sm text-foreground">{beta.toFixed(2)}</span>
              </div>
              <Slider id="gd-beta" value={[beta]} min={0} max={0.99} step={0.01} onValueChange={([v]) => setBeta(v)} disabled={locked} aria-label="Momentum beta" />
              <p className="text-xs text-muted-foreground">0.9 is the usual value. 0 turns momentum off.</p>
            </div>
          )}
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
          {player.current ? step.explanation : "Press Start to roll the ball downhill, or Step to go one move at a time."}
        </p>
      </Surface>
    </section>
  );
};

export default MapView;
