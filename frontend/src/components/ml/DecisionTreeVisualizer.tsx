// Decision Tree: build one question at a time, see the plot carved into boxes,
// send a new point down the tree, and watch depth trade training accuracy for
// accuracy on new points.

import { Shuffle } from "lucide-react";
import * as React from "react";

import { useAlgorithmPlayer } from "../../hooks/useAlgorithmPlayer";
import { decisionTreeGuide, decisionTreeGuideStepFor } from "../../lib/guides/mlGuides";
import {
  accuracyOf,
  buildTreeSteps,
  classify,
  fitTree,
  makeTreeData,
  TREE_BOUNDS,
  TREE_DATASETS,
  type Criterion,
  type TreeDatasetKey,
  type TreeNode,
} from "../../lib/ml/decisionTree";
import { Button } from "../ui/button";
import { Surface } from "../ui/surface";
import AlgorithmGuidePanel from "../Visualizer/AlgorithmGuide";
import VisualizerControls from "../Visualizer/VisualizerControls";
import { C, CLUSTER } from "./colors";
import { treeFigures } from "./figures/treeFigures";
import { SectionTitle } from "./mathBlocks";
import { ConceptFigures, Plot, Segmented, Stat } from "./shared";
import TreeMath from "./tree/TreeMath";

const DEPTHS = [1, 2, 3, 4, 6, 10];
const f2 = (v: number) => v.toFixed(2);

/** Lays out nodes for drawing: leaves evenly across, parents centred over children. */
function layout(nodes: TreeNode[]) {
  const pos = new Map<number, { x: number; y: number }>();
  let next = 0;
  const visit = (id: number): number => {
    const n = nodes[id];
    let x: number;
    if (n.left !== undefined && n.right !== undefined && nodes[n.left] && nodes[n.right]) {
      x = (visit(n.left) + visit(n.right)) / 2;
    } else {
      x = next++;
    }
    pos.set(id, { x, y: n.depth });
    return x;
  };
  if (nodes.length) visit(0);
  return { pos, leaves: Math.max(next, 1), depth: Math.max(0, ...nodes.map((n) => n.depth)) };
}

const TreeDiagram: React.FC<{ nodes: TreeNode[]; focus: number; path: number[]; names: string[] }> = ({ nodes, focus, path, names }) => {
  const { pos, leaves, depth } = layout(nodes);
  const colW = 86;
  const rowH = 70;
  const W = Math.max(320, leaves * colW);
  const H = (depth + 1) * rowH + 10;
  const X = (x: number) => (x + 0.5) * (W / leaves);
  const Y = (d: number) => 30 + d * rowH;
  const onPath = new Set(path);
  return (
    // Deep trees scroll sideways instead of shrinking until the labels are unreadable.
    <svg viewBox={`0 0 ${W} ${H}`} style={{ minWidth: Math.max(300, W * 0.8) }} className="block h-auto w-full" role="img" aria-label="The decision tree built so far">
      {nodes.map((n) =>
        n.left !== undefined && n.right !== undefined
          ? ([n.left, n.right] as const).map((c, i) => {
              const a = pos.get(n.id)!;
              const b = pos.get(c);
              if (!b) return null;
              const hot = onPath.has(n.id) && onPath.has(c);
              return (
                <g key={`${n.id}-${c}`}>
                  <line x1={X(a.x)} y1={Y(a.y) + 14} x2={X(b.x)} y2={Y(b.y) - 14} stroke={hot ? C.fg : C.grid} strokeWidth={hot ? 2.5 : 1.5} />
                  <text x={(X(a.x) + X(b.x)) / 2 + (i ? 8 : -8)} y={(Y(a.y) + Y(b.y)) / 2} textAnchor="middle" fontSize={10} fill={i ? C.red : C.green}>
                    {i ? "no" : "yes"}
                  </text>
                </g>
              );
            })
          : null,
      )}
      {nodes.map((n) => {
        const p = pos.get(n.id)!;
        const isLeaf = n.split === undefined;
        const col = CLUSTER[n.prediction % CLUSTER.length];
        const label = isLeaf ? `${names[n.prediction]}` : `${n.split!.feature} ≤ ${f2(n.split!.threshold)}?`;
        const w = isLeaf ? 74 : 84;
        const highlighted = n.id === focus || onPath.has(n.id);
        return (
          <g key={n.id}>
            <rect
              x={X(p.x) - w / 2}
              y={Y(p.y) - 14}
              width={w}
              height={28}
              rx={isLeaf ? 14 : 8}
              fill={isLeaf ? col : C.card}
              fillOpacity={isLeaf ? 0.22 : 1}
              stroke={highlighted ? C.fg : isLeaf ? col : C.amber}
              strokeWidth={highlighted ? 2.5 : 1.2}
            />
            <text x={X(p.x)} y={Y(p.y) + 4} textAnchor="middle" fontSize={11} fill={C.fg}>
              {label}
            </text>
            <text x={X(p.x)} y={Y(p.y) + 26} textAnchor="middle" fontSize={9} fill={C.muted}>
              {n.counts.join(" / ")}
            </text>
          </g>
        );
      })}
    </svg>
  );
};

