import * as React from "react";

import { useAlgorithmPlayer } from "../../hooks/useAlgorithmPlayer";
import { attentionGuide, attentionGuideStepFor } from "../../lib/guides/mlGuides";
import { attentionMatrix, buildAttentionSteps, D, FEATURES, SENTENCES, tokenize, WQ, type AttentionStep } from "../../lib/ml/attention";
import { cn } from "../../lib/utils";
import { Surface } from "../ui/surface";
import AlgorithmGuidePanel from "../Visualizer/AlgorithmGuide";
import VisualizerControls from "../Visualizer/VisualizerControls";
import { attentionFigures } from "./figures/languageFigures";
import { C } from "./colors";
import { ConceptFigures, Segmented } from "./shared";

const ORDER: AttentionStep["phase"][] = ["embed", "query", "keys", "scores", "scale", "softmax", "blend"];
const f2 = (v: number) => (Math.abs(v) < 0.005 ? "0" : v.toFixed(2));

/** A small row of feature cells; brighter means larger. */
const Vec: React.FC<{ values: number[]; tone: string; label?: string }> = ({ values, tone, label }) => (
  <span className="inline-flex gap-0.5" aria-label={label}>
    {values.map((v, i) => (
      <span
        key={i}
        title={`${FEATURES[i]}: ${f2(v)}`}
        className="grid h-6 w-8 place-items-center rounded font-mono text-[10px] text-foreground"
        style={{ background: `color-mix(in srgb, ${tone} ${Math.min(85, Math.abs(v) * 30 + (v ? 12 : 0))}%, transparent)`, border: "1px solid hsl(var(--border))" }}
      >
        {f2(v)}
      </span>
    ))}
  </span>
);

