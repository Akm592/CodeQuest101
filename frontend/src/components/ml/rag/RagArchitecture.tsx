import * as React from "react";
import { useReducedMotion } from "framer-motion";
import { Binary, Database, FileText, Filter, Layers, MessageSquareText, Radar, Scissors, Sparkles } from "lucide-react";

import type { RagRun, RagStep } from "../../../lib/ml/rag";
import { RAG_DOCUMENTS } from "../../../lib/ml/rag";
import { cn } from "../../../lib/utils";
import { C } from "../colors";

type Phase = RagStep["phase"];
const WIDTH = 1170;
const HEIGHT = 610;
const NODE_WIDTH = 190;
const NODE_HEIGHT = 100;
const NODES = [
  { phase: "docs", title: "Source documents", subtitle: "Your knowledge", Icon: FileText, x: 24, y: 70, color: C.teal },
  { phase: "chunk", title: "Chunk the text", subtitle: "Keep useful passages", Icon: Scissors, x: 254, y: 70, color: C.teal },
  { phase: "embed", title: "Embedding model", subtitle: "Text → numbers", Icon: Binary, x: 484, y: 70, color: C.teal },
  { phase: "index", title: "Vector index", subtitle: "Vectors + original text", Icon: Database, x: 714, y: 70, color: C.teal },
  { phase: "query", title: "Question encoder", subtitle: "Same embedding space", Icon: Binary, x: 254, y: 285, color: C.sky },
  { phase: "score", title: "Similarity search", subtitle: "Compare every vector", Icon: Radar, x: 484, y: 285, color: C.sky },
  { phase: "retrieve", title: "Retrieved passages", subtitle: "Top-k + optional cutoff", Icon: Filter, x: 714, y: 285, color: C.sky },
  { phase: "prompt", title: "Assemble the prompt", subtitle: "Question + source text", Icon: Layers, x: 714, y: 475, color: C.violet },
  { phase: "answer", title: "LLM → cited answer", subtitle: "Generation is simulated", Icon: Sparkles, x: 944, y: 475, color: C.violet },
] as const;

// Both the index and query vector feed search; the original question bypasses vectors to enter the prompt.
const EDGES: { id: string; from: Phase | "question"; to: Phase; path: string; color: string; label?: string; x?: number; y?: number }[] = [
  { id: "documents-chunks", from: "docs", to: "chunk", path: "M214 120 H254", color: C.teal },
  { id: "chunks-encoder", from: "chunk", to: "embed", path: "M444 120 H484", color: C.teal },
  { id: "encoder-index", from: "embed", to: "index", path: "M674 120 H714", color: C.teal },
  { id: "index-search", from: "index", to: "score", path: "M809 170 V210 Q809 222 797 222 H591 Q579 222 579 234 V285", color: C.teal, label: "Stored vectors", x: 694, y: 207 },
  { id: "question-encoder", from: "question", to: "query", path: "M214 335 H254", color: C.sky, label: "Text", x: 234, y: 317 },
  { id: "question-search", from: "query", to: "score", path: "M444 335 H484", color: C.sky, label: "384-D", x: 464, y: 317 },
  { id: "search-passages", from: "score", to: "retrieve", path: "M674 335 H714", color: C.sky },
  { id: "passages-prompt", from: "retrieve", to: "prompt", path: "M809 385 V475", color: C.sky, label: "Selected text", x: 866, y: 432 },
  { id: "question-prompt", from: "question", to: "prompt", path: "M119 385 V513 Q119 525 131 525 H714", color: C.sky, label: "Original question", x: 365, y: 509 },
  { id: "prompt-answer", from: "prompt", to: "answer", path: "M904 525 H944", color: C.violet },
];

function payload(phase: Phase, run: RagRun): string {
  switch (phase) {
    case "docs": return `${RAG_DOCUMENTS.length} handbook documents`;
    case "chunk": return `${run.chunks.length} chunks · overlap ${run.settings.overlap}`;
    case "embed": return `[${run.chunks[0].embedding.slice(0, 3).map((n) => n.toFixed(2)).join(", ")}, …]`;
    case "index": return `${run.chunks.length} stored × 384 dimensions`;
    case "query": return `[${run.queryEmbedding.slice(0, 3).map((n) => n.toFixed(2)).join(", ")}, …]`;
    case "score": return `Best cosine: ${run.ranked[0].score.toFixed(3)}`;
    case "retrieve": return `${run.selected.length} of ${run.chunks.length} passages kept`;
    case "prompt": return `Question + ${run.selected.length} source passages`;
    case "answer": return run.answer.status === "supported" ? `${run.answer.claims.length} supported claim${run.answer.claims.length === 1 ? "" : "s"}` : run.answer.status === "partial" ? "Partial evidence · say what is missing" : "Insufficient evidence · do not guess";
  }
}

