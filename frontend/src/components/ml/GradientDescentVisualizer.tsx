import * as React from "react";

import { useAlgorithmPlayer } from "../../hooks/useAlgorithmPlayer";
import { GD_DEFAULT_LR } from "../../lib/ml/demos";
import { buildGdSteps, SURFACES, type LossSurface, type Optimizer, type SurfaceKey } from "../../lib/ml/gradientDescent";
import { gdGuideStepFor, gradientDescentGuide } from "../../lib/guides/mlGuides";
import { Slider } from "../ui/slider";
import { Surface } from "../ui/surface";
import AlgorithmGuidePanel from "../Visualizer/AlgorithmGuide";
import VisualizerControls from "../Visualizer/VisualizerControls";
import { gradientDescentFigures } from "./figures/regressionFigures";
import { C } from "./colors";
import { Arrowhead, ConceptFigures, LossChart, Segmented, Stat } from "./shared";

const W = 480;

/** Paints the loss surface as contour bands: darker is lower. */
function useContourCanvas(surface: LossSurface, height: number) {
  const ref = React.useRef<HTMLCanvasElement>(null);
  React.useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const img = ctx.createImageData(W, height);
    const values = new Float32Array(W * height);
    let lo = Infinity;
    let hi = -Infinity;
    for (let py = 0; py < height; py++) {
      for (let px = 0; px < W; px++) {
        const x = (px / (W - 1)) * 2 * surface.xr - surface.xr;
        const y = surface.yr - (py / (height - 1)) * 2 * surface.yr;
        const v = surface.f(x, y);
        values[py * W + px] = v;
        lo = Math.min(lo, v);
        hi = Math.max(hi, v);
      }
    }
    const BANDS = 16;
    const band = (v: number) => Math.min(BANDS - 1, Math.floor(Math.sqrt((v - lo) / (hi - lo)) * BANDS));
    for (let py = 0; py < height; py++) {
      for (let px = 0; px < W; px++) {
        const i = py * W + px;
        const b = band(values[i]);
        const t = b / (BANDS - 1);
        // From deep navy (low loss) to teal-grey (high loss): rgb lerp.
        let r = 6 + t * 22;
        let g = 12 + t * 58;
        let bl = 28 + t * 66;
        const edge = (px > 0 && band(values[i - 1]) !== b) || (py > 0 && band(values[i - W]) !== b);
        if (edge) {
          r += 30;
          g += 40;
          bl += 46;
        }
        img.data[i * 4] = r;
        img.data[i * 4 + 1] = g;
        img.data[i * 4 + 2] = bl;
        img.data[i * 4 + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
  }, [surface, height]);
  return ref;
}

const GradientDescentVisualizer: React.FC = () => {
  const [surfaceKey, setSurfaceKey] = React.useState<SurfaceKey>("bowl");
  const surface = SURFACES[surfaceKey];
  const [optimizer, setOptimizer] = React.useState<Optimizer>("plain");
  const [lr, setLr] = React.useState(GD_DEFAULT_LR.bowl);
  const [start, setStart] = React.useState<[number, number]>(surface.start);

  const H = Math.round((W * surface.yr) / surface.xr);
  const canvasRef = useContourCanvas(surface, H);
  const svgRef = React.useRef<SVGSVGElement>(null);

  const steps = React.useMemo(() => buildGdSteps(surface, { lr, optimizer, start }), [surface, lr, optimizer, start]);
  const player = useAlgorithmPlayer(steps, { initialDelayMs: 220 });
  const step = player.current ?? steps[0];
  const locked = player.status === "running";

  const sx = (x: number) => ((x + surface.xr) / (2 * surface.xr)) * W;
  const sy = (y: number) => ((surface.yr - y) / (2 * surface.yr)) * H;

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
    const x = (p.x / W) * 2 * surface.xr - surface.xr;
    const y = surface.yr - (p.y / H) * 2 * surface.yr;
    setStart([+x.toFixed(2), +y.toFixed(2)]);
  };

  const path = step.path.map(([x, y]) => `${sx(x).toFixed(1)},${sy(y).toFixed(1)}`).join(" ");
  const gnorm = Math.hypot(step.grad[0], step.grad[1]) || 1;
  // The arrow points downhill: against the gradient, drawn at a fixed length.
  const ax = sx(step.x) - (step.grad[0] / gnorm) * 44;
  const ay = sy(step.y) + (step.grad[1] / gnorm) * 44;
  const inView = Math.abs(step.x) <= surface.xr && Math.abs(step.y) <= surface.yr;

  return (
    <div className="space-y-6">
      <ConceptFigures figures={gradientDescentFigures} />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_17rem]">
        <Surface variant="card" radius="2xl" className="min-w-0 p-3 sm:p-4">
          <div className="relative overflow-hidden rounded-xl" style={{ aspectRatio: `${W} / ${H}` }}>
            <canvas ref={canvasRef} width={W} height={H} className="absolute inset-0 h-full w-full" aria-hidden="true" />
            <svg
              ref={svgRef}
              viewBox={`0 0 ${W} ${H}`}
              className="absolute inset-0 h-full w-full cursor-crosshair"
              role="img"
              aria-label={`Contour map of the ${surface.label.toLowerCase()} loss surface with the descent path`}
              onClick={pick}
            >
              <Arrowhead id="gd-arrow" color={C.amber} />
              {surface.minima.map((m) => (
                <g key={m.x}>
                  <circle cx={sx(m.x)} cy={sy(m.y)} r={6} fill="none" stroke={C.green} strokeWidth={2} />
                  <text x={sx(m.x)} y={sy(m.y) + 20} textAnchor="middle" fontSize={11} fill={C.green}>
                    {surface.minima.length > 1 ? (m.global ? "deepest" : "shallower") : "minimum"}
                  </text>
                </g>
              ))}
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
            <Stat label="Iteration" value={step.iter} />
            <Stat label="Loss" value={Number.isFinite(step.loss) && step.loss < 1e4 ? step.loss.toFixed(3) : "∞"} />
            <Stat label="Position" value={`${step.x.toFixed(2)}, ${step.y.toFixed(2)}`} />
            <Stat label="Slope size" value={Math.hypot(...step.grad) < 1e4 ? Math.hypot(...step.grad).toFixed(3) : "huge"} />
          </dl>
          <LossChart values={step.losses} total={Math.max(steps.at(-1)!.losses.length, 2)} log label="Loss after each step (log scale)" />
          <p className="text-xs leading-relaxed text-muted-foreground">{surface.blurb}</p>
        </Surface>
      </div>

      <Surface variant="card" radius="2xl" className="space-y-5 p-4 sm:p-6">
        <div className="flex flex-wrap gap-x-6 gap-y-4">
          <Segmented
            label="Surface"
            value={surfaceKey}
            onChange={chooseSurface}
            disabled={locked}
            options={Object.values(SURFACES).map((s) => ({ value: s.key, label: s.label }))}
          />
          <Segmented
            label="Optimizer"
            value={optimizer}
            onChange={setOptimizer}
            disabled={locked}
            options={[
              { value: "plain", label: "Plain" },
              { value: "momentum", label: "Momentum" },
            ]}
          />
          <div className="min-w-[14rem] flex-1 space-y-2">
            <div className="flex items-baseline justify-between gap-2">
              <label htmlFor="gd-lr" className="text-sm font-medium text-muted-foreground">
                Learning rate
              </label>
              <span className="font-mono text-sm text-foreground">{lr.toFixed(2)}</span>
            </div>
            <Slider id="gd-lr" value={[lr]} min={0.01} max={1.2} step={0.01} onValueChange={([v]) => setLr(v)} disabled={locked} aria-label="Learning rate" />
            <p className="text-xs text-muted-foreground">
              Plain descent on this surface blows up above about {surface.safeLr}.
            </p>
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
          {player.current ? step.explanation : "Press Start to roll the ball downhill, or Step to go one move at a time."}
        </p>
      </Surface>

      <AlgorithmGuidePanel guide={gradientDescentGuide} activeStageId={player.current ? gdGuideStepFor(player.current) : null} />
    </div>
  );
};

export default GradientDescentVisualizer;
