// Random Forest: grow trees one at a time and watch the averaged boundary
// settle; compare one tree with the forest; check the out-of-bag estimate.

import { Shuffle } from "lucide-react";
import * as React from "react";

import { useAlgorithmPlayer } from "../../hooks/useAlgorithmPlayer";
import { randomForestGuide, randomForestGuideStepFor } from "../../lib/guides/mlGuides";
import { accuracyOf, classify, fitTree, makeTreeData, TREE_BOUNDS, TREE_DATASETS, type TreeDatasetKey, type TreeNode } from "../../lib/ml/decisionTree";
import { buildForestFrames, fitForest, forestAccuracy, forestProbs, oobAccuracy, type ForestTree } from "../../lib/ml/randomForest";
import { Button } from "../ui/button";
import { Surface } from "../ui/surface";
import AlgorithmGuidePanel from "../Visualizer/AlgorithmGuide";
import VisualizerControls from "../Visualizer/VisualizerControls";
import { C, CLUSTER } from "./colors";
import { forestFigures } from "./figures/forestFigures";
import { SectionTitle } from "./mathBlocks";
import RfMath from "./rf/RfMath";
import { ConceptFigures, Plot, Segmented, Stat } from "./shared";

const TREES = 50;
const pct = (v: number) => `${(v * 100).toFixed(1)}%`;

/** Shaded class regions from any "probabilities at a point" function. */
const Regions: React.FC<{ s: { x: (v: number) => number; y: (v: number) => number }; probs: (p: { x: number; y: number }) => number[]; grid: number }> = ({ s, probs, grid }) => {
  const size = 10 / grid;
  const cells: React.ReactNode[] = [];
  for (let i = 0; i < grid; i++) {
    for (let j = 0; j < grid; j++) {
      const p = probs({ x: (i + 0.5) * size, y: (j + 0.5) * size });
      const k = p.reduce((bi, v, idx) => (v > p[bi] ? idx : bi), 0);
      const sure = p[k];
      cells.push(
        <rect
          key={`${i}-${j}`}
          x={s.x(i * size)}
          y={s.y((j + 1) * size)}
          width={s.x(size) - s.x(0) + 0.5}
          height={s.y(0) - s.y(size) + 0.5}
          fill={`color-mix(in srgb, ${CLUSTER[k % CLUSTER.length]} ${Math.round(8 + sure * 30)}%, hsl(var(--card)))`}
        />,
      );
    }
  }
  return <g shapeRendering="crispEdges" aria-hidden="true">{cells}</g>;
};

const leafProbs = (nodes: TreeNode[]) => (p: { x: number; y: number }) => {
  const { leaf } = classify(nodes, p);
  const n = leaf.counts.reduce((a, b) => a + b, 0);
  return leaf.counts.map((c) => c / n);
};

const MiniTreePlot: React.FC<{ tree: ForestTree; data: ReturnType<typeof makeTreeData>; index: number }> = ({ tree, data, index }) => {
  const inSample = new Set(tree.sample);
  return (
    <figure className="m-0 space-y-1">
      <Plot xDomain={[0, 10]} yDomain={[0, 10]} width={200} height={200} label={`Tree ${index + 1}'s boundary and its sample`} background={(s) => <Regions s={s} probs={leafProbs(tree.nodes)} grid={24} />}>
        {(s) => (
          <>
            {data.map((p, i) => (
              <circle
                key={i}
                cx={s.x(p.x)}
                cy={s.y(p.y)}
                r={inSample.has(i) ? 3.2 : 2.4}
                fill={inSample.has(i) ? CLUSTER[p.label % CLUSTER.length] : "none"}
                stroke={inSample.has(i) ? "hsl(var(--background))" : C.idle}
                strokeWidth={inSample.has(i) ? 0.8 : 1}
              />
            ))}
          </>
        )}
      </Plot>
      <figcaption className="text-center text-[11px] text-muted-foreground">
        Tree {index + 1}: {new Set(tree.sample).size} rows used, {tree.outOfBag.length} left out
      </figcaption>
    </figure>
  );
};