const AttentionVisualizer: React.FC = () => {
  const [sentenceIndex, setSentenceIndex] = React.useState(0);
  const tokens = React.useMemo(() => tokenize(SENTENCES[sentenceIndex]), [sentenceIndex]);
  const [focus, setFocus] = React.useState(() => tokens.findIndex((t) => t.word === "it"));
  const steps = React.useMemo(() => buildAttentionSteps(tokens, focus), [tokens, focus]);
  const matrix = React.useMemo(() => attentionMatrix(tokens), [tokens]);
  const player = useAlgorithmPlayer(steps, { initialDelayMs: 1400 });
  const step = player.current;
  const at = step ? ORDER.indexOf(step.phase) : -1;
  const reached = (p: AttentionStep["phase"]) => at >= ORDER.indexOf(p);
  const row = steps[0].row;
  const locked = player.status === "running";

  const chooseSentence = (i: number) => {
    const t = tokenize(SENTENCES[i]);
    setSentenceIndex(i);
    setFocus(Math.max(0, t.findIndex((x) => x.word === "it")));
  };

  // Chip geometry for the arcs.
  const chipW = 100 / tokens.length;

  return (
    <div className="space-y-6">
      <ConceptFigures figures={attentionFigures} />

      <Surface variant="card" radius="2xl" className="space-y-4 p-4 sm:p-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <Segmented
            label="Sentence"
            value={sentenceIndex}
            onChange={chooseSentence}
            disabled={locked}
            options={SENTENCES.map((s, i) => ({ value: i, label: s.split(" ").slice(0, 3).join(" ") + "…" }))}
          />
          <p className="max-w-sm text-xs leading-relaxed text-muted-foreground">
            Toy model: five named features and a hand-set query matrix, so you can follow the arithmetic. The computation is the real one.
          </p>
        </div>

        {/* Arcs + words. The arcs appear once softmax has produced weights. */}
        <div className="overflow-x-auto">
          <div className="min-w-[36rem]">
            <svg viewBox="0 0 100 26" preserveAspectRatio="none" className="block h-24 w-full" aria-hidden="true">
              {reached("softmax") &&
                row.weights.map((w, j) => {
                  if (j === focus) return null;
                  const x1 = (focus + 0.5) * chipW;
                  const x2 = (j + 0.5) * chipW;
                  const h = Math.min(24, Math.abs(x1 - x2) * 0.45 + 4);
                  return (
                    <path
                      key={j}
                      d={`M${x1},26 Q${(x1 + x2) / 2},${26 - h * 2} ${x2},26`}
                      fill="none"
                      stroke={C.green}
                      strokeOpacity={0.25 + w * 0.75}
                      vectorEffect="non-scaling-stroke"
                      style={{ strokeWidth: 1 + w * 10 }}
                    />
                  );
                })}
            </svg>
            <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${tokens.length}, minmax(0, 1fr))` }}>
              {tokens.map((t, j) => (
                <button
                  key={j}
                  type="button"
                  disabled={locked}
                  onClick={() => setFocus(j)}
                  aria-pressed={j === focus}
                  className={cn(
                    "min-h-11 rounded-xl border px-1 text-sm font-medium transition-colors disabled:cursor-not-allowed",
                    j === focus ? "border-primary/70 bg-primary/20 text-foreground" : "glass-pill glass-hover !rounded-xl text-foreground",
                  )}
                >
                  {t.word}
                  {reached("softmax") && (
                    <span className="block font-mono text-[10px] text-viz-found">{(row.weights[j] * 100).toFixed(0)}%</span>
                  )}
                </button>
              ))}
            </div>
            <p className="mt-2 text-xs text-muted-foreground">Click any word to see where it looks.</p>
          </div>
        </div>
      </Surface>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_19rem]">
        {/* The arithmetic, revealed stage by stage. */}
        <Surface variant="card" radius="2xl" className="min-w-0 p-4 sm:p-5">
          <div className="mb-3 flex flex-wrap items-center gap-3 text-sm">
            <span className="text-muted-foreground">Query of “{tokens[focus].word}”</span>
            {reached("query") ? <Vec values={tokens[focus].query} tone={C.violet} label="query vector" /> : <span className="text-xs text-muted-foreground">appears at step 2</span>}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[34rem] border-separate border-spacing-y-1 text-sm">
              <thead>
                <tr className="text-left text-[11px] text-muted-foreground">
                  <th className="pr-2 font-medium">Word</th>
                  <th className="pr-2 font-medium">{reached("keys") ? "Key" : "Embedding"} ({FEATURES.join(", ")})</th>
                  <th className="pr-2 text-right font-medium">Score</th>
                  <th className="pr-2 text-right font-medium">÷ √{D}</th>
                  <th className="font-medium">Attention</th>
                </tr>
              </thead>
              <tbody>
                {tokens.map((t, j) => (
                  <tr key={j} className={cn(j === focus && "text-primary")}>
                    <td className="pr-2 font-medium">{t.word}</td>
                    <td className="pr-2">
                      {at >= 0 ? <Vec values={t.key} tone={reached("keys") ? C.sky : C.idle} /> : <span className="text-xs text-muted-foreground">–</span>}
                    </td>
                    <td className="pr-2 text-right font-mono tabular-nums">{reached("scores") ? f2(row.scores[j]) : "·"}</td>
                    <td className="pr-2 text-right font-mono tabular-nums">{reached("scale") ? f2(row.scaled[j]) : "·"}</td>
                    <td className="w-40">
                      {reached("softmax") ? (
                        <div className="flex items-center gap-2">
                          <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-white/[0.06]">
                            <div className="h-full rounded-full bg-viz-found" style={{ width: `${row.weights[j] * 100}%` }} />
                          </div>
                          <span className="w-9 text-right font-mono text-xs tabular-nums">{(row.weights[j] * 100).toFixed(0)}%</span>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">·</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
            <span className="text-muted-foreground">New “{tokens[focus].word}” (blended values)</span>
            {reached("blend") ? <Vec values={row.output} tone={C.green} label="output vector" /> : <span className="text-xs text-muted-foreground">appears at the last step</span>}
          </div>
        </Surface>

        <Surface variant="card" radius="2xl" className="flex flex-col gap-4 p-4">
          <div>
            <p className="mb-2 text-xs text-muted-foreground">Every word at once: row = who is looking, column = who they look at</p>
            <div className="overflow-x-auto">
              <table className="border-separate border-spacing-0.5 font-mono text-[9px]">
                <tbody>
                  {matrix.map((r, i) => (
                    <tr key={i}>
                      <th className={cn("pr-1 text-right font-normal", i === focus ? "text-primary" : "text-muted-foreground")}>{tokens[i].word}</th>
                      {r.map((w, j) => (
                        <td
                          key={j}
                          title={`${tokens[i].word} → ${tokens[j].word}: ${(w * 100).toFixed(0)}%`}
                          className={cn("h-5 w-5 rounded-sm", i === focus && "ring-1 ring-primary/60")}
                          style={{ background: `color-mix(in srgb, ${C.green} ${Math.min(100, Math.round(w * 160))}%, hsl(var(--muted)))` }}
                        />
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div>
            <p className="mb-1.5 text-xs text-muted-foreground">Query matrix Wq (hand-set): row = feature the word has, column = feature it looks for</p>
            <table className="font-mono text-[10px]">
              <tbody>
                {WQ.map((r, i) => (
                  <tr key={i}>
                    <th className="pr-2 text-left font-normal text-muted-foreground">{FEATURES[i]}</th>
                    {r.map((v, j) => (
                      <td key={j} className={cn("w-7 text-right tabular-nums", v > 0 ? "text-foreground" : v < 0 ? "text-destructive-bright" : "text-muted-foreground/60")}>
                        {v}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
          minDelayMs={300}
          maxDelayMs={3000}
          stepMs={100}
          stepIndex={player.index}
          stepCount={player.stepCount}
        />
        <p className="min-h-[2.5rem] text-sm text-foreground" aria-live="polite">
          {step ? step.explanation : `Press Step to compute attention for “${tokens[focus].word}” one stage at a time.`}
        </p>
      </Surface>

      <AlgorithmGuidePanel guide={attentionGuide} activeStageId={step ? attentionGuideStepFor(step) : null} />
    </div>
  );
};

export default AttentionVisualizer;
