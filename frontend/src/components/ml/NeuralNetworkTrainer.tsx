import { Dices } from "lucide-react";
import * as React from "react";

import { useAlgorithmPlayer } from "../../hooks/useAlgorithmPlayer";
import { mlpGuideStepFor, neuralNetworkGuide } from "../../lib/guides/mlGuides";
import { MLP_DEFAULT } from "../../lib/ml/demos";
import { ACTIVATIONS, type HiddenActivation } from "../../lib/ml/activations";
import { accuracy, buildMlpSteps, DATASETS, forward, makeDataset, type DatasetKey, type MlpStep } from "../../lib/ml/mlp";
import { Button } from "../ui/button";
import { Surface } from "../ui/surface";
import AlgorithmGuidePanel from "../Visualizer/AlgorithmGuide";
import VisualizerControls from "../Visualizer/VisualizerControls";
import ActivationExplorer from "./ActivationExplorer";
import { neuralNetworkFigures } from "./figures/clusteringFigures";
import NeuralNetworkMath from "./NeuralNetworkMath";
import { C } from "./colors";
import { ConceptFigures, LossChart, Plot, Segmented, Stat } from "./shared";

const GRID = 36;
const EPOCHS: Record<DatasetKey, number> = { blobs: 300, xor: 600, circle: 600, spiral: 1500 };

/** The network's prediction everywhere, as a grid of shaded cells. */
const Boundary: React.FC<{ step: MlpStep; act: HiddenActivation; s: { x: (v: number) => number; y: (v: number) => number } }> = ({ step, act, s }) => {
  const cells: React.ReactNode[] = [];
  const size = 2 / GRID;
  for (let i = 0; i < GRID; i++) {
    for (let j = 0; j < GRID; j++) {
      const x = -1 + (i + 0.5) * size;
      const y = -1 + (j + 0.5) * size;
      const p = forward(step.weights, x, y, act).out;
      const conf = Math.abs(p - 0.5) * 2;
      cells.push(
        <rect
          key={`${i}-${j}`}
          x={s.x(x - size / 2)}
          y={s.y(y + size / 2)}
          width={s.x(size) - s.x(0) + 0.5}
          height={s.y(0) - s.y(size) + 0.5}
          // Mixed into the page colour, not drawn translucent: overlapping
          // translucent cells left a visible grid of seams.
          fill={`color-mix(in srgb, ${p >= 0.5 ? C.teal : C.violet} ${Math.round(10 + conf * 34)}%, hsl(var(--card)))`}
        />,
      );
    }
  }
  return (
    <g aria-hidden="true" shapeRendering="crispEdges">
      {cells}
    </g>
  );
};

