import { describe, expect, it } from "vitest";

import { ADV_DOCUMENTS, ADV_GRAPH, ADV_HNSW, ADV_QUERIES, getAdvancedIndex, getRerankScore } from "./data";
import {
  ADV_DEFAULT, answerFromEvidence, buildAdvancedPrompt, cleanAdvancedText, countWords, evaluateEvidence,
  expandParentContext, lexicalTokens, packContext, rankBm25, rankDense, reciprocalRankFusion, rerankCandidates,
  runAdvancedExperiment, searchHnswTeaching, traverseKnowledgeGraph, type RankedPassage,
} from "./engine";
import type { AdvancedChunk, AdvancedQuery } from "./types";

const tiny = (id: string, text = id): AdvancedChunk => ({ id, text, documentId: id, source: id, sentenceIds: [], embedding: [1, 0], strategy: "fixed", heading: "", parentId: id, parentText: text, parentSentenceIds: [] });
const row = (chunk: AdvancedChunk, rank = 1, score = 1): RankedPassage => ({ chunk, rank, score, method: "dense" });
const query = (id: string) => ADV_QUERIES.find((item) => item.id === id)!;
const structure = getAdvancedIndex("structure");
const sourceRow = (id: string) => row(structure.find((chunk) => chunk.sentenceIds.includes(id))!);

describe("advanced preprocessing and sparse retrieval", () => {
  it("removes navigation and repeated furniture while preserving headings, identifiers, tables and negation", () => {
    const cleaned = cleanAdvancedText(ADV_DOCUMENTS[0].rawText);
    expect(cleaned).not.toContain("Home | Account");
    expect(cleaned).not.toContain("Page 1 of 2");
    expect(cleaned).not.toContain("Internal handbook");
    expect(cleaned).toContain("## Eligibility");
    expect(cleaned).toContain("has not been used");
    expect(cleanAdvancedText(ADV_DOCUMENTS[1].rawText)).toContain("X200");
    expect(cleanAdvancedText(ADV_DOCUMENTS[3].rawText)).toContain("| 50 dollars or less | 5 dollars |");
    expect(cleanAdvancedText("Cafe\u0301\t X-200\nDo not remove this.")).toBe("Café X-200\nDo not remove this.");
  });

  it("keeps exact identifiers and negation as lexical terms", () => {
    expect(lexicalTokens("X200 X-200 is NOT covered")).toEqual(["x200", "x-200", "is", "not", "covered"]);
  });

  it("matches a hand-calculated BM25 score and term contribution", () => {
    const ranked = rankBm25("cat", [tiny("a", "cat cat"), tiny("b", "cat dog dog dog"), tiny("c", "bird")]);
    expect(ranked.map((item) => item.chunk.id)).toEqual(["a", "b", "c"]);
    expect(ranked[0].score).toBeCloseTo(0.6733075246869145, 12);
    expect(ranked[0].terms![0]).toMatchObject({ term: "cat", frequency: 2, documentFrequency: 2 });
    expect(ranked[0].terms![0].idf).toBeCloseTo(Math.log(1.6), 12);
    expect(ranked[0].terms![0].contribution).toBe(ranked[0].score);
    expect(ranked[2].score).toBe(0);
  });

  it("keeps deterministic ties and handles empty or unmatched questions", () => {
    const chunks = [tiny("a", "same text"), tiny("b", "same text")];
    expect(rankBm25("same", chunks).map((item) => item.chunk.id)).toEqual(["a", "b"]);
    expect(rankBm25("", chunks)).toEqual([]);
    expect(rankBm25("anything", [])).toEqual([]);
    expect(rankBm25("unfindable", chunks).every((item) => item.score === 0)).toBe(true);
    expect(rankDense("", [])).toEqual([]);
    expect(() => rankDense("unrecorded question", chunks)).toThrow(RangeError);
  });
});

