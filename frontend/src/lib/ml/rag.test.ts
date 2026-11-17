import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { RAG_DATA } from "./ragData";
import {
  RAG_DEFAULT, RAG_DOCUMENTS, RAG_EMBEDDING_INFO, RAG_EMBEDDING_TRACE, RAG_QUERIES,
  buildRagPrompt, buildRagSteps, chunkDocuments, cosineSimilarity, getRagIndex,
  rankChunks, retrieveRag, simulateRagAnswer, type RagIndexedChunk,
} from "./rag";

const query = (id: string) => RAG_QUERIES.find((q) => q.id === id)!;
const tinyChunk = (id: string, embedding: number[]): RagIndexedChunk => ({ id, documentId: "test", source: "Test", sentenceIds: [id], text: id, embedding });

describe("RAG recorded data", () => {
  it("matches its source corpus and pinned artifact provenance", () => {
    const raw = readFileSync(new URL("../../../scripts/fixtures/rag-corpus.json", import.meta.url), "utf8");
    const corpus = JSON.parse(raw);
    expect(RAG_DOCUMENTS).toEqual(corpus.documents);
    expect(RAG_QUERIES).toEqual(corpus.queries);
    expect(createHash("sha256").update(raw).digest("hex")).toBe(RAG_EMBEDDING_INFO.corpusSha256);
    expect(RAG_EMBEDDING_INFO.revision).toBe(`onnx-sha256:${RAG_EMBEDDING_INFO.artifactSha256["model.onnx"]}`);
    expect(RAG_EMBEDDING_INFO.dimensions).toBe(384);
    const sentences = RAG_DOCUMENTS.flatMap((d) => d.sentences.map((s) => s.id));
    expect(new Set(sentences).size).toBe(sentences.length);
    for (const q of RAG_QUERIES) for (const claim of q.claims) for (const id of claim.evidenceIds) expect(sentences).toContain(id);
  });

  it("covers all six chunk configurations with real unit vectors", () => {
    expect(RAG_DATA.configurations).toHaveLength(6);
    for (const size of [2, 3, 4]) for (const overlap of [0, 1]) {
      const config = RAG_DATA.configurations.find((c) => c.chunkSize === size && c.overlap === overlap)!;
      expect(config.chunks.map((chunk) => ({ id: chunk.id, documentId: chunk.documentId, source: chunk.source, sentenceIds: chunk.sentenceIds, text: chunk.text }))).toEqual(chunkDocuments(RAG_DOCUMENTS, size, overlap));
      for (const chunk of config.chunks) {
        expect(chunk.embedding).toHaveLength(384);
        expect(chunk.embedding.every(Number.isFinite)).toBe(true);
        expect(Math.hypot(...chunk.embedding)).toBeCloseTo(1, 6);
      }
    }
    for (const q of RAG_QUERIES) {
      const vector = RAG_DATA.queryEmbeddings[q.id];
      expect(vector).toHaveLength(384);
      expect(vector.every(Number.isFinite)).toBe(true);
      expect(Math.hypot(...vector)).toBeCloseTo(1, 6);
    }
  });

  it("records truthful token pooling and normalization arithmetic", () => {
    const trace = RAG_EMBEDDING_TRACE;
    expect(trace.tokens[0].token).toBe("[CLS]");
    expect(trace.tokens.at(-1)!.token).toBe("[SEP]");
    expect(trace.embedding).toHaveLength(384);
    expect(Math.hypot(...trace.embedding)).toBeCloseTo(1, 6);
    const count = trace.tokens.reduce((sum, t) => sum + t.mask, 0);
    trace.componentIndices.forEach((_, i) => {
      const mean = trace.tokens.reduce((sum, t) => sum + t.mask * t.components[i], 0) / count;
      expect(trace.pooledComponents[i]).toBeCloseTo(mean, 6);
      expect(trace.normalizedComponents[i]).toBeCloseTo(mean / trace.pooledNorm, 6);
      expect(trace.embedding[i]).toBe(trace.normalizedComponents[i]);
    });
  });
});

describe("RAG chunking and cosine", () => {
  it("preserves sentence boundaries and overlaps only within a document", () => {
    const chunks = chunkDocuments(RAG_DOCUMENTS.slice(0, 1), 2, 1);
    expect(chunks).toHaveLength(5);
    expect(chunks[0].sentenceIds).toEqual(["returns-1", "returns-2"]);
    expect(chunks[1].sentenceIds).toEqual(["returns-2", "returns-3"]);
    expect(chunks.at(-1)!.sentenceIds).toEqual(["returns-5", "returns-6"]);
    expect(chunkDocuments([], 2, 1)).toEqual([]);
    expect(() => chunkDocuments(RAG_DOCUMENTS, 1, 1)).toThrow(RangeError);
    expect(() => getRagIndex({ chunkSize: 2, overlap: 2 as 1 })).toThrow(RangeError);
  });

  it("matches independently known angles and ignores magnitude", () => {
    expect(cosineSimilarity([1, 0], [2, 0])).toBe(1);
    expect(cosineSimilarity([1, 0], [0, 4])).toBe(0);
    expect(cosineSimilarity([1, 0], [-2, 0])).toBe(-1);
    expect(cosineSimilarity([1, 0], [1, 1])).toBeCloseTo(Math.SQRT1_2, 12);
  });

  it.each([[[], []], [[0, 0], [1, 0]], [[1], [1, 2]], [[NaN], [1]], [[Infinity], [1]]])("rejects invalid vectors %j and %j", (a, b) => {
    expect(() => cosineSimilarity(a, b)).toThrow(RangeError);
  });
});

