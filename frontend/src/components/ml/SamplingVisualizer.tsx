import { Dices } from "lucide-react";
import * as React from "react";

import { useAlgorithmPlayer } from "../../hooks/useAlgorithmPlayer";
import { samplingGuide, samplingGuideStepFor } from "../../lib/guides/mlGuides";
import { SAMPLING_DEFAULT } from "../../lib/ml/demos";
import { buildSamplingSteps, distribution, PROMPTS, sampleMany, type SamplingStep } from "../../lib/ml/sampling";
import { cn } from "../../lib/utils";
import { Button } from "../ui/button";
import { Slider } from "../ui/slider";
import { Surface } from "../ui/surface";
import AlgorithmGuidePanel from "../Visualizer/AlgorithmGuide";
import VisualizerControls from "../Visualizer/VisualizerControls";
import { samplingFigures } from "./figures/languageFigures";
import { ConceptFigures, Segmented } from "./shared";

const ORDER: SamplingStep["phase"][] = ["logits", "temperature", "softmax", "topk", "topp", "renormalise", "sample"];
const pct = (p: number) => `${(p * 100).toFixed(p > 0 && p < 0.1 ? 1 : 0)}%`;

const SliderRow: React.FC<{
  id: string;
  label: string;
  value: number;
  shown: string;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  hint: string;
}> = ({ id, label, value, shown, min, max, step, onChange, hint }) => (
  <div className="min-w-[12rem] flex-1 space-y-2">
    <div className="flex items-baseline justify-between gap-2">
      <label htmlFor={id} className="text-sm font-medium text-muted-foreground">
        {label}
      </label>
      <span className="font-mono text-sm text-foreground">{shown}</span>
    </div>
    <Slider id={id} value={[value]} min={min} max={max} step={step} onValueChange={([v]) => onChange(v)} aria-label={label} />
    <p className="text-xs text-muted-foreground">{hint}</p>
  </div>
);

