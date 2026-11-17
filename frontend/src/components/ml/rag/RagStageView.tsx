import * as React from "react";
import { motion, useReducedMotion } from "framer-motion";

import {
  RAG_DOCUMENTS,
  type RagIndexedChunk,
  type RagRun,
  type RagStep,
} from "../../../lib/ml/rag";
import { cn } from "../../../lib/utils";
import { Surface } from "../../ui/surface";
import { C } from "../colors";
import { ChunkWindowDiagram, SimilarityRadarPlot, sourceColor, VectorFingerprint } from "./RagVisualBlocks";

const sentences = new Map(RAG_DOCUMENTS.flatMap((doc) => doc.sentences.map((sentence) => [sentence.id, sentence.text] as const)));

function VectorPreview({ vector, label, accent = C.teal }: { vector: number[]; label: string; accent?: string }) {
  return (
    <div className="space-y-3">
      <VectorFingerprint vector={vector} label={label} accent={accent} />
      <p className="text-xs text-muted-foreground">First 8 of {vector.length} components</p>
      <ol className="grid grid-cols-4 gap-1.5 sm:grid-cols-8" aria-label={label}>
        {vector.slice(0, 8).map((value, i) => (
          <li key={i} className="rounded-lg border border-primary/20 bg-primary/5 px-1 py-2 text-center">
            <span className="block text-[10px] text-muted-foreground">d{i}</span>
            <span className="font-mono text-xs tabular-nums text-foreground">{value.toFixed(3)}</span>
          </li>
        ))}
      </ol>
      <p className="text-xs text-muted-foreground">Each component is a learned coordinate. All {vector.length} numbers are used in search.</p>
    </div>
  );
}

function Documents() {
  return (
    <div className="space-y-3" data-rag-documents="">
      <p className="text-sm text-muted-foreground">Our entire knowledge source is this fictional Luma Shop handbook. Read the sentences now; the same source labels follow them through the pipeline.</p>
      {RAG_DOCUMENTS.map((doc, i) => (
        <details key={doc.id} open={i === 0} className="rounded-xl border border-white/10 border-l-2 p-3" style={{ borderLeftColor: sourceColor(doc.id) }}>
          <summary className="min-h-11 cursor-pointer py-2 font-medium text-foreground">
            {doc.title} <span className="text-xs font-normal text-muted-foreground">· {doc.sentences.length} sentences</span>
          </summary>
          <ol className="mt-2 space-y-2.5 text-sm">
            {doc.sentences.map((sentence, j) => (
              <li key={sentence.id} className="flex items-start gap-3 rounded-lg bg-white/[0.02] px-2.5 py-2">
                <span className="mt-0.5 rounded bg-white/10 px-1.5 py-0.5 font-mono text-[11px] text-muted-foreground">S{j + 1}</span>
                <span>{sentence.text}</span>
              </li>
            ))}
          </ol>
        </details>
      ))}
    </div>
  );
}

function Chunks({ chunks }: { chunks: RagIndexedChunk[] }) {
  return (
    <div className="space-y-4" data-rag-chunks="">
      <p className="text-sm text-muted-foreground">A chunk is a short passage we can retrieve on its own. Highlighted sentences repeat from the preceding chunk so a rule can keep its context.</p>
      <ChunkWindowDiagram chunks={chunks} />
      {RAG_DOCUMENTS.map((doc, docIndex) => {
        const documentChunks = chunks.filter((chunk) => chunk.documentId === doc.id);
        return (
          <details key={doc.id} open={docIndex === 0} className="rounded-xl border border-white/10 p-3">
            <summary className="min-h-11 cursor-pointer py-2 font-medium">{doc.title} · {documentChunks.length} chunks</summary>
            <div className="mt-3 space-y-3">
              {documentChunks.map((chunk, index) => (
                <div key={chunk.id} className="space-y-2 rounded-xl border border-white/10 border-l-2 p-3" style={{ borderLeftColor: sourceColor(doc.id) }}>
                  <p className="break-all font-mono text-[11px] text-muted-foreground">{chunk.id}</p>
                  <p className="text-sm leading-relaxed">
                    {chunk.sentenceIds.map((id) => {
                      const repeated = index > 0 && documentChunks[index - 1].sentenceIds.includes(id);
                      return (
                        <span key={id} className={cn(repeated && "rounded bg-primary/15 px-1 text-foreground")} title={repeated ? "Repeated from the preceding chunk" : undefined}>
                          {sentences.get(id)}
                          {repeated && <span className="ml-1 text-[10px] font-semibold text-primary">↺ repeated</span>}{" "}
                        </span>
                      );
                    })}
                  </p>
                </div>
              ))}
            </div>
          </details>
        );
      })}
    </div>
  );
}

