import { Dices, Shuffle, Trash2 } from "lucide-react";
import * as React from "react";

import { useAlgorithmPlayer } from "../../hooks/useAlgorithmPlayer";
import { kMeansGuide, kMeansGuideStepFor } from "../../lib/guides/mlGuides";
import { KMEANS_DEFAULT, kMeansPoints } from "../../lib/ml/demos";
import { buildKMeansSteps, type KMeansInit } from "../../lib/ml/kMeans";
import type { Point } from "../../lib/ml/random";
import { Button } from "../ui/button";
import { Surface } from "../ui/surface";
import AlgorithmGuidePanel from "../Visualizer/AlgorithmGuide";
import VisualizerControls from "../Visualizer/VisualizerControls";
import { kMeansFigures } from "./figures/clusteringFigures";
import { C, CLUSTER } from "./colors";
import { Arrowhead, ConceptFigures, LossChart, Plot, Segmented, Stat } from "./shared";

const TICKS = [0, 2, 4, 6, 8, 10];

const KMeansVisualizer: React.FC = () => {
  const [dataSeed, setDataSeed] = React.useState(KMEANS_DEFAULT.seed);
  const [points, setPoints] = React.useState<Point[]>(() => kMeansPoints(KMEANS_DEFAULT.seed));
  const [k, setK] = React.useState(KMEANS_DEFAULT.k);
  const [init, setInit] = React.useState<KMeansInit>("plusplus");
  const [startSeed, setStartSeed] = React.useState(KMEANS_DEFAULT.startSeed);

  const steps = React.useMemo(() => buildKMeansSteps(points, k, init, startSeed), [points, k, init, startSeed]);
  const player = useAlgorithmPlayer(steps, { initialDelayMs: 700 });
  const step = player.current ?? steps[0];
  const locked = player.status === "running";
  const sizes = step.centroids.map((_, c) => step.assignment.filter((a) => a === c).length);

  return (
    <div className="space-y-6">
      <ConceptFigures figures={kMeansFigures} />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_17rem]">
        <Surface variant="card" radius="2xl" className="min-w-0 p-3 sm:p-4">
          <Plot
            xDomain={[0, 10]}
            yDomain={[0, 10]}
            ticks={TICKS}
            label="Points coloured by cluster, with cluster centres"
            onPick={locked ? undefined : (p) => setPoints((ps) => [...ps, p])}
          >
            {(s) => (
              <>
                {CLUSTER.map((c, i) => (
                  <Arrowhead key={i} id={`km-arrow-${i}`} color={c} />
                ))}
                {/* A faint line from each point to its centre makes "joins the nearest" visible. */}
                {step.phase === "assign" &&
                  points.map((p, i) => {
                    const c = step.centroids[step.assignment[i]];
                    return c ? (
                      <line key={`l${i}`} x1={s.x(p.x)} y1={s.y(p.y)} x2={s.x(c.x)} y2={s.y(c.y)} stroke={CLUSTER[step.assignment[i] % CLUSTER.length]} strokeWidth={0.8} opacity={0.35} />
                    ) : null;
                  })}
                {points.map((p, i) => {
                  const a = step.assignment[i];
                  return (
                    <circle
                      key={i}
                      cx={s.x(p.x)}
                      cy={s.y(p.y)}
                      r={4.5}
                      fill={a >= 0 ? CLUSTER[a % CLUSTER.length] : C.idle}
                      opacity={a >= 0 ? 0.9 : 0.7}
                      style={{ transition: "fill 200ms" }}
                    />
                  );
                })}
                {step.previous?.map((p, c) => {
                  const n = step.centroids[c];
                  const moved = Math.hypot(n.x - p.x, n.y - p.y) > 0.05;
                  return (
                    <g key={`prev${c}`}>
                      <circle cx={s.x(p.x)} cy={s.y(p.y)} r={9} fill="none" stroke={CLUSTER[c % CLUSTER.length]} strokeDasharray="3 3" opacity={0.6} />
                      {moved && (
                        <line x1={s.x(p.x)} y1={s.y(p.y)} x2={s.x(n.x)} y2={s.y(n.y)} stroke={C.amber} strokeWidth={2} markerEnd={`url(#km-arrow-2)`} />
                      )}
                    </g>
                  );
                })}
                {step.centroids.map((c, i) => {
                  const col = CLUSTER[i % CLUSTER.length];
                  const x = s.x(c.x);
                  const y = s.y(c.y);
                  return (
                    <g key={`c${i}`} style={{ transition: "transform 300ms" }}>
                      <circle cx={x} cy={y} r={11} fill="hsl(var(--background))" stroke={col} strokeWidth={2.5} />
                      <path d={`M${x - 5},${y - 5} L${x + 5},${y + 5} M${x + 5},${y - 5} L${x - 5},${y + 5}`} stroke={col} strokeWidth={2.5} />
                    </g>
                  );
                })}
                <text x={s.x(0.2)} y={s.y(9.6)} fontSize={9} fill={C.muted}>
                  Click to add a point
                </text>
              </>
            )}
          </Plot>
        </Surface>

        <Surface variant="card" radius="2xl" className="flex flex-col gap-3 p-4">
          <dl className="grid grid-cols-2 gap-2">
            <Stat label="Round" value={step.iter} />
            <Stat label="Inertia" value={step.inertia === null ? "–" : step.inertia.toFixed(1)} />
            <Stat label="Changed" value={step.changed ?? "–"} />
            <Stat label="Points" value={points.length} />
          </dl>
          <div className="space-y-1.5">
            <p className="text-xs text-muted-foreground">Cluster sizes</p>
            <ul className="flex flex-wrap gap-1.5">
              {sizes.map((n, i) => (
                <li key={i} className="glass-pill flex items-center gap-1.5 px-2.5 py-1 font-mono text-xs">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: CLUSTER[i % CLUSTER.length] }} />
                  {n}
                </li>
              ))}
            </ul>
          </div>
          <LossChart values={step.inertias} total={Math.max(steps.at(-1)!.inertias.length, 2)} label="Inertia after each update (lower is tighter)" />
        </Surface>
      </div>

      <Surface variant="card" radius="2xl" className="space-y-5 p-4 sm:p-6">
        <div className="flex flex-wrap items-end gap-x-6 gap-y-4">
          <Segmented label="Clusters (k)" value={k} onChange={setK} disabled={locked} options={[2, 3, 4, 5, 6].map((v) => ({ value: v, label: String(v) }))} />
          <Segmented
            label="Starting centres"
            value={init}
            onChange={setInit}
            disabled={locked}
            options={[
              { value: "plusplus", label: "k-means++" },
              { value: "random", label: "Random" },
            ]}
          />
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" disabled={locked} onClick={() => setStartSeed((s) => s + 1)}>
              <Dices /> New start
            </Button>
            <Button
              variant="outline"
              disabled={locked}
              onClick={() => {
                setDataSeed(dataSeed + 1);
                setPoints(kMeansPoints(dataSeed + 1));
              }}
            >
              <Shuffle /> New data
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
          stepIndex={player.index}
          stepCount={player.stepCount}
        />
        <p className="min-h-[2.5rem] text-sm text-foreground" aria-live="polite">
          {player.current ? step.explanation : "Press Start to watch the centres find the groups."}
        </p>
      </Surface>

      <AlgorithmGuidePanel guide={kMeansGuide} activeStageId={player.current ? kMeansGuideStepFor(player.current) : null} />
    </div>
  );
};

export default KMeansVisualizer;
