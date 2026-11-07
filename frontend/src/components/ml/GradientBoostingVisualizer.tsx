// Gradient Boosting: each new tree fits what the model still gets wrong.
// One input, so the model, the residuals and each new tree can all be drawn.

import { Shuffle } from "lucide-react";
import * as React from "react";

import { useAlgorithmPlayer } from "../../hooks/useAlgorithmPlayer";
import { gradientBoostingGuide, gradientBoostingGuideStepFor } from "../../lib/guides/mlGuides";
import { buildBoostSteps, errorCurve, evalSteps, fitBoost, fitRegTree, mse, predictBoost, waveData, type Steps1D } from "../../lib/ml/gradientBoosting";
import { Button } from "../ui/button";
import { Surface } from "../ui/surface";
import AlgorithmGuidePanel from "../Visualizer/AlgorithmGuide";
import VisualizerControls from "../Visualizer/VisualizerControls";
import { C } from "./colors";
import { boostFigures } from "./figures/boostFigures";
import GbMath from "./gb/GbMath";
import { SectionTitle } from "./mathBlocks";
import { ConceptFigures, Plot, Segmented, Stat } from "./shared";

const TREES = 200;
const f3 = (v: number) => v.toFixed(3);

/** Path for a piecewise-constant function across [0, 10]. */
function stepPath(f: (x: number) => number, s: { x: (v: number) => number; y: (v: number) => number }, lo = -4, hi = 7) {
  const clamp = (v: number) => Math.max(lo, Math.min(hi, v));
  return Array.from({ length: 401 }, (_, i) => {
    const x = (i / 400) * 10;
    return `${i ? "L" : "M"}${s.x(x).toFixed(1)},${s.y(clamp(f(x))).toFixed(1)}`;
  }).join(" ");
}