/** Inputs → hidden → output, edges coloured by sign and sized by strength. */
const NetworkDiagram: React.FC<{ step: MlpStep; act: HiddenActivation }> = ({ step, act }) => {
  const H = step.weights.W2.length;
  const W = 300;
  const HT = 220;
  const xs = [36, 150, 264];
  const inY = [HT * 0.33, HT * 0.67];
  const hidY = Array.from({ length: H }, (_, h) => (HT * (h + 1)) / (H + 1));
  const outY = HT / 2;
  const showGrad = step.phase === "backward" && step.grads;
  const traced = step.phase === "forward" || step.phase === "loss" ? step.traced : undefined;
  const maxW = Math.max(...step.weights.W1.flat().map(Math.abs), ...step.weights.W2.map(Math.abs), 0.5);
  const maxG = showGrad ? Math.max(...step.grads!.W1.flat().map(Math.abs), ...step.grads!.W2.map(Math.abs), 1e-9) : 1;

  const edge = (key: string, x1: number, y1: number, x2: number, y2: number, w: number, g?: number) => (
    <g key={key}>
      {g !== undefined && (
        <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={C.amber} strokeWidth={2 + (Math.abs(g) / maxG) * 9} strokeOpacity={0.25 + (Math.abs(g) / maxG) * 0.55} strokeLinecap="round" />
      )}
      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={w >= 0 ? C.teal : C.red} strokeWidth={0.6 + (Math.abs(w) / maxW) * 4} strokeOpacity={0.75} />
    </g>
  );

  return (
    <svg viewBox={`0 0 ${W} ${HT + 20}`} className="block h-auto w-full" role="img" aria-label={`Network with 2 inputs, ${H} hidden neurons and 1 output`}>
      {step.weights.W1.map(([a, b], h) => [
        edge(`a${h}`, xs[0], inY[0], xs[1], hidY[h], a, showGrad ? step.grads!.W1[h][0] : undefined),
        edge(`b${h}`, xs[0], inY[1], xs[1], hidY[h], b, showGrad ? step.grads!.W1[h][1] : undefined),
      ])}
      {step.weights.W2.map((w, h) => edge(`o${h}`, xs[1], hidY[h], xs[2], outY, w, showGrad ? step.grads!.W2[h] : undefined))}
      {["x", "y"].map((t, i) => (
        <g key={t}>
          <circle cx={xs[0]} cy={inY[i]} r={15} fill={C.card} stroke={C.sky} strokeWidth={1.5} />
          <text x={xs[0]} y={inY[i] + 4} textAnchor="middle" fontSize={12} fill={C.fg}>
            {t}
          </text>
        </g>
      ))}
      {hidY.map((y, h) => {
        const a = traced?.forward.hidden[h];
        return (
          <g key={h}>
            <circle cx={xs[1]} cy={y} r={14} fill={a === undefined ? C.card : a >= 0 ? C.teal : C.red} fillOpacity={a === undefined ? 1 : 0.15 + Math.abs(a) * 0.6} stroke={C.fg} strokeWidth={1.2} />
            <text x={xs[1]} y={y + 4} textAnchor="middle" fontSize={10} fill={C.fg}>
              {a === undefined ? ACTIVATIONS[act].label.split(" ")[0] : a.toFixed(2)}
            </text>
          </g>
        );
      })}
      <circle cx={xs[2]} cy={outY} r={17} fill={traced ? (traced.forward.out >= 0.5 ? C.teal : C.violet) : C.card} fillOpacity={traced ? 0.35 : 1} stroke={C.fg} strokeWidth={1.5} />
      <text x={xs[2]} y={outY + 4} textAnchor="middle" fontSize={10} fill={C.fg}>
        {traced ? `${(traced.forward.out * 100).toFixed(0)}%` : "σ"}
      </text>
      <text x={xs[0]} y={HT + 14} textAnchor="middle" fontSize={10} fill={C.muted}>inputs</text>
      <text x={xs[1]} y={HT + 14} textAnchor="middle" fontSize={10} fill={C.muted}>hidden ({H})</text>
      <text x={xs[2]} y={HT + 14} textAnchor="middle" fontSize={10} fill={C.muted}>output</text>
    </svg>
  );
};

