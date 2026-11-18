import { describe, expect, it } from "vitest";
import { buildLessonDiagram } from "../../components/ml/advancedRag/LessonDiagram";
import { lessonSettings } from "../../components/ml/advancedRag/courseState";
import { ADVANCED_CHAPTERS } from "./curriculum";
import { runAdvancedExperiment, searchHnswTeaching, type AdvancedRun } from "./engine";

const hnsw = searchHnswTeaching();
const diagram = (lessonId: string, run: AdvancedRun, trying = false) => buildLessonDiagram({
  lessonId, run, step: lessonId === "hnsw" ? hnsw.trace.length - 1 : 3,
  selectedId: "", onSelect: () => {}, hnsw, trying,
});

describe("advanced RAG diagram data", () => {
  for (const chapter of ADVANCED_CHAPTERS) for (const lesson of chapter.lessons) {
    it(`provides finite geometry and connected identities for ${lesson.id}`, () => {
      const run = runAdvancedExperiment(lessonSettings(lesson.id, lesson.defaultQueryId));
      const { nodes, edges } = diagram(lesson.id, run);
      const ids = new Set(nodes.map((node) => node.id));
      expect(nodes.length).toBeGreaterThan(1);
      expect(ids.size).toBe(nodes.length);
      expect(new Set(edges.map((edge) => edge.id)).size).toBe(edges.length);
      for (const node of nodes) {
        expect([node.position.x, node.position.y, node.width, node.height, node.initialWidth, node.initialHeight].every(Number.isFinite)).toBe(true);
        expect(node.width).toBeGreaterThan(0);
        expect(node.height).toBeGreaterThan(0);
        expect(node.handles?.length).toBeGreaterThan(0);
        expect(node.handles?.every((handle) => Number.isFinite(handle.x) && Number.isFinite(handle.y))).toBe(true);
      }
      for (const edge of edges) {
        expect(ids.has(edge.source)).toBe(true);
        expect(ids.has(edge.target)).toBe(true);
      }
    });
  }

  it("shows actual dense, positive sparse, and fused passage ranks", () => {
    const run = runAdvancedExperiment();
    const { nodes } = diagram("fusion", run);
    const ids = (nodeId: string) => nodes.find((node) => node.id === nodeId)?.data.rows?.map((row) => row.id);
    expect(ids("dense")).toEqual(run.dense.slice(0, 3).map((row) => row.chunk.id));
    expect(ids("sparse")).toEqual(run.sparse.filter((row) => row.score > 0).slice(0, 3).map((row) => row.chunk.id));
    expect(ids("fusion")).toEqual(run.fused.slice(0, 3).map((row) => row.chunk.id));
  });

  it("updates the comparison output when the chosen retrieval method changes", () => {
    for (const retrieval of ["dense", "sparse", "hybrid"] as const) {
      const run = runAdvancedExperiment({ retrieval });
      const { nodes } = diagram("fusion", run, true);
      expect(nodes.find((node) => node.id === "fusion")?.data.rows?.map((row) => row.id)).toEqual(run.selected.map((row) => row.chunk.id));
    }
  });

  it("draws reranking from the same candidate pool and preserves its real order", () => {
    for (const rerank of [false, true]) {
      const run = runAdvancedExperiment({ rerank, poolSize: 6 });
      const { nodes } = diagram("rerank", run);
      const input = nodes.find((node) => node.id === "candidates")?.data.rows?.map((row) => row.id);
      const output = nodes.find((node) => node.id === "reranked")?.data.rows?.map((row) => row.id);
      expect(input).toEqual(run.candidates.map((row) => row.chunk.id));
      expect(output).toEqual((rerank ? run.reranked : run.candidates).slice(0, 3).map((row) => row.chunk.id));
      expect(output?.every((id) => input?.includes(id))).toBe(true);
    }
  });
});