const RandomForestVisualizer: React.FC = () => {
  const [dataset, setDataset] = React.useState<TreeDatasetKey>("noisy");
  const [seed, setSeed] = React.useState(1);
  const [depth, setDepth] = React.useState(50);

  const info = TREE_DATASETS[dataset];
  const data = React.useMemo(() => makeTreeData(dataset, seed), [dataset, seed]);
  const fresh = React.useMemo(() => makeTreeData(dataset, 999, 400), [dataset]);
  const treeOpts = React.useMemo(() => ({ maxDepth: depth, criterion: "gini" as const, classes: info.classes, bounds: TREE_BOUNDS }), [depth, info.classes]);
  const forest = React.useMemo(() => fitForest(data, { ...treeOpts, trees: TREES, maxFeatures: 1, bootstrap: true, seed }), [data, treeOpts, seed]);
  const single = React.useMemo(() => fitTree(data, treeOpts), [data, treeOpts]);
  const frames = React.useMemo(() => buildForestFrames(forest, data.length), [forest, data.length]);
  const player = useAlgorithmPlayer(frames, { initialDelayMs: 450 });
  const k = player.current?.k ?? 1;
  const locked = player.status === "running";

  const curve = React.useMemo(
    () => Array.from({ length: TREES }, (_, i) => ({ k: i + 1, fresh: forestAccuracy(forest, fresh, i + 1), oob: oobAccuracy(forest, data, i + 1) })),
    [forest, fresh, data],
  );
  const singleFresh = accuracyOf(single, fresh);
  const now = curve[k - 1];

  return (
    <div className="space-y-10">
      <div className="space-y-6">
        <ConceptFigures figures={forestFigures} />
        <nav aria-label="On this page" className="flex flex-wrap items-center gap-2 text-sm">
          <span className="text-muted-foreground">Jump to:</span>
          {[
            ["#rf-grow-title", "Grow a forest"],
            ["#rf-curve-title", "How many trees?"],
            ["#rf-math-title", "The maths"],
            ["#rf-pros-title", "Pros and cons"],
            ["#rf-guide", "Summary"],
          ].map(([href, label]) => (
            <a key={href} href={href} className="glass-pill glass-hover px-3.5 py-1.5 text-foreground">
              {label}
            </a>
          ))}
        </nav>
      </div>

      <section aria-labelledby="rf-grow-title" className="space-y-4">
        <SectionTitle id="rf-grow-title" kicker="Watch it learn" title="Grow a forest, one tree at a time">
          <p>
            Each tree below learned from its own random sample of the points (filled dots; hollow ones were left out) and could only ask about
            one randomly chosen feature at each question. On their own they're jumpy. The big plot shows the forest: the average of every tree
            so far. Press Start and watch it settle.
          </p>
        </SectionTitle>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <Surface variant="card" radius="2xl" className="min-w-0 p-3 sm:p-4">
            <p className="mb-2 text-sm font-semibold text-foreground">The forest: average of {k} tree{k === 1 ? "" : "s"}</p>
            <Plot
              xDomain={[0, 10]}
              yDomain={[0, 10]}
              width={420}
              height={400}
              ticks={[0, 2, 4, 6, 8, 10]}
              label={`The forest's boundary after ${k} trees`}
              background={(s) => <Regions s={s} probs={(p) => forestProbs(forest, p, k)} grid={36} />}
            >
              {(s) => (
                <>
                  {data.map((p, i) => (
                    <circle key={i} cx={s.x(p.x)} cy={s.y(p.y)} r={4.2} fill={CLUSTER[p.label % CLUSTER.length]} stroke="hsl(var(--background))" strokeWidth={1} />
                  ))}
                </>
              )}
            </Plot>
            <p className="mt-2 text-xs text-muted-foreground">Stronger colour means more of the trees agree.</p>
          </Surface>

          <div className="flex min-w-0 flex-col gap-4">
            <Surface variant="card" radius="2xl" className="p-3 sm:p-4">
              <p className="mb-2 text-sm font-semibold text-foreground">Four of the trees, each on its own</p>
              <div className="grid grid-cols-2 gap-3">
                {forest.slice(0, 4).map((t, i) => (
                  <MiniTreePlot key={i} tree={t} data={data} index={i} />
                ))}
              </div>
            </Surface>
            <Surface variant="card" radius="2xl" className="p-4">
              <dl className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                <Stat label="One full tree, new points" value={pct(singleFresh)} />
                <Stat label={`Forest (${k}), new points`} value={pct(now.fresh)} tone={now.fresh > singleFresh ? C.green : undefined} />
                <Stat label="Out-of-bag estimate" value={Number.isNaN(now.oob.accuracy) ? "–" : pct(now.oob.accuracy)} />
                <Stat label="Rows with an estimate" value={`${now.oob.covered} / ${data.length}`} />
              </dl>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                “New points” are 400 fresh points from the same shape that no tree ever saw. The out-of-bag estimate uses only the training
                points, each judged by the trees that left it out.
              </p>
            </Surface>
          </div>
        </div>

        <Surface variant="card" radius="2xl" className="space-y-5 p-4 sm:p-6">
          <div className="flex flex-wrap items-end gap-x-6 gap-y-4">
            <Segmented label="Data" value={dataset} onChange={setDataset} disabled={locked} options={(Object.keys(TREE_DATASETS) as TreeDatasetKey[]).map((key) => ({ value: key, label: TREE_DATASETS[key].label }))} />
            <Segmented
              label="Tree depth"
              value={depth}
              onChange={setDepth}
              disabled={locked}
              options={[
                { value: 50, label: "Full (default)" },
                { value: 4, label: "Max 4" },
              ]}
            />
            <Button variant="outline" disabled={locked} onClick={() => setSeed((v) => v + 1)}>
              <Shuffle /> New data
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">{info.blurb}</p>
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
            maxDelayMs={1500}
            stepIndex={player.index}
            stepCount={player.stepCount}
          />
          <p className="min-h-[2.5rem] text-sm text-foreground" aria-live="polite">
            {player.current ? player.current.explanation : "The forest starts as a single tree. Press Start to add the other 49 one at a time."}
          </p>
        </Surface>
      </section>

      <section aria-labelledby="rf-curve-title" className="space-y-4">
        <SectionTitle id="rf-curve-title" kicker="More trees, better?" title="How many trees?">
          <p>
            Accuracy on new points for a forest of 1 to {TREES} trees. It climbs quickly, then levels off. Adding trees doesn't make a forest
            overfit (Breiman: “Random forests does not overfit. You can run as many trees as you want.”); after the curve flattens, more trees
            just cost time. The dashed line is a single full tree.
          </p>
        </SectionTitle>
        <Surface variant="card" radius="2xl" className="p-4 sm:p-5">
          {(() => {
            const W = 520;
            const H = 220;
            const pad = { l: 40, r: 12, t: 12, b: 30 };
            const vals = [...curve.map((c) => c.fresh), ...curve.map((c) => c.oob.accuracy).filter((v) => !Number.isNaN(v)), singleFresh];
            const lo = Math.max(0, Math.floor(Math.min(...vals) * 20) / 20 - 0.05);
            const x = (n: number) => pad.l + ((n - 1) / (TREES - 1)) * (W - pad.l - pad.r);
            const y = (v: number) => pad.t + (1 - (v - lo) / (1 - lo)) * (H - pad.t - pad.b);
            const line = (vs: number[]) => vs.map((v, i) => (Number.isNaN(v) ? null : `${x(i + 1).toFixed(1)},${y(v).toFixed(1)}`)).filter(Boolean).join(" L");
            const ticks = [0.5, 0.6, 0.7, 0.8, 0.9, 1].filter((v) => v >= lo);
            return (
              <svg viewBox={`0 0 ${W} ${H}`} className="mx-auto block h-auto w-full max-w-3xl" role="img" aria-label="Forest accuracy as trees are added">
                {ticks.map((v) => (
                  <g key={v}>
                    <line x1={pad.l} x2={W - pad.r} y1={y(v)} y2={y(v)} stroke={C.grid} strokeWidth={0.6} />
                    <text x={pad.l - 6} y={y(v) + 3} textAnchor="end" fontSize={10} fill={C.muted}>
                      {Math.round(v * 100)}%
                    </text>
                  </g>
                ))}
                {[1, 10, 20, 30, 40, 50].map((n) => (
                  <text key={n} x={x(n)} y={H - 12} textAnchor="middle" fontSize={10} fill={C.muted}>
                    {n}
                  </text>
                ))}
                <text x={W - pad.r} y={H - 1} textAnchor="end" fontSize={10} fill={C.muted}>
                  number of trees →
                </text>
                <line x1={pad.l} x2={W - pad.r} y1={y(singleFresh)} y2={y(singleFresh)} stroke={C.fg} strokeDasharray="5 4" opacity={0.6} />
                <path d={`M${line(curve.map((c) => c.oob.accuracy))}`} fill="none" stroke={C.violet} strokeWidth={1.8} opacity={0.85} />
                <path d={`M${line(curve.map((c) => c.fresh))}`} fill="none" stroke={C.teal} strokeWidth={2.4} />
                <line x1={x(k)} x2={x(k)} y1={pad.t} y2={H - pad.b} stroke={C.fg} strokeOpacity={0.25} />
              </svg>
            );
          })()}
          <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5"><span className="h-0.5 w-5 bg-viz-current" /> forest, on 400 new points</span>
            <span className="flex items-center gap-1.5"><span className="h-0.5 w-5 bg-viz-visited" /> out-of-bag estimate (no new points needed)</span>
            <span className="flex items-center gap-1.5"><span className="h-0.5 w-5 border-t-2 border-dashed border-foreground/60" /> one full tree</span>
          </div>
        </Surface>
      </section>

      <RfMath />

      <section aria-labelledby="rf-pros-title" className="space-y-4">
        <SectionTitle id="rf-pros-title" kicker="In practice" title="Pros and cons" />
        <div className="grid gap-3 md:grid-cols-2">
          <Surface variant="card" radius="2xl" className="space-y-2 p-4">
            <h3 className="font-semibold text-viz-found">Good at</h3>
            <ul className="list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-muted-foreground marker:text-viz-found">
              <li>Much steadier and usually more accurate on new data than one tree: averaging reduces the variance.</li>
              <li>Works well out of the box, with little tuning.</li>
              <li>A free accuracy estimate from the out-of-bag rows.</li>
              <li>Trees are independent, so they can be grown in parallel.</li>
            </ul>
          </Surface>
          <Surface variant="card" radius="2xl" className="space-y-2 p-4">
            <h3 className="font-semibold text-destructive-bright">Watch out for</h3>
            <ul className="list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-muted-foreground marker:text-destructive-bright">
              <li>Hard to read: you can't follow 50 trees by hand the way you can follow one.</li>
              <li>Slower and bigger than one tree, both to train and to use.</li>
              <li>Can be slightly more biased than one tree (scikit-learn notes this trade for much less variance).</li>
              <li>Built-in feature importances favour features with many distinct values; scikit-learn suggests permutation importance instead.</li>
            </ul>
          </Surface>
        </div>
      </section>

      <div id="rf-guide" className="scroll-mt-20">
        <AlgorithmGuidePanel guide={randomForestGuide} activeStageId={player.current ? randomForestGuideStepFor(player.current) : null} />
      </div>
    </div>
  );
};

export default RandomForestVisualizer;
