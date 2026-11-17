import * as React from "react";
import { motion, useReducedMotion } from "framer-motion";

import { RAG_DOCUMENTS, type RagIndexedChunk, type RagRun } from "../../../lib/ml/rag";
import { cn } from "../../../lib/utils";
import { C } from "../colors";

export const SOURCE_COLORS = [C.teal, C.violet, C.sky, C.amber];
export const sourceColor = (id: string) => SOURCE_COLORS[RAG_DOCUMENTS.findIndex((doc) => doc.id === id)] ?? C.muted;

/** Sample `count` evenly spaced components from a 384-D embedding for visual comparison. */
function sampleVector(vector: readonly number[], count = 32): number[] {
  const step = Math.max(1, Math.floor(vector.length / count));
  const out: number[] = [];
  for (let i = 0; i < count && i * step < vector.length; i++) {
    out.push(vector[i * step]);
  }
  return out;
}

export function VectorFingerprint({
  vector,
  label,
  compact = false,
  accent = C.teal,
}: {
  vector: readonly number[];
  label?: string;
  compact?: boolean;
  accent?: string;
}) {
  const reduced = useReducedMotion();
  const samples = React.useMemo(() => sampleVector(vector, compact ? 24 : 36), [vector, compact]);
  const maxAbs = React.useMemo(() => Math.max(0.08, ...samples.map((v) => Math.abs(v))), [samples]);

  return (
    <div className={cn("space-y-1.5", compact && "space-y-1")}>
      {label && (
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
          <span>{label}</span>
          <span className="font-mono text-[11px]">{samples.length} sampled of {vector.length} dims</span>
        </div>
      )}
      <div
        className={cn(
          "flex items-center gap-[2px] rounded-lg border border-white/10 bg-black/25 px-1.5",
          compact ? "h-6" : "h-12 px-2.5",
        )}
        role="img"
        aria-label={label ? `${label}: visual fingerprint of ${vector.length} dimensions` : `Vector fingerprint of ${vector.length} dimensions`}
      >
        {samples.map((v, i) => {
          const norm = Math.min(1, Math.abs(v) / maxAbs);
          const barHeightPct = Math.max(18, Math.round(norm * 90));
          const positive = v >= 0;
          const color = positive ? accent : C.violet;
          return (
            <motion.span
              key={i}
              title={`d${i * Math.floor(vector.length / samples.length)}: ${v.toFixed(3)}`}
              className="flex-1 rounded-full"
              style={{
                backgroundColor: color,
                opacity: 0.35 + norm * 0.65,
                height: `${barHeightPct}%`,
              }}
              initial={reduced || compact ? undefined : { scaleY: 0.2, opacity: 0.2 }}
              animate={reduced || compact ? undefined : { scaleY: 1, opacity: 0.35 + norm * 0.65 }}
              transition={reduced || compact ? undefined : { duration: 0.35, delay: i * 0.01 }}
            />
          );
        })}
      </div>
      {!compact && (
        <div className="flex items-center justify-between text-[11px] text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: accent }} />
            positive values
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: C.violet }} />
            negative values
          </span>
        </div>
      )}
    </div>
  );
}

