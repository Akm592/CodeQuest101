import * as React from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

import { useAlgorithmPlayer } from "../../hooks/useAlgorithmPlayer";
import { ragGuide, ragGuideStepFor } from "../../lib/guides/ragGuide";
import { buildRagSteps, getRagIndex, RAG_DEFAULT, RAG_QUERIES, type RagSettings, type RagStep } from "../../lib/ml/rag";
import { Button } from "../ui/button";
import { Slider } from "../ui/slider";
import { Surface } from "../ui/surface";
import AlgorithmGuidePanel from "../Visualizer/AlgorithmGuide";
import VisualizerControls from "../Visualizer/VisualizerControls";
import { ragFigures } from "./figures/ragFigures";
import { SectionTitle } from "./mathBlocks";
import RagDetails from "./rag/RagDetails";
import RagArchitecture from "./rag/RagArchitecture";
import { RagExperimentCards, type RagExperimentId } from "./rag/RagExperimentCards";
import { RagStageView } from "./rag/RagStageView";
import { ConceptFigures } from "./shared";

const SELECT_CLASS = "min-h-11 w-full min-w-0 rounded-xl border border-white/15 bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary";

export default function RagVisualizer() {
  const reduced = useReducedMotion();
  const [queryId, setQueryId] = React.useState(RAG_QUERIES[0].id);
  const [settings, setSettings] = React.useState<RagSettings>(RAG_DEFAULT);
  const [activeExperiment, setActiveExperiment] = React.useState<RagExperimentId | null>(null);
  const pendingPhaseRef = React.useRef<RagStep["phase"] | null>(null);

  const query = RAG_QUERIES.find((item) => item.id === queryId)!;
  const index = React.useMemo(() => getRagIndex({ chunkSize: settings.chunkSize, overlap: settings.overlap }), [settings.chunkSize, settings.overlap]);
  const steps = React.useMemo(() => buildRagSteps(query, settings), [query, settings]);
  const player = useAlgorithmPlayer(steps, { initialDelayMs: 1500 });
  const phase = player.current?.phase ?? "docs";
  const stageIndex = steps.findIndex((step) => step.phase === phase);
  const run = steps[0].run;

  React.useEffect(() => {
    if (!pendingPhaseRef.current) return;
    const target = pendingPhaseRef.current;
    pendingPhaseRef.current = null;
    const idx = steps.findIndex((s) => s.phase === target);
    if (idx >= 0) player.seek(idx);
  }, [steps, player]);

  const loadExample = (id: RagExperimentId, changes: Partial<RagSettings>, targetPhase: RagStep["phase"]) => {
    setActiveExperiment(id);
    pendingPhaseRef.current = targetPhase;
    setQueryId(id);
    setSettings({ ...RAG_DEFAULT, ...changes });
  };

  return (
    <div className="space-y-8 sm:space-y-10">
      <Surface variant="card" radius="2xl" className="space-y-4 p-5 sm:p-7">
        <p className="text-xs font-semibold uppercase tracking-widest text-primary">Find first. Answer with evidence.</p>
        <h2 className="max-w-3xl text-2xl font-bold leading-tight text-foreground sm:text-3xl">Give the AI an open-book exam.</h2>
        <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground sm:text-base">A language model may not know your shop’s rules. RAG finds useful passages from your documents, adds them to the question, and asks a language model to answer using that evidence.</p>
        <p className="text-sm leading-relaxed text-muted-foreground"><strong className="text-foreground">R</strong>etrieval finds passages. <strong className="text-foreground">A</strong>ugmentation adds them to the prompt. <strong className="text-foreground">G</strong>eneration writes the answer.</p>
        <div className="flex flex-wrap gap-2 text-xs"><span className="rounded-full border border-primary/25 bg-primary/5 px-3 py-1.5 text-foreground">Real embedding-based search</span><span className="rounded-full border border-white/10 px-3 py-1.5 text-muted-foreground">Simulated answer generation</span><span className="rounded-full border border-white/10 px-3 py-1.5 text-muted-foreground">No keys or model downloads</span></div>
        <a href="/visualize/advancedRag" className="inline-flex min-h-11 items-center text-sm font-medium text-primary underline underline-offset-4">Continue to Advanced RAG: eight focused chapters →</a>
        <nav aria-label="On this page" className="flex flex-wrap gap-x-5 gap-y-1 text-sm"><a className="inline-flex min-h-11 items-center text-primary underline underline-offset-4" href="#rag-playground">Follow a question</a><a className="inline-flex min-h-11 items-center text-primary underline underline-offset-4" href="#rag-experiments">Try an experiment</a><a className="inline-flex min-h-11 items-center text-primary underline underline-offset-4" href="#rag-deeper">Embeddings, maths & decisions</a><a className="inline-flex min-h-11 items-center text-primary underline underline-offset-4" href="#rag-guide">Guide & Python</a></nav>
      </Surface>

      <ConceptFigures figures={ragFigures} />

      <section id="rag-playground" aria-labelledby="rag-playground-title" className="scroll-mt-24 space-y-5">
        <SectionTitle id="rag-playground-title" kicker="One example, all the way through" title="Follow a question through the pipeline">
          <p>We will use a small fictional shop handbook. Start with the documents and move one step at a time, or choose <strong className="text-foreground">See full result</strong> to experiment directly.</p>
        </SectionTitle>

        <Surface variant="card" radius="2xl" className="space-y-5 p-4 sm:p-6">
          <div className="space-y-2"><label htmlFor="rag-question" className="text-sm font-medium">Choose a question</label><select id="rag-question" className={SELECT_CLASS} value={queryId} onChange={(event) => { setActiveExperiment(null); setQueryId(event.target.value); }}>{RAG_QUERIES.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select><p className="text-xs text-muted-foreground">Six curated questions have real bundled embeddings. Arbitrary questions would need a running embedding model.</p></div>
          <blockquote className="border-l-2 border-primary pl-4 text-lg leading-relaxed sm:text-xl">{query.text}</blockquote>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2"><label htmlFor="rag-size" className="text-sm font-medium">Chunk size</label><select id="rag-size" className={SELECT_CLASS} value={settings.chunkSize} onChange={(event) => setSettings((old) => ({ ...old, chunkSize: Number(event.target.value) as RagSettings["chunkSize"] }))}>{[2, 3, 4].map((size) => <option key={size} value={size}>{size} sentences</option>)}</select><p className="text-xs text-muted-foreground">How much text each passage keeps.</p></div>
            <div className="space-y-2"><label htmlFor="rag-overlap" className="text-sm font-medium">Overlap</label><select id="rag-overlap" className={SELECT_CLASS} value={settings.overlap} onChange={(event) => setSettings((old) => ({ ...old, overlap: Number(event.target.value) as RagSettings["overlap"] }))}><option value={0}>No repeated sentences</option><option value={1}>Repeat 1 sentence</option></select><p className="text-xs text-muted-foreground">Keep a little context between neighbours.</p></div>
            <div className="space-y-2"><label htmlFor="rag-topk" className="text-sm font-medium">Top-k</label><select id="rag-topk" className={SELECT_CLASS} value={settings.topK} onChange={(event) => setSettings((old) => ({ ...old, topK: Number(event.target.value) }))}>{[1, 2, 3, 4].map((k) => <option key={k} value={k}>Up to {k} {k === 1 ? "passage" : "passages"}</option>)}</select><p className="text-xs text-muted-foreground">How many matches can enter the prompt.</p></div>
            <div className="space-y-2"><label htmlFor="rag-cutoff" className="text-sm font-medium">Minimum similarity</label><select id="rag-cutoff" className={SELECT_CLASS} value={settings.minSimilarity === null ? "off" : "on"} onChange={(event) => setSettings((old) => ({ ...old, minSimilarity: event.target.value === "off" ? null : 0.35 }))}><option value="off">Off · keep the best available</option><option value="on">On · reject lower scores</option></select><p className="text-xs text-muted-foreground">A filter, not an answer-confidence test.</p></div>
          </div>
          {settings.minSimilarity !== null && <div className="space-y-2 border-t border-white/10 pt-4"><div className="flex justify-between gap-3 text-sm"><label htmlFor="rag-cutoff-value">Similarity cutoff</label><output className="font-mono tabular-nums">{settings.minSimilarity.toFixed(2)}</output></div><Slider id="rag-cutoff-value" aria-label="Similarity cutoff" className="min-h-11" value={[settings.minSimilarity]} min={-1} max={1} step={0.05} onValueChange={([value]) => setSettings((old) => ({ ...old, minSimilarity: value }))} /><p className="text-xs text-muted-foreground">−1 allows every direction; 1 requires an identical direction. No handbook passage reaches 1 for these questions.</p></div>}
          <p className="text-xs leading-relaxed text-muted-foreground">{index.length} prepared chunks · 384 dimensions per vector. Changing chunk settings uses a different prepared index; changing the question reuses it. The walkthrough rewinds whenever inputs change.</p>
        </Surface>

        <Surface variant="card" radius="2xl" className="space-y-5 p-4 sm:p-6">
          <RagArchitecture phase={phase} run={run} running={player.status === "running"} delayMs={player.delayMs} onSeek={player.seek} />
          <div className="border-t border-white/10 pt-4"><VisualizerControls status={player.status} onPlay={player.play} onPause={player.pause} onReset={player.reset} onStepForward={player.stepForward} onStepBack={player.stepBack} delayMs={player.delayMs} onDelayChange={player.setDelayMs} minDelayMs={500} maxDelayMs={3000} stepMs={100} stepIndex={player.index} stepCount={player.stepCount}><Button variant="outline" className="min-h-11" onClick={() => player.seek(steps.length - 1)}>See full result</Button></VisualizerControls></div>
          <p className="min-h-[3rem] text-sm leading-relaxed text-foreground" aria-live="polite" aria-atomic="true">{player.current?.explanation ?? "Read the handbook, then press Start or Step forward. Each stage shows only what has been produced so far."}</p>
        </Surface>

        <Surface variant="card" radius="2xl" className="min-w-0 space-y-5 p-4 sm:p-6" data-rag-phase={phase}>
          <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-white/10 pb-3"><h3 className="text-lg font-semibold">{stageIndex + 1}. {ragGuide.stages[stageIndex].title}</h3><p className="text-xs text-muted-foreground">{stageIndex < 4 ? "Document preparation" : "Question → evidence → answer"}</p></div>
          {activeExperiment && (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-primary/30 bg-primary/5 px-3.5 py-2.5 text-xs">
              <span className="text-foreground">
                {activeExperiment === "boundary" && (run.answer.status === "supported" ? "Both halves of the shipping rule reached the answer." : "The selected passages do not yet contain both halves of the rule.")}
                {activeExperiment === "two-documents" && (run.answer.status === "supported" ? "Evidence for both parts of the question was retrieved." : "Some evidence is still missing. Follow the sources into the prompt.")}
                {activeExperiment === "related" && "Experiment: High cosine similarity does not prove the handbook answers this question."}
              </span>
              {activeExperiment === "boundary" && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    pendingPhaseRef.current = "retrieve";
                    setSettings((old) => ({ ...old, overlap: old.overlap === 0 ? 1 : 0 }));
                  }}
                >
                  {settings.overlap === 0 ? "Try overlap = 1" : "Reset overlap = 0"}
                </Button>
              )}
              {activeExperiment === "two-documents" && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    pendingPhaseRef.current = "answer";
                    setSettings((old) =>
                      old.topK < 3 ? { ...old, chunkSize: 3, topK: 3 } : { ...RAG_DEFAULT },
                    );
                  }}
                >
                  {settings.topK < 3 ? "Try chunk 3, top-k 3" : "Reset defaults"}
                </Button>
              )}
            </div>
          )}
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={phase}
              initial={reduced ? undefined : { opacity: 0, y: 8 }}
              animate={reduced ? undefined : { opacity: 1, y: 0 }}
              exit={reduced ? undefined : { opacity: 0, y: -6 }}
              transition={{ duration: reduced ? 0 : 0.2, ease: "easeOut" }}
            >
              <RagStageView phase={phase} run={run} />
            </motion.div>
          </AnimatePresence>
        </Surface>
      </section>

      <section id="rag-experiments" aria-labelledby="rag-experiments-title" className="scroll-mt-24 space-y-4">
        <SectionTitle id="rag-experiments-title" kicker="Change one decision" title="Make retrieval succeed—and fail">
          <p>Load a setup below, then choose <strong className="text-foreground">See full result</strong>. Change the suggested control and compare the evidence, not just the answer’s wording.</p>
        </SectionTitle>
        <RagExperimentCards
          activeExperiment={activeExperiment}
          onLoadExperiment={(spec) => loadExample(spec.id, spec.changes, spec.targetPhase)}
        />
      </section>

      <RagDetails />
      <div id="rag-guide" className="scroll-mt-24"><AlgorithmGuidePanel guide={ragGuide} activeStageId={player.current ? ragGuideStepFor(player.current) : null} /></div>
    </div>
  );
}
