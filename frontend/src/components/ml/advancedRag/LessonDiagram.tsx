import { memo, useMemo } from "react";
import { Background, Controls, Handle, MarkerType, Position, ReactFlow, type Edge, type Node, type NodeProps } from "@xyflow/react";
import { FileText, Layers, Network, Search, Sparkles } from "lucide-react";
import type { AdvancedRun, HnswSearchResult, RankedPassage } from "../../../lib/advancedRag/engine";
import { cleanAdvancedText } from "../../../lib/advancedRag/engine";
import { ADV_DOCUMENTS, ADV_GRAPH, ADV_HNSW, ADV_MODEL_INFO, getQueryEmbedding } from "../../../lib/advancedRag/data";
import { scoreLabel } from "./courseState";
import "@xyflow/react/dist/style.css";

type FlowData = {
  title: string; eyebrow?: string; text?: string; tone: string; active: boolean;
  rows?: { id: string; label: string; badge: string; detail?: string }[];
  selectedId: string; onSelect: (id: string) => void;
};
type FlowNode = Node<FlowData, "card">;
const FlowCard = memo(function FlowCard({ id, data }: NodeProps<FlowNode>) {
  const Icon = data.tone === "amber" ? Search : data.tone === "purple" ? Layers : data.tone === "blue" ? Network : FileText;
  return <div className={`course-flow-card tone-${data.tone}${data.active ? " is-active" : " is-waiting"}`}>
    <Handle type="target" position={Position.Top} />
    {data.eyebrow && <span className="course-node-eyebrow">{data.eyebrow}</span>}
    <button type="button" className="nodrag nopan course-node-heading" onClick={(event) => { event.stopPropagation(); data.onSelect(id); }} aria-label={`Inspect ${data.title}`}><Icon size={19} /><strong>{data.title}</strong></button>
    {data.text && <p className="course-node-text">{data.text}</p>}
    {data.rows && <div className="course-node-rows">{data.rows.map((row, index) => <button key={`${row.id}/${index}`} type="button" className={`nodrag nopan course-rank-row${data.selectedId === row.id ? " is-selected" : ""}`} onClick={(event) => { event.stopPropagation(); data.onSelect(row.id); }} aria-label={`Inspect ${row.label}`}>
      <span className="course-rank-position">{index + 1}</span><span className="course-rank-badge">{row.badge}</span><span className="course-rank-label">{row.label}{row.detail && <small>{row.detail}</small>}</span>
    </button>)}</div>}
    <Handle type="source" position={Position.Bottom} />
  </div>;
});
const nodeTypes = { card: FlowCard };
const colors: Record<string, string> = { teal: "#27ded0", amber: "#f6b92b", purple: "#cd94f4", blue: "#91b9ef", gray: "#566276" };
const rankRows = (rows: RankedPassage[], count = 3) => rows.slice(0, count).map((row) => ({ id: row.chunk.id, label: row.chunk.heading, badge: row.chunk.documentId, detail: scoreLabel(row.method, row.score) }));

interface DiagramProps {
  lessonId: string; run: AdvancedRun; step: number; selectedId: string; onSelect: (id: string) => void; hnsw: HnswSearchResult; trying?: boolean;
}

