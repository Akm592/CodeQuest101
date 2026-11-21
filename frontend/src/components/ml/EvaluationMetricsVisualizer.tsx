// Evaluation Metrics: how a yes/no classifier is judged. One spam filter's
// scores, a threshold you move, the confusion matrix it fills, the metrics
// that follow, the precision–recall trade-off, ROC and AUC, and the accuracy
// trap on a rare condition, simplest first.

import * as React from "react";

import { useAlgorithmPlayer } from "../../hooks/useAlgorithmPlayer";
import { evaluationMetricsGuide, evaluationMetricsGuideStepFor } from "../../lib/guides/mlGuides";
import {
  aucByPairs,
  buildMetricSteps,
  confusion,
  DEFAULT_THRESHOLD,
  EMAILS,
  emailsFor,
  metricsOf,
  type ModelKey,
  MODELS,
  outcomeOf,
  RARE,
  rocCurve,
} from "../../lib/ml/metrics";
import { Slider } from "../ui/slider";
import { Surface } from "../ui/surface";
import AlgorithmGuidePanel from "../Visualizer/AlgorithmGuide";
import VisualizerControls from "../Visualizer/VisualizerControls";
import { C } from "./colors";
import { metricsFigures } from "./figures/metricsFigures";
import { SectionTitle } from "./mathBlocks";
import { PeopleGrid, RocChart, TradeoffChart } from "./metrics/MetricCharts";
import { METRIC_INFO, type MetricKey, pct } from "./metrics/metricInfo";
import { ConfusionMatrix, MetricTiles, ScoreStrip } from "./metrics/MetricParts";
import MetricsMath from "./metrics/MetricsMath";
import { OUTCOME_COLOR } from "./metrics/outcomeColors";
import { ConceptFigures, Segmented, Stat } from "./shared";

const JUMPS: [string, string][] = [
  ["#em-threshold-title", "Move the threshold"],
  ["#em-tradeoff-title", "Precision vs recall"],
  ["#em-roc-title", "ROC & AUC"],
  ["#em-trap-title", "The accuracy trap"],
  ["#em-math-title", "The maths"],
  ["#em-which-title", "Which metric?"],
  ["#em-guide", "Summary"],
];

const Legend: React.FC = () => (
  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
    {(
      [
        ["tp", "caught (TP)"],
        ["tn", "left alone (TN)"],
        ["fp", "false alarm (FP)"],
        ["fn", "missed (FN)"],
      ] as const
    ).map(([o, label]) => (
      <span key={o} className="flex items-center gap-1.5">
        <span className="h-2.5 w-2.5 rounded-full" style={{ background: OUTCOME_COLOR[o] }} />
        {label}
      </span>
    ))}
  </div>
);

const ThresholdSlider: React.FC<{ id: string; value: number; onChange: (v: number) => void; disabled?: boolean }> = ({ id, value, onChange, disabled }) => (
  <div className="space-y-1.5">
    <div className="flex items-baseline justify-between">
      <label htmlFor={id} className="text-sm font-medium text-muted-foreground">
        Threshold
      </label>
      <span className="font-mono text-sm tabular-nums text-foreground">{value.toFixed(2)}</span>
    </div>
    <Slider id={id} value={[value]} min={0} max={1} step={0.01} onValueChange={([v]) => onChange(v)} disabled={disabled} aria-label="Threshold" />
  </div>
);

