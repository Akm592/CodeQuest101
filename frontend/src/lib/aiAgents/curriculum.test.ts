import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { AGENT_CHAPTERS, AGENT_LESSON_VIEWS, getAgentChapter, getAgentLesson } from "./curriculum";

const expectedLessons = {
  "agent-basics": ["comparison"],
  "tool-calling": ["contract"],
  "agent-loop": ["loop"],
  "state-memory": ["context", "memory"],
  reliability: ["validation", "retries", "idempotency"],
  "agentic-rag": ["retrieval"],
  "builder-lab": ["builder"],
};
const scenarioIds = ["eligible-return", "missing-order", "used-item", "expired-return", "stock-check", "unknown-order", "missing-policy", "tool-timeout", "invalid-arguments", "lost-response", "follow-up", "memory-preference"];
const taskPresets = ["eligibility", "return-draft", "stock", "policy"];
const words = (text: string) => text.trim().split(/\s+/u).length;

describe("AI Agents curriculum", () => {
  it("defines the approved seven chapters and ten focused lessons", () => {
    expect(AGENT_CHAPTERS.map((chapter) => chapter.slug)).toEqual(Object.keys(expectedLessons));
    expect(AGENT_CHAPTERS.flatMap((chapter) => chapter.lessons)).toHaveLength(10);
    for (const field of ["title", "headline", "summary"] as const) expect(new Set(AGENT_CHAPTERS.map((chapter) => chapter[field])).size).toBe(7);
    for (const chapter of AGENT_CHAPTERS) {
      expect(chapter.id).toBe(chapter.slug);
      expect(chapter.lessons.map((lesson) => lesson.id)).toEqual(expectedLessons[chapter.id]);
      expect(words(chapter.summary)).toBeLessThan(40);
    }
  });

  it("provides bounded content for all four views with valid scenario and task defaults", () => {
    expect(AGENT_LESSON_VIEWS).toEqual(["understand", "watch", "try", "check"]);
    for (const chapter of AGENT_CHAPTERS) for (const lesson of chapter.lessons) {
      expect(scenarioIds).toContain(lesson.defaultScenarioId);
      expect(taskPresets).toContain(lesson.defaultTaskPreset);
      expect(lesson.title.trim()).not.toBe("");
      expect(lesson.idea.length).toBeGreaterThan(0);
      expect(words(lesson.idea.join(" ")), lesson.id).toBeLessThanOrEqual(150);
      expect(lesson.watchNarrationStages).toHaveLength(4);
      expect(lesson.watchNarrationStages.every((text) => text.trim() && words(text) <= 40)).toBe(true);
      expect(lesson.tryInstructions.length).toBeGreaterThan(0);
      expect(words(lesson.tryInstructions.join(" "))).toBeLessThanOrEqual(150);
      for (const value of Object.values(lesson.inspector)) {
        expect(value.trim()).not.toBe("");
        expect(words(value)).toBeLessThanOrEqual(100);
      }
      expect(lesson.sources.length).toBeGreaterThan(0);
      for (const source of lesson.sources) {
        expect(source.title.trim()).not.toBe("");
        expect(new URL(source.url).protocol).toBe("https:");
      }
    }
  });

  it("teaches simulation and application boundaries without suggesting live model execution", () => {
    const comparison = getAgentChapter("agent-basics")!.lessons[0];
    expect(comparison.idea.join(" ")).toContain("authored simulation");
    expect(comparison.inspector.math).toContain("application chooses the path");
    expect(getAgentChapter("tool-calling")!.lessons[0].idea.join(" ")).toContain("Application code must validate");
    const memory = getAgentLesson(getAgentChapter("state-memory")!, "memory");
    expect(memory.idea.join(" ")).toContain("simulated memory store");
    expect(memory.inspector.math).toContain("retrieve → context");
    const context = getAgentLesson(getAgentChapter("state-memory")!, "context");
    expect(context.inspector.pitfall).toContain("outside the supplied context");
  });

  it("distinguishes retry identity, source evidence, and actual outcome checks", () => {
    const reliability = getAgentChapter("reliability")!;
    expect(getAgentLesson(reliability, "retries").inspector.math).toContain("rejected or retried request");
    expect(getAgentLesson(reliability, "idempotency").inspector.math).toContain("different inputs → conflict");
    expect(getAgentChapter("agentic-rag")!.lessons[0].inspector.math).toContain("evaluator inputs");
    const builder = getAgentChapter("builder-lab")!.lessons[0];
    expect(builder.idea.join(" ")).toContain("does not dictate the order");
    expect(builder.check.options[builder.check.correctIndex]).toContain("sample draft store");
  });

  it("has valid self-check choices and explanatory feedback for every lesson", () => {
    for (const chapter of AGENT_CHAPTERS) for (const { check } of chapter.lessons) {
      expect(check.prompt.trim()).not.toBe("");
      expect(check.options.length).toBeGreaterThanOrEqual(2);
      expect(new Set(check.options).size).toBe(check.options.length);
      expect(check.options.every((option) => option.trim())).toBe(true);
      expect(Number.isInteger(check.correctIndex)).toBe(true);
      expect(check.correctIndex).toBeGreaterThanOrEqual(0);
      expect(check.correctIndex).toBeLessThan(check.options.length);
      expect(words(check.explanation)).toBeGreaterThan(10);
      expect(words(check.explanation)).toBeLessThanOrEqual(100);
    }
  });

  it("resolves known routes and keeps a bounded fallback for an unknown lesson", () => {
    for (const chapter of AGENT_CHAPTERS) {
      expect(getAgentChapter(chapter.slug)).toBe(chapter);
      expect(getAgentLesson(chapter)).toBe(chapter.lessons[0]);
      expect(getAgentLesson(chapter, "unknown")).toBe(chapter.lessons[0]);
      for (const lesson of chapter.lessons) expect(getAgentLesson(chapter, lesson.id)).toBe(lesson);
    }
    expect(getAgentChapter("unknown")).toBeUndefined();
  });

  it("keeps navigation metadata independent of execution code and model data", () => {
    const source = readFileSync(new URL("./curriculum.ts", import.meta.url), "utf8");
    expect(source).not.toMatch(/^\s*import\s/m);
    expect(source).not.toContain("generatedData");
    expect(source).not.toContain("runAgentSimulation");
  });
});