export default function RagArchitecture({ phase, run, running, delayMs, onSeek }: {
  phase: Phase;
  run: RagRun;
  running: boolean;
  delayMs: number;
  onSeek: (index: number) => void;
}) {
  const reduced = useReducedMotion();
  const svgRef = React.useRef<SVGSVGElement>(null);
  const id = React.useId().replace(/:/g, "");
  const current = NODES.findIndex((node) => node.phase === phase);

  React.useEffect(() => {
    // Pause native SVG timelines too, so the packets stop with the walkthrough.
    const svg = svgRef.current;
    if (running && !reduced) svg?.unpauseAnimations?.();
    else svg?.pauseAnimations?.();
  }, [running, reduced, phase]);

  return <section aria-label="RAG architecture and data flow" className="min-w-0 space-y-3" data-rag-architecture="">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div><h3 className="font-semibold text-foreground">Watch the data move</h3><p className="mt-1 text-xs leading-relaxed text-muted-foreground">Select a component to inspect it. Play moves data along the active connections; Pause stops the flow.</p></div>
      <div className="flex flex-wrap gap-4 text-[11px] text-muted-foreground" aria-label="Flow legend">
        {[[C.teal, "Document indexing"], [C.sky, "Question & retrieval"], [C.violet, "Answer generation"]].map(([color, label]) => <span key={label} className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />{label}</span>)}
      </div>
    </div>
    <p className="text-xs text-muted-foreground lg:hidden">Scroll the diagram sideways to follow the complete architecture.</p>
    <div className="overflow-x-auto rounded-2xl border border-white/10 bg-[#0a101b]" role="region" aria-label="Scrollable architecture diagram" tabIndex={0}>
      <div className="relative min-w-[1000px]" style={{ aspectRatio: `${WIDTH} / ${HEIGHT}`, backgroundImage: "radial-gradient(circle, rgb(148 163 184 / 0.13) 1px, transparent 1px)", backgroundSize: "20px 20px" }}>
        <svg ref={svgRef} viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden="true">
          <defs>{[["document", C.teal], ["question", C.sky], ["answer", C.violet]].map(([name, color]) => <marker key={name} id={`${id}-${name}`} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0 0 L10 5 L0 10 Z" fill={color} /></marker>)}</defs>
          <rect x={12} y={50} width={906} height={140} rx={18} fill={C.teal} fillOpacity={0.025} stroke={C.teal} strokeOpacity={0.14} strokeDasharray="5 6" />
          <text x={26} y={32} fontSize={11} fontWeight={600} letterSpacing={1.4} fill={C.teal}>01 / PREPARE YOUR KNOWLEDGE</text>
          <text x={26} y={263} fontSize={11} fontWeight={600} letterSpacing={1.4} fill={C.sky}>02 / FIND THE RELEVANT PASSAGES</text>
          <text x={716} y={453} fontSize={11} fontWeight={600} letterSpacing={1.4} fill={C.violet}>03 / GIVE THE MODEL ITS CONTEXT</text>
          {EDGES.map((edge) => {
            const target = NODES.findIndex((node) => node.phase === edge.to);
            const reached = current >= target;
            const active = current === target;
            const marker = edge.color === C.teal ? "document" : edge.color === C.sky ? "question" : "answer";
            return <g key={edge.id} data-flow-edge={edge.id} data-flow-state={active ? "active" : reached ? "complete" : "waiting"}>
              <path d={edge.path} fill="none" stroke={edge.color} strokeOpacity={reached ? 0.65 : 0.17} strokeWidth={1.8} markerEnd={`url(#${id}-${marker})`} />
              {active && !reduced && <>
                <path d={edge.path} fill="none" stroke={edge.color} strokeWidth={2} strokeDasharray="5 7"><animate attributeName="stroke-dashoffset" from="24" to="0" dur="1s" repeatCount="indefinite" /></path>
                <circle r={4} fill={edge.color} stroke="#0a101b" strokeWidth={2}><animateMotion path={edge.path} dur={`${Math.max(0.6, delayMs / 1000)}s`} repeatCount="indefinite" /></circle>
              </>}
              {edge.label && <text x={edge.x} y={edge.y} textAnchor="middle" fontSize={10} fill={reached ? edge.color : C.muted}>{edge.label}</text>}
            </g>;
          })}
          <text x={954} y={95} fontSize={11} fill={C.muted}>THE SAME TRAINED ENCODER</text>
          <text x={954} y={116} fontSize={11} fill={C.fg}>Documents and questions</text>
          <text x={954} y={135} fontSize={11} fill={C.fg}>share a 384-dimensional space.</text>
          <text x={954} y={320} fontSize={11} fill={C.muted}>RETRIEVAL FINDS TEXT.</text>
          <text x={954} y={342} fontSize={11} fill={C.fg}>The answer model reads it.</text>
          <text x={26} y={563} fontSize={11} fill={C.muted}>The original question joins the retrieved passages in the prompt.</text>
          <text x={26} y={582} fontSize={11} fill={C.muted}>Embedding numbers are used for search, not passed to the answer model.</text>
        </svg>
        <div data-flow-input="question" className="absolute flex flex-col justify-center gap-2 rounded-xl border bg-[#101827] px-3" style={{ left: `${24 / WIDTH * 100}%`, top: `${285 / HEIGHT * 100}%`, width: `${NODE_WIDTH / WIDTH * 100}%`, height: `${NODE_HEIGHT / HEIGHT * 100}%`, borderColor: `color-mix(in srgb, ${C.sky} 35%, transparent)` }}>
          <span className="flex items-center gap-2"><MessageSquareText className="h-4 w-4 shrink-0" style={{ color: C.sky }} /><span className="text-[12px] font-semibold text-foreground">Your question</span></span>
          <span className="line-clamp-2 text-[11px] leading-relaxed text-muted-foreground" title={run.query.text}>{run.query.text}</span>
        </div>
        {NODES.map((node, index) => {
          const active = index === current;
          const reached = index <= current;
          const Icon = node.Icon;
          return <button key={node.phase} type="button" onClick={() => onSeek(index)} aria-label={`Go to step ${index + 1}: ${node.title}`} aria-current={active ? "step" : undefined} data-flow-node={node.phase} className={cn("absolute flex flex-col justify-center gap-2 rounded-xl border bg-[#101827] px-3 text-left transition-colors motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background", active ? "shadow-lg" : "hover:bg-[#152133]")} style={{ left: `${node.x / WIDTH * 100}%`, top: `${node.y / HEIGHT * 100}%`, width: `${NODE_WIDTH / WIDTH * 100}%`, height: `${NODE_HEIGHT / HEIGHT * 100}%`, borderColor: active ? node.color : reached ? `color-mix(in srgb, ${node.color} 35%, transparent)` : "rgb(255 255 255 / 0.12)", boxShadow: active ? `0 0 25px color-mix(in srgb, ${node.color} 12%, transparent)` : undefined }}>
            <span className="flex items-center gap-2"><Icon className="h-4 w-4 shrink-0" style={{ color: reached ? node.color : C.muted }} /><span className="text-[12px] font-semibold leading-tight text-foreground">{node.title}</span><span className="ml-auto text-[10px] text-muted-foreground">{index + 1}</span></span>
            <span className="text-[10px] leading-tight text-muted-foreground">{node.subtitle}</span>
            <span className={cn("truncate font-mono text-[10px] leading-tight", reached ? "text-foreground" : "text-muted-foreground")} title={reached ? payload(node.phase, run) : "Waiting for this stage"}>{reached ? payload(node.phase, run) : "Waiting for input…"}</span>
          </button>;
        })}
      </div>
    </div>
    <p className="text-xs text-muted-foreground">{phase === "docs" ? "Start with your documents. The upper path prepares the index; the lower paths reuse it for each question." : `${NODES[current].title}: ${payload(phase, run)}.`}</p>
  </section>;
}