describe("rank fusion and reranking", () => {
  it("fuses positions rather than raw scores", () => {
    const a = tiny("a"); const b = tiny("b"); const c = tiny("c");
    const fused = reciprocalRankFusion([
      { name: "dense", results: [row(a, 1, 0.8), row(b, 2, 0.7)] },
      { name: "sparse", results: [row(b, 1, 9000), row(c, 2, 40)] },
    ]);
    expect(fused.map((item) => item.chunk.id)).toEqual(["b", "a", "c"]);
    expect(fused[0].score).toBeCloseTo(1 / 61 + 1 / 62, 12);
    expect(fused[0].contributions).toEqual([{ list: "dense", rank: 2, value: 1 / 62 }, { list: "sparse", rank: 1, value: 1 / 61 }]);
    const changedScores = reciprocalRankFusion([
      { name: "dense", results: [row(a, 1, -100), row(b, 2, -200)] },
      { name: "sparse", results: [row(b, 1, 0.01), row(c, 2, 0.001)] },
    ]);
    expect(changedScores.map((item) => item.score)).toEqual(fused.map((item) => item.score));
  });

  it("deduplicates within a list, preserves ties, and gives no contribution to absent documents", () => {
    const a = tiny("a"); const b = tiny("b");
    const fused = reciprocalRankFusion([{ name: "one", results: [row(a), row(a), row(b)] }]);
    expect(fused).toHaveLength(2);
    expect(fused[0].score).toBe(1 / 61);
    expect(fused[1].score).toBe(1 / 62);
    expect(reciprocalRankFusion([{ name: "one", results: [row(a)] }, { name: "two", results: [row(b)] }]).map((item) => item.chunk.id)).toEqual(["a", "b"]);
    expect(reciprocalRankFusion([])).toEqual([]);
    expect(() => reciprocalRankFusion([], 0)).toThrow(RangeError);
  });

  it("orders only the supplied candidates using genuine recorded model logits", () => {
    const candidates = structure.slice(0, 6).map((chunk, i) => row(chunk, i + 1));
    const before = JSON.stringify(candidates);
    const reranked = rerankCandidates(query("exact-id").text, candidates);
    expect(new Set(reranked.map((item) => item.chunk.id))).toEqual(new Set(candidates.map((item) => item.chunk.id)));
    for (let i = 0; i < reranked.length; i++) {
      expect(reranked[i].score).toBe(getRerankScore(query("exact-id").text, reranked[i].chunk.id));
      if (i) expect(reranked[i - 1].score).toBeGreaterThanOrEqual(reranked[i].score);
    }
    expect(JSON.stringify(candidates)).toBe(before);
    expect(rerankCandidates(query("exact-id").text, [])).toEqual([]);
  });
});

describe("context and evidence", () => {
  it("expands selected children to their source parent and deduplicates that parent", () => {
    const rows = [sourceRow("D1-s1"), sourceRow("D1-s2")];
    const expanded = expandParentContext(rows);
    expect(expanded).toHaveLength(1);
    expect(expanded[0].sentenceIds).toEqual(["D1-s1", "D1-s2"]);
    expect(expanded[0].fromChunkIds).toEqual(rows.map((item) => item.chunk.id));
    expect(expanded[0].text).toContain("not been used");
  });

  it("deduplicates overlap and counts actual context words without clipping a sentence", () => {
    const rows = [sourceRow("D5-s2"), sourceRow("D5-s2"), sourceRow("D5-s1")];
    const budget = countWords(rows[0].chunk.text);
    const packed = packContext(rows, budget);
    expect(packed.passages).toHaveLength(1);
    expect(packed.passages[0].text).toContain("not covered");
    expect(packed.usedWords).toBe(budget);
    expect(packed.dropped.map((item) => item.reason)).toEqual(["duplicate", "budget"]);
    expect(packContext([rows[0]], budget - 1).passages).toHaveLength(0);
    expect(packContext(rows, budget - 1).passages.map((passage) => passage.sentenceIds)).toEqual([["D5-s1"]]);
    expect(packContext(rows, 0).passages).toEqual([]);
    expect(() => packContext(rows, -1)).toThrow(RangeError);
    expect(() => packContext(rows, NaN)).toThrow(RangeError);
  });

  it("distinguishes complete, partial and absent evidence and cites only supplied context", () => {
    const q = query("multi-part");
    const partial = packContext([sourceRow("D1-s1")], 160);
    const full = packContext([sourceRow("D1-s1"), sourceRow("D3-s1"), sourceRow("D3-s2")], 160);
    expect(answerFromEvidence(q, partial.passages).status).toBe("partial");
    const answer = answerFromEvidence(q, full.passages);
    expect(answer.status).toBe("supported");
    for (const claim of answer.claims) {
      const citedIds = new Set(full.passages.filter((passage) => claim.citations.includes(passage.id)).flatMap((passage) => passage.sentenceIds));
      expect(claim.evidenceIds.every((id) => citedIds.has(id))).toBe(true);
    }
    expect(answerFromEvidence(q, []).status).toBe("insufficient");
    expect(answerFromEvidence(query("missing"), full.passages)).toMatchObject({ status: "insufficient", claims: [] });
    const prompt = buildAdvancedPrompt(q.text, partial.passages);
    expect(prompt).toContain(q.text);
    expect(prompt).toContain(partial.passages[0].text);
    expect(prompt).not.toContain(sourceRow("D3-s1").chunk.text);
  });

  it("evaluates retrieval and packed context separately, with no-gold recall left undefined", () => {
    const q: AdvancedQuery = { ...query("multi-part"), claims: [{ text: "test", evidenceIds: ["D1-s1", "D3-s1"] }] };
    const retrieved = [sourceRow("D1-s1"), sourceRow("D3-s1")];
    const context = packContext(retrieved, countWords(retrieved[0].chunk.text));
    expect(evaluateEvidence(q, retrieved, context)).toMatchObject({ recallAtK: 1, evidenceCoverage: 0.5, recallUnit: "required source sentences" });
    expect(evaluateEvidence(query("missing"), retrieved, context)).toMatchObject({ recallAtK: null, evidenceCoverage: null });
  });
});

