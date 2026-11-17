import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { RAG_DEFAULT, RAG_EMBEDDING_TRACE, RAG_QUERIES, retrieveRag, type RagStep } from "../../../lib/ml/rag";
import RagVisualizer from "../RagVisualizer";
import { ragFigures } from "../figures/ragFigures";
import { ConceptFigures } from "../shared";
import RagDetails from "./RagDetails";
import { RagStageView } from "./RagStageView";
import RagArchitecture from "./RagArchitecture";

const run = retrieveRag(RAG_QUERIES[0], RAG_DEFAULT);

describe("RAG architecture", () => {
  const diagram = (phase: RagStep["phase"], value = run) => renderToStaticMarkup(createElement(RagArchitecture, { phase, run: value, running: false, delayMs: 1500, onSeek: () => {} }));

  it("connects the stored index and question vector to search", () => {
    const html = diagram("score");
    expect(html.match(/data-flow-node="/g)).toHaveLength(9);
    for (const edge of ["index-search", "question-search"]) {
      expect(html).toContain(`data-flow-edge="${edge}" data-flow-state="active"`);
    }
    expect(html).toContain(`Best cosine: ${run.ranked[0].score.toFixed(3)}`);
    expect(html).not.toContain("supported claim");
  });

  it("shows the original question as a separate input to the encoder", () => {
    const html = diagram("query");
    expect(html).toContain('data-flow-input="question"');
    expect(html).toContain(run.query.text);
    expect(html).toContain('data-flow-edge="question-encoder" data-flow-state="active"');
    expect(html).toContain('data-flow-edge="question-search" data-flow-state="waiting"');
    expect(html).toContain('data-flow-edge="question-prompt" data-flow-state="waiting"');
  });

  it("brings the original question and retrieved text into the prompt", () => {
    const html = diagram("prompt");
    for (const edge of ["passages-prompt", "question-prompt"]) {
      expect(html).toContain(`data-flow-edge="${edge}" data-flow-state="active"`);
    }
    expect(html).toContain(`Question + ${run.selected.length} source passages`);
    expect(html).toContain('data-flow-edge="prompt-answer" data-flow-state="waiting"');
  });

  it("keeps unavailable results out of earlier stages", () => {
    const html = diagram("docs");
    expect(html).toContain("4 handbook documents");
    expect(html).not.toContain("Best cosine:");
    expect(html).not.toContain("supported claim");
    expect(html).toContain('data-flow-edge="index-search" data-flow-state="waiting"');
  });

  it("uses the actual retrieval outcome rather than promising a successful answer", () => {
    const missing = retrieveRag(RAG_QUERIES[0], { ...RAG_DEFAULT, minSimilarity: 1 });
    const html = diagram("answer", missing);
    expect(html).toContain("0 of 20 passages kept");
    expect(html).toContain("Insufficient evidence · do not guess");
    expect(html).not.toContain("supported claim");
  });
});

describe("RAG lesson rendering", () => {
  it("starts at the documents without exposing future retrieval, context, or answers", () => {
    const html = renderToStaticMarkup(createElement(RagVisualizer));
    expect(html).toContain('data-rag-phase="docs"');
    expect(html).toContain('data-rag-documents=""');
    for (const marker of ["data-rag-ranking", "data-rag-sources", "data-rag-prompt", "data-rag-answer"]) expect(html).not.toContain(marker);
    expect(html).toContain("Simulated answer generation");
    expect(html).toContain("See full result");
    for (const id of ["rag-question", "rag-size", "rag-overlap", "rag-topk", "rag-cutoff"]) {
      expect(html).toContain(`for="${id}"`);
      expect(html).toContain(`id="${id}"`);
    }
    expect(html).toContain('aria-live="polite"');
    expect(html.match(/aria-label="Go to step /g)).toHaveLength(9);
  });

  it.each<[RagStep["phase"], string, string[]]>([
    ["docs", "data-rag-documents", ["data-rag-ranking", "data-rag-sources", "data-rag-prompt", "data-rag-answer"]],
    ["chunk", "data-rag-chunks", ["data-rag-embedding", "data-rag-ranking", "data-rag-prompt", "data-rag-answer"]],
    ["embed", "data-rag-embedding", ["data-rag-query", "data-rag-ranking", "data-rag-prompt", "data-rag-answer"]],
    ["index", "data-rag-index", ["data-rag-query", "data-rag-ranking", "data-rag-prompt", "data-rag-answer"]],
    ["query", "data-rag-query", ["data-rag-ranking", "data-rag-sources", "data-rag-prompt", "data-rag-answer"]],
    ["score", "data-rag-ranking", ["data-rag-sources", "data-rag-prompt", "data-rag-answer"]],
    ["retrieve", "data-rag-sources", ["data-rag-prompt", "data-rag-answer"]],
    ["prompt", "data-rag-prompt", ["data-rag-answer"]],
    ["answer", "data-rag-answer", []],
  ])("shows the %s phase without revealing later output", (phase, marker, absent) => {
    const html = renderToStaticMarkup(createElement(RagStageView, { phase, run }));
    expect(html).toContain(marker);
    for (const attribute of absent) expect(html).not.toContain(attribute);
  });

  it("links every simulated citation to a retrieved source and highlights its evidence", () => {
    const html = renderToStaticMarkup(createElement(RagStageView, { phase: "answer", run }));
    const targets = [...html.matchAll(/href="#(rag-source-[^"]+)"/g)].map((match) => match[1]);
    expect(targets.length).toBeGreaterThan(0);
    for (const target of targets) expect(html).toContain(`id="${target}"`);
    for (const { chunk } of run.selected) expect(html).toContain(chunk.id);
    expect(html).toContain("<mark");
    expect(html).toContain("no language model is running");
  });

  it("keeps a missing answer explicit even when passages are retrieved", () => {
    const missing = retrieveRag(RAG_QUERIES.find((query) => query.id === "missing")!, RAG_DEFAULT);
    expect(missing.selected.length).toBeGreaterThan(0);
    const html = renderToStaticMarkup(createElement(RagStageView, { phase: "answer", run: missing }));
    expect(html).toContain('data-rag-answer="insufficient"');
    expect(html).toContain("I do not have enough evidence");
    expect(html).not.toMatch(/href="#rag-source-/);
  });

  it("illustrates all three jobs with accessible SVGs and distinct markers", () => {
    const html = renderToStaticMarkup(createElement(ConceptFigures, { figures: ragFigures }));
    expect(html.match(/role="img"/g)).toHaveLength(3);
    const ids = [...html.matchAll(/<marker id="([^"]+)"/g)].map((match) => match[1]);
    expect(new Set(ids).size).toBe(ids.length);
    expect(html).toContain("Prepare a small library");
    expect(html).toContain("Find useful passages");
    expect(html).toContain("Answer with the book open");
  });

  it("shows recorded token and normalization values separately from teaching geometry", () => {
    const html = renderToStaticMarkup(createElement(RagDetails));
    expect(html).toContain(RAG_EMBEDDING_TRACE.tokens[0].token);
    expect(html).toContain(RAG_EMBEDDING_TRACE.tokens[0].id.toString());
    expect(html).toContain(RAG_EMBEDDING_TRACE.pooledNorm.toFixed(4));
    expect(html).toContain("first 4 of 384 final contextual components");
    expect(html).toContain("Teaching geometry only");
    expect(html).toContain("not “60% certain”");
    expect(html).toContain("Filter documents by the user’s permissions before search and ranking");
    expect(html).toContain('id="rag-cosine-angle"');
    expect(html).toContain("Perpendicular (0.0)");
  });

  it("renders intuitive visual diagrams for chunking, embedding fingerprints, and similarity radar", () => {
    const chunkHtml = renderToStaticMarkup(createElement(RagStageView, { phase: "chunk", run }));
    expect(chunkHtml).toContain('data-rag-chunk-diagram=""');

    const embedHtml = renderToStaticMarkup(createElement(RagStageView, { phase: "embed", run }));
    expect(embedHtml).toContain("384-D vector fingerprint");

    const scoreHtml = renderToStaticMarkup(createElement(RagStageView, { phase: "score", run }));
    expect(scoreHtml).toContain('data-rag-radar=""');
    expect(scoreHtml).toContain("Radial similarity space");

    const fullPageHtml = renderToStaticMarkup(createElement(RagVisualizer));
    expect(fullPageHtml).toContain('data-rag-experiments=""');
    expect(fullPageHtml).toContain("Keep a rule together");
  });
});
