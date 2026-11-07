// One Interview Patterns page: the pattern explained, then every NeetCode 150
// problem in that category, each animated step by step with its guide,
// brute-force comparison and Python solution. NeetCode is credited on every
// problem (their video) and at the bottom of the page.

import { ExternalLink, Shuffle, Youtube } from "lucide-react";
import * as React from "react";

import { useAlgorithmPlayer } from "../../hooks/useAlgorithmPlayer";
import type { AnyProblem } from "../../lib/patterns/types";
import { cn } from "../../lib/utils";
import { SectionTitle } from "../ml/mathBlocks";
import { Segmented, Stat } from "../ml/shared";
import { Button } from "../ui/button";
import { Surface } from "../ui/surface";
import AlgorithmGuidePanel from "../Visualizer/AlgorithmGuide";
import VisualizerControls from "../Visualizer/VisualizerControls";
import StepView from "./StepView";

const LEVEL: Record<AnyProblem["difficulty"], string> = {
  Easy: "text-viz-found",
  Medium: "text-viz-compare",
  Hard: "text-destructive-bright",
};

type Source = { kind: "example"; i: number } | { kind: "random"; seed: number };

const ProblemWorkspace: React.FC<{ problem: AnyProblem }> = ({ problem: p }) => {
  const [source, setSource] = React.useState<Source>({ kind: "example", i: 0 });
  const input = React.useMemo(() => (source.kind === "example" ? p.examples[source.i].input : p.random(source.seed)), [p, source]);
  const steps = React.useMemo(() => p.run(input), [p, input]);
  const brute = React.useMemo(() => p.brute?.(input) ?? null, [p, input]);
  const atScale = React.useMemo(() => {
    if (!p.big || !p.brute) return null;
    const big = p.big.input();
    return { label: p.big.label, pattern: p.run(big).at(-1)!.ops, brute: p.brute(big).ops };
  }, [p]);
  const player = useAlgorithmPlayer(steps, { initialDelayMs: 900 });
  const step = player.current;
  const shown = step ?? steps[0];
  const last = steps[steps.length - 1];
  const locked = player.status === "running";

  return (
    <div className="space-y-4">
      <Surface variant="card" radius="2xl" className="space-y-3 p-4 sm:p-5">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <h3 className="text-lg font-semibold text-foreground">{p.title}</h3>
          <span className={cn("text-sm font-medium", LEVEL[p.difficulty])}>{p.difficulty}</span>
          {p.blind75 && <span className="glass-pill px-2.5 py-0.5 text-xs text-muted-foreground">Blind 75</span>}
        </div>
        <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">{p.statement}</p>
        <div className="flex flex-wrap gap-2 text-sm">
          <a className="glass-pill glass-hover inline-flex items-center gap-1.5 px-3.5 py-1.5 text-foreground" href={`https://www.youtube.com/watch?v=${p.video}`} target="_blank" rel="noreferrer">
            <Youtube className="h-4 w-4 text-destructive-bright" /> NeetCode's video solution
          </a>
          <a className="glass-pill glass-hover inline-flex items-center gap-1.5 px-3.5 py-1.5 text-foreground" href={`https://leetcode.com/problems/${p.slug}/`} target="_blank" rel="noreferrer">
            <ExternalLink className="h-4 w-4" /> Try it on LeetCode
          </a>
        </div>
      </Surface>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_17rem]">
        <Surface variant="card" radius="2xl" className="min-w-0 space-y-4 p-4 sm:p-5">
          <div className="flex flex-wrap items-end gap-x-4 gap-y-3">
            <Segmented
              label="Input"
              value={source.kind === "example" ? source.i : -1}
              onChange={(i) => setSource({ kind: "example", i })}
              disabled={locked}
              options={p.examples.map((e, i) => ({ value: i, label: e.label }))}
            />
            <Button variant="outline" disabled={locked} onClick={() => setSource((s) => ({ kind: "random", seed: s.kind === "random" ? s.seed + 1 : 1 }))}>
              <Shuffle /> Random
            </Button>
          </div>
          <p className="break-words font-mono text-xs text-muted-foreground">{p.describe(input)}</p>
          <StepView step={shown} />
          <p className="min-h-[2.5rem] text-sm text-foreground" aria-live="polite">
            {step ? step.explanation : "Press Play or Step to watch the solution run."}
            {step?.done && step.answer && (
              <span className="ml-2 font-mono font-semibold text-viz-found">→ {step.answer}</span>
            )}
          </p>
          <VisualizerControls
            status={player.status}
            onPlay={player.play}
            onPause={player.pause}
            onReset={player.reset}
            onStepForward={player.stepForward}
            onStepBack={player.stepBack}
            delayMs={player.delayMs}
            onDelayChange={player.setDelayMs}
            minDelayMs={200}
            maxDelayMs={2500}
            stepMs={100}
            stepIndex={player.index}
            stepCount={player.stepCount}
          />
        </Surface>

        <Surface variant="card" radius="2xl" className="flex flex-col gap-3 p-4">
          <p className="text-sm font-semibold text-foreground">Brute force vs the pattern</p>
          <p className="text-xs text-muted-foreground">On this input:</p>
          <dl className="grid grid-cols-2 gap-2 lg:grid-cols-1">
            <Stat label={`Pattern: ${p.guide.complexity.time}`} value={`${last.ops} ops`} tone="hsl(var(--viz-found))" />
            {brute ? <Stat label="Brute force" value={`${brute.ops} ops`} tone="hsl(var(--destructive-bright))" /> : <Stat label="Brute force" value="n/a" />}
          </dl>
          {atScale && (
            <>
              <p className="text-xs text-muted-foreground">On a bigger input ({atScale.label}):</p>
              <dl className="grid grid-cols-2 gap-2 lg:grid-cols-1">
                <Stat label="Pattern" value={`${atScale.pattern.toLocaleString()} ops`} tone="hsl(var(--viz-found))" />
                <Stat label="Brute force" value={`${atScale.brute.toLocaleString()} ops`} tone="hsl(var(--destructive-bright))" />
              </dl>
            </>
          )}
          <p className="text-sm leading-relaxed text-muted-foreground">{p.bruteIdea}</p>
          <p className="text-xs leading-relaxed text-muted-foreground">
            “ops” counts basic steps: lookups, inserts, comparisons, array reads. On tiny inputs brute force can even win, because it may stumble on
            the answer early; as n grows, the gap opens up.
          </p>
        </Surface>
      </div>

      <AlgorithmGuidePanel guide={p.guide} activeStageId={step ? step.stage : null} />
    </div>
  );
};