describe("knowledge graphs and vector index traversal", () => {
  it("follows source-backed relationships for two hops without inferring new facts", () => {
    const one = traverseKnowledgeGraph(["x200"], 1);
    const two = traverseKnowledgeGraph(["x200"], 2);
    expect(one.entityIds).toContain("nova");
    expect(one.relationIds).not.toContain("nova-policy");
    expect(two.relationIds).toContain("nova-policy");
    expect(two.evidenceIds).toContain("D6-s1");
    expect(two.paths.find((path) => path.entityId === "nova-replacement")).toEqual({ entityId: "nova-replacement", hop: 2, relationIds: ["x200-nova", "nova-policy"] });
    const known = new Set(ADV_GRAPH.relations.flatMap((relation) => relation.evidenceIds));
    expect(two.evidenceIds.every((id) => known.has(id))).toBe(true);
    expect(traverseKnowledgeGraph([], 2).entityIds).toEqual([]);
    expect(() => traverseKnowledgeGraph(["unknown"], 1)).toThrow(RangeError);
    const original = runAdvancedExperiment({ queryId: "multi-hop", retrieval: "graph" });
    const rewritten = runAdvancedExperiment({ queryId: "multi-hop", retrieval: "graph", queryStrategy: "rewrite" });
    expect(rewritten.candidates).toEqual(original.candidates);
    const evidence = new Set(original.graph.evidenceIds);
    expect(original.candidates.every((item) => item.chunk.sentenceIds.some((id) => evidence.has(id)))).toBe(true);
  });

  it("compares approximate neighbor search with an independent exact baseline", () => {
    const narrow = searchHnswTeaching(3);
    const wider = searchHnswTeaching(6);
    const expected = [...ADV_HNSW.nodes].sort((a, b) => Math.hypot(a.vector[0] - 0.2, a.vector[1] - 0.1) - Math.hypot(b.vector[0] - 0.2, b.vector[1] - 0.1)).slice(0, 3).map((node) => node.id);
    expect(narrow.exact.map((item) => item.id)).toEqual(expected);
    expect(wider.results.map((item) => item.id)).toEqual(expected);
    expect(wider.recall).toBe(1);
    expect(narrow.recall).toBeLessThan(wider.recall);
    expect(narrow.comparisonCount).toBe(narrow.visitedIds.length);
    expect(narrow.comparisonCount).toBeLessThanOrEqual(narrow.exactComparisonCount);
    expect(narrow.trace.some((step) => step.kind === "descend" && step.layer > 0)).toBe(true);
    expect(() => searchHnswTeaching(0)).toThrow(RangeError);
    expect(() => searchHnswTeaching(3, [NaN, 0])).toThrow(RangeError);
  });
});