function RankedPassages({ run, showSelection }: { run: RagRun; showSelection: boolean }) {
  const reduced = useReducedMotion();
  return (
    <div className="space-y-4" data-rag-ranking="">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="font-semibold">{showSelection ? "Rank, filter, and keep the top matches" : "Compare every passage"}</h3>
        <p className="text-xs text-muted-foreground">Cosine score · −1 to 1 · not a probability</p>
      </div>
      <SimilarityRadarPlot run={run} showSelection={showSelection} />
      <ol className="space-y-3">
        {run.ranked.map((row, i) => (
          <li key={row.chunk.id} className={cn("rounded-xl border p-3 transition-colors", showSelection && row.selected ? "border-primary/40 bg-primary/5" : "border-white/10")}>
            <div className="grid grid-cols-[minmax(0,1fr)_4rem] gap-3">
              <div className="min-w-0">
                <p className="text-xs font-medium">{i + 1}. {row.chunk.source}</p>
                <p className="break-all font-mono text-[10px] text-muted-foreground">{row.chunk.id}</p>
              </div>
              <p className="text-right font-mono text-sm tabular-nums">{row.score.toFixed(3)}</p>
            </div>
            <div className="relative mt-2 h-2 overflow-hidden rounded-full bg-white/5" aria-hidden="true">
              <span className="absolute inset-y-0 left-1/2 border-l border-white/30" />
              <motion.span
                className="absolute h-full rounded-full bg-primary/70"
                initial={reduced ? undefined : { width: "0%" }}
                animate={{
                  left: `${50 + Math.min(0, row.score) * 50}%`,
                  width: `${Math.abs(row.score) * 50}%`,
                }}
                transition={reduced ? { duration: 0 } : { duration: 0.35, delay: Math.min(i * 0.03, 0.25) }}
              />
            </div>
            {showSelection && (
              <p className={cn("mt-2 text-xs", row.selected ? "font-medium text-primary" : "text-muted-foreground")}>
                {row.reason === "selected" ? "Retrieved for the prompt" : row.reason === "below-cutoff" ? "Left out: below the minimum similarity" : "Left out: outside top-k"}
              </p>
            )}
            <details className="mt-1">
              <summary className="min-h-11 cursor-pointer py-3 text-xs text-muted-foreground">Read this passage</summary>
              <p className="text-sm leading-relaxed">{row.chunk.text}</p>
            </details>
          </li>
        ))}
      </ol>
    </div>
  );
}

function SelectedPassages({
  run,
  highlightEvidence = false,
  activeSourceId = null,
}: {
  run: RagRun;
  highlightEvidence?: boolean;
  activeSourceId?: string | null;
}) {
  const evidence = new Set(highlightEvidence ? run.answer.claims.flatMap((claim) => claim.evidenceIds) : []);
  return (
    <div className="space-y-3" data-rag-sources="">
      <h3 className="font-semibold">The retrieved evidence</h3>
      {run.selected.length === 0 ? (
        <p className="text-sm text-muted-foreground">No passage passed the cutoff. The prompt must say that no evidence was retrieved.</p>
      ) : (
        run.selected.map(({ chunk }, i) => {
          const isHighlighted = activeSourceId === chunk.id;
          return (
            <article
              key={chunk.id}
              id={`rag-source-${chunk.id}`}
              tabIndex={-1}
              className={cn(
                "scroll-mt-24 space-y-2 rounded-xl border border-l-2 p-4 transition-all focus:outline-none focus:ring-2 focus:ring-primary",
                isHighlighted ? "border-primary bg-primary/10 shadow-sm" : "border-white/10",
              )}
              style={{ borderLeftColor: sourceColor(chunk.documentId) }}
            >
              <h4 className="text-sm font-semibold">[{i + 1}] {chunk.source}</h4>
              <p className="break-all font-mono text-[10px] text-muted-foreground">{chunk.id}</p>
              <p className="text-sm leading-relaxed">
                {chunk.sentenceIds.map((id) => (
                  <span key={id}>
                    {evidence.has(id) ? <mark className="rounded bg-primary/15 px-1 text-foreground">{sentences.get(id)}</mark> : sentences.get(id)}{" "}
                  </span>
                ))}
              </p>
            </article>
          );
        })
      )}
      {highlightEvidence && run.answer.claims.length > 0 && (
        <p className="text-xs text-muted-foreground">Highlighted sentences support the displayed claims. The authored evidence check is a teaching simulation, not an automatic guarantee from cosine search.</p>
      )}
    </div>
  );
}