// Explicit node geometry also gives React Flow enough information to render edges during SSR.
// eslint-disable-next-line react-refresh/only-export-components -- The pure graph builder is also verified by diagram invariant tests.
export function buildLessonDiagram({ lessonId, run, step, selectedId, onSelect, hnsw, trying }: DiagramProps): { nodes: FlowNode[]; edges: Edge[] } {
  const nodes: FlowNode[] = [];
  const edges: Edge[] = [];
  const add = (id: string, title: string, x: number, y: number, options: { text?: string; eyebrow?: string; rows?: FlowData["rows"]; tone?: string; stage?: number; width?: number; height?: number } = {}) => {
    const width = options.width ?? 300;
    const height = options.height ?? (options.rows ? 76 + options.rows.length * 48 : options.text ? 126 : 62);
    nodes.push({ id, type: "card", position: { x, y }, width, height, initialWidth: width, initialHeight: height,
      handles: [{ type: "target", position: Position.Top, x: width / 2, y: 0 }, { type: "source", position: Position.Bottom, x: width / 2, y: height }],
      data: { title, text: options.text, eyebrow: options.eyebrow, rows: options.rows, tone: options.tone ?? "teal", active: step >= (options.stage ?? 0), selectedId, onSelect },
      draggable: false, connectable: false, selectable: false, ariaLabel: title });
  };
  const connect = (from: string, to: string, tone = "teal", label?: string) => edges.push({ id: `${from}-${to}`, source: from, target: to, type: "smoothstep", animated: nodes.find((node) => node.id === from)?.data.active && nodes.find((node) => node.id === to)?.data.active,
    label, labelStyle: { fill: "#cbd8e9", fontSize: 11 }, labelBgStyle: { fill: "#0b1525" }, labelBgPadding: [5, 3],
    style: { stroke: colors[tone], strokeWidth: 1.7, opacity: nodes.find((node) => node.id === to)?.data.active ? 1 : 0.2 }, markerEnd: { type: MarkerType.ArrowClosed, color: colors[tone], width: 16, height: 16 } });

  if (lessonId === "fusion") {
    add("question", "One question, two searches", 200, 0, { text: run.query.text, width: 340, height: 92 });
    add("dense", "Dense search", 0, 150, { eyebrow: `Top 3 shown · ${run.settings.poolSize} candidates contribute`, rows: rankRows(run.dense), stage: 1, width: 350 });
    add("sparse", "Sparse search · BM25", 390, 150, { eyebrow: `Top 3 shown · up to ${run.settings.poolSize} contribute`, tone: "amber", rows: rankRows(run.sparse.filter((row) => row.score > 0)), stage: 1, width: 350 });
    add("fusion", trying ? `${run.settings.retrieval} · selected passages` : "Merge ranks · RRF", 175, 455, { eyebrow: trying && run.settings.retrieval !== "hybrid" ? "One retriever · no rank fusion" : "Combine ranks, not raw scores", tone: "purple", rows: rankRows(trying ? run.selected : run.fused), stage: 2, width: 390 });
    if (!trying || run.settings.retrieval !== "sparse") { connect("question", "dense"); connect("dense", "fusion", "purple"); }
    if (!trying || run.settings.retrieval !== "dense") { connect("question", "sparse", "amber"); connect("sparse", "fusion", "purple"); }
  } else if (lessonId === "hnsw") {
    const visited = new Set(step < 0 ? [ADV_HNSW.entryPoint] : hnsw.trace[Math.min(hnsw.trace.length - 1, step)]?.visitedIds ?? hnsw.visitedIds);
    const final = new Set(hnsw.results.map((row) => row.id));
    for (const point of ADV_HNSW.nodes) add(point.id, point.id, point.vector[0] * 65, point.vector[1] * 55, { width: 110, height: 82, text: `(${point.vector.join(", ")}) · L${point.level}`, tone: final.has(point.id) && step >= hnsw.trace.length - 1 ? "purple" : visited.has(point.id) ? "teal" : "gray", stage: visited.has(point.id) ? -1 : Infinity });
    add("hnsw-query", "Query point", ADV_HNSW.query[0] * 65, ADV_HNSW.query[1] * 55 + 100, { text: `(${ADV_HNSW.query.join(", ")}) · fixed 2D example`, tone: "amber", width: 230, height: 110 });
    const seenEdges = new Set<string>();
    for (const layer of ADV_HNSW.layers) for (const [from, neighbors] of Object.entries(layer.neighbors)) for (const to of neighbors) {
      const pair = [from, to].sort().join("-");
      if (seenEdges.has(pair)) continue;
      seenEdges.add(pair); connect(from, to, layer.level > 0 ? "purple" : visited.has(from) && visited.has(to) ? "teal" : "gray", layer.level > 0 ? `upper L${layer.level}` : undefined);
    }
  } else if (lessonId === "graph") {
    const reached = new Set(step >= 2 ? run.graph.entityIds : run.query.seedEntityIds);
    ADV_GRAPH.entities.forEach((entity, i) => add(`entity:${entity.id}`, entity.label, (i % 3) * 285, Math.floor(i / 3) * 175, { eyebrow: entity.type, text: reached.has(entity.id) ? "Reached from the question" : "Outside the current traversal", width: 245, height: 110, tone: reached.has(entity.id) ? "teal" : "gray", stage: reached.has(entity.id) ? 0 : 9 }));
    ADV_GRAPH.relations.forEach((relation) => {
      const active = step >= 1 && run.graph.relationIds.includes(relation.id);
      connect(`entity:${relation.from}`, `entity:${relation.to}`, active ? "teal" : "gray", `${relation.label} · ${relation.evidenceIds.join(", ")}`);
      edges[edges.length - 1].id = `relation:${relation.id}`;
    });
  } else if (lessonId === "clean") {
    const document = ADV_DOCUMENTS.find((item) => item.id === "D4") ?? ADV_DOCUMENTS[0];
    add("raw", "Copied source", 0, 0, { text: document.rawText.slice(0, 230), eyebrow: `${document.id} · source preserved`, width: 370, height: 240 });
    add("cleanup", "Remove known page furniture", 440, 45, { text: "Normalize spacing. Remove navigation and repeated footers. Keep headings, prices, dates, and ‘not’.", stage: 1, width: 310, height: 165 });
    add("cleaned", "Clean text, same facts", 200, 340, { text: cleanAdvancedText(document.rawText).slice(0, 400), stage: 2, width: 520, height: 220 });
    connect("raw", "cleanup"); connect("cleanup", "cleaned");
  } else if (lessonId === "chunk") {
    const examples = run.index.filter((chunk) => chunk.documentId === "D4");
    add("source", "One source document", 180, 0, { text: "Delivery headings, fee table, and conditions stay attached to stable source sentences.", width: 360, height: 115 });
    add("boundary", `${run.settings.chunkStrategy} boundaries`, 180, 190, { text: run.settings.chunkStrategy === "semantic" ? `Real adjacent MiniLM cosine selects boundaries (threshold ${ADV_MODEL_INFO.semanticThreshold}). Each joined chunk has its own model embedding.` : run.settings.chunkStrategy === "structure" ? "Small children retain their heading and parent section for later expansion." : "Three-sentence windows provide a simple baseline. They can cross a meaningful section boundary.", stage: 1, width: 360, height: 160 });
    add("chunks", `${examples.length} retrievable passages`, 90, 420, { rows: examples.slice(0, 4).map((chunk) => ({ id: chunk.id, label: chunk.text, badge: chunk.documentId, detail: chunk.sentenceIds.join(" · ") })), stage: 2, width: 550 });
    connect("source", "boundary"); connect("boundary", "chunks");
  } else if (lessonId === "parent") {
    const child = run.selected[0]?.chunk;
    add("child", "Retrieve a precise child", 0, 0, { rows: rankRows(run.selected, 2), width: 350 });
    add("parent", run.settings.expandParents ? "Expand to its parent" : "Keep child text only", 410, 0, { text: child ? (run.settings.expandParents ? child.parentText : child.text) : "No selected child.", stage: 1, width: 390, height: 230 });
    add("context", "Deduplicate, then pack", 160, 330, { text: `${run.context.passages.length} unique context passages · ${run.context.usedWords}/${run.context.budget} words. ${run.context.dropped.length} passages omitted. Whole evidence sentences are preserved.`, stage: 2, width: 430, height: 150 });
    connect("child", "parent"); connect("parent", "context", "purple");
  } else if (lessonId === "representations") {
    const vector = getQueryEmbedding(run.query.text);
    add("question", "Represent the question", 200, 0, { text: run.query.text, width: 350, height: 100 });
    add("dense", "Dense coordinates", 0, 180, { text: `[${vector.slice(0, 6).map((value) => value.toFixed(3)).join(", ")}, …]\n6 displayed / all 384 used. Coordinates have no assigned topic names.`, width: 350, height: 155, stage: 1 });
    add("sparse", "Sparse term contributions", 410, 180, { text: run.sparse[0]?.terms?.filter((term) => term.contribution > 0).map((term) => `${term.term}: ${term.contribution.toFixed(3)}`).join(" · ") || "No overlapping terms.", tone: "amber", width: 350, height: 155, stage: 1 });
    add("dense-results", "Rank by cosine", 0, 420, { rows: rankRows(run.dense), stage: 2, width: 350 });
    add("sparse-results", "Rank by BM25", 410, 420, { rows: rankRows(run.sparse.filter((row) => row.score > 0)), tone: "amber", stage: 2, width: 350 });
    connect("question", "dense"); connect("question", "sparse", "amber"); connect("dense", "dense-results"); connect("sparse", "sparse-results", "amber");
  } else if (lessonId === "rerank") {
    add("candidates", `${run.candidates.length} first-stage candidates`, 0, 0, { rows: rankRows(run.candidates, run.settings.poolSize), width: 370 });
    add("pairs", "Read each question–passage pair", 450, 30, { text: run.settings.rerank ? `${run.metrics.modelPairCount} recorded cross-encoder pair scores. The original question stays unchanged. Raw logits are not probabilities.` : "Reranking is off. The original retrieval order goes straight to selection.", stage: 1, tone: "purple", width: 330, height: 180 });
    add("reranked", run.settings.rerank ? "Reranked · same candidate set" : "Retrieval order unchanged", 450, 300, { rows: rankRows(run.settings.rerank ? run.reranked : run.candidates, 3), stage: 2, tone: "purple", width: 370 });
    connect("candidates", "pairs", "purple"); connect("pairs", "reranked", "purple");
  } else if (lessonId === "strategies") {
    add("original", "Original user question", 200, 0, { text: run.query.text, width: 400, height: 110 });
    add("search-input", `${run.settings.queryStrategy} search input`, 80, 190, { text: run.queryTexts.join("\n\n"), eyebrow: run.settings.queryStrategy === "original" ? "Original wording" : "Authored example · not source evidence", stage: 1, tone: "amber", width: 640, height: 230 });
    add("retrieved", "Retrieve real source passages", 160, 510, { rows: rankRows(run.selected), stage: 2, width: 480 });
    connect("original", "search-input", "amber"); connect("search-input", "retrieved");
  } else if (lessonId === "packing" || lessonId === "evaluate") {
    add("retrieved", "Selected evidence", 0, 0, { rows: rankRows(run.selected), width: 350 });
    add("budget", "Pack whole source sentences", 425, 0, { text: `${run.context.usedWords} / ${run.context.budget} words used\n${run.context.passages.length} passages kept · ${run.context.dropped.length} omitted\nWord budget is a teaching proxy, not an LLM token count.`, stage: 1, width: 360, height: 180, tone: "purple" });
    add("evidence", lessonId === "evaluate" ? "Check against expected evidence" : "Final context", 0, 330, { text: lessonId === "evaluate" ? `Retrieval recall: ${run.metrics.recallAtK === null ? "N/A · no expected evidence" : `${Math.round(run.metrics.recallAtK * 100)}%`}\nContext evidence: ${run.metrics.evidenceCoverage === null ? "N/A" : `${Math.round(run.metrics.evidenceCoverage * 100)}%`}\nUnit: required source sentences, not answer confidence.` : run.context.passages.map((passage) => `${passage.source}: ${passage.text}`).join("\n\n").slice(0, 450), stage: 2, width: 350, height: 230 });
    add("answer", `Simulated answer · ${run.answer.status}`, 425, 330, { text: run.answer.claims.map((claim) => claim.text).join(" ") || run.answer.message, stage: 3, width: 360, height: 230, tone: run.answer.status === "insufficient" ? "amber" : "teal" });
    connect("retrieved", "budget", "purple"); connect("budget", "evidence", "purple"); connect("evidence", "answer");
  } else {
    add("prepare", "1 · Prepare the index", 0, 0, { text: `${run.settings.chunkStrategy} chunks · ${run.index.length} current passages. Archived versions excluded before search.`, width: 300, height: 140 });
    add("query", "2 · Search input", 390, 0, { text: `${run.settings.queryStrategy}: ${run.queryTexts[0]}`, width: 300, height: 140 });
    add("retrieve", "3 · Retrieve candidates", 0, 230, { text: `${run.settings.retrieval} search → ${run.candidates.length} candidates`, rows: rankRows(run.candidates, 2), stage: 1, width: 300, height: 225 });
    add("rerank", "4 · Rerank", 390, 230, { text: run.settings.rerank ? `${run.metrics.modelPairCount} real recorded pair scores; keep the best 3.` : "Off: preserve first-stage retrieval order. Keep the best 3.", stage: 2, tone: "purple", width: 300, height: 145 });
    add("pack", "5 · Pack context", 0, 550, { text: `${run.context.passages.length} passages · ${run.context.usedWords}/${run.context.budget} words. ${run.settings.expandParents ? "Parent expansion on." : "Child passages only."}`, stage: 2, width: 300, height: 145 });
    add("answer", `6 · Simulated answer · ${run.answer.status}`, 390, 550, { text: run.answer.claims.map((claim) => claim.text).join(" ") || run.answer.message, stage: 3, width: 300, height: 220 });
    connect("prepare", "query"); connect("query", "retrieve"); connect("retrieve", "rerank", "purple"); connect("rerank", "pack", "purple"); connect("pack", "answer");
  }
  return { nodes, edges };
}

export default function LessonDiagram(props: DiagramProps) {
  const graph = useMemo(() => buildLessonDiagram(props), [props]);
  return <div className="course-diagram" aria-label="Interactive data flow diagram">
    <ReactFlow<FlowNode> key={props.lessonId} width={800} height={600} nodes={graph.nodes} edges={graph.edges} nodeTypes={nodeTypes} fitView fitViewOptions={{ padding: 0.12 }} minZoom={0.3} maxZoom={1.6} nodesDraggable={false} nodesConnectable={false} zoomOnDoubleClick={false} onNodeClick={(_, node) => props.onSelect(node.id)} onEdgeClick={(_, edge) => props.onSelect(edge.id)} proOptions={{ hideAttribution: true }} colorMode="dark">
      <Background color="#1e3046" gap={28} size={0.7} /><Controls showInteractive={false} />
    </ReactFlow>
    <span className="course-diagram-hint"><Sparkles size={13} />Select a passage to inspect its evidence · Pan or zoom the diagram</span>
  </div>;
}