const NeuralNetworkTrainer: React.FC = () => {
  const [dataset, setDataset] = React.useState<DatasetKey>(MLP_DEFAULT.dataset);
  const [hidden, setHidden] = React.useState(MLP_DEFAULT.hidden);
  const [lr, setLr] = React.useState(MLP_DEFAULT.lr);
  const [seed, setSeed] = React.useState(MLP_DEFAULT.seed);
  const [act, setAct] = React.useState<HiddenActivation>("tanh");

  const data = React.useMemo(() => makeDataset(dataset, MLP_DEFAULT.seed), [dataset]);
  // Fresh points from the same shape that training never sees: the honest
  // test of whether the network learned the pattern or just these 120 points.
  const unseen = React.useMemo(() => makeDataset(dataset, 999, 400), [dataset]);
  const epochs = EPOCHS[dataset];
  const steps = React.useMemo(() => buildMlpSteps(data, hidden, lr, epochs, seed, act), [data, hidden, lr, epochs, seed, act]);
  const player = useAlgorithmPlayer(steps, { initialDelayMs: 350 });
  const step = player.current ?? steps[0];
  const locked = player.status === "running";
  const unseenAccuracy = accuracy(step.weights, unseen, act);
  const tracedIndex = step.phase === "forward" || step.phase === "loss" ? step.traced?.index : undefined;

  return (
    <div className="space-y-6">
      <ConceptFigures figures={neuralNetworkFigures} />

      <nav aria-label="On this page" className="flex flex-wrap items-center gap-2 text-sm">
        <span className="text-muted-foreground">Jump to:</span>
        {[
          ["#activations-title", "Activation functions"],
          ["#nn-math-title", "The maths, step by step"],
          ["#nn-guide", "How it works"],
        ].map(([href, label]) => (
          <a key={href} href={href} className="glass-pill glass-hover px-3.5 py-1.5 text-foreground">
            {label}
          </a>
        ))}
      </nav>

      <div className="grid gap-4 lg:grid-cols-2">
        <Surface variant="card" radius="2xl" className="min-w-0 p-3 sm:p-4">
          <Plot
            xDomain={[-1, 1]}
            yDomain={[-1, 1]}
            width={400}
            height={400}
            label="Training points over the network's predicted regions"
            background={(s) => <Boundary step={step} act={act} s={s} />}
          >
            {(s) => (
              <>
                {data.map((d, i) => {
                  const wrong = (forward(step.weights, d.x, d.y, act).out >= 0.5 ? 1 : 0) !== d.label;
                  return (
                    <circle
                      key={i}
                      cx={s.x(d.x)}
                      cy={s.y(d.y)}
                      r={i === tracedIndex ? 8 : 4.5}
                      fill={d.label ? C.teal : C.violet}
                      stroke={i === tracedIndex ? C.fg : wrong ? C.red : "hsl(var(--background))"}
                      strokeWidth={i === tracedIndex || wrong ? 2 : 1}
                    />
                  );
                })}
              </>
            )}
          </Plot>
          <p className="mt-2 text-xs text-muted-foreground">
            Background shading is the network's guess at every spot. Red rings mark training points it currently gets wrong. “Training
            accuracy” counts these 120 points; “on 400 new points” tests fresh points from the same shape that it never trained on.
          </p>
        </Surface>

        <div className="flex min-w-0 flex-col gap-4">
          <Surface variant="card" radius="2xl" className="p-3 sm:p-4">
            <NetworkDiagram step={step} act={act} />
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5"><span className="h-0.5 w-5 bg-viz-current" /> positive weight</span>
              <span className="flex items-center gap-1.5"><span className="h-0.5 w-5 bg-viz-swap" /> negative weight</span>
              <span className="flex items-center gap-1.5"><span className="h-1.5 w-5 rounded bg-viz-compare/60" /> gradient (backward step)</span>
            </div>
          </Surface>
          <Surface variant="card" radius="2xl" className="grid gap-3 p-4 sm:grid-cols-[minmax(0,1fr)_9rem]">
            <LossChart values={step.losses} total={epochs + 1} label="Loss over training" />
            <dl className="grid grid-cols-2 gap-2 sm:grid-cols-1">
              <Stat label="Training step" value={step.epoch} />
              <Stat label="Loss" value={step.loss.toFixed(3)} />
              <Stat label="Training accuracy" value={`${(step.accuracy * 100).toFixed(1)}%`} tone={step.accuracy >= 0.95 ? C.green : undefined} />
              <Stat label="On 400 new points" value={`${(unseenAccuracy * 100).toFixed(1)}%`} tone={unseenAccuracy >= 0.95 ? C.green : undefined} />
            </dl>
          </Surface>
        </div>
      </div>

      <Surface variant="card" radius="2xl" className="space-y-5 p-4 sm:p-6">
        <div className="flex flex-wrap items-end gap-x-6 gap-y-4">
          <Segmented
            label="Data"
            value={dataset}
            onChange={setDataset}
            disabled={locked}
            options={(Object.keys(DATASETS) as DatasetKey[]).map((k) => ({ value: k, label: DATASETS[k].label }))}
          />
          <Segmented label="Hidden neurons" value={hidden} onChange={setHidden} disabled={locked} options={[1, 2, 4, 6, 8].map((v) => ({ value: v, label: String(v) }))} />
          <Segmented
            label="Activation"
            value={act}
            onChange={setAct}
            disabled={locked}
            options={(["tanh", "relu", "leakyRelu", "sigmoid"] as const).map((k) => ({ value: k, label: ACTIVATIONS[k].label }))}
          />
          <Segmented
            label="Learning rate"
            value={lr}
            onChange={setLr}
            disabled={locked}
            options={[0.1, 0.8, 3].map((v) => ({ value: v, label: String(v) }))}
          />
          <Button variant="outline" disabled={locked} onClick={() => setSeed((s) => s + 1)}>
            <Dices /> New starting weights
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">{DATASETS[dataset].blurb}</p>

        <VisualizerControls
          status={player.status}
          onPlay={player.play}
          onPause={player.pause}
          onReset={player.reset}
          onStepForward={player.stepForward}
          onStepBack={player.stepBack}
          delayMs={player.delayMs}
          onDelayChange={player.setDelayMs}
          minDelayMs={60}
          maxDelayMs={3000}
          stepIndex={player.index}
          stepCount={player.stepCount}
        />
        <p className="min-h-[3rem] text-sm text-foreground" aria-live="polite">
          {player.current ? step.explanation : "Press Step to walk through one training step (forward, loss, backward, update), then Start to train."}
        </p>
      </Surface>

      <ActivationExplorer />

      <NeuralNetworkMath />

      <div id="nn-guide" className="scroll-mt-20" />
      <AlgorithmGuidePanel guide={neuralNetworkGuide} activeStageId={player.current ? mlpGuideStepFor(player.current) : null} />
    </div>
  );
};

export default NeuralNetworkTrainer;