function Prompt({ run }: { run: RagRun }) {
  const reduced = useReducedMotion();
  return (
    <div className="space-y-4" data-rag-prompt="">
      <h3 className="font-semibold">What the answer model receives</h3>
      <p className="text-sm text-muted-foreground">Augmentation means adding the retrieved text to the question. The language model receives readable passages, not embedding numbers.</p>
      <div className="grid gap-2.5 sm:grid-cols-3">
        {[
          { step: "1. Instructions", detail: "Answer using only the passages; cite sources or say what is missing.", tone: C.violet },
          { step: `2. Context (${run.selected.length})`, detail: run.selected.length ? run.selected.map((s, i) => `[${i + 1}] ${s.chunk.source}`).join(" · ") : "No passages retrieved", tone: C.teal },
          { step: "3. Question", detail: run.query.text, tone: C.sky },
        ].map((block, idx) => (
          <motion.div
            key={block.step}
            className="rounded-xl border border-white/10 border-l-2 bg-black/20 p-3 text-xs"
            style={{ borderLeftColor: block.tone }}
            initial={reduced ? undefined : { opacity: 0, y: 6 }}
            animate={reduced ? undefined : { opacity: 1, y: 0 }}
            transition={reduced ? undefined : { duration: 0.25, delay: idx * 0.08 }}
          >
            <p className="font-semibold text-foreground">{block.step}</p>
            <p className="mt-1 line-clamp-3 leading-relaxed text-muted-foreground">{block.detail}</p>
          </motion.div>
        ))}
      </div>
      <Surface as="pre" variant="well" className="max-h-[32rem] overflow-y-auto whitespace-pre-wrap break-words p-4 font-mono text-xs leading-relaxed">
        {run.prompt}
      </Surface>
    </div>
  );
}

function Answer({ run, onHoverSource }: { run: RagRun; onHoverSource?: (id: string | null) => void }) {
  const reduced = useReducedMotion();
  return (
    <Surface variant="well" className="space-y-4 p-4 sm:p-5" data-rag-answer={run.answer.status}>
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="font-semibold">Simulated answer</h3>
        <span
          className={cn(
            "rounded-full border px-2.5 py-1 text-xs",
            run.answer.status === "supported"
              ? "border-primary/40 bg-primary/10 text-primary"
              : run.answer.status === "partial"
                ? "border-amber-400/40 bg-amber-400/10 text-amber-300"
                : "border-white/15 text-muted-foreground",
          )}
        >
          {run.answer.status === "supported" ? "Evidence found" : run.answer.status === "partial" ? "Partial evidence" : "Insufficient evidence"}
        </span>
      </div>
      <p className="text-xs leading-relaxed text-muted-foreground">Retrieval is real. Answer wording and evidence requirements are authored for these six questions; no language model is running.</p>
      {run.answer.claims.map((claim, idx) => (
        <motion.p
          key={claim.text}
          className="text-sm leading-relaxed"
          initial={reduced ? undefined : { opacity: 0, y: 4 }}
          animate={reduced ? undefined : { opacity: 1, y: 0 }}
          transition={reduced ? undefined : { duration: 0.25, delay: idx * 0.08 }}
        >
          {claim.text}{" "}
          {claim.citations.map((id) => {
            const sourceIndex = run.selected.findIndex((row) => row.chunk.id === id);
            return (
              <a
                key={id}
                href={`#rag-source-${id}`}
                onMouseEnter={() => onHoverSource?.(id)}
                onMouseLeave={() => onHoverSource?.(null)}
                onFocus={() => onHoverSource?.(id)}
                onBlur={() => onHoverSource?.(null)}
                aria-label={`Read source ${sourceIndex + 1}: ${run.selected[sourceIndex].chunk.source}`}
                className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-md text-primary underline underline-offset-4 hover:bg-primary/10"
              >
                [{sourceIndex + 1}]
              </a>
            );
          })}
        </motion.p>
      ))}
      <p className="text-sm text-muted-foreground">{run.answer.message}</p>
      <p className="text-xs text-muted-foreground">A real LLM can still make unsupported claims. Citations must be checked against the text, even when the response sounds confident.</p>
    </Surface>
  );
}