export interface PatternPageProps {
  /** e.g. "Arrays & Hashing". */
  category: string;
  /** The pattern explained: shown above the problem list. */
  intro: React.ReactNode;
  problems: AnyProblem[];
}

const PatternPage: React.FC<PatternPageProps> = ({ category, intro, problems }) => {
  const [active, setActive] = React.useState(problems[0].id);
  const problem = problems.find((p) => p.id === active) ?? problems[0];
  const workspaceRef = React.useRef<HTMLDivElement>(null);

  return (
    <div className="space-y-10">
      {intro}

      <section aria-labelledby="pattern-problems-title" className="space-y-4">
        <SectionTitle id="pattern-problems-title" kicker={`NeetCode 150 · ${category}`} title={`All ${problems.length} problems`}>
          <p>Pick a problem to see it solved step by step. They're in NeetCode's order, roughly easiest first.</p>
        </SectionTitle>
        <div role="radiogroup" aria-label="Problem" className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {problems.map((p, i) => (
            <button
              key={p.id}
              type="button"
              role="radio"
              aria-checked={p.id === problem.id}
              onClick={() => {
                setActive(p.id);
                workspaceRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
              }}
              className={cn(
                "flex min-h-14 min-w-0 items-center gap-3 rounded-2xl border px-4 py-2.5 text-left transition-colors",
                p.id === problem.id ? "border-primary/70 bg-primary/15" : "glass glass-hover border-white/10",
              )}
            >
              <span className="font-mono text-xs text-muted-foreground">{i + 1}</span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium text-foreground">{p.title}</span>
                <span className={cn("text-xs", LEVEL[p.difficulty])}>{p.difficulty}</span>
                {p.blind75 && <span className="ml-2 text-xs text-muted-foreground">Blind 75</span>}
              </span>
            </button>
          ))}
        </div>
      </section>

      <div ref={workspaceRef} className="scroll-mt-20">
        {/* Keyed so switching problems resets the player and input. */}
        <ProblemWorkspace key={problem.id} problem={problem} />
      </div>

      <section aria-labelledby="pattern-credits-title" className="space-y-3">
        <SectionTitle id="pattern-credits-title" kicker="Credits" title="Learn more from NeetCode" />
        <Surface variant="card" radius="2xl" className="space-y-2 p-4 text-sm leading-relaxed text-muted-foreground">
          <p>
            The problem list and order come from the <span className="text-foreground">NeetCode 150</span> by NeetCode (
            <a className="text-primary underline-offset-2 hover:underline" href="https://neetcode.io/roadmap" target="_blank" rel="noreferrer">
              neetcode.io
            </a>
            ). The solutions here follow the approaches NeetCode teaches in the linked videos; the animations, explanations and code were written for
            CodeQuest. If these help, NeetCode's videos and site are well worth your time.
          </p>
          <p>Problem statements are summarised in our own words; the full versions are on LeetCode.</p>
        </Surface>
      </section>
    </div>
  );
};

export default PatternPage;