describe("RAG retrieval and evidence", () => {
  it("breaks ties by original order and filters before limiting results", () => {
    const chunks = [tinyChunk("a", [1, 0]), tinyChunk("b", [1, 0]), tinyChunk("c", [0, 1])];
    expect(rankChunks(chunks, [1, 0], 1, null).selected.map((r) => r.chunk.id)).toEqual(["a"]);
    const filtered = rankChunks(chunks, [1, 0], 4, 1);
    expect(filtered.selected.map((r) => r.chunk.id)).toEqual(["a", "b"]);
    expect(filtered.ranked[2].reason).toBe("below-cutoff");
    expect(rankChunks(chunks, [1, 0], 4, null).selected).toHaveLength(3);
    expect(rankChunks([], [1, 0], 2, null).selected).toEqual([]);
    expect(() => rankChunks([], [1, 0], 0, null)).toThrow(RangeError);
    expect(() => rankChunks([], [1, 0], 2, NaN)).toThrow(RangeError);
    expect(() => rankChunks([], [0, 0], 2, null)).toThrow(RangeError);
  });

  it("uses every dimension rather than the displayed preview", () => {
    const a = Array(384).fill(0); a[383] = 1;
    const b = [...a]; b[383] = -1;
    expect(rankChunks([tinyChunk("wrong", b), tinyChunk("right", a)], a, 1, null).selected[0].chunk.id).toBe("right");
  });

  it("retrieves real evidence for direct and paraphrased questions", () => {
    for (const id of ["direct", "paraphrase"]) {
      const run = retrieveRag(query(id), RAG_DEFAULT);
      expect(run.answer.status, id).toBe("supported");
      expect(run.selected.some((r) => r.chunk.sentenceIds.includes("returns-1"))).toBe(true);
    }
  });

  it("demonstrates overlap preserving a rule across a real chunk boundary", () => {
    const settings = { ...RAG_DEFAULT, chunkSize: 3 as const, topK: 1 };
    const withoutOverlap = retrieveRag(query("boundary"), { ...settings, overlap: 0 });
    const withOverlap = retrieveRag(query("boundary"), { ...settings, overlap: 1 });
    expect(withoutOverlap.answer.status).toBe("insufficient");
    expect(withOverlap.answer.status).toBe("supported");
    expect(withOverlap.selected[0].chunk.sentenceIds).toContain("returns-3");
    expect(withOverlap.selected[0].chunk.sentenceIds).toContain("returns-4");
  });

  it("shows partial evidence before retrieving both required documents", () => {
    const partial = retrieveRag(query("two-documents"), RAG_DEFAULT);
    const complete = retrieveRag(query("two-documents"), { ...RAG_DEFAULT, chunkSize: 3, topK: 3 });
    expect(partial.answer.status).toBe("partial");
    expect(complete.answer.status).toBe("supported");
    expect(new Set(complete.selected.map((r) => r.chunk.documentId))).toEqual(new Set(["returns", "refunds"]));
  });

  it("never treats a related passage as proof of a missing answer", () => {
    for (const id of ["related", "missing"]) {
      const run = retrieveRag(query(id), RAG_DEFAULT);
      expect(run.selected).toHaveLength(2);
      expect(run.answer.status).toBe("insufficient");
      expect(run.answer.claims).toEqual([]);
    }
  });

  it("assembles the exact selected context and cites only supporting chunks", () => {
    for (const q of RAG_QUERIES) {
      const run = retrieveRag(q, RAG_DEFAULT);
      expect(run.prompt).toContain(q.text);
      for (const { chunk } of run.selected) expect(run.prompt).toContain(chunk.text);
      for (const claim of run.answer.claims) {
        const cited = run.selected.filter((r) => claim.citations.includes(r.chunk.id));
        expect(cited.length).toBe(claim.citations.length);
        for (const id of claim.evidenceIds) expect(cited.some((r) => r.chunk.sentenceIds.includes(id))).toBe(true);
      }
      expect(simulateRagAnswer(q, [])).toMatchObject({ status: "insufficient", claims: [] });
    }
    expect(buildRagPrompt("Question?", [])).toContain("No passages passed retrieval");
  });

  it("returns insufficient evidence when every match fails the cutoff", () => {
    const run = retrieveRag(query("direct"), { ...RAG_DEFAULT, minSimilarity: 1 });
    expect(run.selected).toEqual([]);
    expect(run.answer.status).toBe("insufficient");
    expect(run.ranked.every((r) => r.reason === "below-cutoff")).toBe(true);
    expect(() => retrieveRag({ ...query("direct"), text: "An unrecorded question" }, RAG_DEFAULT)).toThrow(RangeError);
  });

  it("has complete narration and terminal answer steps for every question", () => {
    for (const q of RAG_QUERIES) {
      const steps = buildRagSteps(q, RAG_DEFAULT);
      expect(steps.map((s) => s.phase)).toEqual(["docs", "chunk", "embed", "index", "query", "score", "retrieve", "prompt", "answer"]);
      expect(steps.every((s) => s.explanation.length > 0)).toBe(true);
      expect(steps.at(-1)!.done).toBe(true);
    }
  });
});