const DecisionTreeVisualizer: React.FC = () => {
  const [dataset, setDataset] = React.useState<TreeDatasetKey>("groups");
  const [seed, setSeed] = React.useState(1);
  const [maxDepth, setMaxDepth] = React.useState(3);
  const [criterion, setCriterion] = React.useState<Criterion>("gini");
  const [probe, setProbe] = React.useState<{ x: number; y: number } | null>(null);

  const info = TREE_DATASETS[dataset];
  const data = React.useMemo(() => makeTreeData(dataset, seed), [dataset, seed]);
  const unseen = React.useMemo(() => makeTreeData(dataset, 999, 400), [dataset]);
  const opts = React.useMemo(() => ({ maxDepth, criterion, classes: info.classes, bounds: TREE_BOUNDS }), [maxDepth, criterion, info.classes]);
  const steps = React.useMemo(() => buildTreeSteps(data, opts, info.names), [data, opts, info.names]);
  const player = useAlgorithmPlayer(steps, { initialDelayMs: 900 });
  const step = player.current ?? steps[0];
  const locked = player.status === "running";
  const finished = steps.at(-1)!.nodes;
  const nodes = step.nodes;
  const leaves = nodes.filter((n) => n.split === undefined && n.leafReason !== undefined);
  const isDone = step.phase === "done";
  const probeResult = probe && isDone ? classify(nodes, probe) : null;

  const depthCurve = React.useMemo(
    () =>
      Array.from({ length: 12 }, (_, i) => {
        const tree = fitTree(data, { ...opts, maxDepth: i + 1 });
        return { depth: i + 1, train: accuracyOf(tree, data), test: accuracyOf(tree, unseen) };
      }),
    [data, unseen, opts],
  );

  return (
    <div className="space-y-10">
      <div className="space-y-6">
        <ConceptFigures figures={treeFigures} />
        <nav aria-label="On this page" className="flex flex-wrap items-center gap-2 text-sm">
          <span className="text-muted-foreground">Jump to:</span>
          {[
            ["#dt-build-title", "Build a tree"],
            ["#dt-depth-title", "Too deep?"],
            ["#dt-math-title", "The maths"],
            ["#dt-pros-title", "Pros and cons"],
            ["#dt-guide", "Summary"],
          ].map(([href, label]) => (
            <a key={href} href={href} className="glass-pill glass-hover px-3.5 py-1.5 text-foreground">
              {label}
            </a>
          ))}
        </nav>
      </div>

      <section aria-labelledby="dt-build-title" className="space-y-4">
        <SectionTitle id="dt-build-title" kicker="Watch it learn" title="Build a tree, one question at a time">
          <p>
            Each point has two numbers, x and y, and a colour (its class). The tree learns questions like “Is x ≤ 4.2?” that sort the
            colours apart. Step through it: the amber line is the question being tried, and the shaded boxes are the leaves' answers. When it's
            finished, click anywhere on the plot to send a new point down the tree.
          </p>
        </SectionTitle>

        <div className="grid gap-4 lg:grid-cols-2">
          <Surface variant="card" radius="2xl" className="min-w-0 p-3 sm:p-4">
            <Plot
              xDomain={[0, 10]}
              yDomain={[0, 10]}
              width={420}
              height={400}
              ticks={[0, 2, 4, 6, 8, 10]}
              label="Training points, the leaves' regions and the splits"
              onPick={isDone ? (p) => setProbe(p) : undefined}
            >
              {(s) => (
                <>
                  {nodes
                    .filter((n) => n.split === undefined && n.leafReason !== undefined)
                    .map((n) => (
                      <rect
                        key={`r${n.id}`}
                        x={s.x(n.box.x0)}
                        y={s.y(n.box.y1)}
                        width={s.x(n.box.x1) - s.x(n.box.x0)}
                        height={s.y(n.box.y0) - s.y(n.box.y1)}
                        fill={CLUSTER[n.prediction % CLUSTER.length]}
                        opacity={probeResult && probeResult.leaf.id === n.id ? 0.32 : 0.14}
                      />
                    ))}
                  {nodes
                    .filter((n) => n.split)
                    .map((n) => {
                      const t = n.split!.threshold;
                      return n.split!.feature === "x" ? (
                        <line key={`s${n.id}`} x1={s.x(t)} x2={s.x(t)} y1={s.y(n.box.y0)} y2={s.y(n.box.y1)} stroke={C.fg} strokeWidth={1.6} opacity={0.75} />
                      ) : (
                        <line key={`s${n.id}`} x1={s.x(n.box.x0)} x2={s.x(n.box.x1)} y1={s.y(t)} y2={s.y(t)} stroke={C.fg} strokeWidth={1.6} opacity={0.75} />
                      );
                    })}
                  {step.phase === "consider" && step.candidate && (() => {
                    const b = nodes[step.focus].box;
                    const t = step.candidate.threshold;
                    return (
                      <>
                        <rect x={s.x(b.x0)} y={s.y(b.y1)} width={s.x(b.x1) - s.x(b.x0)} height={s.y(b.y0) - s.y(b.y1)} fill="none" stroke={C.amber} strokeDasharray="3 3" />
                        {step.candidate.feature === "x" ? (
                          <line x1={s.x(t)} x2={s.x(t)} y1={s.y(b.y0)} y2={s.y(b.y1)} stroke={C.amber} strokeWidth={3} strokeDasharray="7 4" />
                        ) : (
                          <line x1={s.x(b.x0)} x2={s.x(b.x1)} y1={s.y(t)} y2={s.y(t)} stroke={C.amber} strokeWidth={3} strokeDasharray="7 4" />
                        )}
                      </>
                    );
                  })()}
                  {data.map((p, i) => (
                    <circle key={i} cx={s.x(p.x)} cy={s.y(p.y)} r={4.5} fill={CLUSTER[p.label % CLUSTER.length]} stroke="hsl(var(--background))" strokeWidth={1} />
                  ))}
                  {probe && isDone && (
                    <g>
                      <circle cx={s.x(probe.x)} cy={s.y(probe.y)} r={9} fill="none" stroke={C.fg} strokeWidth={2.5} />
                      <circle cx={s.x(probe.x)} cy={s.y(probe.y)} r={3} fill={C.fg} />
                    </g>
                  )}
                  <text x={s.x(9.8)} y={s.y(0.3)} textAnchor="end" fontSize={10} fill={C.muted}>
                    x →
                  </text>
                  <text x={s.x(0.2)} y={s.y(9.6)} fontSize={10} fill={C.muted}>
                    y ↑
                  </text>
                </>
              )}
            </Plot>
          </Surface>

          <div className="flex min-w-0 flex-col gap-4">
            <Surface variant="card" radius="2xl" className="min-w-0 overflow-x-auto p-3 sm:p-4">
              <TreeDiagram nodes={nodes} focus={step.focus} path={probeResult?.path ?? []} names={info.names} />
              <p className="mt-2 text-xs text-muted-foreground">Numbers under each box: how many training points of each colour reach it.</p>
            </Surface>
            <Surface variant="card" radius="2xl" className="p-4">
              <dl className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                <Stat label="Questions" value={nodes.filter((n) => n.split).length} />
                <Stat label="Leaves" value={leaves.length} />
                <Stat label="Training accuracy" value={`${(accuracyOf(finished, data) * 100).toFixed(1)}%`} />
                <Stat label="On 400 new points" value={`${(accuracyOf(finished, unseen) * 100).toFixed(1)}%`} />
              </dl>
              <p className="mt-2 text-xs text-muted-foreground">
                Accuracy is for the finished tree at this depth. {probeResult && `Your point lands in a “${info.names[probeResult.leaf.prediction]}” leaf after ${probeResult.path.length - 1} question${probeResult.path.length === 2 ? "" : "s"}.`}
              </p>
            </Surface>
          </div>
        </div>

        <Surface variant="card" radius="2xl" className="space-y-5 p-4 sm:p-6">
          <div className="flex flex-wrap items-end gap-x-6 gap-y-4">
            <Segmented label="Data" value={dataset} onChange={(k) => { setDataset(k); setProbe(null); }} disabled={locked} options={(Object.keys(TREE_DATASETS) as TreeDatasetKey[]).map((k) => ({ value: k, label: TREE_DATASETS[k].label }))} />
            <Segmented label="Max depth" value={maxDepth} onChange={(d) => { setMaxDepth(d); setProbe(null); }} disabled={locked} options={DEPTHS.map((d) => ({ value: d, label: String(d) }))} />
            <Segmented
              label="Measure of mixed-up-ness"
              value={criterion}
              onChange={setCriterion}
              disabled={locked}
              options={[
                { value: "gini", label: "Gini" },
                { value: "entropy", label: "Entropy" },
              ]}
            />
            <Button variant="outline" disabled={locked} onClick={() => { setSeed((s) => s + 1); setProbe(null); }}>
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
            minDelayMs={150}
            maxDelayMs={2500}
            stepIndex={player.index}
            stepCount={player.stepCount}
          />
          <p className="min-h-[2.5rem] text-sm text-foreground" aria-live="polite">
            {player.current ? step.explanation : "Press Step to watch the first question being chosen."}
          </p>
        </Surface>
      </section>

      <section aria-labelledby="dt-depth-title" className="space-y-4">
        <SectionTitle id="dt-depth-title" kicker="The big trap" title="Too deep? Training accuracy vs new points">
          <p>
            A tree with no limit keeps asking questions until every training point is in its own pure box. That looks perfect on the training
            data, but on noisy data it's memorising mistakes. The chart trains a tree at every depth from 1 to 12 on the current data and tests
            each one on 400 new points it never saw. Try it on “Noisy”.
          </p>
        </SectionTitle>
        <Surface variant="card" radius="2xl" className="p-4 sm:p-5">
          {(() => {
            const W = 520;
            const H = 220;
            const pad = { l: 40, r: 12, t: 12, b: 30 };
            const lo = Math.min(0.5, ...depthCurve.map((d) => d.test)) - 0.02;
            const x = (d: number) => pad.l + ((d - 1) / 11) * (W - pad.l - pad.r);
            const y = (v: number) => pad.t + (1 - (v - lo) / (1 - lo)) * (H - pad.t - pad.b);
            const line = (k: "train" | "test") => depthCurve.map((d, i) => `${i ? "L" : "M"}${x(d.depth).toFixed(1)},${y(d[k]).toFixed(1)}`).join(" ");
            const bestTest = depthCurve.reduce((b, d) => (d.test > b.test ? d : b), depthCurve[0]);
            return (
              <svg viewBox={`0 0 ${W} ${H}`} className="mx-auto block h-auto w-full max-w-3xl" role="img" aria-label="Training and new-point accuracy for tree depths 1 to 12">
                {[0.5, 0.6, 0.7, 0.8, 0.9, 1].filter((v) => v >= lo).map((v) => (
                  <g key={v}>
                    <line x1={pad.l} x2={W - pad.r} y1={y(v)} y2={y(v)} stroke={C.grid} strokeWidth={0.6} />
                    <text x={pad.l - 6} y={y(v) + 3} textAnchor="end" fontSize={10} fill={C.muted}>
                      {Math.round(v * 100)}%
                    </text>
                  </g>
                ))}
                {depthCurve.map((d) => (
                  <text key={d.depth} x={x(d.depth)} y={H - 12} textAnchor="middle" fontSize={10} fill={d.depth === maxDepth ? C.fg : C.muted}>
                    {d.depth}
                  </text>
                ))}
                <text x={W - pad.r} y={H - 1} textAnchor="end" fontSize={10} fill={C.muted}>
                  max depth →
                </text>
                <line x1={x(maxDepth)} x2={x(maxDepth)} y1={pad.t} y2={H - pad.b} stroke={C.fg} strokeOpacity={0.25} />
                <path d={line("train")} fill="none" stroke={C.teal} strokeWidth={2.4} />
                <path d={line("test")} fill="none" stroke={C.amber} strokeWidth={2.4} />
                <circle cx={x(bestTest.depth)} cy={y(bestTest.test)} r={5} fill={C.amber} />
              </svg>
            );
          })()}
          <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5"><span className="h-0.5 w-5 bg-viz-current" /> training accuracy</span>
            <span className="flex items-center gap-1.5"><span className="h-0.5 w-5 bg-viz-compare" /> accuracy on 400 new points (dot = best depth)</span>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            The fixes all stop the tree before it memorises: a maximum depth, a minimum number of points per leaf, or growing it fully and then
            pruning back branches that don't earn their keep (scikit-learn calls this cost-complexity pruning).
          </p>
        </Surface>
      </section>

      <TreeMath />

      <section aria-labelledby="dt-pros-title" className="space-y-4">
        <SectionTitle id="dt-pros-title" kicker="In practice" title="Pros and cons" />
        <div className="grid gap-3 md:grid-cols-2">
          <Surface variant="card" radius="2xl" className="space-y-2 p-4">
            <h3 className="font-semibold text-viz-found">Good at</h3>
            <ul className="list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-muted-foreground marker:text-viz-found">
              <li>Easy to understand and explain: you can read the questions (a “white box” model).</li>
              <li>Little data preparation: no need to scale features.</li>
              <li>Fast to use: a new point only answers one question per level.</li>
              <li>Works for more than two classes, and for numbers too (regression trees).</li>
            </ul>
          </Surface>
          <Surface variant="card" radius="2xl" className="space-y-2 p-4">
            <h3 className="font-semibold text-destructive-bright">Watch out for</h3>
            <ul className="list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-muted-foreground marker:text-destructive-bright">
              <li>Overfitting, if it's allowed to grow too deep.</li>
              <li>Instability: a small change in the data can give a completely different tree.</li>
              <li>Only straight cuts along one feature, so diagonal borders become staircases.</li>
              <li>XOR-like patterns are hard, because the greedy first question can't see that two questions together would work.</li>
              <li>It's biased towards classes that have more examples, so balance the data if one class dominates.</li>
            </ul>
          </Surface>
        </div>
        <p className="text-xs text-muted-foreground">
          Using many trees together (random forests and boosted trees) fixes much of the instability and overfitting. These lists follow
          scikit-learn's documentation on decision trees.
        </p>
      </section>

      <div id="dt-guide" className="scroll-mt-20">
        <AlgorithmGuidePanel guide={decisionTreeGuide} activeStageId={player.current ? decisionTreeGuideStepFor(player.current) : null} />
      </div>
    </div>
  );
};

export default DecisionTreeVisualizer;