export function RagStageView({ phase, run }: { phase: RagStep["phase"]; run: RagRun }) {
  const [activeSourceId, setActiveSourceId] = React.useState<string | null>(null);
  const first = run.chunks[0];

  switch (phase) {
    case "docs":
      return <Documents />;
    case "chunk":
      return <Chunks chunks={run.chunks} />;
    case "embed":
      return (
        <div className="space-y-4" data-rag-embedding="">
          <h3 className="font-semibold">One passage becomes 384 numbers</h3>
          <p className="text-sm leading-relaxed text-muted-foreground">A trained MiniLM encoder produced these numbers earlier. Its weights stay fixed while encoding. This browser reads the recorded result; it does not train or run the model.</p>
          <div className="grid items-center gap-3 rounded-xl border border-white/10 bg-black/20 p-3.5 md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]">
            <blockquote className="border-l-2 border-primary pl-3 text-sm leading-relaxed">{first.text}</blockquote>
            <div className="flex items-center justify-center">
              <span className="rounded-lg border border-primary/40 bg-primary/10 px-3 py-1.5 font-mono text-xs font-semibold text-primary">
                MiniLM →
              </span>
            </div>
            <VectorFingerprint vector={first.embedding} label="384-D vector fingerprint" />
          </div>
          <VectorPreview vector={first.embedding} label="This passage’s embedding" />
          <p className="text-xs text-muted-foreground">
            The same process is applied to every chunk. <a href="#rag-deeper" className="text-primary underline underline-offset-4">Open the recorded token-by-token example below.</a>
          </p>
        </div>
      );
    case "index":
      return (
        <div className="space-y-4" data-rag-index="">
          <h3 className="font-semibold">Store numbers, text, and source together</h3>
          <p className="text-sm text-muted-foreground">This prepared index is reused for every new question. Updating documents or chunk boundaries requires updating the affected entries. A vector database can manage this at scale; this tiny lesson uses an in-memory list.</p>
          <div className="overflow-x-auto rounded-xl border border-white/10">
            <table className="w-full text-left text-xs">
              <caption className="sr-only">Prepared index of chunk text, sources, and vector previews</caption>
              <thead className="bg-white/5">
                <tr>
                  {["Source / chunk", "Original text", "Vector fingerprint & preview"].map((label) => (
                    <th key={label} scope="col" className="px-3 py-2 font-medium">{label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {run.chunks.map((chunk) => (
                  <tr key={chunk.id} className="border-t border-white/5 align-top">
                    <th scope="row" className="min-w-40 px-3 py-3 font-normal">
                      <span className="block font-medium">{chunk.source}</span>
                      <span className="break-all font-mono text-[10px] text-muted-foreground">{chunk.id}</span>
                    </th>
                    <td className="min-w-60 px-3 py-3 leading-relaxed">{chunk.text}</td>
                    <td className="min-w-44 space-y-1.5 px-3 py-3 font-mono text-muted-foreground">
                      <VectorFingerprint vector={chunk.embedding} compact accent={sourceColor(chunk.documentId)} />
                      <span>[{chunk.embedding.slice(0, 3).map((v) => v.toFixed(3)).join(", ")}, …]</span>
                      <span className="block font-sans text-[10px]">3 of 384 shown</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      );
    case "query":
      return (
        <div className="space-y-4" data-rag-query="">
          <h3 className="font-semibold">Turn the question into a compatible vector</h3>
          <blockquote className="border-l-2 border-primary pl-3 text-lg leading-relaxed">{run.query.text}</blockquote>
          <p className="text-sm text-muted-foreground">Query just means the search question. Here, the same configured embedding model represents the question and the passages in a shared space. It can match different wording without requiring the exact same words.</p>
          <VectorPreview vector={run.queryEmbedding} label="The question’s embedding" accent={C.sky} />
          <div className="rounded-xl border border-white/10 bg-black/20 p-3">
            <VectorFingerprint vector={first.embedding} label={`Compare with sample chunk (${first.source}) in the same 384-D space`} accent={C.teal} />
          </div>
          <p className="text-xs text-muted-foreground">The document index is already prepared. A real service only needs to encode the new question at this stage.</p>
        </div>
      );
    case "score":
      return <RankedPassages run={run} showSelection={false} />;
    case "retrieve":
      return (
        <div className="space-y-6">
          <SelectedPassages run={run} />
          <RankedPassages run={run} showSelection />
        </div>
      );
    case "prompt":
      return (
        <div className="space-y-6">
          <Prompt run={run} />
          <SelectedPassages run={run} />
        </div>
      );
    case "answer":
      return (
        <div className="space-y-6">
          <Answer run={run} onHoverSource={setActiveSourceId} />
          <SelectedPassages run={run} highlightEvidence activeSourceId={activeSourceId} />
          <details className="rounded-xl border border-white/10 p-3">
            <summary className="min-h-11 cursor-pointer py-2 font-medium">Inspect every similarity score and selection decision</summary>
            <div className="mt-3"><RankedPassages run={run} showSelection /></div>
          </details>
          <details className="rounded-xl border border-white/10 p-3">
            <summary className="min-h-11 cursor-pointer py-2 font-medium">Inspect the exact assembled prompt</summary>
            <div className="mt-3"><Prompt run={run} /></div>
          </details>
        </div>
      );
  }
}
