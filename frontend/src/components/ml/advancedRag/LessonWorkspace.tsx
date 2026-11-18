import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, BookOpen, CheckCircle2, ChevronDown, Code2, FileText, Info, Layers, Search, X } from "lucide-react";
import type { AdvancedChapter, AdvancedLesson, LessonView } from "../../../lib/advancedRag/curriculum";
import { ADV_DOCUMENTS, ADV_GRAPH, ADV_HNSW, ADV_MODEL_INFO, ADV_QUERIES, getAdvancedIndex, getQueryEmbedding } from "../../../lib/advancedRag/data";
import { cosineSimilarity } from "../../../lib/ml/vectorMath";
import { ADV_DEFAULT, cleanAdvancedText, runAdvancedExperiment, searchHnswTeaching, type AdvancedSettings } from "../../../lib/advancedRag/engine";
import { useAlgorithmPlayer } from "../../../hooks/useAlgorithmPlayer";
import { Button } from "../../ui/button";
import { VisualizerControls } from "../../Visualizer/VisualizerControls";
import LessonDiagram from "./LessonDiagram";
import { lessonSettings, scoreLabel } from "./courseState";

interface Props { chapter: AdvancedChapter; lesson: AdvancedLesson; view: LessonView; onViewChange: (view: LessonView) => void }
const percent = (value: number | null) => value === null ? "N/A" : `${Math.round(value * 100)}%`;

