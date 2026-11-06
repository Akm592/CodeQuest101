// "How it works", under a visualizer's controls.
//
// Left: the algorithm's stages as a numbered list, with the stage the
// animation is currently in highlighted, so every frame is tied to a named part
// of the algorithm and the one-line narration above reads as its detail.
// Right: the concept, the pitfalls, and a runnable Python solution.
//
// Content lives in lib/guides as data; guides.test.ts proves every step of
// every page demo maps onto one of these stages.

import { Check, Copy } from "lucide-react";
import * as React from "react";

import type { AlgorithmGuide, VizTone } from "../../lib/guides/types";
import { cn } from "../../lib/utils";
import { Surface } from "../ui/surface";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";

// Literal class names, so Tailwind's scanner can see every one of them.
const SWATCH: Record<VizTone, string> = {
  current: "bg-viz-current",
  compare: "bg-viz-compare",
  swap: "bg-viz-swap",
  visited: "bg-viz-visited",
  found: "bg-viz-found",
  pointer: "bg-viz-pointer",
  idle: "bg-viz-idle",
};

interface AlgorithmGuideProps {
  guide: AlgorithmGuide;
  /** The stage the animation is in, or null before it starts. */
  activeStageId: string | null;
  className?: string;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = React.useState(false);

  React.useEffect(() => {
    if (!copied) return;
    const t = window.setTimeout(() => setCopied(false), 2000);
    return () => window.clearTimeout(t);
  }, [copied]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
    } catch {
      // Clipboard access can be refused (insecure origin, permissions). The
      // code is still on screen and selectable, so fail quietly.
    }
  };

  return (
    <button
      type="button"
      onClick={copy}
      className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 text-xs font-medium text-muted-foreground transition-colors hover:bg-white/10 hover:text-foreground"
    >
      {copied ? <Check className="h-3.5 w-3.5 text-viz-found" /> : <Copy className="h-3.5 w-3.5" />}
      {copied ? "Copied" : "Copy code"}
    </button>
  );
}

const SectionHeading: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <h3 className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">{children}</h3>
);

export const AlgorithmGuidePanel: React.FC<AlgorithmGuideProps> = ({ guide, activeStageId, className }) => {
  const headingId = React.useId();
  const activeIndex = guide.stages.findIndex((s) => s.id === activeStageId);

  return (
    <Surface
      as="section"
      variant="card"
      radius="2xl"
      className={cn("p-4 sm:p-6", className)}
      aria-labelledby={headingId}
      data-algorithm-guide=""
    >
      <h2 id={headingId} className="text-lg font-bold text-foreground sm:text-xl">
        How it works: <span className="text-primary">{guide.title}</span>
      </h2>

      {/* grid-cols-1 and min-w-0, not the defaults: an implicit grid track and
          a grid item both size to their min-content, so one long pseudocode
          line would widen the whole page on a phone instead of scrolling in
          its own box. */}
      <div className="mt-5 grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Step by step, following the animation. */}
        <section className="min-w-0">
          <SectionHeading>
            Step by step
            {activeIndex >= 0 && (
              <span className="ml-2 normal-case tracking-normal text-primary">
                · now on step {activeIndex + 1} of {guide.stages.length}
              </span>
            )}
          </SectionHeading>

          <ul className="mb-4 flex flex-wrap gap-x-4 gap-y-1.5" aria-label="Colour key">
            {guide.legend.map((entry) => (
              <li key={entry.tone + entry.label} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className={cn("h-3 w-3 shrink-0 rounded-sm", SWATCH[entry.tone])} aria-hidden="true" />
                {entry.label}
              </li>
            ))}
          </ul>

          {activeIndex < 0 && (
            <p className="mb-3 text-xs text-muted-foreground">
              Press Start or Step: the step the animation is on lights up below.
            </p>
          )}

          <ol className="space-y-2">
            {guide.stages.map((stage, i) => {
              const active = i === activeIndex;
              return (
                <li
                  key={stage.id}
                  aria-current={active ? "step" : undefined}
                  className={cn(
                    "rounded-xl border p-3 transition-colors duration-200",
                    active ? "border-primary/50 bg-primary/10" : "border-white/5 bg-white/[0.02]",
                  )}
                >
                  <div className="flex items-start gap-3">
                    <span
                      className={cn(
                        "mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full font-mono text-xs font-bold",
                        active ? "bg-primary text-primary-foreground" : "bg-white/10 text-muted-foreground",
                      )}
                    >
                      {i + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className={cn("text-sm font-semibold", active ? "text-foreground" : "text-foreground/90")}>
                        {stage.title}
                      </p>
                      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{stage.detail}</p>
                      {stage.pseudo && (
                        <code className="mt-2 block overflow-x-auto whitespace-pre rounded-md bg-black/40 px-2 py-1 font-mono text-[11px] text-secondary-bright">
                          {stage.pseudo}
                        </code>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        </section>

        {/* The concept, the traps, and the code. */}
        <section className="min-w-0">
          <Tabs defaultValue="concept">
            <TabsList className="mb-4 grid h-auto w-full grid-cols-3 bg-white/5">
              <TabsTrigger value="concept" className="py-2 text-xs sm:text-sm">Concept</TabsTrigger>
              <TabsTrigger value="pitfalls" className="py-2 text-xs sm:text-sm">Pitfalls & tips</TabsTrigger>
              <TabsTrigger value="python" className="py-2 text-xs sm:text-sm">Python</TabsTrigger>
            </TabsList>

            <TabsContent value="concept" className="space-y-5">
              <div className="space-y-3 text-sm leading-relaxed text-muted-foreground">
                {guide.idea.map((paragraph, i) => (
                  <p key={i}>{paragraph}</p>
                ))}
              </div>

              <div>
                <SectionHeading>{guide.whenToUseHeading ?? "Spot it in an interview"}</SectionHeading>
                <ul className="list-disc space-y-1.5 pl-5 text-sm text-muted-foreground marker:text-primary">
                  {guide.whenToUse.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                <div className="mb-2 flex flex-wrap gap-2">
                  <span className="rounded-full bg-white/5 px-3 py-1 font-mono text-xs text-primary">
                    time {guide.complexity.time}
                  </span>
                  <span className="rounded-full bg-white/5 px-3 py-1 font-mono text-xs text-secondary-bright">
                    space {guide.complexity.space}
                  </span>
                </div>
                <p className="text-sm leading-relaxed text-muted-foreground">{guide.complexity.why}</p>
              </div>
            </TabsContent>

            <TabsContent value="pitfalls" className="space-y-5">
              <div>
                <SectionHeading>Common mistakes</SectionHeading>
                <ul className="list-disc space-y-2 pl-5 text-sm leading-relaxed text-muted-foreground marker:text-viz-swap">
                  {guide.pitfalls.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </div>
              <div>
                <SectionHeading>Try this on this page</SectionHeading>
                <ul className="list-disc space-y-2 pl-5 text-sm leading-relaxed text-muted-foreground marker:text-viz-found">
                  {guide.tryThis.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </div>
            </TabsContent>

            <TabsContent value="python">
              <div className="mb-2 flex items-center justify-between gap-2">
                <p className="text-xs text-muted-foreground">A complete solution you can run as-is.</p>
                <CopyButton text={guide.python} />
              </div>
              <pre className="max-h-[32rem] overflow-auto rounded-xl border border-white/10 bg-black/40 p-4 font-mono text-xs leading-relaxed text-foreground/90">
                <code>{guide.python}</code>
              </pre>
            </TabsContent>
          </Tabs>
        </section>
      </div>
    </Surface>
  );
};

export default AlgorithmGuidePanel;
