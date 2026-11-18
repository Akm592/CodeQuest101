import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { ADVANCED_CHAPTERS, getChapter, getLesson, LESSON_VIEWS } from "./curriculum";

const expectedChapters = ["prepare-text", "dense-sparse", "hybrid-search", "reranking", "query-strategies", "graphrag", "context-evaluation", "pipeline-lab"];
const queryIds = ["exact-id", "paraphrase", "multi-part", "multi-hop", "noisy", "stale", "negation", "missing"];
const wordCount = (value: string) => value.trim().split(/\s+/).length;

describe("Advanced RAG curriculum", () => {
  it("defines the complete eight-chapter path with unique public metadata", () => {
    expect(ADVANCED_CHAPTERS.map((chapter) => chapter.slug)).toEqual(expectedChapters);
    for (const field of ["title", "headline", "summary"] as const) {
      expect(new Set(ADVANCED_CHAPTERS.map((chapter) => chapter[field])).size).toBe(8);
    }
    expect(ADVANCED_CHAPTERS.flatMap((chapter) => chapter.lessons)).toHaveLength(12);
    for (const chapter of ADVANCED_CHAPTERS) {
      expect(chapter.id).toBe(chapter.slug);
      expect(chapter.lessons.length).toBeGreaterThan(0);
      expect(new Set(chapter.lessons.map((lesson) => lesson.id)).size).toBe(chapter.lessons.length);
      expect(wordCount(chapter.summary)).toBeLessThan(40);
    }
  });

  it("keeps the separate graph concepts in their intended lessons", () => {
    expect(getChapter("dense-sparse")!.lessons.map((lesson) => lesson.id)).toEqual(["representations", "hnsw"]);
    expect(getChapter("graphrag")!.lessons.map((lesson) => lesson.id)).toEqual(["graph"]);
    expect(getChapter("prepare-text")!.lessons.map((lesson) => lesson.id)).toEqual(["clean", "chunk", "parent"]);
    expect(getChapter("context-evaluation")!.lessons.map((lesson) => lesson.id)).toEqual(["packing", "evaluate"]);
  });

  it("has four bounded learning views and complete short content for every lesson", () => {
    expect(LESSON_VIEWS).toEqual(["understand", "watch", "try", "check"]);
    for (const chapter of ADVANCED_CHAPTERS) for (const lesson of chapter.lessons) {
      expect(queryIds).toContain(lesson.defaultQueryId);
      expect(lesson.title.trim()).not.toBe("");
      expect(lesson.idea.length).toBeGreaterThan(0);
      expect(wordCount(lesson.idea.join(" ")), lesson.id).toBeLessThanOrEqual(150);
      expect(lesson.watchNarrationStages).toHaveLength(4);
      expect(lesson.watchNarrationStages.every((text) => text.trim() && wordCount(text) <= 40)).toBe(true);
      expect(lesson.tryInstructions.length).toBeGreaterThan(0);
      expect(wordCount(lesson.tryInstructions.join(" "))).toBeLessThanOrEqual(150);
      for (const value of Object.values(lesson.inspector)) {
        expect(value.trim()).not.toBe("");
        expect(wordCount(value)).toBeLessThanOrEqual(100);
      }
      expect(lesson.sources.length).toBeGreaterThan(0);
      for (const source of lesson.sources) {
        expect(source.title.trim()).not.toBe("");
        expect(new URL(source.url).protocol).toBe("https:");
      }
    }
  });

  it("provides valid self-check choices and explanatory feedback", () => {
    for (const chapter of ADVANCED_CHAPTERS) for (const lesson of chapter.lessons) {
      const check = lesson.check;
      expect(check.prompt.trim()).not.toBe("");
      expect(check.options.length).toBeGreaterThanOrEqual(2);
      expect(new Set(check.options).size).toBe(check.options.length);
      expect(Number.isInteger(check.correctIndex)).toBe(true);
      expect(check.correctIndex).toBeGreaterThanOrEqual(0);
      expect(check.correctIndex).toBeLessThan(check.options.length);
      expect(check.options.every((option) => option.trim())).toBe(true);
      expect(wordCount(check.explanation)).toBeGreaterThan(10);
      expect(wordCount(check.explanation)).toBeLessThanOrEqual(100);
    }
  });

  it("resolves routes and falls back to the first lesson without inventing a chapter", () => {
    for (const chapter of ADVANCED_CHAPTERS) {
      expect(getChapter(chapter.slug)).toBe(chapter);
      expect(getLesson(chapter)).toBe(chapter.lessons[0]);
      expect(getLesson(chapter, "unknown")).toBe(chapter.lessons[0]);
      for (const lesson of chapter.lessons) expect(getLesson(chapter, lesson.id)).toBe(lesson);
    }
    expect(getChapter("unknown")).toBeUndefined();
  });

  it("keeps catalog and navigation metadata independent of experiment model data", () => {
    const source = readFileSync(new URL("./curriculum.ts", import.meta.url), "utf8");
    expect(source).not.toMatch(/^\s*import\s/m);
    expect(source).not.toContain("generatedData");
  });
});
