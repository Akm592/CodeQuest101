import { describe, expect, it } from "vitest";
import { lessonSettings, readLessonView, scoreLabel } from "./courseState";

describe("chapter studio URL and lesson settings", () => {
  it("accepts shareable views and recovers safely from unknown values", () => {
    expect(readLessonView("?view=watch&lesson=parent")).toBe("watch");
    expect(readLessonView("?view=try")).toBe("try");
    expect(readLessonView("?view=unknown")).toBe("understand");
    expect(readLessonView("")).toBe("understand");
  });
  it("starts each specialized lesson with its actual technique enabled", () => {
    expect(lessonSettings("rerank", "paraphrase")).toEqual({ queryId: "paraphrase", rerank: true });
    expect(lessonSettings("graph", "multi-hop")).toEqual({ queryId: "multi-hop", retrieval: "graph" });
    expect(lessonSettings("parent", "multi-part")).toEqual({ queryId: "multi-part", expandParents: true });
    expect(lessonSettings("fusion", "exact-id")).toEqual({ queryId: "exact-id" });
  });
  it("keeps incompatible score units visible", () => {
    expect(scoreLabel("graph", 0.5)).toBe("cosine 0.500");
    expect(scoreLabel("dense", 0.5)).toBe("cosine 0.500");
    expect(scoreLabel("rerank", -2.5)).toBe("logit -2.500");
    expect(scoreLabel("hybrid", 0.0322)).toBe("RRF 0.0322");
    expect(scoreLabel("sparse", 3.2)).toBe("BM25 3.200");
  });
});