describe("complete advanced retrieval runs", () => {
  it("supports the default exact-identifier question with genuine retrieval", () => {
    const run = runAdvancedExperiment();
    expect(run.answer.status).toBe("supported");
    expect(run.metrics.recallAtK).toBe(1);
    expect(run.metrics.evidenceCoverage).toBe(1);
  });

  it("shows evidence lost during context packing when the word budget is reduced", () => {
    const full = runAdvancedExperiment({ wordBudget: 160 });
    const constrained = runAdvancedExperiment({ wordBudget: 20 });
    expect(constrained.selected).toEqual(full.selected);
    expect(constrained.metrics.recallAtK).toBe(full.metrics.recallAtK);
    expect(constrained.context.usedWords).toBeLessThanOrEqual(20);
    expect(constrained.context.dropped.some((passage) => passage.reason === "budget")).toBe(true);
    expect(constrained.metrics.evidenceCoverage).toBeLessThan(full.metrics.evidenceCoverage!);
    expect(constrained.answer.status).not.toBe("supported");
  });

  it("removes archived documents before BM25 statistics and candidate retrieval", () => {
    const run = runAdvancedExperiment({ queryId: "stale" });
    expect(run.excludedDocumentIds).toContain("D9");
    expect(run.index.every((chunk) => chunk.documentId !== "D9")).toBe(true);
    for (const name of ["dense", "sparse", "fused", "candidates", "reranked", "selected"] as const) expect(run[name].every((item) => item.chunk.documentId !== "D9")).toBe(true);
    expect(run.sparse).toEqual(rankBm25(run.query.text, run.index));
  });

  it("does not promote zero-overlap lexical rows into retrieved results", () => {
    const run = runAdvancedExperiment({ queryId: "missing", retrieval: "sparse" });
    expect(run.candidates.every((item) => item.score > 0)).toBe(true);
    expect(run.sparse.some((item) => item.score === 0)).toBe(true);
    const positive = new Set(run.sparse.filter((item) => item.score > 0).slice(0, run.settings.poolSize).map((item) => item.chunk.id));
    for (const item of run.fused) for (const contribution of item.contributions ?? []) {
      if (contribution.list === "Sparse") expect(positive.has(item.chunk.id)).toBe(true);
    }
  });

  it("reranks only the bounded candidate pool and reports model pair counts honestly", () => {
    const off = runAdvancedExperiment({ poolSize: 3 });
    const on = runAdvancedExperiment({ poolSize: 3, rerank: true });
    expect(off.metrics.modelPairCount).toBe(0);
    expect(on.metrics.modelPairCount).toBe(on.candidates.length);
    expect(on.candidates.length).toBeLessThanOrEqual(3);
    expect(new Set(on.reranked.map((item) => item.chunk.id))).toEqual(new Set(off.candidates.map((item) => item.chunk.id)));
    expect(on.selected).toHaveLength(Math.min(3, on.candidates.length));
  });

  it("keeps authored query variants distinct from retrieved evidence", () => {
    for (const strategy of ["original", "rewrite", "multi", "hyde"] as const) {
      const run = runAdvancedExperiment({ queryStrategy: strategy, rerank: true });
      const expected = strategy === "original" ? [run.query.text] : strategy === "rewrite" ? [run.query.rewritten] : strategy === "multi" ? run.query.subqueries : [run.query.hyde];
      expect(run.queryTexts).toEqual(expected);
      expect(run.prompt.endsWith(`Question: ${run.query.text}`)).toBe(true);
      expect(run.context.passages.every((passage) => !passage.text.includes(run.query.hyde))).toBe(true);
    }
  });

  it("has finite, source-traceable results for all curated cases and supported chunk strategies", () => {
    for (const question of ADV_QUERIES) for (const chunkStrategy of ["fixed", "structure", "semantic"] as const) {
      const run = runAdvancedExperiment({ queryId: question.id, chunkStrategy, rerank: true });
      expect(run.context.usedWords).toBeLessThanOrEqual(run.settings.wordBudget);
      expect(run.dense.every((item) => Number.isFinite(item.score))).toBe(true);
      expect(run.reranked.every((item) => Number.isFinite(item.score))).toBe(true);
      const sources = new Set(run.context.passages.map((passage) => passage.id));
      for (const claim of run.answer.claims) expect(claim.citations.every((id) => sources.has(id))).toBe(true);
      if (question.id === "missing") expect(run.answer.status).toBe("insufficient");
    }
  });

  it("rejects unsupported settings instead of silently guessing model outputs", () => {
    expect(() => runAdvancedExperiment({ queryId: "unrecorded" })).toThrow(RangeError);
    expect(() => runAdvancedExperiment({ poolSize: 0 as 3 })).toThrow(RangeError);
    expect(() => runAdvancedExperiment({ wordBudget: 0 as 80 })).toThrow(RangeError);
    expect(() => runAdvancedExperiment({ chunkStrategy: "arbitrary" as "fixed" })).toThrow(RangeError);
    expect(ADV_DEFAULT.queryId).toBe("exact-id");
  });
});
