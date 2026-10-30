// The animated part of a Playground card: a looping mini-animation, and the
// algorithm's outline as a numbered list with the stage the animation is in
// highlighted. Together they are the step-by-step guide at a glance; the full
// sentence-per-step narration stays on the visualizer page.

import * as React from "react";

import { usePreviewLoop } from "../../../hooks/usePreviewLoop";
import {
  buildDpPreview,
  buildQueensPreview,
  buildTopoPreview,
  buildTriePreview,
  MINI_TRIE_GAPS,
  type PreviewKey,
  type PreviewStage,
} from "../../../lib/algorithms/previewStages";
import { layoutTrie } from "../../../lib/algorithms/trieLayout";
import { cn } from "../../../lib/utils";
import { Surface } from "../../ui/surface";
import { MiniDpTable } from "./MiniDpTable";
import { MiniQueens } from "./MiniQueens";
import { MiniTopoSort } from "./MiniTopoSort";
import { MiniTrie } from "./MiniTrie";

interface PreviewFrameProps {
  frameRef: React.Ref<HTMLDivElement>;
  stages: readonly PreviewStage[];
  stageId: string;
  children: React.ReactNode;
}

function PreviewFrame({ frameRef, stages, stageId, children }: PreviewFrameProps) {
  const current = Math.max(0, stages.findIndex((s) => s.id === stageId));
  return (
    <div ref={frameRef} className="space-y-3">
      <Surface variant="well" radius="xl" className="flex h-36 items-center justify-center p-2">
        {children}
      </Surface>

      <div>
        <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          How it works · step {current + 1} of {stages.length}
        </p>
        <ol className="space-y-0.5">
          {stages.map((stage, i) => (
            <li
              key={stage.id}
              aria-current={i === current ? "step" : undefined}
              className={cn(
                "flex items-start gap-2 rounded-md px-2 py-1 text-xs leading-snug transition-colors duration-300",
                i === current ? "bg-primary/10 text-foreground" : "text-muted-foreground",
              )}
            >
              <span
                className={cn(
                  "mt-px grid h-4 w-4 shrink-0 place-items-center rounded-full font-mono text-[10px] font-bold",
                  i === current ? "bg-primary text-primary-foreground" : "bg-white/10 text-muted-foreground",
                )}
              >
                {i + 1}
              </span>
              <span>{stage.label}</span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

// One component per preview: the step types differ, so each pairs its own
// demo with its own renderer. Demos are built once per mount from the real
// generators — a few dozen steps, so there is nothing worth caching further.

function DpPreview() {
  const demo = React.useMemo(buildDpPreview, []);
  const loop = usePreviewLoop<HTMLDivElement>(demo.steps.length);
  const step = demo.steps[loop.index];
  return (
    <PreviewFrame frameRef={loop.ref} stages={demo.stages} stageId={demo.stageFor(step)}>
      <MiniDpTable step={step} labels={demo.labels} />
    </PreviewFrame>
  );
}

function TopoPreview() {
  const demo = React.useMemo(buildTopoPreview, []);
  const loop = usePreviewLoop<HTMLDivElement>(demo.steps.length);
  const step = demo.steps[loop.index];
  return (
    <PreviewFrame frameRef={loop.ref} stages={demo.stages} stageId={demo.stageFor(step)}>
      <MiniTopoSort step={step} />
    </PreviewFrame>
  );
}

function QueensPreview() {
  const demo = React.useMemo(buildQueensPreview, []);
  const loop = usePreviewLoop<HTMLDivElement>(demo.steps.length);
  const step = demo.steps[loop.index];
  return (
    <PreviewFrame frameRef={loop.ref} stages={demo.stages} stageId={demo.stageFor(step)}>
      <MiniQueens step={step} />
    </PreviewFrame>
  );
}

function TriePreview() {
  const demo = React.useMemo(buildTriePreview, []);
  // Laid out from the finished trie, so every frame shares one set of positions.
  const layout = React.useMemo(
    () => layoutTrie(demo.steps[demo.steps.length - 1].nodes, MINI_TRIE_GAPS),
    [demo],
  );
  const loop = usePreviewLoop<HTMLDivElement>(demo.steps.length);
  const step = demo.steps[loop.index];
  return (
    <PreviewFrame frameRef={loop.ref} stages={demo.stages} stageId={demo.stageFor(step)}>
      <MiniTrie step={step} layout={layout} />
    </PreviewFrame>
  );
}

const PREVIEWS: Record<PreviewKey, React.FC> = {
  dynamicProgramming: DpPreview,
  topologicalSort: TopoPreview,
  nQueens: QueensPreview,
  trie: TriePreview,
};

export function AlgorithmPreview({ previewKey }: { previewKey: PreviewKey }) {
  const Preview = PREVIEWS[previewKey];
  return <Preview />;
}