const GradientBoostingVisualizer: React.FC = () => {
  const [lr, setLr] = React.useState(0.1);
  const [depth, setDepth] = React.useState(2);
  const [seed, setSeed] = React.useState(1);

  const data = React.useMemo(() => waveData(seed), [seed]);
  const fresh = React.useMemo(() => waveData(999, 400), []);
  const model = React.useMemo(() => fitBoost(data, lr, depth, TREES), [data, lr, depth]);
  const steps = React.useMemo(() => buildBoostSteps(data, model), [data, model]);
  const player = useAlgorithmPlayer(steps, { initialDelayMs: 300 });
  const step = player.current ?? steps[0];
  const locked = player.status === "running";
  const k = step.k;
  const showTree: Steps1D | undefined = step.phase === "fit" ? step.tree : undefined;
  // Residual bars are bright while a tree is being fitted to them, dimmer while trees are just being added.
  const residualsInFocus = player.current === null || ["start", "residuals", "fit"].includes(step.phase);

  const trainCurve = React.useMemo(() => errorCurve(model, data), [model, data]);
  const testCurve = React.useMemo(() => errorCurve(model, fresh), [model, fresh]);
  const bestK = testCurve.indexOf(Math.min(...testCurve));
  const deepTree = React.useMemo(() => fitRegTree(data, 10), [data]);
  const deepTest = mse(fresh, (x) => evalSteps(deepTree, x));

  return (
    <div className="space-y-10">
      <div className="space-y-6">
        <ConceptFigures figures={boostFigures} />
        <nav aria-label="On this page" className="flex flex-wrap items-center gap-2 text-sm">
          <span className="text-muted-foreground">Jump to:</span>
          {[
            ["#gb-build-title", "Watch it boost"],
            ["#gb-curve-title", "When to stop"],
            ["#gb-math-title", "The maths"],
            ["#gb-ada-title", "AdaBoost & tools"],
            ["#gb-guide", "Summary"],
          ].map(([href, label]) => (
            <a key={href} href={href} className="glass-pill glass-hover px-3.5 py-1.5 text-foreground">
              {label}
            </a>
          ))}
        </nav>
      </div>

      <section aria-labelledby="gb-build-title" className="space-y-4">
        <SectionTitle id="gb-build-title" kicker="Watch it learn" title="Boost a model, one small tree at a time">
          <p>
            The task: draw a curve through 40 noisy points. The model starts as a flat line at the average. Each new small tree is trained on
            what's still wrong (the residuals in the lower plot) and only a fraction of it, the learning rate, is added. The first three trees
            are shown in slow motion.
          </p>
        </SectionTitle>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_17rem]">
          <Surface variant="card" radius="2xl" className="min-w-0 space-y-3 p-3 sm:p-4">
            <p className="text-sm font-semibold text-foreground">
              The model after {k} tree{k === 1 ? "" : "s"}
            </p>
            <Plot xDomain={[0, 10]} yDomain={[-3, 6]} width={520} height={260} ticks={[0, 2, 4, 6, 8, 10]} yTicks={[-2, 0, 2, 4, 6]} label={`The boosted model after ${k} trees`}>
              {(s) => (
                <>
                  {data.map((p, i) => (
                    <circle key={i} cx={s.x(p.x)} cy={s.y(p.y)} r={4} fill={C.fg} opacity={0.85} />
                  ))}
                  <path d={stepPath((x) => predictBoost(model, x, k), s, -3, 6)} fill="none" stroke={C.teal} strokeWidth={2.6} />
                </>
              )}
            </Plot>
            <p className="text-sm font-semibold text-foreground">What's still wrong (residuals){showTree ? ", and the new tree fitted to them" : ""}</p>
            <Plot xDomain={[0, 10]} yDomain={[-4, 4]} width={520} height={200} ticks={[0, 2, 4, 6, 8, 10]} yTicks={[-4, -2, 0, 2, 4]} label="Residuals of the current model and the new tree">
              {(s) => (
                <>
                  <line x1={s.x(0)} x2={s.x(10)} y1={s.y(0)} y2={s.y(0)} stroke={C.muted} strokeWidth={0.8} />
                  {data.map((p, i) => {
                    const r = p.y - predictBoost(model, p.x, k);
                    return (
                      <g key={i} opacity={residualsInFocus ? 1 : 0.55}>
                        <line x1={s.x(p.x)} x2={s.x(p.x)} y1={s.y(0)} y2={s.y(Math.max(-4, Math.min(4, r)))} stroke={C.red} strokeWidth={2} />
                        <circle cx={s.x(p.x)} cy={s.y(Math.max(-4, Math.min(4, r)))} r={2.8} fill={C.red} />
                      </g>
                    );
                  })}
                  {showTree && <path d={stepPath((x) => evalSteps(showTree, x), s, -4, 4)} fill="none" stroke={C.amber} strokeWidth={2.6} />}
                </>
              )}
            </Plot>
          </Surface>

          <Surface variant="card" radius="2xl" className="flex flex-col gap-3 p-4">
            <dl className="grid grid-cols-2 gap-2 lg:grid-cols-1">
              <Stat label="Trees so far" value={k} />
              <Stat label="Training error (MSE)" value={f3(trainCurve[k])} />
              <Stat label="Error on 400 new points" value={f3(testCurve[k])} tone={testCurve[k] < deepTest ? C.green : undefined} />
              <Stat label="One deep tree, new points" value={f3(deepTest)} />
            </dl>
            <p className="text-xs leading-relaxed text-muted-foreground">
              MSE is the mean squared error: the average of (true − predicted)². Lower is better. The new points come from the same curve, with
              the same amount of noise, so even a perfect model can't reach 0.
            </p>
          </Surface>
        </div>

        <Surface variant="card" radius="2xl" className="space-y-5 p-4 sm:p-6">
          <div className="flex flex-wrap items-end gap-x-6 gap-y-4">
            <Segmented label="Learning rate" value={lr} onChange={setLr} disabled={locked} options={[0.1, 0.3, 1].map((v) => ({ value: v, label: String(v) }))} />
            <Segmented
              label="Tree depth"
              value={depth}
              onChange={setDepth}
              disabled={locked}
              options={[1, 2, 3, 4].map((v) => ({ value: v, label: v === 1 ? "1 (stump)" : String(v) }))}
            />
            <Button variant="outline" disabled={locked} onClick={() => setSeed((v) => v + 1)}>
              <Shuffle /> New data
            </Button>
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
            minDelayMs={20}
            maxDelayMs={1500}
            stepMs={10}
            stepIndex={player.index}
            stepCount={player.stepCount}
          />
          <p className="min-h-[2.5rem] text-sm text-foreground" aria-live="polite">
            {player.current ? step.explanation : "Press Step to see the first tree in three parts: residuals, fit, add."}
          </p>
        </Surface>
      </section>

      <section aria-labelledby="gb-curve-title" className="space-y-4">
        <SectionTitle id="gb-curve-title" kicker="The big question" title="When to stop adding trees">
          <p>
            Training error only ever goes down as trees are added. Error on new points goes down at first, reaches its lowest point, then
            creeps back up as the trees start fitting the noise. That turning point is the number of trees to keep. With a learning rate of 1
            and deep trees, it's reached almost immediately.
          </p>
        </SectionTitle>
        <Surface variant="card" radius="2xl" className="p-4 sm:p-5">
          {(() => {
            const W = 520;
            const H = 220;
            const pad = { l: 44, r: 12, t: 12, b: 30 };
            const hi = Math.max(1, Math.min(2.5, Math.max(...trainCurve.slice(0, 3), ...testCurve.slice(0, 3))));
            const x = (n: number) => pad.l + (n / TREES) * (W - pad.l - pad.r);
            const y = (v: number) => pad.t + (1 - Math.min(v, hi) / hi) * (H - pad.t - pad.b);
            const line = (vs: number[]) => vs.map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(" ");
            return (
              <svg viewBox={`0 0 ${W} ${H}`} className="mx-auto block h-auto w-full max-w-3xl" role="img" aria-label="Training and new-point error as trees are added">
                {[0, hi / 2, hi].map((v) => (
                  <g key={v}>
                    <line x1={pad.l} x2={W - pad.r} y1={y(v)} y2={y(v)} stroke={C.grid} strokeWidth={0.6} />
                    <text x={pad.l - 6} y={y(v) + 3} textAnchor="end" fontSize={10} fill={C.muted}>
                      {v.toFixed(2)}
                    </text>
                  </g>
                ))}
                {[0, 50, 100, 150, 200].map((n) => (
                  <text key={n} x={x(n)} y={H - 12} textAnchor="middle" fontSize={10} fill={C.muted}>
                    {n}
                  </text>
                ))}
                <text x={W - pad.r} y={H - 1} textAnchor="end" fontSize={10} fill={C.muted}>
                  number of trees →
                </text>
                <line x1={pad.l} x2={W - pad.r} y1={y(deepTest)} y2={y(deepTest)} stroke={C.fg} strokeDasharray="5 4" opacity={0.55} />
                <path d={line(trainCurve)} fill="none" stroke={C.teal} strokeWidth={2.2} />
                <path d={line(testCurve)} fill="none" stroke={C.amber} strokeWidth={2.4} />
                <circle cx={x(bestK)} cy={y(testCurve[bestK])} r={5} fill={C.amber} />
                <line x1={x(k)} x2={x(k)} y1={pad.t} y2={H - pad.b} stroke={C.fg} strokeOpacity={0.25} />
              </svg>
            );
          })()}
          <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5"><span className="h-0.5 w-5 bg-viz-current" /> training error</span>
            <span className="flex items-center gap-1.5"><span className="h-0.5 w-5 bg-viz-compare" /> error on new points (dot = lowest, at {bestK} trees)</span>
            <span className="flex items-center gap-1.5"><span className="h-0.5 w-5 border-t-2 border-dashed border-foreground/60" /> one deep tree</span>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            In practice you hold back some data and stop when its error stops improving (“early stopping”); scikit-learn's histogram-based
            boosting does this by default once there are more than 10,000 samples.
          </p>
        </Surface>
      </section>

      <GbMath />

      <section aria-labelledby="gb-ada-title" className="space-y-4">
        <SectionTitle id="gb-ada-title" kicker="The family" title="AdaBoost, and the tools people use" />
        <div className="grid gap-3 md:grid-cols-2">
          <Surface variant="card" radius="2xl" className="space-y-3 p-4">
            <h3 className="font-semibold text-foreground">AdaBoost: the original boosting</h3>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Instead of fitting residuals, AdaBoost changes how much each training point matters. Every point starts with the same weight
              (1/N). After each weak learner (usually a tiny tree), the points it got wrong get more weight and the ones it got right get
              less, so the next learner concentrates on the hard cases. The final answer is a weighted vote of all the learners.
            </p>
            <svg viewBox="0 0 240 90" className="block h-auto w-full max-w-sm" role="img" aria-label="Points growing in size after being misclassified, round after round">
              {[0, 1, 2].map((round) => (
                <g key={round}>
                  <text x={8} y={22 + round * 28} fontSize={9} fill={C.muted}>round {round + 1}</text>
                  {[0, 1, 2, 3, 4, 5].map((i) => {
                    const hard = i === 2 || i === 4;
                    const r = hard ? 3 + round * 2.5 : Math.max(2.2, 3 - round * 0.4);
                    return <circle key={i} cx={70 + i * 28} cy={18 + round * 28} r={r} fill={hard ? C.red : C.teal} opacity={0.85} />;
                  })}
                </g>
              ))}
            </svg>
            <p className="text-xs text-muted-foreground">Red points were misclassified, so they grow (more weight) each round.</p>
          </Surface>
          <Surface variant="card" radius="2xl" className="space-y-3 p-4">
            <h3 className="font-semibold text-foreground">What people use in practice</h3>
            <ul className="list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-muted-foreground marker:text-primary">
              <li>
                <span className="text-foreground">scikit-learn's HistGradientBoosting</span>: groups values into bins (typically 256), handles
                missing values itself, and can be orders of magnitude faster than the classic version once there are tens of thousands of rows.
              </li>
              <li>
                <span className="text-foreground">XGBoost, LightGBM, CatBoost</span>: popular libraries built on the same idea, adding each tree
                to fix what the previous ones got wrong.
              </li>
              <li>
                <span className="text-foreground">Subsampling</span>: training each tree on a random half of the rows (scikit-learn's typical
                subsample of 0.5) is called stochastic gradient boosting.
              </li>
            </ul>
          </Surface>
        </div>

        <Surface variant="card" radius="2xl" className="overflow-x-auto p-4">
          <h3 className="mb-3 font-semibold text-foreground">Random forest vs gradient boosting</h3>
          <table className="w-full min-w-[32rem] text-left text-sm">
            <thead className="text-xs text-muted-foreground">
              <tr>
                <th className="pb-2 pr-4 font-medium" />
                <th className="pb-2 pr-4 font-medium">Random forest</th>
                <th className="pb-2 font-medium">Gradient boosting</th>
              </tr>
            </thead>
            <tbody className="text-muted-foreground [&_td]:py-1.5 [&_td]:pr-4 [&_td]:align-top">
              <tr><td className="text-foreground">How trees are built</td><td>Side by side, independently</td><td>One after another, each fixing the last</td></tr>
              <tr><td className="text-foreground">Each tree</td><td>Deep, on a random sample</td><td>Small and shallow, on the residuals</td></tr>
              <tr><td className="text-foreground">Combined by</td><td>Averaging</td><td>Adding, each scaled by the learning rate</td></tr>
              <tr><td className="text-foreground">More trees</td><td>Doesn't overfit; just slower</td><td>Can overfit: stop at the best number</td></tr>
              <tr><td className="text-foreground">Tuning</td><td>Works well out of the box</td><td>Needs learning rate, depth and tree count</td></tr>
              <tr><td className="text-foreground">Parallel training</td><td>Yes</td><td>No (trees depend on each other)</td></tr>
            </tbody>
          </table>
        </Surface>
      </section>

      <div id="gb-guide" className="scroll-mt-20">
        <AlgorithmGuidePanel guide={gradientBoostingGuide} activeStageId={player.current ? gradientBoostingGuideStepFor(player.current) : null} />
      </div>
    </div>
  );
};

export default GradientBoostingVisualizer;
