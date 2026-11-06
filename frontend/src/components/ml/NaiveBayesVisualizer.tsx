// Naive Bayes: a tiny spam filter you can step through word by word, the
// counts behind it, why smoothing matters, the overconfidence caveat, and a
// Gaussian version for numbers.

import * as React from "react";

import { useAlgorithmPlayer } from "../../hooks/useAlgorithmPlayer";
import { naiveBayesGuide, naiveBayesGuideStepFor } from "../../lib/guides/mlGuides";
import {
  appleChance,
  buildNbSteps,
  classifyNb,
  CLASS_LABEL,
  FRUIT_WEIGHTS,
  fitGaussian,
  gaussianBoundary,
  gaussianPdf,
  normalise,
  TEST_EMAILS,
  tokenize,
  trainNb,
  TRAINING_EMAILS,
  wordProb,
} from "../../lib/ml/naiveBayes";
import { cn } from "../../lib/utils";
import { Input } from "../ui/input";
import { Slider } from "../ui/slider";
import { Surface } from "../ui/surface";
import AlgorithmGuidePanel from "../Visualizer/AlgorithmGuide";
import VisualizerControls from "../Visualizer/VisualizerControls";
import { C } from "./colors";
import { bayesFigures } from "./figures/bayesFigures";
import { SectionTitle } from "./mathBlocks";
import NbMath from "./nb/NbMath";
import { ConceptFigures, Plot, Segmented } from "./shared";

const pct = (v: number) => `${(v * 100).toFixed(1)}%`;
const f3 = (v: number) => (v === 0 ? "0" : v.toFixed(3));

const ChanceBars: React.FC<{ spam: number | null }> = ({ spam }) => (
  <div className="space-y-2">
    {(["spam", "ham"] as const).map((c) => {
      const v = spam === null ? null : c === "spam" ? spam : 1 - spam;
      return (
        <div key={c} className="grid grid-cols-[5.5rem_minmax(0,1fr)_3.5rem] items-center gap-2 text-sm">
          <span className={c === "spam" ? "text-destructive-bright" : "text-viz-current"}>{CLASS_LABEL[c]}</span>
          <div className="h-3 overflow-hidden rounded-full bg-white/[0.06]">
            <div className={cn("h-full rounded-full transition-all duration-300", c === "spam" ? "bg-viz-swap" : "bg-viz-current")} style={{ width: `${(v ?? 0) * 100}%` }} />
          </div>
          <span className="text-right font-mono text-xs tabular-nums text-foreground">{v === null ? "–" : pct(v)}</span>
        </div>
      );
    })}
  </div>
);