export function ChunkWindowDiagram({ chunks }: { chunks: RagIndexedChunk[] }) {
  const reduced = useReducedMotion();
  const [docIndex, setDocIndex] = React.useState(0);
  const doc = RAG_DOCUMENTS[docIndex] ?? RAG_DOCUMENTS[0];
  const docChunks = chunks.filter((c) => c.documentId === doc.id);

  // Track which sentences appear in >1 chunk (overlap).
  const counts = new Map<string, number>();
  for (const chunk of docChunks) {
    for (const sid of chunk.sentenceIds) counts.set(sid, (counts.get(sid) ?? 0) + 1);
  }

  return (
    <div className="space-y-3 rounded-xl border border-white/10 bg-black/20 p-3.5 sm:p-4" data-rag-chunk-diagram="">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Sliding window preview</h4>
          <p className="text-xs text-muted-foreground">Each row is one chunk; highlighted cells repeat across adjacent chunks.</p>
        </div>
        <div className="flex flex-wrap gap-1">
          {RAG_DOCUMENTS.map((d, idx) => (
            <button
              key={d.id}
              type="button"
              onClick={() => setDocIndex(idx)}
              className={cn(
                "min-h-8 rounded-lg border px-2.5 py-1 text-xs transition-colors",
                idx === docIndex ? "border-primary/60 bg-primary/15 font-medium text-foreground" : "border-white/10 text-muted-foreground hover:bg-white/5",
              )}
            >
              {d.title.split(" ")[0]}
            </button>
          ))}
        </div>
      </div>

      {/* Sentence ribbon */}
      <div className="space-y-2">
        <div className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${doc.sentences.length}, minmax(0, 1fr))` }}>
          {doc.sentences.map((s, i) => {
            const shared = (counts.get(s.id) ?? 0) > 1;
            return (
              <div
                key={s.id}
                title={s.text}
                className={cn(
                  "rounded-md border px-1.5 py-1 text-center font-mono text-[11px]",
                  shared ? "border-primary/50 bg-primary/15 font-semibold text-primary" : "border-white/10 bg-white/5 text-muted-foreground",
                )}
              >
                S{i + 1}
                {shared && <span className="ml-0.5 text-[9px]">↺</span>}
              </div>
            );
          })}
        </div>

        {/* Chunk brackets */}
        <div className="space-y-1.5">
          {docChunks.map((chunk, ci) => {
            const startIdx = doc.sentences.findIndex((s) => s.id === chunk.sentenceIds[0]);
            const span = chunk.sentenceIds.length;
            const leftPct = (startIdx / doc.sentences.length) * 100;
            const widthPct = (span / doc.sentences.length) * 100;
            return (
              <div key={chunk.id} className="relative h-6 rounded-md bg-white/[0.03]">
                <motion.div
                  className="absolute inset-y-0.5 flex items-center justify-center rounded border text-[11px] font-medium text-foreground"
                  style={{
                    left: `${leftPct}%`,
                    width: `${widthPct}%`,
                    borderColor: sourceColor(doc.id),
                    backgroundColor: `color-mix(in srgb, ${sourceColor(doc.id)} 18%, transparent)`,
                  }}
                  initial={reduced ? undefined : { opacity: 0, scaleX: 0.85 }}
                  animate={reduced ? undefined : { opacity: 1, scaleX: 1 }}
                  transition={reduced ? undefined : { duration: 0.28, delay: ci * 0.06 }}
                >
                  Chunk {ci + 1} ({span})
                </motion.div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function SimilarityRadarPlot({ run, showSelection }: { run: RagRun; showSelection: boolean }) {
  const reduced = useReducedMotion();
  const [hoveredId, setHoveredId] = React.useState<string | null>(null);

  const W = 420;
  const H = 260;
  const cx = 145;
  const cy = 130;
  const minR = 26;
  const maxR = 104;

  // Map score in [-0.2, 1] -> radius [maxR, minR] so higher score = closer to center.
  const scoreToRadius = (score: number) => {
    const clamped = Math.max(-0.2, Math.min(1, score));
    const norm = (1 - clamped) / 1.2;
    return minR + norm * (maxR - minR);
  };

  const cutoffR = run.settings.minSimilarity !== null ? scoreToRadius(run.settings.minSimilarity) : null;

  // Distribute chunks evenly around the circle, grouped slightly by rank so labels don't pile up.
  const nodes = run.ranked.map((row, idx) => {
    const angle = (idx / Math.max(1, run.ranked.length)) * Math.PI * 2 - Math.PI / 2;
    const r = scoreToRadius(row.score);
    const x = cx + Math.cos(angle) * r;
    const y = cy + Math.sin(angle) * r;
    return { row, idx, x, y, r };
  });

  const activeNode = nodes.find((n) => n.row.chunk.id === hoveredId) ?? nodes[0];

  return (
    <div className="grid items-center gap-4 rounded-xl border border-white/10 bg-black/20 p-3.5 sm:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] sm:p-4" data-rag-radar="">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="block h-auto w-full select-none"
        role="img"
        aria-label="Radial similarity space: the query is at the center and closer chunks have higher cosine similarity"
      >
        {/* Reference rings */}
        {[0.8, 0.5, 0.2].map((tick) => (
          <g key={tick}>
            <circle cx={cx} cy={cy} r={scoreToRadius(tick)} fill="none" stroke={C.grid} strokeDasharray="3 3" opacity={0.55} />
            <text x={cx + 3} y={cy - scoreToRadius(tick) + 10} fontSize={8.5} fill={C.muted}>
              {tick.toFixed(1)}
            </text>
          </g>
        ))}

        {/* Cutoff ring when enabled */}
        {cutoffR !== null && (
          <g>
            <circle cx={cx} cy={cy} r={cutoffR} fill="none" stroke={C.amber} strokeWidth={1.3} strokeDasharray="5 3" />
            <text x={cx + cutoffR * 0.72} y={cy - cutoffR * 0.72} fontSize={8.5} fill={C.amber}>
              cutoff {run.settings.minSimilarity?.toFixed(2)}
            </text>
          </g>
        )}

        {/* Beams from query center to each chunk */}
        {nodes.map(({ row, x, y, idx }) => {
          const active = showSelection ? row.selected : idx < 2;
          return (
            <motion.line
              key={`beam-${row.chunk.id}`}
              x1={cx}
              y1={cy}
              x2={x}
              y2={y}
              stroke={active ? sourceColor(row.chunk.documentId) : C.grid}
              strokeWidth={active ? 1.6 : 0.8}
              strokeOpacity={active ? 0.75 : 0.35}
              initial={reduced ? undefined : { pathLength: 0, opacity: 0 }}
              animate={reduced ? undefined : { pathLength: 1, opacity: active ? 0.75 : 0.35 }}
              transition={reduced ? undefined : { duration: 0.35, delay: idx * 0.02 }}
            />
          );
        })}

        {/* Chunk dots */}
        {nodes.map(({ row, x, y, idx }) => {
          const color = sourceColor(row.chunk.documentId);
          const isSelected = showSelection ? row.selected : idx === 0;
          const isHovered = activeNode?.row.chunk.id === row.chunk.id;
          return (
            <g
              key={row.chunk.id}
              className="cursor-pointer"
              onMouseEnter={() => setHoveredId(row.chunk.id)}
              onClick={() => setHoveredId(row.chunk.id)}
            >
              {isSelected && (
                <circle cx={x} cy={y} r={10} fill="none" stroke={color} strokeWidth={1.2} opacity={0.65} />
              )}
              <motion.circle
                cx={x}
                cy={y}
                r={isHovered ? 7 : isSelected ? 6 : 4.5}
                fill={color}
                fillOpacity={showSelection && !row.selected ? 0.35 : 0.9}
                stroke={isHovered ? C.fg : "none"}
                strokeWidth={1.5}
                initial={reduced ? undefined : { scale: 0.3, opacity: 0 }}
                animate={reduced ? undefined : { scale: 1, opacity: 1 }}
                transition={reduced ? undefined : { duration: 0.25, delay: idx * 0.025 }}
              />
              {idx < 3 && (
                <text x={x + 9} y={y + 3} fontSize={9} fontWeight={600} fill={C.fg}>
                  #{idx + 1}
                </text>
              )}
            </g>
          );
        })}

        {/* Query center node */}
        {!reduced && (
          <motion.circle
            cx={cx}
            cy={cy}
            r={13}
            fill="none"
            stroke={C.sky}
            strokeWidth={1.2}
            animate={{ r: [11, 22], opacity: [0.6, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
          />
        )}
        <circle cx={cx} cy={cy} r={11} fill={C.card} stroke={C.sky} strokeWidth={2} />
        <text x={cx} y={cy + 3.5} textAnchor="middle" fontSize={8.5} fontWeight={700} fill={C.sky}>
          Q
        </text>

        {/* Legend on right side of SVG */}
        <g transform="translate(274, 24)">
          <text x={0} y={0} fontSize={9.5} fontWeight={600} fill={C.fg}>
            Sources
          </text>
          {RAG_DOCUMENTS.map((doc, i) => (
            <g key={doc.id} transform={`translate(0, ${16 + i * 18})`}>
              <circle cx={5} cy={0} r={4} fill={SOURCE_COLORS[i]} />
              <text x={14} y={3.5} fontSize={8.5} fill={C.muted}>
                {doc.title.split(" ").slice(0, 2).join(" ")}
              </text>
            </g>
          ))}
          <text x={0} y={108} fontSize={8.5} fill={C.muted}>
            Closer to Q = higher
          </text>
          <text x={0} y={120} fontSize={8.5} fill={C.muted}>
            cosine similarity
          </text>
        </g>
      </svg>

      {/* Active chunk readout */}
      {activeNode && (
        <div className="space-y-2 rounded-xl border border-white/10 bg-background/60 p-3 text-xs">
          <div className="flex items-center justify-between gap-2">
            <span className="font-semibold text-foreground">
              Rank #{activeNode.idx + 1} · {activeNode.row.chunk.source}
            </span>
            <span className="rounded-md bg-primary/15 px-2 py-0.5 font-mono font-semibold text-primary">
              {activeNode.row.score.toFixed(3)}
            </span>
          </div>
          <p className="break-all font-mono text-[10px] text-muted-foreground">{activeNode.row.chunk.id}</p>
          <p className="line-clamp-4 leading-relaxed text-muted-foreground">{activeNode.row.chunk.text}</p>
          {showSelection && (
            <p className={cn("font-medium", activeNode.row.selected ? "text-primary" : "text-muted-foreground")}>
              {activeNode.row.reason === "selected"
                ? "✓ Selected for prompt"
                : activeNode.row.reason === "below-cutoff"
                  ? "Filtered out: below similarity cutoff"
                  : "Filtered out: outside top-k"}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