const EvaluationMetricsVisualizer: React.FC = () => {
  const [threshold, setThreshold] = React.useState(DEFAULT_THRESHOLD);
  const [hover, setHover] = React.useState<MetricKey | null>(null);
  const [model, setModel] = React.useState<ModelKey>("page");
  const [rare, setRare] = React.useState<(typeof RARE)[number]["key"]>("lazy");

  const steps = React.useMemo(() => buildMetricSteps(EMAILS, threshold), [threshold]);
  const player = useAlgorithmPlayer(steps, { initialDelayMs: 900 });
  const step = player.current;
  const locked = player.status === "running";
  const setT = (t: number) => !locked && setThreshold(Math.min(1, Math.max(0, t)));

  const full = confusion(EMAILS, threshold);
  const counts = step?.counts ?? full;
  const judging = step !== null && (step.phase === "threshold" || step.phase === "judge");
  const metricPhase = step && step.phase in METRIC_INFO ? (step.phase as MetricKey) : null;
  const activeCell = step?.phase === "judge" && step.current !== undefined ? outcomeOf(EMAILS[step.current], threshold) : undefined;
  const shownMetric = metricPhase ?? hover;
  const m = metricsOf(full);

  const modelItems = React.useMemo(() => emailsFor(model), [model]);
  const roc = React.useMemo(() => rocCurve(modelItems), [modelItems]);
  const modelCounts = confusion(modelItems, threshold);
  const modelM = metricsOf(modelCounts);
  const auc = aucByPairs(modelItems);

  const rareScenario = RARE.find((r) => r.key === rare)!;
  const rareM = metricsOf(rareScenario.confusion);

  return (
    <div className="space-y-10">
      <div className="space-y-6">
        <ConceptFigures figures={metricsFigures} />
        <nav aria-label="On this page" className="flex flex-wrap items-center gap-2 text-sm">
          <span className="text-muted-foreground">Jump to:</span>
          {JUMPS.map(([href, label]) => (
            <a key={href} href={href} className="glass-pill glass-hover px-3.5 py-1.5 text-foreground">
              {label}
            </a>
          ))}
        </nav>
      </div>

      {/* ------------------------------------------------------------------ */}
      <section aria-labelledby="em-threshold-title" className="space-y-4">
        <SectionTitle id="em-threshold-title" kicker="Watch it get judged" title="Move the threshold, fill the table">
          <p>
            A spam filter has scored 20 emails (made up for this page, so you can count them). Each dot is one email: spam on the top row, normal
            email below. Everything right of the dashed line gets flagged. Press Step to judge the emails one by one and watch each land in its
            cell, or drag the threshold and see every number change at once.
          </p>
        </SectionTitle>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,25rem)]">
          <Surface variant="card" radius="2xl" className="min-w-0 space-y-4 p-4 sm:p-5">
            <ScoreStrip
              items={EMAILS}
              threshold={threshold}
              judged={judging ? step!.judged : undefined}
              current={step?.phase === "judge" ? step.current : undefined}
              onPick={locked ? undefined : setT}
              label={`20 emails placed by score, with the threshold at ${threshold.toFixed(2)}`}
            />
            <Legend />
            <ThresholdSlider id="em-threshold" value={threshold} onChange={setT} disabled={locked} />
            <p className="text-xs text-muted-foreground">Tip: click anywhere on the strip to put the threshold there. Hover a dot to see the email.</p>
            <VisualizerControls
              status={player.status}
              onPlay={player.play}
              onPause={player.pause}
              onReset={player.reset}
              onStepForward={player.stepForward}
              onStepBack={player.stepBack}
              delayMs={player.delayMs}
              onDelayChange={player.setDelayMs}
              minDelayMs={300}
              maxDelayMs={2500}
              stepMs={100}
              stepIndex={player.index}
              stepCount={player.stepCount}
            />
            <p className="min-h-[3rem] text-sm text-foreground" aria-live="polite">
              {step
                ? step.explanation
                : `At ${threshold.toFixed(2)}, the filter flags ${full.tp + full.fp} emails: ${full.tp} spam and ${full.fp} normal. Press Step to judge them one at a time.`}
            </p>
          </Surface>

          <Surface variant="card" radius="2xl" className="min-w-0 space-y-4 p-4 sm:p-5">
            <div className="flex items-baseline justify-between">
              <p className="text-sm font-semibold text-foreground">Confusion matrix</p>
              <p className="text-xs text-muted-foreground">{judging ? `${step!.judged} of ${EMAILS.length} judged` : `all ${EMAILS.length} emails`}</p>
            </div>
            <ConfusionMatrix counts={counts} active={activeCell} highlight={shownMetric ? METRIC_INFO[shownMetric].uses : undefined} />
            <MetricTiles metrics={metricsOf(counts)} active={shownMetric ?? undefined} onHover={setHover} pending={judging} />
            <p className="text-xs leading-relaxed text-muted-foreground">
              {shownMetric
                ? `${METRIC_INFO[shownMetric].label} uses the lit cells: ${METRIC_INFO[shownMetric].formula}.`
                : "Hover a metric to see which cells it uses."}
            </p>
          </Surface>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      <section aria-labelledby="em-tradeoff-title" className="space-y-4">
        <SectionTitle id="em-tradeoff-title" kicker="The big trade-off" title="Precision vs recall">
          <p>
            One threshold, two numbers that pull in opposite directions. The chart shows both at every threshold from 0 to 1; the amber line is
            yours (click the chart to move it). There is no setting that wins both: you choose which mistake you'd rather make.
          </p>
        </SectionTitle>
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,20rem)]">
          <Surface variant="card" radius="2xl" className="min-w-0 p-3 sm:p-4">
            <TradeoffChart items={EMAILS} threshold={threshold} onPick={setT} />
            <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5"><span className="h-0.5 w-5 bg-viz-pointer" /> precision</span>
              <span className="flex items-center gap-1.5"><span className="h-0.5 w-5 bg-viz-visited" /> recall</span>
              <span className="flex items-center gap-1.5"><span className="h-0 w-5 border-t border-dashed border-foreground/60" /> F1</span>
              <span>across: threshold</span>
            </div>
          </Surface>
          <Surface variant="card" radius="2xl" className="flex min-w-0 flex-col gap-3 p-4">
            <ThresholdSlider id="em-threshold-2" value={threshold} onChange={setT} disabled={locked} />
            <dl className="grid grid-cols-3 gap-2">
              <Stat label="Precision" value={pct(m.precision)} tone={C.sky} />
              <Stat label="Recall" value={pct(m.recall)} tone={C.violet} />
              <Stat label="F1" value={pct(m.f1)} />
            </dl>
            <ul className="list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-muted-foreground">
              <li>
                <span className="text-foreground">High threshold:</span> only the surest emails are flagged. Few false alarms (high precision), but
                spam slips through (low recall).
              </li>
              <li>
                <span className="text-foreground">Low threshold:</span> nearly everything is flagged. All the spam is caught (high recall), along
                with real email (low precision).
              </li>
              <li>Past the highest score nothing is flagged, so precision has no value and its line stops.</li>
            </ul>
          </Surface>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      <section aria-labelledby="em-roc-title" className="space-y-4">
        <SectionTitle id="em-roc-title" kicker="Every threshold at once" title="The ROC curve and AUC">
          <p>
            Slide the threshold from 1 down to 0 and plot where you are each time: across, the share of normal email wrongly flagged; up, the
            share of spam caught. Each spam email you pass steps the curve up; each normal email steps it right. A good filter climbs first and
            hugs the top-left corner. The area under the curve (AUC) sums it up in one number.
          </p>
        </SectionTitle>
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <Surface variant="card" radius="2xl" className="min-w-0 space-y-3 p-3 sm:p-4">
            <Segmented label="Filter" value={model} onChange={setModel} options={(["sharp", "page", "coin"] as ModelKey[]).map((k) => ({ value: k, label: MODELS[k].label }))} />
            <p className="text-sm text-muted-foreground">{MODELS[model].blurb}</p>
            <ScoreStrip items={modelItems} threshold={threshold} compact label={`${MODELS[model].label}: the same 20 emails, scored differently`} onPick={locked ? undefined : setT} />
            <ThresholdSlider id="em-threshold-3" value={threshold} onChange={setT} disabled={locked} />
            <dl className="grid grid-cols-3 gap-2">
              <Stat label="AUC" value={auc.toFixed(3)} tone={auc > 0.9 ? C.green : undefined} />
              <Stat label="Recall (up)" value={pct(modelM.recall)} />
              <Stat label="False positive rate" value={pct(modelM.fpr)} />
            </dl>
            <p className="text-xs leading-relaxed text-muted-foreground">
              The amber dot is your threshold. AUC is also the chance that a random spam email scores higher than a random normal one: here{" "}
              {Math.round(auc * 96)} of the 96 spam–normal pairs.
            </p>
            <ul className="list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-muted-foreground">
              <li>Bottom-left corner: threshold above every score, nothing flagged.</li>
              <li>Top-right corner: threshold at 0, everything flagged.</li>
              <li>A perfect filter goes straight up, then across: AUC 1. The diagonal is guessing: AUC 0.5.</li>
            </ul>
          </Surface>
          <Surface variant="card" radius="2xl" className="min-w-0 space-y-3 p-3 sm:p-4">
            <RocChart roc={roc} here={{ fpr: modelM.fpr ?? 0, tpr: modelM.recall ?? 0 }} />
          </Surface>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      <section aria-labelledby="em-trap-title" className="space-y-4">
        <SectionTitle id="em-trap-title" kicker="When accuracy lies" title="The accuracy trap: a rare condition">
          <p>
            1,000 people are screened for a condition that 10 of them have. Each square below is one person. Compare a “model” that simply says
            “healthy” to everyone with a real test, and look at which one has the better accuracy.
          </p>
        </SectionTitle>
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,20rem)]">
          <Surface variant="card" radius="2xl" className="min-w-0 space-y-3 p-4">
            <Segmented label="Model" value={rare} onChange={setRare} options={RARE.map((r) => ({ value: r.key, label: r.label }))} />
            <PeopleGrid counts={rareScenario.confusion} />
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm" style={{ background: OUTCOME_COLOR.tp }} /> sick, caught ({rareScenario.confusion.tp})</span>
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm" style={{ background: OUTCOME_COLOR.fn }} /> sick, missed ({rareScenario.confusion.fn})</span>
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm" style={{ background: OUTCOME_COLOR.fp }} /> healthy, flagged ({rareScenario.confusion.fp})</span>
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm opacity-40" style={{ background: OUTCOME_COLOR.tn }} /> healthy, cleared ({rareScenario.confusion.tn})</span>
            </div>
          </Surface>
          <Surface variant="card" radius="2xl" className="flex min-w-0 flex-col gap-3 p-4">
            <dl className="grid grid-cols-1 gap-2">
              <Stat label="Accuracy" value={pct(rareM.accuracy)} tone={rare === "lazy" ? C.green : undefined} />
              <Stat label="Recall: sick people found" value={pct(rareM.recall)} tone={rareM.recall === 0 ? C.redText : C.green} />
              <Stat label="Precision: flagged people who are sick" value={rareM.precision === null ? "– (no one flagged)" : pct(rareM.precision)} />
            </dl>
            <p className="text-sm leading-relaxed text-muted-foreground">{rareScenario.blurb}</p>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {rare === "lazy"
                ? "99% accuracy, and every sick person is sent home. When one class is rare, accuracy mostly measures how rare it is."
                : "Only 15% of flagged people are sick, because healthy people vastly outnumber sick ones. That's normal for screening: a flag means “test again”, not a diagnosis."}
            </p>
          </Surface>
        </div>
      </section>

      <MetricsMath />

      {/* ------------------------------------------------------------------ */}
      <section aria-labelledby="em-which-title" className="space-y-4">
        <SectionTitle id="em-which-title" kicker="In practice" title="Which metric should I use?">
          <p>Start from the question: which mistake costs more?</p>
        </SectionTitle>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {[
            ["Spam filter → precision", "A real email lost in the spam folder costs more than one spam email reaching the inbox. Keep false positives rare."],
            ["Cancer screening → recall", "Missing a sick person is far worse than a false alarm that a second test will clear. Keep false negatives rare."],
            ["Fraud, rare events → precision, recall and F1", "Accuracy is meaningless when positives are rare. Report precision and recall (or the precision–recall curve), and F1 when you need one number."],
            ["Comparing models → AUC", "AUC judges how well the scores rank positives above negatives, before any threshold is chosen. Pick the threshold afterwards."],
            ["Balanced classes, equal costs → accuracy", "When both classes are common and both mistakes cost the same, accuracy is a fair, easy-to-read summary."],
            ["Predicting numbers → MSE, MAE, R²", "Regression has no confusion matrix. See the Linear Regression page for mean squared error, mean absolute error and R²."],
          ].map(([title, body]) => (
            <Surface key={title} variant="card" radius="2xl" className="space-y-1.5 p-4">
              <h3 className="font-semibold text-foreground">{title}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {body}
                {title.startsWith("Predicting") && (
                  <>
                    {" "}
                    <a href="/visualize/linearRegression" className="text-primary underline-offset-2 hover:underline">
                      Open Linear Regression →
                    </a>
                  </>
                )}
              </p>
            </Surface>
          ))}
        </div>
      </section>

      <div id="em-guide" className="scroll-mt-20">
        <AlgorithmGuidePanel guide={evaluationMetricsGuide} activeStageId={step ? evaluationMetricsGuideStepFor(step) : null} />
      </div>
    </div>
  );
};

export default EvaluationMetricsVisualizer;