const SamplingVisualizer: React.FC = () => {
  const [promptIndex, setPromptIndex] = React.useState(0);
  const [temperature, setTemperature] = React.useState(SAMPLING_DEFAULT.temperature);
  const [topK, setTopK] = React.useState(SAMPLING_DEFAULT.topK);
  const [topP, setTopP] = React.useState(SAMPLING_DEFAULT.topP);
  // Draws use their own counter, so sampling never restarts the walkthrough.
  const drawSeed = React.useRef(1);
  const [draws, setDraws] = React.useState<number[]>([]);

  const prompt = PROMPTS[promptIndex];
  const settings = React.useMemo(() => ({ temperature, topK, topP }), [temperature, topK, topP]);
  const steps = React.useMemo(() => buildSamplingSteps(prompt, settings, 1), [prompt, settings]);
  const player = useAlgorithmPlayer(steps, { initialDelayMs: 1200 });
  const step = player.current;
  const at = step ? ORDER.indexOf(step.phase) : -1;
  const reached = (p: SamplingStep["phase"]) => at >= ORDER.indexOf(p);

  // Before the walkthrough starts, show the finished result so the sliders
  // give instant feedback; during it, show what each stage has produced.
  const dist = React.useMemo(() => distribution(prompt.candidates.map((c) => c.logit), settings), [prompt, settings]);
  const showing = step ? step.phase : "renormalise";
  const isAt = (p: SamplingStep["phase"]) => (step ? reached(p) : true);

  React.useEffect(() => setDraws([]), [prompt, settings]);

  const bars = prompt.candidates.map((c, i) => {
    const kept = (!isAt("topk") || dist.keptByK[i]) && (!isAt("topp") || dist.keptByP[i]);
    let value: number;
    let text: string;
    if (showing === "logits") {
      value = c.logit;
      text = c.logit.toFixed(1);
    } else if (showing === "temperature") {
      value = dist.scaled[i];
      text = dist.scaled[i].toFixed(1);
    } else if (showing === "softmax" || showing === "topk" || showing === "topp") {
      value = dist.probs[i];
      text = pct(dist.probs[i]);
    } else {
      value = dist.final[i];
      text = pct(dist.final[i]);
    }
    return { token: c.token, value, text, kept };
  });
  const maxBar = Math.max(...bars.map((b) => Math.abs(b.value)), 1e-9);
  const picked = step?.phase === "sample" ? step.picked : undefined;
  const counts = prompt.candidates.map((_, i) => draws.filter((d) => d === i).length);

  return (
    <div className="space-y-6">
      <ConceptFigures figures={samplingFigures} />

      <Surface variant="card" radius="2xl" className="space-y-5 p-4 sm:p-6">
        <Segmented
          label="Prompt"
          value={promptIndex}
          onChange={(i) => setPromptIndex(i)}
          disabled={player.status === "running"}
          options={PROMPTS.map((p, i) => ({ value: i, label: p.text.split(" ").slice(0, 3).join(" ") + "…" }))}
        />
        <p className="text-xl leading-relaxed text-foreground sm:text-2xl">
          {prompt.text}{" "}
          <span className={cn("inline-block min-w-[5ch] rounded-lg border px-2 text-center", picked !== undefined ? "border-viz-found bg-viz-found/15 text-foreground" : "border-dashed border-white/25 text-muted-foreground")}>
            {picked !== undefined ? prompt.candidates[picked].token : "?"}
          </span>
        </p>

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_16rem]">
          <div className="min-w-0">
            <p className="mb-2 text-xs text-muted-foreground">
              {showing === "logits" ? "Raw scores (logits)" : showing === "temperature" ? `Scores ÷ temperature ${temperature}` : showing === "renormalise" || showing === "sample" ? "Final probabilities" : "Probabilities after softmax"}
            </p>
            <ul className="space-y-1.5">
              {bars.map((b, i) => (
                <li key={b.token} className="grid grid-cols-[6.5rem_minmax(0,1fr)_3.5rem] items-center gap-2 text-sm">
                  <span className={cn("truncate font-medium", b.kept ? "text-foreground" : "text-muted-foreground line-through")}>{b.token}</span>
                  <div className="h-5 overflow-hidden rounded-md bg-white/[0.05]">
                    <div
                      className={cn("h-full rounded-md transition-all duration-300", picked === i ? "bg-viz-found" : b.kept ? "bg-viz-current/80" : "bg-viz-idle/40")}
                      style={{ width: `${Math.max(0, (b.value / maxBar) * 100)}%` }}
                    />
                  </div>
                  <span className="text-right font-mono text-xs tabular-nums text-muted-foreground">{b.text}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  drawSeed.current += 1;
                  setDraws((d) => [...d, ...sampleMany(dist.final, 1, drawSeed.current * 7919)]);
                }}
              >
                <Dices /> Sample once
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  drawSeed.current += 1;
                  setDraws(sampleMany(dist.final, 20, drawSeed.current * 104729));
                }}
              >
                Sample 20×
              </Button>
            </div>
            <div>
              <p className="mb-1.5 text-xs text-muted-foreground">{draws.length ? `What came out in ${draws.length} draws` : "Draws will appear here"}</p>
              <ul className="space-y-1">
                {prompt.candidates.map((c, i) =>
                  counts[i] ? (
                    <li key={c.token} className="flex items-center gap-2 text-xs">
                      <span className="w-20 truncate">{c.token}</span>
                      <span className="h-2.5 rounded-full bg-viz-found" style={{ width: `${(counts[i] / draws.length) * 8}rem` }} />
                      <span className="font-mono text-muted-foreground">{counts[i]}</span>
                    </li>
                  ) : null,
                )}
              </ul>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-x-6 gap-y-4 border-t border-white/10 pt-4">
          <SliderRow
            id="temp"
            label="Temperature"
            value={temperature}
            shown={temperature.toFixed(2)}
            min={0.1}
            max={2}
            step={0.05}
            onChange={setTemperature}
            hint="Low: focused. High: adventurous."
          />
          <SliderRow
            id="topk"
            label="Top-k"
            value={topK}
            shown={topK === 0 ? "off" : String(topK)}
            min={0}
            max={prompt.candidates.length}
            step={1}
            onChange={setTopK}
            hint="Keep only the k likeliest. 0 = off."
          />
          <SliderRow
            id="topp"
            label="Top-p"
            value={topP}
            shown={topP >= 1 ? "off" : topP.toFixed(2)}
            min={0.3}
            max={1}
            step={0.05}
            onChange={setTopP}
            hint="Keep words until they cover p. 1 = off."
          />
        </div>
      </Surface>

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
          {step ? step.explanation : "Move the sliders and watch the bars change, or press Step to walk through how one word gets picked."}
        </p>
      </Surface>

      <AlgorithmGuidePanel guide={samplingGuide} activeStageId={step ? samplingGuideStepFor(step) : null} />
    </div>
  );
};

export default SamplingVisualizer;