export default function LessonWorkspace({ chapter, lesson, view, onViewChange }: Props) {
  const [settings, setSettings] = useState<AdvancedSettings>(() => ({ ...ADV_DEFAULT, ...lessonSettings(lesson.id, lesson.defaultQueryId) }));
  const run = useMemo(() => runAdvancedExperiment(settings), [settings]);
  const [selectedId, setSelectedId] = useState(() => lesson.id === "graph" ? `entity:${run.query.seedEntityIds[0]}` : "");
  const [efSearch, setEfSearch] = useState(3);
  const hnsw = useMemo(() => searchHnswTeaching(efSearch), [efSearch]);
  const [quizAnswer, setQuizAnswer] = useState<number | null>(null);
  const [pipelineDecision, setPipelineDecision] = useState("retrieve");
  const [cleanupInput, setCleanupInput] = useState(() => (ADV_DOCUMENTS.find((document) => document.id === "D4") ?? ADV_DOCUMENTS[0]).rawText);
  const inspectorDialog = useRef<HTMLDialogElement>(null);
  const controls = useRef<HTMLDivElement>(null);
  const playbackKey = JSON.stringify(settings);
  const stages = useMemo(() => (lesson.id === "hnsw" ? hnsw.trace.map((event) => ({ text: `Layer ${event.layer} · ${event.kind === "descend" ? "Descend from" : event.kind === "move" ? "Move to" : "Compare"} ${event.nodeId}. Best so far: ${event.bestId}. ${event.visitedIds.length} vector distances computed.` })) : lesson.watchNarrationStages.map((text) => ({ text }))).map((stage) => ({ ...stage, playbackKey })), [lesson, playbackKey, hnsw]);
  const player = useAlgorithmPlayer(stages, { initialDelayMs: 1500 });
  const pause = player.pause;
  useEffect(() => { if (view !== "watch") pause(); }, [view, pause]);
  useEffect(() => {
    if (view === "try" && lesson.id === "pipeline" && selectedId === pipelineDecision) controls.current?.querySelectorAll<HTMLElement>("select,input")[1]?.focus();
  }, [view, lesson.id, selectedId, pipelineDecision]);

  function update<K extends keyof AdvancedSettings>(key: K, value: AdvancedSettings[K]) {
    setSettings((current) => ({ ...current, [key]: value }));
    setSelectedId(lesson.id === "graph" ? `entity:${ADV_QUERIES.find((query) => query.id === (key === "queryId" ? value : settings.queryId))?.seedEntityIds[0]}` : "");
  }
  const selection = run.index.find((chunk) => chunk.id === selectedId) ?? run.selected[0]?.chunk;
  const selectedDense = run.dense.find((row) => row.chunk.id === selection?.id);
  const selectedSparse = run.sparse.find((row) => row.chunk.id === selection?.id);
  const selectedFused = run.fused.find((row) => row.chunk.id === selection?.id);
  const selectedReranked = run.reranked.find((row) => row.chunk.id === selection?.id);
  const relation = ADV_GRAPH.relations.find((item) => `relation:${item.id}` === selectedId);
  const selectedPoint = ADV_HNSW.nodes.find((item) => item.id === selectedId);
  const activeHnswEvent = hnsw.trace[Math.min(Math.max(0, player.index), hnsw.trace.length - 1)];
  const entity = ADV_GRAPH.entities.find((item) => `entity:${item.id}` === selectedId);
  const cleanupDocument = ADV_DOCUMENTS.find((item) => item.id === "D4") ?? ADV_DOCUMENTS[0];
  const structure = getAdvancedIndex("structure").filter((chunk) => chunk.documentId === (selection?.documentId ?? "D4"));
  const adjacentSimilarities = structure.slice(1).map((chunk, index) => ({ before: structure[index], after: chunk, cosine: cosineSimilarity(structure[index].embedding, chunk.embedding) }));

  const select = (id: string) => {
    setSelectedId(id);
    if (lesson.id === "pipeline" && ["prepare", "query", "retrieve", "rerank", "pack", "answer"].includes(id)) setPipelineDecision(id);
  };
  const chunkControl = <label>Chunk boundaries<select value={settings.chunkStrategy} onChange={(event) => update("chunkStrategy", event.target.value as AdvancedSettings["chunkStrategy"])}><option value="fixed">Fixed · 3 sentences</option><option value="structure">Structure-aware children</option><option value="semantic">Semantic boundaries</option></select></label>;
  const retrievalControl = <label>Retrieval<select value={settings.retrieval} onChange={(event) => update("retrieval", event.target.value as AdvancedSettings["retrieval"])}><option value="dense">Dense · meaning</option><option value="sparse">Sparse · BM25</option><option value="hybrid">Hybrid · RRF</option>{lesson.id === "pipeline" && <option value="graph">Graph · source-backed links</option>}</select></label>;
  const queryControl = <label>Search strategy<select value={settings.queryStrategy} onChange={(event) => update("queryStrategy", event.target.value as AdvancedSettings["queryStrategy"])}><option value="original">Original question</option><option value="rewrite">Authored rewrite</option><option value="multi">Authored subquestions</option><option value="hyde">Authored HyDE example</option></select></label>;
  const poolControl = <label>Candidate pool<select value={settings.poolSize} onChange={(event) => update("poolSize", Number(event.target.value) as AdvancedSettings["poolSize"])}>{[3, 6, 10].map((value) => <option key={value} value={value}>{value} passages</option>)}</select></label>;
  const budgetControl = <label>Context budget · words<select value={settings.wordBudget} onChange={(event) => update("wordBudget", Number(event.target.value) as AdvancedSettings["wordBudget"])}>{[20, 40, 80, 160, 240].map((value) => <option key={value} value={value}>{value} words</option>)}</select></label>;
  const parentControl = <label className="course-checkbox"><input type="checkbox" checked={settings.expandParents} onChange={(event) => update("expandParents", event.target.checked)} />Expand parent sections</label>;
  const rerankControl = <label className="course-checkbox"><input type="checkbox" checked={settings.rerank} onChange={(event) => update("rerank", event.target.checked)} />Use cross-encoder reranking</label>;

  const experimentControls = <div className="course-experiment-controls" ref={controls}>
    {lesson.id === "chunk" && chunkControl}
    {lesson.id === "parent" && <>{parentControl}{budgetControl}</>}
    {lesson.id === "representations" && retrievalControl}
    {lesson.id === "hnsw" && <label>Base-layer candidate budget<select value={efSearch} onChange={(event) => setEfSearch(Number(event.target.value))}>{[3, 6, 10].map((value) => <option key={value} value={value}>efSearch = {value}</option>)}</select></label>}
    {lesson.id === "fusion" && <>{retrievalControl}{poolControl}</>}
    {lesson.id === "rerank" && <>{rerankControl}{poolControl}</>}
    {lesson.id === "strategies" && queryControl}
    {lesson.id === "graph" && <label>Traversal depth<select value={settings.graphHops} onChange={(event) => update("graphHops", Number(event.target.value) as 1 | 2)}><option value={1}>1 hop</option><option value={2}>2 hops</option></select></label>}
    {(lesson.id === "packing" || lesson.id === "evaluate") && <>{budgetControl}{parentControl}</>}
    {lesson.id === "pipeline" && <>
      <label>Pipeline decision<select value={pipelineDecision} onChange={(event) => setPipelineDecision(event.target.value)}><option value="prepare">1 · Prepare</option><option value="query">2 · Search input</option><option value="retrieve">3 · Retrieve</option><option value="rerank">4 · Rerank</option><option value="pack">5 · Pack context</option><option value="answer">6 · Answer</option></select></label>
      {pipelineDecision === "prepare" && chunkControl}
      {pipelineDecision === "query" && queryControl}
      {pipelineDecision === "retrieve" && <>{retrievalControl}{poolControl}</>}
      {pipelineDecision === "rerank" && rerankControl}
      {pipelineDecision === "pack" && <>{budgetControl}{parentControl}</>}
      {pipelineDecision === "answer" && <span className="course-muted">Authored claims require source support. Missing evidence → abstain.</span>}
    </>}
  </div>;

  const inspector = <>
    <p className="course-eyebrow">Decision inspector</p>
    <h2>{lesson.id === "fusion" ? "Why did this move up?" : lesson.id === "hnsw" ? "What did the search visit?" : lesson.id === "graph" ? "Where does this link come from?" : "Follow the evidence."}</h2>
    {lesson.id === "graph" && <details><summary>Inspect traversed relationships</summary>{ADV_GRAPH.relations.filter((item) => run.graph.relationIds.includes(item.id)).map((item) => <button className="course-source-link" key={item.id} type="button" onClick={() => setSelectedId(`relation:${item.id}`)}>{item.label} · {item.evidenceIds.join(", ")}<ArrowRight size={13} /></button>)}</details>}
    {lesson.id === "hnsw" ? <>
      <div className="course-inspector-card"><NetworkMetric label="Approximate top 3" value={hnsw.results.map((row) => row.id).join(", ")} /><NetworkMetric label="Exact top 3" value={hnsw.exact.map((row) => row.id).join(", ")} /><NetworkMetric label="Top-3 recall" value={percent(hnsw.recall)} /><NetworkMetric label="Distance comparisons" value={`${hnsw.comparisonCount} approximate / ${hnsw.exactComparisonCount} exact`} /></div>
      {activeHnswEvent && view === "watch" && <p aria-live="polite">Layer {activeHnswEvent.layer} · {activeHnswEvent.kind} {activeHnswEvent.nodeId}. Current best: {activeHnswEvent.bestId}.</p>}
      {selectedPoint && <p>{selectedPoint.id}: coordinates ({selectedPoint.vector.join(", ")}), maximum layer {selectedPoint.level}; Euclidean distance {Math.hypot(...selectedPoint.vector.map((value, index) => value - ADV_HNSW.query[index])).toFixed(3)}.</p>}
      <p className="course-muted">Fixed 2D teaching index. Purple edges are upper-layer shortcuts; these are proximity links, not source facts.</p>
    </> : lesson.id === "clean" && ["raw", "cleaned", "cleanup"].includes(selectedId) ? <>
      <div className="course-selected-source"><FileText size={19} /><strong>{selectedId === "raw" ? "Original source · full text" : "Cleaned source · full text"}</strong></div>
      <pre>{selectedId === "raw" ? cleanupDocument.rawText : cleanAdvancedText(cleanupDocument.rawText)}</pre>
      <p>Known page furniture is removed. The table values, product codes, headings, conditions, and negation remain.</p>
    </> : entity ? <>
      <div className="course-selected-source"><Layers size={19} /><strong>{entity.label}</strong></div><p>{entity.type} · {run.graph.entityIds.includes(entity.id) ? "Reached by the current traversal" : "Outside the current traversal"}</p>
      {ADV_GRAPH.relations.filter((item) => item.from === entity.id || item.to === entity.id).map((item) => <button className="course-source-link" type="button" key={item.id} onClick={() => setSelectedId(`relation:${item.id}`)}>{item.label} · {item.evidenceIds.join(", ")}<ArrowRight size={13} /></button>)}
    </> : relation ? <>
      <div className="course-selected-source"><Layers size={19} /><strong>{relation.label}</strong></div>
      <p>{ADV_GRAPH.entities.find((entity) => entity.id === relation.from)?.label} → {ADV_GRAPH.entities.find((entity) => entity.id === relation.to)?.label}</p>
      {relation.evidenceIds.map((id) => <div className="course-inspector-card" key={id}><strong>{id}</strong><p>{ADV_DOCUMENTS.flatMap((document) => document.sentences).find((sentence) => sentence.id === id)?.text}</p></div>)}
    </> : selection ? <>
      <div className="course-selected-source"><FileText size={19} /><span className="course-rank-badge">{selection.documentId}</span><strong>{selection.heading}</strong></div>
      {(lesson.id === "fusion" || lesson.id === "representations" || lesson.id === "rerank") && <div className="course-rank-stats">
        <div><Layers size={17} /><span>Dense rank {selectedDense?.rank ?? "—"}</span><small>{selectedDense ? scoreLabel("dense", selectedDense.score) : "Not retrieved"}</small></div>
        <div className="tone-amber"><Search size={17} /><span>Sparse rank {selectedSparse && selectedSparse.score > 0 ? selectedSparse.rank : "—"}</span><small>{selectedSparse ? scoreLabel("sparse", selectedSparse.score) : "No lexical match"}</small></div>
        {selectedReranked && <div><Code2 size={17} /><span>Reranked {selectedReranked.baseRank} → {selectedReranked.rank}</span><small>{scoreLabel("rerank", selectedReranked.score)}</small></div>}
      </div>}
      <p className="course-source-text">{selection.text}</p>
      <p className="course-source-label">{selection.source} · {selection.sentenceIds.join(", ")}</p>
      {lesson.id === "fusion" && <p>{selectedFused?.contributions?.map((item) => `${item.list}: 1/(60 + ${item.rank}) = ${item.value.toFixed(5)}`).join(" + ") || "Outside the current fusion window."}{selectedFused ? ` → ${selectedFused.score.toFixed(5)}` : ""}</p>}
      {lesson.id === "representations" && <>
        <div className="course-vector-preview" aria-label="First 12 of 384 embedding coordinates">{getQueryEmbedding(run.query.text).slice(0, 12).map((value, index) => <span key={index} style={{ opacity: 0.25 + Math.min(0.75, Math.abs(value) * 8), background: value >= 0 ? "#25d9cb" : "#c393f2" }} title={`Coordinate ${index + 1}: ${value.toFixed(5)}`} />)}</div>
        <p className="course-muted">12 coordinates shown; all 384 used. A coordinate is not a named topic.</p>
        <div className="course-term-list">{selectedSparse?.terms?.filter((term) => term.contribution > 0).map((term) => <span key={term.term}>{term.term} <strong>{term.contribution.toFixed(3)}</strong></span>)}</div>
      </>}
      {lesson.id === "parent" && <details><summary>Parent source section</summary><p>{selection.parentText}</p><small>{selection.parentId} · {selection.parentSentenceIds.join(", ")}</small></details>}
      {lesson.id === "chunk" && <details open={settings.chunkStrategy === "semantic"}><summary>Actual adjacent similarities</summary><p>Semantic grouping starts a new chunk when the heading changes, similarity falls below {ADV_MODEL_INFO.semanticThreshold}, or a chunk reaches 3 sentences.</p>{adjacentSimilarities.map((pair) => <p key={pair.after.id}><strong>{pair.before.sentenceIds[0]} → {pair.after.sentenceIds[0]}</strong><br />cosine {pair.cosine.toFixed(3)} · {pair.before.heading !== pair.after.heading ? "split: heading changed" : pair.cosine < ADV_MODEL_INFO.semanticThreshold ? "split: below threshold" : "same topic signal (up to 3 sentences)"}</p>)}</details>}
    </> : <p className="course-muted">Select a passage or connection in the diagram to inspect its source.</p>}
    <p>{lesson.inspector.why}</p>
    <details className="course-math"><summary><Code2 size={17} />Math & code<ChevronDown size={16} /></summary><p>{lesson.inspector.math}</p><pre>{lesson.inspector.pseudocode}</pre></details>
    <details><summary>Developer’s reasoning</summary><p>{lesson.inspector.pitfall}</p></details>
    {(lesson.id === "packing" || lesson.id === "evaluate" || lesson.id === "pipeline") && <details><summary>Context, answer & citations</summary>
      <div className="course-metrics"><NetworkMetric label="Recall@3 · source sentences" value={percent(run.metrics.recallAtK)} /><NetworkMetric label="Final context evidence" value={percent(run.metrics.evidenceCoverage)} /><NetworkMetric label="Word budget proxy" value={`${run.context.usedWords}/${run.context.budget}`} /><NetworkMetric label="Reranker pairs" value={String(run.metrics.modelPairCount)} /></div>
      <h3>Simulated answer · {run.answer.status}</h3><p>{run.answer.message}</p>{run.answer.claims.map((claim, i) => <p key={i}>{claim.text} <small>[{claim.citations.join(", ")}]</small></p>)}
      <h3>Exact context</h3>{run.context.passages.map((passage) => <p key={passage.id}><strong>{passage.id}</strong> {passage.text}</p>)}
      {run.context.dropped.map((item) => <p className="course-muted" key={item.chunkId}>{item.chunkId} omitted: {item.reason}.</p>)}
      <details><summary>Built prompt</summary><pre>{run.prompt}</pre></details>
    </details>}
    <details><summary>Sources & model provenance</summary><ul>{lesson.sources.map((source) => <li key={source.url}><a href={source.url} target="_blank" rel="noreferrer">{source.title}</a></li>)}</ul><p>{ADV_MODEL_INFO.encoder.model} · {ADV_MODEL_INFO.encoder.dimensions}D · mean pooling + L2 normalization.</p><p>{ADV_MODEL_INFO.reranker.model} · recorded raw logits.</p><p>Rewrites, subquestions, HyDE text, and answer claims are authored teaching examples.</p><p>Encoder revision <code>{ADV_MODEL_INFO.encoder.revision}</code></p><p>Reranker revision <code>{ADV_MODEL_INFO.reranker.revision}</code></p><p>Corpus SHA256 <code>{ADV_MODEL_INFO.corpusSha256}</code></p><p>Current sources only; archived documents {run.excludedDocumentIds.join(", ")} are excluded before retrieval.</p></details>
  </>;

  return <div className="course-workspace">
    <section className="course-lesson-stage" aria-label={`${lesson.title}: ${view}`}>
      {view === "understand" ? <article className="course-understand">
        <span className="course-section-icon"><BookOpen size={23} /></span><p className="course-eyebrow">The idea, in plain words</p><h2>{lesson.title}</h2>
        {lesson.idea.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
        <div className="course-story-steps">{lesson.watchNarrationStages.map((text, i) => <div key={text}><span>{i + 1}</span><p>{text}</p></div>)}</div>
        <Button onClick={() => onViewChange("watch")}>Watch the data flow<ArrowRight /></Button>
      </article> : view === "check" ? <article className="course-quiz">
        <span className="course-section-icon"><CheckCircle2 size={24} /></span><p className="course-eyebrow">One quick check</p><h2>{lesson.check.prompt}</h2><fieldset><legend className="sr-only">Choose an answer</legend>{lesson.check.options.map((option, index) => <label key={option} className={quizAnswer === index ? "is-selected" : ""}><input type="radio" name={`quiz-${lesson.id}`} checked={quizAnswer === index} onChange={() => setQuizAnswer(index)} /><span>{option}</span></label>)}</fieldset>
        {quizAnswer !== null && <div className={`course-quiz-feedback${quizAnswer === lesson.check.correctIndex ? " is-correct" : ""}`} role="status"><strong>{quizAnswer === lesson.check.correctIndex ? "That’s right." : "Look at the source logic again."}</strong><p>{lesson.check.explanation}</p></div>}
        <Button variant="outline" onClick={() => onViewChange("try")}>Try it in the experiment<ArrowRight /></Button>
      </article> : <>
        <div className="course-question-bar"><Search size={20} /><label className="sr-only" htmlFor={`query-${lesson.id}`}>Recorded example question</label><select id={`query-${lesson.id}`} value={settings.queryId} onChange={(event) => update("queryId", event.target.value)}>{ADV_QUERIES.map((query) => <option key={query.id} value={query.id}>{query.text}</option>)}</select><span className="course-recorded-label">Recorded examples</span><Button size="sm" onClick={() => { if (view === "watch") player.play(); else setSelectedId(run.selected[0]?.chunk.id ?? ""); }}>{view === "watch" ? "Watch flow" : "Compare"}<ArrowRight /></Button></div>
        {view === "try" && <><p className="course-try-instruction">{lesson.tryInstructions[0]}</p>{experimentControls}</>}
        {view === "try" && lesson.id === "clean" ? <div className="course-cleanup-sandbox"><label>Original text<textarea value={cleanupInput} onChange={(event) => setCleanupInput(event.target.value)} spellCheck={false} /></label><div><h3>Cleaned text</h3><pre>{cleanAdvancedText(cleanupInput)}</pre><p className="course-muted">This text-only sandbox runs cleanup rules. Search continues using the recorded corpus.</p></div></div> : <LessonDiagram lessonId={lesson.id} run={run} step={view === "watch" ? player.index : lesson.id === "hnsw" ? hnsw.trace.length - 1 : 3} selectedId={selectedId || selection?.id || ""} onSelect={select} hnsw={hnsw} trying={view === "try"} />}
        {view === "watch" ? <div className="course-playback"><p className="course-narration" aria-live="polite"><span>{Math.max(1, player.index + 1)}</span>{player.current?.text ?? stages[0]?.text}</p><VisualizerControls status={player.status} onPlay={player.play} onPause={player.pause} onReset={player.reset} onStepForward={player.stepForward} onStepBack={player.stepBack} delayMs={player.delayMs} onDelayChange={player.setDelayMs} stepIndex={player.index} stepCount={player.stepCount} /></div> : <div className="course-result-strip"><span><strong>{run.selected.length}</strong> selected passages</span><span><strong>{percent(run.metrics.evidenceCoverage)}</strong> source coverage</span><span>Answer <strong>{run.answer.status}</strong> · simulated</span></div>}
      </>}
      <Button variant="outline" className="course-inspector-toggle" onClick={() => inspectorDialog.current?.showModal()}><Info />Inspect this decision</Button>
    </section>
    <aside className="course-inspector" aria-label="Decision inspector">{inspector}</aside>
    <dialog ref={inspectorDialog} className="course-dialog course-inspector-dialog" aria-label="Decision inspector" onClick={(event) => { if (event.target === event.currentTarget) inspectorDialog.current?.close(); }}><Button variant="ghost" size="icon" className="course-dialog-close" aria-label="Close inspector" onClick={() => inspectorDialog.current?.close()}><X /></Button>{inspector}</dialog>
    <span className="sr-only">{chapter.title} · {lesson.title}</span>
  </div>;
}

function NetworkMetric({ label, value }: { label: string; value: string }) {
  return <div className="course-metric"><span>{label}</span><strong>{value}</strong></div>;
}