const NaiveBayesVisualizer: React.FC = () => {
  const [pick, setPick] = React.useState(0);
  const [custom, setCustom] = React.useState("");
  const [alpha, setAlpha] = React.useState<1 | 0>(1);
  const [repeat, setRepeat] = React.useState(3);
  const [weight, setWeight] = React.useState(180);

  const model = React.useMemo(() => trainNb(TRAINING_EMAILS, alpha), [alpha]);
  const text = custom.trim() ? custom : TEST_EMAILS[pick].text;
  const steps = React.useMemo(() => buildNbSteps(model, text), [model, text]);
  const player = useAlgorithmPlayer(steps, { initialDelayMs: 1100 });
  const step = player.current;
  const words = tokenize(text);
  const shownStep = step ?? steps[0];
  const soFar = normalise(shownStep.logs);
  const finalP = steps.at(-1)!.posterior;
  const usedUpTo = step?.wordIndex ?? (step && (step.phase === "normalise" || step.phase === "decide") ? words.length - 1 : -1);

  // Vocabulary sorted from most spammy to least, for the counts table.
  const vocabRows = React.useMemo(
    () =>
      model.vocab
        .map((w) => ({ w, s: model.counts.spam[w] ?? 0, h: model.counts.ham[w] ?? 0, ps: wordProb(model, "spam", w), ph: wordProb(model, "ham", w) }))
        .sort((a, b) => b.ps / (b.ph || 1e-9) - a.ps / (a.ph || 1e-9)),
    [model],
  );

  const smoothModel = React.useMemo(() => trainNb(TRAINING_EMAILS, 1), []);
  const repeatCurve = Array.from({ length: 10 }, (_, i) => classifyNb(smoothModel, Array(i + 1).fill("free").join(" "))!.spam);

  const apple = fitGaussian(FRUIT_WEIGHTS.apple);
  const orange = fitGaussian(FRUIT_WEIGHTS.orange);
  const boundary = gaussianBoundary();

  return (
    <div className="space-y-10">
      <div className="space-y-6">
        <ConceptFigures figures={bayesFigures} />
        <nav aria-label="On this page" className="flex flex-wrap items-center gap-2 text-sm">
          <span className="text-muted-foreground">Jump to:</span>
          {[
            ["#nb-filter-title", "Spam filter"],
            ["#nb-math-title", "The maths"],
            ["#nb-trust-title", "Don't trust the %"],
            ["#nb-gauss-title", "Numbers (Gaussian)"],
            ["#nb-kinds-title", "Kinds & pros/cons"],
            ["#nb-guide", "Summary"],
          ].map(([href, label]) => (
            <a key={href} href={href} className="glass-pill glass-hover px-3.5 py-1.5 text-foreground">
              {label}
            </a>
          ))}
        </nav>
      </div>

      <section aria-labelledby="nb-filter-title" className="space-y-4">
        <SectionTitle id="nb-filter-title" kicker="Watch it think" title="A tiny spam filter">
          <p>
            The filter has learned from the 12 emails below (made up for this page, so you can count every word yourself). Pick an email or
            type your own, then step through it: it starts from how common spam is, and each word pushes the guess towards spam or towards
            normal email.
          </p>
        </SectionTitle>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <Surface variant="card" radius="2xl" className="min-w-0 space-y-4 p-4 sm:p-5">
            <div className="flex flex-wrap items-end gap-x-6 gap-y-3">
              <Segmented
                label="Email to check"
                value={custom.trim() ? -1 : pick}
                onChange={(i) => {
                  setPick(i);
                  setCustom("");
                }}
                disabled={player.status === "running"}
                options={TEST_EMAILS.map((t, i) => ({ value: i, label: t.text }))}
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="nb-custom" className="text-sm font-medium text-muted-foreground">
                Or type your own
              </label>
              <Input id="nb-custom" value={custom} onChange={(e) => setCustom(e.target.value)} placeholder="e.g. claim your free prize" disabled={player.status === "running"} />
              {!custom.trim() && <p className="text-xs text-muted-foreground">{TEST_EMAILS[pick].note}</p>}
            </div>

            <div className="flex flex-wrap gap-2" aria-label="Words in the email">
              {words.length === 0 && <span className="text-sm text-muted-foreground">Type some words.</span>}
              {words.map((w, i) => {
                const known = model.vocab.includes(w);
                const ps = known ? wordProb(model, "spam", w) : 0;
                const ph = known ? wordProb(model, "ham", w) : 0;
                const lean = !known ? "none" : ps === 0 ? "ham-only" : ph === 0 ? "spam-only" : ps >= ph ? "spam" : "ham";
                const active = step?.wordIndex === i;
                const used = i <= usedUpTo;
                return (
                  <div
                    key={i}
                    className={cn(
                      "min-w-[5.5rem] rounded-xl border px-3 py-2 text-center transition-all",
                      active ? "border-foreground bg-white/[0.08]" : "border-white/10 bg-black/20",
                      !used && step && "opacity-45",
                    )}
                  >
                    <div className="font-medium text-foreground">{w}</div>
                    <div
                      className={cn(
                        "mt-0.5 font-mono text-[11px]",
                        lean === "spam" || lean === "spam-only" ? "text-destructive-bright" : lean === "none" ? "text-muted-foreground" : "text-viz-current",
                      )}
                    >
                      {lean === "none"
                        ? "never seen"
                        : lean === "ham-only"
                          ? "0 in spam"
                          : lean === "spam-only"
                            ? "0 in normal"
                            : lean === "spam"
                              ? `${(ps / ph).toFixed(1)}× spam`
                              : `${(ph / ps).toFixed(1)}× normal`}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="space-y-2 rounded-xl border border-white/[0.06] bg-black/20 p-3">
              <p className="text-xs text-muted-foreground">{step ? "Chance so far" : "Final answer (press Step to see how it gets there)"}</p>
              <ChanceBars spam={(step ? soFar : finalP)?.spam ?? null} />
            </div>

            <div className="flex flex-wrap items-end gap-x-6 gap-y-3">
              <Segmented
                label="Smoothing"
                value={alpha}
                onChange={(v) => setAlpha(v)}
                disabled={player.status === "running"}
                options={[
                  { value: 1, label: "On (α = 1)" },
                  { value: 0, label: "Off (α = 0)" },
                ]}
              />
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
              minDelayMs={300}
              maxDelayMs={3000}
              stepMs={100}
              stepIndex={player.index}
              stepCount={player.stepCount}
            />
            <p className="min-h-[3rem] text-sm text-foreground" aria-live="polite">
              {step ? step.explanation : "Press Step to start from the prior and add one word at a time."}
            </p>
          </Surface>

          <Surface variant="card" radius="2xl" className="flex min-w-0 flex-col gap-3 p-4">
            <p className="text-xs text-muted-foreground">What the filter learned from</p>
            {(["spam", "ham"] as const).map((c) => (
              <div key={c}>
                <p className={cn("mb-1 text-xs font-semibold", c === "spam" ? "text-destructive-bright" : "text-viz-current")}>{c === "spam" ? "Spam (6)" : "Not spam (6)"}</p>
                <ul className="space-y-1">
                  {TRAINING_EMAILS.filter((e) => e.label === c).map((e) => (
                    <li key={e.text} className="rounded-lg border border-white/[0.06] bg-black/20 px-2.5 py-1 font-mono text-xs text-foreground/90">
                      {e.text}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </Surface>
        </div>

        <Surface variant="card" radius="2xl" className="space-y-3 p-4 sm:p-5">
          <h3 className="font-semibold text-foreground">Every word it knows, counted</h3>
          <p className="text-sm text-muted-foreground">
            Spam has {model.totals.spam} words in total and normal email {model.totals.ham}; there are {model.vocab.length} different words.
            Each chance is (count + α) ÷ (class total + α × {model.vocab.length}), with α = {alpha}. Sorted from most spammy to least.
          </p>
          <div className="max-h-80 overflow-auto rounded-xl border border-white/[0.06] bg-black/20">
            <table className="w-full min-w-[30rem] text-right font-mono text-xs tabular-nums">
              <thead className="sticky top-0 bg-card text-[11px] text-muted-foreground">
                <tr>
                  <th className="px-3 py-1.5 text-left font-medium">word</th>
                  <th className="px-3 py-1.5 font-medium">in spam</th>
                  <th className="px-3 py-1.5 font-medium">in normal</th>
                  <th className="px-3 py-1.5 font-medium">P(word | spam)</th>
                  <th className="px-3 py-1.5 font-medium">P(word | normal)</th>
                </tr>
              </thead>
              <tbody>
                {vocabRows.map((r) => (
                  <tr key={r.w} className={cn(words.includes(r.w) && "bg-white/[0.06] text-foreground")}>
                    <td className="px-3 py-1 text-left">{r.w}</td>
                    <td className="px-3 py-1">{r.s}</td>
                    <td className="px-3 py-1">{r.h}</td>
                    <td className={cn("px-3 py-1", r.ps === 0 && "text-destructive-bright")}>{f3(r.ps)}</td>
                    <td className={cn("px-3 py-1", r.ph === 0 && "text-destructive-bright")}>{f3(r.ph)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-muted-foreground">Words in the email you're checking are highlighted. With smoothing off, zeros appear in red.</p>
        </Surface>
      </section>

      <NbMath />

      <section aria-labelledby="nb-trust-title" className="space-y-4">
        <SectionTitle id="nb-trust-title" kicker="An honest caveat" title="Good at deciding, bad at percentages">
          <p>
            scikit-learn's documentation puts it plainly: Naive Bayes is “a decent classifier” but “a bad estimator” of probabilities. Because
            it treats every word as fresh evidence, repeating a word, or using several words that mean the same thing, piles up certainty that
            isn't really there. Repeat “free” and watch.
          </p>
        </SectionTitle>
        <Surface variant="card" radius="2xl" className="grid gap-5 p-4 sm:p-5 md:grid-cols-[18rem_minmax(0,1fr)]">
          <div className="space-y-3">
            <div className="flex items-baseline justify-between">
              <label htmlFor="nb-repeat" className="text-sm font-medium text-muted-foreground">
                “free” repeated
              </label>
              <span className="font-mono text-sm text-foreground">{repeat}×</span>
            </div>
            <Slider id="nb-repeat" value={[repeat]} min={1} max={10} step={1} onValueChange={([v]) => setRepeat(v)} aria-label="Times the word free is repeated" />
            <p className="break-words font-mono text-xs text-muted-foreground">“{Array(repeat).fill("free").join(" ")}”</p>
            <p className="text-2xl font-semibold text-destructive-bright">{(repeatCurve[repeat - 1] * 100).toFixed(repeatCurve[repeat - 1] > 0.999 ? 3 : 1)}% spam</p>
          </div>
          <div className="space-y-1">
            {repeatCurve.map((v, i) => (
              <div key={i} className="grid grid-cols-[2.5rem_minmax(0,1fr)_4.5rem] items-center gap-2 text-xs">
                <span className={cn("text-muted-foreground", i + 1 === repeat && "text-foreground")}>{i + 1}×</span>
                <div className="h-2.5 overflow-hidden rounded-full bg-white/[0.06]">
                  <div className={cn("h-full rounded-full", i + 1 === repeat ? "bg-viz-swap" : "bg-viz-swap/50")} style={{ width: `${v * 100}%` }} />
                </div>
                <span className="text-right font-mono tabular-nums text-foreground">{(v * 100).toFixed(v > 0.999 ? 3 : 1)}%</span>
              </div>
            ))}
          </div>
        </Surface>
        <p className="text-sm text-muted-foreground">
          The decision (spam or not) is often still right. Just don't read 99.99% as “almost certainly”: if you need trustworthy probabilities,
          calibrate them or use a different model.
        </p>
      </section>

      <section aria-labelledby="nb-gauss-title" className="space-y-4">
        <SectionTitle id="nb-gauss-title" kicker="When the features are numbers" title="Gaussian Naive Bayes">
          <p>
            Words can be counted, but measurements like weight can't. Gaussian Naive Bayes fits a bell curve (a normal distribution) to each
            class, using the average and the spread of the training values, and asks which curve is higher at the new value. Here: is a fruit
            an apple or an orange, from its weight alone?
          </p>
        </SectionTitle>
        <Surface variant="card" radius="2xl" className="grid gap-5 p-4 sm:p-5 lg:grid-cols-[minmax(0,1fr)_18rem]">
          <Plot xDomain={[110, 250]} yDomain={[0, 0.04]} width={520} height={260} ticks={[120, 140, 160, 180, 200, 220, 240]} yTicks={[]} label="Bell curves of apple and orange weights">
            {(s) => {
              const curve = (g: typeof apple) =>
                Array.from({ length: 141 }, (_, i) => {
                  const x = 110 + i;
                  return `${i ? "L" : "M"}${s.x(x).toFixed(1)},${s.y(gaussianPdf(g, x)).toFixed(1)}`;
                }).join(" ");
              return (
                <>
                  <path d={curve(apple)} fill="none" stroke={C.red} strokeWidth={2.5} />
                  <path d={curve(orange)} fill="none" stroke={C.amber} strokeWidth={2.5} />
                  {FRUIT_WEIGHTS.apple.map((w) => <circle key={`a${w}`} cx={s.x(w)} cy={s.y(0.0015)} r={4} fill={C.red} />)}
                  {FRUIT_WEIGHTS.orange.map((w) => <circle key={`o${w}`} cx={s.x(w)} cy={s.y(0.0035)} r={4} fill={C.amber} />)}
                  <line x1={s.x(boundary)} x2={s.x(boundary)} y1={s.y(0)} y2={s.y(0.04)} stroke={C.fg} strokeDasharray="4 4" opacity={0.6} />
                  <text x={s.x(boundary) + 4} y={s.y(0.038)} fontSize={10} fill={C.fg}>
                    50/50 at {boundary.toFixed(1)} g
                  </text>
                  <line x1={s.x(weight)} x2={s.x(weight)} y1={s.y(0)} y2={s.y(0.04)} stroke={C.teal} strokeWidth={2} />
                  <circle cx={s.x(weight)} cy={s.y(gaussianPdf(apple, weight))} r={5} fill={C.red} />
                  <circle cx={s.x(weight)} cy={s.y(gaussianPdf(orange, weight))} r={5} fill={C.amber} />
                  <text x={s.x(118)} y={s.y(0.036)} fontSize={11} fill={C.red}>
                    apple
                  </text>
                  <text x={s.x(232)} y={s.y(0.036)} fontSize={11} fill={C.amber}>
                    orange
                  </text>
                </>
              );
            }}
          </Plot>
          <div className="space-y-3 text-sm">
            <div className="flex items-baseline justify-between">
              <label htmlFor="nb-weight" className="font-medium text-muted-foreground">
                Fruit weight
              </label>
              <span className="font-mono text-foreground">{weight} g</span>
            </div>
            <Slider id="nb-weight" value={[weight]} min={120} max={240} step={1} onValueChange={([v]) => setWeight(v)} aria-label="Fruit weight in grams" />
            <dl className="space-y-1 font-mono text-xs">
              <div className="flex justify-between"><dt className="text-muted-foreground">apples: mean, spread</dt><dd>{apple.mean.toFixed(1)} g, ±{Math.sqrt(apple.variance).toFixed(1)}</dd></div>
              <div className="flex justify-between"><dt className="text-muted-foreground">oranges: mean, spread</dt><dd>{orange.mean.toFixed(1)} g, ±{Math.sqrt(orange.variance).toFixed(1)}</dd></div>
            </dl>
            <p className="text-lg font-semibold">
              <span className="text-destructive-bright">{pct(appleChance(weight))} apple</span>
              <span className="text-muted-foreground"> · </span>
              <span className="text-viz-compare">{pct(1 - appleChance(weight))} orange</span>
            </p>
            <p className="text-xs leading-relaxed text-muted-foreground">
              Both classes have the same number of examples, so the prior is 50/50 and only the curves' heights decide. The spread is the
              standard deviation, from the variance averaged over n (as scikit-learn's GaussianNB does).
            </p>
          </div>
        </Surface>
      </section>

      <section aria-labelledby="nb-kinds-title" className="space-y-4">
        <SectionTitle id="nb-kinds-title" kicker="In practice" title="Kinds of Naive Bayes, pros and cons" />
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {[
            ["Multinomial", "Word counts. The classic for text; this page's spam filter."],
            ["Bernoulli", "Word present or not (yes/no features). Suits short texts; it also counts the absence of a word as evidence."],
            ["Gaussian", "Numbers like weight or height: one bell curve per class per feature, as above."],
            ["Complement", "A variant of Multinomial for imbalanced classes. scikit-learn notes it often beats Multinomial on text classification."],
          ].map(([t, b]) => (
            <Surface key={t} variant="card" radius="2xl" className="space-y-1.5 p-4">
              <h3 className="font-semibold text-foreground">{t}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{b}</p>
            </Surface>
          ))}
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <Surface variant="card" radius="2xl" className="space-y-2 p-4">
            <h3 className="font-semibold text-viz-found">Good at</h3>
            <ul className="list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-muted-foreground marker:text-viz-found">
              <li>Very fast to train (it's just counting) and to use.</li>
              <li>Works with little training data.</li>
              <li>Text classification: spam, topics, sentiment.</li>
              <li>Easy to explain: you can show which words pushed the decision.</li>
            </ul>
          </Surface>
          <Surface variant="card" radius="2xl" className="space-y-2 p-4">
            <h3 className="font-semibold text-destructive-bright">Watch out for</h3>
            <ul className="list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-muted-foreground marker:text-destructive-bright">
              <li>The independence assumption is almost never true, so related words get counted twice.</li>
              <li>Its probabilities are overconfident: trust the decision more than the percentage.</li>
              <li>Without smoothing, one unseen word can wipe out a class.</li>
              <li>It can't learn that a combination of words matters more than each word alone.</li>
            </ul>
          </Surface>
        </div>
      </section>

      <div id="nb-guide" className="scroll-mt-20">
        <AlgorithmGuidePanel guide={naiveBayesGuide} activeStageId={step ? naiveBayesGuideStepFor(step) : null} />
      </div>
    </div>
  );
};

export default NaiveBayesVisualizer;
