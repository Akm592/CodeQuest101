import { LESSON_VIEWS, type LessonView } from "../../../lib/advancedRag/curriculum";
import type { AdvancedSettings } from "../../../lib/advancedRag/engine";

export const COURSE_ROOT = "/visualize/advancedRag";

export function readLessonView(search: string): LessonView {
  const value = new URLSearchParams(search).get("view");
  return LESSON_VIEWS.find((view) => view === value) ?? "understand";
}

export function lessonSettings(lessonId: string, queryId: string): Partial<AdvancedSettings> {
  return {
    queryId,
    ...(lessonId === "rerank" ? { rerank: true } : {}),
    ...(lessonId === "graph" ? { retrieval: "graph" as const } : {}),
    ...(lessonId === "parent" ? { expandParents: true } : {}),
  };
}

export function scoreLabel(method: string, score: number): string {
  return `${method === "rerank" ? "logit" : method === "dense" || method === "graph" ? "cosine" : method === "sparse" ? "BM25" : "RRF"} ${score.toFixed(method === "hybrid" ? 4 : 3)}`;
}
