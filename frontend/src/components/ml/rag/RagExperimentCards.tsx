import * as React from "react";
import { ArrowDown, ArrowRight, Database, FileText, Sparkles } from "lucide-react";

import { RAG_DEFAULT, RAG_QUERIES, retrieveRag, type RagSettings } from "../../../lib/ml/rag";
import { Button } from "../../ui/button";
import { Surface } from "../../ui/surface";
import { C } from "../colors";

export type RagExperimentId = "boundary" | "two-documents" | "related";

interface ExperimentSpec {
  id: RagExperimentId;
  title: string;
  description: string;
  buttonLabel: string;
  changes: Partial<RagSettings>;
  targetPhase: "retrieve" | "answer";
}

const RAG_EXPERIMENTS: ExperimentSpec[] = [
  {
    id: "boundary",
    title: "Keep a rule together",
    description:
      "With 3-sentence chunks and top-k 1, a shipping rule is split. Start with overlap 0, then change overlap to 1: the top passage now carries both parts.",
    buttonLabel: "Load the boundary example",
    changes: { chunkSize: 3, overlap: 0, topK: 1 },
    targetPhase: "retrieve",
  },
  {
    id: "two-documents",
    title: "Find both pieces",
    description:
      "The return deadline and refund timing live in different documents. Defaults retrieve only part of the answer. Try chunk size 3 and top-k 3 to recover both.",
    buttonLabel: "Load the two-document question",
    changes: {},
    targetPhase: "answer",
  },
  {
    id: "related",
    title: "Similar is not sufficient",
    description:
      "The handbook discusses delivery and refunds, but never promises a refund for late express delivery. Related passages can score well and still leave the question unanswered.",
    buttonLabel: "Load the misleading match",
    changes: {},
    targetPhase: "answer",
  },
];

function ExperimentFlow({ spec }: { spec: ExperimentSpec }) {
  const { before, after } = React.useMemo(() => {
    const query = RAG_QUERIES.find((item) => item.id === spec.id)!;
    const settings = { ...RAG_DEFAULT, ...spec.changes };
    const improved = spec.id === "boundary" ? { ...settings, overlap: 1 as const }
      : spec.id === "two-documents" ? { ...settings, chunkSize: 3 as const, topK: 3 } : settings;
    return { before: retrieveRag(query, settings), after: retrieveRag(query, improved) };
  }, [spec]);
  const status = (value: typeof before) => value.answer.status === "supported" ? "Supported"
    : value.answer.status === "partial" ? "Partial evidence" : "Missing evidence";
  return <div className="space-y-3" aria-label={`${spec.title}: ${status(before)}${spec.id === "related" ? "" : ` becomes ${status(after)}`}`}>
    <div className="grid grid-cols-[1fr_auto_1fr_auto_1fr] items-center gap-1" aria-hidden="true">
      {[{ label: "Sources", Icon: FileText }, { label: "Retrieval", Icon: Database }, { label: "Answer", Icon: Sparkles }].map(({ label, Icon }, i) => <React.Fragment key={label}>
        {i > 0 && <ArrowRight className="h-3 w-3 text-primary/70" />}
        <div className="flex min-w-0 flex-col items-center gap-2 rounded-lg border border-white/15 bg-[#101827] px-1 py-3"><Icon className="h-4 w-4 text-primary" /><span className="text-[10px] text-muted-foreground">{label}</span></div>
      </React.Fragment>)}
    </div>
    <div className="flex items-center justify-between gap-2 text-xs"><span className="text-muted-foreground">{spec.id === "boundary" ? "Overlap 0" : spec.id === "two-documents" ? "Default retrieval" : `Best cosine ${before.ranked[0].score.toFixed(3)}`}</span><span style={{ color: C.amber }}>{status(before)}</span></div>
    {spec.id !== "related" ? <div className="flex items-center justify-between gap-2 border-t border-white/10 pt-2 text-xs"><span className="inline-flex items-center gap-1.5 text-muted-foreground"><ArrowDown className="h-3 w-3" />{spec.id === "boundary" ? "Overlap 1" : "Chunk 3 · top-k 3"}</span><span className="text-primary">{status(after)}</span></div>
      : <p className="border-t border-white/10 pt-2 text-[11px] leading-relaxed text-muted-foreground">A matching topic still cannot supply a policy the handbook never states.</p>}
  </div>;
}

export function RagExperimentCards({
  activeExperiment,
  onLoadExperiment,
}: {
  activeExperiment: RagExperimentId | null;
  onLoadExperiment: (spec: ExperimentSpec) => void;
}) {
  return (
    <div className="grid gap-4 md:grid-cols-3" data-rag-experiments="">
      {RAG_EXPERIMENTS.map((spec) => {
        const isActive = activeExperiment === spec.id;
        return (
          <Surface
            key={spec.id}
            variant="card"
            radius="2xl"
            className={`flex flex-col gap-3 p-4 transition-colors ${isActive ? "border-primary/50 bg-primary/[0.04]" : ""}`}
          >
            <div className="overflow-hidden rounded-xl border border-white/[0.06] bg-black/25 p-2">
              <ExperimentFlow spec={spec} />
            </div>
            <h3 className="font-semibold">{spec.title}</h3>
            <p className="flex-1 text-sm leading-relaxed text-muted-foreground">{spec.description}</p>
            <Button asChild className="h-auto min-h-11 whitespace-normal py-3 text-center" variant={isActive ? "default" : "outline"}>
              <a href="#rag-playground" onClick={() => onLoadExperiment(spec)}>
                {spec.buttonLabel}
              </a>
            </Button>
          </Surface>
        );
      })}
    </div>
  );
}
